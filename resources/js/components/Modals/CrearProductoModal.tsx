// resources/js/Components/Modals/CrearProductoModal.tsx
import axios from 'axios';
import { X, Save, Tag, FileText, DollarSign, Building2, CheckSquare, AlertCircle } from 'lucide-react';
import React, { useState } from 'react';

interface Tipo {
    id: number;
    nombre_tipo_abono: string;
}

interface Compania {
    id: number;
    nombre: string;
}

interface CrearProductoModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    tipos: Tipo[];
    companias: Compania[];
    companiaActual?: {
        id: number;
        nombre: string;
    } | null;
    puedeVerTodas: boolean;
}

interface FormErrors {
    [key: string]: string;
}

export default function CrearProductoModal({ 
    isOpen, 
    onClose, 
    onSuccess,
    tipos,
    companias,
    companiaActual,
    puedeVerTodas 
}: CrearProductoModalProps) {
    const [formData, setFormData] = useState({
        codigopro: '',
        nombre: '',
        descripcion: '',
        precio: '',
        tipo_id: '',
        compania_id: puedeVerTodas ? '' : (companiaActual?.id.toString() || ''),
        es_activo: true
    });
    
    const [errors, setErrors] = useState<FormErrors>({});
    const [cargando, setCargando] = useState(false);
    const [errorGeneral, setErrorGeneral] = useState<string | null>(null);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        
        if (type === 'checkbox') {
            const checked = (e.target as HTMLInputElement).checked;
            setFormData({ ...formData, [name]: checked });
        } else {
            setFormData({ ...formData, [name]: value });
        }
        
        // Limpiar error del campo cuando se modifica
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const validateForm = () => {
        const newErrors: FormErrors = {};
        
        if (!formData.codigopro.trim()) {
            newErrors.codigopro = 'El código es requerido';
        } else if (formData.codigopro.length > 11) {
            newErrors.codigopro = 'El código no puede tener más de 11 caracteres';
        }
        
        if (!formData.nombre.trim()) {
            newErrors.nombre = 'El nombre es requerido';
        } else if (formData.nombre.length > 200) {
            newErrors.nombre = 'El nombre no puede tener más de 200 caracteres';
        }
        
        if (!formData.precio) {
            newErrors.precio = 'El precio es requerido';
        } else {
            const precioNum = parseFloat(formData.precio.replace(',', '.'));
            if (isNaN(precioNum) || precioNum < 0) {
                newErrors.precio = 'Ingrese un precio válido';
            }
        }
        
        if (!formData.tipo_id) {
            newErrors.tipo_id = 'Seleccione un tipo';
        }
        
        if (!formData.compania_id && puedeVerTodas) {
            newErrors.compania_id = 'Seleccione una compañía';
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
            // Preparar datos para enviar
            const datosEnvio = {
                ...formData,
                precio: parseFloat(formData.precio.replace(',', '.')),
                tipo_id: parseInt(formData.tipo_id),
                compania_id: parseInt(formData.compania_id),
                es_activo: formData.es_activo ? 1 : 0
            };
            
            const response = await axios.post('/config/tarifas', datosEnvio);
            
            if (response.data.success) {
                // Resetear formulario
                setFormData({
                    codigopro: '',
                    nombre: '',
                    descripcion: '',
                    precio: '',
                    tipo_id: '',
                    compania_id: puedeVerTodas ? '' : (companiaActual?.id.toString() || ''),
                    es_activo: true
                });
                
                if (onSuccess) {
                    onSuccess();
                }
                onClose();
            }
        } catch (err: any) {
            if (err.response?.data?.errors) {
                setErrors(err.response.data.errors);
            } else if (err.response?.data?.error) {
                setErrorGeneral(err.response.data.error);
            } else {
                setErrorGeneral('Error al crear el producto');
            }
        } finally {
            setCargando(false);
        }
    };

    const formatPrecio = (e: React.ChangeEvent<HTMLInputElement>) => {
        let value = e.target.value.replace(/[^\d,]/g, '');
        
        // Permitir solo un separador decimal
        const partes = value.split(',');
        if (partes.length > 2) {
            value = partes[0] + ',' + partes.slice(1).join('');
        }
        
        setFormData({ ...formData, precio: value });
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-[99990]" onClick={onClose} />
            
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[99999] pointer-events-none">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fadeIn pointer-events-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-green-100 rounded-lg">
                                <Tag className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Nuevo Producto/Servicio
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Complete los datos del nuevo producto
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Body - Formulario */}
                    <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                        {errorGeneral && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <p className="text-sm text-red-700">{errorGeneral}</p>
                            </div>
                        )}

                        <div className="space-y-4">
                            {/* Código */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Código <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="codigopro"
                                    value={formData.codigopro}
                                    onChange={handleChange}
                                    maxLength={11}
                                    className={`w-full px-3 py-2 border rounded-md focus:ring-sat focus:border-sat ${
                                        errors.codigopro ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Ej: ABO0001"
                                />
                                {errors.codigopro && (
                                    <p className="mt-1 text-xs text-red-600">{errors.codigopro}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    Máximo 11 caracteres
                                </p>
                            </div>

                            {/* Nombre */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Nombre <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    name="nombre"
                                    value={formData.nombre}
                                    onChange={handleChange}
                                    maxLength={200}
                                    className={`w-full px-3 py-2 border rounded-md focus:ring-sat focus:border-sat ${
                                        errors.nombre ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    placeholder="Nombre del producto/servicio"
                                />
                                {errors.nombre && (
                                    <p className="mt-1 text-xs text-red-600">{errors.nombre}</p>
                                )}
                            </div>

                            {/* Descripción */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Descripción
                                </label>
                                <textarea
                                    name="descripcion"
                                    value={formData.descripcion}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-sat focus:border-sat"
                                    placeholder="Descripción del producto/servicio (opcional)"
                                />
                            </div>

                            {/* Precio */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Precio <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500">
                                        $
                                    </span>
                                    <input
                                        type="text"
                                        name="precio"
                                        value={formData.precio}
                                        onChange={formatPrecio}
                                        className={`w-full pl-8 pr-3 py-2 border rounded-md focus:ring-sat focus:border-sat ${
                                            errors.precio ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="0,00"
                                    />
                                </div>
                                {errors.precio && (
                                    <p className="mt-1 text-xs text-red-600">{errors.precio}</p>
                                )}
                                <p className="mt-1 text-xs text-gray-500">
                                    Use coma para decimales (ej: 1234,56)
                                </p>
                            </div>

                            {/* Tipo */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="tipo_id"
                                    value={formData.tipo_id}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:ring-sat focus:border-sat ${
                                        errors.tipo_id ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                >
                                    <option value="">Seleccione un tipo</option>
                                    {tipos.map(tipo => (
                                        <option key={tipo.id} value={tipo.id}>
                                            {tipo.nombre_tipo_abono}
                                        </option>
                                    ))}
                                </select>
                                {errors.tipo_id && (
                                    <p className="mt-1 text-xs text-red-600">{errors.tipo_id}</p>
                                )}
                            </div>

                            {/* Compañía (solo si puede ver todas) */}
                            {puedeVerTodas && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Compañía <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        name="compania_id"
                                        value={formData.compania_id}
                                        onChange={handleChange}
                                        className={`w-full px-3 py-2 border rounded-md focus:ring-sat focus:border-sat ${
                                            errors.compania_id ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                    >
                                        <option value="">Seleccione una compañía</option>
                                        {companias.map(compania => (
                                            <option key={compania.id} value={compania.id}>
                                                {compania.nombre}
                                            </option>
                                        ))}
                                    </select>
                                    {errors.compania_id && (
                                        <p className="mt-1 text-xs text-red-600">{errors.compania_id}</p>
                                    )}
                                </div>
                            )}

                            {/* Si no puede ver todas, mostramos la compañía como texto */}
                            {!puedeVerTodas && companiaActual && (
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Compañía
                                    </label>
                                    <div className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-md text-gray-700">
                                        <Building2 className="h-4 w-4 inline mr-2 text-gray-500" />
                                        {companiaActual.nombre}
                                    </div>
                                </div>
                            )}

                            {/* Activo */}
                            <div className="flex items-center gap-2">
                                <input
                                    type="checkbox"
                                    name="es_activo"
                                    id="es_activo"
                                    checked={formData.es_activo}
                                    onChange={handleChange}
                                    className="w-4 h-4 text-sat border-gray-300 rounded focus:ring-sat"
                                />
                                <label htmlFor="es_activo" className="text-sm text-gray-700">
                                    Producto activo
                                </label>
                            </div>
                        </div>
                    </form>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={cargando}
                            className={`px-4 py-2 rounded-md text-sm font-medium text-white flex items-center gap-2 ${
                                cargando
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-green-600 hover:bg-green-700'
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
                                    Guardar producto
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}