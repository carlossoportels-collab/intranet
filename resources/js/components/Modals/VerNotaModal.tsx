// resources/js/components/Modals/VerNotaModal.tsx
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { X, FileText, Calendar, User, AlertCircle } from 'lucide-react';
import React from 'react';

import { Lead, NotaLead } from '@/types/leads';

interface VerNotaModalProps {
    isOpen: boolean;
    onClose: () => void;
    lead: Lead | null;
}

const VerNotaModal: React.FC<VerNotaModalProps> = ({
    isOpen,
    onClose,
    lead
}) => {
    if (!isOpen || !lead) return null;

    // Obtener todas las notas ordenadas por fecha (más reciente primero)
    const obtenerNotasOrdenadas = (): NotaLead[] => {
        if (!lead.notas || !Array.isArray(lead.notas)) {
            return [];
        }
        
        return [...lead.notas]
            .filter(nota => !nota.deleted_at) // Filtrar notas eliminadas
            .sort((a, b) => new Date(b.created).getTime() - new Date(a.created).getTime());
    };

    const notas = obtenerNotasOrdenadas();

    // Función para formatear fecha
    const formatDate = (dateString: string) => {
        try {
            return format(new Date(dateString), "dd 'de' MMMM 'de' yyyy 'a las' HH:mm", { locale: es });
        } catch {
            return 'Fecha inválida';
        }
    };

    // Función para obtener el texto del tipo de nota
    const getTipoNotaText = (tipo: string) => {
        const tipos: Record<string, string> = {
            'informacion_cliente': 'Información del Cliente',
            'detalle_contacto': 'Detalle del Contacto',
            'observacion_inicial': 'Nota Inicial'
        };
        return tipos[tipo] || 'Nota';
    };

    // Función para obtener el color del tipo de nota
    const getTipoNotaColor = (tipo: string) => {
        const colores: Record<string, string> = {
            'informacion_cliente': 'bg-blue-100 text-blue-800 border-blue-200',
            'detalle_contacto': 'bg-green-100 text-green-800 border-green-200',
            'observacion_inicial': 'bg-purple-100 text-purple-800 border-purple-200'
        };
        return colores[tipo] || 'bg-gray-100 text-gray-800 border-gray-200';
    };

    // Función para obtener el nombre completo del usuario
    const getNombreUsuario = (nota: NotaLead): string => {
        if (nota.usuario && nota.usuario.personal) {
            return `${nota.usuario.personal.nombre} ${nota.usuario.personal.apellido}`;
        }
        
        // Si no hay datos de personal, mostrar el nombre de usuario
        if (nota.usuario && nota.usuario.nombre_usuario) {
            return nota.usuario.nombre_usuario;
        }
        
        return `Usuario #${nota.usuario_id}`;
    };

    // Función para obtener las iniciales del usuario
    const getInicialesUsuario = (nota: NotaLead): string => {
        if (nota.usuario && nota.usuario.personal) {
            const { nombre, apellido } = nota.usuario.personal;
            return `${nombre.charAt(0)}${apellido.charAt(0)}`.toUpperCase();
        }
        
        if (nota.usuario && nota.usuario.nombre_usuario) {
            return nota.usuario.nombre_usuario.substring(0, 2).toUpperCase();
        }
        
        return 'U#';
    };

    return (
        <>
            {/* Overlay */}
            <div 
                className="fixed inset-0 bg-black/60 z-[99990]"
                onClick={onClose}
            />
            
            {/* Modal */}
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[99999] pointer-events-none">
                <div 
                    className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fadeIn pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-purple-100 rounded-lg">
                                <FileText className="h-6 w-6 text-purple-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Notas del Lead
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
                        {notas.length === 0 ? (
                            <div className="text-center py-8">
                                <div className="text-gray-400 mb-4">
                                    <AlertCircle className="h-12 w-12 mx-auto" />
                                </div>
                                <h3 className="text-lg font-medium text-gray-900 mb-2">
                                    No hay notas registradas
                                </h3>
                                <p className="text-gray-600">
                                    Este lead no tiene notas asociadas.
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Información del lead */}
                                <div className="bg-gray-50 p-4 rounded-lg">
                                    <h3 className="font-medium text-gray-900 mb-2">
                                        Información del Lead
                                    </h3>
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm">
                                        <div>
                                            <p className="text-gray-600">Nombre completo</p>
                                            <p className="font-medium">{lead.nombre_completo}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Email</p>
                                            <p className="font-medium">{lead.email || 'No especificado'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Teléfono</p>
                                            <p className="font-medium">{lead.telefono || 'No especificado'}</p>
                                        </div>
                                        <div>
                                            <p className="text-gray-600">Género</p>
                                            <p className="font-medium capitalize">{lead.genero.replace('_', ' ')}</p>
                                        </div>
                                    </div>
                                </div>

                                {/* Lista de notas */}
                                <div>
                                    <div className="flex items-center justify-between mb-4">
                                        <h3 className="font-medium text-gray-900">
                                            Notas registradas ({notas.length})
                                        </h3>
                                    </div>
                                    <div className="space-y-4">
                                        {notas.map((nota) => (
                                            <div 
                                                key={nota.id}
                                                className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors"
                                            >
                                                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-3">
                                                    <div className="flex items-center gap-2">
                                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTipoNotaColor(nota.tipo)}`}>
                                                            {getTipoNotaText(nota.tipo)}
                                                        </span>
                                                    </div>
                                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                                        <Calendar className="h-3 w-3" />
                                                        <span>{formatDate(nota.created)}</span>
                                                    </div>
                                                </div>
                                                
                                                {/* Contenido de la nota */}
                                                <div className="mb-4">
                                                    <p className="text-gray-700 whitespace-pre-line">
                                                        {nota.observacion}
                                                    </p>
                                                </div>
                                                
                                                {/* Información del usuario */}
                                                <div className="flex items-center justify-between text-sm text-gray-600 pt-3 border-t border-gray-100">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex items-center gap-2">
                                                            <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                                                                <span className="text-purple-700 font-medium text-xs">
                                                                    {getInicialesUsuario(nota)}
                                                                </span>
                                                            </div>
                                                            <div>
                                                               <p className="text-xs text-gray-500">
                                                                    Creado por <span className="font-medium text-gray-900"> {getNombreUsuario(nota)}</span>
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                                    <div className="text-xs text-gray-500">
                                                        <span className="font-medium">Lead ID:</span> {nota.lead_id}
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors"
                        >
                            Cerrar
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default VerNotaModal;