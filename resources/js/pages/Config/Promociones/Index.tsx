// resources/js/Pages/Config/Promociones/Index.tsx
import { router } from '@inertiajs/react';
import { 
    Tag, Calendar, Edit2, Trash2, Plus, 
    AlertCircle, Gift, Percent, 
    CheckCircle, XCircle, Clock,
    ChevronDown, ChevronUp, Filter
} from 'lucide-react';
import React, { useState } from 'react';

import CrearPromocionModal from '@/components/Modals/CrearPromocionModal';
import Pagination from '@/components/ui/Pagination';
import AppLayout from '@/layouts/app-layout';
import { Promocion, EstadisticasPromociones, ProductosAgrupados } from '@/types/promociones';

interface Props {
    promociones: {
        data: Promocion[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
        links: any[];
    };
    estadisticas: EstadisticasPromociones;
    productos: ProductosAgrupados;
    flash?: {
        success?: string;
        error?: string;
    };
}

export default function PromocionesIndex({ promociones, estadisticas, productos, flash }: Props) {
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [selectedPromocion, setSelectedPromocion] = useState<Promocion | null>(null);
    const [isCrearModalOpen, setIsCrearModalOpen] = useState(false);
    const [editingPromocion, setEditingPromocion] = useState<Promocion | null>(null);
    const [expandedMobileCard, setExpandedMobileCard] = useState<number | null>(null);

    const formatDate = (date: string) => {
        return new Date(date).toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });
    };

    const getEstadoColor = (estado: string) => {
        switch(estado) {
            case 'Vigente':
                return 'bg-green-100 text-green-800 border-green-200';
            case 'Próxima':
                return 'bg-blue-100 text-blue-800 border-blue-200';
            case 'Vencida':
                return 'bg-gray-100 text-gray-800 border-gray-200';
            case 'Inactiva':
                return 'bg-red-100 text-red-800 border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-200';
        }
    };

    const getEstadoIcon = (estado: string) => {
        switch(estado) {
            case 'Vigente':
                return <CheckCircle className="h-3 w-3 sm:h-4 sm:w-4" />;
            case 'Próxima':
                return <Clock className="h-3 w-3 sm:h-4 sm:w-4" />;
            case 'Vencida':
                return <AlertCircle className="h-3 w-3 sm:h-4 sm:w-4" />;
            case 'Inactiva':
                return <XCircle className="h-3 w-3 sm:h-4 sm:w-4" />;
            default:
                return <Tag className="h-3 w-3 sm:h-4 sm:w-4" />;
        }
    };

    const handlePageChange = (page: number) => {
        router.get('/config/promociones', { page }, { preserveState: true });
    };

    const handleDelete = (promocion: Promocion) => {
        setSelectedPromocion(promocion);
        setShowDeleteModal(true);
    };

    const confirmDelete = () => {
        if (selectedPromocion) {
            router.delete(`/config/promociones/${selectedPromocion.id}`, {
                onSuccess: () => {
                    setShowDeleteModal(false);
                    setSelectedPromocion(null);
                },
                preserveScroll: true
            });
        }
    };

    const handleEdit = (promocion: Promocion) => {
        setEditingPromocion(promocion);
        setIsCrearModalOpen(true);
    };

    const handleModalClose = () => {
        setIsCrearModalOpen(false);
        setEditingPromocion(null);
    };

    const handleModalSuccess = () => {
        router.reload({ only: ['promociones', 'estadisticas'] });
    };

    const toggleMobileCard = (id: number) => {
        setExpandedMobileCard(expandedMobileCard === id ? null : id);
    };

    return (
        <AppLayout title="Promociones">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                {/* Header */}
                <div className="mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                Promociones
                            </h1>
                            <p className="mt-1 text-sm sm:text-base text-gray-600">
                                Gestión de promociones y bonificaciones
                            </p>
                        </div>
                        
                        <button
                            onClick={() => setIsCrearModalOpen(true)}
                            className="w-full sm:w-auto px-4 py-2 bg-sat text-white text-sm rounded-lg hover:bg-sat-600 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Nueva Promoción
                        </button>
                    </div>
                </div>

                {/* Flash Messages */}
                {flash?.success && (
                    <div className="mb-4 p-3 sm:p-4 bg-green-100 border border-green-400 text-green-700 text-sm sm:text-base rounded">
                        {flash.success}
                    </div>
                )}
                {flash?.error && (
                    <div className="mb-4 p-3 sm:p-4 bg-red-100 border border-red-400 text-red-700 text-sm sm:text-base rounded">
                        {flash.error}
                    </div>
                )}

                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {/* Stats Cards - Responsive */}
                    <div className="p-4 sm:p-6 border-b border-gray-200">
                        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
                            <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Total</h3>
                                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-900">{estadisticas.total}</p>
                            </div>
                            <div className="p-3 sm:p-4 bg-green-50 rounded-lg border border-green-200">
                                <h3 className="text-xs sm:text-sm font-medium text-green-700 mb-1">Vigentes</h3>
                                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-green-600">{estadisticas.vigentes}</p>
                            </div>
                            <div className="p-3 sm:p-4 bg-blue-50 rounded-lg border border-blue-200">
                                <h3 className="text-xs sm:text-sm font-medium text-blue-700 mb-1">Próximas</h3>
                                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-blue-600">{estadisticas.proximas}</p>
                            </div>
                            <div className="p-3 sm:p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <h3 className="text-xs sm:text-sm font-medium text-gray-600 mb-1">Vencidas</h3>
                                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-gray-600">{estadisticas.vencidas}</p>
                            </div>
                            <div className="p-3 sm:p-4 bg-red-50 rounded-lg border border-red-200 col-span-2 lg:col-span-1">
                                <h3 className="text-xs sm:text-sm font-medium text-red-700 mb-1">Inactivas</h3>
                                <p className="text-lg sm:text-xl lg:text-2xl font-bold text-red-600">{estadisticas.inactivas}</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Listado de promociones */}
                    {promociones.data.length > 0 ? (
                        <>
                            {/* Vista Desktop - Tabla */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vigencia</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Productos</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Estado</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Creado por</th>
                                            <th className="px-4 lg:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="bg-white divide-y divide-gray-200">
                                        {promociones.data.map((promocion) => (
                                            <tr key={promocion.id} className="hover:bg-gray-50">
                                                <td className="px-4 lg:px-6 py-3 lg:py-4">
                                                    <div className="flex items-start gap-3">
                                                        <Gift className="h-4 w-4 lg:h-5 lg:w-5 text-sat flex-shrink-0 mt-1" />
                                                        <div>
                                                            <div className="text-xs lg:text-sm font-medium text-gray-900">{promocion.nombre}</div>
                                                            {promocion.descripcion && (
                                                                <div className="text-xs text-gray-500 line-clamp-1">{promocion.descripcion}</div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                                                    <div className="flex items-center gap-1 lg:gap-2 text-xs lg:text-sm text-gray-600">
                                                        <Calendar className="h-3 w-3 lg:h-4 lg:w-4 flex-shrink-0" />
                                                        <span className="whitespace-nowrap">{formatDate(promocion.fecha_inicio)}</span>
                                                        <span className="hidden lg:inline">-</span>
                                                        <span className="hidden lg:inline">{formatDate(promocion.fecha_fin)}</span>
                                                    </div>
                                                </td>
                                                <td className="px-4 lg:px-6 py-3 lg:py-4">
                                                    <div className="space-y-1">
                                                        {promocion.productos.slice(0, 2).map((prod) => (
                                                            <div key={prod.id} className="flex items-center gap-1 lg:gap-2 text-xs">
                                                                <Percent className="h-3 w-3 text-sat flex-shrink-0" />
                                                                <span className="text-gray-600 truncate max-w-[120px] lg:max-w-none">
                                                                    {prod.productoServicio.nombre}
                                                                </span>
                                                                <span className="font-medium text-sat whitespace-nowrap">{prod.bonificacion}%</span>
                                                            </div>
                                                        ))}
                                                        {promocion.productos.length > 2 && (
                                                            <div className="text-xs text-gray-400">+{promocion.productos.length - 2} más</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap">
                                                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${getEstadoColor(promocion.estado)}`}>
                                                        {getEstadoIcon(promocion.estado)}
                                                        <span className="hidden lg:inline">{promocion.estado}</span>
                                                    </span>
                                                </td>
                                                <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500">
                                                    {promocion.creador?.name || 'Sistema'}
                                                </td>
                                                <td className="px-4 lg:px-6 py-3 lg:py-4 whitespace-nowrap text-xs lg:text-sm text-gray-500">
                                                    <div className="flex items-center gap-2">
                                                        <button 
                                                            onClick={() => handleEdit(promocion)} 
                                                            className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50 transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => handleDelete(promocion)} 
                                                            className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50 transition-colors"
                                                            title="Eliminar"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Vista Mobile - Tarjetas */}
                            <div className="md:hidden divide-y divide-gray-200">
                                {promociones.data.map((promocion) => (
                                    <div key={promocion.id} className="p-4 hover:bg-gray-50">
                                        {/* Cabecera de la tarjeta - siempre visible */}
                                        <div className="flex items-start justify-between mb-2">
                                            <div className="flex items-start gap-2">
                                                <Gift className="h-5 w-5 text-sat flex-shrink-0 mt-0.5" />
                                                <div>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {promocion.nombre}
                                                        </span>
                                                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${getEstadoColor(promocion.estado)}`}>
                                                            {getEstadoIcon(promocion.estado)}
                                                            <span>{promocion.estado}</span>
                                                        </span>
                                                    </div>
                                                    {promocion.descripcion && (
                                                        <p className="text-xs text-gray-500 line-clamp-1">{promocion.descripcion}</p>
                                                    )}
                                                </div>
                                            </div>
                                            <button
                                                onClick={() => toggleMobileCard(promocion.id)}
                                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                {expandedMobileCard === promocion.id ? (
                                                    <ChevronUp className="h-5 w-5 text-gray-500" />
                                                ) : (
                                                    <ChevronDown className="h-5 w-5 text-gray-500" />
                                                )}
                                            </button>
                                        </div>

                                        {/* Información resumida siempre visible */}
                                        <div className="flex items-center gap-3 text-xs text-gray-600 ml-7">
                                            <div className="flex items-center gap-1">
                                                <Calendar className="h-3 w-3" />
                                                <span>{formatDate(promocion.fecha_inicio)}</span>
                                            </div>
                                            <span>-</span>
                                            <span>{formatDate(promocion.fecha_fin)}</span>
                                        </div>

                                        {/* Detalles expandibles */}
                                        {expandedMobileCard === promocion.id && (
                                            <div className="mt-4 pt-4 border-t border-gray-100 ml-7">
                                                {/* Productos */}
                                                <div className="mb-4">
                                                    <p className="text-xs font-medium text-gray-500 mb-2">Productos con bonificación:</p>
                                                    <div className="space-y-2">
                                                        {promocion.productos.map((prod) => (
                                                            <div key={prod.id} className="flex items-center justify-between text-sm">
                                                                <span className="text-gray-600">{prod.productoServicio.nombre}</span>
                                                                <span className="font-medium text-sat">{prod.bonificacion}%</span>
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                {/* Creador */}
                                                <div className="mb-4">
                                                    <p className="text-xs font-medium text-gray-500 mb-1">Creado por</p>
                                                    <p className="text-sm text-gray-900">{promocion.creador?.name || 'Sistema'}</p>
                                                </div>

                                                {/* Acciones móvil */}
                                                <div className="grid grid-cols-2 gap-2 mt-4">
                                                    <button
                                                        onClick={() => handleEdit(promocion)}
                                                        className="px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => handleDelete(promocion)}
                                                        className="px-3 py-2 bg-red-50 text-red-700 text-sm rounded-lg hover:bg-red-100 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                        Eliminar
                                                    </button>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                            
                            {/* Paginación */}
                            {promociones.last_page > 1 && (
                                <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
                                    <Pagination
                                        currentPage={promociones.current_page}
                                        lastPage={promociones.last_page}
                                        total={promociones.total}
                                        perPage={promociones.per_page}
                                    />
                                </div>
                            )}
                        </>
                    ) : (
                        <div className="text-gray-600 text-center py-8 sm:py-12">
                            <Gift className="h-10 w-10 sm:h-12 sm:w-12 text-gray-400 mx-auto mb-3 sm:mb-4" />
                            <p className="text-base sm:text-lg font-medium">No hay promociones cargadas</p>
                            <p className="text-xs sm:text-sm mt-2">
                                <button 
                                    onClick={() => setIsCrearModalOpen(true)} 
                                    className="text-sat hover:underline"
                                >
                                    Crear la primera promoción
                                </button>
                            </p>
                        </div>
                    )}
                </div>
            </div>

            {/* Modal de creación/edición */}
            <CrearPromocionModal
                isOpen={isCrearModalOpen}
                onClose={handleModalClose}
                onSuccess={handleModalSuccess}
                promocion={editingPromocion}
                productos={productos}
            />

            {/* Modal de confirmación de eliminación - Responsive */}
            {showDeleteModal && selectedPromocion && (
                <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[99999] p-4">
                    <div className="bg-white rounded-lg shadow-2xl max-w-md w-full animate-fadeIn">
                        <div className="p-4 sm:p-6">
                            <div className="flex items-center gap-3 mb-4">
                                <div className="p-2 bg-red-100 rounded-full flex-shrink-0">
                                    <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                                </div>
                                <h3 className="text-base sm:text-lg font-semibold text-gray-900">Confirmar eliminación</h3>
                            </div>
                            <p className="text-sm sm:text-base text-gray-600 mb-6">
                                ¿Estás seguro de que deseas eliminar la promoción "{selectedPromocion.nombre}"?
                                Esta acción no se puede deshacer.
                            </p>
                            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
                                <button 
                                    onClick={() => setShowDeleteModal(false)} 
                                    className="w-full sm:w-auto px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button 
                                    onClick={confirmDelete} 
                                    className="w-full sm:w-auto px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700"
                                >
                                    Eliminar
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}