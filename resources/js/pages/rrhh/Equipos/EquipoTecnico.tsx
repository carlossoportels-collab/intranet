// resources/js/Pages/rrhh/Equipos/EquipoTecnico.tsx
import { router } from '@inertiajs/react';
import { 
    MapPin, Phone, Mail, Calendar, 
    Users, Map as MapIcon, Filter, Download, User, Building,
    CheckCircle, XCircle, Search, MoreVertical,
    Wrench, Edit, Trash2, X
} from 'lucide-react';
import React, { useState, useMemo, useRef, useEffect } from 'react';

import AlertError from '@/components/alert-error';
import AlertSuccess from '@/components/alert-succes';
import AppLayout from '@/layouts/app-layout';

interface Tecnico {
    id: number;
    personal_id: number;
    nombre_completo: string;
    nombre: string;
    apellido: string;
    email: string;
    telefono: string;
    fecha_nacimiento: string;
    edad: number | null;
    direccion: string;
    provincia: string;
    latitud: number | null;
    longitud: number | null;
    tiene_ubicacion: boolean;
    activo: boolean;
    created: string;
}

interface EquipoTecnicoProps {
    tecnicos: Tecnico[];
    tecnicosPorProvincia: Record<string, Tecnico[]>;
    provincias: string[];
    total_tecnicos: number;
    tecnicos_con_ubicacion: number;
    tecnicos_sin_ubicacion: number;
    auth: {
        user: {
            id: number;
            name: string;
            email: string;
            rol_id: number; // 1: root, 2: administrador, 3+: otros
            rol_nombre: string;
        }
    };
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function EquipoTecnico({
    tecnicos = [],
    tecnicosPorProvincia = {},
    provincias = [],
    total_tecnicos = 0,
    tecnicos_con_ubicacion = 0,
    tecnicos_sin_ubicacion = 0,
    auth,
    flash, 
}: EquipoTecnicoProps) {
    const [filtroProvincia, setFiltroProvincia] = useState<string>('todas');
    const [filtroUbicacion, setFiltroUbicacion] = useState<string>('todas');
    const [busqueda, setBusqueda] = useState<string>('');
    const [menuAbierto, setMenuAbierto] = useState<number | null>(null);
    const menuRefs = useRef<Map<number, HTMLDivElement>>(new Map());
    const [showAlert, setShowAlert] = useState<boolean>(false);
    const [alertType, setAlertType] = useState<'success' | 'error' | null>(null);
    const [alertMessage, setAlertMessage] = useState<string>('');

    // Verificar si el usuario tiene permisos de administración
    const esAdmin = useMemo(() => {
        return auth?.user?.rol_id === 1 || auth?.user?.rol_id === 2;
    }, [auth]);

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

    // Filtrar técnicos
    const tecnicosFiltrados = useMemo(() => {
        return tecnicos.filter(tecnico => {
            // Filtro por provincia
            if (filtroProvincia !== 'todas' && tecnico.provincia !== filtroProvincia) {
                return false;
            }
            
            // Filtro por ubicación
            if (filtroUbicacion === 'con_ubicacion' && !tecnico.tiene_ubicacion) {
                return false;
            }
            if (filtroUbicacion === 'sin_ubicacion' && tecnico.tiene_ubicacion) {
                return false;
            }
            
            // Filtro por búsqueda
            if (busqueda) {
                const searchTerm = busqueda.toLowerCase();
                return (
                    tecnico.nombre_completo.toLowerCase().includes(searchTerm) ||
                    tecnico.email.toLowerCase().includes(searchTerm) ||
                    tecnico.telefono.includes(searchTerm) ||
                    tecnico.direccion.toLowerCase().includes(searchTerm) ||
                    tecnico.provincia.toLowerCase().includes(searchTerm)
                );
            }
            
            return true;
        });
    }, [tecnicos, filtroProvincia, filtroUbicacion, busqueda]);

    // Agrupar por provincia después del filtrado
    const tecnicosAgrupados = useMemo(() => {
        const grupos: Record<string, Tecnico[]> = {};
        
        tecnicosFiltrados.forEach(tecnico => {
            const provincia = tecnico.provincia || 'Sin Provincia';
            if (!grupos[provincia]) {
                grupos[provincia] = [];
            }
            grupos[provincia].push(tecnico);
        });
        
        // Ordenar provincias alfabéticamente
        return Object.keys(grupos).sort().reduce((obj, key) => {
            obj[key] = grupos[key];
            return obj;
        }, {} as Record<string, Tecnico[]>);
    }, [tecnicosFiltrados]);

    // Calcular estadísticas
    const estadisticas = useMemo(() => {
        const provinciasUnicas = new Set(tecnicosFiltrados.map(t => t.provincia));
        const totalConUbicacion = tecnicosFiltrados.filter(t => t.tiene_ubicacion).length;
        const totalActivos = tecnicosFiltrados.filter(t => t.activo).length;
        
        return {
            total: tecnicosFiltrados.length,
            provincias: provinciasUnicas.size,
            conUbicacion: totalConUbicacion,
            sinUbicacion: tecnicosFiltrados.length - totalConUbicacion,
            porcentajeUbicacion: tecnicosFiltrados.length > 0 ? 
                Math.round((totalConUbicacion / tecnicosFiltrados.length) * 100) : 0,
            activos: totalActivos,
        };
    }, [tecnicosFiltrados]);

    // Función para abrir Google Maps
    const abrirGoogleMaps = (latitud: number, longitud: number, direccion: string) => {
        const url = `https://www.google.com/maps?q=${latitud},${longitud}&ll=${latitud},${longitud}&z=15`;
        window.open(url, '_blank');
    };

    // Funciones del menú
    const handleEditar = (tecnico: Tecnico) => {
        router.get(`/rrhh/equipos/tecnicos/${tecnico.id}/edit`);
        setMenuAbierto(null);
    };

    const handleEliminar = (tecnico: Tecnico) => {
        if (confirm(`¿Estás seguro de eliminar a ${tecnico.nombre_completo}?`)) {
            router.delete(`/rrhh/equipos/tecnicos/${tecnico.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    // Mensaje de éxito viene de flash
                },
                onError: (errors) => {
                    console.error('Error al eliminar:', errors);
                    // Mensaje de error viene de flash
                }
            });
        }
        setMenuAbierto(null);
    };

    const toggleMenu = (tecnicoId: number) => {
        if (esAdmin) {
            setMenuAbierto(menuAbierto === tecnicoId ? null : tecnicoId);
        }
    };

    // Función para establecer la referencia del menú
    const setMenuRef = (tecnicoId: number, element: HTMLDivElement | null) => {
        if (element) {
            menuRefs.current.set(tecnicoId, element);
        } else {
            menuRefs.current.delete(tecnicoId);
        }
    };
    
        useEffect(() => {
        if (flash?.success) {
            setAlertType('success');
            setAlertMessage(flash.success);
            setShowAlert(true);
            
            // Ocultar automáticamente después de 5 segundos
            const timer = setTimeout(() => setShowAlert(false), 5000);
            return () => clearTimeout(timer);
        }
        
        if (flash?.error) {
            setAlertType('error');
            setAlertMessage(flash.error);
            setShowAlert(true);
            
            // Ocultar automáticamente después de 7 segundos
            const timer = setTimeout(() => setShowAlert(false), 7000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    // Función para cerrar alert manualmente
    const closeAlert = () => {
        setShowAlert(false);
        setAlertType(null);
        setAlertMessage('');
    };

    return (
        <AppLayout title="Equipo Técnico">
             <div className="max-w-6xl mx-auto">
                {/* Alertas en la parte superior */}
                {showAlert && alertType === 'success' && (
                    <div className="mb-6 relative">
                        <AlertSuccess 
                            message={alertMessage}
                            title="¡Éxito!"
                        />
                        <button
                            onClick={closeAlert}
                            className="absolute right-3 top-3 text-green-600 hover:text-green-800"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}

                {showAlert && alertType === 'error' && (
                    <div className="mb-6 relative">
                        <AlertError 
                            errors={[alertMessage]}
                            title="Error"
                        />
                        <button
                            onClick={closeAlert}
                            className="absolute right-3 top-3 text-red-600 hover:text-red-800"
                        >
                            <X size={16} />
                        </button>
                    </div>
                )}
            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-2">
                            <Wrench className="text-sat" size={28} />
                            Equipo Técnico
                        </h1>
                        <p className="mt-1 text-gray-600 text-base">
                            Gestión del equipo técnico
                        </p>
                    </div>
                    <div className="flex gap-2">
                        
                        {/* Solo mostrar botón "Nuevo Técnico" para admins */}
                        {esAdmin && (
                            <button 
                                onClick={() => router.get('/rrhh/equipos/tecnicos/create')}
                                className="px-4 py-2 bg-sat text-white text-sm rounded hover:bg-sat-600 transition-colors flex items-center gap-2"
                            >
                                <User size={16} />
                                Nuevo Técnico
                            </button>
                        )}
                    </div>
                </div>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                        <Users size={20} className="text-blue-600" />
                        <div className="text-sm font-medium text-gray-700">Total Técnicos</div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{estadisticas.total}</div>
                    <div className="text-xs text-gray-600 mt-1">
                        {estadisticas.activos} activos
                    </div>
                </div>
                
                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                        <Building size={20} className="text-purple-600" />
                        <div className="text-sm font-medium text-gray-700">Provincias</div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{estadisticas.provincias}</div>
                    <div className="text-xs text-gray-600 mt-1">
                        Distribución geográfica
                    </div>
                </div>
                
                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                        <MapPin size={20} className="text-green-600" />
                        <div className="text-sm font-medium text-gray-700">Con Ubicación</div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{estadisticas.conUbicacion}</div>
                    <div className="text-xs text-gray-600 mt-1">
                        {estadisticas.porcentajeUbicacion}% del total
                    </div>
                </div>
                
                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                        <XCircle size={20} className="text-amber-600" />
                        <div className="text-sm font-medium text-gray-700">Sin Ubicación</div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">{estadisticas.sinUbicacion}</div>
                    <div className="text-xs text-gray-600 mt-1">
                        Requieren actualización
                    </div>
                </div>
                
                <div className="p-4 bg-white rounded-lg shadow-sm border border-gray-200">
                    <div className="flex items-center gap-2 mb-2">
                        <CheckCircle size={20} className="text-green-600" />
                        <div className="text-sm font-medium text-gray-700">Disponibilidad</div>
                    </div>
                    <div className="text-2xl font-bold text-gray-900">
                        {estadisticas.total > 0 ? 
                            Math.round((estadisticas.activos / estadisticas.total) * 100) : 0}%
                    </div>
                    <div className="text-xs text-gray-600 mt-1">
                        Técnicos activos
                    </div>
                </div>
            </div>

            {/* Filtros */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Buscar técnico
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
                            Filtrar por provincia
                        </label>
                        <select
                            value={filtroProvincia}
                            onChange={(e) => setFiltroProvincia(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-sat focus:border-sat"
                        >
                            <option value="todas">Todas las provincias</option>
                            {provincias.map((provincia) => (
                                <option key={provincia} value={provincia}>
                                    {provincia}
                                </option>
                            ))}
                        </select>
                    </div>
                    
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Filtrar por ubicación
                        </label>
                        <select
                            value={filtroUbicacion}
                            onChange={(e) => setFiltroUbicacion(e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-sat focus:border-sat"
                        >
                            <option value="todas">Todos</option>
                            <option value="con_ubicacion">Con ubicación</option>
                            <option value="sin_ubicacion">Sin ubicación</option>
                        </select>
                    </div>
                    
                    <div className="flex items-end">
                        <button
                            onClick={() => {
                                setFiltroProvincia('todas');
                                setFiltroUbicacion('todas');
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
                {Object.keys(tecnicosAgrupados).length === 0 ? (
                    <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
                        <Users size={48} className="mx-auto text-gray-400 mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">
                            No se encontraron técnicos
                        </h3>
                        <p className="text-gray-600">
                            {busqueda || filtroProvincia !== 'todas' || filtroUbicacion !== 'todas'
                                ? 'Intenta con otros criterios de búsqueda.'
                                : 'No hay técnicos registrados en el sistema.'}
                        </p>
                    </div>
                ) : (
                    Object.entries(tecnicosAgrupados).map(([provincia, tecnicosProvincia]) => (
                        <div key={provincia} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            {/* Encabezado de provincia */}
                            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                        <Building size={20} className="text-sat" />
                                        <h2 className="text-xl font-bold text-gray-900">
                                            {provincia}
                                        </h2>
                                        <span className="px-3 py-1 text-xs font-medium bg-sat-100 text-sat-800 rounded-full">
                                            {tecnicosProvincia.length} técnico{tecnicosProvincia.length !== 1 ? 's' : ''}
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600">
                                        {tecnicosProvincia.filter(t => t.tiene_ubicacion).length} con ubicación
                                    </div>
                                </div>
                            </div>
                            
                            {/* Cards de técnicos */}
                            <div className="p-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {tecnicosProvincia.map((tecnico) => (
                                        <div 
                                            key={tecnico.id}
                                            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow relative"
                                        >
                                            {/* Encabezado de la card */}
                                            <div className="flex items-start justify-between mb-4">
                                                <div className="flex items-center gap-3">
                                                    <div className="h-12 w-12 rounded-full bg-local flex items-center justify-center text-white font-bold">
                                                        {tecnico.nombre.charAt(0)}{tecnico.apellido.charAt(0)}
                                                    </div>
                                                    <div>
                                                        <h3 className="font-bold text-gray-900">
                                                            {tecnico.nombre_completo}
                                                        </h3>
                                                        <div className="flex items-center gap-2 mt-1">
                                                            <span className={`text-xs px-2 py-1 rounded-full ${
                                                                tecnico.activo 
                                                                    ? 'bg-green-100 text-green-800' 
                                                                    : 'bg-red-100 text-red-800'
                                                            }`}>
                                                                {tecnico.activo ? 'Activo' : 'Inactivo'}
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                                
                                                {/* Botón de menú - Solo para admins */}
                                                {esAdmin && (
                                                    <div className="relative" ref={(el) => setMenuRef(tecnico.id, el)}>
                                                        <button 
                                                            onClick={() => toggleMenu(tecnico.id)}
                                                            className="text-gray-400 hover:text-gray-600 p-1 rounded hover:bg-gray-100"
                                                        >
                                                            <MoreVertical size={18} />
                                                        </button>
                                                        
                                                        {/* Menú desplegable */}
                                                        {menuAbierto === tecnico.id && (
                                                            <div className="absolute right-0 mt-1 w-40 bg-white rounded-md shadow-lg border border-gray-200 z-10">
                                                                <div className="py-1">
                                                                    <button
                                                                        onClick={() => handleEditar(tecnico)}
                                                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 transition-colors"
                                                                    >
                                                                        <Edit size={14} />
                                                                        Modificar
                                                                    </button>
                                                                    <button
                                                                        onClick={() => handleEliminar(tecnico)}
                                                                        className="flex items-center gap-2 w-full px-4 py-2 text-sm text-red-600 hover:bg-red-50 transition-colors"
                                                                    >
                                                                        <Trash2 size={14} />
                                                                        Eliminar
                                                                    </button>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Información de contacto */}
                                            <div className="space-y-3 mb-4">
                                                {tecnico.telefono && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Phone size={14} className="text-gray-400" />
                                                        <span className="text-gray-700">{tecnico.telefono}</span>
                                                    </div>
                                                )}
                                                
                                                {tecnico.email && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Mail size={14} className="text-gray-400" />
                                                        <span className="text-gray-700 truncate">{tecnico.email}</span>
                                                    </div>
                                                )}
                                                
                                                {tecnico.edad && (
                                                    <div className="flex items-center gap-2 text-sm">
                                                        <Calendar size={14} className="text-gray-400" />
                                                        <span className="text-gray-700">{tecnico.edad} años</span>
                                                    </div>
                                                )}
                                                
                                                {tecnico.direccion && (
                                                    <div className="flex items-start gap-2 text-sm">
                                                        <MapPin size={14} className="text-gray-400 mt-0.5" />
                                                        <div>
                                                            <span className="text-gray-700">{tecnico.direccion}</span>
                                                            {tecnico.provincia && tecnico.provincia !== 'Sin Provincia' && (
                                                                <div className="text-xs text-gray-500 mt-1">
                                                                    {tecnico.provincia}
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            
                                            {/* Botón de ver en mapa */}
                                            {tecnico.tiene_ubicacion && tecnico.latitud && tecnico.longitud && (
                                                <button
                                                    onClick={() => abrirGoogleMaps(
                                                        tecnico.latitud!, 
                                                        tecnico.longitud!, 
                                                        tecnico.direccion
                                                    )}
                                                    className="w-full px-3 py-2 text-sm bg-sat text-white rounded hover:bg-sat-600 transition-colors flex items-center justify-center gap-2"
                                                >
                                                    <MapIcon size={14} />
                                                    Ver en mapa
                                                </button>
                                            )}
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