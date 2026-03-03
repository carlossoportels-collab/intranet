// resources/js/Pages/Comercial/Cuentas/CambioRazonSocial.tsx
import React, { useState, useEffect } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';

import AppLayout from '@/layouts/app-layout';
import { useToast } from '@/contexts/ToastContext';
import Pagination from '@/components/ui/Pagination';
import { User, Phone, Mail, MapPin, Briefcase, Building, Loader, CheckCircle } from 'lucide-react';

// Componentes de los pasos
import Paso1DatosLead from '@/components/empresa/pasos/Paso1DatosLead';
import Paso2DatosContacto from '@/components/empresa/pasos/Paso2DatosContacto';
import Paso3DatosEmpresa from '@/components/empresa/pasos/Paso3DatosEmpresa';

// Tipos necesarios
import { 
    DatosLeadForm,
    DatosContactoForm,
    DatosEmpresaForm,
    Plataforma 
} from '@/types/empresa';

import { 
    CambioRazonSocialProps, 
    Empresa, 
    EmpresaCompleta, 
    Localidad,
    Contacto,
    HistorialCambio
} from '@/types/cambiosRazonSocial';

// Definición de los pasos
const PASOS = [
    { id: 1, nombre: 'Datos de Empresa', icon: Building },
    { id: 2, nombre: 'Datos del Lead', icon: User },
    { id: 3, nombre: 'Datos Personales', icon: User },
    { id: 4, nombre: 'Finalizar', icon: CheckCircle },
];

