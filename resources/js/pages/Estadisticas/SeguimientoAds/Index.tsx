// resources/js/Pages/Estadisticas/SeguimientoAds/Index.tsx

import React, { useState } from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    Users, Target, FileText, FileCheck, TrendingUp,
    PieChart, Calendar, Eye, Phone, Mail, MapPin,
    CheckCircle, XCircle, Clock, AlertCircle, ChevronRight,
    Filter
} from 'lucide-react';

interface Props {
    periodo: string;
    estadoFilter: string;
    estadosDisponibles: Array<{
        id: number;
        nombre: string;
        color_hex: string;
    }>;
    resumen: {
        total_leads: number;
        leads_activos: number;
        leads_convertidos: number;
        leads_inactivos: number;
        leads_perdidos: number;
        total_presupuestos: number;
        total_contratos: number;
        valor_presupuestos: number;
        tasa_conversion: number;
        total_notas: number;
    };
    distribucionEstados: Array<{
        nombre: string;
        color: string;
        total: number;
    }>;
    distribucionPrefijos: Array<{
        codigo: string;
        comercial_nombre: string;
        total: number;
    }>;
    conversionMensual: Array<{
        mes: string;
        nombre_mes: string;
        leads: number;
        contratos: number;
        tasa_conversion: number;
    }>;
    leads: Array<{
        id: number;
        nombre: string;
        telefono: string | null;
        email: string | null;
        estado_id: number;
        estado: string;
        estado_color: string;
        prefijo_codigo: string;
        comercial_nombre: string;
        origen: string;
        es_cliente: boolean;
        es_activo: boolean;
        created_formateado: string;
        localidad: string | null;
    }>;
}

