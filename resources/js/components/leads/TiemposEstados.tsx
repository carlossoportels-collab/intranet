// resources/js/Components/Lead/TiemposEstados.tsx
import { Clock, TrendingUp, Calendar, BarChart3, Target, AlertCircle } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface TiempoEstado {
    desde: string;
    hasta: string;
    dias: number;
    horas: number;
    minutos: number;
    fecha_cambio: string;
    razon?: string;
}

interface TiemposEstadosProps {
    leadId: number;
    isOpen?: boolean;
    onClose?: () => void;
}

export default function TiemposEstados({ leadId, isOpen = false, onClose }: TiemposEstadosProps) {
    const [tiempos, setTiempos] = useState<TiempoEstado[]>([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        if (leadId && isOpen) {
            cargarTiempos();
        }
    }, [leadId, isOpen]);
    
    const cargarTiempos = async () => {
        setCargando(true);
        setError(null);
        
        try {
            const response = await fetch(`/comercial/leads/${leadId}/tiempos-estados`);
            if (!response.ok) throw new Error('Error al cargar tiempos');
            const data = await response.json();
            setTiempos(data);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error al cargar datos');
            console.error('Error cargando tiempos:', err);
        } finally {
            setCargando(false);
        }
    };
    
    const calcularEstadisticas = () => {
        if (tiempos.length === 0) return null;
        
        const totalDias = tiempos.reduce((total, tiempo) => total + tiempo.dias, 0);
        const promedioDias = totalDias / tiempos.length;
        
        return {
            totalCambios: tiempos.length,
            totalDias,
            promedioDias: promedioDias.toFixed(1)
        };
    };
    
    const formatFecha = (fechaString: string) => {
        try {
            return new Date(fechaString).toLocaleDateString('es-ES', {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
                hour: '2-digit',
                minute: '2-digit'
            });
        } catch {
            return 'Fecha inválida';
        }
    };
    
    const estadisticas = calcularEstadisticas();
    
    if (!isOpen) return null;
    
    return (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4 bg-black/60">
            <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                            <TrendingUp className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                Tiempos entre estados
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                Lead ID: {leadId}
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                    >
                        <span className="sr-only">Cerrar</span>
                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                
                {/* Contenido */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {cargando ? (
                        <div className="text-center py-12">
                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="text-gray-600 mt-4 text-sm">Cargando tiempos entre estados...</p>
                        </div>
                    ) : error ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="h-6 w-6 text-red-600" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">Error al cargar datos</h3>
                            <p className="text-gray-600 text-sm mb-4">{error}</p>
                            <button
                                onClick={cargarTiempos}
                                className="px-4 py-2 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                            >
                                Reintentar
                            </button>
                        </div>
                    ) : tiempos.length === 0 ? (
                        <div className="text-center py-12">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Calendar className="h-6 w-6 text-gray-400" />
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos de transiciones</h3>
                            <p className="text-gray-600 text-sm">
                                No se han registrado cambios de estado para este lead.
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Estadísticas */}
                            <div className="mb-6">
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Estadísticas</h3>
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <BarChart3 className="h-5 w-5 text-blue-600" />
                                            <span className="text-sm font-medium text-blue-700">Total cambios</span>
                                        </div>
                                        <p className="text-2xl font-bold text-blue-600">{estadisticas?.totalCambios}</p>
                                    </div>
                                    
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Clock className="h-5 w-5 text-green-600" />
                                            <span className="text-sm font-medium text-green-700">Total días</span>
                                        </div>
                                        <p className="text-2xl font-bold text-green-600">{estadisticas?.totalDias}</p>
                                    </div>
                                    
                                    <div className="bg-purple-50 p-4 rounded-lg border border-purple-100">
                                        <div className="flex items-center gap-2 mb-2">
                                            <Target className="h-5 w-5 text-purple-600" />
                                            <span className="text-sm font-medium text-purple-700">Promedio por cambio</span>
                                        </div>
                                        <p className="text-2xl font-bold text-purple-600">
                                            {estadisticas?.promedioDias} días
                                        </p>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Lista de tiempos */}
                            <div>
                                <h3 className="text-sm font-medium text-gray-700 mb-3">Transiciones de estado</h3>
                                <div className="space-y-3">
                                    {tiempos.map((tiempo, index) => (
                                        <div key={index} className="border-l-2 border-blue-300 pl-4 py-3 hover:bg-gray-50 rounded-r">
                                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
                                                <div>
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
                                                            {tiempo.desde}
                                                        </span>
                                                        <span className="text-gray-400">→</span>
                                                        <span className="text-sm font-medium text-gray-700 bg-blue-100 px-3 py-1.5 rounded-lg">
                                                            {tiempo.hasta}
                                                        </span>
                                                    </div>
                                                    {tiempo.razon && (
                                                        <p className="text-xs text-gray-500 mt-2">
                                                            <span className="font-medium">Razón:</span> {tiempo.razon}
                                                        </p>
                                                    )}
                                                </div>
                                                
                                                <div className="flex items-center gap-4">
                                                    <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
                                                        <Clock className="h-4 w-4" />
                                                        <span className="font-medium">{tiempo.dias}</span> día{tiempo.dias !== 1 ? 's' : ''}
                                                        {tiempo.horas > 0 && <span>, {tiempo.horas}h</span>}
                                                        {tiempo.minutos > 0 && <span> {tiempo.minutos}m</span>}
                                                    </div>
                                                    <div className="text-sm text-gray-500">
                                                        {formatFecha(tiempo.fecha_cambio)}
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </>
                    )}
                </div>
                
                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex justify-end">
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}