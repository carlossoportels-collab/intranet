// resources/js/components/leads/tabs/PresupuestosUnificadosTab.tsx

import { router } from '@inertiajs/react';
import { FileText, Calendar, Truck, Eye, Download, Tag, User, Loader, FileSignature,ChevronUp, ChevronDown } from 'lucide-react';
import React, { useState, useMemo, useEffect, useCallback } from 'react';

import { Amount } from '@/components/ui/Amount';
import { Badge } from '@/components/ui/badge';
import Pagination from '@/components/ui/Pagination';
import { useToast } from '@/contexts/ToastContext';
import { Lead, Origen, Rubro, Provincia } from '@/types/leads';
import { usePagination } from '@/hooks/usePagination';

// Tipos
interface PresupuestoNuevo {
    id: number;
    tipo: 'nuevo';
    nombre: string;
    referencia: string;
    fecha: string;
    fecha_original: string;
    estado: string;
    estado_color?: string;
    total: number;
    comercial: string;
    promocion?: string;
    tiene_pdf: boolean;
    pdf_url: string | null;
    lead_id?: number;
    metadata: {
        cantidad_vehiculos?: number;
        descripcion?: string;
        validez_hasta?: string;
    };
}

interface PresupuestoLegacy {
    id: number;
    tipo: 'legacy';
    nombre: string;
    fecha: string;
    fecha_original: string;
    tiene_pdf: boolean;
    pdf_url: string | null;
    prefijo_id: number | null;
    prefijo?: {
        id: number;
        codigo: string;
        nombre: string;
    } | null;
    metadata: {
        cantidad_vehiculos?: number;
        descripcion?: string;
        importe?: number;
    };
}

type PresupuestoUnificado = PresupuestoNuevo | PresupuestoLegacy;

interface Props {
    presupuestosNuevos: PresupuestoNuevo[];
    presupuestosLegacy: PresupuestoLegacy[];
    lead: Lead;
    origenes: Origen[];
    rubros: Rubro[];
    provincias: Provincia[];
}

const ITEMS_PER_PAGE = 5;

