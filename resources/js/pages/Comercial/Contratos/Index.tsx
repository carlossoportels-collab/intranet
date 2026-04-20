// resources/js/Pages/Comercial/Contratos/Index.tsx
import { Link, router } from '@inertiajs/react';
import { FileText, Calendar, User, Building, Truck, Eye, Download, Edit, ChevronDown, ChevronUp, Filter, Tag, Loader } from 'lucide-react';
import React, { useState, useCallback } from 'react';

import { ContratoFilterBar } from '@/components/contratos/ContratoFilterBar';
import { Amount } from '@/components/ui/Amount';
import Pagination from '@/components/ui/Pagination';
import { StatusBadge } from '@/components/ui/StatusBadge';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/utils/formatters';
import { useToast } from '@/contexts/ToastContext';

interface Contrato {
    id: number;
    numero_contrato: string;
    cliente_nombre_completo: string;
    empresa_nombre_fantasia: string;
    presupuesto_cantidad_vehiculos: number;
    presupuesto_total_inversion: number;
    presupuesto_total_mensual: number;
    fecha_emision: string;
    tipo_operacion?: string;
    estado?: {
        id: number;
        nombre: string;
    };
    created: string;
}

interface Props {
    contratos: {
        data: Contrato[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        links: any[];
    };
    estadisticas: {
        total: number;
        activos: number;
        pendientes: number;
        instalados: number;
    };
    usuario: {
        ve_todas_cuentas: boolean;
        rol_id: number;
        nombre_completo?: string;
    };
    prefijosFiltro: Array<{ 
        id: string; 
        codigo: string; 
        descripcion: string; 
        comercial_nombre?: string;
        display_text: string;
    }>;
    prefijoUsuario?: {
        id: string;
        codigo: string;
        descripcion: string;
        comercial_nombre?: string;
        display_text: string;
    } | null;
    estados: Array<{ id: number; nombre: string }>;
}

export default function ContratosIndex({ 
    contratos, 
    estadisticas, 
    usuario,
    prefijosFiltro = [],
    prefijoUsuario = null,
    estados = []
}: Props) {
    const toast = useToast();
    const usuarioEsComercial = !usuario.ve_todas_cuentas;
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [expandedMobileCard, setExpandedMobileCard] = useState<number | null>(null);
    
    // Estados para el modal de PDF
    const [mostrarVistaPDF, setMostrarVistaPDF] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [generandoPDF, setGenerandoPDF] = useState<number | null>(null);
    const [contratoActual, setContratoActual] = useState<Contrato | null>(null);

    const [filters, setFilters] = useState(() => {
        const initialFilters: any = {
            estado_id: '',
            fecha_inicio: '',
            fecha_fin: '',
            search: ''
        };
        
        if (!usuarioEsComercial) {
            initialFilters.prefijo_id = '';
        } else if (prefijoUsuario?.id) {
            initialFilters.prefijo_id = prefijoUsuario.id;
        }
        
        return initialFilters;
    });

    // Función para generar PDF temporal
    const generarPDFTemporal = useCallback(async (contratoId: number): Promise<string | null> => {
        return new Promise((resolve) => {
            router.post(`/comercial/contratos/${contratoId}/generar-pdf-temp`, {}, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: (page: any) => {
                    const flash = page.props.flash as any;
                    const data = flash?.pdfData || page.props?.pdfData;
                    if (data?.success && data.url) {
                        resolve(data.url);
                    } else {
                        toast.error(data?.error || 'Error al generar PDF');
                        resolve(null);
                    }
                },
                onError: () => {
                    toast.error('Error al generar el PDF');
                    resolve(null);
                }
            });
        });
    }, [toast]);

    // Función para ver PDF en modal
    const handleVerPDF = useCallback(async (contrato: Contrato, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        setContratoActual(contrato);
        setMostrarVistaPDF(true);
        setGenerandoPDF(contrato.id);
        
        const url = await generarPDFTemporal(contrato.id);
        if (url) {
            setPdfUrl(url);
        }
        
        setGenerandoPDF(null);
    }, [generarPDFTemporal]);

