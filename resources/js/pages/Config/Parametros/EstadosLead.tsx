// resources/js/Pages/Config/Parametros/EstadosLead.tsx - VERSIÓN RESPONSIVE
import { router, useForm } from '@inertiajs/react';
import { 
    Plus, Edit2, Trash2, X, AlertCircle, 
    ChevronDown, ChevronUp, Eye, EyeOff 
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import AppLayout from '@/layouts/app-layout';

// Define el tipo para el estado del formulario
interface EstadoLeadForm {
    nombre: string;
    tipo: 'nuevo' | 'activo' | 'final_positivo' | 'final_negativo';
    orden_en_proceso: number;
    descripcion: string;
    color_hex: string;
}

interface EstadoLead extends EstadoLeadForm {
    id: number;
    activo: boolean;
}

interface Props {
    estados: EstadoLead[];
}

export default function EstadosLead({ estados = [] }: Props) {
    
    const [showModal, setShowModal] = useState(false);
    const [editingEstado, setEditingEstado] = useState<EstadoLead | null>(null);
    const [confirmDelete, setConfirmDelete] = useState<number | null>(null);
    const [expandedMobileCard, setExpandedMobileCard] = useState<number | null>(null);
    
    // Estado para toast simple
    const [toast, setToast] = useState<{
        message: string;
        type: 'success' | 'error' | 'info' | 'warning';
    } | null>(null);
    
    // Función para mostrar toast
    const showToast = (message: string, type: 'success' | 'error' | 'info' | 'warning' = 'info') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };
    
    const { data, setData, post, put, delete: destroy, processing, errors, reset } = useForm<EstadoLeadForm>({
        nombre: '',
        tipo: 'nuevo',
        orden_en_proceso: 0,
        descripcion: '',
        color_hex: '#3B82F6',
    });
    
    // Configurar datos para edición
    useEffect(() => {
        if (editingEstado) {
            setData({
                nombre: editingEstado.nombre,
                tipo: editingEstado.tipo,
                orden_en_proceso: editingEstado.orden_en_proceso,
                descripcion: editingEstado.descripcion || '',
                color_hex: editingEstado.color_hex,
            });
        }
    }, [editingEstado, setData]);
    
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        if (editingEstado) {
            put(`/config/parametros/estados-lead/${editingEstado.id}`, {
                onSuccess: () => {
                    setShowModal(false);
                    setEditingEstado(null);
                    reset();
                    showToast('Estado actualizado exitosamente', 'success');
                },
                onError: () => {
                    showToast('Error al actualizar el estado', 'error');
                },
                preserveScroll: true,
            });
        } else {
            post('/config/parametros/estados-lead', {
                onSuccess: () => {
                    setShowModal(false);
                    reset();
                    showToast('Estado creado exitosamente', 'success');
                },
                onError: () => {
                    showToast('Error al crear el estado', 'error');
                },
                preserveScroll: true,
            });
        }
    };
    
    const handleDelete = (id: number) => {
        destroy(`/config/parametros/estados-lead/${id}`, {
            onSuccess: () => {
                setConfirmDelete(null);
                showToast('Estado eliminado exitosamente', 'success');
            },
            onError: () => {
                showToast('Error al eliminar el estado', 'error');
            },
            preserveScroll: true,
        });
    };
    
    const handleToggleActivo = (id: number) => {
        router.post(`/config/parametros/estados-lead/${id}/toggle-activo`, {}, {
            onSuccess: () => {
                showToast('Estado actualizado', 'success');
            },
            onError: () => {
                showToast('Error al actualizar el estado', 'error');
            },
            preserveScroll: true,
        });
    };

    const toggleMobileCard = (id: number) => {
        setExpandedMobileCard(expandedMobileCard === id ? null : id);
    };
    
    const tipoLabels = {
        nuevo: 'Nuevo',
        activo: 'Activo',
        final_positivo: 'Final Positivo',
        final_negativo: 'Final Negativo',
    };
    
    const tipoColors = {
        nuevo: 'bg-blue-100 text-blue-800 border-blue-200',
        activo: 'bg-yellow-100 text-yellow-800 border-yellow-200',
        final_positivo: 'bg-green-100 text-green-800 border-green-200',
        final_negativo: 'bg-red-100 text-red-800 border-red-200',
    };

    return (
        <AppLayout title="Estados de Lead">
            {/* Toast simple - Responsive */}
            {toast && (
                <div className={`fixed top-4 right-4 left-4 sm:left-auto z-50 px-4 py-3 rounded-lg shadow-lg animate-in slide-in-from-right duration-300 ${
                    toast.type === 'success' ? 'bg-green-50 border border-green-200 text-green-800' :
                    toast.type === 'error' ? 'bg-red-50 border border-red-200 text-red-800' :
                    toast.type === 'warning' ? 'bg-yellow-50 border border-yellow-200 text-yellow-800' :
                    'bg-blue-50 border border-blue-200 text-blue-800'
                }`}>
                    <div className="flex items-center gap-2">
                        {toast.type === 'success' && (
                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                        )}
                        {toast.type === 'error' && (
                            <svg className="w-5 h-5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                        )}
                        <span className="text-sm sm:text-base">{toast.message}</span>
                    </div>
                </div>
            )}

            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
                {/* Header */}
                <div className="mb-4 sm:mb-6">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
                                Estados de Lead
                            </h1>
                            <p className="mt-1 text-sm sm:text-base text-gray-600">
                                Gestión de estados para leads comerciales
                            </p>
                        </div>

                        {/* Botón para agregar nuevo */}
                        <button 
                            onClick={() => {
                                setEditingEstado(null);
                                setShowModal(true);
                            }}
                            className="w-full sm:w-auto px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                        >
                            <Plus className="h-4 w-4" />
                            Nuevo Estado
                        </button>
                    </div>
                </div>

                {/* CONTENIDO PRINCIPAL */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    {estados.length === 0 ? (
                        <div className="text-center py-8 sm:py-12 px-4">
                            <svg className="w-12 h-12 mx-auto text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <p className="mt-2 text-sm sm:text-base text-gray-500">No hay estados de lead registrados</p>
                            <button 
                                onClick={() => setShowModal(true)}
                                className="mt-4 px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700"
                            >
                                Crear primer estado
                            </button>
                        </div>
                    ) : (
                        <>
                            {/* Desktop Table - Visible en md y superior */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="py-3 px-4 text-left font-medium text-gray-700">ID</th>
                                            <th className="py-3 px-4 text-left font-medium text-gray-700">Nombre</th>
                                            <th className="py-3 px-4 text-left font-medium text-gray-700">Tipo</th>
                                            <th className="py-3 px-4 text-left font-medium text-gray-700">Orden</th>
                                            <th className="py-3 px-4 text-left font-medium text-gray-700">Color</th>
                                            <th className="py-3 px-4 text-left font-medium text-gray-700">Estado</th>
                                            <th className="py-3 px-4 text-left font-medium text-gray-700">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {estados.map((estado) => (
                                            <tr key={estado.id} className="hover:bg-gray-50">
                                                <td className="py-3 px-4 text-xs lg:text-sm">{estado.id}</td>
                                                <td className="py-3 px-4 font-medium text-xs lg:text-sm">{estado.nombre}</td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 text-xs rounded-full border ${tipoColors[estado.tipo]}`}>
                                                        {tipoLabels[estado.tipo]}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-xs lg:text-sm">{estado.orden_en_proceso}</td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center">
                                                        <div 
                                                            className="h-4 w-4 rounded-full mr-2 border border-gray-300"
                                                            style={{ backgroundColor: estado.color_hex }}
                                                        ></div>
                                                        <span className="font-mono text-xs hidden lg:inline">{estado.color_hex}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <button
                                                        onClick={() => handleToggleActivo(estado.id)}
                                                        className={`px-2 py-1 text-xs rounded-full transition-colors flex items-center gap-1 ${
                                                            estado.activo 
                                                                ? 'bg-green-100 text-green-800 hover:bg-green-200 border border-green-200' 
                                                                : 'bg-gray-100 text-gray-800 hover:bg-gray-200 border border-gray-200'
                                                        }`}
                                                    >
                                                        {estado.activo ? <Eye className="h-3 w-3" /> : <EyeOff className="h-3 w-3" />}
                                                        <span className="hidden lg:inline">{estado.activo ? 'Activo' : 'Inactivo'}</span>
                                                    </button>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex gap-2">
                                                        <button 
                                                            onClick={() => {
                                                                setEditingEstado(estado);
                                                                setShowModal(true);
                                                            }}
                                                            className="text-blue-600 hover:text-blue-800 p-1 rounded hover:bg-blue-50 transition-colors"
                                                            title="Editar"
                                                        >
                                                            <Edit2 className="h-4 w-4" />
                                                        </button>
                                                        <button 
                                                            onClick={() => setConfirmDelete(estado.id)}
                                                            className="text-red-600 hover:text-red-800 p-1 rounded hover:bg-red-50 transition-colors"
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

                            {/* Vista Mobile - Tarjetas (visible en móvil) */}
                            <div className="md:hidden divide-y divide-gray-200">
                                {estados.map((estado) => (
                                    <div key={estado.id} className="p-4 hover:bg-gray-50">
                                        {/* Cabecera de la tarjeta - siempre visible */}
                                        <div className="flex items-start justify-between mb-2">
                                            <div>
                                                <div className="flex items-center gap-2 mb-1">
                                                    <span className="text-sm font-medium text-gray-900">
                                                        #{estado.id} - {estado.nombre}
                                                    </span>
                                                    <span className={`px-2 py-0.5 text-xs rounded-full border ${tipoColors[estado.tipo]}`}>
                                                        {tipoLabels[estado.tipo]}
                                                    </span>
                                                </div>
                                                {estado.descripcion && (
                                                    <p className="text-xs text-gray-500 line-clamp-1">{estado.descripcion}</p>
                                                )}
                                            </div>
                                            <button
                                                onClick={() => toggleMobileCard(estado.id)}
                                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                                            >
                                                {expandedMobileCard === estado.id ? (
                                                    <ChevronUp className="h-5 w-5 text-gray-500" />
                                                ) : (
                                                    <ChevronDown className="h-5 w-5 text-gray-500" />
                                                )}
                                            </button>
                                        </div>

                                        {/* Información resumida siempre visible */}
                                        <div className="flex items-center gap-3 text-xs text-gray-600 ml-1">
                                            <div className="flex items-center gap-1">
                                                <div 
                                                    className="h-4 w-4 rounded-full border border-gray-300"
                                                    style={{ backgroundColor: estado.color_hex }}
                                                ></div>
                                                <span className="font-mono text-xs hidden">{estado.color_hex}</span>
                                            </div>
                                            <span>Orden: {estado.orden_en_proceso}</span>
                                            <button
                                                onClick={() => handleToggleActivo(estado.id)}
                                                className={`px-2 py-0.5 text-xs rounded-full transition-colors flex items-center gap-1 ${
                                                    estado.activo 
                                                        ? 'bg-green-100 text-green-800 border border-green-200' 
                                                        : 'bg-gray-100 text-gray-800 border border-gray-200'
                                                }`}
                                            >
                                                {estado.activo ? 'Activo' : 'Inactivo'}
                                            </button>
                                        </div>

                                        {/* Detalles expandibles */}
                                        {expandedMobileCard === estado.id && (
                                            <div className="mt-4 pt-4 border-t border-gray-100">
                                                {estado.descripcion && (
                                                    <div className="mb-4">
                                                        <p className="text-xs font-medium text-gray-500 mb-1">Descripción</p>
                                                        <p className="text-sm text-gray-900">{estado.descripcion}</p>
                                                    </div>
                                                )}
                                                
                                                <div className="mb-4">
                                                    <p className="text-xs font-medium text-gray-500 mb-1">Color</p>
                                                    <div className="flex items-center gap-2">
                                                        <div 
                                                            className="h-6 w-6 rounded-full border border-gray-300"
                                                            style={{ backgroundColor: estado.color_hex }}
                                                        ></div>
                                                        <span className="font-mono text-sm">{estado.color_hex}</span>
                                                    </div>
                                                </div>

                                                {/* Acciones móvil */}
                                                <div className="grid grid-cols-2 gap-2 mt-4">
                                                    <button
                                                        onClick={() => {
                                                            setEditingEstado(estado);
                                                            setShowModal(true);
                                                        }}
                                                        className="px-3 py-2 bg-blue-50 text-blue-700 text-sm rounded-lg hover:bg-blue-100 transition-colors flex items-center justify-center gap-2"
                                                    >
                                                        <Edit2 className="h-4 w-4" />
                                                        Editar
                                                    </button>
                                                    <button
                                                        onClick={() => setConfirmDelete(estado.id)}
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
                            
                            {/* Total */}
                            <div className="px-4 sm:px-6 py-4 border-t border-gray-200 text-xs sm:text-sm text-gray-500">
                                Total: {estados.length} estados
                            </div>
                        </>
                    )}
                </div>
            </div>

            {/* MODAL para crear/editar - Responsive */}
            {showModal && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    {/* Overlay */}
                    <div 
                        className="fixed inset-0 bg-black/30"
                        onClick={() => {
                            setShowModal(false);
                            setEditingEstado(null);
                            reset();
                        }}
                    />
                    
                    {/* Modal centrado */}
                    <div className="min-h-screen px-4 flex items-center justify-center">
                        <div className="relative bg-white rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                            <div className="p-4 sm:p-6">
                                <div className="flex items-center justify-between mb-4">
                                    <h2 className="text-lg sm:text-xl font-semibold text-gray-900">
                                        {editingEstado ? 'Editar Estado' : 'Nuevo Estado'}
                                    </h2>
                                    <button
                                        onClick={() => {
                                            setShowModal(false);
                                            setEditingEstado(null);
                                            reset();
                                        }}
                                        className="p-1 hover:bg-gray-100 rounded-full transition-colors"
                                    >
                                        <X className="h-5 w-5 text-gray-500" />
                                    </button>
                                </div>
                                
                                <form onSubmit={handleSubmit}>
                                    <div className="space-y-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Nombre *
                                            </label>
                                            <input
                                                type="text"
                                                value={data.nombre}
                                                onChange={(e) => setData('nombre', e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                required
                                            />
                                            {errors.nombre && (
                                                <p className="mt-1 text-xs text-red-600">{errors.nombre}</p>
                                            )}
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tipo *
                                            </label>
                                            <select
                                                value={data.tipo}
                                                onChange={(e) => setData('tipo', e.target.value as EstadoLeadForm['tipo'])}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                required
                                            >
                                                <option value="nuevo">Nuevo</option>
                                                <option value="activo">Activo</option>
                                                <option value="final_positivo">Final Positivo</option>
                                                <option value="final_negativo">Final Negativo</option>
                                            </select>
                                            {errors.tipo && (
                                                <p className="mt-1 text-xs text-red-600">{errors.tipo}</p>
                                            )}
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Orden en Proceso *
                                            </label>
                                            <input
                                                type="number"
                                                value={data.orden_en_proceso}
                                                onChange={(e) => setData('orden_en_proceso', parseInt(e.target.value) || 0)}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                min="0"
                                                required
                                            />
                                            {errors.orden_en_proceso && (
                                                <p className="mt-1 text-xs text-red-600">{errors.orden_en_proceso}</p>
                                            )}
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Descripción
                                            </label>
                                            <textarea
                                                value={data.descripcion}
                                                onChange={(e) => setData('descripcion', e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                                rows={2}
                                            />
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Color *
                                            </label>
                                            <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
                                                <input
                                                    type="color"
                                                    value={data.color_hex}
                                                    onChange={(e) => setData('color_hex', e.target.value)}
                                                    className="h-10 w-full sm:w-16 cursor-pointer"
                                                />
                                                <input
                                                    type="text"
                                                    value={data.color_hex}
                                                    onChange={(e) => setData('color_hex', e.target.value)}
                                                    className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                                                    placeholder="#3B82F6"
                                                    required
                                                />
                                            </div>
                                        </div>
                                    </div>
                                    
                                    <div className="mt-6 flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setShowModal(false);
                                                setEditingEstado(null);
                                                reset();
                                            }}
                                            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                                        >
                                            Cancelar
                                        </button>
                                        <button
                                            type="submit"
                                            disabled={processing}
                                            className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700 transition-colors disabled:opacity-50"
                                        >
                                            {processing ? 'Guardando...' : (editingEstado ? 'Actualizar' : 'Crear')}
                                        </button>
                                    </div>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            )}
            
            {/* Modal de confirmación de eliminación - Responsive */}
            {confirmDelete && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div 
                        className="fixed inset-0 bg-black/30"
                        onClick={() => setConfirmDelete(null)}
                    />
                    
                    <div className="min-h-screen px-4 flex items-center justify-center">
                        <div className="relative bg-white rounded-lg shadow-xl max-w-sm w-full">
                            <div className="p-4 sm:p-6">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-red-100 rounded-full flex-shrink-0">
                                        <AlertCircle className="h-5 w-5 sm:h-6 sm:w-6 text-red-600" />
                                    </div>
                                    <h2 className="text-base sm:text-lg font-semibold text-gray-900">
                                        Confirmar Eliminación
                                    </h2>
                                </div>
                                <p className="text-sm sm:text-base text-gray-600 mb-6">
                                    ¿Estás seguro de que deseas eliminar este estado? Esta acción no se puede deshacer.
                                </p>
                                <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 sm:gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setConfirmDelete(null)}
                                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded hover:bg-gray-200 transition-colors"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => handleDelete(confirmDelete)}
                                        className="w-full sm:w-auto px-4 py-2 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 transition-colors"
                                    >
                                        Eliminar
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}