// resources/js/Pages/Comercial/Contratos/Index.tsx
import { Link, router, usePage } from '@inertiajs/react';
import { FileText, Calendar, Truck, Eye, Download, ChevronDown, ChevronUp, Filter, Loader, X } from 'lucide-react';
import React, { useState, useCallback, useEffect } from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

import { Amount } from '@/components/ui/Amount';
import Pagination from '@/components/ui/Pagination';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/utils/formatters';
import { useToast } from '@/contexts/ToastContext';
import FiltroFechasRapido from '@/components/ui/FiltroFechasRapido';

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
    };
    estadisticasPorTipo?: {
        venta_cliente: number;
        alta_nueva: number;
        cambio_titularidad: number;
        cambio_razon_social: number;
        cambio_smartsat: number;
        renovacion: number;
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
}

// Opciones para el filtro rápido de fechas
const opcionesFechasRapido = [
    { id: '', nombre: 'Todas las fechas' },
    { id: 'today', nombre: 'Hoy' },
    { id: 'yesterday', nombre: 'Ayer' },
    { id: 'last7days', nombre: 'Últimos 7 días' },
    { id: 'last30days', nombre: 'Últimos 30 días' },
    { id: 'thisMonth', nombre: 'Este mes' },
    { id: 'lastMonth', nombre: 'Mes pasado' },
    { id: 'custom', nombre: 'Personalizado' }
];

// Opciones para el filtro de tipo de operación
const tipoOperacionOptions = [
    { value: '', label: 'Todos los tipos' },
    { value: 'alta_nueva', label: 'Altas Nuevas' },
    { value: 'venta_cliente', label: 'Ventas a Cliente' },
    { value: 'renovacion', label: 'Renovaciones' },
    { value: 'cambio_titularidad', label: 'Cambio Titularidad' },
    { value: 'cambio_razon_social', label: 'Cambio Razón Social' },
    { value: 'cambio_smartsat', label: 'Cambio SmartSat' }
];

interface FiltersState {
    tipo_operacion: string;
    fecha_inicio: string;
    fecha_fin: string;
    search: string;
    fecha_rapida: string;
    prefijo_id?: string;
    page?: number;
}

const filtersToRecord = (filters: FiltersState): Record<string, string> => {
    const record: Record<string, string> = {};
    Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== '') {
            record[key] = String(value);
        }
    });
    return record;
};

