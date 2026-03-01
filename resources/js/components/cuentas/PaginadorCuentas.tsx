// resources/js/components/cuentas/PaginadorCuentas.tsx
import React from 'react';

interface PaginadorCuentasProps {
    currentPage: number;
    totalPages: number;
    onPageChange: (page: number) => void;
    className?: string;
}

const PaginadorCuentas: React.FC<PaginadorCuentasProps> = ({
    currentPage,
    totalPages,
    onPageChange,
    className = ''
}) => {
    if (totalPages <= 1) return null;

    return (
        <div className={`mt-6 flex flex-col sm:flex-row items-center justify-between gap-4 ${className}`}>
            <div className="text-sm text-slate-500 order-2 sm:order-1">
                Página <span className="font-medium text-indigo-600">{currentPage}</span> de {totalPages}
            </div>
            
            {/* Versión móvil: botones grandes */}
            <div className="flex sm:hidden items-center gap-2 w-full order-1 sm:order-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        currentPage === 1
                            ? 'text-slate-300 bg-slate-100'
                            : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                    }`}
                >
                    ← Anterior
                </button>
                <span className="px-3 py-2 text-sm font-medium text-slate-600">
                    {currentPage}/{totalPages}
                </span>
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`flex-1 px-4 py-3 rounded-lg text-sm font-medium transition-all ${
                        currentPage === totalPages
                            ? 'text-slate-300 bg-slate-100'
                            : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                    }`}
                >
                    Siguiente →
                </button>
            </div>

            {/* Versión desktop: paginación con números */}
            <div className="hidden sm:flex items-center gap-2 order-2">
                <button
                    onClick={() => onPageChange(currentPage - 1)}
                    disabled={currentPage === 1}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        currentPage === 1
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200'
                    }`}
                >
                    ← Anterior
                </button>
                
                <div className="flex items-center gap-1 px-2">
                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNum;
                        if (totalPages <= 5) {
                            pageNum = i + 1;
                        } else if (currentPage <= 3) {
                            pageNum = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                            pageNum = totalPages - 4 + i;
                        } else {
                            pageNum = currentPage - 2 + i;
                        }
                        
                        return (
                            <button
                                key={pageNum}
                                onClick={() => onPageChange(pageNum)}
                                className={`w-9 h-9 rounded-lg text-sm font-medium transition-all ${
                                    currentPage === pageNum
                                        ? 'bg-indigo-600 text-white shadow-md'
                                        : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600'
                                }`}
                            >
                                {pageNum}
                            </button>
                        );
                    })}
                </div>
                
                <button
                    onClick={() => onPageChange(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                        currentPage === totalPages
                            ? 'text-slate-300 cursor-not-allowed'
                            : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-600 border border-slate-200 hover:border-indigo-200'
                    }`}
                >
                    Siguiente →
                </button>
            </div>
        </div>
    );
};

export default PaginadorCuentas;