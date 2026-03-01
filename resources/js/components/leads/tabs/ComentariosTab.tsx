// resources/js/components/leads/tabs/ComentariosTab.tsx
import { MessageSquare, User, Clock, Tag } from 'lucide-react';
import React from 'react';

interface Comentario {
  id: number;
  comentario: string;
  tipo_nombre?: string;
  usuario_nombre: string;
  created: string;
}

interface ComentariosTabProps {
  comentarios: Comentario[];
  onNuevoComentario: () => void;
  total: number;
}

const ComentariosTab: React.FC<ComentariosTabProps> = ({
  comentarios,
  onNuevoComentario,
  total
}) => {
  const formatFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  if (comentarios.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <MessageSquare className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay comentarios</h3>
        <p className="text-gray-600 text-sm mb-4">
          Este lead aún no tiene comentarios o seguimientos.
        </p>
        <button
          onClick={onNuevoComentario}
          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <MessageSquare className="h-4 w-4" />
          Agregar primer comentario
        </button>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">
          Comentarios y Seguimientos ({total})
        </h3>
        <button
          onClick={onNuevoComentario}
          className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
        >
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Nuevo comentario</span>
          <span className="sm:hidden">Nuevo</span>
        </button>
      </div>

      <div className="space-y-4">
        {comentarios.map((comentario) => (
          <div
            key={comentario.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-green-100 p-1.5 rounded-full">
                  <User className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {comentario.usuario_nombre || 'Usuario desconocido'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <p className="text-xs text-gray-500">
                      {formatFecha(comentario.created)}
                    </p>
                  </div>
                </div>
              </div>
              {comentario.tipo_nombre && (
                <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-600 px-2 py-1 rounded self-start">
                  <Tag className="h-3 w-3" />
                  {comentario.tipo_nombre}
                </span>
              )}
            </div>
            
            <div className="mt-2 pl-2 border-l-2 border-green-200">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {comentario.comentario}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ComentariosTab;