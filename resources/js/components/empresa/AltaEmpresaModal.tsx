// resources/js/components/empresa/AltaEmpresaModal.tsx
import { router } from '@inertiajs/react';
import { X, User, Building, Check, ChevronLeft, ChevronRight, Loader, AlertCircle, UserPlus } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { useToast } from '@/contexts/ToastContext';
import { 
    DatosLeadForm,
    DatosContactoForm,
    DatosEmpresaForm,
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

interface Props {
    isOpen: boolean;
    onClose: (contratoGuardado?: boolean, irAContrato?: boolean) => void;
    presupuestoId: number | null;
    lead: Lead | null;
    origenes?: Origen[];
    rubros?: Rubro[];
    provincias?: Provincia[];
    pasoInicial?: number;
    esCliente?: boolean;
    modoCompletar?: boolean;
    datosExistentes?: {
        empresa?: any;
        contacto?: any;
    };
    usuario?: any;
    comerciales?: Comercial[];
    hayComerciales?: boolean;
}

const PASOS = [
    { id: 1, nombre: 'Datos del Lead', icon: User },
    { id: 2, nombre: 'Datos Personales', icon: User },
    { id: 3, nombre: 'Datos de Empresa', icon: Building },
];

export default function AltaEmpresaModal({ 
    isOpen, 
    onClose, 
    presupuestoId, 
    lead,
    origenes = [],
    rubros = [],
    provincias = [],
    pasoInicial = 1,
    esCliente = false,
    modoCompletar = false,
    datosExistentes,
    usuario,
    comerciales = [],
    hayComerciales = false
}: Props) {
    const [isMounted, setIsMounted] = useState(false);
    const [pasoActual, setPasoActual] = useState(pasoInicial);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [cargandoDatos, setCargandoDatos] = useState(false);
    const [paso1Completado, setPaso1Completado] = useState(pasoInicial > 1);
    const [paso2Completado, setPaso2Completado] = useState(pasoInicial > 2);
    const [contactoId, setContactoId] = useState<number | null>(null);
    const toast = useToast();

    // Estados para los datos de los selects
    const [tiposResponsabilidad, setTiposResponsabilidad] = useState<TipoResponsabilidad[]>([]);
    const [tiposDocumento, setTiposDocumento] = useState<TipoDocumento[]>([]);
    const [nacionalidades, setNacionalidades] = useState<Nacionalidad[]>([]);
    const [categoriasFiscales, setCategoriasFiscales] = useState<CategoriaFiscal[]>([]);
    const [plataformas, setPlataformas] = useState<Plataforma[]>([]);

    // Determinar si el usuario es comercial
    const esComercial = usuario?.rol_id === 5;
    // Determinar si debe mostrar selector de comercial
    const mostrarSelectorComercial = !esComercial && hayComerciales && !lead?.prefijo_id;

    // Estado del formulario
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

    const [errores, setErrores] = useState<Record<string, string>>({});

    // Controlar montaje/desmontaje del modal
    useEffect(() => {
        if (isOpen) {
            setIsMounted(true);
            document.body.style.overflow = 'hidden';
            cargarDatosIniciales();
            
            // Configurar prefijo inicial
            let prefijoInicial = '';
            
            if (lead?.prefijo_id) {
                prefijoInicial = String(lead.prefijo_id);
            } else if (esComercial && usuario?.comercial?.prefijo_id) {
                prefijoInicial = String(usuario.comercial.prefijo_id);
            }
            
            setFormData(prev => ({
                ...prev,
                lead: {
                    ...prev.lead,
                    prefijo_id: prefijoInicial
                }
            }));
            
            if (pasoInicial > 1) {
                setPaso1Completado(true);
            }
            if (pasoInicial > 2) {
                setPaso2Completado(true);
            }
            setPasoActual(pasoInicial);
        } else {
            const timer = setTimeout(() => {
                setIsMounted(false);
                resetForm();
            }, 300);
            document.body.style.overflow = 'unset';
            return () => clearTimeout(timer);
        }
        
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen, pasoInicial, lead, esComercial, usuario]);

    // Cargar datos del lead cuando se abre
    useEffect(() => {
        if (isOpen && lead) {
            setFormData(prev => ({
                ...prev,
                lead: {
                    ...prev.lead,
                    nombre_completo: lead.nombre_completo || '',
                    genero: (lead.genero || 'no_especifica') as any,
                    telefono: lead.telefono || '',
                    email: lead.email || '',
                    localidad_id: lead.localidad_id || '',
                    rubro_id: lead.rubro_id || '',
                    origen_id: lead.origen_id || '',
                }
            }));
        }
    }, [isOpen, lead]);

    // Cargar datos existentes
    useEffect(() => {
        if (datosExistentes) {
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
            }
            
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
            }
        }
    }, [datosExistentes]);

    const resetForm = () => {
        setPasoActual(1);
        setPaso1Completado(false);
        setPaso2Completado(false);
        setContactoId(null);
        setFormData({
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
                tipo_responsabilidad_id: '',
                tipo_documento_id: '',
                nro_documento: '',
                nacionalidad_id: '',
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
                localidad_fiscal_id: '',
                telefono_fiscal: '',
                email_fiscal: '',
                rubro_id: '',
                cat_fiscal_id: '',
                plataforma_id: '',
                nombre_flota: '',
            }
        });
        setErrores({});
        window.sessionStorage.removeItem('temp_lead_id');
        window.sessionStorage.removeItem('temp_lead_data');
    };

    const cargarDatosIniciales = async () => {
        setCargandoDatos(true);
        
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
            console.error('Error cargando datos:', error);
            toast.error('Error al cargar datos necesarios');
        } finally {
            setCargandoDatos(false);
        }
    };

    const validarPaso = (paso: number): boolean => {
        const nuevosErrores: Record<string, string> = {};

        if (paso === 1) {
            const { lead: leadData } = formData;
            
            // Validar prefijo para usuarios no comerciales
            if (mostrarSelectorComercial && !leadData.prefijo_id) {
                nuevosErrores['lead.prefijo_id'] = 'Debe seleccionar un comercial para asignar el lead';
            }
            
            if (!leadData.nombre_completo || leadData.nombre_completo.trim() === '') {
                nuevosErrores['lead.nombre_completo'] = 'El nombre es requerido';
            } else if (leadData.nombre_completo.trim().length < 3) {
                nuevosErrores['lead.nombre_completo'] = 'El nombre debe tener al menos 3 caracteres';
            }
            
            if (!leadData.telefono || leadData.telefono.trim() === '') {
                nuevosErrores['lead.telefono'] = 'El teléfono es requerido';
            } else {
                const telefonoLimpio = leadData.telefono.replace(/\D/g, '');
                if (telefonoLimpio.length < 8) {
                    nuevosErrores['lead.telefono'] = 'El teléfono debe tener al menos 8 dígitos';
                }
            }
            
            if (!leadData.email || leadData.email.trim() === '') {
                nuevosErrores['lead.email'] = 'El email es requerido';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(leadData.email)) {
                nuevosErrores['lead.email'] = 'Email inválido (ej: nombre@dominio.com)';
            }
            
            if (!leadData.genero) {
                nuevosErrores['lead.genero'] = 'El género es requerido';
            }
            
            if (!leadData.localidad_id) {
                nuevosErrores['lead.localidad_id'] = 'La localidad es requerida (seleccione una de la lista)';
            }
            
            if (!leadData.rubro_id) {
                nuevosErrores['lead.rubro_id'] = 'El rubro es requerido';
            }
            
            if (!leadData.origen_id) {
                nuevosErrores['lead.origen_id'] = 'El origen de contacto es requerido';
            }
        }

        if (paso === 2) {
            const { contacto } = formData;
            
            if (!contacto.tipo_responsabilidad_id) {
                nuevosErrores['contacto.tipo_responsabilidad_id'] = 'Seleccione tipo de responsabilidad';
            }
            
            if (!contacto.tipo_documento_id) {
                nuevosErrores['contacto.tipo_documento_id'] = 'Seleccione tipo de documento';
            }
            
            if (!contacto.nro_documento || contacto.nro_documento.trim() === '') {
                nuevosErrores['contacto.nro_documento'] = 'Ingrese número de documento';
            } else if (contacto.nro_documento.trim().length < 7) {
                nuevosErrores['contacto.nro_documento'] = 'El número de documento debe tener al menos 7 caracteres';
            }
            
            if (!contacto.nacionalidad_id) {
                nuevosErrores['contacto.nacionalidad_id'] = 'Seleccione nacionalidad';
            }
            
            if (!contacto.fecha_nacimiento) {
                nuevosErrores['contacto.fecha_nacimiento'] = 'Ingrese fecha de nacimiento';
            } else {
                const fechaNacimiento = new Date(contacto.fecha_nacimiento);
                const hoy = new Date();
                let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
                const mesDiff = hoy.getMonth() - fechaNacimiento.getMonth();
                
                if (isNaN(fechaNacimiento.getTime())) {
                    nuevosErrores['contacto.fecha_nacimiento'] = 'Fecha inválida';
                } else if (edad < 18 || (edad === 18 && mesDiff < 0)) {
                    nuevosErrores['contacto.fecha_nacimiento'] = 'Debe ser mayor de 18 años';
                }
            }
            
            if (!contacto.direccion_personal || contacto.direccion_personal.trim() === '') {
                nuevosErrores['contacto.direccion_personal'] = 'Ingrese dirección personal';
            }
            
            if (!contacto.codigo_postal_personal || contacto.codigo_postal_personal.trim() === '') {
                nuevosErrores['contacto.codigo_postal_personal'] = 'Ingrese código postal';
            }
        }

        if (paso === 3) {
            const { empresa } = formData;
            
            if (!empresa.nombre_fantasia || empresa.nombre_fantasia.trim() === '') {
                nuevosErrores['empresa.nombre_fantasia'] = 'Ingrese nombre de fantasía';
            }
            
            if (!empresa.razon_social || empresa.razon_social.trim() === '') {
                nuevosErrores['empresa.razon_social'] = 'Ingrese razón social';
            }
            
             if (!empresa.cuit || empresa.cuit.trim() === '') {
                nuevosErrores['empresa.cuit'] = 'Ingrese CUIT o DNI';
                    } else {
                        const numeros = empresa.cuit.replace(/\D/g, '');
                        // Validar según longitud: 11 dígitos para CUIT, 7-8 dígitos para DNI
                        if (numeros.length < 7 || numeros.length > 11) {
                            nuevosErrores['empresa.cuit'] = 'CUIT debe tener 11 dígitos o DNI entre 7 y 8 dígitos';
                        }
                    }
            
            if (!empresa.direccion_fiscal || empresa.direccion_fiscal.trim() === '') {
                nuevosErrores['empresa.direccion_fiscal'] = 'Ingrese dirección fiscal';
            }
            
            if (!empresa.codigo_postal_fiscal || empresa.codigo_postal_fiscal.trim() === '') {
                nuevosErrores['empresa.codigo_postal_fiscal'] = 'Ingrese código postal fiscal';
            }
            
            if (!empresa.localidad_fiscal_id) {
                nuevosErrores['empresa.localidad_fiscal_id'] = 'Seleccione localidad fiscal';
            }
            
            if (!empresa.telefono_fiscal || empresa.telefono_fiscal.trim() === '') {
                nuevosErrores['empresa.telefono_fiscal'] = 'Ingrese teléfono fiscal';
            }
            
            if (!empresa.email_fiscal || empresa.email_fiscal.trim() === '') {
                nuevosErrores['empresa.email_fiscal'] = 'Ingrese email fiscal';
            } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(empresa.email_fiscal)) {
                nuevosErrores['empresa.email_fiscal'] = 'Email inválido';
            }
            
            if (!empresa.rubro_id) {
                nuevosErrores['empresa.rubro_id'] = 'Seleccione rubro';
            }
            
            if (!empresa.cat_fiscal_id) {
                nuevosErrores['empresa.cat_fiscal_id'] = 'Seleccione categoría fiscal';
            }
            
            if (!empresa.plataforma_id) {
                nuevosErrores['empresa.plataforma_id'] = 'Seleccione plataforma';
            }
            
            if (!empresa.nombre_flota || empresa.nombre_flota.trim() === '') {
                nuevosErrores['empresa.nombre_flota'] = 'Ingrese nombre de flota';
            }
        }

        setErrores(nuevosErrores);
        
        if (Object.keys(nuevosErrores).length > 0) {
            const primerError = Object.values(nuevosErrores)[0];
            toast.error(primerError);
            return false;
        }
        
        return true;
    };

