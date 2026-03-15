// resources/js/components/modals/emails/mensajes/mensajePresupuestoDefault.ts

export const mensajePresupuestoDefault = (
    leadNombre: string, 
    referencia: string, 
    comercialNombre: string, 
    comercialEmail: string
): string => {
    const primerNombreLead = leadNombre.split(' ')[0];
    
    return `
        <p>Estimado/a ${primerNombreLead},</p>
        <p>Adjuntamos el presupuesto <strong>${referencia}</strong> que armamos para usted.</p>
        <p>Quedamos a disposición para cualquier consulta.</p>
        <p>Saludos cordiales,</p>
        <p><strong>${comercialNombre}</strong><br/>
        ${comercialEmail}</p>
    `;
};