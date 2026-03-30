// resources/js/Pages/Comercial/Contratos/CreateFromEmpresa.tsx

import { Head, router } from '@inertiajs/react';
import { 
    User, Building, CreditCard, Truck, FileText, 
    Plus, Trash2, Save, ArrowLeft, ArrowUpCircle,
    Calculator, DollarSign, Wrench, Package, Settings, Calendar,
    ChevronDown, ChevronUp, Percent, CheckCircle
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';

import AppLayout from '@/layouts/app-layout';
import { useToast } from '@/contexts/ToastContext';
import DatosCliente from '@/components/contratos/sections/DatosCliente';
import DatosEmpresa from '@/components/contratos/sections/DatosEmpresa';
import DatosPersonalesCliente from '@/components/contratos/sections/DatosPersonalesCliente';
import ResponsablesSection from '@/components/contratos/sections/ResponsablesSection';
import MetodoPagoSection from '@/components/contratos/sections/MetodoPagoSection';
import VehiculosSection from '@/components/contratos/sections/VehiculosSection';
import ResponsiveCard from '@/components/ui/ResponsiveCard';
import ResponsiveGrid from '@/components/ui/responsiveGrid';
import FormField from '@/components/ui/formField';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import ConfirmDialog from '@/components/ui/ConfirmDialog';

interface Props {
    empresa: any;
    contacto: any;
    lead?: any;
    responsables: any[];
    vehiculos: any[];
    tiposResponsabilidad: any[];
    tiposDocumento: any[];
    nacionalidades: any[];
    categoriasFiscales: any[];
    plataformas: any[];
    rubros: any[];
    provincias: any[];
    tasas: any[];
    abonos: any[];
    convenios: any[];
    accesorios: any[];
    servicios: any[];
    metodosPago: any[];
}

export default function CreateFromEmpresa({
    empresa,
    contacto,
    lead,
    responsables: responsablesIniciales,
    vehiculos: vehiculosIniciales,
    tiposResponsabilidad,
    tiposDocumento,
    nacionalidades,
    categoriasFiscales,
    plataformas,
    rubros,
    provincias,
    tasas = [],
    abonos = [],
    convenios = [],
    accesorios = [],
    servicios = [],
    metodosPago = [],
}: Props) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isSavingCotizacion, setIsSavingCotizacion] = useState(false);
    const [cotizacionGuardada, setCotizacionGuardada] = useState(false);
    const [presupuestoGuardado, setPresupuestoGuardado] = useState<any>(null);
    const [isVisible, setIsVisible] = useState(false);
    const [vehiculoToDelete, setVehiculoToDelete] = useState<{ index: number } | null>(null);
    const toast = useToast();

    // Estados para vehículos
    const [vehiculosState, setVehiculosState] = useState<any[]>(() => {
        if (vehiculosIniciales && vehiculosIniciales.length > 0) {
            return vehiculosIniciales.map(v => ({
                id: v.id,
                patente: v.avl_patente || '',
                marca: v.avl_marca || '',
                modelo: v.avl_modelo || '',
                anio: v.avl_anio || '',
                color: v.avl_color || '',
                identificador: v.avl_identificador || '',
                codigo_alfa: v.codigo_alfa || '',
                tipo: ''
            }));
        }
        return [{ patente: '', marca: '', modelo: '', anio: '', color: '', identificador: '', tipo: '' }];
    });

    // Estados para cotización
    const [tasaId, setTasaId] = useState<number | null>(null);
    const [tasaCantidad, setTasaCantidad] = useState<number>(1);
    const [tasaBonificacion, setTasaBonificacion] = useState(0);
    
    const [abonoId, setAbonoId] = useState<number | null>(null);
    const [abonoCantidad, setAbonoCantidad] = useState<number>(1);
    const [abonoBonificacion, setAbonoBonificacion] = useState(0);
    const [abonoTipo, setAbonoTipo] = useState<'abono' | 'convenio'>('abono');
    
    const [serviciosItems, setServiciosItems] = useState<any[]>([]);
    const [accesoriosItems, setAccesoriosItems] = useState<any[]>([]);

    // Estado para responsables
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

    // Cálculos
    const tasaSeleccionada = useMemo(() => {
        if (!tasaId) return null;
        return tasas.find(t => t.id === tasaId);
    }, [tasas, tasaId]);

    const valorTasa = tasaSeleccionada?.precio || 0;
    const totalTasa = valorTasa * tasaCantidad * (1 - tasaBonificacion / 100);
    
    const abonoSeleccionado = useMemo(() => {
        if (!abonoId) return null;
        const lista = abonoTipo === 'abono' ? abonos : convenios;
        return lista.find(a => a.id === abonoId);
    }, [abonos, convenios, abonoId, abonoTipo]);

    const valorAbono = abonoSeleccionado?.precio || 0;
    const totalAbono = valorAbono * abonoCantidad * (1 - abonoBonificacion / 100);
    
    const subtotalServicios = serviciosItems.reduce((total, item) => {
        const precio = servicios.find(s => s.id === item.productoId)?.precio || 0;
        const subtotal = precio * item.cantidad;
        return total + (subtotal * (1 - (item.bonificacion || 0) / 100));
    }, 0);
    
    const subtotalAccesorios = accesoriosItems.reduce((total, item) => {
        const precio = accesorios.find(a => a.id === item.productoId)?.precio || 0;
        const subtotal = precio * item.cantidad;
        return total + (subtotal * (1 - (item.bonificacion || 0) / 100));
    }, 0);
    
    const totalInversionInicial = totalTasa + subtotalAccesorios;
    const totalCostoMensual = totalAbono + subtotalServicios;

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

    // Handlers
    const handleVehiculosChange = (nuevosVehiculos: any[]) => {
        setVehiculosState(nuevosVehiculos);
    };

    const confirmarEliminarVehiculo = (index: number) => {
        setVehiculoToDelete({ index });
    };

    const eliminarVehiculo = () => {
        if (vehiculoToDelete && vehiculosState.length > 1) {
            const nuevos = vehiculosState.filter((_, i) => i !== vehiculoToDelete.index);
            setVehiculosState(nuevos);
        }
        setVehiculoToDelete(null);
    };
    
    const agregarServicio = () => {
        setServiciosItems([...serviciosItems, { productoId: null, cantidad: 1, bonificacion: 0 }]);
    };
    
    const actualizarServicio = (index: number, field: string, value: any) => {
        const nuevos = [...serviciosItems];
        nuevos[index] = { ...nuevos[index], [field]: value };
        setServiciosItems(nuevos);
    };
    
    const eliminarServicio = (index: number) => {
        setServiciosItems(serviciosItems.filter((_, i) => i !== index));
    };
    
    const agregarAccesorio = () => {
        setAccesoriosItems([...accesoriosItems, { productoId: null, cantidad: 1, bonificacion: 0 }]);
    };
    
    const actualizarAccesorio = (index: number, field: string, value: any) => {
        const nuevos = [...accesoriosItems];
        nuevos[index] = { ...nuevos[index], [field]: value };
        setAccesoriosItems(nuevos);
    };
    
    const eliminarAccesorio = (index: number) => {
        setAccesoriosItems(accesoriosItems.filter((_, i) => i !== index));
    };

