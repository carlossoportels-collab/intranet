// resources/js/components/leads/tabs/InfoTab.tsx
import {
  User, Mail, Phone, MapPin, Tag, Target, Briefcase,
  UserCheck, Hash, CheckCircle, X, FileText
} from 'lucide-react';
import React from 'react';

import { Lead } from '@/types/leads';

interface InfoTabProps {
  lead: Lead;
}

const InfoTab: React.FC<InfoTabProps> = ({ lead }) => {
  const getLabelGenero = (genero: string) => {
    const generos: Record<string, string> = {
      'masculino': 'Masculino',
      'femenino': 'Femenino',
      'otro': 'Otro',
      'no_especifica': 'No especifica'
    };
    return generos[genero] || genero;
  };

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

  // Formatear número de teléfono para WhatsApp
  const formatWhatsAppUrl = (telefono: string): string => {
    // Eliminar todos los caracteres no numéricos
    let numeroLimpio = telefono.replace(/\D/g, '');
    
    // Si el número tiene 10 dígitos y comienza con 11, agregar código de país 54
    if (numeroLimpio.length === 10 && numeroLimpio.startsWith('11')) {
      numeroLimpio = '549' + numeroLimpio;
    }
    // Si el número tiene 10 dígitos y no comienza con 11, asumir que es de otra provincia
    else if (numeroLimpio.length === 10) {
      numeroLimpio = '549' + numeroLimpio;
    }
    // Si el número tiene 8 dígitos (sin código de área), agregar 54911
    else if (numeroLimpio.length === 8) {
      numeroLimpio = '54911' + numeroLimpio;
    }
    
    return `https://wa.me/${numeroLimpio}`;
  };

  // Abrir WhatsApp
  const openWhatsApp = (telefono: string) => {
    if (!telefono) return;
    const url = formatWhatsAppUrl(telefono);
    window.open(url, '_blank');
  };

  // Obtener nombre de la provincia desde el objeto Provincia
  const getProvinciaNombre = (): string | null => {
    if (!lead.localidad?.provincia) return null;
    
    const provincia = lead.localidad.provincia;
    
    // Si es un string, devolverlo directamente
    if (typeof provincia === 'string') {
      return provincia;
    }
    
    // Si es un objeto, acceder a su propiedad 'nombre'
    if (typeof provincia === 'object' && provincia !== null) {
      return (provincia as any).nombre || null;
    }
    
    return null;
  };

  // Formatear ubicación correctamente
  const getUbicacionTexto = (): string | null => {
    if (!lead.localidad) return null;
    
    let texto = lead.localidad.nombre;
    const provinciaNombre = getProvinciaNombre();
    if (provinciaNombre) {
      texto += `, ${provinciaNombre}`;
    }
    return texto;
  };

  return (
    <div className="p-3 sm:p-6">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        {/* Información personal */}
        <div>
          <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4 flex items-center gap-2">
            <User className="h-4 w-4 sm:h-5 sm:w-5" />
            Información Personal
          </h3>
          
          <div className="space-y-3 sm:space-y-4">
            <InfoRow icon={<User className="h-5 w-5 text-gray-400" />}>
              <p className="text-sm font-medium text-gray-900">{lead.nombre_completo}</p>
              <p className="text-xs text-gray-500">{getLabelGenero(lead.genero)}</p>
            </InfoRow>
            
            {lead.email && (
              <InfoRow icon={<Mail className="h-5 w-5 text-gray-400" />}>
                <a href={`mailto:${lead.email}`} className="text-sm text-blue-600 hover:text-blue-800">
                  {lead.email}
                </a>
                <p className="text-xs text-gray-500">Email</p>
              </InfoRow>
            )}
            
            {lead.telefono && (
              <InfoRow icon={<Phone className="h-5 w-5 text-gray-400" />}>
                <div className="flex items-center gap-2 flex-wrap">
                  <a href={`tel:${lead.telefono}`} className="text-sm text-blue-600 hover:text-blue-800">
                    {lead.telefono}
                  </a>
                  <button
                    onClick={() => openWhatsApp(lead.telefono!)}
                    className="inline-flex items-center gap-1 px-2 py-1 text-xs bg-green-500 text-white rounded-md hover:bg-green-600 transition-colors"
                    title="Enviar mensaje por WhatsApp"
                  >
                    <svg 
                      xmlns="http://www.w3.org/2000/svg" 
                      width="12" 
                      height="12" 
                      viewBox="0 0 24 24" 
                      fill="none" 
                      stroke="currentColor" 
                      strokeWidth="2" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>
                    </svg>
                    WhatsApp
                  </button>
                </div>
                <p className="text-xs text-gray-500">Teléfono</p>
              </InfoRow>
            )}
            
            {lead.localidad && (
              <InfoRow icon={<MapPin className="h-5 w-5 text-gray-400" />}>
                <p className="text-sm font-medium text-gray-900">
                  {getUbicacionTexto()}
                </p>
                <p className="text-xs text-gray-500">Ubicación</p>
              </InfoRow>
            )}
          </div>
        </div>
        
        {/* Información del lead */}
        <div>
          <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Información del Lead
          </h3>
          
          <div className="space-y-4">
            {lead.origen && (
              <InfoRow icon={<Tag className="h-5 w-5 text-gray-400" />}>
                <p className="text-sm font-medium text-gray-900">{lead.origen.nombre}</p>
                <p className="text-xs text-gray-500">Origen del lead</p>
              </InfoRow>
            )}
            
            {lead.estado_lead && (
              <InfoRow icon={<Target className="h-5 w-5 text-gray-400" />}>
                <p className="text-sm font-medium text-gray-900">{lead.estado_lead.nombre}</p>
                <p className="text-xs text-gray-500">Estado actual</p>
              </InfoRow>
            )}
            
            {lead.rubro && (
              <InfoRow icon={<Briefcase className="h-5 w-5 text-gray-400" />}>
                <p className="text-sm font-medium text-gray-900">{lead.rubro.nombre}</p>
                <p className="text-xs text-gray-500">Rubro/Industria</p>
              </InfoRow>
            )}
            
            <InfoRow icon={<UserCheck className="h-5 w-5 text-gray-400" />}>
              <div>
                <p className="text-sm font-medium text-gray-900">
                  {(lead as any).asignado_nombre || 'Sin asignar'}
                </p>
                <div className="flex items-center gap-2 mt-1">
                  {lead.prefijo?.codigo && (
                    <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded flex items-center gap-1">
                      <Hash className="h-3 w-3" />
                      {lead.prefijo.codigo}
                    </span>
                  )}
                  {lead.prefijo?.descripcion && (
                    <span className="text-xs text-gray-500">
                      {lead.prefijo.descripcion}
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-1">Comercial asignado</p>
              </div>
            </InfoRow>
          </div>
        </div>
      </div>
      
      {/* Estado del lead */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Creado:</span> {formatFecha(lead.created)}
            </p>
            <p className="text-sm text-gray-600">
              <span className="font-medium">Última modificación:</span> {formatFecha(lead.modified || lead.created)}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {lead.es_activo ? (
              <span className="flex items-center gap-1 px-3 py-1 text-sm bg-green-100 text-green-800 rounded-full">
                <CheckCircle className="h-4 w-4" />
                Activo
              </span>
            ) : (
              <span className="flex items-center gap-1 px-3 py-1 text-sm bg-red-100 text-red-800 rounded-full">
                <X className="h-4 w-4" />
                Inactivo
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

const InfoRow: React.FC<{ icon: React.ReactNode; children: React.ReactNode }> = ({ icon, children }) => (
  <div className="flex items-start">
    <div className="mr-3 mt-0.5 shrink-0">{icon}</div>
    <div className="min-w-0 flex-1">{children}</div>
  </div>
);

export default InfoTab;