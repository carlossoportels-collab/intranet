// resources/js/Pages/Config/Usuarios/RolesPermisos.tsx

import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import { 
    Shield, 
    Users, 
    Key, 
    ChevronDown, 
    ChevronRight,
    CheckCircle,
    XCircle,
    RefreshCw,
    Search,
    Save,
    Eye,
    EyeOff,
    BarChart,
    Settings,
    Briefcase,
    Calendar,
    Bell,
    FileText,
    Home,
    User,
    AlertCircle,
    Activity,
    Folder,
    Tag,
    Clock
} from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface Role {
    id: number;
    nombre: string;
    nivel_permiso: number;
    descripcion: string | null;
}

interface Permiso {
    id: number;
    nombre: string;
    descripcion: string;
    modulo: string;
}

interface Props {
    roles: Role[];
    permisos: Record<string, Permiso[]>;
    asignaciones: Record<number, number[]>;
    usuariosPorRol: Record<number, number>;
}

// Mapeo de íconos por módulo
const moduloIconos: Record<string, any> = {
    'config': Settings,
    'condiciones': FileText,
    'comercial': Briefcase,
    'estadisticas': BarChart,
    'rrhh': Users,
    'notificaciones': Bell,
    'default': Activity
};

// Colores por módulo
const moduloColores: Record<string, string> = {
    'config': 'bg-purple-100 text-purple-700 border-purple-200',
    'condiciones': 'bg-blue-100 text-blue-700 border-blue-200',
    'comercial': 'bg-green-100 text-green-700 border-green-200',
    'estadisticas': 'bg-orange-100 text-orange-700 border-orange-200',
    'rrhh': 'bg-pink-100 text-pink-700 border-pink-200',
    'notificaciones': 'bg-indigo-100 text-indigo-700 border-indigo-200',
    'default': 'bg-gray-100 text-gray-700 border-gray-200'
};