const guardarCotizacion = () => {
    if (!tasaId && !abonoId) {
        toast.error('Debe seleccionar al menos una tasa o un abono');
        return;
    }
    
    setIsSavingCotizacion(true);
    
    const agregados = [
        ...serviciosItems.filter(item => item.productoId).map(item => ({
            prd_servicio_id: item.productoId,
            cantidad: item.cantidad,
            aplica_a_todos_vehiculos: false,
            valor: servicios.find(s => s.id === item.productoId)?.precio || 0,
            bonificacion: item.bonificacion || 0
        })),
        ...accesoriosItems.filter(item => item.productoId).map(item => ({
            prd_servicio_id: item.productoId,
            cantidad: item.cantidad,
            aplica_a_todos_vehiculos: false,
            valor: accesorios.find(a => a.id === item.productoId)?.precio || 0,
            bonificacion: item.bonificacion || 0
        }))
    ];
    
    const cotizacionData = {
        prefijo_id: lead?.prefijo_id || 1,
        lead_id: lead?.id,
        cantidad_vehiculos: vehiculosState.length,
        validez: 30,
        tasa_id: tasaId || null,
        valor_tasa: valorTasa,
        tasa_bonificacion: tasaBonificacion,
        abono_id: abonoId || null,
        valor_abono: valorAbono,
        abono_bonificacion: abonoBonificacion,
        agregados: agregados
    };
    
    // 🔥 USAR EL NUEVO ENDPOINT CON FETCH
    fetch('/comercial/contratos/guardar-cotizacion', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
            'Accept': 'application/json'
        },
        body: JSON.stringify(cotizacionData)
    })
    .then(async response => {
        const data = await response.json();
        
        if (response.ok && data.success) {
            const nuevoPresupuesto = data.presupuesto;
            
            if (nuevoPresupuesto) {
                const anio = new Date(nuevoPresupuesto.created).getFullYear();
                const referencia = `LS-${anio}-${nuevoPresupuesto.id}`;
                
                setPresupuestoGuardado({
                    id: nuevoPresupuesto.id,
                    referencia: referencia,
                    total: nuevoPresupuesto.total_presupuesto || totalInversionInicial + totalCostoMensual
                });
                setCotizacionGuardada(true);
                toast.success(`Cotización guardada - Presupuesto #${referencia}`);
            } else {
                setCotizacionGuardada(true);
                toast.success('Cotización guardada exitosamente');
            }
        } else {
            toast.error(data.error || 'Error al guardar la cotización');
        }
        setIsSavingCotizacion(false);
    })
    .catch(error => {
        console.error('Error al guardar cotización:', error);
        toast.error('Error al guardar la cotización');
        setIsSavingCotizacion(false);
    });
};
    
