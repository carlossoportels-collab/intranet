// resources/js/components/leads/CrearLeadModal.tsx
import { router } from '@inertiajs/react';
import { X, UserPlus, Phone, Mail, MapPin, Briefcase, User, Check, Search, Loader } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import Toast from '@/components/ui/toast';
import { Origen, Rubro, Provincia, Localidad, Comercial } from '@/types/leads';

interface Usuario {
    id: number;
    nombre_usuario: string;
    nombre_completo: string;
    rol_id: number;
    comercial?: {
        es_comercial: boolean;
        prefijo_id?: number;
    } | null;
}

interface CrearLeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    usuario: Usuario;
    origenes: Origen[];
    rubros: Rubro[];
    provincias: Provincia[];
    comerciales: Comercial[];
    hay_comerciales: boolean;
}

export default function CrearLeadModal({ 
    isOpen, 
    onClose, 
    usuario, 
    origenes, 
    rubros, 
    provincias,
    comerciales,
    hay_comerciales
}: CrearLeadModalProps) {
    const [step, setStep] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSearchingLocalidades, setIsSearchingLocalidades] = useState(false);
    const [localidadesResult, setLocalidadesResult] = useState<Localidad[]>([]);
    const [showLocalidadesDropdown, setShowLocalidadesDropdown] = useState(false);
    
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
        }, 100);
    };

    // Función para cerrar el toast
    const closeToast = () => {
        setToast(null);
    };

    // Estado del formulario
    const [formData, setFormData] = useState({
        prefijo_id: usuario.comercial?.es_comercial ? usuario.comercial.prefijo_id?.toString() || '' : '',
        nombre_completo: '',
        genero: 'no_especifica',
        telefono: '',
        email: '',
        provincia_id: '',
        localidad_id: '',
        localidad_nombre: '',
        rubro_id: '',
        origen_id: '',
        observacion: '',
        tipo_nota: 'observacion_inicial'
    });

    // Resetear formulario cuando se abre
    useEffect(() => {
        
        if (isOpen) {
            const prefijoId = usuario.comercial?.es_comercial ? 
                (usuario.comercial.prefijo_id?.toString() || '') : '';
            
            setFormData({
                prefijo_id: prefijoId,
                nombre_completo: '',
                genero: 'no_especifica',
                telefono: '',
                email: '',
                provincia_id: '',
                localidad_id: '',
                localidad_nombre: '',
                rubro_id: '',
                origen_id: '',
                observacion: '',
                tipo_nota: 'observacion_inicial'
            });
            setStep(1);
            setIsSubmitting(false);
            setLocalidadesResult([]);
            setShowLocalidadesDropdown(false);
            // Limpiar toast si existe
            setToast(null);
        }
    }, [isOpen, usuario]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
        // Si cambia la provincia, limpiar la localidad seleccionada
        if (name === 'provincia_id') {
            setFormData(prev => ({ 
                ...prev, 
                provincia_id: value,
                localidad_id: '',
                localidad_nombre: ''
            }));
            setLocalidadesResult([]);
            setShowLocalidadesDropdown(false);
        }
    };

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
            const data = await response.json();
            
            if (data.success) {
                setLocalidadesResult(data.data);
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
            localidad_nombre: `${localidad.nombre}, ${localidad.provincia} (CP: ${localidad.codigo_postal})`
        }));
        setShowLocalidadesDropdown(false);
        setLocalidadesResult([]);
    };

    const handleSubmitStep1 = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Validaciones básicas
        if (!formData.nombre_completo.trim()) {
            alert('El nombre es requerido');
            return;
        }
        
        if (!formData.origen_id) {
            alert('Debe seleccionar un origen de contacto');
            return;
        }
        
        // Si el usuario NO es comercial y hay comerciales disponibles, debe seleccionar uno
        const esComercial = usuario.rol_id === 5;
        if (!esComercial && hay_comerciales && !formData.prefijo_id) {
            alert('Debe seleccionar un comercial para asignar el lead');
            return;
        }
        
        setStep(2);
    };

    const handleSubmitLead = async (agregarNota: boolean) => {
        setIsSubmitting(true);
        
        try {
            // Preparar datos para enviar
            const leadData: any = {
                prefijo_id: formData.prefijo_id ? parseInt(formData.prefijo_id) : null,
                nombre_completo: formData.nombre_completo,
                genero: formData.genero,
                telefono: formData.telefono || null,
                email: formData.email || null,
                localidad_id: formData.localidad_id ? parseInt(formData.localidad_id) : null,
                rubro_id: formData.rubro_id ? parseInt(formData.rubro_id) : null,
                origen_id: parseInt(formData.origen_id),
            };

            // Si se quiere agregar nota, incluirla
            if (agregarNota && formData.observacion.trim()) {
                leadData.nota = {
                    observacion: formData.observacion,
                    tipo: formData.tipo_nota
                };
            }

            // Usar router.post con Inertia
            router.post('/comercial/leads', leadData, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: () => {
                    // Mostrar toast según la acción y cerrar modal
                    if (agregarNota && formData.observacion.trim()) {
                        showToastAndClose('Lead creado exitosamente con nota', 'success');
                    } else {
                        showToastAndClose('Lead creado exitosamente', 'success');
                    }
                },
                onError: (errors) => {
                    let errorMessage = 'Error al crear el lead.';
                    
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
            console.error('Error:', error);
            showToastAndClose('Error al procesar la solicitud', 'error');
            setIsSubmitting(false);
        }
    };

    const handleClose = () => {
        if (isSubmitting || step === 2) return; // No permitir cerrar en paso 2
        onClose();
    };

    const handleOverlayClick = () => {
        if (step === 2) {
            // En el paso 2, mostrar confirmación si intenta cerrar
            const confirmar = window.confirm(
                '¿Está seguro que desea cancelar? El lead ya fue creado. Puede finalizar sin nota o agregar una nota.'
            );
            if (confirmar) {
                onClose();
            }
        } else {
            onClose();
        }
    };

    if (!isOpen && !toast?.show) return null;

    // Verificar si es comercial
    const esComercial = usuario.rol_id === 5;

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

            {/* Modal - solo se muestra si isOpen es true */}
            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    {/* Overlay */}
                    <div 
                        className="fixed inset-0 bg-black/50" 
                        onClick={step === 1 ? handleOverlayClick : undefined}
                        style={{ cursor: step === 2 ? 'default' : 'pointer' }}
                    />
                    
                    {/* Modal */}
                    <div className="flex min-h-full items-center justify-center p-4">
                        <div className="relative bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-hidden">
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gray-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-sat/10 rounded-lg">
                                        <UserPlus className="h-6 w-6 text-sat" />
                                    </div>
                                    <div>
                                        <h2 className="text-xl font-semibold text-gray-900">
                                            {step === 1 ? 'Nuevo Lead' : 'Agregar Nota (Opcional)'}
                                        </h2>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {step === 1 
                                                ? 'Complete los datos del nuevo prospecto' 
                                                : 'El lead ya fue creado. Puede agregar una nota opcional.'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={step === 2 ? () => handleOverlayClick() : handleClose}
                                    disabled={isSubmitting}
                                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                    type="button"
                                    title={step === 2 ? "Cerrar (se pedirá confirmación)" : "Cerrar"}
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Contenido del modal */}
                            <div className="p-6 overflow-y-auto max-h-[60vh]">
                                {step === 1 ? (
                                    <form onSubmit={handleSubmitStep1}>
                                        <div className="space-y-6">
                                            {/* Asignación de comercial */}
                                            <div className="space-y-2">
                                                {esComercial ? (
                                                    <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                                                        <div className="flex items-center gap-3">
                                                            <User className="h-5 w-5 text-blue-600" />
                                                            <div>
                                                                <h3 className="font-medium text-blue-900">
                                                                    Usted será asignado como comercial
                                                                </h3>
                                                                <p className="text-sm text-blue-700 mt-1">
                                                                    {usuario.nombre_completo}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                ) : hay_comerciales ? (
                                                    <div className="space-y-2">
                                                        <label htmlFor="prefijo_id" className="block text-sm font-medium text-gray-700">
                                                            Comercial a asignar *
                                                        </label>
                                                        <select
                                                            id="prefijo_id"
                                                            name="prefijo_id"
                                                            value={formData.prefijo_id}
                                                            onChange={handleChange}
                                                            required
                                                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-sat focus:border-sat rounded-md"
                                                        >
                                                            <option value="">Seleccione un comercial</option>
                                                            {comerciales.map((comercial) => (
                                                                <option key={comercial.id} value={comercial.prefijo_id}>
                                                                    {comercial.nombre}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        <p className="text-xs text-gray-500">
                                                            Seleccione el comercial que atenderá este lead
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                                                        <div className="flex items-center gap-2">
                                                            <User className="h-5 w-5 text-yellow-600" />
                                                            <div>
                                                                <h3 className="font-medium text-yellow-900">
                                                                    No hay comerciales disponibles
                                                                </h3>
                                                                <p className="text-sm text-yellow-700 mt-1">
                                                                    El lead se creará sin comercial asignado
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>

                                            {/* Nombre y Género en fila */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label htmlFor="nombre_completo" className="block text-sm font-medium text-gray-700">
                                                        Nombre completo *
                                                    </label>
                                                    <div className="relative">
                                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            id="nombre_completo"
                                                            name="nombre_completo"
                                                            value={formData.nombre_completo}
                                                            onChange={handleChange}
                                                            placeholder="Ej: Juan Pérez"
                                                            className="pl-10 mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sat focus:border-sat"
                                                            required
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label htmlFor="genero" className="block text-sm font-medium text-gray-700">
                                                        Género
                                                    </label>
                                                    <select
                                                        id="genero"
                                                        name="genero"
                                                        value={formData.genero}
                                                        onChange={handleChange}
                                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-sat focus:border-sat rounded-md"
                                                    >
                                                        <option value="no_especifica">No especifica</option>
                                                        <option value="masculino">Masculino</option>
                                                        <option value="femenino">Femenino</option>
                                                        <option value="otro">Otro</option>
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Teléfono y Email en fila */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                                                        Teléfono
                                                    </label>
                                                    <div className="relative">
                                                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <input
                                                            type="tel"
                                                            id="telefono"
                                                            name="telefono"
                                                            value={formData.telefono}
                                                            onChange={handleChange}
                                                            placeholder="Ej: 011 1234-5678"
                                                            className="pl-10 mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sat focus:border-sat"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="space-y-2">
                                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                                                        Email
                                                    </label>
                                                    <div className="relative">
                                                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <input
                                                            type="email"
                                                            id="email"
                                                            name="email"
                                                            value={formData.email}
                                                            onChange={handleChange}
                                                            placeholder="Ej: ejemplo@email.com"
                                                            className="pl-10 mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sat focus:border-sat"
                                                        />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Provincia y Localidad con autocomplete */}
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div className="space-y-2">
                                                    <label htmlFor="provincia_id" className="block text-sm font-medium text-gray-700">
                                                        Provincia
                                                    </label>
                                                    <select
                                                        id="provincia_id"
                                                        name="provincia_id"
                                                        value={formData.provincia_id}
                                                        onChange={handleChange}
                                                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-sat focus:border-sat rounded-md"
                                                    >
                                                        <option value="">Todas las provincias</option>
                                                        {provincias.map((provincia) => (
                                                            <option key={provincia.id} value={provincia.id}>
                                                                {provincia.nombre}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>

                                                <div className="space-y-2">
                                                    <label htmlFor="localidad_nombre" className="block text-sm font-medium text-gray-700">
                                                        Localidad
                                                    </label>
                                                    <div className="relative">
                                                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                        <input
                                                            type="text"
                                                            id="localidad_nombre"
                                                            name="localidad_nombre"
                                                            value={formData.localidad_nombre}
                                                            onChange={(e) => {
                                                                const value = e.target.value;
                                                                setFormData(prev => ({ ...prev, localidad_nombre: value }));
                                                                handleLocalidadSearch(value);
                                                            }}
                                                            placeholder="Escriba al menos 3 letras..."
                                                            className="pl-10 mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sat focus:border-sat"
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
                                                                        <div className="font-medium">{localidad.nombre}</div>
                                                                        <div className="text-sm text-gray-600">
                                                                            {localidad.provincia} (CP: {localidad.codigo_postal})
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
                                            </div>

                                            {/* Rubro */}
                                            <div className="space-y-2">
                                                <label htmlFor="rubro_id" className="block text-sm font-medium text-gray-700">
                                                    Rubro
                                                </label>
                                                <div className="relative">
                                                    <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                                    <select
                                                        id="rubro_id"
                                                        name="rubro_id"
                                                        value={formData.rubro_id}
                                                        onChange={handleChange}
                                                        className="pl-10 mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sat focus:border-sat"
                                                    >
                                                        <option value="">Sin rubro</option>
                                                        {rubros.map((rubro) => (
                                                            <option key={rubro.id} value={rubro.id}>
                                                                {rubro.nombre}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </div>
                                            </div>

                                            {/* Origen de contacto */}
                                            <div className="space-y-2">
                                                <label htmlFor="origen_id" className="block text-sm font-medium text-gray-700">
                                                    Origen de contacto *
                                                </label>
                                                <select
                                                    id="origen_id"
                                                    name="origen_id"
                                                    value={formData.origen_id}
                                                    onChange={handleChange}
                                                    required
                                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-sat focus:border-sat rounded-md"
                                                >
                                                    <option value="">¿Cómo nos contactó?</option>
                                                    {origenes.map((origen) => (
                                                        <option key={origen.id} value={origen.id}>
                                                            {origen.nombre}
                                                        </option>
                                                    ))}
                                                </select>
                                            </div>
                                        </div>

                                        {/* Botones del paso 1 */}
                                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                                            <button
                                                type="button"
                                                onClick={handleClose}
                                                disabled={isSubmitting}
                                                className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sat disabled:opacity-50"
                                            >
                                                Cancelar
                                            </button>
                                            <button
                                                type="submit"
                                                disabled={isSubmitting}
                                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sat hover:bg-sat-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sat disabled:opacity-50"
                                            >
                                                {isSubmitting ? 'Procesando...' : 'Continuar'}
                                            </button>
                                        </div>
                                    </form>
                                ) : (
                                    /* Paso 2: Nota opcional */
                                    <div>
                                        <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                                            <div className="flex items-start gap-3">
                                                <Check className="h-5 w-5 text-blue-600 mt-0.5" />
                                                <div>
                                                    <h3 className="font-medium text-blue-900">
                                                        Información básica del lead guardada
                                                    </h3>
                                                    <p className="text-sm text-blue-700 mt-1">
                                                        ¿Desea agregar una nota inicial al lead? (Opcional)
                                                    </p>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="space-y-6">
                                            <div className="space-y-2">
                                                <label htmlFor="tipo_nota" className="block text-sm font-medium text-gray-700">
                                                    Tipo de nota
                                                </label>
                                                <select
                                                    id="tipo_nota"
                                                    name="tipo_nota"
                                                    value={formData.tipo_nota}
                                                    onChange={handleChange}
                                                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-sat focus:border-sat rounded-md"
                                                >
                                                    <option value="observacion_inicial">Observación inicial</option>
                                                    <option value="informacion_cliente">Información del cliente</option>
                                                    <option value="detalle_contacto">Detalle del contacto</option>
                                                </select>
                                            </div>

                                            <div className="space-y-2">
                                                <label htmlFor="observacion" className="block text-sm font-medium text-gray-700">
                                                    Observación
                                                </label>
                                                <textarea
                                                    id="observacion"
                                                    name="observacion"
                                                    value={formData.observacion}
                                                    onChange={handleChange}
                                                    placeholder="Escriba aquí cualquier información relevante sobre el lead..."
                                                    rows={4}
                                                    className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sat focus:border-sat"
                                                />
                                                <p className="text-xs text-gray-500">
                                                    Esta nota quedará registrada en el historial del lead
                                                </p>
                                            </div>
                                        </div>

                                        {/* Botones del paso 2 */}
                                        <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                                            <button
                                                type="button"
                                                onClick={() => handleSubmitLead(false)}
                                                disabled={isSubmitting}
                                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                                            >
                                                {isSubmitting ? 'Procesando...' : 'Finalizar sin nota'}
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => handleSubmitLead(true)}
                                                disabled={isSubmitting || !formData.observacion.trim()}
                                                className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sat hover:bg-sat-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sat disabled:opacity-50"
                                            >
                                                {isSubmitting ? 'Procesando...' : 'Guardar y agregar nota'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}