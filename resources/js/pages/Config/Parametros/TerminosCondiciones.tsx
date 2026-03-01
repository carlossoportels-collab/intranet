// resources/js/Pages/Config/Parametros/TerminosCondiciones.tsx
import React, { useState } from 'react';

import AppLayout from '@/layouts/app-layout';

interface TerminoCondicion {
    id: number;
    titulo: string;
    tipo: string;
    version: string;
    fecha_vigencia: string;
    activo: boolean;
}

export default function TerminosCondiciones() {
    const [terminos] = useState<TerminoCondicion[]>([
        { id: 1, titulo: 'Términos Generales de Servicio', tipo: 'General', version: '2.1', fecha_vigencia: '2024-01-01', activo: true },
        { id: 2, titulo: 'Política de Privacidad', tipo: 'Privacidad', version: '1.3', fecha_vigencia: '2024-01-01', activo: true },
        { id: 3, titulo: 'Contrato de Servicio Premium', tipo: 'Contrato', version: '3.0', fecha_vigencia: '2024-03-15', activo: true },
        { id: 4, titulo: 'Términos de Uso API', tipo: 'Técnico', version: '1.2', fecha_vigencia: '2023-12-01', activo: true },
        { id: 5, titulo: 'Acuerdo de Confidencialidad', tipo: 'Legal', version: '1.0', fecha_vigencia: '2023-06-01', activo: false },
    ]);

    const [activeVersion, setActiveVersion] = useState<string>('2.1');
    const [content] = useState<string>(`# Términos y Condiciones Generales

## 1. Aceptación de los Términos
Al utilizar nuestros servicios, usted acepta cumplir con los siguientes términos y condiciones.

## 2. Definiciones
- **Servicio**: Se refiere a los servicios proporcionados por LocalSat.
- **Cliente**: Persona o entidad que utiliza nuestros servicios.
- **Contrato**: Acuerdo entre LocalSat y el Cliente.

## 3. Obligaciones del Cliente
El Cliente se compromete a:
- Proporcionar información veraz y actualizada
- Cumplir con los pagos establecidos
- Utilizar el servicio de acuerdo a la normativa vigente

## 4. Responsabilidades de LocalSat
Nos comprometemos a:
- Proporcionar el servicio contratado
- Mantener la confidencialidad de la información
- Responder a consultas en tiempo razonable

## 5. Modificaciones
Nos reservamos el derecho de modificar estos términos con aviso previo.

*Última actualización: 1 de Enero de 2024*`);

    return (
        <AppLayout title="Términos y Condiciones">
            <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    Términos y Condiciones
                </h1>
                <p className="mt-1 text-gray-600 text-base">
                    Gestión de documentos legales y contractuales
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">
                            Documentos Configurados
                        </h2>
                        <p className="text-sm text-gray-600">
                            Gestione los términos y condiciones del sistema
                        </p>
                    </div>
                    <button className="px-4 py-2 bg-local text-white text-sm rounded hover:bg-local-600 transition-colors">
                        + Nuevo Documento
                    </button>
                </div>

                {/* Two Column Layout */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                    {/* Left Column - List */}
                    <div className="lg:col-span-1">
                        <div className="mb-4">
                            <h3 className="font-medium text-gray-900 mb-3">Versiones Disponibles</h3>
                            <div className="space-y-2">
                                {terminos.map((termino) => (
                                    <button
                                        key={termino.id}
                                        onClick={() => setActiveVersion(termino.version)}
                                        className={`w-full text-left p-3 rounded border transition-colors ${
                                            activeVersion === termino.version 
                                                ? 'border-sat bg-sat-50' 
                                                : 'border-gray-200 hover:border-sat hover:bg-gray-50'
                                        }`}
                                    >
                                        <div className="flex justify-between items-start mb-1">
                                            <div className="font-medium text-gray-900">{termino.titulo}</div>
                                            <span className={`px-2 py-1 text-xs rounded-full ${termino.activo ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                v{termino.version}
                                            </span>
                                        </div>
                                        <div className="text-sm text-gray-600">
                                            <div>Tipo: {termino.tipo}</div>
                                            <div>Vigencia: {termino.fecha_vigencia}</div>
                                        </div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Stats */}
                        <div className="p-4 bg-gray-50 rounded border">
                            <h4 className="font-medium text-gray-900 mb-2">Resumen</h4>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Total documentos:</span>
                                    <span className="font-medium">{terminos.length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Documentos activos:</span>
                                    <span className="font-medium">{terminos.filter(t => t.activo).length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Última versión:</span>
                                    <span className="font-medium">v{activeVersion}</span>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right Column - Content */}
                    <div className="lg:col-span-2">
                        <div className="border border-gray-200 rounded-lg overflow-hidden">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                                    <div>
                                        <h3 className="font-semibold text-gray-900">
                                            {terminos.find(t => t.version === activeVersion)?.titulo}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            Versión {activeVersion}
                                        </p>
                                    </div>
                                    <div className="flex gap-2">
                                        <button className="px-3 py-1.5 text-sm text-sat border border-sat rounded hover:bg-sat-50 transition-colors">
                                            Editar
                                        </button>
                                        <button className="px-3 py-1.5 text-sm bg-sat text-white rounded hover:bg-sat-600 transition-colors">
                                            Descargar PDF
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {/* Content Editor/Viewer */}
                            <div className="p-4 md:p-6">
                                <div className="prose max-w-none">
                                    <div className="whitespace-pre-line text-sm md:text-base text-gray-700 leading-relaxed">
                                        {content}
                                    </div>
                                </div>

                                {/* Actions */}
                                <div className="mt-6 pt-6 border-t border-gray-200">
                                    <div className="flex flex-col sm:flex-row gap-3">
                                        <button className="px-4 py-2 text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                                            Publicar Cambios
                                        </button>
                                        <button className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors">
                                            Crear Nueva Versión
                                        </button>
                                        <button className="px-4 py-2 text-sm border border-red-300 text-red-700 rounded hover:bg-red-50 transition-colors">
                                            Desactivar
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Version History */}
                        <div className="mt-6">
                            <h4 className="font-medium text-gray-900 mb-3">Historial de Versiones</h4>
                            <div className="space-y-2">
                                {terminos
                                    .filter(t => t.tipo === 'General')
                                    .map((termino) => (
                                        <div key={termino.id} className="p-3 border border-gray-200 rounded">
                                            <div className="flex justify-between items-center">
                                                <div>
                                                    <div className="font-medium">v{termino.version}</div>
                                                    <div className="text-sm text-gray-600">
                                                        Vigente desde: {termino.fecha_vigencia}
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    <button className="text-sat hover:text-sat-600 text-sm">
                                                        Restaurar
                                                    </button>
                                                    <button className="text-gray-600 hover:text-gray-900 text-sm">
                                                        Comparar
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}