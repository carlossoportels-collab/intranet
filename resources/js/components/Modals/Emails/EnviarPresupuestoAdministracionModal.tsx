// resources/js/components/Modals/Emails/EnviarPresupuestoAdministracionModal.tsx

import { router } from '@inertiajs/react';
import { X, Send, Mail, Building2, FileText, Files, Upload, Trash2, Eye, Paperclip } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useToast } from '@/contexts/ToastContext';
import DocumentoSelector from './DocumentoSelector';
import { formatDate, formatMoney, toNumber } from '@/utils/formatters';
import type { PresupuestoCompleto } from '@/types/leads';

interface FileItem {
    name: string;
    path: string;
    lastModified: string | null;
    size: string | null;
    extension: string | null;
}

interface EnviarPresupuestoAdministracionModalProps {
    isOpen: boolean;
    onClose: () => void;
    presupuesto: PresupuestoCompleto;
    comercialNombre: string;
    comercialEmail: string;
    comercialTelefono?: string;
    companiaId: number;
    companiaNombre: string;
    plataforma: string;
    pdfUrl?: string;
    leadNombre: string;
    leadEmail: string;
    referencia: string;
}

export default function EnviarPresupuestoAdministracionModal({
    isOpen,
    onClose,
    presupuesto,
    comercialNombre,
    comercialEmail,
    comercialTelefono,
    companiaId,
    companiaNombre,
    plataforma,
    pdfUrl,
    leadNombre,
    leadEmail,
    referencia
}: EnviarPresupuestoAdministracionModalProps) {
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showDocumentSelector, setShowDocumentSelector] = useState(false);
    const [documentosAdjuntos, setDocumentosAdjuntos] = useState<FileItem[]>([]);
    const [archivosLocales, setArchivosLocales] = useState<File[]>([]);
    const [archivosPlataforma, setArchivosPlataforma] = useState<File[]>([]);
    const [pdfFile, setPdfFile] = useState<File | null>(null);
    const [pdfLoaded, setPdfLoaded] = useState(false);
    const [showVistaPrevia, setShowVistaPrevia] = useState(false);
    
    const toast = useToast();
    const modalContentRef = useRef<HTMLDivElement>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const mensajeGenericoRef = useRef('');

    // DESTINATARIOS: GFAURE Y PAGOMEZ
    const getDestinatarios = () => {
        return 'gfaure@localsat.com.ar;pgomez@localsat.com.ar';
    };

    const getCCDestinatarios = () => {
        if (comercialEmail && comercialEmail.trim() !== '') {
            return comercialEmail;
        }
        return '';
    };

    // Obtener hora del día para saludo
    const getSaludo = () => {
        const hora = new Date().getHours();
        if (hora >= 5 && hora < 12) return 'Buenos días';
        if (hora >= 12 && hora < 19) return 'Buenas tardes';
        return 'Buenas noches';
    };

    // Obtener número alfa y razón social de la empresa
