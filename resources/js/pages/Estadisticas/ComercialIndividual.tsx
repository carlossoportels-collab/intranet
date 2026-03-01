// resources/js/Pages/Estadisticas/ComercialIndividual.tsx
import { 
    BarChart3, LineChart, TrendingUp, TrendingDown, 
    User, Target, Award, DollarSign, Users, Star,
    Filter, Download, Calendar, Search
} from 'lucide-react';
import React, { useState } from 'react';

import AppLayout from '@/layouts/app-layout';

interface VendedorStats {
    id: number;
    nombre: string;
    apellido: string;
    ventas_totales: number;
    ventas_mensuales: number;
    objetivo_mensual: number;
    clientes_nuevos: number;
    tasa_conversion: number;
    comision_total: number;
    satisfaccion_cliente: number;
    productos_vendidos: number;
    ventas_por_categoria: {
        categoria: string;
        monto: number;
        porcentaje: number;
    }[];
    tendencia: 'up' | 'down' | 'stable';
    crecimiento_mensual: number;
}

export default function ComercialIndividual() {
    const [periodo, setPeriodo] = useState('este_mes');
    const [busqueda, setBusqueda] = useState('');
    const [vendedorSeleccionado, setVendedorSeleccionado] = useState<number | null>(1);

    const vendedores: VendedorStats[] = [
        {
            id: 1,
            nombre: 'María',
            apellido: 'López',
            ventas_totales: 1250000,
            ventas_mensuales: 450000,
            objetivo_mensual: 400000,
            clientes_nuevos: 15,
            tasa_conversion: 35,
            comision_total: 54000,
            satisfaccion_cliente: 95,
            productos_vendidos: 45,
            ventas_por_categoria: [
                { categoria: 'Servicios Básicos', monto: 180000, porcentaje: 40 },
                { categoria: 'Servicios Premium', monto: 200000, porcentaje: 44 },
                { categoria: 'Accesorios', monto: 70000, porcentaje: 16 }
            ],
            tendencia: 'up',
            crecimiento_mensual: 12
        },
        {
            id: 2,
            nombre: 'Juan',
            apellido: 'Pérez',
            ventas_totales: 980000,
            ventas_mensuales: 320000,
            objetivo_mensual: 300000,
            clientes_nuevos: 12,
            tasa_conversion: 28,
            comision_total: 32000,
            satisfaccion_cliente: 92,
            productos_vendidos: 32,
            ventas_por_categoria: [
                { categoria: 'Servicios Básicos', monto: 150000, porcentaje: 47 },
                { categoria: 'Servicios Premium', monto: 120000, porcentaje: 38 },
                { categoria: 'Accesorios', monto: 50000, porcentaje: 15 }
            ],
            tendencia: 'up',
            crecimiento_mensual: 8
        },
        // ... más vendedores
    ];

    const calcularTotales = () => {
        const totalVentas = vendedores.reduce((sum, v) => sum + v.ventas_mensuales, 0);
        const totalObjetivo = vendedores.reduce((sum, v) => sum + v.objetivo_mensual, 0);
        const totalClientesNuevos = vendedores.reduce((sum, v) => sum + v.clientes_nuevos, 0);
        
        return {
            totalVentas,
            totalObjetivo,
            porcentajeCumplimiento: totalObjetivo > 0 ? (totalVentas / totalObjetivo) * 100 : 0,
            totalClientesNuevos,
            promedioConversion: vendedores.reduce((sum, v) => sum + v.tasa_conversion, 0) / vendedores.length
        };
    };

    const totales = calcularTotales();
    const vendedorDetalle = vendedores.find(v => v.id === vendedorSeleccionado) || vendedores[0];

    return (
        <AppLayout title="Rendimiento Individual">
            <div className="mb-6">
                <h1 className="text-3xl font-bold text-gray-900">
                    Rendimiento Individual
                </h1>
                <p className="mt-1 text-gray-600 text-base">
                    Análisis detallado del desempeño por vendedor
                </p>
            </div>

            {/* Filtros y Controles */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Buscar vendedor
                        </label>
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                            <input
                                type="text"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                placeholder="Nombre, apellido..."
                                className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded focus:ring-sat focus:border-sat"
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Período
                        </label>
                        <select
                            value={periodo}
                            onChange={(e) => setPeriodo(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-sat focus:border-sat"
                        >
                            <option value="este_mes">Este mes</option>
                            <option value="mes_anterior">Mes anterior</option>
                            <option value="ultimos_3_meses">Últimos 3 meses</option>
                            <option value="ano_actual">Año actual</option>
                        </select>
                    </div>
                    <div className="flex items-end">
                        <button className="w-full px-4 py-2 bg-sat text-white text-sm rounded hover:bg-sat-600 transition-colors flex items-center justify-center gap-2">
                            <Download size={16} />
                            Exportar
                        </button>
                    </div>
                </div>
            </div>

            {/* Resumen General */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-700">Ventas Totales</div>
                        <DollarSign size={20} className="text-green-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        ${totales.totalVentas.toLocaleString('es-AR')}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                        {totales.porcentajeCumplimiento.toFixed(1)}% del objetivo
                    </div>
                </div>

                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-700">Clientes Nuevos</div>
                        <Users size={20} className="text-blue-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {totales.totalClientesNuevos}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                        {vendedores.length} vendedores activos
                    </div>
                </div>

                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-700">Tasa Conversión</div>
                        <Target size={20} className="text-purple-600" />
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {totales.promedioConversion.toFixed(1)}%
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                        Promedio del equipo
                    </div>
                </div>

                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center justify-between mb-2">
                        <div className="text-sm font-medium text-gray-700">Top Performer</div>
                        <Award size={20} className="text-amber-600" />
                    </div>
                    <div className="text-lg font-bold text-gray-900">
                        {vendedores.reduce((max, v) => v.ventas_mensuales > max.ventas_mensuales ? v : max).nombre}
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                        ${Math.max(...vendedores.map(v => v.ventas_mensuales)).toLocaleString('es-AR')} en ventas
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Lista de Vendedores */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-4 border-b border-gray-200">
                            <h3 className="font-medium text-gray-900">Vendedores</h3>
                            <p className="text-sm text-gray-600">Seleccione para ver detalles</p>
                        </div>
                        <div className="max-h-[500px] overflow-y-auto">
                            {vendedores.map((vendedor) => (
                                <div
                                    key={vendedor.id}
                                    onClick={() => setVendedorSeleccionado(vendedor.id)}
                                    className={`p-4 border-b border-gray-100 cursor-pointer transition-colors hover:bg-gray-50 ${
                                        vendedorSeleccionado === vendedor.id ? 'bg-blue-50 border-l-4 border-l-blue-500' : ''
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <div className="flex items-center gap-3">
                                            <div className="h-10 w-10 rounded-full bg-sat flex items-center justify-center text-white font-semibold">
                                                {vendedor.nombre.charAt(0)}{vendedor.apellido.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium">{vendedor.nombre} {vendedor.apellido}</div>
                                                <div className="text-xs text-gray-500">
                                                    ${vendedor.ventas_mensuales.toLocaleString('es-AR')} mensual
                                                </div>
                                            </div>
                                        </div>
                                        <div className="flex flex-col items-end">
                                            <div className={`flex items-center gap-1 ${
                                                vendedor.tendencia === 'up' ? 'text-green-600' : 
                                                vendedor.tendencia === 'down' ? 'text-red-600' : 'text-gray-600'
                                            }`}>
                                                {vendedor.tendencia === 'up' ? (
                                                    <TrendingUp size={14} />
                                                ) : vendedor.tendencia === 'down' ? (
                                                    <TrendingDown size={14} />
                                                ) : null}
                                                <span className="text-xs font-medium">
                                                    {vendedor.crecimiento_mensual > 0 ? '+' : ''}{vendedor.crecimiento_mensual}%
                                                </span>
                                            </div>
                                            <div className={`text-xs px-2 py-1 rounded-full mt-1 ${
                                                (vendedor.ventas_mensuales / vendedor.objetivo_mensual) >= 1 ? 'bg-green-100 text-green-800' :
                                                (vendedor.ventas_mensuales / vendedor.objetivo_mensual) >= 0.9 ? 'bg-yellow-100 text-yellow-800' :
                                                'bg-red-100 text-red-800'
                                            }`}>
                                                {((vendedor.ventas_mensuales / vendedor.objetivo_mensual) * 100).toFixed(1)}%
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-between text-xs text-gray-600">
                                        <span>{vendedor.clientes_nuevos} nuevos clientes</span>
                                        <span>{vendedor.tasa_conversion}% conversión</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Detalle del Vendedor Seleccionado */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="p-6">
                            <div className="flex items-center justify-between mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-full bg-sat flex items-center justify-center text-white font-bold text-xl">
                                        {vendedorDetalle.nombre.charAt(0)}{vendedorDetalle.apellido.charAt(0)}
                                    </div>
                                    <div>
                                        <h3 className="text-xl font-bold text-gray-900">
                                            {vendedorDetalle.nombre} {vendedorDetalle.apellido}
                                        </h3>
                                        <p className="text-gray-600">
                                            Ventas mensuales: ${vendedorDetalle.ventas_mensuales.toLocaleString('es-AR')}
                                        </p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <div className="text-2xl font-bold text-gray-900">
                                        ${vendedorDetalle.comision_total.toLocaleString('es-AR')}
                                    </div>
                                    <div className="text-sm text-gray-600">Comisión total</div>
                                </div>
                            </div>

                            {/* Métricas del Vendedor */}
                            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                                <div className="p-3 bg-gray-50 rounded border">
                                    <div className="text-xs text-gray-600 mb-1">Objetivo</div>
                                    <div className="font-bold text-gray-900">
                                        ${vendedorDetalle.objetivo_mensual.toLocaleString('es-AR')}
                                    </div>
                                    <div className={`text-xs mt-1 ${
                                        (vendedorDetalle.ventas_mensuales / vendedorDetalle.objetivo_mensual) >= 1 ? 'text-green-600' :
                                        (vendedorDetalle.ventas_mensuales / vendedorDetalle.objetivo_mensual) >= 0.9 ? 'text-yellow-600' :
                                        'text-red-600'
                                    }`}>
                                        {((vendedorDetalle.ventas_mensuales / vendedorDetalle.objetivo_mensual) * 100).toFixed(1)}% cumplido
                                    </div>
                                </div>

                                <div className="p-3 bg-gray-50 rounded border">
                                    <div className="text-xs text-gray-600 mb-1">Clientes Nuevos</div>
                                    <div className="font-bold text-gray-900">{vendedorDetalle.clientes_nuevos}</div>
                                    <div className="text-xs text-gray-600 mt-1">Este mes</div>
                                </div>

                                <div className="p-3 bg-gray-50 rounded border">
                                    <div className="text-xs text-gray-600 mb-1">Tasa Conversión</div>
                                    <div className="font-bold text-gray-900">{vendedorDetalle.tasa_conversion}%</div>
                                    <div className="text-xs text-gray-600 mt-1">De prospectos a clientes</div>
                                </div>

                                <div className="p-3 bg-gray-50 rounded border">
                                    <div className="text-xs text-gray-600 mb-1">Satisfacción</div>
                                    <div className="font-bold text-gray-900">{vendedorDetalle.satisfaccion_cliente}%</div>
                                    <div className="text-xs text-gray-600 mt-1">Clientes satisfechos</div>
                                </div>
                            </div>

                            {/* Distribución de Ventas por Categoría */}
                            <div className="mb-6">
                                <h4 className="font-medium text-gray-900 mb-3">Distribución por Categoría</h4>
                                <div className="space-y-3">
                                    {vendedorDetalle.ventas_por_categoria.map((cat, index) => (
                                        <div key={index} className="space-y-1">
                                            <div className="flex justify-between text-sm">
                                                <span className="text-gray-700">{cat.categoria}</span>
                                                <span className="font-medium">
                                                    ${cat.monto.toLocaleString('es-AR')} ({cat.porcentaje}%)
                                                </span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="h-full rounded-full bg-sat"
                                                    style={{ width: `${cat.porcentaje}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Resumen */}
                            <div className="p-4 bg-blue-50 rounded border border-blue-100">
                                <h4 className="font-medium text-blue-900 mb-2">Resumen de Desempeño</h4>
                                <p className="text-sm text-blue-800">
                                    {vendedorDetalle.nombre} ha superado su objetivo mensual en un {vendedorDetalle.crecimiento_mensual}%, 
                                    con una excelente tasa de conversión del {vendedorDetalle.tasa_conversion}%. 
                                    Su mayor fortaleza es en {vendedorDetalle.ventas_por_categoria[1]?.categoria || 'Servicios Premium'}.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}