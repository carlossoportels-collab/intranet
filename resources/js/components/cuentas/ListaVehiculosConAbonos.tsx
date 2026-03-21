// resources/js/components/cuentas/ListaVehiculosConAbonos.tsx
import React, { useState } from 'react';
import { Vehiculo, Abono } from '@/types/cuentas';
import { formatMoney } from '@/utils/formatters';
import SelectPerPage from '@/components/ui/SelectPerPage';
import Pagination from '@/components/ui/Pagination';

interface ListaVehiculosConAbonosProps {
    vehiculos: Vehiculo[];
}

const ListaVehiculosConAbonos: React.FC<ListaVehiculosConAbonosProps> = ({ vehiculos }) => {
    const [vehiculosPerPage, setVehiculosPerPage] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    // Función para verificar si tiene descuento (porcentaje)
    const tieneDescuento = (abono: Abono): boolean => {
        return abono.abono_descuento != null && abono.abono_descuento > 0;
    };

    // Función para calcular precio final con descuento porcentual
    const calcularPrecioFinal = (abono: Abono): number => {
        if (tieneDescuento(abono)) {
            const descuento = abono.abono_descuento || 0;
            return abono.abono_precio * (1 - descuento / 100);
        }
        return abono.abono_precio;
    };

    // Función para calcular el monto del descuento
    const calcularMontoDescuento = (abono: Abono): number => {
        if (tieneDescuento(abono)) {
            const descuento = abono.abono_descuento || 0;
            return abono.abono_precio * (descuento / 100);
        }
        return 0;
    };

    // Función para obtener clases de color según el abono
    const getAbonoColorClasses = (abonoNombre: string, tieneDescuento: boolean = false) => {
        const nombre = abonoNombre.toLowerCase();
        
        let baseClasses = '';
        if (tieneDescuento) {
            baseClasses = 'border-l-4 border-l-amber-500 '; // Indicador visual de descuento
        }
        
        if (nombre.includes('abono') || nombre.includes('verde')) {
            return baseClasses + 'bg-emerald-50 border-emerald-200 text-emerald-700';
        } else if (nombre.includes('suspendido') || nombre.includes('suspension')) {
            return baseClasses + 'bg-rose-50 border-rose-200 text-rose-700';
        } else if (nombre.includes('servicio') || nombre.includes('serv')) {
            return baseClasses + 'bg-indigo-50 border-indigo-200 text-indigo-700';
        } else {
            return baseClasses + 'bg-amber-50 border-amber-200 text-amber-700';
        }
    };

    // Función para renderizar el detalle del abono
    const renderAbonoDetail = (abono: Abono) => {
        const tieneDesc = tieneDescuento(abono);
        const precioFinal = calcularPrecioFinal(abono);
        const montoDescuento = calcularMontoDescuento(abono);
        const porcentajeDescuento = abono.abono_descuento || 0;
        
        return (
            <div className="space-y-1">
                <div className="flex justify-between items-start gap-2">
                    <div className="flex-1">
                        <span className="font-medium block">{abono.abono_nombre}</span>
                        {abono.abono_codigo && (
                            <span className="text-xs opacity-70 block">{abono.abono_codigo}</span>
                        )}
                    </div>
                    <div className="text-right">
                        {tieneDesc ? (
                            <>
                                <span className="text-xs line-through opacity-50 block">
                                    {formatMoney(abono.abono_precio)}
                                </span>
                                <span className="font-bold text-emerald-600">
                                    {formatMoney(precioFinal)}
                                </span>
                            </>
                        ) : (
                            <span className="font-bold">{formatMoney(abono.abono_precio)}</span>
                        )}
                    </div>
                </div>
                
                {/* Mostrar detalle del descuento si existe motivo */}
                {tieneDesc && abono.abono_descmotivo && (
                    <div className="mt-1 text-xs bg-amber-50 border border-amber-200 rounded p-1.5">
                        <span className="font-medium text-amber-700">Descuento {porcentajeDescuento}%:</span>{' '}
                        <span className="text-amber-600">{formatMoney(montoDescuento)}</span>
                        <p className="text-amber-600 mt-0.5 italic">{abono.abono_descmotivo}</p>
                    </div>
                )}
                
                {tieneDesc && !abono.abono_descmotivo && (
                    <div className="mt-1 text-xs text-amber-600">
                        Descuento: {porcentajeDescuento}% ({formatMoney(montoDescuento)})
                    </div>
                )}
            </div>
        );
    };

    const totalVehiculos = vehiculos.length;
    const totalPages = Math.ceil(totalVehiculos / vehiculosPerPage);
    const startIndex = (currentPage - 1) * vehiculosPerPage;
    const endIndex = startIndex + vehiculosPerPage;
    const vehiculosPaginated = vehiculos.slice(startIndex, endIndex);

    if (vehiculos.length === 0) {
        return (
            <div className="bg-slate-50 px-4 py-4 text-sm text-slate-400 italic text-center">
                No hay vehículos registrados
            </div>
        );
    }

    return (
        <div className="bg-white border-t border-slate-200">
            {/* Header con paginación */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 bg-gradient-to-r from-sat-50 to-sat-100/50 border-b border-sat-200 gap-3">
                <span className="text-sm font-semibold text-sat-700 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4-4m-4 4l4 4" />
                    </svg>
                    Vehículos ({totalVehiculos})
                </span>
                <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <span className="text-xs text-sat-600 font-medium">
                        {startIndex + 1}-{Math.min(endIndex, totalVehiculos)} de {totalVehiculos}
                    </span>
                    <SelectPerPage 
                        value={vehiculosPerPage}
                        onChange={(value) => {
                            setVehiculosPerPage(value);
                            setCurrentPage(1);
                        }}
                        options={[5, 10, 15, 20]}
                        className="border-sat-200 text-sat-700 text-xs"
                    />
                </div>
            </div>

            {/* Vista móvil: tarjetas */}
            <div className="block sm:hidden divide-y divide-slate-200">
                {vehiculosPaginated.map((vehiculo) => {
                    const tieneAbonosConDescuento = vehiculo.abonos?.some(tieneDescuento);
                    
                    return (
                        <div key={vehiculo.id} className="p-4">
                            {/* Header del vehículo */}
                            <div 
                                className="flex items-center justify-between cursor-pointer"
                                onClick={() => setExpandedId(expandedId === vehiculo.id ? null : vehiculo.id)}
                            >
                                <div>
                                    <div className="flex items-center gap-2 mb-1">
                                        <span className="font-mono text-sat-600 font-semibold">
                                            {vehiculo.codigo_alfa}
                                        </span>
                                        {vehiculo.avl_patente && (
                                            <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                                                {vehiculo.avl_patente}
                                            </span>
                                        )}
                                    </div>
                                    <p className="font-medium text-slate-900">
                                        {vehiculo.avl_marca} {vehiculo.avl_modelo}
                                    </p>
                                </div>
                                <div className="flex items-center gap-2">
                                    <div className="text-right">
                                        <span className="text-xs bg-sat-100 text-sat-700 px-2 py-1 rounded-full">
                                            {vehiculo.abonos?.length || 0} abonos
                                        </span>
                                        {tieneAbonosConDescuento && (
                                            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full ml-1">
                                                % descuento
                                            </span>
                                        )}
                                    </div>
                                    <svg 
                                        className={`w-5 h-5 text-slate-400 transition-transform ${
                                            expandedId === vehiculo.id ? 'rotate-180' : ''
                                        }`} 
                                        fill="none" 
                                        stroke="currentColor" 
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            </div>

                            {/* Detalles básicos */}
                            <div className="mt-3 grid grid-cols-2 gap-2 text-sm">
                                <div>
                                    <span className="text-xs text-slate-500">Año</span>
                                    <p className="font-medium">{vehiculo.avl_anio || '-'}</p>
                                </div>
                                <div>
                                    <span className="text-xs text-slate-500">Color</span>
                                    <div className="flex items-center gap-1">
                                        {vehiculo.avl_color && (
                                            <span 
                                                className="w-3 h-3 rounded-full border border-slate-300"
                                                style={{ backgroundColor: vehiculo.avl_color.toLowerCase() }}
                                            ></span>
                                        )}
                                        <span>{vehiculo.avl_color || '-'}</span>
                                    </div>
                                </div>
                            </div>

                            {/* Abonos expandidos */}
                            {expandedId === vehiculo.id && vehiculo.abonos && vehiculo.abonos.length > 0 && (
                                <div className="mt-3 pt-3 border-t border-slate-200">
                                    <span className="text-xs font-medium text-slate-700 mb-2 block">Abonos:</span>
                                    <div className="space-y-3">
                                        {vehiculo.abonos.map(abono => {
                                            const tieneDesc = tieneDescuento(abono);
                                            return (
                                                <div 
                                                    key={abono.id} 
                                                    className={`text-xs p-3 rounded-lg border shadow-sm ${getAbonoColorClasses(abono.abono_nombre, tieneDesc)}`}
                                                >
                                                    {renderAbonoDetail(abono)}
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            )}
                        </div>
                    );
                })}
            </div>

            {/* Vista desktop: tabla */}
            <div className="hidden sm:block overflow-x-auto">
                <table className="w-full text-sm">
                    <thead className="bg-slate-50 border-b border-slate-200">
                        <tr>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Código</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Patente</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Marca/Modelo</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Año</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Color</th>
                            <th className="px-4 py-2.5 text-left text-xs font-semibold text-slate-600 uppercase tracking-wider">Abonos</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {vehiculosPaginated.map((vehiculo) => (
                            <tr key={vehiculo.id} className="hover:bg-sat-50/30 transition-colors">
                                <td className="px-4 py-2.5 font-mono text-sat-600 font-semibold">
                                    {vehiculo.codigo_alfa}
                                </td>
                                <td className="px-4 py-2.5 font-medium text-slate-700">
                                    {vehiculo.avl_patente || '-'}
                                </td>
                                <td className="px-4 py-2.5 text-slate-600">
                                    {vehiculo.avl_marca} {vehiculo.avl_modelo}
                                </td>
                                <td className="px-4 py-2.5 text-slate-600">
                                    {vehiculo.avl_anio || '-'}
                                </td>
                                <td className="px-4 py-2.5">
                                    <div className="flex items-center gap-2">
                                        {vehiculo.avl_color && (
                                            <span 
                                                className="w-4 h-4 rounded-full border border-slate-300 shadow-sm"
                                                style={{ backgroundColor: vehiculo.avl_color.toLowerCase() }}
                                            ></span>
                                        )}
                                        <span className="text-slate-600">{vehiculo.avl_color || '-'}</span>
                                    </div>
                                </td>
                                <td className="px-4 py-2.5">
                                    <div className="space-y-2 max-w-xs">
                                        {vehiculo.abonos && vehiculo.abonos.length > 0 ? (
                                            vehiculo.abonos.map(abono => {
                                                const tieneDesc = tieneDescuento(abono);
                                                return (
                                                    <div 
                                                        key={abono.id} 
                                                        className={`text-xs p-2 rounded-lg border shadow-sm ${getAbonoColorClasses(abono.abono_nombre, tieneDesc)}`}
                                                    >
                                                        {renderAbonoDetail(abono)}
                                                    </div>
                                                );
                                            })
                                        ) : (
                                            <span className="text-slate-400 italic text-xs">Sin abonos</span>
                                        )}
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
                <div className="mt-4 px-4 pb-4">
                    <Pagination
                        currentPage={currentPage}
                        lastPage={totalPages}
                        total={totalVehiculos}
                        perPage={vehiculosPerPage}
                        onPageChange={setCurrentPage}
                        useLinks={false}
                    />
                </div>
            )}
        </div>
    );
};

export default ListaVehiculosConAbonos;