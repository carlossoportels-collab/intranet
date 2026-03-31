// resources/js/components/empresa/AltaEmpresaModal.tsx

import { X, User, Building, Check, ChevronLeft, ChevronRight, Loader, UserPlus } from 'lucide-react';
import React, { useState, useEffect, useCallback, useRef } from 'react';

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
    pasoInicial?: number;
}

const PASOS = [
    { id: 1, nombre: 'Datos del Lead', icon: User, key: 'lead' },
    { id: 2, nombre: 'Datos Personales', icon: User, key: 'contacto' },
    { id: 3, nombre: 'Datos de Empresa', icon: Building, key: 'empresa' },
];

// Helper para verificar si un campo está completo
const isFieldComplete = (value: any): boolean => {
    if (value === undefined || value === null) return false;
    if (typeof value === 'string') return value.trim() !== '';
    if (typeof value === 'number') return value !== 0 && !isNaN(value);
    if (typeof value === 'boolean') return value === true;
    if (Array.isArray(value)) return value.length > 0;
    return !!value;
};

// Helper para convertir valor a número o string vacío
const toNumberOrEmpty = (value: any): number | "" => {
    if (value === undefined || value === null || value === '') return "";
    const num = Number(value);
    return isNaN(num) ? "" : num;
};

// Helper para determinar qué pasos están completos
const checkStepsCompletion = (leadData: any, contactoData: any, empresaData: any) => {
    // Paso 1: Lead
    const leadComplete = leadData && 
        isFieldComplete(leadData.nombre_completo) &&
        isFieldComplete(leadData.telefono) &&
        isFieldComplete(leadData.email) &&
        isFieldComplete(leadData.localidad_id) &&
        isFieldComplete(leadData.rubro_id) &&
        isFieldComplete(leadData.origen_id);

    // Paso 2: Contacto
    const contactoComplete = contactoData && 
        isFieldComplete(contactoData.tipo_responsabilidad_id) &&
        isFieldComplete(contactoData.tipo_documento_id) &&
        isFieldComplete(contactoData.nro_documento) &&
        isFieldComplete(contactoData.nacionalidad_id) &&
        isFieldComplete(contactoData.fecha_nacimiento) &&
        isFieldComplete(contactoData.direccion_personal) &&
        isFieldComplete(contactoData.codigo_postal_personal);

    // Paso 3: Empresa
    const empresaComplete = empresaData && 
        isFieldComplete(empresaData.nombre_fantasia) &&
        isFieldComplete(empresaData.razon_social) &&
        isFieldComplete(empresaData.cuit) &&
        isFieldComplete(empresaData.direccion_fiscal) &&
        isFieldComplete(empresaData.codigo_postal_fiscal) &&
        isFieldComplete(empresaData.localidad_fiscal_id) &&
        isFieldComplete(empresaData.telefono_fiscal) &&
        isFieldComplete(empresaData.email_fiscal) &&
        isFieldComplete(empresaData.rubro_id) &&
        isFieldComplete(empresaData.cat_fiscal_id) &&
        isFieldComplete(empresaData.plataforma_id) &&
        isFieldComplete(empresaData.nombre_flota);

    return { lead: leadComplete, contacto: contactoComplete, empresa: empresaComplete };
};

