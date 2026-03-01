// components/leads/PipelineStatistics.tsx
import React from 'react';

interface PipelineStatisticsProps {
  estadisticas: {
    total: number;
    nuevo: number;
    contactado: number;
    seguimiento: number;
    propuesta: number;
    negociacion: number;
    pausado: number;
  };
  estadosLead?: Array<{  // ← Recibir los estados con sus colores
    id: number;
    nombre: string;
    color_hex?: string;
    tipo?: string;
  }>;
}

const PipelineStatistics: React.FC<PipelineStatisticsProps> = ({ estadisticas, estadosLead = [] }) => {
  // Mapear los nombres de las estadísticas a los nombres de estados
  const stageMapping = [
    { key: 'nuevo', label: 'Nuevo', statKey: 'nuevo' },
    { key: 'contactado', label: 'Contactado', statKey: 'contactado' },
    { key: 'seguimiento', label: 'Seguimiento', statKey: 'seguimiento' },
    { key: 'propuesta', label: 'Propuesta Enviada', statKey: 'propuesta' },
    { key: 'negociacion', label: 'Negociación', statKey: 'negociacion' },
    { key: 'pausado', label: 'Pausado', statKey: 'pausado' },
  ];

  // Función para obtener el color de un estado por su nombre
  const getColorForEstado = (nombre: string): string | undefined => {
    const estado = estadosLead.find(e => 
      e.nombre.toLowerCase() === nombre.toLowerCase()
    );
    return estado?.color_hex;
  };

  // Función para generar estilos inline basados en color_hex
  const getInlineStyle = (colorHex?: string) => {
    if (!colorHex) return {};
    
    const hexToRgba = (hex: string, opacity: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${opacity})`;
    };

    return {
      backgroundColor: hexToRgba(colorHex, 0.1),
      borderColor: hexToRgba(colorHex, 0.3),
      color: colorHex,
    };
  };

  // Fallback classes si no hay color_hex
  const getFallbackClass = (key: string) => {
    const classes = {
      nuevo: 'bg-gray-50 border-gray-200 text-gray-900',
      contactado: 'bg-blue-50 border-blue-200 text-blue-600',
      seguimiento: 'bg-yellow-50 border-yellow-200 text-yellow-600',
      propuesta: 'bg-purple-50 border-purple-200 text-purple-600',
      negociacion: 'bg-orange-50 border-orange-200 text-orange-600',
      pausado: 'bg-amber-50 border-amber-200 text-amber-600',
    };
    return classes[key as keyof typeof classes] || classes.nuevo;
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2 mb-6">
      {stageMapping.map((stage) => {
        const colorHex = getColorForEstado(stage.label);
        const value = estadisticas[stage.statKey as keyof typeof estadisticas];
        
        return (
          <div 
            key={stage.key}
            className={`p-2 rounded-lg border text-center hover:opacity-90 transition-opacity cursor-pointer ${
              !colorHex ? getFallbackClass(stage.key) : ''
            }`}
            style={colorHex ? getInlineStyle(colorHex) : {}}
            onClick={() => {
            }}
          >
            <h3 className="font-medium text-xs mb-1 truncate">{stage.label}</h3>
            <p className="text-lg md:text-xl font-bold">{value}</p>
          </div>
        );
      })}
    </div>
  );
};

export default PipelineStatistics;