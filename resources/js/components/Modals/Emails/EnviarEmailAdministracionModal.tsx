// resources/js/components/Modals/Emails/EnviarEmailAdministracionModal.tsx

import { router } from '@inertiajs/react';
import { X, Send, Mail, Building2, FileText, Files, Upload, Trash2, Eye } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';

import { useToast } from '@/contexts/ToastContext';
import DocumentoSelector from './DocumentoSelector';
import { formatDate, formatMoney, toNumber } from '@/utils/formatters';

interface FileItem {
    name: string;
    path: string;
    lastModified: string | null;
    size: string | null;
    extension: string | null;
}

interface EnviarEmailAdministracionModalProps {
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

export default function EnviarEmailAdministracionModal({
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
}: EnviarEmailAdministracionModalProps) {
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

    // Generar código alfa: prefijo + - + numeroalfa
    const getCodigoAlfa = () => {
        if (contrato?.empresa?.prefijo_id && contrato?.empresa?.numeroalfa) {
            const prefijo = contrato.vendedor_prefijo || 'XX';
            const numero = contrato.empresa.numeroalfa.toString().padStart(6, '0');
            return `${prefijo}-${numero}`;
        }
        return 'No disponible';
    };

    // Obtener productos del presupuesto agrupados por tipo
    const getProductosAgrupados = () => {
        if (!contrato.presupuesto?.agregados) return {};
        
        const productos = contrato.presupuesto.agregados;
        const agrupados: Record<string, any[]> = {};
        
        productos.forEach((item: any) => {
            const tipo = item.tipo_nombre || item.productoServicio?.tipo?.nombre_tipo_abono || 'Otros';
            if (!agrupados[tipo]) {
                agrupados[tipo] = [];
            }
            agrupados[tipo].push(item);
        });
        
        return agrupados;
    };

    // Generar texto de productos por tipo
    const generarProductosPorTipo = () => {
        const lineas: string[] = [];
        const productosAgrupados = getProductosAgrupados();
        
        if (Object.keys(productosAgrupados).length === 0) {
            return lineas;
        }
        
        lineas.push(`PRODUCTOS Y SERVICIOS CONTRATADOS:`);
        lineas.push(``);
        
        // Ordenar tipos alfabéticamente
        const tiposOrdenados = Object.keys(productosAgrupados).sort();
        
        tiposOrdenados.forEach(tipo => {
            lineas.push(`${tipo.toUpperCase()}:`);
            
            productosAgrupados[tipo].forEach((item: any) => {
                const codigo = item.producto_codigo || item.productoServicio?.codigopro || 'XXXX';
                const nombre = item.producto_nombre || item.productoServicio?.nombre || 'Sin nombre';
                const cantidad = item.cantidad || 1;
                const valorUnitario = toNumber(item.valor);
                const bonificacion = toNumber(item.bonificacion);
                const subtotal = toNumber(item.subtotal);
                
                let linea = `  • [${codigo}] ${nombre}`;
                if (cantidad > 1) {
                    linea += ` x${cantidad}`;
                }
                linea += ` - ${formatMoney(valorUnitario)} c/u`;
                
                if (bonificacion > 0) {
                    linea += ` (bonif: ${bonificacion}%) → Subtotal: ${formatMoney(subtotal)}`;
                } else if (cantidad > 1) {
                    linea += ` → Subtotal: ${formatMoney(subtotal)}`;
                }
                
                lineas.push(linea);
            });
            lineas.push(``);
        });
        
        return lineas;
    };

    // Obtener tasa/instalación si existe
    const getTasaInstalacion = () => {
        if (!contrato.presupuesto?.valor_tasa) return null;
        
        const codigo = contrato.presupuesto.tasa_codigo || 
                      contrato.presupuesto.tasa?.codigopro || 
                      'TASA';
        const nombre = contrato.presupuesto.tasa_nombre || 
                      contrato.presupuesto.tasa?.nombre || 
                      'Tasa/Instalación';
        const valor = toNumber(contrato.presupuesto.valor_tasa);
        const bonificacion = toNumber(contrato.presupuesto.tasa_bonificacion);
        const subtotal = toNumber(contrato.presupuesto.subtotal_tasa) || valor;
        
        return { codigo, nombre, valor, bonificacion, subtotal };
    };

    // Obtener abono mensual si existe
    const getAbonoMensual = () => {
        if (!contrato.presupuesto?.valor_abono) return null;
        
        const codigo = contrato.presupuesto.abono_codigo || 
                      contrato.presupuesto.abono?.codigopro || 
                      'ABONO';
        const nombre = contrato.presupuesto.abono_nombre || 
                      contrato.presupuesto.abono?.nombre || 
                      'Abono mensual';
        const valor = toNumber(contrato.presupuesto.valor_abono);
        const bonificacion = toNumber(contrato.presupuesto.abono_bonificacion);
        const subtotal = toNumber(contrato.presupuesto.subtotal_abono) || valor;
        
        return { codigo, nombre, valor, bonificacion, subtotal };
    };

    // Generar mensaje completo para administración
    const generarMensajeAdministracion = () => {
        const lineas: string[] = [];
        
        // Saludo
        lineas.push(`Buenos días Guillermo,`);
        lineas.push(``);
        lineas.push(`Te adjunto el contrato para su procesamiento en el sistema.`);
        lineas.push(``);
        
        // ===== CÓDIGO ALFA (siempre) =====
        lineas.push(`CÓDIGO ALFA:`);
        lineas.push(`${getCodigoAlfa()}`);
        lineas.push(``);
        
        // ===== SEGÚN SEA NUEVO O EXISTENTE =====
        if (!leadEsCliente) {
            // === NUEVO CLIENTE: TODOS LOS DATOS ===
            
            // Datos de la Empresa
            lineas.push(`EMPRESA:`);
            lineas.push(`Razón Social: ${contrato.empresa_razon_social || '-'}`);
            lineas.push(`Nombre Fantasía: ${contrato.empresa_nombre_fantasia || '-'}`);
            lineas.push(`CUIT: ${contrato.empresa_cuit || '-'}`);
            lineas.push(`Actividad: ${contrato.empresa_actividad || '-'}`);
            lineas.push(`Situación AFIP: ${contrato.empresa_situacion_afip || '-'}`);
            lineas.push(`Flota: ${contrato.empresa_nombre_flota || '-'}`);
            lineas.push(`Plataforma: ${contrato.empresa_plataforma || 'ALPHA'}`);
            lineas.push(``);
            
            // Domicilio Fiscal
            lineas.push(`DOMICILIO FISCAL:`);
            lineas.push(`${contrato.empresa_domicilio_fiscal || '-'}`);
            lineas.push(`${contrato.empresa_localidad_fiscal || ''} - ${contrato.empresa_provincia_fiscal || ''}`);
            lineas.push(`CP: ${contrato.empresa_codigo_postal_fiscal || '-'}`);
            lineas.push(`Tel: ${contrato.empresa_telefono_fiscal || '-'}`);
            lineas.push(`Email: ${contrato.empresa_email_fiscal || '-'}`);
            lineas.push(``);
            
            // Contacto / Representante
            lineas.push(`CONTACTO / REPRESENTANTE:`);
            lineas.push(`Nombre: ${contrato.cliente_nombre_completo || '-'}`);
            lineas.push(`Tipo Responsabilidad: ${contrato.contacto_tipo_responsabilidad || '-'}`);
            lineas.push(`Tipo Documento: ${contrato.contacto_tipo_documento || '-'}`);
            lineas.push(`N° Documento: ${contrato.contacto_nro_documento || '-'}`);
            lineas.push(`Nacionalidad: ${contrato.contacto_nacionalidad || '-'}`);
            if (contrato.contacto_fecha_nacimiento) {
                lineas.push(`Fecha Nacimiento: ${formatDate(contrato.contacto_fecha_nacimiento)}`);
            }
            lineas.push(`Dirección: ${contrato.contacto_direccion_personal || '-'}`);
            lineas.push(`CP: ${contrato.contacto_codigo_postal_personal || '-'}`);
            lineas.push(`Email: ${contrato.cliente_email || '-'}`);
            lineas.push(`Teléfono: ${contrato.cliente_telefono || '-'}`);
            lineas.push(``);
            
            // Responsables (si son diferentes del contacto)
            if (contrato.responsable_flota_nombre && contrato.responsable_flota_nombre !== contrato.cliente_nombre_completo) {
                lineas.push(`RESPONSABLE DE FLOTA:`);
                lineas.push(`Nombre: ${contrato.responsable_flota_nombre}`);
                if (contrato.responsable_flota_telefono) lineas.push(`Tel: ${contrato.responsable_flota_telefono}`);
                if (contrato.responsable_flota_email) lineas.push(`Email: ${contrato.responsable_flota_email}`);
                lineas.push(``);
            }
            
            if (contrato.responsable_pagos_nombre && contrato.responsable_pagos_nombre !== contrato.cliente_nombre_completo) {
                lineas.push(`RESPONSABLE DE PAGOS:`);
                lineas.push(`Nombre: ${contrato.responsable_pagos_nombre}`);
                if (contrato.responsable_pagos_telefono) lineas.push(`Tel: ${contrato.responsable_pagos_telefono}`);
                if (contrato.responsable_pagos_email) lineas.push(`Email: ${contrato.responsable_pagos_email}`);
                lineas.push(``);
            }
            
        } else {
            // === CLIENTE EXISTENTE: SOLO DATOS BÁSICOS ===
            lineas.push(`EMPRESA:`);
            lineas.push(`Razón Social: ${contrato.empresa_razon_social || '-'}`);
            lineas.push(`CUIT: ${contrato.empresa_cuit || '-'}`);
            lineas.push(`Flota: ${contrato.empresa_nombre_flota || '-'}`);
            lineas.push(``);
        }
        
        // ===== DATOS DEL CONTRATO =====
        lineas.push(`CONTRATO:`);
        lineas.push(`N° Contrato: ${contrato.numero_contrato || '-'}`);
        lineas.push(`Referencia Presupuesto: ${contrato.presupuesto_referencia || '-'}`);
        lineas.push(`Fecha Emisión: ${formatDate(contrato.fecha_emision)}`);
        lineas.push(``);
        
        // ===== PRODUCTOS Y SERVICIOS CONTRATADOS (TODO LO QUE SE FACTURA) =====
        
        // Tasa/Instalación (si existe)
        const tasa = getTasaInstalacion();
        if (tasa) {
            lineas.push(`INSTALACIÓN / ACTIVACIÓN:`);
            let lineaTasa = `  • [${tasa.codigo}] ${tasa.nombre}: ${formatMoney(tasa.valor)}`;
            if (tasa.bonificacion > 0) {
                lineaTasa += ` (bonif: ${tasa.bonificacion}%) → Subtotal: ${formatMoney(tasa.subtotal)}`;
            }
            lineas.push(lineaTasa);
            lineas.push(``);
        }
        
        // Abono mensual (si existe)
        const abono = getAbonoMensual();
        if (abono) {
            lineas.push(`ABONO MENSUAL:`);
            let lineaAbono = `  • [${abono.codigo}] ${abono.nombre}: ${formatMoney(abono.valor)}`;
            if (abono.bonificacion > 0) {
                lineaAbono += ` (bonif: ${abono.bonificacion}%) → Subtotal: ${formatMoney(abono.subtotal)}`;
            }
            lineas.push(lineaAbono);
            lineas.push(``);
        }
        
        // Productos adicionales agrupados por tipo
        const productosTexto = generarProductosPorTipo();
        if (productosTexto.length > 0) {
            lineas.push(...productosTexto);
        }
        
        // ===== VEHÍCULOS =====
        if (contrato.vehiculos?.length > 0) {
            lineas.push(`VEHÍCULOS:`);
            contrato.vehiculos.forEach((v: any, idx: number) => {
                let vehiculoStr = `Vehículo ${idx + 1}: ${v.patente}`;
                const detalles = [];
                if (v.marca) detalles.push(v.marca);
                if (v.modelo) detalles.push(v.modelo);
                if (v.anio) detalles.push(v.anio);
                if (v.color) detalles.push(v.color);
                if (detalles.length > 0) {
                    vehiculoStr += ` - ${detalles.join(' ')}`;
                }
                if (v.identificador) {
                    vehiculoStr += ` (ID: ${v.identificador})`;
                }
                lineas.push(vehiculoStr);
            });
            lineas.push(``);
        }
        
        // ===== MEDIO DE PAGO =====
        if (contrato.debito_cbu) {
            lineas.push(`MEDIO DE PAGO - CBU:`);
            lineas.push(`Banco: ${contrato.debito_cbu.nombre_banco}`);
            lineas.push(`Tipo Cuenta: ${contrato.debito_cbu.tipo_cuenta === 'caja_ahorro' ? 'Caja de ahorro' : 'Cuenta corriente'}`);
            lineas.push(`Titular: ${contrato.debito_cbu.titular_cuenta}`);
            lineas.push(`CBU: ${contrato.debito_cbu.cbu}`);
            if (contrato.debito_cbu.alias_cbu) lineas.push(`Alias: ${contrato.debito_cbu.alias_cbu}`);
            lineas.push(``);
        }
        
        if (contrato.debito_tarjeta) {
            lineas.push(`MEDIO DE PAGO - TARJETA:`);
            lineas.push(`Banco: ${contrato.debito_tarjeta.tarjeta_banco}`);
            lineas.push(`Emisor: ${contrato.debito_tarjeta.tarjeta_emisor}`);
            lineas.push(`Tipo: ${contrato.debito_tarjeta.tipo_tarjeta === 'debito' ? 'Débito' : 'Crédito'}`);
            lineas.push(`Titular: ${contrato.debito_tarjeta.titular_tarjeta}`);
            lineas.push(``);
        }
        
        // ===== DATOS DEL COMERCIAL =====
        lineas.push(`COMERCIAL:`);
        lineas.push(`${comercialNombre}`);
        lineas.push(`${companiaNombre}`);
        lineas.push(`${comercialEmail}`);
        if (comercialTelefono) lineas.push(`Tel: ${comercialTelefono}`);
        
        return lineas.join('\n');
    };

    const [formData, setFormData] = useState({
        to: 'gfaure@localsat.com.ar',
        cc: comercialEmail,
        bcc: '',
        subject: `[ADMIN] Contrato ${contrato?.numero_contrato || ''} - ${contrato?.empresa_razon_social || ''}`,
        body: '',
    });

    // Inicializar mensaje
    useEffect(() => {
        if (isOpen && contrato) {
            mensajeGenericoRef.current = generarMensajeAdministracion();
            
            setFormData({
                to: 'gfaure@localsat.com.ar;pgomez@localsat.com.ar;informes@localsat.com.ar',
                cc: comercialEmail,
                bcc: '',
                subject: `[ADMIN] Contrato ${contrato.numero_contrato || ''} - ${contrato.empresa_razon_social || ''}`,
                body: mensajeGenericoRef.current,
            });

            setTimeout(() => {
                if (modalContentRef.current) {
                    modalContentRef.current.scrollTop = 0;
                }
            }, 100);
        }
    }, [isOpen, contrato, comercialEmail]);

    // Cargar PDF
    useEffect(() => {
        if (pdfUrl && !pdfLoaded) {
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
    }, [pdfUrl, contrato, pdfLoaded, toast]);

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
        toast.info('Enviando email a administración...');

        try {
            const emailData = {
                to: formData.to,
                cc: formData.cc ? formData.cc.split(',').map(email => email.trim()) : [],
                bcc: formData.bcc ? formData.bcc.split(',').map(email => email.trim()) : [],
                subject: formData.subject,
                body: formData.body,
                contratoId: contrato.id,
                numeroContrato: contrato.numero_contrato,
                tipo: 'administracion'
            };

            const formDataToSend = new FormData();
            Object.keys(emailData).forEach(key => {
                formDataToSend.append(key, JSON.stringify(emailData[key as keyof typeof emailData]));
            });

            if (pdfFile) {
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
                    <div className="flex items-center justify-between p-8 border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-purple-50 to-white rounded-t-2xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-purple-100 rounded-xl">
                                <Building2 className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-2xl font-semibold text-gray-900">
                                    Enviar a Administración
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    Contrato #{contrato.numero_contrato} • {contrato.empresa_razon_social}
                                    {!leadEsCliente ? (
                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">
                                            NUEVO CLIENTE
                                        </span>
                                    ) : (
                                        <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-800">
                                            CLIENTE EXISTENTE
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
                        <form id="adminEmailForm" onSubmit={handleSubmit} className="space-y-8">
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
                                    className="w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    placeholder="destinatario@email.com"
                                />
                                <p className="text-xs text-gray-500">
                                    Puedes modificar el destinatario por defecto
                                </p>
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
                                        className="w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="comercial@empresa.com"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div className="space-y-2">
                                    <label htmlFor="bcc" className="block text-sm font-medium text-gray-700">
                                        CCO
                                    </label>
                                    <input
                                        type="text"
                                        id="bcc"
                                        name="bcc"
                                        value={formData.bcc}
                                        onChange={handleChange}
                                        className="w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                        placeholder="otro@email.com"
                                    />
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
                                        className="w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <label htmlFor="body" className="block text-sm font-medium text-gray-700">
                                        Mensaje para Administración <span className="text-gray-400 text-xs">(puedes editarlo)</span>
                                    </label>
                                    <div className="flex gap-2">
                                        <button
                                            type="button"
                                            onClick={() => setShowVistaPrevia(true)}
                                            className="text-xs text-purple-600 hover:text-purple-800 flex items-center gap-1"
                                        >
                                            <Eye className="h-3 w-3" />
                                            Vista previa
                                        </button>
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
                                </div>
                                <textarea
                                    id="body"
                                    name="body"
                                    rows={20}
                                    value={formData.body}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl shadow-sm py-3 px-4 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent font-mono text-sm"
                                />
                            </div>

                            <div className="bg-purple-50 p-6 rounded-xl border border-purple-200">
                                <div className="flex items-center gap-4">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <FileText className="h-6 w-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-purple-900">Contrato adjunto</h3>
                                        {pdfFile && (
                                            <p className="text-sm text-purple-700 mt-1">
                                                Contrato_{contrato.numero_contrato}.pdf ({(pdfFile.size / 1024).toFixed(2)} KB)
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

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
                                                <div key={index} className="flex items-center justify-between gap-2 text-sm bg-white p-3 rounded-lg border border-purple-100">
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
                                                        className="p-1.5 hover:bg-purple-100 rounded-lg text-purple-400 hover:text-purple-600"
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
                            form="adminEmailForm"
                            disabled={isSubmitting}
                            className="px-6 py-3 bg-purple-600 text-white rounded-xl text-sm font-medium hover:bg-purple-700 transition-colors disabled:opacity-50 flex items-center gap-2"
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
        </>
    );
}