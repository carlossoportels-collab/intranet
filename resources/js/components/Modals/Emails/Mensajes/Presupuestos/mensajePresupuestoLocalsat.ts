// resources/js/components/modals/emails/mensajes/mensajePresupuestoLocalsat.ts

export const mensajePresupuestoLocalsat = (
    leadNombre: string, 
    referencia: string, 
    comercialNombre: string, 
    comercialEmail: string
): string => {
    const primerNombreLead = leadNombre.split(' ')[0];
    
    return `Estimado ${primerNombreLead},

Controle la ubicación, recorrido y velocidades de su flota, con nuestro sistema, tendrá control total sobre sus activos las 24/7.

NUESTRO SERVICIO INCLUYE:
• Visualización en tiempo real mediante el celular o PC de Vehículos terrestres y embarcaciones.
• Equipo con batería de Backup.
• Consulta de reportes de recorridos históricos.
• Acceso Web y App Móvil con múltiples usuarios y perfiles, para personal propio y tercerizado.
• Capacitación de uso Web y App Móvil para realizar informes.
• Configuración de velocidades y paradas en los reportes.
• Consumo aproximado de combustible.
• Asesor comercial asignado a la cuenta.
• El equipo muestra información del odómetro total, velocidad, longitud/latitud, Estado encendido/apagado.
• Instalaciones y service a domicilio.
• GESTION DE FLOTA

CONSULTAR POR ACCESORIOS Y SERVICIOS:
• I-Button (identificación de conductor)
• Sensor desenganche acoplado
• Botón de pánico
• Corte de combustible
• Sensores de apertura puertas, etc.
• Monitoreos pasivos y activos

CONDICIONES CONTRACTUALES:
✓ Equipos en comodato.
✓ Realizamos instalación a domicilio.
✓ El contrato es por dos años. Puede hacer la baja anticipada luego del sexto mes, abonando una penalidad equivalente a 2 (dos) abonos en el primer año, 1 (un) abono para el segundo año y luego la baja no tiene penalidades.

Adjuntamos el presupuesto ${referencia} para tu evaluación.

Cualquier consulta no dude en comunicarse.
LocalSat, empresa certificada por CESVI
Visita nuestra página Web: WWW.LOCALSAT.COM.AR

Saludos cordiales,
${comercialNombre}
${comercialEmail}`;
};