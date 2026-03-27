// resources/js/components/leads/steps/Paso3WhatsApp.tsx
import React from 'react';
import { Phone, Send, ArrowLeft } from 'lucide-react';
import { Comercial } from '@/types/leads';

interface Paso3WhatsAppProps {
    comercial: Comercial | null;
    leadData: {
        nombre_completo: string;
        telefono?: string;
        email?: string;
    };
    leadId: number | null;
    isSubmitting: boolean;
    onConfirm: (sendWhatsApp: boolean) => void;
    onSkip: () => void;
    onBack: () => void;
}

export default function Paso3WhatsApp({
    comercial,
    leadData,
    leadId,
    isSubmitting,
    onConfirm,
    onSkip,
    onBack
}: Paso3WhatsAppProps) {
    
    const telefonoComercial = comercial?.telefono || '';
    const primerNombreComercial = comercial?.nombre.split(' ')[0] || '';
    
const generarMensajeVistaPrevia = () => {
    if (!comercial) return '';
    
    let mensaje = `Hola ${primerNombreComercial}, nuevo lead:\n\n`;
    mensaje += `👤 ${leadData.nombre_completo}\n`;
    
    if (leadData.telefono) {
        mensaje += `📱 ${leadData.telefono}\n`;
    }
    
    if (leadData.email) {
        mensaje += `📧 ${leadData.email}\n`;
    }
    
    if (leadData.telefono && leadId) {
        const primerNombreLead = leadData.nombre_completo.split(' ')[0];
        const nombreCompania = (window as any).compania?.nombre || 'la empresa';
        const mensajeLead = `Hola ${primerNombreLead}, soy ${comercial.nombre} de ${nombreCompania}.`;
        
        const telefonoLead = leadData.telefono.replace(/\D/g, '');
        const telefonoLeadFormateado = telefonoLead.startsWith('54') ? telefonoLead : `54${telefonoLead}`;
        
        // 🔥 ENLACE QUE NO REGISTRA EN PREVISUALIZACIÓN
        const urlContactar = `${window.location.origin}/lead/${leadId}/contactar?phone=${telefonoLeadFormateado}&msg=${encodeURIComponent(mensajeLead)}`;
        
        // Enlace de previsualización (para que WhatsApp muestre algo bonito)
        const urlPreview = `${window.location.origin}/lead/${leadId}/info`;
        
        mensaje += `\n📲 Link para contactar al lead:\n`;
        mensaje += `${urlContactar}\n\n`;
        mensaje += `ℹ️ Vista previa: ${urlPreview}\n`;
    }
    
    mensaje += `\n⚠️ IMPORTANTE: Al hacer clic en el enlace se abrirá WhatsApp y se registrará automáticamente el contacto.`;
    
    return mensaje;
};

// Función para manejar el envío
const handleSendWhatsApp = () => {
    if (!comercial || !telefonoComercial || !leadData.telefono) return;
    
    const primerNombreLead = leadData.nombre_completo.split(' ')[0];
    const nombreCompania = (window as any).compania?.nombre || 'la empresa';
    const mensajeLead = `Hola ${primerNombreLead}, soy ${comercial.nombre} de ${nombreCompania}.`;
    
    const telefonoLead = leadData.telefono.replace(/\D/g, '');
    const telefonoLeadFormateado = telefonoLead.startsWith('54') ? telefonoLead : `54${telefonoLead}`;
    
    // Construir URL pública que registrará el contacto
    const urlRegistro = `${window.location.origin}/comercial/lead/${leadId}/contactar-whatsapp?phone=${telefonoLeadFormateado}&msg=${encodeURIComponent(mensajeLead)}`;
    
    // Abrir en nueva pestaña/ventana
    window.open(urlRegistro, '_blank');
    
    // Llamar al callback para cerrar el modal
    onConfirm(true);
};

    return (
        <div className="space-y-6">
            <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <div className="flex items-start gap-3">
                    <Phone className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                        <h3 className="font-medium text-green-900">
                            Lead creado exitosamente
                        </h3>
                        <p className="text-sm text-green-700 mt-1">
                            ¿Deseas notificar al comercial por WhatsApp?
                        </p>
                    </div>
                </div>
            </div>

            {comercial && (
                <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                    <h3 className="font-medium text-gray-900 mb-2">
                        Comercial: {comercial.nombre}
                    </h3>
                    
                    {telefonoComercial ? (
                        <p className="text-sm text-gray-600 mb-3">
                            Teléfono: {telefonoComercial}
                        </p>
                    ) : (
                        <p className="text-sm text-red-600 mb-3">
                            No hay teléfono registrado
                        </p>
                    )}
                    
                    <div className="text-sm bg-white p-3 rounded border border-gray-200">
                        <p className="font-medium text-gray-700 mb-2">Vista previa del mensaje:</p>
                        <div className="text-gray-600 text-xs space-y-1 max-h-60 overflow-y-auto bg-gray-50 p-3 rounded">
                            {generarMensajeVistaPrevia().split('\n').map((line, i) => {
                                // Detectar si la línea contiene un enlace
                                if (line.includes('/comercial/lead/')) {
                                    return (
                                        <div key={i} className="text-blue-600 font-mono text-xs break-all my-1 p-1 bg-blue-50 rounded">
                                            🔗 {line}
                                        </div>
                                    );
                                }
                                return (
                                    <div key={i} className="break-words">
                                        {line || <br />}
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}
            
            {comercial && !telefonoComercial && (
                <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                    <p className="text-sm text-yellow-700">
                        El comercial no tiene teléfono registrado. No se podrá enviar WhatsApp.
                    </p>
                </div>
            )}

            <div className="flex justify-between gap-3 pt-6 border-t border-gray-200">
                <div className="flex gap-3">
                    <button
                        type="button"
                        onClick={onSkip}
                        disabled={isSubmitting}
                        className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                    >
                        Omitir
                    </button>
                    <button
                        type="button"
                        onClick={() => onConfirm(true)}
                        disabled={isSubmitting || !telefonoComercial}
                        className={`px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white flex items-center gap-2 ${
                            telefonoComercial 
                                ? 'bg-green-600 hover:bg-green-700' 
                                : 'bg-gray-400 cursor-not-allowed'
                        }`}
                    >
                        {isSubmitting ? 'Enviando...' : (
                            <> 
                                WhatsApp
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}