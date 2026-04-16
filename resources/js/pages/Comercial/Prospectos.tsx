// resources/js/Pages/Comercial/Prospectos.tsx
import { Head, Link, router } from '@inertiajs/react'; 
import React, { useState, useCallback } from 'react';
import { Eye, MessageSquare, FileText, User, Star } from 'lucide-react';

import { FilterBar, ActiveFilters } from '@/components/filters';
import { LeadCardMobile, LeadTableRow, PipelineStatistics } from '@/components/leads';
import TiemposEstados from '@/components/leads/TiemposEstados';
import NuevoComentarioModal from '@/components/Modals/NuevoComentarioModal';
import VerNotaModal from '@/components/Modals/VerNotaModal';
import { Pagination, EmptyState } from '@/components/ui';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useProspectosFilters } from '@/hooks/useProspectosFilters';
import { useToast } from '@/contexts/ToastContext'; // 🔥 Usar ToastContext
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
    goBackToList
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
  
  // Estados para el diálogo de upgrade
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const [leadToUpgrade, setLeadToUpgrade] = useState<Lead | null>(null);
  const [isUpgrading, setIsUpgrading] = useState(false);
  
  // 🔥 Usar ToastContext
  const toast = useToast();
  
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
    const params = new URLSearchParams();
    
    if (activeFilters.search) params.append('search', activeFilters.search);
    if (activeFilters.estado_id) params.append('estado_id', activeFilters.estado_id);
    if (activeFilters.origen_id) params.append('origen_id', activeFilters.origen_id);
    if (activeFilters.prefijo_id) params.append('prefijo_id', activeFilters.prefijo_id);
    if (activeFilters.localidad_nombre) params.append('localidad_nombre', activeFilters.localidad_nombre); 
    if (activeFilters.fecha_inicio) params.append('fecha_inicio', activeFilters.fecha_inicio);
    if (activeFilters.fecha_fin) params.append('fecha_fin', activeFilters.fecha_fin);
    
    params.append('page', page.toString());
    
    const queryString = params.toString();
    router.get(`/comercial/prospectos${queryString ? `?${queryString}` : ''}`, {}, {
      preserveState: true,
      preserveScroll: true,
      only: ['leads', 'comentariosPorLead', 'presupuestosPorLead']
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

  // 🔥 Función handleUpgrade usando router.post y toast del contexto
  const handleUpgrade = useCallback(() => {
    if (!leadToUpgrade) return;
    
    setIsUpgrading(true);
    
    router.post(`/comercial/leads/${leadToUpgrade.id}/upgrade`, {}, {
      preserveScroll: true,
      onSuccess: () => {
        toast.success(`${leadToUpgrade.nombre_completo} ha sido convertido a cliente exitosamente`);
        setTimeout(() => {
          router.reload({ only: ['leads', 'comentariosPorLead', 'presupuestosPorLead'] });
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
  
  return (
    <AppLayout title="Prospectos">
      <Head title="Prospectos" />
      
      <div className="bg-white rounded-lg shadow-sm border border-gray-200">
        <div className="p-4 md:p-6 border-b border-gray-200">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Prospectos</h1>
              <p className="mt-1 text-sm text-gray-600">
                Gestión de leads y prospectos comerciales
              </p>
            </div>
            
            <div className="flex flex-wrap gap-2">
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                usuario.ve_todas_cuentas 
                  ? 'bg-green-100 text-green-800' 
                  : 'bg-blue-100 text-blue-800'
              }`}>
                {usuario.ve_todas_cuentas ? '🔓 Ve todos los prospectos' : '🔒 Prospectos limitados'}
              </span>
              <button
                type="button"
                onClick={() => setShowMobileFilters(!showMobileFilters)}
                className="md:hidden inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
              >
                {showMobileFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
              </button>
            </div>
          </div>
        </div>
        
        <div className="p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pipeline de Prospectos
          </h2>
          <PipelineStatistics 
            estadisticas={estadisticas}
            estadosLead={estadosLead}         
          />
        </div>
        
        <div className="p-4 md:p-6 border-b border-gray-200">
          <FilterBar 
            showMobileFilters={showMobileFilters}
            searchValue={activeFilters.search}
            onSearchChange={(value) => updateFilter('search', value)}
            estadoValue={activeFilters.estado_id}
            onEstadoChange={(value) => updateFilter('estado_id', value)}
            origenValue={activeFilters.origen_id}
            onOrigenChange={(value) => updateFilter('origen_id', value)}
            localidadNombreValue={activeFilters.localidad_nombre}
            onLocalidadNombreChange={(value) => updateFilter('localidad_nombre', value)}
            prefijoValue={activeFilters.prefijo_id}
            onPrefijoChange={(value) => updateFilter('prefijo_id', value)}
            fechaInicio={activeFilters.fecha_inicio}
            fechaFin={activeFilters.fecha_fin}
            onFechaInicioChange={(value) => updateFilter('fecha_inicio', value)}
            onFechaFinChange={(value) => updateFilter('fecha_fin', value)}
            estadosLead={estadosLead}
            origenes={origenes}
            prefijosFiltro={prefijosFiltro}
            prefijoUsuario={prefijoUsuario}
            usuarioEsComercial={usuarioEsComercial}
          />
        </div>
        
        {hasActiveFilters && (
          <div className="px-4 md:px-6 py-3 border-b border-gray-200 bg-gray-50">
            <ActiveFilters 
              filters={activeFilters}
              onClearFilter={(key: string, value: string) => updateFilter(key as any, value)}
              onClearAll={clearFilters}
              estadosLead={estadosLead}
              origenes={origenes}
              prefijosFiltro={prefijosFiltro}
            />
          </div>
        )}
        
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
                    <div key={lead.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
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
                            <div className="mt-2 p-2 bg-gray-50 rounded">
                              <p className="text-xs font-medium text-gray-700">Comercial:</p>
                              <p className="text-sm text-gray-900">{lead.asignado_nombre}</p>
                            </div>
                          )}
                          
                          <div className="flex flex-wrap items-center gap-3 mt-3">
                            {contarPresupuestosDeLead(lead.id) > 0 && (
                              <div className="flex items-center gap-1 text-xs text-blue-600">
                                <FileText className="h-3 w-3" />
                                <span>{contarPresupuestosDeLead(lead.id)} presupuestos</span>
                                {presupuestoData?.ultimo_formateado && (
                                  <span className="text-gray-500 ml-1">
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
                                  <span className="text-gray-500 ml-1">
                                    ({comentarioData.ultimo_formateado})
                                  </span>
                                )}
                              </div>
                            )}
                          </div>
                          
                          <div className="mt-2 text-xs text-gray-500">
                            Registro: {formatDate(lead.created)}
                          </div>
                          
                          <div className="flex flex-wrap gap-3 mt-3 pt-2 border-t border-gray-100">
                            <button
                              onClick={() => goToLeadDetail(lead.id)}
                              className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                            >
                              <Eye className="h-4 w-4 mr-1" />
                              Detalles
                            </button>
                            <button
                              onClick={() => handleOpenModal('nuevoComentario', lead)}
                              className="inline-flex items-center text-green-600 hover:text-green-800 text-sm px-2 py-1 hover:bg-green-50 rounded transition-colors"
                            >
                              <MessageSquare className="h-4 w-4 mr-1" />
                              Seguimiento
                            </button>
                            {lead.prefijo_id === 7 && !lead.es_cliente && (
                              <button
                                onClick={() => openUpgradeDialog(lead)}
                                className="inline-flex items-center text-purple-600 hover:text-purple-800 text-sm px-2 py-1 hover:bg-purple-50 rounded transition-colors"
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
                                className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                              >
                                <Eye className="h-4 w-4 mr-1" />
                                Detalles
                              </button>
                              <button 
                                type="button"
                                onClick={() => handleOpenModal('nuevoComentario', lead)}
                                className="inline-flex items-center text-green-600 hover:text-green-800 text-sm px-2 py-1 hover:bg-green-50 rounded transition-colors"
                              >
                                <MessageSquare className="h-4 w-4 mr-1" />
                                Comentario
                              </button>
                              {lead.prefijo_id === 7 && !lead.es_cliente && (
                                <button 
                                  onClick={() => openUpgradeDialog(lead)}
                                  className="inline-flex items-center text-purple-600 hover:text-purple-800 text-sm px-2 py-1 hover:bg-purple-50 rounded transition-colors"
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
                  only={['leads', 'comentariosPorLead', 'presupuestosPorLead']}
                />
              </div>
            </>
          )}
        </div>
      </div>

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