// resources/js/Pages/Comercial/Presupuestos/PDF.tsx

import { Head } from '@inertiajs/react';
import React from 'react';

import { PDFGenerator } from '@/components/presupuestos/PDFGenerator';

interface Props {
    presupuesto: any;
    download?: boolean;
    nombreArchivo?: string;
}

export default function PresupuestoPDFPage({ 
    presupuesto, 
    download = false, 
    nombreArchivo
}: Props) {
    
    return (
        <>
            <Head title={`Presupuesto #${presupuesto.referencia}`} />
            <PDFGenerator 
                presupuesto={presupuesto}
                download={download}
                nombreArchivo={nombreArchivo}
            />
            {/* Mostrar un mensaje mientras se genera */}
            <div className="min-h-screen bg-gray-100 flex items-center justify-center">
                <div className="bg-white p-8 rounded-lg shadow-lg text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sat mx-auto mb-4"></div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-2">
                        {download ? 'Descargando PDF...' : 'Generando PDF...'}
                    </h2>
                    <p className="text-gray-600">
                        {download 
                            ? 'La descarga comenzará automáticamente.' 
                            : 'Por favor espere mientras se genera su presupuesto.'}
                    </p>
                </div>
            </div>
        </>
    );
}