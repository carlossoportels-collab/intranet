// resources/js/Pages/Comercial/Cuentas/Detalles.tsx

import { Head, router } from '@inertiajs/react';

import React, { useState, useMemo, useEffect } from 'react';
import { Filter, X } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { Empresa, DetallesCuentasProps } from '@/types/cuentas';

// Componentes UI
import SelectPerPage from '@/components/ui/SelectPerPage';
import BuscadorModerno from '@/components/ui/BuscadorModerno';
import Pagination from '@/components/ui/Pagination';
import { ComercialFilter } from '@/components/cuentas/ComercialFilter';

// Componentes de Cuentas
import FilaEmpresaCompacta from '@/components/cuentas/FilaEmpresaCompacta';
import DetalleEmpresaCompacto from '@/components/cuentas/DetalleEmpresaCompacto';
import ListaVehiculosConAbonos from '@/components/cuentas/ListaVehiculosConAbonos';
import EstadisticasAbonosCards from '@/components/cuentas/EstadisticasAbonosCards';

export default function DetallesCuentas({ 
    empresas, 
    estadisticas, 
    estadisticas_abonos, 
    comerciales, 
    usuario,
    prefijosFiltro = [],
    filters 
}: DetallesCuentasProps)  {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedEmpresa, setSelectedEmpresa] = useState<Empresa | null>(null);
    const [itemsPerPage, setItemsPerPage] = useState(15);
    const [currentPage, setCurrentPage] = useState(1);
    const [showDetail, setShowDetail] = useState(false);
    const [comercialFilter, setComercialFilter] = useState<number | null>(filters?.comercial_id || null);
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    

    // Efecto para manejar la apertura/cierre del detalle
    useEffect(() => {
        if (selectedEmpresa) {
            setShowDetail(true);
            document.body.style.overflow = 'hidden';
        } else {
            setShowDetail(false);
            document.body.style.overflow = 'unset';
        }

        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [selectedEmpresa]);

    // Filtrar empresas
    const empresasFiltradas = useMemo(() => {
        let resultado = [...empresas];
        
        // Filtro por comercial (basado en prefijo_id)
        if (comercialFilter) {
            const comercial = comerciales.find(c => c.id === comercialFilter);
            if (comercial) {
                resultado = resultado.filter(empresa => 
                    empresa.prefijo_id === comercial.prefijo_id
                );
            }
        }
        
        // Filtro por texto
        if (searchTerm.trim()) {
            const term = searchTerm.toLowerCase();
            resultado = resultado.filter(empresa =>
                (empresa.nombre_fantasia?.toLowerCase() || '').includes(term) ||
                (empresa.razon_social?.toLowerCase() || '').includes(term) ||
                (empresa.cuit || '').includes(term) ||
                (empresa.codigo_alfa_empresa?.toLowerCase() || '').includes(term)
            );
        }
        
        return resultado;
    }, [empresas, comercialFilter, searchTerm, comerciales]);

    // Paginación
    const totalItems = empresasFiltradas.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const empresasPaginated = empresasFiltradas.slice(startIndex, endIndex);

    // Verificar si hay filtros activos
    const hayFiltrosActivos = searchTerm !== '' || comercialFilter !== null;

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

const handleComercialFilter = (comercialId: number | null) => {
    setComercialFilter(comercialId);
    setCurrentPage(1);
    setSelectedEmpresa(null);
    
    // Usar la URL completa con el prefijo 'comercial'
    router.get('/comercial/cuentas', 
        { comercial_id: comercialId },
        {
            preserveState: true,
            preserveScroll: true,
            replace: true
        }
    );
};

const clearAllFilters = () => {
    setSearchTerm('');
    setComercialFilter(null);
    setCurrentPage(1);
    setSelectedEmpresa(null);
    
    router.get('/comercial/cuentas', {}, {
        preserveState: true,
        preserveScroll: true,
        replace: true
    });
};

    const selectEmpresa = (empresa: Empresa) => {
        setSelectedEmpresa(empresa);
    };

    const closeDetail = () => {
        setSelectedEmpresa(null);
    };

    const totalVehiculos = empresas.reduce((acc, emp) => acc + emp.vehiculos.length, 0);

    return (
        <AppLayout title="Detalles de Cuentas">
            <Head title="Detalles de Cuentas" />
            
            {/* Header */}
            <div className="max-w-8xl mx-auto px-4 sm:px-6 py-6">
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
                
                 {/* Stats de empresas */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-500">Total Empresas</div>
                        <div className="text-2xl font-bold">{estadisticas.total}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-500">Total Abonos</div>
                        <div className="text-2xl font-bold">{estadisticas.abonos}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-500">Nuevas (30d)</div>
                        <div className="text-2xl font-bold">{estadisticas.nuevas}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-500">Vehículos</div>
                        <div className="text-2xl font-bold">{totalVehiculos}</div>
                    </div>
                </div>
            </div>

            {/* Estadísticas de abonos 
            {estadisticas_abonos.tipos_principales.length > 0 && (
                <div className="mb-6">
                    <EstadisticasAbonosCards
                        tiposPrincipales={estadisticas_abonos.tipos_principales}
                        totalAbonos={estadisticas_abonos.total_abonos}
                        totalMonto={estadisticas_abonos.total_monto}
                        puedeVerMontos={usuario.puede_ver_montos}
                    />
                </div>
            )}

            {/* Mobile Toggle */}
            <div className="mb-4 flex justify-between items-center md:hidden">
                <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                >
                    <Filter className="h-4 w-4" />
                    Filtros
                    {hayFiltrosActivos && (
                        <span className="ml-1 w-2 h-2 bg-sat rounded-full"></span>
                    )}
                </button>
                {hayFiltrosActivos && (
                    <button
                        onClick={clearAllFilters}
                        className="text-sm text-red-600 flex items-center gap-1"
                    >
                        <X className="h-4 w-4" />
                        Limpiar
                    </button>
                )}
            </div>

            {/* Filtros y buscador */}
            <div className={`${showMobileFilters ? 'block' : 'hidden md:block'} mb-4`}>
                <div className="flex flex-col md:flex-row gap-3">
                    {/* Buscador */}
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
                    
                    {/* Filtro por comercial */}
                    <div className="w-full md:w-64">
                        <ComercialFilter
                            comerciales={comerciales}
                            prefijosFiltro={prefijosFiltro}
                            value={comercialFilter}
                            onChange={handleComercialFilter}
                            usuarioEsComercial={!usuario.ve_todas_cuentas}
                            prefijoUsuario={usuario.prefijo_usuario}
                        />
                    </div>

                    {/* Selector de items por página (móvil) */}
                    <div className="flex md:hidden items-center justify-between gap-2">
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

                {/* Controles de paginación desktop */}
                <div className="hidden md:flex items-center justify-end gap-2 mt-3">
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

            {/* Lista de empresas */}
            <div className={`bg-white rounded-lg border border-gray-200 overflow-hidden transition-all duration-300 ${
                showDetail ? 'sm:blur-sm sm:opacity-40' : ''
            }`}>
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
                        {hayFiltrosActivos && (
                            <button onClick={clearAllFilters} className="mt-2 text-xs text-blue-600 hover:underline">
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                ) : (
                    empresasPaginated.map((empresa) => (
                        <FilaEmpresaCompacta
                            key={empresa.id}
                            empresa={empresa}
                            isSelected={selectedEmpresa?.id === empresa.id}
                            onClick={selectEmpresa}
                        />
                    ))
                )}
            </div>

            {/* Paginación */}
            {totalPages > 1 && (
                <Pagination
                    currentPage={currentPage}
                    lastPage={totalPages}
                    total={totalItems}
                    perPage={itemsPerPage}
                    onPageChange={setCurrentPage}
                    useLinks={false}
                    className="mt-4"
                />
            )}

            {/* Modal de detalle */}
            {selectedEmpresa && (
                <>
                    <div 
                        className="fixed inset-0 bg-black/50 z-40 transition-opacity duration-300"
                        onClick={closeDetail}
                    />
                    
                    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                        <div className="bg-white rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto animate-slideUp">
                            <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-indigo-100 rounded-lg">
                                        <svg className="w-5 h-5 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                        </svg>
                                    </div>
                                    <h3 className="text-lg font-semibold text-slate-900">
                                        {selectedEmpresa.nombre_fantasia || selectedEmpresa.razon_social}
                                    </h3>
                                </div>
                                <button 
                                    onClick={closeDetail}
                                    className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                                >
                                    <svg className="w-5 h-5 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            <div className="p-6">
                                <DetalleEmpresaCompacto empresa={selectedEmpresa} />
                                <div className="mt-6">
                                    <ListaVehiculosConAbonos vehiculos={selectedEmpresa.vehiculos} />
                                </div>
                            </div>
                        </div>
                    </div>
                </>
            )}
        </AppLayout>
    );
}