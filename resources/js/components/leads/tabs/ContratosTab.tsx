// resources/js/components/leads/tabs/ContratosTab.tsx

import { router } from '@inertiajs/react';
import { FileText, Calendar, Eye, Download, User, Building, Loader, ChevronDown, ChevronUp, FileSignature, CreditCard } from 'lucide-react';
import React, { useState, useMemo, useEffect, useCallback } from 'react';

import { Amount } from '@/components/ui/Amount';
import { Badge } from '@/components/ui/badge';
import Pagination from '@/components/ui/Pagination';
import { useToast } from '@/contexts/ToastContext';
import { Lead } from '@/types/leads';
import { usePagination } from '@/hooks/usePagination';

// Tipos
interface ContratoNuevo {
    id: number;
    tipo: 'nuevo';
    numero_contrato: string;
    fecha_emision: string;
    fecha_original: string;
    estado: string;
    cliente_nombre: string;
    empresa_razon_social: string;
    total_mensual: number;
    total_inversion: number;
    cantidad_vehiculos: number;
    vendedor: string;
    tiene_pdf: boolean;
    pdf_url: string | null;
    metadata: {
        presupuesto_referencia?: string;
        promocion?: string;
        contacto_email?: string;
        contacto_telefono?: string;
    };
}

interface ContratoLegacy {
    id: number;
    tipo: 'legacy';
    numero_contrato: string;
    nombre_completo: string;
    razon_social: string;
    fecha: string;
    fecha_original: string;
    tiene_pdf: boolean;
    pdf_url: string | null;
    metadata: {
        lead_id: number;
    };
}

type ContratoUnificado = ContratoNuevo | ContratoLegacy;

interface Props {
    contratosNuevos: ContratoNuevo[];
    contratosLegacy: ContratoLegacy[];
    lead: Lead;
}

const ITEMS_PER_PAGE = 5;

