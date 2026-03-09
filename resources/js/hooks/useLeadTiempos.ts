// resources/js/hooks/useLeadTiempos.ts
import { useState, useEffect, useCallback } from 'react';

interface TiempoEstado {
  desde: string;
  hasta: string;
  dias: number;
  horas: number;
  minutos: number;
  fecha_cambio: string;
  razon?: string;
}

interface EstadisticasTiempos {
  totalCambios: number;
  totalDias: number;
  totalHoras: number;
  totalMinutos: number;
  promedioDias: number;
}

export const useLeadTiempos = (leadId: number, puedeVer: boolean) => {
  const [tiempos, setTiempos] = useState<TiempoEstado[]>([]);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [estadisticas, setEstadisticas] = useState<EstadisticasTiempos | null>(null);

  const calcularEstadisticas = (data: TiempoEstado[]): EstadisticasTiempos | null => {
    if (data.length === 0) return null;
    
    // Calcular tiempo total real en días (con decimales)
    const fechas = data.map(t => new Date(t.fecha_cambio).getTime());
    const primeraFecha = Math.min(...fechas);
    const ultimaFecha = Math.max(...fechas);
    const diffMs = ultimaFecha - primeraFecha;
    const diffHoras = diffMs / (1000 * 60 * 60);
    const totalDiasReales = diffHoras / 24;
    
    // Para mostrar en días enteros + horas/minutos
    const totalDias = Math.floor(totalDiasReales);
    const restoHoras = (totalDiasReales - totalDias) * 24;
    const totalHoras = Math.floor(restoHoras);
    const totalMinutos = Math.floor((restoHoras - totalHoras) * 60);
    
    // Calcular promedio usando los días reales
    const promedioDias = totalDiasReales / data.length;
    
    return {
      totalCambios: data.length,
      totalDias,
      totalHoras,
      totalMinutos,
      promedioDias: Number(promedioDias.toFixed(1))
    };
  };

  const cargarTiempos = useCallback(async () => {
    if (!leadId || !puedeVer) return;
    
    setCargando(true);
    setError(null);
    
    try {
      const response = await fetch(`/comercial/leads/${leadId}/tiempos-estados`, {
        headers: {
          'Accept': 'application/json',
          'X-Requested-With': 'XMLHttpRequest'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Error ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      if (Array.isArray(data)) {
        setTiempos(data);
        setEstadisticas(calcularEstadisticas(data));
      } else if (data.error) {
        throw new Error(data.error);
      } else {
        console.warn('Formato de respuesta inesperado:', data);
        setTiempos([]);
        setEstadisticas(null);
      }
    } catch (err) {
      console.error('Error cargando tiempos:', err);
      setError(err instanceof Error ? err.message : 'Error al cargar los datos');
      setTiempos([]);
      setEstadisticas(null);
    } finally {
      setCargando(false);
    }
  }, [leadId, puedeVer]);

  useEffect(() => {
    if (puedeVer) {
      cargarTiempos();
    }
  }, [puedeVer, leadId, cargarTiempos]);

  return {
    tiempos,
    cargando,
    error,
    estadisticas,
    recargar: cargarTiempos
  };
};