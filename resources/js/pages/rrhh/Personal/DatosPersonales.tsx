// resources/js/Pages/RRHH/Personal/DatosPersonales.tsx

import { Head, router } from '@inertiajs/react';
import { 
  User, Mail, Phone, Calendar, Edit, Trash2, Search, 
  Filter, X, ChevronLeft, ChevronRight, MoreHorizontal,
  Eye, Plus
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import AppLayout from '@/layouts/app-layout';
import { useToast } from '@/contexts/ToastContext';
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface TipoPersonal {
    id: number;
    nombre: string;
}

interface Personal {
    id: number;
    nombre: string;
    apellido: string;
    nombre_completo: string;
    email: string;
    telefono: string;
    fecha_nacimiento: string | null;
    tipo_personal_id: number;
    tipo_personal?: TipoPersonal;
    activo: boolean;
    created: string;
}

interface Props {
    personal: Personal[];
    tiposPersonal: TipoPersonal[];
    filters: {
        search?: string;
    };
    userRole: number;
    esComercial: boolean;
}

export default function DatosPersonales({ personal, tiposPersonal, filters, userRole, esComercial }: Props) {
    const toast = useToast();
    const [searchTerm, setSearchTerm] = useState(filters.search || '');
    const [filtroTipo, setFiltroTipo] = useState<number | 'todos'>('todos');
    const [filtroEstado, setFiltroEstado] = useState<'todos' | 'activo' | 'inactivo'>('todos');
    const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
    const [personaAEliminar, setPersonaAEliminar] = useState<Personal | null>(null);
    const [mostrarFiltros, setMostrarFiltros] = useState(false);
    
    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    const puedeCrear = !esComercial;
    const puedeEditar = !esComercial;
    const puedeEliminar = !esComercial;

    // Filtrar personal
    const personalFiltrado = personal.filter(persona => {
        // Filtro por búsqueda
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            const matches = 
                persona.nombre.toLowerCase().includes(term) ||
                persona.apellido.toLowerCase().includes(term) ||
                persona.nombre_completo.toLowerCase().includes(term) ||
                (persona.email && persona.email.toLowerCase().includes(term)) ||
                (persona.telefono && persona.telefono.includes(term));
            if (!matches) return false;
        }

        // Filtro por tipo
        if (filtroTipo !== 'todos' && persona.tipo_personal_id !== filtroTipo) {
            return false;
        }

        // Filtro por estado
        if (filtroEstado === 'activo' && !persona.activo) return false;
        if (filtroEstado === 'inactivo' && persona.activo) return false;

        return true;
    });

    // Paginación
    const totalPages = Math.ceil(personalFiltrado.length / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const personalPaginated = personalFiltrado.slice(startIndex, endIndex);

    // Resetear página cuando cambian filtros
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, filtroTipo, filtroEstado]);

    const handleSearch = () => {
        router.get('/rrhh/personal/datos', 
            { search: searchTerm || undefined },
            { preserveState: true, replace: true }
        );
    };

    const limpiarFiltros = () => {
        setSearchTerm('');
        setFiltroTipo('todos');
        setFiltroEstado('todos');
        setCurrentPage(1);
    };

    const handleEdit = (id: number) => {
        router.get(`/rrhh/personal/datos/${id}/editar`);
    };

    const handleDeleteClick = (persona: Personal) => {
        setPersonaAEliminar(persona);
        setConfirmDialogOpen(true);
    };

    const handleConfirmDelete = () => {
        if (personaAEliminar) {
            router.delete(`/rrhh/personal/datos/${personaAEliminar.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Personal eliminado correctamente');
                    router.reload({ only: ['personal'] });
                },
                onError: (errors) => {
                    toast.error('Error al eliminar el registro');
                }
            });
        }
        setPersonaAEliminar(null);
    };

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        try {
            const date = new Date(dateString);
            return date.toLocaleDateString('es-AR');
        } catch {
            return 'N/A';
        }
    };

    const getTipoNombre = (tipoId: number) => {
        const tipo = tiposPersonal.find(t => t.id === tipoId);
        return tipo ? tipo.nombre : 'Sin tipo';
    };

    const getIniciales = (nombre: string, apellido: string) => {
        return (nombre.charAt(0) + apellido.charAt(0)).toUpperCase();
    };

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
                            Gestión de información del personal
                        </p>
                    </div>
                    
                    <div className="flex gap-2">
                        {puedeCrear && (
                            <button 
                                onClick={() => router.get('/rrhh/personal/datos/crear')}
                                className="px-4 py-2 bg-sat text-white text-sm rounded hover:bg-sat-600 transition-colors flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Nuevo Personal
                            </button>
                        )}
                        
                        <button
                            onClick={() => setMostrarFiltros(!mostrarFiltros)}
                            className="px-4 py-2 border border-gray-300 rounded text-sm flex items-center gap-2 hover:bg-gray-50"
                        >
                            <Filter className="h-4 w-4" />
                            Filtros
                        </button>
                    </div>
                </div>
            </div>

            {/* Barra de búsqueda y filtros */}
            {mostrarFiltros && (
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Buscar
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                                    placeholder="Nombre, email, teléfono..."
                                    className="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 rounded focus:ring-sat focus:border-sat"
                                />
                                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                            </div>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Tipo
                            </label>
                            <select
                                value={filtroTipo}
                                onChange={(e) => setFiltroTipo(e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-sat focus:border-sat"
                            >
                                <option value="todos">Todos los tipos</option>
                                {tiposPersonal.map(tipo => (
                                    <option key={tipo.id} value={tipo.id}>
                                        {tipo.nombre}
                                    </option>
                                ))}
                            </select>
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Estado
                            </label>
                            <select
                                value={filtroEstado}
                                onChange={(e) => setFiltroEstado(e.target.value as typeof filtroEstado)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-sat focus:border-sat"
                            >
                                <option value="todos">Todos</option>
                                <option value="activo">Activos</option>
                                <option value="inactivo">Inactivos</option>
                            </select>
                        </div>
                        
                        <div className="flex items-end">
                            <button
                                onClick={limpiarFiltros}
                                className="w-full px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors flex items-center justify-center gap-2"
                            >
                                <X className="h-4 w-4" />
                                Limpiar filtros
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Tabla */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Empleado</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Tipo</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Contacto</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Fecha Nac.</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Estado</th>
                                {(puedeEditar || puedeEliminar) && (
                                    <th className="py-3 px-4 text-left font-medium text-gray-700">Acciones</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {personalPaginated.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="py-8 text-center text-gray-500">
                                        No se encontraron registros
                                    </td>
                                </tr>
                            ) : (
                                personalPaginated.map((persona) => (
                                    <tr key={persona.id} className="hover:bg-gray-50">
                                        <td className="py-3 px-4">
                                            <div className="flex items-center gap-3">
                                                <div className="h-8 w-8 rounded-full bg-local flex items-center justify-center text-white text-xs font-semibold">
                                                    {getIniciales(persona.nombre, persona.apellido)}
                                                </div>
                                                <div>
                                                    <div className="font-medium text-gray-900">
                                                        {persona.nombre_completo}
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        ID: {persona.id}
                                                    </div>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                {getTipoNombre(persona.tipo_personal_id)}
                                            </span>
                                        </td>
                                        <td className="py-3 px-4">
                                            <div className="space-y-1">
                                                {persona.email && (
                                                    <div className="flex items-center text-xs text-gray-600">
                                                        <Mail className="h-3 w-3 mr-1 text-gray-400" />
                                                        {persona.email}
                                                    </div>
                                                )}
                                                {persona.telefono && (
                                                    <div className="flex items-center text-xs text-gray-600">
                                                        <Phone className="h-3 w-3 mr-1 text-gray-400" />
                                                        {persona.telefono}
                                                    </div>
                                                )}
                                            </div>
                                        </td>
                                        <td className="py-3 px-4">
                                            {persona.fecha_nacimiento && (
                                                <div className="flex items-center text-sm text-gray-600">
                                                    <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                                                    {formatDate(persona.fecha_nacimiento)}
                                                </div>
                                            )}
                                        </td>
                                        <td className="py-3 px-4">
                                            <span className={`px-2 py-1 text-xs rounded-full ${
                                                persona.activo 
                                                    ? 'bg-green-100 text-green-800' 
                                                    : 'bg-red-100 text-red-800'
                                            }`}>
                                                {persona.activo ? 'Activo' : 'Inactivo'}
                                            </span>
                                        </td>
                                        {(puedeEditar || puedeEliminar) && (
                                            <td className="py-3 px-4">
                                                <div className="flex gap-2">
                                                    {puedeEditar && (
                                                        <button
                                                            onClick={() => handleEdit(persona.id)}
                                                            className="p-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                    {puedeEliminar && (
                                                        <button
                                                            onClick={() => handleDeleteClick(persona)}
                                                            className="p-1 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    )}
                                                </div>
                                            </td>
                                        )}
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Paginación */}
                {totalPages > 1 && (
                    <div className="px-4 py-3 border-t border-gray-200">
                        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div className="text-sm text-gray-700">
                                Mostrando {startIndex + 1} a {Math.min(endIndex, personalFiltrado.length)} de {personalFiltrado.length} registros
                            </div>
                            <div className="flex items-center gap-2">
                                <button
                                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                                    disabled={currentPage === 1}
                                    className={`px-3 py-1 border rounded text-sm flex items-center gap-1 ${
                                        currentPage === 1 
                                            ? 'text-gray-400 border-gray-300 cursor-not-allowed' 
                                            : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <ChevronLeft className="h-4 w-4" />
                                    <span className="hidden sm:inline">Anterior</span>
                                </button>
                                
                                <span className="px-3 py-1 text-sm text-gray-700">
                                    Página {currentPage} de {totalPages}
                                </span>
                                
                                <button
                                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                                    disabled={currentPage === totalPages}
                                    className={`px-3 py-1 border rounded text-sm flex items-center gap-1 ${
                                        currentPage === totalPages 
                                            ? 'text-gray-400 border-gray-300 cursor-not-allowed' 
                                            : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                                    }`}
                                >
                                    <span className="hidden sm:inline">Siguiente</span>
                                    <ChevronRight className="h-4 w-4" />
                                </button>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Confirm Dialog para eliminar */}
            <ConfirmDialog
                isOpen={confirmDialogOpen}
                onClose={() => setConfirmDialogOpen(false)}
                onConfirm={handleConfirmDelete}
                title="Eliminar Personal"
                message={`¿Estás seguro de eliminar a ${personaAEliminar?.nombre_completo}? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                type="danger"
            />
        </AppLayout>
    );
}