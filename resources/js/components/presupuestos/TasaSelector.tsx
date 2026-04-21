// resources/js/components/presupuestos/TasaSelector.tsx
import { Loader2, Truck, Calendar, XCircle, Edit3 } from 'lucide-react';
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
    onChange: (tasaId: number, valorManual?: number) => void;
    error?: string | null;
    disabled?: boolean;
    tasas: ProductoServicioDTO[];
    valorManual?: number;
    onValorManualChange?: (valor: number) => void;
}

export default function TasaSelector({ 
    value, 
    onChange, 
    error, 
    disabled = false, 
    tasas,
    valorManual = 0,
    onValorManualChange
}: Props) {
    const [loading, setLoading] = useState(false);
    const [mostrarInputManual, setMostrarInputManual] = useState(false);

    const tasaSeleccionada = tasas.find(t => t.id === value);
    const esPrecioConsultar = tasaSeleccionada && Number(tasaSeleccionada.precio) === 0.01;

    // 🔥 Efecto para actualizar mostrarInputManual cuando cambia la tasa seleccionada
    useEffect(() => {
        if (value && value !== 0 && tasaSeleccionada) {
            const precio = Number(tasaSeleccionada.precio);
            if (precio === 0.01) {
                setMostrarInputManual(true);
            } else {
                setMostrarInputManual(false);
            }
        } else {
            setMostrarInputManual(false);
        }
    }, [value, tasaSeleccionada]);

    const handleValueChange = (value: string) => {
        const tasaId = Number(value);
        if (tasaId === 0) {
            // Seleccionó "Ninguno"
            setMostrarInputManual(false);
            onChange(0, 0);
        } else {
            const tasa = tasas.find(t => t.id === tasaId);
            const precio = Number(tasa?.precio) || 0;
            
            if (precio === 0.01) {
                // Es "Consultar", mostrar input manual
                setMostrarInputManual(true);
                onChange(tasaId, valorManual);
            } else {
                setMostrarInputManual(false);
                onChange(tasaId, precio);
            }
        }
    };

    const handleValorManualChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const nuevoValor = e.target.value === '' ? 0 : Number(e.target.value);
        if (!isNaN(nuevoValor) && onValorManualChange) {
            onValorManualChange(nuevoValor);
            onChange(value || 0, nuevoValor);
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
                        ) : (
                            <>
                                {/* OPCIÓN "NINGUNO" - Limpiar selección */}
                                <SelectItem 
                                    value="0" 
                                    className="py-3 px-4 cursor-pointer hover:bg-gray-50 border-b border-gray-100"
                                >
                                    <div className="flex items-center gap-3">
                                        <XCircle className="h-4 w-4 text-gray-400" />
                                        <span className="text-gray-500">Ninguno (sin tasa)</span>
                                    </div>
                                </SelectItem>
                                
                                {tasas.length === 0 ? (
                                    <div className="p-8 text-center">
                                        <Calendar className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                                        <p className="text-sm text-gray-500">No hay tasas disponibles</p>
                                    </div>
                                ) : (
                                    tasas.map(tasa => {
                                        const precio = Number(tasa.precio) || 0;
                                        const esConsultar = precio === 0.01;
                                        
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
                                                    {esConsultar ? (
                                                        <span className="text-amber-600 font-medium text-sm whitespace-nowrap bg-amber-50 px-3 py-1 rounded-full">
                                                            Consultar
                                                        </span>
                                                    ) : (
                                                        <div className="text-local font-bold bg-local/10 px-3 py-1 rounded-full text-sm">
                                                            ${precio.toFixed(2)}
                                                        </div>
                                                    )}
                                                </div>
                                            </SelectItem>
                                        );
                                    })
                                )}
                            </>
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

            {/* 🔥 Input para precio manual cuando es "Consultar" */}
            {mostrarInputManual && !disabled && (
                <div className="space-y-2 p-4 bg-amber-50 rounded-lg border border-amber-200">
                    <label className="block text-sm font-medium text-amber-700">
                        Precio manual (Consultar)
                    </label>
                    <div className="relative">
                        <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">$</span>
                        <input
                            type="number"
                            min="0"
                            step="0.01"
                            value={valorManual || ''}
                            onChange={handleValorManualChange}
                            placeholder="Ingrese el precio acordado"
                            className="w-full pl-8 pr-4 py-2 border-2 border-amber-300 rounded-lg focus:border-amber-500 focus:ring-2 focus:ring-amber-200 text-sm bg-white"
                        />
                    </div>
                    <p className="text-xs text-amber-600">
                        Este producto requiere consultar precio. Ingrese el valor informado por administración.
                    </p>
                    {valorManual > 0 && (
                        <div className="mt-2 bg-amber-100 p-2 rounded-lg">
                            <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-amber-800">Precio ingresado:</span>
                                <span className="text-base font-bold text-amber-800">
                                    ${valorManual.toFixed(2)}
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {/* Mostrar precio actual si no es consultar y hay tasa seleccionada */}
            {value && value !== 0 && tasaSeleccionada && !esPrecioConsultar && (
                <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                    <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-green-800">Precio:</span>
                        <span className="text-lg font-bold text-green-800">
                            ${Number(tasaSeleccionada.precio).toFixed(2)}
                        </span>
                    </div>
                </div>
            )}
        </div>
    );
}