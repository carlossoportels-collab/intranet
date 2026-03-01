// resources/js/Pages/Comercial/Cuentas/Detalles.tsx
import { Head } from '@inertiajs/react';
import React, { useState, useMemo } from 'react';

import AppLayout from '@/layouts/app-layout';
import { Empresa, DetallesCuentasProps } from '@/types/cuentas';

// Componentes UI
import StatsCard from '@/components/ui/StatsCard';
import SelectPerPage from '@/components/ui/SelectPerPage';
import BuscadorModerno from '@/components/ui/BuscadorModerno';

// Componentes de Cuentas
import FilaEmpresaCompacta from '@/components/cuentas/FilaEmpresaCompacta';
import DetalleEmpresaCompacto from '@/components/cuentas/DetalleEmpresaCompacto';
import ListaVehiculosConAbonos from '@/components/cuentas/ListaVehiculosConAbonos';
import PaginadorCuentas from '@/components/cuentas/PaginadorCuentas';

export default function DetallesCuentas({ empresas, estadisticas, usuario }: DetallesCuentasProps) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
    const [itemsPerPage, setItemsPerPage] = useState(15);
    const [currentPage, setCurrentPage] = useState(1);

    // Filtrar empresas
    const empresasFiltradas = useMemo(() => {
        let resultado = empresas;
        
        if (searchTerm.trim()) {
            resultado = resultado.filter(empresa =>
                (empresa.nombre_fantasia?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (empresa.razon_social?.toLowerCase() || '').includes(searchTerm.toLowerCase()) ||
                (empresa.cuit || '').includes(searchTerm) ||
                (empresa.codigo_alfa_empresa?.toLowerCase() || '').includes(searchTerm.toLowerCase())
            );
        }
        
        return resultado;
    }, [empresas, searchTerm]);

    // Paginación de empresas
    const totalItems = empresasFiltradas.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const empresasPaginated = empresasFiltradas.slice(startIndex, endIndex);

    // Handlers
    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
        setSelectedEmpresa(null);
    };

    const clearSearch = () => {
        setSearchTerm('');
        setCurrentPage(1);
        setSelectedEmpresa(null);
    };

    const selectEmpresa = (empresa: Empresa) => {
        setSelectedEmpresa(prev => prev?.id === empresa.id ? null : empresa);
    };

    const totalVehiculos = empresas.reduce((acc, emp) => acc + emp.vehiculos.length, 0);

    return (
        <AppLayout title="Detalles de Cuentas">
            <Head title="Detalles de Cuentas" />
            
            {/* Header responsive */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                            Detalles de Cuentas
                        </h1>
                        <p className="mt-1 text-slate-500 text-xs sm:text-sm">
                            Información detallada de clientes y sus vehículos
                        </p>
                    </div>
                    <span className={`self-start sm:self-center text-xs px-3 py-1.5 rounded-full font-medium ${
                        usuario.ve_todas_cuentas 
                            ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                        {usuario.ve_todas_cuentas ? '🔓 Acceso total' : '🔒 Acceso limitado'}
                    </span>
                </div>
                
                {/* Stats con nuevo estilo */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-500">Total empresas</span>
                            <span className="p-2 bg-indigo-100 rounded-lg">
                                <svg className="w-4 h-4 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                </svg>
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-slate-900">{estadisticas.total}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-500">Activas</span>
                            <span className="p-2 bg-emerald-100 rounded-lg">
                                <svg className="w-4 h-4 text-emerald-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-emerald-600">{estadisticas.activas}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-500">Nuevas (30d)</span>
                            <span className="p-2 bg-violet-100 rounded-lg">
                                <svg className="w-4 h-4 text-violet-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-violet-600">{estadisticas.nuevas}</p>
                    </div>
                    <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-slate-500">Vehículos</span>
                            <span className="p-2 bg-amber-100 rounded-lg">
                                <svg className="w-4 h-4 text-amber-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4-4m-4 4l4 4" />
                                </svg>
                            </span>
                        </div>
                        <p className="text-2xl font-bold text-amber-600">{totalVehiculos}</p>
                    </div>
                </div>
            </div>

            {/* Buscador y controles */}
            <div className="mb-4 flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                    <BuscadorModerno
                        value={searchTerm}
                        onChange={handleSearch}
                        onClear={clearSearch}
                        placeholder="Buscar por nombre, CUIT o código..."
                        showResultsCount
                        resultsCount={empresasFiltradas.length}
                        totalCount={empresas.length}
                    />
                </div>
                <div className="flex items-center justify-between sm:justify-end gap-2">
                    <span className="text-xs sm:text-sm text-slate-500 whitespace-nowrap">
                        {startIndex + 1}-{Math.min(endIndex, totalItems)} de {totalItems}
                    </span>
                    <SelectPerPage 
                        value={itemsPerPage}
                        onChange={(value) => {
                            setItemsPerPage(value);
                            setCurrentPage(1);
                        }}
                        options={[15, 30, 50, 100]}
                        className="text-xs sm:text-sm"
                    />
                </div>
            </div>

            {/* Tabla de empresas */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Cabecera */}
                <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-gray-500 uppercase border-b border-gray-200 bg-gray-50">
                    <div className="col-span-2">Código</div>
                    <div className="col-span-3">Empresa</div>
                    <div className="col-span-2">CUIT</div>
                    <div className="col-span-2">Contacto</div>
                    <div className="col-span-1">Métricas</div>
                    <div className="col-span-1">Fecha</div>
                    <div className="col-span-1"></div>
                </div>

                {/* Filas */}
                {empresasPaginated.length === 0 ? (
                    <div className="text-center py-8">
                        <p className="text-sm text-gray-500">No hay empresas encontradas</p>
                        {searchTerm && (
                            <button onClick={clearSearch} className="mt-2 text-xs text-blue-600 hover:underline">
                                Limpiar búsqueda
                            </button>
                        )}
                    </div>
                ) : (
                    <>
                        {empresasPaginated.map((empresa) => (
                            <React.Fragment key={empresa.id}>
                                <FilaEmpresaCompacta
                                    empresa={empresa}
                                    isSelected={selectedEmpresa?.id === empresa.id}
                                    onClick={selectEmpresa}
                                />
                                
                                {/* Detalle expandido con vehículos */}
                                {selectedEmpresa?.id === empresa.id && (
                                    <>
                                        <DetalleEmpresaCompacto empresa={empresa} />
                                        <ListaVehiculosConAbonos vehiculos={empresa.vehiculos} />
                                    </>
                                )}
                            </React.Fragment>
                        ))}
                    </>
                )}
            </div>

            {/* Paginación de empresas */}
            {totalPages > 1 && (
                <div className="mt-4">
                    <PaginadorCuentas
                        currentPage={currentPage}
                        totalPages={totalPages}
                        onPageChange={setCurrentPage}
                    />
                </div>
            )}
        </AppLayout>
    );
}