export default function PresupuestosUnificadosTab({ 
    presupuestosNuevos, 
    presupuestosLegacy,
    lead,
    origenes,
    rubros,
    provincias,
}: Props) {
    const [orden, setOrden] = useState<'reciente' | 'antiguo'>('reciente');
    const [generandoPDF, setGenerandoPDF] = useState<number | null>(null);
    const [expandedMobileCard, setExpandedMobileCard] = useState<string | null>(null);
    
    const toast = useToast();

    // Asegurarnos de que los arrays existan
    const nuevos = Array.isArray(presupuestosNuevos) ? presupuestosNuevos : [];
    const legacy = Array.isArray(presupuestosLegacy) ? presupuestosLegacy : [];

    // Combinar y ordenar presupuestos
    const todosLosPresupuestos = useMemo(() => {
        const nuevosConTipo = nuevos.map(p => ({ ...p, tipo: 'nuevo' as const }));
        const legacyConTipo = legacy.map(p => ({ ...p, tipo: 'legacy' as const }));
        
        const presupuestos = [...nuevosConTipo, ...legacyConTipo];

        presupuestos.sort((a, b) => {
            const fechaA = new Date(a.fecha_original).getTime();
            const fechaB = new Date(b.fecha_original).getTime();
            return orden === 'reciente' ? fechaB - fechaA : fechaA - fechaB;
        });

        return presupuestos;
    }, [nuevos, legacy, orden]);

    // Usar el hook de paginación
    const {
        currentPage,
        totalPages,
        paginatedItems: paginatedPresupuestos,
        goToPage
    } = usePagination({
        items: todosLosPresupuestos,
        initialItemsPerPage: ITEMS_PER_PAGE
    });

    // Resetear a página 1 cuando cambia el orden
    useEffect(() => {
        goToPage(1);
    }, [orden]);

    const handleVerPdf = useCallback((presupuesto: PresupuestoUnificado, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!presupuesto.tiene_pdf || !presupuesto.pdf_url) {
            toast.error('No hay PDF disponible');
            return;
        }
        
        window.open(presupuesto.pdf_url, '_blank');
    }, [toast]);

    const handleDescargarPdf = useCallback(async (presupuesto: PresupuestoUnificado, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!presupuesto.tiene_pdf || !presupuesto.pdf_url) {
            toast.error('No hay PDF disponible');
            return;
        }
        
        if (presupuesto.tipo === 'nuevo') {
            setGenerandoPDF(presupuesto.id);
            toast.info('Generando PDF...');
            
            try {
                window.open(`${presupuesto.pdf_url}?download=1`, '_blank');
                
                setTimeout(() => {
                    setGenerandoPDF(null);
                }, 1000);
                
            } catch (error) {
                console.error('Error generando PDF:', error);
                toast.error('Error al generar el PDF');
                setGenerandoPDF(null);
            }
        } else {
            window.open(`/presupuestos-legacy/${presupuesto.id}/descargar`, '_blank');
        }
    }, [toast]);

    /**
     * 🔥 NUEVO: Navegar directamente al Show del presupuesto
     */
    const handleGenerarContrato = useCallback((presupuestoId: number) => {
        router.visit(`/comercial/presupuestos/${presupuestoId}`);
    }, []);

    const handlePageChange = useCallback((page: number) => {
        goToPage(page);
        setTimeout(() => {
            document.getElementById('presupuestos-list')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }, [goToPage]);

    const toggleMobileCard = useCallback((id: string) => {
        setExpandedMobileCard(prev => prev === id ? null : id);
    }, []);

    const getBadgeColor = (estado?: string) => {
        const colores: Record<string, string> = {
            'Aprobado': 'bg-green-100 text-green-800 border-green-200',
            'Pendiente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'Rechazado': 'bg-red-100 text-red-800 border-red-200',
            'Enviado': 'bg-blue-100 text-blue-800 border-blue-200',
            'Vencido': 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return colores[estado || ''] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    if (todosLosPresupuestos.length === 0) {
        return (
            <div className="p-6 sm:p-8 text-center text-gray-500">
                <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-base sm:text-lg font-medium">No hay presupuestos</p>
                <p className="text-xs sm:text-sm">Este lead no tiene presupuestos asociados</p>
            </div>
        );
    }

    return (
        <div id="presupuestos-list" className="divide-y divide-gray-200">
            {/* Cabecera informativa y ordenamiento */}
            <div className="p-3 sm:p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                        <span className="font-medium text-gray-700">Presupuestos:</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md whitespace-nowrap">
                            Nuevos: {nuevos.length}
                        </span>
                        <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-md whitespace-nowrap">
                            Anteriores: {legacy.length}
                        </span>
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md whitespace-nowrap">
                            Total: {todosLosPresupuestos.length}
                        </span>
                    </div>
                    
                    <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm text-gray-600">Ordenar:</span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => setOrden('reciente')}
                                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
                                    orden === 'reciente' 
                                        ? 'bg-local text-white' 
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                Reciente
                            </button>
                            <button
                                onClick={() => setOrden('antiguo')}
                                className={`px-2 sm:px-3 py-1 sm:py-1.5 text-xs sm:text-sm rounded-md transition-colors ${
                                    orden === 'antiguo' 
                                        ? 'bg-local text-white' 
                                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                                }`}
                            >
                                Antiguo
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Lista de presupuestos */}
            {paginatedPresupuestos.map((presupuesto) => {
                const cardId = `${presupuesto.tipo}-${presupuesto.id}`;
                const isExpanded = expandedMobileCard === cardId;
                const mostrarBotonAccion = presupuesto.tipo === 'nuevo';
                
                return (
                    <div key={cardId} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                        {/* Vista Desktop */}
                        <div className="hidden sm:block">
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        {presupuesto.tipo === 'nuevo' ? (
                                            <FileText className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600 flex-shrink-0" />
                                        ) : (
                                            <FileText className="h-4 w-4 lg:h-5 lg:w-5 text-amber-600 flex-shrink-0" />
                                        )}
                                        <h3 className="text-sm lg:text-base font-medium text-gray-900 truncate max-w-[200px] lg:max-w-xs">
                                            {presupuesto.nombre}
                                        </h3>
                                        <Badge variant="outline" className={`text-xs whitespace-nowrap ${
                                            presupuesto.tipo === 'nuevo' 
                                                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}>
                                            {presupuesto.tipo === 'nuevo' ? 'Nuevo' : 'Anterior'}
                                        </Badge>
                                        {presupuesto.tipo === 'nuevo' && (presupuesto as PresupuestoNuevo).estado && (
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeColor((presupuesto as PresupuestoNuevo).estado)}`}>
                                                {(presupuesto as PresupuestoNuevo).estado}
                                            </span>
                                        )}
                                        {presupuesto.tiene_pdf && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                PDF
                                            </span>
                                        )}
                                    </div>
                                    
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3 text-xs lg:text-sm">
                                        <div className="flex items-center text-gray-600">
                                            <Calendar className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2 text-gray-400 flex-shrink-0" />
                                            <span className="truncate">{presupuesto.fecha}</span>
                                        </div>
                                        
                                        {presupuesto.metadata.cantidad_vehiculos && (
                                            <div className="flex items-center text-gray-600">
                                                <Truck className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2 text-gray-400 flex-shrink-0" />
                                                <span>{presupuesto.metadata.cantidad_vehiculos} veh.</span>
                                            </div>
                                        )}

                                        {presupuesto.tipo === 'nuevo' && (presupuesto as PresupuestoNuevo).comercial && (
                                            <div className="flex items-center text-gray-600">
                                                <User className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2 text-gray-400 flex-shrink-0" />
                                                <span className="truncate">{(presupuesto as PresupuestoNuevo).comercial}</span>
                                            </div>
                                        )}

                                        {presupuesto.tipo === 'nuevo' && (presupuesto as PresupuestoNuevo).total > 0 && (
                                            <div className="flex items-center text-gray-900 font-medium">
                                                <Tag className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2 text-gray-400 flex-shrink-0" />
                                                <Amount value={(presupuesto as PresupuestoNuevo).total} className="text-xs lg:text-sm" />
                                            </div>
                                        )}
                                    </div>
                                    
                                    {presupuesto.metadata.descripcion && (
                                        <p className="mt-2 text-xs lg:text-sm text-gray-600 line-clamp-2">
                                            {presupuesto.metadata.descripcion}
                                        </p>
                                    )}

                                    {presupuesto.tipo === 'nuevo' && (presupuesto as PresupuestoNuevo).promocion && (
                                        <div className="mt-2">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                                Promo: {(presupuesto as PresupuestoNuevo).promocion}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                
                                {presupuesto.tiene_pdf && presupuesto.pdf_url && (
                                    <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                                        <button
                                            onClick={(e) => handleVerPdf(presupuesto, e)}
                                            className="inline-flex items-center px-2 lg:px-3 py-1.5 lg:py-2 border border-gray-300 shadow-sm text-xs lg:text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 justify-center"
                                        >
                                            <Eye className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                                            Ver
                                        </button>
                                        <button
                                            onClick={(e) => handleDescargarPdf(presupuesto, e)}
                                            disabled={generandoPDF === presupuesto.id}
                                            className="inline-flex items-center px-2 lg:px-3 py-1.5 lg:py-2 border border-gray-300 shadow-sm text-xs lg:text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {generandoPDF === presupuesto.id ? (
                                                <>
                                                    <Loader className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2 animate-spin" />
                                                    <span>Generando...</span>
                                                </>
                                            ) : (
                                                <>
                                                    <Download className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                                                    <span>Descargar</span>
                                                </>
                                            )}
                                        </button>
                                        
                                        {/* 🔥 BOTÓN SIEMPRE "GENERAR CONTRATO" Y NAVEGA AL SHOW */}
                                        {mostrarBotonAccion && (
                                            <button
                                                onClick={() => handleGenerarContrato(presupuesto.id)}
                                                className="inline-flex items-center px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm leading-4 font-medium rounded-md justify-center transition-colors bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                            >
                                                <FileSignature className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                                                <span>Ir a detalle</span>
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Vista Mobile - mantener igual */}
                        <div className="sm:hidden">
                            {/* ... contenido mobile ... (mismo código pero con el botón actualizado) */}
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    {presupuesto.tipo === 'nuevo' ? (
                                        <FileText className="h-4 w-4 text-blue-600 flex-shrink-0" />
                                    ) : (
                                        <FileText className="h-4 w-4 text-amber-600 flex-shrink-0" />
                                    )}
                                    <div>
                                        <h3 className="text-sm font-medium text-gray-900">
                                            {presupuesto.nombre}
                                        </h3>
                                        <p className="text-xs text-gray-500">{presupuesto.fecha}</p>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleMobileCard(cardId)}
                                    className="p-1 text-gray-400 hover:text-gray-600"
                                >
                                    {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                                </button>
                            </div>
                            
                            {isExpanded && (
                                <div className="mt-3 pt-3 border-t border-gray-100 space-y-3">
                                    {/* ... resto de información mobile ... */}
                                    <div className="flex gap-2">
                                        <button
                                            onClick={(e) => handleVerPdf(presupuesto, e)}
                                            className="flex-1 inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                                        >
                                            <Eye className="h-3 w-3 mr-1" />
                                            Ver
                                        </button>
                                        <button
                                            onClick={(e) => handleDescargarPdf(presupuesto, e)}
                                            disabled={generandoPDF === presupuesto.id}
                                            className="flex-1 inline-flex items-center justify-center px-3 py-1.5 border border-gray-300 shadow-sm text-xs font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                                        >
                                            {generandoPDF === presupuesto.id ? (
                                                <Loader className="h-3 w-3 animate-spin" />
                                            ) : (
                                                <Download className="h-3 w-3 mr-1" />
                                            )}
                                            Descargar
                                        </button>
                                        {mostrarBotonAccion && (
                                            <button
                                                onClick={() => handleGenerarContrato(presupuesto.id)}
                                                className="flex-1 inline-flex items-center justify-center px-3 py-1.5 text-xs font-medium rounded-md bg-blue-600 text-white hover:bg-blue-700"
                                            >
                                                <FileSignature className="h-3 w-3 mr-1" />
                                                Contrato
                                            </button>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Paginación */}
            {todosLosPresupuestos.length > ITEMS_PER_PAGE && (
                <div className="px-3 sm:px-4 py-3 border-t border-gray-200">
                    <Pagination
                        currentPage={currentPage}
                        lastPage={totalPages}
                        total={todosLosPresupuestos.length}
                        perPage={ITEMS_PER_PAGE}
                        onPageChange={handlePageChange}
                        useLinks={false}
                    />
                </div>
            )}
        </div>
    );
}