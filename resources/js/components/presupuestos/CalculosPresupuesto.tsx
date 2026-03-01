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
    serviciosNormales = []
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

    return (
        <div className="space-y-4">
            {/* INSTALACIÓN */}
            <div className="border-b border-gray-200 pb-3">
                <h4 className="font-semibold text-gray-800 mb-2">Instalación</h4>
                <div className="space-y-1">
                    <div className="flex justify-between text-gray-600">
                        <span>Precio base:</span>
                        <span>{formatMoney(subtotalTasaOriginal)}</span>
                    </div>
                    
                    {tasaPromocion && (
                        <>
                            <div className="flex justify-between text-green-600 text-xs font-medium">
                                <span>Promoción {tasaPromocion}:</span>
                                <span>{getExplicacionPromocion(tasaPromocion, cantidadVehiculos)}</span>
                            </div>
                            <div className="flex justify-between text-green-600 text-xs font-medium">
                                <span>Descuento:</span>
                                <span>- {formatMoney(subtotalTasaOriginal - subtotalTasa)}</span>
                            </div>
                        </>
                    )}
                    
                    {!tasaPromocion && tasaBonificacion > 0 && (
                        <div className="flex justify-between text-green-600 text-xs font-medium">
                            <span>Descuento {Math.round(tasaBonificacion)}%:</span>
                            <span>- {formatMoney(subtotalTasaOriginal - subtotalTasa)}</span>
                        </div>
                    )}
                    
                    {!tasaPromocion && tasaBonificacion === 0 && (
                        <div className="flex justify-between text-gray-500 text-xs">
                            <span>Descuento:</span>
                            <span>$ 0,00</span>
                        </div>
                    )}
                    
                    <div className="flex justify-between font-bold pt-1 mt-1 border-t border-gray-200">
                        <span>Total instalación:</span>
                        <span className="text-local">{formatMoney(subtotalTasa)}</span>
                    </div>
                </div>
            </div>

            {/* ABONO MENSUAL */}
            <div className="border-b border-gray-200 pb-3">
                <h4 className="font-semibold text-gray-800 mb-2">Abono Mensual</h4>
                <div className="space-y-1">
                    <div className="flex justify-between text-gray-600">
                        <span>Precio base:</span>
                        <span>{formatMoney(subtotalAbonoOriginal)}</span>
                    </div>
                    
                    {abonoPromocion && (
                        <>
                            <div className="flex justify-between text-green-600 text-xs font-medium">
                                <span>Promoción {abonoPromocion}:</span>
                                <span>{getExplicacionPromocion(abonoPromocion, cantidadVehiculos)}</span>
                            </div>
                            <div className="flex justify-between text-green-600 text-xs font-medium">
                                <span>Descuento:</span>
                                <span>- {formatMoney(subtotalAbonoOriginal - subtotalAbono)}</span>
                            </div>
                        </>
                    )}
                    
                    {!abonoPromocion && abonoBonificacion > 0 && (
                        <div className="flex justify-between text-green-600 text-xs font-medium">
                            <span>Descuento {Math.round(abonoBonificacion)}%:</span>
                            <span>- {formatMoney(subtotalAbonoOriginal - subtotalAbono)}</span>
                        </div>
                    )}
                    
                    {!abonoPromocion && abonoBonificacion === 0 && (
                        <div className="flex justify-between text-gray-500 text-xs">
                            <span>Descuento:</span>
                            <span>$ 0,00</span>
                        </div>
                    )}
                    
                    <div className="flex justify-between font-bold pt-1 mt-1 border-t border-gray-200">
                        <span>Total abono mensual:</span>
                        <span className="text-local">{formatMoney(subtotalAbono)}</span>
                    </div>
                </div>
            </div>

            {/* ACCESORIOS */}
            {todosLosAccesorios.length > 0 && (
                <div className="border-b border-gray-200 pb-3">
                    <h4 className="font-semibold text-gray-800 mb-2">Accesorios</h4>
                    <div className="space-y-3">
                        {todosLosAccesorios.map((item, index) => {
                            const subtotalBase = item.valor * item.cantidad;
                            const subtotalFinal = calcularSubtotalProducto(item);
                            const nombrePromo = getNombrePromocion(item.tipoPromocion);
                            
                            return (
                                <div key={`acc-${index}`} className="pl-2">
                                    <div className="flex justify-between text-xs text-gray-600">
                                        <span>{item.nombre} x{item.cantidad}:</span>
                                        <span>{formatMoney(subtotalBase)}</span>
                                    </div>
                                    
                                    {nombrePromo && (
                                        <div className="flex justify-between text-green-600 text-xs font-medium">
                                            <span>Promoción {nombrePromo}:</span>
                                            <span>{getExplicacionPromocion(item.tipoPromocion as '2x1' | '3x2', item.cantidad)}</span>
                                        </div>
                                    )}
                                    
                                    {item.bonificacion && item.bonificacion > 0 ? (
                                        <div className="flex justify-between text-green-600 text-xs font-medium">
                                            <span>Descuento {Math.round(item.bonificacion)}%:</span>
                                            <span>- {formatMoney(subtotalBase - subtotalFinal)}</span>
                                        </div>
                                    ) : !nombrePromo ? (
                                        <div className="flex justify-between text-gray-500 text-xs">
                                            <span>Descuento:</span>
                                            <span>$ 0,00</span>
                                        </div>
                                    ) : null}
                                    
                                    <div className="flex justify-between text-xs font-bold mt-1">
                                        <span>Subtotal:</span>
                                        <span>{formatMoney(subtotalFinal)}</span>
                                    </div>
                                </div>
                            );
                        })}
                        
                        <div className="flex justify-between font-bold pt-2 mt-1 border-t border-gray-200">
                            <span>TOTAL ACCESORIOS:</span>
                            <span className="text-local">{formatMoney(totalAccesorios)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* SERVICIOS */}
            {todosLosServicios.length > 0 && (
                <div className="border-b border-gray-200 pb-3">
                    <h4 className="font-semibold text-gray-800 mb-2">Servicios</h4>
                    <div className="space-y-3">
                        {todosLosServicios.map((item, index) => {
                            const subtotalBase = item.valor * item.cantidad;
                            const subtotalFinal = calcularSubtotalProducto(item);
                            const nombrePromo = getNombrePromocion(item.tipoPromocion);
                            
                            return (
                                <div key={`serv-${index}`} className="pl-2">
                                    <div className="flex justify-between text-xs text-gray-600">
                                        <span>{item.nombre} x{item.cantidad}:</span>
                                        <span>{formatMoney(subtotalBase)}</span>
                                    </div>
                                    
                                    {nombrePromo && (
                                        <div className="flex justify-between text-green-600 text-xs font-medium">
                                            <span>Promoción {nombrePromo}:</span>
                                            <span>{getExplicacionPromocion(item.tipoPromocion as '2x1' | '3x2', item.cantidad)}</span>
                                        </div>
                                    )}
                                    
                                    {item.bonificacion && item.bonificacion > 0 ? (
                                        <div className="flex justify-between text-green-600 text-xs font-medium">
                                            <span>Descuento {Math.round(item.bonificacion)}%:</span>
                                            <span>- {formatMoney(subtotalBase - subtotalFinal)}</span>
                                        </div>
                                    ) : !nombrePromo ? (
                                        <div className="flex justify-between text-gray-500 text-xs">
                                            <span>Descuento:</span>
                                            <span>$ 0,00</span>
                                        </div>
                                    ) : null}
                                    
                                    <div className="flex justify-between text-xs font-bold mt-1">
                                        <span>Subtotal:</span>
                                        <span>{formatMoney(subtotalFinal)}</span>
                                    </div>
                                </div>
                            );
                        })}
                        
                        <div className="flex justify-between font-bold pt-2 mt-1 border-t border-gray-200">
                            <span>TOTAL SERVICIOS:</span>
                            <span className="text-local">{formatMoney(totalServicios)}</span>
                        </div>
                    </div>
                </div>
            )}

            {/* TOTAL GENERAL */}
            <div className="pt-2">
                <div className="flex justify-between font-bold text-base">
                    <span>TOTAL GENERAL:</span>
                    <span className="text-local text-lg">
                        {formatMoney(subtotalTasa + subtotalAbono + totalAccesorios + totalServicios)}
                    </span>
                </div>
                <p className="text-xs text-gray-500 text-right mt-2">
                    * Costo mensual desde el 2° mes: {formatMoney(subtotalAbono + totalServicios)}
                </p>
            </div>
        </div>
    );
}