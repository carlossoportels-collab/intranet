// resources/js/Pages/Comercial/Cuentas/CertificadosFlota.tsx
import React from 'react';

import AppLayout from '@/layouts/app-layout';

export default function CertificadosFlota() {
    return (
        <AppLayout title="Certificados de Flota">
            <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    Certificados de Flota
                </h1>
                <p className="mt-1 text-gray-600 text-base">
                    Gestión de certificados para flotas vehiculares
                </p>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h2 className="text-lg font-semibold text-gray-900">
                            Certificados Registrados
                        </h2>
                        <div className="flex gap-2">
                            <select className="px-3 py-2 border border-gray-300 rounded text-sm">
                                <option>Filtrar por estado</option>
                                <option>Vigente</option>
                                <option>Vencido</option>
                                <option>Pendiente</option>
                            </select>
                            <button className="px-4 py-2 bg-sat text-white text-sm rounded hover:bg-sat-600 transition-colors">
                                + Nuevo Certificado
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">N° Certificado</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Empresa</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Vehículos</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Vigencia Desde</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Vigencia Hasta</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Estado</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            <tr className="hover:bg-gray-50">
                                <td className="py-3 px-4">CERT-2024-001</td>
                                <td className="py-3 px-4">Transportes Rápidos S.A.</td>
                                <td className="py-3 px-4">15</td>
                                <td className="py-3 px-4">01/01/2026</td>
                                <td className="py-3 px-4">31/02/2026</td>
                                <td className="py-3 px-4">
                                    <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                                        Vigente
                                    </span>
                                </td>
                                <td className="py-3 px-4">
                                    <button className="text-sat hover:text-sat-600 text-sm mr-2">
                                        Ver
                                    </button>
                                    <button className="text-gray-600 hover:text-gray-900 text-sm">
                                        Descargar
                                    </button>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>
                
                <div className="mt-6 flex justify-between items-center">
                    <div className="text-gray-500 text-sm">
                        Mostrando 1-10 de 45 certificados
                    </div>
                    <div className="flex gap-2">
                        <button className="px-3 py-1 border border-gray-300 rounded text-sm">
                            Anterior
                        </button>
                        <button className="px-3 py-1 border border-gray-300 rounded text-sm">
                            Siguiente
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}