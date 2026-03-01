// resources/js/Pages/Config/Parametros/OrigenProspecto.tsx
import React, { useState } from 'react';

import AppLayout from '@/layouts/app-layout';

interface OrigenProspecto {
    id: number;
    nombre: string;
    tipo: string;
    efectividad: number;
    activo: boolean;
}

export default function OrigenProspecto() {
    const [origenes] = useState<OrigenProspecto[]>([
        { id: 1, nombre: 'Referido de cliente', tipo: 'Referido', efectividad: 85, activo: true },
        { id: 2, nombre: 'Campaña email', tipo: 'Marketing', efectividad: 45, activo: true },
        { id: 3, nombre: 'Redes sociales', tipo: 'Digital', efectividad: 60, activo: true },
        { id: 4, nombre: 'Evento/Exposición', tipo: 'Presencial', efectividad: 70, activo: true },
        { id: 5, nombre: 'Búsqueda web', tipo: 'Digital', efectividad: 55, activo: false },
    ]);

    return (
        <AppLayout title="Origen de Prospectos">
            <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    Origen de Prospectos
                </h1>
                <p className="mt-1 text-gray-600 text-base">
                    Configuración de fuentes de prospección comercial
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">
                            Orígenes Configurados
                        </h2>
                        <p className="text-sm text-gray-600">
                            Gestione las fuentes de obtención de prospectos
                        </p>
                    </div>
                    <button className="px-4 py-2 bg-local text-white text-sm rounded hover:bg-local-600 transition-colors">
                        + Nuevo Origen
                    </button>
                </div>

                {/* Effectiveness Summary */}
                <div className="mb-6 p-4 bg-gray-50 rounded border">
                    <h3 className="font-medium text-gray-900 mb-2">Efectividad por Tipo</h3>
                    <div className="space-y-3">
                        {['Referido', 'Marketing', 'Digital', 'Presencial'].map((tipo) => {
                            const origenesTipo = origenes.filter(o => o.tipo === tipo && o.activo);
                            const promedio = origenesTipo.length > 0 
                                ? origenesTipo.reduce((acc, o) => acc + o.efectividad, 0) / origenesTipo.length 
                                : 0;
                            
                            if (origenesTipo.length === 0) return null;
                            
                            return (
                                <div key={tipo}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-700">{tipo}</span>
                                        <span className="font-medium text-gray-900">{promedio.toFixed(0)}%</span>
                                    </div>
                                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                        <div 
                                            className={`h-full ${promedio > 70 ? 'bg-green-500' : promedio > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                            style={{ width: `${promedio}%` }}
                                        ></div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">ID</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Origen</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Tipo</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Efectividad</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Estado</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {origenes.map((origen) => (
                                <tr key={origen.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4">{origen.id}</td>
                                    <td className="py-3 px-4 font-medium">{origen.nombre}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            origen.tipo === 'Referido' ? 'bg-green-100 text-green-800' :
                                            origen.tipo === 'Marketing' ? 'bg-blue-100 text-blue-800' :
                                            origen.tipo === 'Digital' ? 'bg-purple-100 text-purple-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {origen.tipo}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center">
                                            <div className="w-16 bg-gray-200 rounded-full h-2 mr-3">
                                                <div 
                                                    className={`h-full rounded-full ${origen.efectividad > 70 ? 'bg-green-500' : origen.efectividad > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                                    style={{ width: `${origen.efectividad}%` }}
                                                ></div>
                                            </div>
                                            <span className="font-medium">{origen.efectividad}%</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${origen.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {origen.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <button className="text-sat hover:text-sat-600 text-sm">
                                            Editar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                    {origenes.map((origen) => (
                        <div key={origen.id} className="p-4 border border-gray-200 rounded-lg hover:border-sat transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="font-medium text-gray-900">{origen.nombre}</div>
                                    <div className="text-sm text-gray-600">ID: {origen.id}</div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        origen.tipo === 'Referido' ? 'bg-green-100 text-green-800' :
                                        origen.tipo === 'Marketing' ? 'bg-blue-100 text-blue-800' :
                                        origen.tipo === 'Digital' ? 'bg-purple-100 text-purple-800' :
                                        'bg-yellow-100 text-yellow-800'
                                    }`}>
                                        {origen.tipo}
                                    </span>
                                    <span className={`px-2 py-1 text-xs rounded-full ${origen.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {origen.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>
                            <div className="mb-4">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-gray-700">Efectividad:</span>
                                    <span className="font-medium">{origen.efectividad}%</span>
                                </div>
                                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className={`h-full ${origen.efectividad > 70 ? 'bg-green-500' : origen.efectividad > 50 ? 'bg-yellow-500' : 'bg-red-500'}`}
                                        style={{ width: `${origen.efectividad}%` }}
                                    ></div>
                                </div>
                            </div>
                            <button className="w-full text-center px-3 py-1.5 text-sm text-sat border border-sat rounded hover:bg-sat-50 transition-colors">
                                Editar
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}