// resources/js/components/leads/CrearLeadModal.tsx
import { router } from '@inertiajs/react';
import { X, UserPlus } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import Toast from '@/components/ui/toast';
import Paso1Formulario from './steps/Paso1Formulario';
import Paso2Nota from './steps/Paso2Nota';
import Paso3WhatsApp from './steps/Paso3WhatsApp';
import { Origen, Rubro, Provincia, Localidad, Comercial } from '@/types/leads';
import { sendWhatsApp } from '@/utils/whatsapp.utils';

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
    const [leadCreadoId, setLeadCreadoId] = useState<number | null>(null);
    const [comercialAsignado, setComercialAsignado] = useState<Comercial | null>(null);
    
    // Estado para el toast
    const [toast, setToast] = useState<{
        show: boolean;
        message: string;
        type: 'success' | 'error';
    } | null>(null);
    
    // Función para mostrar toast
    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ show: true, message, type });
    };

    // Función para cerrar el toast
    const closeToast = () => {
        setToast(null);
    };

    // Función para cerrar todo y limpiar
    const closeAll = () => {
        setLeadCreadoId(null);
        setComercialAsignado(null);
        onClose();
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
            setLeadCreadoId(null);
            setComercialAsignado(null);
            setToast(null);
        }
    }, [isOpen, usuario]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        
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
        
        if (!formData.nombre_completo.trim()) {
            showToast('El nombre es requerido', 'error');
            return;
        }
        
        if (!formData.origen_id) {
            showToast('Debe seleccionar un origen de contacto', 'error');
            return;
        }
        
        const esComercial = usuario.rol_id === 5;
        if (!esComercial && hay_comerciales && !formData.prefijo_id) {
            showToast('Debe seleccionar un comercial para asignar el lead', 'error');
            return;
        }
        
    if (formData.prefijo_id) {
        const comercial = comerciales.find(c => c.prefijo_id.toString() === formData.prefijo_id);
        setComercialAsignado(comercial || null);
    }
        
        setStep(2);
    };

    const handleSubmitLead = async (agregarNota: boolean) => {
        setIsSubmitting(true);
        
        const comercialActual = comercialAsignado;
        const leadDataActual = {
            nombre_completo: formData.nombre_completo,
            telefono: formData.telefono,
            email: formData.email
        };
        
        try {
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

            if (agregarNota && formData.observacion.trim()) {
                leadData.nota = {
                    observacion: formData.observacion,
                    tipo: formData.tipo_nota
                };
            }

            router.post('/comercial/leads', leadData, {
                preserveScroll: true,
                preserveState: true,
                onSuccess: (page) => {
                    const flash = page.props.flash as any;
                    const leadId = flash?.lead_id;
                    
                    setLeadCreadoId(leadId);
                    setComercialAsignado(comercialActual);
                    setFormData(prev => ({
                        ...prev,
                        nombre_completo: leadDataActual.nombre_completo,
                        telefono: leadDataActual.telefono || '',
                        email: leadDataActual.email || ''
                    }));
                    
                    const esComercial = usuario.rol_id === 5;
                    
                    if (!esComercial && comercialActual) {
                        setStep(3);
                    } else {
                        const mensaje = agregarNota && formData.observacion.trim() 
                            ? 'Lead creado exitosamente con nota'
                            : 'Lead creado exitosamente';
                        showToast(mensaje, 'success');
                        setTimeout(closeAll, 2000);
                    }
                },
                onError: (errors) => {
                    let errorMessage = 'Error al crear el lead.';
                    
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
                                const firstError = Object.values(errorObj)[0];
                                if (Array.isArray(firstError)) {
                                    errorMessage = firstError[0] || errorMessage;
                                } else if (typeof firstError === 'string') {
                                    errorMessage = firstError;
                                }
                            }
                        }
                    }
                    
                    showToast(errorMessage, 'error');
                    setIsSubmitting(false);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                }
            });
        } catch (error) {
            console.error('Error:', error);
            showToast('Error al procesar la solicitud', 'error');
            setIsSubmitting(false);
        }
    };

    const handleWhatsAppConfirm = (enviarWhatsApp: boolean) => {
        if (enviarWhatsApp && comercialAsignado) {
            const telefonoComercial = comercialAsignado.telefono || comercialAsignado.personal?.telefono;
            
            if (telefonoComercial) {
                const primerNombreComercial = comercialAsignado.nombre.split(' ')[0];
                
                let mensaje = `Hola ${primerNombreComercial}, se te ha asignado un nuevo lead:\n\n`;
                mensaje += `Nombre: ${formData.nombre_completo}\n`;
                
                if (formData.telefono) {
                    mensaje += `Teléfono: ${formData.telefono}\n`;
                }
                
                if (formData.email) {
                    mensaje += `Email: ${formData.email}\n`;
                }
                
                if (formData.telefono && leadCreadoId) {
                    const telefonoLead = formData.telefono.replace(/\D/g, '');
                    const telefonoLeadFormateado = telefonoLead.startsWith('54') ? telefonoLead : `54${telefonoLead}`;
                    mensaje += `\nLink para contactar al lead (click para registrar):\n`;
                    mensaje += `${window.location.origin}/comercial/lead/${leadCreadoId}/contactar-whatsapp?phone=${telefonoLeadFormateado}\n`;
                } else if (formData.telefono) {
                    const telefonoLead = formData.telefono.replace(/\D/g, '');
                    const telefonoLeadFormateado = telefonoLead.startsWith('54') ? telefonoLead : `54${telefonoLead}`;
                    mensaje += `\nLink para contactar al lead:\n`;
                    mensaje += `https://wa.me/${telefonoLeadFormateado}\n`;
                }
                
                mensaje += `\nPor favor, contacta al lead a la brevedad.`;
                
                sendWhatsApp(telefonoComercial, mensaje);
            }
        }
        
        const mensajeToast = formData.observacion.trim() 
            ? 'Lead creado exitosamente con nota'
            : 'Lead creado exitosamente';
        
        showToast(mensajeToast, 'success');
        setTimeout(closeAll, 2000);
    };

    const handleBackToStep2 = () => {
        setStep(2);
    };

    const handleOverlayClick = () => {
        if (step === 2 || step === 3) {
            const confirmar = window.confirm(
                '¿Está seguro que desea cancelar? El lead ya fue creado.'
            );
            if (confirmar) {
                closeAll();
            }
        } else {
            closeAll();
        }
    };

    if (!isOpen && !toast?.show) return null;

    const esComercial = usuario.rol_id === 5;
    const mostrarWhatsApp = !esComercial && comercialAsignado && step === 3;

    return (
        <>
            {toast?.show && (
                <Toast
                    message={toast.message}
                    type={toast.type}
                    duration={toast.type === 'success' ? 3000 : 5000}
                    position="top-center"
                    onClose={closeToast}
                />
            )}

            {isOpen && (
                <div className="fixed inset-0 z-50 overflow-y-auto">
                    <div 
                        className="fixed inset-0 bg-black/50" 
                        onClick={handleOverlayClick}
                    />
                    
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
                                            {step === 1 && 'Nuevo Lead'}
                                            {step === 2 && 'Agregar Nota (Opcional)'}
                                            {step === 3 && 'Notificar al Comercial'}
                                        </h2>
                                        <p className="text-sm text-gray-600 mt-1">
                                            {step === 1 && 'Complete los datos del nuevo prospecto'}
                                            {step === 2 && 'El lead ya fue creado. Puede agregar una nota opcional.'}
                                            {step === 3 && '¿Desea notificar al comercial por WhatsApp?'}
                                        </p>
                                    </div>
                                </div>
                                <button
                                    onClick={closeAll}
                                    disabled={isSubmitting}
                                    className="p-2 text-gray-400 hover:text-gray-600 disabled:opacity-50"
                                    type="button"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            {/* Contenido */}
                            <div className="p-6 overflow-y-auto max-h-[60vh]">
                                {step === 1 && (
                                    <Paso1Formulario
                                        formData={formData}
                                        handleChange={handleChange}
                                        handleLocalidadSearch={handleLocalidadSearch}
                                        handleLocalidadSelect={handleLocalidadSelect}
                                        onSubmit={handleSubmitStep1}
                                        esComercial={esComercial}
                                        hayComerciales={hay_comerciales}
                                        comerciales={comerciales}
                                        origenes={origenes}
                                        rubros={rubros}
                                        provincias={provincias}
                                        localidadesResult={localidadesResult}
                                        showLocalidadesDropdown={showLocalidadesDropdown}
                                        isSearchingLocalidades={isSearchingLocalidades}
                                        isSubmitting={isSubmitting}
                                        onClose={closeAll}
                                        usuario={usuario}
                                    />
                                )}

                                {step === 2 && (
                                    <Paso2Nota
                                        formData={formData}
                                        handleChange={handleChange}
                                        isSubmitting={isSubmitting}
                                        onSubmit={handleSubmitLead}
                                    />
                                )}

                                {step === 3 && mostrarWhatsApp && (
                                    <Paso3WhatsApp
                                        comercial={comercialAsignado}
                                        leadData={{
                                            nombre_completo: formData.nombre_completo,
                                            telefono: formData.telefono,
                                            email: formData.email
                                        }}
                                        leadId={leadCreadoId}
                                        isSubmitting={isSubmitting}
                                        onConfirm={handleWhatsAppConfirm}
                                        onSkip={() => {
                                            const mensaje = formData.observacion.trim() 
                                                ? 'Lead creado exitosamente con nota'
                                                : 'Lead creado exitosamente';
                                            showToast(mensaje, 'success');
                                            setTimeout(closeAll, 2000);
                                        }}
                                        onBack={handleBackToStep2}
                                    />
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}