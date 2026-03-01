// resources/js/Pages/Comercial/Cuentas/CambioTitularidad.tsx
import React, { useState } from 'react';

import AppLayout from '@/layouts/app-layout';

export default function CambioTitularidad() {
    const [formData, setFormData] = useState({
        cuentaActual: '',
        titularActual: '',
        nuevoTitular: '',
        documento: '',
        fechaCambio: '',
        motivo: ''
    });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        console.log('Solicitud de cambio de titularidad:', formData);
        // Aquí iría la lógica para enviar el formulario
    };

    return (
        <AppLayout title="Cambio de Titularidad">
            <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    Cambio de Titularidad
                </h1>
                <p className="mt-1 text-gray-600 text-base">
                    Solicitud de cambio de titular en cuentas
                </p>
            </div>
            
            {/* Formulario */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
                <div className="mb-6">
                    <h2 className="text-lg font-semibold text-gray-900 mb-2">
                        Nueva Solicitud
                    </h2>
                    <p className="text-gray-600 text-sm">
                        Complete el formulario para solicitar cambio de titularidad
                    </p>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                        {/* Cuenta Actual */}
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Cuenta Actual *
                            </label>
                            <select
                                name="cuentaActual"
                                value={formData.cuentaActual}
                                onChange={handleChange}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-sat focus:border-sat"
                                required
                            >
                                <option value="">Seleccionar cuenta</option>
                                <option value="CUENTA-001">CUENTA-001 - Transportes Rápidos S.A.</option>
                                <option value="CUENTA-002">CUENTA-002 - Logística Integral</option>
                                <option value="CUENTA-003">CUENTA-003 - Distribuidora Norte</option>
                            </select>
                        </div>

                        {/* Titular Actual */}
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Titular Actual *
                            </label>
                            <input
                                type="text"
                                name="titularActual"
                                value={formData.titularActual}
                                onChange={handleChange}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-sat focus:border-sat"
                                placeholder="Nombre completo del titular actual"
                                required
                            />
                        </div>

                        {/* Nuevo Titular */}
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Nuevo Titular *
                            </label>
                            <input
                                type="text"
                                name="nuevoTitular"
                                value={formData.nuevoTitular}
                                onChange={handleChange}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-sat focus:border-sat"
                                placeholder="Nombre completo del nuevo titular"
                                required
                            />
                        </div>

                        {/* Documento */}
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Documento de Identidad *
                            </label>
                            <input
                                type="text"
                                name="documento"
                                value={formData.documento}
                                onChange={handleChange}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-sat focus:border-sat"
                                placeholder="DNI/CUIT/CUIL"
                                required
                            />
                        </div>

                        {/* Fecha de Cambio */}
                        <div className="col-span-1">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Fecha de Cambio *
                            </label>
                            <input
                                type="date"
                                name="fechaCambio"
                                value={formData.fechaCambio}
                                onChange={handleChange}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-sat focus:border-sat"
                                required
                            />
                        </div>

                        {/* Motivo */}
                        <div className="col-span-1 md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Motivo del Cambio *
                            </label>
                            <textarea
                                name="motivo"
                                value={formData.motivo}
                                onChange={handleChange}
                                rows={3}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:ring-sat focus:border-sat"
                                placeholder="Describa el motivo del cambio de titularidad..."
                                required
                            />
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex flex-col sm:flex-row justify-end gap-3 pt-4">
                        <button
                            type="button"
                            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors order-2 sm:order-1"
                            onClick={() => setFormData({
                                cuentaActual: '',
                                titularActual: '',
                                nuevoTitular: '',
                                documento: '',
                                fechaCambio: '',
                                motivo: ''
                            })}
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm bg-sat text-white rounded-md hover:bg-sat-600 transition-colors order-1 sm:order-2"
                        >
                            Solicitar Cambio
                        </button>
                    </div>
                </form>
            </div>

            {/* Historial de solicitudes */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                    Solicitudes Recientes
                </h2>
                
                {/* Tabla para desktop */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Solicitud ID</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Cuenta</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Fecha</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Estado</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            <tr className="hover:bg-gray-50">
                                <td className="py-3 px-4">CT-2024-001</td>
                                <td className="py-3 px-4">CUENTA-001</td>
                                <td className="py-3 px-4">15/01/2024</td>
                                <td className="py-3 px-4">
                                    <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                        Pendiente
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <button className="text-sat hover:text-sat-600 text-sm">
                                        Ver Detalles
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                {/* Cards para mobile */}
                <div className="md:hidden space-y-3">
                    <div className="p-4 border border-gray-200 rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                            <div>
                                <div className="font-medium text-gray-900">CT-2024-001</div>
                                <div className="text-sm text-gray-600">CUENTA-001</div>
                            </div>
                            <span className="px-2 py-1 bg-yellow-100 text-yellow-800 text-xs rounded-full">
                                Pendiente
                            </span>
                        </div>
                        <div className="text-sm text-gray-600 mb-3">
                            <div>Fecha: 15/01/2024</div>
                        </div>
                        <button className="w-full text-center text-sat hover:text-sat-600 text-sm border border-sat rounded py-1.5 hover:bg-sat-50 transition-colors">
                            Ver Detalles
                        </button>
                    </div>
                </div>

                {/* Paginación */}
                <div className="mt-4 flex flex-col sm:flex-row justify-between items-center gap-2">
                    <div className="text-sm text-gray-600">
                        Mostrando 1-1 de 1 solicitud
                    </div>
                    <div className="flex gap-2">
                        <button className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                            Anterior
                        </button>
                        <button className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}