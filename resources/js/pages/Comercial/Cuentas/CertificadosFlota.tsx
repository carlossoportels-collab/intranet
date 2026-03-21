// resources/js/Pages/Comercial/Cuentas/CertificadosFlota.tsx

import { Head, router } from '@inertiajs/react';
import React, { useState, useMemo, useEffect } from 'react';
import { Filter, X, Download, FileText } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';
import { FilaEmpresaCertificado } from '@/components/cuentas/FilaEmpresaCertificado';
import BuscadorModerno from '@/components/ui/BuscadorModerno';
import SelectPerPage from '@/components/ui/SelectPerPage';
import Pagination from '@/components/ui/Pagination';

interface Vehiculo {
    id: number;
    patente: string;
    marca: string;
    modelo: string;
    anio: number;
    color: string;
    identificador: string;
    accesorios: string[];
    tiene_accesorios: boolean;
}

interface Empresa {
    id: number;
    codigo_alfa_empresa: string;
    nombre_fantasia: string;
    razon_social: string;
    cuit: string;
    total_vehiculos: number;
    vehiculos_con_accesorios: number;
    vehiculos: Vehiculo[];
}

interface CertificadosFlotaProps {
    empresas: Empresa[];
    usuario: {
        ve_todas_cuentas: boolean;
        prefijos: number[];
        rol_id: number;
        puede_ver_todas: boolean;
    };
    filters: {
        search?: string;
    };
    puede_ver_todas: boolean;
}

export default function CertificadosFlota({ 
    empresas, 
    usuario,
    filters,
    puede_ver_todas
}: CertificadosFlotaProps) {
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [itemsPerPage, setItemsPerPage] = useState(15);
    const [currentPage, setCurrentPage] = useState(1);
    const [showMobileFilters, setShowMobileFilters] = useState(false);

    // Filtrar empresas por texto
    const empresasFiltradas = useMemo(() => {
        let resultado = [...empresas];
        
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
    }, [empresas, searchTerm]);

    // Paginación
    const totalItems = empresasFiltradas.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const empresasPaginated = empresasFiltradas.slice(startIndex, endIndex);

    // Verificar si hay filtros activos
    const hayFiltrosActivos = searchTerm !== '';

    // Handlers
    const handleSearch = (value: string) => {
        setSearchTerm(value);
        setCurrentPage(1);
        
        router.get('/comercial/cuentas/certificados', 
            { search: value },
            { preserveState: true, replace: true }
        );
    };

    const clearSearch = () => {
        setSearchTerm('');
        setCurrentPage(1);
        
        router.get('/comercial/cuentas/certificados', 
            {},
            { preserveState: true, replace: true }
        );
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setCurrentPage(1);
        
        router.get('/comercial/cuentas/certificados', {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    // Calcular totales
    const totalVehiculos = empresas.reduce((acc, emp) => acc + emp.total_vehiculos, 0);
    const totalVehiculosConAccesorios = empresas.reduce((acc, emp) => acc + emp.vehiculos_con_accesorios, 0);

    return (
        <AppLayout title="Certificados de Flota">
            <Head title="Certificados de Flota" />
            
            {/* Header */}
            <div className="mb-6">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
                    <div>
                        <h1 className="text-xl sm:text-2xl font-bold text-slate-900">
                            Certificados de Flota
                        </h1>
                        <p className="mt-1 text-slate-500 text-xs sm:text-sm">
                            Genere certificados de flota completos o individuales por vehículo
                        </p>
                    </div>
                    <span className={`self-start sm:self-center text-xs px-3 py-1.5 rounded-full font-medium ${
                        puede_ver_todas 
                            ? 'bg-indigo-100 text-indigo-700 border border-indigo-200' 
                            : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}>
                        {puede_ver_todas ? '🔓 Acceso a todas las empresas' : '🔒 Solo mis empresas'}
                    </span>
                </div>
                
                {/* Stats rápidas */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 mb-6">
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-500">Total Empresas</div>
                        <div className="text-2xl font-bold">{empresas.length}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-500">Total Vehículos</div>
                        <div className="text-2xl font-bold">{totalVehiculos}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-500">Con Accesorios</div>
                        <div className="text-2xl font-bold">{totalVehiculosConAccesorios}</div>
                    </div>
                    <div className="bg-white p-4 rounded-lg border border-gray-200">
                        <div className="text-sm text-gray-500">Certificados</div>
                        <div className="text-2xl font-bold flex items-center gap-2">
                            <Download size={20} className="text-indigo-600" />
                            <span>Disponibles</span>
                        </div>
                    </div>
                </div>
            </div>

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
                    {/* Buscador - ocupa todo el ancho */}
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
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Cabecera */}
                <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-gray-500 uppercase border-b border-gray-200 bg-gray-50">
                    <div className="col-span-2">Código</div>
                    <div className="col-span-4">Empresa</div>
                    <div className="col-span-2">Vehículos</div>
                    <div className="col-span-2">Certificado</div>
                    <div className="col-span-2">Acción</div>
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
                        <FilaEmpresaCertificado
                            key={empresa.id}
                            empresa={empresa}
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
        </AppLayout>
    );
}