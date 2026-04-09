// resources/js/hooks/useLeadFilters.ts
import { router } from '@inertiajs/react';
import { useState, useEffect, useCallback, useRef } from 'react';

interface UseLeadFiltersProps {
  initialFilters?: {
    search?: string;
    estado_id?: string;
    origen_id?: string;
    prefijo_id?: string; 
    localidad_nombre?: string;
    fecha_inicio?: string;
    fecha_fin?: string;
  };
  debounceDelay?: number;
}

export const useLeadFilters = ({ 
  initialFilters = {}, 
  debounceDelay = 300 
}: UseLeadFiltersProps = {}) => {
  const [filters, setFilters] = useState({
    search: initialFilters.search || '',
    estado_id: initialFilters.estado_id || '',
    origen_id: initialFilters.origen_id || '',
    prefijo_id: initialFilters.prefijo_id || '',
    localidad_nombre: initialFilters.localidad_nombre || '',
    fecha_inicio: initialFilters.fecha_inicio || '',
    fecha_fin: initialFilters.fecha_fin || '',
  });

  // 🔥 CORREGIDO: Usar ReturnType<typeof setTimeout> en lugar de NodeJS.Timeout
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Función de debounce simple
  const debounce = useCallback((func: () => void, delay: number) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    timeoutRef.current = setTimeout(func, delay);
  }, []);

  // Limpiar timeout al desmontar
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  // Aplicar filtros con debounce
  useEffect(() => {
    const applyFilters = () => {
      const activeFilters: Record<string, string> = {};
      
      Object.entries(filters).forEach(([key, value]) => {
        if (value && value !== '') {
          activeFilters[key] = value;
        }
      });

      router.get('/comercial/prospectos', activeFilters, {
        preserveState: true,
        replace: true,
        only: ['leads', 'estadisticas', 'comentariosPorLead', 'presupuestosPorLead']
      });
    };

    debounce(applyFilters, debounceDelay);
  }, [filters, debounceDelay, debounce]);

  const updateFilter = useCallback((key: keyof typeof filters, value: string) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  }, []);

  const clearFilters = useCallback(() => {
    setFilters({
      search: '',
      estado_id: '',
      origen_id: '',
      prefijo_id: '',
      localidad_nombre: '',
      fecha_inicio: '',
      fecha_fin: '',
    });
    
    router.get('/comercial/prospectos', {}, {
      preserveState: true,
      replace: true,
    });
  }, []);

  const hasActiveFilters = Object.values(filters).some(value => value && value !== '');

  return {
    filters,
    updateFilter,
    clearFilters,
    hasActiveFilters,
  };
};