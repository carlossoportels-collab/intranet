// resources/js/Pages/Comercial/Presupuestos/Create.tsx
import { Link } from '@inertiajs/react';
import { 
    User, 
    Settings, 
    Gift, 
    CreditCard, 
    Package, 
    Wrench,
    Calculator,
    Truck
} from 'lucide-react';
import React from 'react';

import AbonoSelector from '@/components/presupuestos/AbonoSelector';
import AccesoriosList from '@/components/presupuestos/AccesoriosList';
import CalculosPresupuesto from '@/components/presupuestos/CalculosPresupuesto';
import PromocionSelector from '@/components/presupuestos/PromocionSelector';
import ServiciosList from '@/components/presupuestos/ServiciosList';
import TasaSelector from '@/components/presupuestos/TasaSelector';
import FormField from '@/components/ui/formField';
import ResponsiveCard from '@/components/ui/ResponsiveCard';
import ResponsiveGrid from '@/components/ui/responsiveGrid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs } from '@/components/ui/Tabs';
import { usePresupuestoForm } from '@/hooks/usePresupuestoForm';
import AppLayout from '@/layouts/app-layout';
import { PresupuestosCreateProps } from '@/types/presupuestos';

export default function PresupuestosCreate({ 
    lead,
    usuario,
    comerciales = [],
    prefijos = [],
    promociones = [],
    tasas = [],
    abonos = [],
    convenios = [],
    accesorios = [],
    servicios = [],
    metodosPago = []
}: PresupuestosCreateProps) {
    
    const {
        state,
        valores,
        subtotales,
        esComercial,
        cantidadMinimaPromo,
        productosPromocionIds,
        accesoriosConPromocion,
        serviciosConPromocion,
        accesoriosNormales,
        serviciosNormales,
        tasaPromocion,
        abonoPromocion,
        updateField,
        aplicarPromocion,
        isFieldDisabled,
        setAccesoriosAgregados,
        setServiciosAgregados,
        handleSubmit,
        getError
    } = usePresupuestoForm({
        usuario,
        lead,
        prefijos,
        tasas,
        abonos,
        convenios,
        metodosPago,
        leadId: lead.id,
        promociones
    });

    // Definir los tabs (sin resumen)
    const tabItems = [
{
    id: 'tasa',
    label: 'Tasa Instalación',
    icon: <Truck className="h-4 w-4" />,
    content: (
        <div className="space-y-4">
            <TasaSelector
                value={state.tasaId}
                onChange={(tasaId) => updateField('tasaId', tasaId)}
                error={getError('tasa_id')}
                disabled={isFieldDisabled('tasaId')}
                tasas={tasas}
            />
            
            <ResponsiveGrid cols={{ default: 1, md: 2 }} gap={4}>
                <FormField label="Bonificación (%)">
                    <input
                        type="number"
                        min="0"
                        max="100"
                        step="0.01"
                        value={state.tasaBonificacion}
                        onChange={(e) => updateField('tasaBonificacion', Number(e.target.value))}
                        disabled={isFieldDisabled('tasaBonificacion')}
                        className="block w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-local focus:ring-2 focus:ring-local/20 text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                    />
                </FormField>

                <FormField label="Método de Pago">
                    <Select
                        value={state.tasaMetodoPagoId.toString()}
                        onValueChange={(value) => updateField('tasaMetodoPagoId', Number(value))}
                    >
                        <SelectTrigger className="bg-white border-2 border-gray-200 hover:border-local focus:border-local focus:ring-2 focus:ring-local/20 h-11">
                            <SelectValue placeholder="Seleccionar método" />
                        </SelectTrigger>
                        <SelectContent className="bg-white max-h-60">
                            {metodosPago.length === 0 ? (
                                <SelectItem value="0" disabled>
                                    No hay métodos de pago
                                </SelectItem>
                            ) : (
                                metodosPago.map(metodo => (
                                    <SelectItem key={metodo.id} value={metodo.id.toString()}>
                                        {metodo.nombre}
                                    </SelectItem>
                                ))
                            )}
                        </SelectContent>
                    </Select>
                </FormField>
            </ResponsiveGrid>
        </div>
    )
},
        {
            id: 'abono',
            label: 'Abono Mensual',
            icon: <CreditCard className="h-4 w-4" />,
            content: (
                <div className="space-y-4">
                    <AbonoSelector
                        value={state.abonoId}
                        onChange={(productoId, tipo) => updateField('abonoId', productoId)}
                        error={getError('abono_id')}
                        disabled={isFieldDisabled('abonoId')}
                    />
                    
                    <ResponsiveGrid cols={{ default: 1, md: 2 }}>
                        <FormField label="Bonificación (%)">
                            <input
                                type="number"
                                min="0"
                                max="100"
                                step="0.01"
                                value={state.abonoBonificacion}
                                onChange={(e) => {
                                    updateField('bonificacionManual', true);
                                    updateField('abonoBonificacion', Number(e.target.value));
                                }}
                                disabled={isFieldDisabled('abonoBonificacion')}
                                 className="block w-full px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-local focus:ring-2 focus:ring-local/20 text-sm bg-white disabled:bg-gray-100 disabled:cursor-not-allowed transition-all"
                            />
                        </FormField>

                        <FormField label="Método de Pago">
                            <Select
                                value={state.abonoMetodoPagoId.toString()}
                                onValueChange={(value) => updateField('abonoMetodoPagoId', Number(value))}
                            >
                                <SelectTrigger className="bg-white">
                                    <SelectValue placeholder="Seleccionar método" />
                                </SelectTrigger>
                                <SelectContent className="bg-white max-h-60">
                                    {metodosPago.map(metodo => (
                                        <SelectItem key={metodo.id} value={metodo.id.toString()}>
                                            {metodo.nombre}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </FormField>
                    </ResponsiveGrid>
                </div>
            )
        },
        {
            id: 'servicios',
            label: 'Servicios',
            icon: <Wrench className="h-4 w-4" />,
            content: (
                <ServiciosList
                    key="servicios-list"
                    servicios={servicios}
                    items={state.serviciosAgregados}
                    cantidadVehiculos={state.cantidadVehiculos}
                    onChange={setServiciosAgregados}
                />
            )
        },
        {
            id: 'accesorios',
            label: 'Accesorios',
            icon: <Package className="h-4 w-4" />,
            content: (
                <AccesoriosList
                    key="accesorios-list"
                    accesorios={accesorios}
                    items={state.accesoriosAgregados}
                    cantidadVehiculos={state.cantidadVehiculos}
                    onChange={setAccesoriosAgregados}
                />
            )
        }
    ];

    return (
        <AppLayout title="Crear Presupuesto">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
                <div className="mb-4 sm:mb-6">
                    <h1 className="text-xl sm:text-3xl font-bold text-gray-900">
                        Crear Presupuesto
                    </h1>
                    <p className="mt-1 text-sm sm:text-base text-gray-600">
                        Complete los datos para generar un nuevo presupuesto
                    </p>
                </div>
                
                <form onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                    {/* GRID PRINCIPAL: 2 columnas en desktop, 1 en mobile */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
                        {/* Columna izquierda - 2/3 del espacio */}
                        <div className="lg:col-span-2 space-y-4 sm:space-y-6">
                            {/* Fila 1: Cliente + Comercial (en grid 2 columnas) */}
                            <ResponsiveGrid cols={{ default: 1, md: 2 }} gap={4}>
                                {/* Card Cliente */}
                                <ResponsiveCard 
                                    title="Información del Cliente"
                                    icon={<User className="h-4 w-4 sm:h-5 sm:w-5" />}
                                >
                                    <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                                        <p className="font-medium text-sm sm:text-base text-blue-800 break-words">
                                            {lead.nombre_completo}
                                        </p>
                                        <p className="text-xs sm:text-sm text-blue-600 mt-1 break-words">
                                            {lead.email} {lead.telefono && ` | ${lead.telefono}`}
                                        </p>
                                        {lead.prefijo && (
                                            <p className="text-xs text-blue-500 mt-1">
                                                Prefijo asignado: {lead.prefijo.codigo} - {lead.prefijo.descripcion}
                                            </p>
                                        )}
                                    </div>
                                </ResponsiveCard>

                                {/* Card Comercial */}
                                <ResponsiveCard 
                                    title="Comercial Asignado"
                                    icon={<User className="h-4 w-4 sm:h-5 sm:w-5" />}
                                >
                                    {esComercial ? (
                                        <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                                            <div className="flex items-center gap-2 sm:gap-3">
                                                <User className="h-4 w-4 sm:h-5 sm:w-5 text-green-600 flex-shrink-0" />
                                                <div className="min-w-0">
                                                    <h3 className="font-medium text-sm sm:text-base text-green-900">
                                                        Usted será el comercial asignado
                                                    </h3>
                                                    <p className="text-xs sm:text-sm text-green-700 mt-1 truncate">
                                                        {usuario.nombre_completo}
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    ) : (
                                        <FormField 
                                            label="Comercial a asignar" 
                                            required 
                                            error={getError('prefijo_id')}
                                            htmlFor="prefijo_id"
                                        >
                                            <Select
                                                value={state.prefijoId.toString()}
                                                onValueChange={(value) => updateField('prefijoId', Number(value))}
                                            >
                                                <SelectTrigger id="prefijo_id" className="bg-white w-full">
                                                    <SelectValue placeholder="Seleccionar comercial" />
                                                </SelectTrigger>
                                                <SelectContent className="bg-white max-h-60">
                                                    {comerciales.length > 0 ? (
                                                        comerciales.map(comercial => (
                                                            <SelectItem 
                                                                key={comercial.prefijo_id} 
                                                                value={comercial.prefijo_id.toString()}
                                                            >
                                                                <span className="truncate">
                                                                    {comercial.nombre} 
                                                                    {lead.prefijo_id === comercial.prefijo_id && ' (Asignado)'}
                                                                </span>
                                                            </SelectItem>
                                                        ))
                                                    ) : (
                                                        <SelectItem value="0" disabled>
                                                            No hay comerciales disponibles
                                                        </SelectItem>
                                                    )}
                                                </SelectContent>
                                            </Select>
                                            {lead.prefijo_id && (
                                                <p className="text-xs text-green-600 mt-1">
                                                    ✓ Este lead tiene un comercial asignado
                                                </p>
                                            )}
                                        </FormField>
                                    )}
                                </ResponsiveCard>
                            </ResponsiveGrid>

                            {/* Fila 2: Promoción + Configuración General */}
                            <ResponsiveGrid cols={{ default: 1, md: 2 }} gap={4}>
                                {/* Promoción Card - Solo si hay promociones */}
                                {promociones.length > 0 && (
                                    <ResponsiveCard 
                                        title="Promoción"
                                        icon={<Gift className="h-4 w-4 sm:h-5 sm:w-5" />}
                                    >
                                        <PromocionSelector
                                            value={state.promocionId}
                                            onChange={(id) => {
                                                updateField('promocionId', id);
                                                aplicarPromocion(id);
                                            }}
                                            promociones={promociones}
                                        />
                                    </ResponsiveCard>
                                )}

                                {/* Configuración General Card */}
                                <ResponsiveCard 
                                    title="Configuración General"
                                    icon={<Settings className="h-4 w-4 sm:h-5 sm:w-5" />}
                                >
                                    <ResponsiveGrid cols={{ default: 1, sm: 2 }} gap={3}>
                                        <FormField 
                                            label="Cantidad de Vehículos" 
                                            error={getError('cantidad_vehiculos')}
                                        >
                                            <input
                                                type="number"
                                                min={cantidadMinimaPromo}
                                                value={state.cantidadVehiculos}
                                                onChange={(e) => updateField('cantidadVehiculos', Number(e.target.value))}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white"
                                            />
                                            {state.promocionId && (
                                                <p className="text-xs text-blue-600 mt-1">
                                                    Mínimo: {cantidadMinimaPromo} vehículo(s)
                                                </p>
                                            )}
                                        </FormField>

                                        <FormField 
                                            label="Validez (días)" 
                                            error={getError('validez')}
                                        >
                                            <input
                                                type="number"
                                                min="1"
                                                value={state.diasValidez}
                                                onChange={(e) => updateField('diasValidez', e.target.value)}
                                                className="block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm bg-white"
                                            />
                                        </FormField>
                                    </ResponsiveGrid>
                                </ResponsiveCard>
                            </ResponsiveGrid>

                            {/* Tabs para el resto del contenido */}
                            <ResponsiveCard title="Detalles del Presupuesto">
                                <Tabs items={tabItems} defaultTab="tasa" />
                            </ResponsiveCard>
                        </div>

                        {/* Columna derecha - 1/3 del espacio - RESUMEN SIEMPRE VISIBLE */}
                        <div className="lg:col-span-1">
                            <div className="sticky top-4">
                                <ResponsiveCard 
                                    title="Resumen del Presupuesto"
                                    icon={<Calculator className="h-5 w-5 sm:h-6 sm:w-6 text-local" />}
                                    titleClassName="text-local font-bold"
                                >
                                    <CalculosPresupuesto
                                        cantidadVehiculos={state.cantidadVehiculos}
                                        valorTasa={valores.valorTasa}
                                        tasaBonificacion={state.tasaBonificacion}
                                        valorAbono={valores.valorAbono}
                                        abonoBonificacion={state.abonoBonificacion}
                                        subtotalAgregados={subtotales.accesorios + subtotales.servicios}
                                        tasaPromocion={tasaPromocion}
                                        abonoPromocion={abonoPromocion}
                                        accesoriosConPromocion={accesoriosConPromocion}
                                        serviciosConPromocion={serviciosConPromocion}
                                        accesoriosNormales={accesoriosNormales}
                                        serviciosNormales={serviciosNormales}
                                    />
                                </ResponsiveCard>
                            </div>
                        </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                        <Link
                            href={`/comercial/leads/${lead.id}`}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 text-center w-full sm:w-auto"
                        >
                            Cancelar
                        </Link>
                        <button
                            type="submit"
                            disabled={state.loading}
                            className="px-4 py-2 bg-local text-white text-sm rounded hover:bg-local-600 transition-colors disabled:opacity-50 w-full sm:w-auto"
                        >
                            {state.loading ? (
                                <span className="flex items-center justify-center gap-2">
                                    <span className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                                    Guardando...
                                </span>
                            ) : 'Crear Presupuesto'}
                        </button>
                    </div>
                </form>
            </div>
        </AppLayout>
    );
}