export default function RolesPermisos({ roles, permisos, asignaciones, usuariosPorRol }: Props) {
    const toast = useToast();
    const [activeTab, setActiveTab] = useState<number>(roles[0]?.id || 0);
    const [expandedModulos, setExpandedModulos] = useState<Record<string, boolean>>({});
    const [searchTerm, setSearchTerm] = useState('');
    const [cargando, setCargando] = useState(false);
    const [permisosEditando, setPermisosEditando] = useState<Record<number, boolean>>({});
    const [mostrarSoloAsignados, setMostrarSoloAsignados] = useState(false);

    const rolActivo = roles.find(r => r.id === activeTab);

    const toggleModulo = (modulo: string) => {
        setExpandedModulos(prev => ({
            ...prev,
            [modulo]: !prev[modulo]
        }));
    };

    const expandirTodos = () => {
        const todosExpandidos = Object.keys(permisos).reduce((acc, modulo) => {
            if (modulo !== 'estadisticas') {
                acc[modulo] = true;
            }
            return acc;
        }, {} as Record<string, boolean>);
        setExpandedModulos(todosExpandidos);
    };

    const colapsarTodos = () => {
        setExpandedModulos({});
    };

    const togglePermiso = (permisoId: number) => {
        setPermisosEditando(prev => ({
            ...prev,
            [permisoId]: !prev[permisoId]
        }));
    };

    const tienePermiso = (permisoId: number): boolean => {
        return asignaciones[activeTab]?.includes(permisoId) || false;
    };

    const estaEditado = (permisoId: number): boolean => {
        return permisosEditando[permisoId] !== undefined && 
               permisosEditando[permisoId] !== tienePermiso(permisoId);
    };

    const getResumenRol = (rolId: number) => {
        // Filtrar estadísticas del total
        const total = Object.values(permisos)
            .flat()
            .filter(p => p.modulo !== 'estadisticas')
            .length;
        
        const asignados = asignaciones[rolId]?.filter(permisoId => {
            const permiso = Object.values(permisos).flat().find(p => p.id === permisoId);
            return permiso && permiso.modulo !== 'estadisticas';
        }).length || 0;
        
        const porcentaje = total > 0 ? Math.round((asignados / total) * 100) : 0;
        return { asignados, total, porcentaje };
    };

    const filtrarPermisos = (permiso: Permiso): boolean => {
        // No mostrar permisos de estadísticas
        if (permiso.modulo === 'estadisticas') return false;
        
        // Filtro por búsqueda
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const matchesSearch = permiso.nombre.toLowerCase().includes(term) ||
                                 permiso.descripcion?.toLowerCase().includes(term) ||
                                 permiso.modulo.toLowerCase().includes(term);
            if (!matchesSearch) return false;
        }
        
        // Filtro "solo asignados"
        if (mostrarSoloAsignados && !tienePermiso(permiso.id)) {
            return false;
        }
        
        return true;
    };

    const handleGuardarPermisos = async () => {
        setCargando(true);
        
        // Obtener los permisos finales: combinación de asignaciones originales + cambios
        const permisosFinales = [...(asignaciones[activeTab] || [])];
        
        // Aplicar cambios
        Object.entries(permisosEditando).forEach(([permisoIdStr, valor]) => {
            const permisoId = parseInt(permisoIdStr);
            if (valor && !permisosFinales.includes(permisoId)) {
                permisosFinales.push(permisoId);
            } else if (!valor && permisosFinales.includes(permisoId)) {
                const index = permisosFinales.indexOf(permisoId);
                permisosFinales.splice(index, 1);
            }
        });

        // Usar Inertia para la petición (maneja CSRF automáticamente)
        router.put(`/config/usuarios/roles/${activeTab}/permisos`, {
            permisos: permisosFinales
        }, {
            onStart: () => setCargando(true),
            onFinish: () => setCargando(false),
            onSuccess: (page) => {
                toast.success('Permisos actualizados correctamente');
                setPermisosEditando({});
                // Recargar solo las asignaciones
                router.reload({ only: ['asignaciones'] });
            },
            onError: (errors) => {
                console.error('Error:', errors);
                toast.error('Error al actualizar permisos');
            }
        });
    };

    const hayCambios = Object.keys(permisosEditando).length > 0;

    // Calcular estadísticas filtradas
    const modulosFiltrados = Object.keys(permisos).filter(m => m !== 'estadisticas');
    const permisosFiltrados = Object.values(permisos)
        .flat()
        .filter(p => p.modulo !== 'estadisticas');

    return (
        <AppLayout title="Roles y Permisos">
            <Head title="Roles y Permisos" />
            
            <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
                {/* Header con estadísticas rápidas */}
                <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                <Shield className="h-6 w-6 text-sat" />
                                Roles y Permisos
                            </h1>
                            <p className="text-gray-600 mt-1">
                                Gestiona los permisos asignados a cada rol del sistema
                            </p>
                        </div>
                        
                        <div className="flex gap-4">
                            <div className="bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
                                <p className="text-xs text-gray-500">Roles activos</p>
                                <p className="text-2xl font-bold text-gray-900">{roles.length}</p>
                            </div>
                            <div className="bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
                                <p className="text-xs text-gray-500">Módulos</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {modulosFiltrados.length}
                                </p>
                            </div>
                            <div className="bg-gray-50 rounded-lg px-4 py-2 border border-gray-200">
                                <p className="text-xs text-gray-500">Permisos</p>
                                <p className="text-2xl font-bold text-gray-900">
                                    {permisosFiltrados.length}
                                </p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Tabs de roles */}
                <div className="mb-6 border-b border-gray-200">
                    <nav className="flex -mb-px space-x-8 overflow-x-auto">
                        {roles.map(rol => {
                            const resumen = getResumenRol(rol.id);
                            const isActive = activeTab === rol.id;
                            return (
                                <button
                                    key={rol.id}
                                    onClick={() => setActiveTab(rol.id)}
                                    className={`
                                        py-3 px-1 border-b-2 font-medium text-sm whitespace-nowrap
                                        ${isActive 
                                            ? 'border-sat text-sat' 
                                            : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                        }
                                    `}
                                >
                                    <div className="flex items-center gap-2">
                                        <span>{rol.nombre}</span>
                                        <span className={`
                                            text-xs px-2 py-0.5 rounded-full
                                            ${isActive 
                                                ? 'bg-sat/10 text-sat' 
                                                : 'bg-gray-100 text-gray-600'
                                            }
                                        `}>
                                            {resumen.asignados}/{resumen.total}
                                        </span>
                                    </div>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Panel de control del rol activo */}
                {rolActivo && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                        {/* Header del rol */}
                        <div className="bg-gray-50 border-b border-gray-200 px-6 py-4">
                            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        {rolActivo.nombre}
                                        <span className="text-sm font-normal text-gray-500 ml-2">
                                            Nivel {rolActivo.nivel_permiso}
                                        </span>
                                    </h2>
                                    {rolActivo.descripcion && (
                                        <p className="text-sm text-gray-600 mt-1">{rolActivo.descripcion}</p>
                                    )}
                                    <p className="text-xs text-gray-500 mt-1 flex items-center gap-1">
                                        <Users className="h-3 w-3" />
                                        {usuariosPorRol[rolActivo.id] || 0} usuarios con este rol
                                    </p>
                                </div>
                                
                                <div className="flex flex-wrap gap-2">
                                    {/* Buscador */}
                                    <div className="relative">
                                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="text"
                                            placeholder="Buscar permisos..."
                                            value={searchTerm}
                                            onChange={(e) => setSearchTerm(e.target.value)}
                                            className="pl-9 pr-4 py-2 text-sm border border-gray-300 rounded-lg focus:ring-sat focus:border-sat w-full md:w-64 text-gray-900 placeholder-gray-400"
                                        />
                                    </div>
                                    
                                    {/* Filtro solo asignados */}
                                    <button
                                        onClick={() => setMostrarSoloAsignados(!mostrarSoloAsignados)}
                                        className={`px-3 py-2 text-sm rounded-lg border flex items-center gap-2 ${
                                            mostrarSoloAsignados
                                                ? 'bg-sat text-white border-sat'
                                                : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
                                        }`}
                                    >
                                        {mostrarSoloAsignados ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                                        Solo asignados
                                    </button>
                                    
                                    {/* Botones expandir/colapsar */}
                                    <button
                                        onClick={expandirTodos}
                                        className="px-3 py-2 text-sm bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Expandir todo
                                    </button>
                                    <button
                                        onClick={colapsarTodos}
                                        className="px-3 py-2 text-sm bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Colapsar todo
                                    </button>
                                    
                                    {/* Botón guardar */}
                                    {hayCambios && (
                                        <button
                                            onClick={handleGuardarPermisos}
                                            disabled={cargando}
                                            className="px-4 py-2 bg-sat text-white rounded-lg hover:bg-sat-600 font-medium flex items-center gap-2 disabled:opacity-50"
                                        >
                                            {cargando ? (
                                                <RefreshCw className="h-4 w-4 animate-spin" />
                                            ) : (
                                                <Save className="h-4 w-4" />
                                            )}
                                            Guardar cambios
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>

                        {/* Lista de permisos por módulo */}
                        <div className="p-6 max-h-[600px] overflow-y-auto">
                            <div className="space-y-4">
                                {Object.entries(permisos)
                                    .filter(([modulo]) => modulo !== 'estadisticas')
                                    .map(([modulo, items]) => {
                                        const itemsFiltrados = items.filter(filtrarPermisos);
                                        if (itemsFiltrados.length === 0) return null;
                                        
                                        const isExpanded = expandedModulos[modulo] || false;
                                        const Icono = moduloIconos[modulo] || moduloIconos.default;
                                        const colores = moduloColores[modulo] || moduloColores.default;
                                        
                                        // Contar permisos asignados en este módulo
                                        const asignadosEnModulo = items.filter(p => tienePermiso(p.id)).length;
                                        
                                        return (
                                            <div key={modulo} className="border border-gray-200 rounded-lg overflow-hidden">
                                                {/* Header del módulo */}
                                                <button
                                                    onClick={() => toggleModulo(modulo)}
                                                    className="w-full px-4 py-3 bg-gray-50 hover:bg-gray-100 flex items-center justify-between text-left"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className={`p-2 rounded-lg ${colores}`}>
                                                            <Icono className="h-4 w-4" />
                                                        </div>
                                                        <div>
                                                            <span className="font-medium capitalize text-gray-900">
                                                                {modulo}
                                                            </span>
                                                            <span className="text-xs text-gray-500 ml-2">
                                                                {items.length} permisos
                                                            </span>
                                                        </div>
                                                        <span className="text-xs px-2 py-0.5 rounded-full bg-white border border-gray-300 text-gray-700">
                                                            {asignadosEnModulo}/{items.length} asignados
                                                        </span>
                                                    </div>
                                                    {isExpanded ? (
                                                        <ChevronDown className="h-4 w-4 text-gray-500" />
                                                    ) : (
                                                        <ChevronRight className="h-4 w-4 text-gray-500" />
                                                    )}
                                                </button>
                                                
                                                {/* Lista de permisos */}
                                                {isExpanded && (
                                                    <div className="p-4 space-y-2 bg-white">
                                                        {itemsFiltrados.map(permiso => {
                                                            const asignado = tienePermiso(permiso.id);
                                                            const editado = estaEditado(permiso.id);
                                                            const nuevoEstado = permisosEditando[permiso.id] !== undefined 
                                                                ? permisosEditando[permiso.id] 
                                                                : asignado;
                                                            
                                                            return (
                                                                <label
                                                                    key={permiso.id}
                                                                    className={`
                                                                        flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors
                                                                        ${editado ? 'bg-yellow-50 border border-yellow-200' : 'hover:bg-gray-50'}
                                                                    `}
                                                                >
                                                                    <input
                                                                        type="checkbox"
                                                                        checked={nuevoEstado}
                                                                        onChange={() => togglePermiso(permiso.id)}
                                                                        className="mt-1 h-4 w-4 text-sat rounded border-gray-300 focus:ring-sat"
                                                                    />
                                                                    <div className="flex-1">
                                                                        <div className="flex items-center gap-2">
                                                                            <p className="text-sm font-medium text-gray-900">
                                                                                {permiso.nombre}
                                                                            </p>
                                                                            {editado && (
                                                                                <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">
                                                                                    Pendiente
                                                                                </span>
                                                                            )}
                                                                        </div>
                                                                        <p className="text-xs text-gray-500 mt-1">
                                                                            {permiso.descripcion}
                                                                        </p>
                                                                    </div>
                                                                    {asignado ? (
                                                                        <CheckCircle className="h-4 w-4 text-green-500" />
                                                                    ) : (
                                                                        <XCircle className="h-4 w-4 text-gray-300" />
                                                                    )}
                                                                </label>
                                                            );
                                                        })}
                                                    </div>
                                                )}
                                            </div>
                                        );
                                    })}
                            </div>
                        </div>

                        {/* Footer con resumen de cambios */}
                        {hayCambios && (
                            <div className="bg-gray-50 border-t border-gray-200 px-6 py-4 flex justify-between items-center">
                                <div className="text-sm text-gray-600 flex items-center gap-1">
                                    <AlertCircle className="h-4 w-4 text-yellow-500" />
                                    Tienes cambios sin guardar en {Object.keys(permisosEditando).length} permiso(s)
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setPermisosEditando({})}
                                        className="px-3 py-2 text-sm bg-white text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        onClick={handleGuardarPermisos}
                                        disabled={cargando}
                                        className="px-4 py-2 bg-sat text-white rounded-lg hover:bg-sat-600 font-medium flex items-center gap-2"
                                    >
                                        {cargando ? (
                                            <RefreshCw className="h-4 w-4 animate-spin" />
                                        ) : (
                                            <Save className="h-4 w-4" />
                                        )}
                                        Guardar cambios
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </AppLayout>
    );
}