// resources/js/components/Modals/Emails/EnviarContratoEmailModal.tsx

import { router } from '@inertiajs/react';
import { X, Send, Mail, FileText, Files, Upload, Trash2, Gift, FileCheck, Eye } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useToast } from '@/contexts/ToastContext';
import DocumentoSelector from './DocumentoSelector';
import VistaPreviaBienvenidaModal from './VistaPreviaBienvenidaModal';

interface FileItem {
    name: string;
    path: string;
    lastModified: string | null;
    size: string | null;
    extension: string | null;
}

interface EnviarContratoEmailModalProps {
    isOpen: boolean;
    onClose: () => void;
    contrato: any;
    comercialNombre: string;
    comercialEmail: string;
    comercialTelefono?: string;
    companiaId: number;
    companiaNombre: string;
    plataforma: string;
    pdfUrl?: string;
    leadEsCliente?: boolean; // 🔥 Ya no se usa, pero lo mantengo por compatibilidad
}

export default function EnviarContratoEmailModal({
    isOpen,
    onClose,
    contrato,
    comercialNombre,
    comercialEmail,
    comercialTelefono,
    companiaId,
    companiaNombre,
    plataforma,
    pdfUrl,
    leadEsCliente = false // 🔥 Ya no afecta la lógica
}: EnviarContratoEmailModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDocumentSelector, setShowDocumentSelector] = useState(false);
    const [showVistaPrevia, setShowVistaPrevia] = useState(false);
    const [documentosAdjuntos, setDocumentosAdjuntos] = useState<FileItem[]>([]);
    const [archivosLocales, setArchivosLocales] = useState<File[]>([]);
    const [archivosPlataforma, setArchivosPlataforma] = useState<File[]>([]);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfLoaded, setPdfLoaded] = useState(false);
    const [formData, setFormData] = useState({
        to: '',
        cc: '',
        bcc: '',
        subject: `Contrato ${contrato?.numero_contrato || ''} - ${companiaNombre}`,
        body: '',
        attachPDF: true,
        incluirBienvenida: false // 🔥 CAMBIADO: Por defecto false
    });
    
    const toast = useToast();
    const modalContentRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Guardar referencia al mensaje genérico
    const mensajeGenericoRef = useRef('');

    // Generar mensaje genérico
    const generarMensajeGenerico = () => {
        const lineas: string[] = [];
        const nombreCliente = contrato?.cliente_nombre_completo || 'cliente';
        lineas.push(`Buenos días ${nombreCliente},`);
        lineas.push(``);
        lineas.push(`Te adjunto el contrato N° ${contrato?.numero_contrato || ''} para que lo revises.`);
        lineas.push(``);
        lineas.push(`Quedamos atentos a cualquier consulta.`);
        lineas.push(``);
        lineas.push(`Saludos cordiales,`);
        lineas.push(``);
        lineas.push(`${comercialNombre}`);
        lineas.push(`${companiaNombre}`);
        lineas.push(`${comercialEmail}`);
        if (comercialTelefono) lineas.push(`Tel: ${comercialTelefono}`);
        return lineas.join('\n');
    };

    // Inicializar formulario
    useEffect(() => {
        if (isOpen && contrato) {
            const emailComercial = comercialEmail || contrato.vendedor_email || '';
            mensajeGenericoRef.current = generarMensajeGenerico();
            
            setFormData({
                to: contrato.cliente_email || '',
                cc: emailComercial,
                bcc: '',
                subject: `Contrato ${contrato.numero_contrato || ''} - ${companiaNombre}`,
                body: mensajeGenericoRef.current, // 🔥 Siempre usar mensaje genérico al inicio
                attachPDF: true,
                incluirBienvenida: false // 🔥 Por defecto sin bienvenida
            });

            setTimeout(() => {
                if (modalContentRef.current) {
                    modalContentRef.current.scrollTop = 0;
                }
            }, 100);
        }
    }, [isOpen, contrato, comercialEmail, companiaNombre]);

    // 🔥 NUEVO: Cambiar mensaje según checkbox
    useEffect(() => {
        if (isOpen) {
            if (!formData.incluirBienvenida) {
                // Si NO está seleccionado, mostrar el mensaje genérico (o el que haya editado el usuario)
                if (!formData.body || formData.body.includes('[Mensaje de bienvenida')) {
                    setFormData(prev => ({ ...prev, body: mensajeGenericoRef.current }));
                }
            } else {
                // Si está seleccionado, mostrar placeholder del mensaje de bienvenida
                setFormData(prev => ({ ...prev, body: `[Mensaje de bienvenida de ${companiaNombre} - ${plataforma}]\n\nEl mensaje se generará automáticamente en el servidor.` }));
            }
        }
    }, [formData.incluirBienvenida, isOpen, companiaNombre, plataforma]);

    // Cargar PDF
    useEffect(() => {
        if (pdfUrl && !pdfLoaded && formData.attachPDF) {
            fetch(pdfUrl)
                .then(res => res.blob())
                .then(blob => {
                    const file = new File([blob], `Contrato_${contrato?.numero_contrato}.pdf`, { type: 'application/pdf' });
                    setPdfFile(file);
                    setPdfLoaded(true);
                })
                .catch(err => {
                    console.error('Error cargando PDF:', err);
                    toast.error('No se pudo cargar el PDF');
                });
        }
    }, [pdfUrl, contrato, pdfLoaded, formData.attachPDF, toast]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value, type } = e.target;
        const checked = (e.target as HTMLInputElement).checked;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleDocumentosSeleccionados = async (archivos: FileItem[]) => {
        setDocumentosAdjuntos(prev => [...prev, ...archivos]);
        const nuevosArchivos: File[] = [];
        for (const archivo of archivos) {
            try {
                const response = await fetch(`/comercial/documentacion/download?file=${encodeURIComponent(archivo.path)}&raw=1`);
                if (response.ok) {
                    const blob = await response.blob();
                    const file = new File([blob], archivo.name, { type: blob.type });
                    nuevosArchivos.push(file);
                }
            } catch (error) {
                console.error('Error cargando archivo:', error);
            }
        }
        setArchivosPlataforma(prev => [...prev, ...nuevosArchivos]);
    };

    const handleLocalFilesChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files) {
            const files = Array.from(e.target.files);
            setArchivosLocales(prev => [...prev, ...files]);
            const nuevosItems: FileItem[] = files.map(file => ({
                name: file.name,
                path: file.name,
                lastModified: new Date(file.lastModified).toLocaleDateString(),
                size: `${(file.size / 1024).toFixed(2)} KB`,
                extension: file.name.split('.').pop() || null
            }));
            setDocumentosAdjuntos(prev => [...prev, ...nuevosItems]);
        }
    };

    const removeAdjunto = (index: number) => {
        setDocumentosAdjuntos(prev => prev.filter((_, i) => i !== index));
        setArchivosLocales(prev => prev.filter((_, i) => i !== index));
        setArchivosPlataforma(prev => prev.filter((_, i) => i !== index));
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
            const formDataToSend = new FormData();
            
            // Procesar destinatarios
            const toArray = formData.to.split(',').map(email => email.trim()).filter(email => email);
            formDataToSend.append('to', JSON.stringify(toArray));
            
            if (formData.cc) {
                const ccArray = formData.cc.split(',').map(email => email.trim()).filter(email => email);
                formDataToSend.append('cc', JSON.stringify(ccArray));
            }
            
            if (formData.bcc) {
                const bccArray = formData.bcc.split(',').map(email => email.trim()).filter(email => email);
                formDataToSend.append('bcc', JSON.stringify(bccArray));
            }
            
            formDataToSend.append('subject', formData.subject);
            formDataToSend.append('body', formData.body);
            formDataToSend.append('contratoId', String(contrato.id));
            formDataToSend.append('numeroContrato', contrato.numero_contrato);
            formDataToSend.append('tipo', 'cliente');
            
            // Opciones de bienvenida - 🔥 Ya no depende de leadEsCliente
            formDataToSend.append('incluirBienvenida', JSON.stringify(formData.incluirBienvenida));
            
            // Datos de bienvenida (si aplica)
            if (formData.incluirBienvenida) {
                const bienvenidaData = {
                    companiaId,
                    plataforma,
                    nombreCliente: contrato.cliente_nombre_completo,
                    nombreFlota: contrato.empresa_nombre_flota || contrato.cliente_nombre_completo,
                    comercialNombre,
                    comercialEmail,
                    comercialTelefono
                };
                formDataToSend.append('bienvenidaData', JSON.stringify(bienvenidaData));
            }
            
            // Adjuntar PDF
            if (formData.attachPDF && pdfFile) {
                formDataToSend.append('pdf', pdfFile);
            }
            
            // Documentos locales
            archivosLocales.forEach((file, index) => {
                formDataToSend.append(`documento_local_${index}`, file);
            });
            
            // Documentos de plataforma
            archivosPlataforma.forEach((file, index) => {
                formDataToSend.append(`documento_plataforma_${index}`, file);
            });

            router.post('/api/email/enviar-contrato', formDataToSend, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Email enviado correctamente');
                    onClose();
                },
                onError: (errors: any) => {
                    console.error('Errores:', errors);
                    toast.error(errors?.error || 'Error al enviar el email');
                    setIsSubmitting(false);
                },
                onFinish: () => setIsSubmitting(false)
            });
        } catch (error) {
            console.error('Error:', error);
            toast.error('Error al procesar la solicitud');
            setIsSubmitting(false);
        }
    };

    const handleVerVistaPrevia = () => setShowVistaPrevia(true);

    if (!isOpen || !contrato) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-[99990]" onClick={onClose} />
            
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[99995] pointer-events-none">
                <div 
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] pointer-events-auto border border-gray-100"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-gray-50 to-white rounded-t-2xl">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="p-2 sm:p-3 bg-blue-100 rounded-xl">
                                <Mail className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-2xl font-semibold text-gray-900">
                                    Enviar Contrato por Email
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-1">
                                    Contrato #{contrato.numero_contrato} • {contrato.cliente_nombre_completo?.split(' ')[0]}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors disabled:opacity-50"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Content */}
                    <div ref={modalContentRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                        <form id="contratoEmailForm" onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                            {/* Campos principales */}
                            <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Para <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        name="to"
                                        value={formData.to}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-gray-300 rounded-xl shadow-sm py-2.5 sm:py-3 px-3 sm:px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="cliente@email.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">CC (copia)</label>
                                    <input
                                        type="text"
                                        name="cc"
                                        value={formData.cc}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl shadow-sm py-2.5 sm:py-3 px-3 sm:px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="comercial@empresa.com"
                                    />
                                    <p className="text-xs text-gray-500">Múltiples emails separados por coma</p>
                                </div>
                            </div>

                            <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">CCO (copia oculta)</label>
                                    <input
                                        type="text"
                                        name="bcc"
                                        value={formData.bcc}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl shadow-sm py-2.5 sm:py-3 px-3 sm:px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                        placeholder="otro@email.com"
                                    />
                                    <p className="text-xs text-gray-500">Múltiples emails separados por coma</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Asunto</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl shadow-sm py-2.5 sm:py-3 px-3 sm:px-4 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>

                            {/* Contrato a enviar */}
                            <div className="bg-blue-50 p-4 sm:p-6 rounded-xl border border-blue-200">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <FileCheck className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-blue-900 text-sm sm:text-base">Contrato a enviar</h3>
                                            <p className="text-xs sm:text-sm text-blue-700 mt-0.5">Contrato #{contrato.numero_contrato}</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <input
                                            type="checkbox"
                                            id="attachPDF"
                                            name="attachPDF"
                                            checked={formData.attachPDF}
                                            onChange={handleChange}
                                            className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="attachPDF" className="text-sm font-medium text-gray-700">
                                            Adjuntar PDF
                                        </label>
                                    </div>
                                </div>
                                {formData.attachPDF && pdfFile && (
                                    <div className="mt-3 pt-3 border-t border-blue-200 flex items-center gap-2 text-blue-800 text-xs sm:text-sm">
                                        <FileText className="h-3 w-3 sm:h-4 sm:w-4 flex-shrink-0" />
                                        <span className="truncate">Contrato_{contrato.numero_contrato}.pdf ({(pdfFile.size / 1024).toFixed(2)} KB)</span>
                                    </div>
                                )}
                            </div>

                            {/* 🔥 NUEVO: Mensaje de bienvenida - Siempre visible y sin lógica automática */}
                            <div className="bg-green-50 border border-green-200 p-4 sm:p-6 rounded-xl">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                                    <div className="flex items-center gap-3">
                                        <div className="bg-green-100 p-2 rounded-lg">
                                            <Gift className="h-5 w-5 text-green-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-green-900 text-sm sm:text-base">
                                                Mensaje de bienvenida
                                            </h3>
                                            <p className="text-xs sm:text-sm text-green-700 mt-0.5">
                                                Incluye datos de acceso, guías y contacto del comercial
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="incluirBienvenida"
                                            name="incluirBienvenida"
                                            checked={formData.incluirBienvenida}
                                            onChange={handleChange}
                                            className="h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="incluirBienvenida" className="text-sm font-medium text-gray-700">
                                            Incluir mensaje de bienvenida
                                        </label>
                                        {formData.incluirBienvenida && (
                                            <button
                                                type="button"
                                                onClick={handleVerVistaPrevia}
                                                className="flex items-center gap-1 px-3 py-1.5 bg-white border border-green-300 rounded-lg text-xs text-green-700 hover:bg-green-50"
                                            >
                                                <Eye className="h-3 w-3" />
                                                <span className="hidden sm:inline">Vista previa</span>
                                            </button>
                                        )}
                                    </div>
                                </div>
                            </div>

                            {/* Textarea editable (si NO hay bienvenida seleccionada) */}
                            {!formData.incluirBienvenida && (
                                <div className="space-y-2">
                                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                        <label className="text-sm font-medium text-gray-700">
                                            Mensaje para el cliente <span className="text-gray-400 text-xs">(puedes editarlo)</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, body: mensajeGenericoRef.current }))}
                                            className="text-xs text-blue-600 hover:text-blue-800 text-left sm:text-right"
                                        >
                                            Restaurar mensaje
                                        </button>
                                    </div>
                                    <textarea
                                        name="body"
                                        rows={8}
                                        value={formData.body}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl shadow-sm py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono"
                                        placeholder="Escribí tu mensaje aquí..."
                                    />
                                </div>
                            )}

                            {/* Documentación adicional */}
                            <div className="space-y-3">
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                                    <span className="text-sm font-medium text-gray-700">Documentación adicional:</span>
                                    <div className="flex flex-wrap gap-2">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-gray-300 rounded-lg text-xs sm:text-sm text-gray-700 hover:bg-gray-50"
                                        >
                                            <Upload className="h-3.5 w-3.5" />
                                            Subir archivos
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowDocumentSelector(true)}
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-purple-50 border border-purple-200 rounded-lg text-xs sm:text-sm text-purple-700 hover:bg-purple-100"
                                        >
                                            <Files className="h-3.5 w-3.5" />
                                            Buscar en biblioteca
                                        </button>
                                    </div>
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleLocalFilesChange}
                                        multiple
                                        className="hidden"
                                    />
                                </div>

                                {documentosAdjuntos.length > 0 && (
                                    <div className="bg-purple-50 p-3 sm:p-4 rounded-xl border border-purple-200">
                                        <p className="text-xs sm:text-sm font-medium text-purple-800 mb-2">
                                            Archivos adjuntos ({documentosAdjuntos.length})
                                        </p>
                                        <div className="space-y-1.5 max-h-40 overflow-y-auto">
                                            {documentosAdjuntos.map((doc, index) => (
                                                <div key={index} className="flex items-center justify-between gap-2 text-xs sm:text-sm bg-white p-2 rounded-lg border border-purple-100">
                                                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                        <FileText className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                                                        <span className="truncate text-purple-900">{doc.name}</span>
                                                        {doc.size && <span className="text-xs text-purple-500 flex-shrink-0">({doc.size})</span>}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAdjunto(index)}
                                                        className="p-1 hover:bg-purple-100 rounded-lg text-purple-400 hover:text-purple-600"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>

                    {/* Footer */}
                    <div className="flex flex-col-reverse sm:flex-row justify-end gap-2 p-4 sm:p-6 border-t border-gray-200 flex-shrink-0 bg-gray-50 rounded-b-2xl">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-4 py-2.5 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50 w-full sm:w-auto order-2 sm:order-1"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="contratoEmailForm"
                            disabled={isSubmitting}
                            className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto order-1 sm:order-2"
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

            <DocumentoSelector
                isOpen={showDocumentSelector}
                onClose={() => setShowDocumentSelector(false)}
                onSelect={handleDocumentosSeleccionados}
                companiaId={companiaId}
                selectedFiles={documentosAdjuntos}
            />

            <VistaPreviaBienvenidaModal
                isOpen={showVistaPrevia}
                onClose={() => setShowVistaPrevia(false)}
                contrato={contrato}
                comercialNombre={comercialNombre}
                comercialEmail={comercialEmail}
                comercialTelefono={comercialTelefono}
                companiaId={companiaId}
                companiaNombre={companiaNombre}
                plataforma={plataforma}
            />
        </>
    );
}