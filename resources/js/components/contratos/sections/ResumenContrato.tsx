// resources/js/components/contratos/sections/ResumenContrato.tsx

import { FileText, Calendar, Truck, Package, Wrench, Gift, CreditCard } from 'lucide-react';
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
            <div className="px-4 py-3 bg-gradient-to-r from-local-500 to-local-600 text-white border-b">
                <h3 className="font-semibold flex items-center gap-2">
                    <FileText className="h-4 w-4" />
                    Resumen del Presupuesto
                </h3>
                {data.tienePromocion && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 mt-1 bg-white/20 rounded-full text-xs font-medium">
                        <Gift className="h-3 w-3" />
                        Promoción: {presupuesto.promocion?.nombre}
                    </span>
                )}
            </div>
            
            <div className="p-4 max-h-[calc(100vh-200px)] overflow-y-auto">
                {/* Cabecera con referencia */}
                <div className="mb-4 pb-3 border-b border-gray-200">
                    <p className="text-xs text-gray-500 uppercase tracking-wide">Referencia</p>
                    <p className="text-sm font-semibold text-gray-900">{data.referencia}</p>
                    <div className="flex items-center gap-3 mt-2 text-xs text-gray-500">
                        <div className="flex items-center gap-1">
                            <Calendar className="h-3 w-3" />
                            {presupuesto.created ? new Date(presupuesto.created).toLocaleDateString('es-AR') : 'N/A'}
                        </div>
                        <div className="flex items-center gap-1">
                            <Truck className="h-3 w-3" />
                            {data.cantidadVehiculos} vehículo{data.cantidadVehiculos !== 1 ? 's' : ''}
                        </div>
                    </div>
                </div>

                {/* INVERSIÓN INICIAL - Estilo similar al de presupuestos */}
                {presupuesto.tasa && (
                    <div className="mb-4 bg-blue-50 rounded-lg border border-blue-200 overflow-hidden">
                        <div className="bg-blue-100 px-3 py-2 border-b border-blue-200">
                            <div className="flex items-center gap-2">
                                <CreditCard className="h-3 w-3 text-blue-700" />
                                <h4 className="font-semibold text-blue-900 text-sm">Inversión Inicial (Pago Único)</h4>
                            </div>
                        </div>
                        <div className="p-3 space-y-2">
                            <div className="border-b border-blue-200 pb-2">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1">
                                        <Wrench className="h-3 w-3 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">{presupuesto.tasa.nombre}:</span>
                                    </div>
                                    <span className="text-sm text-gray-600">{formatMoney(toNumber(presupuesto.valor_tasa) * data.cantidadVehiculos)}</span>
                                </div>
                                
                                {data.tienePromocion && data.tienePromocionProducto(presupuesto.tasa?.id) ? (
                                    <div className="mt-1 ml-5">
                                        <div className="flex justify-between text-green-700 text-xs">
                                            <span>🎉 Descuento promoción: {data.getTextoBonificacion(presupuesto.tasa?.id, presupuesto.tasa_bonificacion)}</span>
                                            <span>- {formatMoney((toNumber(presupuesto.valor_tasa) * data.cantidadVehiculos) - data.subtotalTasa)}</span>
                                        </div>
                                    </div>
                                ) : toNumber(presupuesto.tasa_bonificacion) > 0 ? (
                                    <div className="mt-1 ml-5">
                                        <div className="flex justify-between text-green-600 text-xs">
                                            <span>💰 Descuento: {formatPorcentaje(presupuesto.tasa_bonificacion)}</span>
                                            <span>- {formatMoney((toNumber(presupuesto.valor_tasa) * data.cantidadVehiculos) - data.subtotalTasa)}</span>
                                        </div>
                                    </div>
                                ) : null}
                                
                                <div className="flex justify-between mt-1 ml-5 font-semibold text-blue-700 text-sm">
                                    <span>Total instalación:</span>
                                    <span>{formatMoney(data.subtotalTasa)}</span>
                                </div>
                            </div>

                            {/* ACCESORIOS */}
                            {data.tieneAccesorios && data.accesoriosUnicos.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-1 mb-2">
                                        <Package className="h-3 w-3 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">Accesorios:</span>
                                    </div>
                                    
                                    <div className="space-y-2 ml-5">
                                        {data.accesoriosUnicos.map((item: any, index: number) => {
                                            const subtotalBase = toNumber(item.valor) * item.cantidad;
                                            const enPromocion = data.tienePromocion && data.tienePromocionProducto(item.prd_servicio_id);
                                            
                                            return (
                                                <div key={index} className="text-sm">
                                                    <div className="flex justify-between text-gray-600">
                                                        <span>• {item.producto_servicio?.nombre} x{item.cantidad}</span>
                                                        <span>{formatMoney(subtotalBase)}</span>
                                                    </div>
                                                    {enPromocion ? (
                                                        <div className="flex justify-between text-green-700 text-xs mt-0.5">
                                                            <span>Descuento promoción: {data.getTextoBonificacion(item.prd_servicio_id, item.bonificacion)}</span>
                                                            <span>- {formatMoney(subtotalBase - toNumber(item.subtotal))}</span>
                                                        </div>
                                                    ) : toNumber(item.bonificacion) > 0 ? (
                                                        <div className="flex justify-between text-green-600 text-xs mt-0.5">
                                                            <span>Descuento: {formatPorcentaje(item.bonificacion)}</span>
                                                            <span>- {formatMoney(subtotalBase - toNumber(item.subtotal))}</span>
                                                        </div>
                                                    ) : null}
                                                    <div className="flex justify-between font-medium text-gray-800 mt-0.5">
                                                        <span>Subtotal:</span>
                                                        <span>{formatMoney(item.subtotal)}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    <div className="flex justify-between mt-2 pt-1 border-t border-blue-200 font-semibold text-blue-700 text-sm">
                                        <span>TOTAL ACCESORIOS:</span>
                                        <span>{formatMoney(data.totalAccesorios)}</span>
                                    </div>
                                </div>
                            )}

                            {/* TOTAL INVERSIÓN INICIAL */}
                            <div className="bg-blue-100 rounded-lg p-2 mt-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-blue-900 text-sm">💰 TOTAL INVERSIÓN INICIAL:</span>
                                    <span className="text-base font-bold text-blue-900">{formatMoney(data.inversionInicial)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* COSTO RECURRENTE - MENSUAL */}
                {presupuesto.abono && (
                    <div className="mb-4 bg-green-50 rounded-lg border border-green-200 overflow-hidden">
                        <div className="bg-green-100 px-3 py-2 border-b border-green-200">
                            <div className="flex items-center gap-2">
                                <Calendar className="h-3 w-3 text-green-700" />
                                <h4 className="font-semibold text-green-900 text-sm">Costo Recurrente (Mensual)</h4>
                            </div>
                        </div>
                        <div className="p-3 space-y-2">
                            <div className="border-b border-green-200 pb-2">
                                <div className="flex justify-between items-center">
                                    <div className="flex items-center gap-1">
                                        <CreditCard className="h-3 w-3 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">{presupuesto.abono.nombre}:</span>
                                    </div>
                                    <span className="text-sm text-gray-600">{formatMoney(toNumber(presupuesto.valor_abono) * data.cantidadVehiculos)}</span>
                                </div>
                                
                                {data.tienePromocion && data.tienePromocionProducto(presupuesto.abono?.id) ? (
                                    <div className="mt-1 ml-5">
                                        <div className="flex justify-between text-green-700 text-xs">
                                            <span>🎉 Descuento promoción: {data.getTextoBonificacion(presupuesto.abono?.id, presupuesto.abono_bonificacion)}</span>
                                            <span>- {formatMoney((toNumber(presupuesto.valor_abono) * data.cantidadVehiculos) - data.subtotalAbono)}</span>
                                        </div>
                                    </div>
                                ) : toNumber(presupuesto.abono_bonificacion) > 0 ? (
                                    <div className="mt-1 ml-5">
                                        <div className="flex justify-between text-green-600 text-xs">
                                            <span>💰 Descuento: {formatPorcentaje(presupuesto.abono_bonificacion)}</span>
                                            <span>- {formatMoney((toNumber(presupuesto.valor_abono) * data.cantidadVehiculos) - data.subtotalAbono)}</span>
                                        </div>
                                    </div>
                                ) : null}
                                
                                <div className="flex justify-between mt-1 ml-5 font-semibold text-green-700 text-sm">
                                    <span>Total abono:</span>
                                    <span>{formatMoney(data.subtotalAbono)}</span>
                                </div>
                            </div>

                            {/* SERVICIOS */}
                            {data.tieneServiciosMensuales && data.serviciosMensuales.length > 0 && (
                                <div>
                                    <div className="flex items-center gap-1 mb-2">
                                        <Package className="h-3 w-3 text-gray-500" />
                                        <span className="text-sm font-medium text-gray-700">Servicios:</span>
                                    </div>
                                    
                                    <div className="space-y-2 ml-5">
                                        {data.serviciosMensuales.map((item: any, index: number) => {
                                            const subtotalBase = toNumber(item.valor) * item.cantidad;
                                            const enPromocion = data.tienePromocion && data.tienePromocionProducto(item.prd_servicio_id);
                                            
                                            return (
                                                <div key={index} className="text-sm">
                                                    <div className="flex justify-between text-gray-600">
                                                        <span>• {item.producto_servicio?.nombre} x{item.cantidad}</span>
                                                        <span>{formatMoney(subtotalBase)}</span>
                                                    </div>
                                                    {enPromocion ? (
                                                        <div className="flex justify-between text-green-700 text-xs mt-0.5">
                                                            <span>Descuento promoción: {data.getTextoBonificacion(item.prd_servicio_id, item.bonificacion)}</span>
                                                            <span>- {formatMoney(subtotalBase - toNumber(item.subtotal))}</span>
                                                        </div>
                                                    ) : toNumber(item.bonificacion) > 0 ? (
                                                        <div className="flex justify-between text-green-600 text-xs mt-0.5">
                                                            <span>Descuento: {formatPorcentaje(item.bonificacion)}</span>
                                                            <span>- {formatMoney(subtotalBase - toNumber(item.subtotal))}</span>
                                                        </div>
                                                    ) : null}
                                                </div>
                                            );
                                        })}
                                    </div>
                                    
                                    <div className="flex justify-between mt-2 pt-1 border-t border-green-200 font-semibold text-green-700 text-sm">
                                        <span>TOTAL SERVICIOS:</span>
                                        <span>{formatMoney(data.totalServiciosMensuales)}</span>
                                    </div>
                                </div>
                            )}

                            {/* TOTAL COSTO MENSUAL */}
                            <div className="bg-green-100 rounded-lg p-2 mt-2">
                                <div className="flex justify-between items-center">
                                    <span className="font-bold text-green-900 text-sm">📅 TOTAL COSTO MENSUAL:</span>
                                    <span className="text-base font-bold text-green-900">{formatMoney(data.costoMensualTotal)}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* RESUMEN TOTAL PRIMER MES */}
                <div className="bg-gradient-to-r from-local-500 to-local-600 rounded-lg p-3 text-white shadow-md mt-4">
                    <div className="flex justify-between items-center">
                        <div>
                            <p className="text-xs opacity-90">Total a pagar</p>
                            <p className="text-[10px] opacity-75">Primer mes (instalación + 1er mes)</p>
                        </div>
                        <div className="text-right">
                            <p className="text-lg font-bold">{formatMoney(data.totalPrimerMes)}</p>
                            <p className="text-[10px] opacity-75">* Desde el 2° mes: {formatMoney(data.costoMensualTotal)}/mes</p>
                        </div>
                    </div>
                </div>

                {/* PROMOCIÓN DESTACADA */}
                {data.tienePromocion && (
                    <div className="mt-4 bg-purple-50 rounded-lg border border-purple-200 p-2">
                        <div className="flex items-center gap-2 text-purple-800 text-xs">
                            <Gift className="h-3 w-3" />
                            <span className="font-medium">Promoción aplicada:</span>
                            <span>{presupuesto.promocion?.nombre}</span>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}