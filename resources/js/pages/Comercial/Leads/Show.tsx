// resources/js/Pages/Comercial/Leads/Show.tsx

import { Head, router, usePage  } from '@inertiajs/react';
import { User, MessageSquare, Bell, TrendingUp, FileText, FileSignature, ArrowLeft } from 'lucide-react'; // ✅ Agregar ArrowLeft
import React, { useState, useEffect } from 'react';

import LeadHeader from '@/components/leads/LeadHeader';
import LeadStatsCards from '@/components/leads/LeadStatsCards';
import LeadTabs, { Tab } from '@/components/leads/LeadTabs';
import ComentariosTab from '@/components/leads/tabs/ComentariosTab';
import InfoTab from '@/components/leads/tabs/InfoTab';
import NotasTab from '@/components/leads/tabs/NotasTab';
import NotificacionesTab from '@/components/leads/tabs/NotificacionesTab';
import PresupuestosUnificadosTab from '@/components/leads/tabs/PresupuestosUnificadosTab';
import ContratosTab from '@/components/leads/tabs/ContratosTab'; 
import TiemposTab from '@/components/leads/tabs/TiemposTab';
import EditarLeadModal from '@/components/Modals/EditarLeadModal';
import LeadCommentModalSelector from '@/components/leads/LeadCommentModalSelector';
import { useLeadModals } from '@/hooks/useLeadModal';
import { useProspectosFilters } from '@/hooks/useProspectosFilters'; // ✅ Importar hook
import AppLayout from '@/layouts/app-layout';
import {
  Lead,
  Origen,
  EstadoLead,
  TipoComentario,
  Rubro,
  Provincia,
  Comercial
} from '@/types/leads';
import { PresupuestoNuevo, PresupuestoLegacy } from '@/types/presupuestos';
import { ContratoNuevo, ContratoLegacy } from '@/types/contratos';

interface PageProps {
  auth: {
    user: {
      ve_todas_cuentas: boolean;
      rol_id: number;
      personal_id: number;
      nombre_completo?: string;
    };
  };
  lead: Lead;
  notas: Array<any>;
  comentarios: Array<any>;
  notificaciones: Array<any>;
  presupuestos_nuevos?: PresupuestoNuevo[];
  presupuestos_legacy?: PresupuestoLegacy[];
  contratos_nuevos?: ContratoNuevo[];
  contratos_legacy?: ContratoLegacy[]; 
  estadisticas: {
    total_notas: number;
    total_comentarios: number;
    total_notificaciones: number;
    notificaciones_no_leidas: number;
    total_presupuestos: number;
    total_presupuestos_nuevos: number;
    total_presupuestos_legacy: number;
    total_presupuestos_con_pdf: number;
    total_importe_presupuestos: string;
    total_contratos: number;
    total_contratos_nuevos: number;
    total_contratos_legacy: number;
    total_contratos_con_pdf: number;
  };
  origenes: Origen[]; 
  estadosLead?: EstadoLead[];
  tiposComentario?: TipoComentario[];
  tiposComentarioGenerales?: TipoComentario[];
  tiposComentarioSeguimiento?: TipoComentario[];
  estadosLeadSeguimiento?: EstadoLead[]; 
  rubros: Rubro[];  
  provincias: Provincia[];
  comerciales?: Comercial[];
}

