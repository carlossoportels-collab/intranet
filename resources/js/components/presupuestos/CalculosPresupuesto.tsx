// resources/js/components/presupuestos/CalculosPresupuesto.tsx
import React from 'react';

import { ProductoResumenItem } from '@/types/presupuestos';

interface Props {
    cantidadVehiculos: number;
    valorTasa: number;
    tasaBonificacion: number;
    valorAbono: number;
    abonoBonificacion: number;
    subtotalAgregados: number;
    tasaPromocion?: '2x1' | '3x2' | null;
    abonoPromocion?: '2x1' | '3x2' | null;
    accesoriosConPromocion?: ProductoResumenItem[];
    serviciosConPromocion?: ProductoResumenItem[];
    accesoriosNormales?: ProductoResumenItem[];
    serviciosNormales?: ProductoResumenItem[];
    // Props adicionales para los nombres de tasa y abono
    tasaNombre?: string;
    abonoNombre?: string;
}

export default function CalculosPresupuesto({
    cantidadVehiculos,
    valorTasa,
    tasaBonificacion,
    valorAbono,
    abonoBonificacion,
    tasaPromocion,
    abonoPromocion,
    accesoriosConPromocion = [],
    serviciosConPromocion = [],
    accesoriosNormales = [],
    serviciosNormales = [],
    tasaNombre = 'Instalación',
    abonoNombre = 'Abono Mensual'
}: Props) {
    
    const calcularSubtotalPack = (valor: number, cantidad: number, tipo: '2x1' | '3x2'): number => {
        if (tipo === '2x1') {
            const grupos = Math.floor(cantidad / 2);
            const resto = cantidad % 2;
            const unidadesPagas = grupos + resto;
            return valor * unidadesPagas;
        } else {
            const grupos = Math.floor(cantidad / 3);
            const resto = cantidad % 3;
            const unidadesPagas = (grupos * 2) + resto;
            return valor * unidadesPagas;
        }
    };

    const calcularSubtotalTasa = (): number => {
        if (tasaPromocion) {
            return calcularSubtotalPack(valorTasa, cantidadVehiculos, tasaPromocion);
        }
        const subtotal = valorTasa * cantidadVehiculos;
        return tasaBonificacion > 0 ? subtotal * (1 - tasaBonificacion / 100) : subtotal;
    };

    const calcularSubtotalAbono = (): number => {
        if (abonoPromocion) {
            return calcularSubtotalPack(valorAbono, cantidadVehiculos, abonoPromocion);
        }
        const subtotal = valorAbono * cantidadVehiculos;
        return abonoBonificacion > 0 ? subtotal * (1 - abonoBonificacion / 100) : subtotal;
    };

    const calcularSubtotalProducto = (producto: ProductoResumenItem): number => {
        const subtotalBase = producto.valor * producto.cantidad;
        
        if (producto.tipoPromocion === '2x1' || producto.tipoPromocion === '3x2') {
            return calcularSubtotalPack(producto.valor, producto.cantidad, producto.tipoPromocion);
        } else if (producto.bonificacion && producto.bonificacion > 0) {
            return subtotalBase * (1 - producto.bonificacion / 100);
        }
        
        return subtotalBase;
    };

    const getNombrePromocion = (tipo?: '2x1' | '3x2' | 'porcentaje'): string => {
        if (tipo === '2x1') return '2x1';
        if (tipo === '3x2') return '3x2';
        return '';
    };

    const subtotalTasa = calcularSubtotalTasa();
    const subtotalTasaOriginal = valorTasa * cantidadVehiculos;
    
    const subtotalAbono = calcularSubtotalAbono();
    const subtotalAbonoOriginal = valorAbono * cantidadVehiculos;
    
    const formatMoney = (value: number) => {
        return '$ ' + value.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const getExplicacionPromocion = (tipo: '2x1' | '3x2', cantidad: number): string => {
        if (tipo === '2x1') {
            const grupos = Math.floor(cantidad / 2);
            const resto = cantidad % 2;
            if (grupos === 0) return `${cantidad} unidad(es)`;
            if (resto === 0) return `${grupos} × 2x1`;
            return `${grupos} × 2x1 + ${resto}`;
        } else {
            const grupos = Math.floor(cantidad / 3);
            const resto = cantidad % 3;
            if (grupos === 0) return `${cantidad} unidad(es)`;
            if (resto === 0) return `${grupos} × 3x2`;
            return `${grupos} × 3x2 + ${resto}`;
        }
    };

    // Calcular totales
    const totalAccesorios = [...accesoriosConPromocion, ...accesoriosNormales].reduce((sum, item) => {
        return sum + calcularSubtotalProducto(item);
    }, 0);

    const totalServicios = [...serviciosConPromocion, ...serviciosNormales].reduce((sum, item) => {
        return sum + calcularSubtotalProducto(item);
    }, 0);

    // Combinar todos los items para mostrarlos juntos
    const todosLosAccesorios = [...accesoriosConPromocion, ...accesoriosNormales];
    const todosLosServicios = [...serviciosConPromocion, ...serviciosNormales];

    const inversionInicial = subtotalTasa + totalAccesorios;
    const costoMensual = subtotalAbono + totalServicios;
    const totalPrimerMes = inversionInicial + costoMensual;

    return (
        <div className="space-y-4">
            {/* INVERSIÓN INICIAL - PAGO ÚNICO */}
            <div className="bg-blue-50 rounded-lg border border-blue-200 overflow-hidden">
                <div className="bg-blue-100 px-3 py-2 border-b border-blue-200">
                    <div className="flex items-center gap-2">
                        <span className="text-blue-700 text-sm font-semibold">💰 Inversión Inicial (Pago Único)</span>
                    </div>
                </div>
                <div className="p-3 space-y-3">
                    {/* INSTALACIÓN */}
                    <div className="border-b border-blue-200 pb-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-medium text-gray-700">{tasaNombre}:</span>
                            <span className="text-gray-600">{formatMoney(subtotalTasaOriginal)}</span>
                        </div>
                        
                        {tasaPromocion && (
                            <>
                                <div className="flex justify-between text-green-600 text-xs mt-1 ml-2">
                                    <span>🎉 Promoción {tasaPromocion}:</span>
                                    <span>{getExplicacionPromocion(tasaPromocion, cantidadVehiculos)}</span>
                                </div>
                                <div className="flex justify-between text-green-600 text-xs ml-2">
                                    <span>Descuento:</span>
                                    <span>- {formatMoney(subtotalTasaOriginal - subtotalTasa)}</span>
                                </div>
                            </>
                        )}
                        
                        {!tasaPromocion && tasaBonificacion > 0 && (
                            <div className="flex justify-between text-green-600 text-xs mt-1 ml-2">
                                <span>💰 Descuento {Math.round(tasaBonificacion)}%:</span>
                                <span>- {formatMoney(subtotalTasaOriginal - subtotalTasa)}</span>
                            </div>
                        )}
                        
                        <div className="flex justify-between font-semibold text-blue-700 mt-1 ml-2">
                            <span>Total instalación:</span>
                            <span>{formatMoney(subtotalTasa)}</span>
                        </div>
                    </div>

                    {/* ACCESORIOS */}
                    {todosLosAccesorios.length > 0 && (
                        <div className="border-b border-blue-200 pb-2">
                            <div className="flex items-center gap-1 mb-2">
                                <span className="text-xs font-medium text-gray-700">Accesorios:</span>
                            </div>
                            
                            <div className="space-y-2 ml-2">
                            {todosLosAccesorios.map((item, index) => {
                                const subtotalBase = item.valor * item.cantidad;
                                const subtotalFinal = calcularSubtotalProducto(item);
                                const nombrePromo = getNombrePromocion(item.tipoPromocion);
                                
                                return (
                                    <div key={`accesorio-${item.id}-${index}`} className="text-xs">  {/* ← KEY ÚNICO */}
                                        <div className="flex justify-between text-gray-600">
                                            <span>• {item.nombre} x{item.cantidad}</span>
                                            <span>{formatMoney(subtotalBase)}</span>
                                        </div>
                                        
                                        {nombrePromo && (
                                            <div className="flex justify-between text-green-600 mt-0.5">
                                                <span>🎉 Promoción {nombrePromo}:</span>
                                                <span>{getExplicacionPromocion(item.tipoPromocion as '2x1' | '3x2', item.cantidad)}</span>
                                            </div>
                                        )}
                                        
                                        {item.bonificacion && item.bonificacion > 0 && !nombrePromo && (
                                            <div className="flex justify-between text-green-600 mt-0.5">
                                                <span>💰 Descuento {Math.round(item.bonificacion)}%:</span>
                                                <span>- {formatMoney(subtotalBase - subtotalFinal)}</span>
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-between font-medium text-gray-800 mt-0.5">
                                            <span>Subtotal:</span>
                                            <span>{formatMoney(subtotalFinal)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                            </div>
                            
                            <div className="flex justify-between font-semibold text-blue-700 mt-2 pt-1 border-t border-blue-200">
                                <span>TOTAL ACCESORIOS:</span>
                                <span>{formatMoney(totalAccesorios)}</span>
                            </div>
                        </div>
                    )}

                    {/* TOTAL INVERSIÓN INICIAL */}
                    <div className="bg-blue-100 rounded-lg p-2 mt-1">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-blue-900 text-sm">💰 TOTAL INVERSIÓN INICIAL:</span>
                            <span className="text-lg font-bold text-blue-900">{formatMoney(inversionInicial)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* COSTO RECURRENTE - MENSUAL */}
            <div className="bg-green-50 rounded-lg border border-green-200 overflow-hidden">
                <div className="bg-green-100 px-3 py-2 border-b border-green-200">
                    <div className="flex items-center gap-2">
                        <span className="text-green-700 text-sm font-semibold">📅 Costo Recurrente (Mensual)</span>
                    </div>
                </div>
                <div className="p-3 space-y-3">
                    {/* ABONO MENSUAL */}
                    <div className="border-b border-green-200 pb-2">
                        <div className="flex justify-between items-center text-sm">
                            <span className="font-medium text-gray-700">{abonoNombre}:</span>
                            <span className="text-gray-600">{formatMoney(subtotalAbonoOriginal)}</span>
                        </div>
                        
                        {abonoPromocion && (
                            <>
                                <div className="flex justify-between text-green-600 text-xs mt-1 ml-2">
                                    <span>🎉 Promoción {abonoPromocion}:</span>
                                    <span>{getExplicacionPromocion(abonoPromocion, cantidadVehiculos)}</span>
                                </div>
                                <div className="flex justify-between text-green-600 text-xs ml-2">
                                    <span>Descuento:</span>
                                    <span>- {formatMoney(subtotalAbonoOriginal - subtotalAbono)}</span>
                                </div>
                            </>
                        )}
                        
                        {!abonoPromocion && abonoBonificacion > 0 && (
                            <div className="flex justify-between text-green-600 text-xs mt-1 ml-2">
                                <span>💰 Descuento {Math.round(abonoBonificacion)}%:</span>
                                <span>- {formatMoney(subtotalAbonoOriginal - subtotalAbono)}</span>
                            </div>
                        )}
                        
                        <div className="flex justify-between font-semibold text-green-700 mt-1 ml-2">
                            <span>Total abono mensual:</span>
                            <span>{formatMoney(subtotalAbono)}</span>
                        </div>
                    </div>

                    {/* SERVICIOS */}
                    {todosLosServicios.length > 0 && (
                        <div className="border-b border-green-200 pb-2">
                            <div className="flex items-center gap-1 mb-2">
                                <span className="text-xs font-medium text-gray-700">Servicios:</span>
                            </div>
                            
                            <div className="space-y-2 ml-2">
                            {todosLosServicios.map((item, index) => {
                                const subtotalBase = item.valor * item.cantidad;
                                const subtotalFinal = calcularSubtotalProducto(item);
                                const nombrePromo = getNombrePromocion(item.tipoPromocion);
                                
                                return (
                                    <div key={`servicio-${item.id}-${index}`} className="text-xs">  {/* ← KEY ÚNICO */}
                                        <div className="flex justify-between text-gray-600">
                                            <span>• {item.nombre} x{item.cantidad}</span>
                                            <span>{formatMoney(subtotalBase)}</span>
                                        </div>
                                        
                                        {nombrePromo && (
                                            <div className="flex justify-between text-green-600 mt-0.5">
                                                <span>🎉 Promoción {nombrePromo}:</span>
                                                <span>{getExplicacionPromocion(item.tipoPromocion as '2x1' | '3x2', item.cantidad)}</span>
                                            </div>
                                        )}
                                        
                                        {item.bonificacion && item.bonificacion > 0 && !nombrePromo && (
                                            <div className="flex justify-between text-green-600 mt-0.5">
                                                <span>💰 Descuento {Math.round(item.bonificacion)}%:</span>
                                                <span>- {formatMoney(subtotalBase - subtotalFinal)}</span>
                                            </div>
                                        )}
                                        
                                        <div className="flex justify-between font-medium text-gray-800 mt-0.5">
                                            <span>Subtotal:</span>
                                            <span>{formatMoney(subtotalFinal)}</span>
                                        </div>
                                    </div>
                                );
                            })}
                            </div>
                            
                            <div className="flex justify-between font-semibold text-green-700 mt-2 pt-1 border-t border-green-200">
                                <span>TOTAL SERVICIOS:</span>
                                <span>{formatMoney(totalServicios)}</span>
                            </div>
                        </div>
                    )}

                    {/* TOTAL COSTO MENSUAL */}
                    <div className="bg-green-100 rounded-lg p-2 mt-1">
                        <div className="flex justify-between items-center">
                            <span className="font-bold text-green-900 text-sm">📅 TOTAL COSTO MENSUAL:</span>
                            <span className="text-lg font-bold text-green-900">{formatMoney(costoMensual)}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* TOTAL PRIMER MES - DESTACADO */}
            <div className="bg-gradient-to-r from-local-500 to-local-600 rounded-lg p-3 text-white shadow-lg">
                <div className="flex justify-between items-center">
                    <div>
                        <p className="text-xs opacity-90">Total a pagar</p>
                        <p className="text-[10px] opacity-75">Primer mes (instalación + 1er mes)</p>
                    </div>
                    <div className="text-right">
                        <p className="text-xl font-bold">{formatMoney(totalPrimerMes)}</p>
                        <p className="text-[10px] opacity-75">* Desde el 2° mes: {formatMoney(costoMensual)}/mes</p>
                    </div>
                </div>
            </div>
        </div>
    );
}