import { Head, Link, router } from '@inertiajs/react'; 
import React, { useState, useCallback } from 'react';

import { FilterBar, ActiveFilters } from '@/components/filters';
import { LeadCardMobile, LeadTableRow, PipelineStatistics } from '@/components/leads';
import TiemposEstados from '@/components/leads/TiemposEstados';
import NuevoComentarioModal from '@/components/Modals/NuevoComentarioModal';
import VerNotaModal from '@/components/Modals/VerNotaModal';
import { Pagination, EmptyState } from '@/components/ui';
import { useLeadFilters } from '@/hooks/useLeadFilters';
import AppLayout from '@/layouts/app-layout';
import {
  Lead,
  Origen,
  EstadoLead,
  TipoComentario,
  Rubro,
  Provincia,
  Comercial
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
  comentariosPorLead?: Record<number, number>;
  presupuestosPorLead?: Record<number, number>;
}

export default function Prospectos({ 
  leads, 
  estadisticas, 
  filters = {},
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
  const { 
    filters: activeFilters, 
    updateFilter, 
    clearFilters, 
    hasActiveFilters 
  } = useLeadFilters({ initialFilters: filters });

  const usuarioEsComercial = usuario.rol_id === 5;
  const [showMobileFilters, setShowMobileFilters] = useState(false);
  const [showModals, setShowModals] = useState({
    nuevoComentario: false,
    editarLead: false,
    verNota: false,
    tiemposEstados: false
  });
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  
  const { data: leadsData, current_page, last_page, total, per_page } = leads;
  
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
    
    // Incluir TODOS los filtros activos
    if (activeFilters.search) params.append('search', activeFilters.search);
    if (activeFilters.estado_id) params.append('estado_id', activeFilters.estado_id);
    if (activeFilters.origen_id) params.append('origen_id', activeFilters.origen_id);
    if (activeFilters.prefijo_id) params.append('prefijo_id', activeFilters.prefijo_id);
    if (activeFilters.fecha_inicio) params.append('fecha_inicio', activeFilters.fecha_inicio);
    if (activeFilters.fecha_fin) params.append('fecha_fin', activeFilters.fecha_fin);
    
    // Agregar la página
    params.append('page', page.toString());
    
    // Construir URL con todos los parámetros
    const queryString = params.toString();
    router.get(`/comercial/prospectos${queryString ? `?${queryString}` : ''}`);
  }, [activeFilters]);
  
  const contarComentariosDeLead = useCallback((leadId: number): number => {
    return comentariosPorLead[leadId] || 0;
  }, [comentariosPorLead]);
  
  const contarPresupuestosDeLead = useCallback((leadId: number): number => {
    return presupuestosPorLead[leadId] || 0;
  }, [presupuestosPorLead]);
  
  const tieneNotas = useCallback((lead: Lead): boolean => {
    if (lead.notas && Array.isArray(lead.notas)) {
      return lead.notas.length > 0;
    }
    return (lead as any).notas_count > 0 || (lead as any).tiene_notas > 0;
  }, []);
  
  return (
 <AppLayout title="Prospectos">
      <Head title="Prospectos" />
      
      {/* 🔥 ELIMINAMOS EL HEADER CON MARGEN y ponemos título dentro del pipeline */}
      
      {/* Pipeline - SIN PADDING EXTRA */}
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
        
        {/* Pipeline Statistics - dentro del mismo contenedor blanco */}
        <div className="p-4 md:p-6 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Pipeline de Prospectos
          </h2>
          <PipelineStatistics 
            estadisticas={estadisticas}
            estadosLead={estadosLead}         
          />
        </div>
        
        {/* Filtros - dentro del mismo contenedor blanco */}
        <div className="p-4 md:p-6 border-b border-gray-200">
          <FilterBar 
            showMobileFilters={showMobileFilters}
            searchValue={activeFilters.search}
            onSearchChange={(value) => updateFilter('search', value)}
            estadoValue={activeFilters.estado_id}
            onEstadoChange={(value) => updateFilter('estado_id', value)}
            origenValue={activeFilters.origen_id}
            onOrigenChange={(value) => updateFilter('origen_id', value)}
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
        
        {/* Active Filters */}
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
        
        {/* Lista de Leads */}
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
                {leadsData.map((lead) => (
                  <LeadCardMobile
                    key={lead.id}
                    lead={lead}
                    origenes={origenes}
                    estadosLead={estadosLead}
                    comentariosCount={contarComentariosDeLead(lead.id)}
                    presupuestosCount={contarPresupuestosDeLead(lead.id)}
                    usuario={usuario}
                    onNuevoComentario={(lead) => handleOpenModal('nuevoComentario', lead)}
                    onVerNota={(lead) => handleOpenModal('verNota', lead)}
                    onTiemposEstados={(lead) => handleOpenModal('tiemposEstados', lead)}
                  />
                ))}
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
        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
          Presupuestos
        </th>
        <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">
          Comentarios
        </th>
        {/* Columna Comercial - solo visible para admins/supervisores */}
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
      {leadsData.map((lead) => (
        <LeadTableRow
          key={lead.id}
          lead={lead}
          origenes={origenes}
          estadosLead={estadosLead}
          comentariosCount={contarComentariosDeLead(lead.id)}
          presupuestosCount={contarPresupuestosDeLead(lead.id)}
          usuario={usuario}
          onNuevoComentario={(lead) => handleOpenModal('nuevoComentario', lead)}
          onVerNota={(lead) => handleOpenModal('verNota', lead)}
          onTiemposEstados={(lead) => handleOpenModal('tiemposEstados', lead)}
          mostrarColumnaComercial={!usuarioEsComercial} // ← Pasar esta prop
        />
      ))}
    </tbody>
  </table>
</div>
              
              {/* Paginación */}
              <div className="mt-6">
                <Pagination
                  currentPage={current_page}
                  lastPage={last_page}
                  total={total}
                  perPage={per_page}
                  only={['leads', 'comentariosPorLead', 'presupuestosPorLead']}
                />
              </div>
            </>
          )}
        </div>
      </div>

      {/* Modales */}
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