const getDatosEmpresa = () => {
    let numeroAlfa = null;
    let razonSocial = null;
    
    // 🔥 USAR snake_case como viene de Inertia
    if (presupuesto?.lead?.empresa_contacto?.empresa) {
        const empresa = presupuesto.lead.empresa_contacto.empresa;
        numeroAlfa = empresa.numeroalfa;
        razonSocial = empresa.razon_social || empresa.nombre_fantasia;
    }
    // Fallback: intentar desde lead.empresa directamente
    else if (presupuesto?.lead?.empresa) {
        numeroAlfa = presupuesto.lead.empresa.numeroalfa;
        razonSocial = presupuesto.lead.empresa.razon_social || presupuesto.lead.empresa.nombre_fantasia;
    }
    
    return { numeroAlfa, razonSocial };
};

    // Obtener asunto del presupuesto
    const getSubject = () => {
        const { razonSocial } = getDatosEmpresa();
        const nombreMostrar = razonSocial || leadNombre;
        return `[PRESUPUESTO VENTA A CLIENTE] ${referencia} - ${nombreMostrar} - ${companiaNombre}`;
    };

    const getTasaInstalacion = () => {
        if (!presupuesto?.valor_tasa || toNumber(presupuesto.valor_tasa) === 0) return null;
        const codigo = presupuesto.tasa_codigo || presupuesto.tasa?.codigopro || 'TASA';
        const nombre = presupuesto.tasa_nombre || presupuesto.tasa?.nombre || 'Instalación / Activación';
        const valor = toNumber(presupuesto.valor_tasa);
        const bonificacion = toNumber(presupuesto.tasa_bonificacion);
        const subtotal = toNumber(presupuesto.subtotal_tasa) || (valor * (presupuesto.cantidad_vehiculos || 1));
        const cantidadVehiculos = presupuesto.cantidad_vehiculos || 1;
        return { codigo, nombre, valor, bonificacion, subtotal, cantidadVehiculos };
    };

    const getAbonoMensual = () => {
        if (!presupuesto?.valor_abono || toNumber(presupuesto.valor_abono) === 0) return null;
        const codigo = presupuesto.abono_codigo || presupuesto.abono?.codigopro || 'ABONO';
        const nombre = presupuesto.abono_nombre || presupuesto.abono?.nombre || 'Abono mensual';
        const valor = toNumber(presupuesto.valor_abono);
        const bonificacion = toNumber(presupuesto.abono_bonificacion);
        const subtotal = toNumber(presupuesto.subtotal_abono) || (valor * (presupuesto.cantidad_vehiculos || 1));
        const cantidadVehiculos = presupuesto.cantidad_vehiculos || 1;
        return { codigo, nombre, valor, bonificacion, subtotal, cantidadVehiculos };
    };

    const getTotalPresupuesto = () => {
        return toNumber(presupuesto.total_presupuesto);
    };

    //  FUNCIÓN CORREGIDA PARA CLASIFICAR ACCESORIOS Y SERVICIOS