export default function ContratosTab({ 
    contratosNuevos, 
    contratosLegacy,
    lead,
}: Props) {
    const [orden, setOrden] = useState<'reciente' | 'antiguo'>('reciente');
    const [generandoPDF, setGenerandoPDF] = useState<number | null>(null);
    const [expandedMobileCard, setExpandedMobileCard] = useState<string | null>(null);
    
    const toast = useToast();

    // Asegurarnos de que los arrays existan
    const nuevos = Array.isArray(contratosNuevos) ? contratosNuevos : [];
    const legacy = Array.isArray(contratosLegacy) ? contratosLegacy : [];

    // Combinar y ordenar contratos
    const todosLosContratos = useMemo(() => {
        const nuevosConTipo = nuevos.map(c => ({ ...c, tipo: 'nuevo' as const }));
        const legacyConTipo = legacy.map(c => ({ ...c, tipo: 'legacy' as const }));
        
        const contratos = [...nuevosConTipo, ...legacyConTipo];

        contratos.sort((a, b) => {
            const fechaA = new Date(a.fecha_original).getTime();
            const fechaB = new Date(b.fecha_original).getTime();
            return orden === 'reciente' ? fechaB - fechaA : fechaA - fechaB;
        });

        return contratos;
    }, [nuevos, legacy, orden]);

    // Usar el hook de paginación
    const {
        currentPage,
        totalPages,
        paginatedItems: paginatedContratos,
        goToPage
    } = usePagination({
        items: todosLosContratos,
        initialItemsPerPage: ITEMS_PER_PAGE
    });

    // Resetear a página 1 cuando cambia el orden
    useEffect(() => {
        goToPage(1);
    }, [orden]); // Solo depende de orden

    const handleVerPdf = useCallback((contrato: ContratoUnificado, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!contrato.tiene_pdf || !contrato.pdf_url) {
            toast.error('No hay PDF disponible');
            return;
        }
        
        window.open(contrato.pdf_url, '_blank');
    }, [toast]);

    const handleDescargarPdf = useCallback((contrato: ContratoUnificado, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!contrato.tiene_pdf || !contrato.pdf_url) {
            toast.error('No hay PDF disponible');
            return;
        }
        
        if (contrato.tipo === 'nuevo') {
            window.open(`${contrato.pdf_url}?download=1`, '_blank');
        } else {
            window.open(`/contratos-legacy/${contrato.id}/descargar`, '_blank');
        }
    }, [toast]);

    const handlePageChange = useCallback((page: number) => {
        goToPage(page);
        setTimeout(() => {
            document.getElementById('contratos-list')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }, [goToPage]);

    const toggleMobileCard = useCallback((id: string) => {
        setExpandedMobileCard(prev => prev === id ? null : id);
    }, []);

    const getBadgeColor = (estado?: string) => {
        const colores: Record<string, string> = {
            'Activo': 'bg-green-100 text-green-800 border-green-200',
            'Pendiente': 'bg-yellow-100 text-yellow-800 border-yellow-200',
            'Cancelado': 'bg-red-100 text-red-800 border-red-200',
            'Finalizado': 'bg-gray-100 text-gray-800 border-gray-200'
        };
        return colores[estado || ''] || 'bg-blue-100 text-blue-800 border-blue-200';
    };

    if (todosLosContratos.length === 0) {
        return (
            <div className="p-6 sm:p-8 text-center text-gray-500">
                <FileSignature className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-gray-400" />
                <p className="text-base sm:text-lg font-medium">No hay contratos</p>
                <p className="text-xs sm:text-sm">Este lead no tiene contratos asociados</p>
            </div>
        );
    }

    return (
        <div id="contratos-list" className="divide-y divide-gray-200">
            {/* Cabecera informativa y ordenamiento */}
            <div className="p-3 sm:p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm">
                        <span className="font-medium text-gray-700">Contratos:</span>
                        <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded-md whitespace-nowrap">
                            Nuevos: {nuevos.length}
                        </span>
                        <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-md whitespace-nowrap">
                            Anteriores: {legacy.length}
                        </span>
                        <span className="bg-gray-100 text-gray-800 px-2 py-1 rounded-md whitespace-nowrap">
                            Total: {todosLosContratos.length}
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

            {/* Lista de contratos */}
            {paginatedContratos.map((contrato) => {
                const cardId = `${contrato.tipo}-${contrato.id}`;
                const isExpanded = expandedMobileCard === cardId;
                
                return (
                    <div key={cardId} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                        {/* Vista Desktop */}
                        <div className="hidden sm:block">
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    {/* Header con tipo y badge */}
                                    <div className="flex items-center gap-2 mb-2 flex-wrap">
                                        {contrato.tipo === 'nuevo' ? (
                                            <FileSignature className="h-4 w-4 lg:h-5 lg:w-5 text-blue-600 flex-shrink-0" />
                                        ) : (
                                            <FileText className="h-4 w-4 lg:h-5 lg:w-5 text-amber-600 flex-shrink-0" />
                                        )}
                                        <h3 className="text-sm lg:text-base font-medium text-gray-900">
                                            {contrato.numero_contrato}
                                        </h3>
                                        <Badge variant="outline" className={`text-xs whitespace-nowrap ${
                                            contrato.tipo === 'nuevo' 
                                                ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                                : 'bg-amber-50 text-amber-700 border-amber-200'
                                        }`}>
                                            {contrato.tipo === 'nuevo' ? 'Nuevo' : 'Anterior'}
                                        </Badge>
                                        {contrato.tipo === 'nuevo' && (contrato as ContratoNuevo).estado && (
                                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeColor((contrato as ContratoNuevo).estado)}`}>
                                                {(contrato as ContratoNuevo).estado}
                                            </span>
                                        )}
                                        {contrato.tiene_pdf && (
                                            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                PDF
                                            </span>
                                        )}
                                    </div>
                                    
                                    {/* Detalles en grid */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 lg:gap-3 text-xs lg:text-sm">
                                        <div className="flex items-center text-gray-600">
                                            <Calendar className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2 text-gray-400 flex-shrink-0" />
                                            <span className="truncate">
                                                {contrato.tipo === 'nuevo' 
                                                    ? (contrato as ContratoNuevo).fecha_emision 
                                                    : (contrato as ContratoLegacy).fecha}
                                            </span>
                                        </div>
                                        
                                        {contrato.tipo === 'nuevo' ? (
                                            <>
                                                {(contrato as ContratoNuevo).cantidad_vehiculos > 0 && (
                                                    <div className="flex items-center text-gray-600">
                                                        <CreditCard className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2 text-gray-400 flex-shrink-0" />
                                                        <span>{(contrato as ContratoNuevo).cantidad_vehiculos} veh.</span>
                                                    </div>
                                                )}
                                                
                                                <div className="flex items-center text-gray-600">
                                                    <Building className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2 text-gray-400 flex-shrink-0" />
                                                    <span className="truncate">{(contrato as ContratoNuevo).empresa_razon_social}</span>
                                                </div>

                                                <div className="flex items-center text-gray-600">
                                                    <User className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2 text-gray-400 flex-shrink-0" />
                                                    <span className="truncate">{(contrato as ContratoNuevo).cliente_nombre}</span>
                                                </div>

                                                {(contrato as ContratoNuevo).total_mensual > 0 && (
                                                    <div className="flex items-center text-gray-900 font-medium">
                                                        <span className="mr-1">$</span>
                                                        <Amount value={(contrato as ContratoNuevo).total_mensual} className="text-xs lg:text-sm" />
                                                        <span className="text-gray-500 ml-1">/mes</span>
                                                    </div>
                                                )}
                                            </>
                                        ) : (
                                            <>
                                                <div className="flex items-center text-gray-600 col-span-2">
                                                    <User className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2 text-gray-400 flex-shrink-0" />
                                                    <span className="truncate">{(contrato as ContratoLegacy).nombre_completo}</span>
                                                </div>
                                                {(contrato as ContratoLegacy).razon_social && (
                                                    <div className="flex items-center text-gray-600">
                                                        <Building className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2 text-gray-400 flex-shrink-0" />
                                                        <span className="truncate">{(contrato as ContratoLegacy).razon_social}</span>
                                                    </div>
                                                )}
                                            </>
                                        )}
                                    </div>
                                    
                                    {/* Promoción */}
                                    {contrato.tipo === 'nuevo' && (contrato as ContratoNuevo).metadata.promocion && (
                                        <div className="mt-2">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                                Promo: {(contrato as ContratoNuevo).metadata.promocion}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Acciones */}
                                {contrato.tiene_pdf && contrato.pdf_url && (
                                    <div className="flex flex-col sm:flex-row gap-2 flex-shrink-0">
                                        <button
                                            onClick={(e) => handleVerPdf(contrato, e)}
                                            className="inline-flex items-center px-2 lg:px-3 py-1.5 lg:py-2 border border-gray-300 shadow-sm text-xs lg:text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 justify-center"
                                        >
                                            <Eye className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                                            Ver
                                        </button>
                                        <button
                                            onClick={(e) => handleDescargarPdf(contrato, e)}
                                            className="inline-flex items-center px-2 lg:px-3 py-1.5 lg:py-2 border border-gray-300 shadow-sm text-xs lg:text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 justify-center"
                                        >
                                            <Download className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                                            Descargar
                                        </button>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Vista Mobile */}
                        <div className="sm:hidden">
                            {/* Cabecera siempre visible */}
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                    {contrato.tipo === 'nuevo' ? (
                                        <FileSignature className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <FileText className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1 flex-wrap mb-1">
                                            <h3 className="text-sm font-medium text-gray-900">
                                                {contrato.numero_contrato}
                                            </h3>
                                            <Badge variant="outline" className={`text-xs px-1.5 py-0.5 ${
                                                contrato.tipo === 'nuevo' 
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                                {contrato.tipo === 'nuevo' ? 'Nuevo' : 'Anterior'}
                                            </Badge>
                                        </div>
                                        
                                        {/* Fecha siempre visible */}
                                        <div className="flex items-center text-xs text-gray-600">
                                            <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                                            <span>
                                                {contrato.tipo === 'nuevo' 
                                                    ? (contrato as ContratoNuevo).fecha_emision 
                                                    : (contrato as ContratoLegacy).fecha}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                                <button
                                    onClick={() => toggleMobileCard(cardId)}
                                    className="p-2 -m-2 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    {isExpanded ? (
                                        <ChevronUp className="h-5 w-5 text-gray-500" />
                                    ) : (
                                        <ChevronDown className="h-5 w-5 text-gray-500" />
                                    )}
                                </button>
                            </div>

                            {/* Badges resumen */}
                            <div className="flex flex-wrap gap-1 ml-7 mb-2">
                                {contrato.tipo === 'nuevo' && (contrato as ContratoNuevo).estado && (
                                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getBadgeColor((contrato as ContratoNuevo).estado)}`}>
                                        {(contrato as ContratoNuevo).estado}
                                    </span>
                                )}
                                {contrato.tiene_pdf && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                        PDF
                                    </span>
                                )}
                                {contrato.tipo === 'nuevo' && (contrato as ContratoNuevo).metadata.promocion && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                        Promo
                                    </span>
                                )}
                            </div>

                            {/* Detalles expandibles */}
                            {isExpanded && (
                                <div className="mt-3 pt-3 border-t border-gray-100 ml-7">
                                    {contrato.tipo === 'nuevo' ? (
                                        <>
                                            {(contrato as ContratoNuevo).empresa_razon_social && (
                                                <div className="flex items-center text-xs text-gray-600 mb-2">
                                                    <Building className="h-3 w-3 mr-2 text-gray-400" />
                                                    <span className="truncate">{(contrato as ContratoNuevo).empresa_razon_social}</span>
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center text-xs text-gray-600 mb-2">
                                                <User className="h-3 w-3 mr-2 text-gray-400" />
                                                <span className="truncate">{(contrato as ContratoNuevo).cliente_nombre}</span>
                                            </div>

                                            {(contrato as ContratoNuevo).cantidad_vehiculos > 0 && (
                                                <div className="flex items-center text-xs text-gray-600 mb-2">
                                                    <CreditCard className="h-3 w-3 mr-2 text-gray-400" />
                                                    <span>{(contrato as ContratoNuevo).cantidad_vehiculos} vehículo(s)</span>
                                                </div>
                                            )}

                                            {(contrato as ContratoNuevo).total_mensual > 0 && (
                                                <div className="flex items-center text-xs text-gray-900 font-medium mb-2">
                                                    <span className="mr-1">$</span>
                                                    <Amount value={(contrato as ContratoNuevo).total_mensual} className="text-xs" />
                                                    <span className="text-gray-500 ml-1">/mes</span>
                                                </div>
                                            )}

                                            {(contrato as ContratoNuevo).vendedor && (
                                                <div className="flex items-center text-xs text-gray-600 mb-2">
                                                    <span className="font-medium mr-1">Vendedor:</span>
                                                    <span>{(contrato as ContratoNuevo).vendedor}</span>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            <div className="flex items-center text-xs text-gray-600 mb-2">
                                                <User className="h-3 w-3 mr-2 text-gray-400" />
                                                <span>{(contrato as ContratoLegacy).nombre_completo}</span>
                                            </div>
                                            {(contrato as ContratoLegacy).razon_social && (
                                                <div className="flex items-center text-xs text-gray-600 mb-2">
                                                    <Building className="h-3 w-3 mr-2 text-gray-400" />
                                                    <span>{(contrato as ContratoLegacy).razon_social}</span>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* Acciones móvil */}
                                    {contrato.tiene_pdf && contrato.pdf_url && (
                                        <div className="grid grid-cols-2 gap-2 mt-3">
                                            <button
                                                onClick={(e) => handleVerPdf(contrato, e)}
                                                className="px-2 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 flex flex-col items-center"
                                            >
                                                <Eye className="h-4 w-4 mb-1" />
                                                Ver
                                            </button>
                                            <button
                                                onClick={(e) => handleDescargarPdf(contrato, e)}
                                                className="px-2 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 flex flex-col items-center"
                                            >
                                                <Download className="h-4 w-4 mb-1" />
                                                Descargar
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                );
            })}

            {/* Paginación */}
            {todosLosContratos.length > ITEMS_PER_PAGE && (
                <div className="px-3 sm:px-4 py-3 border-t border-gray-200">
                    <Pagination
                        currentPage={currentPage}
                        lastPage={totalPages}
                        total={todosLosContratos.length}
                        perPage={ITEMS_PER_PAGE}
                        onPageChange={handlePageChange}
                        useLinks={false}
                    />
                </div>
            )}
        </div>
    );
}