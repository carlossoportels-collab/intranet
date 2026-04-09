// resources/js/components/leads/tabs/NotificacionesTab.tsx

import { Bell, Calendar, ChevronRight, Clock, AlertCircle } from 'lucide-react';
import { router } from '@inertiajs/react';
import React from 'react';

interface NotificacionProgramada {
  id: number;
  titulo: string;
  mensaje: string;
  prioridad?: string;
  fecha_notificacion: string;
  dias_faltantes?: number;
  tipo: string;
  entidad_tipo?: string;
  entidad_id?: number;
  lead_id?: number;
  lead_nombre?: string;
}

interface NotificacionesTabProps {
  notificaciones: NotificacionProgramada[];
  leadId: number;
}

const NotificacionesTab: React.FC<NotificacionesTabProps> = ({ notificaciones, leadId }) => {
  
  const formatFecha = (fecha: string) => {
    try {
      const fechaObj = new Date(fecha);
      const hoy = new Date();
      
      if (fechaObj.toDateString() === hoy.toDateString()) {
        return `Hoy ${fechaObj.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
      }
      
      return fechaObj.toLocaleDateString('es-ES', {
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

  // 🔥 FUNCIÓN PARA CALCULAR DÍAS ENTEROS EN EL FRONTEND
  const getDiasEnteros = (fechaString: string): number => {
    const fecha = new Date(fechaString);
    const ahora = new Date();
    const diffMs = fecha.getTime() - ahora.getTime();
    const diffDias = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
    return diffDias;
  };

  // 🔥 FUNCIÓN PARA OBTENER BADGE SEGÚN DÍAS
  const getBadgeDias = (fechaString: string) => {
    const dias = getDiasEnteros(fechaString);
    
    if (dias <= 0) {
      return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full font-medium">🔥 Hoy/Hace momentos</span>;
    }
    
    if (dias === 1) {
      return <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full font-medium">⚠️ Mañana</span>;
    }
    
    if (dias <= 3) {
      return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">📅 En {dias} días</span>;
    }
    
    if (dias <= 7) {
      return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">📅 En {dias} días</span>;
    }
    
    if (dias <= 15) {
      return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">📅 En {dias} días</span>;
    }
    
    return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">📅 En {dias} días</span>;
  };

  const getBadgePrioridad = (prioridad: string) => {
    switch(prioridad?.toLowerCase()) {
      case 'urgente':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Urgente</span>;
      case 'alta':
        return <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">Alta</span>;
      case 'normal':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Normal</span>;
      case 'baja':
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">Baja</span>;
      default:
        return null;
    }
  };

  const getIconoPorTipo = (tipo: string) => {
    switch(tipo) {
      case 'lead_sin_contactar':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'lead_proximo_contacto':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'presupuesto_por_vencer':
      case 'presupuesto_vencido':
        return <AlertCircle className="h-5 w-5 text-yellow-500" />;
      case 'recordatorio_seguimiento':
        return <Calendar className="h-5 w-5 text-purple-500" />;
      case 'lead_posible_recontacto':
        return <AlertCircle className="h-5 w-5 text-cyan-500" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const navegarARecordatorio = (notificacion: NotificacionProgramada) => {
    if (notificacion.entidad_tipo === 'comentario' && notificacion.entidad_id) {
      router.visit(`/comercial/leads/${leadId}`, {
        preserveScroll: true,
        onFinish: () => {
          setTimeout(() => {
            document.getElementById('comentarios-list')?.scrollIntoView({ behavior: 'smooth' });
          }, 500);
        }
      });
    } else {
      router.reload();
    }
  };

  if (notificaciones.length === 0) {
    return (
      <div className="p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-gray-100 rounded-full mb-4">
          <Calendar className="h-8 w-8 text-gray-400" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sin recordatorios programados</h3>
        <p className="text-gray-600 text-sm">
          Este lead no tiene recordatorios programados.
        </p>
        <p className="text-xs text-gray-500 mt-2">
          Los recordatorios se generan automáticamente cuando agregas comentarios con fecha de seguimiento.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <Calendar className="h-5 w-5" />
          Recordatorios Programados ({notificaciones.length})
        </h3>
      </div>

      <div className="space-y-3">
        {notificaciones.map((notif) => (
          <div
            key={notif.id}
            onClick={() => navegarARecordatorio(notif)}
            className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-all cursor-pointer bg-white"
          >
            <div className="flex flex-col sm:flex-row sm:items-start gap-3">
              {/* Icono */}
              <div className="flex-shrink-0">
                {getIconoPorTipo(notif.tipo)}
              </div>
              
              {/* Contenido */}
              <div className="flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                    {notif.titulo}
                  </h4>
                  
                  {/*  BADGE DE DÍAS - CALCULADO EN FRONTEND */}
                  {notif.fecha_notificacion && getBadgeDias(notif.fecha_notificacion)}
                </div>
                
                <p className="text-sm text-gray-600 mb-2">
                  {notif.mensaje}
                </p>
                
                <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    <span>{formatFecha(notif.fecha_notificacion)}</span>
                  </div>
                  
                  {notif.prioridad && getBadgePrioridad(notif.prioridad)}
                  
                  {notif.lead_nombre && (
                    <span className="text-gray-400">
                      Lead: {notif.lead_nombre}
                    </span>
                  )}
                </div>
              </div>
              
              {/* Indicador de clic */}
              <ChevronRight className="hidden sm:block h-5 w-5 text-gray-400 flex-shrink-0" />
            </div>
          </div>
        ))}
      </div>
      
      <div className="mt-4 p-3 bg-blue-50 rounded-lg text-xs text-blue-700">
        <p>Los recordatorios se generan al agregar comentarios con fecha de seguimiento. 
        Haz clic en cualquier recordatorio para ir al detalle.</p>
      </div>
    </div>
  );
};

export default NotificacionesTab;