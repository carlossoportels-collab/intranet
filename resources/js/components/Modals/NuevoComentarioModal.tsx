import { useForm,router } from '@inertiajs/react';
import { X, MessageSquare, Bell, Calendar, Save, XCircle, AlertCircle, Lock, FileText, CalendarDays, ThumbsDown } from 'lucide-react';
import React, { useEffect, useState } from 'react';


interface TipoComentario {
    id: number;
    nombre: string;
    descripcion: string;
    aplica_a: string;
    crea_recordatorio: boolean;
    dias_recordatorio_default: number;
    es_activo: boolean;
}

interface EstadoLead {
    id: number;
    nombre: string;
    tipo: string;
    color_hex?: string;
}

interface Lead {
    id: number;
    nombre_completo: string;
    email?: string; // Hacer opcional
    telefono?: string; // Hacer opcional
    estado_lead_id?: number;
    es_cliente?: boolean; 
}

interface MotivoPerdida {
    id: number;
    nombre: string;
    descripcion: string;
    es_activo: number;
}

interface NuevoComentarioModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
    tiposComentario: TipoComentario[];
    estadosLead?: EstadoLead[];
    comentariosExistentes?: number;
    onSuccess?: () => void;
}

export default function NuevoComentarioModal({ 
    isOpen, 
    onClose, 
    lead, 
    tiposComentario, 
    estadosLead = [],
    comentariosExistentes = 0,
    onSuccess 
}: NuevoComentarioModalProps) {
    const [motivosPerdida, setMotivosPerdida] = useState<MotivoPerdida[]>([]);
    const [loadingMotivos, setLoadingMotivos] = useState(false);
    const [fechaInputRef, setFechaInputRef] = useState<HTMLInputElement | null>(null);

    const getTipoPredeterminado = () => {
        if (comentariosExistentes === 0) {
            const contactoInicial = tiposComentario.find(t => t.nombre === 'Contacto inicial');
            return contactoInicial?.id || '';
        }
        return '';
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        // Datos generales del comentario
        comentario: '',
        tipo_comentario_id: getTipoPredeterminado() as string | number,
        crea_recordatorio: true,
        dias_recordatorio: 0,
        cambiar_estado_lead: true,
        
        // Datos específicos para rechazo
        motivo_perdida_id: '',
        notas_adicionales: '',
        posibilidades_futuras: 'no',
        fecha_posible_recontacto: '',
    });

    // Definir variables derivadas ANTES de los useEffect
    const tiposComentarioFiltrados = tiposComentario.filter(tipo => 
        tipo.es_activo && (tipo.aplica_a === 'lead' || tipo.aplica_a === 'ambos')
    );

    const tipoSeleccionado = tiposComentario.find(
        t => t.id.toString() === data.tipo_comentario_id.toString()
    );

    const tiposConRecordatorioObligatorio = [
        'Contacto inicial', 
        'Seguimiento lead', 
        'Negociación',
        'Propuesta enviada',
        'Pausa temporal'
    ];
    const esRecordatorioObligatorio = tipoSeleccionado && 
        tiposConRecordatorioObligatorio.includes(tipoSeleccionado.nombre);
    const esRechazo = tipoSeleccionado && tipoSeleccionado.nombre === 'Rechazo lead';
    const esPausaTemporal = tipoSeleccionado && tipoSeleccionado.nombre === 'Pausa temporal';
    const puedeDesactivarRecordatorio = !esRecordatorioObligatorio && !esRechazo;

    // Cargar motivos de pérdida cuando se abre el modal y es necesario
    useEffect(() => {
        if (isOpen && lead && esRechazo) {
            cargarMotivosPerdida();
        }
    }, [isOpen, lead, esRechazo]);

    const cargarMotivosPerdida = () => {
        if (motivosPerdida.length > 0) return; // Ya cargados
        
        setLoadingMotivos(true);
        
        fetch('/comercial/motivos-perdida-activos')
            .then(response => {
                if (!response.ok) throw new Error('Error cargando motivos');
                return response.json();
            })
            .then(data => {
                if (Array.isArray(data)) {
                    setMotivosPerdida(data);
                }
            })
            .catch(error => {
                console.error('Error cargando motivos de pérdida:', error);
                const motivosEjemplo = [
                    { id: 1, nombre: 'Precio muy elevado', descripcion: 'El cliente consideró que el precio no se ajustaba a su presupuesto', es_activo: 1 },
                    { id: 2, nombre: 'No necesita el producto/servicio', descripcion: 'El cliente determinó que no tiene necesidad actual', es_activo: 1 },
                    { id: 3, nombre: 'Decidió por la competencia', descripcion: 'El cliente eligió una propuesta de la competencia', es_activo: 1 },
                    { id: 4, nombre: 'Otro', descripcion: 'Otro motivo no especificado', es_activo: 1 },
                ];
                setMotivosPerdida(motivosEjemplo);
            })
            .finally(() => {
                setLoadingMotivos(false);
            });
    };

    useEffect(() => {
        if (data.tipo_comentario_id) {
            const tipo = tiposComentario.find(
                t => t.id.toString() === data.tipo_comentario_id.toString()
            );
            
            if (tipo) {
                // Si es Pausa temporal, forzar recordatorio a 90 días
                if (tipo.nombre === 'Pausa temporal') {
                    setData({
                        ...data,
                        crea_recordatorio: true,
                        dias_recordatorio: 90
                    });
                }
                // Si es rechazo, desactivar recordatorio
                else if (tipo.nombre === 'Rechazo lead') {
                    setData({
                        ...data,
                        crea_recordatorio: false,
                        dias_recordatorio: 0
                    });
                }
                // Para otros tipos, usar configuración por defecto
                else {
                    let nuevosDias = 7;
                    if (comentariosExistentes === 0 && tipo.nombre === 'Contacto inicial') {
                        nuevosDias = 7;
                    } else if (tipo.dias_recordatorio_default > 0) {
                        nuevosDias = tipo.dias_recordatorio_default;
                    }
                    
                    setData({
                        ...data,
                        dias_recordatorio: nuevosDias,
                        crea_recordatorio: tipo.crea_recordatorio
                    });
                }
            }
        }
    }, [data.tipo_comentario_id, comentariosExistentes]);

    // Efecto para actualizar el comentario cuando cambia el motivo o las notas (solo en rechazo)
    useEffect(() => {
        if (esRechazo && data.motivo_perdida_id) {
            const motivo = motivosPerdida.find(m => m.id.toString() === data.motivo_perdida_id.toString());
            
            let comentarioConstruido = `Motivo de pérdida: ${motivo?.nombre || 'No especificado'}`;
            
            if (data.notas_adicionales.trim()) {
                comentarioConstruido += `\n\nNotas adicionales: ${data.notas_adicionales.trim()}`;
            }
            
            if (data.posibilidades_futuras !== 'no' && data.fecha_posible_recontacto) {
                const fecha = new Date(data.fecha_posible_recontacto).toLocaleDateString('es-ES');
                comentarioConstruido += `\n\nPosible recontacto: ${fecha}`;
            }
            
            setData('comentario', comentarioConstruido);
        }
    }, [esRechazo, data.motivo_perdida_id, data.notas_adicionales, data.posibilidades_futuras, data.fecha_posible_recontacto]);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!lead) return;
        
        const tipoSeleccionado = tiposComentario.find(
            t => t.id.toString() === data.tipo_comentario_id.toString()
        );
        
        if (!tipoSeleccionado) {
            alert('Por favor seleccione un tipo de comentario');
            return;
        }
        
        const esRechazo = tipoSeleccionado.nombre === 'Rechazo lead';
        
        // Validaciones
        if (esRechazo) {
            if (!data.motivo_perdida_id) {
                alert('Para rechazar un lead, por favor seleccione un motivo de pérdida');
                return;
            }
            
            // Si no hay comentario (por alguna razón), crear uno básico
            if (!data.comentario.trim()) {
                const motivo = motivosPerdida.find(m => m.id.toString() === data.motivo_perdida_id.toString());
                setData('comentario', `Lead rechazado - Motivo: ${motivo?.nombre || 'No especificado'}`);
                
                // Pequeño delay para asegurar que setData se complete
                setTimeout(() => {
                    enviarFormulario(true);
                }, 100);
                return;
            }
            
            enviarFormulario(true);
        } else {
            if (!data.comentario.trim()) {
                alert('Por favor escriba un comentario');
                return;
            }
            enviarFormulario(false);
        }
    };

    const enviarFormulario = (esRechazo: boolean) => {
        if (!lead) {
            alert('Error: No se encontró el lead');
            return;
        }

        const formData = {
            comentario: data.comentario,
            tipo_comentario_id: data.tipo_comentario_id,
            crea_recordatorio: esRechazo ? false : data.crea_recordatorio,
            dias_recordatorio: esRechazo ? 0 : data.dias_recordatorio,
            cambiar_estado_lead: true,
            
            ...(esRechazo && {
                motivo_perdida_id: data.motivo_perdida_id,
                notas_adicionales: data.notas_adicionales,
                posibilidades_futuras: data.posibilidades_futuras,
                fecha_posible_recontacto: data.fecha_posible_recontacto || null,
            })
        };
        
        router.post(`/comercial/leads/${lead.id}/comentarios`, formData, {
            onSuccess: () => {
                reset();
                if (onSuccess) onSuccess();
                onClose();
            },
            onError: (errors) => {
                console.error('Error al guardar comentario:', errors);
                alert('Error al guardar: ' + JSON.stringify(errors));
            },
            preserveScroll: true
        });
    };

    const handleClose = () => {
        reset();
        setMotivosPerdida([]);
        onClose();
    };

    const openDatePicker = () => {
        if (fechaInputRef) {
            fechaInputRef.showPicker();
        }
    };

    const formatDateForInput = (dateString: string) => {
        if (!dateString) return '';
        try {
            const date = new Date(dateString);
            return date.toISOString().split('T')[0];
        } catch {
            return dateString;
        }
    };

    if (!isOpen || !lead) return null;

    return (
        <>
            <div 
                className="fixed inset-0 bg-black/60 z-[99990]"
                onClick={handleClose}
            />
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[99999] pointer-events-none">
                <div 
                    className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fadeIn pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${esRechazo ? 'bg-red-100' : 'bg-blue-100'}`}>
                                {esRechazo ? (
                                    <ThumbsDown className="h-6 w-6 text-red-600" />
                                ) : (
                                    <MessageSquare className="h-6 w-6 text-blue-600" />
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {esRechazo ? 'Rechazar Lead' : 'Nuevo Comentario'}
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    {lead.nombre_completo} • ID: {lead.id}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={handleClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            type="button"
                            disabled={processing}
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                        <div className="space-y-6">
                            <div className="space-y-2">
                                <label htmlFor="tipo_comentario_id" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                    <MessageSquare className="h-4 w-4" />
                                    Tipo de Comentario *
                                </label>
                                <select
                                    id="tipo_comentario_id"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    value={data.tipo_comentario_id}
                                    onChange={e => {
                                        const nuevoTipoId = e.target.value;
                                        setData('tipo_comentario_id', nuevoTipoId);
                                        
                                        const tipo = tiposComentario.find(
                                            t => t.id.toString() === nuevoTipoId.toString()
                                        );
                                        if (tipo) {
                                            if (tipo.nombre === 'Rechazo lead') {
                                                setData({
                                                    ...data,
                                                    crea_recordatorio: false,
                                                    dias_recordatorio: 0,
                                                    tipo_comentario_id: nuevoTipoId,
                                                    comentario: ''
                                                });
                                                setMotivosPerdida([]);
                                                cargarMotivosPerdida();
                                            } else if (tipo.nombre === 'Pausa temporal') {
                                                setData({
                                                    ...data,
                                                    crea_recordatorio: true,
                                                    dias_recordatorio: 90,
                                                    tipo_comentario_id: nuevoTipoId
                                                });
                                            } else {
                                                const nuevosDias = tipo.dias_recordatorio_default > 0 ? tipo.dias_recordatorio_default : 7;
                                                setData({
                                                    ...data,
                                                    dias_recordatorio: nuevosDias,
                                                    crea_recordatorio: tipo.crea_recordatorio,
                                                    tipo_comentario_id: nuevoTipoId
                                                });
                                            }
                                        }
                                    }}
                                    required
                                    disabled={processing}
                                >
                                    <option value="">Seleccionar tipo</option>
                                    {tiposComentarioFiltrados.map(tipo => (
                                        <option key={tipo.id} value={tipo.id}>
                                            {tipo.nombre}
                                        </option>
                                    ))}
                                </select>
                                {errors.tipo_comentario_id && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <XCircle className="h-3 w-3" />
                                        {errors.tipo_comentario_id}
                                    </p>
                                )}
                            </div>

                            {/* Campo de comentario */}
                            <div className="space-y-2">
                                <label htmlFor="comentario" className="block text-sm font-medium text-gray-700">
                                    Comentario {!esRechazo && '*'}
                                </label>
                                <textarea
                                    id="comentario"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    rows={4}
                                    value={data.comentario}
                                    onChange={e => setData('comentario', e.target.value)}
                                    placeholder={esRechazo ? "Comentario generado automáticamente" : "Escriba su comentario aquí..."}
                                    required={!esRechazo}
                                    disabled={processing || esRechazo}
                                    readOnly={esRechazo}
                                />
                                {esRechazo && (
                                    <div className="mt-1">
                                        <p className="text-sm text-gray-600">
                                            El comentario se genera automáticamente al seleccionar un motivo.
                                        </p>
                                    </div>
                                )}
                                {errors.comentario && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <XCircle className="h-3 w-3" />
                                        {errors.comentario}
                                    </p>
                                )}
                            </div>

                            {/* SECCIÓN ESPECÍFICA PARA RECHAZO */}
                            {esRechazo && (
                                <div className="space-y-6 border-t pt-6 border-gray-200">
                                    <div className="space-y-2">
                                        <label htmlFor="motivo_perdida_id" className="block text-sm font-medium text-gray-700">
                                            Motivo de la pérdida *
                                        </label>
                                        {loadingMotivos ? (
                                            <div className="flex items-center gap-2">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600"></div>
                                                <span className="text-sm text-gray-600">Cargando motivos...</span>
                                            </div>
                                        ) : (
                                            <select
                                                id="motivo_perdida_id"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                                                value={data.motivo_perdida_id}
                                                onChange={e => setData('motivo_perdida_id', e.target.value)}
                                                required
                                                disabled={processing || loadingMotivos}
                                            >
                                                <option value="">Seleccionar motivo</option>
                                                {motivosPerdida.map(motivo => (
                                                    <option key={motivo.id} value={motivo.id.toString()}>
                                                        {motivo.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                        )}
                                        {errors.motivo_perdida_id && (
                                            <p className="mt-1 text-sm text-red-600">{errors.motivo_perdida_id}</p>
                                        )}
                                    </div>

                                    <div className="space-y-2">
                                        <label htmlFor="posibilidades_futuras" className="block text-sm font-medium text-gray-700">
                                            ¿Existen posibilidades futuras?
                                        </label>
                                        <select
                                            id="posibilidades_futuras"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                                            value={data.posibilidades_futuras}
                                            onChange={e => {
                                                setData('posibilidades_futuras', e.target.value);
                                                if (e.target.value === 'no') {
                                                    setData('fecha_posible_recontacto', '');
                                                }
                                            }}
                                            disabled={processing}
                                        >
                                            <option value="no">No</option>
                                            <option value="tal_vez">Tal vez</option>
                                            <option value="si">Sí</option>
                                        </select>
                                    </div>

                                    {data.posibilidades_futuras !== 'no' && (
                                        <div className="space-y-2">
                                            <label htmlFor="fecha_posible_recontacto" className="block text-sm font-medium text-gray-700">
                                                Fecha posible de recontacto
                                            </label>
                                            <div className="relative">
                                                <input
                                                    ref={(el) => setFechaInputRef(el)}
                                                    type="date"
                                                    id="fecha_posible_recontacto"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500 pr-10"
                                                    value={formatDateForInput(data.fecha_posible_recontacto)}
                                                    onChange={e => setData('fecha_posible_recontacto', e.target.value)}
                                                    min={new Date().toISOString().split('T')[0]}
                                                    disabled={processing}
                                                />
                                                <button
                                                    type="button"
                                                    onClick={openDatePicker}
                                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                >
                                                    <CalendarDays className="h-5 w-5" />
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    <div className="space-y-2">
                                        <label htmlFor="notas_adicionales" className="block text-sm font-medium text-gray-700">
                                            Notas adicionales
                                        </label>
                                        <textarea
                                            id="notas_adicionales"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-red-500 focus:border-red-500"
                                            rows={2}
                                            value={data.notas_adicionales}
                                            onChange={e => setData('notas_adicionales', e.target.value)}
                                            placeholder="Observaciones adicionales..."
                                            disabled={processing}
                                        />
                                    </div>
                                </div>
                            )}

                            {/* SECCIÓN DE RECORDATORIO (solo si NO es rechazo) */}
                            {!esRechazo && (
                                <div className="space-y-4">
                                    <div className="flex items-center">
                                        <input
                                            type="checkbox"
                                            id="crea_recordatorio"
                                            className="h-4 w-4 text-blue-500 border-gray-300 rounded focus:ring-blue-500"
                                            checked={data.crea_recordatorio}
                                            onChange={e => {
                                                if (!puedeDesactivarRecordatorio) return;
                                                const nuevoValor = e.target.checked;
                                                setData('crea_recordatorio', nuevoValor);
                                                
                                                if (nuevoValor && data.dias_recordatorio === 0) {
                                                    setData('dias_recordatorio', 7);
                                                }
                                                
                                                if (!nuevoValor) {
                                                    setData('dias_recordatorio', 0);
                                                }
                                            }}
                                            disabled={!puedeDesactivarRecordatorio || processing}
                                        />
                                        <label htmlFor="crea_recordatorio" className="ml-2 text-sm text-gray-700 flex items-center gap-2">
                                            <Bell className="h-4 w-4" />
                                            Crear recordatorio
                                            {esRecordatorioObligatorio && (
                                                <span className="text-xs text-amber-600">(Obligatorio)</span>
                                            )}
                                        </label>
                                    </div>

                                    {data.crea_recordatorio && (
                                        <div className="space-y-2 ml-6 pl-4 border-l-2 border-blue-200">
                                            <label htmlFor="dias_recordatorio" className="block text-sm font-medium text-gray-700">
                                                Días para recordatorio (máx. 90) *
                                            </label>
                                            <input
                                                type="number"
                                                id="dias_recordatorio"
                                                min="1"
                                                max="90"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                                value={data.dias_recordatorio}
                                                onChange={e => {
                                                    let valor = parseInt(e.target.value) || 1;
                                                    if (valor > 90) valor = 90;
                                                    if (valor < 1) valor = 1;
                                                    setData('dias_recordatorio', valor);
                                                }}
                                                required={data.crea_recordatorio}
                                                disabled={processing}
                                            />
                                            <p className="text-xs text-gray-500">
                                                El recordatorio se creará para la fecha actual más los días especificados. Máximo 90 días (3 meses).
                                            </p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {Object.keys(errors).length > 0 && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                                    <p className="text-sm text-red-800">Por favor, corrija los errores.</p>
                                </div>
                            )}
                        </div>

                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                            <button
                                type="button"
                                onClick={handleClose}
                                disabled={processing}
                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={processing || 
                                    (esRechazo ? (!data.motivo_perdida_id || !data.tipo_comentario_id) : 
                                    (!data.comentario.trim() || !data.tipo_comentario_id))}
                                className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white flex items-center gap-2 ${
                                    esRechazo ? 'bg-red-600 hover:bg-red-700' : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            >
                                {processing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        {esRechazo ? 'Confirmar Rechazo' : 'Guardar'}
                                    </>
                                )}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </>
    );
}