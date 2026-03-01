// resources/js/components/presupuestos/PresupuestoActions.tsx

import { Link } from '@inertiajs/react';
import { Edit, FileText, Download, MessageCircle, Mail, Eye, Loader } from 'lucide-react';
import React, { useState } from 'react';

import { useToast } from '@/contexts/ToastContext';

interface Props {
    presupuestoId: number;
    referencia: string;
    tieneTelefono: boolean;
    mensajeWhatsApp: string | null;
    telefono?: string;
}

export const PresupuestoActions: React.FC<Props> = ({ 
    presupuestoId, 
    referencia, 
    tieneTelefono, 
    mensajeWhatsApp,
    telefono 
}) => {
    const [generandoPDF, setGenerandoPDF] = useState(false);
    const toast = useToast();

    const handleDescargarPDF = async () => {
        setGenerandoPDF(true);
        toast.info('Generando PDF...');
        
        try {
            // Abrir ventana temporal para generar el PDF
            const pdfWindow = window.open(`/comercial/presupuestos/${presupuestoId}/pdf?download=1`, '_blank');
            
            if (!pdfWindow) {
                toast.error('Por favor, permita ventanas emergentes para generar el PDF');
                setGenerandoPDF(false);
            }
            
            // Escuchar el mensaje de la ventana temporal
            const handleMessage = (event: MessageEvent) => {
                if (event.data.type === 'PDF_GENERADO') {
                    const blob = event.data.pdfBlob;
                    const url = window.URL.createObjectURL(blob);
                    
                    toast.success('PDF generado correctamente');
                    
                    // Crear enlace de descarga
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = `Presupuesto_${referencia}.pdf`;
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    
                    // Limpiar
                    window.URL.revokeObjectURL(url);
                    setGenerandoPDF(false);
                    
                    // Remover listener
                    window.removeEventListener('message', handleMessage);
                } else if (event.data.type === 'PDF_ERROR') {
                    toast.error(event.data.error || 'Error al generar el PDF');
                    setGenerandoPDF(false);
                    window.removeEventListener('message', handleMessage);
                }
            };

            window.addEventListener('message', handleMessage);
            
        } catch (error) {
            console.error('Error generando PDF:', error);
            toast.error('Error al generar el PDF');
            setGenerandoPDF(false);
        }
    };

    const handleVerPDF = () => {
        window.open(`/comercial/presupuestos/${presupuestoId}/pdf`, '_blank');
    };

const handleWhatsApp = async () => {
    if (!telefono || !mensajeWhatsApp) {
        toast.error('No se puede enviar el mensaje');
        return;
    }

    window.open(`https://wa.me/${telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensajeWhatsApp)}`, '_blank');
    toast.success('Mensaje enviado');
};

    return (
        <div className="flex flex-wrap items-center gap-2">
            <Link
                href={`/comercial/presupuestos/${presupuestoId}/edit`}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
            >
                <Edit className="h-4 w-4" />
                <span className="hidden sm:inline">Editar</span>
            </Link>

            {tieneTelefono && mensajeWhatsApp && telefono ? (
                <button
                    onClick={handleWhatsApp}
                    disabled={generandoPDF}
                    className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors disabled:opacity-50"
                >
                    {generandoPDF ? (
                        <>
                            <Loader className="h-4 w-4 animate-spin" />
                            <span className="hidden sm:inline">Generando...</span>
                        </>
                    ) : (
                        <>
                            <MessageCircle className="h-4 w-4" />
                            <span className="hidden sm:inline">WhatsApp</span>
                        </>
                    )}
                </button>
            ) : (
                <button
                    disabled
                    className="flex items-center gap-2 px-3 py-2 bg-gray-400 text-white rounded-lg text-sm cursor-not-allowed opacity-50"
                    title="El lead no tiene teléfono registrado"
                >
                    <MessageCircle className="h-4 w-4" />
                    <span className="hidden sm:inline">WhatsApp</span>
                </button>
            )}

            <button
                onClick={() => {
                    const subject = `Presupuesto ${referencia}`;
                    const body = mensajeWhatsApp || '';
                    window.location.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
                }}
                className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
            >
                <Mail className="h-4 w-4" />
                <span className="hidden sm:inline">Email</span>
            </button>

            {/* Ver PDF */}
            <button
                onClick={handleVerPDF}
                className="flex items-center gap-2 px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm transition-colors"
            >
                <Eye className="h-4 w-4" />
                <span className="hidden sm:inline">Ver PDF</span>
            </button>

            {/* Descargar PDF */}
            <button
                onClick={handleDescargarPDF}
                disabled={generandoPDF}
                className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
                {generandoPDF ? (
                    <>
                        <Loader className="h-4 w-4 animate-spin" />
                        <span className="hidden sm:inline">Generando...</span>
                    </>
                ) : (
                    <>
                        <Download className="h-4 w-4" />
                        <span className="hidden sm:inline">Descargar</span>
                    </>
                )}
            </button>
        </div>
    );
};