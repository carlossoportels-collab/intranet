import { useForm, router } from '@inertiajs/react';
import { X, MessageSquare, Bell, Calendar, Save, XCircle, AlertCircle, Lock, RefreshCw, CalendarDays, ThumbsUp, Mail, Phone } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import Toast from '@/components/ui/toast';

interface TipoComentarioSeguimiento {
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

interface LeadInfo {
    id: number;
    nombre_completo: string;
    email?: string;
    telefono?: string;
    estado_lead_id?: number | null;
    estado_actual_nombre?: string;
}

interface SeguimientoPerdidaInfo {
    motivo_nombre: string;
    posibilidades_futuras: string;
    fecha_posible_recontacto?: string;
    created: string;
}

interface SeguimientoPerdidosModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: LeadInfo | null;
    seguimiento: SeguimientoPerdidaInfo | null;
    tiposComentario: TipoComentarioSeguimiento[];
    estadosLead: EstadoLead[];
    onSuccess?: () => void;
}

type InertiaErrorType = string | string[] | Record<string, any>;

export default function SeguimientoPerdidosModal({ 
    isOpen, 
    onClose, 
    lead, 
    seguimiento,
    tiposComentario,
    estadosLead = [],
    onSuccess 
}: SeguimientoPerdidosModalProps) {
    const [cambioEstadoInfo, setCambioEstadoInfo] = useState<{
        tipoSeleccionado: string;
        estadoActual: string;
        nuevoEstado: string;
        estadoActualId?: number;
        nuevoEstadoId?: number;
    }>({
        tipoSeleccionado: '',
        estadoActual: 'Perdido',
        nuevoEstado: '',
    });

    const [recordatorioInputRef, setRecordatorioInputRef] = useState<HTMLInputElement | null>(null);

    // Estado para el toast - IMPORTANTE: manejar independientemente del modal
    const [toast, setToast] = useState<{
        show: boolean;
        message: string;
        type: 'success' | 'error';
    } | null>(null);

    // Función para mostrar toast
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ 
            show: true, 
            message, 
            type
        });
        
        // Auto-ocultar después de un tiempo
        if (type === 'success') {
            setTimeout(() => {
                closeToast();
            }, 3000);
        } else {
            setTimeout(() => {
                closeToast();
            }, 5000);
        }
    };

    // Función para cerrar el toast
    const closeToast = () => {
        setToast(null);
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        comentario: '',
        tipo_comentario_id: '',
        crea_recordatorio: true,
        fecha_recordatorio: '',
        cambiar_estado_lead: true,
    });

    // Efecto para cargar estado actual del lead
    useEffect(() => {
        if (isOpen && lead) {
            const estadoActual = lead.estado_lead_id 
                ? estadosLead.find(e => e.id === lead.estado_lead_id)
                : undefined;
            const estadoActualNombre = estadoActual?.nombre || 'Perdido';
            const estadoActualId = estadoActual?.id;
            
            setCambioEstadoInfo(prev => ({
                ...prev,
                estadoActual: estadoActualNombre,
                estadoActualId: estadoActualId,
            }));
            
            // Establecer fecha por defecto para recordatorio (7 días)
            const fechaDefault = new Date();
            fechaDefault.setDate(fechaDefault.getDate() + 7);
            setData('fecha_recordatorio', fechaDefault.toISOString().split('T')[0]);
            
            // NO resetear toast aquí - dejarlo si hay uno mostrándose
        }
    }, [isOpen, lead, estadosLead]);

    // Efecto para calcular nuevo estado según tipo de comentario seleccionado
    useEffect(() => {
        if (data.tipo_comentario_id && lead && tiposComentario) {
            const tipoSeleccionado = tiposComentario.find(
                t => t.id.toString() === data.tipo_comentario_id.toString()
            );
            
            if (tipoSeleccionado) {
                let nuevoEstadoNombre = '';
                let nuevoEstadoId: number | null = null;
                
                // Mapear tipo de comentario a estado de lead
                switch(tipoSeleccionado.nombre.toLowerCase()) {
                    case 'recontacto exitoso':
                        nuevoEstadoNombre = 'Recontactando';
                        break;
                    case 'nueva información enviada':
                        nuevoEstadoNombre = 'Info Enviada';
                        break;
                    case 'reagendado':
                        nuevoEstadoNombre = 'Reagendado';
                        // Para reagendado, establecer fecha por defecto de 14 días
                        if (!data.fecha_recordatorio) {
                            const fechaFutura = new Date();
                            fechaFutura.setDate(fechaFutura.getDate() + 14);
                            setData('fecha_recordatorio', fechaFutura.toISOString().split('T')[0]);
                        }
                        break;
                    case 'rechazo definitivo':
                        nuevoEstadoNombre = 'Perdido';
                        break;
                    default:
                        nuevoEstadoNombre = cambioEstadoInfo.estadoActual;
                }
                
                // Buscar el estado correspondiente en estadosLead
                const nuevoEstado = estadosLead.find(e => 
                    e.nombre === nuevoEstadoNombre
                );
                
                if (nuevoEstado) {
                    nuevoEstadoId = nuevoEstado.id;
                }
                
                setCambioEstadoInfo({
                    tipoSeleccionado: tipoSeleccionado.nombre,
                    estadoActual: cambioEstadoInfo.estadoActual,
                    nuevoEstado: nuevoEstadoNombre,
                    estadoActualId: cambioEstadoInfo.estadoActualId,
                    nuevoEstadoId: nuevoEstadoId || undefined,
                });
            }
        }
    }, [data.tipo_comentario_id, lead, tiposComentario]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!lead) return;
        
        if (!tiposComentario) {
            showToast('Error: No se cargaron los tipos de comentario', 'error');
            return;
        }
        
        const tipoSeleccionado = tiposComentario.find(
            t => t.id.toString() === data.tipo_comentario_id.toString()
        );
        
        if (!tipoSeleccionado) {
            showToast('Por favor seleccione un tipo de seguimiento', 'error');
            return;
        }
        
        // Validaciones
        if (!data.comentario.trim()) {
            showToast('Por favor escriba un comentario sobre el seguimiento', 'error');
            return;
        }
        
        if (data.crea_recordatorio && !data.fecha_recordatorio) {
            showToast('Por favor seleccione una fecha para el recordatorio', 'error');
            return;
        }
        
        // Determinar si es rechazo definitivo para el mensaje del toast
        const esRechazoDefinitivo = tipoSeleccionado.nombre === 'Rechazo definitivo';
        
        // Preparar datos para enviar
        const formData = {
            comentario: data.comentario,
            tipo_comentario_id: data.tipo_comentario_id,
            crea_recordatorio: data.crea_recordatorio,
            fecha_recordatorio: data.crea_recordatorio ? data.fecha_recordatorio : null,
            cambiar_estado_lead: data.cambiar_estado_lead,
        };
        
        
        // Cerrar el modal primero para que se vea el toast
        reset();
        onClose();
        
        // Usar router para enviar a la ruta de seguimiento (después de cerrar)
        router.post(`/comercial/leads-perdidos/${lead.id}/seguimiento`, formData, {
            preserveScroll: true,
            onSuccess: () => {
                // Mostrar toast de éxito DESPUÉS de cerrar el modal
                setTimeout(() => {
                    const mensajeExito = esRechazoDefinitivo 
                        ? 'Rechazo definitivo registrado exitosamente' 
                        : 'Seguimiento registrado exitosamente';
                    showToast(mensajeExito, 'success');
                    
                    if (onSuccess) onSuccess();
                }, 300);
            },
            onError: (errors: InertiaErrorType) => {
                console.error('Error al guardar seguimiento:', errors);
                
                const errorMessage = 'Error al guardar el seguimiento';
                
                // Función helper para extraer mensaje de error
                const extractErrorMessage = (err: InertiaErrorType): string => {
                    if (typeof err === 'string') {
                        return err;
                    } else if (Array.isArray(err)) {
                        return err[0] || errorMessage;
                    } else if (err && typeof err === 'object') {
                        // Buscar el primer mensaje de error
                        const firstError = Object.values(err)[0];
                        if (Array.isArray(firstError)) {
                            return firstError[0] || errorMessage;
                        } else if (typeof firstError === 'string') {
                            return firstError;
                        }
                        // Buscar mensaje en flash si existe
                        if (err.flash && typeof err.flash === 'object' && 'error' in err.flash) {
                            return (err.flash as any).error;
                        }
                    }
                    return errorMessage;
                };
                
                const extractedMessage = extractErrorMessage(errors);
                
                // Mostrar toast de error DESPUÉS de cerrar el modal
                setTimeout(() => {
                    showToast(extractedMessage, 'error');
                }, 300);
            }
        });
    };

    const handleClose = () => {
        reset();
        onClose();
    };

    const openDatePicker = () => {
        if (recordatorioInputRef) {
            recordatorioInputRef.showPicker();
        }
    };

    const formatDateForInput = (dateString: string) => {
        if (!dateString) return '';
        
        // Si ya está en formato YYYY-MM-DD, devolverlo tal cual
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }
        
        try {
            // Si es una fecha ISO, extraer solo la parte de la fecha
            const date = new Date(dateString);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        } catch {
            return dateString;
        }
    };

    const formatDateDisplay = (dateString: string) => {
        if (!dateString) return '';
        
        try {
            // Parsear la fecha del formato YYYY-MM-DD
            const [year, month, day] = dateString.split('-').map(Number);
            const fecha = new Date(year, month - 1, day);
            
            return fecha.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
            // Si falla, intentar con Date normal
            try {
                const fecha = new Date(dateString);
                return fecha.toLocaleDateString('es-ES', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                });
            } catch {
                return dateString;
            }
        }
    };

    const calcularDiferencia = (fechaString: string) => {
        if (!fechaString) return '';
        
        try {
            // Crear fecha a partir del string (YYYY-MM-DD)
            const [year, month, day] = fechaString.split('-').map(Number);
            const fechaSeleccionada = new Date(year, month - 1, day);
            
            // Fecha de hoy sin horas/minutos/segundos
            const hoy = new Date();
            const hoyNormalizado = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
            
            // Calcular diferencia en días
            const diffMs = fechaSeleccionada.getTime() - hoyNormalizado.getTime();
            const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));
            
            // Determinar texto según diferencia
            if (diffDias === 0) return 'Hoy';
            if (diffDias === 1) return 'Mañana';
            if (diffDias === -1) return 'Ayer';
            if (diffDias > 1) return `En ${diffDias} días`;
            if (diffDias < -1) return `Hace ${Math.abs(diffDias)} días`;
            
            return `(${diffDias} días)`;
        } catch (error) {
            console.error('Error calculando diferencia:', error);
            return '';
        }
    };

    // **CORREGIDO**: Cambiar la condición para que el componente siempre renderice si hay toast
    // El componente se debe renderizar si:
    // 1. El modal está abierto, O
    // 2. Hay un toast mostrándose
    if (!isOpen && !toast?.show) return null;

    // Si no hay lead o tiposComentario pero hay toast, igual renderizar el toast
    if (!isOpen && toast?.show) {
        return (
            <>
                {/* Componente Toast */}
                {toast?.show && (
                    <Toast
                        message={toast.message}
                        type={toast.type}
                        duration={toast.type === 'success' ? 3000 : 5000}
                        position="top-center"
                        onClose={closeToast}
                    />
                )}
            </>
        );
    }

    // Verificar que tengamos los datos necesarios para el modal
    if (!lead || !tiposComentario) {
        return null;
    }

    const tipoSeleccionado = tiposComentario.find(
        t => t.id.toString() === data.tipo_comentario_id.toString()
    );
    
    const esReagendado = tipoSeleccionado && tipoSeleccionado.nombre === 'Reagendado';
    const esRechazoDefinitivo = tipoSeleccionado && tipoSeleccionado.nombre === 'Rechazo definitivo';

    return (
        <>
            {/* Componente Toast - siempre renderizado si existe */}
            {toast?.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    duration={toast.type === 'success' ? 3000 : 5000}
                    position="bottom-center"
                    onClose={closeToast}
                />
            )}

            {isOpen && (
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
                                    <div className={`p-2 rounded-lg ${esRechazoDefinitivo ? 'bg-red-100' : 'bg-green-100'}`}>
                                        {esRechazoDefinitivo ? (
                                            <ThumbsUp className="h-6 w-6 text-red-600" />
                                        ) : (
                                            <RefreshCw className="h-6 w-6 text-green-600" />
                                        )}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">
                                            {esRechazoDefinitivo ? 'Confirmar Rechazo Definitivo' : 'Nuevo Seguimiento'}
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
                                    {/* Información del lead y seguimiento anterior */}
                                    <div className="bg-blue-50 rounded-md p-4 border border-blue-200">
                                        <h3 className="text-sm font-medium text-blue-700 mb-2 flex items-center gap-2">
                                            <AlertCircle className="h-4 w-4" />
                                            Información del lead
                                        </h3>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                            <div>
                                                <span className="text-blue-600">Estado actual:</span>
                                                <span className="ml-2 font-medium text-blue-800">{cambioEstadoInfo.estadoActual}</span>
                                            </div>
                                            {seguimiento && (
                                                <>
                                                    <div>
                                                        <span className="text-blue-600">Motivo pérdida:</span>
                                                        <span className="ml-2 font-medium text-blue-800">{seguimiento.motivo_nombre}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-blue-600">Posibilidades futuras:</span>
                                                        <span className="ml-2 font-medium text-blue-800">
                                                            {seguimiento.posibilidades_futuras === 'si' ? 'Sí' : 
                                                             seguimiento.posibilidades_futuras === 'tal_vez' ? 'Tal vez' : 'No'}
                                                        </span>
                                                    </div>
                                                    {seguimiento.fecha_posible_recontacto && (
                                                        <div>
                                                            <span className="text-blue-600">Recontacto sugerido:</span>
                                                            <span className="ml-2 font-medium text-blue-800">
                                                                {new Date(seguimiento.fecha_posible_recontacto).toLocaleDateString('es-ES')}
                                                            </span>
                                                        </div>
                                                    )}
                                                </>
                                            )}
                                            {(lead.email || lead.telefono) && (
                                                <div className="md:col-span-2">
                                                    <div className="flex items-center gap-4">
                                                        {lead.email && (
                                                            <div className="flex items-center gap-1">
                                                                <Mail className="h-3 w-3 text-blue-500" />
                                                                <span className="text-blue-700">{lead.email}</span>
                                                            </div>
                                                        )}
                                                        {lead.telefono && (
                                                            <div className="flex items-center gap-1">
                                                                <Phone className="h-3 w-3 text-blue-500" />
                                                                <span className="text-blue-700">{lead.telefono}</span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Tipo de comentario de seguimiento */}
                                    <div className="space-y-2">
                                        <label htmlFor="tipo_comentario_id" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                            <MessageSquare className="h-4 w-4" />
                                            Tipo de Seguimiento *
                                        </label>
                                        <select
                                            id="tipo_comentario_id"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                            value={data.tipo_comentario_id}
                                            onChange={e => setData('tipo_comentario_id', e.target.value)}
                                            required
                                            disabled={processing}
                                        >
                                            <option value="">Seleccionar tipo de seguimiento</option>
                                            {tiposComentario.map(tipo => (
                                                <option key={tipo.id} value={tipo.id}>
                                                    {tipo.nombre} - {tipo.descripcion}
                                                </option>
                                            ))}
                                        </select>
                                        {tipoSeleccionado && (
                                            <p className="text-xs text-gray-500 mt-1">
                                                {tipoSeleccionado.descripcion}
                                            </p>
                                        )}
                                    </div>

                                    {/* Comentario */}
                                    <div className="space-y-2">
                                        <label htmlFor="comentario" className="block text-sm font-medium text-gray-700">
                                            Comentario del seguimiento *
                                        </label>
                                        <textarea
                                            id="comentario"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                                            rows={4}
                                            value={data.comentario}
                                            onChange={e => setData('comentario', e.target.value)}
                                            placeholder="Describa los detalles del seguimiento: cómo respondió el lead, qué se conversó, acuerdos, información enviada, etc..."
                                            required
                                            disabled={processing}
                                        />
                                    </div>

                                    {/* Recordatorio (excepto para Rechazo definitivo) */}
                                    {!esRechazoDefinitivo && (
                                        <div className="space-y-4">
                                            <div className="flex items-center">
                                                <input
                                                    type="checkbox"
                                                    id="crea_recordatorio"
                                                    className="h-4 w-4 text-green-500 border-gray-300 rounded focus:ring-green-500"
                                                    checked={data.crea_recordatorio}
                                                    onChange={e => setData('crea_recordatorio', e.target.checked)}
                                                    disabled={processing}
                                                />
                                                <label htmlFor="crea_recordatorio" className="ml-2 text-sm text-gray-700 flex items-center gap-2">
                                                    <Bell className="h-4 w-4" />
                                                    Crear recordatorio de seguimiento
                                                </label>
                                            </div>

                                            {data.crea_recordatorio && (
                                                <div className="space-y-2 ml-6 pl-4 border-l-2 border-green-200">
                                                    <label htmlFor="fecha_recordatorio" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                                        <Calendar className="h-4 w-4" />
                                                        {esReagendado ? 'Fecha de contacto acordada *' : 'Fecha para próximo recordatorio *'}
                                                    </label>
                                                    
                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const hoy = new Date();
                                                                const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 7);
                                                                const fechaFormateada = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
                                                                setData('fecha_recordatorio', fechaFormateada);
                                                            }}
                                                            className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                                            disabled={processing}
                                                        >
                                                            En 1 semana
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const hoy = new Date();
                                                                const fecha = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 14);
                                                                const fechaFormateada = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
                                                                setData('fecha_recordatorio', fechaFormateada);
                                                            }}
                                                            className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                                            disabled={processing}
                                                        >
                                                            En 2 semanas
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => {
                                                                const hoy = new Date();
                                                                const fecha = new Date(hoy.getFullYear(), hoy.getMonth() + 1, hoy.getDate());
                                                                const fechaFormateada = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}-${String(fecha.getDate()).padStart(2, '0')}`;
                                                                setData('fecha_recordatorio', fechaFormateada);
                                                            }}
                                                            className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                                                            disabled={processing}
                                                        >
                                                            En 1 mes
                                                        </button>
                                                    </div>
                                                    
                                                    <div className="relative">
                                                        <input
                                                            ref={(el) => setRecordatorioInputRef(el)}
                                                            type="date"
                                                            id="fecha_recordatorio"
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 pr-10"
                                                            value={formatDateForInput(data.fecha_recordatorio)}
                                                            onChange={e => setData('fecha_recordatorio', e.target.value)}
                                                            min={new Date().toISOString().split('T')[0]}
                                                            required={data.crea_recordatorio}
                                                            disabled={processing}
                                                        />
                                                        <button
                                                            type="button"
                                                            onClick={openDatePicker}
                                                            className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                                            disabled={processing}
                                                        >
                                                            <CalendarDays className="h-5 w-5" />
                                                        </button>
                                                    </div>
                                                    
                                                    {data.fecha_recordatorio && (
                                                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                                                            <p className="text-sm text-green-800">
                                                                <span className="font-medium">Recordatorio programado para:</span> {formatDateDisplay(data.fecha_recordatorio)}
                                                                <span className="ml-2 text-xs bg-green-100 text-green-800 px-2 py-1 rounded">
                                                                    {calcularDiferencia(data.fecha_recordatorio)}
                                                                </span>
                                                            </p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* Cambio de estado */}
                                    <div className="space-y-4">
                                        <div className="flex items-center">
                                            <input
                                                type="checkbox"
                                                id="cambiar_estado_lead"
                                                className="h-4 w-4 text-green-500 border-gray-300 rounded focus:ring-green-500"
                                                checked={data.cambiar_estado_lead}
                                                onChange={() => {}}
                                                readOnly
                                                disabled={processing}
                                            />
                                            <label htmlFor="cambiar_estado_lead" className="ml-2 text-sm font-medium text-gray-700 flex items-center gap-2">
                                                <Lock className="h-4 w-4 text-gray-500" />
                                                Cambiar estado del lead automáticamente
                                            </label>
                                        </div>
                                        
                                        {data.cambiar_estado_lead && cambioEstadoInfo.nuevoEstado && cambioEstadoInfo.nuevoEstado !== cambioEstadoInfo.estadoActual && (
                                            <div className={`ml-6 pl-4 border-l-2 rounded-md p-3 ${
                                                esRechazoDefinitivo 
                                                    ? 'border-red-200 bg-red-50' 
                                                    : 'border-green-200 bg-green-50'
                                            }`}>
                                                <div className="flex items-center gap-2 mb-2">
                                                    <div className={`p-1 rounded ${
                                                        esRechazoDefinitivo ? 'bg-red-100' : 'bg-green-100'
                                                    }`}>
                                                        <AlertCircle className={`h-4 w-4 ${
                                                            esRechazoDefinitivo ? 'text-red-600' : 'text-green-600'
                                                        }`} />
                                                    </div>
                                                    <span className={`text-sm font-medium ${
                                                        esRechazoDefinitivo ? 'text-red-800' : 'text-green-800'
                                                    }`}>
                                                        Cambio de estado automático
                                                    </span>
                                                </div>
                                                <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                                                    <div className="bg-white p-2 rounded border border-gray-200">
                                                        <div className="text-xs text-gray-500 mb-1">Estado actual</div>
                                                        <div className="font-medium text-gray-700">{cambioEstadoInfo.estadoActual}</div>
                                                    </div>
                                                    <div className="flex items-center justify-center">
                                                        <span className="text-gray-400 text-xl">→</span>
                                                    </div>
                                                    <div className={`p-2 rounded border ${
                                                        esRechazoDefinitivo 
                                                            ? 'bg-red-100 border-red-300' 
                                                            : 'bg-green-100 border-green-300'
                                                    }`}>
                                                        <div className={`text-xs mb-1 ${
                                                            esRechazoDefinitivo ? 'text-red-700' : 'text-green-700'
                                                        }`}>
                                                            Nuevo estado
                                                        </div>
                                                        <div className={`font-medium ${
                                                            esRechazoDefinitivo ? 'text-red-800' : 'text-green-800'
                                                        }`}>
                                                            {cambioEstadoInfo.nuevoEstado}
                                                        </div>
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        disabled={processing}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={processing || !data.comentario.trim() || !data.tipo_comentario_id || 
                                            (data.crea_recordatorio && !data.fecha_recordatorio)}
                                        className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 transition-colors flex items-center gap-2 ${
                                            esRechazoDefinitivo 
                                                ? 'bg-red-600 hover:bg-red-700 focus:ring-red-500' 
                                                : 'bg-green-600 hover:bg-green-700 focus:ring-green-500'
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
                                                {esRechazoDefinitivo ? 'Confirmar Rechazo Definitivo' : 'Guardar Seguimiento'}
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </>
            )}
        </>
    );
}