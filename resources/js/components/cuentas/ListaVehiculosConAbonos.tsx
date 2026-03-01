// resources/js/components/cuentas/ListaVehiculosConAbonos.tsx
import React, { useState } from 'react';
import { Vehiculo } from '@/types/cuentas';
import { formatMoney } from '@/utils/formatters';
import SelectPerPage from '@/components/ui/SelectPerPage';

interface ListaVehiculosConAbonosProps {
    vehiculos: Vehiculo[];
}

const ListaVehiculosConAbonos: React.FC<ListaVehiculosConAbonosProps> = ({ vehiculos }) => {
    const [vehiculosPerPage, setVehiculosPerPage] = useState(5);
    const [currentPage, setCurrentPage] = useState(1);
    const [expandedId, setExpandedId] = useState<number | null>(null);

    const getAbonoColorClasses = (abonoNombre: string) => {
        const nombre = abonoNombre.toLowerCase();
        
        if (nombre.includes('abono') || nombre.includes('verde')) {
            return 'bg-emerald-50 border-emerald-200 text-emerald-700';
        } else if (nombre.includes('suspendido') || nombre.includes('suspension')) {
            return 'bg-rose-50 border-rose-200 text-rose-700';
        } else if (nombre.includes('servicio') || nombre.includes('serv')) {
            return 'bg-indigo-50 border-indigo-200 text-indigo-700';
        } else {
            return 'bg-amber-50 border-amber-200 text-amber-700';
        }
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between px-4 py-3 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-indigo-100 gap-3">
                <span className="text-sm font-semibold text-indigo-900 flex items-center gap-2">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4-4m-4 4l4 4" />
                    </svg>
                    Vehículos ({totalVehiculos})
                </span>
                <div className="flex items-center gap-3 justify-between sm:justify-end">
                    <span className="text-xs text-indigo-600 font-medium">
                        {startIndex + 1}-{Math.min(endIndex, totalVehiculos)} de {totalVehiculos}
                    </span>
                    <SelectPerPage 
                        value={vehiculosPerPage}
                        onChange={(value) => {
                            setVehiculosPerPage(value);
                            setCurrentPage(1);
                        }}
                        options={[5, 10, 15, 20]}
                        className="border-indigo-200 text-indigo-700 text-xs"
                    />
                </div>
            </div>

            {/* Vista móvil: tarjetas */}
            <div className="block sm:hidden divide-y divide-slate-200">
                {vehiculosPaginated.map((vehiculo) => (
                    <div key={vehiculo.id} className="p-4">
                        {/* Header del vehículo - click para expandir/colapsar */}
                        <div 
                            className="flex items-center justify-between cursor-pointer"
                            onClick={() => setExpandedId(expandedId === vehiculo.id ? null : vehiculo.id)}
                        >
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="font-mono text-indigo-600 font-semibold">
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
                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full">
                                    {vehiculo.abonos?.length || 0} abonos
                                </span>
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

                        {/* Detalles básicos - siempre visibles */}
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

                        {/* Abonos - visibles solo cuando está expandido */}
                        {expandedId === vehiculo.id && vehiculo.abonos && vehiculo.abonos.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-slate-200">
                                <span className="text-xs font-medium text-slate-700 mb-2 block">Abonos:</span>
                                <div className="space-y-2">
                                    {vehiculo.abonos.map(abono => (
                                        <div 
                                            key={abono.id} 
                                            className={`text-xs p-2 rounded-lg border shadow-sm ${getAbonoColorClasses(abono.abono_nombre)}`}
                                        >
                                            <div className="flex justify-between items-center gap-2">
                                                <div className="flex-1">
                                                    <span className="font-medium block">{abono.abono_nombre}</span>
                                                    {abono.abono_codigo && (
                                                        <span className="text-xs opacity-70 block">{abono.abono_codigo}</span>
                                                    )}
                                                </div>
                                                <span className="font-bold whitespace-nowrap">{formatMoney(abono.abono_precio)}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                ))}
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
                            <tr key={vehiculo.id} className="hover:bg-indigo-50/30 transition-colors">
                                <td className="px-4 py-2.5 font-mono text-indigo-600 font-semibold">
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
                                    <div className="space-y-1.5 max-w-xs">
                                        {vehiculo.abonos && vehiculo.abonos.length > 0 ? (
                                            vehiculo.abonos.map(abono => (
                                                <div 
                                                    key={abono.id} 
                                                    className={`text-xs p-2 rounded-lg border shadow-sm ${getAbonoColorClasses(abono.abono_nombre)}`}
                                                >
                                                    <div className="flex justify-between items-center gap-3">
                                                        <div className="min-w-0 flex-1">
                                                            <span className="font-medium block truncate">{abono.abono_nombre}</span>
                                                            {abono.abono_codigo && (
                                                                <span className="text-xs opacity-70 block truncate">{abono.abono_codigo}</span>
                                                            )}
                                                        </div>
                                                        <span className="font-bold whitespace-nowrap">{formatMoney(abono.abono_precio)}</span>
                                                    </div>
                                                </div>
                                            ))
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

            {/* Paginación móvil */}
            {totalPages > 1 && (
                <div className="block sm:hidden px-4 py-3 bg-slate-50 border-t border-slate-200">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                currentPage === 1
                                    ? 'text-slate-300 bg-slate-100 cursor-not-allowed'
                                    : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                            }`}
                        >
                            ← Anterior
                        </button>
                        <span className="text-sm text-slate-600 font-medium">
                            {currentPage} / {totalPages}
                        </span>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className={`px-4 py-2 rounded-lg text-sm font-medium ${
                                currentPage === totalPages
                                    ? 'text-slate-300 bg-slate-100 cursor-not-allowed'
                                    : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100'
                            }`}
                        >
                            Siguiente →
                        </button>
                    </div>
                </div>
            )}

            {/* Paginación desktop */}
            {totalPages > 1 && (
                <div className="hidden sm:flex items-center justify-between px-4 py-3 bg-slate-50 border-t border-slate-200">
                    <div className="text-xs text-slate-500">
                        Página {currentPage} de {totalPages}
                    </div>
                    <div className="flex gap-2">
                        <button
                            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                            disabled={currentPage === 1}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                                currentPage === 1
                                    ? 'text-slate-300 cursor-not-allowed'
                                    : 'text-slate-600 hover:bg-indigo-100 hover:text-indigo-700'
                            }`}
                        >
                            ←
                        </button>
                        <div className="flex items-center gap-1 px-2">
                            {Array.from({ length: Math.min(3, totalPages) }, (_, i) => {
                                let pageNum;
                                if (totalPages <= 3) {
                                    pageNum = i + 1;
                                } else if (currentPage === 1) {
                                    pageNum = i + 1;
                                } else if (currentPage === totalPages) {
                                    pageNum = totalPages - 2 + i;
                                } else {
                                    pageNum = currentPage - 1 + i;
                                }
                                
                                return (
                                    <button
                                        key={pageNum}
                                        onClick={() => setCurrentPage(pageNum)}
                                        className={`w-8 h-8 rounded-lg text-sm font-medium transition-all ${
                                            currentPage === pageNum
                                                ? 'bg-indigo-600 text-white shadow-md'
                                                : 'text-slate-600 hover:bg-indigo-50'
                                        }`}
                                    >
                                        {pageNum}
                                    </button>
                                );
                            })}
                        </div>
                        <button
                            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1.5 rounded-lg text-sm transition-all ${
                                currentPage === totalPages
                                    ? 'text-slate-300 cursor-not-allowed'
                                    : 'text-slate-600 hover:bg-indigo-100 hover:text-indigo-700'
                            }`}
                        >
                            →
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
};

export default ListaVehiculosConAbonos;