// resources/js/components/presupuestos/PromocionSelector.tsx
import { Gift, AlertCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PromocionDTO } from '@/types/presupuestos';

interface Props {
    value?: number | null;
    onChange: (promocionId: number | null, productos?: any[]) => void; // ← Mantener compatibilidad
    promociones: PromocionDTO[];
    error?: string | null;
    disabled?: boolean;
}

export default function PromocionSelector({ 
    value, 
    onChange, 
    promociones = [],
    error,
    disabled = false
}: Props) {
    const [promocionSeleccionada, setPromocionSeleccionada] = useState<PromocionDTO | null>(null);

    useEffect(() => {
        if (value) {
            const promo = promociones.find(p => p.id === value);
            setPromocionSeleccionada(promo || null);
        } else {
            setPromocionSeleccionada(null);
        }
    }, [value, promociones]);

    const handleValueChange = (value: string) => {
        if (value === 'ninguna') {
            onChange(null, undefined);
        } else {
            const promoId = Number(value);
            const promo = promociones.find(p => p.id === promoId);
            onChange(promoId, promo?.productos);
        }
    };

    // Agrupar promociones por tipo
    const promocionesPorcentaje = promociones.filter(p => 
        p.productos.every(prod => prod.tipo_promocion === 'porcentaje')
    );
    
    const promociones2x1 = promociones.filter(p => 
        p.productos.some(prod => prod.tipo_promocion === '2x1')
    );
    
    const promociones3x2 = promociones.filter(p => 
        p.productos.some(prod => prod.tipo_promocion === '3x2')
    );

    return (
        <div className="space-y-2">
            <Select
                value={value?.toString() || 'ninguna'}
                onValueChange={handleValueChange}
                disabled={disabled || promociones.length === 0}
            >
                <SelectTrigger className={`w-full bg-white ${error ? 'border-red-300' : ''}`}>
                    <SelectValue placeholder="Seleccionar promoción" />
                </SelectTrigger>
                <SelectContent className="bg-white border border-gray-300 shadow-lg max-h-80">
                    <SelectItem value="ninguna">Sin promoción</SelectItem>
                    
                    {promocionesPorcentaje.length > 0 && (
                        <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                                Descuentos %
                            </div>
                            {promocionesPorcentaje.map(promo => (
                                <SelectItem key={promo.id} value={promo.id.toString()}>
                                    <div className="flex items-center gap-2">
                                        <Gift className="h-4 w-4 text-sat" />
                                        <span>{promo.nombre}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </>
                    )}
                    
                    {promociones2x1.length > 0 && (
                        <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                                2x1
                            </div>
                            {promociones2x1.map(promo => (
                                <SelectItem key={promo.id} value={promo.id.toString()}>
                                    <div className="flex items-center gap-2">
                                        <Gift className="h-4 w-4 text-sat" />
                                        <span>{promo.nombre}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </>
                    )}
                    
                    {promociones3x2.length > 0 && (
                        <>
                            <div className="px-2 py-1.5 text-xs font-semibold text-gray-500 bg-gray-50">
                                3x2
                            </div>
                            {promociones3x2.map(promo => (
                                <SelectItem key={promo.id} value={promo.id.toString()}>
                                    <div className="flex items-center gap-2">
                                        <Gift className="h-4 w-4 text-sat" />
                                        <span>{promo.nombre}</span>
                                    </div>
                                </SelectItem>
                            ))}
                        </>
                    )}
                </SelectContent>
            </Select>
            
            {promocionSeleccionada && (
                <div className="mt-2 p-3 bg-blue-50 rounded-lg border border-blue-200">
                    <h4 className="text-sm font-medium text-blue-800 mb-2">
                        {promocionSeleccionada.nombre}
                    </h4>
                    <div className="space-y-1 text-xs">
                        {promocionSeleccionada.productos.map(prod => (
                            <div key={prod.id} className="flex justify-between text-blue-700">
                                <span>{prod.producto.nombre}:</span>
                                <span className="font-medium">
                                    {prod.tipo_promocion === 'porcentaje' 
                                        ? `${prod.bonificacion}% OFF`
                                        : prod.tipo_promocion === '2x1'
                                            ? '2x1 (50% efectivo)'
                                            : '3x2 (33.33% efectivo)'
                                    }
                                    {prod.cantidad_minima && ` (mín. ${prod.cantidad_minima} unid.)`}
                                </span>
                            </div>
                        ))}
                    </div>
                </div>
            )}
            
            {error && (
                <p className="text-xs text-red-600">{error}</p>
            )}
        </div>
    );
}