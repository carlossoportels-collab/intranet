// resources/js/components/filters/ActiveFilters.tsx
import { X } from 'lucide-react';
import React from 'react';

import { EstadoLead, Origen } from '@/types/leads';

interface PrefijoFiltro {
  id: string;
  codigo: string;
  descripcion: string;
  comercial_nombre?: string;
  display_text: string;
}

interface ActiveFiltersProps {
  filters: {
    search: string;
    estado_id: string;
    origen_id: string;
    prefijo_id: string;
    localidad_nombre: string;
    fecha_inicio: string;
    fecha_fin: string;
  };
  onClearFilter: (key: string, value: string) => void;
  onClearAll: () => void;
  estadosLead: EstadoLead[];
  origenes: Origen[];
  prefijosFiltro: PrefijoFiltro[];
}

const ActiveFilters: React.FC<ActiveFiltersProps> = ({
  filters,
  onClearFilter,
  onClearAll,
  estadosLead,
  origenes,
  prefijosFiltro
}) => {
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-ES');
    } catch {
      return 'Fecha inválida';
    }
  };
  
  const getEstadoNombre = (estadoId: string) => {
    const estado = estadosLead.find(e => e.id === parseInt(estadoId));
    return estado?.nombre || 'Desconocido';
  };
  
  const getOrigenNombre = (origenId: string) => {
    const origen = origenes.find(o => o.id === parseInt(origenId));
    return origen?.nombre || 'Desconocido';
  };
  
  const getPrefijoDisplay = (prefijoId: string) => {
    const prefijo = prefijosFiltro.find(p => p.id === prefijoId);
    return prefijo?.display_text || `Prefijo ${prefijoId}`;
  };
  
  const activeFilters = [
    { 
      key: 'search', 
      label: 'Búsqueda', 
      value: filters.search,
      displayValue: `"${filters.search}"`
    },
    { 
      key: 'estado_id', 
      label: 'Estado', 
      value: filters.estado_id,
      displayValue: getEstadoNombre(filters.estado_id)
    },
    { 
      key: 'origen_id', 
      label: 'Origen', 
      value: filters.origen_id,
      displayValue: getOrigenNombre(filters.origen_id)
    },
    { 
      key: 'prefijo_id', 
      label: 'Comercial', 
      value: filters.prefijo_id,
      displayValue: getPrefijoDisplay(filters.prefijo_id)
    },
    { 
      key: 'localidad_nombre', 
      label: 'Localidad', 
      value: filters.localidad_nombre,
      displayValue: filters.localidad_nombre
    },
    ...(filters.fecha_inicio && filters.fecha_fin ? [{
      key: 'fecha',
      label: 'Fecha',
      value: 'fecha',
      displayValue: `${formatDate(filters.fecha_inicio)} - ${formatDate(filters.fecha_fin)}`
    }] : [])
  ].filter(filter => filter.value && filter.value !== '');
  
  if (activeFilters.length === 0) return null;
  
  return (
    <div className="mt-3 p-2 bg-blue-50 rounded border border-blue-100">
      <div className="flex flex-wrap items-center gap-2">
        <span className="text-xs font-medium text-blue-700">Filtros activos:</span>
        
        {activeFilters.map((filter) => (
          <span 
            key={filter.key} 
            className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-blue-200 rounded text-xs text-blue-700"
          >
            {filter.label}: {filter.displayValue}
            <button
              type="button"
              onClick={() => {
                if (filter.key === 'fecha') {
                  onClearFilter('fecha_inicio', '');
                  onClearFilter('fecha_fin', '');
                } else {
                  onClearFilter(filter.key, '');
                }
              }}
              className="text-blue-500 hover:text-blue-700"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
        
        <button
          type="button"
          onClick={onClearAll}
          className="text-xs text-blue-600 hover:text-blue-800 ml-2"
        >
          Limpiar todos
        </button>
      </div>
    </div>
  );
};

export default ActiveFilters;