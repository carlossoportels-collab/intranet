// resources/js/components/Modals/SeguimientoPerdidosModal.tsx

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
    const [recordatorioInputRef, setRecordatorioInputRef] = useState<HTMLInputElement | null>(null);

    // Estado para el toast
    const [toast, setToast] = useState<{
        show: boolean;
        message: string;
        type: 'success' | 'error';
    } | null>(null);

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
        
        setTimeout(() => {
            closeToast();
        }, type === 'success' ? 3000 : 5000);
    };

    const closeToast = () => {
        setToast(null);
    };

    const { data, setData, post, processing, errors, reset } = useForm({
        comentario: '',
        tipo_comentario_id: '',
        crea_recordatorio: true,
        fecha_recordatorio: '',
        cambiar_estado_lead: true, // Siempre true, pero oculto
    });

    // Efecto para cargar estado actual del lead y fecha por defecto
    useEffect(() => {
        if (isOpen && lead) {
            // Establecer fecha por defecto para recordatorio (7 días)
            const fechaDefault = new Date();
            fechaDefault.setDate(fechaDefault.getDate() + 7);
            setData('fecha_recordatorio', fechaDefault.toISOString().split('T')[0]);
        }
    }, [isOpen, lead]);

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
        
        if (!data.comentario.trim()) {
            showToast('Por favor escriba un comentario sobre el seguimiento', 'error');
            return;
        }
        
        if (data.crea_recordatorio && !data.fecha_recordatorio) {
            showToast('Por favor seleccione una fecha para el recordatorio', 'error');
            return;
        }
        
        const esRechazoDefinitivo = tipoSeleccionado.nombre === 'Rechazo definitivo';
        
        const formData = {
            comentario: data.comentario,
            tipo_comentario_id: data.tipo_comentario_id,
            crea_recordatorio: data.crea_recordatorio,
            fecha_recordatorio: data.crea_recordatorio ? data.fecha_recordatorio : null,
            cambiar_estado_lead: true, // Siempre true
        };
        
        reset();
        onClose();
        
        router.post(`/comercial/leads-perdidos/${lead.id}/seguimiento`, formData, {
            preserveScroll: true,
            onSuccess: () => {
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
                setTimeout(() => {
                    showToast('Error al guardar el seguimiento', 'error');
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
        
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
            return dateString;
        }
        
        try {
            const date = new Date(dateString);
            return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
        } catch {
            return dateString;
        }
    };

    const formatDateDisplay = (dateString: string) => {
        if (!dateString) return '';
        
        try {
            const [year, month, day] = dateString.split('-').map(Number);
            const fecha = new Date(year, month - 1, day);
            
            return fecha.toLocaleDateString('es-ES', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });
        } catch {
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
            const [year, month, day] = fechaString.split('-').map(Number);
            const fechaSeleccionada = new Date(year, month - 1, day);
            const hoy = new Date();
            const hoyNormalizado = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate());
            
            const diffMs = fechaSeleccionada.getTime() - hoyNormalizado.getTime();
            const diffDias = Math.round(diffMs / (1000 * 60 * 60 * 24));
            
            if (diffDias === 0) return 'Hoy';
            if (diffDias === 1) return 'Mañana';
            if (diffDias === -1) return 'Ayer';
            if (diffDias > 1) return `En ${diffDias} días`;
            if (diffDias < -1) return `Hace ${Math.abs(diffDias)} días`;
            
            return '';
        } catch (error) {
            return '';
        }
    };

    // 🔥 FUNCIONES PARA FECHAS RÁPIDAS
    const setFechaRapida = (dias: number) => {
        const fecha = new Date();
        fecha.setDate(fecha.getDate() + dias);
        setData('fecha_recordatorio', fecha.toISOString().split('T')[0]);
    };

    const setFechaMeses = (meses: number) => {
        const fecha = new Date();
        fecha.setMonth(fecha.getMonth() + meses);
        setData('fecha_recordatorio', fecha.toISOString().split('T')[0]);
    };

    if (!isOpen && !toast?.show) return null;

    if (!isOpen && toast?.show) {
        return (
            <>
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

    if (!lead || !tiposComentario) {
        return null;
    }

    const tipoSeleccionado = tiposComentario.find(
        t => t.id.toString() === data.tipo_comentario_id.toString()
    );
    
    const esRechazoDefinitivo = tipoSeleccionado && tipoSeleccionado.nombre === 'Rechazo definitivo';

    return (
        <>
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
                            className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fadeIn pointer-events-auto"
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
                                    {/* ❌ SECCIÓN DE INFORMACIÓN DEL LEAD ELIMINADA */}

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
                                                        Fecha para próximo recordatorio *
                                                    </label>
                                                    
                                                    {/* 🔥 BOTONES RÁPIDOS: 1 semana, 1 mes, 2 meses */}
                                                    <div className="flex flex-wrap gap-2 mb-3">
                                                        <button
                                                            type="button"
                                                            onClick={() => setFechaRapida(7)}
                                                            className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                                            disabled={processing}
                                                        >
                                                            📅 1 semana
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFechaMeses(1)}
                                                            className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                                            disabled={processing}
                                                        >
                                                            📅 1 mes
                                                        </button>
                                                        <button
                                                            type="button"
                                                            onClick={() => setFechaMeses(2)}
                                                            className="text-xs px-3 py-1 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 transition-colors"
                                                            disabled={processing}
                                                        >
                                                            📅 2 meses
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

                                    {/* ❌ SECCIÓN DE CAMBIO DE ESTADO ELIMINADA (pero la funcionalidad sigue activa) */}
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