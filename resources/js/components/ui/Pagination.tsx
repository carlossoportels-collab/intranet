// resources/js/components/ui/Pagination.tsx
import { Link } from '@inertiajs/react';
import React from 'react';

interface PaginationProps {
  currentPage: number;
  lastPage: number;
  total: number;
  perPage: number;
  baseUrl?: string;
  preserveState?: boolean;
  preserveScroll?: boolean;
  only?: string[];
  onPageChange?: (page: number) => void;
  useLinks?: boolean;
  className?: string;
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
  useLinks = true,
  className = '',
}) => {
  const startItem = (currentPage - 1) * perPage + 1;
  const endItem = Math.min(currentPage * perPage, total);
  
  const getPageUrl = (page: number) => {
    if (!baseUrl) {
      const url = new URL(window.location.href);
      url.searchParams.set('page', page.toString());
      return url.pathname + url.search;
    }
    
    const params = new URLSearchParams(window.location.search);
    params.set('page', page.toString());
    return `${baseUrl}?${params.toString()}`;
  };
  
  const getOnly = () => {
    if (only) return only;
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

  const renderPageNumbers = () => {
    const pages = [];
    const maxVisible = 5;
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisible / 2));
    let endPage = Math.min(lastPage, startPage + maxVisible - 1);
    
    if (endPage - startPage + 1 < maxVisible) {
      startPage = Math.max(1, endPage - maxVisible + 1);
    }

    for (let i = startPage; i <= endPage; i++) {
      const isActive = i === currentPage;
      const pageNumber = i;

      if (useLinks) {
        pages.push(
          <Link
            key={`page-${i}`}
            href={getPageUrl(i)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-all flex items-center justify-center
              ${isActive 
                ? 'bg-sat text-white shadow-md shadow-sat/30' 
                : 'text-slate-600 hover:bg-sat-50 hover:text-sat'
              }`}
            preserveState={preserveState}
            preserveScroll={preserveScroll}
            only={getOnly()}
          >
            {i}
          </Link>
        );
      } else {
        pages.push(
          <button
            key={`page-${i}`}
            onClick={() => handlePageChange(i)}
            className={`w-9 h-9 rounded-lg text-sm font-medium transition-all
              ${isActive 
                ? 'bg-sat text-white shadow-md shadow-sat/30' 
                : 'text-slate-600 hover:bg-sat-50 hover:text-sat'
              }`}
          >
            {i}
          </button>
        );
      }
    }
    
    return pages;
  };

  const renderPreviousButton = () => {
    const disabled = currentPage === 1;
    const className = `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
      disabled 
        ? 'text-slate-300 cursor-not-allowed pointer-events-none' 
        : 'text-slate-600 hover:bg-sat-50 hover:text-sat border border-slate-200 hover:border-sat/30'
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
    const className = `px-4 py-2 rounded-lg text-sm font-medium transition-all ${
      disabled 
        ? 'text-slate-300 cursor-not-allowed pointer-events-none' 
        : 'text-slate-600 hover:bg-sat-50 hover:text-sat border border-slate-200 hover:border-sat/30'
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
    <div className={`flex flex-col sm:flex-row items-center justify-between mt-6 gap-4 ${className}`}>
      {/* Información de resultados */}
      <div className="text-sm text-slate-500 order-2 sm:order-1">
        Mostrando <span className="font-medium text-sat">{startItem}</span> a{' '}
        <span className="font-medium text-sat">{endItem}</span>{' '}
        de <span className="font-medium text-sat">{total}</span> resultados
      </div>

      {/* Versión móvil: botones grandes */}
      <div className="flex sm:hidden items-center gap-2 w-full order-1 sm:order-2">
        {useLinks ? (
          <Link
            href={getPageUrl(currentPage - 1)}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium text-center transition-all ${
              currentPage === 1
                ? 'text-slate-300 bg-slate-100 pointer-events-none'
                : 'text-sat bg-sat-50 hover:bg-sat-100'
            }`}
            preserveState={preserveState}
            preserveScroll={preserveScroll}
            only={getOnly()}
            disabled={currentPage === 1}
          >
            ← Anterior
          </Link>
        ) : (
          <button
            onClick={() => handlePageChange(currentPage - 1)}
            disabled={currentPage === 1}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              currentPage === 1
                ? 'text-slate-300 bg-slate-100'
                : 'text-sat bg-sat-50 hover:bg-sat-100'
            }`}
          >
            ← Anterior
          </button>
        )}
        
        <span className="px-3 py-2 text-sm font-medium text-slate-600">
          {currentPage}/{lastPage}
        </span>
        
        {useLinks ? (
          <Link
            href={getPageUrl(currentPage + 1)}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium text-center transition-all ${
              currentPage === lastPage
                ? 'text-slate-300 bg-slate-100 pointer-events-none'
                : 'text-sat bg-sat-50 hover:bg-sat-100'
            }`}
            preserveState={preserveState}
            preserveScroll={preserveScroll}
            only={getOnly()}
            disabled={currentPage === lastPage}
          >
            Siguiente →
          </Link>
        ) : (
          <button
            onClick={() => handlePageChange(currentPage + 1)}
            disabled={currentPage === lastPage}
            className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
              currentPage === lastPage
                ? 'text-slate-300 bg-slate-100'
                : 'text-sat bg-sat-50 hover:bg-sat-100'
            }`}
          >
            Siguiente →
          </button>
        )}
      </div>

      {/* Versión desktop: paginación completa */}
      <div className="hidden sm:flex items-center gap-2 order-2">
        {renderPreviousButton()}
        
        <div className="flex items-center gap-1 px-2">
          {renderPageNumbers()}
        </div>
        
        {renderNextButton()}
      </div>
    </div>
  );
};

export default Pagination;