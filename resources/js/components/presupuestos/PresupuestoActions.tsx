// resources/js/components/presupuestos/PresupuestoActions.tsx

import { Link, router } from '@inertiajs/react';
import { Edit, FileText, Download, MessageCircle, Mail, Eye, Loader } from 'lucide-react';
import React, { useState } from 'react';

import { useToast } from '@/contexts/ToastContext';
import EnviarPresupuestoEmailModal from '@/components/Modals/Emails/EnviarPresupuestoEmailModal';

interface Props {
    presupuestoId: number;
    referencia: string;
    tieneTelefono: boolean;
    mensajeWhatsApp: string | null;
    telefono?: string;
    leadNombre: string;
    leadEmail: string;
    comercialEmail: string;
    comercialNombre: string;
    companiaId: number;
    companiaNombre: string;
}

interface PdfData {
    success: boolean;
    url?: string;
    filename?: string;
    error?: string;
}

export const PresupuestoActions: React.FC<Props> = ({ 
    presupuestoId, 
    referencia, 
    tieneTelefono, 
    mensajeWhatsApp,
    telefono,
    leadNombre,
    leadEmail,
    comercialEmail,
    comercialNombre,
    companiaId,
    companiaNombre
}) => {
    const [generandoPDF, setGenerandoPDF] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const toast = useToast();

    // Función para generar PDF temporal
    const generarPDFTemporal = async (): Promise<string | null> => {
        return new Promise((resolve) => {
            router.post(`/comercial/presupuestos/${presupuestoId}/generar-pdf-temp`, {}, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: (page: any) => {
                    const flash = page.props.flash as any;
                    const data = flash?.pdfData || page.props?.pdfData as PdfData;
                    
                    if (data?.success && data.url) {
                        resolve(data.url);
                    } else {
                        toast.error(data?.error || 'Error al generar PDF');
                        resolve(null);
                    }
                },
                onError: (errors: any) => {
                    console.error('Error generando PDF:', errors);
                    toast.error('Error al generar el PDF');
                    resolve(null);
                }
            });
        });
    };

    const handleDescargarPDF = async () => {
        setGenerandoPDF(true);
        toast.info('Generando PDF...');
        
        try {
            const response = await fetch(`/comercial/presupuestos/${presupuestoId}/pdf?download=1`, {
                method: 'GET',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/pdf'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error al generar PDF: ${response.status}`);
            }
            
            const blob = await response.blob();
            const url = window.URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Presupuesto_${referencia}.pdf`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            window.URL.revokeObjectURL(url);
            
            toast.success('PDF descargado correctamente');
            
        } catch (error) {
            console.error('Error generando PDF:', error);
            toast.error('Error al generar el PDF');
        } finally {
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

    const handleWhatsAppConPDF = async () => {
        if (!telefono || !mensajeWhatsApp) {
            toast.error('No se puede enviar el mensaje');
            return;
        }

        setGenerandoPDF(true);
        toast.info('Preparando PDF...');
        
        try {
            // Generar PDF temporal
            const url = await generarPDFTemporal();
            
            if (!url) {
                throw new Error('No se pudo generar el PDF');
            }
            
            // Descargar el PDF generado
            const pdfResponse = await fetch(url);
            const pdfBlob = await pdfResponse.blob();
            
            const file = new File([pdfBlob], `Presupuesto_${referencia}.pdf`, { type: 'application/pdf' });
            
            // Web Share API
            if (navigator.share && navigator.canShare && navigator.canShare({ files: [file] })) {
                await navigator.share({
                    title: `Presupuesto ${referencia}`,
                    text: mensajeWhatsApp,
                    files: [file]
                });
                toast.success('Archivo listo para compartir');
            } else {
                // Fallback: descargar y luego abrir WhatsApp
                const downloadUrl = window.URL.createObjectURL(pdfBlob);
                const link = document.createElement('a');
                link.href = downloadUrl;
                link.download = `Presupuesto_${referencia}.pdf`;
                document.body.appendChild(link);
                link.click();
                document.body.removeChild(link);
                window.URL.revokeObjectURL(downloadUrl);
                
                window.open(`https://wa.me/${telefono.replace(/\D/g, '')}?text=${encodeURIComponent(mensajeWhatsApp)}`, '_blank');
                toast.success('PDF descargado y WhatsApp abierto');
            }
            
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al procesar la solicitud');
        } finally {
            setGenerandoPDF(false);
        }
    };

    const handleOpenEmailModal = async () => {
        setGenerandoPDF(true);
        toast.info('Preparando PDF para email...');
        
        try {
            // Generar PDF temporal
            const url = await generarPDFTemporal();
            
            if (url) {
                setPdfUrl(url);
                setShowEmailModal(true);
            }
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al preparar el PDF');
        } finally {
            setGenerandoPDF(false);
        }
    };

    return (
        <>
            <div className="flex flex-wrap items-center gap-2">
                <Link
                    href={`/comercial/presupuestos/${presupuestoId}/edit`}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors"
                >
                    <Edit className="h-4 w-4" />
                    <span className="hidden sm:inline">Editar</span>
                </Link>

                {/* Botón WhatsApp normal (solo texto) */}
                {tieneTelefono && mensajeWhatsApp && telefono ? (
                    <button
                        onClick={handleWhatsApp}
                        disabled={generandoPDF}
                        className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors disabled:opacity-50"
                        title="Enviar solo mensaje de texto"
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

                {/* Botón WhatsApp con PDF (SIEMPRE VISIBLE si hay teléfono) */}
                {tieneTelefono && mensajeWhatsApp && telefono && (
                    <button
                        onClick={handleWhatsAppConPDF}
                        disabled={generandoPDF}
                        className="flex items-center gap-2 px-3 py-2 bg-green-700 text-white rounded-lg hover:bg-green-800 text-sm transition-colors disabled:opacity-50"
                        title="Enviar presupuesto con PDF adjunto"
                    >
                        {generandoPDF ? (
                            <>
                                <Loader className="h-4 w-4 animate-spin" />
                                <span className="hidden sm:inline">Generando...</span>
                            </>
                        ) : (
                            <>
                                <MessageCircle className="h-4 w-4" />
                                <span className="hidden sm:inline">WhatsApp + PDF</span>
                            </>
                        )}
                    </button>
                )}

                {/* Botón Email */}
                <button
                    onClick={handleOpenEmailModal}
                    disabled={generandoPDF}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm transition-colors disabled:opacity-50"
                >
                    {generandoPDF ? (
                        <>
                            <Loader className="h-4 w-4 animate-spin" />
                            <span className="hidden sm:inline">Generando...</span>
                        </>
                    ) : (
                        <>
                            <Mail className="h-4 w-4" />
                            <span className="hidden sm:inline">Email</span>
                        </>
                    )}
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

            {/* Modal de Email */}
            {pdfUrl && (
                <EnviarPresupuestoEmailModal
                    isOpen={showEmailModal}
                    onClose={() => {
                        setShowEmailModal(false);
                        setPdfUrl(null);
                    }}
                    presupuestoId={presupuestoId}
                    referencia={referencia}
                    leadNombre={leadNombre}
                    leadEmail={leadEmail}
                    comercialEmail={comercialEmail}
                    comercialNombre={comercialNombre}
                    mensajeWhatsApp={mensajeWhatsApp}
                    companiaId={companiaId}
                    companiaNombre={companiaNombre}
                    pdfUrl={pdfUrl}
                />
            )}
        </>
    );
};