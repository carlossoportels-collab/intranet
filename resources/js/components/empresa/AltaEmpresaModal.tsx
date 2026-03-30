// resources/js/components/empresa/AltaEmpresaModal.tsx

import { X, User, Building, Check, ChevronLeft, ChevronRight, Loader, UserPlus } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import { useToast } from '@/contexts/ToastContext';
import { 
    TipoResponsabilidad, 
    TipoDocumento, 
    Nacionalidad,
    CategoriaFiscal, 
    Plataforma
} from '@/types/empresa';
import { Lead, Origen, Rubro, Provincia, Comercial } from '@/types/leads';

import Paso1DatosLead from './pasos/Paso1DatosLead';
import Paso2DatosContacto from './pasos/Paso2DatosContacto';
import Paso3DatosEmpresa from './pasos/Paso3DatosEmpresa';

// 🔥 Declarar la variable global para TypeScript
declare global {
    interface Window {
        __tempLeadId?: number;
    }
}

interface Props {
    isOpen: boolean;
    onClose: (empresaGuardada?: boolean, irAContrato?: boolean, empresaCreada?: any) => void;
    presupuestoId: number | null;
    lead: Lead | null;
    origenes?: Origen[];
    rubros?: Rubro[];
    provincias?: Provincia[];
    modoCompletar?: boolean;
    datosExistentes?: {
        empresa?: any;
        contacto?: any;
    };
    usuario?: any;
    comerciales?: Comercial[];
    hayComerciales?: boolean;
    redirectTo?: 'contrato' | 'empresa';
}

const PASOS = [
    { id: 1, nombre: 'Datos del Lead', icon: User, key: 'lead' },
    { id: 2, nombre: 'Datos Personales', icon: User, key: 'contacto' },
    { id: 3, nombre: 'Datos de Empresa', icon: Building, key: 'empresa' },
];

