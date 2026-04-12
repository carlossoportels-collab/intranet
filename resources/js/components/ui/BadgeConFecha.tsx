// resources/js/components/ui/BadgeConFecha.tsx
import React from 'react';
import { MessageSquare, FileText } from 'lucide-react';

interface BadgeConFechaProps {
  type: 'comentarios' | 'presupuestos';
  count: number;
  lastDate: string | null;
  lastDateFormatted?: string | null;  // ✅ Nueva prop opcional
  onClick?: () => void;
}

const BadgeConFecha: React.FC<BadgeConFechaProps> = ({ 
  type, 
  count, 
  lastDate, 
  lastDateFormatted,
  onClick 
}) => {
  const Icon = type === 'comentarios' ? MessageSquare : FileText;
  const colors = type === 'comentarios' 
    ? 'bg-green-100 text-green-800 hover:bg-green-200'
    : 'bg-blue-100 text-blue-800 hover:bg-blue-200';
  
  // Usar la fecha formateada del backend si existe
  const displayDate = lastDateFormatted;
  
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2 py-1 rounded text-xs font-medium ${colors} transition-colors`}
      title={`${type === 'comentarios' ? 'Comentarios' : 'Presupuestos'}: ${count} total. Último: ${lastDate ? new Date(lastDate).toLocaleString('es-ES') : 'N/A'}`}
    >
      <Icon className="h-3 w-3" />
      <span>{count}</span>
      {displayDate && (
        <>
          <span className="text-gray-400">•</span>
          <span className="text-xs opacity-75">{displayDate}</span>
        </>
      )}
    </button>
  );
};

export default BadgeConFecha;