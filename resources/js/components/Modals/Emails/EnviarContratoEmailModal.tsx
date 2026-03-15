// resources/js/components/Modals/Emails/EnviarContratoEmailModal.tsx

import { router } from '@inertiajs/react';
import { X, Send, Paperclip, Mail, FileText, CheckSquare, Eye, EyeOff, Files, Upload, Trash2, Gift, FileCheck } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useToast } from '@/contexts/ToastContext';
import DocumentoSelector from './DocumentoSelector';
import VistaPreviaBienvenidaModal from './VistaPreviaBienvenidaModal';
import { 
    mensajeBienvenidaLocalsatAlpha, 
    mensajeBienvenidaSmartSat, 
    mensajeBienvenidaLocalsatDelta 
} from './Mensajes/Bienvenida';

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
    leadEsCliente?: boolean;
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
    leadEsCliente = false
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
        incluirBienvenida: !leadEsCliente
    });
    
    const toast = useToast();
    const modalContentRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Guardar referencia al mensaje genérico para usarlo cuando se desmarca bienvenida
    const mensajeGenericoRef = useRef('');

    // Generar mensaje genérico para cuando no hay bienvenida
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

    // Determinar qué mensaje de bienvenida usar basado en compañía y plataforma
    const generarMensajeBienvenida = () => {
        if (companiaId === 2) {
            return mensajeBienvenidaSmartSat(
                contrato,
                comercialNombre,
                comercialEmail,
                comercialTelefono || ''
            );
        }
        
        if (plataforma?.toUpperCase() === 'DELTA') {
            return mensajeBienvenidaLocalsatDelta(
                contrato,
                comercialNombre,
                comercialEmail,
                comercialTelefono || ''
            );
        }
        
        return mensajeBienvenidaLocalsatAlpha(
            contrato,
            comercialNombre,
            comercialEmail,
            comercialTelefono || ''
        );
    };

    // Inicializar el formulario cuando se abre el modal
    useEffect(() => {
        if (isOpen && contrato) {
            const emailComercial = comercialEmail || contrato.vendedor_email || '';
            const nuevoIncluirBienvenida = !leadEsCliente;
            
            // Guardar el mensaje genérico en la ref para usarlo después
            mensajeGenericoRef.current = generarMensajeGenerico();
            
            const mensajeInicial = nuevoIncluirBienvenida 
                ? generarMensajeBienvenida() 
                : mensajeGenericoRef.current;
            
            setFormData({
                to: contrato.cliente_email || '',
                cc: emailComercial,
                bcc: '',
                subject: `Contrato ${contrato.numero_contrato || ''} - ${companiaNombre}`,
                body: mensajeInicial,
                attachPDF: true,
                incluirBienvenida: nuevoIncluirBienvenida
            });

            setTimeout(() => {
                if (modalContentRef.current) {
                    modalContentRef.current.scrollTop = 0;
                }
            }, 100);
        }
    }, [isOpen, contrato, comercialEmail, companiaNombre, companiaId, plataforma, leadEsCliente]);

    // Efecto para cambiar el mensaje cuando se des/marca el checkbox
    useEffect(() => {
        if (isOpen) {
            if (!formData.incluirBienvenida) {
                // Si se desmarcó bienvenida, poner el mensaje genérico SIEMPRE
                setFormData(prev => ({
                    ...prev,
                    body: mensajeGenericoRef.current
                }));
            } else {
                // Si se marcó bienvenida, poner el mensaje de bienvenida
                setFormData(prev => ({
                    ...prev,
                    body: generarMensajeBienvenida()
                }));
            }
        }
    }, [formData.incluirBienvenida]);

    // Cargar el PDF
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
        
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
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
            const emailData = {
                to: formData.to,
                cc: formData.cc ? formData.cc.split(',').map(email => email.trim()) : [],
                bcc: formData.bcc ? formData.bcc.split(',').map(email => email.trim()) : [],
                subject: formData.subject,
                body: formData.body,
                contratoId: contrato.id,
                numeroContrato: contrato.numero_contrato,
                attachPDF: formData.attachPDF,
                incluirBienvenida: formData.incluirBienvenida,
                convertirACliente: !leadEsCliente && formData.incluirBienvenida
            };

            const formDataToSend = new FormData();
            Object.keys(emailData).forEach(key => {
                formDataToSend.append(key, JSON.stringify(emailData[key as keyof typeof emailData]));
            });

            if (formData.attachPDF && pdfFile) {
                formDataToSend.append('pdf', pdfFile);
            }

            archivosLocales.forEach((file, index) => {
                formDataToSend.append(`documento_local_${index}`, file);
            });

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

    if (!isOpen || !contrato) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-[99990]" onClick={onClose} />
            
            <div className="fixed inset-0 flex items-center justify-center p-8 z-[99995] pointer-events-none">
                <div 
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[85vh] pointer-events-auto border border-gray-100"
                    onClick={(e) => e.stopPropagation()}
                >
                    <div className="flex items-center justify-between p-8 border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-gray-50 to-white rounded-t-2xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-blue-100 rounded-xl">
                                <Mail className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-900">
                                    Enviar Contrato por Email
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Contrato #{contrato.numero_contrato} • {contrato.cliente_nombre_completo} • {companiaNombre} • {plataforma}
                                    {!leadEsCliente && (
                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                            Lead
                                        </span>
                                    )}
                                    {leadEsCliente && (
                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                            Cliente
                                        </span>
                                    )}
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

                    <div ref={modalContentRef} className="flex-1 overflow-y-auto p-8 space-y-6">
                        <form id="contratoEmailForm" onSubmit={handleSubmit} className="space-y-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label htmlFor="to" className="block text-sm font-medium text-gray-700">
                                        Para <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="email"
                                        id="to"
                                        name="to"
                                        value={formData.to}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="cliente@email.com"
                                    />
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="cc" className="block text-sm font-medium text-gray-700">
                                        CC (copia)
                                    </label>
                                    <input
                                        type="text"
                                        id="cc"
                                        name="cc"
                                        value={formData.cc}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="comercial@empresa.com"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Múltiples emails separados por coma</p>
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label htmlFor="bcc" className="block text-sm font-medium text-gray-700">
                                        CCO (copia oculta)
                                    </label>
                                    <input
                                        type="text"
                                        id="bcc"
                                        name="bcc"
                                        value={formData.bcc}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                        placeholder="otro@email.com"
                                    />
                                    <p className="text-xs text-gray-500 mt-1">Múltiples emails separados por coma</p>
                                </div>

                                <div className="space-y-2">
                                    <label htmlFor="subject" className="block text-sm font-medium text-gray-700">
                                        Asunto
                                    </label>
                                    <input
                                        type="text"
                                        id="subject"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="bg-blue-50 p-6 rounded-xl border border-blue-200">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <FileCheck className="h-6 w-6 text-blue-600" />
                                        </div>
                                        <div>
                                            <h3 className="font-medium text-blue-900">Contrato a enviar</h3>
                                            <p className="text-sm text-blue-700 mt-1">
                                                Contrato #{contrato.numero_contrato} • {contrato.cliente_nombre_completo}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="checkbox"
                                            id="attachPDF"
                                            name="attachPDF"
                                            checked={formData.attachPDF}
                                            onChange={handleChange}
                                            className="h-5 w-5 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                        />
                                        <label htmlFor="attachPDF" className="text-sm font-medium text-gray-700">
                                            Adjuntar PDF
                                        </label>
                                    </div>
                                </div>
                                {formData.attachPDF && pdfFile && (
                                    <div className="mt-4 pt-4 border-t border-blue-200 flex items-center gap-3 text-blue-800">
                                        <FileText className="h-4 w-4" />
                                        <span className="text-sm">
                                            Contrato_{contrato.numero_contrato}.pdf ({(pdfFile.size / 1024).toFixed(2)} KB)
                                        </span>
                                    </div>
                                )}
                            </div>

                            <div className={`${!leadEsCliente ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'} p-6 rounded-xl border`}>
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-4">
                                        <div className={`${!leadEsCliente ? 'bg-green-100' : 'bg-gray-200'} p-2 rounded-lg`}>
                                            <Gift className={`h-6 w-6 ${!leadEsCliente ? 'text-green-600' : 'text-gray-500'}`} />
                                        </div>
                                        <div>
                                            <h3 className={`font-medium ${!leadEsCliente ? 'text-green-900' : 'text-gray-600'}`}>
                                                Mensaje de bienvenida
                                            </h3>
                                            <p className={`text-sm ${!leadEsCliente ? 'text-green-700' : 'text-gray-500'} mt-1`}>
                                                {!leadEsCliente 
                                                    ? 'Recomendado para nuevos clientes. Incluye datos de acceso, guías y contacto del comercial'
                                                    : 'El cliente ya ha recibido el mensaje de bienvenida previamente'}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <input
                                            type="checkbox"
                                            id="incluirBienvenida"
                                            name="incluirBienvenida"
                                            checked={formData.incluirBienvenida}
                                            onChange={handleChange}
                                            disabled={leadEsCliente}
                                            className={`h-5 w-5 rounded border-gray-300 
                                                ${!leadEsCliente 
                                                    ? 'text-green-600 focus:ring-green-500' 
                                                    : 'text-gray-400 cursor-not-allowed'
                                                }`}
                                        />
                                        <label htmlFor="incluirBienvenida" className={`text-sm font-medium ${leadEsCliente ? 'text-gray-400' : 'text-gray-700'}`}>
                                            Incluir
                                        </label>
                                        {formData.incluirBienvenida && !leadEsCliente && (
                                            <button
                                                type="button"
                                                onClick={() => setShowVistaPrevia(true)}
                                                className="flex items-center gap-2 px-4 py-2 bg-white border border-green-300 rounded-lg text-sm text-green-700 hover:bg-green-50 transition-colors"
                                            >
                                                <Eye className="h-4 w-4" />
                                                Vista previa
                                            </button>
                                        )}
                                    </div>
                                </div>
                                
                                {leadEsCliente && !formData.incluirBienvenida && (
                                    <p className="mt-3 text-xs text-gray-500 border-t border-gray-200 pt-3">
                                        ℹ️ El mensaje de bienvenida solo está disponible para leads que aún no son clientes. 
                                        Si necesitas reenviarlo, contacta a soporte.
                                    </p>
                                )}
                            </div>

                            {/* Textarea editable SOLO cuando NO se incluye bienvenida */}
                            {!formData.incluirBienvenida && (
                                <div className="space-y-2">
                                    <div className="flex items-center justify-between">
                                        <label htmlFor="body" className="block text-sm font-medium text-gray-700">
                                            Mensaje para el cliente <span className="text-gray-400 text-xs">(puedes editarlo)</span>
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => {
                                                setFormData(prev => ({
                                                    ...prev,
                                                    body: mensajeGenericoRef.current
                                                }));
                                            }}
                                            className="text-xs text-blue-600 hover:text-blue-800"
                                        >
                                            Restaurar mensaje
                                        </button>
                                    </div>
                                    <textarea
                                        id="body"
                                        name="body"
                                        rows={10}
                                        value={formData.body}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono text-sm"
                                        placeholder="Escribí tu mensaje aquí..."
                                    />
                                    <p className="text-xs text-gray-500">
                                        Este mensaje se enviará junto con el contrato adjunto.
                                    </p>
                                </div>
                            )}

                            <div className="space-y-4">
                                <div className="flex items-center gap-4">
                                    <span className="text-sm font-medium text-gray-700">Documentación adicional:</span>
                                    <div className="flex gap-3">
                                        <button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm text-gray-700 hover:bg-gray-50 transition-colors"
                                        >
                                            <Upload className="h-4 w-4" />
                                            Subir archivos
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setShowDocumentSelector(true)}
                                            className="flex items-center gap-2 px-4 py-2 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-700 hover:bg-purple-100 transition-colors"
                                        >
                                            <Files className="h-4 w-4" />
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
                                    <div className="bg-purple-50 p-5 rounded-xl border border-purple-200">
                                        <p className="text-sm font-medium text-purple-800 mb-3">
                                            Archivos adjuntos ({documentosAdjuntos.length})
                                        </p>
                                        <div className="space-y-2 max-h-48 overflow-y-auto">
                                            {documentosAdjuntos.map((doc, index) => (
                                                <div key={index} className="flex items-center justify-between gap-2 text-sm bg-white p-3 rounded-lg border border-purple-100 hover:border-purple-200 transition-colors">
                                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                                        <FileText className="h-4 w-4 text-purple-500 flex-shrink-0" />
                                                        <span className="truncate text-purple-900">{doc.name}</span>
                                                        {doc.size && (
                                                            <span className="text-xs text-purple-500 flex-shrink-0">({doc.size})</span>
                                                        )}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAdjunto(index)}
                                                        className="p-1.5 hover:bg-purple-100 rounded-lg text-purple-400 hover:text-purple-600 transition-colors"
                                                        title="Eliminar"
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </form>
                    </div>

                    <div className="flex justify-end gap-3 p-8 border-t border-gray-200 flex-shrink-0 bg-gray-50 rounded-b-2xl">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={isSubmitting}
                            className="px-6 py-3 border border-gray-300 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            form="contratoEmailForm"
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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
                mensaje={formData.body}
                comercialNombre={comercialNombre}
                plataforma={plataforma}
            />
        </>
    );
}