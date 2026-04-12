import { Link } from '@inertiajs/react';
import { Eye, Edit, MessageSquare, FileText, Clock, User } from 'lucide-react';
import React from 'react';

import { BadgeEstado, BadgeOrigen } from '@/components/ui';
import { Lead, Origen, EstadoLead, NotaLead, ConteoConFecha } from '@/types/leads';
import BadgeConFecha from '@/components/ui/BadgeConFecha';


interface LeadCardMobileProps {
  lead: Lead;
  origenes: Origen[];
  estadosLead: EstadoLead[];
  comentariosCount: ConteoConFecha;
  presupuestosCount: ConteoConFecha;
  usuario: any;
  onNuevoComentario: (lead: Lead) => void;
  onVerNota: (lead: Lead) => void;
  onTiemposEstados: (lead: Lead) => void;
  onViewDetail: (lead: Lead) => void; // ✅ NUEVA PROP
}

const LeadCardMobile: React.FC<LeadCardMobileProps> = ({
  lead,
  origenes,
  estadosLead,
  comentariosCount,
  presupuestosCount,
  usuario,
  onNuevoComentario,
  onVerNota,
  onTiemposEstados,
  onViewDetail // ✅ NUEVA PROP
}) => {
  const origen = origenes.find(o => o.id === lead.origen_id!);
  const estado = estadosLead.find(e => e.id === lead.estado_lead_id);
  
  const tieneNotas = lead.notas && Array.isArray(lead.notas) && lead.notas.length > 0;
  
  // Determinar si mostrar comercial (admin o ve_todas_cuentas)
  const mostrarComercial = usuario.ve_todas_cuentas || usuario.rol_id !== 5;
  
  // Obtener nombre del comercial
  const nombreComercial = lead.prefijo?.codigo 
    ? `${lead.prefijo.codigo}${lead.prefijo.descripcion ? ` - ${lead.prefijo.descripcion}` : ''}`
    : lead.asignado_nombre || 'Sin asignar';
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-ES');
    } catch {
      return 'Fecha inválida';
    }
  };
  
  const handleViewDetail = (e: React.MouseEvent) => {
    onViewDetail(lead);
  };
  
  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
      <div className="flex justify-between items-start mb-3">
        <div>
          <h3 className="font-semibold text-gray-900">
            {lead.nombre_completo || 'Sin nombre'}
          </h3>
          <p className="text-xs text-gray-500 mt-1">ID: {lead.id}</p>
        </div>
      </div>
      
      <div className="space-y-2 mb-3">
        <div className="flex items-center text-sm">
          <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
          </svg>
          <span className="text-gray-600">{lead.email || 'Sin email'}</span>
        </div>
        <div className="flex items-center text-sm">
          <svg className="w-4 h-4 text-gray-400 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
          </svg>
          <span className="text-gray-600">{lead.telefono || 'Sin teléfono'}</span>
        </div>
      </div>
      
      <div className="flex flex-wrap gap-2 mb-3">
        {estado && (
          <BadgeEstado estado={estado} />
        )}
        {origen && (
          <BadgeOrigen origen={origen} />
        )}
      </div>

      {/* Comercial - solo visible para admins/supervisores */}
      {mostrarComercial && (
        <div className="mb-3 p-2 bg-gray-50 border border-gray-200 rounded text-xs">
          <div className="flex items-center gap-2">
            <User className="w-3 h-3 text-gray-500" />
            <span className="text-gray-600 font-medium">Comercial:</span>
            <span className="text-gray-800">{nombreComercial}</span>
          </div>
        </div>
      )}

      {/* Presupuestos */}
      {presupuestosCount.total > 0 && (  // ✅ Usar .total
        <div className="mb-3 p-2 bg-blue-50 border border-blue-100 rounded text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-blue-700">
              <FileText className="w-3 h-3" />
              <span className="font-medium">Presupuestos: {presupuestosCount.total}</span>
              {presupuestosCount.ultimo && (
                <span className="text-xs text-blue-500 ml-1">
                  ({new Date(presupuestosCount.ultimo).toLocaleDateString()})
                </span>
              )}
            </div>
            <Link 
              href={`/presupuestos?lead_id=${lead.id}`}
              className="text-blue-600 hover:text-blue-800 text-xs font-medium"
            >
              Ver todos
            </Link>
          </div>
        </div>
      )}

      {/* Notas */}
      {tieneNotas && (
        <div className="mb-3 p-2 bg-purple-50 border border-purple-100 rounded text-xs">
          <div className="flex items-center gap-1 text-purple-700">
            <FileText className="w-3 h-3" />
            <span className="font-medium">Tiene notas</span>
          </div>
        </div>
      )}
      
      <div className="flex justify-between items-center pt-3 border-t border-gray-100">
        <div className="flex flex-col gap-1">
          <span className="text-xs text-gray-500">
            Registro: {formatDate(lead.created)}
          </span>
          <div className="flex gap-2">
            {presupuestosCount && presupuestosCount.total > 0 && (
              <BadgeConFecha
                type="presupuestos"
                count={presupuestosCount.total}
                lastDate={presupuestosCount.ultimo}
              />
            )}
            {comentariosCount && comentariosCount.total > 0 && (
              <BadgeConFecha
                type="comentarios"
                count={comentariosCount.total}
                lastDate={comentariosCount.ultimo}
              />
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          {/* ✅ CAMBIADO: usar onViewDetail en lugar de Link directo */}
          <button 
            onClick={handleViewDetail}
            className="text-blue-600 hover:text-blue-800 p-1"
            title="Ver detalles"
          >
            <Eye className="h-4 w-4" />
          </button>
          
          <button 
            type="button"
            onClick={() => onNuevoComentario(lead)}
            className="text-green-600 hover:text-green-800 p-1"
            title="Nuevo seguimiento"
          >
            <MessageSquare className="h-4 w-4" />
          </button>
          
          {tieneNotas && (
            <button 
              type="button"
              onClick={() => onVerNota(lead)}
              className="text-purple-600 hover:text-purple-800 p-1"
              title="Ver nota"
            >
              <FileText className="h-4 w-4" />
            </button>
          )}

          {usuario.ve_todas_cuentas && (
            <button 
              type="button"
              onClick={() => onTiemposEstados(lead)}
              className="text-indigo-600 hover:text-indigo-800 p-1"
              title="Tiempos entre estados"
            >
              <Clock className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default LeadCardMobile;