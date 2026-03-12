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
    
    const telefonoComercial = comercial?.telefono || comercial?.personal?.telefono || '';
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
    
    if (leadData.nombre_completo && leadData.telefono && leadId) {
        const primerNombreLead = leadData.nombre_completo.split(' ')[0];
        
        // Usar la compañía desde window.compania que ya está disponible
        const nombreCompania = (window as any).compania?.nombre || 'la empresa';
        
        // Mensaje ultra simple
        const mensajeLead = `Hola ${primerNombreLead}, soy ${comercial.nombre} de ${nombreCompania}.`;
        
        const telefonoLead = leadData.telefono.replace(/\D/g, '');
        const telefonoLeadFormateado = telefonoLead.startsWith('54') ? telefonoLead : `54${telefonoLead}`;
        
        mensaje += `\n📲 Contactar: ${window.location.origin}/comercial/lead/${leadId}/contactar-whatsapp?phone=${telefonoLeadFormateado}&msg=${encodeURIComponent(mensajeLead)}\n`;
    }
    
    mensaje += `\nContacta al lead.`;
    
    return mensaje;
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
                        <div className="whitespace-pre-line text-gray-600 font-mono text-xs">
                            {generarMensajeVistaPrevia()}
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
                <button
                    type="button"
                    onClick={onBack}
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Volver
                </button>
                
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
                                <Send className="h-4 w-4" />
                                Enviar WhatsApp
                            </>
                        )}
                    </button>
                </div>
            </div>
        </div>
    );
}