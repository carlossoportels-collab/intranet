// resources/js/Pages/Comercial/Prospectos.tsx
import { Head, Link, router } from '@inertiajs/react';
import React, { useState, useCallback, useEffect } from 'react';
import { Eye, MessageSquare, FileText, User, Star, Filter, X, Calendar } from 'lucide-react';

import { FilterBar, ActiveFilters } from '@/components/filters';
import { LeadCardMobile, LeadTableRow, PipelineStatistics } from '@/components/leads';
import TiemposEstados from '@/components/leads/TiemposEstados';
import NuevoComentarioModal from '@/components/Modals/NuevoComentarioModal';
import VerNotaModal from '@/components/Modals/VerNotaModal';
import { Pagination, EmptyState } from '@/components/ui';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import FiltroFechasRapido from '@/components/ui/FiltroFechasRapido';
import { useProspectosFilters } from '@/hooks/useProspectosFilters';
import { useToast } from '@/contexts/ToastContext';
import AppLayout from '@/layouts/app-layout';
import {
  Lead,
  Origen,
  EstadoLead,
  TipoComentario,
  Rubro,
  Provincia,
  Comercial,
  ConteoConFecha
} from '@/types/leads';

interface Props {
  leads: {
    data: Lead[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
  };
  estadisticas: {
    total: number;
    nuevo: number;
    contactado: number;
    seguimiento: number;
    propuesta: number;
    negociacion: number;
    pausado: number;
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
  filters?: {
    search?: string;
    estado_id?: string;
    origen_id?: string;
    prefijo_id?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
    fecha_rapida?: string;
  };
  usuario: {
    ve_todas_cuentas: boolean;
    rol_id: number;
    personal_id: number;
    nombre_completo?: string;
    comercial?: {
      es_comercial: boolean;
      prefijo_id?: number;
    } | null;
  };
  origenes: Origen[];
  estadosLead: Array<EstadoLead & { tipo: string }>;
  tiposComentario: TipoComentario[];
  rubros: Rubro[];
  comerciales: Comercial[];
  provincias: Provincia[];
  hay_comerciales: boolean;
  comentariosPorLead?: Record<number, ConteoConFecha>;
  presupuestosPorLead?: Record<number, ConteoConFecha>;
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

// Colores para las tarjetas de estadísticas
const estadisticasConfig = [
  { key: 'nuevo', label: 'Nuevos', color: '#6B7280', bgLight: '#f3f4f6', borderColor: '#e5e7eb', icon: '🆕' },
  { key: 'contactado', label: 'Contactados', color: '#3B82F6', bgLight: '#eff6ff', borderColor: '#bfdbfe', icon: '📞' },
  { key: 'seguimiento', label: 'Seguimiento', color: '#06B6D4', bgLight: '#ecfeff', borderColor: '#a5f3fc', icon: '🔄' },
  { key: 'propuesta', label: 'Propuesta Enviada', color: '#A855F7', bgLight: '#f5f3ff', borderColor: '#e9d5ff', icon: '📄' },
  { key: 'negociacion', label: 'Negociación', color: '#F97316', bgLight: '#fff7ed', borderColor: '#fed7aa', icon: '🤝' },
  { key: 'pausado', label: 'Pausados', color: '#F59E0B', bgLight: '#fefce8', borderColor: '#fef08a', icon: '⏸️' }
];

export default function Prospectos({ 
  leads, 
  estadisticas, 
  filters: initialFilters = {},
  usuario, 
  origenes, 
  estadosLead, 
  tiposComentario = [],
  rubros = [], 
  comerciales = [], 
  provincias = [],
  hay_comerciales = false,
  comentariosPorLead = {},
  presupuestosPorLead = {},
  prefijosFiltro = [],
  prefijoUsuario = null
}: Props) {
  const { data: leadsData, current_page, last_page, total, per_page } = leads;
  
  const { 
    filters: activeFilters, 
    updateFilter, 
    clearFilters, 
    hasActiveFilters,
    goToLeadDetail,
    goBackToList,
    setFilters
  } = useProspectosFilters({
    initialFilters,
    currentPage: current_page,
    perPage: per_page
  });

  const usuarioEsComercial = usuario.rol_id === 5;
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showModals, setShowModals] = useState({
    nuevoComentario: false,
    editarLead: false,
    verNota: false,
    tiemposEstados: false
  });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [leadToUpgrade, setLeadToUpgrade] = useState<Lead | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  
  const toast = useToast();

  // Manejar cambio en filtro rápido de fechas
  const handleFechaRapidaChange = (value: string, fechaInicio?: string, fechaFin?: string) => {
  if (value === 'custom' && fechaInicio && fechaFin) {
    updateFilter('fecha_inicio', fechaInicio);
    updateFilter('fecha_fin', fechaFin);
    updateFilter('fecha_rapida', value);
  } else if (value === '') {
    updateFilter('fecha_inicio', '');
    updateFilter('fecha_fin', '');
    updateFilter('fecha_rapida', value);
  } else {
    // Para opciones como 'today', 'last7days', etc., solo actualizamos fecha_rapida
    // Las fechas las calculará el backend
    updateFilter('fecha_rapida', value);
    // Limpiar fechas manuales
    updateFilter('fecha_inicio', '');
    updateFilter('fecha_fin', '');
  }
};

  // Manejar cambio de comercial
  const handleComercialChange = (comercialId: string) => {
    updateFilter('prefijo_id', comercialId);
  };

  // Estados permitidos para el filtro (solo los que nos interesan)
  const estadosPermitidos = estadosLead.filter(estado => 
    [1, 2, 3, 4, 5, 11, 12].includes(estado.id)
  );

  const handleOpenModal = useCallback((modal: keyof typeof showModals, lead: Lead) => {
    setSelectedLead(lead);
    setShowModals(prev => ({ ...prev, [modal]: true }));
  }, []);
  
  const handleCloseModals = useCallback(() => {
    setShowModals({
      nuevoComentario: false,
      editarLead: false,
      verNota: false,
      tiemposEstados: false
    });
    setSelectedLead(null);
  }, []);
  
  const handlePageChange = useCallback((page: number) => {
    const params: Record<string, string> = {};
    
    if (activeFilters.search) params.search = activeFilters.search;
    if (activeFilters.estado_id) params.estado_id = activeFilters.estado_id;
    if (activeFilters.origen_id) params.origen_id = activeFilters.origen_id;
    if (activeFilters.prefijo_id) params.prefijo_id = activeFilters.prefijo_id;
    if (activeFilters.localidad_nombre) params.localidad_nombre = activeFilters.localidad_nombre;
    if (activeFilters.fecha_inicio) params.fecha_inicio = activeFilters.fecha_inicio;
    if (activeFilters.fecha_fin) params.fecha_fin = activeFilters.fecha_fin;
    if (activeFilters.fecha_rapida) params.fecha_rapida = activeFilters.fecha_rapida;
    
    params.page = page.toString();
    
    router.get('/comercial/prospectos', params, {
      preserveState: true,
      preserveScroll: true,
      only: ['leads', 'estadisticas', 'comentariosPorLead', 'presupuestosPorLead']
    });
  }, [activeFilters]);
  
  const contarComentariosDeLead = useCallback((leadId: number): number => {
    return comentariosPorLead[leadId]?.total || 0;
  }, [comentariosPorLead]);
  
  const contarPresupuestosDeLead = useCallback((leadId: number): number => {
    return presupuestosPorLead[leadId]?.total || 0;
  }, [presupuestosPorLead]);
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-ES');
    } catch {
      return 'Fecha inválida';
    }
  };

