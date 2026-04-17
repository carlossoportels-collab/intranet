// resources/js/Pages/Comercial/Presupuestos/Show.tsx

import { router } from '@inertiajs/react';
import { 
    ArrowLeft, 
    Calendar, 
    User, 
    Truck, 
    CreditCard,
    Package,
    Wrench,
    Gift
} from 'lucide-react';
import React from 'react';

import { PresupuestoActions } from '@/components/presupuestos/PresupuestoActions';
import { Amount } from '@/components/ui/Amount';
import { DataCard } from '@/components/ui/DataCard';
import { InfoRow } from '@/components/ui/InfoRow';
import ResponsiveGrid from '@/components/ui/responsiveGrid';
import { StatusBadge } from '@/components/ui/StatusBadge';
import { usePresupuestoData } from '@/hooks/usePresupuestoData';
import { useWhatsAppMessage } from '@/hooks/useWhatsAppMessage';
import AppLayout from '@/layouts/app-layout';
import { formatDate, formatMoney, toNumber } from '@/utils/formatters';
import type { Origen, Rubro, Provincia } from '@/types/leads';

interface Props {
    presupuesto: any;
    origenes?: Origen[];
    rubros?: Rubro[];
    provincias?: Provincia[];
}

export default function PresupuestosShow({ 
    presupuesto, 
    origenes = [],
    rubros = [],
    provincias = []
}: Props) {
    const data = usePresupuestoData(presupuesto);
    const companiaNombre = presupuesto.compania?.nombre || 'LOCALSAT';
    const companiaId = presupuesto.compania?.id || 1;

    const mensajeWhatsApp = useWhatsAppMessage({
        presupuesto,
        serviciosMensuales: data.serviciosMensuales,
        accesoriosUnicos: data.accesoriosUnicos,
        inversionInicial: data.inversionInicial,
        costoMensualTotal: data.costoMensualTotal,
        totalPrimerMes: data.totalPrimerMes
    });

    const getEstadoColor = (estadoId?: number) => {
        switch(estadoId) {
            case 1: return 'green';
            case 2: return 'yellow';
            case 3: return 'blue';
            case 4: return 'red';
            default: return 'gray';
        }
    };

    const formatMoneyLocal = (value: any): string => {
        const num = toNumber(value);
        return '$ ' + num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const formatPorcentaje = (value: any): string => {
        const num = toNumber(value);
        if (num === 0) return '';
        return Math.round(num).toString() + '%';
    };

    const cantidadVehiculos = presupuesto.cantidad_vehiculos || 1;

    return (
        <AppLayout title={`Presupuesto #${data.referencia}`}>
            <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
                {/* Header */}
                <div className="mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => router.visit('/comercial/presupuestos')}
                                className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div className="flex flex-wrap items-center gap-2">
                                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900">
                                    Presupuesto #{data.referencia}
                                </h1>
                                <StatusBadge 
                                    status={presupuesto.estado?.nombre || 'Sin estado'} 
                                    color={getEstadoColor(presupuesto.estado?.id)}
                                />
                                {data.tienePromocion && (
                                    <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                                        <Gift className="h-3 w-3" />
                                        Promoción: {presupuesto.promocion?.nombre}
                                    </span>
                                )}
                            </div>
                        </div>
                        
                        <PresupuestoActions
                            presupuestoId={presupuesto.id}
                            referencia={data.referencia}
                            tieneTelefono={!!presupuesto.lead?.telefono}
                            mensajeWhatsApp={mensajeWhatsApp}
                            telefono={presupuesto.lead?.telefono}
                            leadNombre={presupuesto.lead?.nombre_completo || ''}
                            leadEmail={presupuesto.lead?.email || ''}
                            comercialEmail={presupuesto.comercial_email || ''}
                            comercialNombre={presupuesto.nombre_comercial || ''}
                            companiaId={presupuesto.compania_id || 1}
                            companiaNombre={presupuesto.compania_nombre || 'LOCALSAT'}
                            leadId={presupuesto.lead?.id}
                            leadEsCliente={presupuesto.lead?.es_cliente || false}
                            lead={presupuesto.lead ?? null}
                            origenes={origenes}
                            rubros={rubros}
                            provincias={provincias}
                        />
                    </div>
                </div>

                {/* Información del Cliente */}
                <DataCard title="Información del Cliente" icon={<User className="h-5 w-5" />}>
                    <ResponsiveGrid cols={{ default: 1, md: 2 }} gap={6}>
                        <div className="space-y-3">
                            <InfoRow label="Cliente" value={presupuesto.lead?.nombre_completo} valueClassName="font-semibold" />
                            <InfoRow label="Email" value={presupuesto.lead?.email} />
                            {presupuesto.lead?.telefono && (
                                <InfoRow label="Teléfono" value={presupuesto.lead.telefono} />
                            )}
                        </div>
                        
                        <div className="space-y-3">
                            <InfoRow label="Fecha" value={formatDate(presupuesto.created)} />
                            <InfoRow label="Validez" value={formatDate(presupuesto.validez)} />
                            <InfoRow 
                                label="Vehículos" 
                                value={
                                    <div className="flex items-center gap-1">
                                        <Truck className="h-4 w-4 text-gray-400" />
                                        <span>{cantidadVehiculos}</span>
                                    </div>
                                } 
                            />
                            <InfoRow label="Comercial" value={data.nombreComercial} />
                        </div>
                    </ResponsiveGrid>
                </DataCard>

                {/* DETALLE DE INVERSIÓN - CON CANTIDADES EXPLÍCITAS */}
                <DataCard title="Detalle de Inversión">
                    <div className="space-y-6">
                        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                            {/* INVERSIÓN INICIAL - PAGO ÚNICO */}
                            <div className="bg-blue-50 rounded-lg border border-blue-200 overflow-hidden h-fit">
                                <div className="bg-blue-100 px-4 py-3 border-b border-blue-200">
                                    <div className="flex items-center gap-2">
                                        <CreditCard className="h-4 w-4 text-blue-700" />
                                        <h3 className="font-semibold text-blue-900">Inversión Inicial (Pago Único)</h3>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    {/* TASA */}
                                    {presupuesto.tasa && toNumber(data.subtotalTasa) > 0 && (
                                        <div className="border-b border-blue-200 pb-3 last:border-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-1">
                                                    <Wrench className="h-4 w-4 text-gray-500" />
                                                    <span className="font-medium text-gray-700">{presupuesto.tasa.nombre}:</span>
                                                </div>
                                                <span className="text-gray-600">{formatMoneyLocal(presupuesto.valor_tasa)} c/u</span>
                                            </div>
                                            
                                            {cantidadVehiculos > 1 && (
                                                <div className="flex justify-between text-xs text-gray-500 pl-6 mt-1">
                                                    <span>Cantidad: {cantidadVehiculos} vehículos</span>
                                                    <span>{formatMoneyLocal(presupuesto.valor_tasa * cantidadVehiculos)}</span>
                                                </div>
                                            )}
                                            
                                            {data.tienePromocion && data.tienePromocionProducto(presupuesto.tasa?.id) ? (
                                                <div className="mt-1 pl-6">
                                                    <div className="flex justify-between text-green-700 text-xs">
                                                        <span>🎉 Descuento promoción: {data.getTextoBonificacion(presupuesto.tasa?.id, presupuesto.tasa_bonificacion)}</span>
                                                        <span>- {formatMoneyLocal((presupuesto.valor_tasa * cantidadVehiculos) - data.subtotalTasa)}</span>
                                                    </div>
                                                </div>
                                            ) : toNumber(presupuesto.tasa_bonificacion) > 0 ? (
                                                <div className="mt-1 pl-6">
                                                    <div className="flex justify-between text-green-600 text-xs">
                                                        <span>Descuento: {formatPorcentaje(presupuesto.tasa_bonificacion)}</span>
                                                        <span>- {formatMoneyLocal((presupuesto.valor_tasa * cantidadVehiculos) - data.subtotalTasa)}</span>
                                                    </div>
                                                </div>
                                            ) : null}
                                            
                                            <div className="flex justify-between mt-1 pl-6 font-semibold text-blue-700">
                                                <span>Total instalación:</span>
                                                <span>{formatMoneyLocal(data.subtotalTasa)}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* ACCESORIOS */}
                                    {data.tieneAccesorios && data.accesoriosUnicos.length > 0 && (
                                        <div className="border-b border-blue-200 pb-3 last:border-0">
                                            <div className="flex items-center gap-1 mb-2">
                                                <Package className="h-4 w-4 text-gray-500" />
                                                <span className="font-medium text-gray-700">Accesorios:</span>
                                            </div>
                                            
                                            <div className="space-y-3 pl-6">
                                                {data.accesoriosUnicos.map((item: any, index: number) => {
                                                    const cantidad = item.cantidad || 1;
                                                    const valorUnitario = toNumber(item.valor);
                                                    const subtotalBase = valorUnitario * cantidad;
                                                    const enPromocion = data.tienePromocion && data.tienePromocionProducto(item.prd_servicio_id);
                                                    
                                                    return (
                                                        <div key={index} className="text-sm">
                                                            <div className="flex justify-between text-gray-600">
                                                                <span>• {item.producto_servicio?.nombre}</span>
                                                                <span>{formatMoneyLocal(valorUnitario)} c/u</span>
                                                            </div>
                                                            
                                                            {cantidad > 1 && (
                                                                <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                                                                    <span className="pl-4">Cantidad: {cantidad} unidades</span>
                                                                    <span>{formatMoneyLocal(subtotalBase)}</span>
                                                                </div>
                                                            )}
                                                            
                                                            {enPromocion ? (
                                                                <div className="flex justify-between text-green-700 text-xs mt-0.5">
                                                                    <span>🎉 Descuento promoción: {data.getTextoBonificacion(item.prd_servicio_id, item.bonificacion)}</span>
                                                                    <span>- {formatMoneyLocal(subtotalBase - toNumber(item.subtotal))}</span>
                                                                </div>
                                                            ) : toNumber(item.bonificacion) > 0 ? (
                                                                <div className="flex justify-between text-green-600 text-xs mt-0.5">
                                                                    <span>Descuento: {formatPorcentaje(item.bonificacion)}</span>
                                                                    <span>- {formatMoneyLocal(subtotalBase - toNumber(item.subtotal))}</span>
                                                                </div>
                                                            ) : null}
                                                            
                                                            <div className="flex justify-between font-medium text-gray-800 mt-0.5">
                                                                <span>Subtotal:</span>
                                                                <span>{formatMoneyLocal(item.subtotal)}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            
                                            <div className="flex justify-between mt-3 pt-2 border-t border-blue-200 font-semibold text-blue-700">
                                                <span>TOTAL ACCESORIOS:</span>
                                                <span>{formatMoneyLocal(data.totalAccesorios)}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* TOTAL INVERSIÓN INICIAL */}
                                    <div className="bg-blue-100 rounded-lg p-3 mt-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-blue-900">💰 TOTAL INVERSIÓN INICIAL:</span>
                                            <span className="text-xl font-bold text-blue-900">{formatMoneyLocal(data.inversionInicial)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* COSTO RECURRENTE - MENSUAL */}
                            <div className="bg-green-50 rounded-lg border border-green-200 overflow-hidden h-fit">
                                <div className="bg-green-100 px-4 py-3 border-b border-green-200">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="h-4 w-4 text-green-700" />
                                        <h3 className="font-semibold text-green-900">Costo Recurrente (Mensual)</h3>
                                    </div>
                                </div>
                                <div className="p-4 space-y-3">
                                    {/* ABONO */}
                                    {presupuesto.abono && toNumber(data.subtotalAbono) > 0 && (
                                        <div className="border-b border-green-200 pb-3 last:border-0">
                                            <div className="flex justify-between items-center mb-1">
                                                <div className="flex items-center gap-1">
                                                    <CreditCard className="h-4 w-4 text-gray-500" />
                                                    <span className="font-medium text-gray-700">{presupuesto.abono.nombre}:</span>
                                                </div>
                                                <span className="text-gray-600">{formatMoneyLocal(presupuesto.valor_abono)} c/u</span>
                                            </div>
                                            
                                            {cantidadVehiculos > 1 && (
                                                <div className="flex justify-between text-xs text-gray-500 pl-6 mt-1">
                                                    <span>Cantidad: {cantidadVehiculos} vehículos</span>
                                                    <span>{formatMoneyLocal(presupuesto.valor_abono * cantidadVehiculos)}</span>
                                                </div>
                                            )}
                                            
                                            {data.tienePromocion && data.tienePromocionProducto(presupuesto.abono?.id) ? (
                                                <div className="mt-1 pl-6">
                                                    <div className="flex justify-between text-green-700 text-xs">
                                                        <span>🎉 Descuento promoción: {data.getTextoBonificacion(presupuesto.abono?.id, presupuesto.abono_bonificacion)}</span>
                                                        <span>- {formatMoneyLocal((presupuesto.valor_abono * cantidadVehiculos) - data.subtotalAbono)}</span>
                                                    </div>
                                                </div>
                                            ) : toNumber(presupuesto.abono_bonificacion) > 0 ? (
                                                <div className="mt-1 pl-6">
                                                    <div className="flex justify-between text-green-600 text-xs">
                                                        <span>Descuento: {formatPorcentaje(presupuesto.abono_bonificacion)}</span>
                                                        <span>- {formatMoneyLocal((presupuesto.valor_abono * cantidadVehiculos) - data.subtotalAbono)}</span>
                                                    </div>
                                                </div>
                                            ) : null}
                                            
                                            <div className="flex justify-between mt-1 pl-6 font-semibold text-green-700">
                                                <span>Total abono:</span>
                                                <span>{formatMoneyLocal(data.subtotalAbono)}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* SERVICIOS */}
                                    {data.tieneServiciosMensuales && data.serviciosMensuales.length > 0 && (
                                        <div className="border-b border-green-200 pb-3 last:border-0">
                                            <div className="flex items-center gap-1 mb-2">
                                                <Package className="h-4 w-4 text-gray-500" />
                                                <span className="font-medium text-gray-700">Servicios:</span>
                                            </div>
                                            
                                            <div className="space-y-3 pl-6">
                                                {data.serviciosMensuales.map((item: any, index: number) => {
                                                    const cantidad = item.cantidad || 1;
                                                    const valorUnitario = toNumber(item.valor);
                                                    const subtotalBase = valorUnitario * cantidad;
                                                    const enPromocion = data.tienePromocion && data.tienePromocionProducto(item.prd_servicio_id);
                                                    
                                                    return (
                                                        <div key={index} className="text-sm">
                                                            <div className="flex justify-between text-gray-600">
                                                                <span>• {item.producto_servicio?.nombre}</span>
                                                                <span>{formatMoneyLocal(valorUnitario)} c/u</span>
                                                            </div>
                                                            
                                                            {cantidad > 1 && (
                                                                <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                                                                    <span className="pl-4">Cantidad: {cantidad} unidades</span>
                                                                    <span>{formatMoneyLocal(subtotalBase)}</span>
                                                                </div>
                                                            )}
                                                            
                                                            {enPromocion ? (
                                                                <div className="flex justify-between text-green-700 text-xs mt-0.5">
                                                                    <span>🎉 Descuento promoción: {data.getTextoBonificacion(item.prd_servicio_id, item.bonificacion)}</span>
                                                                    <span>- {formatMoneyLocal(subtotalBase - toNumber(item.subtotal))}</span>
                                                                </div>
                                                            ) : toNumber(item.bonificacion) > 0 ? (
                                                                <div className="flex justify-between text-green-600 text-xs mt-0.5">
                                                                    <span>Descuento: {formatPorcentaje(item.bonificacion)}</span>
                                                                    <span>- {formatMoneyLocal(subtotalBase - toNumber(item.subtotal))}</span>
                                                                </div>
                                                            ) : null}
                                                            
                                                            <div className="flex justify-between font-medium text-gray-800 mt-0.5">
                                                                <span>Subtotal:</span>
                                                                <span>{formatMoneyLocal(item.subtotal)}</span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                            </div>
                                            
                                            <div className="flex justify-between mt-3 pt-2 border-t border-green-200 font-semibold text-green-700">
                                                <span>TOTAL SERVICIOS:</span>
                                                <span>{formatMoneyLocal(data.totalServiciosMensuales)}</span>
                                            </div>
                                        </div>
                                    )}

                                    {/* TOTAL COSTO MENSUAL */}
                                    <div className="bg-green-100 rounded-lg p-3 mt-2">
                                        <div className="flex justify-between items-center">
                                            <span className="font-bold text-green-900">📅 TOTAL COSTO MENSUAL:</span>
                                            <span className="text-xl font-bold text-green-900">{formatMoneyLocal(data.costoMensualTotal)}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        
                        {/* PROMOCIÓN DESTACADA */}
                        {data.tienePromocion && (
                            <div className="bg-purple-50 rounded-lg border border-purple-200 p-3">
                                <div className="flex items-center gap-2 text-purple-800">
                                    <Gift className="h-4 w-4" />
                                    <span className="font-medium">Promoción aplicada:</span>
                                    <span>{presupuesto.promocion?.nombre}</span>
                                </div>
                            </div>
                        )}
                    </div>
                </DataCard>
            </div>
        </AppLayout>
    );
}