const handleSubmitPaso1 = async () => {
    if (!validarPaso(1)) return;

    setIsSubmitting(true);
    
    const leadId = lead?.id;
    const esUpdate = !!leadId;
    
    const url = esUpdate 
        ? `/comercial/utils/empresa/paso1/${leadId}`
        : '/comercial/utils/empresa/paso1';
    
    const method = esUpdate ? 'PUT' : 'POST';
    
    const dataToSend: any = {
        nombre_completo: formData.lead.nombre_completo,
        genero: formData.lead.genero,
        telefono: formData.lead.telefono,
        email: formData.lead.email,
        localidad_id: formData.lead.localidad_id,
        rubro_id: formData.lead.rubro_id,
        origen_id: formData.lead.origen_id,
    };
    
    if (mostrarSelectorComercial && formData.lead.prefijo_id) {
        dataToSend.prefijo_id = parseInt(formData.lead.prefijo_id);
    } else if (esComercial && usuario?.comercial?.prefijo_id) {
        dataToSend.prefijo_id = usuario.comercial.prefijo_id;
    }
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                'Accept': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        });
        
        const result = await response.json();
        
        if (result.success) {
            const nuevoLeadId = result.lead_id;
            
            if (nuevoLeadId) {
                window.sessionStorage.setItem('temp_lead_id', String(nuevoLeadId));
                console.log('Lead ID guardado:', nuevoLeadId);
            }
            
            toast.success(esUpdate ? 'Datos del lead actualizados' : 'Lead creado correctamente');
            setPaso1Completado(true);
            setPasoActual(2);
        } else {
            throw new Error(result.error || 'Error al guardar');
        }
    } catch (error) {
        console.error('Errores paso 1:', error);
        toast.error('Error al guardar datos del lead');
    } finally {
        setIsSubmitting(false);
    }
};



