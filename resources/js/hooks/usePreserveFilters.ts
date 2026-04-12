// resources/js/hooks/usePreserveFilters.ts - Versión simplificada
import { router } from '@inertiajs/react';
import { useEffect, useCallback, useRef } from 'react';

interface FilterState {
  [key: string]: any;
}

interface UsePreserveFiltersOptions {
  storageKey: string;
  baseRoute: string;
  autoRestore?: boolean;
  transformRestore?: (filters: FilterState) => FilterState;
  only?: string[];
}

export const usePreserveFilters = ({
  storageKey,
  baseRoute,
  autoRestore = true,
  transformRestore,
  only = []
}: UsePreserveFiltersOptions) => {
  const isRestoringRef = useRef(false);

  // Solo guardar en sessionStorage, no actualizar URL
  const saveFilters = useCallback((filters: FilterState, page?: number, perPage?: number) => {
    const stateToSave = {
      filters,
      ...(page !== undefined && { page }),
      ...(perPage !== undefined && { perPage }),
      timestamp: Date.now(),
      url: window.location.pathname + window.location.search
    };
    
    sessionStorage.setItem(storageKey, JSON.stringify(stateToSave));
  }, [storageKey]);

  const restoreFilters = useCallback((): FilterState | null => {
    const saved = sessionStorage.getItem(storageKey);
    if (!saved) return null;
    
    try {
      const parsed = JSON.parse(saved);
      
      const maxAge = 30 * 60 * 1000;
      if (Date.now() - (parsed.timestamp || 0) > maxAge) {
        sessionStorage.removeItem(storageKey);
        return null;
      }
      
      const filtersToRestore = transformRestore 
        ? transformRestore(parsed.filters || {})
        : (parsed.filters || {});
      
      return filtersToRestore;
    } catch (error) {
      console.error('Error restoring filters:', error);
      sessionStorage.removeItem(storageKey);
      return null;
    }
  }, [storageKey, transformRestore]);

  const clearSavedFilters = useCallback(() => {
    sessionStorage.removeItem(storageKey);
  }, [storageKey]);

  const navigateToDetail = useCallback((
    detailUrl: string,
    currentFilters: FilterState,
    currentPage?: number,
    currentPerPage?: number
  ) => {
    saveFilters(currentFilters, currentPage, currentPerPage);
    sessionStorage.setItem(`${storageKey}_return_url`, window.location.pathname + window.location.search);
    
    router.visit(detailUrl, {
      preserveState: false,
      preserveScroll: true,
    });
  }, [storageKey, saveFilters]);

  const returnToList = useCallback(() => {
    const returnUrl = sessionStorage.getItem(`${storageKey}_return_url`);
    const savedState = sessionStorage.getItem(storageKey);
    
    if (returnUrl && savedState) {
      sessionStorage.removeItem(`${storageKey}_return_url`);
      
      router.visit(returnUrl, {
        preserveState: true,
        preserveScroll: true,
        only
      });
    } else {
      router.visit(baseRoute, { only });
    }
  }, [storageKey, baseRoute, only]);

  // Restauración automática
  useEffect(() => {
    if (!autoRestore) return;
    
    const restoredFilters = restoreFilters();
    const returnUrl = sessionStorage.getItem(`${storageKey}_return_url`);
    
    // Solo restaurar si venimos de un detalle y no hay parámetros en URL
    if (returnUrl && restoredFilters && Object.keys(restoredFilters).length > 0) {
      const params = new URLSearchParams();
      Object.entries(restoredFilters).forEach(([key, value]) => {
        if (value && value !== '') {
          params.set(key, String(value));
        }
      });
      
      const queryString = params.toString();
      const urlWithFilters = `${baseRoute}${queryString ? `?${queryString}` : ''}`;
      
      // Limpiar para no restaurar dos veces
      sessionStorage.removeItem(`${storageKey}_return_url`);
      
      router.visit(urlWithFilters, {
        preserveState: true,
        preserveScroll: true,
        replace: true,
        only
      });
    }
  }, [autoRestore, restoreFilters, baseRoute, storageKey, only]);

  return {
    saveFilters,
    restoreFilters,
    clearSavedFilters,
    navigateToDetail,
    returnToList,
    isRestoring: isRestoringRef.current
  };
};