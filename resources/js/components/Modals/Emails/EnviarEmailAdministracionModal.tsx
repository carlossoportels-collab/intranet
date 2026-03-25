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

    // Obtener tipo de operación
    const tipoOperacion = contrato?.tipo_operacion;

    // Determinar destinatarios según tipo de operación
    const getDestinatarios = () => {
        // Destinatarios base (siempre incluye a Guillermo y comercial en CC)
        let destinatarios = ['gfaure@localsat.com.ar', 'pgomez@localsat.com.ar'];
        
        // Para venta a cliente o alta nueva, incluir informes
        if (tipoOperacion === 'venta_cliente' || tipoOperacion === 'alta_nueva') {
            destinatarios.push('informes@localsat.com.ar');
        }
        
        // Para cambio de titularidad, no incluir informes
        if (tipoOperacion === 'cambio_titularidad') {
            // Solo Guillermo y comercial
        }
        
        // Para cambio de razón social, no incluir informes
        if (tipoOperacion === 'cambio_razon_social') {
            // Solo Guillermo y comercial
        }
        
        return destinatarios.join(';');
    };

    // Obtener asunto según tipo de operación
    const getSubject = () => {
        const numero = contrato.numero_contrato || '';
        const empresa = contrato.empresa_razon_social || '';
        
        switch(tipoOperacion) {
            case 'venta_cliente':
                return `[VENTA CLIENTE] Contrato ${numero} - ${empresa}`;
            case 'alta_nueva':
                return `[ALTA NUEVA] Contrato ${numero} - ${empresa}`;
            case 'cambio_titularidad':
                return `[CAMBIO TITULARIDAD] Contrato ${numero} - ${empresa}`;
            case 'cambio_razon_social':
                return `[CAMBIO RAZÓN SOCIAL] Contrato ${numero} - ${empresa}`;
            default:
                return `[ADMIN] Contrato ${numero} - ${empresa}`;
        }
    };

    // Generar código alfa
    const getCodigoAlfa = () => {
        if (contrato?.empresa?.prefijo_id && contrato?.empresa?.numeroalfa) {
            const prefijo = contrato.vendedor_prefijo || 'XX';
            const numero = contrato.empresa.numeroalfa.toString().padStart(6, '0');
            return `${prefijo}-${numero}`;
        }
        return 'No disponible';
    };

    // Obtener productos agrupados
    const getProductosAgrupados = () => {
        if (!contrato.presupuesto?.agregados) return {};
        const productos = contrato.presupuesto.agregados;
        const agrupados: Record<string, any[]> = {};
        productos.forEach((item: any) => {
            const tipo = item.tipo_nombre || item.productoServicio?.tipo?.nombre_tipo_abono || 'Otros';
            if (!agrupados[tipo]) agrupados[tipo] = [];
            agrupados[tipo].push(item);
        });
        return agrupados;
    };

    const generarProductosPorTipo = () => {
        const lineas: string[] = [];
        const productosAgrupados = getProductosAgrupados();
        if (Object.keys(productosAgrupados).length === 0) return lineas;
        
        lineas.push(`PRODUCTOS Y SERVICIOS CONTRATADOS:`);
        lineas.push(``);
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
                if (cantidad > 1) linea += ` x${cantidad}`;
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

    const getTasaInstalacion = () => {
        if (!contrato.presupuesto?.valor_tasa) return null;
        const codigo = contrato.presupuesto.tasa_codigo || contrato.presupuesto.tasa?.codigopro || 'TASA';
        const nombre = contrato.presupuesto.tasa_nombre || contrato.presupuesto.tasa?.nombre || 'Tasa/Instalación';
        const valor = toNumber(contrato.presupuesto.valor_tasa);
        const bonificacion = toNumber(contrato.presupuesto.tasa_bonificacion);
        const subtotal = toNumber(contrato.presupuesto.subtotal_tasa) || valor;
        return { codigo, nombre, valor, bonificacion, subtotal };
    };

    const getAbonoMensual = () => {
        if (!contrato.presupuesto?.valor_abono) return null;
        const codigo = contrato.presupuesto.abono_codigo || contrato.presupuesto.abono?.codigopro || 'ABONO';
        const nombre = contrato.presupuesto.abono_nombre || contrato.presupuesto.abono?.nombre || 'Abono mensual';
        const valor = toNumber(contrato.presupuesto.valor_abono);
        const bonificacion = toNumber(contrato.presupuesto.abono_bonificacion);
        const subtotal = toNumber(contrato.presupuesto.subtotal_abono) || valor;
        return { codigo, nombre, valor, bonificacion, subtotal };
    };

    const generarMensajeAdministracion = () => {
        const lineas: string[] = [];
        
        lineas.push(`Buenos días Guillermo,`);
        lineas.push(``);
        lineas.push(`Te adjunto el contrato para su procesamiento en el sistema.`);
        lineas.push(``);
        
        // ===== TIPO DE OPERACIÓN =====
        lineas.push(`TIPO DE OPERACIÓN:`);
        switch(tipoOperacion) {
            case 'venta_cliente':
                lineas.push(`VENTA A CLIENTE EXISTENTE`);
                break;
            case 'alta_nueva':
                lineas.push(`ALTA NUEVA`);
                break;
            case 'cambio_titularidad':
                lineas.push(`CAMBIO DE TITULARIDAD`);
                break;
            case 'cambio_razon_social':
                lineas.push(`CAMBIO DE RAZÓN SOCIAL`);
                break;
            default:
                lineas.push(`NO ESPECIFICADO`);
        }
        lineas.push(``);
        
        lineas.push(`CÓDIGO ALFA:`);
        lineas.push(`${getCodigoAlfa()}`);
        lineas.push(``);
        
        if (!leadEsCliente) {
            lineas.push(`EMPRESA:`);
            lineas.push(`Razón Social: ${contrato.empresa_razon_social || '-'}`);
            lineas.push(`Nombre Fantasía: ${contrato.empresa_nombre_fantasia || '-'}`);
            lineas.push(`CUIT: ${contrato.empresa_cuit || '-'}`);
            lineas.push(`Actividad: ${contrato.empresa_actividad || '-'}`);
            lineas.push(`Situación AFIP: ${contrato.empresa_situacion_afip || '-'}`);
            lineas.push(`Flota: ${contrato.empresa_nombre_flota || '-'}`);
            lineas.push(`Plataforma: ${contrato.empresa_plataforma || 'ALPHA'}`);
            lineas.push(``);
            lineas.push(`DOMICILIO FISCAL:`);
            lineas.push(`${contrato.empresa_domicilio_fiscal || '-'}`);
            lineas.push(`${contrato.empresa_localidad_fiscal || ''} - ${contrato.empresa_provincia_fiscal || ''}`);
            lineas.push(`CP: ${contrato.empresa_codigo_postal_fiscal || '-'}`);
            lineas.push(`Tel: ${contrato.empresa_telefono_fiscal || '-'}`);
            lineas.push(`Email: ${contrato.empresa_email_fiscal || '-'}`);
            lineas.push(``);
            lineas.push(`CONTACTO / REPRESENTANTE:`);
            lineas.push(`Nombre: ${contrato.cliente_nombre_completo || '-'}`);
            lineas.push(`Tipo Responsabilidad: ${contrato.contacto_tipo_responsabilidad || '-'}`);
            lineas.push(`Tipo Documento: ${contrato.contacto_tipo_documento || '-'}`);
            lineas.push(`N° Documento: ${contrato.contacto_nro_documento || '-'}`);
            lineas.push(`Nacionalidad: ${contrato.contacto_nacionalidad || '-'}`);
            if (contrato.contacto_fecha_nacimiento) lineas.push(`Fecha Nacimiento: ${formatDate(contrato.contacto_fecha_nacimiento)}`);
            lineas.push(`Dirección: ${contrato.contacto_direccion_personal || '-'}`);
            lineas.push(`CP: ${contrato.contacto_codigo_postal_personal || '-'}`);
            lineas.push(`Email: ${contrato.cliente_email || '-'}`);
            lineas.push(`Teléfono: ${contrato.cliente_telefono || '-'}`);
            lineas.push(``);
            
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
            lineas.push(`EMPRESA:`);
            lineas.push(`Razón Social: ${contrato.empresa_razon_social || '-'}`);
            lineas.push(`CUIT: ${contrato.empresa_cuit || '-'}`);
            lineas.push(`Flota: ${contrato.empresa_nombre_flota || '-'}`);
            lineas.push(``);
        }
        
        // Información adicional según tipo de operación
        if (tipoOperacion === 'cambio_titularidad') {
            lineas.push(`INFORMACIÓN ADICIONAL (CAMBIO DE TITULARIDAD):`);
            lineas.push(`Se adjunta documentación de respaldo.`);
            lineas.push(``);
        }
        
        if (tipoOperacion === 'cambio_razon_social') {
            lineas.push(`INFORMACIÓN ADICIONAL (CAMBIO DE RAZÓN SOCIAL):`);
            lineas.push(`La empresa ha actualizado su razón social.`);
            lineas.push(`Se adjunta documentación de respaldo.`);
            lineas.push(``);
        }
        
        lineas.push(`CONTRATO:`);
        lineas.push(`N° Contrato: ${contrato.numero_contrato || '-'}`);
        lineas.push(`Referencia Presupuesto: ${contrato.presupuesto_referencia || '-'}`);
        lineas.push(`Fecha Emisión: ${formatDate(contrato.fecha_emision)}`);
        lineas.push(``);
        
        const tasa = getTasaInstalacion();
        if (tasa) {
            lineas.push(`INSTALACIÓN / ACTIVACIÓN:`);
            let lineaTasa = `  • [${tasa.codigo}] ${tasa.nombre}: ${formatMoney(tasa.valor)}`;
            if (tasa.bonificacion > 0) lineaTasa += ` (bonif: ${tasa.bonificacion}%) → Subtotal: ${formatMoney(tasa.subtotal)}`;
            lineas.push(lineaTasa);
            lineas.push(``);
        }
        
        const abono = getAbonoMensual();
        if (abono) {
            lineas.push(`ABONO MENSUAL:`);
            let lineaAbono = `  • [${abono.codigo}] ${abono.nombre}: ${formatMoney(abono.valor)}`;
            if (abono.bonificacion > 0) lineaAbono += ` (bonif: ${abono.bonificacion}%) → Subtotal: ${formatMoney(abono.subtotal)}`;
            lineas.push(lineaAbono);
            lineas.push(``);
        }
        
        const productosTexto = generarProductosPorTipo();
        if (productosTexto.length > 0) lineas.push(...productosTexto);
        
        if (contrato.vehiculos?.length > 0) {
            lineas.push(`VEHÍCULOS:`);
            contrato.vehiculos.forEach((v: any, idx: number) => {
                let vehiculoStr = `Vehículo ${idx + 1}: ${v.patente}`;
                const detalles = [];
                if (v.marca) detalles.push(v.marca);
                if (v.modelo) detalles.push(v.modelo);
                if (v.anio) detalles.push(v.anio);
                if (v.color) detalles.push(v.color);
                if (detalles.length > 0) vehiculoStr += ` - ${detalles.join(' ')}`;
                if (v.identificador) vehiculoStr += ` (ID: ${v.identificador})`;
                lineas.push(vehiculoStr);
            });
            lineas.push(``);
        }
        
        if (contrato.debito_cbu) {
            lineas.push(`MEDIO DE PAGO - CBU:`);
            lineas.push(`Banco: ${contrato.debito_cbu.nombre_banco}`);
            lineas.push(`Tipo Cuenta: ${contrato.debito_cbu.tipo_cuenta === 'caja_ahorro' ? 'Caja de ahorro' : 'Cuenta corrente'}`);
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
        
        lineas.push(`COMERCIAL:`);
        lineas.push(`${comercialNombre}`);
        lineas.push(`${companiaNombre}`);
        lineas.push(`${comercialEmail}`);
        if (comercialTelefono) lineas.push(`Tel: ${comercialTelefono}`);
        
        return lineas.join('\n');
    };

    const [formData, setFormData] = useState({
        to: '',
        cc: comercialEmail,
        bcc: '',
        subject: '',
        body: '',
    });

    useEffect(() => {
        if (isOpen && contrato) {
            mensajeGenericoRef.current = generarMensajeAdministracion();
            setFormData({
                to: getDestinatarios(),
                cc: comercialEmail,
                bcc: '',
                subject: getSubject(),
                body: mensajeGenericoRef.current,
            });
            setTimeout(() => {
                if (modalContentRef.current) modalContentRef.current.scrollTop = 0;
            }, 100);
        }
    }, [isOpen, contrato, comercialEmail, tipoOperacion]);

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

            if (pdfFile) formDataToSend.append('pdf', pdfFile);
            archivosLocales.forEach((file, index) => formDataToSend.append(`documento_local_${index}`, file));
            archivosPlataforma.forEach((file, index) => formDataToSend.append(`documento_plataforma_${index}`, file));

            router.post('/api/email/enviar-contrato', formDataToSend, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Email enviado correctamente');
                    onClose();
                },
                onError: (errors: any) => {
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
                    <div className="flex items-center justify-between p-4 sm:p-6 border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-purple-50 to-white rounded-t-2xl">
                        <div className="flex items-center gap-3 sm:gap-4">
                            <div className="p-2 sm:p-3 bg-purple-100 rounded-xl">
                                <Building2 className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-lg sm:text-2xl font-semibold text-gray-900">
                                    Enviar a Administración
                                </h2>
                                <p className="text-xs sm:text-sm text-gray-500 mt-1 line-clamp-1">
                                    Contrato #{contrato.numero_contrato} • {contrato.empresa_razon_social?.split(' ')[0]}
                                    {tipoOperacion && (
                                        <span className={`ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium ${
                                            tipoOperacion === 'venta_cliente' ? 'bg-blue-100 text-blue-800' :
                                            tipoOperacion === 'alta_nueva' ? 'bg-green-100 text-green-800' :
                                            tipoOperacion === 'cambio_titularidad' ? 'bg-orange-100 text-orange-800' :
                                            'bg-yellow-100 text-yellow-800'
                                        }`}>
                                            {tipoOperacion === 'venta_cliente' ? 'Venta Cliente' :
                                             tipoOperacion === 'alta_nueva' ? 'Alta Nueva' :
                                             tipoOperacion === 'cambio_titularidad' ? 'Cambio Titularidad' :
                                             'Cambio Razón Social'}
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

                    {/* Content - Scrollable */}
                    <div ref={modalContentRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-6">
                        <form id="adminEmailForm" onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
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

                            {/* Mensaje */}
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
                                    rows={16}
                                    value={formData.body}
                                    onChange={handleChange}
                                    className="w-full border border-gray-300 rounded-xl shadow-sm py-2.5 px-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 font-mono"
                                />
                            </div>

                            {/* Contrato adjunto */}
                            <div className="bg-purple-50 p-4 sm:p-6 rounded-xl border border-purple-200">
                                <div className="flex items-center gap-3">
                                    <div className="p-2 bg-purple-100 rounded-lg">
                                        <FileText className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                                    </div>
                                    <div>
                                        <h3 className="font-medium text-purple-900 text-sm sm:text-base">Contrato adjunto</h3>
                                        {pdfFile && (
                                            <p className="text-xs sm:text-sm text-purple-700 mt-0.5 truncate">
                                                Contrato_{contrato.numero_contrato}.pdf ({(pdfFile.size / 1024).toFixed(2)} KB)
                                            </p>
                                        )}
                                    </div>
                                </div>
                            </div>

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
        </>
    );
}