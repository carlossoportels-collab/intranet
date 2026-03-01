// resources/js/utils/formatters.ts

export const formatMoney = (value: any): string => {
    const num = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(num)) return '$ 0,00';
    return '$ ' + num.toFixed(2)
        .replace('.', ',')
        .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const formatWhatsAppMoney = (value: number): string => {
    return '$' + value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
};

export const formatDate = (date: string | null | undefined): string => {
    if (!date) return 'N/A';
    try {
        return new Date(date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'long',
            year: 'numeric'
        });
    } catch {
        return date;
    }
};

export const formatShortDate = (date: string | null | undefined): string => {
    if (!date) return 'N/A';
    try {
        return new Date(date).toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    } catch {
        return date;
    }
};

export const toNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    const num = typeof value === 'string' ? parseFloat(value) : value;
    return isNaN(num) ? 0 : num;
};