// resources/js/Pages/Comercial/Contratos/Edit.tsx

import { Head, router } from '@inertiajs/react';
import { 
    User, Building, CreditCard, Truck, FileText, 
    Plus, Trash2, Save, ArrowLeft, ArrowUpCircle, X,  
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import DatosCliente from '@/components/contratos/sections/DatosCliente';
import DatosEmpresa from '@/components/contratos/sections/DatosEmpresa';
import DatosPersonalesCliente from '@/components/contratos/sections/DatosPersonalesCliente';
import MetodoPagoSection from '@/components/contratos/sections/MetodoPagoSection';
import ResponsablesSection from '@/components/contratos/sections/ResponsablesSection';
import ResumenContrato from '@/components/contratos/sections/ResumenContrato';
import { StatusBadge } from '@/components/ui/StatusBadge';
import VehiculosSection from '@/components/contratos/sections/VehiculosSection';
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
}

export default function EditContrato({
    contrato,
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

    // Estado para vehículos (cargar los existentes)
    const [vehiculos, setVehiculos] = useState<any[]>(contrato.vehiculos || []);

    // Estado para responsables adicionales
    const [responsables, setResponsables] = useState<any[]>(contrato.responsables_adicionales || []);

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

    // Estado para controlar campos sensibles visibles
    const [showSensitive, setShowSensitive] = useState({
        cbu: false,
        tarjeta_numero: false,
        tarjeta_codigo: false,
        tarjeta_expiracion: false
    });

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
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const agregarVehiculo = () => {
        setVehiculos([...vehiculos, { 
            patente: '', marca: '', modelo: '', anio: '', color: '', identificador: '', tipo: '' 
        }]);
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

    const handleSubmit = () => {
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

        router.put(`/comercial/contratos/${contrato.id}`, {
            vehiculos,
            responsables,
            metodo_pago: metodoPago,
            ...(metodoPago === 'cbu' && { datos_cbu: datosCbu }),
            ...(metodoPago === 'tarjeta' && { datos_tarjeta: datosTarjeta })
        }, {
            onSuccess: () => {
                toast.success('Contrato actualizado exitosamente');
                setIsSubmitting(false);
                router.visit(`/comercial/contratos/${contrato.id}`);
            },
            onError: (errors) => {
                console.error(errors);
                toast.error('Error al actualizar contrato');
                setIsSubmitting(false);
            }
        });
    };

    // Función para alternar visibilidad de datos sensibles
    const toggleSensitive = (field: keyof typeof showSensitive) => {
        setShowSensitive(prev => ({ ...prev, [field]: !prev[field] }));
    };

    // Función para enmascarar datos
    const maskData = (value: string, show: boolean, maskLength: number = 8) => {
        if (show || !value) return value;
        return '*'.repeat(Math.min(maskLength, value.length)) + value.slice(-4);
    };

    return (
        <AppLayout title={`Editar Contrato #${contrato.numero_contrato}`}>
            <Head title={`Editar Contrato #${contrato.numero_contrato}`} />
            
            <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
                {/* Header */}
                <div className="mb-6 flex flex-wrap items-center justify-between gap-4 bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => router.visit(`/comercial/contratos/${contrato.id}`)}
                            className="p-2 hover:bg-gray-100 rounded-lg"
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
                            onClick={() => router.visit(`/comercial/contratos/${contrato.id}`)}
                            className="px-5 py-2.5 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 flex items-center gap-2 text-sm font-medium"
                        >
                            <X className="h-4 w-4" />
                            Cancelar
                        </button>
                        <button
                            onClick={handleSubmit}
                            disabled={isSubmitting}
                            className="px-5 py-2.5 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center gap-2 text-sm font-medium"
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
                        {/* Datos del Cliente (solo lectura) */}
                        <DatosCliente lead={contrato.lead} />
                        
                        {/* Datos Personales del Cliente (solo lectura) */}
                        <DatosPersonalesCliente contacto={contrato.contacto} />
                        
                        {/* Datos de la Empresa (solo lectura) */}
                        <DatosEmpresa empresa={contrato.empresa} />
                        
                        {/* Responsables Adicionales - EDITABLE */}
                        <ResponsablesSection
                            responsables={responsables}
                            setResponsables={setResponsables}
                            tiposResponsabilidad={tiposResponsabilidad}
                            empresaId={contrato.empresa_id}
                            tipoResponsabilidadContacto={contrato.contacto?.tipo_responsabilidad_id}
                        />
                        
                        {/* Vehículos - EDITABLE */}
                        <div>
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                                    <Truck className="h-5 w-5" />
                                    Vehículos
                                </h3>
                                <button
                                    type="button"
                                    onClick={agregarVehiculo}
                                    className="inline-flex items-center px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700"
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
                                            className="absolute top-2 right-2 p-1 text-red-600 hover:bg-red-50 rounded"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                        
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Patente *
                                                </label>
                                                <input
                                                    type="text"
                                                    value={vehiculo.patente}
                                                    onChange={(e) => {
                                                        const nuevos = [...vehiculos];
                                                        nuevos[index].patente = e.target.value.toUpperCase();
                                                        setVehiculos(nuevos);
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                    placeholder="ABC123"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Tipo
                                                </label>
                                                <select
                                                    value={vehiculo.tipo || ''}
                                                    onChange={(e) => {
                                                        const nuevos = [...vehiculos];
                                                        nuevos[index].tipo = e.target.value;
                                                        setVehiculos(nuevos);
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
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
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Marca
                                                </label>
                                                <input
                                                    type="text"
                                                    value={vehiculo.marca || ''}
                                                    onChange={(e) => {
                                                        const nuevos = [...vehiculos];
                                                        nuevos[index].marca = e.target.value;
                                                        setVehiculos(nuevos);
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Modelo
                                                </label>
                                                <input
                                                    type="text"
                                                    value={vehiculo.modelo || ''}
                                                    onChange={(e) => {
                                                        const nuevos = [...vehiculos];
                                                        nuevos[index].modelo = e.target.value;
                                                        setVehiculos(nuevos);
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Año
                                                </label>
                                                <input
                                                    type="text"
                                                    value={vehiculo.anio || ''}
                                                    onChange={(e) => {
                                                        const nuevos = [...vehiculos];
                                                        nuevos[index].anio = e.target.value;
                                                        setVehiculos(nuevos);
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                    placeholder="2024"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Color
                                                </label>
                                                <input
                                                    type="text"
                                                    value={vehiculo.color || ''}
                                                    onChange={(e) => {
                                                        const nuevos = [...vehiculos];
                                                        nuevos[index].color = e.target.value;
                                                        setVehiculos(nuevos);
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                />
                                            </div>
                                            <div className="md:col-span-2">
                                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                                    Identificador (opcional)
                                                </label>
                                                <input
                                                    type="text"
                                                    value={vehiculo.identificador || ''}
                                                    onChange={(e) => {
                                                        const nuevos = [...vehiculos];
                                                        nuevos[index].identificador = e.target.value;
                                                        setVehiculos(nuevos);
                                                    }}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                    placeholder="Número de chasis, motor, etc."
                                                />
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        
                        {/* Método de Pago - EDITABLE */}
                        <MetodoPagoSection
                            metodoPago={metodoPago}
                            setMetodoPago={setMetodoPago}
                            datosCbu={datosCbu}
                            setDatosCbu={setDatosCbu}
                            datosTarjeta={datosTarjeta}
                            setDatosTarjeta={setDatosTarjeta}
                            showSensitive={showSensitive}
                            onToggleSensitive={toggleSensitive}
                            maskData={maskData}
                        />
                    </div>
                    
                    {/* Columna lateral - 1/3 */}
                    <div className="space-y-6">
                        <ResumenContrato presupuesto={contrato.presupuesto} />
                        
                        {/* Estado del Contrato */}
                        <div className="bg-white rounded-lg border border-gray-200 p-4">
                            <h3 className="font-semibold text-gray-900 mb-3">Información adicional</h3>
                            <div className="space-y-2 text-sm">
                                <p className="text-gray-600">
                                    <span className="font-medium">Creado:</span> {new Date(contrato.created_at).toLocaleDateString()}
                                </p>
                                <p className="text-gray-600">
                                    <span className="font-medium">Última modificación:</span> {new Date(contrato.updated_at).toLocaleDateString()}
                                </p>
                            </div>
                        </div>
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