const handleSubmitPaso2 = async () => {
    if (!validarPaso(2)) return;

    setIsSubmitting(true);
    
    // Obtener lead_id
    let leadId = lead?.id;
    if (!leadId) {
        const tempLeadId = window.sessionStorage.getItem('temp_lead_id');
        if (tempLeadId) {
            leadId = parseInt(tempLeadId);
        }
    }
    
    if (!leadId) {
        toast.error('No se pudo identificar el lead');
        setIsSubmitting(false);
        return;
    }
    
    const contactoId = datosExistentes?.contacto?.id || (lead as any)?.empresa_contacto?.id;
    const esUpdate = !!contactoId;
    
    const url = esUpdate 
        ? `/comercial/utils/empresa/paso2/${contactoId}`
        : '/comercial/utils/empresa/paso2';
    
    const method = esUpdate ? 'PUT' : 'POST';
    
    const dataToSend = {
        lead_id: leadId,
        ...formData.contacto
    };
    
    console.log('Enviando paso 2:', { url, method, dataToSend, leadId });
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                'Accept': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('Paso 2 éxito:', result);
            
            const nuevoContactoId = result.contacto_id;
            
            if (nuevoContactoId) {
                setContactoId(nuevoContactoId);
                // Guardar en sessionStorage
                window.sessionStorage.setItem('temp_contacto_id', String(nuevoContactoId));
                console.log('Contacto ID guardado:', nuevoContactoId);
            }
            
            toast.success(esUpdate ? 'Datos personales actualizados' : 'Datos personales guardados');
            setPaso2Completado(true);
            setPasoActual(3);
        } else {
            throw new Error(result.error || 'Error al guardar');
        }
    } catch (error) {
        console.error('Errores paso 2:', error);
        toast.error('Error al guardar datos personales');
    } finally {
        setIsSubmitting(false);
    }
};

