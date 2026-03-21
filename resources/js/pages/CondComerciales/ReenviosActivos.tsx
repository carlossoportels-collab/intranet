// resources/js/Pages/CondComerciales/ReenviosActivos.tsx

import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { Search, Filter, X, Database, Zap, Globe, ExternalLink } from 'lucide-react';

interface Reenvio {
    id: number;
    prestadora: string;
    cybermapa: boolean;
    bykom: boolean;
    activo: boolean;
}

interface ReenviosActivosProps {
    reenvios: {
        data: Reenvio[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
    };
    estadisticas: {
        total: number;
        cybermapa: number;
        bykom: number;
        ambas: number;
    };
    filters: {
        search?: string;
        plataforma?: string;
    };
}

export default function ReenviosActivos({ reenvios, estadisticas, filters }: ReenviosActivosProps) {
    const [plataformaFilter, setPlataformaFilter] = useState(filters.plataforma || '');
    const [searchTerm, setSearchTerm] = useState(filters.search || '');

    const handleFilterChange = (plataforma: string) => {
        const params: any = {};
        if (plataforma) params.plataforma = plataforma;
        if (searchTerm) params.search = searchTerm;
        window.location.href = `/comercial/reenvios?${new URLSearchParams(params).toString()}`;
    };

    const handleSearch = () => {
        const params: any = {};
        if (searchTerm) params.search = searchTerm;
        if (plataformaFilter) params.plataforma = plataformaFilter;
        window.location.href = `/comercial/reenvios?${new URLSearchParams(params).toString()}`;
    };

    const handleClearFilters = () => {
        setSearchTerm('');
        setPlataformaFilter('');
        window.location.href = '/comercial/reenvios';
    };

    const hayFiltrosActivos = searchTerm !== '' || plataformaFilter !== '';

    return (
        <AppLayout title="Reenvíos Activos">
            <Head title="Reenvíos Activos" />
            
            <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    Reenvíos Activos
                </h1>
                <p className="mt-1 text-gray-600 text-base">
                    Prestadoras con reenvíos configurados por plataforma
                </p>
            </div>

            <div className="space-y-6">
                {/* Cards de estadísticas - 4 cards independientes */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {/* Total */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-gray-100 rounded-lg">
                                <Database className="h-5 w-5 text-gray-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-gray-900">{estadisticas.total}</div>
                                <div className="text-xs text-gray-500">prestadoras</div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Cybermapa */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <img 
                                src="/images/logos/logo_cybermapa.png" 
                                alt="Cybermapa" 
                                className="h-8 w-auto"
                            />
                            <div>
                                <div className="text-2xl font-bold text-indigo-900">{estadisticas.cybermapa}</div>
                                <div className="text-xs text-indigo-600">prestadoras</div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Bykom */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <img 
                                src="/images/logos/logo_bykom.png" 
                                alt="Bykom" 
                                className="h-8 w-auto"
                            />
                            <div>
                                <div className="text-2xl font-bold text-emerald-900">{estadisticas.bykom}</div>
                                <div className="text-xs text-emerald-600">prestadoras</div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Ambas */}
                    <div className="bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-orange-100 rounded-lg">
                                <Zap className="h-5 w-5 text-orange-600" />
                            </div>
                            <div>
                                <div className="text-2xl font-bold text-orange-900">{estadisticas.ambas}</div>
                                <div className="text-xs text-orange-600">ambas plataformas</div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabla con filtros */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase w-48">
                                        Prestadora
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-32">
                                        <div className="flex items-center justify-center gap-2">
                                            <img 
                                                src="/images/logos/cybermapa_logo.png" 
                                                alt="Cybermapa" 
                                                className="h-5 w-auto"
                                            />
                                            <span>Cybermapa</span>
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase w-32">
                                        <div className="flex items-center justify-center gap-2">
                                            <img 
                                                src="/images/logos/bykom_logo.png" 
                                                alt="Bykom" 
                                                className="h-5 w-auto"
                                            />
                                            <span>Bykom</span>
                                        </div>
                                    </th>
                                    <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                                        <div className="flex items-center justify-end gap-3">
                                            <button
                                                onClick={() => handleFilterChange('')}
                                                className={`px-2 py-1 rounded text-xs transition-colors ${
                                                    plataformaFilter === '' 
                                                        ? 'bg-sat text-white' 
                                                        : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                            >
                                                Todos
                                            </button>
                                            <button
                                                onClick={() => handleFilterChange('cybermapa')}
                                                className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                                                    plataformaFilter === 'cybermapa' 
                                                        ? 'bg-indigo-100 text-indigo-700' 
                                                        : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                            >
                                                <img src="/images/logos/cybermapa_logo.png" alt="" className="h-3 w-auto" />
                                                Cybermapa
                                            </button>
                                            <button
                                                onClick={() => handleFilterChange('bykom')}
                                                className={`px-2 py-1 rounded text-xs transition-colors flex items-center gap-1 ${
                                                    plataformaFilter === 'bykom' 
                                                        ? 'bg-emerald-100 text-emerald-700' 
                                                        : 'text-gray-500 hover:text-gray-700'
                                                }`}
                                            >
                                                <img src="/images/logos/bykom_logo.png" alt="" className="h-3 w-auto" />
                                                Bykom
                                            </button>
                                            <div className="w-px h-4 bg-gray-300"></div>
                                            <div className="relative">
                                                <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-3 w-3 text-gray-400" />
                                                <input
                                                    type="text"
                                                    value={searchTerm}
                                                    onChange={(e) => setSearchTerm(e.target.value)}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                                    placeholder="Buscar..."
                                                    className="w-32 pl-7 pr-2 py-1 border border-gray-300 rounded text-xs focus:ring-sat focus:border-sat"
                                                />
                                            </div>
                                            {hayFiltrosActivos && (
                                                <button
                                                    onClick={handleClearFilters}
                                                    className="text-red-500 hover:text-red-700"
                                                    title="Limpiar filtros"
                                                >
                                                    <X className="h-3 w-3" />
                                                </button>
                                            )}
                                        </div>
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {reenvios.data.length === 0 ? (
                                    <tr>
                                        <td colSpan={4} className="px-4 py-8 text-center text-gray-500">
                                            No se encontraron prestadoras
                                        </td>
                                    </tr>
                                ) : (
                                    reenvios.data.map((reenvio) => (
                                        <tr key={reenvio.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-2.5">
                                                <span className="font-medium text-gray-900 text-sm">
                                                    {reenvio.prestadora}
                                                </span>
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                {reenvio.cybermapa ? (
                                                    <span className="inline-flex items-center gap-1 text-green-600 font-medium text-sm">
                                                        <span>✓</span>
                                                        SI
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-gray-400 text-sm">
                                                        <span>✗</span>
                                                        NO
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5 text-center">
                                                {reenvio.bykom ? (
                                                    <span className="inline-flex items-center gap-1 text-green-600 font-medium text-sm">
                                                        <span>✓</span>
                                                        SI
                                                    </span>
                                                ) : (
                                                    <span className="inline-flex items-center gap-1 text-gray-400 text-sm">
                                                        <span>✗</span>
                                                        NO
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-4 py-2.5"></td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Paginación */}
                    {reenvios.last_page > 1 && (
                        <div className="px-4 py-3 border-t border-gray-200 flex items-center justify-between">
                            <div className="text-sm text-gray-500">
                                Mostrando {(reenvios.current_page - 1) * reenvios.per_page + 1} - {Math.min(reenvios.current_page * reenvios.per_page, reenvios.total)} de {reenvios.total}
                            </div>
                            <div className="flex gap-1">
                                <button
                                    onClick={() => {
                                        const params = new URLSearchParams(window.location.search);
                                        params.set('page', (reenvios.current_page - 1).toString());
                                        window.location.href = `/comercial/reenvios?${params.toString()}`;
                                    }}
                                    disabled={reenvios.current_page === 1}
                                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Anterior
                                </button>
                                {Array.from({ length: Math.min(5, reenvios.last_page) }, (_, i) => {
                                    let page = reenvios.current_page;
                                    if (reenvios.last_page <= 5) {
                                        page = i + 1;
                                    } else if (reenvios.current_page <= 3) {
                                        page = i + 1;
                                    } else if (reenvios.current_page >= reenvios.last_page - 2) {
                                        page = reenvios.last_page - 4 + i;
                                    } else {
                                        page = reenvios.current_page - 2 + i;
                                    }
                                    return (
                                        <button
                                            key={page}
                                            onClick={() => {
                                                const params = new URLSearchParams(window.location.search);
                                                params.set('page', page.toString());
                                                window.location.href = `/comercial/reenvios?${params.toString()}`;
                                            }}
                                            className={`px-3 py-1 border rounded-lg text-sm ${
                                                reenvios.current_page === page
                                                    ? 'bg-sat text-white border-sat'
                                                    : 'border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            {page}
                                        </button>
                                    );
                                })}
                                <button
                                    onClick={() => {
                                        const params = new URLSearchParams(window.location.search);
                                        params.set('page', (reenvios.current_page + 1).toString());
                                        window.location.href = `/comercial/reenvios?${params.toString()}`;
                                    }}
                                    disabled={reenvios.current_page === reenvios.last_page}
                                    className="px-3 py-1 border border-gray-300 rounded-lg text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                                >
                                    Siguiente
                                </button>
                            </div>
                        </div>
                    )}
                </div>

                {/* Leyendas - usando los logos específicos */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-200">
                        {/* Cybermapa */}
                        <div className="p-4 space-y-2">
                            <div className="flex items-center gap-2">
                                <img src="/images/logos/cybermapa_logo.png" alt="Cybermapa" className="h-6 w-auto" />
                                <h3 className="font-semibold text-gray-800">Cybermapa</h3>
                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">API REST</span>
                            </div>
                            <span className="text-sm text-gray-600">
                                API REST para consulta de posiciones en tiempo real.<br/> Protocolo JSON, disponible para integraciones externas.
                            </span>
                            <div className="flex flex-wrap gap-2 pt-1">
                                <span className="text-xs text-sat flex items-center gap-1">
                                Para más información contacte con el departamento técnico
                                </span>
                            </div>
                        </div>

                        {/* Bykom */}
                        <div className="p-4 space-y-2">
                            <div className="flex items-center gap-2">
                                <img src="/images/logos/bykom_logo.png" alt="Bykom" className="h-6 w-auto" />
                                <h3 className="font-semibold text-gray-800">Bykom</h3>
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">WebService SOAP</span>
                            </div>
                            <span className="text-sm text-gray-600">
                                WebService SOAP para consulta de posiciones en tiempo real.<br/> Protocolo XML, disponible para integraciones externas.
                            </span>
                            <div className="flex flex-wrap gap-2 pt-1">
                                <span className="text-xs text-sat flex items-center gap-1">
                                Para más información contacte con el departamento técnico
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Nota sobre nuevas integraciones - solo Cybermapa */}
                    <div className="p-4 border-t border-gray-200 bg-gradient-to-r from-indigo-50/50 to-white">
                        <div className="flex items-start gap-3">
                            <div className="p-1.5 bg-indigo-100 rounded-lg">
                                <Globe className="h-4 w-4 text-indigo-600" />
                            </div>
                            <div>
                                <p className="text-sm text-gray-700">
                                    <strong className="text-indigo-700">Cybermapa - Nuevas integraciones disponibles:</strong> Protocolo CAESSAT y CERSAT 
                                    listos para implementar nuevos reenvíos con solo brindar una IP y puerto.
                                </p>
                                <p className="text-xs text-gray-500 mt-1">
                                    Para dar de alta un nuevo reenvío, bajo un nuevo protocolo, contacte al área de sistemas.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}