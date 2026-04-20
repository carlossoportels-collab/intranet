// resources/js/hooks/usePresupuestoEditForm.ts
import { usePage, router } from '@inertiajs/react';
import { useState, useEffect, useMemo, useCallback } from 'react';

import { useToast } from '@/contexts/ToastContext';
import { 
    PresupuestoFormState, 
    PresupuestoAgregadoDTO,
    ProductoServicioDTO,
    MetodoPagoDTO,
    PromocionDTO,
    ProductoResumenItem
} from '@/types/presupuestos';

interface UsePresupuestoEditFormProps {
    presupuesto: any;
    tasas: ProductoServicioDTO[];
    abonos: ProductoServicioDTO[];
    convenios: ProductoServicioDTO[];
    metodosPago: MetodoPagoDTO[];
    promociones?: PromocionDTO[];
    accesorios: ProductoServicioDTO[];
    servicios: ProductoServicioDTO[];
}

// Función para convertir a número de forma segura
const toNumber = (value: any): number => {
    if (value === null || value === undefined) return 0;
    if (typeof value === 'number') return value;
    if (typeof value === 'string') {
        const parsed = parseFloat(value);
        return isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

export const usePresupuestoEditForm = ({
    presupuesto,
    tasas,
    abonos,
    convenios,
    metodosPago,
    promociones = [],
    accesorios,
    servicios
}: UsePresupuestoEditFormProps) => {
    const { errors } = usePage().props;
    const toast = useToast();

    // Transformar agregados del presupuesto al formato del estado
    const transformarAgregados = () => {
        const accesoriosAgregados: PresupuestoAgregadoDTO[] = [];
        const serviciosAgregados: PresupuestoAgregadoDTO[] = [];
        
        if (presupuesto.agregados && Array.isArray(presupuesto.agregados)) {
            presupuesto.agregados.forEach((item: any) => {
                const tipoId = item.producto_servicio?.tipo?.id;
                const tipoNombre = item.producto_servicio?.tipo?.nombre_tipo_abono || '';
                
                const agregado = {
                    prd_servicio_id: item.prd_servicio_id,
                    cantidad: toNumber(item.cantidad),
                    aplica_a_todos_vehiculos: !!item.aplica_a_todos_vehiculos,
                    valor: toNumber(item.valor),
                    bonificacion: toNumber(item.bonificacion),
                    subtotal: toNumber(item.subtotal)
                };
                
                if (tipoId === 3 || tipoNombre === 'SERVICIO') {
                    serviciosAgregados.push(agregado);
                } else {
                    accesoriosAgregados.push(agregado);
                }
            });
        }
        
        return { accesoriosAgregados, serviciosAgregados };
    };

    const { accesoriosAgregados, serviciosAgregados } = transformarAgregados();

    const [state, setState] = useState<PresupuestoFormState>({
        prefijoId: toNumber(presupuesto.prefijo_id) || 0,
        promocionId: presupuesto.promocion_id || null,
        cantidadVehiculos: toNumber(presupuesto.cantidad_vehiculos) || 1,
        diasValidez: presupuesto.dias_validez?.toString() || '7',
        tasaId: toNumber(presupuesto.tasa_id) || 0,
        tasaBonificacion: toNumber(presupuesto.tasa_bonificacion) || 0,
        tasaMetodoPagoId: toNumber(presupuesto.tasa_metodo_pago_id) || 0,
        abonoId: toNumber(presupuesto.abono_id) || 0,
        abonoBonificacion: toNumber(presupuesto.abono_bonificacion) || 0,
        abonoMetodoPagoId: toNumber(presupuesto.abono_metodo_pago_id) || 0,
        accesoriosAgregados,
        serviciosAgregados,
        bonificacionManual: true,
        loading: false
    });

    const [valores, setValores] = useState({
        valorTasa: toNumber(presupuesto.valor_tasa) || 0,
        valorAbono: toNumber(presupuesto.valor_abono) || 0
    });

    const [promocionSeleccionada, setPromocionSeleccionada] = useState<PromocionDTO | null>(
        promociones.find(p => p.id === presupuesto.promocion_id) || null
    );
    const [cantidadMinimaPromo, setCantidadMinimaPromo] = useState<number>(1);
    const [productosPromocionIds, setProductosPromocionIds] = useState<Set<number>>(new Set());

    // Obtener nombres de tasa y abono
    const tasaNombre = useMemo(() => {
        const tasa = tasas.find(t => t.id === state.tasaId);
        return tasa?.nombre || presupuesto.tasa?.nombre || 'Instalación';
    }, [state.tasaId, tasas, presupuesto.tasa]);

    const abonoNombre = useMemo(() => {
        const todosAbonos = [...abonos, ...convenios];
        const abono = todosAbonos.find(a => a.id === state.abonoId);
        return abono?.nombre || presupuesto.abono?.nombre || 'Abono Mensual';
    }, [state.abonoId, abonos, convenios, presupuesto.abono]);

    const getProductoValor = useCallback((id: number, lista: ProductoServicioDTO[]) => {
        const producto = lista.find(p => p.id === id);
        return Number(producto?.precio) || 0;
    }, []);

    // Función para verificar si la promoción afecta al abono
    const hayPromocionEnAbono = useCallback((): boolean => {
        if (!state.promocionId || !promocionSeleccionada) return false;
        return promocionSeleccionada.productos.some(p => 
            p.producto.tipo_id === 1 || p.producto.tipo_id === 2
        );
    }, [state.promocionId, promocionSeleccionada]);

    // Función para verificar si la promoción afecta a la tasa
    const hayPromocionEnTasa = useCallback((): boolean => {
        if (!state.promocionId || !promocionSeleccionada) return false;
        return promocionSeleccionada.productos.some(p => p.producto.tipo_id === 4);
    }, [state.promocionId, promocionSeleccionada]);

    // Efecto para actualizar la promoción seleccionada
    useEffect(() => {
        if (state.promocionId) {
            const promo = promociones.find(p => p.id === state.promocionId);
            setPromocionSeleccionada(promo || null);
            
            if (promo) {
                let min = 1;
                const ids = new Set<number>();
                
                promo.productos.forEach(prod => {
                    ids.add(prod.producto_servicio_id);
                    if (prod.cantidad_minima && prod.cantidad_minima > min) {
                        min = prod.cantidad_minima;
                    }
                });
                
                setCantidadMinimaPromo(min);
                setProductosPromocionIds(ids);
            }
        } else {
            setPromocionSeleccionada(null);
            setCantidadMinimaPromo(1);
            setProductosPromocionIds(new Set());
        }
    }, [state.promocionId, promociones]);

    // Efecto para valores de tasas
    useEffect(() => {
        setValores(prev => ({ 
            ...prev, 
            valorTasa: getProductoValor(state.tasaId, tasas) || toNumber(presupuesto.valor_tasa)
        }));
    }, [state.tasaId, tasas, getProductoValor]);

    // Efecto para valores de abonos
    useEffect(() => {
        const todosAbonos = [...abonos, ...convenios];
        setValores(prev => ({ 
            ...prev, 
            valorAbono: getProductoValor(state.abonoId, todosAbonos) || toNumber(presupuesto.valor_abono)
        }));
    }, [state.abonoId, abonos, convenios, getProductoValor]);

    // Resetear bonificación manual al cambiar abono
    useEffect(() => {
        setState(prev => ({ ...prev, bonificacionManual: false }));
    }, [state.abonoId]);

    // Cálculos de subtotales
    const calcularSubtotalAgregados = useCallback((items: PresupuestoAgregadoDTO[]) => {
        return items.reduce((total, item) => total + toNumber(item.subtotal), 0);
    }, []);

    const subtotales = useMemo(() => ({
        accesorios: calcularSubtotalAgregados(state.accesoriosAgregados),
        servicios: calcularSubtotalAgregados(state.serviciosAgregados),
        total: calcularSubtotalAgregados(state.accesoriosAgregados) + 
               calcularSubtotalAgregados(state.serviciosAgregados)
    }), [state.accesoriosAgregados, state.serviciosAgregados, calcularSubtotalAgregados]);

    // Calcular productos con promoción
    const accesoriosConPromocion = useMemo((): ProductoResumenItem[] => {
        if (!promocionSeleccionada || productosPromocionIds.size === 0) return [];
        
        return state.accesoriosAgregados
            .filter(item => item.prd_servicio_id && productosPromocionIds.has(item.prd_servicio_id))
            .map(item => {
                const promo = promocionSeleccionada.productos.find(p => p.producto_servicio_id === item.prd_servicio_id);
                return {
                    id: item.prd_servicio_id,
                    nombre: promo?.producto.nombre || 'Accesorio',
                    valor: item.valor,
                    cantidad: item.cantidad,
                    tipoPromocion: promo?.tipo_promocion,
                    bonificacion: item.bonificacion || promo?.bonificacion
                };
            });
    }, [state.accesoriosAgregados, promocionSeleccionada, productosPromocionIds]);

    const serviciosConPromocion = useMemo((): ProductoResumenItem[] => {
        if (!promocionSeleccionada || productosPromocionIds.size === 0) return [];
        
        return state.serviciosAgregados
            .filter(item => item.prd_servicio_id && productosPromocionIds.has(item.prd_servicio_id))
            .map(item => {
                const promo = promocionSeleccionada.productos.find(p => p.producto_servicio_id === item.prd_servicio_id);
                return {
                    id: item.prd_servicio_id,
                    nombre: promo?.producto.nombre || 'Servicio',
                    valor: item.valor,
                    cantidad: item.cantidad,
                    tipoPromocion: promo?.tipo_promocion,
                    bonificacion: item.bonificacion || promo?.bonificacion
                };
            });
    }, [state.serviciosAgregados, promocionSeleccionada, productosPromocionIds]);

    // Calcular productos normales (sin promoción)
    const accesoriosNormales = useMemo((): ProductoResumenItem[] => {
        if (!productosPromocionIds.size) {
            return state.accesoriosAgregados.map(item => {
                const producto = accesorios.find(a => a.id === item.prd_servicio_id);
                return {
                    id: item.prd_servicio_id,
                    nombre: producto?.nombre || 'Accesorio',
                    valor: item.valor,
                    cantidad: item.cantidad,
                    bonificacion: item.bonificacion
                };
            });
        }
        
        return state.accesoriosAgregados
            .filter(item => !productosPromocionIds.has(item.prd_servicio_id))
            .map(item => {
                const producto = accesorios.find(a => a.id === item.prd_servicio_id);
                return {
                    id: item.prd_servicio_id,
                    nombre: producto?.nombre || 'Accesorio',
                    valor: item.valor,
                    cantidad: item.cantidad,
                    bonificacion: item.bonificacion
                };
            });
    }, [state.accesoriosAgregados, productosPromocionIds, accesorios]);

    const serviciosNormales = useMemo((): ProductoResumenItem[] => {
        if (!productosPromocionIds.size) {
            return state.serviciosAgregados.map(item => {
                const producto = servicios.find(s => s.id === item.prd_servicio_id);
                return {
                    id: item.prd_servicio_id,
                    nombre: producto?.nombre || 'Servicio',
                    valor: item.valor,
                    cantidad: item.cantidad,
                    bonificacion: item.bonificacion
                };
            });
        }
        
        return state.serviciosAgregados
            .filter(item => !productosPromocionIds.has(item.prd_servicio_id))
            .map(item => {
                const producto = servicios.find(s => s.id === item.prd_servicio_id);
                return {
                    id: item.prd_servicio_id,
                    nombre: producto?.nombre || 'Servicio',
                    valor: item.valor,
                    cantidad: item.cantidad,
                    bonificacion: item.bonificacion
                };
            });
    }, [state.serviciosAgregados, productosPromocionIds, servicios]);

    // Determinar tipo de promoción para tasa y abono
    const tasaPromocion = useMemo(() => {
        if (!promocionSeleccionada) return null;
        
        const productoTasa = promocionSeleccionada.productos.find(p => p.producto.tipo_id === 4);
        return productoTasa?.tipo_promocion === '2x1' || productoTasa?.tipo_promocion === '3x2' 
            ? productoTasa.tipo_promocion 
            : null;
    }, [promocionSeleccionada]);

    const abonoPromocion = useMemo(() => {
        if (!promocionSeleccionada) return null;
        
        const productoAbono = promocionSeleccionada.productos.find(p => 
            p.producto.tipo_id === 1 || p.producto.tipo_id === 2
        );
        return productoAbono?.tipo_promocion === '2x1' || productoAbono?.tipo_promocion === '3x2' 
            ? productoAbono.tipo_promocion 
            : null;
    }, [promocionSeleccionada]);

    // Actions
    const updateField = useCallback(<K extends keyof PresupuestoFormState>(
        field: K, 
        value: PresupuestoFormState[K]
    ) => {
        if (field === 'cantidadVehiculos' && state.promocionId) {
            const numValue = value as number;
            if (numValue < cantidadMinimaPromo) {
                toast.error(`No puede seleccionar menos de ${cantidadMinimaPromo} vehículos para esta promoción`);
                return;
            }
        }
        
        setState(prev => ({ ...prev, [field]: value }));
    }, [state.promocionId, cantidadMinimaPromo, toast]);

    // Función para verificar si un campo debe estar deshabilitado
    const isFieldDisabled = useCallback((field: string): boolean => {
        if (!state.promocionId || !promocionSeleccionada) return false;
        
        if (field === 'tasaId' || field === 'tasaBonificacion') {
            return hayPromocionEnTasa();
        }
        
        if (field === 'abonoId' || field === 'abonoBonificacion') {
            return hayPromocionEnAbono();
        }
        
        return false;
    }, [state.promocionId, promocionSeleccionada, hayPromocionEnTasa, hayPromocionEnAbono]);

    // Función para cargar productos de la promoción
    const cargarProductosPromocion = useCallback((promocion: PromocionDTO) => {
        let minVehiculos = 1;
        
        const nuevosAccesorios: PresupuestoAgregadoDTO[] = [];
        const nuevosServicios: PresupuestoAgregadoDTO[] = [];
        
        promocion.productos.forEach(prod => {
            if (prod.cantidad_minima && prod.cantidad_minima > minVehiculos) {
                minVehiculos = prod.cantidad_minima;
            }
            
            const productoBase = prod.producto;
            
            switch(productoBase.tipo_id) {
                case 4: // TASAS
                    updateField('tasaId', productoBase.id);
                    updateField('tasaBonificacion', prod.bonificacion);
                    break;
                    
                case 1: // ABONO
                case 2: // CONVENIO
                    updateField('abonoId', productoBase.id);
                    updateField('abonoBonificacion', prod.bonificacion);
                    break;
                    
                case 5: // ACCESORIOS
                    nuevosAccesorios.push({
                        prd_servicio_id: productoBase.id,
                        cantidad: prod.cantidad_minima || 1,
                        aplica_a_todos_vehiculos: false,
                        valor: productoBase.precio,
                        bonificacion: prod.bonificacion,
                        subtotal: 0
                    });
                    break;
                    
                case 3: // SERVICIOS
                    nuevosServicios.push({
                        prd_servicio_id: productoBase.id,
                        cantidad: prod.cantidad_minima || 1,
                        aplica_a_todos_vehiculos: false,
                        valor: productoBase.precio,
                        bonificacion: prod.bonificacion,
                        subtotal: 0
                    });
                    break;
            }
        });

        setState(prev => ({
            ...prev,
            accesoriosAgregados: nuevosAccesorios,
            serviciosAgregados: nuevosServicios
        }));

        if (minVehiculos > 1) {
            setState(prev => ({ ...prev, cantidadVehiculos: minVehiculos }));
        }

        toast.success('Productos de la promoción cargados correctamente');
    }, [updateField, toast]);

    // Función para aplicar promoción
    const aplicarPromocion = useCallback((promocionId: number | null) => {
        updateField('promocionId', promocionId);
        
        if (!promocionId) {
            setState(prev => ({
                ...prev,
                tasaId: toNumber(presupuesto.tasa_id) || 0,
                tasaBonificacion: toNumber(presupuesto.tasa_bonificacion) || 0,
                abonoId: toNumber(presupuesto.abono_id) || 0,
                abonoBonificacion: toNumber(presupuesto.abono_bonificacion) || 0,
                accesoriosAgregados,
                serviciosAgregados
            }));
            toast.info('Promoción removida');
            return;
        }

        const promocion = promociones.find(p => p.id === promocionId);
        if (!promocion) {
            toast.error('Promoción no encontrada');
            return;
        }

        cargarProductosPromocion(promocion);
        toast.success(`Promoción "${promocion.nombre}" aplicada`);
    }, [promociones, updateField, cargarProductosPromocion, toast, setState, presupuesto, accesoriosAgregados, serviciosAgregados]);

    /**
     * VALIDACIÓN DEL FORMULARIO - ACTUALIZADA
     * Permite presupuestos con solo tasa, solo abono, solo productos, o combinaciones
     */
    const validateForm = useCallback((): boolean => {
        // Validar comercial
        if (!state.prefijoId || state.prefijoId === 0) {
            toast.error('Debe seleccionar un comercial');
            return false;
        }
        
        // 🔥 VALIDACIONES ELIMINADAS - Ya no es obligatorio tener Tasa ni Abono
        // Ahora se puede editar presupuesto solo con accesorios o servicios
        
        // Validar método de pago de la tasa (solo si tiene tasa)
        if (state.tasaId && state.tasaId !== 0 && (!state.tasaMetodoPagoId || state.tasaMetodoPagoId === 0)) {
            toast.error('Debe seleccionar un método de pago para la tasa');
            return false;
        }
        
        // Validar método de pago del abono (solo si tiene abono)
        if (state.abonoId && state.abonoId !== 0 && (!state.abonoMetodoPagoId || state.abonoMetodoPagoId === 0)) {
            toast.error('Debe seleccionar un método de pago para el abono');
            return false;
        }
        
        // Validar cantidad mínima para promoción
        if (state.promocionId && state.cantidadVehiculos < cantidadMinimaPromo) {
            toast.error(`Esta promoción requiere un mínimo de ${cantidadMinimaPromo} vehículos`);
            return false;
        }
        
        return true;
    }, [state, toast, cantidadMinimaPromo]);

    /**
     * SUBMIT DEL FORMULARIO - ACTUALIZADO
     */
    const handleSubmit = useCallback((e: React.FormEvent) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }
        
        setState(prev => ({ ...prev, loading: true }));

        const data = {
            prefijo_id: state.prefijoId,
            promocion_id: state.promocionId,
            cantidad_vehiculos: state.cantidadVehiculos,
            validez: state.diasValidez,
            tasa_id: state.tasaId && state.tasaId !== 0 ? state.tasaId : null,
            valor_tasa: state.tasaId && state.tasaId !== 0 ? valores.valorTasa : 0,
            tasa_bonificacion: state.tasaId && state.tasaId !== 0 ? state.tasaBonificacion : 0,
            tasa_metodo_pago_id: state.tasaId && state.tasaId !== 0 ? state.tasaMetodoPagoId : null,
            abono_id: state.abonoId && state.abonoId !== 0 ? state.abonoId : null,
            valor_abono: state.abonoId && state.abonoId !== 0 ? valores.valorAbono : 0,
            abono_bonificacion: state.abonoId && state.abonoId !== 0 ? state.abonoBonificacion : 0,
            abono_metodo_pago_id: state.abonoId && state.abonoId !== 0 ? state.abonoMetodoPagoId : null,
            agregados: [
                ...state.accesoriosAgregados.map(a => ({
                    prd_servicio_id: a.prd_servicio_id,
                    cantidad: a.cantidad,
                    aplica_a_todos_vehiculos: a.aplica_a_todos_vehiculos,
                    valor: a.valor,
                    bonificacion: a.bonificacion
                })),
                ...state.serviciosAgregados.map(s => ({
                    prd_servicio_id: s.prd_servicio_id,
                    cantidad: s.cantidad,
                    aplica_a_todos_vehiculos: s.aplica_a_todos_vehiculos,
                    valor: s.valor,
                    bonificacion: s.bonificacion
                }))
            ]
        };

        router.put(`/comercial/presupuestos/${presupuesto.id}`, data, {
            onSuccess: () => {
                setState(prev => ({ ...prev, loading: false }));
                toast.success('Presupuesto actualizado correctamente');
            },
            onError: (errors) => {
                setState(prev => ({ ...prev, loading: false }));
                if (Object.keys(errors).length > 0) {
                    if (errors.error) {
                        toast.error(errors.error);
                    } else {
                        const errorMessages = Object.values(errors).join(', ');
                        toast.error(`Error: ${errorMessages}`);
                    }
                }
            }
        });
    }, [state, valores, presupuesto.id, validateForm, toast]);

    const getError = useCallback((field: string) => {
        return errors && (errors as any)[field] ? (errors as any)[field] : null;
    }, [errors]);

    return {
        state,
        valores,
        subtotales,
        promocionSeleccionada,
        cantidadMinimaPromo,
        productosPromocionIds,
        accesoriosConPromocion,
        serviciosConPromocion,
        accesoriosNormales,
        serviciosNormales,
        tasaPromocion,
        abonoPromocion,
        tasaNombre,
        abonoNombre,
        updateField,
        aplicarPromocion,
        isFieldDisabled,
        hayPromocionEnAbono,
        hayPromocionEnTasa,
        productoEstaEnPromocion: useCallback((productoId: number): boolean => {
            if (!state.promocionId || !promocionSeleccionada) return false;
            return promocionSeleccionada.productos.some(p => p.producto_servicio_id === productoId);
        }, [state.promocionId, promocionSeleccionada]),
        setAccesoriosAgregados: useCallback((items: PresupuestoAgregadoDTO[]) => 
            updateField('accesoriosAgregados', items), [updateField]),
        setServiciosAgregados: useCallback((items: PresupuestoAgregadoDTO[]) => 
            updateField('serviciosAgregados', items), [updateField]),
        handleSubmit,
        getError
    };
};