// resources/js/Pages/Config/Parametros/Rubros.tsx
import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { PageProps } from '@/types';

interface Rubro {
    id: number;
    nombre: string;
    activo: boolean;
    total_leads: number;
    total_empresas: number;
    total_asociados: number;
}

interface Resumen {
    total_rubros: number;
    rubros_activos: number;
    total_leads_con_rubro: number;
    total_leads_sin_rubro: number;
    total_empresas_con_rubro: number;
    total_empresas_sin_rubro: number;
}

interface Props extends PageProps {
    rubros?: Rubro[];
    resumen?: Resumen;
}

export default function Rubros({ 
    rubros = [], 
    resumen = {
        total_rubros: 0,
        rubros_activos: 0,
        total_leads_con_rubro: 0,
        total_leads_sin_rubro: 0,
        total_empresas_con_rubro: 0,
        total_empresas_sin_rubro: 0
    }
}: Props) {

    return (
        <AppLayout title="Rubros">
            {/* Header */}
            <div className="mb-6">
                <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                    Rubros
                </h1>
                <p className="mt-1 text-sm md:text-base text-gray-600">
                    Listado de rubros para clasificación
                </p>
            </div>

            {/* Stats Cards - Resumen de asociados y no asociados */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
                    <div className="text-xs md:text-sm font-medium text-gray-600">Total Rubros</div>
                    <div className="text-xl md:text-2xl font-bold text-gray-900">{resumen.total_rubros}</div>
                    <div className="text-xs text-gray-500 mt-1">{resumen.rubros_activos} activos</div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
                    <div className="text-xs md:text-sm font-medium text-gray-600">Leads con Rubro</div>
                    <div className="text-xl md:text-2xl font-bold text-blue-600">{resumen.total_leads_con_rubro}</div>
                    <div className="text-xs text-gray-500 mt-1">{resumen.total_leads_sin_rubro} sin rubro</div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
                    <div className="text-xs md:text-sm font-medium text-gray-600">Empresas con Rubro</div>
                    <div className="text-xl md:text-2xl font-bold text-purple-600">{resumen.total_empresas_con_rubro}</div>
                    <div className="text-xs text-gray-500 mt-1">{resumen.total_empresas_sin_rubro} sin rubro</div>
                </div>
                
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 md:p-4">
                    <div className="text-xs md:text-sm font-medium text-gray-600">Total Asociados</div>
                    <div className="text-xl md:text-2xl font-bold text-green-600">
                        {resumen.total_leads_con_rubro + resumen.total_empresas_con_rubro}
                    </div>
                    <div className="text-xs text-gray-500 mt-1">leads + empresas</div>
                </div>
            </div>

            {/* Tabla de rubros */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-gray-200">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Listado de Rubros
                    </h2>
                </div>

                {rubros.length === 0 ? (
                    <div className="text-center py-8 md:py-12 px-4">
                        <p className="text-gray-500">No hay rubros configurados</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="py-3 px-4 text-left font-medium text-gray-700">ID</th>
                                        <th className="py-3 px-4 text-left font-medium text-gray-700">Rubro</th>
                                        <th className="py-3 px-4 text-center font-medium text-gray-700">Leads</th>
                                        <th className="py-3 px-4 text-center font-medium text-gray-700">Empresas</th>
                                        <th className="py-3 px-4 text-center font-medium text-gray-700">Total Asociados</th>
                                        <th className="py-3 px-4 text-center font-medium text-gray-700">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {rubros.map((rubro) => (
                                        <tr key={rubro.id} className="hover:bg-gray-50">
                                            <td className="py-3 px-4 text-gray-600">{rubro.id}</td>
                                            <td className="py-3 px-4 font-medium">{rubro.nombre}</td>
                                            <td className="py-3 px-4 text-center font-medium text-blue-600">
                                                {rubro.total_leads}
                                            </td>
                                            <td className="py-3 px-4 text-center font-medium text-purple-600">
                                                {rubro.total_empresas}
                                            </td>
                                            <td className="py-3 px-4 text-center font-bold text-gray-900">
                                                {rubro.total_asociados}
                                            </td>
                                            <td className="py-3 px-4 text-center">
                                                <span className={`px-2 py-1 text-xs rounded-full ${rubro.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {rubro.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden divide-y divide-gray-200">
                            {rubros.map((rubro) => (
                                <div key={rubro.id} className="p-4 hover:bg-gray-50">
                                    <div className="flex items-center justify-between mb-3">
                                        <div>
                                            <span className="font-medium text-gray-900">{rubro.nombre}</span>
                                            <span className="text-xs text-gray-500 ml-2">ID: {rubro.id}</span>
                                        </div>
                                        <span className={`px-2 py-1 text-xs rounded-full ${rubro.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {rubro.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                    
                                    <div className="grid grid-cols-3 gap-2">
                                        <div className="bg-gray-50 p-2 rounded text-center">
                                            <div className="text-xs text-gray-500">Leads</div>
                                            <div className="text-base font-bold text-blue-600">{rubro.total_leads}</div>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded text-center">
                                            <div className="text-xs text-gray-500">Empresas</div>
                                            <div className="text-base font-bold text-purple-600">{rubro.total_empresas}</div>
                                        </div>
                                        <div className="bg-gray-50 p-2 rounded text-center">
                                            <div className="text-xs text-gray-500">Total</div>
                                            <div className="text-base font-bold text-gray-900">{rubro.total_asociados}</div>
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