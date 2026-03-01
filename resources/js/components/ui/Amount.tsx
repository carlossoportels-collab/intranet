// resources/js/components/ui/Amount.tsx
import React from 'react';

interface AmountProps {
    value: number | string | null | undefined;
    className?: string;
    showSymbol?: boolean;
    symbol?: string;
    decimals?: number;
    color?: 'default' | 'success' | 'warning' | 'danger' | 'local';
    fallback?: string; // Texto a mostrar cuando no hay valor
}

export const Amount: React.FC<AmountProps> = ({
    value,
    className = '',
    showSymbol = true,
    symbol = '$',
    decimals = 2,
    color = 'default',
    fallback = '-'
}) => {
    const formatMoney = (val: number | string | null | undefined): string => {
        // Si es null o undefined, retornar fallback
        if (val === null || val === undefined) {
            return fallback;
        }
        
        // Convertir a número
        const num = typeof val === 'string' ? parseFloat(val) : val;
        
        // Verificar si es un número válido
        if (isNaN(num)) return fallback;
        
        // Formatear número
        const formatted = num.toFixed(decimals)
            .replace('.', ',')
            .replace(/\B(?=(\d{3})+(?!\d))/g, '.');
        
        return showSymbol ? `${symbol} ${formatted}` : formatted;
    };

    const colorClasses = {
        default: 'text-gray-900',
        success: 'text-green-600',
        warning: 'text-yellow-600',
        danger: 'text-red-600',
        local: 'text-local'
    };

    return (
        <span className={`font-medium ${colorClasses[color]} ${className}`}>
            {formatMoney(value)}
        </span>
    );
};

export default Amount;