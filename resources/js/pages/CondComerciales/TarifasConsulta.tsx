// resources/js/Pages/CondComerciales/TarifasConsulta.tsx
import { router } from '@inertiajs/react';
import React, { useState, useEffect } from 'react';

import DownloadModal from '@/components/Modals/DownloadModal';
import { SpecialPriceButton } from '@/components/ui/SpecialPriceButton';
import AppLayout from '@/layouts/app-layout';
import { sendWhatsApp, createPriceQueryMessage } from '@/utils/whatsapp.utils';

interface ProductoServicio {
    id: number;
    codigopro: string;
    nombre: string;
    descripcion: string;
    precio: number;
    tipo_id: number;
    compania_id: number;
    es_activo: boolean;
    created: string;
    modified: string;
    tipo?: TipoPrdSrv;
}

interface TipoPrdSrv {
    id: number;
    nombre_tipo_abono: string;
    descripcion: string;
    es_activo: boolean;
    created: string;
}

interface Permisos {
    puede_ver_todas: boolean;
    companias_permitidas: number[];
    compania_actual?: {
        id: number;
        nombre: string;
        logo?: string;
    };
}

interface Props {
    productos_servicios: ProductoServicio[];
    tipos_prd_srv: TipoPrdSrv[];
    permisos: Permisos;
}