  const getEstadoBadgeStyle = (colorHex?: string) => {
    if (colorHex) {
      const hex = colorHex.startsWith('#') ? colorHex : `#${colorHex}`;
      return {
        backgroundColor: `${hex}20`,
        color: hex,
        border: `1px solid ${hex}40`
      };
    }
    return {
      backgroundColor: '#f3f4f6',
      color: '#374151',
      border: '1px solid #e5e7eb'
    };
  };

  const openUpgradeDialog = useCallback((lead: Lead) => {
    setLeadToUpgrade(lead);
    setShowUpgradeDialog(true);
  }, []);

  const handleUpgrade = useCallback(() => {
    if (!leadToUpgrade) return;
    
    setIsUpgrading(true);
    
    router.post(`/comercial/leads/${leadToUpgrade.id}/upgrade`, {}, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(`${leadToUpgrade.nombre_completo} ha sido convertido a cliente exitosamente`);
        setTimeout(() => {
          router.reload({ only: ['leads', 'estadisticas', 'comentariosPorLead', 'presupuestosPorLead'] });
        }, 500);
      },
      onError: (errors) => {
        console.error('Error en upgrade:', errors);
        toast.error(errors.error || 'Error al convertir el lead');
      },
      onFinish: () => {
        setIsUpgrading(false);
        setShowUpgradeDialog(false);
        setLeadToUpgrade(null);
      }
    });
  }, [leadToUpgrade, toast]);

  // Obtener el valor del filtro rápido actual
  const fechaRapidaValue = activeFilters.fecha_rapida || '';

  return (
    <AppLayout title="Prospectos">
      <Head title="Prospectos" />
      
      <div className="max-w-8xl mx-auto px-4 sm:px-6 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
          {/* Header */}
          <div className="p-4 md:p-6 border-b border-gray-100">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Prospectos</h1>
                <p className="mt-1 text-sm text-gray-500">
                  Gestión de leads y prospectos comerciales
                </p>
              </div>
              
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setShowMobileFilters(!showMobileFilters)}
                  className="md:hidden inline-flex items-center px-3 py-1 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
                >
                  <Filter className="h-4 w-4 mr-2" />
                  {showMobileFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
                </button>
              </div>
            </div>
          </div>
          
          {/* Pipeline de Prospectos - Cards estilo contratos */}
          <div className="p-4 md:p-6 border-b border-gray-100">
            <div className="flex items-baseline justify-between mb-3 flex-wrap gap-2">
              <h2 className="text-sm font-medium text-gray-700">
                Pipeline de Prospectos
              </h2>
              <p className="text-xs text-gray-500">
                Total: <span className="font-semibold text-gray-700">{estadisticas.total}</span> prospectos activos
              </p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
              {estadisticasConfig.map((item) => {
                const valor = estadisticas[item.key as keyof typeof estadisticas] || 0;
                const porcentaje = estadisticas.total > 0 ? ((valor / estadisticas.total) * 100).toFixed(1) : 0;
                return (
                  <div 
                    key={item.key}
                    className="bg-white rounded-lg border p-4 transition-all duration-200 hover:shadow-md hover:-translate-y-0.5 cursor-default"
                    style={{ borderColor: item.borderColor, backgroundColor: item.bgLight }}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium" style={{ color: item.color }}>
                        {item.label}
                      </span>
                      <span className="text-xs text-gray-400">{porcentaje}%</span>
                    </div>
                    <p className="text-2xl font-bold mt-2" style={{ color: item.color }}>
                      {valor.toLocaleString('es-AR')}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
          
          {/* Filtros */}
          <div className="p-4 md:p-6 border-b border-gray-100">
            {/* Búsqueda */}
            <div className="mb-4">
              <form onSubmit={(e) => { e.preventDefault(); }} className="flex flex-col sm:flex-row gap-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    placeholder="Buscar por nombre, email o teléfono..."
                    className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={activeFilters.search || ''}
                    onChange={(e) => updateFilter('search', e.target.value)}
                  />
                </div>
              </form>
            </div>

            {/* Filtros en línea */}
            <div className={`${showMobileFilters ? 'block' : 'hidden md:block'}`}>
              <div className="flex flex-wrap items-center gap-3">
                {/* Filtro rápido de fechas */}
                <FiltroFechasRapido
                  opciones={opcionesFechasRapido}
                  value={fechaRapidaValue}
                  onChange={handleFechaRapidaChange}
                  fechaInicio={activeFilters.fecha_inicio || ''}
                  fechaFin={activeFilters.fecha_fin || ''}
                />

                {/* Filtro por Estado */}
                <select 
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                  value={activeFilters.estado_id || ''}
                  onChange={(e) => updateFilter('estado_id', e.target.value)}
                >
                  <option value="">Todos los estados</option>
                  {estadosPermitidos.map(estado => (
                    <option key={estado.id} value={estado.id}>
                      {estado.nombre}
                    </option>
                  ))}
                </select>

                {/* Filtro por Origen */}
                <select 
                  className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                  value={activeFilters.origen_id || ''}
                  onChange={(e) => updateFilter('origen_id', e.target.value)}
                >
                  <option value="">Todos los orígenes</option>
                  {origenes.map(origen => (
                    <option key={origen.id} value={origen.id}>
                      {origen.nombre}
                    </option>
                  ))}
                </select>

                {/* Filtro por Localidad */}
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Localidad..."
                    className="w-40 px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500"
                    value={activeFilters.localidad_nombre || ''}
                    onChange={(e) => updateFilter('localidad_nombre', e.target.value)}
                  />
                </div>

                {/* Filtro por Comercial/Prefijo */}
                {usuarioEsComercial && prefijoUsuario ? (
                  <div className="px-3 py-2 text-sm border border-gray-300 rounded-lg bg-gray-50 flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-500" />
                    <span className="text-gray-700">{prefijoUsuario.display_text}</span>
                  </div>
                ) : (
                  <select 
                    className="px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 focus:border-orange-500 bg-white"
                    value={activeFilters.prefijo_id || ''}
                    onChange={(e) => handleComercialChange(e.target.value)}
                  >
                    <option value="">Todos los comerciales</option>
                    {prefijosFiltro.map(prefijo => (
                      <option key={prefijo.id} value={prefijo.id}>
                        {prefijo.display_text}
                      </option>
                    ))}
                  </select>
                )}

                {/* Botón limpiar filtros */}
                {hasActiveFilters && (
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center gap-1 px-3 py-2 text-sm text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
                  >
                    <X className="h-4 w-4" />
                    Limpiar
                  </button>
                )}
              </div>
            </div>
          </div>
          
          {/* Tabla de leads */}
          <div className="p-4 md:p-6">
            {leadsData.length === 0 ? (
              <EmptyState 
                hasFilters={hasActiveFilters}
                onClearFilters={clearFilters}
              />
            ) : (
              <>
                {/* Versión móvil */}
                <div className="md:hidden space-y-4">
                  {leadsData.map((lead) => {
                    const presupuestoData = presupuestosPorLead[lead.id];
                    const comentarioData = comentariosPorLead[lead.id];
                    const estadoStyle = getEstadoBadgeStyle(lead.estado_lead?.color_hex);
                    
                    return (
                      <div key={lead.id} className="border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                        <div className="flex items-start gap-3 mb-3">
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <div>
                                <h3 className="font-semibold text-gray-900">
                                  {lead.nombre_completo || 'Sin nombre'}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                  {lead.email || 'Sin email'} • {lead.telefono || 'Sin teléfono'}
                                </p>
                              </div>
                              <span 
                                className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium"
                                style={estadoStyle}
                              >
                                {lead.estado_lead?.nombre || 'Sin estado'}
                              </span>
                            </div>
                            
                            <div className="mt-2 text-xs text-gray-500">
                              📍 {lead.localidad?.nombre 
                                ? `${lead.localidad.nombre}${lead.localidad.provincia?.nombre ? `, ${lead.localidad.provincia.nombre}` : ''}`
                                : 'Sin localidad'}
                            </div>
                            
                            {!usuarioEsComercial && lead.asignado_nombre && (
                              <div className="mt-2 p-2 bg-gray-50 rounded-lg">
                                <p className="text-xs font-medium text-gray-500">Comercial:</p>
                                <p className="text-sm text-gray-900">{lead.asignado_nombre}</p>
                              </div>
                            )}
                            
                            <div className="flex flex-wrap items-center gap-3 mt-3">
                              {contarPresupuestosDeLead(lead.id) > 0 && (
                                <div className="flex items-center gap-1 text-xs text-blue-600">
                                  <FileText className="h-3 w-3" />
                                  <span>{contarPresupuestosDeLead(lead.id)} presupuestos</span>
                                  {presupuestoData?.ultimo_formateado && (
                                    <span className="text-gray-400 ml-1">
                                      ({presupuestoData.ultimo_formateado})
                                    </span>
                                  )}
                                </div>
                              )}
                              {contarComentariosDeLead(lead.id) > 0 && (
                                <div className="flex items-center gap-1 text-xs text-green-600">
                                  <MessageSquare className="h-3 w-3" />
                                  <span>{contarComentariosDeLead(lead.id)} comentarios</span>
                                  {comentarioData?.ultimo_formateado && (
                                    <span className="text-gray-400 ml-1">
                                      ({comentarioData.ultimo_formateado})
                                    </span>
                                  )}
                                </div>
                              )}
                            </div>
                            
                            <div className="mt-2 text-xs text-gray-400">
                              Registro: {formatDate(lead.created)}
                            </div>
                            
                            <div className="flex flex-wrap gap-3 mt-3 pt-2 border-t border-gray-100">
                              <button
                                onClick={() => goToLeadDetail(lead.id)}
                                className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm px-2 py-1 hover:bg-blue-50 rounded-lg transition-colors"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Detalles
                              </button>
                              <button
                                onClick={() => handleOpenModal('nuevoComentario', lead)}
                                className="inline-flex items-center text-green-600 hover:text-green-700 text-sm px-2 py-1 hover:bg-green-50 rounded-lg transition-colors"
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Seguimiento
                              </button>
                              {lead.prefijo_id === 7 && !lead.es_cliente && (
                                <button
                                  onClick={() => openUpgradeDialog(lead)}
                                  className="inline-flex items-center text-purple-600 hover:text-purple-700 text-sm px-2 py-1 hover:bg-purple-50 rounded-lg transition-colors"
                                >
                                  <Star className="h-4 w-4 mr-1" />
                                  Convertir
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
                
                {/* Versión desktop */}
                <div className="hidden md:block overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Prospecto
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Contacto
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Estado
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Presupuestos
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Comentarios
                        </th>
                        {!usuarioEsComercial && (
                          <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Comercial
                          </th>
                        )}
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Registro
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {leadsData.map((lead) => {
                        const presupuestoData = presupuestosPorLead[lead.id];
                        const comentarioData = comentariosPorLead[lead.id];
                        const estadoStyle = getEstadoBadgeStyle(lead.estado_lead?.color_hex);
                        
                        return (
                          <tr key={lead.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3">
                              <div>
                                <p className="font-medium text-gray-900">
                                  {lead.nombre_completo || 'Sin nombre'}
                                </p>
                                <p className="text-xs text-gray-500">
                                  {lead.localidad?.nombre 
                                    ? `${lead.localidad.nombre}${lead.localidad.provincia?.nombre ? `, ${lead.localidad.provincia.nombre}` : ''}`
                                    : 'Sin localidad'}
                                </p>
                              </div>
                            </td>
                            
                            <td className="px-4 py-3">
                              <div>
                                <p className="text-sm text-gray-900">{lead.email || 'Sin email'}</p>
                                <p className="text-xs text-gray-500">{lead.telefono || 'Sin teléfono'}</p>
                              </div>
                            </td>
                            
                            <td className="px-4 py-3">
                              <span 
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                style={estadoStyle}
                              >
                                {lead.estado_lead?.nombre || 'Sin estado'}
                              </span>
                            </td>
                            
                            <td className="px-4 py-3 text-sm text-gray-700 text-center">
                              {contarPresupuestosDeLead(lead.id)}
                              {presupuestoData?.ultimo_formateado && (
                                <div className="text-xs text-gray-400">
                                  {presupuestoData.ultimo_formateado}
                                </div>
                              )}
                            </td>
                            
                            <td className="px-4 py-3 text-sm text-gray-700 text-center">
                              {contarComentariosDeLead(lead.id)}
                              {comentarioData?.ultimo_formateado && (
                                <div className="text-xs text-gray-400">
                                  {comentarioData.ultimo_formateado}
                                </div>
                              )}
                            </td>
                            
                            {!usuarioEsComercial && (
                              <td className="px-4 py-3">
                                <div className="flex items-center gap-1">
                                  <User className="h-3 w-3 text-gray-400" />
                                  <span className="text-sm text-gray-700">{lead.asignado_nombre || 'Sin asignar'}</span>
                                </div>
                              </td>
                            )}
                            
                            <td className="px-4 py-3 text-sm text-gray-500">
                              {formatDate(lead.created)}
                             </td>
                            
                            <td className="px-4 py-3">
                              <div className="flex items-center space-x-2">
                                <button 
                                  onClick={() => goToLeadDetail(lead.id)}
                                  className="inline-flex items-center text-blue-600 hover:text-blue-700 text-sm px-2 py-1 hover:bg-blue-50 rounded-lg transition-colors"
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  Detalles
                                </button>
                                <button 
                                  type="button"
                                  onClick={() => handleOpenModal('nuevoComentario', lead)}
                                  className="inline-flex items-center text-green-600 hover:text-green-700 text-sm px-2 py-1 hover:bg-green-50 rounded-lg transition-colors"
                                >
                                  <MessageSquare className="h-4 w-4 mr-1" />
                                  Comentario
                                </button>
                                {lead.prefijo_id === 7 && !lead.es_cliente && (
                                  <button 
                                    onClick={() => openUpgradeDialog(lead)}
                                    className="inline-flex items-center text-purple-600 hover:text-purple-700 text-sm px-2 py-1 hover:bg-purple-50 rounded-lg transition-colors"
                                  >
                                    <Star className="h-4 w-4 mr-1" />
                                    Convertir
                                  </button>
                                )}
                              </div>
                             </td>
                           </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                
                <div className="mt-6">
                  <Pagination
                    currentPage={current_page}
                    lastPage={last_page}
                    total={total}
                    perPage={per_page}
                    onPageChange={handlePageChange}
                    only={['leads', 'estadisticas', 'comentariosPorLead', 'presupuestosPorLead']}
                  />
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Modales */}
      <ConfirmDialog
        isOpen={showUpgradeDialog}
        onClose={() => {
          if (!isUpgrading) {
            setShowUpgradeDialog(false);
            setLeadToUpgrade(null);
          }
        }}
        onConfirm={handleUpgrade}
        title="Convertir a Cliente"
        message={`¿Está seguro que desea convertir a "${leadToUpgrade?.nombre_completo}" en cliente? Esta acción cambiará el estado del lead y lo marcará como cliente.`}
        confirmText={isUpgrading ? "Procesando..." : "Sí, convertir"}
        cancelText="Cancelar"
        type="warning"
      />

      <NuevoComentarioModal
        isOpen={showModals.nuevoComentario}
        onClose={handleCloseModals}
        lead={selectedLead}
        tiposComentario={tiposComentario}
        estadosLead={estadosLead}
        comentariosExistentes={selectedLead ? contarComentariosDeLead(selectedLead.id) : 0}
        onSuccess={() => {
          router.reload({ only: ['leads', 'comentariosPorLead', 'presupuestosPorLead'] });
        }}
      />
      <VerNotaModal
        isOpen={showModals.verNota}
        onClose={handleCloseModals}
        lead={selectedLead}
      />
      <TiemposEstados
        leadId={selectedLead?.id || 0}
        isOpen={showModals.tiemposEstados}
        onClose={handleCloseModals}
      />
    </AppLayout>
  );
}