// resources/js/Pages/Estadisticas/ComercialGrupal.tsx

import { TrendingUp, Target, Award, DollarSign, Users, BarChart3, Star, TrendingDown } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

import AppLayout from '@/layouts/app-layout';

interface Comercial {
    id: number;
    personal_id: number;
    nombre_completo: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    prefijo_id: number;
    compania_id: number;
    fecha_ingreso: string;
    activo: boolean;
}

interface EstadisticasComercial {
    comercial_id: number;
    nombre_completo: string;
    ventas_mensuales: number;
    objetivo_mensual: number;
    clientes_nuevos: number;
    leads_activos: number;
    presupuestos_pendientes: number;
    contratos_activos: number;
    satisfaccion: number;
    experiencia: number; // años
    nivel: 'Junior' | 'Mid' | 'Senior';
}

interface MetaEquipo {
    mes: string;
    objetivo: number;
    alcanzado: number;
    crecimiento: number;
}

interface Props {
    comerciales: Comercial[];
    estadisticas: EstadisticasComercial[];
    metasEquipo: MetaEquipo[];
    totales: {
        ventas: number;
        clientes_nuevos: number;
        leads_activos: number;
        presupuestos: number;
        contratos: number;
    };
}

export default function ComercialGrupal({ 
    comerciales = [], 
    estadisticas = [], 
    metasEquipo = [],
    totales = { ventas: 0, clientes_nuevos: 0, leads_activos: 0, presupuestos: 0, contratos: 0 }
}: Props) {
    const [filtroNivel, setFiltroNivel] = useState<string>('todos');
    const [filtroEstado, setFiltroEstado] = useState<string>('todos');
    const [metas, setMetas] = useState<MetaEquipo[]>([
        { mes: 'Enero', objetivo: 1200000, alcanzado: 1250000, crecimiento: 4.2 },
        { mes: 'Febrero', objetivo: 1300000, alcanzado: 1280000, crecimiento: -1.5 },
        { mes: 'Marzo', objetivo: 1400000, alcanzado: 1420000, crecimiento: 1.4 },
        { mes: 'Abril', objetivo: 1350000, alcanzado: 1380000, crecimiento: 2.2 },
        { mes: 'Mayo', objetivo: 1450000, alcanzado: 1480000, crecimiento: 2.1 },
    ]);

    // Filtrar estadísticas
    const filteredEstadisticas = estadisticas.filter(est => {
        if (filtroNivel !== 'todos' && est.nivel !== filtroNivel) return false;
        // El estado podría determinarse por activo del comercial
        return true;
    });

    const getNivelColor = (nivel: string) => {
        switch (nivel) {
            case 'Senior': return 'bg-purple-100 text-purple-800';
            case 'Mid': return 'bg-blue-100 text-blue-800';
            case 'Junior': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getRendimientoColor = (ventas: number, objetivo: number) => {
        const porcentaje = objetivo > 0 ? (ventas / objetivo) * 100 : 0;
        if (porcentaje >= 110) return 'bg-green-100 text-green-800';
        if (porcentaje >= 90) return 'bg-yellow-100 text-yellow-800';
        return 'bg-red-100 text-red-800';
    };

    return (
        <AppLayout title="Desempeño Grupal">
            <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                   Desempeño Grupal
                </h1>
                <p className="mt-1 text-gray-600 text-base">
                    Gestión y seguimiento del equipo de ventas
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                {/* Header */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">
                            Performance Comercial
                        </h2>
                        <p className="text-sm text-gray-600">
                            Seguimiento de ventas, objetivos y comisiones
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button 
                            onClick={() => router.get('/estadisticas/comercial-grupal/exportar')}
                            className="px-4 py-2 border border-sat text-sat text-sm rounded hover:bg-sat-50 transition-colors"
                        >
                            Generar Reporte
                        </button>
                    </div>
                </div>

                {/* Team Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-gradient-to-r from-blue-50 to-cyan-50 rounded-lg border border-blue-100">
                        <div className="flex items-center gap-2 mb-2">
                            <DollarSign size={20} className="text-blue-600" />
                            <div className="text-sm font-medium text-blue-700">Ventas Totales</div>
                        </div>
                        <div className="text-2xl font-bold text-blue-900">
                            ${totales.ventas.toLocaleString('es-AR')}
                        </div>
                        <div className="text-xs text-blue-600 mt-1">
                            {comerciales.length} comerciales activos
                        </div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Target size={20} className="text-green-600" />
                            <div className="text-sm font-medium text-green-700">Clientes Nuevos</div>
                        </div>
                        <div className="text-2xl font-bold text-green-900">
                            {totales.clientes_nuevos}
                        </div>
                        <div className="text-xs text-green-600 mt-1">
                            este mes
                        </div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-lg border border-purple-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Users size={20} className="text-purple-600" />
                            <div className="text-sm font-medium text-purple-700">Leads Activos</div>
                        </div>
                        <div className="text-2xl font-bold text-purple-900">
                            {totales.leads_activos}
                        </div>
                        <div className="text-xs text-purple-600 mt-1">
                            {totales.presupuestos} presupuestos pendientes
                        </div>
                    </div>
                    <div className="p-4 bg-gradient-to-r from-orange-50 to-amber-50 rounded-lg border border-orange-100">
                        <div className="flex items-center gap-2 mb-2">
                            <Award size={20} className="text-orange-600" />
                            <div className="text-sm font-medium text-orange-700">Contratos Activos</div>
                        </div>
                        <div className="text-2xl font-bold text-orange-900">
                            {totales.contratos}
                        </div>
                        <div className="text-xs text-orange-600 mt-1">
                            en cartera
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por nivel</label>
                        <select
                            value={filtroNivel}
                            onChange={(e) => setFiltroNivel(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-sat focus:border-sat"
                        >
                            <option value="todos">Todos los niveles</option>
                            <option value="Senior">Senior</option>
                            <option value="Mid">Mid</option>
                            <option value="Junior">Junior</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Acciones</label>
                        <button className="w-full px-3 py-2 text-sm bg-sat text-white rounded hover:bg-sat-600 transition-colors">
                            Calcular Comisiones
                        </button>
                    </div>
                </div>

                {/* Team Performance Chart */}
                <div className="mb-6 p-4 bg-gray-50 rounded border">
                    <h3 className="font-medium text-gray-900 mb-3">Desempeño por Mes</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="py-2 px-3 text-left font-medium text-gray-700">Mes</th>
                                    <th className="py-2 px-3 text-left font-medium text-gray-700">Objetivo</th>
                                    <th className="py-2 px-3 text-left font-medium text-gray-700">Alcanzado</th>
                                    <th className="py-2 px-3 text-left font-medium text-gray-700">% Cumplimiento</th>
                                    <th className="py-2 px-3 text-left font-medium text-gray-700">Crecimiento</th>
                                </tr>
                            </thead>
                            <tbody>
                                {metas.map((meta, index) => (
                                    <tr key={index} className="border-b border-gray-200 last:border-0">
                                        <td className="py-2 px-3 font-medium">{meta.mes}</td>
                                        <td className="py-2 px-3">${meta.objetivo.toLocaleString('es-AR')}</td>
                                        <td className="py-2 px-3">
                                            <div className="flex items-center gap-2">
                                                ${meta.alcanzado.toLocaleString('es-AR')}
                                                <span className={`text-xs px-2 py-0.5 rounded-full ${meta.alcanzado >= meta.objetivo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                    {((meta.alcanzado / meta.objetivo) * 100).toFixed(1)}%
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-2 px-3">
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className={`h-full rounded-full ${
                                                        (meta.alcanzado / meta.objetivo) >= 1 ? 'bg-green-500' :
                                                        (meta.alcanzado / meta.objetivo) >= 0.9 ? 'bg-yellow-500' : 'bg-red-500'
                                                    }`}
                                                    style={{ width: `${Math.min((meta.alcanzado / meta.objetivo) * 100, 100)}%` }}
                                                ></div>
                                            </div>
                                        </td>
                                        <td className="py-2 px-3">
                                            <div className="flex items-center gap-1">
                                                {meta.crecimiento > 0 ? (
                                                    <TrendingUp size={14} className="text-green-600" />
                                                ) : (
                                                    <TrendingDown size={14} className="text-red-600" />
                                                )}
                                                <span className={meta.crecimiento > 0 ? 'text-green-600' : 'text-red-600'}>
                                                    {meta.crecimiento > 0 ? '+' : ''}{meta.crecimiento}%
                                                </span>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Team Members Table */}
                <div className="mb-6">
                    <h3 className="font-medium text-gray-900 mb-3">Miembros del Equipo</h3>
                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="py-3 px-4 text-left font-medium text-gray-700">Comercial</th>
                                    <th className="py-3 px-4 text-left font-medium text-gray-700">Nivel/Experiencia</th>
                                    <th className="py-3 px-4 text-left font-medium text-gray-700">Ventas Mensuales</th>
                                    <th className="py-3 px-4 text-left font-medium text-gray-700">Objetivo</th>
                                    <th className="py-3 px-4 text-left font-medium text-gray-700">Clientes Nuevos</th>
                                    <th className="py-3 px-4 text-left font-medium text-gray-700">Leads Activos</th>
                                    <th className="py-3 px-4 text-left font-medium text-gray-700">Presupuestos</th>
                                    <th className="py-3 px-4 text-left font-medium text-gray-700">Contratos</th>
                                    <th className="py-3 px-4 text-left font-medium text-gray-700">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {filteredEstadisticas.length === 0 ? (
                                    <tr>
                                        <td colSpan={9} className="py-8 text-center text-gray-500">
                                            No hay datos disponibles
                                        </td>
                                    </tr>
                                ) : (
                                    filteredEstadisticas.map((est) => (
                                        <tr key={est.comercial_id} className="hover:bg-gray-50">
                                            <td className="py-3 px-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-10 w-10 rounded-full bg-local flex items-center justify-center text-white font-semibold">
                                                        {est.nombre_completo.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <div className="font-medium">{est.nombre_completo}</div>
                                                        <div className="text-xs text-gray-500">ID: {est.comercial_id}</div>
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="flex flex-col gap-1">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${getNivelColor(est.nivel)}`}>
                                                        {est.nivel}
                                                    </span>
                                                    <div className="text-xs text-gray-600">{est.experiencia} años</div>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-bold text-gray-900">
                                                    ${est.ventas_mensuales.toLocaleString('es-AR')}
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="space-y-1">
                                                    <div className="text-sm">${est.objetivo_mensual.toLocaleString('es-AR')}</div>
                                                    <span className={`px-2 py-1 text-xs rounded-full ${getRendimientoColor(est.ventas_mensuales, est.objetivo_mensual)}`}>
                                                        {est.objetivo_mensual > 0 ? ((est.ventas_mensuales / est.objetivo_mensual) * 100).toFixed(1) : 0}%
                                                    </span>
                                                </div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-medium">{est.clientes_nuevos}</div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-medium">{est.leads_activos}</div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-medium">{est.presupuestos_pendientes}</div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <div className="font-medium">{est.contratos_activos}</div>
                                            </td>
                                            <td className="py-3 px-4">
                                                <button 
                                                    onClick={() => router.get(`/estadisticas/comercial-individual/${est.comercial_id}`)}
                                                    className="text-sat hover:text-sat-600 text-sm"
                                                >
                                                    Detalles
                                                </button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}