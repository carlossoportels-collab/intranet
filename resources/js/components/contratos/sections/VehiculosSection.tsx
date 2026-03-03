// resources/js/components/contratos/sections/VehiculosSection.tsx
import { Truck, Trash2, AlertCircle } from 'lucide-react';
import React, { useEffect } from 'react';

interface Props {
    vehiculos: any[];
    setVehiculos: (vehiculos: any[]) => void;
    cantidadMaxima: number;
}

export default function VehiculosSection({ vehiculos, setVehiculos, cantidadMaxima }: Props) {
    // Efecto para generar automáticamente los vehículos según cantidadMaxima
    useEffect(() => {
        const vehiculosActuales = vehiculos.length;
        
        if (vehiculosActuales < cantidadMaxima) {
            // Faltan vehículos, los agregamos
            const nuevosVehiculos = [...vehiculos];
            for (let i = vehiculosActuales; i < cantidadMaxima; i++) {
                nuevosVehiculos.push({
                    patente: '',
                    marca: '',
                    modelo: '',
                    anio: '',
                    color: '',
                    identificador: ''
                });
            }
            setVehiculos(nuevosVehiculos);
        } else if (vehiculosActuales > cantidadMaxima) {
            // Sobran vehículos (por si cambia la cantidad), recortamos
            setVehiculos(vehiculos.slice(0, cantidadMaxima));
        }
    }, [cantidadMaxima]); // Solo se ejecuta si cambia cantidadMaxima

    const todosCompletados = vehiculos.every(v => v.patente && v.patente.trim() !== '');
    
    const eliminarVehiculo = (index: number) => {
        // Evitar eliminar si estamos en el mínimo requerido
        if (vehiculos.length <= cantidadMaxima) {
            // Mostramos un mensaje o simplemente no dejamos eliminar
            return;
        }
        setVehiculos(vehiculos.filter((_, i) => i !== index));
    };

    const updateVehiculo = (index: number, field: string, value: string) => {
        const nuevos = [...vehiculos];
        nuevos[index] = { ...nuevos[index], [field]: value };
        setVehiculos(nuevos);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            {/* Header simplificado */}
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-blue-600" />
                    <h3 className="font-medium text-gray-900">
                        Vehículos a equipar ({vehiculos.length})
                    </h3>
                </div>
            </div>
            
            <div className="p-3 space-y-2">
                {/* Lista de vehículos generados automáticamente */}
                <div className="space-y-2">
                    {vehiculos.map((vehiculo, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
                            {/* Header del vehículo */}
                            <div className="flex items-center justify-between mb-2">
                                <div className="flex items-center gap-2">
                                    <span className="w-5 h-5 bg-gray-100 text-gray-600 rounded-full flex items-center justify-center text-xs font-medium">
                                        {index + 1}
                                    </span>
                                    <span className="text-xs font-medium text-gray-700">
                                        Vehículo #{index + 1}
                                    </span>
                                    {!vehiculo.patente && (
                                        <span className="text-xs text-amber-600 flex items-center gap-1">
                                            <AlertCircle className="h-3 w-3" />
                                            Pendiente
                                        </span>
                                    )}
                                </div>
                                {/* Solo mostramos eliminar si hay más de la cantidad máxima (por si acaso) */}
                                {vehiculos.length > cantidadMaxima && (
                                    <button
                                        onClick={() => eliminarVehiculo(index)}
                                        className="text-gray-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"
                                        title="Eliminar vehículo"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                            
                            {/* Grid de campos */}
                            <div className="grid grid-cols-4 gap-2">
                                <div className="col-span-1">
                                    <input
                                        type="text"
                                        value={vehiculo.patente}
                                        onChange={(e) => updateVehiculo(index, 'patente', e.target.value.toUpperCase())}
                                        className={`w-full px-2 py-1 text-xs border rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 uppercase ${
                                            !vehiculo.patente ? 'border-amber-300' : 'border-gray-300'
                                        }`}
                                        placeholder="Patente *"
                                        required
                                    />
                                </div>
                                <div className="col-span-1">
                                    <input
                                        type="text"
                                        value={vehiculo.marca}
                                        onChange={(e) => updateVehiculo(index, 'marca', e.target.value)}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Marca"
                                    />
                                </div>
                                <div className="col-span-1">
                                    <input
                                        type="text"
                                        value={vehiculo.modelo}
                                        onChange={(e) => updateVehiculo(index, 'modelo', e.target.value)}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Modelo"
                                    />
                                </div>
                                <div className="col-span-1 flex gap-1">
                                    <input
                                        type="text"
                                        value={vehiculo.anio}
                                        onChange={(e) => updateVehiculo(index, 'anio', e.target.value)}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Año"
                                    />
                                    <input
                                        type="text"
                                        value={vehiculo.color}
                                        onChange={(e) => updateVehiculo(index, 'color', e.target.value)}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Color"
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
                
                {/* Mensaje único y simple */}
                {!todosCompletados && (
                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-xs text-amber-700 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Complete los datos de todos los vehículos para continuar
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}