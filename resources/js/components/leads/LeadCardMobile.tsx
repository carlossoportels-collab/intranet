import { Link } from '@inertiajs/react';
import { Eye, Edit, MessageSquare, FileText, Clock } from 'lucide-react';
import React from 'react';

import { BadgeEstado, BadgeOrigen } from '@/components/ui';
import { Lead, Origen, EstadoLead, NotaLead } from '@/types/leads';


interface LeadCardMobileProps {
  lead: Lead;
  origenes: Origen[];
  estadosLead: EstadoLead[];
  comentariosCount: number;
  presupuestosCount: number;
  usuario: any;
  onNuevoComentario: (lead: Lead) => void;
  onVerNota: (lead: Lead) => void;
  onTiemposEstados: (lead: Lead) => void;
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
  onTiemposEstados
}) => {
  const origen = origenes.find(o => o.id === lead.origen_id!);
  const estado = estadosLead.find(e => e.id === lead.estado_lead_id);
  
  const tieneNotas = lead.notas && Array.isArray(lead.notas) && lead.notas.length > 0;
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return new Date(dateString).toLocaleDateString('es-ES');
    } catch {
      return 'Fecha inválida';
    }
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

      {/* Presupuestos */}
      {presupuestosCount > 0 && (
        <div className="mb-3 p-2 bg-blue-50 border border-blue-100 rounded text-xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1 text-blue-700">
              <FileText className="w-3 h-3" />
              <span className="font-medium">Presupuestos: {presupuestosCount}</span>
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
            {presupuestosCount > 0 && (
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded inline-flex items-center gap-1">
                <FileText className="w-3 h-3" />
                {presupuestosCount}
              </span>
            )}
            {comentariosCount > 0 && (
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded inline-flex items-center gap-1">
                <MessageSquare className="w-3 h-3" />
                {comentariosCount}
              </span>
            )}
          </div>
        </div>
        <div className="flex space-x-2">
          <Link 
            href={`/comercial/leads/${lead.id}`}
            className="text-blue-600 hover:text-blue-800 p-1"
            title="Ver detalles"
          >
            <Eye className="h-4 w-4" />
          </Link>
          
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