export default function SeguimientoAdsIndex({
    periodo,
    estadoFilter,
    estadosDisponibles,
    resumen,
    distribucionEstados,
    distribucionPrefijos,
    conversionMensual,
    leads
}: Props) {
    const [selectedPeriodo, setSelectedPeriodo] = useState(periodo);
    const [selectedEstado, setSelectedEstado] = useState(estadoFilter);
    const [searchTerm, setSearchTerm] = useState('');
    
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
        router.get('/estadisticas/seguimiento-ads', { 
            periodo: nuevoPeriodo,
            estado: selectedEstado 
        }, {
            preserveState: true,
            preserveScroll: true,
        });
    };
    
    const handleEstadoChange = (estado: string) => {
        setSelectedEstado(estado);
        router.get('/estadisticas/seguimiento-ads', { 
            periodo: selectedPeriodo,
            estado: estado 
        }, {
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
    
    // Filtrar leads por búsqueda
    const filteredLeads = leads.filter(lead => {
        return searchTerm === '' || 
            lead.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
            (lead.telefono && lead.telefono.includes(searchTerm)) ||
            (lead.email && lead.email.toLowerCase().includes(searchTerm.toLowerCase()));
    });
    
    return (
        <AppLayout>
            <Head title="Seguimiento ADS - Mis Leads" />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Header */}
                    <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <div className="flex items-center gap-2">
                                <Target className="text-blue-600" size={24} />
                                <h1 className="text-2xl font-bold text-gray-900">Seguimiento ADS</h1>
                            </div>
                            <p className="text-gray-500 mt-1">Seguimiento de leads generados por campañas ADS</p>
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
                    
                    {/* Tarjetas de resumen */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Total Leads</p>
                                    <p className="text-2xl font-bold text-gray-900">{formatNumber(resumen.total_leads)}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {resumen.leads_activos} activos, {resumen.leads_convertidos} clientes
                                    </p>
                                </div>
                                <div className="p-3 rounded-full bg-blue-100">
                                    <Users className="text-blue-600" size={24} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Tasa de Conversión</p>
                                    <p className="text-2xl font-bold text-gray-900">{resumen.tasa_conversion}%</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {formatNumber(resumen.total_contratos)} contratos
                                    </p>
                                </div>
                                <div className="p-3 rounded-full bg-green-100">
                                    <TrendingUp className="text-green-600" size={24} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Presupuestos</p>
                                    <p className="text-2xl font-bold text-gray-900">{formatNumber(resumen.total_presupuestos)}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        Valor: {formatCurrency(resumen.valor_presupuestos)}
                                    </p>
                                </div>
                                <div className="p-3 rounded-full bg-purple-100">
                                    <FileText className="text-purple-600" size={24} />
                                </div>
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
                            <div className="flex items-center justify-between">
                                <div>
                                    <p className="text-sm text-gray-500">Leads Perdidos</p>
                                    <p className="text-2xl font-bold text-gray-900">{formatNumber(resumen.leads_perdidos)}</p>
                                    <p className="text-xs text-gray-400 mt-1">
                                        {resumen.total_leads > 0 
                                            ? `${((resumen.leads_perdidos / resumen.total_leads) * 100).toFixed(1)}% del total`
                                            : '0% del total'}
                                    </p>
                                </div>
                                <div className="p-3 rounded-full bg-red-100">
                                    <XCircle className="text-red-600" size={24} />
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Gráficos de distribución */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                        {/* Distribución por estado */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <PieChart size={20} className="text-gray-500" />
                                <h2 className="text-lg font-semibold text-gray-900">Distribución por Estado</h2>
                            </div>
                            <div className="space-y-3">
                                {distribucionEstados.map(estado => (
                                    <div key={estado.nombre} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <div 
                                                className="w-3 h-3 rounded-full" 
                                                style={{ backgroundColor: estado.color }}
                                            />
                                            <span className="text-sm text-gray-700">{estado.nombre}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-medium text-gray-900">{formatNumber(estado.total)}</span>
                                            <div className="w-24 bg-gray-200 rounded-full h-1.5">
                                                <div 
                                                    className="bg-blue-600 rounded-full h-1.5 transition-all"
                                                    style={{ width: `${(estado.total / resumen.total_leads) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Distribución por comercial asignado */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6">
                            <div className="flex items-center gap-2 mb-4">
                                <Users size={20} className="text-gray-500" />
                                <h2 className="text-lg font-semibold text-gray-900">Asignación por Comercial</h2>
                            </div>
                            <div className="space-y-3">
                                {distribucionPrefijos.map(prefijo => (
                                    <div key={prefijo.codigo} className="flex items-center justify-between">
                                        <div>
                                            <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700">
                                                {prefijo.codigo}
                                            </span>
                                            <span className="text-sm text-gray-500 ml-2">{prefijo.comercial_nombre}</span>
                                        </div>
                                        <div className="flex items-center gap-4">
                                            <span className="text-sm font-medium text-gray-900">{formatNumber(prefijo.total)}</span>
                                            <div className="w-24 bg-gray-200 rounded-full h-1.5">
                                                <div 
                                                    className="bg-green-600 rounded-full h-1.5 transition-all"
                                                    style={{ width: `${(prefijo.total / resumen.total_leads) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                    
                    {/* Conversión mensual */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 mb-8">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex items-center gap-2">
                                <Calendar size={20} className="text-gray-500" />
                                <h2 className="text-lg font-semibold text-gray-900">Conversión Mensual</h2>
                            </div>
                        </div>
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Mes</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Leads</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Contratos</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Conversión</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-gray-100">
                                    {conversionMensual.map((mes) => (
                                        <tr key={mes.mes} className="hover:bg-gray-50">
                                            <td className="px-6 py-3 text-sm text-gray-900">{mes.nombre_mes}</td>
                                            <td className="px-6 py-3 text-right text-sm text-gray-600">{formatNumber(mes.leads)}</td>
                                            <td className="px-6 py-3 text-right text-sm font-semibold text-green-600">{formatNumber(mes.contratos)}</td>
                                            <td className="px-6 py-3 text-right">
                                                <span className={`text-sm font-medium ${
                                                    mes.tasa_conversion >= 20 ? 'text-green-600' : 
                                                    mes.tasa_conversion >= 10 ? 'text-yellow-600' : 'text-gray-500'
                                                }`}>
                                                    {mes.tasa_conversion}%
                                                </span>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                    
                    {/* Filtros y Lista de Leads */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                        <div className="p-6 border-b border-gray-100">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <h2 className="text-lg font-semibold text-gray-900">Mis Leads Generados</h2>
                                
                                <div className="flex flex-col sm:flex-row gap-3">
                                    {/* Filtro por estado personalizado */}
                                    <div className="flex items-center gap-2">
                                        <Filter size={16} className="text-gray-400" />
                                        <select
                                            value={selectedEstado}
                                            onChange={(e) => handleEstadoChange(e.target.value)}
                                            className="text-sm border border-gray-300 rounded-lg px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        >
                                            <option value="todos">Todos los estados</option>
                                            <option value="activos">✅ Activos</option>
                                            <option value="clientes">🏆 Clientes</option>
                                            <option value="inactivos">⭕ Inactivos</option>
                                            <option value="perdidos">❌ Perdidos</option>
                                            <option disabled>──────────</option>
                                            {estadosDisponibles.map(estado => (
                                                <option key={estado.id} value={estado.id}>
                                                    {estado.nombre}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    
                                    {/* Buscador */}
                                    <input
                                        type="text"
                                        placeholder="Buscar por nombre, teléfono o email..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm w-64 focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>
                        
                        <div className="divide-y divide-gray-100">
                            {filteredLeads.map((lead) => (
                                <Link
                                    key={lead.id}
                                    href={`/estadisticas/seguimiento-ads/lead/${lead.id}`}
                                    className="block p-4 hover:bg-gray-50 transition-colors cursor-pointer"
                                >
                                    <div className="flex items-start justify-between">
                                        <div className="flex-1">
                                            <div className="flex items-center gap-3 mb-2">
                                                <h3 className="font-semibold text-gray-900">{lead.nombre}</h3>
                                                <span 
                                                    className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                                    style={{ 
                                                        backgroundColor: `${lead.estado_color}20`,
                                                        color: lead.estado_color
                                                    }}
                                                >
                                                    {lead.estado}
                                                </span>
                                                {lead.es_cliente && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                        <CheckCircle size={10} /> Cliente
                                                    </span>
                                                )}
                                                {!lead.es_activo && !lead.es_cliente && (
                                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                                        <XCircle size={10} /> Inactivo
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-sm">
                                                {lead.telefono && (
                                                    <div className="flex items-center gap-1 text-gray-500">
                                                        <Phone size={12} />
                                                        <span>{lead.telefono}</span>
                                                    </div>
                                                )}
                                                {lead.email && (
                                                    <div className="flex items-center gap-1 text-gray-500">
                                                        <Mail size={12} />
                                                        <span className="truncate">{lead.email}</span>
                                                    </div>
                                                )}
                                                {lead.localidad && (
                                                    <div className="flex items-center gap-1 text-gray-500">
                                                        <MapPin size={12} />
                                                        <span>{lead.localidad}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-1 text-gray-500">
                                                    <Calendar size={12} />
                                                    <span>{lead.created_formateado}</span>
                                                </div>
                                            </div>
                                            
                                            <div className="flex items-center gap-4 mt-2">
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700">
                                                    Prefijo: {lead.prefijo_codigo}
                                                </span>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700">
                                                    Comercial: {lead.comercial_nombre}
                                                </span>
                                                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-600">
                                                    Origen: {lead.origen}
                                                </span>
                                            </div>
                                        </div>
                                        
                                        <ChevronRight className="text-gray-400" size={20} />
                                    </div>
                                </Link>
                            ))}
                            
                            {filteredLeads.length === 0 && (
                                <div className="p-8 text-center text-gray-500">
                                    No hay leads que coincidan con los filtros
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}