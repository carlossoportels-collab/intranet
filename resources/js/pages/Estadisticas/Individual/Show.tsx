// resources/js/Pages/Estadisticas/Individual/Show.tsx

import React, { useState } from 'react';
import { Head, usePage, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    TrendingUp, Users, FileText, FileCheck, DollarSign,
    Target, PieChart, Calendar, Clock, Award,
    ArrowUp, ArrowDown, CheckCircle, XCircle, Activity,
    Phone, Mail, MapPin, Star, TrendingDown, BarChart3,
    MessageSquare, Package, Timer, Medal, Crown
} from 'lucide-react';

interface Props {
    periodo: string;
    comercial: {
        id: number;
        nombre: string;
        prefijo_codigo: string;
        email: string | null;
        telefono: string | null;
    };
    resumenPersonal: {
        total_leads: number;
        leads_activos: number;
        leads_convertidos: number;
        leads_perdidos: number;
        total_presupuestos: number;
        total_contratos: number;
        valor_presupuestos: number;
        valor_promedio_contrato: number;
        tasa_conversion: number;
        efectividad_presupuestos: number;
        total_notas: number;
    };
    evolucionMensual: Array<{
        mes: string;
        nombre_mes: string;
        leads: number;
        contratos: number;
        valor: number;
    }>;
    distribucionEstados: Array<{
        nombre: string;
        color_hex: string;
        total: number;
    }>;
    actividadReciente: Array<{
        id: number;
        tipo: 'nota' | 'comentario';
        lead_nombre: string;
        contenido: string;
        fecha_formateada: string;
        usuario: string;
    }>;
    topProductos: Array<{
        nombre: string;
        tipo: string;
        cantidad: number;
        total_vendido: number;
    }>;
    tiemposPromedio: {
        promedio_lead_presupuesto: number;
        promedio_presupuesto_contrato: number;
        promedio_total: number;
        muestras: number;
    };
    comparativaPromedio: {
        tasa_comercial: number;
        tasa_equipo: number;
        diferencia: number;
        performance: 'superior' | 'inferior' | 'promedio';
    };
}

