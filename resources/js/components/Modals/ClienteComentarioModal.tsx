// resources/js/components/Modals/ClienteComentarioModal.tsx
import { useForm, router } from '@inertiajs/react';
import { X, MessageSquare, Bell, Save, XCircle, Briefcase } from 'lucide-react';
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

interface Lead {
    id: number;
    nombre_completo: string;
    email?: string;
    telefono?: string;
}

interface ClienteComentarioModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
    tiposComentario: TipoComentario[];
    comentariosExistentes?: number;
    onSuccess?: () => void;
}

export default function ClienteComentarioModal({ 
    isOpen, 
    onClose, 
    lead, 
    tiposComentario, 
    comentariosExistentes = 0,
    onSuccess 
}: ClienteComentarioModalProps) {
    
    const { data, setData, post, processing, errors, reset } = useForm({
        comentario: '',
        tipo_comentario_id: '',
        crea_recordatorio: false,
        dias_recordatorio: 7,
        cambiar_estado_lead: false, // Los clientes no cambian de estado
    });

    // Filtrar tipos activos que aplican a cliente
    const tiposFiltrados = tiposComentario.filter(tipo => 
        tipo.es_activo && (tipo.aplica_a === 'cliente' || tipo.aplica_a === 'ambos')
    );

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

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!lead) return;
        
        if (!data.comentario.trim()) {
            alert('Por favor escriba un comentario');
            return;
        }
        
        if (!data.tipo_comentario_id) {
            alert('Por favor seleccione un tipo de comentario');
            return;
        }

        const formData = {
            comentario: data.comentario,
            tipo_comentario_id: data.tipo_comentario_id,
            crea_recordatorio: data.crea_recordatorio,
            dias_recordatorio: data.crea_recordatorio ? data.dias_recordatorio : 0,
            cambiar_estado_lead: false,
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
        onClose();
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
                    className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fadeIn pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-purple-100">
                                <Briefcase className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Nuevo Comentario - Cliente
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
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                                    value={data.tipo_comentario_id}
                                    onChange={e => setData('tipo_comentario_id', e.target.value)}
                                    required
                                    disabled={processing}
                                >
                                    <option value="">Seleccionar tipo</option>
                                    {tiposFiltrados.map(tipo => (
                                        <option key={tipo.id} value={tipo.id}>
                                            {tipo.nombre}
                                        </option>
                                    ))}
                                </select>
                                {tiposFiltrados.length === 0 && (
                                    <p className="mt-1 text-sm text-amber-600">
                                        No hay tipos de comentario disponibles para clientes.
                                    </p>
                                )}
                                {errors.tipo_comentario_id && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <XCircle className="h-3 w-3" />
                                        {errors.tipo_comentario_id}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-2">
                                <label htmlFor="comentario" className="block text-sm font-medium text-gray-700">
                                    Comentario *
                                </label>
                                <textarea
                                    id="comentario"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
                                    rows={4}
                                    value={data.comentario}
                                    onChange={e => setData('comentario', e.target.value)}
                                    placeholder="Escriba su comentario aquí..."
                                    required
                                    disabled={processing}
                                />
                                {errors.comentario && (
                                    <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                                        <XCircle className="h-3 w-3" />
                                        {errors.comentario}
                                    </p>
                                )}
                            </div>

                            <div className="space-y-4">
                                <div className="flex items-center">
                                    <input
                                        type="checkbox"
                                        id="crea_recordatorio"
                                        className="h-4 w-4 text-purple-500 border-gray-300 rounded focus:ring-purple-500"
                                        checked={data.crea_recordatorio}
                                        onChange={e => setData('crea_recordatorio', e.target.checked)}
                                        disabled={processing}
                                    />
                                    <label htmlFor="crea_recordatorio" className="ml-2 text-sm text-gray-700 flex items-center gap-2">
                                        <Bell className="h-4 w-4" />
                                        Crear recordatorio
                                    </label>
                                </div>

                                {data.crea_recordatorio && (
                                    <div className="space-y-2 ml-6 pl-4 border-l-2 border-purple-200">
                                        <label htmlFor="dias_recordatorio" className="block text-sm font-medium text-gray-700">
                                            Días para recordatorio (máx. 90) *
                                        </label>
                                        <input
                                            type="number"
                                            id="dias_recordatorio"
                                            min="1"
                                            max="90"
                                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500"
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
                                            El recordatorio se creará para la fecha actual más los días especificados.
                                        </p>
                                    </div>
                                )}
                            </div>

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
                                disabled={processing || !data.comentario.trim() || !data.tipo_comentario_id}
                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 flex items-center gap-2"
                            >
                                {processing ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                        Guardando...
                                    </>
                                ) : (
                                    <>
                                        <Save className="h-4 w-4" />
                                        Guardar
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