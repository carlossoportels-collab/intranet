// resources/js/components/contratos/sections/TablaVehiculos.tsx
import React, { useState } from 'react';
import { Truck, ChevronLeft, ChevronRight, DollarSign, Info } from 'lucide-react';
import Amount from '@/components/ui/Amount';

interface Abono {
    id: number;
    abono_codigo: string;
    abono_nombre: string;
    abono_precio: number;
    abono_descuento: number;
    abono_descmotivo?: string;
}

interface Vehiculo {
    id: number;
    codigo_alfa?: string;
    avl_patente?: string;
    avl_marca?: string;
    avl_modelo?: string;
    avl_anio?: number;
    avl_color?: string;
    avl_identificador?: string;
    abonos?: Abono[];
}

interface Props {
    vehiculos: Vehiculo[];
    itemsPerPage?: number;
    showAbonos?: boolean; // Nueva prop para controlar si mostrar abonos
}

export default function TablaVehiculos({ vehiculos, itemsPerPage = 5, showAbonos = true }: Props) {
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedVehiculo, setExpandedVehiculo] = useState<number | null>(null);
    
    const totalPages = Math.ceil(vehiculos.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const vehiculosPaginados = vehiculos.slice(startIndex, endIndex);

    // Calcular total de abonos por vehículo
    const calcularTotalAbonos = (abonos?: Abono[]) => {
        if (!abonos || abonos.length === 0) return 0;
        return abonos.reduce((total, abono) => {
            const precioConDescuento = abono.abono_precio - (abono.abono_precio * (abono.abono_descuento / 100));
            return total + precioConDescuento;
        }, 0);
    };

    // Calcular total general de abonos
    const totalGeneralAbonos = vehiculos.reduce((total, v) => total + calcularTotalAbonos(v.abonos), 0);

    if (vehiculos.length === 0) {
        return (
            <div className="text-center py-8 bg-gray-50 rounded-lg">
                <Truck className="h-12 w-12 text-gray-400 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No hay vehículos registrados para esta empresa</p>
            </div>
        );
    }

    return (
        <div>
            <div className="overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-y border-gray-200">
                        <tr>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Código</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Patente</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marca/Modelo</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Año</th>
                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Color</th>
                            {showAbonos && (
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Abonos</th>
                            )}
                            {showAbonos && (
                                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Total</th>
                            )}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                        {vehiculosPaginados.map((vehiculo) => {
                            const totalAbonos = calcularTotalAbonos(vehiculo.abonos);
                            const tieneAbonos = vehiculo.abonos && vehiculo.abonos.length > 0;
                            
                            return (
                                <React.Fragment key={vehiculo.id}>
                                    <tr className="hover:bg-gray-50 cursor-pointer" onClick={() => setExpandedVehiculo(expandedVehiculo === vehiculo.id ? null : vehiculo.id)}>
                                        <td className="px-4 py-3 font-mono text-xs text-indigo-600">
                                            {vehiculo.codigo_alfa || '-'}
                                        </td>
                                        <td className="px-4 py-3 font-medium">
                                            {vehiculo.avl_patente || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            {vehiculo.avl_marca} {vehiculo.avl_modelo}
                                        </td>
                                        <td className="px-4 py-3">
                                            {vehiculo.avl_anio || '-'}
                                        </td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                {vehiculo.avl_color && (
                                                    <span 
                                                        className="w-4 h-4 rounded-full border border-gray-300"
                                                        style={{ backgroundColor: vehiculo.avl_color.toLowerCase() }}
                                                    />
                                                )}
                                                <span>{vehiculo.avl_color || '-'}</span>
                                            </div>
                                        </td>
                                        {showAbonos && (
                                            <td className="px-4 py-3">
                                                {tieneAbonos ? (
                                                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">
                                                        <DollarSign className="h-3 w-3" />
                                                        {vehiculo.abonos?.length} abono{vehiculo.abonos?.length !== 1 ? 's' : ''}
                                                    </span>
                                                ) : (
                                                    <span className="text-gray-400 text-xs">Sin abonos</span>
                                                )}
                                            </td>
                                        )}
                                        {showAbonos && (
                                            <td className="px-4 py-3 font-medium">
                                                {tieneAbonos ? (
                                                    <Amount value={totalAbonos} color="success" fallback="-" />
                                                ) : (
                                                    <span className="text-gray-400">-</span>
                                                )}
                                            </td>
                                        )}
                                    </tr>
                                    
                                    {/* Detalle de abonos expandible */}
                                    {showAbonos && expandedVehiculo === vehiculo.id && tieneAbonos && (
                                        <tr className="bg-gray-50">
                                            <td colSpan={showAbonos ? 7 : 5} className="px-4 py-3">
                                                <div className="pl-6 border-l-2 border-indigo-200">
                                                    <p className="text-xs font-medium text-gray-700 mb-2 flex items-center gap-1">
                                                        <Info className="h-3 w-3" /> Detalle de abonos:
                                                    </p>
                                                    <div className="space-y-2">
                                                        {vehiculo.abonos?.map((abono) => {
                                                            const precioConDescuento = abono.abono_precio - (abono.abono_precio * (abono.abono_descuento / 100));
                                                            
                                                            return (
                                                                <div key={abono.id} className="grid grid-cols-4 gap-2 text-xs">
                                                                    <div className="col-span-2">
                                                                        <span className="font-medium">{abono.abono_nombre}</span>
                                                                        {abono.abono_codigo && (
                                                                            <span className="text-gray-500 ml-1">({abono.abono_codigo})</span>
                                                                        )}
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <span className="text-gray-600">Precio:</span>
                                                                        <Amount value={abono.abono_precio} className="ml-1" />
                                                                    </div>
                                                                    {abono.abono_descuento > 0 && (
                                                                        <>
                                                                            <div className="text-right">
                                                                                <span className="text-green-600">Desc: {abono.abono_descuento}%</span>
                                                                            </div>
                                                                            <div className="text-right font-medium">
                                                                                <Amount value={precioConDescuento} color="success" />
                                                                            </div>
                                                                        </>
                                                                    )}
                                                                </div>
                                                            );
                                                        })}
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            );
                        })}
                    </tbody>
                </table>
            </div>
            
            {/* Paginación y totales */}
            <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-gray-200 pt-4">
                <div className="flex items-center gap-4">
                    <div className="text-xs text-gray-500">
                        Mostrando {startIndex + 1}-{Math.min(endIndex, vehiculos.length)} de {vehiculos.length} vehículos
                    </div>
                    {showAbonos && totalGeneralAbonos > 0 && (
                        <div className="text-sm font-medium">
                            <span className="text-gray-600">Total mensual: </span>
                            <Amount value={totalGeneralAbonos} color="local" />
                        </div>
                    )}
                </div>
                
                {totalPages > 1 && (
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className={`p-1.5 rounded-md transition-colors ${
                                currentPage === 1
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <ChevronLeft className="h-4 w-4" />
                        </button>
                        <span className="text-sm text-gray-600">
                            Página {currentPage} de {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className={`p-1.5 rounded-md transition-colors ${
                                currentPage === totalPages
                                    ? 'text-gray-300 cursor-not-allowed'
                                    : 'text-gray-600 hover:bg-gray-100'
                            }`}
                        >
                            <ChevronRight className="h-4 w-4" />
                        </button>
                    </div>
                )}
            </div>
        </div>
    );
}