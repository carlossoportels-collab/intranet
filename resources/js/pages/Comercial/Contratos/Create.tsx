// resources/js/Pages/Comercial/Contratos/Create.tsx
import { Head, router } from '@inertiajs/react';
import { 
    User, Building, CreditCard, Truck, FileText, 
    Plus, Trash2, Save, ArrowLeft, ArrowUpCircle 
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import DatosCliente from '@/components/contratos/sections/DatosCliente';
import DatosEmpresa from '@/components/contratos/sections/DatosEmpresa';
import DatosPersonalesCliente from '@/components/contratos/sections/DatosPersonalesCliente';
import MetodoPagoSection from '@/components/contratos/sections/MetodoPagoSection';
import ResponsablesSection from '@/components/contratos/sections/ResponsablesSection';
import ResumenContrato from '@/components/contratos/sections/ResumenContrato';
import VehiculosSection from '@/components/contratos/sections/VehiculosSection';
import { useToast } from '@/contexts/ToastContext';
import AppLayout from '@/layouts/app-layout';

// Interfaces específicas
interface Presupuesto {
    id: number;
    cantidad_vehiculos: number;
    lead?: any;
    // ... otros campos
}

interface Empresa {
    id: number;
    nombre_fantasia: string;
    razon_social: string;
    cuit: string;
    // ... otros campos
}

interface Contacto {
    id: number;
    tipo_responsabilidad_id?: number;
    lead?: {
        nombre_completo: string;
        email?: string;
        telefono?: string;
    };
    // ... otros campos
}

interface Props {
    presupuesto: Presupuesto;
    empresa: Empresa;
    contacto: Contacto;
    responsables: any[];
    tiposResponsabilidad: any[];
    tiposDocumento: any[];
    nacionalidades: any[];
    categoriasFiscales: any[];
    plataformas: any[];
    rubros: any[];
    provincias: any[];
}

export default function CreateContrato({
    presupuesto,
    empresa,
    contacto,
    responsables: responsablesIniciales,
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

    // Estado para vehículos
    const [vehiculos, setVehiculos] = useState<any[]>([
        { patente: '', marca: '', modelo: '', anio: '', color: '', identificador: '' }
    ]);

    // Estado para responsables adicionales
    const [responsables, setResponsables] = useState<any[]>(responsablesIniciales);

    // Estado para método de pago
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

    // Efecto para el botón scroll to top
    useEffect(() => {
        const toggleVisibility = () => {
            if (window.scrollY > 300) {
                setIsVisible(true);
            } else {
                setIsVisible(false);
            }
        };

        window.addEventListener('scroll', toggleVisibility);
        return () => window.removeEventListener('scroll', toggleVisibility);
    }, []);

    const scrollToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth'
        });
    };

    const handleSubmit = () => {
                // Validar vehículos
        if (vehiculos.length === 0) {
            toast.error('Debe cargar al menos un vehículo');
            return;
        }

        // Validar que estén todos los vehículos requeridos
        if (vehiculos.length < presupuesto.cantidad_vehiculos) {
            toast.error(`Debe completar los ${presupuesto.cantidad_vehiculos} vehículos presupuestados. Faltan ${presupuesto.cantidad_vehiculos - vehiculos.length}.`);
            return;
        }

        // Validar campos requeridos de cada vehículo (patente)
        const vehiculosSinPatente = vehiculos.filter(v => !v.patente || v.patente.trim() === '');
        if (vehiculosSinPatente.length > 0) {
            toast.error('Todos los vehículos deben tener patente');
            return;
        }
        setIsSubmitting(true);

        router.post('/comercial/contratos', {
            presupuesto_id: presupuesto.id,
            empresa_id: empresa.id,
            contacto_id: contacto.id,
            vehiculos,
            responsables,
            metodo_pago: metodoPago,
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

    return (
        <AppLayout title="Generar Contrato">
            <Head title="Generar Contrato" />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {/* Header */}
                <div className="mb-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => window.history.back()}
                            className="p-2 hover:bg-gray-100 rounded-lg"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-2xl font-bold text-gray-900">
                                Generar Contrato
                            </h1>
                            <p className="text-sm text-gray-600 mt-1">
                                Complete los datos faltantes para generar el contrato
                            </p>
                        </div>
                    </div>
                    
                    <button
                        onClick={handleSubmit}
                        disabled={isSubmitting}
                        className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                        <Save className="h-4 w-4" />
                        {isSubmitting ? 'Generando...' : 'Generar Contrato'}
                    </button>
                </div>

                {/* Contenido - Grid de 2 columnas */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Columna principal - 2/3 */}
                    <div className="lg:col-span-2 space-y-6">
                        {/* Datos del Cliente (precargados, no editables) */}
                        <DatosCliente lead={presupuesto.lead} />
                        
                        {/* Datos Personales del Cliente */}
                        <DatosPersonalesCliente contacto={contacto} />
                        
                        {/* Datos de la Empresa (precargados, no editables) */}
                        <DatosEmpresa empresa={empresa} />
                        
                        {/* Responsables Adicionales */}
                        <ResponsablesSection
                            responsables={responsables}
                            setResponsables={setResponsables}
                            tiposResponsabilidad={tiposResponsabilidad}
                            empresaId={empresa.id}
                            tipoResponsabilidadContacto={contacto.tipo_responsabilidad_id}
                        />
                        
                        {/* Vehículos */}
                        <VehiculosSection
                            vehiculos={vehiculos}
                            setVehiculos={setVehiculos}
                            cantidadMaxima={presupuesto.cantidad_vehiculos}
                        />
                        
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
                        <ResumenContrato presupuesto={presupuesto} />
                    </div>
                </div>
            </div>

            {/* Botón flotante para volver arriba */}
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