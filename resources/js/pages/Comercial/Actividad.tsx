// resources/js/Pages/Comercial/Actividad.tsx
import { router } from '@inertiajs/react';
import { 
    Calendar, Users, FileText, FileSignature, 
    Filter, TrendingUp, UserPlus, Eye, RefreshCw, X
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { es } from 'date-fns/locale';

import AppLayout from '@/layouts/app-layout';
import Pagination from '@/components/ui/Pagination';
import FiltroFechasRapido from '@/components/ui/FiltroFechasRapido';

interface ActividadItem {
    id: number;
    fecha: string;
    fecha_formateada: string;
    tipo_entidad: 'LEAD' | 'PRESUPUESTO' | 'CONTRATO';
    nombre: string;
    estado?: string;
    estado_id?: number;
    tipo_operacion?: string;
    color_hex?: string;
    informacion: string;
    prefijo?: string;
    url: string;
}

interface EstadisticasData {
    contactos: {
        total: number;
        nuevos: number;
        por_estado: Array<{label: string; valor: number; color_hex: string}>;
    };
    presupuestos: {
        total: number;
        nuevos: number;
        por_estado: Array<{label: string; valor: number}>;
    };
    contratos: {
        total: number;
        nuevos: number;
        por_tipo_operacion: Array<{label: string; valor: number}>;
    };
}

interface Props {
    estadisticas: EstadisticasData;
    actividadReciente: ActividadItem[];
    comerciales: Array<{id: number; nombre: string; prefijo_id?: number}>;
    opcionesFechas: Array<{id: string; nombre: string}>;
    comercialActual: {id: number; nombre: string; prefijo_codigo?: string} | null;
    esComercial: boolean;
    filtros: {
        comercial_id: number | null;
        fecha_inicio: string | null;
        fecha_fin: string | null;
        rango_rapido: string | null;
    };
    pagination: {
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        from: number;
        to: number;
    };
    usuario: {
        rol_id: number;
        ve_todas_cuentas: boolean;
        es_comercial: boolean;
    };
}

// FUNCIÓN PARA COLORES DE LEADS - USA EL color_hex DE LA DB
const getLeadEstadoColor = (colorHex?: string): string => {
    if (!colorHex) return 'bg-gray-100 text-gray-800 border-gray-200';
    
    // Mapeo de colores hex a clases de Tailwind (según tu DB)
    const colorMap: Record<string, string> = {
        // Grises (Nuevo, Vencido, Sin Potencial, Históricos)
        '#6B7280': 'bg-gray-100 text-gray-800 border-gray-200',
        '#4B5563': 'bg-gray-100 text-gray-800 border-gray-200',
        '#9E9E9E': 'bg-gray-100 text-gray-800 border-gray-200',
        
        // Azules (Contactado, Recontactando)
        '#3B82F6': 'bg-blue-100 text-blue-800 border-blue-200',
        
        // Celestes / Cian (Seguimiento, Info Enviada)
        '#06B6D4': 'bg-cyan-100 text-cyan-800 border-cyan-200',
        
        // Morados (Propuesta Enviada, Reagendado)
        '#A855F7': 'bg-purple-100 text-purple-800 border-purple-200',
        '#8B5CF6': 'bg-purple-100 text-purple-800 border-purple-200',
        
        // Naranjas (Negociación)
        '#F97316': 'bg-orange-100 text-orange-800 border-orange-200',
        
        // Verdes (Aprobado, Ganado)
        '#10B981': 'bg-green-100 text-green-800 border-green-200',
        
        // Rojos (Perdido, Sin contactar)
        '#EF4444': 'bg-red-100 text-red-800 border-red-200',
        
        // Amarillos (Pausado)
        '#F59E0B': 'bg-yellow-100 text-yellow-800 border-yellow-200',
        
        // Marrón (Rechazo Definitivo)
        '#7C2D12': 'bg-amber-800 text-amber-100 border-amber-700',
    };
    
    return colorMap[colorHex] || 'bg-gray-100 text-gray-800 border-gray-200';
};

// COLORES PARA PRESUPUESTOS
const getEstadoColor = (estadoId?: number): string => {
    switch(estadoId) {
        case 1: return 'bg-green-100 text-green-800 border-green-200';
        case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 3: return 'bg-blue-100 text-blue-800 border-blue-200';
        case 4: return 'bg-red-100 text-red-800 border-red-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const getEstadoNombre = (estadoId?: number): string => {
    switch(estadoId) {
        case 1: return 'Activo';
        case 2: return 'Vencido';
        case 3: return 'Aprobado';
        case 4: return 'Rechazado';
        default: return 'Sin estado';
    }
};

// COLORES PARA CONTRATOS POR TIPO DE OPERACIÓN
const getTipoOperacionColor = (tipo?: string): string => {
    switch(tipo) {
        case 'venta_cliente': return 'bg-blue-100 text-blue-800 border-blue-200';
        case 'alta_nueva': return 'bg-green-100 text-green-800 border-green-200';
        case 'cambio_titularidad': return 'bg-orange-100 text-orange-800 border-orange-200';
        case 'cambio_razon_social': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        case 'cambio_smartsat': return 'bg-purple-100 text-purple-800 border-purple-200';
        default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
};

const getTipoOperacionNombre = (tipo?: string): string => {
    switch(tipo) {
        case 'venta_cliente': return 'Venta a Cliente';
        case 'alta_nueva': return 'Alta Nueva';
        case 'cambio_titularidad': return 'Cambio Titularidad';
        case 'cambio_razon_social': return 'Cambio Razón Social';
        case 'cambio_smartsat': return 'Cambio SmartSat';
        default: return 'Sin tipo';
    }
};

export default function ActividadComercial({ 
    estadisticas, 
    actividadReciente, 
    comerciales,
    opcionesFechas,
    comercialActual,
    esComercial,
    filtros,
    pagination,
    usuario 
}: Props) {
    const [comercialId, setComercialId] = useState<string>(filtros.comercial_id?.toString() || '');
    const [fechaInicio, setFechaInicio] = useState<Date | null>(filtros.fecha_inicio ? new Date(filtros.fecha_inicio) : null);
    const [fechaFin, setFechaFin] = useState<Date | null>(filtros.fecha_fin ? new Date(filtros.fecha_fin) : null);
    const [rangoRapido, setRangoRapido] = useState<string>(filtros.rango_rapido || '');
    const [cargando, setCargando] = useState(false);

    const aplicarFiltros = () => {
        setCargando(true);
        const params: Record<string, string> = {};
        
        if (comercialId && !esComercial) params.comercial_id = comercialId;
        if (rangoRapido) {
            params.rango_rapido = rangoRapido;
        } else {
            if (fechaInicio) params.fecha_inicio = fechaInicio.toISOString().split('T')[0];
            if (fechaFin) params.fecha_fin = fechaFin.toISOString().split('T')[0];
        }
        
        router.get('/comercial/actividad', params, {
            preserveState: true,
            preserveScroll: true,
            onFinish: () => setCargando(false)
        });
    };

    const limpiarFiltros = () => {
        setComercialId('');
        setFechaInicio(null);
        setFechaFin(null);
        setRangoRapido('');
        router.get('/comercial/actividad', {}, {
            preserveState: true,
            preserveScroll: true
        });
    };

    const handleRangoRapidoChange = (value: string) => {
        setRangoRapido(value);
        setFechaInicio(null);
        setFechaFin(null);
    };

    const getTipoIcono = (tipo: string) => {
        switch (tipo) {
            case 'LEAD': return <Users className="h-4 w-4" />;
            case 'PRESUPUESTO': return <FileText className="h-4 w-4" />;
            case 'CONTRATO': return <FileSignature className="h-4 w-4" />;
            default: return <Users className="h-4 w-4" />;
        }
    };

    const getTipoNombre = (tipo: string) => {
        switch (tipo) {
            case 'LEAD': return 'Lead';
            case 'PRESUPUESTO': return 'Presupuesto';
            case 'CONTRATO': return 'Contrato';
            default: return tipo;
        }
    };

    // Determinar título según rol
    const titulo = esComercial ? 'Mi Actividad Comercial' : 'Actividades Comerciales';
    const subtitulo = esComercial ? 'Gestión de tu actividad comercial' : 'Gestión y seguimiento de actividades comerciales';
useEffect(() => {
    // Guardar filtros actuales en sessionStorage cuando la página carga
    const currentParams = new URLSearchParams(window.location.search);
    const filtrosObj: Record<string, string> = {};
    currentParams.forEach((value, key) => {
        filtrosObj[key] = value;
    });
    
    sessionStorage.setItem('actividad_filters', JSON.stringify(filtrosObj));
    sessionStorage.setItem('actividad_filters_return_url', window.location.pathname + window.location.search);
}, [window.location.search]);
    return (
        <AppLayout title={titulo}>
            <div className="max-w-8xl mx-auto px-4 sm:px-6 py-6">
                <div className="mb-6">
                    <h1 className="text-3xl font-bold text-gray-900">
                        {titulo}
                    </h1>
                    <p className="mt-1 text-gray-600 text-base">
                        {subtitulo}
                    </p>
                </div>

                {/* Barra de filtros */}
                <div className="mb-6 p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                        {!esComercial && comerciales.length > 0 && (
                            <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                <select 
                                    className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:ring-sat focus:border-sat"
                                    value={comercialId}
                                    onChange={(e) => setComercialId(e.target.value)}
                                >
                                    <option value="">Todos los comerciales</option>
                                    {comerciales.map(comercial => (
                                        <option key={comercial.id} value={comercial.id}>
                                            {comercial.nombre}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        )}

                        <FiltroFechasRapido
                            opciones={opcionesFechas}
                            value={rangoRapido}
                            onChange={handleRangoRapidoChange}
                        />

                        {!rangoRapido && (
                            <div className="flex items-center gap-2">
                                <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                <DatePicker
                                    selected={fechaInicio}
                                    onChange={(date: Date | null) => setFechaInicio(date)}
                                    selectsStart
                                    startDate={fechaInicio || undefined}
                                    endDate={fechaFin || undefined}
                                    placeholderText="Fecha inicio"
                                    dateFormat="dd/MM/yyyy"
                                    className="text-sm border border-gray-300 rounded-md px-3 py-1.5 w-36 focus:ring-sat focus:border-sat"
                                    popperClassName="z-[100000]"
                                    locale={es}
                                />
                                <span className="text-gray-500">a</span>
                                <DatePicker
                                    selected={fechaFin}
                                    onChange={(date: Date | null) => setFechaFin(date)}
                                    selectsEnd
                                    startDate={fechaInicio || undefined}
                                    endDate={fechaFin || undefined}
                                    minDate={fechaInicio || undefined}
                                    placeholderText="Fecha fin"
                                    dateFormat="dd/MM/yyyy"
                                    className="text-sm border border-gray-300 rounded-md px-3 py-1.5 w-36 focus:ring-sat focus:border-sat"
                                    popperClassName="z-[100000]"
                                    locale={es}
                                />
                            </div>
                        )}

                        <div className="lg:ml-auto flex gap-2">
                            <button 
                                onClick={aplicarFiltros}
                                disabled={cargando}
                                className="px-4 py-1.5 text-sm font-medium text-white bg-sat rounded-md hover:bg-sat-600 disabled:opacity-50 flex items-center gap-2"
                            >
                                {cargando ? <RefreshCw className="h-4 w-4 animate-spin" /> : <Filter className="h-4 w-4" />}
                                Aplicar
                            </button>
                            <button 
                                onClick={limpiarFiltros}
                                className="px-4 py-1.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 flex items-center gap-1"
                            >
                                <X className="h-4 w-4" />
                                Limpiar
                            </button>
                        </div>
                    </div>
                </div>

                {/* Cards de estadísticas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
                    {/* Contactos Card */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-sat transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-base font-medium text-gray-700">Contactos</p>
                                <p className="text-3xl font-bold text-local mt-1">{estadisticas.contactos.total}</p>
                            </div>
                            <div className="h-12 w-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                <Users className="h-6 w-6 text-blue-600" />
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3 p-2 bg-gray-50 rounded">
                            <div className="flex items-center">
                                <UserPlus className="h-3 w-3 mr-1 text-green-600" />
                                <span className="text-sm text-gray-600">Nuevos (30 días):</span>
                            </div>
                            <span className="font-semibold text-green-700">{estadisticas.contactos.nuevos}</span>
                        </div>

                        <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-2">Por estado:</p>
                            <div className="flex flex-wrap gap-2">
                                {estadisticas.contactos.por_estado.map((estado, idx) => (
                                    <span key={idx} className={`px-2 py-1 rounded-full text-xs font-medium ${getLeadEstadoColor(estado.color_hex)}`}>
                                        {estado.label}: {estado.valor}
                                    </span>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Presupuestos Card */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-sat transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-base font-medium text-gray-700">Presupuestos</p>
                                <p className="text-3xl font-bold text-local mt-1">{estadisticas.presupuestos.total}</p>
                            </div>
                            <div className="h-12 w-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <FileText className="h-6 w-6 text-green-600" />
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3 p-2 bg-gray-50 rounded">
                            <div className="flex items-center">
                                <UserPlus className="h-3 w-3 mr-1 text-green-600" />
                                <span className="text-sm text-gray-600">Nuevos (30 días):</span>
                            </div>
                            <span className="font-semibold text-green-700">{estadisticas.presupuestos.nuevos}</span>
                        </div>

                        <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-2">Por estado:</p>
                            <div className="flex flex-wrap gap-2">
                                {estadisticas.presupuestos.por_estado.map((estado, idx) => {
                                    let estadoId = 0;
                                    if (estado.label === 'Activo') estadoId = 1;
                                    else if (estado.label === 'Vencido') estadoId = 2;
                                    else if (estado.label === 'Aprobado') estadoId = 3;
                                    else if (estado.label === 'Rechazado') estadoId = 4;
                                    return (
                                        <span key={idx} className={`px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(estadoId)}`}>
                                            {estado.label}: {estado.valor}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    {/* Contratos Card */}
                    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-sat transition-all">
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-base font-medium text-gray-700">Contratos</p>
                                <p className="text-3xl font-bold text-local mt-1">{estadisticas.contratos.total}</p>
                            </div>
                            <div className="h-12 w-12 bg-purple-100 rounded-lg flex items-center justify-center">
                                <FileSignature className="h-6 w-6 text-purple-600" />
                            </div>
                        </div>
                        
                        <div className="flex items-center justify-between mt-3 p-2 bg-gray-50 rounded">
                            <div className="flex items-center">
                                <UserPlus className="h-3 w-3 mr-1 text-green-600" />
                                <span className="text-sm text-gray-600">Nuevos (30 días):</span>
                            </div>
                            <span className="font-semibold text-green-700">{estadisticas.contratos.nuevos}</span>
                        </div>

                        <div className="mt-3">
                            <p className="text-xs text-gray-500 mb-2">Por tipo de operación:</p>
                            <div className="flex flex-wrap gap-2">
                                {estadisticas.contratos.por_tipo_operacion.map((tipo, idx) => {
                                    let tipoKey = '';
                                    if (tipo.label === 'Venta a Cliente') tipoKey = 'venta_cliente';
                                    else if (tipo.label === 'Alta Nueva') tipoKey = 'alta_nueva';
                                    else if (tipo.label === 'Cambio Titularidad') tipoKey = 'cambio_titularidad';
                                    else if (tipo.label === 'Cambio Razón Social') tipoKey = 'cambio_razon_social';
                                    else if (tipo.label === 'Cambio SmartSat') tipoKey = 'cambio_smartsat';
                                    return (
                                        <span key={idx} className={`px-2 py-1 rounded-full text-xs font-medium ${getTipoOperacionColor(tipoKey)}`}>
                                            {tipo.label}: {tipo.valor}
                                        </span>
                                    );
                                })}
                            </div>
                        </div>
                    </div>
                </div>

                {/* Última actividad */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="p-4 border-b border-gray-200">
                        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                            <div className="flex items-center">
                                <TrendingUp className="h-5 w-5 mr-2 text-gray-600" />
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Última actividad
                                </h2>
                            </div>
                            <div className="text-sm text-gray-500">
                                {pagination.total} registros encontrados
                            </div>
                        </div>
                    </div>
                    
                    <div className="p-4">
                        {actividadReciente.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                                No hay actividad para mostrar
                            </div>
                        ) : (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="w-full text-sm">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th className="py-3 px-4 text-left font-medium text-gray-700">Fecha</th>
                                                {!esComercial && (
                                                    <th className="py-3 px-4 text-left font-medium text-gray-700">Prefijo</th>
                                                )}
                                                <th className="py-3 px-4 text-left font-medium text-gray-700">Tipo</th>
                                                <th className="py-3 px-4 text-left font-medium text-gray-700">Nombre</th>
                                                <th className="py-3 px-4 text-left font-medium text-gray-700">Estado/Tipo</th>
                                                <th className="py-3 px-4 text-left font-medium text-gray-700">Información</th>
                                                <th className="py-3 px-4"></th>
                                            </tr>
                                        </thead>
                                        <tbody className="divide-y divide-gray-200">
                                            {actividadReciente.map((item, idx) => {
                                                let estadoClassName = '';
                                                let estadoTexto = '';
                                                
                                                if (item.tipo_entidad === 'LEAD') {
                                                    estadoClassName = getLeadEstadoColor(item.color_hex);
                                                    estadoTexto = item.estado || 'Sin estado';
                                                } else if (item.tipo_entidad === 'PRESUPUESTO') {
                                                    estadoClassName = getEstadoColor(item.estado_id);
                                                    estadoTexto = getEstadoNombre(item.estado_id);
                                                } else {
                                                    estadoClassName = getTipoOperacionColor(item.tipo_operacion);
                                                    estadoTexto = getTipoOperacionNombre(item.tipo_operacion);
                                                }
                                                
                                                return (
                                                    <tr key={`${item.tipo_entidad}-${item.id}-${idx}`} className="hover:bg-gray-50 transition-colors">
                                                        <td className="py-3 px-4 text-gray-600 whitespace-nowrap">
                                                            {item.fecha_formateada}
                                                        </td>
                                                        {!esComercial && (
                                                            <td className="py-3 px-4">
                                                                <span className="text-xs text-gray-400">{item.prefijo || '-'}</span>
                                                            </td>
                                                        )}
                                                        <td className="py-3 px-4">
                                                            <div className="flex items-center gap-2">
                                                                <span className="text-gray-500">{getTipoIcono(item.tipo_entidad)}</span>
                                                                <span className="text-gray-700">{getTipoNombre(item.tipo_entidad)}</span>
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <div className="font-medium text-gray-900">{item.nombre}</div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${estadoClassName}`}>
                                                                {estadoTexto}
                                                            </span>
                                                        </td>
                                                        <td className="py-3 px-4 text-gray-600">
                                                            <div className="max-w-md truncate" title={item.informacion}>
                                                                {item.informacion}
                                                            </div>
                                                        </td>
                                                        <td className="py-3 px-4">
                                                            <button 
                                                                onClick={() => router.visit(item.url)}
                                                                className="text-sat hover:text-sat-600 text-sm font-medium flex items-center gap-1"
                                                            >
                                                                <Eye className="h-3 w-3" />
                                                                Ver
                                                            </button>
                                                        </td>
                                                    </tr>
                                                );
                                            })}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Paginación */}
                                {pagination.last_page > 1 && (
                                    <div className="mt-6">
                                        <Pagination
                                            currentPage={pagination.current_page}
                                            lastPage={pagination.last_page}
                                            total={pagination.total}
                                            perPage={pagination.per_page}
                                            useLinks={false}
                                            onPageChange={(page) => {
                                                const params: Record<string, string> = {};
                                                if (comercialId && !esComercial) params.comercial_id = comercialId;
                                                if (rangoRapido) {
                                                    params.rango_rapido = rangoRapido;
                                                } else {
                                                    if (fechaInicio) params.fecha_inicio = fechaInicio?.toISOString().split('T')[0];
                                                    if (fechaFin) params.fecha_fin = fechaFin?.toISOString().split('T')[0];
                                                }
                                                params.page = page.toString();
                                                router.get('/comercial/actividad', params, { preserveState: true, preserveScroll: true });
                                            }}
                                        />
                                    </div>
                                )}
                            </>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}