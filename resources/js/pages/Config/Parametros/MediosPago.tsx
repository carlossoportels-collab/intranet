// resources/js/Pages/Config/Parametros/MediosPago.tsx
import React, { useState } from 'react';

import AppLayout from '@/layouts/app-layout';

interface MedioPago {
    id: number;
    nombre: string;
    tipo: string;
    requiere_datos: boolean;
    activo: boolean;
}

export default function MediosPago() {
    const [medios] = useState<MedioPago[]>([
        { id: 1, nombre: 'Efectivo', tipo: 'Presencial', requiere_datos: false, activo: true },
        { id: 2, nombre: 'Transferencia Bancaria', tipo: 'Electrónico', requiere_datos: true, activo: true },
        { id: 3, nombre: 'Tarjeta de Crédito', tipo: 'Electrónico', requiere_datos: true, activo: true },
        { id: 4, nombre: 'Débito Automático', tipo: 'Automático', requiere_datos: true, activo: true },
        { id: 5, nombre: 'Cheque', tipo: 'Presencial', requiere_datos: true, activo: false },
    ]);

    return (
        <AppLayout title="Medios de Pago">
            <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    Medios de Pago
                </h1>
                <p className="mt-1 text-gray-600 text-base">
                    Configuración de medios de pago disponibles
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">
                            Medios Configurados
                        </h2>
                        <p className="text-sm text-gray-600">
                            Gestione los medios de pago del sistema
                        </p>
                    </div>
                    <button className="px-4 py-2 bg-sat text-white text-sm rounded hover:bg-sat-600 transition-colors">
                        + Nuevo Medio
                    </button>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 rounded border border-blue-100">
                        <div className="text-sm font-medium text-blue-700">Total medios</div>
                        <div className="text-2xl font-bold text-blue-900">{medios.length}</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded border border-green-100">
                        <div className="text-sm font-medium text-green-700">Medios activos</div>
                        <div className="text-2xl font-bold text-green-900">
                            {medios.filter(m => m.activo).length}
                        </div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded border border-purple-100">
                        <div className="text-sm font-medium text-purple-700">Requieren datos</div>
                        <div className="text-2xl font-bold text-purple-900">
                            {medios.filter(m => m.requiere_datos).length}
                        </div>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">ID</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Nombre</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Tipo</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Requiere Datos</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Estado</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {medios.map((medio) => (
                                <tr key={medio.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4">{medio.id}</td>
                                    <td className="py-3 px-4 font-medium">{medio.nombre}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            medio.tipo === 'Electrónico' ? 'bg-blue-100 text-blue-800' :
                                            medio.tipo === 'Presencial' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-green-100 text-green-800'
                                        }`}>
                                            {medio.tipo}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        {medio.requiere_datos ? 'Sí' : 'No'}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${medio.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {medio.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <button className="text-sat hover:text-sat-600 text-sm mr-3">
                                            Editar
                                        </button>
                                        <button className="text-gray-600 hover:text-gray-900 text-sm">
                                            Eliminar
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                    {medios.map((medio) => (
                        <div key={medio.id} className="p-4 border border-gray-200 rounded-lg hover:border-sat transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="font-medium text-gray-900">{medio.nombre}</div>
                                    <div className="text-sm text-gray-600">ID: {medio.id}</div>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className={`px-2 py-1 text-xs rounded-full mb-1 ${
                                        medio.tipo === 'Electrónico' ? 'bg-blue-100 text-blue-800' :
                                        medio.tipo === 'Presencial' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-green-100 text-green-800'
                                    }`}>
                                        {medio.tipo}
                                    </span>
                                    <span className={`px-2 py-1 text-xs rounded-full ${medio.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {medio.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>
                            <div className="text-sm text-gray-600 mb-4">
                                <div>Requiere datos: {medio.requiere_datos ? 'Sí' : 'No'}</div>
                            </div>
                            <div className="flex gap-2">
                                <button className="flex-1 px-3 py-1.5 text-sm text-sat border border-sat rounded hover:bg-sat-50 transition-colors">
                                    Editar
                                </button>
                                <button className="flex-1 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </AppLayout>
    );
}