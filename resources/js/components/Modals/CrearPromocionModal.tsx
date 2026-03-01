// resources/js/Components/Modals/CrearPromocionModal.tsx
import { X, Save, Gift, Calendar, Percent, Plus, Trash2, AlertCircle, Filter } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { es } from 'date-fns/locale';
import axios from 'axios';

import { ProductosAgrupados, Promocion, PromocionFormData } from '@/types/promociones';

interface CrearPromocionModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    promocion?: Promocion | null;
    productos: ProductosAgrupados;
}

interface FormErrors {
    [key: string]: string;
}

type TipoKey = keyof Pick<ProductosAgrupados, 'tasas' | 'abonos' | 'convenios' | 'accesorios' | 'servicios'>;

interface ProductoFormItem {
    producto_servicio_id: number | '';
    tipo_promocion: 'porcentaje' | '2x1' | '3x2';
    bonificacion: number;
    cantidad_minima: number | null;
    nombre_producto?: string;
    codigo_producto?: string;
    tipo_id?: number;
    compania_nombre?: string;
}

export default function CrearPromocionModal({ 
    isOpen, 
    onClose, 
    onSuccess,
    promocion,
    productos 
}: CrearPromocionModalProps) {
    const isEditing = !!promocion;

    const [formData, setFormData] = useState({
        nombre: '',
        descripcion: '',
        fecha_inicio: '',
        fecha_fin: '',
        activo: true,
        productos: [] as ProductoFormItem[]
    });

    const [errors, setErrors] = useState<FormErrors>({});
    const [cargando, setCargando] = useState(false);
    const [errorGeneral, setErrorGeneral] = useState<string | null>(null);
    const [tiposSeleccionados, setTiposSeleccionados] = useState<{[key: number]: TipoKey | ''}>({});

    const opcionesTipo: { value: TipoKey; label: string }[] = [
        { value: 'tasas', label: 'Tasas' },
        { value: 'abonos', label: 'Abonos' },
        { value: 'convenios', label: 'Convenios' },
        { value: 'accesorios', label: 'Accesorios' },
        { value: 'servicios', label: 'Servicios' }
    ];

    const parseDate = (dateString: string): Date | null => {
        if (!dateString) return null;
        return new Date(dateString);
    };

    const formatDateForState = (date: Date | null): string => {
        if (!date) return '';
        return date.toISOString().split('T')[0];
    };

    const handleFechaInicioChange = (date: Date | null) => {
        setFormData({ ...formData, fecha_inicio: formatDateForState(date) });
        if (errors.fecha_inicio) setErrors({ ...errors, fecha_inicio: '' });
    };

    const handleFechaFinChange = (date: Date | null) => {
        setFormData({ ...formData, fecha_fin: formatDateForState(date) });
        if (errors.fecha_fin) setErrors({ ...errors, fecha_fin: '' });
    };

    useEffect(() => {
        if (isOpen && promocion) {
            const productosTransformados = promocion.productos?.map(p => ({
                producto_servicio_id: p.productoServicio.id,
                tipo_promocion: p.tipo_promocion || 'porcentaje',
                bonificacion: p.bonificacion,
                cantidad_minima: p.cantidad_minima || null,
                nombre_producto: p.productoServicio.nombre,
                codigo_producto: p.productoServicio.codigopro,
                tipo_id: p.productoServicio.tipo_id
            })) || [];

            setFormData({
                nombre: promocion.nombre || '',
                descripcion: promocion.descripcion || '',
                fecha_inicio: promocion.fecha_inicio || '',
                fecha_fin: promocion.fecha_fin || '',
                activo: promocion.activo ?? true,
                productos: productosTransformados
            });

            const nuevosTipos: {[key: number]: TipoKey | ''} = {};
            productosTransformados.forEach((prod, index) => {
                if (prod.tipo_id) {
                    const tipoMap: {[key: number]: TipoKey} = {
                        1: 'abonos',
                        2: 'convenios',
                        3: 'servicios',
                        4: 'tasas',
                        5: 'accesorios'
                    };
                    nuevosTipos[index] = tipoMap[prod.tipo_id] || '';
                }
            });
            setTiposSeleccionados(nuevosTipos);

        } else if (isOpen && !promocion) {
            setFormData({
                nombre: '',
                descripcion: '',
                fecha_inicio: '',
                fecha_fin: '',
                activo: true,
                productos: []
            });
            setTiposSeleccionados({});
            setErrors({});
            setErrorGeneral(null);
        }
    }, [isOpen, promocion]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData({ ...formData, [name]: checked });
        } else {
            setFormData({ ...formData, [name]: value });
        }
        
        if (errors[name]) setErrors({ ...errors, [name]: '' });
    };

    const agregarProducto = () => {
        const newIndex = formData.productos.length;
        setFormData({
            ...formData,
            productos: [
                ...formData.productos,
                {
                    producto_servicio_id: '',
                    tipo_promocion: 'porcentaje',
                    bonificacion: 0,
                    cantidad_minima: null
                }
            ]
        });
        setTiposSeleccionados({
            ...tiposSeleccionados,
            [newIndex]: ''
        });
    };

    const handleTipoChange = (index: number, tipo: TipoKey) => {
        setTiposSeleccionados({
            ...tiposSeleccionados,
            [index]: tipo
        });
        
        const nuevosProductos = [...formData.productos];
        nuevosProductos[index] = {
            ...nuevosProductos[index],
            producto_servicio_id: '',
            nombre_producto: undefined,
            codigo_producto: undefined,
            tipo_id: undefined,
            compania_nombre: undefined
        };
        setFormData({ ...formData, productos: nuevosProductos });
    };

    const handleProductoChange = (index: number, productoId: number) => {
        const todosLosProductos = [
            ...(productos.tasas || []),
            ...(productos.abonos || []),
            ...(productos.convenios || []),
            ...(productos.accesorios || []),
            ...(productos.servicios || [])
        ];
        
        const producto = todosLosProductos.find(p => p.id === productoId);
        
        if (producto) {
            const nuevosProductos = [...formData.productos];
            nuevosProductos[index] = {
                ...nuevosProductos[index],
                producto_servicio_id: productoId,
                nombre_producto: producto.nombre,
                codigo_producto: producto.codigopro,
                tipo_id: producto.tipo_id,
                compania_nombre: producto.compania_nombre
            };
            setFormData({ ...formData, productos: nuevosProductos });
        }
    };

    const handleTipoPromocionChange = (index: number, tipoPromocion: 'porcentaje' | '2x1' | '3x2') => {
        const nuevosProductos = [...formData.productos];
        
        if (tipoPromocion === '2x1') {
            nuevosProductos[index] = {
                ...nuevosProductos[index],
                tipo_promocion: '2x1',
                bonificacion: 50,
                cantidad_minima: 2
            };
        } else if (tipoPromocion === '3x2') {
            nuevosProductos[index] = {
                ...nuevosProductos[index],
                tipo_promocion: '3x2',
                bonificacion: 33.33,
                cantidad_minima: 3
            };
        } else {
            nuevosProductos[index] = {
                ...nuevosProductos[index],
                tipo_promocion: 'porcentaje',
                bonificacion: nuevosProductos[index].bonificacion || 0,
                cantidad_minima: nuevosProductos[index].cantidad_minima || null
            };
        }
        
        setFormData({ ...formData, productos: nuevosProductos });
    };

    const handleProductoFieldChange = (index: number, field: string, value: any) => {
        const nuevosProductos = [...formData.productos];
        nuevosProductos[index] = {
            ...nuevosProductos[index],
            [field]: value
        };
        setFormData({ ...formData, productos: nuevosProductos });
    };

    const eliminarProducto = (index: number) => {
        const nuevosProductos = formData.productos.filter((_, i) => i !== index);
        setFormData({ ...formData, productos: nuevosProductos });
        
        const nuevosTipos = { ...tiposSeleccionados };
        delete nuevosTipos[index];
        setTiposSeleccionados(nuevosTipos);
    };

    const validateForm = () => {
        const newErrors: FormErrors = {};
        
        if (!formData.nombre.trim()) newErrors.nombre = 'El nombre es requerido';
        if (!formData.fecha_inicio) newErrors.fecha_inicio = 'La fecha de inicio es requerida';
        if (!formData.fecha_fin) newErrors.fecha_fin = 'La fecha de fin es requerida';
        else if (formData.fecha_inicio && formData.fecha_fin < formData.fecha_inicio) {
            newErrors.fecha_fin = 'La fecha de fin debe ser posterior a la fecha de inicio';
        }
        
        if (formData.productos.length === 0) {
            newErrors.productos = 'Debe agregar al menos un producto';
        } else {
            const productosInvalidos = formData.productos.some(p => !p.producto_servicio_id);
            if (productosInvalidos) newErrors.productos = 'Todos los productos deben estar seleccionados';
            
            formData.productos.forEach((p, idx) => {
                if (p.tipo_promocion === 'porcentaje' && p.bonificacion <= 0) {
                    newErrors[`producto_${idx}_bonificacion`] = 'La bonificación debe ser mayor a 0';
                }
            });
        }
        
        return newErrors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            return;
        }
        
        setCargando(true);
        setErrorGeneral(null);
        
        try {
            const datosEnvio = {
                nombre: formData.nombre,
                descripcion: formData.descripcion,
                fecha_inicio: formData.fecha_inicio,
                fecha_fin: formData.fecha_fin,
                activo: formData.activo,
                productos: formData.productos.map(p => ({
                    producto_servicio_id: p.producto_servicio_id,
                    tipo_promocion: p.tipo_promocion,
                    bonificacion: p.bonificacion,
                    cantidad_minima: p.cantidad_minima
                }))
            };

            if (isEditing && promocion) {
                await axios.put(`/config/promociones/${promocion.id}`, datosEnvio);
            } else {
                await axios.post('/config/promociones', datosEnvio);
            }
            
            if (onSuccess) onSuccess();
            onClose();
            
        } catch (err: any) {
            if (err.response?.data?.errors) setErrors(err.response.data.errors);
            else if (err.response?.data?.error) setErrorGeneral(err.response.data.error);
            else setErrorGeneral(`Error al ${isEditing ? 'actualizar' : 'crear'} la promoción`);
        } finally {
            setCargando(false);
        }
    };

    const getProductosPorTipo = (tipo: TipoKey | '') => {
        if (!tipo || !productos[tipo as TipoKey]) return [];
        return productos[tipo as TipoKey] || [];
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-[99990]" onClick={onClose} />
            
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[99999] pointer-events-none">
                <div 
                    className="bg-white rounded-lg shadow-2xl w-full max-w-4xl flex flex-col pointer-events-auto" 
                    style={{ maxHeight: '90vh' }}
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-sat/10 rounded-lg">
                                <Gift className="h-6 w-6 text-sat" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {isEditing ? 'Editar Promoción' : 'Nueva Promoción'}
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    {isEditing ? 'Modifique los datos de la promoción' : 'Complete los datos para crear una nueva promoción'}
                                </p>
                            </div>
                        </div>
                        <button onClick={onClose} className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto flex-1">
                        {errorGeneral && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700">{errorGeneral}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Nombre */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre de la Promoción <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:ring-sat focus:border-sat ${
                                        errors.nombre ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Ej: Promoción Verano 2024"
                                />
                                {errors.nombre && <p className="mt-1 text-xs text-red-600">{errors.nombre}</p>}
                            </div>

                            {/* Descripción */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Descripción</label>
                                <textarea
                                    name="descripcion"
                                    value={formData.descripcion}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-sat focus:border-sat"
                                    placeholder="Descripción de la promoción (opcional)"
                                />
                            </div>

                            {/* Fechas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Fecha de inicio <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                                        <DatePicker
                                            selected={parseDate(formData.fecha_inicio)}
                                            onChange={handleFechaInicioChange}
                                            dateFormat="dd/MM/yyyy"
                                            locale={es}
                                            placeholderText="DD/MM/AAAA"
                                            className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-sat focus:border-sat ${
                                                errors.fecha_inicio ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            wrapperClassName="w-full"
                                            minDate={new Date()}
                                            required
                                        />
                                    </div>
                                    {errors.fecha_inicio && <p className="mt-1 text-xs text-red-600">{errors.fecha_inicio}</p>}
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Fecha de fin <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                                        <DatePicker
                                            selected={parseDate(formData.fecha_fin)}
                                            onChange={handleFechaFinChange}
                                            dateFormat="dd/MM/yyyy"
                                            locale={es}
                                            placeholderText="DD/MM/AAAA"
                                            className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-sat focus:border-sat ${
                                                errors.fecha_fin ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            wrapperClassName="w-full"
                                            minDate={parseDate(formData.fecha_inicio) || new Date()}
                                            required
                                        />
                                    </div>
                                    {errors.fecha_fin && <p className="mt-1 text-xs text-red-600">{errors.fecha_fin}</p>}
                                </div>
                            </div>

                            {/* Activo */}
                            <div className="flex items-center gap-2">
                                <span className="text-sm font-medium text-gray-700">Estado:</span>
                                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    formData.activo ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                }`}>
                                    {formData.activo ? 'Activa' : 'Inactiva'}
                                </span>
                            </div>

                            {/* Productos */}
                            <div>
                                <div className="flex justify-between items-center mb-3">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Productos incluidos <span className="text-red-500">*</span>
                                    </label>
                                    <button
                                        type="button"
                                        onClick={agregarProducto}
                                        className="inline-flex items-center gap-1 px-3 py-1.5 bg-sat text-white text-sm rounded-md hover:bg-sat-600"
                                    >
                                        <Plus className="h-4 w-4" />
                                        Agregar Producto
                                    </button>
                                </div>

                                {formData.productos.length === 0 ? (
                                    <div className="p-4 bg-gray-50 rounded-md border border-dashed border-gray-300 text-center">
                                        <p className="text-sm text-gray-500">
                                            No hay productos agregados. Haga clic en "Agregar Producto" para comenzar.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="space-y-4">
                                        {formData.productos.map((producto, index) => {
                                            const tipoActual = tiposSeleccionados[index] || '';
                                            const productosDisponibles = getProductosPorTipo(tipoActual as TipoKey);
                                            
                                            return (
                                                <div key={index} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                                                    <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-start">
                                                        {/* Selector de tipo */}
                                                        <div className="md:col-span-2">
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                Tipo
                                                            </label>
                                                            <select
                                                                value={tipoActual}
                                                                onChange={(e) => handleTipoChange(index, e.target.value as TipoKey)}
                                                                className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white focus:ring-sat focus:border-sat"
                                                                required
                                                            >
                                                                <option value="">Seleccionar</option>
                                                                {opcionesTipo.map(op => (
                                                                    <option key={op.value} value={op.value}>
                                                                        {op.label}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        {/* Selector de producto */}
                                                        <div className="md:col-span-3">
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                Producto
                                                            </label>
                                                            <select
                                                                value={producto.producto_servicio_id || ''}
                                                                onChange={(e) => handleProductoChange(index, Number(e.target.value))}
                                                                disabled={!tipoActual}
                                                                className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white focus:ring-sat focus:border-sat disabled:bg-gray-100"
                                                                required
                                                            >
                                                                <option value="">Seleccionar</option>
                                                                {productosDisponibles.map(prod => (
                                                                    <option key={prod.id} value={prod.id}>
                                                                        {prod.compania_nombre} - {prod.nombre}
                                                                    </option>
                                                                ))}
                                                            </select>
                                                        </div>

                                                        {/* Tipo de promoción */}
                                                        <div className="md:col-span-2">
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                Tipo Promo
                                                            </label>
                                                            <select
                                                                value={producto.tipo_promocion}
                                                                onChange={(e) => handleTipoPromocionChange(index, e.target.value as 'porcentaje' | '2x1' | '3x2')}
                                                                className="w-full text-sm border border-gray-300 rounded px-3 py-2 bg-white focus:ring-sat focus:border-sat"
                                                            >
                                                                <option value="porcentaje">% Descuento</option>
                                                                <option value="2x1">2x1</option>
                                                                <option value="3x2">3x2</option>
                                                            </select>
                                                        </div>

                                                        {/* Bonificación - MODIFICADO */}
                                                        <div className="md:col-span-2">
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                {producto.tipo_promocion === 'porcentaje' ? 'Bonificación %' : 'Promoción'}
                                                            </label>
                                                            {producto.tipo_promocion === 'porcentaje' ? (
                                                                <div className="relative">
                                                                    <Percent className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                                    <input
                                                                        type="number"
                                                                        min="0"
                                                                        max="100"
                                                                        step="0.01"
                                                                        value={producto.bonificacion}
                                                                        onChange={(e) => handleProductoFieldChange(index, 'bonificacion', parseFloat(e.target.value) || 0)}
                                                                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:ring-sat focus:border-sat text-sm"
                                                                        placeholder="0%"
                                                                    />
                                                                </div>
                                                            ) : (
                                                                <div className="flex items-center h-10 px-3 bg-gray-100 border border-gray-300 rounded-md text-sm font-medium text-sat">
                                                                    {producto.tipo_promocion === '2x1' ? '2x1' : '3x2'}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Cantidad mínima - MODIFICADO */}
                                                        <div className="md:col-span-2">
                                                            <label className="block text-xs font-medium text-gray-600 mb-1">
                                                                {producto.tipo_promocion === 'porcentaje' ? 'Mínimo requerido' : 'Cantidad mínima'}
                                                            </label>
                                                            {producto.tipo_promocion === 'porcentaje' ? (
                                                                <input
                                                                    type="number"
                                                                    min="1"
                                                                    value={producto.cantidad_minima || ''}
                                                                    onChange={(e) => handleProductoFieldChange(index, 'cantidad_minima', e.target.value ? parseInt(e.target.value) : null)}
                                                                    className="w-full text-sm border border-gray-300 rounded px-3 py-2 focus:ring-sat focus:border-sat"
                                                                    placeholder="Ej: 2"
                                                                />
                                                            ) : (
                                                                <div className="flex items-center h-10 px-3 bg-gray-100 border border-gray-300 rounded-md text-sm">
                                                                    {producto.tipo_promocion === '2x1' ? '2 unidades' : '3 unidades'}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* Botón eliminar */}
                                                        <div className="md:col-span-1 flex justify-end">
                                                            <button
                                                                type="button"
                                                                onClick={() => eliminarProducto(index)}
                                                                className="p-2 text-gray-400 hover:text-red-600"
                                                                title="Eliminar producto"
                                                            >
                                                                <Trash2 className="h-5 w-5" />
                                                            </button>
                                                        </div>
                                                    </div>
                                                    
                                                    {/* Mostrar información adicional */}
                                                    {producto.nombre_producto && (
                                                        <div className="mt-2 text-xs text-gray-500">
                                                            {producto.compania_nombre} - {producto.codigo_producto}
                                                        </div>
                                                    )}

                                                    {/* Mensaje explicativo para 2x1 y 3x2 - MODIFICADO */}
                                                    {producto.tipo_promocion !== 'porcentaje' && (
                                                        <div className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded">
                                                            {producto.tipo_promocion === '2x1' 
                                                                ? '✓ 2x1: Llevando 2 unidades, pagás 1'
                                                                : '✓ 3x2: Llevando 3 unidades, pagás 2'}
                                                        </div>
                                                    )}
                                                </div>
                                            );
                                        })}
                                    </div>
                                )}
                                {errors.productos && (
                                    <p className="mt-2 text-xs text-red-600">{errors.productos}</p>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-white flex-shrink-0">
                        <button type="button" onClick={onClose} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={handleSubmit}
                            disabled={cargando}
                            className={`px-4 py-2 rounded-md text-sm font-medium text-white flex items-center gap-2 ${
                                cargando ? 'bg-gray-300 cursor-not-allowed' : 'bg-sat hover:bg-sat-600'
                            }`}
                        >
                            {cargando ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    {isEditing ? 'Actualizar Promoción' : 'Crear Promoción'}
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}