// resources/js/Pages/rrhh/Equipos/EquipoComercial.tsx

import { router } from '@inertiajs/react';
import { 
    Phone, Mail, Calendar, 
    Users, User, Building,
    CheckCircle, XCircle, Search, MoreVertical,
    Briefcase, Edit, Trash2, X,
    TrendingUp, Target, Award
} from 'lucide-react';
import React, { useState, useMemo, useRef, useEffect } from 'react';

import AlertError from '@/components/alert-error';
import AlertSuccess from '@/components/alert-succes';
import AppLayout from '@/layouts/app-layout';

interface Comercial {
    id: number;
    personal_id: number;
    nombre_completo: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    fecha_nacimiento: string | null;
    edad: number | null;
    compania_id: number;
    prefijo_id: number;
    activo: boolean;
    created: string;
    ultimo_acceso: string | null;
}

interface EquipoComercialProps {
    comerciales: Comercial[];
    comercialesPorCompania: Record<string, Comercial[]>;
    companias: string[];
    total_comerciales: number;
    activos: number;
    con_email: number;
    con_telefono: number;
}

export default function EquipoComercial({
    comerciales = [],
    comercialesPorCompania = {},
    companias = [],
    total_comerciales = 0,
    activos = 0,
    con_email = 0,
    con_telefono = 0,
}: EquipoComercialProps) {
    const [filtroCompania, setFiltroCompania] = useState<string>('todas');
    const [filtroActivo, setFiltroActivo] = useState<string>('todos');
    const [busqueda, setBusqueda] = useState<string>('');
    const [menuAbierto, setMenuAbierto] = useState<number | null>(null);
    const menuRefs = useRef<Map<number, HTMLDivElement>>(new Map());

    // ========== FUNCIONES AUXILIARES (declaradas antes de usarlas) ==========
    const getNombreCompania = (companiaId: number): string => {
        const companiasMap: Record<number, string> = {
            1: 'LocalSat',
            2: 'SmartSat',
            3: '360',
        };
        return companiasMap[companiaId] || 'Sin Compañía';
    };

    const getCompaniaColor = (companiaId: number): string => {
        switch(companiaId) {
            case 1: return 'bg-green-100 text-green-800'; // LocalSat
            case 2: return 'bg-purple-100 text-purple-800'; // SmartSat
            case 3: return 'bg-blue-100 text-blue-800'; // 360
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const formatFecha = (fecha: string | null) => {
        if (!fecha) return 'N/A';
        try {
            return new Date(fecha).toLocaleDateString('es-AR');
        } catch {
            return 'N/A';
        }
    };

    // Cerrar menú al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuAbierto !== null) {
                const menuElement = menuRefs.current.get(menuAbierto);
                if (menuElement && !menuElement.contains(event.target as Node)) {
                    setMenuAbierto(null);
                }
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [menuAbierto]);

    // ========== MEMOS (usando funciones ya declaradas) ==========
    // Filtrar comerciales
    const comercialesFiltrados = useMemo(() => {
        return comerciales.filter(comercial => {
            // Filtro por compañía
            if (filtroCompania !== 'todas') {
                const nombreCompania = getNombreCompania(comercial.compania_id);
                if (nombreCompania !== filtroCompania) return false;
            }
            
            // Filtro por activo
            if (filtroActivo === 'activo' && !comercial.activo) return false;
            if (filtroActivo === 'inactivo' && comercial.activo) return false;
            
            // Filtro por búsqueda
            if (busqueda) {
                const searchTerm = busqueda.toLowerCase();
                return (
                    comercial.nombre_completo.toLowerCase().includes(searchTerm) ||
                    comercial.email.toLowerCase().includes(searchTerm) ||
                    comercial.telefono.includes(searchTerm)
                );
            }
            
            return true;
        });
    }, [comerciales, filtroCompania, filtroActivo, busqueda, getNombreCompania]);

    // Agrupar por compañía después del filtrado
    const comercialesAgrupados = useMemo(() => {
        const grupos: Record<string, Comercial[]> = {};
        
        comercialesFiltrados.forEach(comercial => {
            const compania = getNombreCompania(comercial.compania_id);
            if (!grupos[compania]) {
                grupos[compania] = [];
            }
            grupos[compania].push(comercial);
        });
        
        // Ordenar compañías alfabéticamente
        return Object.keys(grupos).sort().reduce((obj, key) => {
            obj[key] = grupos[key];
            return obj;
        }, {} as Record<string, Comercial[]>);
    }, [comercialesFiltrados, getNombreCompania]);

    // Calcular estadísticas
    const estadisticas = useMemo(() => {
        const companiasUnicas = new Set(comercialesFiltrados.map(c => getNombreCompania(c.compania_id)));
        const totalActivos = comercialesFiltrados.filter(c => c.activo).length;
        const totalInactivos = comercialesFiltrados.length - totalActivos;
        
        return {
            total: comercialesFiltrados.length,
            companias: companiasUnicas.size,
            activos: totalActivos,
            inactivos: totalInactivos,
            porcentajeActivos: comercialesFiltrados.length > 0 ? 
                Math.round((totalActivos / comercialesFiltrados.length) * 100) : 0,
            conEmail: comercialesFiltrados.filter(c => c.email).length,
            conTelefono: comercialesFiltrados.filter(c => c.telefono).length,
        };
    }, [comercialesFiltrados, getNombreCompania]);

    // ========== FUNCIONES DEL MENÚ ==========
    const handleEditar = (comercial: Comercial) => {
        router.get(`/rrhh/equipos/comerciales/${comercial.id}/edit`);
        setMenuAbierto(null);
    };

    const handleEliminar = (comercial: Comercial) => {
        if (confirm(`¿Estás seguro de eliminar a ${comercial.nombre_completo}?`)) {
            router.delete(`/rrhh/equipos/comerciales/${comercial.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    // Mensaje de éxito viene de flash
                },
                onError: (errors) => {
                    console.error('Error al eliminar:', errors);
                }
            });
        }
        setMenuAbierto(null);
    };

    const toggleMenu = (comercialId: number) => {
        setMenuAbierto(menuAbierto === comercialId ? null : comercialId);
    };

    // Función para establecer la referencia del menú
    const setMenuRef = (comercialId: number, element: HTMLDivElement | null) => {
        if (element) {
            menuRefs.current.set(comercialId, element);
        } else {
            menuRefs.current.delete(comercialId);
        }
    };

    return (
        <AppLayout title="Equipo Comercial">
            <div className="max-w-6xl mx-auto">
                <div className="mb-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                                <Briefcase className="text-sat" size={28} />
                                Equipo Comercial
                            </h1>
                            <p className="mt-1 text-gray-600 text-base">
                                Gestión del equipo de ventas y comerciales
                            </p>
                        </div>
                        <div className="flex gap-2">
                            <button 
                                onClick={() => router.get('/rrhh/equipos/comerciales/create')}
                                className="px-4 py-2 bg-sat text-white text-sm rounded hover:bg-sat-600 transition-colors flex items-center gap-2"
                            >
                                <User size={16} />
                                Nuevo Comercial
                            </button>
                        </div>
                    </div>
                </div>

                {/* Estadísticas */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Users size={20} className="text-blue-600" />
                            <div className="text-sm font-medium text-gray-700">Total Comerciales</div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{estadisticas.total}</div>
                        <div className="text-xs text-gray-600 mt-1">
                            {estadisticas.activos} activos
                        </div>
                    </div>
                    
                    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Building size={20} className="text-purple-600" />
                            <div className="text-sm font-medium text-gray-700">Compañías</div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{estadisticas.companias}</div>
                        <div className="text-xs text-gray-600 mt-1">
                            Distribución por compañía
                        </div>
                    </div>
                    
                    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                            <CheckCircle size={20} className="text-green-600" />
                            <div className="text-sm font-medium text-gray-700">Activos</div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{estadisticas.activos}</div>
                        <div className="text-xs text-gray-600 mt-1">
                            {estadisticas.porcentajeActivos}% del total
                        </div>
                    </div>
                    
                    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Mail size={20} className="text-amber-600" />
                            <div className="text-sm font-medium text-gray-700">Con Email</div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{estadisticas.conEmail}</div>
                        <div className="text-xs text-gray-600 mt-1">
                            {Math.round((estadisticas.conEmail / estadisticas.total) * 100) || 0}% registrados
                        </div>
                    </div>
                    
                    <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                        <div className="flex items-center gap-2 mb-2">
                            <Phone size={20} className="text-green-600" />
                            <div className="text-sm font-medium text-gray-700">Con Teléfono</div>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">{estadisticas.conTelefono}</div>
                        <div className="text-xs text-gray-600 mt-1">
                            {Math.round((estadisticas.conTelefono / estadisticas.total) * 100) || 0}% registrados
                        </div>
                    </div>
                </div>

                {/* Filtros */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Buscar comercial
                            </label>
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={18} />
                                <input
                                    type="text"
                                    value={busqueda}
                                    onChange={(e) => setBusqueda(e.target.value)}
                                    placeholder="Nombre, email, teléfono..."
                                    className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 rounded focus:ring-sat focus:border-sat"
                                />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filtrar por compañía
                            </label>
                            <select
                                value={filtroCompania}
                                onChange={(e) => setFiltroCompania(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-sat focus:border-sat"
                            >
                                <option value="todas">Todas las compañías</option>
                                {companias.map((compania) => (
                                    <option key={compania} value={compania}>
                                        {compania}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Filtrar por estado
                            </label>
                            <select
                                value={filtroActivo}
                                onChange={(e) => setFiltroActivo(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-sat focus:border-sat"
                            >
                                <option value="todos">Todos</option>
                                <option value="activo">Activos</option>
                                <option value="inactivo">Inactivos</option>
                            </select>
                        </div>
                        
                        <div className="flex items-end">
                            <button
                                onClick={() => {
                                    setFiltroCompania('todas');
                                    setFiltroActivo('todos');
                                    setBusqueda('');
                                }}
                                className="w-full px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                            >
                                Limpiar filtros
                            </button>
                        </div>
                    </div>
                </div>

                {/* Contenido principal */}
                <div className="space-y-8">
                    {Object.keys(comercialesAgrupados).length === 0 ? (
                        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                            <Users size={48} className="mx-auto text-gray-400 mb-4" />
                            <h3 className="text-lg font-medium text-gray-900 mb-2">
                                No se encontraron comerciales
                            </h3>
                            <p className="text-gray-600">
                                {busqueda || filtroCompania !== 'todas' || filtroActivo !== 'todos'
                                    ? 'Intenta con otros criterios de búsqueda.'
                                    : 'No hay comerciales registrados en el sistema.'}
                            </p>
                        </div>
                    ) : (
                        Object.entries(comercialesAgrupados).map(([compania, comercialesCompania]) => (
                            <div key={compania} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                                {/* Encabezado de compañía */}
                                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-3">
                                            <Building size={20} className="text-sat" />
                                            <h2 className="text-xl font-bold text-gray-900">
                                                {compania}
                                            </h2>
                                            <span className="px-3 py-1 text-xs font-medium bg-sat-100 text-sat-800 rounded-full">
                                                {comercialesCompania.length} comercial{comercialesCompania.length !== 1 ? 'es' : ''}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            {comercialesCompania.filter(c => c.activo).length} activos
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Cards de comerciales */}
                                <div className="p-6">
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                        {comercialesCompania.map((comercial) => (
                                            <div 
                                                key={comercial.id}
                                                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative"
                                            >
                                                {/* Encabezado de la card */}
                                                <div className="flex items-start justify-between mb-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-12 w-12 rounded-full bg-local flex items-center justify-center text-white font-bold">
                                                            {comercial.nombre.charAt(0)}{comercial.apellido.charAt(0)}
                                                        </div>
                                                        <div>
                                                            <h3 className="font-bold text-gray-900">
                                                                {comercial.nombre_completo}
                                                            </h3>
                                                            <div className="flex items-center gap-2 mt-1">
                                                                <span className={`text-xs px-2 py-1 rounded-full ${getCompaniaColor(comercial.compania_id)}`}>
                                                                    {getNombreCompania(comercial.compania_id)}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Botón de menú */}
                                                    <div className="relative" ref={(el) => setMenuRef(comercial.id, el)}>
                                                        <button 
                                                            onClick={() => toggleMenu(comercial.id)}
                                                            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                                                        >
                                                            <MoreVertical size={18} />
                                                        </button>
                                                        
                                                        {/* Menú desplegable */}
                                                        {menuAbierto === comercial.id && (
                                                            <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                                                                <div className="py-1">
                                                                    <button
                                                                        onClick={() => handleEditar(comercial)}
                                                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                                                    >
                                                                        <Edit size={14} />
                                                                        Modificar
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleEliminar(comercial)}
                                                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                        Eliminar
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                {/* Información de contacto */}
                                                <div className="space-y-3 mb-4">
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <span className={`text-xs px-2 py-1 rounded-full ${
                                                            comercial.activo 
                                                                ? 'bg-green-100 text-green-800' 
                                                                : 'bg-red-100 text-red-800'
                                                        }`}>
                                                            {comercial.activo ? 'Activo' : 'Inactivo'}
                                                        </span>
                                                        {comercial.prefijo_id && (
                                                            <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                                                Prefijo: {comercial.prefijo_id}
                                                            </span>
                                                        )}
                                                    </div>

                                                    {comercial.telefono && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Phone size={14} className="text-gray-400" />
                                                            <span className="text-gray-700">{comercial.telefono}</span>
                                                        </div>
                                                    )}
                                                    
                                                    {comercial.email && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Mail size={14} className="text-gray-400" />
                                                            <span className="text-gray-700 truncate">{comercial.email}</span>
                                                        </div>
                                                    )}
                                                    
                                                    {comercial.edad && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <Calendar size={14} className="text-gray-400" />
                                                            <span className="text-gray-700">{comercial.edad} años</span>
                                                        </div>
                                                    )}
                                                    
                                                    {comercial.ultimo_acceso && (
                                                        <div className="flex items-center gap-2 text-sm">
                                                            <TrendingUp size={14} className="text-gray-400" />
                                                            <span className="text-gray-700">Último acceso: {formatFecha(comercial.ultimo_acceso)}</span>
                                                        </div>
                                                    )}
                                                </div>
                                                
                                                {/* Botones de acción rápida */}
                                                <div className="flex gap-2 mt-2">
                                                    <button 
                                                        onClick={() => router.get(`/estadisticas/comercial-individual/${comercial.id}`)}
                                                        className="flex-1 px-3 py-2 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <TrendingUp size={14} />
                                                        Ver desempeño
                                                    </button>
                                                    <button 
                                                        onClick={() => router.get(`/comercial/leads?prefijo=${comercial.prefijo_id}`)}
                                                        className="flex-1 px-3 py-2 text-xs bg-purple-50 text-purple-700 rounded hover:bg-purple-100 transition-colors flex items-center justify-center gap-1"
                                                    >
                                                        <Target size={14} />
                                                        Ver leads
                                                    </button>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </div>
        </AppLayout>
    );
}