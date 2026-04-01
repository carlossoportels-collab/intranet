// resources/js/Pages/Comercial/Cuentas/CertificadosFlota.tsx

import { Head, router, usePage } from '@inertiajs/react';
import React, { useState, useMemo, useEffect } from 'react';
import { Filter, X, Download, FileText, Search as SearchIcon } from 'lucide-react';

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
    codigo_alfa?: string;
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
    const [modoVista, setModoVista] = useState<'empresas' | 'vehiculos'>('empresas');

    // Detectar si es una búsqueda por patente (tiene números o formato de patente)
    const esBusquedaPatente = useMemo(() => {
        if (!searchTerm) return false;
        // Patente típica: letras y números, con al menos 2 números
        return /[0-9]/.test(searchTerm) && searchTerm.length >= 2;
    }, [searchTerm]);

    // 🔥 FILTRAR EMPRESAS Y VEHÍCULOS
    const { empresasFiltradas, vehiculosFiltrados, totalVehiculosCoincidentes } = useMemo(() => {
        if (!searchTerm) {
            return {
                empresasFiltradas: empresas,
                vehiculosFiltrados: [],
                totalVehiculosCoincidentes: 0
            };
        }

        const term = searchTerm.toLowerCase().trim();
        
        // Filtrar empresas por nombre
        const empresasPorNombre = empresas.filter(empresa =>
            (empresa.nombre_fantasia?.toLowerCase() || '').includes(term) ||
            (empresa.razon_social?.toLowerCase() || '').includes(term)
        );

        // Filtrar vehículos por patente
        const vehiculosEncontrados: { empresa: Empresa; vehiculo: Vehiculo }[] = [];
        
        empresas.forEach(empresa => {
            empresa.vehiculos.forEach(vehiculo => {
                if (vehiculo.patente?.toLowerCase().includes(term)) {
                    vehiculosEncontrados.push({
                        empresa,
                        vehiculo
                    });
                }
            });
        });

        // Empresas que tienen vehículos coincidentes (para modo empresas)
        const idsEmpresasConVehiculos = new Set(vehiculosEncontrados.map(v => v.empresa.id));
        const empresasPorVehiculo = empresas.filter(empresa => 
            idsEmpresasConVehiculos.has(empresa.id)
        );

        // Combinar empresas (por nombre + por vehículo) sin duplicados
        const empresasCombinadas = [...empresasPorNombre];
        empresasPorVehiculo.forEach(empresa => {
            if (!empresasCombinadas.some(e => e.id === empresa.id)) {
                empresasCombinadas.push(empresa);
            }
        });

        return {
            empresasFiltradas: empresasCombinadas,
            vehiculosFiltrados: vehiculosEncontrados,
            totalVehiculosCoincidentes: vehiculosEncontrados.length
        };
    }, [empresas, searchTerm]);

    // Determinar qué mostrar según el modo
    const modoAutomatico = esBusquedaPatente && vehiculosFiltrados.length > 0;
    const vistaActual = modoVista === 'empresas' ? 'empresas' : 'vehiculos';
    const mostrarVistaVehiculos = (esBusquedaPatente || modoVista === 'vehiculos') && vehiculosFiltrados.length > 0;

    // Paginación para empresas
    const totalItemsEmpresas = empresasFiltradas.length;
    const totalPagesEmpresas = Math.ceil(totalItemsEmpresas / itemsPerPage);
    const startIndexEmpresas = (currentPage - 1) * itemsPerPage;
    const endIndexEmpresas = startIndexEmpresas + itemsPerPage;
    const empresasPaginated = empresasFiltradas.slice(startIndexEmpresas, endIndexEmpresas);

    // Paginación para vehículos
    const totalItemsVehiculos = vehiculosFiltrados.length;
    const totalPagesVehiculos = Math.ceil(totalItemsVehiculos / itemsPerPage);
    const startIndexVehiculos = (currentPage - 1) * itemsPerPage;
    const endIndexVehiculos = startIndexVehiculos + itemsPerPage;
    const vehiculosPaginated = vehiculosFiltrados.slice(startIndexVehiculos, endIndexVehiculos);

    const hayFiltrosActivos = filters.search !== undefined && filters.search !== '';

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
        setModoVista('empresas');
        
        router.get('/comercial/cuentas/certificados', 
            {},
            { preserveState: true, replace: true }
        );
    };

    const clearAllFilters = () => {
        setSearchTerm('');
        setCurrentPage(1);
        setModoVista('empresas');
        
        router.get('/comercial/cuentas/certificados', {}, {
            preserveState: true,
            preserveScroll: true,
            replace: true
        });
    };

    useEffect(() => {
        if (filters.search !== searchTerm) {
            setSearchTerm(filters.search || '');
        }
    }, [filters.search]);

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
                    <div className="flex-1">
                        <BuscadorModerno
                            value={searchTerm}
                            onChange={handleSearch}
                            onClear={clearSearch}
                            placeholder="Buscar por nombre de empresa o patente..."
                            showResultsCount
                            resultsCount={searchTerm ? (mostrarVistaVehiculos ? totalItemsVehiculos : totalItemsEmpresas) : empresas.length}
                            totalCount={mostrarVistaVehiculos ? totalItemsVehiculos : empresas.length}
                        />
                    </div>

                    {/* Selector de modo de vista cuando hay resultados de patente */}
                    {vehiculosFiltrados.length > 0 && (
                        <div className="flex gap-2">
                            <button
                                onClick={() => setModoVista('empresas')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    modoVista === 'empresas' 
                                        ? 'bg-indigo-600 text-white' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Ver por Empresas ({empresasFiltradas.length})
                            </button>
                            <button
                                onClick={() => setModoVista('vehiculos')}
                                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                                    modoVista === 'vehiculos' 
                                        ? 'bg-indigo-600 text-white' 
                                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                }`}
                            >
                                Ver por Vehículos ({vehiculosFiltrados.length})
                            </button>
                        </div>
                    )}
                </div>

                {/* Controles de paginación */}
                <div className="hidden md:flex items-center justify-end gap-2 mt-3">
                    <span className="text-xs sm:text-sm text-slate-500 whitespace-nowrap">
                        {mostrarVistaVehiculos 
                            ? `${startIndexVehiculos + 1}-${Math.min(endIndexVehiculos, totalItemsVehiculos)} de ${totalItemsVehiculos} vehículos`
                            : `${startIndexEmpresas + 1}-${Math.min(endIndexEmpresas, totalItemsEmpresas)} de ${totalItemsEmpresas} empresas`
                        }
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

            {/* CONTENIDO: Empresas o Vehículos */}
            {mostrarVistaVehiculos && modoVista === 'vehiculos' ? (
                // 🔥 VISTA DE VEHÍCULOS
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-gray-500 uppercase border-b border-gray-200 bg-gray-50">
                        <div className="col-span-3">Empresa</div>
                        <div className="col-span-3">Patente / Código</div>
                        <div className="col-span-3">Vehículo</div>
                        <div className="col-span-3">Acción</div>
                    </div>

                    {vehiculosPaginated.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-sm text-gray-500">
                                No se encontraron vehículos con patente "{filters.search}"
                            </p>
                        </div>
                    ) : (
                        vehiculosPaginated.map(({ empresa, vehiculo }) => (
                            <div key={vehiculo.id} className="border-b border-gray-100 hover:bg-gray-50">
                                <div className="grid grid-cols-1 sm:grid-cols-12 gap-2 p-4">
                                    {/* Empresa */}
                                    <div className="sm:col-span-3">
                                        <div className="text-xs text-gray-500 sm:hidden mb-1">Empresa</div>
                                        <div>
                                            <p className="font-medium text-gray-900 text-sm">{empresa.nombre_fantasia || empresa.razon_social}</p>
                                            <p className="text-xs text-gray-500">{empresa.cuit}</p>
                                        </div>
                                    </div>
                                    
                                    {/* Patente */}
                                    <div className="sm:col-span-3">
                                        <div className="text-xs text-gray-500 sm:hidden mb-1">Patente</div>
                                        <div>
                                            <span className="font-mono text-sm font-bold text-indigo-600">{vehiculo.patente}</span>
                                            {vehiculo.codigo_alfa && (
                                                <p className="text-xs text-gray-400">{vehiculo.codigo_alfa}</p>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Vehículo */}
                                    <div className="sm:col-span-3">
                                        <div className="text-xs text-gray-500 sm:hidden mb-1">Vehículo</div>
                                        <div>
                                            <p className="text-sm">{vehiculo.marca} {vehiculo.modelo}</p>
                                            <p className="text-xs text-gray-500">{vehiculo.anio} • {vehiculo.color}</p>
                                            {vehiculo.accesorios.length > 0 && (
                                                <div className="flex flex-wrap gap-1 mt-1">
                                                    {vehiculo.accesorios.slice(0, 2).map(acc => (
                                                        <span key={acc} className="text-[10px] bg-gray-100 px-1.5 py-0.5 rounded">
                                                            {acc}
                                                        </span>
                                                    ))}
                                                    {vehiculo.accesorios.length > 2 && (
                                                        <span className="text-[10px] text-gray-400">+{vehiculo.accesorios.length - 2}</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Acción */}
                                    <div className="sm:col-span-3 flex items-center gap-2">
                                        <div className="text-xs text-gray-500 sm:hidden mb-1">Acción</div>
                                        <button
                                            onClick={() => {
                                                window.open(`/comercial/cuentas/certificados/vehiculo/${vehiculo.id}`, '_blank');
                                            }}
                                            className="inline-flex items-center gap-1 px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-xs font-medium hover:bg-green-100 transition-colors"
                                        >
                                            <Download className="h-3 w-3" />
                                            Certificado
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}

                    {/* Paginación vehículos */}
                    {totalPagesVehiculos > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            lastPage={totalPagesVehiculos}
                            total={totalItemsVehiculos}
                            perPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                            useLinks={false}
                            className="mt-4 p-4"
                        />
                    )}
                </div>
            ) : (
                // 🔥 VISTA DE EMPRESAS (original)
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2 text-xs font-medium text-gray-500 uppercase border-b border-gray-200 bg-gray-50">
                        <div className="col-span-2">Código</div>
                        <div className="col-span-4">Empresa</div>
                        <div className="col-span-2">Vehículos</div>
                        <div className="col-span-2">Certificado</div>
                        <div className="col-span-2">Acción</div>
                    </div>

                    {empresasPaginated.length === 0 ? (
                        <div className="text-center py-8">
                            <p className="text-sm text-gray-500">
                                {hayFiltrosActivos 
                                    ? `No se encontraron empresas que coincidan con "${filters.search}"` 
                                    : 'No hay empresas disponibles'}
                            </p>
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

                    {/* Paginación empresas */}
                    {totalPagesEmpresas > 1 && (
                        <Pagination
                            currentPage={currentPage}
                            lastPage={totalPagesEmpresas}
                            total={totalItemsEmpresas}
                            perPage={itemsPerPage}
                            onPageChange={setCurrentPage}
                            useLinks={false}
                            className="mt-4 p-4"
                        />
                    )}
                </div>
            )}
        </AppLayout>
    );
}