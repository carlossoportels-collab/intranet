// resources/js/Pages/Comercial/Presupuestos/Index.tsx
import { Link, router } from '@inertiajs/react';
import { Gift, Eye, Edit, FileText, ChevronDown, ChevronUp, Filter, Calendar, Truck, DollarSign, User } from 'lucide-react';
import React, { useState } from 'react';

import { PresupuestoFilterBar } from '@/components/presupuestos/PresupuestoFilterBar';
import Pagination from '@/components/ui/Pagination';
import AppLayout from '@/layouts/app-layout';

interface Presupuesto {
    id: number;
    referencia: string;
    cantidad_vehiculos: number;
    total_presupuesto: number;
    created: string;
    validez: string;
    lead: {
        id: number;
        nombre_completo: string;
        email: string;
        telefono?: string;
    } | null; // Puede ser null
    prefijo?: {
        id: number;
        codigo: string;
        descripcion: string;
    };
    estado?: {
        id: number;
        nombre: string;
    };
    promocion?: {
        id: number;
        nombre: string;
    } | null;
}

interface Props {
    presupuestos: {
        data: Presupuesto[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        links: any[];
    };
    estadisticas: {
        total: number;
        activos: number;
        vencidos: number; 
        aprobados: number;
        rechazados: number;
    };
    usuario: {
        ve_todas_cuentas: boolean;
        rol_id: number;
        nombre_completo?: string;
        prefijos_asignados?: number[];
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
    promociones: Array<{ id: number; nombre: string }>;
}

export default function PresupuestosIndex({ 
    presupuestos, 
    estadisticas, 
    usuario,
    prefijosFiltro = [],
    prefijoUsuario = null,
    estados = [],
    promociones = []
}: Props) {
    const usuarioEsComercial = usuario.rol_id === 5;
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [expandedMobileCard, setExpandedMobileCard] = useState<number | null>(null);
    
    const [filters, setFilters] = useState(() => {
        const initialFilters: any = {
            estado_id: '',
            promocion_id: '',
            fecha_inicio: '',
            fecha_fin: ''
        };
        
        // Solo agregar prefijo_id si NO es comercial
        if (!usuarioEsComercial) {
            initialFilters.prefijo_id = '';
        }
        
        return initialFilters;
    });

    const formatMoney = (value: any) => {
        const num = typeof value === 'string' ? parseFloat(value) : value;
        if (isNaN(num)) return '$ 0,00';
        return '$ ' + num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getEstadoColor = (estadoId?: number) => {
        switch(estadoId) {
            case 1: return 'bg-green-100 text-green-800 border-green-200';
            case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
            case 3: return 'bg-blue-100 text-blue-800 border-blue-200';
            case 4: return 'bg-red-100 text-red-800 border-red-200';
            default: return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getEstadoNombre = (estadoId?: number) => {
        switch(estadoId) {
            case 1: return 'Activo';
            case 2: return 'Vencido';
            case 3: return 'Aprobado';
            case 4: return 'Rechazado';
            default: return 'Sin estado';
        }
    };

    const handlePageChange = (page: number) => {
        router.get('/comercial/presupuestos', { 
            page,
            ...filters 
        }, { preserveState: true });
    };

    const handleFilterChange = (key: string, value: string) => {
        // Si es comercial, ignorar cambios en prefijo_id
        if (usuarioEsComercial && key === 'prefijo_id') {
            return;
        }
        
        const newFilters = { ...filters, [key]: value, page: 1 };
        setFilters(newFilters);
        router.get('/comercial/presupuestos', newFilters, { preserveState: true });
    };

    const clearFilters = () => {
        const newFilters: any = { 
            estado_id: '', 
            promocion_id: '', 
            fecha_inicio: '', 
            fecha_fin: '' 
        };
        
        // Solo incluir prefijo_id si NO es comercial
        if (!usuarioEsComercial) {
            newFilters.prefijo_id = '';
        }
        
        setFilters(newFilters);
        router.get('/comercial/presupuestos', newFilters, { preserveState: true });
    };

    const hayFiltrosActivos = () => {
        if (usuarioEsComercial) {
            return filters.estado_id || filters.promocion_id || filters.fecha_inicio || filters.fecha_fin;
        }
        return filters.estado_id || filters.prefijo_id || filters.promocion_id || filters.fecha_inicio || filters.fecha_fin;
    };

    const handleVerPDF = (presupuestoId: number) => {
        window.open(`/comercial/presupuestos/${presupuestoId}/pdf`, '_blank');
    };

    // ✅ Nueva función para navegar al lead
    const handleVerLead = (leadId?: number) => {
        if (leadId) {
            router.visit(`/comercial/leads/${leadId}`);
        }
    };

    const toggleMobileCard = (id: number) => {
        setExpandedMobileCard(expandedMobileCard === id ? null : id);
    };

    // Función para obtener nombre del lead de forma segura
    const getLeadNombre = (lead: Presupuesto['lead']) => {
        return lead?.nombre_completo || 'Lead eliminado';
    };

    // Función para obtener email del lead de forma segura
    const getLeadEmail = (lead: Presupuesto['lead']) => {
        return lead?.email || 'Email no disponible';
    };

    // Función para obtener teléfono del lead de forma segura
    const getLeadTelefono = (lead: Presupuesto['lead']) => {
        return lead?.telefono || 'Teléfono no disponible';
    };

    return (
        <AppLayout title="Presupuestos">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                {/* Header */}
                <div className="mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                Presupuestos
                            </h1>
                            <p className="mt-1 text-sm sm:text-base text-gray-600">
                                Gestión y seguimiento de presupuestos
                            </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2">
                            {/* Mobile filter toggle */}
                            <button
                                type="button"
                                onClick={() => setShowMobileFilters(!showMobileFilters)}
                                className="sm:hidden inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                            >
                                <Filter className="h-4 w-4 mr-2" />
                                {showMobileFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
                            </button>
                            
                            <Link
                                href="/comercial/prospectos"
                                className="inline-flex items-center justify-center px-4 py-2 bg-local text-white text-sm rounded-lg hover:bg-local-600 transition-colors whitespace-nowrap"
                            >
                                Ir a Prospectos
                            </Link>
                        </div>
                    </div>
                </div>
                
                {/* Stats Cards - Responsive */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4 mb-4 sm:mb-6">
                    <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                        <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total</h3>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{estadisticas.total}</p>
                    </div>
                    <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                        <h3 className="text-xs sm:text-sm font-medium text-green-700 mb-1">Activos</h3>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{estadisticas.activos}</p>
                    </div>
                    <div className="p-3 sm:p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                        <h3 className="text-xs sm:text-sm font-medium text-yellow-700 mb-1">Vencidos</h3>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-yellow-600">{estadisticas.vencidos}</p>
                    </div>
                    <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <h3 className="text-xs sm:text-sm font-medium text-blue-700 mb-1">Aprobados</h3>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{estadisticas.aprobados}</p>
                    </div>
                    <div className="p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200 col-span-2 lg:col-span-1">
                        <h3 className="text-xs sm:text-sm font-medium text-red-700 mb-1">Rechazados</h3>
                        <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">{estadisticas.rechazados}</p>
                    </div>
                </div>

                {/* Filtros - Mobile conditional */}
                {(showMobileFilters || !window.matchMedia('(max-width: 640px)').matches) && (
                    <div className="mb-4 sm:mb-6">
                        <PresupuestoFilterBar
                            estadoValue={filters.estado_id || ''}
                            onEstadoChange={(value) => handleFilterChange('estado_id', value)}
                            prefijoValue={filters.prefijo_id || ''}
                            onPrefijoChange={(value) => handleFilterChange('prefijo_id', value)}
                            promocionValue={filters.promocion_id || ''}
                            onPromocionChange={(value) => handleFilterChange('promocion_id', value)}
                            fechaInicio={filters.fecha_inicio || ''}
                            fechaFin={filters.fecha_fin || ''}
                            onFechaInicioChange={(value) => handleFilterChange('fecha_inicio', value)}
                            onFechaFinChange={(value) => handleFilterChange('fecha_fin', value)}
                            estados={estados}
                            prefijosFiltro={prefijosFiltro}
                            promociones={promociones}
                            onClearFilters={clearFilters}
                            hayFiltrosActivos={hayFiltrosActivos()}
                            usuarioEsComercial={usuarioEsComercial}
                            prefijoUsuario={prefijoUsuario}
                        />
                    </div>
                )}
                
                {/* Listado de presupuestos */}
                {presupuestos.data.length > 0 ? (
                    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                        {/* Vista Desktop - Tabla */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Referencia
                                        </th>
                                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Cliente
                                        </th>
                                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Veh.
                                        </th>
                                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Fecha
                                        </th>
                                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Validez
                                        </th>
                                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Total
                                        </th>
                                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Estado
                                        </th>
                                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Promo
                                        </th>
                                        <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {presupuestos.data.map((presupuesto) => (
                                        <tr key={presupuesto.id} className="hover:bg-gray-50">
                                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm font-medium text-gray-900">
                                                {presupuesto.referencia}
                                            </td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500">
                                                {getLeadNombre(presupuesto.lead)}
                                            </td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500">
                                                {presupuesto.cantidad_vehiculos}
                                            </td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500">
                                                {formatDate(presupuesto.created)}
                                            </td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500">
                                                {formatDate(presupuesto.validez)}
                                            </td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-900 font-medium">
                                                {formatMoney(presupuesto.total_presupuesto)}
                                            </td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                                                <span className={`px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full ${getEstadoColor(presupuesto.estado?.id)}`}>
                                                    {getEstadoNombre(presupuesto.estado?.id)}
                                                </span>
                                            </td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                                                {presupuesto.promocion ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs border border-purple-200">
                                                        <Gift className="h-3 w-3" />
                                                        <span className="hidden lg:inline">{presupuesto.promocion.nombre}</span>
                                                        <span className="lg:hidden">✓</span>
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">-</span>
                                                )}
                                            </td>
                                            <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500">
                                                <div className="flex items-center gap-2">
                                                    <Link
                                                        href={`/comercial/presupuestos/${presupuesto.id}`}
                                                        className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50 transition-colors"
                                                        title="Ver detalle"
                                                    >
                                                        <Eye className="h-4 w-4" />
                                                    </Link>
                                                    <Link
                                                        href={`/comercial/presupuestos/${presupuesto.id}/edit`}
                                                        className="text-green-600 hover:text-green-900 p-1 rounded hover:bg-green-50 transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </Link>
                                                    <button
                                                        onClick={() => handleVerPDF(presupuesto.id)}
                                                        className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                                        title="Ver PDF"
                                                    >
                                                        <FileText className="h-4 w-4" />
                                                    </button>
                                                                                                        {/* ✅ Nuevo botón para ver lead */}
                                                    {presupuesto.lead && (
                                                        <button
                                                            onClick={() => handleVerLead(presupuesto.lead?.id)}
                                                            className="text-purple-600 hover:text-purple-900 p-1 rounded hover:bg-purple-50 transition-colors"
                                                            title="Ver lead asociado"
                                                        >
                                                            <User className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Vista Mobile - Tarjetas */}
                        <div className="md:hidden divide-y divide-gray-200">
                            {presupuestos.data.map((presupuesto) => (
                                <div key={presupuesto.id} className="p-4 hover:bg-gray-50">
                                    {/* Cabecera de la tarjeta - siempre visible */}
                                    <div className="flex items-start justify-between mb-2">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="text-sm font-medium text-gray-900">
                                                    {presupuesto.referencia}
                                                </span>
                                                <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${getEstadoColor(presupuesto.estado?.id)}`}>
                                                    {getEstadoNombre(presupuesto.estado?.id)}
                                                </span>
                                            </div>
                                            <p className="text-sm text-gray-600 font-medium">
                                                {getLeadNombre(presupuesto.lead)}
                                            </p>
                                            {presupuesto.promocion && (
                                                <span className="inline-flex items-center gap-1 mt-1 px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs">
                                                    <Gift className="h-3 w-3" />
                                                    {presupuesto.promocion.nombre}
                                                </span>
                                            )}
                                        </div>
                                        <button
                                            onClick={() => toggleMobileCard(presupuesto.id)}
                                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                        >
                                            {expandedMobileCard === presupuesto.id ? (
                                                <ChevronUp className="h-5 w-5 text-gray-500" />
                                            ) : (
                                                <ChevronDown className="h-5 w-5 text-gray-500" />
                                            )}
                                        </button>
                                    </div>

                                    {/* Información resumida siempre visible */}
                                    <div className="grid grid-cols-3 gap-2 text-sm">
                                        <div className="flex items-center gap-1">
                                            <Truck className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600">{presupuesto.cantidad_vehiculos}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <Calendar className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-600">{formatDate(presupuesto.created)}</span>
                                        </div>
                                        <div className="flex items-center gap-1">
                                            <DollarSign className="h-4 w-4 text-gray-400" />
                                            <span className="text-gray-900 font-medium">{formatMoney(presupuesto.total_presupuesto)}</span>
                                        </div>
                                    </div>

                                    {/* Detalles expandibles */}
                                    {expandedMobileCard === presupuesto.id && (
                                        <div className="mt-4 pt-4 border-t border-gray-100">
                                            <div className="grid grid-cols-2 gap-3 mb-4">
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Fecha de emisión</p>
                                                    <p className="text-sm text-gray-900">{formatDate(presupuesto.created)}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500 mb-1">Válido hasta</p>
                                                    <p className="text-sm text-gray-900">{formatDate(presupuesto.validez)}</p>
                                                </div>
                                                {presupuesto.lead?.email && (
                                                    <div className="col-span-2">
                                                        <p className="text-xs text-gray-500 mb-1">Email</p>
                                                        <p className="text-sm text-gray-900">{getLeadEmail(presupuesto.lead)}</p>
                                                    </div>
                                                )}
                                                {presupuesto.lead?.telefono && (
                                                    <div className="col-span-2">
                                                        <p className="text-xs text-gray-500 mb-1">Teléfono</p>
                                                        <p className="text-sm text-gray-900">{getLeadTelefono(presupuesto.lead)}</p>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Acciones móvil */}
                                            <div className="grid grid-cols-4 gap-2">
                                                {/* ✅ Nuevo botón para ver lead en mobile */}
                                                {presupuesto.lead && (
                                                    <button
                                                        onClick={() => handleVerLead(presupuesto.lead?.id)}
                                                        className="px-3 py-2 bg-purple-50 text-purple-700 text-sm rounded-lg hover:bg-purple-100 transition-colors flex items-center justify-center gap-1"
                                                        title="Ver lead"
                                                    >
                                                        <User className="h-4 w-4" />
                                                        Lead
                                                    </button>
                                                )}
                                                <Link
                                                    href={`/comercial/presupuestos/${presupuesto.id}`}
                                                    className="px-3 py-2 bg-indigo-50 text-indigo-700 text-sm rounded-lg hover:bg-indigo-100 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <Eye className="h-4 w-4" />
                                                    Ver
                                                </Link>
                                                <Link
                                                    href={`/comercial/presupuestos/${presupuesto.id}/edit`}
                                                    className="px-3 py-2 bg-green-50 text-green-700 text-sm rounded-lg hover:bg-green-100 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <Edit className="h-4 w-4" />
                                                    Editar
                                                </Link>
                                                <button
                                                    onClick={() => handleVerPDF(presupuesto.id)}
                                                    className="px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                                                >
                                                    <FileText className="h-4 w-4" />
                                                    PDF
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                        
                        {/* Paginación */}
                        {presupuestos.last_page > 1 && (
                            <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
                                <Pagination
                                    currentPage={presupuestos.current_page}
                                    lastPage={presupuestos.last_page}
                                    total={presupuestos.total}
                                    perPage={presupuestos.per_page}
                                />
                            </div>
                        )}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg border border-gray-200 p-6 sm:p-8 text-center text-gray-500">
                        <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-base sm:text-lg font-medium">No hay presupuestos</p>
                        <p className="text-xs sm:text-sm mt-2">
                            <Link href="/comercial/prospectos" className="text-local hover:underline">
                                Ir a leads para crear un presupuesto
                            </Link>
                        </p>
                    </div>
                )}
            </div>
        </AppLayout>
    );
}