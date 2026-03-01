// resources/js/Pages/Config/Parametros/MotivosBaja.tsx
import React, { useState } from 'react';

import AppLayout from '@/layouts/app-layout';

interface MotivoBaja {
    id: number;
    nombre: string;
    categoria: string;
    descripcion: string;
    requiere_comentario: boolean;
    activo: boolean;
}

export default function MotivosBaja() {
    const [motivos] = useState<MotivoBaja[]>([
        { id: 1, nombre: 'Fin de contrato', categoria: 'Contrato', descripcion: 'Finalización del período contractual', requiere_comentario: false, activo: true },
        { id: 2, nombre: 'Insatisfacción con servicio', categoria: 'Servicio', descripcion: 'Cliente no satisfecho con el servicio', requiere_comentario: true, activo: true },
        { id: 3, nombre: 'Problemas económicos', categoria: 'Financiero', descripcion: 'Dificultades económicas del cliente', requiere_comentario: true, activo: true },
        { id: 4, nombre: 'Cambio de proveedor', categoria: 'Competencia', descripcion: 'Cliente cambió a otro proveedor', requiere_comentario: true, activo: true },
        { id: 5, nombre: 'Falta de respuesta', categoria: 'Comunicación', descripcion: 'Cliente no responde contactos', requiere_comentario: false, activo: false },
    ]);

    return (
        <AppLayout title="Motivos de Baja">
            <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    Motivos de Baja
                </h1>
                <p className="mt-1 text-gray-600 text-base">
                    Configuración de motivos para baja de clientes
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">
                            Motivos Configurados
                        </h2>
                        <p className="text-sm text-gray-600">
                            Gestione los motivos de baja disponibles
                        </p>
                    </div>
                    <button className="px-4 py-2 bg-sat text-white text-sm rounded hover:bg-sat-600 transition-colors">
                        + Nuevo Motivo
                    </button>
                </div>

                {/* Categorías Stats */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    {['Contrato', 'Servicio', 'Financiero', 'Competencia'].map((categoria) => {
                        const count = motivos.filter(m => m.categoria === categoria && m.activo).length;
                        return (
                            <div key={categoria} className="p-3 bg-gray-50 rounded border">
                                <div className="text-sm font-medium text-gray-700">{categoria}</div>
                                <div className="text-xl font-bold text-gray-900">{count}</div>
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
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Motivo</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Categoría</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Descripción</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Requiere Comentario</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Estado</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {motivos.map((motivo) => (
                                <tr key={motivo.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4">{motivo.id}</td>
                                    <td className="py-3 px-4 font-medium">{motivo.nombre}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${
                                            motivo.categoria === 'Contrato' ? 'bg-blue-100 text-blue-800' :
                                            motivo.categoria === 'Servicio' ? 'bg-red-100 text-red-800' :
                                            motivo.categoria === 'Financiero' ? 'bg-yellow-100 text-yellow-800' :
                                            'bg-purple-100 text-purple-800'
                                        }`}>
                                            {motivo.categoria}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4 text-gray-600">{motivo.descripcion}</td>
                                    <td className="py-3 px-4">
                                        {motivo.requiere_comentario ? (
                                            <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">Sí</span>
                                        ) : (
                                            <span className="px-2 py-1 bg-gray-100 text-gray-800 text-xs rounded-full">No</span>
                                        )}
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${motivo.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {motivo.activo ? 'Activo' : 'Inactivo'}
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
                    {motivos.map((motivo) => (
                        <div key={motivo.id} className="p-4 border border-gray-200 rounded-lg hover:border-sat transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="font-medium text-gray-900">{motivo.nombre}</div>
                                    <div className="text-sm text-gray-600">ID: {motivo.id}</div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`px-2 py-1 text-xs rounded-full ${
                                        motivo.categoria === 'Contrato' ? 'bg-blue-100 text-blue-800' :
                                        motivo.categoria === 'Servicio' ? 'bg-red-100 text-red-800' :
                                        motivo.categoria === 'Financiero' ? 'bg-yellow-100 text-yellow-800' :
                                        'bg-purple-100 text-purple-800'
                                    }`}>
                                        {motivo.categoria}
                                    </span>
                                    <span className={`px-2 py-1 text-xs rounded-full ${motivo.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {motivo.activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                </div>
                            </div>
                            <div className="text-sm text-gray-600 mb-3">
                                {motivo.descripcion}
                            </div>
                            <div className="flex items-center justify-between mb-4">
                                <span className="text-sm text-gray-700">
                                    Requiere comentario: {motivo.requiere_comentario ? 'Sí' : 'No'}
                                </span>
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