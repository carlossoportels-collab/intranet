// resources/js/components/leads/tabs/NotasTab.tsx
import { MessageSquare, User, Clock } from 'lucide-react';
import React from 'react';

interface Nota {
  id: number;
  observacion: string;
  tipo: string;
  usuario_nombre: string;
  created: string;
}

interface NotasTabProps {
  notas: Nota[];
  onNuevoComentario: () => void;
}

const NotasTab: React.FC<NotasTabProps> = ({ notas, onNuevoComentario }) => {
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

  const getTipoNotaLabel = (tipo: string) => {
    const tipos: Record<string, string> = {
      'informacion_cliente': 'Info Cliente',
      'detalle_contacto': 'Detalle Contacto',
      'observacion_inicial': 'Nota Inicial',
      'seguimiento': 'Seguimiento',
      'recordatorio': 'Recordatorio'
    };
    return tipos[tipo] || tipo || 'Nota';
  };

  if (notas.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <MessageSquare className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay notas</h3>
        <p className="text-gray-600 text-sm mb-4">
          Este lead no tiene notas registradas.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="space-y-4">
        {notas.map((nota) => (
          <div
            key={nota.id}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-sm transition-shadow"
          >
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 mb-3">
              <div className="flex items-center gap-2">
                <div className="bg-blue-100 p-1.5 rounded-full">
                  <User className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">
                    {nota.usuario_nombre || 'Usuario desconocido'}
                  </p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <Clock className="h-3 w-3 text-gray-400" />
                    <p className="text-xs text-gray-500">
                      {formatFecha(nota.created)}
                    </p>
                  </div>
                </div>
              </div>
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded self-start">
                {getTipoNotaLabel(nota.tipo)}
              </span>
            </div>
            
            <div className="mt-2 pl-2 border-l-2 border-blue-200">
              <p className="text-sm text-gray-700 whitespace-pre-wrap">
                {nota.observacion}
              </p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotasTab;