// resources/js/components/contratos/sections/VehiculosSection.tsx
import { Truck, Trash2, AlertCircle, Plus } from 'lucide-react';
import React, { useState } from 'react';

interface Props {
    vehiculos: any[];
    setVehiculos: (vehiculos: any[]) => void;
    cantidadMaxima: number;
    onEliminarVehiculo?: (index: number) => void;
}

// Tipos predefinidos de vehículos
const TIPOS_VEHICULOS = [
    { value: 'auto', label: 'Auto' },
    { value: 'camioneta', label: 'Camioneta' },
    { value: 'camion', label: 'Camión' },
    { value: 'moto', label: 'Moto' },
    { value: 'utilitario', label: 'Utilitario / Furgón' },
    { value: 'minibus', label: 'Minibus' },
    { value: 'colectivo', label: 'Colectivo / Ómnibus' },
    { value: 'maquinaria', label: 'Maquinaria Pesada' },
    { value: 'motoniveladora', label: 'Motoniveladora' },
    { value: 'retroexcavadora', label: 'Retroexcavadora' },
    { value: 'grua', label: 'Grúa' },
    { value: 'barco', label: 'Barco / Embarcación' },
    { value: 'remolque', label: 'Remolque / Semirremolque' },
    { value: 'trailer', label: 'Trailer' },
    { value: 'otro', label: 'Otro (especificar)' }
];

export default function VehiculosSection({ vehiculos, setVehiculos, cantidadMaxima, onEliminarVehiculo }: Props) {
    const [otroTipoIndex, setOtroTipoIndex] = useState<number | null>(null);
    const [otroTipoValue, setOtroTipoValue] = useState<string>('');

    const todosCompletados = vehiculos.every(v => v.patente && v.patente.trim() !== '');
    
    const eliminarVehiculo = (index: number) => {
        if (vehiculos.length <= 1) return;
        
        if (onEliminarVehiculo) {
            onEliminarVehiculo(index);
        } else {
            setVehiculos(vehiculos.filter((_, i) => i !== index));
        }
    };

    const agregarVehiculo = () => {
        if (vehiculos.length >= cantidadMaxima) return;
        setVehiculos([...vehiculos, {
            patente: '',
            marca: '',
            modelo: '',
            anio: '',
            color: '',
            identificador: '',
            tipo: ''
        }]);
    };

    const updateVehiculo = (index: number, field: string, value: string) => {
        const nuevos = [...vehiculos];
        nuevos[index] = { ...nuevos[index], [field]: value };
        
        if (field === 'tipo' && value !== 'otro') {
            if (otroTipoIndex === index) {
                setOtroTipoIndex(null);
                setOtroTipoValue('');
            }
        }
        
        setVehiculos(nuevos);
    };

    const handleTipoChange = (index: number, value: string) => {
        if (value === 'otro') {
            setOtroTipoIndex(index);
            setOtroTipoValue('');
            updateVehiculo(index, 'tipo', '');
        } else {
            updateVehiculo(index, 'tipo', value);
            if (otroTipoIndex === index) {
                setOtroTipoIndex(null);
                setOtroTipoValue('');
            }
        }
    };

    const handleOtroTipoBlur = (index: number) => {
        if (otroTipoValue.trim()) {
            updateVehiculo(index, 'tipo', otroTipoValue.trim());
        } else {
            setOtroTipoIndex(null);
            setOtroTipoValue('');
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Truck className="h-4 w-4 text-blue-600" />
                    <h3 className="font-medium text-gray-900">
                        Vehículos a equipar ({vehiculos.length})
                    </h3>
                </div>
                <button
                    type="button"
                    onClick={agregarVehiculo}
                    disabled={vehiculos.length >= cantidadMaxima}
                    className="px-2 py-1 text-xs bg-blue-50 text-blue-600 rounded hover:bg-blue-100 flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    <Plus className="h-3 w-3" />
                    Agregar
                </button>
            </div>
            
            <div className="p-3 space-y-2">
                <div className="space-y-2">
                    {vehiculos.map((vehiculo, index) => (
                        <div key={index} className="border border-gray-200 rounded-lg p-3">
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
                                {vehiculos.length > 1 && (
                                    <button
                                        onClick={() => eliminarVehiculo(index)}
                                        className="text-gray-400 hover:text-red-600 p-1 hover:bg-red-50 rounded transition-colors"
                                        title="Eliminar vehículo"
                                    >
                                        <Trash2 className="h-3.5 w-3.5" />
                                    </button>
                                )}
                            </div>
                            
                            <div className="grid grid-cols-12 gap-2">
                                <div className="col-span-2">
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
                                
                                <div className="col-span-2">
                                    {otroTipoIndex === index ? (
                                        <div className="flex gap-1">
                                            <input
                                                type="text"
                                                value={otroTipoValue}
                                                onChange={(e) => setOtroTipoValue(e.target.value)}
                                                onBlur={() => handleOtroTipoBlur(index)}
                                                onKeyDown={(e) => {
                                                    if (e.key === 'Enter') {
                                                        handleOtroTipoBlur(index);
                                                    }
                                                }}
                                                className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                                placeholder="Especificar tipo"
                                                autoFocus
                                            />
                                        </div>
                                    ) : (
                                        <select
                                            value={vehiculo.tipo || ''}
                                            onChange={(e) => handleTipoChange(index, e.target.value)}
                                            className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500 bg-white"
                                        >
                                            <option value="">Seleccionar tipo</option>
                                            {TIPOS_VEHICULOS.map((tipo) => (
                                                <option key={tipo.value} value={tipo.value}>
                                                    {tipo.label}
                                                </option>
                                            ))}
                                        </select>
                                    )}
                                </div>
                                
                                <div className="col-span-2">
                                    <input
                                        type="text"
                                        value={vehiculo.identificador}
                                        onChange={(e) => updateVehiculo(index, 'identificador', e.target.value)}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Identificador"
                                    />
                                </div>

                                <div className="col-span-2">
                                    <input
                                        type="text"
                                        value={vehiculo.marca}
                                        onChange={(e) => updateVehiculo(index, 'marca', e.target.value)}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Marca"
                                    />
                                </div>
                                
                                <div className="col-span-2">
                                    <input
                                        type="text"
                                        value={vehiculo.modelo}
                                        onChange={(e) => updateVehiculo(index, 'modelo', e.target.value)}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Modelo"
                                    />
                                </div>
                                
                                <div className="col-span-1">
                                    <input
                                        type="text"
                                        value={vehiculo.anio}
                                        onChange={(e) => updateVehiculo(index, 'anio', e.target.value)}
                                        className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="Año"
                                    />
                                </div>
                                
                                <div className="col-span-1">
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
                
                {!todosCompletados && (
                    <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded-md">
                        <p className="text-xs text-amber-700 flex items-center gap-1">
                            <AlertCircle className="h-3.5 w-3.5" />
                            Complete la patente de todos los vehículos para continuar
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}