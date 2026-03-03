// resources/js/Components/Presupuestos/PDFGenerator.tsx
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { useEffect, useRef } from 'react';

interface Props {
    presupuesto: any;
    download?: boolean;
    nombreArchivo?: string;
}

export const PDFGenerator: React.FC<Props> = ({ 
    presupuesto, 
    download = false, 
    nombreArchivo
}) => {
    const generatedRef = useRef(false);

    useEffect(() => {
        if (generatedRef.current) return;
        generatedRef.current = true;

        const generarPDF = async () => {
            try {
                // Crear documento PDF
                const doc = new jsPDF({
                    orientation: 'portrait',
                    unit: 'mm',
                    format: 'a4'
                });

                // Configurar fuente
                doc.setFont('helvetica');

                // Variables útiles
                const pageWidth = doc.internal.pageSize.getWidth();
                const margin = 15;
                let yPos = 20;

            // ===== HEADER =====
            if (presupuesto.compania?.logo) {
                try {
                    const logo = new Image();
                    logo.src = presupuesto.compania.logo;
                    await new Promise((resolve, reject) => {
                        logo.onload = resolve;
                        logo.onerror = reject;
                    });
                    
                    const maxHeight = 25; // Altura máxima en mm
                    const maxWidth = 58; // Ancho máximo en mm
                    
                    // Calcular ratio de aspecto
                    const aspectRatio = logo.width / logo.height;
                    
                    let finalWidth = maxWidth;
                    let finalHeight = maxHeight;
                    
                    // Ajustar según la orientación del logo
                    if (aspectRatio > 1) {
                        // Logo más ancho que alto
                        finalHeight = maxWidth / aspectRatio;
                        if (finalHeight > maxHeight) {
                            finalHeight = maxHeight;
                            finalWidth = maxHeight * aspectRatio;
                        }
                    } else {
                        // Logo más alto que ancho
                        finalWidth = maxHeight * aspectRatio;
                        if (finalWidth > maxWidth) {
                            finalWidth = maxWidth;
                            finalHeight = maxWidth / aspectRatio;
                        }
                    }
                    
                    doc.addImage(logo, 'JPEG', margin, yPos - 5, finalWidth, finalHeight, undefined, 'FAST');
                } catch (e) {
                    console.error('Error cargando logo:', e);
                }
            }

                // Título
                doc.setFontSize(20);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(60, 60, 62);
                doc.text('PRESUPUESTO COMERCIAL', pageWidth - margin, yPos, { align: 'right' });
                
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 100, 100);
                doc.text(`Ref: #${presupuesto.referencia || 'N/A'}`, pageWidth - margin, yPos + 6, { align: 'right' });

                yPos += 20;

                // ===== INFORMACIÓN DE PROMOCIÓN =====
                if (presupuesto.promocion) {
                    doc.setFillColor(255, 247, 237);
                    doc.roundedRect(margin, yPos - 3, pageWidth - (margin * 2), 14, 3, 3, 'F');
                    
                    doc.setFontSize(11);
                    doc.setFont('helvetica', 'bold');
                    doc.setTextColor(247, 98, 0);
                    doc.text(`PROMOCIÓN VIGENTE: ${presupuesto.promocion.nombre}`, margin + 3, yPos + 2);
                    
                    yPos += 16;
                }

                // ===== INFORMACIÓN DEL CLIENTE =====
                const colWidth = (pageWidth - (margin * 2) - 10) / 2;
                
                // Columna izquierda - CLIENTE
                doc.setFillColor(249, 250, 251);
                doc.rect(margin, yPos, colWidth, 35, 'F');
                
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(247, 98, 0);
                doc.text('CLIENTE', margin + 3, yPos + 6);
                
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0, 0, 0);
                doc.text(`Empresa: ${presupuesto.lead?.empresa || presupuesto.lead?.nombre_completo || 'N/A'}`, margin + 3, yPos + 14);
                doc.text(`Contacto: ${presupuesto.lead?.contacto || presupuesto.lead?.nombre_completo || 'N/A'}`, margin + 3, yPos + 20);
                doc.text(`Email: ${presupuesto.lead?.email || 'N/A'}`, margin + 3, yPos + 26);
                if (presupuesto.lead?.telefono) {
                    doc.text(`Teléfono: ${presupuesto.lead.telefono}`, margin + 3, yPos + 32);
                }

                // Columna derecha - DETALLES
                doc.setFillColor(249, 250, 251);
                doc.rect(margin + colWidth + 10, yPos, colWidth, 35, 'F');
                
                doc.setFontSize(11);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(247, 98, 0);
                doc.text('DETALLES', margin + colWidth + 13, yPos + 6);
                
                doc.setFontSize(9);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0, 0, 0);
                doc.text(`Fecha: ${new Date(presupuesto.created).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin + colWidth + 13, yPos + 14);
                doc.text(`Validez: ${new Date(presupuesto.validez).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}`, margin + colWidth + 13, yPos + 20);
                doc.text(`Asesor: ${presupuesto.nombre_comercial || 'No asignado'}`, margin + colWidth + 13, yPos + 26);
                doc.text(`Unidades: ${presupuesto.cantidad_vehiculos || 1} Vehículo(s)`, margin + colWidth + 13, yPos + 32);

                yPos += 45;

                // ===== TABLA DE PRODUCTOS =====
                const formatMoney = (value: any): string => {
                    const num = typeof value === 'string' ? parseFloat(value) : value || 0;
                    return '$ ' + num.toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
                };

                const getTextoPromocion = (productoId: number): string | null => {
                    if (!presupuesto.promocion?.productos) return null;
                    
                    const productoEnPromo = presupuesto.promocion.productos.find(
                        (p: any) => p.producto_servicio_id === productoId
                    );
                    
                    if (!productoEnPromo) return null;
                    
                    if (productoEnPromo.tipo_promocion === '2x1') return '2x1';
                    if (productoEnPromo.tipo_promocion === '3x2') return '3x2';
                    return `${productoEnPromo.bonificacion}%`;
                };

                const getTextoDescuento = (productoId: number, bonificacion: number): string => {
                    const textoPromo = getTextoPromocion(productoId);
                    if (textoPromo) return textoPromo;
                    
                    if (bonificacion > 0) {
                        if (productoId === presupuesto.abono?.id) {
                            return `${bonificacion}% (Débito Automático)`;
                        }
                        return `${bonificacion}% OFF`;
                    }
                    return '-';
                };

                // Preparar datos de la tabla
                const tableData: any[] = [];

                // Tasa
                if (presupuesto.tasa) {
                    tableData.push([
                        { content: 'SERVICIO DE INSTALACIÓN', colSpan: 5, styles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold' } }
                    ]);
                    
                    const textoDescuento = getTextoDescuento(presupuesto.tasa.id, presupuesto.tasa_bonificacion);
                    tableData.push([
                        presupuesto.tasa.nombre,
                        presupuesto.cantidad_vehiculos.toString(),
                        formatMoney(presupuesto.valor_tasa),
                        textoDescuento,
                        formatMoney(presupuesto.subtotal_tasa)
                    ]);
                }

                // Abono
                if (presupuesto.abono) {
                    tableData.push([
                        { content: 'ABONO MENSUAL', colSpan: 5, styles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold' } }
                    ]);
                    
                    const textoDescuento = getTextoDescuento(presupuesto.abono.id, presupuesto.abono_bonificacion);
                    tableData.push([
                        presupuesto.abono.nombre,
                        presupuesto.cantidad_vehiculos.toString(),
                        formatMoney(presupuesto.valor_abono),
                        textoDescuento,
                        formatMoney(presupuesto.subtotal_abono)
                    ]);
                }

                // Servicios
                const servicios = presupuesto.agregados?.filter((item: any) => {
                    const tipoId = item.producto_servicio?.tipo?.id;
                    const tipoNombre = item.producto_servicio?.tipo?.nombre_tipo_abono || '';
                    return tipoId === 3 || tipoNombre === 'SERVICIO';
                }) || [];

                if (servicios.length > 0) {
                    tableData.push([
                        { content: 'SERVICIOS ADICIONALES', colSpan: 5, styles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold' } }
                    ]);
                    
                    servicios.forEach((item: any) => {
                        const textoDescuento = getTextoDescuento(item.prd_servicio_id, item.bonificacion);
                        tableData.push([
                            item.producto_servicio?.nombre || 'Producto',
                            item.cantidad.toString(),
                            formatMoney(item.valor),
                            textoDescuento,
                            formatMoney(item.subtotal)
                        ]);
                    });
                }

                // Accesorios
                const accesorios = presupuesto.agregados?.filter((item: any) => {
                    const tipoId = item.producto_servicio?.tipo?.id;
                    const tipoNombre = item.producto_servicio?.tipo?.nombre_tipo_abono || '';
                    return tipoId === 5 || tipoNombre === 'ACCESORIOS';
                }) || [];

                if (accesorios.length > 0) {
                    tableData.push([
                        { content: 'ACCESORIOS', colSpan: 5, styles: { fillColor: [243, 244, 246], textColor: [0, 0, 0], fontStyle: 'bold' } }
                    ]);
                    
                    accesorios.forEach((item: any) => {
                        const textoDescuento = getTextoDescuento(item.prd_servicio_id, item.bonificacion);
                        tableData.push([
                            item.producto_servicio?.nombre || 'Producto',
                            item.cantidad.toString(),
                            formatMoney(item.valor),
                            textoDescuento,
                            formatMoney(item.subtotal)
                        ]);
                    });
                }

                // Generar tabla
                autoTable(doc, {
                    startY: yPos,
                    head: [['Descripción', 'Cant.', 'Precio Unit.', 'Promoción', 'Subtotal']],
                    body: tableData,
                    theme: 'striped',
                    headStyles: {
                        fillColor: [60, 60, 62],
                        textColor: 255,
                        fontStyle: 'bold',
                        fontSize: 9
                    },
                    columnStyles: {
                        0: { cellWidth: 'auto' },
                        1: { cellWidth: 15, halign: 'right' },
                        2: { cellWidth: 30, halign: 'right' },
                        3: { cellWidth: 35, halign: 'center' },
                        4: { cellWidth: 30, halign: 'right' }
                    },
                    styles: {
                        fontSize: 8,
                        cellPadding: 2
                    },
                    margin: { left: margin, right: margin }
                });

                const finalY = (doc as any).lastAutoTable.finalY + 5;

                // ===== TOTALES =====
                const calcularTotalItems = (items: any[]): number => {
                    return items.reduce((sum, item) => sum + (parseFloat(item.subtotal) || 0), 0);
                };

                const totalServicios = calcularTotalItems(servicios);
                const totalAccesorios = calcularTotalItems(accesorios);
                const subtotalTasa = parseFloat(presupuesto.subtotal_tasa) || 0;
                const subtotalAbono = parseFloat(presupuesto.subtotal_abono) || 0;
                
                const inversionInicial = subtotalTasa + totalAccesorios;
                const costoMensual = subtotalAbono + totalServicios;
                const totalPrimerMes = inversionInicial + costoMensual;

                const totalX = pageWidth - margin - 80;
                
                doc.setFontSize(10);
                
                doc.setFont('helvetica', 'bold');
                doc.text('Inversión Inicial:', totalX, finalY);
                doc.setFont('helvetica', 'normal');
                doc.text(formatMoney(inversionInicial), pageWidth - margin, finalY, { align: 'right' });

                doc.setFont('helvetica', 'bold');
                doc.text('Costo Mensual:', totalX, finalY + 6);
                doc.setFont('helvetica', 'normal');
                doc.text(formatMoney(costoMensual), pageWidth - margin, finalY + 6, { align: 'right' });

                doc.setDrawColor(200, 200, 200);
                doc.line(totalX, finalY + 10, pageWidth - margin, finalY + 10);

                doc.setFontSize(12);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(247, 98, 0);
                doc.text('TOTAL PRIMER MES:', totalX, finalY + 18);
                doc.text(formatMoney(totalPrimerMes), pageWidth - margin, finalY + 18, { align: 'right' });

                doc.setFontSize(8);
                doc.setFont('helvetica', 'italic');
                doc.setTextColor(107, 114, 128);
                doc.text(`* Costo mensual desde el 2° mes: ${formatMoney(costoMensual)}`, pageWidth - margin, finalY + 24, { align: 'right' });

                // ===== TÉRMINOS Y CONDICIONES =====
                const termY = doc.internal.pageSize.getHeight() - 35;
                
                doc.setFontSize(9);
                doc.setFont('helvetica', 'bold');
                doc.setTextColor(60, 60, 62);
                doc.text('TÉRMINOS Y CONDICIONES', margin, termY);

                doc.setFontSize(7.5);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(80, 80, 80);
                
                const termLines: string[] = [];

                if (presupuesto.promocion) {
                    termLines.push(`• Promoción aplicada: ${presupuesto.promocion.nombre}`);
                    if (presupuesto.promocion.descripcion) {
                        termLines.push(`  ${presupuesto.promocion.descripcion}`);
                    }
                }

                termLines.push(
                    `• Validez: ${presupuesto.dias_validez || 7} días hábiles dentro del mes en curso de la cotización.`,
                    `• Actualización: sujeta a variación IPC mensual. Los valores detallados podrán variar y serán los que rijan al momento de la contratación.`,
                    `• IVA: todos los precios no incluyen IVA (21%).`,
                    `• Soporte: asesoramiento comercial y servicio técnico en domicilio incluido.`
                );

                if (presupuesto.abono_bonificacion > 0 && presupuesto.abono && !getTextoPromocion(presupuesto.abono.id)) {
                    termLines.push(`• Descuento en abono del ${presupuesto.abono_bonificacion}% por adhesión a débito automático.`);
                }

                termLines.forEach((line, index) => {
                    doc.text(line, margin, termY + 5 + (index * 4));
                });

                // ===== DEVOLVER EL PDF GENERADO =====
                const pdfBlob = doc.output('blob');
                
                // Si es una descarga, devolvemos el blob al opener
                if (download && window.opener) {
                    window.opener.postMessage({ 
                        type: 'PDF_GENERADO', 
                        pdfBlob: pdfBlob,
                        nombreArchivo: nombreArchivo 
                    }, '*');
                    window.close();
                } else if (!download) {
                    // Para ver, mostramos en la misma pestaña
                    const pdfUrl = URL.createObjectURL(pdfBlob);
                    window.location.href = pdfUrl;
                }
                
            } catch (error) {
                console.error('Error generando PDF:', error);
                if (window.opener) {
                    window.opener.postMessage({ 
                        type: 'PDF_ERROR', 
                        error: 'Error al generar el PDF' 
                    }, '*');
                    window.close();
                }
            }
        };

        generarPDF();
    }, [presupuesto, download, nombreArchivo]);

    return null;
};