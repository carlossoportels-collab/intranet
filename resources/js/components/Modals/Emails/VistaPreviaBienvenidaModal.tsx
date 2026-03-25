// resources/js/components/Modals/Emails/VistaPreviaBienvenidaModal.tsx

import React, { useEffect, useState } from 'react';
import { X, Gift, Loader } from 'lucide-react';
import { usePage } from '@inertiajs/react';

interface VistaPreviaBienvenidaModalProps {
    isOpen: boolean;
    onClose: () => void;
    contrato: any;
    comercialNombre: string;
    comercialEmail: string;
    comercialTelefono?: string;
    companiaId: number;
    companiaNombre: string;
    plataforma: string;
}

export default function VistaPreviaBienvenidaModal({
    isOpen,
    onClose,
    contrato,
    comercialNombre,
    comercialEmail,
    comercialTelefono,
    companiaId,
    companiaNombre,
    plataforma
}: VistaPreviaBienvenidaModalProps) {
    const [isLoading, setIsLoading] = useState(true);
    const [htmlPreview, setHtmlPreview] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    
    // Obtener el token CSRF desde el DOM (más confiable)
    const getCsrfToken = () => {
        // Intentar desde meta tag
        const metaToken = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
        if (metaToken) return metaToken;
        
        // Fallback: intentar desde las cookies de Laravel
        const cookies = document.cookie.split(';');
        for (let cookie of cookies) {
            const [name, value] = cookie.trim().split('=');
            if (name === 'XSRF-TOKEN') {
                return decodeURIComponent(value);
            }
        }
        
        return '';
    };

    useEffect(() => {
        if (isOpen && contrato) {
            setIsLoading(true);
            setError(null);
            
            const fetchPreview = async () => {
                try {
                    const csrfToken = getCsrfToken();
                    
                    const response = await fetch('/api/email/vista-previa-bienvenida', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'X-CSRF-TOKEN': csrfToken,
                            'Accept': 'application/json',
                            'X-Requested-With': 'XMLHttpRequest'
                        },
                        credentials: 'same-origin', // Importante para enviar cookies
                        body: JSON.stringify({
                            companiaId: companiaId,
                            plataforma: plataforma,
                            nombreCliente: contrato.cliente_nombre_completo,
                            nombreFlota: contrato.empresa_nombre_flota || contrato.cliente_nombre_completo,
                            comercialNombre: comercialNombre,
                            comercialEmail: comercialEmail,
                            comercialTelefono: comercialTelefono
                        })
                    });
                    
                    const data = await response.json();
                    
                    if (response.ok && data.success) {
                        setHtmlPreview(data.html);
                    } else {
                        setError(data.error || 'Error al cargar la vista previa');
                    }
                } catch (error) {
                    console.error('Error cargando vista previa:', error);
                    setError('Error de conexión al servidor');
                } finally {
                    setIsLoading(false);
                }
            };
            
            fetchPreview();
        }
    }, [isOpen, contrato, companiaId, plataforma, comercialNombre, comercialEmail, comercialTelefono]);

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

                    {/* Contenido */}
                    <div className="flex-1 overflow-y-auto bg-gray-50">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-64">
                                <Loader className="h-8 w-8 animate-spin text-green-600" />
                            </div>
                        ) : error ? (
                            <div className="flex items-center justify-center h-64">
                                <div className="text-center">
                                    <p className="text-red-600 mb-2">Error: {error}</p>
                                    <button
                                        onClick={() => {
                                            setIsLoading(true);
                                            setError(null);
                                            const fetchPreview = async () => {
                                                try {
                                                    const csrfToken = getCsrfToken();
                                                    const response = await fetch('/api/email/vista-previa-bienvenida', {
                                                        method: 'POST',
                                                        headers: {
                                                            'Content-Type': 'application/json',
                                                            'X-CSRF-TOKEN': csrfToken,
                                                            'Accept': 'application/json',
                                                            'X-Requested-With': 'XMLHttpRequest'
                                                        },
                                                        credentials: 'same-origin',
                                                        body: JSON.stringify({
                                                            companiaId: companiaId,
                                                            plataforma: plataforma,
                                                            nombreCliente: contrato.cliente_nombre_completo,
                                                            nombreFlota: contrato.empresa_nombre_flota || contrato.cliente_nombre_completo,
                                                            comercialNombre: comercialNombre,
                                                            comercialEmail: comercialEmail,
                                                            comercialTelefono: comercialTelefono
                                                        })
                                                    });
                                                    
                                                    const data = await response.json();
                                                    
                                                    if (response.ok && data.success) {
                                                        setHtmlPreview(data.html);
                                                        setError(null);
                                                    } else {
                                                        setError(data.error || 'Error al cargar la vista previa');
                                                    }
                                                } catch (error) {
                                                    console.error('Error:', error);
                                                    setError('Error de conexión al servidor');
                                                } finally {
                                                    setIsLoading(false);
                                                }
                                            };
                                            fetchPreview();
                                        }}
                                        className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                                    >
                                        Reintentar
                                    </button>
                                </div>
                            </div>
                        ) : (
                            <div className="p-4 bg-white" style={{ minHeight: '600px' }}>
                                <div dangerouslySetInnerHTML={{ __html: htmlPreview }} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}