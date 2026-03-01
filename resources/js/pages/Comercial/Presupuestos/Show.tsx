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
import { formatDate, toNumber } from '@/utils/formatters';


interface Props {
    presupuesto: any;
}

export default function PresupuestosShow({ presupuesto }: Props) {
    const data = usePresupuestoData(presupuesto);

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

    const formatMoney = (value: any): string => {
        const num = toNumber(value);
        return '$ ' + num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    const formatPorcentaje = (value: any): string => {
        const num = toNumber(value);
        return Math.round(num).toString() + '%';
    };

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
                                        <span>{presupuesto.cantidad_vehiculos}</span>
                                    </div>
                                } 
                            />
                            <InfoRow label="Comercial" value={data.nombreComercial} />
                        </div>
                    </ResponsiveGrid>
                </DataCard>

                {/* DETALLE DE INVERSIÓN */}
                <DataCard title="Detalle de Inversión">
                    <div className="bg-gray-50 p-4 rounded-lg border">
                        <div className="space-y-3 text-sm">
                            {/* TASA */}
                            {presupuesto.tasa && (
                                <div className="border-b border-gray-200 pb-2">
                                    <div className="flex justify-between font-medium text-gray-700 mb-1">
                                        <span>{presupuesto.tasa.nombre}:</span>
                                        <span>{formatMoney(toNumber(presupuesto.valor_tasa) * presupuesto.cantidad_vehiculos)}</span>
                                    </div>
                                    
                                    {data.tienePromocion && data.tienePromocionProducto(presupuesto.tasa?.id) ? (
                                        <div className="mt-1 pl-2">
                                            <div className="flex justify-between text-green-700 text-xs font-medium">
                                                <span>Descuento: {data.getTextoBonificacion(presupuesto.tasa?.id, presupuesto.tasa_bonificacion)}</span>
                                                <span>- {formatMoney((toNumber(presupuesto.valor_tasa) * presupuesto.cantidad_vehiculos) - data.subtotalTasa)}</span>
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
                                                <span>- {formatMoney((toNumber(presupuesto.valor_tasa) * presupuesto.cantidad_vehiculos) - data.subtotalTasa)}</span>
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
                                <div className="border-b border-gray-200 pb-2">
                                    <div className="flex justify-between font-medium text-gray-700 mb-1">
                                        <span>{presupuesto.abono.nombre}:</span>
                                        <span>{formatMoney(toNumber(presupuesto.valor_abono) * presupuesto.cantidad_vehiculos)}</span>
                                    </div>
                                    
                                    {data.tienePromocion && data.tienePromocionProducto(presupuesto.abono?.id) ? (
                                        <div className="mt-1 pl-2">
                                            <div className="flex justify-between text-green-700 text-xs font-medium">
                                                <span>Descuento: {data.getTextoBonificacion(presupuesto.abono?.id, presupuesto.abono_bonificacion)}</span>
                                                <span>- {formatMoney((toNumber(presupuesto.valor_abono) * presupuesto.cantidad_vehiculos) - data.subtotalAbono)}</span>
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
                                                <span>- {formatMoney((toNumber(presupuesto.valor_abono) * presupuesto.cantidad_vehiculos) - data.subtotalAbono)}</span>
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
                                <div className="border-b border-gray-200 pb-2">
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
                                <div className="border-b border-gray-200 pb-2">
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
                                                <div className="flex justify-between text-xs font-bold mt-1">
                                                    <span>Subtotal:</span>
                                                    <span className="text-local">{formatMoney(item.subtotal)}</span>
                                                </div>
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
                                    * Costo mensual desde el 2° mes: <Amount value={data.costoMensualTotal} />
                                </p>
                            </div>
                        </div>
                    </div>
                </DataCard>

                {/* Resumen Simplificado */}
                <DataCard title="Resumen de Inversión">
                    <div className="flex justify-end">
                        <div className="w-full sm:w-96">
                            <div className="space-y-3">
                                {data.tienePromocion && (
                                    <div className="mb-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                                        <div className="flex items-center gap-2 text-purple-800">
                                            <Gift className="h-4 w-4" />
                                            <span className="font-medium">Promoción aplicada:</span>
                                            <span>{presupuesto.promocion?.nombre}</span>
                                        </div>
                                    </div>
                                )}
                                
                                <InfoRow label="Inversión Inicial:" value={<Amount value={data.inversionInicial} className="font-bold text-local" />} />
                                <InfoRow label="Costo Mensual:" value={<Amount value={data.costoMensualTotal} className="font-bold text-local" />} />
                                <div className="border-t border-gray-200 pt-3 mt-2">
                                    <div className="flex justify-between items-center">
                                        <span className="text-base sm:text-lg font-bold text-gray-900">TOTAL PRIMER MES:</span>
                                        <Amount value={data.totalPrimerMes} className="text-lg sm:text-xl font-bold text-local" />
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </DataCard>
            </div>
        </AppLayout>
    );
}