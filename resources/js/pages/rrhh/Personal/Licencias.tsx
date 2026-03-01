// resources/js/Pages/RRHH/Personal/Licencias.tsx
import React, { useState } from 'react';

import AppLayout from '@/layouts/app-layout';

interface Licencia {
    id: number;
    empleado: string;
    tipo: string;
    fecha_inicio: string;
    fecha_fin: string;
    dias_totales: number;
    dias_restantes: number;
    motivo: string;
    estado: string;
    fecha_solicitud: string;
}

export default function Licencias() {
    const [licencias] = useState<Licencia[]>([
        { id: 1, empleado: 'María López', tipo: 'Vacaciones', fecha_inicio: '2026-02-01', fecha_fin: '2026-02-15', dias_totales: 15, dias_restantes: 15, motivo: 'Vacaciones anuales', estado: 'Aprobada', fecha_solicitud: '2026-01-10' },
        { id: 2, empleado: 'Juan Pérez', tipo: 'Enfermedad', fecha_inicio: '2026-01-20', fecha_fin: '2026-01-25', dias_totales: 5, dias_restantes: 0, motivo: 'Gripe con certificado médico', estado: 'Finalizada', fecha_solicitud: '2026-01-19' },
        { id: 3, empleado: 'Carlos Gómez', tipo: 'Estudio', fecha_inicio: '2026-03-01', fecha_fin: '2026-03-01', dias_totales: 1, dias_restantes: 1, motivo: 'Examen final', estado: 'Pendiente', fecha_solicitud: '2026-01-18' },
        { id: 4, empleado: 'Ana Rodríguez', tipo: 'Maternidad', fecha_inicio: '2026-04-01', fecha_fin: '2026-07-31', dias_totales: 120, dias_restantes: 120, motivo: 'Licencia por maternidad', estado: 'Programada', fecha_solicitud: '2026-01-15' },
        { id: 5, empleado: 'Luis Martínez', tipo: 'Vacaciones', fecha_inicio: '2026-01-10', fecha_fin: '2026-01-12', dias_totales: 3, dias_restantes: 0, motivo: 'Descanso', estado: 'Finalizada', fecha_solicitud: '2026-01-05' },
    ]);

    const [filtroEstado, setFiltroEstado] = useState<string>('todos');
    const [filtroTipo, setFiltroTipo] = useState<string>('todos');

    const getTipoColor = (tipo: string) => {
        switch (tipo) {
            case 'Vacaciones': return 'bg-blue-100 text-blue-800';
            case 'Enfermedad': return 'bg-red-100 text-red-800';
            case 'Estudio': return 'bg-purple-100 text-purple-800';
            case 'Maternidad': return 'bg-pink-100 text-pink-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'Aprobada': return 'bg-green-100 text-green-800';
            case 'Pendiente': return 'bg-yellow-100 text-yellow-800';
            case 'Finalizada': return 'bg-gray-100 text-gray-800';
            case 'Programada': return 'bg-blue-100 text-blue-800';
            case 'Rechazada': return 'bg-red-100 text-red-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredLicencias = licencias.filter(l => {
        if (filtroEstado !== 'todos' && l.estado !== filtroEstado) return false;
        if (filtroTipo !== 'todos' && l.tipo !== filtroTipo) return false;
        return true;
    });

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0
        }).format(amount);
    };

    return (
        <AppLayout title="Licencias">
            <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    Licencias y Ausencias
                </h1>
                <p className="mt-1 text-gray-600 text-base">
                    Gestión de licencias, vacaciones y ausencias del personal
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                {/* Header y Filtros */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">
                            Gestión de Licencias
                        </h2>
                        <p className="text-sm text-gray-600">
                            Administre solicitudes y seguimiento de ausencias
                        </p>
                    </div>
                    <button className="px-4 py-2 bg-sat text-white text-sm rounded hover:bg-sat-600 transition-colors">
                        + Nueva Solicitud
                    </button>
                </div>

                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por estado</label>
                        <select
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-sat focus:border-sat"
                        >
                            <option value="todos">Todos los estados</option>
                            <option value="Pendiente">Pendiente</option>
                            <option value="Aprobada">Aprobada</option>
                            <option value="Finalizada">Finalizada</option>
                            <option value="Programada">Programada</option>
                            <option value="Rechazada">Rechazada</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por tipo</label>
                        <select
                            value={filtroTipo}
                            onChange={(e) => setFiltroTipo(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-sat focus:border-sat"
                        >
                            <option value="todos">Todos los tipos</option>
                            <option value="Vacaciones">Vacaciones</option>
                            <option value="Enfermedad">Enfermedad</option>
                            <option value="Estudio">Estudio</option>
                            <option value="Maternidad">Maternidad</option>
                            <option value="Paternidad">Paternidad</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Acciones</label>
                        <button className="w-full px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                            Exportar Reporte
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 rounded border border-blue-100">
                        <div className="text-sm font-medium text-blue-700">Total licencias</div>
                        <div className="text-2xl font-bold text-blue-900">{licencias.length}</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded border border-green-100">
                        <div className="text-sm font-medium text-green-700">Días activos</div>
                        <div className="text-2xl font-bold text-green-900">
                            {licencias.filter(l => l.estado === 'Aprobada' || l.estado === 'Programada').reduce((sum, l) => sum + l.dias_restantes, 0)}
                        </div>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded border border-yellow-100">
                        <div className="text-sm font-medium text-yellow-700">Pendientes</div>
                        <div className="text-2xl font-bold text-yellow-900">
                            {licencias.filter(l => l.estado === 'Pendiente').length}
                        </div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded border border-purple-100">
                        <div className="text-sm font-medium text-purple-700">Vacaciones promedio</div>
                        <div className="text-2xl font-bold text-purple-900">
                            {Math.round(licencias.filter(l => l.tipo === 'Vacaciones').reduce((sum, l) => sum + l.dias_totales, 0) / licencias.filter(l => l.tipo === 'Vacaciones').length)} días
                        </div>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Empleado</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Tipo</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Período</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Días</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Motivo</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Solicitado</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Estado</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {filteredLicencias.map((licencia) => (
                                <tr key={licencia.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        <div className="font-medium">{licencia.empleado}</div>
                                        <div className="text-xs text-gray-500">ID: {licencia.id}</div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${getTipoColor(licencia.tipo)}`}>
                                            {licencia.tipo}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="text-sm">
                                            <div>Inicio: {licencia.fecha_inicio}</div>
                                            <div>Fin: {licencia.fecha_fin}</div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div>
                                            <div className="font-medium">{licencia.dias_restantes}/{licencia.dias_totales} días</div>
                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                                                <div 
                                                    className={`h-full ${
                                                        (licencia.dias_restantes / licencia.dias_totales) > 0.5 ? 'bg-green-500' :
                                                        (licencia.dias_restantes / licencia.dias_totales) > 0.2 ? 'bg-yellow-500' :
                                                        'bg-red-500'
                                                    }`}
                                                    style={{ width: `${(licencia.dias_restantes / licencia.dias_totales) * 100}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4 text-gray-600">{licencia.motivo}</td>
                                    <td className="py-3 px-4">{licencia.fecha_solicitud}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${getEstadoColor(licencia.estado)}`}>
                                            {licencia.estado}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex gap-2">
                                            <button className="text-sat hover:text-sat-600 text-sm">
                                                Ver
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                    {filteredLicencias.map((licencia) => (
                        <div key={licencia.id} className="p-4 border border-gray-200 rounded-lg hover:border-sat transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="font-medium text-gray-900">{licencia.empleado}</div>
                                    <div className="text-sm text-gray-600">ID: {licencia.id}</div>
                                </div>
                                <div className="flex flex-col items-end gap-1">
                                    <span className={`px-2 py-1 text-xs rounded-full ${getTipoColor(licencia.tipo)}`}>
                                        {licencia.tipo}
                                    </span>
                                    <span className={`px-2 py-1 text-xs rounded-full ${getEstadoColor(licencia.estado)}`}>
                                        {licencia.estado}
                                    </span>
                                </div>
                            </div>
                            <div className="mb-4">
                                <div className="text-sm text-gray-700 mb-1">Período: {licencia.fecha_inicio} - {licencia.fecha_fin}</div>
                                <div className="text-sm text-gray-700">Días: {licencia.dias_restantes}/{licencia.dias_totales}</div>
                            </div>
                            <div className="mb-4">
                                <div className="text-sm font-medium text-gray-700 mb-1">Motivo</div>
                                <div className="text-sm text-gray-600">{licencia.motivo}</div>
                            </div>
                            <div className="flex gap-2">
                                <button className="flex-1 px-3 py-1.5 text-sm text-sat border border-sat rounded hover:bg-sat-50 transition-colors">
                                    Ver detalles
                                </button>
                                {licencia.estado === 'Pendiente' && (
                                    <button className="flex-1 px-3 py-1.5 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                                        Aprobar
                                    </button>
                                )}
                            </div>
                        </div>
                    ))}
                </div>

                {/* Vacation Balance */}
                <div className="mt-8 p-4 bg-blue-50 rounded border border-blue-200">
                    <h3 className="font-medium text-blue-900 mb-3">Balance de Vacaciones 2026</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="p-3 bg-white rounded border">
                            <div className="text-sm text-gray-600 mb-1">Días asignados por ley</div>
                            <div className="text-lg font-bold text-blue-700">14 días</div>
                        </div>
                        <div className="p-3 bg-white rounded border">
                            <div className="text-sm text-gray-600 mb-1">Días tomados promedio</div>
                            <div className="text-lg font-bold text-green-700">8 días</div>
                        </div>
                        <div className="p-3 bg-white rounded border">
                            <div className="text-sm text-gray-600 mb-1">Saldo restante promedio</div>
                            <div className="text-lg font-bold text-purple-700">6 días</div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}