export default function TarifasConsulta({ productos_servicios, tipos_prd_srv, permisos }: Props) {
    const [productos, setProductos] = useState<ProductoServicio[]>(productos_servicios);
    const [tipos, setTipos] = useState<TipoPrdSrv[]>(tipos_prd_srv);
    const [tiposActivos, setTiposActivos] = useState<TipoPrdSrv[]>([]);
    const [activeTab, setActiveTab] = useState<string>('');
    const [isDownloadModalOpen, setIsDownloadModalOpen] = useState(false);

    useEffect(() => {
        const tiposActivosFiltrados = tipos.filter(tipo => tipo.es_activo);
        setTiposActivos(tiposActivosFiltrados);
        
        if (tiposActivosFiltrados.length > 0 && !activeTab) {
            setActiveTab(tiposActivosFiltrados[0].nombre_tipo_abono);
        }
    }, [tipos]);

    // Ordenar productos por código (ascendente)
    const productosOrdenados = [...productos].sort((a, b) => 
        a.codigopro.localeCompare(b.codigopro)
    );

    const productosFiltrados = productosOrdenados.filter(
        producto => producto.es_activo && 
        tipos.find(tipo => tipo.id === producto.tipo_id)?.nombre_tipo_abono === activeTab
    );

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 2
        }).format(amount);
    };

    // Función para obtener el nombre de la compañía
    const getCompaniaNombre = (companiaId: number) => {
        const companias: Record<number, string> = {
            1: 'LocalSat',
            2: 'SmartSat',
            3: '360',
        };
        return companias[companiaId] || `Compañía ${companiaId}`;
    };

    // Función para obtener el color de la compañía
    const getCompaniaColor = (companiaId: number) => {
        const colores: Record<number, { primary: string; secondary: string }> = {
            1: { primary: '#fa6400', secondary: '#3b3b3d' }, // LocalSat
            2: { primary: '#eb9b11', secondary: '#3b3b3d' }, // SmartSat
            3: { primary: '#fa6400', secondary: '#3b3b3d' }, // 360
        };
        return colores[companiaId] || { primary: '#fa6400', secondary: '#3b3b3d' };
    };

    // Función para extraer información de vehículos del nombre del abono
    const getVehiculosInfo = (nombre: string) => {
        const matchRango = nombre.match(/ABONO\s+(\d+-\d+)/i);
        if (matchRango) return matchRango[1];
        
        const matchRangoSimple = nombre.match(/(\d+-\d+)/);
        if (matchRangoSimple) return matchRangoSimple[1];
        
        const matchPlus = nombre.match(/ABONO\s*\+\s*(\d+)/i);
        if (matchPlus) return `+${matchPlus[1]}`;
        
        const matchPlusSimple = nombre.match(/\+\s*(\d+)/);
        if (matchPlusSimple) return `+${matchPlusSimple[1]}`;
        
        const matchIndividual = nombre.match(/ABONO\s+(\d+)/i);
        if (matchIndividual) return matchIndividual[1];
        
        const matchCualquierNumero = nombre.match(/(\d+)/);
        if (matchCualquierNumero) return matchCualquierNumero[1];
        
        return 'Personalizado';
    };

    const getNombreLimpio = (nombre: string) => {
        return nombre.replace(/\s+/g, ' ').trim();
    };

    const renderServicios = () => {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 md:p-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                                {tipos.find(t => t.nombre_tipo_abono === activeTab)?.descripcion || 'Servicios'}
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {productosFiltrados.length} servicios disponibles
                            </p>
                        </div>
                    </div>
                </div>

                {/* Cards de servicios - Responsive */}
                <div className="p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {productosFiltrados.map((producto) => {
                            const colorCompania = getCompaniaColor(producto.compania_id);
                            const nombreCompania = getCompaniaNombre(producto.compania_id);
                            const esPrecioConsultar = Number(producto.precio) === 0.01;
                            
                            return (
                                <div key={producto.id} className="border border-gray-200 rounded-lg p-4 hover:border-sat transition-colors hover:shadow-md">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 text-base md:text-lg">
                                                {producto.nombre}
                                            </h3>
                                            <p className="text-xs md:text-sm text-gray-500 mt-1">
                                                Código: {producto.codigopro}
                                            </p>
                                            {/* Badge de compañía */}
                                            <div className="mt-2">
                                                <span 
                                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                                    style={{ 
                                                        backgroundColor: colorCompania.primary + '20', // 20% opacity
                                                        color: colorCompania.primary 
                                                    }}
                                                >
                                                    {nombreCompania}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs md:text-sm font-medium flex-shrink-0 ml-2 ${
                                            producto.es_activo 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {producto.es_activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                    
                                    {producto.descripcion && (
                                        <div className="mb-3">
                                            <p className="text-sm text-gray-600 line-clamp-2 md:line-clamp-3">
                                                {producto.descripcion}
                                            </p>
                                        </div>
                                    )}
                                    
                                    <div className="pt-3 border-t border-gray-100">
                                        <div className="flex justify-between items-center">
                                            <div className="text-sm md:text-base font-medium text-gray-700">
                                                Valor:
                                            </div>
                                            {esPrecioConsultar ? (
                                                <SpecialPriceButton producto={producto} />
                                            ) : (
                                                <div className="font-bold text-local text-lg md:text-xl">
                                                    {formatCurrency(producto.precio)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const renderAbonos = () => {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 md:p-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                                {tipos.find(t => t.nombre_tipo_abono === activeTab)?.descripcion || 'Abonos'}
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {productosFiltrados.length} planes de abono disponibles
                            </p>
                        </div>
                    </div>
                </div>

                {/* Cards de abonos - Responsive y atractivas */}
                <div className="p-4 md:p-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                        {productosFiltrados.map((abono) => {
                            const vehiculosInfo = getVehiculosInfo(abono.nombre);
                            const nombreLimpio = getNombreLimpio(abono.nombre);
                            const colorCompania = getCompaniaColor(abono.compania_id);
                            const nombreCompania = getCompaniaNombre(abono.compania_id);
                            const esPrecioConsultar = Number(abono.precio) === 0.01;
                            
                            // Determinar color basado en el tipo
                            const getColorClase = () => {
                                if (vehiculosInfo.includes('+') || vehiculosInfo.includes('151')) {
                                    return {
                                        bg: 'bg-gradient-to-r from-purple-50 to-purple-100',
                                        border: 'border-purple-200',
                                        text: 'text-purple-700'
                                    };
                                }
                                if (vehiculosInfo.includes('-')) {
                                    const [_, max] = vehiculosInfo.split('-').map(Number);
                                    if (max <= 5) return { 
                                        bg: 'bg-gradient-to-r from-blue-50 to-blue-100', 
                                        border: 'border-blue-200', 
                                        text: 'text-blue-700' 
                                    };
                                    if (max <= 15) return { 
                                        bg: 'bg-gradient-to-r from-green-50 to-green-100', 
                                        border: 'border-green-200', 
                                        text: 'text-green-700' 
                                    };
                                    return { 
                                        bg: 'bg-gradient-to-r from-orange-50 to-orange-100', 
                                        border: 'border-orange-200', 
                                        text: 'text-orange-700' 
                                    };
                                }
                                return { 
                                    bg: 'bg-gradient-to-r from-gray-50 to-gray-100', 
                                    border: 'border-gray-200', 
                                    text: 'text-gray-700' 
                                };
                            };
                            
                            const color = getColorClase();

                            return (
                                <div key={abono.id} className="border border-gray-200 rounded-lg overflow-hidden hover:border-sat transition-colors shadow-sm hover:shadow-md">
                                    {/* Header con color */}
                                    <div className={`p-4 ${color.bg} border-b ${color.border}`}>
                                        <div className="flex justify-between items-start">
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-bold text-gray-900 text-base md:text-lg truncate">
                                                    {nombreLimpio}
                                                </h3>
                                                <p className={`text-sm font-medium ${color.text} mt-1`}>
                                                    {vehiculosInfo === 'Personalizado' ? 'Plan Personalizado' : `${vehiculosInfo} vehículos`}
                                                </p>
                                            </div>
                                            <span className="px-2 py-1 bg-white text-gray-700 text-xs rounded-full font-bold border border-gray-300 flex-shrink-0">
                                                {abono.codigopro}
                                            </span>
                                        </div>
                                        {/* Badge de compañía en header */}
                                        <div className="mt-2">
                                            <span 
                                                className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                                style={{ 
                                                    backgroundColor: colorCompania.primary + '20',
                                                    color: colorCompania.primary 
                                                }}
                                            >
                                                {nombreCompania}
                                            </span>
                                        </div>
                                    </div>
                                    
                                    {/* Contenido */}
                                    <div className="p-4">
                                        {/* Precio destacado */}
                                        <div className="text-center mb-4">
                                            {esPrecioConsultar ? (
                                                <div className="mb-2">
                                                    <SpecialPriceButton producto={abono} />
                                                </div>
                                            ) : (
                                                <>
                                                    <div className="text-2xl md:text-3xl font-bold text-local mb-1">
                                                        {formatCurrency(abono.precio)}
                                                    </div>
                                                    <div className="text-sm text-gray-600">
                                                        por mes
                                                    </div>
                                                </>
                                            )}
                                        </div>
                                        
                                        {/* Detalles en grid */}
                                        <div className="grid grid-cols-2 gap-3 mb-4">
                                            {/* Vehículos */}
                                            <div className="text-center bg-gray-50 rounded p-2 md:p-3">
                                                <div className="text-xs md:text-sm text-gray-600 mb-1">Vehículos</div>
                                                <div className="font-bold text-gray-900 text-base md:text-lg">
                                                    {vehiculosInfo === 'Personalizado' ? '1' : vehiculosInfo}
                                                </div>
                                            </div>
                                            
                                            {/* Periodicidad */}
                                            <div className="text-center bg-gray-50 rounded p-2 md:p-3">
                                                <div className="text-xs md:text-sm text-gray-600 mb-1">Periodicidad</div>
                                                <div className="font-bold text-gray-900 text-base md:text-lg flex items-center justify-center gap-1">
                                                    <svg className="w-4 h-4 md:w-5 md:h-5 text-green-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                    </svg>
                                                    <span>Mensual</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* Descripción si existe */}
                                        {abono.descripcion && (
                                            <div className="mb-4">
                                                <div className="text-xs md:text-sm text-gray-600 mb-1">Descripción</div>
                                                <div className="text-sm text-gray-800 line-clamp-2 md:line-clamp-3">
                                                    {abono.descripcion}
                                                </div>
                                            </div>
                                        )}
                                        
                                        {/* Estado */}
                                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                                            <span className={`px-2 py-1 rounded text-xs md:text-sm font-medium ${
                                                abono.es_activo 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {abono.es_activo ? '✓ Activo' : '✗ Inactivo'}
                                            </span>
                                            <span className="text-xs text-gray-500 text-right hidden sm:block">
                                                Actualizado: {new Date(abono.modified).toLocaleDateString('es-AR')}
                                            </span>
                                            <span className="text-xs text-gray-500 text-right sm:hidden">
                                                {new Date(abono.modified).toLocaleDateString('es-AR')}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const renderVistaGenerica = () => {
        return (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200">
                <div className="p-4 md:p-6 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                        <div>
                            <h2 className="text-lg md:text-xl font-semibold text-gray-900">
                                {tipos.find(t => t.nombre_tipo_abono === activeTab)?.nombre_tipo_abono}
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {productosFiltrados.length} productos disponibles
                            </p>
                        </div>
                    </div>
                </div>

                {/* Cards genéricas */}
                <div className="p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
                        {productosFiltrados.map((producto) => {
                            const colorCompania = getCompaniaColor(producto.compania_id);
                            const nombreCompania = getCompaniaNombre(producto.compania_id);
                            const esPrecioConsultar = Number(producto.precio) === 0.01;
                            
                            return (
                                <div key={producto.id} className="border border-gray-200 rounded-lg p-4 hover:border-sat transition-colors hover:shadow-md">
                                    <div className="flex justify-between items-start mb-3">
                                        <div className="flex-1 min-w-0">
                                            <h3 className="font-semibold text-gray-900 text-base md:text-lg">
                                                {producto.nombre}
                                            </h3>
                                            <p className="text-xs md:text-sm text-gray-500 mt-1">
                                                Código: {producto.codigopro}
                                            </p>
                                            {/* Badge de compañía */}
                                            <div className="mt-2">
                                                <span 
                                                    className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                                                    style={{ 
                                                        backgroundColor: colorCompania.primary + '20',
                                                        color: colorCompania.primary 
                                                    }}
                                                >
                                                    {nombreCompania}
                                                </span>
                                            </div>
                                        </div>
                                        <span className={`px-2 py-1 rounded text-xs md:text-sm font-medium flex-shrink-0 ml-2 ${
                                            producto.es_activo 
                                                ? 'bg-green-100 text-green-800' 
                                                : 'bg-red-100 text-red-800'
                                        }`}>
                                            {producto.es_activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                    
                                    {producto.descripcion && (
                                        <div className="mb-3">
                                            <p className="text-sm text-gray-600 line-clamp-2 md:line-clamp-3">
                                                {producto.descripcion}
                                            </p>
                                        </div>
                                    )}
                                    
                                    <div className="pt-3 border-t border-gray-100">
                                        <div className="flex justify-between items-center">
                                            <div className="text-sm md:text-base font-medium text-gray-700">
                                                Valor:
                                            </div>
                                            {esPrecioConsultar ? (
                                                <SpecialPriceButton producto={producto} />
                                            ) : (
                                                <div className="font-bold text-local text-lg md:text-xl">
                                                    {formatCurrency(producto.precio)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        );
    };

    const renderContenidoPorTipo = () => {
        const tipoActivo = tipos.find(t => t.nombre_tipo_abono === activeTab);
        if (!tipoActivo) return null;

        const nombreTipo = tipoActivo.nombre_tipo_abono.toLowerCase();
        const esTipoServicio = nombreTipo.includes('servicio') || nombreTipo.includes('transporte');
        const esTipoAbono = nombreTipo.includes('abono') || nombreTipo.includes('plan');

        if (esTipoServicio) {
            return renderServicios();
        } else if (esTipoAbono) {
            return renderAbonos();
        } else {
            return renderVistaGenerica();
        }
    };

    return (
        <AppLayout title="Catálogo de Productos y Servicios">
            {/* Header con información de compañía y botón de descarga */}
            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-gray-900">
                            Catálogo de Productos y Servicios
                        </h1>
                        <p className="mt-1 md:mt-2 text-gray-600 text-sm md:text-base">
                            Consulta todos los productos y servicios disponibles por categoría
                        </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                        {/* Botón de descarga */}
                        <button
                            onClick={() => setIsDownloadModalOpen(true)}
                            className="inline-flex items-center px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors"
                        >
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>
                            Descargar Listado
                        </button>
                        
                        {/* Badge para usuarios con acceso total */}
                        {permisos.puede_ver_todas && (
                            <div className="flex items-center gap-2 bg-purple-100 rounded-lg px-4 py-2">
                                <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                </svg>
                                <span className="text-sm font-medium text-purple-900">
                                    Acceso total - Todo el catálogo
                                </span>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs - SOLO 2 FILAS EN MÓVIL, 1 FILA EN WEB */}
            <div className="mb-6">
                <div className="border-b border-gray-200">
                    {/* Versión móvil: 2 filas */}
                    <div className="md:hidden">
                        {/* Primera fila de tabs para móvil */}
                        <nav className="flex -mb-px overflow-x-auto pb-0.5 mb-1">
                            {tiposActivos.slice(0, Math.ceil(tiposActivos.length / 2)).map((tipo) => (
                                <button
                                    key={tipo.id}
                                    onClick={() => setActiveTab(tipo.nombre_tipo_abono)}
                                    className={`py-2 px-3 text-sm font-medium border-b-2 whitespace-nowrap flex-shrink-0 ${
                                        activeTab === tipo.nombre_tipo_abono
                                            ? 'border-sat text-sat'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    {tipo.nombre_tipo_abono} ({productos.filter(p => p.es_activo && p.tipo_id === tipo.id).length})
                                </button>
                            ))}
                        </nav>
                        
                        {/* Segunda fila de tabs para móvil */}
                        {tiposActivos.length > 3 && (
                            <nav className="flex -mb-px overflow-x-auto pb-0.5">
                                {tiposActivos.slice(Math.ceil(tiposActivos.length / 2)).map((tipo) => (
                                    <button
                                        key={tipo.id}
                                        onClick={() => setActiveTab(tipo.nombre_tipo_abono)}
                                        className={`py-2 px-3 text-sm font-medium border-b-2 whitespace-nowrap flex-shrink-0 ${
                                            activeTab === tipo.nombre_tipo_abono
                                                ? 'border-sat text-sat'
                                                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }`}
                                    >
                                        {tipo.nombre_tipo_abono} ({productos.filter(p => p.es_activo && p.tipo_id === tipo.id).length})
                                    </button>
                                ))}
                            </nav>
                        )}
                    </div>
                    
                    {/* Versión web: 1 sola fila */}
                    <div className="hidden md:block">
                        <nav className="flex -mb-px space-x-8">
                            {tiposActivos.map((tipo) => (
                                <button
                                    key={tipo.id}
                                    onClick={() => setActiveTab(tipo.nombre_tipo_abono)}
                                    className={`py-3 px-1 text-sm font-medium border-b-2 whitespace-nowrap ${
                                        activeTab === tipo.nombre_tipo_abono
                                            ? 'border-sat text-sat'
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                    }`}
                                >
                                    {tipo.nombre_tipo_abono} ({productos.filter(p => p.es_activo && p.tipo_id === tipo.id).length})
                                </button>
                            ))}
                        </nav>
                    </div>
                </div>
            </div>

            {/* Contenido dinámico */}
            {activeTab && renderContenidoPorTipo()}
            
            <DownloadModal
                isOpen={isDownloadModalOpen}
                onClose={() => setIsDownloadModalOpen(false)}
                tipos={tiposActivos}
                productos={productos}
                companiaInfo={permisos.compania_actual}
                puedeVerTodas={permisos.puede_ver_todas}
            />

            {/* Sección de información */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="p-4 md:p-6 border-b border-gray-200">
                    <h3 className="text-base md:text-lg font-semibold text-gray-900">
                        Información Importante
                    </h3>
                </div>
                <div className="p-4 md:p-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6">
                        <div className="bg-blue-50 rounded-lg p-4 md:p-5 border border-blue-100">
                            <div className="font-medium text-blue-800 text-sm md:text-base mb-1 md:mb-2">
                                Precios sin IVA
                            </div>
                            <div className="text-sm text-blue-700">
                                Todos los precios mostrados no incluyen IVA (21%)
                            </div>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 md:p-5 border border-green-100">
                            <div className="font-medium text-green-800 text-sm md:text-base mb-1 md:mb-2">
                                Productos activos
                            </div>
                            <div className="text-sm text-green-700">
                                Solo se muestran productos marcados como activos
                            </div>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 md:p-5 border border-purple-100">
                            <div className="font-medium text-purple-800 text-sm md:text-base mb-1 md:mb-2">
                                Actualización
                            </div>
                            <div className="text-sm text-purple-700">
                                Los productos se encuentran actualizados
                            </div>
                        </div>
                        <div className="bg-amber-50 rounded-lg p-4 md:p-5 border border-amber-100">
                            <div className="font-medium text-amber-800 text-sm md:text-base mb-1 md:mb-2">
                                Compañía
                            </div>
                            <div className="text-sm text-amber-700">
                                {permisos.puede_ver_todas 
                                    ? 'Acceso a todo el catálogo' 
                                    : permisos.compania_actual 
                                        ? `Viendo: ${permisos.compania_actual.nombre}`
                                        : 'Compañía asignada'}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}