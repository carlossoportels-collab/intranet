// resources/js/hooks/usePagination.ts
import { useState, useMemo } from 'react';

interface UsePaginationProps<T> {
    items: T[];
    initialItemsPerPage?: number;
}

export function usePagination<T>({ items, initialItemsPerPage = 5 }: UsePaginationProps<T>) {
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(initialItemsPerPage);

    const totalItems = items.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const paginatedItems = items.slice(startIndex, endIndex);

    const goToPage = (page: number) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const changeItemsPerPage = (newItemsPerPage: number) => {
        setItemsPerPage(newItemsPerPage);
        setCurrentPage(1);
    };

    return {
        currentPage,
        itemsPerPage,
        totalItems,
        totalPages,
        startIndex,
        endIndex,
        paginatedItems,
        goToPage,
        setItemsPerPage: changeItemsPerPage,
    };
}