export default function Show({ 
  lead, 
  notas, 
  comentarios, 
  notificaciones,
  presupuestos_nuevos = [],
  presupuestos_legacy = [],
  contratos_nuevos = [],
  contratos_legacy = [],
  estadisticas,
  auth,
  origenes = [],
  estadosLead = [],
  tiposComentario = [],
  tiposComentarioGenerales = [], 
  tiposComentarioSeguimiento = [],
  estadosLeadSeguimiento = [],
  rubros = [],
  provincias = [],
  comerciales = []
}: PageProps) {
  const [activeTab, setActiveTab] = useState('informacion');
  const { modals, abrirModal, cerrarModales } = useLeadModals();
  const [modalSelectorOpen, setModalSelectorOpen] = useState(false);

  const puedeVerTiempos = auth.user.ve_todas_cuentas === true || auth.user.rol_id !== 5;
  
  // ✅ Hook para volver a la lista preservando filtros
  const { goBackToList } = useProspectosFilters({});

const { url } = usePage();

const handleBack = () => {
  const referrer = document.referrer;
  
  // Si venimos de prospectos, restaurar filtros
  if (referrer.includes('/comercial/prospectos')) {
    const savedFilters = sessionStorage.getItem('prospectos_filters');
    const returnUrl = sessionStorage.getItem('prospectos_filters_return_url');
    
    if (returnUrl && savedFilters) {
      sessionStorage.removeItem('prospectos_filters_return_url');
      router.visit(returnUrl, {
        preserveState: true,
        preserveScroll: true
      });
      return;
    }
  }
  
  // Si venimos de contactos, restaurar filtros
  if (referrer.includes('/comercial/contactos')) {
    const savedFilters = sessionStorage.getItem('contactos_filters');
    const returnUrl = sessionStorage.getItem('contactos_filters_return_url');
    
    if (returnUrl && savedFilters) {
      sessionStorage.removeItem('contactos_filters_return_url');
      router.visit(returnUrl, {
        preserveState: true,
        preserveScroll: true
      });
      return;
    }
  }
  
  // Si venimos de leads perdidos, restaurar filtros
  if (referrer.includes('/comercial/leads-perdidos')) {
    const savedFilters = sessionStorage.getItem('leads_perdidos_filters');
    const returnUrl = sessionStorage.getItem('leads_perdidos_filters_return_url');
    
    if (returnUrl && savedFilters) {
      sessionStorage.removeItem('leads_perdidos_filters_return_url');
      router.visit(returnUrl, {
        preserveState: true,
        preserveScroll: true
      });
      return;
    }
  }
  
  // Fallback: volver atrás en el historial
  window.history.back();
};

  // Construir tabs condicionalmente
  const tabs: Tab[] = [
    { id: 'informacion', label: 'Información', icon: <User className="h-4 w-4" /> },
  ];

  // Solo agregar tab de notas si hay notas
  if (estadisticas.total_notas > 0) {
    tabs.push({ 
      id: 'notas', 
      label: 'Notas', 
      icon: <MessageSquare className="h-4 w-4" />, 
      count: estadisticas.total_notas 
    });
  }

  // Comentarios siempre visible
  tabs.push({ 
    id: 'comentarios', 
    label: 'Comentarios', 
    icon: <MessageSquare className="h-4 w-4" />, 
    count: estadisticas.total_comentarios 
  });

  // Tiempos condicional por permisos
  if (puedeVerTiempos) {
    tabs.push({ 
      id: 'tiempos', 
      label: 'Tiempos', 
      icon: <TrendingUp className="h-4 w-4" /> 
    });
  }

  // Notificaciones solo si hay
  if (estadisticas.total_notificaciones > 0) {
    tabs.push({ 
      id: 'notificaciones', 
      label: 'Recordatorios', 
      icon: <Bell className="h-4 w-4" />, 
      count: estadisticas.total_notificaciones 
    });
  }

  // Presupuestos unificados (solo si hay alguno)
  if (estadisticas.total_presupuestos > 0) {
    tabs.push({ 
      id: 'presupuestos', 
      label: 'Presupuestos', 
      icon: <FileText className="h-4 w-4" />, 
      count: estadisticas.total_presupuestos 
    });
  }

  // Contratos unificados (solo si hay alguno)
  if (estadisticas.total_contratos > 0) {
    tabs.push({ 
      id: 'contratos', 
      label: 'Contratos', 
      icon: <FileSignature className="h-4 w-4" />, 
      count: estadisticas.total_contratos 
    });
  }

  // Función para manejar nuevo comentario
  const handleNuevoComentario = () => {
    setModalSelectorOpen(true);
  };

  // Asegurar que el activeTab sea válido
  useEffect(() => {
    const tabExists = tabs.some(tab => tab.id === activeTab);
    if (!tabExists && tabs.length > 0) {
      setActiveTab(tabs[0].id);
    }
  }, [activeTab, tabs]);

  const renderTabContent = () => {
    switch (activeTab) {
      case 'informacion':
        return <InfoTab lead={lead} />;
      case 'notas':
        return <NotasTab notas={notas} onNuevoComentario={handleNuevoComentario} />;
      case 'comentarios':
        return (
          <ComentariosTab 
            comentarios={comentarios} 
            onNuevoComentario={handleNuevoComentario}
            total={estadisticas.total_comentarios}
          />
        );
      case 'tiempos':
        return <TiemposTab leadId={lead.id} puedeVer={puedeVerTiempos} />;
      case 'notificaciones':
        const notificacionesFuturas = notificaciones.filter(notif => {
          const fechaNotif = new Date(notif.fecha_notificacion);
          const ahora = new Date();
          return fechaNotif > ahora;
        });
        
        return (
          <NotificacionesTab 
            notificaciones={notificacionesFuturas}
            leadId={lead.id}
          />
        );
      case 'presupuestos':
        return (
          <PresupuestosUnificadosTab 
            presupuestosNuevos={presupuestos_nuevos}
            presupuestosLegacy={presupuestos_legacy}
            lead={lead}
            origenes={origenes}
            rubros={rubros}
            provincias={provincias}
          />
        );
      case 'contratos':
        return (
          <ContratosTab
            contratosNuevos={contratos_nuevos}
            contratosLegacy={contratos_legacy}
            lead={lead}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AppLayout title={`Lead #${lead.id} - ${lead.nombre_completo}`}>
      <Head title={`Lead #${lead.id} - ${lead.nombre_completo}`} />
      
      <div className="max-w-8xl mx-auto px-4 sm:px-6 py-6">

        <div className="mb-4 sm:mb-6">
          <LeadHeader
            lead={lead}
            onEditar={() => abrirModal('editar', lead)}
            onNuevoComentario={handleNuevoComentario}
            onVolver={handleBack}
            tiposComentario={tiposComentario}
            estadosLead={estadosLead}
            comentariosExistentes={comentarios.length}
            seguimientoPerdida={lead.seguimientoPerdida}
            tiposComentarioSeguimiento={tiposComentarioSeguimiento || []}
            estadosLeadSeguimiento={estadosLeadSeguimiento || []}
          />
        </div>

        {/* Solo mostrar tabs si hay más de 1 */}
        {tabs.length > 1 && (
          <div className="mb-4 sm:mb-6 w-full">
            <LeadTabs
              activeTab={activeTab}
              onTabChange={setActiveTab}
              tabs={tabs}
            />
          </div>
        )}

        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden w-full">
          {renderTabContent()}
        </div>
      </div>

      {/* Modales */}
      <EditarLeadModal
        isOpen={modals.editar}
        onClose={cerrarModales}
        lead={lead}
        origenes={origenes}
        rubros={rubros}
        comerciales={comerciales}
        provincias={provincias}
        usuario={auth.user}
        onSuccess={() => {
          router.reload();
        }}
      />

      <LeadCommentModalSelector
        isOpen={modalSelectorOpen}
        onClose={() => setModalSelectorOpen(false)}
        lead={lead}
        tiposComentario={tiposComentario}
        estadosLead={estadosLead}
        comentariosExistentes={comentarios.length}
        onSuccess={() => {
          router.reload({ only: ['lead', 'comentarios', 'estadisticas'] });
          setModalSelectorOpen(false);
        }}
        seguimiento={lead.seguimientoPerdida}
        tiposComentarioSeguimiento={tiposComentarioSeguimiento || []}
        estadosLeadSeguimiento={estadosLeadSeguimiento || []}
      />
    </AppLayout>
  );
}