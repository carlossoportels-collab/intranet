// resources/js/components/contratos/sections/VehiculosSection.tsx
import { Truck, Plus, Trash2, ArrowUpCircle } from 'lucide-react';
import React from 'react';

interface Props {
    vehiculos: any[];
    setVehiculos: (vehiculos: any[]) => void;
    cantidadMaxima: number;
}

export default function VehiculosSection({ vehiculos, setVehiculos, cantidadMaxima }: Props) {
    const agregarVehiculo = () => {
        if (vehiculos.length < cantidadMaxima) {
            setVehiculos([
                ...vehiculos,
                {
                    patente: '',
                    marca: '',
                    modelo: '',
                    anio: '',
                    color: '',
                    identificador: ''
                }
            ]);
        }
    };

    const eliminarVehiculo = (index: number) => {
        setVehiculos(vehiculos.filter((_, i) => i !== index));
    };

    const updateVehiculo = (index: number, field: string, value: string) => {
        const nuevos = [...vehiculos];
        nuevos[index] = { ...nuevos[index], [field]: value };
        setVehiculos(nuevos);
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <div className="flex justify-between items-center">
                    <div>
                        <h3 className="font-medium text-gray-900 flex items-center gap-2">
                            <Truck className="h-4 w-4 text-blue-600" />
                            Vehículos a equipar
                        </h3>
                        <p className="text-xs text-gray-500 mt-1">
                            Completados {vehiculos.length} de {cantidadMaxima} vehículo{ cantidadMaxima !== 1 ? 's' : '' } presupuestado{ cantidadMaxima !== 1 ? 's' : '' }
                        </p>
                    </div>
                    {vehiculos.length < cantidadMaxima && (
                        <button
                            type="button"
                            onClick={agregarVehiculo}
                            className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                        >
                            <Plus className="h-4 w-4" />
                            Agregar vehículo
                        </button>
                    )}
                </div>
                
                {/* Barra de progreso */}
                <div className="mt-2 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div 
                        className="h-full bg-blue-600 transition-all duration-300"
                        style={{ width: `${(vehiculos.length / cantidadMaxima) * 100}%` }}
                    />
                </div>
            </div>
            
            <div className="p-4 space-y-4">
                {vehiculos.length === 0 ? (
                    <div className="text-center py-8">
                        <Truck className="h-12 w-12 mx-auto text-gray-300 mb-3" />
                        <p className="text-sm text-gray-500 mb-2">
                            No hay vehículos cargados
                        </p>
                        <p className="text-xs text-gray-400 mb-4">
                            Debe cargar al menos un vehículo para generar el contrato
                        </p>
                        <button
                            onClick={agregarVehiculo}
                            className="px-4 py-2 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 inline-flex items-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Cargar primer vehículo
                        </button>
                    </div>
                ) : (
                    vehiculos.map((vehiculo, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-4 hover:border-blue-300 transition-colors">
                            <div className="flex justify-between items-center mb-3">
                                <h4 className="font-medium text-sm flex items-center gap-2">
                                    <span className="w-6 h-6 bg-blue-100 text-blue-700 rounded-full flex items-center justify-center text-xs">
                                        {index + 1}
                                    </span>
                                    Vehículo #{index + 1}
                                </h4>
                                <button
                                    onClick={() => eliminarVehiculo(index)}
                                    className="text-red-600 hover:text-red-700 p-1 hover:bg-red-50 rounded"
                                    title="Eliminar vehículo"
                                >
                                    <Trash2 className="h-4 w-4" />
                                </button>
                            </div>
                            
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                <div className="col-span-2 md:col-span-1">
                                    <label className="block text-xs text-gray-600 mb-1">
                                        Patente <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={vehiculo.patente}
                                        onChange={(e) => updateVehiculo(index, 'patente', e.target.value.toUpperCase())}
                                        className="w-full px-2 py-1.5 text-sm border rounded uppercase"
                                        placeholder="ABC123"
                                        required
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">
                                        Marca
                                    </label>
                                    <input
                                        type="text"
                                        value={vehiculo.marca}
                                        onChange={(e) => updateVehiculo(index, 'marca', e.target.value)}
                                        className="w-full px-2 py-1.5 text-sm border rounded"
                                        placeholder="Ford"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">
                                        Modelo
                                    </label>
                                    <input
                                        type="text"
                                        value={vehiculo.modelo}
                                        onChange={(e) => updateVehiculo(index, 'modelo', e.target.value)}
                                        className="w-full px-2 py-1.5 text-sm border rounded"
                                        placeholder="Ranger"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">
                                        Año
                                    </label>
                                    <input
                                        type="number"
                                        value={vehiculo.anio}
                                        onChange={(e) => updateVehiculo(index, 'anio', e.target.value)}
                                        className="w-full px-2 py-1.5 text-sm border rounded"
                                        placeholder="2023"
                                        min="1900"
                                        max={new Date().getFullYear() + 1}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">
                                        Color
                                    </label>
                                    <input
                                        type="text"
                                        value={vehiculo.color}
                                        onChange={(e) => updateVehiculo(index, 'color', e.target.value)}
                                        className="w-full px-2 py-1.5 text-sm border rounded"
                                        placeholder="Blanco"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">
                                        Identificador
                                    </label>
                                    <input
                                        type="text"
                                        value={vehiculo.identificador}
                                        onChange={(e) => updateVehiculo(index, 'identificador', e.target.value)}
                                        className="w-full px-2 py-1.5 text-sm border rounded"
                                        placeholder="FL-001"
                                    />
                                </div>
                            </div>
                        </div>
                    ))
                )}
                
                {vehiculos.length > 0 && vehiculos.length < cantidadMaxima && (
                    <button
                        type="button"
                        onClick={agregarVehiculo}
                        className="w-full py-3 border-2 border-dashed border-gray-300 rounded-lg text-sm text-gray-600 hover:border-blue-500 hover:text-blue-600 transition-colors flex items-center justify-center gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Agregar otro vehículo ({vehiculos.length}/{cantidadMaxima})
                    </button>
                )}
            </div>
        </div>
    );
}