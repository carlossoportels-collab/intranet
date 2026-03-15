// resources/js/components/Modals/Emails/VistaPreviaBienvenidaModal.tsx

import React from 'react';
import { X, Eye, Mail, Gift } from 'lucide-react';

interface VistaPreviaBienvenidaModalProps {
    isOpen: boolean;
    onClose: () => void;
    mensaje: string;
    comercialNombre: string;
    plataforma: string;
}

export default function VistaPreviaBienvenidaModal({
    isOpen,
    onClose,
    mensaje,
    comercialNombre,
    plataforma
}: VistaPreviaBienvenidaModalProps) {
    if (!isOpen) return null;

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-[99997]" onClick={onClose} />
            
            <div className="fixed inset-0 flex items-center justify-center p-8 z-[99999] pointer-events-none">
                <div 
                    className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl flex flex-col max-h-[90vh] pointer-events-auto border border-gray-100"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 flex-shrink-0 bg-gradient-to-r from-green-50 to-white rounded-t-2xl">
                        <div className="flex items-center gap-4">
                            <div className="p-3 bg-green-100 rounded-xl">
                                <Gift className="h-6 w-6 text-green-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Vista Previa - Mensaje de Bienvenida
                                </h2>
                                <p className="text-sm text-gray-500 mt-1">
                                    {plataforma} • Comercial: {comercialNombre}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Contenido - solo el mensaje */}
                    <div className="flex-1 overflow-y-auto p-8 bg-gray-50">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
                            <div 
                                className="prose prose-sm max-w-none"
                                dangerouslySetInnerHTML={{ __html: mensaje }}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}