// resources/js/components/modals/emails/mensajes/mensajePresupuestoSmartSat.ts

export const mensajePresupuestoSmartSat = (
    leadNombre: string, 
    referencia: string, 
    comercialNombre: string, 
    comercialEmail: string
): string => {
    const primerNombreLead = leadNombre.split(' ')[0];
    
    return `Estimado ${primerNombreLead},

En SmartSat, transformamos la forma en que gestionás tus vehículos, flotas y activos.
Nuestra solución de rastreo satelital inteligente combina GPS, GSM e Internet para ofrecerte control total, información precisa y tranquilidad absoluta, las 24 horas del día, los 7 días de la semana.

Con SmartSat, tu empresa opera con datos reales, decisiones más rápidas y una eficiencia que se traduce directamente en mayor rentabilidad.

¿POR QUÉ ELEGIR SMARTSAT?
• Cobertura total y datos en tiempo real: Visualizá la ubicación, recorrido y estado de cada unidad con precisión milimétrica.
• Soluciones a medida: Nos adaptamos a las necesidades de tu operación, sin paquetes genéricos.
• Soporte 24/7: Un equipo técnico disponible siempre, para que tu negocio nunca se detenga.

LO QUE INCLUYE NUESTRO SERVICIO:
✅ Monitoreo en tiempo real: Controlá tus unidades desde tu celular o PC, estés donde estés.
✅ Equipos de última generación: Con batería de respaldo y actualizaciones automáticas cada 3 minutos, 1.000 metros o giros de más de 25°.
✅ Reportes inteligentes: Accedé al historial completo de recorridos y generá informes exportables en Excel o PDF.
✅ Plataforma moderna y segura: Interfaz web y app móvil, fácil de usar y con acceso multiusuario.
✅ Alertas automáticas: Configurá límites de velocidad, paradas, encendido/apagado y activá el modo Safe Parking para mayor seguridad.
✅ Gestión de combustible optimizada: Visualizá el consumo estimado y reducí costos operativos.
✅ Información precisa y centralizada: Velocidad, coordenadas, odómetro total y más, todo en un solo panel.

Condiciones comerciales:
El pago debe realizarse por adelantado a fin de confirmar el turno con el servicio técnico.

Adjuntamos el presupuesto ${referencia} para tu evaluación.

Quedamos a disposición para cualquier consulta.

Saludos cordiales,
${comercialNombre}
${comercialEmail}`;
};