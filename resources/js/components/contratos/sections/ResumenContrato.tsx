// resources/js/components/contratos/sections/ResumenContrato.tsx
import { FileText, Calendar, Truck, Package, Box, Gift } from 'lucide-react';
import React from 'react';

import { Amount } from '@/components/ui/Amount';
import { usePresupuestoData } from '@/hooks/usePresupuestoData';
import { toNumber } from '@/utils/formatters';

interface Props {
    presupuesto: any;
}

export default function ResumenContrato({ presupuesto }: Props) {
    // Si no hay presupuesto (contrato desde empresa)
    if (!presupuesto) {
        return (
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-4">
                <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="font-medium text-gray-900 flex items-center gap-2">
                        <FileText className="h-4 w-4 text-orange-600" />
                        Información del Contrato
                    </h3>
                </div>
                <div className="p-6 text-center">
                    <p className="text-sm text-gray-500">
                        Contrato generado sin presupuesto asociado
                    </p>
                </div>
            </div>
        );
    }

    // Solo ejecutamos el hook si hay presupuesto
    const data = usePresupuestoData(presupuesto);
    
    const formatMoney = (value: any): string => {
        const num = toNumber(value);
        return '$ ' + num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const formatPorcentaje = (value: any): string => {
        const num = toNumber(value);
        return Math.round(num).toString() + '%';
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden sticky top-4">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <FileText className="h-4 w-4 text-orange-600" />
                    Resumen del Presupuesto
                </h3>
                {data.tienePromocion && (
                    <span className="inline-flex items-center gap-1 px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                        <Gift className="h-3 w-3" />
                        Promoción: {presupuesto.promocion?.nombre}
                    </span>
                )}
            </div>
            
            <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Cabecera con referencia */}
                <div className="mb-4 pb-3 border-b">
                    <p className="text-xs text-gray-500">Referencia</p>
                    <p className="text-sm font-medium">{data.referencia}</p>
                    <div className="flex items-center gap-2 mt-2 text-xs text-gray-600">
                        <Calendar className="h-3 w-3" />
                        {presupuesto.created ? new Date(presupuesto.created).toLocaleDateString('es-AR') : 'N/A'}
                        <Truck className="h-3 w-3 ml-2" />
                        {data.cantidadVehiculos} vehículo{data.cantidadVehiculos !== 1 ? 's' : ''}
                    </div>
                </div>

                {/* TASA */}
                {presupuesto.tasa && (
                    <div className="mb-4 pb-3 border-b border-gray-200">
                        <div className="flex justify-between font-medium text-gray-700 mb-1">
                            <span>{presupuesto.tasa.nombre}:</span>
                            <span>{formatMoney(toNumber(presupuesto.valor_tasa) * data.cantidadVehiculos)}</span>
                        </div>
                        
                        {data.tienePromocion && data.tienePromocionProducto(presupuesto.tasa?.id) ? (
                            <div className="mt-1 pl-2">
                                <div className="flex justify-between text-green-700 text-xs font-medium">
                                    <span>Descuento: {data.getTextoBonificacion(presupuesto.tasa?.id, presupuesto.tasa_bonificacion)}</span>
                                    <span>- {formatMoney((toNumber(presupuesto.valor_tasa) * data.cantidadVehiculos) - data.subtotalTasa)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold mt-1">
                                    <span>Total instalación:</span>
                                    <span className="text-local">{formatMoney(data.subtotalTasa)}</span>
                                </div>
                            </div>
                        ) : toNumber(presupuesto.tasa_bonificacion) > 0 ? (
                            <div className="mt-1 pl-2">
                                <div className="flex justify-between text-green-700 text-xs font-medium">
                                    <span>Descuento: {formatPorcentaje(presupuesto.tasa_bonificacion)}</span>
                                    <span>- {formatMoney((toNumber(presupuesto.valor_tasa) * data.cantidadVehiculos) - data.subtotalTasa)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold mt-1">
                                    <span>Total instalación:</span>
                                    <span className="text-local">{formatMoney(data.subtotalTasa)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between text-sm font-bold mt-1 pl-2">
                                <span>Total instalación:</span>
                                <span className="text-local">{formatMoney(data.subtotalTasa)}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* ABONO */}
                {presupuesto.abono && (
                    <div className="mb-4 pb-3 border-b border-gray-200">
                        <div className="flex justify-between font-medium text-gray-700 mb-1">
                            <span>{presupuesto.abono.nombre}:</span>
                            <span>{formatMoney(toNumber(presupuesto.valor_abono) * data.cantidadVehiculos)}</span>
                        </div>
                        
                        {data.tienePromocion && data.tienePromocionProducto(presupuesto.abono?.id) ? (
                            <div className="mt-1 pl-2">
                                <div className="flex justify-between text-green-700 text-xs font-medium">
                                    <span>Descuento: {data.getTextoBonificacion(presupuesto.abono?.id, presupuesto.abono_bonificacion)}</span>
                                    <span>- {formatMoney((toNumber(presupuesto.valor_abono) * data.cantidadVehiculos) - data.subtotalAbono)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold mt-1">
                                    <span>Total abono:</span>
                                    <span className="text-local">{formatMoney(data.subtotalAbono)}</span>
                                </div>
                            </div>
                        ) : toNumber(presupuesto.abono_bonificacion) > 0 ? (
                            <div className="mt-1 pl-2">
                                <div className="flex justify-between text-green-700 text-xs font-medium">
                                    <span>Descuento: {formatPorcentaje(presupuesto.abono_bonificacion)}</span>
                                    <span>- {formatMoney((toNumber(presupuesto.valor_abono) * data.cantidadVehiculos) - data.subtotalAbono)}</span>
                                </div>
                                <div className="flex justify-between text-sm font-bold mt-1">
                                    <span>Total abono:</span>
                                    <span className="text-local">{formatMoney(data.subtotalAbono)}</span>
                                </div>
                            </div>
                        ) : (
                            <div className="flex justify-between text-sm font-bold mt-1 pl-2">
                                <span>Total abono:</span>
                                <span className="text-local">{formatMoney(data.subtotalAbono)}</span>
                            </div>
                        )}
                    </div>
                )}

                {/* ACCESORIOS */}
                {data.tieneAccesorios && (
                    <div className="mb-4 pb-3 border-b border-gray-200">
                        <p className="font-medium text-gray-700 mb-2">Accesorios:</p>
                        
                        {data.accesoriosUnicos.map((item: any, index: number) => {
                            const subtotalBase = toNumber(item.valor) * item.cantidad;
                            const enPromocion = data.tienePromocion && data.tienePromocionProducto(item.prd_servicio_id);
                            
                            return (
                                <div key={index} className="mb-3 pl-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">{item.producto_servicio?.nombre} x{item.cantidad}:</span>
                                        <span className="font-medium">{formatMoney(subtotalBase)}</span>
                                    </div>
                                    {enPromocion ? (
                                        <div className="flex justify-between text-green-700 text-xs font-medium">
                                            <span>Descuento: {data.getTextoBonificacion(item.prd_servicio_id, item.bonificacion)}</span>
                                            <span>- {formatMoney(subtotalBase - toNumber(item.subtotal))}</span>
                                        </div>
                                    ) : toNumber(item.bonificacion) > 0 ? (
                                        <div className="flex justify-between text-green-700 text-xs font-medium">
                                            <span>Descuento: {formatPorcentaje(item.bonificacion)}</span>
                                            <span>- {formatMoney(subtotalBase - toNumber(item.subtotal))}</span>
                                        </div>
                                    ) : null}
                                    <div className="flex justify-between text-xs font-bold mt-1">
                                        <span>Subtotal:</span>
                                        <span className="text-local">{formatMoney(item.subtotal)}</span>
                                    </div>
                                </div>
                            );
                        })}
                        
                        <div className="flex justify-between text-sm font-bold mt-2 pt-1 border-t border-gray-200">
                            <span>TOTAL ACCESORIOS:</span>
                            <span className="text-local">{formatMoney(data.totalAccesorios)}</span>
                        </div>
                    </div>
                )}

                {/* SERVICIOS */}
                {data.tieneServiciosMensuales && (
                    <div className="mb-4 pb-3 border-b border-gray-200">
                        <p className="font-medium text-gray-700 mb-2">Servicios:</p>
                        
                        {data.serviciosMensuales.map((item: any, index: number) => {
                            const subtotalBase = toNumber(item.valor) * item.cantidad;
                            const enPromocion = data.tienePromocion && data.tienePromocionProducto(item.prd_servicio_id);
                            
                            return (
                                <div key={index} className="mb-3 pl-2">
                                    <div className="flex justify-between text-xs">
                                        <span className="text-gray-600">{item.producto_servicio?.nombre} x{item.cantidad}:</span>
                                        <span className="font-medium">{formatMoney(subtotalBase)}</span>
                                    </div>
                                    {enPromocion ? (
                                        <div className="flex justify-between text-green-700 text-xs font-medium">
                                            <span>Descuento: {data.getTextoBonificacion(item.prd_servicio_id, item.bonificacion)}</span>
                                            <span>- {formatMoney(subtotalBase - toNumber(item.subtotal))}</span>
                                        </div>
                                    ) : toNumber(item.bonificacion) > 0 ? (
                                        <div className="flex justify-between text-green-700 text-xs font-medium">
                                            <span>Descuento: {formatPorcentaje(item.bonificacion)}</span>
                                            <span>- {formatMoney(subtotalBase - toNumber(item.subtotal))}</span>
                                        </div>
                                    ) : null}
                                </div>
                            );
                        })}
                        
                        <div className="flex justify-between text-sm font-bold mt-2 pt-1 border-t border-gray-200">
                            <span>TOTAL SERVICIOS:</span>
                            <span className="text-local">{formatMoney(data.totalServiciosMensuales)}</span>
                        </div>
                    </div>
                )}

                {/* TOTAL GENERAL */}
                <div className="pt-2">
                    <div className="flex justify-between font-bold text-base">
                        <span>TOTAL GENERAL:</span>
                        <span className="text-local text-lg">
                            {formatMoney(data.totalPrimerMes)}
                        </span>
                    </div>
                    <p className="text-xs text-gray-500 text-right mt-1">
                        * Costo mensual desde el 2° mes: <Amount value={data.costoMensualTotal} fallback="-" />
                    </p>
                </div>
            </div>
        </div>
    );
}