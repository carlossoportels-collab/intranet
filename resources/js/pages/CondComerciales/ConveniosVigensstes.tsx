// resources/js/Pages/Comercial/ConveniosVigentes.tsx
import React, { useState } from 'react';

import AppLayout from '@/layouts/app-layout';

interface Convenio {
    id: number;
    codigo: string;
    empresa: string;
    descuento_general: number;
    servicios_aplicables: string[];
    fecha_inicio: string;
    fecha_fin: string;
    estado: string;
    contacto: string;
    telefono: string;
}

export default function ConveniosVigentes() {
    const [convenios] = useState<Convenio[]>([
        { 
            id: 1, 
            codigo: 'CONV-2024-001', 
            empresa: 'Transportes Rápidos S.A.', 
            descuento_general: 15, 
            servicios_aplicables: ['Transporte Local', 'Distribución Urbana'], 
            fecha_inicio: '2024-01-01', 
            fecha_fin: '2024-12-31', 
            estado: 'Vigente',
            contacto: 'Juan Pérez',
            telefono: '+54 11 1234-5678'
        },
        { 
            id: 2, 
            codigo: 'CONV-2024-002', 
            empresa: 'Distribuidora Norte SRL', 
            descuento_general: 20, 
            servicios_aplicables: ['Transporte Local', 'Servicio Nocturno'], 
            fecha_inicio: '2024-02-01', 
            fecha_fin: '2024-11-30', 
            estado: 'Vigente',
            contacto: 'María Gómez',
            telefono: '+54 11 2345-6789'
        },
        { 
            id: 3, 
            codigo: 'CONV-2024-003', 
            empresa: 'Logística Integral', 
            descuento_general: 25, 
            servicios_aplicables: ['Logística Express', 'Transporte Pesado'], 
            fecha_inicio: '2023-11-01', 
            fecha_fin: '2024-04-30', 
            estado: 'Por Vencer',
            contacto: 'Carlos Rodríguez',
            telefono: '+54 11 3456-7890'
        },
        { 
            id: 4, 
            codigo: 'CONV-2023-004', 
            empresa: 'Grupo Industrial Sur', 
            descuento_general: 18, 
            servicios_aplicables: ['Todos los servicios'], 
            fecha_inicio: '2023-07-01', 
            fecha_fin: '2023-12-31', 
            estado: 'Vencido',
            contacto: 'Ana Martínez',
            telefono: '+54 11 4567-8901'
        },
        { 
            id: 5, 
            codigo: 'CONV-2024-005', 
            empresa: 'Transportes Unidos', 
            descuento_general: 12, 
            servicios_aplicables: ['Distribución Urbana', 'Servicio Nocturno'], 
            fecha_inicio: '2024-03-01', 
            fecha_fin: '2024-08-31', 
            estado: 'Vigente',
            contacto: 'Luis Fernández',
            telefono: '+54 11 5678-9012'
        },
    ]);

    const [filtroEstado, setFiltroEstado] = useState<string>('todos');

    const getStatusColor = (estado: string) => {
        switch (estado) {
            case 'Vigente': return 'bg-green-100 text-green-800';
            case 'Por Vencer': return 'bg-yellow-100 text-yellow-800';
            case 'Vencido': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getDaysRemaining = (fechaFin: string) => {
        const endDate = new Date(fechaFin);
        const today = new Date();
        const diffTime = endDate.getTime() - today.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays;
    };

    return (
        <AppLayout title="Convenios Vigentes">
            <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    Convenios Vigentes
                </h1>
                <p className="mt-1 text-gray-600 text-base">
                    Consulta de acuerdos comerciales activos
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                {/* Filtros y Stats */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">
                            Acuerdos Comerciales
                        </h2>
                        <p className="text-sm text-gray-600">
                            Convenios activos y vigentes con empresas asociadas
                        </p>
                    </div>
                    <div className="flex gap-3">
                        <select
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-sat focus:border-sat"
                        >
                            <option value="todos">Todos los estados</option>
                            <option value="Vigente">Vigentes</option>
                            <option value="Por Vencer">Por vencer</option>
                            <option value="Vencido">Vencidos</option>
                        </select>
                        <button className="px-4 py-2 bg-local text-white text-sm rounded hover:bg-local-600 transition-colors">
                            Ver Reporte Completo
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-green-50 rounded border border-green-100">
                        <div className="text-sm font-medium text-green-700">Vigentes</div>
                        <div className="text-2xl font-bold text-green-900">
                            {convenios.filter(c => c.estado === 'Vigente').length}
                        </div>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded border border-yellow-100">
                        <div className="text-sm font-medium text-yellow-700">Por vencer</div>
                        <div className="text-2xl font-bold text-yellow-900">
                            {convenios.filter(c => c.estado === 'Por Vencer').length}
                        </div>
                    </div>
                    <div className="p-4 bg-blue-50 rounded border border-blue-100">
                        <div className="text-sm font-medium text-blue-700">Descuento promedio</div>
                        <div className="text-2xl font-bold text-blue-900">
                            {Math.round(convenios.filter(c => c.estado === 'Vigente').reduce((sum, c) => sum + c.descuento_general, 0) / convenios.filter(c => c.estado === 'Vigente').length)}%
                        </div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded border border-purple-100">
                        <div className="text-sm font-medium text-purple-700">Empresas activas</div>
                        <div className="text-2xl font-bold text-purple-900">
                            {new Set(convenios.filter(c => c.estado === 'Vigente').map(c => c.empresa)).size}
                        </div>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Código</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Empresa</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Descuento</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Servicios</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Vigencia</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Días Restantes</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Contacto</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Estado</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {convenios
                                .filter(c => filtroEstado === 'todos' || c.estado === filtroEstado)
                                .map((convenio) => {
                                    const diasRestantes = getDaysRemaining(convenio.fecha_fin);
                                    return (
                                        <tr key={convenio.id} className="hover:bg-gray-50">
                                            <td className="py-3 px-4 font-medium text-local">{convenio.codigo}</td>
                                            <td className="py-3 px-4">
                                                <div className="font-medium">{convenio.empresa}</div>
                                                <div className="text-xs text-gray-500">ID: {convenio.id}</div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-bold">
                                                    {convenio.descuento_general}%
                                                </span>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-wrap gap-1">
                                                    {convenio.servicios_aplicables.map((servicio, idx) => (
                                                        <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                                            {servicio}
                                                        </span>
                                                    ))}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="text-sm">
                                                    <div>Inicio: {convenio.fecha_inicio}</div>
                                                    <div>Fin: {convenio.fecha_fin}</div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                {diasRestantes > 0 ? (
                                                    <div className="flex items-center">
                                                        <span className="font-medium mr-2">{diasRestantes} días</span>
                                                        <div className="h-2 w-16 bg-gray-200 rounded-full overflow-hidden">
                                                            <div 
                                                                className={`h-full ${diasRestantes < 30 ? 'bg-red-500' : 'bg-green-500'}`}
                                                                style={{ width: `${Math.min(diasRestantes / 365 * 100, 100)}%` }}
                                                            ></div>
                                                        </div>
                                                    </div>
                                                ) : (
                                                    <span className="text-red-600 font-medium">Vencido</span>
                                                )}
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="text-sm">
                                                    <div>{convenio.contacto}</div>
                                                    <div className="text-gray-500">{convenio.telefono}</div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(convenio.estado)}`}>
                                                    {convenio.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    );
                                })}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                    {convenios
                        .filter(c => filtroEstado === 'todos' || c.estado === filtroEstado)
                        .map((convenio) => {
                            const diasRestantes = getDaysRemaining(convenio.fecha_fin);
                            return (
                                <div key={convenio.id} className="p-4 border border-gray-200 rounded-lg hover:border-sat transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="font-medium text-gray-900">{convenio.empresa}</div>
                                            <div className="text-sm text-gray-600">{convenio.codigo}</div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-full font-bold">
                                                {convenio.descuento_general}% desc.
                                            </span>
                                            <span className={`px-2 py-1 text-xs rounded-full ${getStatusColor(convenio.estado)}`}>
                                                {convenio.estado}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="mb-4">
                                        <div className="text-sm font-medium text-gray-700 mb-1">Servicios aplicables:</div>
                                        <div className="flex flex-wrap gap-1">
                                            {convenio.servicios_aplicables.map((servicio, idx) => (
                                                <span key={idx} className="px-2 py-1 bg-gray-100 text-gray-700 text-xs rounded">
                                                    {servicio}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3 mb-4">
                                        <div>
                                            <div className="text-sm text-gray-600">Vigencia</div>
                                            <div className="font-medium text-sm">
                                                {convenio.fecha_inicio} - {convenio.fecha_fin}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600">Días restantes</div>
                                            <div className={`font-medium ${diasRestantes > 0 ? 'text-green-600' : 'text-red-600'}`}>
                                                {diasRestantes > 0 ? `${diasRestantes} días` : 'Vencido'}
                                            </div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600">Contacto</div>
                                            <div className="font-medium text-sm">{convenio.contacto}</div>
                                        </div>
                                        <div>
                                            <div className="text-sm text-gray-600">Teléfono</div>
                                            <div className="font-medium text-sm">{convenio.telefono}</div>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                </div>

                {/* Expiring Soon */}
                <div className="mt-8">
                    <h3 className="font-medium text-gray-900 mb-3">Convenios por Vencer (próximos 30 días)</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="py-2 px-3 text-left font-medium text-gray-700">Empresa</th>
                                    <th className="py-2 px-3 text-left font-medium text-gray-700">Vence el</th>
                                    <th className="py-2 px-3 text-left font-medium text-gray-700">Días restantes</th>
                                    <th className="py-2 px-3 text-left font-medium text-gray-700">Acción recomendada</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {convenios
                                    .filter(c => {
                                        const diasRestantes = getDaysRemaining(c.fecha_fin);
                                        return diasRestantes > 0 && diasRestantes <= 30;
                                    })
                                    .map((convenio) => {
                                        const diasRestantes = getDaysRemaining(convenio.fecha_fin);
                                        return (
                                            <tr key={convenio.id} className="hover:bg-gray-50">
                                                <td className="py-2 px-3 font-medium">{convenio.empresa}</td>
                                                <td className="py-2 px-3">{convenio.fecha_fin}</td>
                                                <td className="py-2 px-3">
                                                    <span className={`font-medium ${diasRestantes <= 7 ? 'text-red-600' : 'text-yellow-600'}`}>
                                                        {diasRestantes} días
                                                    </span>
                                                </td>
                                                <td className="py-2 px-3">
                                                    {diasRestantes <= 7 ? (
                                                        <span className="text-red-600 font-medium">Contactar urgente</span>
                                                    ) : (
                                                        <span className="text-yellow-600 font-medium">Seguimiento programado</span>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}