const getProductosAgrupados = () => {
    if (!presupuesto?.agregados || presupuesto.agregados.length === 0) return {};
    
    // Filtrar para excluir tasa y abono (ya se muestran aparte)
    const productos = presupuesto.agregados.filter((item: any) => {
        const prdId = item.prd_servicio_id;
        return prdId !== presupuesto.tasa_id && prdId !== presupuesto.abono_id;
    });
    
    if (productos.length === 0) return {};
    
    const agrupados: Record<string, any[]> = {
        'ACCESORIOS': [],
        'SERVICIOS': [],
        'OTROS': []
    };
    
    productos.forEach((item: any) => {
        let tipo = 'OTROS';
        
        // 🔥 USAR producto_servicio (con guión bajo) que es como viene del backend
        const productoServicio = item.producto_servicio;
        
        // Obtener el tipo_id del producto
        let tipoId = null;
        
        if (productoServicio?.tipo_id) {
            tipoId = productoServicio.tipo_id;
        } else if (productoServicio?.tipo?.id) {
            tipoId = productoServicio.tipo.id;
        } else if (item.tipo_id) {
            tipoId = item.tipo_id;
        }
        
        // Clasificar según tipo_id (5 = Accesorios, 3 = Servicios)
        if (tipoId === 5) {
            tipo = 'ACCESORIOS';
        } else if (tipoId === 3) {
            tipo = 'SERVICIOS';
        } else {
            // Fallback: intentar por nombre
            const tipoNombre = productoServicio?.tipo?.nombre_tipo_abono || 
                              productoServicio?.tipo?.nombre || 
                              item.tipo_nombre || 
                              '';
            
            if (tipoNombre.toLowerCase().includes('accesorio')) {
                tipo = 'ACCESORIOS';
            } else if (tipoNombre.toLowerCase().includes('servicio')) {
                tipo = 'SERVICIOS';
            }
        }
        
        agrupados[tipo].push(item);
    });
    
    // Filtrar arrays vacíos
    const resultado: Record<string, any[]> = {};
    if (agrupados['ACCESORIOS'].length > 0) resultado['ACCESORIOS'] = agrupados['ACCESORIOS'];
    if (agrupados['SERVICIOS'].length > 0) resultado['SERVICIOS'] = agrupados['SERVICIOS'];
    if (agrupados['OTROS'].length > 0) resultado['OTROS'] = agrupados['OTROS'];
    
    return resultado;
};

    // Generar mensaje para administración
    const generarMensajeAdministracion = () => {
        const lineas: string[] = [];
        const saludo = getSaludo();
        const { numeroAlfa, razonSocial } = getDatosEmpresa();
        
        lineas.push(`${saludo} Guillermo,`);
        lineas.push(``);
        lineas.push(`Adjunto el presupuesto aprobado por el cliente para su procesamiento:`);
        lineas.push(``);
        
        // DATOS DEL CLIENTE - SOLO N° ALFA Y RAZÓN SOCIAL
        lineas.push(`DATOS DEL CLIENTE:`);
        if (numeroAlfa) {
            lineas.push(`N° Alfa: ${numeroAlfa}`);
        }
        if (razonSocial) {
            lineas.push(`Razón Social: ${razonSocial}`);
        } else {
            lineas.push(`Cliente: ${leadNombre || '-'}`);
            lineas.push(`Email: ${leadEmail || '-'}`);
            if (presupuesto?.lead?.telefono) {
                lineas.push(`Teléfono: ${presupuesto.lead.telefono}`);
            }
        }
        lineas.push(``);
        
        // DETALLE ECONÓMICO
        lineas.push(`DETALLE ECONÓMICO:`);
        lineas.push(``);
        
        const cantidadVehiculos = presupuesto.cantidad_vehiculos || 1;
        
        // TASA / INSTALACIÓN
        const tasa = getTasaInstalacion();
        if (tasa && tasa.valor > 0) {
            lineas.push(`INSTALACIÓN / ACTIVACIÓN:`);
            let lineaTasa = `  • [${tasa.codigo}] ${tasa.nombre}: ${formatMoney(tasa.valor)} c/u`;
            if (tasa.cantidadVehiculos > 1) {
                lineaTasa += ` x ${tasa.cantidadVehiculos} vehículos = ${formatMoney(tasa.valor * tasa.cantidadVehiculos)}`;
            }
            if (tasa.bonificacion > 0) {
                lineaTasa += ` (bonif: ${tasa.bonificacion}%) → Subtotal: ${formatMoney(tasa.subtotal)}`;
            } else if (tasa.cantidadVehiculos > 1) {
                lineaTasa += ` → Total: ${formatMoney(tasa.subtotal)}`;
            }
            lineas.push(lineaTasa);
            lineas.push(``);
        }
        
        // ABONO MENSUAL
        const abono = getAbonoMensual();
        if (abono && abono.valor > 0) {
            lineas.push(`ABONO MENSUAL:`);
            let lineaAbono = `  • [${abono.codigo}] ${abono.nombre}: ${formatMoney(abono.valor)} c/u`;
            if (abono.cantidadVehiculos > 1) {
                lineaAbono += ` x ${abono.cantidadVehiculos} vehículos = ${formatMoney(abono.valor * abono.cantidadVehiculos)}`;
            }
            if (abono.bonificacion > 0) {
                lineaAbono += ` (bonif: ${abono.bonificacion}%) → Subtotal: ${formatMoney(abono.subtotal)}`;
            } else if (abono.cantidadVehiculos > 1) {
                lineaAbono += ` → Total: ${formatMoney(abono.subtotal)}`;
            }
            lineas.push(lineaAbono);
            lineas.push(``);
        }
        
        // ACCESORIOS Y SERVICIOS - CLASIFICADOS CORRECTAMENTE
        const productosAgrupados = getProductosAgrupados();
        
        // ACCESORIOS
       if (productosAgrupados['ACCESORIOS'] && productosAgrupados['ACCESORIOS'].length > 0) {
    lineas.push(`ACCESORIOS:`);
    productosAgrupados['ACCESORIOS'].forEach((item: any) => {
        const productoServicio = item.producto_servicio;  // 🔥 USAR producto_servicio
        const codigo = item.producto_codigo || productoServicio?.codigopro || 'XXXX';
        const nombre = item.producto_nombre || productoServicio?.nombre || item.nombre || 'Accesorio';
        const cantidad = item.cantidad || 1;
        const valorUnitario = toNumber(item.valor);
        const bonificacion = toNumber(item.bonificacion);
        const subtotal = toNumber(item.subtotal);
        const valorTotalBase = valorUnitario * cantidad;
        
        let linea = `  • [${codigo}] ${nombre}`;
        if (cantidad > 1) {
            linea += ` x${cantidad} unidades = ${formatMoney(valorTotalBase)}`;
        }
        linea += ` - ${formatMoney(valorUnitario)} c/u`;
        
        if (bonificacion > 0) {
            const ahorro = valorTotalBase - subtotal;
            linea += ` (bonif: ${bonificacion}%, ahorro: ${formatMoney(ahorro)}) → Subtotal: ${formatMoney(subtotal)}`;
        } else if (cantidad > 1) {
            linea += ` → Subtotal: ${formatMoney(subtotal)}`;
        }
        lineas.push(linea);
    });
    lineas.push(``);
}

// SERVICIOS
if (productosAgrupados['SERVICIOS'] && productosAgrupados['SERVICIOS'].length > 0) {
    lineas.push(`SERVICIOS:`);
    productosAgrupados['SERVICIOS'].forEach((item: any) => {
        const productoServicio = item.producto_servicio;  // 🔥 USAR producto_servicio
        const codigo = item.producto_codigo || productoServicio?.codigopro || 'XXXX';
        const nombre = item.producto_nombre || productoServicio?.nombre || item.nombre || 'Servicio';
        const cantidad = item.cantidad || 1;
        const valorUnitario = toNumber(item.valor);
        const bonificacion = toNumber(item.bonificacion);
        const subtotal = toNumber(item.subtotal);
        const valorTotalBase = valorUnitario * cantidad;
        
        let linea = `  • [${codigo}] ${nombre}`;
        if (cantidad > 1) {
            linea += ` x${cantidad} = ${formatMoney(valorTotalBase)}`;
        }
        linea += ` - ${formatMoney(valorUnitario)} c/u`;
        
        if (bonificacion > 0) {
            const ahorro = valorTotalBase - subtotal;
            linea += ` (bonif: ${bonificacion}%, ahorro: ${formatMoney(ahorro)}) → Subtotal: ${formatMoney(subtotal)}`;
        } else if (cantidad > 1) {
            linea += ` → Subtotal: ${formatMoney(subtotal)}`;
        }
        lineas.push(linea);
    });
    lineas.push(``);
}
        
        // OTROS (si hay)
        if (productosAgrupados['OTROS'] && productosAgrupados['OTROS'].length > 0) {
            lineas.push(`OTROS PRODUCTOS:`);
            productosAgrupados['OTROS'].forEach((item: any) => {
                const codigo = item.producto_codigo || item.productoServicio?.codigopro || 'XXXX';
                const nombre = item.producto_nombre || item.productoServicio?.nombre || item.nombre || 'Producto';
                const cantidad = item.cantidad || 1;
                const valorUnitario = toNumber(item.valor);
                const bonificacion = toNumber(item.bonificacion);
                const subtotal = toNumber(item.subtotal);
                const valorTotalBase = valorUnitario * cantidad;
                
                let linea = `  • [${codigo}] ${nombre}`;
                if (cantidad > 1) {
                    linea += ` x${cantidad} = ${formatMoney(valorTotalBase)}`;
                }
                linea += ` - ${formatMoney(valorUnitario)} c/u`;
                
                if (bonificacion > 0) {
                    const ahorro = valorTotalBase - subtotal;
                    linea += ` (bonif: ${bonificacion}%, ahorro: ${formatMoney(ahorro)}) → Subtotal: ${formatMoney(subtotal)}`;
                } else if (cantidad > 1) {
                    linea += ` → Subtotal: ${formatMoney(subtotal)}`;
                }
                lineas.push(linea);
            });
            lineas.push(``);
        }
        
        // TOTAL
        lineas.push(`TOTAL PRESUPUESTO: ${formatMoney(getTotalPresupuesto())}`);
        lineas.push(``);
        
        // DATOS DEL COMERCIAL
        lineas.push(`COMERCIAL:`);
        lineas.push(`${comercialNombre}`);
        lineas.push(`${companiaNombre}`);
        lineas.push(`${comercialEmail}`);
        if (comercialTelefono) lineas.push(`Tel: ${comercialTelefono}`);
        
        return lineas.join('\n');
    };

    const [formData, setFormData] = useState({
        to: '',
        cc: '',
        bcc: '',
        subject: '',
        body: '',
    });

    useEffect(() => {
        if (isOpen && presupuesto) {
            mensajeGenericoRef.current = generarMensajeAdministracion();
            setFormData({
                to: getDestinatarios(),
                cc: getCCDestinatarios(),
                bcc: '',
                subject: getSubject(),
                body: mensajeGenericoRef.current,
            });
            setTimeout(() => {
                if (modalContentRef.current) modalContentRef.current.scrollTop = 0;
            }, 100);
        }
    }, [isOpen, presupuesto, comercialEmail, referencia, leadNombre]);

    useEffect(() => {
        if (pdfUrl && !pdfLoaded) {
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
    }, [pdfUrl, referencia, pdfLoaded, toast]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
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
        toast.info('Enviando presupuesto a administración...');

        try {
            const formDataToSend = new FormData();
            
            const toArray = formData.to.split(';').map(email => email.trim()).filter(email => email);
            formDataToSend.append('to', JSON.stringify(toArray));
            
            if (formData.cc) {
                const ccArray = formData.cc.split(/[;,]+/).map(email => email.trim()).filter(email => email);
                formDataToSend.append('cc', JSON.stringify(ccArray));
            }
            
            if (formData.bcc) {
                const bccArray = formData.bcc.split(/[;,]+/).map(email => email.trim()).filter(email => email);
                formDataToSend.append('bcc', JSON.stringify(bccArray));
            }
            
            formDataToSend.append('subject', formData.subject);
            formDataToSend.append('body', formData.body);
            formDataToSend.append('presupuestoId', String(presupuesto.id));
            formDataToSend.append('referencia', referencia);
            formDataToSend.append('tipo', 'administracion');
            
            if (pdfFile) {
                formDataToSend.append('pdf', pdfFile);
            }
            
            archivosLocales.forEach((file, index) => {
                formDataToSend.append(`documento_local_${index}`, file);
            });
            
            archivosPlataforma.forEach((file, index) => {
                formDataToSend.append(`documento_plataforma_${index}`, file);
            });

            router.post('/api/email/enviar-presupuesto', formDataToSend, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Presupuesto enviado a administración correctamente');
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

    if (!isOpen || !presupuesto) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-[99990]" onClick={onClose} />
            
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[99995] pointer-events-none">
                <div 
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] pointer-events-auto border border-gray-100"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-purple-50 to-white rounded-t-2xl">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="p-2 sm:p-3 bg-purple-100 rounded-xl">
                                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-2xl font-semibold text-gray-900">
                                    Enviar Presupuesto a Administración
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-1">
                                    Presupuesto #{referencia} • {leadNombre}
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

                    {/* Content - Scrollable */}
                    <div ref={modalContentRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                        <form id="adminEmailForm" onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
                            {/* Documentación adicional */}
                            <div className="space-y-3 bg-purple-50/50 p-4 sm:p-5 rounded-xl border border-purple-200">
                                <div className="flex items-center gap-2">
                                    <Paperclip className="h-4 w-4 text-purple-600" />
                                    <h3 className="font-medium text-purple-900 text-sm sm:text-base">Documentación adicional</h3>
                                </div>
                                
                                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
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
                                            className="flex items-center gap-1.5 px-3 py-1.5 bg-white border border-purple-300 rounded-lg text-xs sm:text-sm text-purple-700 hover:bg-purple-50"
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
                                    <div className="bg-white p-3 rounded-xl border border-purple-200">
                                        <p className="text-xs sm:text-sm font-medium text-purple-800 mb-2">
                                            Archivos adjuntos ({documentosAdjuntos.length})
                                        </p>
                                        <div className="space-y-1.5 max-h-32 overflow-y-auto">
                                            {documentosAdjuntos.map((doc, index) => (
                                                <div key={index} className="flex items-center justify-between gap-2 text-xs sm:text-sm bg-purple-50 p-2 rounded-lg">
                                                    <div className="flex items-center gap-1.5 flex-1 min-w-0">
                                                        <FileText className="h-3.5 w-3.5 text-purple-500 flex-shrink-0" />
                                                        <span className="truncate text-purple-900">{doc.name}</span>
                                                        {doc.size && <span className="text-xs text-purple-500 flex-shrink-0">({doc.size})</span>}
                                                    </div>
                                                    <button
                                                        type="button"
                                                        onClick={() => removeAdjunto(index)}
                                                        className="p-1 hover:bg-purple-200 rounded-lg text-purple-400 hover:text-purple-600"
                                                    >
                                                        <Trash2 className="h-3.5 w-3.5" />
                                                    </button>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Campos principales */}
                            <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">
                                        Para <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        name="to"
                                        value={formData.to}
                                        onChange={handleChange}
                                        required
                                        className="w-full border border-gray-300 rounded-xl shadow-sm py-2.5 sm:py-3 px-3 sm:px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="destinatario@email.com"
                                    />
                                    <p className="text-xs text-gray-500">Múltiples emails separados por punto y coma (;)</p>
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">CC (copia)</label>
                                    <input
                                        type="text"
                                        name="cc"
                                        value={formData.cc}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl shadow-sm py-2.5 sm:py-3 px-3 sm:px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="comercial@empresa.com"
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 sm:space-y-0 sm:grid sm:grid-cols-2 sm:gap-4">
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">CCO</label>
                                    <input
                                        type="text"
                                        name="bcc"
                                        value={formData.bcc}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl shadow-sm py-2.5 sm:py-3 px-3 sm:px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                        placeholder="otro@email.com"
                                    />
                                </div>
                                <div className="space-y-2">
                                    <label className="block text-sm font-medium text-gray-700">Asunto</label>
                                    <input
                                        type="text"
                                        name="subject"
                                        value={formData.subject}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl shadow-sm py-2.5 sm:py-3 px-3 sm:px-4 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
                                    />
                                </div>
                            </div>

                            {/* Mensaje para Administración */}
                            <div className="space-y-2">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <label className="text-sm font-medium text-gray-700">
                                        Mensaje para Administración <span className="text-gray-400 text-xs">(puedes editarlo)</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowVistaPrevia(true)}
                                            className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                                        >
                                            <Eye className="h-3 w-3" />
                                            <span className="hidden sm:inline">Vista previa</span>
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setFormData(prev => ({ ...prev, body: mensajeGenericoRef.current }))}
                                            className="text-xs text-blue-600 hover:text-blue-800"
                                        >
                                            Restaurar mensaje
                                        </button>
                                    </div>
                                </div>
                                <textarea
                                    name="body"
                                    rows={20}
                                    value={formData.body}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl shadow-sm py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                                />
                            </div>

                            {/* Presupuesto adjunto */}
                            <div className="bg-purple-50 p-4 sm:p-6 rounded-xl border border-purple-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-purple-900 text-sm sm:text-base">Presupuesto adjunto</h3>
                                        {pdfFile && (
                                            <p className="text-xs sm:text-sm text-purple-700 mt-0.5 truncate">
                                                Presupuesto_{referencia}.pdf ({(pdfFile.size / 1024).toFixed(2)} KB)
                                            </p>
                                        )}
                                    </div>
                                </div>
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
                            form="adminEmailForm"
                            disabled={isSubmitting}
                            className="px-4 py-2.5 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2 w-full sm:w-auto order-1 sm:order-2"
                        >
                            {isSubmitting ? (
                                <>
                                    <div className="animate-spin h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
                                    Enviando...
                                </>
                            ) : (
                                <>
                                    <Send className="h-4 w-4" />
                                    Enviar a Administración
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

            {/* Modal de vista previa */}
            {showVistaPrevia && (
                <div className="fixed inset-0 bg-black/60 z-[99999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[80vh] flex flex-col">
                        <div className="flex items-center justify-between p-4 border-b border-gray-200">
                            <h3 className="text-lg font-semibold text-gray-900">Vista previa del mensaje</h3>
                            <button
                                onClick={() => setShowVistaPrevia(false)}
                                className="p-1 text-gray-400 hover:text-gray-600 rounded-lg"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="flex-1 overflow-y-auto p-4">
                            <pre className="whitespace-pre-wrap font-mono text-sm bg-gray-50 p-4 rounded-lg">
                                {formData.body}
                            </pre>
                        </div>
                        <div className="flex justify-end p-4 border-t border-gray-200">
                            <button
                                onClick={() => setShowVistaPrevia(false)}
                                className="px-4 py-2 bg-purple-600 text-white rounded-lg text-sm font-medium hover:bg-purple-700"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}