// resources/js/components/leads/tabs/PresupuestosUnificadosTab.tsx

import { router } from '@inertiajs/react';
import { FileText, Calendar, Truck, Eye, Download, Tag, User, Loader, Building, ChevronDown, ChevronUp, FileSignature } from 'lucide-react';
import React, { useState, useMemo, useEffect, useCallback } from 'react';

import { Amount } from '@/components/ui/Amount';
import { Badge } from '@/components/ui/badge';
import Pagination from '@/components/ui/Pagination';
import { useToast } from '@/contexts/ToastContext';
import { Lead, Origen, Rubro, Provincia } from '@/types/leads';
import AltaEmpresaModal from '@/components/empresa/AltaEmpresaModal';
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
    onAltaEmpresa: (presupuestoId: number, lead: Lead) => void;
}

const ITEMS_PER_PAGE = 5;

export default function PresupuestosUnificadosTab({ 
    presupuestosNuevos, 
    presupuestosLegacy,
    lead,
    origenes,
    rubros,
    provincias,
    onAltaEmpresa
}: Props) {
    const [orden, setOrden] = useState<'reciente' | 'antiguo'>('reciente');
    const [generandoPDF, setGenerandoPDF] = useState<number | null>(null);
    const [expandedMobileCard, setExpandedMobileCard] = useState<string | null>(null);
    
    // Estados para el flujo inteligente
    const [modalAltaEmpresaOpen, setModalAltaEmpresaOpen] = useState(false);
    const [presupuestoSeleccionado, setPresupuestoSeleccionado] = useState<number | null>(null);
    const [verificandoDatos, setVerificandoDatos] = useState(false);
    const [pasoInicialModal, setPasoInicialModal] = useState<number>(1);
    const [modoCompletar, setModoCompletar] = useState(false);
    
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
    }, [orden]); // Solo depende de orden

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
     * Maneja la acción principal del botón (Alta Empresa o Generar Contrato)
     */
    const handleAccionPrincipal = useCallback(async (presupuestoId: number) => {
        if (lead.es_cliente) {
            setVerificandoDatos(true);
            setGenerandoPDF(presupuestoId);
            
            try {
                const response = await fetch(`/comercial/leads/${lead.id}/verificar-datos-contrato`);
                const data = await response.json();
                
                if (!response.ok) {
                    throw new Error(data.error || 'Error al verificar datos');
                }
                
                if (data.todosCompletos) {
                    toast.success('Todos los datos están completos. Generando contrato...');
                    
                    setTimeout(() => {
                        window.location.href = `/comercial/contratos/create-from-lead/${presupuestoId}`;
                    }, 500);
                } else {
                    setPasoInicialModal(data.pasoAMostrar || 2);
                    setModoCompletar(true);
                    setPresupuestoSeleccionado(presupuestoId);
                    setModalAltaEmpresaOpen(true);
                    
                    toast.info('Complete los datos faltantes para generar el contrato');
                }
            } catch (error) {
                console.error('Error verificando datos:', error);
                toast.error('Error al verificar datos del cliente');
            } finally {
                setVerificandoDatos(false);
                setGenerandoPDF(null);
            }
        } else {
            setModoCompletar(false);
            setPasoInicialModal(1);
            onAltaEmpresa(presupuestoId, lead);
        }
    }, [lead, onAltaEmpresa, toast]);

    /**
     * Maneja el cierre del modal de alta empresa
     */
    const handleModalClose = useCallback((contratoGuardado?: boolean, irAContrato?: boolean) => {
        setModalAltaEmpresaOpen(false);
        setPresupuestoSeleccionado(null);
        setPasoInicialModal(1);
        setModoCompletar(false);
        
        if (contratoGuardado) {
            toast.success('Datos guardados correctamente');
            router.reload({ only: ['lead', 'presupuestos_nuevos', 'presupuestos_legacy'] });
        } else if (irAContrato && presupuestoSeleccionado) {
            router.visit(`/comercial/contratos/create-from-lead/${presupuestoSeleccionado}`);
        }
    }, [presupuestoSeleccionado, toast]);

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
                const estaCargando = verificandoDatos && generandoPDF === presupuesto.id;
                
                return (
                    <div key={cardId} className="p-3 sm:p-4 hover:bg-gray-50 transition-colors">
                        {/* Vista Desktop */}
                        <div className="hidden sm:block">
                            <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                <div className="flex-1 min-w-0">
                                    {/* Header con tipo y badge */}
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
                                    
                                    {/* Detalles en grid */}
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
                                    
                                    {/* Descripción */}
                                    {presupuesto.metadata.descripcion && (
                                        <p className="mt-2 text-xs lg:text-sm text-gray-600 line-clamp-2">
                                            {presupuesto.metadata.descripcion}
                                        </p>
                                    )}

                                    {/* Promoción */}
                                    {presupuesto.tipo === 'nuevo' && (presupuesto as PresupuestoNuevo).promocion && (
                                        <div className="mt-2">
                                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                                Promo: {(presupuesto as PresupuestoNuevo).promocion}
                                            </span>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Acciones */}
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
                                            {generandoPDF === presupuesto.id && !verificandoDatos ? (
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
                                        
                                        {/* Botón dinámico */}
                                        {mostrarBotonAccion && (
                                            <button
                                                onClick={() => handleAccionPrincipal(presupuesto.id)}
                                                disabled={estaCargando}
                                                className={`inline-flex items-center px-2 lg:px-3 py-1.5 lg:py-2 text-xs lg:text-sm leading-4 font-medium rounded-md justify-center transition-colors ${
                                                    lead.es_cliente
                                                        ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-2 focus:ring-offset-2 focus:ring-blue-500'
                                                        : 'bg-green-600 text-white hover:bg-green-700 focus:ring-2 focus:ring-offset-2 focus:ring-green-500'
                                                } disabled:opacity-50 disabled:cursor-not-allowed`}
                                            >
                                                {estaCargando ? (
                                                    <>
                                                        <Loader className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2 animate-spin" />
                                                        <span>Verificando...</span>
                                                    </>
                                                ) : lead.es_cliente ? (
                                                    <>
                                                        <FileSignature className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                                                        <span>Generar Contrato</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Building className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                                                        <span>Alta Empresa</span>
                                                    </>
                                                )}
                                            </button>
                                        )}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Vista Mobile */}
                        <div className="sm:hidden">
                            {/* Cabecera siempre visible */}
                            <div className="flex items-start justify-between mb-2">
                                <div className="flex items-start gap-2 flex-1 min-w-0">
                                    {presupuesto.tipo === 'nuevo' ? (
                                        <FileText className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                    ) : (
                                        <FileText className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-1 flex-wrap mb-1">
                                            <h3 className="text-sm font-medium text-gray-900 truncate max-w-[150px]">
                                                {presupuesto.nombre}
                                            </h3>
                                            <Badge variant="outline" className={`text-xs px-1.5 py-0.5 ${
                                                presupuesto.tipo === 'nuevo' 
                                                    ? 'bg-blue-50 text-blue-700 border-blue-200' 
                                                    : 'bg-amber-50 text-amber-700 border-amber-200'
                                            }`}>
                                                {presupuesto.tipo === 'nuevo' ? 'Nuevo' : 'Anterior'}
                                            </Badge>
                                        </div>
                                        
                                        {/* Fecha siempre visible */}
                                        <div className="flex items-center text-xs text-gray-600">
                                            <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                                            <span>{presupuesto.fecha}</span>
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
                                {presupuesto.tipo === 'nuevo' && (presupuesto as PresupuestoNuevo).promocion && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800 border border-purple-200">
                                        Promo
                                    </span>
                                )}
                            </div>

                            {/* Detalles expandibles */}
                            {isExpanded && (
                                <div className="mt-3 pt-3 border-t border-gray-100 ml-7">
                                    {/* Vehículos */}
                                    {presupuesto.metadata.cantidad_vehiculos && (
                                        <div className="flex items-center text-xs text-gray-600 mb-2">
                                            <Truck className="h-3 w-3 mr-2 text-gray-400" />
                                            <span>{presupuesto.metadata.cantidad_vehiculos} vehículo(s)</span>
                                        </div>
                                    )}

                                    {/* Comercial */}
                                    {presupuesto.tipo === 'nuevo' && (presupuesto as PresupuestoNuevo).comercial && (
                                        <div className="flex items-center text-xs text-gray-600 mb-2">
                                            <User className="h-3 w-3 mr-2 text-gray-400" />
                                            <span className="truncate">{(presupuesto as PresupuestoNuevo).comercial}</span>
                                        </div>
                                    )}

                                    {/* Total */}
                                    {presupuesto.tipo === 'nuevo' && (presupuesto as PresupuestoNuevo).total > 0 && (
                                        <div className="flex items-center text-xs text-gray-900 font-medium mb-2">
                                            <Tag className="h-3 w-3 mr-2 text-gray-400" />
                                            <Amount value={(presupuesto as PresupuestoNuevo).total} className="text-xs" />
                                        </div>
                                    )}

                                    {/* Descripción */}
                                    {presupuesto.metadata.descripcion && (
                                        <p className="text-xs text-gray-600 mb-3">
                                            {presupuesto.metadata.descripcion}
                                        </p>
                                    )}

                                    {/* Acciones móvil */}
                                    {presupuesto.tiene_pdf && presupuesto.pdf_url && (
                                        <div className="grid grid-cols-3 gap-2 mt-3">
                                            <button
                                                onClick={(e) => handleVerPdf(presupuesto, e)}
                                                className="px-2 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 flex flex-col items-center"
                                            >
                                                <Eye className="h-4 w-4 mb-1" />
                                                Ver
                                            </button>
                                            <button
                                                onClick={(e) => handleDescargarPdf(presupuesto, e)}
                                                disabled={generandoPDF === presupuesto.id}
                                                className="px-2 py-2 bg-white border border-gray-300 rounded-md text-xs font-medium text-gray-700 hover:bg-gray-50 flex flex-col items-center disabled:opacity-50"
                                            >
                                                {generandoPDF === presupuesto.id && !verificandoDatos ? (
                                                    <>
                                                        <Loader className="h-4 w-4 mb-1 animate-spin" />
                                                        <span>Gen.</span>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Download className="h-4 w-4 mb-1" />
                                                        <span>Desc.</span>
                                                    </>
                                                )}
                                            </button>
                                            
                                            {/* Botón dinámico en móvil */}
                                            {mostrarBotonAccion && (
                                                <button
                                                    onClick={() => handleAccionPrincipal(presupuesto.id)}
                                                    disabled={estaCargando}
                                                    className={`px-2 py-2 text-white rounded-md text-xs font-medium flex flex-col items-center ${
                                                        lead.es_cliente
                                                            ? 'bg-blue-600 hover:bg-blue-700'
                                                            : 'bg-green-600 hover:bg-green-700'
                                                    } disabled:opacity-50`}
                                                >
                                                    {estaCargando ? (
                                                        <>
                                                            <Loader className="h-4 w-4 mb-1 animate-spin" />
                                                            <span>Verif.</span>
                                                        </>
                                                    ) : lead.es_cliente ? (
                                                        <>
                                                            <FileSignature className="h-4 w-4 mb-1" />
                                                            <span>Contrato</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Building className="h-4 w-4 mb-1" />
                                                            <span>Alta</span>
                                                        </>
                                                    )}
                                                </button>
                                            )}
                                        </div>
                                    )}
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

            {/* Modal de Alta Empresa */}
            <AltaEmpresaModal
                isOpen={modalAltaEmpresaOpen}
                onClose={handleModalClose}
                presupuestoId={presupuestoSeleccionado}
                lead={lead}
                origenes={origenes}
                rubros={rubros}
                provincias={provincias}
                pasoInicial={pasoInicialModal}
                esCliente={lead.es_cliente}
                modoCompletar={modoCompletar}
            />
        </div>
    );
}