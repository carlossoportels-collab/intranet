// resources/js/Components/Modals/EditarLeadModal.tsx
import { router } from '@inertiajs/react';
import { X, User, Phone, Mail, MapPin, Briefcase, Building, AlertCircle, Check, Loader } from 'lucide-react';
import React, { useEffect, useState } from 'react';

import Toast from '@/components/ui/toast';
import {
    Lead,
    Origen,
    Rubro,
    Provincia,
    Localidad,
    Comercial
} from '@/types/leads';

interface EditarLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
    origenes: Origen[];
    rubros: Rubro[];
    comerciales: Comercial[];
    provincias: Provincia[];
    usuario: {
        rol_id: number;
        personal_id: number;
        nombre_completo?: string;
        comercial?: {
            es_comercial: boolean;
            prefijo_id?: number;
        } | null;
    };
    onSuccess?: () => void;
}

// Definir tipo para la página de Inertia
interface InertiaPage {
    props: {
        flash?: {
            success?: string;
            error?: string | null;
        };
        [key: string]: any;
    };
    [key: string]: any;
}

export default function EditarLeadModal({ 
    isOpen, 
    onClose, 
    lead, 
    origenes = [], 
    rubros = [], 
    comerciales = [],
    provincias = [],
    usuario,
    onSuccess 
}: EditarLeadModalProps) {
    // Estado para controlar si el modal está montado
    const [isMounted, setIsMounted] = useState(false);
    
    // Estado para el toast
    const [toast, setToast] = useState<{
        show: boolean;
        message: string;
        type: 'success' | 'error';
    } | null>(null);
    
    // Función para mostrar toast y cerrar modal
    const showToastAndClose = (message: string, type: 'success' | 'error' = 'success') => {
        // Primero cerramos el modal
        onClose();
        
        // Luego mostramos el toast
        setTimeout(() => {
            setToast({ 
                show: true, 
                message, 
                type
            });
            
            // Llamar al callback de éxito si existe
            if (type === 'success' && onSuccess) {
                setTimeout(() => {
                    onSuccess();
                }, 100);
            }
        }, 100);
    };

    // Función para cerrar el toast
    const closeToast = () => {
        setToast(null);
    };

    // Estado del formulario
    const [formData, setFormData] = useState({
        prefijo_id: '',
        nombre_completo: '',
        genero: 'no_especifica',
        telefono: '',
        email: '',
        provincia_id: '',
        localidad_id: '',
        localidad_nombre: '',
        rubro_id: '',
        origen_id: '',
    });

    // Estados para búsqueda de localidades
    const [isSearchingLocalidades, setIsSearchingLocalidades] = useState(false);
    const [localidadesResult, setLocalidadesResult] = useState<Localidad[]>([]);
    const [showLocalidadesDropdown, setShowLocalidadesDropdown] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Controlar montaje/desmontaje del modal
    useEffect(() => {
        if (isOpen) {
            setIsMounted(true);
            document.body.style.overflow = 'hidden';
        } else {
            // Retrasar el desmontaje para permitir animaciones
            const timer = setTimeout(() => {
                setIsMounted(false);
            }, 300);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
        
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    // Actualizar el formulario cuando cambia el lead y el modal está abierto
    useEffect(() => {
        if (isOpen && lead) {
            // Extraer solo el nombre de la localidad
            const localidadNombre = lead.localidad?.nombre?.trim() || ''; // ← Cambiado de 'localidad' a 'nombre'
            const provinciaId = lead.localidad?.provincia_id?.toString() || '';
            
            setFormData({
                prefijo_id: lead.prefijo_id?.toString() || '',
                nombre_completo: lead.nombre_completo || '',
                genero: lead.genero || 'no_especifica',
                telefono: lead.telefono || '',
                email: lead.email || '',
                provincia_id: provinciaId,
                localidad_id: lead.localidad_id?.toString() || '',
                localidad_nombre: localidadNombre,
                rubro_id: lead.rubro_id?.toString() || '',
                origen_id: lead.origen_id?.toString() || '',
            });
            
            // Limpiar estados de búsqueda
            setLocalidadesResult([]);
            setShowLocalidadesDropdown(false);
            setIsSearchingLocalidades(false);
        }
    }, [lead, isOpen]);

    // Resetear estados cuando se cierra
    useEffect(() => {
        if (!isOpen) {
            setToast(null);
            setIsSubmitting(false);
        }
    }, [isOpen]);

    // Si no está abierto ni montado, no renderizar nada
    if (!isOpen && !isMounted) {
        return null;
    }

    // Buscar localidades cuando se escribe en el campo
    const handleLocalidadSearch = async (searchTerm: string) => {
        if (searchTerm.length < 3) {
            setLocalidadesResult([]);
            setShowLocalidadesDropdown(false);
            return;
        }
        
        setIsSearchingLocalidades(true);
        
        try {
            const params = new URLSearchParams({
                search: searchTerm,
                ...(formData.provincia_id && { provincia_id: formData.provincia_id })
            });
            
            const response = await fetch(`/comercial/localidades/buscar?${params}`);
            const result = await response.json();
            
            if (result.success) {
                // Transformar los datos
                const localidadesTransformadas = result.data.map((item: any) => ({
                    id: item.id,
                    nombre: item.nombre || item.localidad, // ← Usar 'nombre'
                    provincia_id: item.provincia_id,
                    provincia: item.provincia,
                    codigo_postal: item.codigo_postal,
                }));
                
                setLocalidadesResult(localidadesTransformadas);
                setShowLocalidadesDropdown(true);
            }
        } catch (error) {
            console.error('Error buscando localidades:', error);
        } finally {
            setIsSearchingLocalidades(false);
        }
    };

    const handleLocalidadSelect = (localidad: Localidad) => {
        setFormData(prev => ({
            ...prev,
            localidad_id: localidad.id.toString(),
            localidad_nombre: localidad.nombre?.trim() || '', // ← Usar 'nombre'
            provincia_id: localidad.provincia_id?.toString() || ''
        }));
        setShowLocalidadesDropdown(false);
        setLocalidadesResult([]);
    };

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        
        if (name === 'provincia_id') {
            // Si cambia la provincia, limpiar la localidad
            setFormData(prev => ({
                ...prev,
                provincia_id: value,
                localidad_id: '',
                localidad_nombre: ''
            }));
            setLocalidadesResult([]);
            setShowLocalidadesDropdown(false);
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validar que lead no sea null
        if (!lead) {
            console.error('No hay lead seleccionado');
            return;
        }
        
        setIsSubmitting(true);
        
        // Preparar datos para enviar
        const dataToSend = {
            prefijo_id: formData.prefijo_id ? parseInt(formData.prefijo_id) : null,
            nombre_completo: formData.nombre_completo,
            genero: formData.genero,
            telefono: formData.telefono || null,
            email: formData.email || null,
            localidad_id: formData.localidad_id ? parseInt(formData.localidad_id) : null,
            rubro_id: formData.rubro_id ? parseInt(formData.rubro_id) : null,
            origen_id: formData.origen_id ? parseInt(formData.origen_id) : null,
        };
        
        try {
            // Usar router.put de Inertia directamente
            router.put(`/comercial/leads/${lead.id}`, dataToSend, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page: InertiaPage) => {
                    const successMessage = page.props?.flash?.success || 'Lead actualizado exitosamente';
                    showToastAndClose(successMessage, 'success');
                },
                onError: (errors) => {
                    console.error('Errores al guardar:', errors);
                    
                    let errorMessage = 'Error al actualizar el lead.';
                    
                    // Manejar diferentes formatos de error
                    if (errors) {
                        if (typeof errors === 'string') {
                            errorMessage = errors;
                        } else if (typeof errors === 'object') {
                            const errorObj = errors as Record<string, any>;
                            if (errorObj.error) {
                                errorMessage = errorObj.error;
                            } else if (errorObj.message) {
                                errorMessage = errorObj.message;
                            } else {
                                // Extraer el primer mensaje de error
                                const firstError = Object.values(errorObj)[0];
                                if (Array.isArray(firstError)) {
                                    errorMessage = firstError[0] || errorMessage;
                                } else if (typeof firstError === 'string') {
                                    errorMessage = firstError;
                                }
                            }
                        }
                    }
                    
                    showToastAndClose(errorMessage, 'error');
                },
                onFinish: () => {
                    setIsSubmitting(false);
                }
            });
        } catch (error) {
            console.error('Error inesperado:', error);
            showToastAndClose('Error inesperado al procesar la solicitud', 'error');
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (isSubmitting) return; // No permitir cerrar mientras se envía
        onClose();
    };

    // Verificar si el usuario es comercial
    const esComercial = usuario.rol_id === 5;
    const hayComerciales = comerciales.length > 0;

    // Estado de carga cuando no hay lead pero el modal está abierto
    if (isOpen && !lead) {
        return (
            <div className="fixed inset-0 z-50 overflow-y-auto">
                <div className="fixed inset-0 bg-black/50" />
                <div className="flex min-h-full items-center justify-center p-4">
                    <div className="relative bg-white rounded-lg shadow-xl w-full max-w-md p-8">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sat mx-auto mb-4"></div>
                            <p className="text-gray-600">Cargando información del lead...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <>
            {/* Toast notification usando el componente reutilizable */}
            {toast?.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    duration={toast.type === 'success' ? 3000 : 5000}
                    position="top-center"
                    onClose={closeToast}
                />
            )}

            {/* Modal - Usar clases condicionales para animación */}
            <div className={`fixed inset-0 z-50 overflow-y-auto transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
                {/* Overlay */}
                <div 
                    className={`fixed inset-0 bg-black/50 transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
                    onClick={handleClose}
                />
                
                {/* Modal */}
                <div className="flex min-h-full items-center justify-center p-4">
                    <div className={`relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden transition-all duration-300 transform ${isOpen ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'}`}>
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-gray-200">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-sat/10 rounded-lg">
                                    <User className="h-6 w-6 text-sat" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold text-gray-900">
                                        Editar Información del Lead
                                    </h2>
                                    <p className="text-sm text-gray-600 mt-1">
                                        ID: {lead?.id}
                                    </p>
                                </div>
                            </div>
                            <button
                                onClick={handleClose}
                                disabled={isSubmitting}
                                className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                type="button"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>

                        {/* Contenido del modal */}
                        <div className="p-6 overflow-y-auto max-h-[60vh]">
                            <form onSubmit={handleSubmit}>
                                <div className="space-y-6">
                                    {/* Asignación de comercial (solo si NO es comercial y hay comerciales) */}
                                    {!esComercial && hayComerciales && (
                                        <div className="space-y-2">
                                            <label htmlFor="prefijo_id" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Reasignar Comercial
                                            </label>
                                            <select
                                                id="prefijo_id"
                                                name="prefijo_id"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sat focus:border-sat"
                                                value={formData.prefijo_id}
                                                onChange={handleChange}
                                            >
                                                <option value="">Seleccionar comercial</option>
                                                {comerciales.map((comercial) => (
                                                    <option key={comercial.id} value={comercial.prefijo_id}>
                                                        {comercial.nombre}
                                                    </option>
                                                ))}
                                            </select>
                                            <p className="text-xs text-gray-500">
                                                Puede reasignar este lead a otro comercial
                                            </p>
                                        </div>
                                    )}

                                    {/* Si es comercial, mostrar mensaje */}
                                    {esComercial && (
                                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <div className="flex items-center gap-3">
                                                <User className="h-5 w-5 text-blue-600" />
                                                <div>
                                                    <h3 className="font-medium text-blue-900">
                                                        {usuario.nombre_completo || 'Usted'} es el comercial asignado
                                                    </h3>
                                                    <p className="text-sm text-blue-700 mt-1">
                                                        No tiene permisos para cambiar al comercial asignado
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Si no es comercial y no hay comerciales */}
                                    {!esComercial && !hayComerciales && (
                                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                            <div className="flex items-center gap-3">
                                                <AlertCircle className="h-5 w-5 text-yellow-600" />
                                                <div>
                                                    <h3 className="font-medium text-yellow-900">
                                                        No hay comerciales disponibles
                                                    </h3>
                                                    <p className="text-sm text-yellow-700 mt-1">
                                                        El lead permanecerá sin comercial asignado
                                                    </p>
                                                </div>
                                            </div>
                                        </div>
                                    )}

                                    {/* Campos editables */}
                                    <div className="space-y-6">
                                        <h3 className="font-medium text-gray-900 mb-3">Datos del Lead</h3>
                                        
                                        {/* Nombre completo */}
                                        <div className="space-y-2">
                                            <label htmlFor="nombre_completo" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                                <User className="h-4 w-4" />
                                                Nombre completo *
                                            </label>
                                            <input
                                                type="text"
                                                id="nombre_completo"
                                                name="nombre_completo"
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sat focus:border-sat"
                                                value={formData.nombre_completo}
                                                onChange={handleChange}
                                                required
                                            />
                                        </div>

                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Email */}
                                            <div className="space-y-2">
                                                <label htmlFor="email" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                                    <Mail className="h-4 w-4" />
                                                    Email
                                                </label>
                                                <input
                                                    type="email"
                                                    id="email"
                                                    name="email"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sat focus:border-sat"
                                                    value={formData.email}
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            {/* Teléfono */}
                                            <div className="space-y-2">
                                                <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                                    <Phone className="h-4 w-4" />
                                                    Teléfono
                                                </label>
                                                <input
                                                    type="tel"
                                                    id="telefono"
                                                    name="telefono"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sat focus:border-sat"
                                                    value={formData.telefono}
                                                    onChange={handleChange}
                                                />
                                            </div>

                                            {/* Género */}
                                            <div className="space-y-2">
                                                <label htmlFor="genero" className="block text-sm font-medium text-gray-700">
                                                    Género
                                                </label>
                                                <select
                                                    id="genero"
                                                    name="genero"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sat focus:border-sat"
                                                    value={formData.genero}
                                                    onChange={handleChange}
                                                >
                                                    <option value="no_especifica">No especifica</option>
                                                    <option value="masculino">Masculino</option>
                                                    <option value="femenino">Femenino</option>
                                                    <option value="otro">Otro</option>
                                                </select>
                                            </div>

                                            {/* Provincia */}
                                            <div className="space-y-2">
                                                <label htmlFor="provincia_id" className="block text-sm font-medium text-gray-700">
                                                    Provincia
                                                </label>
                                                <select
                                                    id="provincia_id"
                                                    name="provincia_id"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sat focus:border-sat"
                                                    value={formData.provincia_id}
                                                    onChange={handleChange}
                                                >
                                                    <option value="">Todas las provincias</option>
                                                    {provincias.map((provincia) => (
                                                        <option key={provincia.id} value={provincia.id}>
                                                            {provincia.nombre}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Localidad con autocomplete */}
                                            <div className="space-y-2">
                                                <label htmlFor="localidad_nombre" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                                    <MapPin className="h-4 w-4" />
                                                    Localidad
                                                </label>
                                                <div className="relative">
                                                    <input
                                                        type="text"
                                                        id="localidad_nombre"
                                                        name="localidad_nombre"
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sat focus:border-sat"
                                                        value={formData.localidad_nombre}
                                                        onChange={(e) => {
                                                            const value = e.target.value;
                                                            setFormData(prev => ({ ...prev, localidad_nombre: value }));
                                                            
                                                            // Solo buscar si el campo no está vacío
                                                            if (value.trim().length >= 3) {
                                                                handleLocalidadSearch(value);
                                                            } else {
                                                                setLocalidadesResult([]);
                                                                setShowLocalidadesDropdown(false);
                                                            }
                                                        }}
                                                        placeholder="Escriba al menos 3 letras para buscar..."
                                                    />
                                                    {isSearchingLocalidades && (
                                                        <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                                                    )}
                                                    
                                                    {/* Dropdown de resultados */}
                                                    {showLocalidadesDropdown && localidadesResult.length > 0 && (
                                                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                                                            {localidadesResult.map((localidad) => (
                                                                <button
                                                                    key={localidad.id}
                                                                    type="button"
                                                                    onClick={() => handleLocalidadSelect(localidad)}
                                                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 border-b border-gray-100 last:border-b-0"
                                                                >
                                                                    <div className="font-medium">{localidad.nombre}</div> {/* ← Cambiado a 'nombre' */}
                                                                    <div className="text-sm text-gray-600">
                                                                        {localidad.provincia} 
                                                                    </div>
                                                                </button>
                                                            ))}
                                                        </div>
                                                    )}
                                                </div>
                                                <p className="text-xs text-gray-500">
                                                    Escriba al menos 3 letras para buscar localidades
                                                </p>
                                            </div>

                                            {/* Origen */}
                                            <div className="space-y-2">
                                                <label htmlFor="origen_id" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                                    <Building className="h-4 w-4" />
                                                    Origen
                                                </label>
                                                <select
                                                    id="origen_id"
                                                    name="origen_id"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sat focus:border-sat"
                                                    value={formData.origen_id}
                                                    onChange={handleChange}
                                                >
                                                    <option value="">Seleccionar origen</option>
                                                    {origenes.map(origen => (
                                                        <option key={origen.id} value={origen.id}>
                                                            {origen.nombre}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>

                                            {/* Rubro */}
                                            <div className="space-y-2">
                                                <label htmlFor="rubro_id" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                                                    <Briefcase className="h-4 w-4" />
                                                    Rubro
                                                </label>
                                                <select
                                                    id="rubro_id"
                                                    name="rubro_id"
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-sat focus:border-sat"
                                                    value={formData.rubro_id}
                                                    onChange={handleChange}
                                                >
                                                    <option value="">Seleccionar rubro</option>
                                                    {rubros.map(rubro => (
                                                        <option key={rubro.id} value={rubro.id}>
                                                            {rubro.nombre}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>
                                    </div>
                                </div>

                                {/* Botones */}
                                <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                                    <button
                                        type="button"
                                        onClick={handleClose}
                                        disabled={isSubmitting}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                                    >
                                        Cancelar
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sat hover:bg-sat-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sat disabled:opacity-50 flex items-center gap-2"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                                Guardando...
                                            </>
                                        ) : (
                                            <>
                                                <Check className="h-4 w-4" />
                                                Guardar Cambios
                                            </>
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}