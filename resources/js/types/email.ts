// resources/js/types/email.ts

export interface EmailConfig {
    remitente?: string;
    nombre_remitente?: string;
    cc?: string[];
    bcc?: string[];
}

export interface EmailData {
    to: string;
    subject: string;
    body: string;
    cc?: string[];
    bcc?: string[];
    attachments?: EmailAttachment[];
}

export interface EmailAttachment {
    filename: string;
    content: string | Blob; // Base64 o Blob
    contentType: string;
    size?: number;
}

export interface EmailPresupuestoData extends EmailData {
    presupuestoId: number;
    referencia: string;
    leadNombre: string;
    leadEmail: string;
    comercialEmail: string;
    comercialNombre: string;
}

export interface EmailResponse {
    success: boolean;
    message: string;
    error?: string;
    messageId?: string;
}