// resources/js/Pages/Comercial/Contratos/Show.tsx

import { Head, router } from '@inertiajs/react';
import { ArrowLeft, FileText, Calendar, User, Building, Truck, CreditCard, Download, ChevronDown, ChevronUp } from 'lucide-react';
import React, { useState } from 'react';

import { Amount } from '@/components/ui/Amount';
import { DataCard } from '@/components/ui/DataCard';
import { InfoRow } from '@/components/ui/InfoRow';
import { SensitiveData } from '@/components/ui/SensitiveData';
import { StatusBadge } from '@/components/ui/StatusBadge';
import AppLayout from '@/layouts/app-layout';
import { formatDate } from '@/utils/formatters';

interface Props {
    contrato: any;
}

export default function ContratoShow({ contrato }: Props) {
    const [showMobileDetails, setShowMobileDetails] = useState<Record<string, boolean>>({
        cliente: false,
        empresa: false,
        responsables: false,
        vehiculos: false
    });

    const getEstadoColor = (estadoId?: number) => {
        switch(estadoId) {
            case 1: return 'green'; // activo
            case 2: return 'yellow'; // vencido
            case 3: return 'blue'; // aprobado
            case 4: return 'red'; // rechazado
            case 5: return 'orange'; // pendiente
            case 6: return 'purple'; // instalado
            default: return 'gray';
        }
    };

    const handleDescargarPDF = () => {
        window.open(`/comercial/contratos/${contrato.id}/pdf?download=1`, '_blank');
    };

    const handleVerPDF = () => {
        window.open(`/comercial/contratos/${contrato.id}/pdf`, '_blank');
    };

    const toggleMobileSection = (section: string) => {
        setShowMobileDetails(prev => ({
            ...prev,
            [section]: !prev[section]
        }));
    };

    return (
        <AppLayout title={`Contrato #${contrato.numero_contrato}`}>
            <Head title={`Contrato #${contrato.numero_contrato}`} />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                {/* Header */}
                <div className="mb-4 sm:mb-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.visit('/comercial/contratos')}
                            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                Contrato #{contrato.numero_contrato}
                            </h1>
                            <StatusBadge 
                                status={contrato.estado?.nombre || 'Sin estado'} 
                                color={getEstadoColor(contrato.estado_id)}
                            />
                        </div>
                    </div>
                    
                    <div className="flex flex-col sm:flex-row gap-2">
                        <button
                            onClick={handleVerPDF}
                            className="px-3 sm:px-4 py-2 bg-blue-600 text-white text-sm sm:text-base rounded-md hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <FileText className="h-4 w-4" />
                            <span className="sm:inline">Ver PDF</span>
                        </button>
                        <button
                            onClick={handleDescargarPDF}
                            className="px-3 sm:px-4 py-2 bg-green-600 text-white text-sm sm:text-base rounded-md hover:bg-green-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Download className="h-4 w-4" />
                            <span className="sm:inline">Descargar PDF</span>
                        </button>
                    </div>
                </div>

                {/* Información General - Mobile */}
                <div className="block lg:hidden mb-4">
                    <DataCard title="Información del Contrato" icon={<FileText className="h-5 w-5" />}>
                        <div className="space-y-3">
                            <InfoRow label="Fecha emisión" value={formatDate(contrato.fecha_emision)} />
                            <InfoRow label="Referencia" value={contrato.presupuesto_referencia} />
                            <InfoRow label="Vehículos" value={`${contrato.presupuesto_cantidad_vehiculos} unidad(es)`} />
                            <InfoRow label="Vendedor" value={contrato.vendedor_nombre || 'No asignado'} />
                        </div>
                    </DataCard>
                </div>

                {/* Información General - Desktop */}
                <div className="hidden lg:grid lg:grid-cols-3 gap-6 mb-6">
                    <DataCard title="Información del Contrato" icon={<FileText className="h-5 w-5" />}>
                        <div className="space-y-3">
                            <InfoRow label="Fecha emisión" value={formatDate(contrato.fecha_emision)} />
                            <InfoRow label="Referencia" value={contrato.presupuesto_referencia} />
                            <InfoRow label="Vehículos" value={`${contrato.presupuesto_cantidad_vehiculos} unidad(es)`} />
                            <InfoRow label="Vendedor" value={contrato.vendedor_nombre || 'No asignado'} />
                        </div>
                    </DataCard>

                    <DataCard title="Cliente" icon={<User className="h-5 w-5" />}>
                        <div className="space-y-3">
                            <InfoRow label="Nombre" value={contrato.cliente_nombre_completo} />
                            <InfoRow label="Email" value={contrato.cliente_email || '-'} />
                            <InfoRow label="Teléfono" value={contrato.cliente_telefono || '-'} />
                            <InfoRow label="Localidad" value={`${contrato.cliente_localidad || ''} ${contrato.cliente_provincia ? `, ${contrato.cliente_provincia}` : ''}`} />
                        </div>
                    </DataCard>

                    <DataCard title="Empresa" icon={<Building className="h-5 w-5" />}>
                        <div className="space-y-3">
                            <InfoRow label="Razón social" value={contrato.empresa_razon_social} />
                            <InfoRow label="CUIT" value={contrato.empresa_cuit} />
                            <InfoRow label="Actividad" value={contrato.empresa_actividad || '-'} />
                            <InfoRow label="Flota" value={contrato.empresa_nombre_flota || '-'} />
                        </div>
                    </DataCard>
                </div>

                {/* Cliente y Empresa - Mobile Accordion */}
                <div className="lg:hidden space-y-4 mb-4">
                    {/* Cliente Mobile */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleMobileSection('cliente')}
                            className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between text-left"
                        >
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-gray-600" />
                                <span className="font-medium text-gray-900">Cliente</span>
                            </div>
                            {showMobileDetails.cliente ? (
                                <ChevronUp className="h-5 w-5 text-gray-500" />
                            ) : (
                                <ChevronDown className="h-5 w-5 text-gray-500" />
                            )}
                        </button>
                        {showMobileDetails.cliente && (
                            <div className="p-4 bg-white space-y-3">
                                <InfoRow label="Nombre" value={contrato.cliente_nombre_completo} />
                                <InfoRow label="Email" value={contrato.cliente_email || '-'} />
                                <InfoRow label="Teléfono" value={contrato.cliente_telefono || '-'} />
                                <InfoRow label="Localidad" value={`${contrato.cliente_localidad || ''} ${contrato.cliente_provincia ? `, ${contrato.cliente_provincia}` : ''}`} />
                            </div>
                        )}
                    </div>

                    {/* Empresa Mobile */}
                    <div className="border border-gray-200 rounded-lg overflow-hidden">
                        <button
                            onClick={() => toggleMobileSection('empresa')}
                            className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between text-left"
                        >
                            <div className="flex items-center gap-2">
                                <Building className="h-5 w-5 text-gray-600" />
                                <span className="font-medium text-gray-900">Empresa</span>
                            </div>
                            {showMobileDetails.empresa ? (
                                <ChevronUp className="h-5 w-5 text-gray-500" />
                            ) : (
                                <ChevronDown className="h-5 w-5 text-gray-500" />
                            )}
                        </button>
                        {showMobileDetails.empresa && (
                            <div className="p-4 bg-white space-y-3">
                                <InfoRow label="Razón social" value={contrato.empresa_razon_social} />
                                <InfoRow label="CUIT" value={contrato.empresa_cuit} />
                                <InfoRow label="Actividad" value={contrato.empresa_actividad || '-'} />
                                <InfoRow label="Flota" value={contrato.empresa_nombre_flota || '-'} />
                            </div>
                        )}
                    </div>
                </div>

                {/* Totales - Responsive */}
                <DataCard title="Resumen Económico" className="mb-4 sm:mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-6">
                        <div className="bg-blue-50 p-3 sm:p-4 rounded-lg border border-blue-200">
                            <p className="text-xs sm:text-sm text-blue-600 mb-1">Inversión Inicial</p>
                            <Amount value={contrato.presupuesto_total_inversion} className="text-base sm:text-lg lg:text-xl font-bold text-blue-700" />
                        </div>
                        <div className="bg-green-50 p-3 sm:p-4 rounded-lg border border-green-200">
                            <p className="text-xs sm:text-sm text-green-600 mb-1">Costo Mensual</p>
                            <Amount value={contrato.presupuesto_total_mensual} className="text-base sm:text-lg lg:text-xl font-bold text-green-700" />
                        </div>
                        <div className="bg-orange-50 p-3 sm:p-4 rounded-lg border border-orange-200 sm:col-span-2 lg:col-span-1">
                            <p className="text-xs sm:text-sm text-orange-600 mb-1">Total Primer Mes</p>
                            <Amount value={Number(contrato.presupuesto_total_inversion) + Number(contrato.presupuesto_total_mensual)} className="text-base sm:text-lg lg:text-xl font-bold text-orange-700" />
                        </div>
                    </div>
                </DataCard>

                {/* Responsables - Mobile Accordion */}
                {(contrato.responsable_flota_nombre || contrato.responsable_pagos_nombre) && (
                    <div className="lg:hidden mb-4">
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <button
                                onClick={() => toggleMobileSection('responsables')}
                                className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between text-left"
                            >
                                <span className="font-medium text-gray-900">Responsables</span>
                                {showMobileDetails.responsables ? (
                                    <ChevronUp className="h-5 w-5 text-gray-500" />
                                ) : (
                                    <ChevronDown className="h-5 w-5 text-gray-500" />
                                )}
                            </button>
                            {showMobileDetails.responsables && (
                                <div className="p-4 bg-white space-y-4">
                                    {contrato.responsable_flota_nombre && (
                                        <div className="border border-gray-200 rounded-lg p-3">
                                            <h4 className="font-medium text-gray-900 mb-2 text-sm">🚛 Responsable de Flota</h4>
                                            <p className="text-sm">{contrato.responsable_flota_nombre}</p>
                                            {contrato.responsable_flota_telefono && (
                                                <p className="text-xs text-gray-600 mt-1">📞 {contrato.responsable_flota_telefono}</p>
                                            )}
                                            {contrato.responsable_flota_email && (
                                                <p className="text-xs text-gray-600">✉️ {contrato.responsable_flota_email}</p>
                                            )}
                                        </div>
                                    )}
                                    {contrato.responsable_pagos_nombre && (
                                        <div className="border border-gray-200 rounded-lg p-3">
                                            <h4 className="font-medium text-gray-900 mb-2 text-sm">💰 Responsable de Pagos</h4>
                                            <p className="text-sm">{contrato.responsable_pagos_nombre}</p>
                                            {contrato.responsable_pagos_telefono && (
                                                <p className="text-xs text-gray-600 mt-1">📞 {contrato.responsable_pagos_telefono}</p>
                                            )}
                                            {contrato.responsable_pagos_email && (
                                                <p className="text-xs text-gray-600">✉️ {contrato.responsable_pagos_email}</p>
                                            )}
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Responsables - Desktop */}
                {(contrato.responsable_flota_nombre || contrato.responsable_pagos_nombre) && (
                    <DataCard title="Responsables" className="hidden lg:block mb-6">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {contrato.responsable_flota_nombre && (
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-2">🚛 Responsable de Flota</h4>
                                    <p className="text-sm">{contrato.responsable_flota_nombre}</p>
                                    {contrato.responsable_flota_telefono && (
                                        <p className="text-sm text-gray-600 mt-1">📞 {contrato.responsable_flota_telefono}</p>
                                    )}
                                    {contrato.responsable_flota_email && (
                                        <p className="text-sm text-gray-600">✉️ {contrato.responsable_flota_email}</p>
                                    )}
                                </div>
                            )}
                            {contrato.responsable_pagos_nombre && (
                                <div className="border border-gray-200 rounded-lg p-4">
                                    <h4 className="font-medium text-gray-900 mb-2">💰 Responsable de Pagos</h4>
                                    <p className="text-sm">{contrato.responsable_pagos_nombre}</p>
                                    {contrato.responsable_pagos_telefono && (
                                        <p className="text-sm text-gray-600 mt-1">📞 {contrato.responsable_pagos_telefono}</p>
                                    )}
                                    {contrato.responsable_pagos_email && (
                                        <p className="text-sm text-gray-600">✉️ {contrato.responsable_pagos_email}</p>
                                    )}
                                </div>
                            )}
                        </div>
                    </DataCard>
                )}

                {/* Método de Pago - Responsive */}
                {contrato.debito_cbu && (
                    <DataCard title="Débito por CBU" icon={<CreditCard className="h-5 w-5" />} className="mb-4 sm:mb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <InfoRow label="Banco" value={contrato.debito_cbu.nombre_banco} />
                            <InfoRow label="Tipo cuenta" value={contrato.debito_cbu.tipo_cuenta === 'caja_ahorro' ? 'Caja de ahorro' : 'Cuenta corriente'} />
                            <InfoRow 
                                label="CBU" 
                                value={
                                    <SensitiveData 
                                        value={contrato.debito_cbu.cbu} 
                                        maskLength={22}
                                        contratoId={contrato.id}
                                        tipoDato="cbu"
                                    />
                                } 
                            />
                            <InfoRow label="Alias" value={contrato.debito_cbu.alias_cbu || '-'} />
                            <InfoRow label="Titular" value={contrato.debito_cbu.titular_cuenta} className="sm:col-span-2" />
                        </div>
                    </DataCard>
                )}

                {contrato.debito_tarjeta && (
                    <DataCard title="Débito por Tarjeta" icon={<CreditCard className="h-5 w-5" />} className="mb-4 sm:mb-6">
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                            <InfoRow label="Banco" value={contrato.debito_tarjeta.tarjeta_banco} />
                            <InfoRow label="Emisor" value={contrato.debito_tarjeta.tarjeta_emisor} />
                            <InfoRow label="Tipo" value={contrato.debito_tarjeta.tipo_tarjeta === 'debito' ? 'Débito' : 'Crédito'} />
                            <InfoRow 
                                label="Número" 
                                value={
                                    <SensitiveData 
                                        value={contrato.debito_tarjeta.tarjeta_numero} 
                                        maskLength={16}
                                        contratoId={contrato.id}
                                        tipoDato="tarjeta_numero"
                                    />
                                } 
                            />
                            <InfoRow 
                                label="Vencimiento" 
                                value={
                                    <SensitiveData 
                                        value={contrato.debito_tarjeta.tarjeta_expiracion} 
                                        maskLength={5}
                                        contratoId={contrato.id}
                                        tipoDato="tarjeta_vencimiento"
                                    />
                                } 
                            />
                            <InfoRow 
                                label="CVV" 
                                value={
                                    <SensitiveData 
                                        value={contrato.debito_tarjeta.tarjeta_codigo} 
                                        maskLength={3}
                                        contratoId={contrato.id}
                                        tipoDato="tarjeta_codigo"
                                    />
                                } 
                            />
                            <InfoRow label="Titular" value={contrato.debito_tarjeta.titular_tarjeta} className="sm:col-span-2" />
                        </div>
                    </DataCard>
                )}

                {/* Vehículos - Mobile Accordion */}
                {contrato.vehiculos?.length > 0 && (
                    <div className="lg:hidden mb-4">
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <button
                                onClick={() => toggleMobileSection('vehiculos')}
                                className="w-full px-4 py-3 bg-gray-50 flex items-center justify-between text-left"
                            >
                                <div className="flex items-center gap-2">
                                    <Truck className="h-5 w-5 text-gray-600" />
                                    <span className="font-medium text-gray-900">Vehículos ({contrato.vehiculos.length})</span>
                                </div>
                                {showMobileDetails.vehiculos ? (
                                    <ChevronUp className="h-5 w-5 text-gray-500" />
                                ) : (
                                    <ChevronDown className="h-5 w-5 text-gray-500" />
                                )}
                            </button>
                            {showMobileDetails.vehiculos && (
                                <div className="p-4 bg-white space-y-4">
                                    {contrato.vehiculos.map((vehiculo: any) => (
                                        <div key={vehiculo.id} className="border border-gray-200 rounded-lg p-3">
                                            <div className="flex items-center gap-2 mb-2">
                                                <Truck className="h-4 w-4 text-gray-500" />
                                                <span className="font-medium text-gray-900">{vehiculo.patente}</span>
                                            </div>
                                            <div className="grid grid-cols-2 gap-2 text-sm">
                                                <div>
                                                    <p className="text-xs text-gray-500">Marca</p>
                                                    <p className="text-gray-900">{vehiculo.marca || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Modelo</p>
                                                    <p className="text-gray-900">{vehiculo.modelo || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Año</p>
                                                    <p className="text-gray-900">{vehiculo.anio || '-'}</p>
                                                </div>
                                                <div>
                                                    <p className="text-xs text-gray-500">Color</p>
                                                    <p className="text-gray-900">{vehiculo.color || '-'}</p>
                                                </div>
                                                {vehiculo.identificador && (
                                                    <div className="col-span-2">
                                                        <p className="text-xs text-gray-500">Identificador</p>
                                                        <p className="text-gray-900">{vehiculo.identificador}</p>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                )}

                {/* Vehículos - Desktop */}
                {contrato.vehiculos?.length > 0 && (
                    <DataCard title="Vehículos" icon={<Truck className="h-5 w-5" />} className="hidden lg:block">
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Patente</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Marca</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Modelo</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Año</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Color</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Identificador</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {contrato.vehiculos.map((vehiculo: any) => (
                                        <tr key={vehiculo.id}>
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">{vehiculo.patente}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{vehiculo.marca || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{vehiculo.modelo || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{vehiculo.anio || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{vehiculo.color || '-'}</td>
                                            <td className="px-4 py-3 text-sm text-gray-700">{vehiculo.identificador || '-'}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </DataCard>
                )}
            </div>
        </AppLayout>
    );
}