    // Función para descargar PDF
    const handleDescargarPDF = useCallback(() => {
        if (contratoActual) {
            window.open(`/comercial/contratos/${contratoActual.id}/pdf?download=1`, '_blank');
        }
    }, [contratoActual]);

    const getEstadoColor = (estadoId?: number) => {
        switch(estadoId) {
            case 1: return 'green';
            case 2: return 'yellow';
            case 3: return 'blue';
            case 4: return 'red';
            case 5: return 'orange';
            case 6: return 'purple';
            default: return 'gray';
        }
    };

    const getEstadoNombre = (estadoId?: number) => {
        switch(estadoId) {
            case 1: return 'Activo';
            case 2: return 'Vencido';
            case 3: return 'Aprobado';
            case 4: return 'Rechazado';
            case 5: return 'Pendiente';
            case 6: return 'Instalado';
            default: return 'Sin estado';
        }
    };

    const getTipoOperacionBadge = (tipo?: string) => {
        switch(tipo) {
            case 'venta_cliente':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">Venta a Cliente</span>;
            case 'alta_nueva':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">Alta Nueva</span>;
            case 'cambio_titularidad':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 text-orange-800">Cambio Titularidad</span>;
            case 'cambio_razon_social':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Cambio Razón Social</span>;
            case 'cambio_smartsat':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-800">Cambio SmartSat</span>;
            default:
                return null;
        }
    };

    const handlePageChange = (page: number) => {
        router.get('/comercial/contratos', { 
            page,
            ...filters 
        }, { preserveState: true });
    };

