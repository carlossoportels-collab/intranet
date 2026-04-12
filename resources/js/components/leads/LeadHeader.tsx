// resources/js/components/leads/LeadHeader.tsx

import { router, Link } from '@inertiajs/react';
import { ArrowLeft, User, UserCheck, Hash, Briefcase, Target, Calendar, Award, Edit, MessageSquare, FileText } from 'lucide-react';
import React, { useState } from 'react';

import LeadCommentModalSelector from './LeadCommentModalSelector';
import { Lead } from '@/types/leads';

interface LeadHeaderProps {
  lead: Lead;
  onEditar: () => void;
  onNuevoComentario: () => void;
  onVolver?: () => void;  // ✅ Nueva prop opcional
  tiposComentario?: any[];
  estadosLead?: any[];
  comentariosExistentes?: number;
  seguimientoPerdida?: any;
  tiposComentarioSeguimiento?: any[];
  estadosLeadSeguimiento?: any[];
}

const LeadHeader: React.FC<LeadHeaderProps> = ({
  lead,
  onEditar,
  onNuevoComentario,
  onVolver,  // ✅ Recibir la función
  tiposComentario = [],
  estadosLead = [],
  comentariosExistentes = 0,
  seguimientoPerdida = null,
  tiposComentarioSeguimiento = [],
  estadosLeadSeguimiento = []
}) => {
  const [modalSelectorOpen, setModalSelectorOpen] = useState(false);

  const handleVolver = () => {
    if (onVolver) {
      onVolver();  // ✅ Usar la función personalizada si existe
    } else {
      window.history.back();  // ✅ Fallback: volver atrás en el historial
    }
  };

  const handleAbrirModalComentario = () => {
    setModalSelectorOpen(true);
  };

  const getBadgeEstado = () => {
    if (lead.estado_lead?.color_hex) {
      const colorHex = lead.estado_lead.color_hex.startsWith('#') 
        ? lead.estado_lead.color_hex 
        : `#${lead.estado_lead.color_hex}`;
      return (
        <span 
          className="px-3 py-1 text-sm rounded-full"
          style={{ 
            backgroundColor: `${colorHex}20`,
            color: colorHex,
            border: `1px solid ${colorHex}40`
          }}
        >
          {lead.estado_lead.nombre}
        </span>
      );
    }

    return (
      <span className="px-3 py-1 text-sm rounded-full bg-gray-100 text-gray-800">
        {lead.estado_lead?.nombre || 'Sin estado'}
      </span>
    );
  };

  const getIconoGenero = () => {
    switch(lead.genero) {
      case 'masculino': return <User className="h-5 w-5 text-blue-500" />;
      case 'femenino': return <User className="h-5 w-5 text-pink-500" />;
      default: return <User className="h-5 w-5 text-gray-500" />;
    }
  };

  const formatFecha = (fecha: string) => {
    try {
      return new Date(fecha).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  return (
    <>
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-3 sm:gap-4">
        <div className="flex-1">
          {/* ✅ Botón de volver para móvil */}
          <div className="flex items-center gap-2 mb-2">
            <button
              onClick={handleVolver}
              className="p-1 -ml-1 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded transition-colors sm:hidden"
              title="Volver"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
              Lead #{lead.id}
            </h1>
            {getBadgeEstado()}
            {lead.es_cliente && (
              <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full flex items-center gap-1">
                <Award className="h-3 w-3" />
                Cliente
              </span>
            )}
          </div>
          
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
            <h2 className="text-lg sm:text-xl font-semibold text-gray-800 flex items-center gap-2">
              {getIconoGenero()}
              {lead.nombre_completo}
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <UserCheck className="h-4 w-4" />
              <div>
                  <span>Asignado a: {lead.asignado_nombre || 'Sin asignar'}</span>
                  {lead.prefijo?.codigo && (
                      <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          <Hash className="h-3 w-3 inline mr-1" />
                          {lead.prefijo.codigo}
                      </span>
                  )}
              </div>
            </div>
          </div>
          
          <div className="flex flex-wrap items-center gap-2 mt-2 text-sm text-gray-600">
            {lead.rubro?.nombre && (
              <span className="flex items-center gap-1">
                <Briefcase className="h-4 w-4" />
                {lead.rubro.nombre}
              </span>
            )}
            {lead.origen?.nombre && (
              <span className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                Origen: {lead.origen.nombre}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              Creado: {formatFecha(lead.created)}
            </span>
          </div>
        </div>
        
        {/* Acciones */}
        <div className="flex items-center gap-2">
          {/* ✅ Botón de volver para desktop */}
          <button
            onClick={handleVolver}
            className="hidden sm:flex items-center gap-2 px-3 sm:px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 text-sm transition-colors"
            title="Volver"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Volver</span>
          </button>

          <Link
            href={`/comercial/presupuestos/create?lead_id=${lead.id}`}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm"
          >
            <FileText className="h-4 w-4" />
            <span className="hidden sm:inline">Presupuesto</span>
          </Link>

          <button
            onClick={onEditar}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm"
          >
            <Edit className="h-4 w-4" />
            <span className="hidden sm:inline">Editar</span>
          </button>
          
          <button
            onClick={handleAbrirModalComentario}
            className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm"
          >
            <MessageSquare className="h-4 w-4" />
            <span className="hidden sm:inline">Comentario</span>
          </button>
        </div>
      </div>

      {/* Modal Selector */}
      <LeadCommentModalSelector
        isOpen={modalSelectorOpen}
        onClose={() => setModalSelectorOpen(false)}
        lead={lead}
        tiposComentario={tiposComentario}
        estadosLead={estadosLead}
        comentariosExistentes={comentariosExistentes}
        onSuccess={() => {
          router.reload({ only: ['lead', 'comentarios', 'estadisticas'] });
          setModalSelectorOpen(false);
        }}
        seguimiento={seguimientoPerdida}
        tiposComentarioSeguimiento={tiposComentarioSeguimiento}
        estadosLeadSeguimiento={estadosLeadSeguimiento}
      />
    </>
  );
};

export default LeadHeader;