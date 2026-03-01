// resources/js/components/leads/tabs/TiemposTab.tsx
import { Clock, TrendingUp, BarChart3, Target } from 'lucide-react';
import React from 'react';

import { useLeadTiempos } from '@/hooks/useLeadTiempos';

interface TiemposTabProps {
  leadId: number;
  puedeVer: boolean;
}

const TiemposTab: React.FC<TiemposTabProps> = ({ leadId, puedeVer }) => {
  const { tiempos, cargando, error, estadisticas } = useLeadTiempos(leadId, puedeVer);

  if (!puedeVer) {
    return (
      <div className="p-6 text-center">
        <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <p className="text-gray-600">No tienes permisos para ver esta información.</p>
      </div>
    );
  }

  if (cargando) {
    return (
      <div className="p-6 text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="text-gray-600 mt-4 text-sm">Cargando tiempos entre estados...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6 text-center">
        <div className="bg-red-50 text-red-600 p-4 rounded-lg">
          <p className="font-medium">Error al cargar los datos</p>
          <p className="text-sm mt-1">{error}</p>
        </div>
      </div>
    );
  }

  if (tiempos.length === 0) {
    return (
      <div className="p-6 text-center">
        <Clock className="h-12 w-12 text-gray-300 mx-auto mb-3" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No hay datos de transiciones</h3>
        <p className="text-gray-600 text-sm">
          No se han registrado cambios de estado para este lead.
        </p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6">
      <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
        <TrendingUp className="h-5 w-5" />
        Tiempos entre Estados
      </h3>
      
      {/* Estadísticas */}
      {estadisticas && (
        <div className="mb-6">
          <h4 className="text-sm font-medium text-gray-700 mb-3">Estadísticas</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <StatCard
              icon={<BarChart3 className="h-5 w-5 text-blue-600" />}
              title="Total cambios"
              value={estadisticas.totalCambios}
              bgColor="bg-blue-50"
              textColor="text-blue-600"
            />
            <StatCard
              icon={<Clock className="h-5 w-5 text-green-600" />}
              title="Total días"
              value={estadisticas.totalDias}
              bgColor="bg-green-50"
              textColor="text-green-600"
            />
            <StatCard
              icon={<Target className="h-5 w-5 text-purple-600" />}
              title="Promedio"
              value={`${estadisticas.promedioDias} días`}
              bgColor="bg-purple-50"
              textColor="text-purple-600"
            />
            <StatCard
              icon={<BarChart3 className="h-5 w-5 text-orange-600" />}
              title="Rango"
              value={`${estadisticas.minimoDias} - ${estadisticas.maximoDias} días`}
              bgColor="bg-orange-50"
              textColor="text-orange-600"
            />
          </div>
        </div>
      )}
      
      {/* Lista de transiciones */}
      <div>
        <h4 className="text-sm font-medium text-gray-700 mb-3">Transiciones de estado</h4>
        <div className="space-y-3">
          {tiempos.map((tiempo, index) => (
            <TransicionCard key={index} tiempo={tiempo} />
          ))}
        </div>
      </div>
    </div>
  );
};

const StatCard: React.FC<{
  icon: React.ReactNode;
  title: string;
  value: string | number;
  bgColor: string;
  textColor: string;
}> = ({ icon, title, value, bgColor, textColor }) => (
  <div className={`${bgColor} p-4 rounded-lg border`}>
    <div className="flex items-center gap-2 mb-2">
      {icon}
      <span className={`text-sm font-medium ${textColor}`}>{title}</span>
    </div>
    <p className={`text-2xl font-bold ${textColor}`}>{value}</p>
  </div>
);

const TransicionCard: React.FC<{ tiempo: any }> = ({ tiempo }) => {
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

  return (
    <div className="border-l-2 border-blue-300 pl-4 py-3 hover:bg-gray-50 rounded-r">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-sm font-medium text-gray-700 bg-gray-100 px-3 py-1.5 rounded-lg">
              {tiempo.desde}
            </span>
            <span className="text-gray-400">→</span>
            <span className="text-sm font-medium text-gray-700 bg-blue-100 px-3 py-1.5 rounded-lg">
              {tiempo.hasta}
            </span>
          </div>
          {tiempo.razon && (
            <p className="text-xs text-gray-500 mt-2">
              <span className="font-medium">Razón:</span> {tiempo.razon}
            </p>
          )}
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 text-sm text-gray-600 bg-gray-100 px-3 py-1.5 rounded-lg">
            <Clock className="h-4 w-4" />
            <span className="font-medium">{tiempo.dias}</span> día{tiempo.dias !== 1 ? 's' : ''}
            {tiempo.horas > 0 && <span>, {tiempo.horas}h</span>}
            {tiempo.minutos > 0 && <span> {tiempo.minutos}m</span>}
          </div>
          <div className="text-sm text-gray-500">
            {formatFecha(tiempo.fecha_cambio)}
          </div>
        </div>
      </div>
    </div>
  );
};

export default TiemposTab;