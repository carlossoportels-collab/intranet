// resources/js/Pages/Comercial/Contratos/CreateFromEmpresa.tsx
import { Head, router } from '@inertiajs/react';
import { Save, ArrowLeft, ArrowUpCircle, Building, User, Truck, CreditCard, Phone, Mail, MapPin, Hash, Briefcase, Tag, Cpu } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import AppLayout from '@/layouts/app-layout';
import { useToast } from '@/contexts/ToastContext';
import TablaVehiculos from '@/components/contratos/sections/TablaVehiculos';
import MetodoPagoSection from '@/components/contratos/sections/MetodoPagoSection';
import ResponsablesSection from '@/components/contratos/sections/ResponsablesSection'; // ← Importar

interface Props {
    empresa: any;
    contacto: any;
    responsables: any[];
    vehiculos: any[];
    tiposResponsabilidad: any[];
    tiposDocumento: any[];
    nacionalidades: any[];
    categoriasFiscales: any[];
    plataformas: any[];
    rubros: any[];
    provincias: any[];
}

export default function CreateFromEmpresa({
    empresa,
    contacto,
    responsables: responsablesIniciales,
    vehiculos: vehiculosIniciales,
    tiposResponsabilidad,
    tiposDocumento,
    nacionalidades,
    categoriasFiscales,
    plataformas,
    rubros,
    provincias,
}: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isVisible, setIsVisible] = useState(false);
    const toast = useToast();

    const [responsables, setResponsables] = useState<any[]>(responsablesIniciales);

    const [metodoPago, setMetodoPago] = useState<'cbu' | 'tarjeta' | null>(null);
    const [datosCbu, setDatosCbu] = useState({
        nombre_banco: '',
        cbu: '',
        alias_cbu: '',
        titular_cuenta: '',
        tipo_cuenta: 'caja_ahorro'
    });
    const [datosTarjeta, setDatosTarjeta] = useState({
        tarjeta_emisor: '',
        tarjeta_expiracion: '',
        tarjeta_numero: '',
        tarjeta_codigo: '',
        tarjeta_banco: '',
        titular_tarjeta: '',
        tipo_tarjeta: 'debito'
    });

    useEffect(() => {
        const toggleVisibility = () => {
            setIsVisible(window.scrollY > 300);
        };
        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

const totalMensualAbonos = vehiculosIniciales.reduce((total, vehiculo) => {
    if (!vehiculo.abonos) return total;
    return total + vehiculo.abonos.reduce((sum, abono) => {
        const precioConDescuento = abono.abono_precio - (abono.abono_precio * (abono.abono_descuento / 100));
        return sum + precioConDescuento;
    }, 0);
}, 0);

const handleSubmit = () => {
    setIsSubmitting(true);

    router.post('/comercial/contratos/desde-empresa', {
        empresa_id: empresa.id,
        contacto_id: contacto?.id,
        responsables,
        metodo_pago: metodoPago,
        total_mensual_abonos: totalMensualAbonos, // ← Enviamos el total
        ...(metodoPago === 'cbu' && { datos_cbu: datosCbu }),
        ...(metodoPago === 'tarjeta' && { datos_tarjeta: datosTarjeta })
    }, {
        onSuccess: () => {
            toast.success('Contrato generado exitosamente');
            setIsSubmitting(false);
        },
        onError: (errors) => {
            console.error(errors);
            toast.error('Error al generar contrato');
            setIsSubmitting(false);
        }
    });
};

    const getDireccionCompleta = () => {
        const partes = [];
        if (empresa.direccion_fiscal) partes.push(empresa.direccion_fiscal);
        if (empresa.localidad_fiscal?.nombre) partes.push(empresa.localidad_fiscal.nombre);
        if (empresa.localidad_fiscal?.provincia?.nombre) partes.push(empresa.localidad_fiscal.provincia.nombre);
        const direccion = partes.join(', ');
        return empresa.codigo_postal_fiscal ? `${direccion} (CP: ${empresa.codigo_postal_fiscal})` : direccion;
    };

    const getLocalidadContacto = () => {
        if (!contacto?.lead?.localidad) return null;
        const localidad = contacto.lead.localidad.nombre;
        const provincia = contacto.lead.localidad.provincia?.nombre;
        return provincia ? `${localidad}, ${provincia}` : localidad;
    };

    return (
        <AppLayout title="Generar Contrato">
            <Head title="Generar Contrato" />
            
            <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6">
                {/* Header compacto */}
                <div className="mb-6 flex items-center justify-between bg-white p-4 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.history.back()}
                            className="p-1.5 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            <ArrowLeft className="h-4 w-4" />
                        </button>
                        <div>
                            <h1 className="text-lg font-semibold text-gray-900">Nuevo Contrato</h1>
                            <p className="text-xs text-gray-500">{empresa.nombre_fantasia} • {empresa.cuit}</p>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-sm"
                    >
                        <Save className="h-4 w-4" />
                        {isSubmitting ? 'Generando...' : 'Generar'}
                    </button>
                </div>

                {/* Grid de 2 columnas */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Columna izquierda */}
                    <div className="space-y-6">
                        {/* Datos Empresa - Compacto */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                                <Building className="h-4 w-4 text-indigo-600" />
                                <h2 className="text-sm font-semibold text-gray-700">Empresa</h2>
                            </div>
                            <div className="p-3 space-y-2 text-sm">
                                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                                    <span className="text-gray-500 text-xs flex items-center gap-1">
                                        <Hash className="h-3 w-3" /> Código
                                    </span>
                                    <span className="font-mono font-medium">{empresa.codigo_completo || empresa.codigo_alfa_empresa || '-'}</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                                    <span className="text-gray-500 text-xs">CUIT</span>
                                    <span className="font-mono">{empresa.cuit || '-'}</span>
                                </div>
                                <div className="flex items-center justify-between border-b border-gray-100 pb-1.5">
                                    <span className="text-gray-500 text-xs flex items-center gap-1">
                                        <Phone className="h-3 w-3" /> Teléfono
                                    </span>
                                    <span>{empresa.telefono_fiscal || '-'}</span>
                                </div>
                                <div className="border-b border-gray-100 pb-1.5">
                                    <span className="text-gray-500 text-xs block mb-0.5">Razón Social</span>
                                    <span className="font-medium truncate">{empresa.razon_social}</span>
                                </div>
                                <div className="border-b border-gray-100 pb-1.5">
                                    <span className="text-gray-500 text-xs flex items-center gap-1 mb-0.5">
                                        <Mail className="h-3 w-3" /> Email
                                    </span>
                                    <span className="truncate text-xs">{empresa.email_fiscal || '-'}</span>
                                </div>
                                <div className="border-b border-gray-100 pb-1.5">
                                    <span className="text-gray-500 text-xs flex items-center gap-1 mb-0.5">
                                        <MapPin className="h-3 w-3" /> Dirección
                                    </span>
                                    <span className="text-xs">{getDireccionCompleta() || '-'}</span>
                                </div>
                                <div className="grid grid-cols-3 gap-2 pt-1">
                                    <div>
                                        <span className="text-gray-500 text-xs block">Rubro</span>
                                        <span className="text-xs font-medium truncate">{empresa.rubro?.nombre || '-'}</span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-xs block">Categoría</span>
                                        <span className="text-xs truncate">
                                            {empresa.categoria_fiscal?.nombre || '-'}
                                        </span>
                                    </div>
                                    <div>
                                        <span className="text-gray-500 text-xs block">Plataforma</span>
                                        <span className="text-xs truncate">{empresa.plataforma?.nombre || '-'}</span>
                                    </div>
                                </div>
                                {empresa.nombre_flota && (
                                    <div className="pt-1">
                                        <span className="text-gray-500 text-xs block">Flota</span>
                                        <span className="text-xs">{empresa.nombre_flota}</span>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Contacto - Compacto */}
                        {contacto && (
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                                    <User className="h-4 w-4 text-purple-600" />
                                    <h2 className="text-sm font-semibold text-gray-700">Contacto Principal</h2>
                                </div>
                                <div className="p-3 space-y-2 text-sm">
                                    <div className="border-b border-gray-100 pb-1.5">
                                        <span className="text-gray-500 text-xs block">Nombre</span>
                                        <span className="font-medium">{contacto.lead?.nombre_completo}</span>
                                    </div>
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <span className="text-gray-500 text-xs flex items-center gap-1">
                                                <Mail className="h-3 w-3" /> Email
                                            </span>
                                            <span className="text-xs truncate">{contacto.lead?.email || '-'}</span>
                                        </div>
                                        <div>
                                            <span className="text-gray-500 text-xs flex items-center gap-1">
                                                <Phone className="h-3 w-3" /> Teléfono
                                            </span>
                                            <span className="text-xs">{contacto.lead?.telefono || '-'}</span>
                                        </div>
                                    </div>
                                    {(contacto.nro_documento || contacto.fecha_nacimiento) && (
                                        <div className="grid grid-cols-2 gap-2">
                                            {contacto.nro_documento && (
                                                <div>
                                                    <span className="text-gray-500 text-xs block">Documento</span>
                                                    <span className="text-xs">{contacto.nro_documento}</span>
                                                </div>
                                            )}
                                            {contacto.fecha_nacimiento && (
                                                <div>
                                                    <span className="text-gray-500 text-xs block">Nacimiento</span>
                                                    <span className="text-xs">{new Date(contacto.fecha_nacimiento).toLocaleDateString('es-AR')}</span>
                                                </div>
                                            )}
                                        </div>
                                    )}
                                    {contacto.direccion_personal && (
                                        <div>
                                            <span className="text-gray-500 text-xs flex items-center gap-1">
                                                <MapPin className="h-3 w-3" /> Dirección
                                            </span>
                                            <span className="text-xs">
                                                {contacto.direccion_personal}
                                                {contacto.codigo_postal_personal && ` (CP: ${contacto.codigo_postal_personal})`}
                                            </span>
                                        </div>
                                    )}
                                    {getLocalidadContacto() && (
                                        <div>
                                            <span className="text-gray-500 text-xs block">Localidad</span>
                                            <span className="text-xs">{getLocalidadContacto()}</span>
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Columna derecha */}
                    <div className="space-y-6">
                        {/* Responsables - NUEVA SECCIÓN */}
                        <ResponsablesSection
                            responsables={responsables}
                            setResponsables={setResponsables}
                            tiposResponsabilidad={tiposResponsabilidad}
                            empresaId={empresa.id}
                            tipoResponsabilidadContacto={contacto?.tipo_responsabilidad_id || 0}
                        />

                        {/* Vehículos */}
                        {vehiculosIniciales.length > 0 && (
                            <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                                <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <Truck className="h-4 w-4 text-emerald-600" />
                                        <h2 className="text-sm font-semibold text-gray-700">Vehículos y Abonos</h2>
                                    </div>
                                    <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                        {vehiculosIniciales.length} vehículos
                                    </span>
                                </div>
                                <div className="p-3">
                                    <TablaVehiculos 
                                        vehiculos={vehiculosIniciales} 
                                        itemsPerPage={3} 
                                        showAbonos={true}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Método de Pago */}
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden">
                            <div className="px-4 py-2 bg-gray-50 border-b border-gray-200 flex items-center gap-2">
                                <CreditCard className="h-4 w-4 text-amber-600" />
                                <h2 className="text-sm font-semibold text-gray-700">Método de Pago</h2>
                            </div>
                            <div className="p-3">
                                <MetodoPagoSection
                                    metodoPago={metodoPago}
                                    setMetodoPago={setMetodoPago}
                                    datosCbu={datosCbu}
                                    setDatosCbu={setDatosCbu}
                                    datosTarjeta={datosTarjeta}
                                    setDatosTarjeta={setDatosTarjeta}
                                />
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Botón flotante */}
            <button
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