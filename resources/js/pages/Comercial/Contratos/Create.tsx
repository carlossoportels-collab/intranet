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
}

interface Empresa {
    id: number;
    nombre_fantasia: string;
    razon_social: string;
    cuit: string;
}

interface Contacto {
    id: number;
    tipo_responsabilidad_id?: number;
    lead?: {
        nombre_completo: string;
        email?: string;
        telefono?: string;
    }
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
    const [vehiculoToDelete, setVehiculoToDelete] = useState<{ index: number } | null>(null);
    const toast = useToast();

    // 🔥 MODIFICADO: Inicializar con al menos un vehículo vacío (sin restricción de cantidad)
    const [vehiculos, setVehiculos] = useState<any[]>([
        { patente: '', marca: '', modelo: '', anio: '', color: '', identificador: '', tipo: '' }
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

    // 🔥 NUEVAS FUNCIONES: Agregar y eliminar vehículos
    const agregarVehiculo = () => {
        setVehiculos([...vehiculos, { patente: '', marca: '', modelo: '', anio: '', color: '', identificador: '', tipo: '' }]);
    };

    const confirmarEliminarVehiculo = (index: number) => {
        if (vehiculos.length === 1) {
            toast.error('Debe haber al menos un vehículo');
            return;
        }
        setVehiculoToDelete({ index });
    };

    const eliminarVehiculo = () => {
        if (vehiculoToDelete && vehiculos.length > 1) {
            const nuevos = vehiculos.filter((_, i) => i !== vehiculoToDelete.index);
            setVehiculos(nuevos);
        }
        setVehiculoToDelete(null);
    };

    const handleVehiculosChange = (nuevosVehiculos: any[]) => {
        setVehiculos(nuevosVehiculos);
    };

    const handleSubmit = () => {
        // 🔥 MODIFICADO: Solo validar que haya al menos un vehículo con patente
        if (vehiculos.length === 0) {
            toast.error('Debe cargar al menos un vehículo');
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
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
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
                        className="px-5 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
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
                        
                        {/* 🔥 MODIFICADO: Vehículos - SIN RESTRICCIÓN DE CANTIDAD */}
                        <VehiculosSection
                            vehiculos={vehiculos}
                            setVehiculos={handleVehiculosChange}
                            cantidadMaxima={99}
                            onEliminarVehiculo={confirmarEliminarVehiculo}
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
                                onClick={() => setVehiculoToDelete(null)}
                                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={eliminarVehiculo}
                                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                            >
                                Eliminar
                            </button>
                        </div>
                    </div>
                </div>
            )}

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