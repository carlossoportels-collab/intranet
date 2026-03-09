// resources/js/Pages/rrhh/Personal/Licencias.tsx

import React, { useState } from 'react';
import { Head, router } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import NuevaLicenciaModal from '@/components/Modals/NuevaLicenciaModal';
import EditarLicenciaModal from '@/components/Modals/EditarLicenciaModal';
import { Edit, Trash2 } from 'lucide-react';
import { useToast } from '@/contexts/ToastContext';

interface Licencia {
    id: number;
    personal_id: number;
    empleado: string;
    tipo: string;
    tipo_id: number;
    fecha_inicio: string;
    fecha_fin: string;
    dias_totales: number;
    dias_restantes: number;
    observacion: string;
    estado: string;
    fecha_solicitud: string;
}

interface Motivo {
    id: number;
    nombre: string;
}

interface PaginatedData<T> {
    data: T[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
}

interface Props {
    licencias: PaginatedData<Licencia>;
    motivos: Motivo[];
    filters: {
        estado?: string;
        motivo_id?: number;
        empleado?: string;
    };
    userRole: number;
    esComercial: boolean;
}

export default function Licencias({ licencias, motivos, filters, userRole, esComercial }: Props) {
    const toast = useToast();
    const [modalNuevoAbierto, setModalNuevoAbierto] = useState(false);
    const [modalEditarAbierto, setModalEditarAbierto] = useState(false);
    const [confirmDialogAbierto, setConfirmDialogAbierto] = useState(false);
    const [licenciaAEliminar, setLicenciaAEliminar] = useState<{ id: number; empleado: string } | null>(null);
    const [licenciaSeleccionada, setLicenciaSeleccionada] = useState<Licencia | null>(null);
    
    const [filtroEstado, setFiltroEstado] = useState<string>(filters.estado || 'todos');
    const [filtroMotivo, setFiltroMotivo] = useState<number | 'todos'>(filters.motivo_id || 'todos');
    const [filtroEmpleado, setFiltroEmpleado] = useState<string>(filters.empleado || '');

    // Permisos por rol
    const esAdmin = userRole === 2; // Solo rol 2 puede hacer todo
    const puedeVerTodo = esAdmin; // Solo admin ve todo
    const puedeCrear = esAdmin;
    const puedeEditar = esAdmin;
    const puedeEliminar = esAdmin;

    const getTipoColor = (tipo: string) => {
        const tipoLower = tipo.toLowerCase();
        if (tipoLower.includes('vacacion')) return 'bg-blue-100 text-blue-800';
        if (tipoLower.includes('enfermedad')) return 'bg-red-100 text-red-800';
        if (tipoLower.includes('estudio')) return 'bg-purple-100 text-purple-800';
        if (tipoLower.includes('maternidad')) return 'bg-pink-100 text-pink-800';
        if (tipoLower.includes('paternidad')) return 'bg-indigo-100 text-indigo-800';
        if (tipoLower.includes('examen')) return 'bg-yellow-100 text-yellow-800';
        return 'bg-gray-100 text-gray-800';
    };

    const getEstadoColor = (estado: string) => {
        switch (estado) {
            case 'Programada': return 'bg-blue-100 text-blue-800';
            case 'En Curso': return 'bg-green-100 text-green-800';
            case 'Finalizada': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const handleFiltroChange = (tipo: 'estado' | 'motivo' | 'empleado', valor: any) => {
        const params: any = {
            page: 1
        };
        
        if (tipo === 'estado') {
            setFiltroEstado(valor);
            params.estado = valor !== 'todos' ? valor : undefined;
            params.motivo_id = filtroMotivo !== 'todos' ? filtroMotivo : undefined;
            params.empleado = filtroEmpleado || undefined;
        } else if (tipo === 'motivo') {
            setFiltroMotivo(valor);
            params.motivo_id = valor !== 'todos' ? valor : undefined;
            params.estado = filtroEstado !== 'todos' ? filtroEstado : undefined;
            params.empleado = filtroEmpleado || undefined;
        } else {
            setFiltroEmpleado(valor);
            params.empleado = valor || undefined;
            params.estado = filtroEstado !== 'todos' ? filtroEstado : undefined;
            params.motivo_id = filtroMotivo !== 'todos' ? filtroMotivo : undefined;
        }
        
        router.get('/rrhh/personal/licencias', params, { preserveState: true, replace: true });
    };

    const handleSuccess = () => {
        router.reload({ only: ['licencias'] });
    };

    const handleEditClick = (licencia: Licencia) => {
        setLicenciaSeleccionada(licencia);
        setModalEditarAbierto(true);
    };

    const handleDeleteClick = (id: number, empleado: string) => {
        setLicenciaAEliminar({ id, empleado });
        setConfirmDialogAbierto(true);
    };

    const handleConfirmDelete = () => {
        if (licenciaAEliminar) {
            router.delete(`/rrhh/personal/licencias/${licenciaAEliminar.id}`, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Licencia eliminada correctamente');
                    router.reload({ only: ['licencias'] });
                },
                onError: (errors) => {
                    console.error('Error al eliminar:', errors);
                    toast.error('Error al eliminar la licencia');
                }
            });
        }
        setLicenciaAEliminar(null);
    };

    // Obtener lista única de empleados para el filtro
    const empleadosUnicos = [...new Set(licencias.data.map(l => l.empleado))].sort();

    return (
        <AppLayout title="Licencias">
            <Head title="Licencias" />
            
            <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    Licencias y Ausencias
                </h1>
                <p className="mt-1 text-gray-600 text-base">
                    Gestión de licencias, vacaciones y ausencias del personal
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                {/* Header y Botón Nueva Solicitud */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">
                            Listado de Licencias
                        </h2>
                        <p className="text-sm text-gray-600">
                            {licencias.total} registros encontrados
                        </p>
                    </div>
                    
                    {puedeCrear && (
                        <button 
                            onClick={() => setModalNuevoAbierto(true)}
                            className="px-4 py-2 bg-sat text-white text-sm rounded hover:bg-sat-600 transition-colors"
                        >
                            + Nueva Solicitud
                        </button>
                    )}
                </div>

                {/* Filtros */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                        <select
                            value={filtroEstado}
                            onChange={(e) => handleFiltroChange('estado', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-sat focus:border-sat"
                        >
                            <option value="todos">Todos los estados</option>
                            <option value="Programada">Programada</option>
                            <option value="En Curso">En Curso</option>
                            <option value="Finalizada">Finalizada</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Tipo</label>
                        <select
                            value={filtroMotivo}
                            onChange={(e) => handleFiltroChange('motivo', e.target.value === 'todos' ? 'todos' : Number(e.target.value))}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-sat focus:border-sat"
                        >
                            <option value="todos">Todos los tipos</option>
                            {motivos.map(motivo => (
                                <option key={motivo.id} value={motivo.id}>
                                    {motivo.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Empleado</label>
                        <select
                            value={filtroEmpleado}
                            onChange={(e) => handleFiltroChange('empleado', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-sat focus:border-sat"
                        >
                            <option value="">Todos los empleados</option>
                            {empleadosUnicos.map(empleado => (
                                <option key={empleado} value={empleado}>
                                    {empleado}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Empleado</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Tipo</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Período</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Días</th>
                                {/* Columna Observación - Solo visible para admin */}
                                {puedeVerTodo && (
                                    <th className="py-3 px-4 text-left font-medium text-gray-700">Observación</th>
                                )}
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Solicitado</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Estado</th>
                                {/* Columna Acciones - Solo visible para admin */}
                                {(puedeEditar || puedeEliminar) && (
                                    <th className="py-3 px-4 text-left font-medium text-gray-700">Acciones</th>
                                )}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {licencias.data.map((licencia) => (
                                <tr key={licencia.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        <div className="font-medium">{licencia.empleado}</div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${getTipoColor(licencia.tipo)}`}>
                                            {licencia.tipo}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="text-sm">
                                            <div>{licencia.fecha_inicio}</div>
                                            <div className="text-gray-500">al {licencia.fecha_fin}</div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div>
                                            <div className="font-medium">{licencia.dias_restantes}/{licencia.dias_totales} días</div>
                                            <div className="h-2 bg-gray-200 rounded-full overflow-hidden w-20">
                                                <div 
                                                    className={`h-full ${
                                                        (licencia.dias_restantes / licencia.dias_totales) > 0.5 ? 'bg-green-500' :
                                                        (licencia.dias_restantes / licencia.dias_totales) > 0.2 ? 'bg-yellow-500' :
                                                        'bg-red-500'
                                                    }`}
                                                    style={{ width: `${(licencia.dias_restantes / licencia.dias_totales) * 100}%` }}
                                                />
                                            </div>
                                        </div>
                                    </td>
                                    {/* Observación - Solo visible para admin */}
                                    {puedeVerTodo && (
                                        <td className="py-3 px-4 text-gray-600 max-w-xs truncate">{licencia.observacion}</td>
                                    )}
                                    <td className="py-3 px-4">{licencia.fecha_solicitud}</td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${getEstadoColor(licencia.estado)}`}>
                                            {licencia.estado}
                                        </span>
                                    </td>
                                    {/* Acciones - Solo visible para admin */}
                                    {(puedeEditar || puedeEliminar) && (
                                        <td className="py-3 px-4">
                                            <div className="flex gap-2">
                                                {puedeEditar && (
                                                    <button
                                                        onClick={() => handleEditClick(licencia)}
                                                        className="p-1 text-amber-600 hover:text-amber-800 hover:bg-amber-50 rounded transition-colors"
                                                        title="Editar"
                                                    >
                                                        <Edit className="h-4 w-4" />
                                                    </button>
                                                )}
                                                {puedeEliminar && (
                                                    <button
                                                        onClick={() => handleDeleteClick(licencia.id, licencia.empleado)}
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
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                    {licencias.data.map((licencia) => (
                        <div key={licencia.id} className="p-4 border border-gray-200 rounded-lg hover:border-sat transition-colors">
                            <div className="flex justify-between items-start mb-3">
                                <div>
                                    <div className="font-medium text-gray-900">{licencia.empleado}</div>
                                    <div className="mt-1">
                                        <span className={`px-2 py-1 text-xs rounded-full ${getTipoColor(licencia.tipo)}`}>
                                            {licencia.tipo}
                                        </span>
                                    </div>
                                </div>
                                <span className={`px-2 py-1 text-xs rounded-full ${getEstadoColor(licencia.estado)}`}>
                                    {licencia.estado}
                                </span>
                            </div>
                            
                            <div className="grid grid-cols-2 gap-2 mb-3 text-sm">
                                <div>
                                    <span className="text-gray-600">Inicio:</span>
                                    <span className="ml-1 font-medium">{licencia.fecha_inicio}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Fin:</span>
                                    <span className="ml-1 font-medium">{licencia.fecha_fin}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Días:</span>
                                    <span className="ml-1 font-medium">{licencia.dias_restantes}/{licencia.dias_totales}</span>
                                </div>
                                <div>
                                    <span className="text-gray-600">Solicitud:</span>
                                    <span className="ml-1 font-medium">{licencia.fecha_solicitud}</span>
                                </div>
                            </div>
                            
                            {/* Observación - Solo visible para admin */}
                            {puedeVerTodo && (
                                <div className="mb-3">
                                    <div className="text-sm font-medium text-gray-700 mb-1">Observación</div>
                                    <div className="text-sm text-gray-600">{licencia.observacion}</div>
                                </div>
                            )}
                            
                            {/* Acciones - Solo visible para admin */}
                            {(puedeEditar || puedeEliminar) && (
                                <div className="flex gap-2 mt-3 pt-3 border-t border-gray-200">
                                    {puedeEditar && (
                                        <button
                                            onClick={() => handleEditClick(licencia)}
                                            className="flex-1 px-3 py-1.5 text-sm text-amber-600 border border-amber-600 rounded hover:bg-amber-50 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Edit className="h-4 w-4" />
                                            Editar
                                        </button>
                                    )}
                                    {puedeEliminar && (
                                        <button
                                            onClick={() => handleDeleteClick(licencia.id, licencia.empleado)}
                                            className="flex-1 px-3 py-1.5 text-sm text-red-600 border border-red-600 rounded hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                            Eliminar
                                        </button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Paginación */}
                {licencias.total > 0 && (
                    <Pagination
                        currentPage={licencias.current_page}
                        lastPage={licencias.last_page}
                        total={licencias.total}
                        perPage={licencias.per_page}
                        preserveState={true}
                        preserveScroll={true}
                        only={['licencias']}
                    />
                )}

                {licencias.data.length === 0 && (
                    <div className="text-center py-8">
                        <p className="text-gray-500">No se encontraron licencias con los filtros seleccionados</p>
                    </div>
                )}
            </div>

            {/* Modal Nueva Licencia */}
            {puedeCrear && (
                <NuevaLicenciaModal
                    isOpen={modalNuevoAbierto}
                    onClose={() => setModalNuevoAbierto(false)}
                    onSuccess={handleSuccess}
                    motivos={motivos}
                />
            )}

            {/* Modal Editar Licencia */}
            {puedeEditar && (
                <EditarLicenciaModal
                    isOpen={modalEditarAbierto}
                    onClose={() => {
                        setModalEditarAbierto(false);
                        setLicenciaSeleccionada(null);
                    }}
                    onSuccess={handleSuccess}
                    licencia={licenciaSeleccionada}
                    motivos={motivos}
                />
            )}

            {/* Confirm Dialog para eliminar */}
            <ConfirmDialog
                isOpen={confirmDialogAbierto}
                onClose={() => {
                    setConfirmDialogAbierto(false);
                    setLicenciaAEliminar(null);
                }}
                onConfirm={handleConfirmDelete}
                title="Eliminar Licencia"
                message={`¿Está seguro que desea eliminar la licencia de ${licenciaAEliminar?.empleado}? Esta acción no se puede deshacer.`}
                confirmText="Eliminar"
                cancelText="Cancelar"
                type="danger"
            />
        </AppLayout>
    );
}