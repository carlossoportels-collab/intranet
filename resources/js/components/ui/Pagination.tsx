// resources/js/components/ui/Pagination.tsx
import { Link } from '@inertiajs/react';
import React from 'react';

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
  baseUrl?: string; // Opcional, si no se pasa usa la URL actual
  preserveState?: boolean;
  preserveScroll?: boolean;
  only?: string[]; // Para actualizar solo ciertos datos
  onPageChange?: (page: number) => void; // Para paginación en memoria
  useLinks?: boolean; // Para elegir entre links de Inertia o callbacks
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  lastPage,
  total,
  perPage,
  baseUrl,
  preserveState = true,
  preserveScroll = true,
  only,
  onPageChange,
  useLinks = true, // Por defecto usa links de Inertia
}) => {
  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, total);
  
  // Función para construir la URL
  const getPageUrl = (page: number) => {
    // Si no se proporciona baseUrl, usar la URL actual sin el parámetro page
    if (!baseUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('page', page.toString());
      return url.pathname + url.search;
    }
    
    // Si hay baseUrl, construir desde cero
    const params = new URLSearchParams(window.location.search);
    params.set('page', page.toString());
    return `${baseUrl}?${params.toString()}`;
  };
  
  // Determinar qué datos actualizar
  const getOnly = () => {
    if (only) return only;
    // Por defecto, según la URL actual
    if (window.location.pathname.includes('contactos')) {
      return ['contactos'];
    }
    if (window.location.pathname.includes('prospectos')) {
      return ['leads'];
    }
    return undefined;
  };

  const handlePageChange = (page: number) => {
    if (onPageChange) {
      onPageChange(page);
    }
  };

  const renderPreviousButton = () => {
    const disabled = currentPage === 1;
    const className = `px-3 py-1 border rounded text-sm ${
      disabled 
        ? 'text-gray-400 border-gray-300 cursor-not-allowed pointer-events-none' 
        : 'text-gray-700 border-gray-300 hover:bg-gray-50'
    }`;

    if (useLinks) {
      return (
        <Link
          key="prev-link"
          href={getPageUrl(currentPage - 1)}
          className={className}
          preserveState={preserveState}
          preserveScroll={preserveScroll}
          only={getOnly()}
          disabled={disabled}
        >
          ← Anterior
        </Link>
      );
    } else {
      return (
        <button
          key="prev-button"
          onClick={() => handlePageChange(currentPage - 1)}
          disabled={disabled}
          className={className}
        >
          ← Anterior
        </button>
      );
    }
  };

  const renderNextButton = () => {
    const disabled = currentPage === lastPage;
    const className = `px-3 py-1 border rounded text-sm ${
      disabled 
        ? 'text-gray-400 border-gray-300 cursor-not-allowed pointer-events-none' 
        : 'text-gray-700 border-gray-300 hover:bg-gray-50'
    }`;

    if (useLinks) {
      return (
        <Link
          key="next-link"
          href={getPageUrl(currentPage + 1)}
          className={className}
          preserveState={preserveState}
          preserveScroll={preserveScroll}
          only={getOnly()}
          disabled={disabled}
        >
          Siguiente →
        </Link>
      );
    } else {
      return (
        <button
          key="next-button"
          onClick={() => handlePageChange(currentPage + 1)}
          disabled={disabled}
          className={className}
        >
          Siguiente →
        </button>
      );
    }
  };
  
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
      <div className="text-sm text-gray-700">
        Mostrando <span className="font-medium">{startItem}</span> a{' '}
        <span className="font-medium">{endItem}</span>{' '}
        de <span className="font-medium">{total}</span> totales
      </div>
      <div className="flex items-center space-x-2">
        {renderPreviousButton()}
        
        <span className="px-3 py-1 text-sm text-gray-700 hidden sm:inline">
          Página {currentPage} de {lastPage}
        </span>
        
        <div className="flex items-center space-x-1 sm:hidden">
          <span className="text-sm text-gray-700">{currentPage}</span>
          <span className="text-sm text-gray-400">/</span>
          <span className="text-sm text-gray-700">{lastPage}</span>
        </div>
        
        {renderNextButton()}
      </div>
    </div>
  );
};

export default Pagination;