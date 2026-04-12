// resources/js/hooks/useProspectosFilters.ts
import { useCallback, useState, useEffect } from 'react';
import { router } from '@inertiajs/react';
import { usePreserveFilters } from './usePreserveFilters';

interface UseProspectosFiltersOptions {
  initialFilters?: {
    search?: string;
    estado_id?: string;
    origen_id?: string;
    prefijo_id?: string;
    localidad_nombre?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
  };
  currentPage?: number;
  perPage?: number;
}

export const useProspectosFilters = ({
  initialFilters = {},
  currentPage = 1,
  perPage = 15
}: UseProspectosFiltersOptions = {}) => {
  // Estado local de filtros
  const [filters, setFilters] = useState({
    search: initialFilters.search || '',
    estado_id: initialFilters.estado_id || '',
    origen_id: initialFilters.origen_id || '',
    prefijo_id: initialFilters.prefijo_id || '',
    localidad_nombre: initialFilters.localidad_nombre || '',
    fecha_inicio: initialFilters.fecha_inicio || '',
    fecha_fin: initialFilters.fecha_fin || '',
  });

  const [debounceTimer, setDebounceTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  const preserve = usePreserveFilters({
    storageKey: 'prospectos_filters',
    baseRoute: '/comercial/prospectos',
    autoRestore: false, // Desactivar auto-restauración, la manejamos manualmente
    only: ['leads', 'estadisticas', 'comentariosPorLead', 'presupuestosPorLead'],
    transformRestore: (filters) => {
      return {
        search: filters.search || '',
        estado_id: filters.estado_id || '',
        origen_id: filters.origen_id || '',
        prefijo_id: filters.prefijo_id || '',
        localidad_nombre: filters.localidad_nombre || '',
        fecha_inicio: filters.fecha_inicio || '',
        fecha_fin: filters.fecha_fin || '',
      };
    }
  });

  // Aplicar filtros con debounce
  const applyFilters = useCallback((newFilters: typeof filters) => {
    const params = new URLSearchParams();
    
    Object.entries(newFilters).forEach(([key, value]) => {
      if (value && value !== '') {
        params.set(key, value);
      }
    });
    
    const queryString = params.toString();
    const url = `/comercial/prospectos${queryString ? `?${queryString}` : ''}`;
    
    router.get(url, {}, {
      preserveState: true,
      preserveScroll: true,
      only: ['leads', 'estadisticas', 'comentariosPorLead', 'presupuestosPorLead']
    });
  }, []);

  // Actualizar filtro con debounce
  const updateFilter = useCallback((key: keyof typeof filters, value: string) => {
    setFilters(prev => {
      const newFilters = { ...prev, [key]: value };
      
      // Limpiar timer anterior
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
      
      // Nuevo timer
      const timer = setTimeout(() => {
        applyFilters(newFilters);
      }, 300);
      
      setDebounceTimer(timer);
      
      return newFilters;
    });
  }, [debounceTimer, applyFilters]);

  // Limpiar todos los filtros
  const clearFilters = useCallback(() => {
    const emptyFilters = {
      search: '',
      estado_id: '',
      origen_id: '',
      prefijo_id: '',
      localidad_nombre: '',
      fecha_inicio: '',
      fecha_fin: '',
    };
    setFilters(emptyFilters);
    applyFilters(emptyFilters);
  }, [applyFilters]);

  const hasActiveFilters = Object.values(filters).some(value => value && value !== '');

  // Navegar a detalle guardando estado
  const goToLeadDetail = useCallback((leadId: number) => {
    preserve.navigateToDetail(
      `/comercial/leads/${leadId}`,
      filters,
      currentPage,
      perPage
    );
  }, [preserve, filters, currentPage, perPage]);

  // Volver a la lista restaurando filtros
  const goBackToList = useCallback(() => {
    const returnUrl = sessionStorage.getItem('prospectos_filters_return_url');
    const savedState = sessionStorage.getItem('prospectos_filters');
    
    if (returnUrl && savedState) {
      sessionStorage.removeItem('prospectos_filters_return_url');
      router.visit(returnUrl, {
        preserveState: true,
        preserveScroll: true,
        only: ['leads', 'estadisticas', 'comentariosPorLead', 'presupuestosPorLead']
      });
    } else {
      router.visit('/comercial/prospectos', {
        only: ['leads', 'estadisticas', 'comentariosPorLead', 'presupuestosPorLead']
      });
    }
  }, []);

  // Limpiar timer al desmontar
  useEffect(() => {
    return () => {
      if (debounceTimer) {
        clearTimeout(debounceTimer);
      }
    };
  }, [debounceTimer]);

  return {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
    goToLeadDetail,
    goBackToList,
    isRestoring: preserve.isRestoring
  };
};