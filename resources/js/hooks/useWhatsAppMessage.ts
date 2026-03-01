// resources/js/hooks/useWhatsAppMessage.ts

import { useMemo } from 'react';

import { Presupuesto } from '@/types/presupuestos';
import { formatWhatsAppMoney, toNumber } from '@/utils/formatters';

interface WhatsAppMessageProps {
    presupuesto: Presupuesto;
    serviciosMensuales: any[];
    accesoriosUnicos: any[];
    inversionInicial: number;
    costoMensualTotal: number;
    totalPrimerMes: number;
}

export const useWhatsAppMessage = ({
    presupuesto,
    serviciosMensuales,
    accesoriosUnicos,
    inversionInicial,
    costoMensualTotal,
    totalPrimerMes
}: WhatsAppMessageProps) => {
    
    // Función para formatear porcentajes sin decimales
    const formatPorcentaje = (valor: any): string => {
        const num = toNumber(valor);
        return Math.round(num).toString();
    };

    // Función para obtener el texto de promoción (2x1, 3x2 o porcentaje sin decimales)
    const getTextoPromocion = (productoId: number | undefined, bonificacion: any): string => {
        const bonificacionNum = toNumber(bonificacion);
        
        // Si hay promoción activa en el presupuesto
        if (presupuesto.promocion?.productos) {
            const productoEnPromo = presupuesto.promocion.productos.find(
                (p: any) => p.producto_servicio_id === productoId
            );
            
            if (productoEnPromo) {
                // Si está en promoción, mostrar el tipo de promoción
                if (productoEnPromo.tipo_promocion === '2x1') return ' (2x1)';
                if (productoEnPromo.tipo_promocion === '3x2') return ' (3x2)';
                return ` (${formatPorcentaje(productoEnPromo.bonificacion)}% OFF)`;
            }
        }
        
        // Si no está en promoción, mostrar la bonificación normal
        return bonificacionNum > 0 ? ` (${formatPorcentaje(bonificacionNum)}% OFF)` : '';
    };

    // Verificar si un producto está en promoción
    const estaEnPromocion = (productoId: number | undefined): boolean => {
        if (!productoId || !presupuesto.promocion?.productos) return false;
        
        return presupuesto.promocion.productos.some(
            (p: any) => p.producto_servicio_id === productoId
        );
    };

    const generarMensaje = useMemo(() => {
        if (!presupuesto.lead?.telefono) return null;

        const leadNombre = presupuesto.lead.nombre_completo.split(' ')[0];
        const ref = presupuesto.referencia || `LS-${new Date(presupuesto.created).getFullYear()}-${presupuesto.id}`;
        const vehiculos = presupuesto.cantidad_vehiculos;

        let mensaje = `Hola ${leadNombre},\n\n`;
        mensaje += `Te comparto el presupuesto *${ref}* que armamos para vos.\n\n`;
        mensaje += `Vehículos: ${vehiculos}\n\n`;
        mensaje += `─────────────────────\n\n`;

        // Tasa de instalación
        if (presupuesto.tasa) {
            mensaje += `INSTALACIÓN (pago único)\n`;
            mensaje += `${presupuesto.tasa.nombre}:\n`;
            mensaje += `${formatWhatsAppMoney(toNumber(presupuesto.subtotal_tasa))}`;
            mensaje += `${getTextoPromocion(presupuesto.tasa.id, presupuesto.tasa_bonificacion)}\n\n`;
        }

        // Abono mensual
        if (presupuesto.abono) {
            mensaje += `ABONO MENSUAL\n`;
            mensaje += `${presupuesto.abono.nombre}:\n`;
            mensaje += `${formatWhatsAppMoney(toNumber(presupuesto.subtotal_abono))}/mes`;
            mensaje += `${getTextoPromocion(presupuesto.abono.id, presupuesto.abono_bonificacion)}\n\n`;
        }

        // Servicios adicionales
        if (serviciosMensuales.length > 0) {
            mensaje += `SERVICIOS ADICIONALES (mensuales)\n`;
            serviciosMensuales.forEach(item => {
                mensaje += `- ${item.producto_servicio?.nombre}:\n`;
                mensaje += `  ${formatWhatsAppMoney(toNumber(item.subtotal))}/mes`;
                mensaje += `${getTextoPromocion(item.prd_servicio_id, item.bonificacion)}\n`;
            });
            mensaje += `\n`;
        }

        // Accesorios
        if (accesoriosUnicos.length > 0) {
            mensaje += `ACCESORIOS (pago único)\n`;
            accesoriosUnicos.forEach(item => {
                mensaje += `- ${item.producto_servicio?.nombre}:\n`;
                mensaje += `  ${formatWhatsAppMoney(toNumber(item.subtotal))}`;
                mensaje += `${getTextoPromocion(item.prd_servicio_id, item.bonificacion)}\n`;
            });
            mensaje += `\n`;
        }

        mensaje += `─────────────────────\n\n`;
        mensaje += `RESUMEN\n`;
        mensaje += `Inversión inicial: ${formatWhatsAppMoney(inversionInicial)}\n`;
        mensaje += `Costo mensual: ${formatWhatsAppMoney(costoMensualTotal)}/mes\n`;
        mensaje += `Total primer mes: ${formatWhatsAppMoney(totalPrimerMes)}\n\n`;

        // Términos
        mensaje += `TÉRMINOS IMPORTANTES\n`;
        mensaje += `- Válido por ${presupuesto.dias_validez || 7} días hábiles\n`;
        mensaje += `- IVA 21% no incluido\n`;
        
        // Información de promociones en términos (solo una vez)
        if (presupuesto.promocion) {
            mensaje += `- Promoción aplicada: ${presupuesto.promocion.nombre}\n`;
            if (presupuesto.promocion.descripcion) {
                mensaje += `  ${presupuesto.promocion.descripcion}\n`;
            }
        } 
        // Descuento por débito automático (solo si el abono NO está en promoción)
        else if (presupuesto.abono && presupuesto.abono_bonificacion > 0 && !estaEnPromocion(presupuesto.abono.id)) {
            mensaje += `- Descuento del ${formatPorcentaje(presupuesto.abono_bonificacion)}% por débito automático\n`;
        }
        
        mensaje += `\n`;

        // Despedida
        mensaje += `Quedamos atentos a tus comentarios.\n`;
        mensaje += `Saludos,\n`;
        mensaje += `${presupuesto.nombre_comercial?.split(' ')[0] || 'Equipo LocalSAT'}`;

        return mensaje;
    }, [presupuesto, serviciosMensuales, accesoriosUnicos, inversionInicial, costoMensualTotal, totalPrimerMes]);

    return generarMensaje;
};