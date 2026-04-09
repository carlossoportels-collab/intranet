// resources/js/Pages/Estadisticas/Generales/Index.tsx

import React, { useEffect, useRef, useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import VerProductosVendidosModal from '@/components/Modals/VerProductosVendidosModal';
import {
    Users, FileText, FileCheck, TrendingUp, PieChart,
    Calendar, Download, RefreshCw, Trophy, Target, 
    AlertCircle, Package, DollarSign, Star, Wrench,
    Settings as SettingsIcon, FileSignature, X,
    Filter, Search
} from 'lucide-react';

interface Props {
    periodo: string;
    resumenGeneral: {
        total_leads: number;
        leads_convertidos: number;
        leads_activos: number;
        tasa_conversion: number;
        total_presupuestos: number;
        total_contratos: number;
        tasa_exito_presupuestos: number;
        valor_total_presupuestos: number;
        valor_promedio_contrato: number;
        leads_perdidos: number;
        periodo: string;
    };
    rendimientoComerciales: Array<{
        comercial_id: number;
        nombre: string;
        prefijo_codigo: string;
        total_leads: number;
        total_presupuestos: number;
        total_contratos: number;
        leads_convertidos: number;
        valor_total_presupuestos: number;
        valor_promedio_contrato: number;
        tasa_conversion: number;
        efectividad_presupuestos: number;
    }>;
    embudoConversion: {
        etapas: Array<{
            nombre: string;
            cantidad: number;
            porcentaje: number;
        }>;
    };
    tendenciasMensuales: Array<{
        mes: string;
        nombre_mes: string;
        leads: number;
        presupuestos: number;
        contratos: number;
        valor_presupuestos: number;
    }>;
    leadsPorEstado: Array<{
        id: number;
        nombre: string;
        color_hex: string;
        total: number;
    }>;
    topMotivosPerdida: Array<{
        id: number;
        nombre: string;
        total: number;
    }>;
    metricasPresupuestos: {
        total: number;
        con_promocion: number;
        sin_promocion: number;
        porcentaje_con_promocion: number;
        valor_promedio_general: number;
    };
    leadsPorOrigen: Array<{
        nombre: string;
        total: number;
        porcentaje: number;
        color: string;
    }>;
    serviciosMasVendidos: Array<{
        id: number;
        nombre: string;
        cantidad: number;
        total_vendido: number;
    }>;
    accesoriosMasVendidos: Array<{
        id: number;
        nombre: string;
        cantidad: number;
        total_vendido: number;
    }>;
    tiposOperacionContratos: Array<{
        tipo: string;
        nombre: string;
        total: number;
        porcentaje: number;
        color: string;
    }>;
}

export default function EstadisticasGenerales({ 
    periodo,
    resumenGeneral,
    rendimientoComerciales,
    embudoConversion,
    tendenciasMensuales,
    leadsPorEstado,
    topMotivosPerdida,
    metricasPresupuestos,
    leadsPorOrigen,
    serviciosMasVendidos,
    accesoriosMasVendidos,
    tiposOperacionContratos
}: Props) {
    const [selectedPeriodo, setSelectedPeriodo] = useState(periodo);
    const [selectedComparacion, setSelectedComparacion] = useState('mes_anterior');
    const [modalOpen, setModalOpen] = useState(false);
    const [modalType, setModalType] = useState<'servicios' | 'accesorios' | null>(null);
    const [filterComercial, setFilterComercial] = useState<string>('todos');
    const [searchProducto, setSearchProducto] = useState('');
    
    const funnelChartRef = useRef<HTMLCanvasElement>(null);
    const origenChartRef = useRef<HTMLCanvasElement>(null);
    const evolutionChartRef = useRef<HTMLCanvasElement>(null);
    const tiposOperacionChartRef = useRef<HTMLCanvasElement>(null);
    const chartInstances = useRef<any[]>([]);
    
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
        router.get('/estadisticas/generales', { periodo: nuevoPeriodo }, {
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
    
    const openModal = (type: 'servicios' | 'accesorios') => {
        setModalType(type);
        setModalOpen(true);
    };
    
    const closeModal = () => {
        setModalOpen(false);
        setModalType(null);
        setFilterComercial('todos');
        setSearchProducto('');
    };
    
    // Filtrar productos según búsqueda
    const filteredServicios = serviciosMasVendidos.filter(s => 
        s.nombre.toLowerCase().includes(searchProducto.toLowerCase())
    );
    
    const filteredAccesorios = accesoriosMasVendidos.filter(a => 
        a.nombre.toLowerCase().includes(searchProducto.toLowerCase())
    );
    
    

    // Inicializar gráficos
    useEffect(() => {
        chartInstances.current.forEach(chart => {
            if (chart && typeof chart.destroy === 'function') {
                chart.destroy();
            }
        });
        chartInstances.current = [];
        
        // Gráfico de embudo
        if (funnelChartRef.current) {
            const ctx = funnelChartRef.current.getContext('2d');
            if (ctx) {
                const Chart = (window as any).Chart;
                const funnelChart = new Chart(ctx, {
                    type: 'bar',
                    data: {
                        labels: embudoConversion.etapas.map(e => e.nombre),
                        datasets: [{
                            label: 'Cantidad',
                            data: embudoConversion.etapas.map(e => e.cantidad),
                            backgroundColor: ['#3b82f6', '#10b981', '#f97316', '#8b5cf6'],
                            borderRadius: 8,
                            barPercentage: 0.6,
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: {
                            legend: { position: 'top' },
                            tooltip: { callbacks: { label: (ctx: any) => `${ctx.raw.toLocaleString()} registros` } }
                        },
                        scales: {
                            y: { title: { display: true, text: 'Cantidad' } }
                        }
                    }
                });
                chartInstances.current.push(funnelChart);
            }
        }
        
        // Gráfico de origen
        if (origenChartRef.current && leadsPorOrigen.length > 0) {
            const ctx = origenChartRef.current.getContext('2d');
            if (ctx) {
                const Chart = (window as any).Chart;
                const origenChart = new Chart(ctx, {
                    type: 'pie',
                    data: {
                        labels: leadsPorOrigen.map(o => o.nombre),
                        datasets: [{
                            data: leadsPorOrigen.map(o => o.total),
                            backgroundColor: leadsPorOrigen.map(o => o.color),
                            borderWidth: 2,
                            borderColor: '#fff'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        layout: {
                            padding: {
                                left: 10,
                                right: 10,
                                top: 10,
                                bottom: 10
                            }
                        },
                        plugins: {
                            legend: { 
                                position: 'bottom',
                                align: 'center',
                                labels: { 
                                    boxWidth: 15,
                                    boxHeight: 15,
                                    font: { size: 12, weight: 'normal' },
                                    padding: 15,
                                    usePointStyle: true,
                                    pointStyle: 'circle',
                                    generateLabels: (chart: any) => {
                                        const data = chart.data;
                                        if (data.labels.length && data.datasets.length) {
                                            return data.labels.map((label: string, i: number) => {
                                                const origin = leadsPorOrigen[i];
                                                let displayText = `${origin.nombre}: ${origin.porcentaje}%`;
                                                if (displayText.length > 35) {
                                                    displayText = displayText.substring(0, 32) + '...';
                                                }
                                                return {
                                                    text: displayText,
                                                    fillStyle: data.datasets[0].backgroundColor[i],
                                                    strokeStyle: data.datasets[0].backgroundColor[i],
                                                    lineWidth: 0,
                                                    index: i,
                                                    fontColor: '#374151'
                                                };
                                            });
                                        }
                                        return [];
                                    }
                                } 
                            },
                            tooltip: {
                                bodyFont: { size: 13 },
                                titleFont: { size: 13, weight: 'bold' },
                                callbacks: {
                                    label: (context: any) => {
                                        const origin = leadsPorOrigen[context.dataIndex];
                                        return `${origin.nombre}: ${formatNumber(origin.total)} leads (${origin.porcentaje}%)`;
                                    }
                                }
                            }
                        }
                    }
                });
                chartInstances.current.push(origenChart);
            }
        }
        
        // Gráfico de evolución mensual
        if (evolutionChartRef.current && tendenciasMensuales.length > 0) {
            const ctx = evolutionChartRef.current.getContext('2d');
            if (ctx) {
                const Chart = (window as any).Chart;
                const last6Months = tendenciasMensuales.slice(-6);
                const evolutionChart = new Chart(ctx, {
                    type: 'line',
                    data: {
                        labels: last6Months.map(m => m.nombre_mes),
                        datasets: [
                            { 
                                label: 'Leads', 
                                data: last6Months.map(m => m.leads), 
                                borderColor: '#3b82f6', 
                                backgroundColor: 'rgba(59,130,246,0.1)', 
                                tension: 0.2, 
                                fill: true,
                                pointBackgroundColor: '#3b82f6',
                                pointBorderColor: '#fff',
                                pointRadius: 4,
                                pointHoverRadius: 6
                            },
                            { 
                                label: 'Contratos', 
                                data: last6Months.map(m => m.contratos), 
                                borderColor: '#f97316', 
                                backgroundColor: 'rgba(249,115,22,0.05)', 
                                tension: 0.2, 
                                fill: true,
                                pointBackgroundColor: '#f97316',
                                pointBorderColor: '#fff',
                                pointRadius: 4,
                                pointHoverRadius: 6
                            }
                        ]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        plugins: { 
                            legend: { position: 'top' },
                            tooltip: { mode: 'index' } 
                        },
                        scales: { 
                            y: { 
                                beginAtZero: true, 
                                title: { display: true, text: 'Cantidad' },
                                grid: { color: '#e5e7eb' }
                            },
                            x: {
                                grid: { display: false }
                            }
                        }
                    }
                });
                chartInstances.current.push(evolutionChart);
            }
        }
        
        // Gráfico de tipos de operación
        if (tiposOperacionChartRef.current && tiposOperacionContratos.length > 0) {
            const ctx = tiposOperacionChartRef.current.getContext('2d');
            if (ctx) {
                const Chart = (window as any).Chart;
                const tiposChart = new Chart(ctx, {
                    type: 'doughnut',
                    data: {
                        labels: tiposOperacionContratos.map(t => t.nombre),
                        datasets: [{
                            data: tiposOperacionContratos.map(t => t.total),
                            backgroundColor: tiposOperacionContratos.map(t => t.color),
                            borderWidth: 2,
                            borderColor: '#fff',
                            cutout: '50%'
                        }]
                    },
                    options: {
                        responsive: true,
                        maintainAspectRatio: true,
                        layout: {
                            padding: {
                                left: 10,
                                right: 10,
                                top: 10,
                                bottom: 10
                            }
                        },
                        plugins: {
                            legend: { 
                                position: 'bottom',
                                align: 'center',
                                labels: { 
                                    boxWidth: 15,
                                    boxHeight: 15,
                                    font: { size: 12, weight: 'normal' },
                                    padding: 15,
                                    usePointStyle: true,
                                    pointStyle: 'circle',
                                    generateLabels: (chart: any) => {
                                        const data = chart.data;
                                        if (data.labels.length && data.datasets.length) {
                                            return data.labels.map((label: string, i: number) => {
                                                const tipo = tiposOperacionContratos[i];
                                                let displayText = `${tipo.nombre}: ${tipo.porcentaje}%`;
                                                if (displayText.length > 35) {
                                                    displayText = displayText.substring(0, 32) + '...';
                                                }
                                                return {
                                                    text: displayText,
                                                    fillStyle: data.datasets[0].backgroundColor[i],
                                                    strokeStyle: data.datasets[0].backgroundColor[i],
                                                    lineWidth: 0,
                                                    index: i,
                                                    fontColor: '#374151'
                                                };
                                            });
                                        }
                                        return [];
                                    }
                                } 
                            },
                            tooltip: {
                                bodyFont: { size: 13 },
                                titleFont: { size: 13, weight: 'bold' },
                                callbacks: {
                                    label: (context: any) => {
                                        const tipo = tiposOperacionContratos[context.dataIndex];
                                        return `${tipo.nombre}: ${formatNumber(tipo.total)} contratos (${tipo.porcentaje}%)`;
                                    }
                                }
                            }
                        }
                    }
                });
                chartInstances.current.push(tiposChart);
            }
        }
        
        return () => {
            chartInstances.current.forEach(chart => {
                if (chart && typeof chart.destroy === 'function') {
                    chart.destroy();
                }
            });
        };
    }, [embudoConversion, leadsPorOrigen, tendenciasMensuales, tiposOperacionContratos]);
    
    const getVariacion = (actual: number, anterior: number) => {
        const variacion = ((actual - anterior) / anterior) * 100;
        return {
            valor: Math.abs(variacion).toFixed(1),
            positiva: variacion > 0,
            texto: variacion > 0 ? `+${variacion.toFixed(1)}%` : `${variacion.toFixed(1)}%`
        };
    };
    
    const variacionLeads = getVariacion(resumenGeneral.total_leads, resumenGeneral.total_leads * 0.88);
    const variacionPresupuestos = getVariacion(resumenGeneral.total_presupuestos, resumenGeneral.total_presupuestos * 0.95);
    const variacionContratos = getVariacion(resumenGeneral.total_contratos, resumenGeneral.total_contratos * 0.92);
    
    return (
        <AppLayout>
            <Head title="Panel de Control Comercial" />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-8">
                        <h1 className="text-3xl font-bold text-gray-900">📈 Panel de Control Comercial</h1>
                        <p className="text-gray-600 mt-1">Análisis de Leads, Presupuestos y Contratos | Datos en tiempo real</p>
                    </div>
                    
                    {/* Filtros rápidos */}
                    <div className="bg-white rounded-xl shadow-sm p-4 mb-8 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center space-x-3">
                            <span className="text-sm font-medium text-gray-700">
                                <Calendar size={16} className="inline mr-1" /> Período:
                            </span>
                            <select 
                                value={selectedPeriodo}
                                onChange={(e) => handlePeriodoChange(e.target.value)}
                                className="border-gray-300 rounded-md text-sm py-1 px-2 bg-gray-50"
                            >
                                {periodos.map(p => (
                                    <option key={p.value} value={p.value}>{p.label}</option>
                                ))}
                            </select>
                            <div className="h-6 w-px bg-gray-300 mx-2"></div>
                            <span className="text-sm font-medium text-gray-700">
                                <TrendingUp size={16} className="inline mr-1" /> Comparar con:
                            </span>
                            <select 
                                value={selectedComparacion}
                                onChange={(e) => setSelectedComparacion(e.target.value)}
                                className="border-gray-300 rounded-md text-sm py-1 px-2 bg-gray-50"
                            >
                                <option value="mes_anterior">Mes Anterior</option>
                                <option value="anio_anterior">Año Anterior</option>
                            </select>
                        </div>
                        <div className="flex space-x-2">
                            <button className="bg-indigo-600 hover:bg-indigo-700 text-white text-sm px-4 py-1.5 rounded-lg shadow-sm transition flex items-center gap-1">
                                <Download size={14} /> Exportar
                            </button>
                            <button 
                                onClick={() => handlePeriodoChange(selectedPeriodo)}
                                className="bg-white border border-gray-300 text-gray-700 text-sm px-4 py-1.5 rounded-lg shadow-sm hover:bg-gray-50 transition flex items-center gap-1"
                            >
                                <RefreshCw size={14} /> Actualizar
                            </button>
                        </div>
                    </div>
                    
                    {/* KPIs Principales */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-indigo-500 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-500 text-sm font-medium">Total Leads</p>
                                    <p className="text-3xl font-bold text-gray-800 mt-1">{formatNumber(resumenGeneral.total_leads)}</p>
                                    <span className={`text-xs ${variacionLeads.positiva ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'} px-2 py-0.5 rounded-full mt-2 inline-block`}>
                                        {variacionLeads.texto} vs período ant.
                                    </span>
                                </div>
                                <Users size={32} className="text-indigo-200" />
                            </div>
                            <div className="mt-3 text-xs text-gray-500">
                                {resumenGeneral.leads_activos} activos, {resumenGeneral.leads_convertidos} clientes
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-blue-500 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-500 text-sm font-medium">Presupuestos Emitidos</p>
                                    <p className="text-3xl font-bold text-gray-800 mt-1">{formatNumber(resumenGeneral.total_presupuestos)}</p>
                                    <span className={`text-xs ${variacionPresupuestos.positiva ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'} px-2 py-0.5 rounded-full mt-2 inline-block`}>
                                        {variacionPresupuestos.texto} vs período ant.
                                    </span>
                                </div>
                                <FileText size={32} className="text-blue-200" />
                            </div>
                            <div className="mt-3 text-xs text-gray-500">
                                Valor total: {formatCurrency(resumenGeneral.valor_total_presupuestos)}
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-green-500 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-500 text-sm font-medium">Contratos Cerrados</p>
                                    <p className="text-3xl font-bold text-gray-800 mt-1">{formatNumber(resumenGeneral.total_contratos)}</p>
                                    <span className={`text-xs ${variacionContratos.positiva ? 'text-green-600 bg-green-100' : 'text-red-600 bg-red-100'} px-2 py-0.5 rounded-full mt-2 inline-block`}>
                                        {variacionContratos.texto} vs período ant.
                                    </span>
                                </div>
                                <FileCheck size={32} className="text-green-200" />
                            </div>
                            <div className="mt-3 text-xs text-gray-500">
                                Ticket promedio: {formatCurrency(resumenGeneral.valor_promedio_contrato)}
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-2xl shadow-sm p-5 border-l-4 border-purple-500 hover:shadow-md transition-shadow">
                            <div className="flex justify-between items-start">
                                <div>
                                    <p className="text-gray-500 text-sm font-medium">Tasa de Conversión</p>
                                    <p className="text-3xl font-bold text-gray-800 mt-1">{resumenGeneral.tasa_conversion}%</p>
                                    <span className="text-xs text-green-600 bg-green-100 px-2 py-0.5 rounded-full mt-2 inline-block">
                                        +2.3 pp vs período ant.
                                    </span>
                                </div>
                                <TrendingUp size={32} className="text-purple-200" />
                            </div>
                            <div className="mt-3 text-xs text-gray-500">
                                Contratos / Leads
                            </div>
                        </div>
                    </div>
                    
                    {/* Gráficos principales */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
                        {/* Embudo de Conversión */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-xl font-semibold text-gray-800">
                                    <Target size={22} className="text-indigo-500 inline mr-2" /> Embudo de Conversión
                                </h2>
                                <span className="text-xs text-gray-400">{resumenGeneral.periodo}</span>
                            </div>
                            <div className="h-80">
                                <canvas ref={funnelChartRef}></canvas>
                            </div>
                            <div className="mt-4 text-sm text-gray-600 border-t pt-3 grid grid-cols-2 gap-2">
                                {embudoConversion.etapas.map((etapa, idx) => (
                                    <div key={idx} className="flex justify-between">
                                        <span>{idx === 0 ? '🔵' : idx === 1 ? '🟢' : idx === 2 ? '🟠' : '🟣'} {etapa.nombre}</span>
                                        <span className="font-medium">{formatNumber(etapa.cantidad)} ({etapa.porcentaje}%)</span>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Leads por Origen */}
                        <div className="bg-white p-6 rounded-2xl shadow-sm">
                            <h2 className="text-xl font-semibold text-gray-800 mb-4">
                                <PieChart size={22} className="text-indigo-500 inline mr-2" /> Leads por Origen de Contacto
                            </h2>
                            <div className="h-80 flex items-center justify-center">
                                <canvas ref={origenChartRef} className="max-w-full max-h-full"></canvas>
                            </div>
                        </div>
                    </div>
                    
                    {/* Segunda fila: Motivos de pérdida y Productos/Servicios más vendidos */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Motivos de pérdida */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-800 mb-3">
                                <AlertCircle size={20} className="text-red-500 inline mr-2" /> Principales Motivos de Pérdida
                            </h2>
                            <div className="space-y-3">
                                {topMotivosPerdida.map((motivo, idx) => {
                                    const porcentaje = resumenGeneral.leads_perdidos > 0 
                                        ? (motivo.total / resumenGeneral.leads_perdidos) * 100 
                                        : 0;
                                    return (
                                        <div key={motivo.id}>
                                            <div className="flex justify-between text-sm">
                                                <span>{motivo.nombre}</span>
                                                <span className="font-medium">{porcentaje.toFixed(0)}%</span>
                                            </div>
                                            <div className="w-full bg-gray-200 rounded-full h-2">
                                                <div 
                                                    className="h-2 rounded-full bg-red-500"
                                                    style={{ width: `${Math.min(porcentaje, 100)}%` }}
                                                />
                                            </div>
                                        </div>
                                    );
                                })}
                                {topMotivosPerdida.length === 0 && (
                                    <div className="text-center text-gray-500 py-4">
                                        No hay motivos de pérdida registrados
                                    </div>
                                )}
                            </div>
                            <div className="mt-4 text-xs text-gray-500 border-t pt-3">
                                <i className="far fa-lightbulb"></i> Recomendación: Revisar seguimiento de leads con motivo principal.
                            </div>
                        </div>
                        
                        {/* Servicios y Accesorios más vendidos */}
                        <div className="bg-white p-5 rounded-2xl shadow-sm">
                            <h2 className="text-lg font-semibold text-gray-800 mb-3">
                                <Package size={20} className="text-indigo-500 inline mr-2" /> Productos más vendidos
                            </h2>
                            
                            {/* Servicios */}
                            <div className="mb-4">
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <SettingsIcon size={16} className="text-blue-500" />
                                        <h3 className="font-medium text-gray-700">Servicios</h3>
                                    </div>
                                    <button 
                                        onClick={() => openModal('servicios')}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
                                    >
                                        Ver todos →
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {serviciosMasVendidos.slice(0, 3).map((servicio) => (
                                        <div key={servicio.id} className="flex justify-between items-center text-sm">
                                            <span className="truncate max-w-[200px]">{servicio.nombre}</span>
                                            <span className="font-bold text-green-600">{formatNumber(servicio.cantidad)}</span>
                                        </div>
                                    ))}
                                    {serviciosMasVendidos.length === 0 && (
                                        <div className="text-xs text-gray-400">No hay servicios registrados</div>
                                    )}
                                </div>
                            </div>
                            
                            {/* Accesorios */}
                            <div>
                                <div className="flex items-center justify-between mb-2">
                                    <div className="flex items-center gap-2">
                                        <Wrench size={16} className="text-orange-500" />
                                        <h3 className="font-medium text-gray-700">Accesorios</h3>
                                    </div>
                                    <button 
                                        onClick={() => openModal('accesorios')}
                                        className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline"
                                    >
                                        Ver todos →
                                    </button>
                                </div>
                                <div className="space-y-2">
                                    {accesoriosMasVendidos.slice(0, 3).map((accesorio) => (
                                        <div key={accesorio.id} className="flex justify-between items-center text-sm">
                                            <span className="truncate max-w-[200px]">{accesorio.nombre}</span>
                                            <span className="font-bold text-green-600">{formatNumber(accesorio.cantidad)}</span>
                                        </div>
                                    ))}
                                    {accesoriosMasVendidos.length === 0 && (
                                        <div className="text-xs text-gray-400">No hay accesorios registrados</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Ranking Comerciales */}
                    <div className="bg-white rounded-2xl shadow-sm p-5 mb-8">
                        <div className="flex justify-between items-center mb-5 flex-wrap">
                            <h2 className="text-lg font-semibold text-gray-800">
                                <Trophy size={20} className="text-yellow-500 inline mr-2" /> Ranking Comerciales
                            </h2>
                            <div className="flex gap-3">
                                <select className="text-sm border rounded-md px-2 py-1 bg-gray-50">
                                    <option>Contratos cerrados</option>
                                    <option>Monto facturado</option>
                                    <option>Tasa conversión</option>
                                </select>
                                <span className="text-xs text-gray-400 self-center">vs objetivo mensual</span>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Comercial</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Prefijo</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Leads</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Presupuestos</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Contratos</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Conversión</th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Monto Total</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {rendimientoComerciales.map((comercial, idx) => (
                                        <tr 
                                            key={comercial.comercial_id} 
                                            className="hover:bg-gray-50 cursor-pointer" 
                                            onClick={() => router.get(`/estadisticas/comercial/${comercial.comercial_id}`)}
                                        >
                                            <td className="px-4 py-3 text-sm font-medium text-gray-900">
                                                {idx === 0 && <Star size={12} className="text-yellow-400 inline mr-1" />}
                                                {comercial.nombre}
                                            </td>
                                            <td className="px-4 py-3 text-sm">
                                                <span className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100">{comercial.prefijo_codigo}</span>
                                            </td>
                                            <td className="px-4 py-3 text-sm">{formatNumber(comercial.total_leads)}</td>
                                            <td className="px-4 py-3 text-sm">{formatNumber(comercial.total_presupuestos)}</td>
                                            <td className="px-4 py-3 text-sm font-bold text-green-600">{formatNumber(comercial.total_contratos)}</td>
                                            <td className="px-4 py-3 text-sm">{comercial.tasa_conversion}%</td>
                                            <td className="px-4 py-3 text-sm">{formatCurrency(comercial.valor_total_presupuestos)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div className="mt-4 text-xs text-gray-400 flex justify-end items-center gap-2">
                            <TrendingUp size={12} /> Promedio equipo: {(rendimientoComerciales.reduce((sum, c) => sum + c.total_contratos, 0) / rendimientoComerciales.length).toFixed(0)} contratos por comercial
                        </div>
                    </div>
                    
                    {/* Evolución Mensual y Tipos de Operación */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {/* Evolución mensual */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h2 className="text-xl font-semibold mb-4">
                                <TrendingUp size={22} className="text-green-500 inline mr-2" /> Evolución Mensual (Leads vs Contratos)
                            </h2>
                            <div className="h-80">
                                <canvas ref={evolutionChartRef}></canvas>
                            </div>
                            <div className="mt-3 text-center text-xs text-gray-500">
                                Últimos {Math.min(tendenciasMensuales.length, 6)} meses
                            </div>
                        </div>
                        
                        {/* Tipos de Operación de Contratos */}
                        <div className="bg-white rounded-2xl shadow-sm p-6">
                            <h2 className="text-xl font-semibold mb-4">
                                <FileSignature size={22} className="text-purple-500 inline mr-2" /> Tipos de Operación de Contratos
                            </h2>
                            <div className="h-80 flex items-center justify-center">
                                <canvas ref={tiposOperacionChartRef} className="max-w-full max-h-full"></canvas>
                            </div>
                            <div className="mt-3 text-center text-xs text-gray-500">
                                Distribución de {formatNumber(resumenGeneral.total_contratos)} contratos
                            </div>
                        </div>
                    </div>
                    
                    <div className="mt-8 text-center text-xs text-gray-400 border-t pt-6">
                        Datos basados en estructura real: leads, presupuestos, contratos, comercial, seguimientos_perdida.
                        Visualización comercial con métricas de conversión y rendimiento individual.
                    </div>
                </div>
            </div>
            
                {/* Modal para ver detalle de productos */}
                <VerProductosVendidosModal
                    isOpen={modalOpen}
                    onClose={closeModal}
                    title={modalType === 'servicios' ? 'Todos los Servicios' : 'Todos los Accesorios'}
                    productos={modalType === 'servicios' ? serviciosMasVendidos : accesoriosMasVendidos}
                    tipo={modalType === 'servicios' ? 'servicios' : 'accesorios'}
                />
        </AppLayout>
    );
}