const handleSubmit = () => {
    const vehiculosSinPatente = vehiculosState.filter(v => !v.patente || v.patente.trim() === '');
    if (vehiculosSinPatente.length > 0) {
        toast.error('Todos los vehículos deben tener patente');
        return;
    }
    
    setIsSubmitting(true);
    
    router.post('/comercial/contratos/desde-empresa', {
        empresa_id: empresa.id,
        contacto_id: contacto?.id,
        responsables,
        vehiculos: vehiculosState.map(v => ({
            id: v.id,
            patente: v.patente,
            marca: v.marca,
            modelo: v.modelo,
            anio: v.anio,
            color: v.color,
            identificador: v.identificador,
            tipo: v.tipo,
            codigo_alfa: v.codigo_alfa
        })),
        presupuesto_id: presupuestoGuardado?.id || null,
        cotizacion: {
            tasa_id: tasaId,
            tasa_cantidad: tasaCantidad,
            tasa_bonificacion: tasaBonificacion,
            abono_id: abonoId,
            abono_tipo: abonoTipo,
            abono_cantidad: abonoCantidad,
            abono_bonificacion: abonoBonificacion,
            servicios: serviciosItems,
            accesorios: accesoriosItems,
            total_inversion_inicial: totalInversionInicial,
            total_costo_mensual: totalCostoMensual
        },
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
            
            <div className="max-w-[1600px] mx-auto px-4 sm:px-6 py-6">
                {/* Header más ancho */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => window.history.back()}
                            className="p-2 hover:bg-gray-100 rounded-md transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-xl font-semibold text-gray-900">Nuevo Contrato</h1>
                            <p className="text-sm text-gray-500">{empresa.nombre_fantasia} • {empresa.cuit}</p>
                        </div>
                    </div>
                    
                    <div className="flex flex-col items-end gap-1">
                        <div className="flex gap-3">
                            <button
                                onClick={guardarCotizacion}
                                disabled={isSavingCotizacion}
                                className="px-5 py-2.5 bg-indigo-600 text-white rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                            >
                                <Calculator className="h-4 w-4" />
                                {isSavingCotizacion ? 'Guardando...' : 'Guardar Cotización'}
                            </button>
                            <button
                                onClick={handleSubmit}
                                disabled={isSubmitting || !cotizacionGuardada}
                                className="px-5 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
                            >
                                <Save className="h-4 w-4" />
                                {isSubmitting ? 'Generando...' : 'Generar Contrato'}
                            </button>
                        </div>
                        {!cotizacionGuardada && (
                            <p className="text-xs text-amber-600">
                                ⚠️ Debe guardar la cotización antes de generar el contrato
                            </p>
                        )}
                    </div>
                </div>

                {/* Grid principal - más ancho */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Columna izquierda - 2/3 */}
                    <div className="lg:col-span-2 space-y-6">
                        {lead && <DatosCliente lead={lead} />}
                        <DatosEmpresa empresa={empresa} />
                        <DatosPersonalesCliente contacto={contacto} />
                        <ResponsablesSection
                            responsables={responsables}
                            setResponsables={setResponsables}
                            tiposResponsabilidad={tiposResponsabilidad}
                            empresaId={empresa.id}
                            tipoResponsabilidadContacto={contacto?.tipo_responsabilidad_id}
                        />
                        <VehiculosSection
                            vehiculos={vehiculosState}
                            setVehiculos={handleVehiculosChange}
                            cantidadMaxima={99}
                            onEliminarVehiculo={confirmarEliminarVehiculo}
                        />
                        <MetodoPagoSection
                            metodoPago={metodoPago}
                            setMetodoPago={setMetodoPago}
                            datosCbu={datosCbu}
                            setDatosCbu={setDatosCbu}
                            datosTarjeta={datosTarjeta}
                            setDatosTarjeta={setDatosTarjeta}
                        />
                    </div>
                    
                    {/* Columna derecha - COTIZACIÓN más ancha */}
                    <div className="lg:col-span-1 space-y-6">
                        <div className="bg-white rounded-lg border border-gray-200 shadow-sm overflow-hidden sticky top-4">
                            <div className="px-5 py-4 bg-gradient-to-r from-indigo-50 to-violet-50 border-b border-indigo-100">
                                <div className="flex items-center gap-2">
                                    {cotizacionGuardada ? (
                                        <FileText className="h-5 w-5 text-green-600" />
                                    ) : (
                                        <Calculator className="h-5 w-5 text-indigo-600" />
                                    )}
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        {cotizacionGuardada ? 'Presupuesto Generado' : 'Cotización'}
                                    </h2>
                                </div>
                                {cotizacionGuardada && presupuestoGuardado && (
                                    <p className="text-xs text-green-600 mt-1">
                                        Presupuesto #{presupuestoGuardado.referencia} guardado
                                    </p>
                                )}
                            </div>
                            
                            <div className="p-5">
                                {cotizacionGuardada && presupuestoGuardado ? (
                                    // Resumen después de guardar
                                    <div className="space-y-5">
                                        <div className="bg-green-50 p-5 rounded-lg border border-green-200">
                                            <div className="text-center">
                                                <CheckCircle className="h-14 w-14 text-green-600 mx-auto mb-3" />
                                                <h3 className="font-semibold text-green-800 text-lg">¡Cotización guardada!</h3>
                                                <p className="text-sm text-green-600 mt-1">
                                                    Presupuesto #{presupuestoGuardado.referencia}
                                                </p>
                                            </div>
                                        </div>
                                        
                                        <div className="space-y-3">
                                            <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                                                <span className="text-gray-600">Vehículos:</span>
                                                <span className="font-medium">{vehiculosState.length}</span>
                                            </div>
                                            <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                                                <span className="text-gray-600">Inversión Inicial:</span>
                                                <span className="font-medium text-blue-600">${totalInversionInicial.toLocaleString('es-AR')}</span>
                                            </div>
                                            <div className="flex justify-between text-sm py-2 border-b border-gray-100">
                                                <span className="text-gray-600">Costo Mensual:</span>
                                                <span className="font-medium text-green-600">${totalCostoMensual.toLocaleString('es-AR')}</span>
                                            </div>
                                            <div className="flex justify-between text-base font-bold pt-3 mt-1 border-t border-gray-200">
                                                <span>Total Mensual:</span>
                                                <span className="text-emerald-600">${totalCostoMensual.toLocaleString('es-AR')}</span>
                                            </div>
                                        </div>
                                        
                                    </div>
                                ) : (
                                    // Formulario de cotización
                                    <div className="space-y-6">
                                        {/* TASA DE INSTALACIÓN */}
                                        <div className="border-b border-gray-200 pb-4 relative z-10">
                                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                <Truck className="h-4 w-4 text-blue-600" />
                                                Tasa de Instalación
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="relative z-20">
                                                    <Select
                                                        value={tasaId?.toString() || ''}
                                                        onValueChange={(value) => setTasaId(Number(value))}
                                                    >
                                                        <SelectTrigger className="bg-white w-full">
                                                            <SelectValue placeholder="Seleccionar tasa" />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white z-50 min-w-[280px]">
                                                            {tasas.map(tasa => (
                                                                <SelectItem key={tasa.id} value={tasa.id.toString()}>
                                                                    <div className="flex justify-between w-full gap-4">
                                                                        <span className="truncate max-w-[200px]">{tasa.nombre}</span>
                                                                        <span className="text-blue-600 font-medium">${tasa.precio.toLocaleString('es-AR')}</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs text-gray-500 block mb-1">Cantidad</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={tasaCantidad}
                                                            onChange={(e) => setTasaCantidad(Number(e.target.value))}
                                                            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 block mb-1">Bonif. %</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={tasaBonificacion}
                                                            onChange={(e) => setTasaBonificacion(Number(e.target.value))}
                                                            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="text-right text-sm font-medium pt-1">
                                                    <span className="text-gray-600">Total:</span>
                                                    <span className="ml-2 text-blue-600">${totalTasa.toLocaleString('es-AR')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* ACCESORIOS */}
                                        <div className="border-b border-gray-200 pb-4 relative z-10">
                                            <div className="flex justify-between items-center mb-3">
                                                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                    <Package className="h-4 w-4 text-purple-600" />
                                                    Accesorios
                                                </h3>
                                                <button
                                                    onClick={agregarAccesorio}
                                                    className="text-xs text-purple-600 hover:text-purple-700 font-medium"
                                                >
                                                    + Agregar
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {accesoriosItems.map((item, idx) => (
                                                    <div key={idx} className="flex gap-2 items-start">
                                                        <div className="flex-1 relative z-20">
                                                            <Select
                                                                value={item.productoId?.toString() || ''}
                                                                onValueChange={(v) => actualizarAccesorio(idx, 'productoId', Number(v))}
                                                            >
                                                                <SelectTrigger className="bg-white w-full">
                                                                    <SelectValue placeholder="Seleccionar accesorio" />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-white z-50 min-w-[280px]">
                                                                    {accesorios.map(a => (
                                                                        <SelectItem key={a.id} value={a.id.toString()}>
                                                                            <div className="flex justify-between w-full gap-4">
                                                                                <span className="truncate max-w-[200px]">{a.nombre}</span>
                                                                                <span className="text-purple-600 font-medium">${a.precio.toLocaleString('es-AR')}</span>
                                                                            </div>
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={item.cantidad}
                                                            onChange={(e) => actualizarAccesorio(idx, 'cantidad', Number(e.target.value))}
                                                            className="w-20 px-2 py-2 text-sm border rounded-lg text-center"
                                                        />
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={item.bonificacion}
                                                            onChange={(e) => actualizarAccesorio(idx, 'bonificacion', Number(e.target.value))}
                                                            className="w-20 px-2 py-2 text-sm border rounded-lg text-center"
                                                            placeholder="%"
                                                        />
                                                        <button
                                                            onClick={() => eliminarAccesorio(idx)}
                                                            className="text-red-500 hover:text-red-700 p-2"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* ABONO MENSUAL */}
                                        <div className="border-b border-gray-200 pb-4 relative z-10">
                                            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                                                <CreditCard className="h-4 w-4 text-green-600" />
                                                Abono Mensual
                                            </h3>
                                            <div className="space-y-3">
                                                <div className="flex gap-2">
                                                    <button
                                                        onClick={() => setAbonoTipo('abono')}
                                                        className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium transition-colors ${abonoTipo === 'abono' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                                    >
                                                        Abono
                                                    </button>
                                                    <button
                                                        onClick={() => setAbonoTipo('convenio')}
                                                        className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium transition-colors ${abonoTipo === 'convenio' ? 'bg-green-600 text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                                                    >
                                                        Convenio
                                                    </button>
                                                </div>
                                                
                                                <div className="relative z-20">
                                                    <Select
                                                        value={abonoId?.toString() || ''}
                                                        onValueChange={(value) => setAbonoId(Number(value))}
                                                    >
                                                        <SelectTrigger className="bg-white w-full">
                                                            <SelectValue placeholder={`Seleccionar ${abonoTipo}`} />
                                                        </SelectTrigger>
                                                        <SelectContent className="bg-white z-50 min-w-[280px]">
                                                            {(abonoTipo === 'abono' ? abonos : convenios).map(item => (
                                                                <SelectItem key={item.id} value={item.id.toString()}>
                                                                    <div className="flex justify-between w-full gap-4">
                                                                        <span className="truncate max-w-[200px]">{item.nombre}</span>
                                                                        <span className="text-green-600 font-medium">${item.precio.toLocaleString('es-AR')}</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                                
                                                <div className="grid grid-cols-2 gap-3">
                                                    <div>
                                                        <label className="text-xs text-gray-500 block mb-1">Cantidad</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            value={abonoCantidad}
                                                            onChange={(e) => setAbonoCantidad(Number(e.target.value))}
                                                            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                        />
                                                    </div>
                                                    <div>
                                                        <label className="text-xs text-gray-500 block mb-1">Bonif. %</label>
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={abonoBonificacion}
                                                            onChange={(e) => setAbonoBonificacion(Number(e.target.value))}
                                                            className="w-full px-3 py-2 text-sm border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                                                        />
                                                    </div>
                                                </div>
                                                <div className="text-right text-sm font-medium pt-1">
                                                    <span className="text-gray-600">Total mensual:</span>
                                                    <span className="ml-2 text-green-600">${totalAbono.toLocaleString('es-AR')}</span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        {/* SERVICIOS ADICIONALES */}
                                        <div className="border-b border-gray-200 pb-4 relative z-10">
                                            <div className="flex justify-between items-center mb-3">
                                                <h3 className="text-sm font-semibold text-gray-700 flex items-center gap-2">
                                                    <Wrench className="h-4 w-4 text-orange-600" />
                                                    Servicios Adicionales
                                                </h3>
                                                <button
                                                    onClick={agregarServicio}
                                                    className="text-xs text-orange-600 hover:text-orange-700 font-medium"
                                                >
                                                    + Agregar
                                                </button>
                                            </div>
                                            <div className="space-y-3">
                                                {serviciosItems.map((item, idx) => (
                                                    <div key={idx} className="flex gap-2 items-start">
                                                        <div className="flex-1 relative z-20">
                                                            <Select
                                                                value={item.productoId?.toString() || ''}
                                                                onValueChange={(v) => actualizarServicio(idx, 'productoId', Number(v))}
                                                            >
                                                                <SelectTrigger className="bg-white w-full">
                                                                    <SelectValue placeholder="Seleccionar servicio" />
                                                                </SelectTrigger>
                                                                <SelectContent className="bg-white z-50 min-w-[280px]">
                                                                    {servicios.map(s => (
                                                                        <SelectItem key={s.id} value={s.id.toString()}>
                                                                            <div className="flex justify-between w-full gap-4">
                                                                                <span className="truncate max-w-[200px]">{s.nombre}</span>
                                                                                <span className="text-orange-600 font-medium">${s.precio.toLocaleString('es-AR')}</span>
                                                                            </div>
                                                                        </SelectItem>
                                                                    ))}
                                                                </SelectContent>
                                                            </Select>
                                                        </div>
                                                        <input
                                                            type="number"
                                                            min="1"
                                                            value={item.cantidad}
                                                            onChange={(e) => actualizarServicio(idx, 'cantidad', Number(e.target.value))}
                                                            className="w-20 px-2 py-2 text-sm border rounded-lg text-center"
                                                        />
                                                        <input
                                                            type="number"
                                                            min="0"
                                                            max="100"
                                                            value={item.bonificacion}
                                                            onChange={(e) => actualizarServicio(idx, 'bonificacion', Number(e.target.value))}
                                                            className="w-20 px-2 py-2 text-sm border rounded-lg text-center"
                                                            placeholder="%"
                                                        />
                                                        <button
                                                            onClick={() => eliminarServicio(idx)}
                                                            className="text-red-500 hover:text-red-700 p-2"
                                                        >
                                                            <Trash2 className="h-4 w-4" />
                                                        </button>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                        
                                        {/* TOTALES */}
                                        <div className="pt-3 space-y-3">
                                            <div className="bg-blue-50 p-4 rounded-lg">
                                                <div className="flex justify-between text-base font-semibold">
                                                    <span>💰 Inversión Inicial (Pago Único):</span>
                                                    <span className="text-blue-700">${totalInversionInicial.toLocaleString('es-AR')}</span>
                                                </div>
                                            </div>
                                            <div className="bg-green-50 p-4 rounded-lg">
                                                <div className="flex justify-between text-base font-semibold">
                                                    <span>📅 Costo Recurrente (Mensual):</span>
                                                    <span className="text-green-700">${totalCostoMensual.toLocaleString('es-AR')}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <ConfirmDialog
                isOpen={vehiculoToDelete !== null}
                onClose={() => setVehiculoToDelete(null)}
                onConfirm={eliminarVehiculo}
                title="Eliminar vehículo"
                message="¿Está seguro que desea eliminar este vehículo?"
                confirmText="Eliminar"
                cancelText="Cancelar"
                type="danger"
            />

            <button
                onClick={scrollToTop}
                className={`fixed bottom-6 right-6 p-3 bg-[rgb(247,98,0)] text-white rounded-full shadow-lg hover:bg-[rgb(220,80,0)] transition-all duration-300 z-50 ${
                    isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
                }`}
            >
                <ArrowUpCircle className="h-6 w-6" />
            </button>
        </AppLayout>
    );
}