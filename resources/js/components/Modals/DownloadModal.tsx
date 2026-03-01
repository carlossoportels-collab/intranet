// resources/js/Components/Modals/DownloadModal.tsx
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Download, X, FileText, Building2, CheckSquare, Square } from 'lucide-react';
import React, { useState } from 'react';

interface Tipo {
    id: number;
    nombre_tipo_abono: string;
    descripcion: string;
}

interface Producto {
    id: number;
    codigopro: string;
    nombre: string;
    precio: number;
    tipo_id: number;
    compania_id: number;
    tipo?: Tipo;
}

interface DownloadModalProps {
    isOpen: boolean;
    onClose: () => void;
    tipos: Tipo[];
    productos: Producto[];
    companiaInfo?: {
        id: number;
        nombre: string;
        logo?: string;
    } | null;
    puedeVerTodas: boolean;
}

export default function DownloadModal({ 
    isOpen, 
    onClose, 
    tipos, 
    productos, 
    companiaInfo,
    puedeVerTodas 
}: DownloadModalProps) {
    const [selectedTipos, setSelectedTipos] = useState<number[]>([]);
    const [selectAll, setSelectAll] = useState(false);

    if (!isOpen) return null;

    const handleSelectAll = () => {
        if (selectAll) {
            setSelectedTipos([]);
        } else {
            setSelectedTipos(tipos.map(t => t.id));
        }
        setSelectAll(!selectAll);
    };

    const handleSelectTipo = (tipoId: number) => {
        if (selectedTipos.includes(tipoId)) {
            setSelectedTipos(selectedTipos.filter(id => id !== tipoId));
        } else {
            setSelectedTipos([...selectedTipos, tipoId]);
        }
    };

    const getProductosByTipo = (tipoId: number) => {
        return productos.filter(p => p.tipo_id === tipoId);
    };

    // Función para dividir array de productos en dos columnas
    const splitProductosEnDosColumnas = (productos: Producto[]) => {
        const mitad = Math.ceil(productos.length / 2);
        return [productos.slice(0, mitad), productos.slice(mitad)];
    };

    const generarPDF = () => {
        if (selectedTipos.length === 0) {
            alert('Debe seleccionar al menos un tipo para descargar');
            return;
        }

        // Crear nuevo documento PDF en vertical
        const doc = new jsPDF({
            orientation: 'portrait',
            unit: 'mm',
            format: 'a4'
        });
        
        // Formatear fecha
        const fechaActual = new Date().toLocaleDateString('es-AR', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric'
        });

        // Márgenes reducidos (10mm para aprovechar más espacio)
        const marginLeft = 10;
        const marginRight = 10;
        const pageWidth = 210; // A4 width
        const contentWidth = pageWidth - marginLeft - marginRight; // 190mm

        // Anchos de columna ajustados
        const colProductoWidth = 65;  // 65mm para nombre del producto
        const colPrecioWidth = 25;    // 25mm para precio (más espacio)
        const colEspacioWidth = 10;    // 10mm de espacio entre columnas
        
        // Total: (65+25+10) * 2 = 200mm? No, vamos a calcular bien:
        // Primera columna: 65 (producto) + 25 (precio) = 90mm
        // Espacio: 10mm
        // Segunda columna: 65 (producto) + 25 (precio) = 90mm
        // Total: 190mm (justo el ancho disponible)

        let yPos = 20;
        let currentPage = 1;

        // === HEADER PRINCIPAL ===
        doc.setFontSize(16);
        doc.setTextColor(40, 40, 40);
        doc.setFont('helvetica', 'bold');
        doc.text('LISTA DE PRECIOS', pageWidth / 2, yPos, { align: 'center' });
        
        yPos += 8;

        // Información de compañía y fecha
        doc.setFontSize(10);
        doc.setTextColor(100, 100, 100);
        doc.setFont('helvetica', 'normal');
        
        let infoText = '';
        if (!puedeVerTodas && companiaInfo) {
            infoText = `${companiaInfo.nombre} - ${fechaActual}`;
        } else {
            infoText = `Todas las compañías - ${fechaActual}`;
        }
        doc.text(infoText, pageWidth / 2, yPos, { align: 'center' });
        
        yPos += 8;

        // Línea separadora
        doc.setDrawColor(200, 200, 200);
        doc.setLineWidth(0.3);
        doc.line(marginLeft, yPos - 2, pageWidth - marginRight, yPos - 2);
        
        yPos += 6;

        // === PROCESAR CADA TIPO ===
        for (let i = 0; i < selectedTipos.length; i++) {
            const tipo = tipos.find(t => t.id === selectedTipos[i]);
            if (!tipo) continue;

            const productosTipo = getProductosByTipo(tipo.id);
            if (productosTipo.length === 0) continue;

            // Verificar si necesitamos nueva página
            if (yPos > 250) {
                doc.addPage();
                yPos = 20;
                currentPage++;
            }

            // Título del tipo
            doc.setFontSize(12);
            doc.setTextColor(250, 100, 0);
            doc.setFont('helvetica', 'bold');
            doc.text(tipo.nombre_tipo_abono, marginLeft, yPos);
            
            yPos += 5;

            // Dividir productos en dos columnas
            const [columna1, columna2] = splitProductosEnDosColumnas(productosTipo);

            // Preparar datos para las dos columnas con espacio en medio
            const maxFilas = Math.max(columna1.length, columna2.length);
            const filas: any[][] = [];

            for (let j = 0; j < maxFilas; j++) {
                const prod1 = columna1[j];
                const prod2 = columna2[j];
                
                filas.push([
                    prod1 ? prod1.nombre : '',
                    prod1 ? `$${(prod1.precio || 0).toLocaleString('es-AR')}` : '',
                    '', // Columna vacía para espacio
                    prod2 ? prod2.nombre : '',
                    prod2 ? `$${(prod2.precio || 0).toLocaleString('es-AR')}` : ''
                ]);
            }

            // Generar tabla con 5 columnas: Producto | Precio | Espacio | Producto | Precio
            autoTable(doc, {
                startY: yPos,
                head: [['Producto', 'Precio', '', 'Producto', 'Precio']],
                body: filas,
                theme: 'plain',
                headStyles: {
                    fillColor: [240, 240, 240],
                    textColor: [50, 50, 50],
                    fontStyle: 'bold',
                    fontSize: 9,
                    halign: 'left',
                    lineColor: [200, 200, 200],
                    lineWidth: 0.2
                },
                columnStyles: {
                    0: { 
                        cellWidth: colProductoWidth, 
                        fontSize: 9,
                        cellPadding: { top: 2, bottom: 2, left: 2, right: 2 }
                    },
                    1: { 
                        cellWidth: colPrecioWidth, 
                        halign: 'right', 
                        fontSize: 9,
                        cellPadding: { top: 2, bottom: 2, left: 2, right: 4 }
                    },
                    2: { 
                        cellWidth: colEspacioWidth, 
                        fontSize: 9,
                        cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
                        fillColor: [255, 255, 255] // Blanco puro para el espacio
                    },
                    3: { 
                        cellWidth: colProductoWidth, 
                        fontSize: 9,
                        cellPadding: { top: 2, bottom: 2, left: 2, right: 2 }
                    },
                    4: { 
                        cellWidth: colPrecioWidth, 
                        halign: 'right', 
                        fontSize: 9,
                        cellPadding: { top: 2, bottom: 2, left: 2, right: 4 }
                    }
                },
                styles: {
                    fontSize: 9,
                    cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
                    font: 'helvetica',
                    lineColor: [230, 230, 230],
                    lineWidth: 0.1,
                    textColor: [40, 40, 40]
                },
                alternateRowStyles: {
                    fillColor: [248, 248, 248]
                },
                margin: { left: marginLeft, right: marginRight },
                tableWidth: contentWidth,
                didDrawPage: (data) => {
                    // Pie de página
                    if (data.pageNumber > currentPage) {
                        doc.setFontSize(8);
                        doc.setTextColor(150, 150, 150);
                        doc.text(
                            `Página ${data.pageNumber}`,
                            pageWidth / 2,
                            doc.internal.pageSize.height - 10,
                            { align: 'center' }
                        );
                    }
                }
            });

            // Actualizar yPos después de la tabla
            const finalY = (doc as any).lastAutoTable?.finalY;
            yPos = finalY ? finalY + 12 : yPos + 12; // Espacio generoso entre tipos

            // Línea separadora entre tipos (opcional, podemos quitarla si sobra espacio)
            if (i < selectedTipos.length - 1) {
                doc.setDrawColor(220, 220, 220);
                doc.setLineWidth(0.1);
                doc.line(marginLeft + 20, yPos - 8, pageWidth - marginRight - 20, yPos - 8);
            }
        }

        // Numeración de páginas
        const totalPages = doc.getNumberOfPages();
        for (let i = 1; i <= totalPages; i++) {
            doc.setPage(i);
            doc.setFontSize(8);
            doc.setTextColor(150, 150, 150);
            doc.text(
                `Página ${i} de ${totalPages}`,
                pageWidth / 2,
                doc.internal.pageSize.height - 10,
                { align: 'center' }
            );
        }

        // Guardar el PDF
        const fechaFormateada = new Date().toLocaleDateString('es-AR')
            .replace(/\//g, '-');
        const nombreArchivo = `lista_precios_${fechaFormateada}.pdf`;
        doc.save(nombreArchivo);
        
        // Cerrar modal y limpiar selección
        setSelectedTipos([]);
        setSelectAll(false);
        onClose();
    };

    return (
        <>
            {/* Overlay con opacidad */}
            <div 
                className="fixed inset-0 bg-black/60 z-[99990]"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[99999] pointer-events-none">
                <div 
                    className="bg-white rounded-lg shadow-2xl w-full max-w-lg max-h-[90vh] overflow-hidden animate-fadeIn pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Download className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Descargar Lista de Precios
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Seleccione las categorías a incluir
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                            type="button"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                        {/* Info de compañía */}
                        {!puedeVerTodas && companiaInfo && (
                            <div className="mb-4 p-4 bg-gray-50 rounded-lg border border-gray-200">
                                <div className="flex items-center gap-3">
                                    <Building2 className="h-5 w-5 text-gray-600" />
                                    <div>
                                        <p className="text-xs text-gray-500">Compañía</p>
                                        <p className="font-medium text-gray-900">
                                            {companiaInfo.nombre}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {puedeVerTodas && (
                            <div className="mb-4 p-4 bg-purple-50 rounded-lg border border-purple-200">
                                <div className="flex items-center gap-3">
                                    <Building2 className="h-5 w-5 text-purple-600" />
                                    <div>
                                        <p className="text-xs text-purple-600">Acceso</p>
                                        <p className="font-medium text-purple-900">
                                            Todas las compañías
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* Selector de tipos */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <label className="text-sm font-medium text-gray-700">
                                    Categorías disponibles ({tipos.length})
                                </label>
                                {tipos.length > 0 && (
                                    <button
                                        onClick={handleSelectAll}
                                        className="flex items-center gap-1 text-sm text-sat hover:text-sat-600"
                                    >
                                        {selectAll ? (
                                            <>
                                                <Square className="h-4 w-4" />
                                                <span>Deseleccionar todos</span>
                                            </>
                                        ) : (
                                            <>
                                                <CheckSquare className="h-4 w-4" />
                                                <span>Seleccionar todos</span>
                                            </>
                                        )}
                                    </button>
                                )}
                            </div>
                            
                            <div className="max-h-60 overflow-y-auto border border-gray-200 rounded-lg divide-y divide-gray-100">
                                {tipos.length === 0 ? (
                                    <div className="p-8 text-center text-gray-500">
                                        <FileText className="h-12 w-12 mx-auto mb-3 text-gray-400" />
                                        <p>No hay categorías disponibles</p>
                                    </div>
                                ) : (
                                    tipos.map((tipo) => {
                                        const cantidad = productos.filter(p => p.tipo_id === tipo.id).length;
                                        return (
                                            <div
                                                key={tipo.id}
                                                className="flex items-center p-3 hover:bg-gray-50 cursor-pointer"
                                                onClick={() => handleSelectTipo(tipo.id)}
                                            >
                                                <input
                                                    type="checkbox"
                                                    checked={selectedTipos.includes(tipo.id)}
                                                    onChange={() => {}}
                                                    className="w-4 h-4 text-sat border-gray-300 rounded focus:ring-sat"
                                                />
                                                <div className="ml-3 flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-sm font-medium text-gray-900">
                                                            {tipo.nombre_tipo_abono}
                                                        </span>
                                                        <span className="text-xs px-2 py-1 bg-gray-100 rounded-full text-gray-600">
                                                            {cantidad}
                                                        </span>
                                                    </div>
                                                    {tipo.descripcion && (
                                                        <p className="text-xs text-gray-500 truncate mt-0.5">
                                                            {tipo.descripcion}
                                                        </p>
                                                    )}
                                                </div>
                                            </div>
                                        );
                                    })
                                )}
                            </div>
                        </div>

                        {/* Resumen de selección */}
                        {selectedTipos.length > 0 && (
                            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-100">
                                <div className="flex items-center justify-between text-sm">
                                    <span className="font-medium text-blue-800">
                                        {selectedTipos.length} categoría{selectedTipos.length !== 1 ? 's' : ''} seleccionada{selectedTipos.length !== 1 ? 's' : ''}
                                    </span>
                                    <span className="text-blue-600 font-medium">
                                        {productos.filter(p => selectedTipos.includes(p.tipo_id)).length} productos
                                    </span>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="button"
                            onClick={generarPDF}
                            disabled={selectedTipos.length === 0}
                            className={`px-4 py-2 rounded-md text-sm font-medium text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sat transition-colors flex items-center gap-2 ${
                                selectedTipos.length === 0
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-sat hover:bg-sat-600'
                            }`}
                        >
                            <Download className="h-4 w-4" />
                            Descargar PDF
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}