export default function ContratosIndex({ 
    contratos, 
    estadisticas, 
    estadisticasPorTipo = {
        venta_cliente: 0,
        alta_nueva: 0,
        cambio_titularidad: 0,
        cambio_razon_social: 0,
        cambio_smartsat: 0,
        renovacion: 0
    },
    usuario,
    prefijosFiltro = [],
    prefijoUsuario = null
}: Props) {
    const toast = useToast();
    const usuarioEsComercial = !usuario.ve_todas_cuentas;
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [expandedMobileCard, setExpandedMobileCard] = useState<number | null>(null);
    
    const [mostrarVistaPDF, setMostrarVistaPDF] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [generandoPDF, setGenerandoPDF] = useState<number | null>(null);
    const [contratoActual, setContratoActual] = useState<Contrato | null>(null);

    const [filters, setFilters] = useState<FiltersState>(() => {
        const initialFilters: FiltersState = {
            tipo_operacion: '',
            fecha_inicio: '',
            fecha_fin: '',
            search: '',
            fecha_rapida: ''
        };
        
        if (!usuarioEsComercial) {
            initialFilters.prefijo_id = '';
        } else if (prefijoUsuario?.id) {
            initialFilters.prefijo_id = prefijoUsuario.id;
        }
        
        return initialFilters;
    });

    const tipoOperacionesConfig = [
        { key: 'alta_nueva', label: 'Altas Nuevas', color: '#059669', bgLight: '#ecfdf5', borderColor: '#d1fae5' },
        { key: 'venta_cliente', label: 'Ventas a Cliente', color: '#2563eb', bgLight: '#eff6ff', borderColor: '#bfdbfe' },
        { key: 'renovacion', label: 'Renovaciones', color: '#7c3aed', bgLight: '#f5f3ff', borderColor: '#e9d5ff' },
        { key: 'cambio_titularidad', label: 'Cambio Titularidad', color: '#ea580c', bgLight: '#fff7ed', borderColor: '#fed7aa' },
        { key: 'cambio_razon_social', label: 'Cambio Razón Social', color: '#ca8a04', bgLight: '#fefce8', borderColor: '#fef08a' },
        { key: 'cambio_smartsat', label: 'Cambio SmartSat', color: '#4f46e5', bgLight: '#eef2ff', borderColor: '#c7d2fe' }
    ];

    const handleFechaRapidaChange = (value: string, fechaInicio?: string, fechaFin?: string) => {
        const newFilters: FiltersState = { 
            ...filters, 
            fecha_rapida: value,
            fecha_inicio: fechaInicio || '',
            fecha_fin: fechaFin || '',
            page: 1 
        };
        setFilters(newFilters);
        router.get('/comercial/contratos', filtersToRecord(newFilters), { preserveState: true });
    };

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

    const handleDescargarPDF = useCallback(() => {
        if (contratoActual) {
            window.open(`/comercial/contratos/${contratoActual.id}/pdf?download=1`, '_blank');
        }
    }, [contratoActual]);

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
            case 'renovacion':
                return <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-indigo-100 text-indigo-800">Renovación</span>;
            default:
                return null;
        }
    };

    const handlePageChange = (page: number) => {
        const newFilters: FiltersState = { ...filters, page };
        router.get('/comercial/contratos', filtersToRecord(newFilters), { preserveState: true });
    };

    const handleFilterChange = (key: keyof FiltersState, value: string) => {
        if (usuarioEsComercial && key === 'prefijo_id') return;
        
        const newFilters: FiltersState = { ...filters, [key]: value, page: 1 };
        setFilters(newFilters);
        
        const filtrosObj = filtersToRecord(newFilters);
        sessionStorage.setItem('contratos_filters', JSON.stringify(filtrosObj));
        
        const queryString = new URLSearchParams(filtrosObj).toString();
        sessionStorage.setItem('contratos_filters_return_url', '/comercial/contratos' + (queryString ? `?${queryString}` : ''));
        
        router.get('/comercial/contratos', filtrosObj, { preserveState: true });
    };

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        const newFilters: FiltersState = { ...filters, page: 1 };
        router.get('/comercial/contratos', filtersToRecord(newFilters), { preserveState: true });
    };

    const clearFilters = () => {
        const newFilters: FiltersState = { 
            tipo_operacion: '',
            fecha_rapida: '',
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
        
        sessionStorage.removeItem('contratos_filters');
        sessionStorage.removeItem('contratos_filters_return_url');
        
        router.get('/comercial/contratos', filtersToRecord(newFilters), { preserveState: true });
    };

    const hayFiltrosActivos = (): boolean => {
        let hasFilters = !!filters.tipo_operacion || !!filters.fecha_inicio || !!filters.fecha_fin || !!filters.search;
        
        if (!usuarioEsComercial && filters.prefijo_id) {
            hasFilters = true;
        }
        
        return hasFilters;
    };

    const totalPrimerMes = (contrato: Contrato) => {
        const inversion = Number(contrato.presupuesto_total_inversion) || 0;
        const mensual = Number(contrato.presupuesto_total_mensual) || 0;
        return inversion + mensual;
    };

    const toggleMobileCard = (id: number) => {
        setExpandedMobileCard(expandedMobileCard === id ? null : id);
    };

    const { url } = usePage();

    useEffect(() => {
        const currentParams = new URLSearchParams(window.location.search);
        const filtrosObj: Record<string, string> = {};
        currentParams.forEach((value, key) => {
            filtrosObj[key] = value;
        });
        
        if (Object.keys(filtrosObj).length > 0) {
            sessionStorage.setItem('contratos_filters', JSON.stringify(filtrosObj));
        }
        sessionStorage.setItem('contratos_filters_return_url', window.location.pathname + window.location.search);
    }, [url]);

    return (
        <AppLayout title="Contratos">
            <div className="max-w-8xl mx-auto px-4 sm:px-6 py-6">
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
                
                <div className="mb-4 sm:mb-6">
                    <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
                        <h2 className="text-sm font-medium text-gray-700">
                            Distribución por tipo de operación
                        </h2>
                        <p className="text-xs text-gray-500">
                            Total: <span className="font-semibold text-gray-700">{estadisticas.total.toLocaleString('es-AR')}</span> contratos
                        </p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {tipoOperacionesConfig.map((tipo) => {
                            const valor = estadisticasPorTipo[tipo.key as keyof typeof estadisticasPorTipo] || 0;
                            const porcentaje = estadisticas.total > 0 ? ((valor / estadisticas.total) * 100).toFixed(1) : 0;
                            return (
                                <div 
                                    key={tipo.key}
                                    className="bg-white rounded-lg border p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-default"
                                    style={{ borderColor: tipo.borderColor, backgroundColor: tipo.bgLight }}
                                >
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium" style={{ color: tipo.color }}>
                                            {tipo.label}
                                        </span>
                                        <span className="text-xs text-gray-400">{porcentaje}%</span>
                                    </div>
                                    <p className="text-2xl font-bold mt-2" style={{ color: tipo.color }}>
                                        {valor.toLocaleString('es-AR')}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>

                <div className="mb-4 sm:mb-6">
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2 mb-3">
                        <div className="relative flex-1">
                            <input
                                type="text"
                                value={filters.search}
                                onChange={(e) => setFilters({ ...filters, search: e.target.value })}
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

                    {(showMobileFilters || (typeof window !== 'undefined' && window.innerWidth >= 640)) && (
                        <div className="flex flex-wrap items-center gap-3">
                            <FiltroFechasRapido
                                opciones={opcionesFechasRapido}
                                value={filters.fecha_rapida || ''}
                                onChange={handleFechaRapidaChange}
                                fechaInicio={filters.fecha_inicio}
                                fechaFin={filters.fecha_fin}
                            />

                            <select
                                value={filters.tipo_operacion}
                                onChange={(e) => handleFilterChange('tipo_operacion', e.target.value)}
                                className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                            >
                                {tipoOperacionOptions.map(opt => (
                                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                                ))}
                            </select>

                            {!usuarioEsComercial && prefijosFiltro.length > 0 && (
                                <select
                                    value={filters.prefijo_id || ''}
                                    onChange={(e) => handleFilterChange('prefijo_id', e.target.value)}
                                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                                >
                                    <option value="">Todos los prefijos</option>
                                    {prefijosFiltro.map(pref => (
                                        <option key={pref.id} value={pref.id}>{pref.display_text}</option>
                                    ))}
                                </select>
                            )}

                            {hayFiltrosActivos() && (
                                <button
                                    onClick={clearFilters}
                                    className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                                >
                                    <X className="h-4 w-4" />
                                    Limpiar
                                </button>
                            )}
                        </div>
                    )}
                </div>
                
                {contratos.data.length > 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contrato</th>
                                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cliente</th>
                                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Empresa</th>
                                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Veh.</th>
                                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Fecha</th>
                                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tipo</th>
                                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {contratos.data.map((contrato) => (
                                        <tr key={contrato.id} className="hover:bg-gray-50">
                                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm font-medium text-gray-900">#{contrato.numero_contrato}</td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500">{contrato.cliente_nombre_completo}</td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500">{contrato.empresa_nombre_fantasia}</td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500">{contrato.presupuesto_cantidad_vehiculos}</td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500">{formatDate(contrato.fecha_emision)}</td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900 font-medium"><Amount value={totalPrimerMes(contrato)} /></td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">{getTipoOperacionBadge(contrato.tipo_operacion) || <span className="text-xs text-gray-400">No especificado</span>}</td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <Link href={`/comercial/contratos/${contrato.id}`} className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"><Eye className="h-4 w-4" /></Link>
                                                    <button onClick={(e) => handleVerPDF(contrato, e)} disabled={generandoPDF === contrato.id} className="text-orange-600 hover:text-orange-900 p-1 rounded hover:bg-orange-50 transition-colors disabled:opacity-50">
                                                        {generandoPDF === contrato.id ? <Loader className="h-4 w-4 animate-spin" /> : <FileText className="h-4 w-4" />}
                                                    </button>
                                                    <button onClick={() => window.open(`/comercial/contratos/${contrato.id}/pdf?download=1`, '_blank')} className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"><Download className="h-4 w-4" /></button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="md:hidden divide-y divide-gray-200">
                            {contratos.data.map((contrato) => (
                                <div key={contrato.id} className="p-4 hover:bg-gray-50">
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1 flex-wrap">
                                                <span className="text-sm font-medium text-gray-900">#{contrato.numero_contrato}</span>
                                                {getTipoOperacionBadge(contrato.tipo_operacion)}
                                            </div>
                                            <p className="text-sm text-gray-600 font-medium">{contrato.cliente_nombre_completo}</p>
                                            <p className="text-xs text-gray-500">{contrato.empresa_nombre_fantasia}</p>
                                        </div>
                                        <button onClick={() => toggleMobileCard(contrato.id)} className="p-2 hover:bg-gray-100 rounded-lg">
                                            {expandedMobileCard === contrato.id ? <ChevronUp className="h-5 w-5 text-gray-500" /> : <ChevronDown className="h-5 w-5 text-gray-500" />}
                                        </button>
                                    </div>
                                    <div className="flex items-center justify-between text-sm">
                                        <div className="flex items-center gap-2"><Truck className="h-4 w-4 text-gray-400" /><span className="text-gray-600">{contrato.presupuesto_cantidad_vehiculos} veh.</span></div>
                                        <div className="flex items-center gap-2"><Calendar className="h-4 w-4 text-gray-400" /><span className="text-gray-600">{formatDate(contrato.fecha_emision)}</span></div>
                                        <Amount value={totalPrimerMes(contrato)} className="font-bold text-orange-600" />
                                    </div>
                                    {expandedMobileCard === contrato.id && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                <div><p className="text-xs text-gray-500 mb-1">Inversión inicial</p><Amount value={contrato.presupuesto_total_inversion} className="text-sm font-medium text-blue-600" /></div>
                                                <div><p className="text-xs text-gray-500 mb-1">Costo mensual</p><Amount value={contrato.presupuesto_total_mensual} className="text-sm font-medium text-green-600" /></div>
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <Link href={`/comercial/contratos/${contrato.id}`} className="flex-1 px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded-lg hover:bg-blue-100 flex items-center justify-center gap-2"><Eye className="h-4 w-4" /> Ver detalle</Link>
                                                <button onClick={(e) => handleVerPDF(contrato, e)} disabled={generandoPDF === contrato.id} className="flex-1 px-3 py-2 bg-orange-50 text-orange-700 text-sm rounded-lg hover:bg-orange-100 flex items-center justify-center gap-2 disabled:opacity-50">
                                                    {generandoPDF === contrato.id ? <><Loader className="h-4 w-4 animate-spin" /> Cargando...</> : <><FileText className="h-4 w-4" /> Ver PDF</>}
                                                </button>
                                                <button onClick={() => window.open(`/comercial/contratos/${contrato.id}/pdf?download=1`, '_blank')} className="flex-1 px-3 py-2 bg-green-50 text-green-700 text-sm rounded-lg hover:bg-green-100 flex items-center justify-center gap-2"><Download className="h-4 w-4" /> Descargar</button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
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

            {mostrarVistaPDF && pdfUrl && contratoActual && (
                <>
                    <div className="fixed inset-0 bg-black/60 z-[99990]" onClick={() => setMostrarVistaPDF(false)} />
                    <div className="fixed inset-0 z-[99995] p-4 flex items-center justify-center pointer-events-none">
                        <div className="bg-white rounded-lg shadow-xl w-full max-w-5xl h-[90vh] pointer-events-auto flex flex-col">
                            <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                                <h3 className="text-lg font-semibold text-gray-900">Vista Previa - Contrato {contratoActual.numero_contrato}</h3>
                                <div className="flex gap-2">
                                    <button onClick={handleDescargarPDF} className="px-3 py-1.5 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center gap-2 text-sm"><Download className="h-4 w-4" /> Descargar</button>
                                    <button onClick={() => { setMostrarVistaPDF(false); setPdfUrl(null); setContratoActual(null); }} className="px-3 py-1.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300">Cerrar</button>
                                </div>
                            </div>
                            <div className="flex-1 overflow-auto">
                                <iframe src={pdfUrl} className="w-full h-full" title={`Contrato ${contratoActual.numero_contrato}`} />
                            </div>
                        </div>
                    </div>
                </>
            )}
        </AppLayout>
    );
}