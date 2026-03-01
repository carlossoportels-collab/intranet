// resources/js/components/presupuestos/AbonoSelector.tsx
import { Loader2, CreditCard, FileText } from 'lucide-react';
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
    onChange: (productoId: number, tipo: 'abono' | 'convenio') => void;
    error?: string | null;
    disabled?: boolean;
}

export default function AbonoSelector({ value, onChange, error, disabled = false }: Props) {
    const [tipo, setTipo] = useState<'abono' | 'convenio'>('abono');
    const [productos, setProductos] = useState<ProductoServicioDTO[]>([]);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        fetchProductos();
    }, [tipo]);

    const fetchProductos = async () => {
        setLoading(true);
        try {
            const response = await fetch(`/comercial/api/presupuestos/abonos?tipo=${tipo}`);
            const data = await response.json();
            setProductos(data);
        } catch (error) {
            console.error('Error cargando productos:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleValueChange = (value: string) => {
        const productoId = Number(value);
        if (productoId) {
            onChange(productoId, tipo);
        }
    };

    return (
        <div className="space-y-4">
            {/* Selector de tipo simplificado - un renglón */}
            <div className="flex gap-3">
                <button
                    type="button"
                    onClick={() => setTipo('abono')}
                    disabled={disabled}
                    className={`
                        flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all
                        ${tipo === 'abono' 
                            ? 'border-local bg-local/5 text-local' 
                            : 'border-gray-200 bg-white text-gray-600 hover:border-local/30 hover:bg-gray-50'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                >
                    <CreditCard className="h-4 w-4" />
                    <span className="font-medium text-sm">Abono Mensual</span>
                </button>

                <button
                    type="button"
                    onClick={() => setTipo('convenio')}
                    disabled={disabled}
                    className={`
                        flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 transition-all
                        ${tipo === 'convenio' 
                            ? 'border-local bg-local/5 text-local' 
                            : 'border-gray-200 bg-white text-gray-600 hover:border-local/30 hover:bg-gray-50'
                        }
                        ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                    `}
                >
                    <FileText className="h-4 w-4" />
                    <span className="font-medium text-sm">Convenio</span>
                </button>
            </div>

            {/* Selector de productos */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Seleccionar {tipo === 'abono' ? 'Abono' : 'Convenio'}
                </label>
                <Select
                    value={value?.toString() || ''}
                    onValueChange={handleValueChange}
                    disabled={loading || disabled}
                >
                    <SelectTrigger className={`
                        w-full bg-white border-2 h-12
                        ${error ? 'border-red-300' : 'border-gray-200'}
                        ${!disabled && !error && 'hover:border-local focus:border-local focus:ring-2 focus:ring-local/20'}
                        transition-all
                    `}>
                        <SelectValue placeholder={loading ? 'Cargando...' : `Elige un ${tipo}`} />
                    </SelectTrigger>
                    <SelectContent className="bg-white border border-gray-200 shadow-xl max-h-80">
                        {loading ? (
                            <div className="flex items-center justify-center p-4">
                                <Loader2 className="h-5 w-5 animate-spin text-local" />
                            </div>
                        ) : productos.length === 0 ? (
                            <div className="p-4 text-center text-sm text-gray-500">
                                No hay {tipo === 'abono' ? 'abonos' : 'convenios'} disponibles
                            </div>
                        ) : (
                            productos.map(producto => {
                                const precio = Number(producto.precio) || 0;
                                return (
                                    <SelectItem 
                                        key={producto.id} 
                                        value={producto.id.toString()}
                                        className="py-2 px-3 cursor-pointer hover:bg-gray-50"
                                    >
                                        <div className="flex items-center justify-between w-full gap-4">
                                            <span className="text-sm text-gray-900 truncate max-w-[200px]">
                                                {producto.nombre}
                                            </span>
                                            <span className="text-local font-medium text-sm whitespace-nowrap">
                                                ${precio.toFixed(2)}
                                            </span>
                                        </div>
                                    </SelectItem>
                                );
                            })
                        )}
                    </SelectContent>
                </Select>
                {error && (
                    <p className="text-xs text-red-600 mt-1">{error}</p>
                )}
            </div>
        </div>
    );
}