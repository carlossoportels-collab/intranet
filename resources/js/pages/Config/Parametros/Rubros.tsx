// resources/js/Pages/Config/Parametros/Rubros.tsx
import React, { useState } from 'react';

import AppLayout from '@/layouts/app-layout';

interface Rubro {
    id: number;
    nombre: string;
    descripcion: string;
    categoria: string;
    clientes_asociados: number;
    activo: boolean;
}

export default function Rubros() {
    const [rubros] = useState<Rubro[]>([
        { id: 1, nombre: 'Transporte de Carga', categoria: 'Logística', descripcion: 'Empresas de transporte terrestre', clientes_asociados: 45, activo: true },
        { id: 2, nombre: 'Distribución', categoria: 'Logística', descripcion: 'Distribución de mercaderías', clientes_asociados: 32, activo: true },
        { id: 3, nombre: 'Logística Integral', categoria: 'Logística', descripcion: 'Servicios logísticos completos', clientes_asociados: 18, activo: true },
        { id: 4, nombre: 'Comercio Exterior', categoria: 'Import/Export', descripcion: 'Importación y exportación', clientes_asociados: 12, activo: true },
        { id: 5, nombre: 'Almacenamiento', categoria: 'Logística', descripcion: 'Depósitos y almacenes', clientes_asociados: 8, activo: false },
    ]);

    return (
        <AppLayout title="Rubros">
            <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    Rubros Comerciales
                </h1>
                <p className="mt-1 text-gray-600 text-base">
                    Configuración de rubros para clasificación de clientes
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">
                            Rubros Configurados
                        </h2>
                        <p className="text-sm text-gray-600">
                            Gestione los rubros comerciales del sistema
                        </p>
                    </div>
                    <button className="px-4 py-2 bg-sat text-white text-sm rounded hover:bg-sat-600 transition-colors">
                        + Nuevo Rubro
                    </button>
                </div>

                {/* Categorías Summary */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    {['Logística', 'Import/Export'].map((categoria) => {
                        const rubrosCategoria = rubros.filter(r => r.categoria === categoria && r.activo);
                        const totalClientes = rubrosCategoria.reduce((acc, r) => acc + r.clientes_asociados, 0);
                        
                        return (
                            <div key={categoria} className="p-4 bg-gray-50 rounded border">
                                <div className="flex justify-between items-center mb-2">
                                    <h3 className="font-medium text-gray-900">{categoria}</h3>
                                    <span className="text-sm text-gray-600">{rubrosCategoria.length} rubros</span>
                                </div>
                                <div className="text-2xl font-bold text-local">{totalClientes}</div>
                                <div className="text-sm text-gray-600">clientes asociados</div>
                            </div>
                        );
                    })}
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">ID</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Rubro</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Categoría</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Descripción</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Clientes</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Estado</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {rubros.map((rubro) => (
                                <tr key={rubro.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4">{rubro.id}</td>
                                    <td className="py-3 px-4 font-medium">{rubro.nombre}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            rubro.categoria === 'Logística' ? 'bg-blue-100 text-blue-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                            {rubro.categoria}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-gray-600">{rubro.descripcion}</td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center">
                                            <span className="font-medium mr-2">{rubro.clientes_asociados}</span>
                                            <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-local"
                                                    style={{ width: `${Math.min(rubro.clientes_asociados * 2, 100)}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${rubro.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {rubro.activo ? 'Activo' : 'Inactivo'}
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
                    {rubros.map((rubro) => (
                        <div key={rubro.id} className="p-4 border border-gray-200 rounded-lg hover:border-sat transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="font-medium text-gray-900">{rubro.nombre}</div>
                                    <div className="text-sm text-gray-600">ID: {rubro.id}</div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        rubro.categoria === 'Logística' ? 'bg-blue-100 text-blue-800' :
                                        'bg-green-100 text-green-800'
                                    }`}>
                                        {rubro.categoria}
                                    </span>
                                    <span className={`px-2 py-1 text-xs rounded-full ${rubro.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {rubro.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>
                            <div className="text-sm text-gray-600 mb-3">
                                {rubro.descripcion}
                            </div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm text-gray-700">
                                    Clientes: {rubro.clientes_asociados}
                                </span>
                                <div className="h-2 w-16 bg-gray-200 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-local"
                                        style={{ width: `${Math.min(rubro.clientes_asociados * 2, 100)}%` }}
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