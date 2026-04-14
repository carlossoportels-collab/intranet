// resources/js/Pages/Comercial/Contratos/Edit.tsx

import { Head, router } from '@inertiajs/react';
import { 
    User, Building, CreditCard, Truck, FileText, 
    Plus, Trash2, Save, ArrowLeft, ArrowUpCircle, X,  
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useMemo } from 'react';

import MetodoPagoSection from '@/components/contratos/sections/MetodoPagoSection';
import ResponsablesSection from '@/components/contratos/sections/ResponsablesSection';
import { useToast } from '@/contexts/ToastContext';
import AppLayout from '@/layouts/app-layout';

interface Props {
    contrato: any;
    tiposResponsabilidad: any[];
    tiposDocumento: any[];
    nacionalidades: any[];
    categoriasFiscales: any[];
    plataformas: any[];
    rubros: any[];
    provincias: any[];
    localidades?: any[];
    origenes?: any[];
}

type SensitiveField = 'cbu' | 'tarjeta_numero' | 'tarjeta_codigo' | 'tarjeta_expiracion';

export default function EditContrato({
    contrato,
    tiposResponsabilidad,
    tiposDocumento,
    nacionalidades,
    categoriasFiscales,
    plataformas,
    rubros,
    provincias,
    localidades = [],
    origenes = [],
}: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const [vehiculoToDelete, setVehiculoToDelete] = useState<{ index: number } | null>(null);
    const toast = useToast();

    // Estado para vehículos
    const [vehiculos, setVehiculos] = useState<any[]>(contrato.vehiculos || []);

    // Estado para responsables adicionales
const [responsables, setResponsables] = useState<any[]>(contrato.empresa?.responsables || []);

    // Estado para método de pago
    const [metodoPago, setMetodoPago] = useState<'cbu' | 'tarjeta' | null>(
        contrato.debito_cbu ? 'cbu' : contrato.debito_tarjeta ? 'tarjeta' : null
    );
    
    const [datosCbu, setDatosCbu] = useState({
        nombre_banco: contrato.debito_cbu?.nombre_banco || '',
        cbu: contrato.debito_cbu?.cbu || '',
        alias_cbu: contrato.debito_cbu?.alias_cbu || '',
        titular_cuenta: contrato.debito_cbu?.titular_cuenta || '',
        tipo_cuenta: contrato.debito_cbu?.tipo_cuenta || 'caja_ahorro'
    });
    
    const [datosTarjeta, setDatosTarjeta] = useState({
        tarjeta_emisor: contrato.debito_tarjeta?.tarjeta_emisor || '',
        tarjeta_expiracion: contrato.debito_tarjeta?.tarjeta_expiracion || '',
        tarjeta_numero: contrato.debito_tarjeta?.tarjeta_numero || '',
        tarjeta_codigo: contrato.debito_tarjeta?.tarjeta_codigo || '',
        tarjeta_banco: contrato.debito_tarjeta?.tarjeta_banco || '',
        titular_tarjeta: contrato.debito_tarjeta?.titular_tarjeta || '',
        tipo_tarjeta: contrato.debito_tarjeta?.tipo_tarjeta || 'debito'
    });

    // Estado para datos sensibles
    const [showSensitive, setShowSensitive] = useState<Record<SensitiveField, boolean>>({
        cbu: false,
        tarjeta_numero: false,
        tarjeta_codigo: false,
        tarjeta_expiracion: false
    });

    // Estados para datos editables
    const [editLeadData, setEditLeadData] = useState<any>(null);
    const [editContactoData, setEditContactoData] = useState<any>(null);
    const [editEmpresaData, setEditEmpresaData] = useState<any>(null);

    // Localidades filtradas por provincia para cliente
    const localidadesFiltradasCliente = useMemo(() => {
        if (!editLeadData?.provincia_id) return [];
        return localidades.filter((l: any) => l.provincia_id === editLeadData.provincia_id);
    }, [localidades, editLeadData?.provincia_id]);

    // Localidades filtradas por provincia para empresa
    const localidadesFiltradasEmpresa = useMemo(() => {
        if (!editEmpresaData?.provincia_fiscal_id) return [];
        return localidades.filter((l: any) => l.provincia_id === editEmpresaData.provincia_fiscal_id);
    }, [localidades, editEmpresaData?.provincia_fiscal_id]);

    // Scroll to top button visibility
    useEffect(() => {
        const toggleVisibility = () => {
            setIsVisible(window.scrollY > 300);
        };
        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);
// Inicializar datos editables
useEffect(() => {
    if (contrato.lead) {
        setEditLeadData({
            id: contrato.lead.id,
            nombre_completo: contrato.lead.nombre_completo || contrato.cliente_nombre_completo,
            email: contrato.lead.email || contrato.cliente_email,
            telefono: contrato.lead.telefono || contrato.cliente_telefono,
            provincia_id: contrato.lead.localidad?.provincia_id || null,
            provincia_nombre: contrato.lead.localidad?.provincia?.nombre || contrato.cliente_provincia,
            localidad_id: contrato.lead.localidad_id || null,
            localidad_nombre: contrato.lead.localidad?.nombre || contrato.cliente_localidad,
            rubro_id: contrato.lead.rubro_id || null,
            rubro_nombre: contrato.lead.rubro?.nombre || contrato.cliente_rubro,
            origen_id: contrato.lead.origen_id || null,
            origen_nombre: contrato.lead.origen?.nombre || contrato.cliente_origen,
        });
    }

    const contacto = contrato.lead?.empresa_contacto || contrato.contacto;
    if (contacto) {
        setEditContactoData({
            id: contacto.id,
            tipo_responsabilidad_id: contacto.tipo_responsabilidad_id,
            tipo_documento_id: contacto.tipo_documento_id,
            nro_documento: contacto.nro_documento || contrato.contacto_nro_documento,
            nacionalidad_id: contacto.nacionalidad_id,
            fecha_nacimiento: contacto.fecha_nacimiento || contrato.contacto_fecha_nacimiento,
            direccion_personal: contacto.direccion_personal || contrato.contacto_direccion_personal,
            codigo_postal_personal: contacto.codigo_postal_personal || contrato.contacto_codigo_postal_personal,
        });
    }

    if (contrato.empresa) {
        setEditEmpresaData({
            id: contrato.empresa.id,
            nombre_fantasia: contrato.empresa.nombre_fantasia || contrato.empresa_nombre_fantasia,
            razon_social: contrato.empresa.razon_social || contrato.empresa_razon_social,
            cuit: contrato.empresa.cuit || contrato.empresa_cuit,
            direccion_fiscal: contrato.empresa.direccion_fiscal || contrato.empresa_domicilio_fiscal,
            provincia_fiscal_id: contrato.empresa.localidad_fiscal?.provincia_id || null,
            provincia_fiscal_nombre: contrato.empresa.localidad_fiscal?.provincia?.nombre || contrato.empresa_provincia_fiscal,
            localidad_fiscal_id: contrato.empresa.localidad_fiscal_id || null,
            localidad_fiscal_nombre: contrato.empresa.localidad_fiscal?.nombre || contrato.empresa_localidad_fiscal,
            telefono_fiscal: contrato.empresa.telefono_fiscal || contrato.empresa_telefono_fiscal,
            email_fiscal: contrato.empresa.email_fiscal || contrato.empresa_email_fiscal,
            rubro_id: contrato.empresa.rubro_id,
            categoria_fiscal_id: contrato.empresa.cat_fiscal_id || contrato.empresa.categoria_fiscal_id,
            plataforma_id: contrato.empresa.plataforma_id,
            nombre_flota: contrato.empresa.nombre_flota || contrato.empresa_nombre_flota,
        });
        
        // 🔥 CARGAR RESPONSABLES DESDE LA EMPRESA
        if (contrato.empresa.responsables) {
            setResponsables(contrato.empresa.responsables);
        }
    }
}, [contrato]);

    const scrollToTop = useCallback(() => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }, []);

    const agregarVehiculo = useCallback(() => {
        setVehiculos(prev => [...prev, { 
            patente: '', marca: '', modelo: '', anio: '', color: '', identificador: '', tipo: '' 
        }]);
    }, []);

    const actualizarVehiculo = useCallback((index: number, field: string, value: string) => {
        setVehiculos(prev => {
            const nuevos = [...prev];
            nuevos[index] = { ...nuevos[index], [field]: value };
            return nuevos;
        });
    }, []);

    const confirmarEliminarVehiculo = useCallback((index: number) => {
        if (vehiculos.length === 1) {
            toast.error('Debe haber al menos un vehículo');
            return;
        }
        setVehiculoToDelete({ index });
    }, [vehiculos.length, toast]);

    const eliminarVehiculo = useCallback(() => {
        if (vehiculoToDelete && vehiculos.length > 1) {
            setVehiculos(prev => prev.filter((_, i) => i !== vehiculoToDelete.index));
        }
        setVehiculoToDelete(null);
    }, [vehiculos.length, vehiculoToDelete]);

    const toggleSensitive = useCallback((field: string) => {
        const validFields: SensitiveField[] = ['cbu', 'tarjeta_numero', 'tarjeta_codigo', 'tarjeta_expiracion'];
        if (validFields.includes(field as SensitiveField)) {
            setShowSensitive(prev => ({ 
                ...prev, 
                [field as SensitiveField]: !prev[field as SensitiveField] 
            }));
        }
    }, []);

    const maskData = useCallback((value: string, show: boolean, maskLength: number = 16) => {
        if (show || !value) return value;
        if (value.length <= 4) return '*'.repeat(value.length);
        const asteriskCount = Math.max(0, value.length - 4);
        return '*'.repeat(asteriskCount) + value.slice(-4);
    }, []);

const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    
    if (vehiculos.length === 0) {
        toast.error('Debe cargar al menos un vehículo');
        return;
    }

    const vehiculosSinPatente = vehiculos.filter(v => !v.patente || v.patente.trim() === '');
    if (vehiculosSinPatente.length > 0) {
        toast.error('Todos los vehículos deben tener patente');
        return;
    }
    
    setIsSubmitting(true);

    const payload: any = {
        vehiculos,
        responsables,
        metodo_pago: metodoPago,
        ...(metodoPago === 'cbu' && { datos_cbu: datosCbu }),
        ...(metodoPago === 'tarjeta' && { datos_tarjeta: datosTarjeta }),
        lead_data: editLeadData,
        contacto_data: editContactoData,
        empresa_data: editEmpresaData,
    };

    router.put(`/comercial/contratos/${contrato.id}`, payload, {
        onSuccess: (page) => {
            toast.success('Contrato actualizado exitosamente');
            setIsSubmitting(false);
            // Redirigir a la vista show
            router.visit(`/comercial/contratos/${contrato.id}`);
        },
        onError: (errors) => {
            console.error(errors);
            const errorMessage = typeof errors === 'string' ? errors : 'Error al actualizar contrato';
            toast.error(errorMessage);
            setIsSubmitting(false);
        }
    });
}, [vehiculos, responsables, metodoPago, datosCbu, datosTarjeta, editLeadData, editContactoData, editEmpresaData, contrato.id, toast, router]);
    return (
        <AppLayout title={`Editar Contrato #${contrato.numero_contrato}`}>
            <Head title={`Editar Contrato #${contrato.numero_contrato}`} />
            
            <form onSubmit={handleSubmit}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                    {/* Header */}
                    <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-4">
                            <button
                                type="button"
                                onClick={() => router.visit(`/comercial/contratos/${contrato.id}`)}
                                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900">
                                    Editar Contrato #{contrato.numero_contrato}
                                </h1>
                                <p className="text-sm text-gray-600 mt-1">
                                    Modifique los datos necesarios del contrato
                                </p>
                            </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <button
                                type="button"
                                onClick={() => router.visit(`/comercial/contratos/${contrato.id}`)}
                                className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center gap-2 text-sm font-medium transition-colors"
                            >
                                <X className="h-4 w-4" />
                                Cancelar
                            </button>
                            <button
                                type="submit"
                                disabled={isSubmitting}
                                className="px-5 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium transition-colors"
                            >
                                <Save className="h-4 w-4" />
                                {isSubmitting ? 'Guardando...' : 'Guardar Cambios'}
                            </button>
                        </div>
                    </div>

                    {/* Contenido - Grid de 2 columnas */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Columna principal - 2/3 */}
                        <div className="lg:col-span-2 space-y-6">
                            {/* Datos del Cliente - EDITABLE */}
                            {editLeadData && (
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Datos del Cliente
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                                            <input
                                                type="text"
                                                value={editLeadData.nombre_completo || ''}
                                                onChange={(e) => setEditLeadData({...editLeadData, nombre_completo: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                                            <input
                                                type="email"
                                                value={editLeadData.email || ''}
                                                onChange={(e) => setEditLeadData({...editLeadData, email: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                                            <input
                                                type="tel"
                                                value={editLeadData.telefono || ''}
                                                onChange={(e) => setEditLeadData({...editLeadData, telefono: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                                            <select
                                                value={editLeadData.provincia_id || ''}
                                                onChange={(e) => {
                                                    const provinciaId = parseInt(e.target.value);
                                                    const provincia = provincias.find(p => p.id === provinciaId);
                                                    setEditLeadData({
                                                        ...editLeadData, 
                                                        provincia_id: provinciaId || null,
                                                        provincia_nombre: provincia?.nombre || '',
                                                        localidad_id: null,
                                                        localidad_nombre: ''
                                                    });
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            >
                                                <option value="">Seleccionar provincia</option>
                                                {provincias.map((p: any) => (
                                                    <option key={p.id} value={p.id}>{p.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Localidad</label>
                                            <select
                                                value={editLeadData.localidad_id || ''}
                                                onChange={(e) => {
                                                    const localidadId = parseInt(e.target.value);
                                                    const localidad = localidades.find(l => l.id === localidadId);
                                                    setEditLeadData({
                                                        ...editLeadData, 
                                                        localidad_id: localidadId || null,
                                                        localidad_nombre: localidad?.nombre || ''
                                                    });
                                                }}
                                                disabled={!editLeadData.provincia_id}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                                            >
                                                <option value="">Seleccionar localidad</option>
                                                {localidadesFiltradasCliente.map((l: any) => (
                                                    <option key={l.id} value={l.id}>{l.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Rubro</label>
                                            <select
                                                value={editLeadData.rubro_id || ''}
                                                onChange={(e) => {
                                                    const rubroId = parseInt(e.target.value);
                                                    const rubro = rubros.find(r => r.id === rubroId);
                                                    setEditLeadData({
                                                        ...editLeadData, 
                                                        rubro_id: rubroId || null,
                                                        rubro_nombre: rubro?.nombre || ''
                                                    });
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            >
                                                <option value="">Seleccionar rubro</option>
                                                {rubros.map((r: any) => (
                                                    <option key={r.id} value={r.id}>{r.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
                                            <select
                                                value={editLeadData.origen_id || ''}
                                                onChange={(e) => {
                                                    const origenId = parseInt(e.target.value);
                                                    const origen = origenes.find(o => o.id === origenId);
                                                    setEditLeadData({
                                                        ...editLeadData, 
                                                        origen_id: origenId || null,
                                                        origen_nombre: origen?.nombre || ''
                                                    });
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            >
                                                <option value="">Seleccionar origen</option>
                                                {origenes.map((o: any) => (
                                                    <option key={o.id} value={o.id}>{o.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Datos Personales del Cliente - EDITABLE */}
                            {editContactoData && (
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <User className="h-5 w-5" />
                                        Datos Personales del Cliente
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Responsabilidad</label>
                                            <select
                                                value={editContactoData.tipo_responsabilidad_id || ''}
                                                onChange={(e) => setEditContactoData({...editContactoData, tipo_responsabilidad_id: parseInt(e.target.value) || null})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            >
                                                <option value="">Seleccionar</option>
                                                {tiposResponsabilidad.map((t: any) => (
                                                    <option key={t.id} value={t.id}>{t.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Tipo Documento</label>
                                            <select
                                                value={editContactoData.tipo_documento_id || ''}
                                                onChange={(e) => setEditContactoData({...editContactoData, tipo_documento_id: parseInt(e.target.value) || null})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            >
                                                <option value="">Seleccionar</option>
                                                {tiposDocumento.map((t: any) => (
                                                    <option key={t.id} value={t.id}>{t.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Número Documento</label>
                                            <input
                                                type="text"
                                                value={editContactoData.nro_documento || ''}
                                                onChange={(e) => setEditContactoData({...editContactoData, nro_documento: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nacionalidad</label>
                                            <select
                                                value={editContactoData.nacionalidad_id || ''}
                                                onChange={(e) => setEditContactoData({...editContactoData, nacionalidad_id: parseInt(e.target.value) || null})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            >
                                                <option value="">Seleccionar</option>
                                                {nacionalidades.map((n: any) => (
                                                    <option key={n.id} value={n.id}>{n.pais}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Fecha Nacimiento</label>
                                            <input
                                                type="date"
                                                value={editContactoData.fecha_nacimiento || ''}
                                                onChange={(e) => setEditContactoData({...editContactoData, fecha_nacimiento: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Personal</label>
                                            <input
                                                type="text"
                                                value={editContactoData.direccion_personal || ''}
                                                onChange={(e) => setEditContactoData({...editContactoData, direccion_personal: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Código Postal</label>
                                            <input
                                                type="text"
                                                value={editContactoData.codigo_postal_personal || ''}
                                                onChange={(e) => setEditContactoData({...editContactoData, codigo_postal_personal: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Datos de la Empresa - EDITABLE */}
                            {editEmpresaData && (
                                <div className="bg-white rounded-lg border border-gray-200 p-4">
                                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                                        <Building className="h-5 w-5" />
                                        Datos de la Empresa
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Fantasía</label>
                                            <input
                                                type="text"
                                                value={editEmpresaData.nombre_fantasia || ''}
                                                onChange={(e) => setEditEmpresaData({...editEmpresaData, nombre_fantasia: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Razón Social</label>
                                            <input
                                                type="text"
                                                value={editEmpresaData.razon_social || ''}
                                                onChange={(e) => setEditEmpresaData({...editEmpresaData, razon_social: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">CUIT</label>
                                            <input
                                                type="text"
                                                value={editEmpresaData.cuit || ''}
                                                onChange={(e) => setEditEmpresaData({...editEmpresaData, cuit: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Rubro</label>
                                            <select
                                                value={editEmpresaData.rubro_id || ''}
                                                onChange={(e) => setEditEmpresaData({...editEmpresaData, rubro_id: parseInt(e.target.value) || null})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            >
                                                <option value="">Seleccionar</option>
                                                {rubros.map((r: any) => (
                                                    <option key={r.id} value={r.id}>{r.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Categoría Fiscal</label>
                                            <select
                                                value={editEmpresaData.categoria_fiscal_id || ''}
                                                onChange={(e) => setEditEmpresaData({...editEmpresaData, categoria_fiscal_id: parseInt(e.target.value) || null})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            >
                                                <option value="">Seleccionar</option>
                                                {categoriasFiscales.map((c: any) => (
                                                    <option key={c.id} value={c.id}>{c.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Plataforma</label>
                                            <select
                                                value={editEmpresaData.plataforma_id || ''}
                                                onChange={(e) => setEditEmpresaData({...editEmpresaData, plataforma_id: parseInt(e.target.value) || null})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            >
                                                <option value="">Seleccionar</option>
                                                {plataformas.map((p: any) => (
                                                    <option key={p.id} value={p.id}>{p.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div className="md:col-span-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Dirección Fiscal</label>
                                            <input
                                                type="text"
                                                value={editEmpresaData.direccion_fiscal || ''}
                                                onChange={(e) => setEditEmpresaData({...editEmpresaData, direccion_fiscal: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Provincia Fiscal</label>
                                            <select
                                                value={editEmpresaData.provincia_fiscal_id || ''}
                                                onChange={(e) => {
                                                    const provinciaId = parseInt(e.target.value);
                                                    const provincia = provincias.find(p => p.id === provinciaId);
                                                    setEditEmpresaData({
                                                        ...editEmpresaData, 
                                                        provincia_fiscal_id: provinciaId || null,
                                                        provincia_fiscal_nombre: provincia?.nombre || '',
                                                        localidad_fiscal_id: null,
                                                        localidad_fiscal_nombre: ''
                                                    });
                                                }}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            >
                                                <option value="">Seleccionar provincia</option>
                                                {provincias.map((p: any) => (
                                                    <option key={p.id} value={p.id}>{p.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Localidad Fiscal</label>
                                            <select
                                                value={editEmpresaData.localidad_fiscal_id || ''}
                                                onChange={(e) => {
                                                    const localidadId = parseInt(e.target.value);
                                                    const localidad = localidades.find(l => l.id === localidadId);
                                                    setEditEmpresaData({
                                                        ...editEmpresaData, 
                                                        localidad_fiscal_id: localidadId || null,
                                                        localidad_fiscal_nombre: localidad?.nombre || ''
                                                    });
                                                }}
                                                disabled={!editEmpresaData.provincia_fiscal_id}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent disabled:bg-gray-100"
                                            >
                                                <option value="">Seleccionar localidad</option>
                                                {localidadesFiltradasEmpresa.map((l: any) => (
                                                    <option key={l.id} value={l.id}>{l.nombre}</option>
                                                ))}
                                            </select>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono Fiscal</label>
                                            <input
                                                type="tel"
                                                value={editEmpresaData.telefono_fiscal || ''}
                                                onChange={(e) => setEditEmpresaData({...editEmpresaData, telefono_fiscal: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Email Fiscal</label>
                                            <input
                                                type="email"
                                                value={editEmpresaData.email_fiscal || ''}
                                                onChange={(e) => setEditEmpresaData({...editEmpresaData, email_fiscal: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-1">Nombre Flota</label>
                                            <input
                                                type="text"
                                                value={editEmpresaData.nombre_flota || ''}
                                                onChange={(e) => setEditEmpresaData({...editEmpresaData, nombre_flota: e.target.value})}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                            />
                                        </div>
                                    </div>
                                </div>
                            )}
                            
                            {/* Responsables Adicionales */}
                            <ResponsablesSection
                                responsables={responsables}
                                setResponsables={setResponsables}
                                tiposResponsabilidad={tiposResponsabilidad}
                                empresaId={contrato.empresa_id}
                                tipoResponsabilidadContacto={contrato.contacto?.tipo_responsabilidad_id}
                            />
                            
                            {/* Vehículos */}
                            <div>
                                <div className="flex justify-between items-center mb-4">
                                    <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                        <Truck className="h-5 w-5" />
                                        Vehículos
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={agregarVehiculo}
                                        className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 transition-colors"
                                    >
                                        <Plus className="h-4 w-4 mr-1" />
                                        Agregar
                                    </button>
                                </div>
                                
                                <div className="space-y-4">
                                    {vehiculos.map((vehiculo, index) => (
                                        <div key={index} className="border border-gray-200 rounded-lg p-4 relative">
                                            <button
                                                type="button"
                                                onClick={() => confirmarEliminarVehiculo(index)}
                                                className="absolute top-2 right-2 p-1 text-red-600 hover:bg-red-50 rounded transition-colors"
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </button>
                                            
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Patente *</label>
                                                    <input
                                                        type="text"
                                                        value={vehiculo.patente}
                                                        onChange={(e) => actualizarVehiculo(index, 'patente', e.target.value.toUpperCase())}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                        placeholder="ABC123"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                                                    <select
                                                        value={vehiculo.tipo || ''}
                                                        onChange={(e) => actualizarVehiculo(index, 'tipo', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    >
                                                        <option value="">Seleccionar...</option>
                                                        <option value="auto">Auto</option>
                                                        <option value="camioneta">Camioneta</option>
                                                        <option value="camion">Camión</option>
                                                        <option value="moto">Moto</option>
                                                        <option value="utilitario">Utilitario</option>
                                                        <option value="minibus">Minibus</option>
                                                        <option value="colectivo">Colectivo</option>
                                                        <option value="maquinaria">Maquinaria</option>
                                                        <option value="otro">Otro</option>
                                                    </select>
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Marca</label>
                                                    <input
                                                        type="text"
                                                        value={vehiculo.marca || ''}
                                                        onChange={(e) => actualizarVehiculo(index, 'marca', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Modelo</label>
                                                    <input
                                                        type="text"
                                                        value={vehiculo.modelo || ''}
                                                        onChange={(e) => actualizarVehiculo(index, 'modelo', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Año</label>
                                                    <input
                                                        type="text"
                                                        value={vehiculo.anio || ''}
                                                        onChange={(e) => actualizarVehiculo(index, 'anio', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                        placeholder="2024"
                                                    />
                                                </div>
                                                <div>
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Color</label>
                                                    <input
                                                        type="text"
                                                        value={vehiculo.color || ''}
                                                        onChange={(e) => actualizarVehiculo(index, 'color', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                    />
                                                </div>
                                                <div className="md:col-span-2">
                                                    <label className="block text-sm font-medium text-gray-700 mb-1">Identificador (opcional)</label>
                                                    <input
                                                        type="text"
                                                        value={vehiculo.identificador || ''}
                                                        onChange={(e) => actualizarVehiculo(index, 'identificador', e.target.value)}
                                                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                                        placeholder="numero de movil, etc."
                                                    />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                            
                            {/* Método de Pago */}
                            <MetodoPagoSection
                                metodoPago={metodoPago}
                                setMetodoPago={setMetodoPago}
                                datosCbu={datosCbu}
                                setDatosCbu={setDatosCbu}
                                datosTarjeta={datosTarjeta}
                                setDatosTarjeta={setDatosTarjeta}
                            />
                        </div>
                        
                        {/* Columna lateral - 1/3 */}
                        <div className="space-y-6">
                            {/* Resumen del Presupuesto */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                                    <FileText className="h-4 w-4" />
                                    Presupuesto Asociado
                                </h3>
                                <div className="space-y-2 text-sm">
                                    <p className="text-gray-600">
                                        <span className="font-medium">Referencia:</span> {contrato.presupuesto_referencia || contrato.presupuesto?.referencia || '-'}
                                    </p>
                                    <p className="text-gray-600">
                                        <span className="font-medium">Fecha:</span> {contrato.presupuesto?.created ? new Date(contrato.presupuesto.created).toLocaleDateString() : '-'}
                                    </p>
                                    <div className="border-t pt-2 mt-2">
                                        <p className="text-gray-600">
                                            <span className="font-medium">💰 Inversión inicial:</span>
                                            <span className="ml-2 text-green-600 font-semibold">
                                                ${(contrato.presupuesto_total_inversion || 0).toLocaleString()}
                                            </span>
                                        </p>
                                        <p className="text-gray-600">
                                            <span className="font-medium">📅 Costo mensual:</span>
                                            <span className="ml-2 text-blue-600 font-semibold">
                                                ${(contrato.presupuesto_total_mensual || 0).toLocaleString()}
                                            </span>
                                        </p>
                                    </div>
                                    {contrato.presupuesto?.cantidad_vehiculos && (
                                        <p className="text-gray-600">
                                            <span className="font-medium">🚗 Cantidad vehículos:</span>
                                            <span className="ml-2">{contrato.presupuesto.cantidad_vehiculos}</span>
                                        </p>
                                    )}
                                </div>
                            </div>
                            
                            {/* Información adicional */}
                            <div className="bg-white rounded-lg border border-gray-200 p-4">
                                <h3 className="font-semibold text-gray-900 mb-3">Información adicional</h3>
                                <div className="space-y-2 text-sm">
                                    <p className="text-gray-600">
                                        <span className="font-medium">Creado:</span> {contrato.created ? new Date(contrato.created).toLocaleDateString() : '-'}
                                    </p>
                                    <p className="text-gray-600">
                                        <span className="font-medium">Última modificación:</span> {contrato.modified ? new Date(contrato.modified).toLocaleDateString() : '-'}
                                    </p>
                                    <p className="text-gray-600">
                                        <span className="font-medium">Vendedor:</span> {contrato.vendedor_nombre || '-'}
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </form>

            {/* ConfirmDialog para eliminar vehículo */}
            {vehiculoToDelete !== null && (
                <div className="fixed inset-0 bg-black/50 z-[99990] flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
                        <div className="p-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-2">Eliminar vehículo</h3>
                            <p className="text-gray-600">¿Está seguro que desea eliminar este vehículo?</p>
                        </div>
                        <div className="flex justify-end gap-3 p-6 pt-0">
                            <button
                                type="button"
                                onClick={() => setVehiculoToDelete(null)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                type="button"
                                onClick={eliminarVehiculo}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Botón flotante para volver arriba */}
            <button
                type="button"
                onClick={scrollToTop}
                className={`fixed bottom-6 right-6 p-3 bg-[rgb(247,98,0)] text-white rounded-full shadow-lg hover:bg-[rgb(220,80,0)] transition-all duration-300 z-50 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
                }`}
                title="Volver arriba"
            >
                <ArrowUpCircle className="h-6 w-6" />
            </button>
        </AppLayout>
    );
}