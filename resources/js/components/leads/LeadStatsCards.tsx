// resources/js/components/leads/LeadStatsCards.tsx
import { MessageSquare, Bell, AlertCircle, FileText } from 'lucide-react';
import React from 'react';

interface LeadStatsCardsProps {
  estadisticas: {
    total_presupuestos: number;
    total_comentarios: number;
    total_notificaciones: number;
    notificaciones_no_leidas: number;
    total_presupuestos_con_pdf?: number;
    total_importe_presupuestos?: string;
  };
}

const LeadStatsCards: React.FC<LeadStatsCardsProps> = ({ estadisticas }) => {
  const stats = [
    {
      id: 'presupuestos',
      label: 'Presupuestos',
      value: estadisticas.total_presupuestos,
      sublabel: estadisticas.total_presupuestos_con_pdf ? `${estadisticas.total_presupuestos_con_pdf} con PDF` : undefined,
      icon: FileText,
      color: 'text-blue-500',
    },
    {
      id: 'comentarios',
      label: 'Comentarios',
      value: estadisticas.total_comentarios,
      icon: MessageSquare,
      color: 'text-purple-500',
    },
    {
      id: 'notificaciones',
      label: 'Notificaciones',
      value: estadisticas.total_notificaciones,
      icon: Bell,
      color: 'text-orange-500',
    },
    {
      id: 'no_leidas',
      label: 'No leídas',
      value: estadisticas.notificaciones_no_leidas,
      icon: AlertCircle,
      color: 'text-red-500',
    }
  ].filter(stat => {
    // Mostrar siempre presupuestos (aunque sea 0)
    if (stat.id === 'presupuestos') return true;
    // Para el resto, solo mostrar si tienen valor > 0
    return stat.value > 0;
  });

  if (stats.length === 0) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 w-full">
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <div
            key={stat.id}
            className="bg-white rounded-lg border border-gray-200 p-2 w-full hover:shadow-sm transition-shadow"
          >
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0 pr-1">
                <p className="text-xs text-gray-500 truncate">{stat.label}</p>
                <p className="text-base sm:text-lg font-bold text-gray-900">
                  {stat.value}
                </p>
                {stat.sublabel && (
                  <p className="text-xs text-gray-500 truncate mt-0.5">
                    {stat.sublabel}
                  </p>
                )}
              </div>
              <Icon className={`h-6 w-6 sm:h-7 sm:w-7 ${stat.color} flex-shrink-0`} />
            </div>
            {stat.id === 'presupuestos' && estadisticas.total_importe_presupuestos && (
              <div className="mt-1 text-[10px] text-gray-600 truncate border-t border-gray-100 pt-1">
                {estadisticas.total_importe_presupuestos}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default LeadStatsCards;