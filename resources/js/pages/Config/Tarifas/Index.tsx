// resources/js/Pages/Config/Tarifas/Index.tsx
import { router } from '@inertiajs/react';
import { 
    Search, Plus, Edit2, Trash2, Save, X, 
    Filter, Upload, Tag, Package, FileCheck, 
    Truck, DollarSign, AlertCircle, XCircle,
    ChevronDown, ChevronUp
} from 'lucide-react';
import React, { useState } from 'react';

import CargarPreciosModal from '@/components/Modals/CargarPreciosModal';
import CrearProductoModal from '@/components/Modals/CrearProductoModal';
import Pagination from '@/components/ui/Pagination';
import AppLayout from '@/layouts/app-layout';

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
    tipo?: {
        id: number;
        nombre_tipo_abono: string;
    };
}

interface Tipo {
    id: number;
    nombre_tipo_abono: string;
    descripcion: string;
    es_activo: boolean;
}

interface Props {
    productos_servicios: ProductoServicio[];
    tipos: Tipo[];
    companias: {
        id: number;
        nombre: string;
    }[];
    permisos: {
        puede_ver_todas: boolean;
        companias_permitidas: number[];
        compania_actual?: {
            id: number;
            nombre: string;
        };
    };
}

export default function TarifasIndex({ productos_servicios, tipos, companias, permisos }: Props) {
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedTipo, setSelectedTipo] = useState<string>('todos');
    const [selectedCompania, setSelectedCompania] = useState<string>(
        permisos.puede_ver_todas ? 'todos' : permisos.compania_actual?.id.toString() || 'todos'
    );
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editForm, setEditForm] = useState<Partial<ProductoServicio>>({});
    const [mobileExpanded, setMobileExpanded] = useState<Record<number, boolean>>({});
    const [isCargarModalOpen, setIsCargarModalOpen] = useState(false);
    const [isCrearModalOpen, setIsCrearModalOpen] = useState(false);

    // Paginación
    const [currentPage, setCurrentPage] = useState(1);
    const [perPage] = useState(10);

    // Filtrar productos
    const productosFiltrados = productos_servicios.filter(p => {
        if (selectedCompania !== 'todos' && p.compania_id !== parseInt(selectedCompania)) return false;
        if (selectedTipo !== 'todos' && p.tipo_id !== parseInt(selectedTipo)) return false;
        
        if (searchTerm) {
            const term = searchTerm.toLowerCase();
            return p.nombre.toLowerCase().includes(term) || 
                   p.codigopro.toLowerCase().includes(term) ||
                   (p.descripcion && p.descripcion.toLowerCase().includes(term));
        }
        
        return true;
    });

    // Aplanar productos para paginación
    const todosProductos = productosFiltrados.map(p => ({
        ...p,
        tipoNombre: tipos.find(t => t.id === p.tipo_id)?.nombre_tipo_abono || 'Sin tipo'
    }));
    
    // Paginación
    const totalProductos = todosProductos.length;
    const lastPage = Math.ceil(totalProductos / perPage);
    const startIndex = (currentPage - 1) * perPage;
    const endIndex = startIndex + perPage;
    const productosPaginados = todosProductos.slice(startIndex, endIndex);

    const toggleMobileExpand = (id: number) => {
        setMobileExpanded(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const startEditing = (producto: ProductoServicio) => {
        setEditingId(producto.id);
        setEditForm({
            nombre: producto.nombre,
            descripcion: producto.descripcion,
            precio: producto.precio,
            es_activo: producto.es_activo
        });
    };

    const cancelEditing = () => {
        setEditingId(null);
        setEditForm({});
    };

    const saveEdit = (producto: ProductoServicio) => {
        router.put(`/config/tarifas/${producto.id}`, editForm, {
            onSuccess: () => {
                setEditingId(null);
                setEditForm({});
            },
            preserveScroll: true
        });
    };

    const toggleActivo = (producto: ProductoServicio) => {
        router.put(`/config/tarifas/${producto.id}/toggle-activo`, {}, {
            preserveScroll: true
        });
    };

    const limpiarFiltros = () => {
        setSearchTerm('');
        setSelectedTipo('todos');
        if (permisos.puede_ver_todas) {
            setSelectedCompania('todos');
        }
        setCurrentPage(1);
    };

    const hayFiltrosActivos = () => {
        return searchTerm !== '' || 
               selectedTipo !== 'todos' || 
               (permisos.puede_ver_todas && selectedCompania !== 'todos');
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const getTipoIcon = (tipoId: number) => {
        const iconMap: Record<number, React.ReactNode> = {
            1: <Tag className="h-4 w-4" />,
            2: <FileCheck className="h-4 w-4" />,
            3: <Package className="h-4 w-4" />,
            4: <DollarSign className="h-4 w-4" />,
            5: <Truck className="h-4 w-4" />,
        };
        return iconMap[tipoId] || <Tag className="h-4 w-4" />;
    };

    return (
        <AppLayout title="Gestión de Tarifas">
            <div className="p-4 sm:p-6">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">Gestión de Tarifas</h1>
                    <p className="text-gray-600 mt-1 text-sm sm:text-base">
                        Administre todos los productos, servicios y tarifas
                    </p>
                </div>

                {/* Filtros - Totalmente responsive */}
                <div className="mb-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="space-y-3">
                        {/* Primera fila de filtros */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Buscar producto..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sat/20 focus:border-sat"
                                />
                            </div>

                            <select
                                value={selectedTipo}
                                onChange={(e) => setSelectedTipo(e.target.value)}
                                className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sat/20 focus:border-sat bg-white"
                            >
                                <option value="todos">Todos los tipos</option>
                                {tipos.map(tipo => (
                                    <option key={tipo.id} value={tipo.id}>{tipo.nombre_tipo_abono}</option>
                                ))}
                            </select>

                            {permisos.puede_ver_todas && (
                                <select
                                    value={selectedCompania}
                                    onChange={(e) => setSelectedCompania(e.target.value)}
                                    className="w-full px-3 py-2.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-sat/20 focus:border-sat bg-white"
                                >
                                    <option value="todos">Todas las compañías</option>
                                    {companias.map(compania => (
                                        <option key={compania.id} value={compania.id}>{compania.nombre}</option>
                                    ))}
                                </select>
                            )}

                            {/* Botones de acción - Móvil: 2 columnas, Desktop: flex */}
                            <div className="grid grid-cols-2 gap-2 sm:flex sm:gap-2">
                                <button
                                    onClick={() => setIsCrearModalOpen(true)}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 bg-sat text-white rounded-lg text-sm font-medium hover:bg-sat-600 transition-colors"
                                >
                                    <Plus className="h-4 w-4" />
                                    <span className="hidden sm:inline">Nuevo</span>
                                </button>
                                
                                <button
                                    onClick={() => setIsCargarModalOpen(true)}
                                    className="flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 transition-colors"
                                >
                                    <Upload className="h-4 w-4" />
                                    <span className="hidden sm:inline">Cargar</span>
                                </button>

                                {hayFiltrosActivos() && (
                                    <button
                                        onClick={limpiarFiltros}
                                        className="col-span-2 sm:col-span-1 flex items-center justify-center gap-2 px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50 text-red-600 transition-colors"
                                    >
                                        <XCircle className="h-4 w-4" />
                                        <span>Limpiar</span>
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Resumen de filtros */}
                        {hayFiltrosActivos() && (
                            <div className="flex flex-wrap items-center gap-2 pt-2 text-xs sm:text-sm text-gray-600 border-t border-gray-100">
                                <Filter className="h-4 w-4" />
                                <span>{totalProductos} productos</span>
                                {selectedCompania !== 'todos' && (
                                    <span className="px-2 py-1 bg-gray-100 rounded-full">
                                        {companias.find(c => c.id === parseInt(selectedCompania))?.nombre}
                                    </span>
                                )}
                                {selectedTipo !== 'todos' && (
                                    <span className="px-2 py-1 bg-gray-100 rounded-full">
                                        {tipos.find(t => t.id === parseInt(selectedTipo))?.nombre_tipo_abono}
                                    </span>
                                )}
                                {searchTerm && (
                                    <span className="px-2 py-1 bg-gray-100 rounded-full">
                                        "{searchTerm}"
                                    </span>
                                )}
                            </div>
                        )}
                    </div>
                </div>

                {/* Vista Desktop: Tabla */}
                <div className="hidden md:block bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Tipo</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Código</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Nombre</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Descripción</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precio</th>
                                    <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase">Estado</th>
                                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {productosPaginados.map((producto) => (
                                    <tr key={producto.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sat">{getTipoIcon(producto.tipo_id)}</span>
                                                <span className="text-sm text-gray-600">{producto.tipoNombre}</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                            {producto.codigopro}
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingId === producto.id ? (
                                                <input
                                                    type="text"
                                                    value={editForm.nombre || ''}
                                                    onChange={(e) => setEditForm({...editForm, nombre: e.target.value})}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                />
                                            ) : (
                                                <span className="text-sm text-gray-900">{producto.nombre}</span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4">
                                            {editingId === producto.id ? (
                                                <input
                                                    type="text"
                                                    value={editForm.descripcion || ''}
                                                    onChange={(e) => setEditForm({...editForm, descripcion: e.target.value})}
                                                    className="w-full px-2 py-1 border border-gray-300 rounded text-sm"
                                                />
                                            ) : (
                                                <span className="text-sm text-gray-500 line-clamp-2">
                                                    {producto.descripcion || '-'}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap">
                                            {editingId === producto.id ? (
                                                <input
                                                    type="number"
                                                    step="0.01"
                                                    value={editForm.precio || 0}
                                                    onChange={(e) => setEditForm({...editForm, precio: parseFloat(e.target.value)})}
                                                    className="w-32 px-2 py-1 border border-gray-300 rounded text-sm"
                                                />
                                            ) : (
                                                <span className="text-sm font-medium text-gray-900">
                                                    {formatCurrency(producto.precio)}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-center">
                                            <button
                                                onClick={() => toggleActivo(producto)}
                                                className={`px-3 py-1 rounded-full text-xs font-medium ${
                                                    producto.es_activo
                                                        ? 'bg-green-100 text-green-800 hover:bg-green-200'
                                                        : 'bg-red-100 text-red-800 hover:bg-red-200'
                                                }`}
                                            >
                                                {producto.es_activo ? 'Activo' : 'Inactivo'}
                                            </button>
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-right">
                                            {editingId === producto.id ? (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => saveEdit(producto)} className="text-green-600 hover:text-green-900">
                                                        <Save className="h-4 w-4" />
                                                    </button>
                                                    <button onClick={cancelEditing} className="text-red-600 hover:text-red-900">
                                                        <X className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex justify-end gap-2">
                                                    <button onClick={() => startEditing(producto)} className="text-blue-600 hover:text-blue-900">
                                                        <Edit2 className="h-4 w-4" />
                                                    </button>
                                                    <button
                                                        onClick={() => {
                                                            if (confirm('¿Eliminar este producto?')) {
                                                                router.delete(`/config/tarifas/${producto.id}`, { preserveScroll: true });
                                                            }
                                                        }}
                                                        className="text-red-600 hover:text-red-900"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Vista Móvil: Cards */}
                <div className="md:hidden space-y-3">
                    {productosPaginados.map((producto) => (
                        <div key={producto.id} className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
                            {/* Cabecera de la card - Siempre visible */}
                            <div 
                                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50"
                                onClick={() => toggleMobileExpand(producto.id)}
                            >
                                <div className="flex items-center gap-3">
                                    <span className="text-sat">{getTipoIcon(producto.tipo_id)}</span>
                                    <div>
                                        <div className="font-medium text-gray-900">{producto.nombre}</div>
                                        <div className="text-xs text-gray-500">{producto.codigopro}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                                        producto.es_activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                    }`}>
                                        {producto.es_activo ? 'Activo' : 'Inactivo'}
                                    </span>
                                    {mobileExpanded[producto.id] ? (
                                        <ChevronUp className="h-5 w-5 text-gray-400" />
                                    ) : (
                                        <ChevronDown className="h-5 w-5 text-gray-400" />
                                    )}
                                </div>
                            </div>

                            {/* Contenido expandible */}
                            {mobileExpanded[producto.id] && (
                                <div className="p-4 border-t border-gray-100 bg-gray-50 space-y-3">
                                    {/* Tipo */}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Tipo:</span>
                                        <span className="font-medium text-gray-900">{producto.tipoNombre}</span>
                                    </div>

                                    {/* Descripción */}
                                    <div className="text-sm">
                                        <span className="text-gray-600 block mb-1">Descripción:</span>
                                        <p className="text-gray-900 bg-white p-2 rounded border border-gray-200">
                                            {producto.descripcion || '-'}
                                        </p>
                                    </div>

                                    {/* Precio */}
                                    <div className="flex justify-between text-sm">
                                        <span className="text-gray-600">Precio:</span>
                                        <span className="font-bold text-local">{formatCurrency(producto.precio)}</span>
                                    </div>

                                    {/* Acciones */}
                                    <div className="flex justify-end gap-3 pt-2 border-t border-gray-200">
                                        {editingId === producto.id ? (
                                            <>
                                                <button
                                                    onClick={() => saveEdit(producto)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-md text-sm"
                                                >
                                                    <Save className="h-4 w-4" />
                                                    Guardar
                                                </button>
                                                <button
                                                    onClick={cancelEditing}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-gray-500 text-white rounded-md text-sm"
                                                >
                                                    <X className="h-4 w-4" />
                                                    Cancelar
                                                </button>
                                            </>
                                        ) : (
                                            <>
                                                <button
                                                    onClick={() => startEditing(producto)}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-md text-sm"
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                    Editar
                                                </button>
                                                <button
                                                    onClick={() => {
                                                        if (confirm('¿Eliminar este producto?')) {
                                                            router.delete(`/config/tarifas/${producto.id}`, { preserveScroll: true });
                                                        }
                                                    }}
                                                    className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-md text-sm"
                                                >
                                                    <Trash2 className="h-4 w-4" />
                                                    Eliminar
                                                </button>
                                            </>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>

                {/* Paginación */}
                {totalProductos > 0 && (
                    <div className="mt-6">
                        <Pagination
                            currentPage={currentPage}
                            lastPage={lastPage}
                            total={totalProductos}
                            perPage={perPage}
                            onPageChange={setCurrentPage}
                        />
                    </div>
                )}

                {/* Empty state */}
                {totalProductos === 0 && (
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-8 text-center">
                        <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay resultados</h3>
                        <p className="text-gray-500 text-sm mb-4">
                            No se encontraron productos con los filtros seleccionados.
                        </p>
                        {hayFiltrosActivos() && (
                            <button
                                onClick={limpiarFiltros}
                                className="px-4 py-2 bg-sat text-white rounded-md text-sm font-medium hover:bg-sat-600"
                            >
                                Limpiar filtros
                            </button>
                        )}
                    </div>
                )}
            </div>
            <CargarPreciosModal
                isOpen={isCargarModalOpen}
                onClose={() => setIsCargarModalOpen(false)}
                onSuccess={() => {
                    // Recargar la página para mostrar los nuevos precios
                    window.location.reload();
                }}
            />
            <CrearProductoModal
                isOpen={isCrearModalOpen}
                onClose={() => setIsCrearModalOpen(false)}
                onSuccess={() => {
                    // Recargar la página o actualizar la lista
                    window.location.reload();
                }}
                tipos={tipos}
                companias={companias}
                companiaActual={permisos.compania_actual}
                puedeVerTodas={permisos.puede_ver_todas}
            />
        </AppLayout>
    );
}