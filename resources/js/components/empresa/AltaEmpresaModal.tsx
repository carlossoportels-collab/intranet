// resources/js/components/empresa/AltaEmpresaModal.tsx
import { router } from '@inertiajs/react';
import { X, User, Building, Check, ChevronLeft, ChevronRight, Loader, AlertCircle } from 'lucide-react';
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
    Plataforma,
    Paso1Response,
    Paso2Response,
    Paso3Response
} from '@/types/empresa';
import { Lead, Origen, Rubro, Provincia } from '@/types/leads';

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
}

const PASOS = [
    { id: 1, nombre: 'Actualizar Lead', icon: User },
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
    modoCompletar = false
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

    // Estado del formulario
    const [formData, setFormData] = useState({
        lead: {
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
            
            // Si hay paso inicial, configurar los pasos completados
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
    }, [isOpen, pasoInicial]);

    // Cargar datos del lead cuando se abre el modal
    useEffect(() => {
        if (isOpen && lead) {
            // Cargar datos del lead
            setFormData(prev => ({
                ...prev,
                lead: {
                    nombre_completo: lead.nombre_completo || '',
                    genero: (lead.genero || 'no_especifica') as 'masculino' | 'femenino' | 'otro' | 'no_especifica',
                    telefono: lead.telefono || '',
                    email: lead.email || '',
                    localidad_id: lead.localidad_id || '',
                    rubro_id: lead.rubro_id || '',
                    origen_id: lead.origen_id || '',
                }
            }));

            // Si el lead tiene empresa, cargar datos de empresa y contacto
            if ((lead as any).empresa_contacto) {
                const empresaContacto = (lead as any).empresa_contacto;
                const empresa = empresaContacto?.empresa;
                
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
                }

                if (empresaContacto) {
                    setFormData(prev => ({
                        ...prev,
                        contacto: {
                            tipo_responsabilidad_id: empresaContacto.tipo_responsabilidad_id || '',
                            tipo_documento_id: empresaContacto.tipo_documento_id || '',
                            nro_documento: empresaContacto.nro_documento || '',
                            nacionalidad_id: empresaContacto.nacionalidad_id || '',
                            fecha_nacimiento: empresaContacto.fecha_nacimiento || '',
                            direccion_personal: empresaContacto.direccion_personal || '',
                            codigo_postal_personal: empresaContacto.codigo_postal_personal || '',
                        }
                    }));
                }
            }
        }
    }, [isOpen, lead]);

    const resetForm = () => {
        setPasoActual(1);
        setPaso1Completado(false);
        setPaso2Completado(false);
        setContactoId(null);
        setFormData({
            lead: {
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
    };

    // Cargar datos iniciales
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

    // Validar paso actual
    const validarPaso = (paso: number): boolean => {
        const nuevosErrores: Record<string, string> = {};

        if (paso === 1) {
            const { lead } = formData;
            if (!lead.nombre_completo) nuevosErrores['lead.nombre_completo'] = 'El nombre es requerido';
            if (!lead.telefono) nuevosErrores['lead.telefono'] = 'El teléfono es requerido';
            if (!lead.email) nuevosErrores['lead.email'] = 'El email es requerido';
            if (lead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(lead.email)) {
                nuevosErrores['lead.email'] = 'Email inválido';
            }
            if (!lead.genero) nuevosErrores['lead.genero'] = 'El género es requerido';
            if (!lead.localidad_id) nuevosErrores['lead.localidad_id'] = 'La localidad es requerida';
            if (!lead.rubro_id) nuevosErrores['lead.rubro_id'] = 'El rubro es requerido';
            if (!lead.origen_id) nuevosErrores['lead.origen_id'] = 'El origen es requerido';
        }

        if (paso === 2) {
            const { contacto } = formData;
            if (!contacto.tipo_responsabilidad_id) nuevosErrores['contacto.tipo_responsabilidad_id'] = 'Seleccione tipo de responsabilidad';
            if (!contacto.tipo_documento_id) nuevosErrores['contacto.tipo_documento_id'] = 'Seleccione tipo de documento';
            if (!contacto.nro_documento) nuevosErrores['contacto.nro_documento'] = 'Ingrese número de documento';
            if (!contacto.nacionalidad_id) nuevosErrores['contacto.nacionalidad_id'] = 'Seleccione nacionalidad';
            if (!contacto.fecha_nacimiento) nuevosErrores['contacto.fecha_nacimiento'] = 'Ingrese fecha de nacimiento';
            if (!contacto.direccion_personal) nuevosErrores['contacto.direccion_personal'] = 'Ingrese dirección personal';
            if (!contacto.codigo_postal_personal) nuevosErrores['contacto.codigo_postal_personal'] = 'Ingrese código postal';
        }

        if (paso === 3) {
            const { empresa } = formData;
            if (!empresa.nombre_fantasia) nuevosErrores['empresa.nombre_fantasia'] = 'Ingrese nombre de fantasía';
            if (!empresa.razon_social) nuevosErrores['empresa.razon_social'] = 'Ingrese razón social';
            if (!empresa.cuit) nuevosErrores['empresa.cuit'] = 'Ingrese CUIT';
            if (!empresa.direccion_fiscal) nuevosErrores['empresa.direccion_fiscal'] = 'Ingrese dirección fiscal';
            if (!empresa.codigo_postal_fiscal) nuevosErrores['empresa.codigo_postal_fiscal'] = 'Ingrese código postal fiscal';
            if (!empresa.localidad_fiscal_id) nuevosErrores['empresa.localidad_fiscal_id'] = 'Seleccione localidad fiscal';
            if (!empresa.telefono_fiscal) nuevosErrores['empresa.telefono_fiscal'] = 'Ingrese teléfono fiscal';
            if (!empresa.email_fiscal) nuevosErrores['empresa.email_fiscal'] = 'Ingrese email fiscal';
            if (!empresa.rubro_id) nuevosErrores['empresa.rubro_id'] = 'Seleccione rubro';
            if (!empresa.cat_fiscal_id) nuevosErrores['empresa.cat_fiscal_id'] = 'Seleccione categoría fiscal';
            if (!empresa.plataforma_id) nuevosErrores['empresa.plataforma_id'] = 'Seleccione plataforma';
            if (!empresa.nombre_flota) nuevosErrores['empresa.nombre_flota'] = 'Ingrese nombre de flota';
        }

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    const handleSubmitPaso1 = () => {
        if (!validarPaso(1)) return;

        setIsSubmitting(true);
        
        router.post('/comercial/utils/empresa/paso1', {
            lead_id: lead?.id,
            ...formData.lead
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Lead actualizado correctamente');
                setPaso1Completado(true);
                setPasoActual(2);
                setIsSubmitting(false);
            },
            onError: (errors) => {
                console.error('Errores paso 1:', errors);
                setErrores(errors);
                toast.error('Error al actualizar lead');
                setIsSubmitting(false);
            }
        });
    };

    const handleSubmitPaso2 = () => {
        if (!validarPaso(2)) return;

        setIsSubmitting(true);
        
        router.post('/comercial/utils/empresa/paso2', {
            lead_id: lead?.id,
            ...formData.contacto
        }, {
            preserveScroll: true,
            onSuccess: () => {
                toast.success('Datos personales guardados correctamente');
                setPaso2Completado(true);
                setPasoActual(3);
                setIsSubmitting(false);
            },
            onError: (errors) => {
                console.error('Errores paso 2:', errors);
                setErrores(errors);
                toast.error('Error al guardar datos personales');
                setIsSubmitting(false);
            }
        });
    };

    const handleSubmitPaso3 = () => {
        if (!validarPaso(3)) return;

        setIsSubmitting(true);
        
        router.post('/comercial/utils/empresa/paso3', {
            presupuesto_id: presupuestoId,
            lead_id: lead?.id,
            ...formData.empresa
        }, {
            preserveScroll: true,
            onSuccess: (page) => {
                toast.success('Empresa creada exitosamente');
                setIsSubmitting(false);
                
                // Si estamos en modo completar para cliente, después de guardar vamos a la página de contrato
                if (modoCompletar && esCliente && presupuestoId) {
                    toast.success('Datos guardados. Complete los vehículos para generar el contrato');
                    // Cerramos el modal y le decimos que vaya a la página de contrato
                    onClose(false, true);
                } else {
                    onClose(true);
                }
            },
            onError: (errors) => {
                console.error('Errores paso 3:', errors);
                setErrores(errors);
                toast.error('Error al crear empresa');
                setIsSubmitting(false);
            }
        });
    };

    const handleSiguiente = () => {
        if (pasoActual === 1) {
            handleSubmitPaso1();
        } else if (pasoActual === 2) {
            handleSubmitPaso2();
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
        // Solo cerrar si el click fue en el overlay, no en el contenido
        if (e.target === e.currentTarget) {
            onClose(false);
        }
    };

    if (!isMounted && !isOpen) return null;

    // Determinar el título según el modo
    const titulo = modoCompletar 
        ? 'Completar datos para contrato' 
        : 'Alta de Empresa';
    
    const descripcion = modoCompletar
        ? 'Complete los datos faltantes para generar el contrato'
        : 'Complete los datos paso a paso';

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