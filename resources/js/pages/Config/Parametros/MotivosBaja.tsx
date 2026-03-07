// resources/js/Pages/Config/Parametros/MotivosBaja.tsx
import React from 'react';
import AppLayout from '@/layouts/app-layout';
import { PageProps } from '@/types';

interface MotivoBaja {
    id: number;
    nombre: string;
    descripcion: string;
    activo: boolean;
}

interface Props extends PageProps {
    motivosBaja?: MotivoBaja[];
}

export default function MotivosBaja({ motivosBaja = [] }: Props) {
    if (!motivosBaja) {
        return (
            <AppLayout title="Motivos de Baja">
                <div className="p-4">
                    <p className="text-red-600">Error: No se pudieron cargar los motivos de baja</p>
                </div>
            </AppLayout>
        );
    }

    const activos = motivosBaja.filter(m => m.activo).length;

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
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-1">
                        Motivos Configurados
                    </h2>
                    <p className="text-sm text-gray-600">
                        Listado de motivos de baja disponibles en el sistema
                    </p>
                </div>

                {/* Stats simple */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 rounded border border-blue-100">
                        <div className="text-sm font-medium text-blue-700">Total motivos</div>
                        <div className="text-2xl font-bold text-blue-900">{motivosBaja.length}</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded border border-green-100">
                        <div className="text-sm font-medium text-green-700">Activos</div>
                        <div className="text-2xl font-bold text-green-900">{activos}</div>
                    </div>
                </div>

                {motivosBaja.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No hay motivos de baja configurados</p>
                    </div>
                ) : (
                    <>
                        {/* Desktop Table */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="w-full text-sm">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="py-3 px-4 text-left font-medium text-gray-700">ID</th>
                                        <th className="py-3 px-4 text-left font-medium text-gray-700">Motivo</th>
                                        <th className="py-3 px-4 text-left font-medium text-gray-700">Descripción</th>
                                        <th className="py-3 px-4 text-left font-medium text-gray-700">Estado</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-200">
                                    {motivosBaja.map((motivo) => (
                                        <tr key={motivo.id} className="hover:bg-gray-50">
                                            <td className="py-3 px-4">{motivo.id}</td>
                                            <td className="py-3 px-4 font-medium">{motivo.nombre}</td>
                                            <td className="py-3 px-4 text-gray-600">{motivo.descripcion}</td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 text-xs rounded-full ${motivo.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                    {motivo.activo ? 'Activo' : 'Inactivo'}
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        {/* Mobile Cards */}
                        <div className="md:hidden space-y-4">
                            {motivosBaja.map((motivo) => (
                                <div key={motivo.id} className="p-4 border border-gray-200 rounded-lg">
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="font-medium text-gray-900">{motivo.nombre}</div>
                                        <span className={`px-2 py-1 text-xs rounded-full ${motivo.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {motivo.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600 mb-1">ID: {motivo.id}</div>
                                    <div className="text-sm text-gray-700">{motivo.descripcion}</div>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </AppLayout>
    );
}