// resources/js/components/modals/emails/EnviarPresupuestoEmailModal.tsx

import { router } from '@inertiajs/react';
import { X, Send, Paperclip, Mail, AtSign, FileText } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useToast } from '@/contexts/ToastContext';
import { mensajePresupuestoLocalsat, mensajePresupuestoSmartSat } from './Mensajes/Presupuestos';

interface EnviarPresupuestoEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    presupuestoId: number;
    referencia: string;
    leadNombre: string;
    leadEmail: string;
    comercialEmail: string;
    comercialNombre: string;
    mensajeWhatsApp: string | null;
    companiaId: number;
    companiaNombre: string;
    pdfUrl?: string;
}

export default function EnviarPresupuestoEmailModal({
    isOpen,
    onClose,
    presupuestoId,
    referencia,
    leadNombre,
    leadEmail,
    comercialEmail,
    comercialNombre,
    mensajeWhatsApp,
    companiaId,
    companiaNombre,
    pdfUrl
}: EnviarPresupuestoEmailModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [formData, setFormData] = useState({
        to: '',
        cc: '',
        bcc: '',
        subject: `Presupuesto ${companiaNombre} - ${referencia}`,
        body: '',
        attachPDF: true
    });
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfLoaded, setPdfLoaded] = useState(false);
    const toast = useToast();
    const modalContentRef = useRef<HTMLDivElement>(null);

    // Inicializar los campos cuando se abre el modal
    useEffect(() => {
        if (isOpen) {
            // Seleccionar el mensaje según la compañía
            let mensajeBody = '';
            
            if (companiaId === 2) { // SmartSat
                mensajeBody = mensajePresupuestoSmartSat(leadNombre, referencia, comercialNombre, comercialEmail);
            } else { // LocalSat y otras
                mensajeBody = mensajePresupuestoLocalsat(leadNombre, referencia, comercialNombre, comercialEmail);
            }
            
            setFormData({
                to: leadEmail || '',
                cc: comercialEmail || '', // Comercial en CC
                bcc: '',
                subject: `Presupuesto ${companiaNombre} - ${referencia}`,
                body: mensajeBody,
                attachPDF: true
            });

            // Resetear scroll al abrir
            setTimeout(() => {
                if (modalContentRef.current) {
                    modalContentRef.current.scrollTop = 0;
                }
            }, 100);
        }
    }, [isOpen, leadEmail, comercialEmail, companiaId, companiaNombre, referencia, leadNombre, comercialNombre]);

    // Cargar el PDF si existe
    useEffect(() => {
        if (pdfUrl && !pdfLoaded && formData.attachPDF) {
            fetch(pdfUrl)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], `Presupuesto_${referencia}.pdf`, { type: 'application/pdf' });
                    setPdfFile(file);
                    setPdfLoaded(true);
                })
                .catch(err => {
                    console.error('Error cargando PDF:', err);
                    toast.error('No se pudo cargar el PDF');
                });
        }
    }, [pdfUrl, referencia, pdfLoaded, formData.attachPDF, toast]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        if (!formData.to) {
            toast.error('El destinatario es requerido');
            return;
        }

        setIsSubmitting(true);
        toast.info('Enviando email...');

        try {
            const emailData = {
                to: formData.to,
                cc: formData.cc ? formData.cc.split(',').map(email => email.trim()) : [],
                bcc: formData.bcc ? formData.bcc.split(',').map(email => email.trim()) : [],
                subject: formData.subject,
                body: formData.body,
                presupuestoId,
                referencia,
                attachPDF: formData.attachPDF
            };

            if (formData.attachPDF && pdfFile) {
                const reader = new FileReader();
                reader.readAsDataURL(pdfFile);
                await new Promise((resolve) => {
                    reader.onload = () => {
                        // @ts-ignore
                        emailData.pdfBase64 = reader.result?.split(',')[1];
                        resolve(null);
                    };
                });
            }

            router.post('/api/email/enviar-presupuesto', emailData, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Email enviado correctamente');
                    onClose();
                },
                onError: (errors: any) => {
                    const errorMessage = errors?.error || 'Error al enviar el email';
                    toast.error(errorMessage);
                    setIsSubmitting(false);
                },
                onFinish: () => {
                    setIsSubmitting(false);
                }
            });
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al procesar la solicitud');
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-[99990]" onClick={onClose} />
            
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[99999] pointer-events-none">
                <div 
                    className="bg-white rounded-lg shadow-2xl w-full max-w-2xl flex flex-col max-h-[90vh] pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header - Fijo */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Mail className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Enviar Presupuesto por Email
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Ref: {referencia} • {leadNombre} • {companiaNombre}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-50"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Contenido - Scrollable */}
                    <div 
                        ref={modalContentRef}
                        className="flex-1 overflow-y-auto p-6"
                        style={{ maxHeight: 'calc(90vh - 140px)' }}
                    >
                        <form id="emailForm" onSubmit={handleSubmit}>
                            <div className="space-y-4">
                                {/* Para (destinatario) */}
                                <div>
                                    <label htmlFor="to" className="block text-sm font-medium text-gray-700 mb-1">
                                        Para <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <AtSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                        <input
                                            type="email"
                                            id="to"
                                            name="to"
                                            value={formData.to}
                                            onChange={handleChange}
                                            required
                                            className="pl-10 w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                            placeholder="cliente@email.com"
                                        />
                                    </div>
                                </div>

                                {/* CC */}
                                <div>
                                    <label htmlFor="cc" className="block text-sm font-medium text-gray-700 mb-1">
                                        CC (copia)
                                    </label>
                                    <input
                                        type="text"
                                        id="cc"
                                        name="cc"
                                        value={formData.cc}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="comercial@empresa.com"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Múltiples emails separados por coma
                                    </p>
                                </div>

                                {/* CCO */}
                                <div>
                                    <label htmlFor="bcc" className="block text-sm font-medium text-gray-700 mb-1">
                                        CCO (copia oculta)
                                    </label>
                                    <input
                                        type="text"
                                        id="bcc"
                                        name="bcc"
                                        value={formData.bcc}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                        placeholder="otro@email.com"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">
                                        Múltiples emails separados por coma
                                    </p>
                                </div>

                                {/* Asunto */}
                                <div>
                                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
                                        Asunto
                                    </label>
                                    <input
                                        type="text"
                                        id="subject"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    />
                                </div>

                                {/* Adjuntar PDF */}
                                <div className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        id="attachPDF"
                                        name="attachPDF"
                                        checked={formData.attachPDF}
                                        onChange={handleChange}
                                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                    />
                                    <label htmlFor="attachPDF" className="text-sm text-gray-700 flex items-center gap-2">
                                        <Paperclip className="h-4 w-4 text-gray-500" />
                                        Adjuntar PDF del presupuesto
                                    </label>
                                </div>

                                {/* Cuerpo del mensaje - Texto plano */}
                                <div>
                                    <label htmlFor="body" className="block text-sm font-medium text-gray-700 mb-1">
                                        Mensaje
                                    </label>
                                    <textarea
                                        id="body"
                                        name="body"
                                        value={formData.body}
                                        onChange={handleChange}
                                        rows={16}
                                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                                        style={{ whiteSpace: 'pre-wrap' }}
                                    />
                                </div>

                                {/* Información del PDF */}
                                {formData.attachPDF && (
                                    <div className="bg-blue-50 p-3 rounded-md border border-blue-200">
                                        <div className="flex items-center gap-2 text-blue-800">
                                            <FileText className="h-4 w-4" />
                                            <span className="text-sm">
                                                Se adjuntará: Presupuesto_{referencia}.pdf
                                                {pdfFile && ` (${(pdfFile.size / 1024).toFixed(2)} KB)`}
                                            </span>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Footer - Fijo */}
                    <div className="flex justify-end gap-3 p-6 border-t border-gray-200 flex-shrink-0">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="emailForm"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-md text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Enviar Email
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}