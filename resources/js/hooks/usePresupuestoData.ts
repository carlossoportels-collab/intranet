// resources/js/hooks/usePresupuestoData.ts

import { useMemo } from 'react';

import { Presupuesto } from '@/types/presupuestos';
import { toNumber } from '@/utils/formatters';

export const usePresupuestoData = (presupuesto: Presupuesto) => {
    // Clasificar agregados
    const clasificarAgregados = () => {
        if (!presupuesto.agregados) return { serviciosMensuales: [], accesoriosUnicos: [] };
        
        const serviciosMensuales: any[] = [];
        const accesoriosUnicos: any[] = [];
        
        presupuesto.agregados.forEach((item: any) => {
            const tipoId = item.producto_servicio?.tipo?.id;
            const tipoNombre = item.producto_servicio?.tipo?.nombre_tipo_abono || '';
            
            if (tipoId === 3 || tipoNombre === 'SERVICIO') {
                serviciosMensuales.push(item);
            } else {
                accesoriosUnicos.push(item);
            }
        });
        
        return { serviciosMensuales, accesoriosUnicos };
    };

    const { serviciosMensuales, accesoriosUnicos } = clasificarAgregados();
    
    // Calcular totales
    const totalServiciosMensuales = useMemo(() => 
        serviciosMensuales.reduce((sum, item) => sum + toNumber(item.subtotal), 0), 
        [serviciosMensuales]
    );
    
    const totalAccesorios = useMemo(() => 
        accesoriosUnicos.reduce((sum, item) => sum + toNumber(item.subtotal), 0), 
        [accesoriosUnicos]
    );
    
    const subtotalTasa = toNumber(presupuesto.subtotal_tasa);
    const subtotalAbono = toNumber(presupuesto.subtotal_abono);
    
    const inversionInicial = subtotalTasa + totalAccesorios;
    const costoMensualTotal = subtotalAbono + totalServiciosMensuales;
    const totalPrimerMes = inversionInicial + costoMensualTotal;

    // Información de promoción
    const tienePromocion = !!presupuesto.promocion;
    
    const promocionInfo = useMemo(() => {
        if (!presupuesto.promocion) return null;
        
        // Crear un mapa de productos en promoción para fácil acceso
        const productosEnPromocion = new Map();
        presupuesto.promocion.productos?.forEach((prod: any) => {
            productosEnPromocion.set(prod.producto_servicio_id, {
                tipo_promocion: prod.tipo_promocion,
                bonificacion: prod.bonificacion
            });
        });
        
        return {
            id: presupuesto.promocion.id,
            nombre: presupuesto.promocion.nombre,
            productos: productosEnPromocion
        };
    }, [presupuesto.promocion]);

    // Función para obtener el texto de bonificación/promoción
    const getTextoBonificacion = (productoId: number, bonificacionOriginal: number) => {
        // Si no hay promoción, devolver el porcentaje original
        if (!tienePromocion || !promocionInfo) {
            return bonificacionOriginal > 0 ? `${bonificacionOriginal}%` : '';
        }
        
        // Buscar el producto en la promoción
        const productoEnPromo = promocionInfo.productos.get(productoId);
        
        // Si el producto está en promoción
        if (productoEnPromo) {
            // Devolver el texto según el tipo de promoción
            if (productoEnPromo.tipo_promocion === '2x1') return '2x1';
            if (productoEnPromo.tipo_promocion === '3x2') return '3x2';
            return `${productoEnPromo.bonificacion}%`;
        }
        
        // Si no está en promoción pero tiene bonificación
        return bonificacionOriginal > 0 ? `${bonificacionOriginal}%` : '';
    };

    // Función para obtener el color del texto según si está en promoción o no
    const getColorBonificacion = (productoId: number) => {
        if (!tienePromocion || !promocionInfo) return 'text-green-600';
        
        const productoEnPromo = promocionInfo.productos.get(productoId);
        return productoEnPromo ? 'text-purple-600' : 'text-green-600';
    };

    // Función para verificar si un producto tiene promoción
    const tienePromocionProducto = (productoId: number): boolean => {
        if (!tienePromocion || !promocionInfo) return false;
        return promocionInfo.productos.has(productoId);
    };

    // Función para obtener el tipo de promoción (2x1 o 3x2)
    const getTipoPromocionProducto = (productoId: number): '2x1' | '3x2' | null => {
        if (!tienePromocion || !promocionInfo) return null;
        const producto = promocionInfo.productos.get(productoId);
        if (!producto) return null;
        if (producto.tipo_promocion === '2x1') return '2x1';
        if (producto.tipo_promocion === '3x2') return '3x2';
        return null;
    };

    return {
        serviciosMensuales,
        accesoriosUnicos,
        tieneServiciosMensuales: serviciosMensuales.length > 0,
        tieneAccesorios: accesoriosUnicos.length > 0,
        totalServiciosMensuales,
        totalAccesorios,
        subtotalTasa,
        subtotalAbono,
        inversionInicial,
        costoMensualTotal,
        totalPrimerMes,
        nombreComercial: presupuesto.nombre_comercial || 'No asignado',
        diasValidez: presupuesto.dias_validez || 7,
        referencia: presupuesto.referencia || `LS-${new Date(presupuesto.created).getFullYear()}-${presupuesto.id}`,
        cantidadVehiculos: presupuesto.cantidad_vehiculos,
        // Propiedades para promociones
        tienePromocion,
        promocionInfo,
        getTextoBonificacion,
        getColorBonificacion,
        tienePromocionProducto,
        getTipoPromocionProducto
    };
};