export default function CambioRazonSocial({ 
    empresas, 
    historial, 
    origenes = [], 
    rubros = [], 
    provincias = [],
    tiposDocumento = [],
    nacionalidades = [],
    tiposResponsabilidad = [],
    categoriasFiscales = [],
    plataformas = []
}: CambioRazonSocialProps) {
    const toast = useToast();
    const [searchTerm, setSearchTerm] = useState('');
    const [showResults, setShowResults] = useState(false);
    const [selectedEmpresa, setSelectedEmpresa] = useState<EmpresaCompleta | null>(null);
    const [loading, setLoading] = useState(false);
    const [pasoActual, setPasoActual] = useState(1);
    const [paso1Completado, setPaso1Completado] = useState(false);
    const [paso2Completado, setPaso2Completado] = useState(false);
    const [paso3Completado, setPaso3Completado] = useState(false);
    
    // Estados para los formularios
    const [formDataEmpresa, setFormDataEmpresa] = useState<DatosEmpresaForm>({
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
    });

    const [formDataLead, setFormDataLead] = useState<DatosLeadForm>({
        nombre_completo: '',
        genero: 'no_especifica',
        telefono: '',
        email: '',
        localidad_id: '' as number | '',
        rubro_id: '' as number | '',
        origen_id: '' as number | '',
    });

    const [formDataContacto, setFormDataContacto] = useState<DatosContactoForm>({
        tipo_responsabilidad_id: '' as number | '',
        tipo_documento_id: '' as number | '',
        nro_documento: '',
        nacionalidad_id: '' as number | '',
        fecha_nacimiento: '',
        direccion_personal: '',
        codigo_postal_personal: '',
    });

    const [errores, setErrores] = useState<Record<string, string>>({});
    const [detalleModal, setDetalleModal] = useState<{
        show: boolean;
        cambio: HistorialCambio | null;
    }>({ show: false, cambio: null });

    // Estados adicionales para los modales de contacto
    const [contactoPrincipal, setContactoPrincipal] = useState<Contacto | null>(null);

    // Filtrar empresas para el buscador
    const filteredEmpresas = empresas.filter(emp => 
        emp.codigo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.nombre_fantasia.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.razon_social.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.cuit.includes(searchTerm)
    ).slice(0, 10);

    // Cargar datos completos de la empresa seleccionada
    const loadEmpresaData = async (empresaId: number) => {
        setLoading(true);
        try {
            const response = await axios.get(`/comercial/cuentas/cambio-razon-social/empresa/${empresaId}/completa`);
            const data = response.data;
            
            setSelectedEmpresa(data);
            
            // Encontrar contacto principal
            const principal = data.contactos?.find((c: Contacto) => c.es_contacto_principal);
            setContactoPrincipal(principal || null);
            
            // Precargar datos de la empresa
            setFormDataEmpresa({
                nombre_fantasia: data.nombre_fantasia || '',
                razon_social: data.razon_social,
                cuit: data.cuit,
                direccion_fiscal: data.direccion_fiscal || '',
                codigo_postal_fiscal: data.codigo_postal_fiscal || '',
                localidad_fiscal_id: data.localidad_fiscal_id?.toString() || '',
                telefono_fiscal: data.telefono_fiscal || '',
                email_fiscal: data.email_fiscal || '',
                rubro_id: data.rubro_id?.toString() || '',
                cat_fiscal_id: data.cat_fiscal_id?.toString() || '',
                plataforma_id: data.plataforma_id?.toString() || '',
                nombre_flota: data.nombre_flota || '',
            });

                        
            // Precargar datos del lead si existe contacto principal
            if (principal?.lead) {
                setFormDataLead({
                    nombre_completo: principal.lead.nombre_completo || '',
                    genero: principal.lead.genero || 'no_especifica',
                    telefono: principal.lead.telefono || '',
                    email: principal.lead.email || '',
                    localidad_id: principal.lead.localidad_id?.toString() || '',
                    rubro_id: principal.lead.rubro_id?.toString() || '',
                    origen_id: principal.lead.origen_id?.toString() || '',
                });

                setFormDataContacto({
                    tipo_responsabilidad_id: principal.tipo_responsabilidad_id?.toString() || '',
                    tipo_documento_id: principal.tipo_documento_id?.toString() || '',
                    nro_documento: principal.nro_documento || '',
                    nacionalidad_id: principal.nacionalidad_id?.toString() || '',
                    fecha_nacimiento: principal.fecha_nacimiento || '',
                    direccion_personal: principal.direccion_personal || '',
                    codigo_postal_personal: principal.codigo_postal_personal || '',
                });
            }
            
            setShowResults(false);
            setSearchTerm('');
            setPasoActual(1);
            setLoading(false);
        } catch (error) {
            console.error('Error al cargar empresa:', error);
            toast.error('Error al cargar datos de la empresa');
            setLoading(false);
        }
    };

    const handleSelectEmpresa = (empresa: Empresa) => {
        loadEmpresaData(empresa.id);
    };

    // Validar paso actual
    const validarPaso = (paso: number): boolean => {
        const nuevosErrores: Record<string, string> = {};

        if (paso === 1) { // Datos de Empresa
            if (!formDataEmpresa.nombre_fantasia) nuevosErrores['empresa.nombre_fantasia'] = 'El nombre de fantasía es requerido';
            if (!formDataEmpresa.razon_social) nuevosErrores['empresa.razon_social'] = 'La razón social es requerida';
            if (!formDataEmpresa.cuit) nuevosErrores['empresa.cuit'] = 'El CUIT es requerido';
            if (!formDataEmpresa.direccion_fiscal) nuevosErrores['empresa.direccion_fiscal'] = 'La dirección es requerida';
            if (!formDataEmpresa.codigo_postal_fiscal) nuevosErrores['empresa.codigo_postal_fiscal'] = 'El código postal es requerido';
            if (!formDataEmpresa.localidad_fiscal_id) nuevosErrores['empresa.localidad_fiscal_id'] = 'La localidad es requerida';
            if (!formDataEmpresa.telefono_fiscal) nuevosErrores['empresa.telefono_fiscal'] = 'El teléfono es requerido';
            if (!formDataEmpresa.email_fiscal) nuevosErrores['empresa.email_fiscal'] = 'El email es requerido';
            if (!formDataEmpresa.rubro_id) nuevosErrores['empresa.rubro_id'] = 'El rubro es requerido';
            if (!formDataEmpresa.cat_fiscal_id) nuevosErrores['empresa.cat_fiscal_id'] = 'La categoría fiscal es requerida';
            if (!formDataEmpresa.plataforma_id) nuevosErrores['empresa.plataforma_id'] = 'La plataforma es requerida';
            if (!formDataEmpresa.nombre_flota) nuevosErrores['empresa.nombre_flota'] = 'El nombre de flota es requerido';
        }

        if (paso === 2) { // Datos del Lead
            if (!formDataLead.nombre_completo) nuevosErrores['lead.nombre_completo'] = 'El nombre es requerido';
            if (!formDataLead.telefono) nuevosErrores['lead.telefono'] = 'El teléfono es requerido';
            if (!formDataLead.email) nuevosErrores['lead.email'] = 'El email es requerido';
            if (formDataLead.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formDataLead.email)) {
                nuevosErrores['lead.email'] = 'Email inválido';
            }
            if (!formDataLead.genero) nuevosErrores['lead.genero'] = 'El género es requerido';
            if (!formDataLead.localidad_id) nuevosErrores['lead.localidad_id'] = 'La localidad es requerida';
            if (!formDataLead.rubro_id) nuevosErrores['lead.rubro_id'] = 'El rubro es requerido';
            if (!formDataLead.origen_id) nuevosErrores['lead.origen_id'] = 'El origen es requerido';
        }

        if (paso === 3) { // Datos Personales del Contacto
            if (!formDataContacto.tipo_responsabilidad_id) nuevosErrores['contacto.tipo_responsabilidad_id'] = 'Seleccione tipo de responsabilidad';
            if (!formDataContacto.tipo_documento_id) nuevosErrores['contacto.tipo_documento_id'] = 'Seleccione tipo de documento';
            if (!formDataContacto.nro_documento) nuevosErrores['contacto.nro_documento'] = 'Ingrese número de documento';
            if (!formDataContacto.nacionalidad_id) nuevosErrores['contacto.nacionalidad_id'] = 'Seleccione nacionalidad';
            if (!formDataContacto.fecha_nacimiento) nuevosErrores['contacto.fecha_nacimiento'] = 'Ingrese fecha de nacimiento';
            if (!formDataContacto.direccion_personal) nuevosErrores['contacto.direccion_personal'] = 'Ingrese dirección personal';
            if (!formDataContacto.codigo_postal_personal) nuevosErrores['contacto.codigo_postal_personal'] = 'Ingrese código postal';
        }

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    // Handlers para cambios en los formularios
    const handleChangeEmpresa = (field: string, value: any) => {
        setFormDataEmpresa(prev => ({ ...prev, [field]: value }));
        if (errores[`empresa.${field}`]) {
            setErrores(prev => {
                const newErrors = { ...prev };
                delete newErrors[`empresa.${field}`];
                return newErrors;
            });
        }
    };

    const handleChangeLead = (field: string, value: any) => {
        setFormDataLead(prev => ({ ...prev, [field]: value }));
        if (errores[`lead.${field}`]) {
            setErrores(prev => {
                const newErrors = { ...prev };
                delete newErrors[`lead.${field}`];
                return newErrors;
            });
        }
    };

    const handleChangeContacto = (field: string, value: any) => {
        setFormDataContacto(prev => ({ ...prev, [field]: value }));
        if (errores[`contacto.${field}`]) {
            setErrores(prev => {
                const newErrors = { ...prev };
                delete newErrors[`contacto.${field}`];
                return newErrors;
            });
        }
    };

    // Navegación entre pasos
    const handleSiguiente = () => {
        if (!validarPaso(pasoActual)) return;

        if (pasoActual === 1) {
            setPaso1Completado(true);
            setPasoActual(2);
        } else if (pasoActual === 2) {
            setPaso2Completado(true);
            setPasoActual(3);
        } else if (pasoActual === 3) {
            setPaso3Completado(true);
            setPasoActual(4);
        }
    };

    const handleAnterior = () => {
        setPasoActual(prev => prev - 1);
    };

    // Guardar todos los cambios
// Guardar todos los cambios
const handleFinalizar = () => {
    if (!selectedEmpresa) return;
    
    setLoading(true);

    // Aplanar todos los datos para Inertia
    const datosEnvio = {
        empresa_id: selectedEmpresa.id,
        
        // Datos de empresa (planos)
        nombre_fantasia: formDataEmpresa.nombre_fantasia,
        razon_social: formDataEmpresa.razon_social,
        cuit: formDataEmpresa.cuit,
        direccion_fiscal: formDataEmpresa.direccion_fiscal,
        codigo_postal_fiscal: formDataEmpresa.codigo_postal_fiscal,
        localidad_fiscal_id: formDataEmpresa.localidad_fiscal_id,
        telefono_fiscal: formDataEmpresa.telefono_fiscal,
        email_fiscal: formDataEmpresa.email_fiscal,
        rubro_id: formDataEmpresa.rubro_id,
        cat_fiscal_id: formDataEmpresa.cat_fiscal_id,
        plataforma_id: formDataEmpresa.plataforma_id,
        nombre_flota: formDataEmpresa.nombre_flota,
        
        // Datos de lead (con prefijo lead_)
        lead_nombre_completo: formDataLead.nombre_completo,
        lead_genero: formDataLead.genero,
        lead_telefono: formDataLead.telefono,
        lead_email: formDataLead.email,
        lead_localidad_id: formDataLead.localidad_id,
        lead_rubro_id: formDataLead.rubro_id,
        lead_origen_id: formDataLead.origen_id,
        
        // Datos de contacto (con prefijo contacto_)
        contacto_tipo_responsabilidad_id: formDataContacto.tipo_responsabilidad_id,
        contacto_tipo_documento_id: formDataContacto.tipo_documento_id,
        contacto_nro_documento: formDataContacto.nro_documento,
        contacto_nacionalidad_id: formDataContacto.nacionalidad_id,
        contacto_fecha_nacimiento: formDataContacto.fecha_nacimiento,
        contacto_direccion_personal: formDataContacto.direccion_personal,
        contacto_codigo_postal_personal: formDataContacto.codigo_postal_personal,
    };

    router.post('/comercial/cuentas/cambio-razon-social/completo', datosEnvio, {
        onSuccess: () => {
            toast.success('Datos actualizados correctamente');
            setLoading(false);
            window.location.href = `/comercial/contratos/desde-empresa/${selectedEmpresa.id}`;
        },
        onError: (errors) => {
            console.error('Error:', errors);
            setErrores(errors);
            toast.error('Error al actualizar datos');
            setLoading(false);
        }
    });
};

    const verDetalle = async (id: number) => {
        try {
            const response = await axios.get(`/comercial/cuentas/cambio-razon-social/${id}`);
            setDetalleModal({ show: true, cambio: response.data });
        } catch (error) {
            console.error('Error al cargar detalle:', error);
        }
    };

    const cambiarPagina = (page: number) => {
        router.get('/comercial/cuentas/cambio-razon-social', { page }, {
            preserveState: true,
            preserveScroll: true
        });
    };

    return (
        <AppLayout title="Cambio de Razón Social">
            <Head title="Cambio de Razón Social" />

            <div className="mb-6">
                <h1 className="text-2xl font-bold text-slate-900">Cambio de Razón Social</h1>
                <p className="mt-1 text-slate-500 text-sm">Complete todos los datos de la empresa para generar el contrato</p>
            </div>

            {/* Formulario principal */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm mb-8 overflow-visible">
                <div className="bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-4 border-b border-indigo-100">
                    <h2 className="text-lg font-semibold text-indigo-900">
                        {!selectedEmpresa ? 'Buscar Empresa' : `Paso ${pasoActual} de 4: ${PASOS[pasoActual-1]?.nombre || ''}`}
                    </h2>
                    <p className="text-sm text-indigo-600">
                        {!selectedEmpresa ? 'Seleccione una empresa para modificar' : 'Complete todos los campos obligatorios'}
                    </p>
                </div>

                <div className="p-6 relative min-h-[400px]">
                    {/* Buscador de empresas */}
                    {!selectedEmpresa ? (
                        <div className="relative">
                            <label className="block text-sm font-medium text-slate-700 mb-2">
                                Buscar Empresa <span className="text-rose-500">*</span>
                            </label>
                            <div className="relative">
                                <input
                                    type="text"
                                    value={searchTerm}
                                    onChange={(e) => { setSearchTerm(e.target.value); setShowResults(true); }}
                                    onFocus={() => setShowResults(true)}
                                    onBlur={() => setTimeout(() => setShowResults(false), 200)}
                                    placeholder="Buscar por código, nombre, razón social o CUIT..."
                                    className="w-full px-4 py-3 pl-10 text-sm border border-slate-300 rounded-lg"
                                    autoComplete="off"
                                />
                                <svg className="absolute left-3 top-3.5 w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                                </svg>
                                {loading && <Loader className="absolute right-3 top-3 animate-spin h-4 w-4 text-indigo-600" />}
                            </div>

                            {showResults && searchTerm && (
                                <div className="absolute z-[100] left-0 right-0 mt-1 bg-white border border-slate-200 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                                    {filteredEmpresas.length > 0 ? filteredEmpresas.map(emp => (
                                        <button
                                            key={emp.id}
                                            type="button"
                                            className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-slate-100"
                                            onClick={() => { handleSelectEmpresa(emp); setShowResults(false); setSearchTerm(''); }}
                                            onMouseDown={(e) => e.preventDefault()}
                                        >
                                            <div className="flex items-center justify-between mb-1">
                                                <span className="font-mono text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">{emp.codigo}</span>
                                                <span className="text-xs text-slate-500 font-mono">{emp.cuit}</span>
                                            </div>
                                            <p className="font-medium text-slate-900 text-sm">{emp.nombre_fantasia}</p>
                                            <p className="text-xs text-slate-500 truncate">{emp.razon_social}</p>
                                        </button>
                                    )) : (
                                        <div className="px-4 py-4 text-sm text-slate-500 text-center">No se encontraron empresas</div>
                                    )}
                                </div>
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Progress Steps */}
                            <div className="mb-6">
                                <div className="flex items-center justify-between">
                                    {PASOS.map((paso, index) => {
                                        const Icon = paso.icon;
                                        const isActive = paso.id === pasoActual;
                                        const isCompleted = 
                                            (paso.id === 1 && paso1Completado) ||
                                            (paso.id === 2 && paso2Completado) ||
                                            (paso.id === 3 && paso3Completado) ||
                                            (paso.id === 4 && paso3Completado);
                                        
                                        return (
                                            <React.Fragment key={paso.id}>
                                                <div className="flex items-center">
                                                    <div className={`
                                                        flex items-center justify-center w-10 h-10 rounded-full 
                                                        ${isActive ? 'bg-indigo-600 text-white' : ''}
                                                        ${isCompleted ? 'bg-green-500 text-white' : ''}
                                                        ${!isActive && !isCompleted ? 'bg-gray-200 text-gray-400' : ''}
                                                        transition-colors
                                                    `}>
                                                        {isCompleted ? (
                                                            <CheckCircle className="h-5 w-5" />
                                                        ) : (
                                                            <Icon className="h-5 w-5" />
                                                        )}
                                                    </div>
                                                    <span className="ml-2 text-sm font-medium hidden sm:block">
                                                        {paso.nombre}
                                                    </span>
                                                </div>
                                                {index < PASOS.length - 1 && (
                                                    <div className={`flex-1 h-0.5 mx-4 ${paso.id < pasoActual ? 'bg-green-500' : 'bg-gray-200'}`} />
                                                )}
                                            </React.Fragment>
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Contenido según el paso */}
                            <div className="mt-6">
                                {pasoActual === 1 && (
                                    <Paso3DatosEmpresa
                                        data={formDataEmpresa}
                                        rubros={rubros}
                                        categoriasFiscales={categoriasFiscales}
                                        plataformas={plataformas}
                                        provincias={provincias}
                                        onChange={handleChangeEmpresa}
                                        errores={errores}
                                        localidadInicial={selectedEmpresa?.localidad_fiscal_nombre || ''}
                                        provinciaInicial={selectedEmpresa?.localidad_fiscal_provincia_id || ''}
                                    />
                                )}

                                {pasoActual === 2 && (
                                    <Paso1DatosLead
                                        data={formDataLead}
                                        origenes={origenes}
                                        rubros={rubros}
                                        provincias={provincias}
                                        onChange={handleChangeLead}
                                        errores={errores}
                                        localidadInicial={selectedEmpresa?.contactos?.find(c => c.es_contacto_principal)?.lead?.localidad?.nombre || ''}
                                        provinciaInicial={selectedEmpresa?.contactos?.find(c => c.es_contacto_principal)?.lead?.localidad?.provincia_id?.toString() || ''}
                                    />
                                )}

                                {pasoActual === 3 && (
                                    <Paso2DatosContacto
                                        data={formDataContacto}
                                        tiposResponsabilidad={tiposResponsabilidad}
                                        tiposDocumento={tiposDocumento}
                                        nacionalidades={nacionalidades}
                                        onChange={handleChangeContacto}
                                        errores={errores}
                                    />
                                )}

                                {pasoActual === 4 && (
                                    <div className="text-center py-8">
                                        <CheckCircle className="h-16 w-16 text-green-500 mx-auto mb-4" />
                                        <h3 className="text-xl font-semibold text-slate-900 mb-2">
                                            ¡Todos los datos están completos!
                                        </h3>
                                        <p className="text-slate-600 mb-6">
                                            Ya puede generar el contrato para {selectedEmpresa.nombre_fantasia}
                                        </p>
                                        <div className="flex justify-center gap-4">
                                            <button
                                                onClick={handleFinalizar}
                                                disabled={loading}
                                                className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                                            >
                                                {loading ? 'Guardando...' : 'Guardar y completar contrato'}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Botones de navegación */}
                            {pasoActual < 4 && (
                                <div className="flex justify-between mt-8 pt-6 border-t border-slate-200">
                                    <button
                                        type="button"
                                        onClick={pasoActual === 1 ? () => setSelectedEmpresa(null) : handleAnterior}
                                        className="px-4 py-2 border border-slate-300 rounded-lg text-sm hover:bg-slate-50"
                                    >
                                        {pasoActual === 1 ? 'Cancelar' : 'Anterior'}
                                    </button>
                                    <button
                                        type="button"
                                        onClick={handleSiguiente}
                                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700"
                                    >
                                        Siguiente
                                    </button>
                                </div>
                            )}
                        </>
                    )}
                </div>
            </div>

            {/* Historial de cambios */}
            <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
                <div className="bg-slate-50 px-6 py-4 border-b border-slate-200">
                    <h2 className="text-lg font-semibold text-slate-900">Historial de Cambios</h2>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-slate-50 border-b border-slate-200">
                            <tr>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Empresa</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Razón Social Anterior</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Razón Social Nueva</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Fecha</th>
                                <th className="px-6 py-3 text-left text-xs font-semibold text-slate-600 uppercase">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-200">
                            {historial.data.map((cambio) => (
                                <tr key={cambio.id} className="hover:bg-slate-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                                                {cambio.empresa.codigo}
                                            </span>
                                            <span className="font-medium text-slate-900">{cambio.empresa.nombre}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-slate-700 font-medium">{cambio.razon_social_anterior}</p>
                                            <p className="text-xs font-mono text-slate-500 mt-1">{cambio.cuit_anterior}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div>
                                            <p className="text-indigo-700 font-medium">{cambio.razon_social_nueva}</p>
                                            <p className="text-xs font-mono text-indigo-600 mt-1">{cambio.cuit_nuevo}</p>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-slate-500 text-sm">
                                        {cambio.fecha_cambio}
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-2">
                                            <button
                                                onClick={() => verDetalle(cambio.id)}
                                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium"
                                            >
                                                Ver
                                            </button>
                                            <button
                                                onClick={() => window.location.href = `/comercial/contratos/desde-empresa/${cambio.empresa.id}`}
                                                className="text-emerald-600 hover:text-emerald-800 text-sm font-medium"
                                            >
                                                Contrato
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div className="px-6 py-4 bg-slate-50 border-t border-slate-200">
                    <Pagination
                        currentPage={historial.current_page}
                        lastPage={historial.last_page}
                        total={historial.total}
                        perPage={historial.per_page}
                        preserveState={true}
                        preserveScroll={true}
                    />
                </div>
            </div>

{/* Modal de detalle mejorado */}
{detalleModal.show && detalleModal.cambio && (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDetalleModal({ show: false, cambio: null })}>
        <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center sticky top-0">
                <div>
                    <h3 className="text-lg font-semibold text-indigo-900">Detalle del Cambio</h3>
                    <p className="text-sm text-indigo-600">Modificación registrada el {detalleModal.cambio.fecha_cambio}</p>
                </div>
                <button onClick={() => setDetalleModal({ show: false, cambio: null })} className="text-slate-400 hover:text-slate-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
            </div>
            
            <div className="p-6 space-y-6">
                {/* Info de empresa */}
                <div className="bg-slate-50 rounded-lg p-4">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="font-mono text-xs bg-indigo-600 text-white px-2 py-1 rounded">{detalleModal.cambio.empresa.codigo}</span>
                        <span className="text-xs text-slate-500">ID: {detalleModal.cambio.empresa.id}</span>
                    </div>
                    <p className="font-medium text-slate-900 text-lg">{detalleModal.cambio.empresa.nombre}</p>
                </div>

                {/* Comparación principal */}
                <div className="grid md:grid-cols-2 gap-6">
                    <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                        <h4 className="text-xs font-semibold text-slate-500 uppercase mb-4 flex items-center gap-1">
                            <span className="w-2 h-2 bg-slate-400 rounded-full"></span>
                            Datos Anteriores
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <span className="text-xs text-slate-500 block">Razón Social</span>
                                <p className="text-sm font-medium text-slate-900">{detalleModal.cambio.razon_social_anterior}</p>
                            </div>
                            <div>
                                <span className="text-xs text-slate-500 block">CUIT</span>
                                <p className="text-sm font-mono text-slate-700">{detalleModal.cambio.cuit_anterior}</p>
                            </div>
                        </div>
                    </div>
                    
                    <div className="bg-indigo-50 p-4 rounded-lg border border-indigo-200">
                        <h4 className="text-xs font-semibold text-indigo-600 uppercase mb-4 flex items-center gap-1">
                            <span className="w-2 h-2 bg-indigo-400 rounded-full"></span>
                            Datos Nuevos
                        </h4>
                        <div className="space-y-4">
                            <div>
                                <span className="text-xs text-indigo-500 block">Razón Social</span>
                                <p className="text-sm font-medium text-indigo-900">{detalleModal.cambio.razon_social_nueva}</p>
                            </div>
                            <div>
                                <span className="text-xs text-indigo-500 block">CUIT</span>
                                <p className="text-sm font-mono text-indigo-800">{detalleModal.cambio.cuit_nuevo}</p>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Datos adicionales del JSON */}
                {detalleModal.cambio.datos_adicionales && (
                    <div className="border-t border-slate-200 pt-4">
                        <h4 className="text-sm font-semibold text-slate-700 mb-4 flex items-center gap-2">
                            <svg className="w-4 h-4 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
                            </svg>
                            Otros cambios registrados
                        </h4>
                        
                        {/* Datos de empresa adicionales */}
                        {detalleModal.cambio.datos_adicionales.empresa && (
                            <div className="mb-6">
                                <h5 className="text-xs font-medium text-slate-500 uppercase mb-3">Datos de empresa</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(detalleModal.cambio.datos_adicionales.empresa).map(([campo, valores]: [string, any]) => {
                                        const campoNombre = {
                                            nombre_fantasia: 'Nombre Fantasía',
                                            direccion_fiscal: 'Dirección',
                                            codigo_postal_fiscal: 'Código Postal',
                                            localidad_id: 'Localidad',
                                            telefono_fiscal: 'Teléfono',
                                            email_fiscal: 'Email',
                                            rubro_id: 'Rubro',
                                            cat_fiscal_id: 'Categoría Fiscal',
                                            plataforma_id: 'Plataforma',
                                            nombre_flota: 'Nombre Flota'
                                        }[campo] || campo;
                                        
                                        return (
                                            <div key={campo} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                                <span className="text-xs font-medium text-slate-600 block mb-2">{campoNombre}</span>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className="text-slate-500 line-through decoration-rose-300">{valores.anterior || 'Vacío'}</span>
                                                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                    </svg>
                                                    <span className="font-medium text-indigo-600">{valores.nuevo || 'Vacío'}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Datos del lead modificados */}
                        {detalleModal.cambio.datos_adicionales.lead && (
                            <div className="mb-6">
                                <h5 className="text-xs font-medium text-slate-500 uppercase mb-3">Datos del Lead</h5>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    {Object.entries(detalleModal.cambio.datos_adicionales.lead).map(([campo, valores]: [string, any]) => {
                                        const campoNombre = {
                                            nombre_completo: 'Nombre',
                                            email: 'Email',
                                            telefono: 'Teléfono',
                                            genero: 'Género',
                                            localidad_id: 'Localidad',
                                            rubro_id: 'Rubro',
                                            origen_id: 'Origen'
                                        }[campo] || campo;
                                        
                                        return (
                                            <div key={campo} className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                                                <span className="text-xs font-medium text-slate-600 block mb-2">{campoNombre}</span>
                                                <div className="flex items-center gap-2 text-sm">
                                                    <span className="text-slate-500 line-through decoration-rose-300">{valores.anterior || 'Vacío'}</span>
                                                    <svg className="w-4 h-4 text-amber-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                    </svg>
                                                    <span className="font-medium text-indigo-600">{valores.nuevo || 'Vacío'}</span>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        {/* Contactos modificados */}
                        {detalleModal.cambio.datos_adicionales.contactos && (
                            <div className="mb-6">
                                <h5 className="text-xs font-medium text-slate-500 uppercase mb-3">Contactos modificados</h5>
                                {Object.entries(detalleModal.cambio.datos_adicionales.contactos).map(([contactoId, cambios]: [string, any]) => (
                                    <div key={contactoId} className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-3">
                                        <p className="text-xs font-semibold text-slate-700 mb-3">Contacto ID: {contactoId}</p>
                                        <div className="space-y-3">
                                            {Object.entries(cambios).map(([campo, valores]: [string, any]) => (
                                                <div key={campo} className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-xs text-slate-500 block">{campo}</span>
                                                        <span className="text-slate-700">{valores.anterior || 'Vacío'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs text-indigo-500 block">→</span>
                                                        <span className="text-indigo-700 font-medium">{valores.nuevo || 'Vacío'}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}

                        {/* Responsables modificados */}
                        {detalleModal.cambio.datos_adicionales.responsables && (
                            <div>
                                <h5 className="text-xs font-medium text-slate-500 uppercase mb-3">Responsables modificados</h5>
                                {Object.entries(detalleModal.cambio.datos_adicionales.responsables).map(([responsableId, cambios]: [string, any]) => (
                                    <div key={responsableId} className="bg-slate-50 p-4 rounded-lg border border-slate-200 mb-3">
                                        <p className="text-xs font-semibold text-slate-700 mb-3">Responsable ID: {responsableId}</p>
                                        <div className="space-y-3">
                                            {Object.entries(cambios).map(([campo, valores]: [string, any]) => (
                                                <div key={campo} className="grid grid-cols-2 gap-4 text-sm">
                                                    <div>
                                                        <span className="text-xs text-slate-500 block">{campo}</span>
                                                        <span className="text-slate-700">{valores.anterior || 'Vacío'}</span>
                                                    </div>
                                                    <div>
                                                        <span className="text-xs text-indigo-500 block">→</span>
                                                        <span className="text-indigo-700 font-medium">{valores.nuevo || 'Vacío'}</span>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}

                {/* Metadatos */}
                <div className="bg-slate-50 rounded-lg p-4 border-t border-slate-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="text-xs text-slate-500 block">Registrado por</span>
                            <p className="font-medium text-slate-900">{detalleModal.cambio.usuario}</p>
                        </div>
                        <div>
                            <span className="text-xs text-slate-500 block">Fecha del cambio</span>
                            <p className="font-medium text-slate-900">{detalleModal.cambio.fecha_cambio}</p>
                        </div>
                    </div>
                </div>
            </div>

            <div className="px-6 py-4 bg-slate-50 border-t border-slate-200 flex justify-end sticky bottom-0">
                <button onClick={() => setDetalleModal({ show: false, cambio: null })} className="px-4 py-2 text-sm bg-white border border-slate-300 rounded-lg hover:bg-slate-50">
                    Cerrar
                </button>
            </div>
        </div>
    </div>
)}
        </AppLayout>
    );
}