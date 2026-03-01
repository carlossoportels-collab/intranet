// resources/js/Components/Modals/VerComentariosModal.tsx
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, MessageSquare, User, Clock, Plus } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface TipoComentario {
    id: number;
    nombre: string;
}

interface Comentario {
    id: number;
    lead_id: number;
    usuario_id: number;
    tipo_comentario_id: number;
    comentario: string;
    created: string;
    tipo_comentario?: TipoComentario;
    usuario?: {
        id: number;
        nombre: string;
    };
}

interface ComentarioLegacy {
    id: number;
    lead_id: number;
    comentario: string;
    created: string;
}

interface Lead {
    id: number;
    nombre_completo: string;
}

interface VerComentariosModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
    onAddNewComment?: () => void;
}

export default function VerComentariosModal({ isOpen, onClose, lead, onAddNewComment }: VerComentariosModalProps) {
    const [comentarios, setComentarios] = useState<Comentario[]>([]);
    const [comentariosLegacy, setComentariosLegacy] = useState<ComentarioLegacy[]>([]);
    const [loading, setLoading] = useState(false);

    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), 'dd/MM/yyyy HH:mm', { locale: es });
        } catch {
            return 'Fecha inválida';
        }
    };

    const cargarComentarios = async () => {
        if (!lead) return;
        
        setLoading(true);
        try {
            const response = await fetch(`/comercial/leads/${lead.id}/comentarios`, {
                headers: {
                    'Accept': 'application/json',
                    'X-Requested-With': 'XMLHttpRequest'
                }
            });
            
            if (response.ok) {
                const data = await response.json();
                setComentarios(data.comentarios || []);
                setComentariosLegacy(data.comentariosLegacy || []);
            }
        } catch (error) {
            console.error('Error al cargar comentarios:', error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (isOpen && lead) {
            cargarComentarios();
        }
    }, [isOpen, lead]);

    // Controlar scroll del body
    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen || !lead) return null;

    return (
            <>
        {/* Fondo oscuro */}
        <div 
            className="fixed inset-0 bg-black/60 z-[99990]"
            onClick={onClose}
        />
                <div className="fixed inset-0 flex items-center justify-center p-4 z-[99999] pointer-events-none" >
                    <div 
                    className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-fadeIn pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                    >
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-50 rounded-lg">
                            <MessageSquare className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                            <h2 className="text-xl font-semibold text-gray-900">
                                Comentarios del Lead
                            </h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {lead.nombre_completo} • ID: {lead.id}
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

                {/* Contenido */}
                <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                    {/* Botón para agregar nuevo comentario */}
                    {onAddNewComment && (
                        <div className="mb-6">
                            <button
                                onClick={onAddNewComment}
                                className="px-4 py-2 bg-sat text-white text-sm rounded-md hover:bg-sat-600 transition-colors flex items-center gap-2"
                            >
                                <Plus className="h-4 w-4" />
                                Agregar Nuevo Comentario
                            </button>
                        </div>
                    )}
                    
                    {/* Lista de comentarios */}
                    <div>
                        <h4 className="font-medium text-gray-900 mb-4 text-lg">Comentarios Registrados</h4>
                        
                        {loading ? (
                            <div className="text-center py-12">
                                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-sat mx-auto mb-4"></div>
                                <p className="text-gray-500">Cargando comentarios...</p>
                            </div>
                        ) : comentarios.length === 0 && comentariosLegacy.length === 0 ? (
                            <div className="text-center py-12">
                                <MessageSquare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No hay comentarios registrados
                                </h3>
                                <p className="text-gray-600 max-w-md mx-auto">
                                    Este lead aún no tiene comentarios. Puede agregar el primero usando el botón superior.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Comentarios nuevos */}
                                {comentarios.map(comentario => (
                                    <div key={`nuevo-${comentario.id}`} className="bg-white border border-gray-200 rounded-lg p-4 hover:border-gray-300 transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1 bg-blue-100 rounded">
                                                    <MessageSquare className="h-4 w-4 text-blue-600" />
                                                </div>
                                                <span className="font-medium text-gray-900">
                                                    {comentario.tipo_comentario?.nombre || 'Comentario'}
                                                </span>
                                            </div>
                                            <span className="text-sm text-gray-500 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(comentario.created)}
                                            </span>
                                        </div>
                                        
                                        <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                                            {comentario.comentario}
                                        </p>
                                        
                                        <div className="flex items-center justify-between text-sm">
                                            <div className="flex items-center gap-2 text-gray-500">
                                                <User className="h-3 w-3" />
                                                <span>{comentario.usuario?.nombre || 'Usuario'}</span>
                                            </div>
                                            <span className="px-2 py-1 bg-blue-50 text-blue-700 text-xs rounded">
                                                Comentario actual
                                            </span>
                                        </div>
                                    </div>
                                ))}

                                {/* Comentarios legacy */}
                                {comentariosLegacy.map(comentario => (
                                    <div key={`legacy-${comentario.id}`} className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center gap-2">
                                                <div className="p-1 bg-gray-200 rounded">
                                                    <MessageSquare className="h-4 w-4 text-gray-600" />
                                                </div>
                                                <span className="font-medium text-gray-900">
                                                    Comentario Legacy
                                                </span>
                                            </div>
                                            <span className="text-sm text-gray-500 flex items-center gap-1">
                                                <Clock className="h-3 w-3" />
                                                {formatDate(comentario.created)}
                                            </span>
                                        </div>
                                        
                                        <p className="text-gray-700 mb-3 whitespace-pre-wrap">
                                            {comentario.comentario}
                                        </p>
                                        
                                        <div className="flex justify-end">
                                            <span className="px-2 py-1 bg-gray-200 text-gray-700 text-xs rounded">
                                                Sistema anterior
                                            </span>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer */}
                <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                    <div className="flex justify-between items-center">
                        <div className="text-sm text-gray-600">
                            Total: {comentarios.length + comentariosLegacy.length} comentarios
                        </div>
                        <button
                            onClick={onClose}
                            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </div>
      </>  );
}