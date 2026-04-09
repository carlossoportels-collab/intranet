// resources/js/Pages/Estadisticas/Comerciales/Index.tsx

import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Users, TrendingUp, Target, Award, ChevronRight, Calendar } from 'lucide-react';

interface Props {
    periodo: string;
    comerciales: Array<{
        id: number;
        nombre: string;
        prefijo: string;
        total_leads: number;
        total_contratos: number;
        tasa_conversion: number;
        avatar: string | null;
    }>;
}

export default function EstadisticasComerciales({ periodo, comerciales }: Props) {
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
        router.get('/estadisticas/comerciales', { periodo: nuevoPeriodo }, {
            preserveState: true,
            preserveScroll: true,
        });
    };
    
    const handleSelectComercial = (id: number) => {
        router.get(`/estadisticas/comercial/${id}`, { periodo: selectedPeriodo });
    };
    
    const formatNumber = (value: number) => {
        return new Intl.NumberFormat('es-AR').format(value);
    };
    
    const getMedalColor = (index: number) => {
        switch(index) {
            case 0: return 'text-yellow-500';
            case 1: return 'text-gray-400';
            case 2: return 'text-amber-600';
            default: return 'text-gray-300';
        }
    };
    
    const getMedalIcon = (index: number) => {
        switch(index) {
            case 0: return '🥇';
            case 1: return '🥈';
            case 2: return '🥉';
            default: return `${index + 1}`;
        }
    };
    
    return (
        <AppLayout>
            <Head title="Rendimiento Comercial" />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">Rendimiento del Equipo Comercial</h1>
                            <p className="text-gray-500 mt-1">Análisis individual de cada comercial</p>
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
                    
                    {/* Tarjetas de resumen rápido */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                        <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-blue-100 text-sm">Total Comerciales</p>
                                    <p className="text-3xl font-bold mt-1">{comerciales.length}</p>
                                </div>
                                <Users size={32} className="text-blue-200" />
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-xl p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-green-100 text-sm">Total Contratos</p>
                                    <p className="text-3xl font-bold mt-1">
                                        {formatNumber(comerciales.reduce((sum, c) => sum + c.total_contratos, 0))}
                                    </p>
                                </div>
                                <Target size={32} className="text-green-200" />
                            </div>
                        </div>
                        
                        <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl p-6 text-white">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-purple-100 text-sm">Conversión Promedio</p>
                                    <p className="text-3xl font-bold mt-1">
                                        {(comerciales.reduce((sum, c) => sum + c.tasa_conversion, 0) / comerciales.length).toFixed(1)}%
                                    </p>
                                </div>
                                <TrendingUp size={32} className="text-purple-200" />
                            </div>
                        </div>
                    </div>
                    
                    {/* Tabla de comerciales */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="p-6 border-b border-gray-100">
                            <h2 className="text-lg font-semibold text-gray-900">Ranking de Comerciales</h2>
                        </div>
                        <div className="divide-y divide-gray-100">
                            {comerciales.map((comercial, index) => (
                                <div
                                    key={comercial.id}
                                    onClick={() => handleSelectComercial(comercial.id)}
                                    className="p-4 hover:bg-gray-50 cursor-pointer transition-colors group"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-4">
                                            {/* Posición/Medalla */}
                                            <div className={`w-10 h-10 flex items-center justify-center font-bold text-lg ${getMedalColor(index)}`}>
                                                {getMedalIcon(index)}
                                            </div>
                                            
                                            {/* Avatar o inicial */}
                                            <div className="w-12 h-12 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center">
                                                <span className="text-gray-600 font-semibold text-lg">
                                                    {comercial.nombre.charAt(0)}
                                                </span>
                                            </div>
                                            
                                            {/* Info */}
                                            <div>
                                                <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                                                    {comercial.nombre}
                                                </h3>
                                                <div className="flex items-center gap-3 mt-1">
                                                    <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                                        Prefijo: {comercial.prefijo}
                                                    </span>
                                                    <span className="text-xs text-gray-400">
                                                        {formatNumber(comercial.total_leads)} leads
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-8">
                                            {/* Métricas */}
                                            <div className="text-right">
                                                <div className="flex items-center gap-2">
                                                    <Award size={14} className="text-green-500" />
                                                    <span className="text-sm text-gray-600">Contratos:</span>
                                                    <span className="font-semibold text-gray-900">
                                                        {formatNumber(comercial.total_contratos)}
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-2 mt-1">
                                                    <Target size={14} className="text-blue-500" />
                                                    <span className="text-sm text-gray-600">Conversión:</span>
                                                    <span className={`font-semibold ${
                                                        comercial.tasa_conversion >= 20 ? 'text-green-600' : 
                                                        comercial.tasa_conversion >= 10 ? 'text-yellow-600' : 'text-gray-500'
                                                    }`}>
                                                        {comercial.tasa_conversion}%
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <ChevronRight size={20} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                                        </div>
                                    </div>
                                    
                                    {/* Barra de progreso de conversión */}
                                    <div className="mt-3 ml-14">
                                        <div className="flex items-center gap-2">
                                            <span className="text-xs text-gray-500 w-12">Conversión</span>
                                            <div className="flex-1 bg-gray-200 rounded-full h-1.5">
                                                <div 
                                                    className="bg-green-500 rounded-full h-1.5 transition-all"
                                                    style={{ width: `${Math.min(comercial.tasa_conversion, 100)}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-gray-600 w-12 text-right">
                                                {comercial.tasa_conversion}%
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            ))}
                            
                            {comerciales.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    No hay comerciales activos
                                </div>
                            )}
                        </div>
                    </div>
                    
                    {/* Leyenda */}
                    <div className="mt-6 text-center text-xs text-gray-400">
                        <p>Click en cualquier comercial para ver estadísticas detalladas</p>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}