// resources/js/hooks/usePagination.ts
import { useState, useMemo, useCallback } from 'react';

interface UsePaginationProps<T> {
    items: T[];
    initialItemsPerPage?: number;
    initialPage?: number;
}

interface UsePaginationReturn<T> {
    // Estados
    currentPage: number;
    itemsPerPage: number;
    totalItems: number;
    totalPages: number;
    startIndex: number;
    endIndex: number;
    paginatedItems: T[];
    
    // Métodos
    goToPage: (page: number) => void;
    nextPage: () => void;
    prevPage: () => void;
    setItemsPerPage: (newItemsPerPage: number) => void;
    resetPagination: () => void;
    
    // Utilidades
    canGoNext: boolean;
    canGoPrev: boolean;
    pageNumbers: number[];
}

export function usePagination<T>({ 
    items, 
    initialItemsPerPage = 5,
    initialPage = 1 
}: UsePaginationProps<T>): UsePaginationReturn<T> {
    const [currentPage, setCurrentPage] = useState(initialPage);
    const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

    // Resetear a página 1 cuando cambian los items o itemsPerPage
    useMemo(() => {
        setCurrentPage(1);
    }, [items.length, itemsPerPage]);

    const totalItems = items.length;
    const totalPages = Math.max(1, Math.ceil(totalItems / itemsPerPage));
    
    // Asegurar que currentPage está dentro de los límites
    const validCurrentPage = Math.max(1, Math.min(currentPage, totalPages));
    if (validCurrentPage !== currentPage) {
        setCurrentPage(validCurrentPage);
    }

    const startIndex = (validCurrentPage - 1) * itemsPerPage;
    const endIndex = Math.min(startIndex + itemsPerPage, totalItems);
    const paginatedItems = items.slice(startIndex, endIndex);

    const canGoNext = validCurrentPage < totalPages;
    const canGoPrev = validCurrentPage > 1;

    // Calcular números de página para mostrar (máximo 5)
    const pageNumbers = useMemo(() => {
        const maxVisible = 5;
        let startPage = Math.max(1, validCurrentPage - Math.floor(maxVisible / 2));
        let endPage = Math.min(totalPages, startPage + maxVisible - 1);
        
        if (endPage - startPage + 1 < maxVisible) {
            startPage = Math.max(1, endPage - maxVisible + 1);
        }

        return Array.from(
            { length: endPage - startPage + 1 }, 
            (_, i) => startPage + i
        );
    }, [validCurrentPage, totalPages]);

    const goToPage = useCallback((page: number) => {
        const newPage = Math.max(1, Math.min(page, totalPages));
        setCurrentPage(newPage);
    }, [totalPages]);

    const nextPage = useCallback(() => {
        if (canGoNext) {
            setCurrentPage(prev => prev + 1);
        }
    }, [canGoNext]);

    const prevPage = useCallback(() => {
        if (canGoPrev) {
            setCurrentPage(prev => prev - 1);
        }
    }, [canGoPrev]);

    const changeItemsPerPage = useCallback((newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1); // Reset a primera página
    }, []);

    const resetPagination = useCallback(() => {
        setCurrentPage(1);
        setItemsPerPage(initialItemsPerPage);
    }, [initialItemsPerPage]);

    return {
        // Estados
        currentPage: validCurrentPage,
        itemsPerPage,
        totalItems,
        totalPages,
        startIndex,
        endIndex,
        paginatedItems,
        
        // Métodos
        goToPage,
        nextPage,
        prevPage,
        setItemsPerPage: changeItemsPerPage,
        resetPagination,
        
        // Utilidades
        canGoNext,
        canGoPrev,
        pageNumbers,
    };
}