export default function EstadisticasIndividualShow({ 
    periodo,
    comercial,
    resumenPersonal,
    evolucionMensual,
    distribucionEstados,
    actividadReciente,
    topProductos,
    tiemposPromedio,
    comparativaPromedio
}: Props) {
    const [selectedPeriodo, setSelectedPeriodo] = useState(periodo);
    
    const periodos = [
        { value: 'hoy', label: 'Hoy' },
        { value: 'semana_actual', label: 'Esta Semana' },
        { value: 'mes_actual', label: 'Este Mes' },
        { value: 'mes_pasado', label: 'Mes Pasado' },
        { value: 'trimestre_actual', label: 'Este Trimestre' },
        { value: 'anio_actual', label: 'Este Año' },
    ];
    
    const handlePeriodoChange = (nuevoPeriodo: string) => {
        setSelectedPeriodo(nuevoPeriodo);
        router.get(`/estadisticas/comercial/${comercial.id}`, { periodo: nuevoPeriodo }, {
            preserveState: true,
            preserveScroll: true,
        });
    };
    
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };
    
    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('es-AR').format(value);
    };
    
    const getPerformanceColor = (performance: string) => {
        switch(performance) {
            case 'superior': return 'text-green-600 bg-green-100';
            case 'inferior': return 'text-red-600 bg-red-100';
            default: return 'text-yellow-600 bg-yellow-100';
        }
    };
    
    const getPerformanceIcon = (performance: string) => {
        switch(performance) {
            case 'superior': return <TrendingUp size={16} />;
            case 'inferior': return <TrendingDown size={16} />;
            default: return <Minus size={16} />;
        }
    };
    
    // Tarjeta de métrica personalizada
    const MetricCard = ({ title, value, subtitle, icon: Icon, color, trend }: any) => (
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
                <div>
                    <p className="text-sm text-gray-500 mb-1">{title}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                    {subtitle && <p className="text-xs text-gray-400 mt-1">{subtitle}</p>}
                    {trend && (
                        <div className={`flex items-center gap-1 mt-2 text-xs ${trend.positive ? 'text-green-600' : 'text-red-600'}`}>
                            {trend.positive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                            <span>{trend.value}% vs período anterior</span>
                        </div>
                    )}
                </div>
                <div className={`p-3 rounded-full ${color}`}>
                    <Icon className="text-white" size={24} />
                </div>
            </div>
        </div>
    );
    
    return (
        <AppLayout>
            <Head title={`Estadísticas - ${comercial.nombre}`} />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header con info del comercial */}
                    <div className="mb-6">
                        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                            <div>
                                <div className="flex items-center gap-3">
                                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                        <span className="text-white text-xl font-bold">
                                            {comercial.nombre.charAt(0)}
                                        </span>
                                    </div>
                                    <div>
                                        <h1 className="text-2xl font-bold text-gray-900">{comercial.nombre}</h1>
                                        <div className="flex items-center gap-3 mt-1">
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                                                Prefijo: {comercial.prefijo_codigo}
                                            </span>
                                            {comercial.email && (
                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Mail size={12} /> {comercial.email}
                                                </span>
                                            )}
                                            {comercial.telefono && (
                                                <span className="flex items-center gap-1 text-xs text-gray-500">
                                                    <Phone size={12} /> {comercial.telefono}
                                                </span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Selector de período */}
                            <div className="flex gap-2 bg-gray-100 rounded-lg p-1">
                                {periodos.map(p => (
                                    <button
                                        key={p.value}
                                        onClick={() => handlePeriodoChange(p.value)}
                                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                                            selectedPeriodo === p.value
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-600 hover:bg-gray-200'
                                        }`}
                                    >
                                        {p.label}
                                    </button>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Badge de performance */}
                    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg ${getPerformanceColor(comparativaPromedio.performance)} mb-6`}>
                        {getPerformanceIcon(comparativaPromedio.performance)}
                        <span className="text-sm font-medium">
                            Rendimiento {comparativaPromedio.performance === 'superior' ? 'superior al equipo' : 
                                comparativaPromedio.performance === 'inferior' ? 'inferior al equipo' : 'en línea con el equipo'}
                        </span>
                        <span className="text-xs opacity-75">
                            (Tasa: {comparativaPromedio.tasa_comercial}% vs {comparativaPromedio.tasa_equipo}% equipo)
                        </span>
                    </div>
                    
                    {/* Tarjetas de resumen */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <MetricCard
                            title="Leads Gestionados"
                            value={formatNumber(resumenPersonal.total_leads)}
                            subtitle={`${resumenPersonal.leads_activos} activos, ${resumenPersonal.leads_convertidos} convertidos`}
                            icon={Users}
                            color="bg-blue-500"
                        />
                        <MetricCard
                            title="Tasa de Conversión"
                            value={`${resumenPersonal.tasa_conversion}%`}
                            subtitle={`${formatNumber(resumenPersonal.total_contratos)} contratos`}
                            icon={Target}
                            color="bg-green-500"
                        />
                        <MetricCard
                            title="Presupuestos"
                            value={formatNumber(resumenPersonal.total_presupuestos)}
                            subtitle={`Efectividad: ${resumenPersonal.efectividad_presupuestos}%`}
                            icon={FileText}
                            color="bg-purple-500"
                        />
                        <MetricCard
                            title="Valor Generado"
                            value={formatCurrency(resumenPersonal.valor_presupuestos)}
                            subtitle={`Promedio: ${formatCurrency(resumenPersonal.valor_promedio_contrato)}`}
                            icon={DollarSign}
                            color="bg-yellow-500"
                        />
                    </div>
                    
                    {/* Segunda fila de métricas */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500">Leads Perdidos</span>
                                <XCircle size={18} className="text-red-400" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{formatNumber(resumenPersonal.leads_perdidos)}</p>
                            <p className="text-xs text-gray-400 mt-1">
                                {resumenPersonal.total_leads > 0 
                                    ? `${((resumenPersonal.leads_perdidos / resumenPersonal.total_leads) * 100).toFixed(1)}% del total`
                                    : '0% del total'}
                            </p>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500">Notas/Actividad</span>
                                <MessageSquare size={18} className="text-blue-400" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{formatNumber(resumenPersonal.total_notas)}</p>
                            <p className="text-xs text-gray-400 mt-1">registros en el período</p>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500">Ciclo Promedio</span>
                                <Timer size={18} className="text-orange-400" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{tiemposPromedio.promedio_total} días</p>
                            <p className="text-xs text-gray-400 mt-1">
                                Lead → Contrato
                                {tiemposPromedio.muestras > 0 && ` (${tiemposPromedio.muestras} muestras)`}
                            </p>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm p-4 border border-gray-100">
                            <div className="flex items-center justify-between mb-2">
                                <span className="text-sm text-gray-500">Valor/Contrato</span>
                                <Award size={18} className="text-green-400" />
                            </div>
                            <p className="text-2xl font-bold text-gray-900">{formatCurrency(resumenPersonal.valor_promedio_contrato)}</p>
                            <p className="text-xs text-gray-400 mt-1">ticket promedio</p>
                        </div>
                    </div>
                    
                    {/* Gráfico de evolución mensual */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <BarChart3 size={20} className="text-gray-500" />
                                <h2 className="text-lg font-semibold text-gray-900">Evolución Mensual</h2>
                            </div>
                        </div>
                        <div className="p-6">
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mes</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Leads</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Contratos</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Valor Generado</th>
                                            <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Conversión</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100">
                                        {evolucionMensual.map((mes, idx) => {
                                            const conversion = mes.leads > 0 ? ((mes.contratos / mes.leads) * 100).toFixed(1) : 0;
                                            return (
                                                <tr key={mes.mes} className="hover:bg-gray-50">
                                                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{mes.nombre_mes}</td>
                                                    <td className="px-4 py-3 text-sm text-right text-gray-600">{formatNumber(mes.leads)}</td>
                                                    <td className="px-4 py-3 text-sm text-right">
                                                        <span className="font-semibold text-green-600">{formatNumber(mes.contratos)}</span>
                                                    </td>
                                                    <td className="px-4 py-3 text-sm text-right text-gray-900">{formatCurrency(mes.valor)}</td>
                                                    <td className="px-4 py-3 text-right">
                                                        <span className={`text-sm font-medium ${
                                                            Number(conversion) >= 20 ? 'text-green-600' : 
                                                            Number(conversion) >= 10 ? 'text-yellow-600' : 'text-gray-500'
                                                        }`}>
                                                            {conversion}%
                                                        </span>
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                        {evolucionMensual.length === 0 && (
                                            <tr>
                                                <td colSpan={5} className="px-4 py-8 text-center text-gray-500">
                                                    No hay datos disponibles
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                    
                    {/* Distribución de estados y Top productos */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Distribución de estados */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <PieChart size={20} className="text-gray-500" />
                                <h2 className="text-lg font-semibold text-gray-900">Estado de sus Leads</h2>
                            </div>
                            <div className="space-y-3">
                                {distribucionEstados.map(estado => (
                                    <div key={estado.nombre} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div 
                                                className="w-3 h-3 rounded-full" 
                                                style={{ backgroundColor: estado.color_hex || '#CBD5E1' }}
                                            />
                                            <span className="text-sm text-gray-700">{estado.nombre}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-medium text-gray-900">{formatNumber(estado.total)}</span>
                                            <div className="w-24 bg-gray-200 rounded-full h-1.5">
                                                <div 
                                                    className="bg-blue-600 rounded-full h-1.5 transition-all"
                                                    style={{ width: `${(estado.total / resumenPersonal.total_leads) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {distribucionEstados.length === 0 && (
                                    <p className="text-gray-500 text-sm">No hay datos disponibles</p>
                                )}
                            </div>
                        </div>
                        
                        {/* Top productos vendidos */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Package size={20} className="text-gray-500" />
                                <h2 className="text-lg font-semibold text-gray-900">Productos más Vendidos</h2>
                            </div>
                            <div className="space-y-3">
                                {topProductos.map((producto, idx) => (
                                    <div key={producto.nombre} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded-lg">
                                        <div className="flex items-center gap-3">
                                            {idx === 0 && <Crown size={16} className="text-yellow-500" />}
                                            <div>
                                                <p className="text-sm font-medium text-gray-900">{producto.nombre}</p>
                                                <p className="text-xs text-gray-500">{producto.tipo}</p>
                                            </div>
                                        </div>
                                        <div className="text-right">
                                            <p className="text-sm font-semibold text-gray-900">{formatNumber(producto.cantidad)} uds.</p>
                                            <p className="text-xs text-gray-500">{formatCurrency(producto.total_vendido)}</p>
                                        </div>
                                    </div>
                                ))}
                                {topProductos.length === 0 && (
                                    <p className="text-gray-500 text-sm">No hay productos registrados</p>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Tiempos del ciclo de venta */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-blue-700">Lead → Presupuesto</span>
                                <Clock size={20} className="text-blue-600" />
                            </div>
                            <p className="text-3xl font-bold text-blue-900">{tiemposPromedio.promedio_lead_presupuesto} días</p>
                            <p className="text-xs text-blue-600 mt-2">tiempo promedio hasta primer presupuesto</p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-purple-700">Presupuesto → Contrato</span>
                                <FileCheck size={20} className="text-purple-600" />
                            </div>
                            <p className="text-3xl font-bold text-purple-900">{tiemposPromedio.promedio_presupuesto_contrato} días</p>
                            <p className="text-xs text-purple-600 mt-2">tiempo de cierre después del presupuesto</p>
                        </div>
                        
                        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6">
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-sm font-medium text-green-700">Ciclo Total</span>
                                <Activity size={20} className="text-green-600" />
                            </div>
                            <p className="text-3xl font-bold text-green-900">{tiemposPromedio.promedio_total} días</p>
                            <p className="text-xs text-green-600 mt-2">lead → contrato firmado</p>
                        </div>
                    </div>
                    
                    {/* Actividad reciente */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <Activity size={20} className="text-gray-500" />
                                <h2 className="text-lg font-semibold text-gray-900">Actividad Reciente</h2>
                            </div>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {actividadReciente.map((actividad) => (
                                <div key={actividad.id} className="p-4 hover:bg-gray-50">
                                    <div className="flex items-start gap-3">
                                        <div className={`p-2 rounded-full ${
                                            actividad.tipo === 'nota' ? 'bg-blue-100' : 'bg-gray-100'
                                        }`}>
                                            {actividad.tipo === 'nota' ? (
                                                <MessageSquare size={14} className="text-blue-600" />
                                            ) : (
                                                <MessageSquare size={14} className="text-gray-600" />
                                            )}
                                        </div>
                                        <div className="flex-1">
                                            <div className="flex items-center justify-between mb-1">
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        {actividad.lead_nombre}
                                                    </span>
                                                    <span className="text-xs text-gray-400">•</span>
                                                    <span className="text-xs text-gray-500">{actividad.usuario}</span>
                                                </div>
                                                <span className="text-xs text-gray-400">{actividad.fecha_formateada}</span>
                                            </div>
                                            <p className="text-sm text-gray-600 line-clamp-2">{actividad.contenido}</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            {actividadReciente.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    No hay actividad reciente
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}

// Componente Minus para el caso promedio
const Minus = ({ size }: { size: number }) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
        <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
);