const handleSubmitPaso3 = async () => {
    if (!validarPaso(3)) return;

    setIsSubmitting(true);
    
    let leadId = lead?.id;
    if (!leadId) {
        const tempLeadId = window.sessionStorage.getItem('temp_lead_id');
        if (tempLeadId) {
            leadId = parseInt(tempLeadId);
        }
    }
    
    let contactoIdLocal = contactoId;
    if (!contactoIdLocal) {
        const tempContactoId = window.sessionStorage.getItem('temp_contacto_id');
        if (tempContactoId) {
            contactoIdLocal = parseInt(tempContactoId);
        }
    }
    
    if (!leadId) {
        toast.error('No se pudo identificar el lead');
        setIsSubmitting(false);
        return;
    }
    
    if (!contactoIdLocal) {
        toast.error('No se pudo identificar el contacto');
        setIsSubmitting(false);
        return;
    }
    
    const empresaId = datosExistentes?.empresa?.id || (lead as any)?.empresa_contacto?.empresa?.id;
    const esUpdate = !!empresaId;
    
    const url = esUpdate 
        ? `/comercial/utils/empresa/paso3/${empresaId}`
        : '/comercial/utils/empresa/paso3';
    
    const method = esUpdate ? 'PUT' : 'POST';
    
    const dataToSend = {
        presupuesto_id: presupuestoId,
        lead_id: leadId,
        contacto_id: contactoIdLocal,
        ...formData.empresa
    };
    
    console.log('Enviando paso 3:', { url, method, dataToSend, leadId, contactoIdLocal });
    
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                'Content-Type': 'application/json',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                'Accept': 'application/json'
            },
            body: JSON.stringify(dataToSend)
        });
        
        const result = await response.json();
        
        if (result.success) {
            console.log('Paso 3 éxito:', result);
            
            // Limpiar sessionStorage
            window.sessionStorage.removeItem('temp_lead_id');
            window.sessionStorage.removeItem('temp_contacto_id');
            
            if (modoCompletar && esCliente && presupuestoId) {
                toast.success('Datos guardados. Complete los vehículos para generar el contrato');
                onClose(false, true);
            } else if (presupuestoId) {
                // Redirigir a creación de contrato desde presupuesto
                router.visit(`/comercial/contratos/create-from-lead/${presupuestoId}`);
            } else {
                // Cambio de titularidad - redirigir a contrato desde empresa
                router.visit(`/comercial/contratos/desde-empresa/${result.empresa_id}`);
            }
            onClose(true);
        } else {
            throw new Error(result.error || 'Error al guardar');
        }
    } catch (error) {
        console.error('Errores paso 3:', error);
        toast.error('Error al guardar datos de la empresa');
    } finally {
        setIsSubmitting(false);
    }
};
    const handleSiguiente = () => {
        if (validarPaso(pasoActual)) {
            if (pasoActual === 1) {
                handleSubmitPaso1();
            } else if (pasoActual === 2) {
                handleSubmitPaso2();
            }
        }
    };

    const handleAnterior = () => {
        setPasoActual(prev => prev - 1);
        setTimeout(() => {
            const content = document.querySelector('.modal-content');
            if (content) content.scrollTop = 0;
        }, 100);
    };

    const handleChangeLead = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            lead: {
                ...prev.lead,
                [field]: value
            }
        }));
        if (errores[`lead.${field}`]) {
            setErrores(prev => {
                const newErrors = { ...prev };
                delete newErrors[`lead.${field}`];
                return newErrors;
            });
        }
    };

    const handleChangeContacto = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            contacto: {
                ...prev.contacto,
                [field]: value
            }
        }));
        if (errores[`contacto.${field}`]) {
            setErrores(prev => {
                const newErrors = { ...prev };
                delete newErrors[`contacto.${field}`];
                return newErrors;
            });
        }
    };

    const handleChangeEmpresa = (field: string, value: any) => {
        setFormData(prev => ({
            ...prev,
            empresa: {
                ...prev.empresa,
                [field]: value
            }
        }));
        if (errores[`empresa.${field}`]) {
            setErrores(prev => {
                const newErrors = { ...prev };
                delete newErrors[`empresa.${field}`];
                return newErrors;
            });
        }
    };

