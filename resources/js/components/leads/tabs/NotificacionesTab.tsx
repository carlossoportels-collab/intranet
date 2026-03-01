// resources/js/components/leads/tabs/NotificacionesTab.tsx
import { Bell, Clock } from 'lucide-react';
import React from 'react';

interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  leida: boolean;
  prioridad?: string;
  fecha_notificacion: string;
}

interface NotificacionesTabProps {
  notificaciones: Notificacion[];
}

const NotificacionesTab: React.FC<NotificacionesTabProps> = ({ notificaciones }) => {
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

  if (notificaciones.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <Bell className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay notificaciones</h3>
        <p className="text-gray-600 text-sm">
          Este lead no tiene notificaciones pendientes.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2 mb-4">
        <Bell className="h-5 w-5" />
        Notificaciones ({notificaciones.length})
      </h3>

      <div className="space-y-3">
        {notificaciones.map((notif) => (
          <div
            key={notif.id}
            className={`
              border rounded-lg p-4 transition-all
              ${!notif.leida 
                ? 'bg-blue-50 border-blue-200' 
                : 'bg-white border-gray-200'
              }
            `}
          >
            <div className="flex flex-col gap-2">
              {/* Título */}
              <div className="flex items-center gap-2">
                <Bell className={`h-4 w-4 ${!notif.leida ? 'text-blue-600' : 'text-gray-400'}`} />
                <p className={`font-medium text-sm ${!notif.leida ? 'text-blue-700' : 'text-gray-700'}`}>
                  {notif.titulo}
                </p>
                {!notif.leida && (
                  <span className="text-xs bg-blue-200 text-blue-800 px-2 py-0.5 rounded-full">
                    Nueva
                  </span>
                )}
              </div>

              {/* Mensaje */}
              <p className="text-sm text-gray-600 pl-6">
                {notif.mensaje}
              </p>

              {/* Fecha */}
              <div className="flex items-center gap-1 pl-6 text-xs text-gray-500">
                <Clock className="h-3 w-3" />
                <span>{formatFecha(notif.fecha_notificacion)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default NotificacionesTab;