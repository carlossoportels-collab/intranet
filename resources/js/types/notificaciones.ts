export interface Notificacion {
    id: number;
    usuario_id: number;
    titulo: string;
    mensaje: string;
    tipo: string;
    entidad_tipo: 'lead' | 'presupuesto' | 'contrato' | 'comentario' | 'seguimiento_perdida' | 'personal' | 'empresa';
    entidad_id: number | null;
    leida: boolean;
    fecha_notificacion: string;
    prioridad: 'baja' | 'normal' | 'alta' | 'urgente';
    created: string;
    lead_nombre?: string;
    lead_id?: number;
    personal_id?: number;
    personal_nombre?: string;
}