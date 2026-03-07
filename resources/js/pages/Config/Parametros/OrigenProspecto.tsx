// resources/js/Pages/Config/Parametros/OrigenProspecto.tsx
import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { PageProps } from '@/types';

interface OrigenProspecto {
    id: number;
    nombre: string;
    descripcion?: string;
    color?: string;
    icono?: string;
    efectividad: number;
    activo: boolean;
    total_leads: number;
    clientes_convertidos: number;
}

interface ResumenGlobal {
    total_origenes: number;
    total_leads_con_origen: number;
    total_leads_sin_origen: number;
    efectividad_global: number;
    clientes_convertidos: number;
}

interface Props extends PageProps {
    origenesProspecto?: OrigenProspecto[];
    resumenGlobal?: ResumenGlobal;
}

export default function OrigenProspecto({ 
    origenesProspecto = [], 
    resumenGlobal = {
        total_origenes: 0,
        total_leads_con_origen: 0,
        total_leads_sin_origen: 0,
        efectividad_global: 0,
        clientes_convertidos: 0
    }
}: Props) {
    
    const getEfectividadColor = (efectividad: number) => {
        if (efectividad > 70) return 'bg-green-500';
        if (efectividad > 50) return 'bg-yellow-500';
        if (efectividad > 30) return 'bg-orange-500';
        return 'bg-red-500';
    };

    const getEfectividadBgClass = (efectividad: number) => {
        if (efectividad > 70) return 'bg-green-100 text-green-800';
        if (efectividad > 50) return 'bg-yellow-100 text-yellow-800';
        if (efectividad > 30) return 'bg-orange-100 text-orange-800';
        return 'bg-red-100 text-red-800';
    };

    return (
        <AppLayout title="Origen de Prospectos">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Origen de Prospectos
                </h1>
                <p className="mt-1 text-sm md:text-base text-gray-600">
                    Análisis de fuentes de prospección y su efectividad
                </p>
            </div>

            {/* Stats Cards - Responsive grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
                    <div className="text-xs md:text-sm font-medium text-gray-600">Orígenes con leads</div>
                    <div className="text-xl md:text-2xl font-bold text-gray-900">{resumenGlobal.total_origenes}</div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
                    <div className="text-xs md:text-sm font-medium text-gray-600">Leads con origen</div>
                    <div className="text-xl md:text-2xl font-bold text-blue-600">{resumenGlobal.total_leads_con_origen}</div>
                    <div className="text-xs text-gray-500 mt-1">
                        {resumenGlobal.total_leads_sin_origen} sin origen
                    </div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
                    <div className="text-xs md:text-sm font-medium text-gray-600">Clientes convertidos</div>
                    <div className="text-xl md:text-2xl font-bold text-green-600">{resumenGlobal.clientes_convertidos}</div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
                    <div className="text-xs md:text-sm font-medium text-gray-600">Efectividad global</div>
                    <div className="text-xl md:text-2xl font-bold text-purple-600">{resumenGlobal.efectividad_global}%</div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5 mt-2">
                        <div 
                            className={`h-full rounded-full ${getEfectividadColor(resumenGlobal.efectividad_global)}`}
                            style={{ width: `${resumenGlobal.efectividad_global}%` }}
                        ></div>
                    </div>
                </div>
            </div>

            {/* Tabla de orígenes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Efectividad por origen
                    </h2>
                </div>

                {origenesProspecto.length === 0 ? (
                    <div className="text-center py-8 md:py-12 px-4">
                        <p className="text-gray-500">No hay datos de leads con origen registrado</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table - visible en md y superior */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="py-3 px-4 text-left font-medium text-gray-700">Origen</th>
                                        <th className="py-3 px-4 text-left font-medium text-gray-700">Descripción</th>
                                        <th className="py-3 px-4 text-center font-medium text-gray-700">Leads</th>
                                        <th className="py-3 px-4 text-center font-medium text-gray-700">Clientes</th>
                                        <th className="py-3 px-4 text-left font-medium text-gray-700">Efectividad</th>
                                        <th className="py-3 px-4 text-center font-medium text-gray-700">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {origenesProspecto.map((origen) => (
                                        <tr key={origen.id} className="hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-2">
                                                    {origen.icono && <i className={origen.icono}></i>}
                                                    <span className="font-medium">{origen.nombre}</span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-gray-600 max-w-xs truncate">
                                                {origen.descripcion}
                                            </td>
                                            <td className="py-3 px-4 text-center font-medium">
                                                {origen.total_leads}
                                            </td>
                                            <td className="py-3 px-4 text-center font-medium">
                                                {origen.clientes_convertidos}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-20 bg-gray-200 rounded-full h-2">
                                                        <div 
                                                            className={`h-full rounded-full ${getEfectividadColor(origen.efectividad)}`}
                                                            style={{ width: `${origen.efectividad}%` }}
                                                        ></div>
                                                    </div>
                                                    <span className={`px-2 py-0.5 text-xs rounded-full ${getEfectividadBgClass(origen.efectividad)}`}>
                                                        {origen.efectividad}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`px-2 py-1 text-xs rounded-full ${origen.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {origen.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards - visible en móvil */}
                        <div className="md:hidden divide-y divide-gray-200">
                            {origenesProspecto.map((origen) => (
                                <div key={origen.id} className="p-4 hover:bg-gray-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <div className="flex items-center gap-2">
                                            {origen.icono && <i className={origen.icono}></i>}
                                            <span className="font-medium text-gray-900">{origen.nombre}</span>
                                        </div>
                                        <span className={`px-2 py-1 text-xs rounded-full ${origen.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {origen.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                    
                                    {origen.descripcion && (
                                        <div className="text-sm text-gray-600 mb-3">
                                            {origen.descripcion}
                                        </div>
                                    )}
                                    
                                    <div className="grid grid-cols-2 gap-3 mb-3">
                                        <div className="bg-gray-50 p-2 rounded text-center">
                                            <div className="text-xs text-gray-500">Leads</div>
                                            <div className="text-lg font-bold text-gray-900">{origen.total_leads}</div>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded text-center">
                                            <div className="text-xs text-gray-500">Clientes</div>
                                            <div className="text-lg font-bold text-green-600">{origen.clientes_convertidos}</div>
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <div className="flex justify-between items-center mb-1">
                                            <span className="text-sm text-gray-600">Efectividad</span>
                                            <span className={`text-sm font-medium px-2 py-0.5 rounded-full ${getEfectividadBgClass(origen.efectividad)}`}>
                                                {origen.efectividad}%
                                            </span>
                                        </div>
                                        <div className="w-full bg-gray-200 rounded-full h-2">
                                            <div 
                                                className={`h-full rounded-full ${getEfectividadColor(origen.efectividad)}`}
                                                style={{ width: `${origen.efectividad}%` }}
                                            ></div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}