const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) {
        window.sessionStorage.removeItem('temp_lead_id');
        onClose(false);
    }
};

    if (!isMounted && !isOpen) return null;

    const titulo = modoCompletar 
        ? 'Completar datos para contrato' 
        : (lead?.es_cliente ? 'Completar datos de la empresa' : 'Alta de Empresa');
    
    const descripcion = modoCompletar
        ? 'Complete los datos faltantes para generar el contrato'
        : (lead?.es_cliente 
            ? 'Complete los datos pendientes de la empresa para generar el contrato'
            : 'Complete los datos paso a paso');

    return (
        <div className={`fixed inset-0 z-50 overflow-y-auto transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}>
            <div 
                className="fixed inset-0 bg-black/50" 
                onClick={handleOverlayClick}
            />
            
            <div className="flex min-h-full items-center justify-center p-4">
                <div className={`relative bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col transition-all duration-300 transform ${isOpen ? 'translate-y-0 scale-100' : 'translate-y-4 scale-95'}`}>
                    
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${modoCompletar ? 'bg-amber-100' : 'bg-blue-100'}`}>
                                <Building className={`h-6 w-6 ${modoCompletar ? 'text-amber-600' : 'text-blue-600'}`} />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    {titulo}
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    {descripcion}
                                </p>
                            </div>
                        </div>
                        <button onClick={() => onClose(false)} disabled={isSubmitting} className="p-2 text-gray-400 hover:text-gray-600">
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Progress Steps */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex-shrink-0">
                        <div className="flex items-center justify-between">
                            {PASOS.map((paso, index) => {
                                const Icon = paso.icon;
                                const isActive = paso.id === pasoActual;
                                const isCompleted = 
                                    (paso.id === 1 && paso1Completado) ||
                                    (paso.id === 2 && paso2Completado) ||
                                    (paso.id === 3 && paso2Completado && pasoActual === 3);
                                
                                return (
                                    <React.Fragment key={paso.id}>
                                        <div className="flex items-center">
                                            <div className={`
                                                flex items-center justify-center w-10 h-10 rounded-full 
                                                ${isActive ? (modoCompletar ? 'bg-amber-600 text-white' : 'bg-blue-600 text-white') : ''}
                                                ${isCompleted ? 'bg-green-500 text-white' : ''}
                                                ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-400' : ''}
                                                transition-colors
                                            `}>
                                                {isCompleted ? (
                                                    <Check className="h-5 w-5" />
                                                ) : (
                                                    <Icon className="h-5 w-5" />
                                                )}
                                            </div>
                                            <span className="ml-2 text-sm font-medium hidden sm:block">
                                                {paso.nombre}
                                            </span>
                                        </div>
                                        {index < PASOS.length - 1 && (
                                            <div className={`
                                                flex-1 h-0.5 mx-4
                                                ${paso.id < pasoActual || 
                                                  (paso.id === 1 && paso1Completado) ||
                                                  (paso.id === 2 && paso2Completado) 
                                                  ? 'bg-green-500' : 'bg-gray-200'}
                                                transition-colors
                                            `} />
                                        )}
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    {/* Contenido */}
                    <div className="modal-content flex-1 overflow-y-auto p-6">
                        {cargandoDatos ? (
                            <div className="flex flex-col items-center justify-center py-12">
                                <Loader className="h-8 w-8 animate-spin text-blue-600 mb-4" />
                                <p className="text-gray-600">Cargando datos...</p>
                            </div>
                        ) : (
                            <>
                                {pasoActual === 1 && (
                                    <div className="space-y-6">
                                        {/* Selector de comercial para usuarios no comerciales */}
                                        {mostrarSelectorComercial && (
                                            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                                <div className="flex items-start gap-3">
                                                    <UserPlus className="h-5 w-5 text-yellow-600 mt-0.5" />
                                                    <div className="flex-1">
                                                        <h4 className="font-medium text-yellow-800 mb-2">Asignar Comercial</h4>
                                                        <p className="text-sm text-yellow-700 mb-3">
                                                            Seleccione el comercial que gestionará este lead
                                                        </p>
                                                        <select
                                                            value={formData.lead.prefijo_id}
                                                            onChange={(e) => handleChangeLead('prefijo_id', e.target.value)}
                                                            className={`w-full px-3 py-2 border rounded-md focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500 ${
                                                                errores['lead.prefijo_id'] ? 'border-red-300' : 'border-gray-300'
                                                            }`}
                                                        >
                                                            <option value="">Seleccionar comercial</option>
                                                            {comerciales.map(comercial => (
                                                                <option key={comercial.prefijo_id} value={comercial.prefijo_id}>
                                                                    {comercial.nombre} {comercial.personal?.email ? `(${comercial.personal.email})` : ''}
                                                                </option>
                                                            ))}
                                                        </select>
                                                        {errores['lead.prefijo_id'] && (
                                                            <p className="text-xs text-red-600 mt-1 flex items-center gap-1">
                                                                <AlertCircle className="h-3 w-3" />
                                                                {errores['lead.prefijo_id']}
                                                            </p>
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
                                        />
                                    </div>
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
                                        localidadInicial={formData.empresa.localidad_fiscal_id ? '' : (lead as any)?.empresa_contacto?.empresa?.localidadFiscal?.nombre || ''}
                                        provinciaInicial={formData.empresa.localidad_fiscal_id ? '' : (lead as any)?.empresa_contacto?.empresa?.localidadFiscal?.provincia_id || ''}
                                    />
                                )}
                            </>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-between items-center p-6 border-t border-gray-200 bg-white flex-shrink-0">
                        <button
                            type="button"
                            onClick={() => pasoActual === 1 ? onClose(false) : handleAnterior()}
                            disabled={isSubmitting || cargandoDatos}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50"
                        >
                            {pasoActual === 1 ? 'Cancelar' : (
                                <><ChevronLeft className="h-4 w-4 inline mr-1" /> Anterior</>
                            )}
                        </button>
                        
                        {pasoActual < 3 ? (
                            <button
                                type="button"
                                onClick={handleSiguiente}
                                disabled={isSubmitting || cargandoDatos}
                                className={`px-4 py-2 text-white rounded-md text-sm font-medium disabled:opacity-50 flex items-center gap-2 ${
                                    modoCompletar ? 'bg-amber-600 hover:bg-amber-700' : 'bg-blue-600 hover:bg-blue-700'
                                }`}
                            >
                                {isSubmitting ? (
                                    <><Loader className="h-4 w-4 animate-spin" /> Guardando...</>
                                ) : (
                                    <>Siguiente <ChevronRight className="h-4 w-4" /></>
                                )}
                            </button>
                        ) : (
                            <button
                                type="button"
                                onClick={handleSubmitPaso3}
                                disabled={isSubmitting || cargandoDatos}
                                className="px-6 py-2 bg-green-600 text-white rounded-md text-sm font-medium hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                            >
                                {isSubmitting ? (
                                    <><Loader className="h-4 w-4 animate-spin" /> Guardando...</>
                                ) : modoCompletar ? (
                                    <><Check className="h-4 w-4" /> Guardar y Continuar</>
                                ) : (
                                    <><Building className="h-4 w-4" /> Crear Empresa</>
                                )}
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}