// resources/js/components/presupuestos/ServiciosList.tsx
import { Plus, Trash2, Wrench, Percent } from 'lucide-react';
import React, { useCallback, useEffect } from 'react';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductoServicioDTO, PresupuestoAgregadoDTO } from '@/types/presupuestos';

interface Props {
    servicios: ProductoServicioDTO[];
    items: PresupuestoAgregadoDTO[];
    cantidadVehiculos: number;
    onChange: (items: PresupuestoAgregadoDTO[]) => void;
}

export default function ServiciosList({ servicios, items, cantidadVehiculos, onChange }: Props) {
    const agregarServicio = useCallback(() => {
        const nuevoItem: PresupuestoAgregadoDTO = {
            prd_servicio_id: 0,
            cantidad: 1,
            aplica_a_todos_vehiculos: false,
            valor: 0,
            bonificacion: 0,
            subtotal: 0
        };
        onChange([...items, nuevoItem]);
    }, [items, onChange]);

    const actualizarItem = useCallback((index: number, campo: keyof PresupuestoAgregadoDTO, valor: any) => {
        const nuevosItems = [...items];
        const item = { ...nuevosItems[index], [campo]: valor };
        
        if (campo === 'aplica_a_todos_vehiculos') {
            if (valor === true) {
                item.cantidad = cantidadVehiculos;
            } else {
                item.cantidad = 1;
            }
        }
        
        if (campo === 'prd_servicio_id' && valor !== 0) {
            const servicio = servicios.find(s => s.id === valor);
            if (servicio) {
                item.valor = Number(servicio.precio) || 0;
            }
        }
        
        const cantidad = item.aplica_a_todos_vehiculos ? cantidadVehiculos : item.cantidad;
        const subtotal = Number(item.valor) * cantidad;
        item.subtotal = item.bonificacion > 0 
            ? subtotal * (1 - item.bonificacion / 100)
            : subtotal;
        
        nuevosItems[index] = item;
        onChange(nuevosItems);
    }, [items, servicios, cantidadVehiculos, onChange]);

    useEffect(() => {
        let necesitaActualizar = false;
        const nuevosItems = items.map(item => {
            if (item.aplica_a_todos_vehiculos && item.cantidad !== cantidadVehiculos) {
                necesitaActualizar = true;
                const newItem = { ...item, cantidad: cantidadVehiculos };
                const subtotal = Number(newItem.valor) * cantidadVehiculos;
                newItem.subtotal = newItem.bonificacion > 0 
                    ? subtotal * (1 - newItem.bonificacion / 100)
                    : subtotal;
                return newItem;
            }
            return item;
        });
        
        if (necesitaActualizar) {
            onChange(nuevosItems);
        }
    }, [cantidadVehiculos, items, onChange]);

    const eliminarItem = useCallback((index: number) => {
        onChange(items.filter((_, i) => i !== index));
    }, [items, onChange]);

    if (servicios.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No hay servicios disponibles</p>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header con título y botón */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
                <div className="flex items-center gap-2">
                    <div className="p-2 bg-blue-100 rounded-lg">
                        <Wrench className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                        <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                            Servicios Adicionales
                        </h3>
                        <p className="text-xs text-gray-500">
                            {items.length} servicio{items.length !== 1 ? 's' : ''} seleccionado{items.length !== 1 ? 's' : ''}
                        </p>
                    </div>
                </div>
                <button
                    type="button"
                    onClick={agregarServicio}
                    className="inline-flex items-center justify-center px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors shadow-sm hover:shadow w-full sm:w-auto"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Agregar Servicio
                </button>
            </div>

            {/* Items existentes */}
            {items.length > 0 && (
                <div className="space-y-3">
                    {items.map((item, index) => (
                        <div key={index} className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md transition-shadow">
                            {/* Header del item */}
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <div className="p-1.5 bg-blue-50 rounded-lg">
                                        <Wrench className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <span className="font-medium text-gray-700">
                                        Servicio #{index + 1}
                                    </span>
                                    {item.aplica_a_todos_vehiculos && (
                                        <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-full">
                                            Todos ({cantidadVehiculos})
                                        </span>
                                    )}
                                </div>
                                <button
                                    type="button"
                                    onClick={() => eliminarItem(index)}
                                    className="p-1.5 hover:bg-red-50 rounded-lg transition-colors group"
                                >
                                    <Trash2 className="h-4 w-4 text-gray-400 group-hover:text-red-500" />
                                </button>
                            </div>

                            {/* Grid de controles - Desktop */}
                            <div className="hidden sm:grid sm:grid-cols-12 gap-2 items-center">
                                {/* Selector de servicio - más ancho para textos largos */}
                                <div className="col-span-5">
                                    <Select
                                        value={item.prd_servicio_id?.toString() || ''}
                                        onValueChange={(value) => actualizarItem(index, 'prd_servicio_id', Number(value))}
                                    >
                                        <SelectTrigger className="bg-white border-gray-200 hover:border-blue-400 focus:ring-2 focus:ring-blue-200 h-10">
                                            <SelectValue placeholder="Seleccionar servicio" />
                                        </SelectTrigger>
                                        <SelectContent className="bg-white max-h-80 min-w-[300px]">
                                            {servicios.map(servicio => (
                                                <SelectItem key={servicio.id} value={servicio.id.toString()}>
                                                    <div className="flex items-center justify-between w-full gap-4">
                                                        <span className="text-sm text-gray-900 truncate max-w-[250px]">
                                                            {servicio.nombre}
                                                        </span>
                                                        <span className="text-local font-medium text-sm whitespace-nowrap">
                                                            ${Number(servicio.precio).toFixed(2)}
                                                        </span>
                                                    </div>
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>

                                {/* Cantidad - más pequeño */}
                                <div className="col-span-2">
                                    <input
                                        type="number"
                                        min="1"
                                        max="999"
                                        value={item.cantidad}
                                        onChange={(e) => actualizarItem(index, 'cantidad', Number(e.target.value))}
                                        disabled={item.aplica_a_todos_vehiculos}
                                        className="block w-full px-2 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed text-center"
                                    />
                                </div>

                                {/* Bonificación - más pequeño */}
                                <div className="col-span-2">
                                    <div className="relative">
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={item.bonificacion}
                                            onChange={(e) => actualizarItem(index, 'bonificacion', Number(e.target.value))}
                                            className="block w-full px-2 py-2 border border-gray-200 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-200 text-sm text-center"
                                            placeholder="0%"
                                        />
                                        <Percent className="absolute right-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    </div>
                                </div>

                                {/* Subtotal */}
                                <div className="col-span-2">
                                    <div className="px-2 py-2 bg-blue-50 border border-blue-200 rounded-lg text-blue-700 font-bold text-sm text-center">
                                        ${(item.subtotal || 0).toFixed(2)}
                                    </div>
                                </div>

                                {/* Checkbox "Todos" */}
                                <div className="col-span-1 flex justify-center">
                                    <label className="flex items-center gap-1 cursor-pointer group">
                                        <input
                                            type="checkbox"
                                            checked={item.aplica_a_todos_vehiculos}
                                            onChange={(e) => actualizarItem(index, 'aplica_a_todos_vehiculos', e.target.checked)}
                                            className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                                        />
                                        <span className="text-xs text-gray-600 group-hover:text-blue-600 whitespace-nowrap">
                                            Todos
                                        </span>
                                    </label>
                                </div>
                            </div>

                            {/* Versión móvil */}
                            <div className="block sm:hidden space-y-3">
                                <Select
                                    value={item.prd_servicio_id?.toString() || ''}
                                    onValueChange={(value) => actualizarItem(index, 'prd_servicio_id', Number(value))}
                                >
                                    <SelectTrigger className="bg-white w-full">
                                        <SelectValue placeholder="Seleccionar servicio" />
                                    </SelectTrigger>
                                    <SelectContent className="bg-white">
                                        {servicios.map(servicio => (
                                            <SelectItem key={servicio.id} value={servicio.id.toString()}>
                                                <div className="flex items-center justify-between w-full gap-2">
                                                    <span className="text-sm truncate max-w-[150px]">{servicio.nombre}</span>
                                                    <span className="text-local font-medium">${Number(servicio.precio).toFixed(2)}</span>
                                                </div>
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>

                                <div className="grid grid-cols-2 gap-2">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                            Cantidad
                                        </label>
                                        <input
                                            type="number"
                                            min="1"
                                            value={item.cantidad}
                                            onChange={(e) => actualizarItem(index, 'cantidad', Number(e.target.value))}
                                            disabled={item.aplica_a_todos_vehiculos}
                                            className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm bg-white disabled:bg-gray-100"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">
                                            Bonif. %
                                        </label>
                                        <input
                                            type="number"
                                            min="0"
                                            max="100"
                                            step="0.01"
                                            value={item.bonificacion}
                                            onChange={(e) => actualizarItem(index, 'bonificacion', Number(e.target.value))}
                                            className="block w-full px-3 py-2 border border-gray-200 rounded-lg text-sm"
                                        />
                                    </div>
                                </div>

                                <div className="flex items-center justify-between">
                                    <label className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            checked={item.aplica_a_todos_vehiculos}
                                            onChange={(e) => actualizarItem(index, 'aplica_a_todos_vehiculos', e.target.checked)}
                                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                                        />
                                        <span className="text-sm text-gray-600">
                                            Todos ({cantidadVehiculos})
                                        </span>
                                    </label>
                                    <div className="text-right">
                                        <div className="text-xs text-gray-500">Subtotal</div>
                                        <div className="text-base font-bold text-blue-600">
                                            ${(item.subtotal || 0).toFixed(2)}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Empty state */}
            {items.length === 0 && (
                <div className="text-center py-8 bg-gray-50 rounded-xl border-2 border-dashed border-gray-200">
                    <Wrench className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                    <p className="text-gray-600 font-medium">No hay servicios agregados</p>
                    <p className="text-xs text-gray-400 mt-1">
                        Haz clic en "Agregar Servicio" para comenzar
                    </p>
                </div>
            )}
        </div>
    );
}