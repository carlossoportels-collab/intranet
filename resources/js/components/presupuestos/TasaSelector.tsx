// resources/js/components/presupuestos/TasaSelector.tsx
import { Loader2, Truck, Calendar } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductoServicioDTO } from '@/types/presupuestos';

interface Props {
    value?: number;
    onChange: (tasaId: number) => void;
    error?: string | null;
    disabled?: boolean;
    tasas: ProductoServicioDTO[];
}

export default function TasaSelector({ value, onChange, error, disabled = false, tasas }: Props) {
    const [loading, setLoading] = useState(false);

    const handleValueChange = (value: string) => {
        const tasaId = Number(value);
        if (tasaId) {
            onChange(tasaId);
        }
    };

    return (
        <div className="space-y-4">
            {/* Selector de tasas */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Seleccionar Tasa de Instalación
                </label>
                <Select
                    value={value?.toString() || ''}
                    onValueChange={handleValueChange}
                    disabled={loading || disabled || tasas.length === 0}
                >
                    <SelectTrigger className={`
                        w-full bg-white border-2 h-12
                        ${error ? 'border-red-300' : 'border-gray-200'}
                        ${!disabled && !error && 'hover:border-local focus:border-local focus:ring-2 focus:ring-local/20'}
                        transition-all
                    `}>
                        <SelectValue placeholder={loading ? 'Cargando...' : 'Elige una tasa de instalación'} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-xl max-h-80">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center p-8">
                                <Loader2 className="h-8 w-8 animate-spin text-local mb-2" />
                                <p className="text-sm text-gray-500">Cargando tasas...</p>
                            </div>
                        ) : tasas.length === 0 ? (
                            <div className="p-8 text-center">
                                <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                <p className="text-sm text-gray-500">No hay tasas disponibles</p>
                            </div>
                        ) : (
                            tasas.map(tasa => {
                                const precio = Number(tasa.precio) || 0;
                                return (
                                    <SelectItem 
                                        key={tasa.id} 
                                        value={tasa.id.toString()}
                                        className="py-3 px-4 cursor-pointer hover:bg-gray-50"
                                    >
                                        <div className="flex items-center justify-between w-full">
                                            <div className="flex items-center gap-3">
                                                <Truck className="h-4 w-4 text-local" />
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {tasa.nombre}
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="text-local font-bold bg-local/10 px-3 py-1 rounded-full text-sm">
                                                ${precio.toFixed(2)}
                                            </div>
                                        </div>
                                    </SelectItem>
                                );
                            })
                        )}
                    </SelectContent>
                </Select>
                {error && (
                    <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                        <span className="inline-block w-1 h-1 bg-red-600 rounded-full" />
                        {error}
                    </p>
                )}
            </div>
        </div>
    );
}