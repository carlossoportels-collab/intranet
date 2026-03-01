// resources/js/components/cuentas/AbonoBadge.tsx
import React from 'react';
import { formatMoney } from '@/utils/formatters';

interface AbonoBadgeProps {
    nombre: string;
    precio: number;
    codigo?: string;
    showPrice?: boolean;
    className?: string;
}

const AbonoBadge: React.FC<AbonoBadgeProps> = ({
    nombre,
    precio,
    codigo,
    showPrice = true,
    className = ''
}) => {
    const getAbonoColorClasses = (abonoNombre: string) => {
        const nombreLower = abonoNombre.toLowerCase();
        
        if (nombreLower.includes('abono') || nombreLower.includes('verde')) {
            return 'bg-green-50 border-green-200 text-green-800';
        } else if (nombreLower.includes('suspendido') || nombreLower.includes('suspension')) {
            return 'bg-red-50 border-red-200 text-red-800';
        } else if (nombreLower.includes('servicio') || nombreLower.includes('serv')) {
            return 'bg-blue-50 border-blue-200 text-blue-800';
        } else {
            return 'bg-yellow-50 border-yellow-200 text-yellow-800';
        }
    };

    return (
        <div className={`text-xs p-1.5 rounded border ${getAbonoColorClasses(nombre)} ${className}`}>
            <div className="flex justify-between items-center gap-2">
                <div className="min-w-0 flex-1">
                    <span className="font-medium block truncate">{nombre}</span>
                    {codigo && <span className="text-xs opacity-75 block truncate">{codigo}</span>}
                </div>
                {showPrice && (
                    <span className="font-bold whitespace-nowrap">{formatMoney(precio)}</span>
                )}
            </div>
        </div>
    );
};

export default AbonoBadge;