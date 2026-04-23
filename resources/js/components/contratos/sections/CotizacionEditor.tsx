// resources/js/components/contratos/sections/CotizacionEditor.tsx
import { Calculator, Package, Wrench, Truck, CreditCard, Plus, Trash2 } from 'lucide-react';
import React, { useState, useMemo } from 'react';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { useToast } from '@/contexts/ToastContext';

interface Producto {
    id: number;
    nombre: string;
    precio: number;
}

interface Props {
    contratoId: number;
    presupuestoActual: any;
    tasas: Producto[];
    abonos: Producto[];
    convenios: Producto[];
    accesorios: Producto[];
    servicios: Producto[];
    onCotizacionActualizada: (presupuestoActualizado: any) => void;
}

interface ItemAgregado {
    id?: string;
    productoId: number | null;
    cantidad: number;
    bonificacion: number;
    aplicaATodos: boolean;
}

export default function CotizacionEditor({
    contratoId,
    presupuestoActual,
    tasas,
    abonos,
    convenios,
    accesorios,
    servicios,
    onCotizacionActualizada
}: Props) {
    const toast = useToast();
    const [isOpen, setIsOpen] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    
    // Estados para la cotización
    const [cantidadVehiculos, setCantidadVehiculos] = useState(presupuestoActual?.cantidad_vehiculos || 1);
    const [tasaId, setTasaId] = useState<number | null>(presupuestoActual?.tasa_id || null);
    const [tasaBonificacion, setTasaBonificacion] = useState(presupuestoActual?.tasa_bonificacion || 0);
    const [abonoId, setAbonoId] = useState<number | null>(presupuestoActual?.abono_id || null);
    const [abonoTipo, setAbonoTipo] = useState<'abono' | 'convenio'>('abono');
    const [abonoBonificacion, setAbonoBonificacion] = useState(presupuestoActual?.abono_bonificacion || 0);
    
    const [accesoriosItems, setAccesoriosItems] = useState<ItemAgregado[]>(() => {
        if (presupuestoActual?.agregados) {
            return presupuestoActual.agregados
                .filter((a: any) => a.productoServicio?.tipo_id === 5)
                .map((a: any) => ({
                    id: a.id?.toString(),
                    productoId: a.prd_servicio_id,
                    cantidad: a.cantidad,
                    bonificacion: a.bonificacion || 0,
                    aplicaATodos: a.aplica_a_todos_vehiculos || false
                }));
        }
        return [];
    });
    
    const [serviciosItems, setServiciosItems] = useState<ItemAgregado[]>(() => {
        if (presupuestoActual?.agregados) {
            return presupuestoActual.agregados
                .filter((a: any) => a.productoServicio?.tipo_id === 3)
                .map((a: any) => ({
                    id: a.id?.toString(),
                    productoId: a.prd_servicio_id,
                    cantidad: a.cantidad,
                    bonificacion: a.bonificacion || 0,
                    aplicaATodos: a.aplica_a_todos_vehiculos || false
                }));
        }
        return [];
    });

    // Cálculos
    const tasaSeleccionada = useMemo(() => {
        if (!tasaId) return null;
        return tasas.find(t => t.id === tasaId);
    }, [tasas, tasaId]);

    const valorTasa = tasaSeleccionada?.precio || 0;
    const totalTasa = valorTasa * cantidadVehiculos * (1 - tasaBonificacion / 100);

    const abonoSeleccionado = useMemo(() => {
        if (!abonoId) return null;
        const lista = abonoTipo === 'abono' ? abonos : convenios;
        return lista.find(a => a.id === abonoId);
    }, [abonos, convenios, abonoId, abonoTipo]);

    const valorAbono = abonoSeleccionado?.precio || 0;
    const totalAbono = valorAbono * cantidadVehiculos * (1 - abonoBonificacion / 100);

    const subtotalServicios = serviciosItems.reduce((total, item) => {
        const producto = servicios.find(s => s.id === item.productoId);
        const precio = producto?.precio || 0;
        const cantidad = item.aplicaATodos ? cantidadVehiculos : item.cantidad;
        const subtotal = precio * cantidad;
        return total + (subtotal * (1 - (item.bonificacion || 0) / 100));
    }, 0);

    const subtotalAccesorios = accesoriosItems.reduce((total, item) => {
        const producto = accesorios.find(a => a.id === item.productoId);
        const precio = producto?.precio || 0;
        const cantidad = item.aplicaATodos ? cantidadVehiculos : item.cantidad;
        const subtotal = precio * cantidad;
        return total + (subtotal * (1 - (item.bonificacion || 0) / 100));
    }, 0);

    const totalInversionInicial = totalTasa + subtotalAccesorios;
    const totalCostoMensual = totalAbono + subtotalServicios;

    // Handlers
    const agregarAccesorio = () => {
        setAccesoriosItems([...accesoriosItems, { productoId: null, cantidad: 1, bonificacion: 0, aplicaATodos: false }]);
    };

    const actualizarAccesorio = (index: number, field: keyof ItemAgregado, value: any) => {
        const nuevos = [...accesoriosItems];
        nuevos[index] = { ...nuevos[index], [field]: value };
        setAccesoriosItems(nuevos);
    };

    const eliminarAccesorio = (index: number) => {
        setAccesoriosItems(accesoriosItems.filter((_, i) => i !== index));
    };

    const agregarServicio = () => {
        setServiciosItems([...serviciosItems, { productoId: null, cantidad: 1, bonificacion: 0, aplicaATodos: false }]);
    };

    const actualizarServicio = (index: number, field: keyof ItemAgregado, value: any) => {
        const nuevos = [...serviciosItems];
        nuevos[index] = { ...nuevos[index], [field]: value };
        setServiciosItems(nuevos);
    };

    const eliminarServicio = (index: number) => {
        setServiciosItems(serviciosItems.filter((_, i) => i !== index));
    };

    const guardarCotizacion = async () => {
        if (!tasaId && !abonoId && accesoriosItems.length === 0 && serviciosItems.length === 0) {
            toast.error('Debe seleccionar al menos un producto');
            return;
        }

        setIsSaving(true);

        const agregados = [
            ...serviciosItems.filter(item => item.productoId).map(item => ({
                prd_servicio_id: item.productoId,
                cantidad: item.cantidad,
                aplica_a_todos_vehiculos: item.aplicaATodos,
                valor: servicios.find(s => s.id === item.productoId)?.precio || 0,
                bonificacion: item.bonificacion || 0
            })),
            ...accesoriosItems.filter(item => item.productoId).map(item => ({
                prd_servicio_id: item.productoId,
                cantidad: item.cantidad,
                aplica_a_todos_vehiculos: item.aplicaATodos,
                valor: accesorios.find(a => a.id === item.productoId)?.precio || 0,
                bonificacion: item.bonificacion || 0
            }))
        ];

        const cotizacionData = {
            presupuesto_id: presupuestoActual?.id,
            cantidad_vehiculos: cantidadVehiculos,
            tasa_id: tasaId || null,
            valor_tasa: valorTasa,
            tasa_bonificacion: tasaBonificacion,
            abono_id: abonoId || null,
            valor_abono: valorAbono,
            abono_bonificacion: abonoBonificacion,
            agregados: agregados
        };

        try {
            const response = await fetch(`/comercial/contratos/${contratoId}/recotizar`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/json'
                },
                body: JSON.stringify(cotizacionData)
            });

            const data = await response.json();

            if (response.ok && data.success) {
                toast.success('Presupuesto actualizado exitosamente');
                onCotizacionActualizada(data.presupuesto);
                setIsOpen(false);
            } else {
                toast.error(data.error || 'Error al actualizar el presupuesto');
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al actualizar el presupuesto');
        } finally {
            setIsSaving(false);
        }
    };

    // Contenido del modal
    const modalContent = (
        <div className="space-y-6">
            {/* Cantidad de Vehículos */}
            <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cantidad de Vehículos
                </label>
                <input
                    type="number"
                    min="1"
                    value={cantidadVehiculos}
                    onChange={(e) => setCantidadVehiculos(Number(e.target.value))}
                    className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-indigo-500"
                />
            </div>

            {/* Tasa */}
            <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <Truck className="h-4 w-4" />
                    Tasa de Instalación
                </h4>
                <div className="space-y-3">
                    <select
                        value={tasaId || ''}
                        onChange={(e) => setTasaId(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-3 py-2 border rounded-lg"
                    >
                        <option value="">Seleccionar tasa</option>
                        {tasas.map(tasa => (
                            <option key={tasa.id} value={tasa.id}>
                                {tasa.nombre} - ${tasa.precio.toLocaleString('es-AR')}
                            </option>
                        ))}
                    </select>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-gray-500">Bonificación %</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={tasaBonificacion}
                                onChange={(e) => setTasaBonificacion(Number(e.target.value))}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>
                        <div className="text-right pt-6">
                            <span className="font-medium">Total: ${totalTasa.toLocaleString('es-AR')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Abono */}
            <div className="border-t pt-4">
                <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                    <CreditCard className="h-4 w-4" />
                    Abono Mensual
                </h4>
                <div className="space-y-3">
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setAbonoTipo('abono')}
                            className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium ${abonoTipo === 'abono' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
                        >
                            Abono
                        </button>
                        <button
                            type="button"
                            onClick={() => setAbonoTipo('convenio')}
                            className={`flex-1 px-3 py-2 text-sm rounded-lg font-medium ${abonoTipo === 'convenio' ? 'bg-indigo-600 text-white' : 'bg-gray-100'}`}
                        >
                            Convenio
                        </button>
                    </div>
                    <select
                        value={abonoId || ''}
                        onChange={(e) => setAbonoId(e.target.value ? Number(e.target.value) : null)}
                        className="w-full px-3 py-2 border rounded-lg"
                    >
                        <option value="">Seleccionar {abonoTipo}</option>
                        {(abonoTipo === 'abono' ? abonos : convenios).map(item => (
                            <option key={item.id} value={item.id}>
                                {item.nombre} - ${item.precio.toLocaleString('es-AR')}
                            </option>
                        ))}
                    </select>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="text-xs text-gray-500">Bonificación %</label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={abonoBonificacion}
                                onChange={(e) => setAbonoBonificacion(Number(e.target.value))}
                                className="w-full px-3 py-2 border rounded-lg"
                            />
                        </div>
                        <div className="text-right pt-6">
                            <span className="font-medium">Total: ${totalAbono.toLocaleString('es-AR')}</span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Accesorios */}
            <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Package className="h-4 w-4" />
                        Accesorios
                    </h4>
                    <button
                        type="button"
                        onClick={agregarAccesorio}
                        className="text-xs text-indigo-600 hover:text-indigo-700"
                    >
                        + Agregar
                    </button>
                </div>
                <div className="space-y-3">
                    {accesoriosItems.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                            <select
                                value={item.productoId || ''}
                                onChange={(e) => actualizarAccesorio(idx, 'productoId', Number(e.target.value))}
                                className="flex-1 px-2 py-2 text-sm border rounded-lg"
                            >
                                <option value="">Seleccionar</option>
                                {accesorios.map(a => (
                                    <option key={a.id} value={a.id}>
                                        {a.nombre} - ${a.precio.toLocaleString('es-AR')}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                min="1"
                                value={item.cantidad}
                                onChange={(e) => actualizarAccesorio(idx, 'cantidad', Number(e.target.value))}
                                className="w-20 px-2 py-2 text-sm border rounded-lg text-center"
                            />
                            <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    checked={item.aplicaATodos}
                                    onChange={(e) => actualizarAccesorio(idx, 'aplicaATodos', e.target.checked)}
                                    className="rounded"
                                />
                                x{cantidadVehiculos}
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={item.bonificacion}
                                onChange={(e) => actualizarAccesorio(idx, 'bonificacion', Number(e.target.value))}
                                className="w-16 px-2 py-2 text-sm border rounded-lg text-center"
                                placeholder="%"
                            />
                            <button
                                type="button"
                                onClick={() => eliminarAccesorio(idx)}
                                className="text-red-500"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Servicios */}
            <div className="border-t pt-4">
                <div className="flex justify-between items-center mb-3">
                    <h4 className="text-sm font-semibold flex items-center gap-2">
                        <Wrench className="h-4 w-4" />
                        Servicios Adicionales
                    </h4>
                    <button
                        type="button"
                        onClick={agregarServicio}
                        className="text-xs text-indigo-600 hover:text-indigo-700"
                    >
                        + Agregar
                    </button>
                </div>
                <div className="space-y-3">
                    {serviciosItems.map((item, idx) => (
                        <div key={idx} className="flex gap-2 items-start">
                            <select
                                value={item.productoId || ''}
                                onChange={(e) => actualizarServicio(idx, 'productoId', Number(e.target.value))}
                                className="flex-1 px-2 py-2 text-sm border rounded-lg"
                            >
                                <option value="">Seleccionar</option>
                                {servicios.map(s => (
                                    <option key={s.id} value={s.id}>
                                        {s.nombre} - ${s.precio.toLocaleString('es-AR')}
                                    </option>
                                ))}
                            </select>
                            <input
                                type="number"
                                min="1"
                                value={item.cantidad}
                                onChange={(e) => actualizarServicio(idx, 'cantidad', Number(e.target.value))}
                                className="w-20 px-2 py-2 text-sm border rounded-lg text-center"
                            />
                            <label className="flex items-center gap-1 text-xs whitespace-nowrap">
                                <input
                                    type="checkbox"
                                    checked={item.aplicaATodos}
                                    onChange={(e) => actualizarServicio(idx, 'aplicaATodos', e.target.checked)}
                                    className="rounded"
                                />
                                x{cantidadVehiculos}
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={item.bonificacion}
                                onChange={(e) => actualizarServicio(idx, 'bonificacion', Number(e.target.value))}
                                className="w-16 px-2 py-2 text-sm border rounded-lg text-center"
                                placeholder="%"
                            />
                            <button
                                type="button"
                                onClick={() => eliminarServicio(idx)}
                                className="text-red-500"
                            >
                                <Trash2 className="h-4 w-4" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Totales */}
            <div className="border-t pt-4 bg-gray-50 p-4 rounded-lg">
                <div className="flex justify-between font-bold">
                    <span>💰 Inversión Inicial:</span>
                    <span className="text-blue-600">${totalInversionInicial.toLocaleString('es-AR')}</span>
                </div>
                <div className="flex justify-between font-bold mt-2">
                    <span>📅 Costo Mensual:</span>
                    <span className="text-green-600">${totalCostoMensual.toLocaleString('es-AR')}</span>
                </div>
            </div>
        </div>
    );

    return (
        <>
            <button
                type="button"
                onClick={() => setIsOpen(true)}
                className="text-sm text-indigo-600 hover:text-indigo-700 flex items-center gap-1"
            >
                <Calculator className="h-4 w-4" />
                Recotizar
            </button>

            <ConfirmDialog
                isOpen={isOpen}
                onClose={() => setIsOpen(false)}
                onConfirm={guardarCotizacion}
                title="Recotizar Presupuesto"
                confirmText={isSaving ? 'Guardando...' : 'Guardar Cambios'}
                cancelText="Cancelar"
                type="info"
                size="xl"
                isLoading={isSaving}
            >
                {modalContent}
            </ConfirmDialog>
        </>
    );
}