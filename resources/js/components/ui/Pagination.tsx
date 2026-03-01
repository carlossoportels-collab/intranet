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
  
  return (
    <div className="flex flex-col sm:flex-row items-center justify-between mt-6 gap-4">
      <div className="text-sm text-gray-700">
        Mostrando <span className="font-medium">{startItem}</span> a{' '}
        <span className="font-medium">{endItem}</span>{' '}
        de <span className="font-medium">{total}</span> totales
      </div>
      <div className="flex items-center space-x-2">
        <Link
          href={getPageUrl(currentPage - 1)}
          className={`px-3 py-1 border rounded text-sm ${
            currentPage === 1 
              ? 'text-gray-400 border-gray-300 cursor-not-allowed pointer-events-none' 
              : 'text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
          preserveState={preserveState}
          preserveScroll={preserveScroll}
          only={getOnly()}
          disabled={currentPage === 1}
        >
          ← Anterior
        </Link>
        
        <span className="px-3 py-1 text-sm text-gray-700 hidden sm:inline">
          Página {currentPage} de {lastPage}
        </span>
        
        <div className="flex items-center space-x-1 sm:hidden">
          <span className="text-sm text-gray-700">{currentPage}</span>
          <span className="text-sm text-gray-400">/</span>
          <span className="text-sm text-gray-700">{lastPage}</span>
        </div>
        
        <Link
          href={getPageUrl(currentPage + 1)}
          className={`px-3 py-1 border rounded text-sm ${
            currentPage === lastPage 
              ? 'text-gray-400 border-gray-300 cursor-not-allowed pointer-events-none' 
              : 'text-gray-700 border-gray-300 hover:bg-gray-50'
          }`}
          preserveState={preserveState}
          preserveScroll={preserveScroll}
          only={getOnly()}
          disabled={currentPage === lastPage}
        >
          Siguiente →
        </Link>
      </div>
    </div>
  );
};

export default Pagination;