    const handleFilterChange = (key: string, value: string) => {
        if (usuarioEsComercial && key === 'prefijo_id') return;
        
        const newFilters = { ...filters, [key]: value, page: 1 };
        setFilters(newFilters);
        router.get('/comercial/contratos', newFilters, { preserveState: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/comercial/contratos', { ...filters, page: 1 }, { preserveState: true });
    };

    const clearFilters = () => {
        const newFilters: any = { 
            estado_id: '', 
            fecha_inicio: '', 
            fecha_fin: '',
            search: ''
        };
        
        if (usuarioEsComercial && prefijoUsuario?.id) {
            newFilters.prefijo_id = prefijoUsuario.id;
        } else if (!usuarioEsComercial) {
            newFilters.prefijo_id = '';
        }
        
        setFilters(newFilters);
        router.get('/comercial/contratos', newFilters, { preserveState: true });
    };

    const hayFiltrosActivos = () => {
        let hasFilters = filters.estado_id || filters.fecha_inicio || filters.fecha_fin || filters.search;
        
        if (!usuarioEsComercial && filters.prefijo_id) {
            hasFilters = true;
        }
        
        return hasFilters;
    };

    const totalPrimerMes = (contrato: Contrato) => {
        return (contrato.presupuesto_total_inversion || 0) + (contrato.presupuesto_total_mensual || 0);
    };

    const toggleMobileCard = (id: number) => {
        setExpandedMobileCard(expandedMobileCard === id ? null : id);
    };

    return (
        <AppLayout title="Contratos">
            <div className="max-w-[95%] mx-auto px-4 sm:px-6 py-4 sm:py-6">
                {/* Header */}
                <div className="mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                Contratos
                            </h1>
                            <p className="mt-1 text-sm sm:text-base text-gray-600">
                                Gestión y seguimiento de contratos
                            </p>
                        </div>
                        
                        <button
                            type="button"
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                            className="sm:hidden inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            <Filter className="h-4 w-4 mr-2" />
                            {showMobileFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
                        </button>
                    </div>
                </div>
                
                {/* Stats Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total</h3>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{estadisticas.total}</p>
                    </div>
                    <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                        <h3 className="text-xs sm:text-sm font-medium text-green-700 mb-1">Activos</h3>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{estadisticas.activos}</p>
                    </div>
                    <div className="p-3 sm:p-4 bg-orange-50 rounded-lg border border-orange-200">
                        <h3 className="text-xs sm:text-sm font-medium text-orange-700 mb-1">Pendientes</h3>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-orange-600">{estadisticas.pendientes}</p>
                    </div>
                    <div className="p-3 sm:p-4 bg-purple-50 rounded-lg border border-purple-200">
                        <h3 className="text-xs sm:text-sm font-medium text-purple-700 mb-1">Instalados</h3>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-purple-600">{estadisticas.instalados}</p>
                    </div>
                </div>

                {/* Buscador */}
                <div className="mb-4 sm:mb-6">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => setFilters({...filters, search: e.target.value})}
                                placeholder="Buscar por contrato, cliente, empresa..."
                                className="w-full px-3 sm:px-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                            />
                        </div>
                        <button
                            type="submit"
                            className="w-full sm:w-auto px-4 py-2 bg-orange-600 text-white text-sm sm:text-base rounded-lg hover:bg-orange-700 transition-colors"
                        >
                            Buscar
                        </button>
                    </form>
                </div>

                {/* Filtros */}
                {(showMobileFilters || !window.matchMedia('(max-width: 640px)').matches) && (
                    <div className="mb-4 sm:mb-6">
                        <ContratoFilterBar
                            estadoValue={filters.estado_id || ''}
                            onEstadoChange={(value) => handleFilterChange('estado_id', value)}
                            prefijoValue={filters.prefijo_id || ''}
                            onPrefijoChange={(value) => handleFilterChange('prefijo_id', value)}
                            fechaInicio={filters.fecha_inicio || ''}
                            fechaFin={filters.fecha_fin || ''}
                            onFechaInicioChange={(value) => handleFilterChange('fecha_inicio', value)}
                            onFechaFinChange={(value) => handleFilterChange('fecha_fin', value)}
                            estados={estados}
                            prefijosFiltro={prefijosFiltro}
                            onClearFilters={clearFilters}
                            hayFiltrosActivos={hayFiltrosActivos()}
                            usuarioEsComercial={usuarioEsComercial}
                            prefijoUsuario={prefijoUsuario}
                        />
                    </div>
                )}
                
                {/* Listado de contratos */}
                {contratos.data.length > 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        {/* Vista Desktop - Tabla */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Contrato
                                        </th>
                                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Cliente
                                        </th>
                                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Empresa
                                        </th>
                                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Veh.
                                        </th>
                                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Fecha
                                        </th>
                                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total
                                        </th>
                                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tipo
                                        </th>
                                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {contratos.data.map((contrato) => (
                                        <tr key={contrato.id} className="hover:bg-gray-50">
                                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm font-medium text-gray-900">
                                                #{contrato.numero_contrato}
                                            </td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500">
                                                {contrato.cliente_nombre_completo}
                                            </td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500">
                                                {contrato.empresa_nombre_fantasia}
                                            </td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500">
                                                {contrato.presupuesto_cantidad_vehiculos}
                                            </td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500">
                                                {formatDate(contrato.fecha_emision)}
                                            </td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900 font-medium">
                                                <Amount value={totalPrimerMes(contrato)} />
                                            </td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                                                {getTipoOperacionBadge(contrato.tipo_operacion) || (
                                                    <span className="text-xs text-gray-400">No especificado</span>
                                                )}
                                            </td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={`/comercial/contratos/${contrato.id}`}
                                                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                                        title="Ver detalle"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                    <button
                                                        onClick={(e) => handleVerPDF(contrato, e)}
                                                        disabled={generandoPDF === contrato.id}
                                                        className="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        title="Ver PDF"
                                                    >
                                                        {generandoPDF === contrato.id ? (
                                                            <Loader className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <FileText className="h-4 w-4" />
                                                        )}
                                                    </button>
                                                    <button
                                                        onClick={() => window.open(`/comercial/contratos/${contrato.id}/pdf?download=1`, '_blank')}
                                                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                                                        title="Descargar PDF"
                                                    >
                                                        <Download className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Vista Mobile - Tarjetas */}
                        <div className="md:hidden divide-y divide-gray-200">
                            {contratos.data.map((contrato) => (
                                <div key={contrato.id} className="p-4 hover:bg-gray-50">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="text-sm font-medium text-gray-900">
                                                    #{contrato.numero_contrato}
                                                </span>
                                                {getTipoOperacionBadge(contrato.tipo_operacion)}
                                            </div>
                                            <p className="text-sm text-gray-600 font-medium">
                                                {contrato.cliente_nombre_completo}
                                            </p>
                                            <p className="text-xs text-gray-500">
                                                {contrato.empresa_nombre_fantasia}
                                            </p>
                                        </div>
                                        <button
                                            onClick={() => toggleMobileCard(contrato.id)}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            {expandedMobileCard === contrato.id ? (
                                                <ChevronUp className="h-5 w-5 text-gray-500" />
                                            ) : (
                                                <ChevronDown className="h-5 w-5 text-gray-500" />
                                            )}
                                        </button>
                                    </div>

                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2">
                                            <Truck className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600">{contrato.presupuesto_cantidad_vehiculos} veh.</span>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600">{formatDate(contrato.fecha_emision)}</span>
                                        </div>
                                        <Amount value={totalPrimerMes(contrato)} className="font-bold text-orange-600" />
                                    </div>

                                    {expandedMobileCard === contrato.id && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Inversión inicial</p>
                                                    <Amount value={contrato.presupuesto_total_inversion} className="text-sm font-medium text-blue-600" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Costo mensual</p>
                                                    <Amount value={contrato.presupuesto_total_mensual} className="text-sm font-medium text-green-600" />
                                                </div>
                                            </div>

                                            <div className="flex items-center gap-2">
                                                <Link
                                                    href={`/comercial/contratos/${contrato.id}`}
                                                    className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    Ver detalle
                                                </Link>
                                                <button
                                                    onClick={(e) => handleVerPDF(contrato, e)}
                                                    disabled={generandoPDF === contrato.id}
                                                    className="flex-1 px-3 py-2 bg-orange-50 text-orange-700 text-sm rounded-lg hover:bg-orange-100 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                                                >
                                                    {generandoPDF === contrato.id ? (
                                                        <>
                                                            <Loader className="h-4 w-4 animate-spin" />
                                                            Cargando...
                                                        </>
                                                    ) : (
                                                        <>
                                                            <FileText className="h-4 w-4" />
                                                            Ver PDF
                                                        </>
                                                    )}
                                                </button>
                                                <button
                                                    onClick={() => window.open(`/comercial/contratos/${contrato.id}/pdf?download=1`, '_blank')}
                                                    className="flex-1 px-3 py-2 bg-green-50 text-green-700 text-sm rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <Download className="h-4 w-4" />
                                                    Descargar
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {/* Paginación */}
                        {contratos.last_page > 1 && (
                            <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
                                <Pagination
                                    currentPage={contratos.current_page}
                                    lastPage={contratos.last_page}
                                    total={contratos.total}
                                    perPage={contratos.per_page}
                                    onPageChange={handlePageChange}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 text-center text-gray-500">
                        <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-base sm:text-lg font-medium">No hay contratos</p>
                        <p className="text-xs sm:text-sm">Los contratos generados aparecerán aquí</p>
                    </div>
                )}
            </div>

            {/* Vista PDF Modal - EXACTAMENTE IGUAL que en Show.tsx */}
            {mostrarVistaPDF && pdfUrl && contratoActual && (
                <>
                    <div className="fixed inset-0 bg-black/60 z-[99990]" onClick={() => setMostrarVistaPDF(false)} />
                    <div className="fixed inset-0 z-[99995] p-4 flex items-center justify-center pointer-events-none">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] pointer-events-auto flex flex-col">
                            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900">
                                    Vista Previa - Contrato {contratoActual.numero_contrato}
                                </h3>
                                <div className="flex gap-2">
                                    <button
                                        onClick={handleDescargarPDF}
                                        className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 text-sm"
                                    >
                                        <Download className="h-4 w-4" />
                                        Descargar
                                    </button>
                                    <button
                                        onClick={() => {
                                            setMostrarVistaPDF(false);
                                            setPdfUrl(null);
                                            setContratoActual(null);
                                        }}
                                        className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300"
                                    >
                                        Cerrar
                                    </button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto">
                                <iframe
                                    src={pdfUrl}
                                    className="w-full h-full"
                                    title={`Contrato ${contratoActual.numero_contrato}`}
                                />
                            </div>
                        </div>
                    </div>
                </>
            )}
        </AppLayout>
    );
}