export default function AltaEmpresaModal({ 
    isOpen, 
    onClose, 
    presupuestoId, 
    lead,
    origenes = [],
    rubros = [],
    provincias = [],
    modoCompletar = false,
    datosExistentes,
    usuario,
    comerciales = [],
    hayComerciales = false,
    redirectTo = 'contrato'
}: Props) {
    const [isMounted, setIsMounted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cargandoDatos, setCargandoDatos] = useState(false);
    const toast = useToast();

    const [tiposResponsabilidad, setTiposResponsabilidad] = useState<TipoResponsabilidad[]>([]);
    const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([]);
    const [nacionalidades, setNacionalidades] = useState<Nacionalidad[]>([]);
    const [categoriasFiscales, setCategoriasFiscales] = useState<CategoriaFiscal[]>([]);
    const [plataformas, setPlataformas] = useState<Plataforma[]>([]);

    const esComercial = usuario?.rol_id === 5 || usuario?.comercial?.es_comercial === true;
    const mostrarSelectorComercial = !esComercial && hayComerciales && !lead?.prefijo_id;

    const [formData, setFormData] = useState({
        lead: {
            prefijo_id: '' as string,
            nombre_completo: '',
            genero: 'no_especifica' as 'masculino' | 'femenino' | 'otro' | 'no_especifica',
            telefono: '',
            email: '',
            localidad_id: '' as number | '',
            rubro_id: '' as number | '',
            origen_id: '' as number | '',
        },
        contacto: {
            tipo_responsabilidad_id: '' as number | '',
            tipo_documento_id: '' as number | '',
            nro_documento: '',
            nacionalidad_id: '' as number | '',
            fecha_nacimiento: '',
            direccion_personal: '',
            codigo_postal_personal: '',
        },
        empresa: {
            nombre_fantasia: '',
            razon_social: '',
            cuit: '',
            direccion_fiscal: '',
            codigo_postal_fiscal: '',
            localidad_fiscal_id: '' as number | '',
            telefono_fiscal: '',
            email_fiscal: '',
            rubro_id: '' as number | '',
            cat_fiscal_id: '' as number | '',
            plataforma_id: '' as number | '',
            nombre_flota: '',
        }
    });

    const [pasosCompletados, setPasosCompletados] = useState({
        lead: false,
        contacto: false,
        empresa: false
    });
    
    const [pasoActual, setPasoActual] = useState(1);
    const [errores, setErrores] = useState<Record<string, string>>({});
    const [contactoId, setContactoId] = useState<number | null>(null);
    const [empresaId, setEmpresaId] = useState<number | null>(null);

    const cargarDatosDesdeAPI = async (leadId: number) => {
        setCargandoDatos(true);
        try {
            const response = await fetch(`/comercial/utils/empresa/verificar-datos/${leadId}`, {
                headers: {
                    'Accept': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                }
            });
            const result = await response.json();
            
            if (result.success && result.data) {
                const { contacto, empresa } = result.data;
                
                if (contacto) {
                    setFormData(prev => ({
                        ...prev,
                        contacto: {
                            tipo_responsabilidad_id: contacto.tipo_responsabilidad_id || '',
                            tipo_documento_id: contacto.tipo_documento_id || '',
                            nro_documento: contacto.nro_documento || '',
                            nacionalidad_id: contacto.nacionalidad_id || '',
                            fecha_nacimiento: contacto.fecha_nacimiento || '',
                            direccion_personal: contacto.direccion_personal || '',
                            codigo_postal_personal: contacto.codigo_postal_personal || '',
                        }
                    }));
                    setContactoId(contacto.id);
                }
                
                if (empresa) {
                    setFormData(prev => ({
                        ...prev,
                        empresa: {
                            nombre_fantasia: empresa.nombre_fantasia || '',
                            razon_social: empresa.razon_social || '',
                            cuit: empresa.cuit || '',
                            direccion_fiscal: empresa.direccion_fiscal || '',
                            codigo_postal_fiscal: empresa.codigo_postal_fiscal || '',
                            localidad_fiscal_id: empresa.localidad_fiscal_id || '',
                            telefono_fiscal: empresa.telefono_fiscal || '',
                            email_fiscal: empresa.email_fiscal || '',
                            rubro_id: empresa.rubro_id || '',
                            cat_fiscal_id: empresa.cat_fiscal_id || '',
                            plataforma_id: empresa.plataforma_id || '',
                            nombre_flota: empresa.nombre_flota || '',
                        }
                    }));
                    setEmpresaId(empresa.id);
                }
                
                setPasosCompletados({
                    lead: true,
                    contacto: !!contacto,
                    empresa: !!empresa
                });
            } else {
                setPasosCompletados({ lead: true, contacto: false, empresa: false });
            }
        } catch {
            setPasosCompletados({ lead: true, contacto: false, empresa: false });
        } finally {
            setCargandoDatos(false);
        }
    };

    const inicializarModal = useCallback(async () => {
        setErrores({});
        setIsSubmitting(false);
        
        setFormData(prev => ({
            ...prev,
            lead: {
                prefijo_id: (lead?.prefijo_id ? String(lead.prefijo_id) : '') || 
                            (esComercial && usuario?.comercial?.prefijo_id ? String(usuario.comercial.prefijo_id) : ''),
                nombre_completo: lead?.nombre_completo || '',
                genero: (lead?.genero || 'no_especifica') as any,
                telefono: lead?.telefono || '',
                email: lead?.email || '',
                localidad_id: lead?.localidad_id || '',
                rubro_id: lead?.rubro_id || '',
                origen_id: lead?.origen_id || '',
            }
        }));
        
        if (datosExistentes) {
            if (datosExistentes.contacto) {
                setFormData(prev => ({
                    ...prev,
                    contacto: {
                        tipo_responsabilidad_id: datosExistentes.contacto.tipo_responsabilidad_id || '',
                        tipo_documento_id: datosExistentes.contacto.tipo_documento_id || '',
                        nro_documento: datosExistentes.contacto.nro_documento || '',
                        nacionalidad_id: datosExistentes.contacto.nacionalidad_id || '',
                        fecha_nacimiento: datosExistentes.contacto.fecha_nacimiento || '',
                        direccion_personal: datosExistentes.contacto.direccion_personal || '',
                        codigo_postal_personal: datosExistentes.contacto.codigo_postal_personal || '',
                    }
                }));
                setContactoId(datosExistentes.contacto.id);
            }
            
            if (datosExistentes.empresa) {
                setFormData(prev => ({
                    ...prev,
                    empresa: {
                        nombre_fantasia: datosExistentes.empresa.nombre_fantasia || '',
                        razon_social: datosExistentes.empresa.razon_social || '',
                        cuit: datosExistentes.empresa.cuit || '',
                        direccion_fiscal: datosExistentes.empresa.direccion_fiscal || '',
                        codigo_postal_fiscal: datosExistentes.empresa.codigo_postal_fiscal || '',
                        localidad_fiscal_id: datosExistentes.empresa.localidad_fiscal_id || '',
                        telefono_fiscal: datosExistentes.empresa.telefono_fiscal || '',
                        email_fiscal: datosExistentes.empresa.email_fiscal || '',
                        rubro_id: datosExistentes.empresa.rubro_id || '',
                        cat_fiscal_id: datosExistentes.empresa.cat_fiscal_id || '',
                        plataforma_id: datosExistentes.empresa.plataforma_id || '',
                        nombre_flota: datosExistentes.empresa.nombre_flota || '',
                    }
                }));
                setEmpresaId(datosExistentes.empresa.id);
            }
            
            setPasosCompletados({
                lead: !!lead?.id,
                contacto: !!datosExistentes.contacto,
                empresa: !!datosExistentes.empresa
            });
            setCargandoDatos(false);
        } 
        else if (lead?.id) {
            await cargarDatosDesdeAPI(lead.id);
        } 
        else {
            setPasosCompletados({ lead: false, contacto: false, empresa: false });
            setCargandoDatos(false);
        }
    }, [lead, datosExistentes, esComercial, usuario]);

    const calcularPrimerPasoIncompleto = useCallback(() => {
        if (!pasosCompletados.lead) return 1;
        if (!pasosCompletados.contacto) return 2;
        if (!pasosCompletados.empresa) return 3;
        return 3;
    }, [pasosCompletados]);

    useEffect(() => {
        setPasoActual(calcularPrimerPasoIncompleto());
    }, [pasosCompletados, calcularPrimerPasoIncompleto]);

    useEffect(() => {
        const cargarSelects = async () => {
            try {
                const [tiposResp, docsResp, nacsResp, catResp, platResp] = await Promise.all([
                    fetch('/comercial/utils/tipos-responsabilidad/activos'),
                    fetch('/comercial/utils/tipos-documento/activos'),
                    fetch('/comercial/utils/nacionalidades'),
                    fetch('/comercial/utils/categorias-fiscales/activas'),
                    fetch('/comercial/utils/plataformas/activas')
                ]);
                setTiposResponsabilidad(await tiposResp.json());
                setTiposDocumento(await docsResp.json());
                setNacionalidades(await nacsResp.json());
                setCategoriasFiscales(await catResp.json());
                setPlataformas(await platResp.json());
            } catch {
                // Silently fail
            }
        };
        cargarSelects();
    }, []);

    useEffect(() => {
        if (isOpen) {
            setIsMounted(true);
            document.body.style.overflow = 'hidden';
            inicializarModal();
        } else {
            const timer = setTimeout(() => {
                setIsMounted(false);
            }, 300);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
        return () => { document.body.style.overflow = 'unset'; };
    }, [isOpen, inicializarModal]);

    const validarPaso = (paso: number): boolean => {
        const nuevosErrores: Record<string, string> = {};

        if (paso === 1) {
            const d = formData.lead;
            if (mostrarSelectorComercial && !d.prefijo_id) nuevosErrores['lead.prefijo_id'] = 'Seleccione un comercial';
            if (!d.nombre_completo?.trim()) nuevosErrores['lead.nombre_completo'] = 'El nombre es requerido';
            if (!d.telefono?.trim()) nuevosErrores['lead.telefono'] = 'El teléfono es requerido';
            if (!d.email?.trim()) nuevosErrores['lead.email'] = 'El email es requerido';
            if (!d.localidad_id) nuevosErrores['lead.localidad_id'] = 'La localidad es requerida';
            if (!d.rubro_id) nuevosErrores['lead.rubro_id'] = 'El rubro es requerido';
            if (!d.origen_id) nuevosErrores['lead.origen_id'] = 'El origen es requerido';
        }

        if (paso === 2) {
            const d = formData.contacto;
            if (!d.tipo_responsabilidad_id) nuevosErrores['contacto.tipo_responsabilidad_id'] = 'Seleccione tipo';
            if (!d.tipo_documento_id) nuevosErrores['contacto.tipo_documento_id'] = 'Seleccione tipo de documento';
            if (!d.nro_documento?.trim()) nuevosErrores['contacto.nro_documento'] = 'Ingrese número de documento';
            if (!d.nacionalidad_id) nuevosErrores['contacto.nacionalidad_id'] = 'Seleccione nacionalidad';
            if (!d.fecha_nacimiento) nuevosErrores['contacto.fecha_nacimiento'] = 'Ingrese fecha de nacimiento';
            if (!d.direccion_personal?.trim()) nuevosErrores['contacto.direccion_personal'] = 'Ingrese dirección';
            if (!d.codigo_postal_personal?.trim()) nuevosErrores['contacto.codigo_postal_personal'] = 'Ingrese código postal';
        }

        if (paso === 3) {
            const d = formData.empresa;
            if (!d.nombre_fantasia?.trim()) nuevosErrores['empresa.nombre_fantasia'] = 'Ingrese nombre de fantasía';
            if (!d.razon_social?.trim()) nuevosErrores['empresa.razon_social'] = 'Ingrese razón social';
            if (!d.cuit?.trim()) nuevosErrores['empresa.cuit'] = 'Ingrese CUIT o DNI';
            if (!d.direccion_fiscal?.trim()) nuevosErrores['empresa.direccion_fiscal'] = 'Ingrese dirección fiscal';
            if (!d.codigo_postal_fiscal?.trim()) nuevosErrores['empresa.codigo_postal_fiscal'] = 'Ingrese código postal';
            if (!d.localidad_fiscal_id) nuevosErrores['empresa.localidad_fiscal_id'] = 'Seleccione localidad';
            if (!d.telefono_fiscal?.trim()) nuevosErrores['empresa.telefono_fiscal'] = 'Ingrese teléfono';
            if (!d.email_fiscal?.trim()) nuevosErrores['empresa.email_fiscal'] = 'Ingrese email';
            if (!d.rubro_id) nuevosErrores['empresa.rubro_id'] = 'Seleccione rubro';
            if (!d.cat_fiscal_id) nuevosErrores['empresa.cat_fiscal_id'] = 'Seleccione categoría fiscal';
            if (!d.plataforma_id) nuevosErrores['empresa.plataforma_id'] = 'Seleccione plataforma';
            if (!d.nombre_flota?.trim()) nuevosErrores['empresa.nombre_flota'] = 'Ingrese nombre de flota';
        }

        setErrores(nuevosErrores);
        if (Object.keys(nuevosErrores).length > 0) {
            toast.error(Object.values(nuevosErrores)[0]);
            return false;
        }
        return true;
    };

    const guardarLead = async () => {
        if (!validarPaso(1)) return false;
        
        const leadId = lead?.id;
        const url = leadId ? `/comercial/utils/empresa/paso1/${leadId}` : '/comercial/utils/empresa/paso1';
        const method = leadId ? 'PUT' : 'POST';
        
        const dataToSend: any = {
            nombre_completo: formData.lead.nombre_completo,
            genero: formData.lead.genero,
            telefono: formData.lead.telefono,
            email: formData.lead.email,
            localidad_id: formData.lead.localidad_id,
            rubro_id: formData.lead.rubro_id,
            origen_id: formData.lead.origen_id,
        };
        
        if (esComercial && usuario?.comercial?.prefijo_id) {
            dataToSend.prefijo_id = usuario.comercial.prefijo_id;
        } else if (mostrarSelectorComercial && formData.lead.prefijo_id) {
            dataToSend.prefijo_id = parseInt(formData.lead.prefijo_id);
        }
        
        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(dataToSend)
            });
            const result = await response.json();
            
            if (response.ok && result.success) {
                const nuevoLeadId = result.lead_id;
                toast.success(leadId ? 'Datos actualizados' : 'Lead creado');
                
                if (nuevoLeadId) {
                    window.sessionStorage.setItem('temp_lead_id', String(nuevoLeadId));
                    window.__tempLeadId = nuevoLeadId;
                }
                
                setPasosCompletados(prev => ({ ...prev, lead: true }));
                
                if (nuevoLeadId && !leadId) {
                    await cargarDatosDesdeAPI(nuevoLeadId);
                }
                return true;
            }
            throw new Error(result.error || 'Error al guardar');
        } catch (error) {
            return false;
        }
    };

    const guardarContacto = async () => {
        if (!validarPaso(2)) return false;
        
        // 🔥 OBTENER LEAD ID DE LA PROP O DEL SESSION STORAGE
        let leadId = lead?.id;
        if (!leadId) {
            const tempLeadId = window.sessionStorage.getItem('temp_lead_id');
            if (tempLeadId) {
                leadId = parseInt(tempLeadId);
            }
        }
        
        if (!leadId) {
            toast.error('No se pudo identificar el lead');
            return false;
        }
        
        const esUpdate = !!contactoId;
        const url = esUpdate ? `/comercial/utils/empresa/paso2/${contactoId}` : '/comercial/utils/empresa/paso2';
        
        try {
            const response = await fetch(url, {
                method: esUpdate ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ lead_id: leadId, ...formData.contacto })
            });
            const result = await response.json();
            
            if (result.success) {
                setContactoId(result.contacto_id);
                window.sessionStorage.setItem('temp_contacto_id', String(result.contacto_id));
                toast.success(esUpdate ? 'Datos actualizados' : 'Datos guardados');
                setPasosCompletados(prev => ({ ...prev, contacto: true }));
                
                if (leadId) {
                    await cargarDatosDesdeAPI(leadId);
                }
                return true;
            }
            throw new Error(result.error || 'Error al guardar');
        } catch (error) {
            console.error('Error guardando contacto:', error);
            toast.error('Error al guardar datos personales');
            return false;
        }
    };

    const guardarEmpresa = async () => {
        if (!validarPaso(3)) return false;
        
        // 🔥 OBTENER LEAD ID DE LA PROP O DEL SESSION STORAGE
        let leadId = lead?.id;
        if (!leadId) {
            const tempLeadId = window.sessionStorage.getItem('temp_lead_id');
            if (tempLeadId) {
                leadId = parseInt(tempLeadId);
            }
        }
        
        if (!leadId || !contactoId) {
            toast.error('Faltan datos del lead o contacto');
            return false;
        }
        
        const esUpdate = !!empresaId;
        const url = esUpdate ? `/comercial/utils/empresa/paso3/${empresaId}` : '/comercial/utils/empresa/paso3';
        
        try {
            const response = await fetch(url, {
                method: esUpdate ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({
                    presupuesto_id: presupuestoId,
                    lead_id: leadId,
                    contacto_id: contactoId,
                    ...formData.empresa
                })
            });
            const result = await response.json();
            
            if (result.success) {
                const empresaCreada = {
                    empresa_id: result.empresa_id,
                    lead_id: result.lead_id,
                    ...formData.empresa,
                    contacto_id: contactoId,
                };
                toast.success(esUpdate ? 'Datos actualizados' : 'Empresa creada');
                const irAContrato = redirectTo === 'contrato';
                onClose(true, irAContrato, empresaCreada);
                return true;
            }
            throw new Error(result.error || 'Error al guardar');
        } catch {
            toast.error('Error al guardar datos de la empresa');
            return false;
        }
    };

    const handleSiguiente = async () => {
        setIsSubmitting(true);
        if (pasoActual === 1) await guardarLead();
        if (pasoActual === 2) await guardarContacto();
        setIsSubmitting(false);
    };

    const handleSubmitFinal = async () => {
        setIsSubmitting(true);
        await guardarEmpresa();
        setIsSubmitting(false);
    };

    const handleChangeLead = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, lead: { ...prev.lead, [field]: value } }));
        if (errores[`lead.${field}`]) {
            const newErrors = { ...errores };
            delete newErrors[`lead.${field}`];
            setErrores(newErrors);
        }
    };

    const handleChangeContacto = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, contacto: { ...prev.contacto, [field]: value } }));
        if (errores[`contacto.${field}`]) {
            const newErrors = { ...errores };
            delete newErrors[`contacto.${field}`];
            setErrores(newErrors);
        }
    };

    const handleChangeEmpresa = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, empresa: { ...prev.empresa, [field]: value } }));
        if (errores[`empresa.${field}`]) {
            const newErrors = { ...errores };
            delete newErrors[`empresa.${field}`];
            setErrores(newErrors);
        }
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose(false);
    };

    if (!isMounted && !isOpen) return null;

    const todoCompletado = pasosCompletados.lead && pasosCompletados.contacto && pasosCompletados.empresa;

    return (
        <div className={`fixed inset-0 z-50 overflow-y-auto transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="fixed inset-0 bg-black/50" onClick={handleOverlayClick} />
            <div className="flex min-h-full items-center justify-center p-4">
                <div className={`relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 transform ${isOpen ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'}`}>
                    
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-100">
                                <Building className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {modoCompletar ? 'Completar datos para contrato' : 'Alta de Empresa'}
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    {cargandoDatos ? 'Verificando datos...' : 
                                     todoCompletado ? '✅ Todos los datos están completos' : 
                                     `📋 Paso ${pasoActual} de 3: ${PASOS.find(p => p.id === pasoActual)?.nombre}`}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => onClose(false)} className="p-2 text-gray-400 hover:text-gray-600">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            {PASOS.map((paso, index) => {
                                const Icon = paso.icon;
                                const isCompleted = pasosCompletados[paso.key as keyof typeof pasosCompletados];
                                const isActive = paso.id === pasoActual;
                                
                                return (
                                    <React.Fragment key={paso.id}>
                                        <div className="flex items-center">
                                            <div className={`
                                                flex items-center justify-center w-10 h-10 rounded-full transition-colors
                                                ${isCompleted ? 'bg-green-500 text-white' : ''}
                                                ${isActive && !isCompleted ? 'bg-blue-600 text-white' : ''}
                                                ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-400' : ''}
                                            `}>
                                                {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                                            </div>
                                            <span className="ml-2 text-sm font-medium hidden sm:block">{paso.nombre}</span>
                                        </div>
                                        {index < PASOS.length - 1 && (
                                            <div className={`flex-1 h-0.5 mx-4 transition-colors ${isCompleted ? 'bg-green-500' : 'bg-gray-200'}`} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    <div className="modal-content flex-1 overflow-y-auto p-6">
                        {cargandoDatos ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                                <p className="text-gray-600">Verificando datos existentes...</p>
                            </div>
                        ) : (
                            <>
                                {pasoActual === 1 && (
                                    <>
                                        {mostrarSelectorComercial && (
                                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 mb-6">
                                                <div className="flex items-start gap-3">
                                                    <UserPlus className="h-5 w-5 text-yellow-600 mt-0.5" />
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-yellow-800 mb-2">Asignar Comercial</h4>
                                                        <select
                                                            value={formData.lead.prefijo_id}
                                                            onChange={(e) => handleChangeLead('prefijo_id', e.target.value)}
                                                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                        >
                                                            <option value="">Seleccionar comercial</option>
                                                            {comerciales.map(c => (
                                                                <option key={c.prefijo_id} value={c.prefijo_id}>{c.nombre}</option>
                                                            ))}
                                                        </select>
                                                        {errores['lead.prefijo_id'] && (
                                                            <p className="text-xs text-red-600 mt-1">{errores['lead.prefijo_id']}</p>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        )}
                                        <Paso1DatosLead
                                            data={formData.lead}
                                            origenes={origenes}
                                            rubros={rubros}
                                            provincias={provincias}
                                            onChange={handleChangeLead}
                                            errores={errores}
                                            localidadInicial={lead?.localidad?.nombre || ''}
                                            provinciaInicial={lead?.localidad?.provincia_id || ''}
                                            esComercial={esComercial}
                                            usuario={usuario}
                                        />
                                    </>
                                )}
                                {pasoActual === 2 && (
                                    <Paso2DatosContacto
                                        data={formData.contacto}
                                        tiposResponsabilidad={tiposResponsabilidad}
                                        tiposDocumento={tiposDocumento}
                                        nacionalidades={nacionalidades}
                                        onChange={handleChangeContacto}
                                        errores={errores}
                                    />
                                )}
                                {pasoActual === 3 && (
                                    <Paso3DatosEmpresa
                                        data={formData.empresa}
                                        rubros={rubros}
                                        categoriasFiscales={categoriasFiscales}
                                        plataformas={plataformas}
                                        provincias={provincias}
                                        onChange={handleChangeEmpresa}
                                        errores={errores}
                                        localidadInicial=""
                                        provinciaInicial=""
                                    />
                                )}
                            </>
                        )}
                    </div>

                    <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-white flex-shrink-0">
                        <button
                            onClick={() => pasoActual === 1 ? onClose(false) : setPasoActual(pasoActual - 1)}
                            disabled={isSubmitting || cargandoDatos}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            {pasoActual === 1 ? 'Cancelar' : <><ChevronLeft className="h-4 w-4 inline mr-1" /> Anterior</>}
                        </button>
                        
                        {pasoActual < 3 ? (
                            <button
                                onClick={handleSiguiente}
                                disabled={isSubmitting || cargandoDatos}
                                className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSubmitting ? <Loader className="h-4 w-4 animate-spin" /> : <>Siguiente <ChevronRight className="h-4 w-4" /></>}
                            </button>
                        ) : (
                            <button
                                onClick={handleSubmitFinal}
                                disabled={isSubmitting || cargandoDatos}
                                className="px-6 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSubmitting ? <Loader className="h-4 w-4 animate-spin" /> : <><Check className="h-4 w-4" /> {todoCompletado ? 'Finalizar' : 'Crear Empresa'}</>}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}