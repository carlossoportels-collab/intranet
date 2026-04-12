// components/leads/LeadTableRow.tsx

import { Link } from '@inertiajs/react';
import { Eye, Edit, MessageSquare, FileText, Clock, User } from 'lucide-react';
import React from 'react';

import { BadgeEstado, BadgeOrigen } from '@/components/ui';
import BadgeConFecha from '@/components/ui/BadgeConFecha';

import { Lead, Origen, EstadoLead, ConteoConFecha  } from '@/types/leads';

interface LeadTableRowProps {
  lead: Lead;
  origenes: Origen[];
  estadosLead: EstadoLead[];
  comentariosCount: ConteoConFecha; // ✅ Actualizado
  presupuestosCount: ConteoConFecha; // ✅ Actualizado
  usuario: any;
  onNuevoComentario: (lead: Lead) => void;
  onVerNota: (lead: Lead) => void;
  onTiemposEstados: (lead: Lead) => void;
  mostrarColumnaComercial?: boolean;
  onViewDetail: (lead: Lead) => void; // ✅ NUEVA PROP
}

const LeadTableRow: React.FC<LeadTableRowProps> = ({
  lead,
  origenes,
  estadosLead,
  comentariosCount,
  presupuestosCount,
  usuario,
  onNuevoComentario,
  onVerNota,
  onTiemposEstados,
  mostrarColumnaComercial = false,
  onViewDetail // ✅ NUEVA PROP
}) => {
  const origen = origenes.find(o => o.id === lead.origen_id!);
  const estado = estadosLead.find(e => e.id === lead.estado_lead_id);
  const tieneNotas = lead.notas && Array.isArray(lead.notas) && lead.notas.length > 0;
  
  // Obtener nombre del comercial
  const nombreComercial = lead.asignado_nombre || 'Sin asignar';
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-ES');
    } catch {
      return 'Fecha inválida';
    }
  };
  
  const handleViewDetail = (e: React.MouseEvent) => {
    e.preventDefault();
    onViewDetail(lead);
  };
  
  return (
    <tr className="hover:bg-gray-50 transition-colors">
      {/* Prospecto */}
      <td className="px-4 py-3">
        <div>
          <p className="font-medium text-gray-900">
            {lead.nombre_completo || 'Sin nombre'}
          </p>
          <p className="text-xs text-gray-500">{lead.localidad?.nombre 
          ? `${lead.localidad.nombre}${lead.localidad.provincia?.nombre ? `, ${lead.localidad.provincia.nombre}` : ''}`
          : 'Sin localidad'
        }</p>
        </div>
      </td>
      
      {/* Contacto */}
      <td className="px-4 py-3">
        <div>
          <p className="text-sm text-gray-900">{lead.email || 'Sin email'}</p>
          <p className="text-xs text-gray-500">{lead.telefono || 'Sin teléfono'}</p>
        </div>
      </td>
      
      {/* Estado */}
      <td className="px-4 py-3">
        {estado && <BadgeEstado estado={estado} />}
      </td>
      
{/* PRESUPUESTOS */}
<td className="px-4 py-3 text-center">
  {presupuestosCount && presupuestosCount.total > 0 ? (
    <BadgeConFecha
      type="presupuestos"
      count={presupuestosCount.total}
      lastDate={presupuestosCount.ultimo}
      lastDateFormatted={presupuestosCount.ultimo_formateado}  // ✅ Usar fecha formateada
    />
  ) : (
    <span className="text-xs text-gray-400">-</span>
  )}
</td>

{/* COMENTARIOS */}
<td className="px-4 py-3 text-center">
  {comentariosCount && comentariosCount.total > 0 ? (
    <BadgeConFecha
      type="comentarios"
      count={comentariosCount.total}
      lastDate={comentariosCount.ultimo}
      lastDateFormatted={comentariosCount.ultimo_formateado}  // ✅ Usar fecha formateada
    />
  ) : (
    <span className="text-xs text-gray-400">-</span>
  )}
</td>
      
      {/* COMERCIAL - Solo visible para admins/supervisores */}
      {mostrarColumnaComercial && (
        <td className="px-4 py-3">
          <div className="flex items-center gap-1">
            <User className="h-3 w-3 text-gray-400" />
            <span className="text-sm text-gray-700">{nombreComercial}</span>
          </div>
        </td>
      )}
      
      {/* Registro */}
      <td className="px-4 py-3 text-sm text-gray-500">
        {formatDate(lead.created)}
      </td>
      
      {/* Acciones */}
      <td className="px-4 py-3">
        <div className="flex items-center space-x-2">
          {/* ✅ CAMBIADO: usar onViewDetail en lugar de Link directo */}
          <button 
            onClick={handleViewDetail}
            className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm px-2 py-1 hover:bg-blue-50 rounded transition-colors"
            title="Ver detalles"
          >
            <Eye className="h-4 w-4 mr-1" />
            Detalles
          </button>
          
          <button 
            type="button"
            onClick={() => onNuevoComentario(lead)}
            className="inline-flex items-center text-green-600 hover:text-green-800 text-sm px-2 py-1 hover:bg-green-50 rounded transition-colors"
            title="Nuevo seguimiento"
          >
            <MessageSquare className="h-4 w-4 mr-1" />
            Comentario
          </button>
          
          {tieneNotas && (
            <button 
              type="button"
              onClick={() => onVerNota(lead)}
              className="inline-flex items-center text-purple-600 hover:text-purple-800 text-sm px-2 py-1 hover:bg-purple-50 rounded transition-colors"
              title="Ver nota"
            >
              <FileText className="h-4 w-4 mr-1" />
              Nota
            </button>
          )}

          {usuario.ve_todas_cuentas && (
            <button 
              type="button"
              onClick={() => onTiemposEstados(lead)}
              className="inline-flex items-center text-indigo-600 hover:text-indigo-800 text-sm px-2 py-1 hover:bg-indigo-50 rounded transition-colors"
              title="Tiempos entre estados"
            >
              <Clock className="h-4 w-4 mr-1" />
              Tiempos
            </button>
          )}
        </div>
      </td>
    </tr>
  );
};

export default LeadTableRow;