export default function AltaEmpresaModal({ 
    isOpen, 
    onClose, 
    presupuestoId, 
    lead: propLead,
    origenes = [],
    rubros = [],
    provincias = [],
    modoCompletar = false,
    datosExistentes: propDatosExistentes,
    usuario,
    comerciales = [],
    hayComerciales = false,
    redirectTo = 'contrato',
    pasoInicial: propPasoInicial = 1
}: Props) {
    const [isMounted, setIsMounted] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cargandoDatos, setCargandoDatos] = useState(true);
    const toast = useToast();
    
    const isInitializedRef = useRef(false);
    const abortControllerRef = useRef<AbortController | null>(null);

    const [tiposResponsabilidad, setTiposResponsabilidad] = useState<TipoResponsabilidad[]>([]);
    const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([]);
    const [nacionalidades, setNacionalidades] = useState<Nacionalidad[]>([]);
    const [categoriasFiscales, setCategoriasFiscales] = useState<CategoriaFiscal[]>([]);
    const [plataformas, setPlataformas] = useState<Plataforma[]>([]);

    const esComercial = usuario?.rol_id === 5 || usuario?.comercial?.es_comercial === true;
    const mostrarSelectorComercial = !esComercial && hayComerciales && !propLead?.prefijo_id;
    

    const [formData, setFormData] = useState({
        lead: {
            prefijo_id: '',
            nombre_completo: '',
            genero: 'no_especifica',
            telefono: '',
            email: '',
            localidad_id: '',
            rubro_id: '',
            origen_id: '',
        },
        contacto: {
            tipo_responsabilidad_id: '' as number | "",
            tipo_documento_id: '' as number | "",
            nro_documento: '',
            nacionalidad_id: '' as number | "",
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
            localidad_fiscal_id: '' as number | "",
            telefono_fiscal: '',
            email_fiscal: '',
            rubro_id: '' as number | "",
            cat_fiscal_id: '' as number | "",
            plataforma_id: '' as number | "",
            nombre_flota: '',
        }
    });

    const [pasosCompletados, setPasosCompletados] = useState({ lead: false, contacto: false, empresa: false });
    const [pasoActual, setPasoActual] = useState(1);
    const [errores, setErrores] = useState<Record<string, string>>({});
    const [contactoId, setContactoId] = useState<number | null>(null);
    const [empresaId, setEmpresaId] = useState<number | null>(null);
    const [leadId, setLeadId] = useState<number | null>(propLead?.id || null);

    // ============================================
    // FUNCIÓN PRINCIPAL DE INICIALIZACIÓN
    // ============================================
    const initializeModal = useCallback(async () => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
        }
        
        abortControllerRef.current = new AbortController();
        
        setCargandoDatos(true);
        setErrores({});
        setIsSubmitting(false);
        isInitializedRef.current = false;
        
        const defaultLeadData = {
            prefijo_id: (propLead?.prefijo_id ? String(propLead.prefijo_id) : '') || 
                        (esComercial && usuario?.comercial?.prefijo_id ? String(usuario.comercial.prefijo_id) : ''),
            nombre_completo: propLead?.nombre_completo || '',
            genero: propLead?.genero || 'no_especifica',
            telefono: propLead?.telefono || '',
            email: propLead?.email || '',
            localidad_id: propLead?.localidad_id ? String(propLead.localidad_id) : '',
            rubro_id: propLead?.rubro_id ? String(propLead.rubro_id) : '',
            origen_id: propLead?.origen_id ? String(propLead.origen_id) : '',
        };
        
        // Si tenemos datosExistentes del backend
        if (propDatosExistentes) {
            const { contacto: contactoExistente, empresa: empresaExistente } = propDatosExistentes;
            
            setFormData({
                lead: defaultLeadData,
                contacto: {
                    tipo_responsabilidad_id: toNumberOrEmpty(contactoExistente?.tipo_responsabilidad_id),
                    tipo_documento_id: toNumberOrEmpty(contactoExistente?.tipo_documento_id),
                    nro_documento: contactoExistente?.nro_documento || '',
                    nacionalidad_id: toNumberOrEmpty(contactoExistente?.nacionalidad_id),
                    fecha_nacimiento: contactoExistente?.fecha_nacimiento || '',
                    direccion_personal: contactoExistente?.direccion_personal || '',
                    codigo_postal_personal: contactoExistente?.codigo_postal_personal || '',
                },
                empresa: {
                    nombre_fantasia: empresaExistente?.nombre_fantasia || '',
                    razon_social: empresaExistente?.razon_social || '',
                    cuit: empresaExistente?.cuit || '',
                    direccion_fiscal: empresaExistente?.direccion_fiscal || '',
                    codigo_postal_fiscal: empresaExistente?.codigo_postal_fiscal || '',
                    localidad_fiscal_id: toNumberOrEmpty(empresaExistente?.localidad_fiscal_id),
                    telefono_fiscal: empresaExistente?.telefono_fiscal || '',
                    email_fiscal: empresaExistente?.email_fiscal || '',
                    rubro_id: toNumberOrEmpty(empresaExistente?.rubro_id),
                    cat_fiscal_id: toNumberOrEmpty(empresaExistente?.cat_fiscal_id),
                    plataforma_id: toNumberOrEmpty(empresaExistente?.plataforma_id),
                    nombre_flota: empresaExistente?.nombre_flota || '',
                }
            });
            
            setContactoId(contactoExistente?.id || null);
            setEmpresaId(empresaExistente?.id || null);
            
            const completados = checkStepsCompletion(
                defaultLeadData,
                contactoExistente,
                empresaExistente
            );
            setPasosCompletados(completados);
            
            let paso = propPasoInicial;
            if (paso === 2 && completados.contacto) paso = 3;
            if (paso === 3 && completados.empresa) paso = 1;
            if (paso === 1 && completados.lead && !completados.contacto) paso = 2;
            if (paso === 2 && completados.contacto && !completados.empresa) paso = 3;
            
            setPasoActual(paso);
            setCargandoDatos(false);
            isInitializedRef.current = true;
            return;
        }
        
        // Si tenemos leadId pero no datosExistentes
        if (propLead?.id) {
            try {
                const response = await fetch(`/comercial/utils/empresa/verificar-datos/${propLead.id}`, {
                    signal: abortControllerRef.current?.signal,
                    headers: {
                        'Accept': 'application/json',
                        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || ''
                    }
                });
                
                if (response.ok) {
                    const result = await response.json();
                    if (result.success && result.data) {
                        const { contacto, empresa } = result.data;
                        
                        setFormData({
                            lead: defaultLeadData,
                            contacto: {
                                tipo_responsabilidad_id: toNumberOrEmpty(contacto?.tipo_responsabilidad_id),
                                tipo_documento_id: toNumberOrEmpty(contacto?.tipo_documento_id),
                                nro_documento: contacto?.nro_documento || '',
                                nacionalidad_id: toNumberOrEmpty(contacto?.nacionalidad_id),
                                fecha_nacimiento: contacto?.fecha_nacimiento || '',
                                direccion_personal: contacto?.direccion_personal || '',
                                codigo_postal_personal: contacto?.codigo_postal_personal || '',
                            },
                            empresa: {
                                nombre_fantasia: empresa?.nombre_fantasia || '',
                                razon_social: empresa?.razon_social || '',
                                cuit: empresa?.cuit || '',
                                direccion_fiscal: empresa?.direccion_fiscal || '',
                                codigo_postal_fiscal: empresa?.codigo_postal_fiscal || '',
                                localidad_fiscal_id: toNumberOrEmpty(empresa?.localidad_fiscal_id),
                                telefono_fiscal: empresa?.telefono_fiscal || '',
                                email_fiscal: empresa?.email_fiscal || '',
                                rubro_id: toNumberOrEmpty(empresa?.rubro_id),
                                cat_fiscal_id: toNumberOrEmpty(empresa?.cat_fiscal_id),
                                plataforma_id: toNumberOrEmpty(empresa?.plataforma_id),
                                nombre_flota: empresa?.nombre_flota || '',
                            }
                        });
                        
                        setContactoId(contacto?.id || null);
                        setEmpresaId(empresa?.id || null);
                        
                        const completados = checkStepsCompletion(
                            defaultLeadData,
                            contacto,
                            empresa
                        );
                        setPasosCompletados(completados);
                        
                        let paso = 1;
                        if (!completados.lead) paso = 1;
                        else if (!completados.contacto) paso = 2;
                        else if (!completados.empresa) paso = 3;
                        
                        setPasoActual(paso);
                        setCargandoDatos(false);
                        isInitializedRef.current = true;
                        return;
                    }
                }
            } catch (error) {
                if ((error as Error).name !== 'AbortError') {
                    console.error('Error fetching data:', error);
                }
            }
        }
        
        // Caso: creación desde cero
        setFormData({
            lead: defaultLeadData,
            contacto: {
                tipo_responsabilidad_id: "",
                tipo_documento_id: "",
                nro_documento: '',
                nacionalidad_id: "",
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
                localidad_fiscal_id: "",
                telefono_fiscal: '',
                email_fiscal: '',
                rubro_id: "",
                cat_fiscal_id: "",
                plataforma_id: "",
                nombre_flota: '',
            }
        });
        
        setContactoId(null);
        setEmpresaId(null);
        
        const completados = checkStepsCompletion(defaultLeadData, null, null);
        setPasosCompletados(completados);
        setPasoActual(1);
        setCargandoDatos(false);
        isInitializedRef.current = true;
        
    }, [propLead, propDatosExistentes, propPasoInicial, esComercial, usuario]);

    // ... resto del código igual (useEffects, validarPaso, guardarLead, guardarContacto, guardarEmpresa, handlers, render) ...
    // Mantén todo lo demás igual, solo asegúrate de que en los onChange de los selects se use Number() o toNumberOrEmpty

    // ============================================
    // EFECTO PARA CARGAR SELECTS
    // ============================================
    useEffect(() => {
        const loadSelects = async () => {
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
            } catch (error) {
                console.error('Error loading selects:', error);
            }
        };
        loadSelects();
    }, []);

    // ============================================
    // EFECTO PARA INICIALIZAR MODAL AL ABRIR
    // ============================================
    useEffect(() => {
        if (isOpen) {
            setIsMounted(true);
            document.body.style.overflow = 'hidden';
            initializeModal();
        } else {
            const timer = setTimeout(() => {
                setIsMounted(false);
            }, 300);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
        
        return () => {
            if (abortControllerRef.current) {
                abortControllerRef.current.abort();
            }
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, initializeModal]);

    // ============================================
    // VALIDACIÓN POR PASO
    // ============================================
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
            if (!d.tipo_responsabilidad_id) nuevosErrores['contacto.tipo_responsabilidad_id'] = 'Seleccione tipo de responsabilidad';
            if (!d.tipo_documento_id) nuevosErrores['contacto.tipo_documento_id'] = 'Seleccione tipo de documento';
            if (!d.nro_documento?.trim()) nuevosErrores['contacto.nro_documento'] = 'Ingrese número de documento';
            if (!d.nacionalidad_id) nuevosErrores['contacto.nacionalidad_id'] = 'Seleccione nacionalidad';
            if (!d.fecha_nacimiento) nuevosErrores['contacto.fecha_nacimiento'] = 'Ingrese fecha de nacimiento';
            if (!d.direccion_personal?.trim()) nuevosErrores['contacto.direccion_personal'] = 'Ingrese dirección personal';
            if (!d.codigo_postal_personal?.trim()) nuevosErrores['contacto.codigo_postal_personal'] = 'Ingrese código postal';
        }

        if (paso === 3) {
            const d = formData.empresa;
            if (!d.nombre_fantasia?.trim()) nuevosErrores['empresa.nombre_fantasia'] = 'Ingrese nombre de fantasía';
            if (!d.razon_social?.trim()) nuevosErrores['empresa.razon_social'] = 'Ingrese razón social';
            if (!d.cuit?.trim()) nuevosErrores['empresa.cuit'] = 'Ingrese CUIT o DNI';
            if (!d.direccion_fiscal?.trim()) nuevosErrores['empresa.direccion_fiscal'] = 'Ingrese dirección fiscal';
            if (!d.codigo_postal_fiscal?.trim()) nuevosErrores['empresa.codigo_postal_fiscal'] = 'Ingrese código postal fiscal';
            if (!d.localidad_fiscal_id) nuevosErrores['empresa.localidad_fiscal_id'] = 'Seleccione localidad fiscal';
            if (!d.telefono_fiscal?.trim()) nuevosErrores['empresa.telefono_fiscal'] = 'Ingrese teléfono fiscal';
            if (!d.email_fiscal?.trim()) nuevosErrores['empresa.email_fiscal'] = 'Ingrese email fiscal';
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

    // ============================================
    // HANDLERS DE GUARDADO
    // ============================================
    const guardarLead = async () => {
        if (!validarPaso(1)) return false;
        
        const url = leadId ? `/comercial/utils/empresa/paso1/${leadId}` : '/comercial/utils/empresa/paso1';
        const method = leadId ? 'PUT' : 'POST';
        
        const dataToSend: any = {
        nombre_completo: formData.lead.nombre_completo,
        genero: formData.lead.genero,
        telefono: formData.lead.telefono,
        email: formData.lead.email,
        localidad_id: formData.lead.localidad_id ? Number(formData.lead.localidad_id) : null,
        rubro_id: formData.lead.rubro_id ? Number(formData.lead.rubro_id) : null,
        origen_id: formData.lead.origen_id ? Number(formData.lead.origen_id) : null,
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
                if (result.lead_id) {
                    setLeadId(result.lead_id);
                    window.sessionStorage.setItem('temp_lead_id', String(result.lead_id));
                }
                toast.success(leadId ? 'Datos del lead actualizados' : 'Lead creado correctamente');
                setPasosCompletados(prev => ({ ...prev, lead: true }));
                setPasoActual(2);
                return true;
            }
            
            if (result.errors) {
                const erroresBackend: Record<string, string> = {};
                Object.keys(result.errors).forEach(key => {
                    erroresBackend[`lead.${key}`] = result.errors[key][0];
                });
                setErrores(prev => ({ ...prev, ...erroresBackend }));
                toast.error(Object.values(erroresBackend)[0]);
            }
            return false;
        } catch (error) {
            console.error('Error guardando lead:', error);
            toast.error('Error al guardar los datos del lead');
            return false;
        }
    };

    const guardarContacto = async () => {
        if (!validarPaso(2)) return false;
        
        let currentLeadId = leadId;
        if (!currentLeadId) {
            const tempLeadId = window.sessionStorage.getItem('temp_lead_id');
            if (tempLeadId) currentLeadId = parseInt(tempLeadId);
        }
        
        if (!currentLeadId) {
            toast.error('No se pudo identificar el lead');
            return false;
        }
        
        const esUpdate = !!contactoId;
        const url = esUpdate ? `/comercial/utils/empresa/paso2/${contactoId}` : '/comercial/utils/empresa/paso2';
        
        // Convertir valores a número para enviar al backend
        const contactoToSend = {
            ...formData.contacto,
            tipo_responsabilidad_id: formData.contacto.tipo_responsabilidad_id ? Number(formData.contacto.tipo_responsabilidad_id) : null,
            tipo_documento_id: formData.contacto.tipo_documento_id ? Number(formData.contacto.tipo_documento_id) : null,
            nacionalidad_id: formData.contacto.nacionalidad_id ? Number(formData.contacto.nacionalidad_id) : null,
        };
        
        try {
            const response = await fetch(url, {
                method: esUpdate ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json'
                },
                body: JSON.stringify({ lead_id: currentLeadId, ...contactoToSend })
            });
            const result = await response.json();
            
            if (result.success) {
                if (result.contacto_id) {
                    setContactoId(result.contacto_id);
                }
                toast.success(esUpdate ? 'Datos personales actualizados' : 'Datos personales guardados');
                setPasosCompletados(prev => ({ ...prev, contacto: true }));
                setPasoActual(3);
                return true;
            }
            
            if (result.errors) {
                const erroresBackend: Record<string, string> = {};
                Object.keys(result.errors).forEach(key => {
                    erroresBackend[`contacto.${key}`] = result.errors[key][0];
                });
                setErrores(prev => ({ ...prev, ...erroresBackend }));
                toast.error(Object.values(erroresBackend)[0]);
            }
            return false;
        } catch (error) {
            console.error('Error guardando contacto:', error);
            toast.error('Error al guardar datos personales');
            return false;
        }
    };

    const guardarEmpresa = async () => {
        if (!validarPaso(3)) return false;
        
        let currentLeadId = leadId;
        if (!currentLeadId) {
            const tempLeadId = window.sessionStorage.getItem('temp_lead_id');
            if (tempLeadId) currentLeadId = parseInt(tempLeadId);
        }
        
        if (!currentLeadId || !contactoId) {
            toast.error('Faltan datos del lead o contacto');
            return false;
        }
        
        const esUpdate = !!empresaId;
        const url = esUpdate ? `/comercial/utils/empresa/paso3/${empresaId}` : '/comercial/utils/empresa/paso3';
        const csrfToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        
        // Convertir valores a número para enviar al backend
        const empresaToSend = {
            ...formData.empresa,
            localidad_fiscal_id: formData.empresa.localidad_fiscal_id ? Number(formData.empresa.localidad_fiscal_id) : null,
            rubro_id: formData.empresa.rubro_id ? Number(formData.empresa.rubro_id) : null,
            cat_fiscal_id: formData.empresa.cat_fiscal_id ? Number(formData.empresa.cat_fiscal_id) : null,
            plataforma_id: formData.empresa.plataforma_id ? Number(formData.empresa.plataforma_id) : null,
        };
        
        try {
            const response = await fetch(url, {
                method: esUpdate ? 'PUT' : 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': csrfToken || '',
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                },
                credentials: 'same-origin',
                body: JSON.stringify({
                    presupuesto_id: presupuestoId,
                    lead_id: currentLeadId,
                    contacto_id: contactoId,
                    ...empresaToSend
                })
            });
            
            if (response.status === 419) {
                toast.error('La sesión expiró. Recargando la página...');
                setTimeout(() => window.location.reload(), 1000);
                return false;
            }
            
            const result = await response.json();
            
            if (result.success) {
                const empresaCreada = {
                    empresa_id: result.empresa_id,
                    lead_id: result.lead_id,
                    ...formData.empresa,
                    contacto_id: contactoId,
                };
                toast.success(esUpdate ? 'Datos de empresa actualizados' : 'Empresa creada exitosamente');
                const irAContrato = redirectTo === 'contrato';
                onClose(true, irAContrato, empresaCreada);
                return true;
            }
            
            if (result.errors) {
                const erroresBackend: Record<string, string> = {};
                Object.keys(result.errors).forEach(key => {
                    erroresBackend[`empresa.${key}`] = result.errors[key][0];
                });
                setErrores(prev => ({ ...prev, ...erroresBackend }));
                toast.error(Object.values(erroresBackend)[0]);
            }
            return false;
        } catch (error) {
            console.error('Error guardando empresa:', error);
            toast.error('Error al guardar datos de la empresa');
            return false;
        }
    };

    // ============================================
    // HANDLERS DE NAVEGACIÓN
    // ============================================
    const handleSiguiente = async () => {
        setIsSubmitting(true);
        let success = false;
        
        if (pasoActual === 1) success = await guardarLead();
        else if (pasoActual === 2) success = await guardarContacto();
        
        setIsSubmitting(false);
    };

    const handleSubmitFinal = async () => {
        setIsSubmitting(true);
        await guardarEmpresa();
        setIsSubmitting(false);
    };

    // ============================================
    // HANDLERS DE CAMBIOS EN FORMULARIOS
    // ============================================
    const handleChangeLead = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, lead: { ...prev.lead, [field]: value } }));
        if (errores[`lead.${field}`]) {
            const newErrors = { ...errores };
            delete newErrors[`lead.${field}`];
            setErrores(newErrors);
        }
        if (pasosCompletados.lead) {
            setPasosCompletados(prev => ({ ...prev, lead: false }));
        }
    };

    const handleChangeContacto = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, contacto: { ...prev.contacto, [field]: value } }));
        if (errores[`contacto.${field}`]) {
            const newErrors = { ...errores };
            delete newErrors[`contacto.${field}`];
            setErrores(newErrors);
        }
        if (pasosCompletados.contacto) {
            setPasosCompletados(prev => ({ ...prev, contacto: false }));
        }
    };

    const handleChangeEmpresa = (field: string, value: any) => {
        setFormData(prev => ({ ...prev, empresa: { ...prev.empresa, [field]: value } }));
        if (errores[`empresa.${field}`]) {
            const newErrors = { ...errores };
            delete newErrors[`empresa.${field}`];
            setErrores(newErrors);
        }
        if (pasosCompletados.empresa) {
            setPasosCompletados(prev => ({ ...prev, empresa: false }));
        }
    };

    const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
        if (e.target === e.currentTarget) onClose(false);
    };

    // ============================================
    // RENDER
    // ============================================
    if (!isMounted && !isOpen) return null;

    const todoCompletado = pasosCompletados.lead && pasosCompletados.contacto && pasosCompletados.empresa;

    return (
        <div className={`fixed inset-0 z-50 overflow-y-auto transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div className="fixed inset-0 bg-black/50" onClick={handleOverlayClick} />
            <div className="flex min-h-full items-center justify-center p-4">
                <div className={`relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 transform ${isOpen ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'}`}>
                    
                    {/* Header */}
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

                    {/* Steps */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            {PASOS.map((paso, index) => {
                                const Icon = paso.icon;
                                const isCompleted = pasosCompletados[paso.key as keyof typeof pasosCompletados];
                                const isActive = paso.id === pasoActual;
                                
                                return (
                                    <React.Fragment key={paso.id}>
                                        <div className="flex items-center">
                                            <button
                                                onClick={() => {
                                                    if (isCompleted || paso.id === pasoActual || paso.id < pasoActual) {
                                                        setPasoActual(paso.id);
                                                    }
                                                }}
                                                className={`
                                                    flex items-center justify-center w-10 h-10 rounded-full transition-colors
                                                    ${isCompleted ? 'bg-green-500 text-white' : ''}
                                                    ${isActive && !isCompleted ? 'bg-blue-600 text-white' : ''}
                                                    ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-400' : ''}
                                                    ${(isCompleted || paso.id < pasoActual) ? 'cursor-pointer hover:opacity-80' : 'cursor-default'}
                                                `}
                                            >
                                                {isCompleted ? <Check className="h-5 w-5" /> : <Icon className="h-5 w-5" />}
                                            </button>
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

                    {/* Content */}
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
                                                            className={`w-full px-3 py-2 border rounded-md ${errores['lead.prefijo_id'] ? 'border-red-500' : 'border-gray-300'}`}
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
                                            localidadInicial={propLead?.localidad?.nombre || ''}
                                            provinciaInicial={propLead?.localidad?.provincia_id || ''}
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
                                        localidadInicial={(() => {
                                            if (propDatosExistentes?.empresa?.localidad_nombre) {
                                                return propDatosExistentes.empresa.localidad_nombre;
                                            }
                                            if (propLead?.localidad?.nombre && !formData.empresa.localidad_fiscal_id) {
                                                return propLead.localidad.nombre;
                                            }
                                            return '';
                                        })()}
                                        provinciaInicial={(() => {
                                            if (propDatosExistentes?.empresa?.provincia_id) {
                                                return String(propDatosExistentes.empresa.provincia_id);
                                            }
                                            if (propLead?.localidad?.provincia_id && !formData.empresa.localidad_fiscal_id) {
                                                return String(propLead.localidad.provincia_id);
                                            }
                                            return '';
                                        })()}
                                    />
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
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