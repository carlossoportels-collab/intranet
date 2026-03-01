// resources/js/Pages/RRHH/Personal/DatosPersonales.tsx
import { Head } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import React, { useState, useEffect } from 'react';

import AppLayout from '@/layouts/app-layout';

interface TipoPersonal {
    id: number;
    nombre: string;
}

interface Personal {
    id: number;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    fecha_nacimiento: string | null;
    tipo_personal_id: number;
    activo: boolean;
    created: string;
    modified: string;
    tipo_personal?: TipoPersonal;
}

interface Props {
    personal: Personal[];
    tiposPersonal: TipoPersonal[];
    estadisticas: {
        total: number;
        activos: number;
        tiposCount: Record<string, number>;
    };
}

export default function DatosPersonales({ personal, tiposPersonal, estadisticas }: Props) {
    const [selectedPersona, setSelectedPersona] = useState<Personal | null>(personal[0] || null);
    const [searchTerm, setSearchTerm] = useState('');
    const [showFilters, setShowFilters] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 6;

    // Filtrar personal según búsqueda
    const personalFiltrado = personal.filter(persona =>
        persona.nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
        persona.apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
        persona.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        persona.telefono.includes(searchTerm)
    );

    // Calcular paginación
    const totalPages = Math.ceil(personalFiltrado.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const personalPaginated = personalFiltrado.slice(startIndex, endIndex);

    // Cambiar página
    const goToPage = (page: number) => {
        if (page >= 1 && page <= totalPages) {
            setCurrentPage(page);
        }
    };

    // Formatear fecha
    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
        } catch {
            return 'Fecha inválida';
        }
    };

    // Calcular edad
    const calcularEdad = (fechaNacimiento: string | null) => {
        if (!fechaNacimiento) return 'N/A';
        try {
            const fechaNac = new Date(fechaNacimiento);
            const hoy = new Date();
            let edad = hoy.getFullYear() - fechaNac.getFullYear();
            const mes = hoy.getMonth() - fechaNac.getMonth();
            if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
                edad--;
            }
            return `${edad} años`;
        } catch {
            return 'N/A';
        }
    };

    // Calcular antigüedad (desde created)
    const calcularAntiguedad = (fechaIngreso: string) => {
        try {
            const fechaIng = new Date(fechaIngreso);
            const hoy = new Date();
            const diferenciaMs = hoy.getTime() - fechaIng.getTime();
            const años = Math.floor(diferenciaMs / (1000 * 60 * 60 * 24 * 365.25));
            const meses = Math.floor((diferenciaMs % (1000 * 60 * 60 * 24 * 365.25)) / (1000 * 60 * 60 * 24 * 30.44));
            
            if (años === 0) {
                return `${meses} mes${meses !== 1 ? 'es' : ''}`;
            }
            return `${años} año${años !== 1 ? 's' : ''} ${meses > 0 ? `y ${meses} mes${meses !== 1 ? 'es' : ''}` : ''}`;
        } catch {
            return 'N/A';
        }
    };

    // Obtener color según tipo de personal
    const getTipoColor = (tipoId: number) => {
        const colores = [
            'bg-blue-100 text-blue-800',      // 1
            'bg-green-100 text-green-800',    // 2
            'bg-purple-100 text-purple-800',  // 3
            'bg-yellow-100 text-yellow-800',  // 4
            'bg-red-100 text-red-800',        // 5
            'bg-indigo-100 text-indigo-800',  // 6
            'bg-pink-100 text-pink-800',      // 7
            'bg-gray-100 text-gray-800',      // default
        ];
        return colores[tipoId - 1] || colores[7];
    };

    // Obtener nombre del tipo
    const getTipoNombre = (tipoId: number) => {
        const tipo = tiposPersonal.find(t => t.id === tipoId);
        return tipo ? tipo.nombre : 'Sin tipo';
    };

    // Obtener iniciales
    const getIniciales = (nombre: string, apellido: string) => {
        return (nombre.charAt(0) + apellido.charAt(0)).toUpperCase();
    };

    // Limpiar búsqueda y resetear página
    const limpiarBusqueda = () => {
        setSearchTerm('');
        setCurrentPage(1);
    };

    // Resetear página cuando se busca
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm]);

    return (
        <AppLayout title="Datos Personales">
            <Head title="Datos Personales" />
            
            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Datos Personales
                        </h1>
                        <p className="mt-1 text-gray-600 text-base">
                            Gestión de información personal del personal
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="md:hidden inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                        >
                            {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Barra de búsqueda y filtros - Responsive */}
            <div className={`${showFilters ? 'block' : 'hidden md:block'} mb-6`}>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="flex flex-col sm:flex-row gap-3">
                        <div className="flex-1">
                            <input
                                type="text"
                                placeholder="Buscar por nombre, apellido, email o teléfono..."
                                className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2">
                            {searchTerm && (
                                <button
                                    onClick={limpiarBusqueda}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm rounded hover:bg-gray-300 transition-colors"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </div>
                    
                    {/* Filtros adicionales */}
                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
                        <select className="px-3 py-2 border border-gray-300 rounded text-sm">
                            <option value="">Todos los tipos</option>
                            {tiposPersonal.map(tipo => (
                                <option key={tipo.id} value={tipo.id}>
                                    {tipo.nombre}
                                </option>
                            ))}
                        </select>
                        <select className="px-3 py-2 border border-gray-300 rounded text-sm">
                            <option value="">Todos los estados</option>
                            <option value="activo">Activo</option>
                            <option value="inactivo">Inactivo</option>
                        </select>
                        <input
                            type="date"
                            className="px-3 py-2 border border-gray-300 rounded text-sm"
                            placeholder="Fecha desde"
                        />
                        <button className="px-4 py-2 bg-gray-100 text-gray-700 text-sm rounded hover:bg-gray-200 transition-colors">
                            Aplicar filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* Three Column Layout - Responsive */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
                {/* Left Column - Lista de Personal */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">Personal</h2>
                            <button className="px-3 py-1.5 bg-sat text-white text-sm rounded hover:bg-sat-600 transition-colors">
                                + Nuevo
                            </button>
                        </div>

                        {/* Versión móvil - Cards */}
                        <div className="lg:hidden space-y-3 mb-6">
                            {personalPaginated.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">
                                        {searchTerm ? 'No se encontraron empleados' : 'No hay personal registrado'}
                                    </p>
                                </div>
                            ) : (
                                personalPaginated.map((persona) => (
                                    <button
                                        key={persona.id}
                                        onClick={() => setSelectedPersona(persona)}
                                        className={`w-full text-left p-4 rounded-lg border transition-colors ${
                                            selectedPersona?.id === persona.id 
                                                ? 'border-sat bg-sat-50' 
                                                : 'border-gray-200 hover:border-sat hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center mb-2">
                                            <div className="h-10 w-10 rounded-full bg-local flex items-center justify-center text-white font-semibold mr-3">
                                                {getIniciales(persona.nombre, persona.apellido)}
                                            </div>
                                            <div>
                                                <div className="font-medium text-gray-900">
                                                    {persona.nombre} {persona.apellido}
                                                </div>
                                                <div className="text-sm text-gray-600">{getTipoNombre(persona.tipo_personal_id)}</div>
                                            </div>
                                        </div>
                                        <div className="flex justify-between items-center text-xs text-gray-500">
                                            <span>{persona.email}</span>
                                            <span className={`px-2 py-1 rounded-full ${persona.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {persona.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Versión desktop - Lista */}
                        <div className="hidden lg:block space-y-3">
                            {personalPaginated.length === 0 ? (
                                <div className="text-center py-8">
                                    <p className="text-gray-500">
                                        {searchTerm ? 'No se encontraron empleados' : 'No hay personal registrado'}
                                    </p>
                                </div>
                            ) : (
                                personalPaginated.map((persona) => (
                                    <button
                                        key={persona.id}
                                        onClick={() => setSelectedPersona(persona)}
                                        className={`w-full text-left p-4 rounded-lg border transition-colors ${
                                            selectedPersona?.id === persona.id 
                                                ? 'border-sat bg-sat-50' 
                                                : 'border-gray-200 hover:border-sat hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex items-center mb-2">
                                            <div className="h-10 w-10 rounded-full bg-local flex items-center justify-center text-white font-semibold mr-3">
                                                {getIniciales(persona.nombre, persona.apellido)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900">
                                                    {persona.nombre} {persona.apellido}
                                                </div>
                                                <div className="text-sm text-gray-600">{getTipoNombre(persona.tipo_personal_id)}</div>
                                            </div>
                                            <span className={`px-2 py-1 rounded-full text-xs ${persona.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                                {persona.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </div>
                                        <div className="text-xs text-gray-500 mt-2">
                                            <div className="flex justify-between">
                                                <span>{persona.email}</span>
                                                <span>{persona.telefono || 'Sin teléfono'}</span>
                                            </div>
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        {/* Paginación */}
                        {totalPages > 1 && (
                            <div className="mt-6 flex items-center justify-between">
                                <div className="text-sm text-gray-600">
                                    Mostrando {startIndex + 1}-{Math.min(endIndex, personalFiltrado.length)} de {personalFiltrado.length}
                                </div>
                                <div className="flex gap-1">
                                    <button
                                        onClick={() => goToPage(currentPage - 1)}
                                        disabled={currentPage === 1}
                                        className={`px-3 py-1 rounded text-sm ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        &lt;
                                    </button>
                                    {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                                        let pageNum;
                                        if (totalPages <= 5) {
                                            pageNum = i + 1;
                                        } else if (currentPage <= 3) {
                                            pageNum = i + 1;
                                        } else if (currentPage >= totalPages - 2) {
                                            pageNum = totalPages - 4 + i;
                                        } else {
                                            pageNum = currentPage - 2 + i;
                                        }
                                        
                                        return (
                                            <button
                                                key={pageNum}
                                                onClick={() => goToPage(pageNum)}
                                                className={`px-3 py-1 rounded text-sm ${currentPage === pageNum ? 'bg-sat text-white' : 'text-gray-700 hover:bg-gray-100'}`}
                                            >
                                                {pageNum}
                                            </button>
                                        );
                                    })}
                                    <button
                                        onClick={() => goToPage(currentPage + 1)}
                                        disabled={currentPage === totalPages}
                                        className={`px-3 py-1 rounded text-sm ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        &gt;
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>

                {/* Middle Column - Estadísticas */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">Resumen General</h2>
                        
                        <div className="space-y-4">
                            {/* Tarjeta Total Personal */}
                            <div className="p-4 bg-blue-50 rounded border border-blue-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-medium text-blue-700">Total Personal</div>
                                        <div className="text-2xl font-bold text-blue-900">{estadisticas.total}</div>
                                    </div>
                                    <div className="text-blue-500">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Tarjeta Personal Activo */}
                            <div className="p-4 bg-green-50 rounded border border-green-100">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <div className="text-sm font-medium text-green-700">Personal Activo</div>
                                        <div className="text-2xl font-bold text-green-900">{estadisticas.activos}</div>
                                        <div className="text-xs text-green-600 mt-1">
                                            {estadisticas.total > 0 ? `${Math.round((estadisticas.activos / estadisticas.total) * 100)}% del total` : '0%'}
                                        </div>
                                    </div>
                                    <div className="text-green-500">
                                        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Distribución por Tipo */}
                            <div className="p-4 bg-purple-50 rounded border border-purple-100">
                                <div className="text-sm font-medium text-purple-700 mb-3">Distribución por Tipo</div>
                                <div className="space-y-2">
                                    {Object.entries(estadisticas.tiposCount).map(([tipoNombre, count]) => {
                                        const percentage = estadisticas.total > 0 ? (count / estadisticas.total) * 100 : 0;
                                        return (
                                            <div key={tipoNombre} className="space-y-1">
                                                <div className="flex justify-between text-xs">
                                                    <span className="text-gray-600">{tipoNombre}</span>
                                                    <span className="font-medium">{count} ({percentage.toFixed(1)}%)</span>
                                                </div>
                                                <div className="w-full bg-gray-200 rounded-full h-1.5">
                                                    <div 
                                                        className="bg-purple-500 h-1.5 rounded-full" 
                                                        style={{ width: `${percentage}%` }}
                                                    ></div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Detalles del Personal */}
                <div className="lg:col-span-2">
                    {selectedPersona ? (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                                <div className="flex items-center gap-4">
                                    <div className="h-16 w-16 rounded-full bg-local flex items-center justify-center text-white font-bold text-xl">
                                        {getIniciales(selectedPersona.nombre, selectedPersona.apellido)}
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-bold text-gray-900 mb-1">
                                            {selectedPersona.nombre} {selectedPersona.apellido}
                                        </h2>
                                        <p className="text-sm text-gray-600">
                                            {getTipoNombre(selectedPersona.tipo_personal_id)}
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button className="px-4 py-2 text-sm border border-sat text-sat rounded hover:bg-sat-50 transition-colors">
                                        Editar
                                    </button>
                                    <button className="px-4 py-2 text-sm bg-sat text-white rounded hover:bg-sat-600 transition-colors">
                                        Imprimir Ficha
                                    </button>
                                </div>
                            </div>

                            {/* Tarjetas de información */}
                            <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 mb-6">
                                <div className="p-3 md:p-4 bg-blue-50 rounded border border-blue-100">
                                    <div className="text-xs md:text-sm font-medium text-blue-700">Tipo</div>
                                    <div className="text-base md:text-lg font-bold text-blue-900">
                                        <span className={`px-2 py-1 text-xs rounded-full ${getTipoColor(selectedPersona.tipo_personal_id)}`}>
                                            {getTipoNombre(selectedPersona.tipo_personal_id)}
                                        </span>
                                    </div>
                                </div>
                                <div className="p-3 md:p-4 bg-green-50 rounded border border-green-100">
                                    <div className="text-xs md:text-sm font-medium text-green-700">Antigüedad</div>
                                    <div className="text-base md:text-lg font-bold text-green-900">
                                        {calcularAntiguedad(selectedPersona.created)}
                                    </div>
                                </div>
                                <div className="p-3 md:p-4 bg-purple-50 rounded border border-purple-100 col-span-2 md:col-auto">
                                    <div className="text-xs md:text-sm font-medium text-purple-700">Estado</div>
                                    <div className="text-base md:text-lg font-bold text-purple-900">
                                        <span className={`px-2 py-1 text-xs rounded-full ${selectedPersona.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                                            {selectedPersona.activo ? 'Activo' : 'Inactivo'}
                                        </span>
                                    </div>
                                </div>
                            </div>

                            {/* Información Personal */}
                            <div className="mb-6">
                                <h3 className="font-medium text-gray-900 mb-3">Información Personal</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                        <div className="p-2 bg-gray-50 rounded border text-sm">{selectedPersona.email}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                        <div className="p-2 bg-gray-50 rounded border text-sm">{selectedPersona.telefono || 'N/A'}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Nacimiento</label>
                                        <div className="p-2 bg-gray-50 rounded border text-sm">
                                            {formatDate(selectedPersona.fecha_nacimiento)} 
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Edad</label>
                                        <div className="p-2 bg-gray-50 rounded border text-sm">
                                            {calcularEdad(selectedPersona.fecha_nacimiento)}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Información Laboral */}
                            <div className="mb-6">
                                <h3 className="font-medium text-gray-900 mb-3">Información Laboral</h3>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Tipo de Personal</label>
                                        <div className="p-2 bg-gray-50 rounded border text-sm">
                                            <span className={`px-2 py-1 text-xs rounded-full ${getTipoColor(selectedPersona.tipo_personal_id)}`}>
                                                {getTipoNombre(selectedPersona.tipo_personal_id)}
                                            </span>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Fecha de Ingreso</label>
                                        <div className="p-2 bg-gray-50 rounded border text-sm">{formatDate(selectedPersona.created)}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Última Actualización</label>
                                        <div className="p-2 bg-gray-50 rounded border text-sm">{formatDate(selectedPersona.modified)}</div>
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">ID</label>
                                        <div className="p-2 bg-gray-50 rounded border text-sm">{selectedPersona.id}</div>
                                    </div>
                                </div>
                            </div>

                            {/* Sección de Contacto de Emergencia (puedes expandir con datos reales) */}
                            <div className="border border-gray-200 rounded-lg overflow-hidden">
                                <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                    <h3 className="font-medium text-gray-900">Información Adicional</h3>
                                </div>
                                <div className="p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Creación</label>
                                            <div className="p-2 bg-gray-50 rounded border text-sm">{formatDate(selectedPersona.created)}</div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Última Modificación</label>
                                            <div className="p-2 bg-gray-50 rounded border text-sm">{formatDate(selectedPersona.modified)}</div>
                                        </div>
                                    </div>
                                    <div className="mt-4 text-xs text-gray-500">
                                        <p>Esta información es gestionada por el departamento de Recursos Humanos.</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                            <div className="text-gray-400 mb-4">
                                <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                Selecciona un empleado
                            </h3>
                            <p className="text-gray-600 text-sm">
                                Haz clic en un empleado de la lista para ver sus detalles completos.
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}