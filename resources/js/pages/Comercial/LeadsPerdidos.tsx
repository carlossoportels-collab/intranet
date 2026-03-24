// resources/js/Pages/Comercial/LeadsPerdidos.tsx
import { Head, Link, router, usePage } from '@inertiajs/react';
import { 
  AlertCircle, 
  Filter, 
  Search, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  MessageSquare, 
  Calendar,
  ChevronRight,
  Users,
  BarChart3,
  FileText,
  Eye,
  User,
  Phone,
  Mail,
  X,
  ChevronLeft,
  ChevronRight as ChevronRightIcon,
  PieChart,
  LineChart,
  CheckCircle,
  XCircle,
  Calendar as CalendarIcon,
  MoreVertical
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import SeguimientoLeadModal from '@/components/Modals/SeguimientoPerdidosModal';
import AppLayout from '@/layouts/app-layout';


// Definir tipos
interface LeadPerdido {
  id: number;
  nombre_completo: string;
  email?: string;
  telefono?: string;
  estado_lead: {
    id: number;
    nombre: string;
    tipo: string;
    color_hex?: string;
  };
  seguimientoPerdida: {
    id: number;
    motivo: {
      id: number;
      nombre: string;
    };
    posibilidades_futuras: string;
    fecha_posible_recontacto?: string;
    created: string;
  };
  created: string;
  origen?: {
    id: number;
    nombre: string;
  };
  comercial?: {
    personal: {
      nombre: string;
      apellido: string;
    };
  };
}

interface Motivo {
  id: number;
  nombre: string;
}

interface Estadistica {
  total: number;
  por_estado: Array<{
    estado: string;
    tipo: string;
    total: number;
    porcentaje: number;
  }>;
  por_motivo: Array<{
    id: number;
    motivo: string;
    total: number;
    recontactados: number;
    aun_perdidos: number;
    recuperados: number;
  }>;
  por_mes: Array<{
    mes: string;
    total: number;
    recontactados: number;
    aun_perdidos: number;
  }>;
  tasa_recontacto: number;
  con_recontacto_programado: number;
  total_recontactados: number;
  total_aun_perdidos: number;
}

// Interfaces para el modal de recontacto
interface LeadInfo {
  id: number;
  nombre_completo: string;
  email?: string;
  telefono?: string;
  estado_lead_id?: number;
  estado_actual_nombre?: string;
}

interface SeguimientoPerdidaInfo {
  motivo_nombre: string;
  posibilidades_futuras: string;
  fecha_posible_recontacto?: string;
  created: string;
}

interface TipoComentarioRecontacto {
  id: number;
  nombre: string;
  descripcion: string;
  aplica_a: string;
  crea_recordatorio: boolean;
  dias_recordatorio_default: number;
  es_activo: boolean;
}

interface EstadoLead {
  id: number;
  nombre: string;
  tipo: string;
  color_hex?: string;
}

interface PageProps {
  auth: {
    user: any;
  };
  leads: {
    data: LeadPerdido[];
    links: any[];
    meta: {
      total: number;
      current_page: number;
      last_page: number;
      per_page: number;
    };
  };
  motivos: Motivo[];
  estadisticas: Estadistica;
  filtros: {
    search?: string;
    estado?: string;
    motivo_id?: string;
    fecha_rechazo_desde?: string;
    fecha_rechazo_hasta?: string;
    posibilidades_futuras?: string;
    con_recontacto?: string;
  };
}

export default function Index({ leads, motivos, estadisticas, filtros }: PageProps) {
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [busqueda, setBusqueda] = useState(filtros.search || '');
  const [cargando, setCargando] = useState(false);
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(true);
  const [filtrosLocales, setFiltrosLocales] = useState({
    estado: filtros.estado || '',
    motivo_id: filtros.motivo_id || '',
    fecha_rechazo_desde: filtros.fecha_rechazo_desde || '',
    fecha_rechazo_hasta: filtros.fecha_rechazo_hasta || '',
    posibilidades_futuras: filtros.posibilidades_futuras || '',
    con_recontacto: filtros.con_recontacto || '',
  });

  // Estados para el modal de recontacto
  const [modalSeguimientoOpen, setModalSeguimientoOpen] = useState(false);
  const [leadSeleccionado, setLeadSeleccionado] = useState<any>(null);
  const [seguimientoSeleccionado, setSeguimientoSeleccionado] = useState<any>(null);
  const [tiposComentarioSeguimiento, setTiposComentarioSeguimiento] = useState<any[]>([]);
  const [estadosLeadSeguimiento, setEstadosLeadSeguimiento] = useState<any[]>([]);
  const [cargandoModal, setCargandoModal] = useState(false);

  const aplicarFiltros = () => {
    const params: any = { ...filtrosLocales };
    if (busqueda.trim()) params.search = busqueda.trim();
    
    router.get('/comercial/leads-perdidos', params, {
      preserveState: true,
      replace: true,
      onStart: () => setCargando(true),
      onFinish: () => setCargando(false),
    });
  };

  const limpiarFiltros = () => {
    setFiltrosLocales({
      estado: '',
      motivo_id: '',
      fecha_rechazo_desde: '',
      fecha_rechazo_hasta: '',
      posibilidades_futuras: '',
      con_recontacto: '',
    });
    setBusqueda('');
    router.get('/comercial/leads-perdidos', {}, {
      preserveState: true,
      replace: true,
      onStart: () => setCargando(true),
      onFinish: () => setCargando(false),
    });
  };

  const formatearFecha = (fechaString: string) => {
    try {
      return new Date(fechaString).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return fechaString;
    }
  };

  const getBadgeEstado = (estado: string, tipo: string) => {
    let bgColor = 'bg-gray-100 text-gray-800';
    
    if (estado === 'Perdido') {
      bgColor = 'bg-red-100 text-red-800';
    } else if (tipo === 'recontacto') {
      bgColor = 'bg-amber-100 text-amber-800';
    } else if (['Contactado', 'Calificado', 'Negociación', 'Propuesta Enviada'].includes(estado)) {
      bgColor = 'bg-green-100 text-green-800';
    }
    
    return (
      <span className={`px-2 py-1 text-xs rounded-full ${bgColor}`}>
        {estado}
      </span>
    );
  };

  const getBadgePosibilidades = (posibilidades: string) => {
    switch (posibilidades) {
      case 'si':
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Posibilidades altas</span>;
      case 'tal_vez':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Posibilidades medias</span>;
      case 'no':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Sin posibilidades</span>;
      default:
        return null;
    }
  };

  const calcularDiasDesdeRechazo = (fechaString: string) => {
    try {
        if (!fechaString) return 0;
        const fechaRechazo = new Date(fechaString);
        const hoy = new Date();
        const dias = Math.floor((hoy.getTime() - fechaRechazo.getTime()) / (1000 * 60 * 60 * 24));
        return dias;
    } catch {
        return 0;
    }
  };

  const getColorDias = (dias: number) => {
    if (dias <= 7) return 'text-green-600';
    if (dias <= 30) return 'text-yellow-600';
    return 'text-red-600';
  };

  const abrirModalSeguimiento = async (leadId: number) => {
    setCargandoModal(true);
    try {
        const response = await fetch(`/comercial/leads-perdidos/${leadId}/modal-seguimiento`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        
        setLeadSeleccionado(data.lead);
        setSeguimientoSeleccionado(data.seguimiento);
        setTiposComentarioSeguimiento(data.tiposComentarioSeguimiento);
        setEstadosLeadSeguimiento(data.estadosLead);
        setModalSeguimientoOpen(true);
    } catch (error) {
        console.error('Error cargando modal de recontacto:', error);
        alert('Error al cargar información para recontactar');
    } finally {
        setCargandoModal(false);
    }
  };

  return (
    <AppLayout title="Leads Perdidos y Recontactados">
      <Head title="Leads Perdidos y Recontactados" />
      
      <div className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-6 xl:px-8">
        {/* Header - RESPONSIVE */}
        <div className="mb-6 sm:mb-8">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 sm:gap-0">
            <div className="flex-1">
              <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2 sm:gap-3">
                <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
                Leads Perdidos y Recontactados
              </h1>
              <p className="text-gray-600 mt-1 sm:mt-2 text-sm sm:text-base">
                Análisis y seguimiento de leads que fueron rechazados y su proceso de recontacto
              </p>
            </div>
            <div className="flex items-center gap-2 sm:gap-3">
              <button
                onClick={() => setMostrarEstadisticas(!mostrarEstadisticas)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                title={mostrarEstadisticas ? 'Ocultar estadísticas' : 'Mostrar estadísticas'}
              >
                <BarChart3 className="h-4 w-4 sm:h-5 sm:w-5" />
              </button>
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className="flex items-center gap-2 px-3 py-2 sm:px-4 sm:py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
              >
                <Filter className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">Filtros</span>
                <span className="inline sm:hidden">Filtrar</span>
              </button>
            </div>
          </div>
          
          {/* Barra de búsqueda - RESPONSIVE */}
          <div className="mt-4 sm:mt-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && aplicarFiltros()}
                placeholder="Buscar por nombre, email o teléfono..."
                className="w-full pl-9 sm:pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 text-sm sm:text-base"
              />
            </div>
          </div>
        </div>

        {/* Estadísticas - RESPONSIVE */}
        {mostrarEstadisticas && (
          <div className="mb-6 sm:mb-8 grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
            {/* Tarjetas principales - RESPONSIVE */}
            <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              <div className="bg-white rounded-lg shadow p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Total perdidos</p>
                    <p className="text-xl sm:text-2xl font-bold text-gray-900">{estadisticas.total}</p>
                  </div>
                  <AlertCircle className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Recontactados</p>
                    <p className="text-xl sm:text-2xl font-bold text-green-600">{estadisticas.total_recontactados}</p>
                  </div>
                  <TrendingUp className="h-6 w-6 sm:h-8 sm:w-8 text-green-500" />
                </div>
                <p className="text-xs text-gray-500 mt-1 sm:mt-2">
                  {estadisticas.tasa_recontacto}% de tasa
                </p>
              </div>
              
              <div className="bg-white rounded-lg shadow p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Aún perdidos</p>
                    <p className="text-xl sm:text-2xl font-bold text-red-600">{estadisticas.total_aun_perdidos}</p>
                  </div>
                  <TrendingDown className="h-6 w-6 sm:h-8 sm:w-8 text-red-500" />
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow p-3 sm:p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs sm:text-sm text-gray-500">Recontacto programado</p>
                    <p className="text-xl sm:text-2xl font-bold text-amber-600">{estadisticas.con_recontacto_programado}</p>
                  </div>
                  <Calendar className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500" />
                </div>
              </div>
            </div>
            
            {/* Distribución por estado - RESPONSIVE */}
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <h3 className="font-medium text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
                <PieChart className="h-4 w-4 sm:h-5 sm:w-5" />
                Distribución por estado actual
              </h3>
              <div className="space-y-2 sm:space-y-3">
                {estadisticas.por_estado.map((item) => (
                  <div key={item.estado} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getBadgeEstado(item.estado, item.tipo)}
                      <span className="text-xs sm:text-sm text-gray-600">{item.porcentaje}%</span>
                    </div>
                    <span className="font-medium text-sm sm:text-base">{item.total}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Filtros - RESPONSIVE */}
        {mostrarFiltros && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 sm:p-6 mb-4 sm:mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {/* Estado */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Estado actual
                </label>
                <select
                  value={filtrosLocales.estado}
                  onChange={(e) => setFiltrosLocales(prev => ({ ...prev, estado: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm sm:text-base"
                >
                  <option value="">Todos los estados</option>
                  <option value="perdido">Solo perdidos</option>
                  <option value="recontactado">Solo recontactados</option>
                  <option value="recuperado">Solo recuperados</option>
                </select>
              </div>
              
              {/* Motivo */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Motivo de pérdida
                </label>
                <select
                  value={filtrosLocales.motivo_id}
                  onChange={(e) => setFiltrosLocales(prev => ({ ...prev, motivo_id: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm sm:text-base"
                >
                  <option value="">Todos los motivos</option>
                  {motivos.map(motivo => (
                    <option key={motivo.id} value={motivo.id}>{motivo.nombre}</option>
                  ))}
                </select>
              </div>
              
              {/* Posibilidades futuras */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Posibilidades futuras
                </label>
                <select
                  value={filtrosLocales.posibilidades_futuras}
                  onChange={(e) => setFiltrosLocales(prev => ({ ...prev, posibilidades_futuras: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm sm:text-base"
                >
                  <option value="">Todas</option>
                  <option value="si">Sí, hay posibilidades</option>
                  <option value="tal_vez">Tal vez, en otro momento</option>
                  <option value="no">No, definitivamente no</option>
                </select>
              </div>
              
              {/* Con recontacto */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Con fecha de recontacto
                </label>
                <select
                  value={filtrosLocales.con_recontacto}
                  onChange={(e) => setFiltrosLocales(prev => ({ ...prev, con_recontacto: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm sm:text-base"
                >
                  <option value="">Todos</option>
                  <option value="si">Sí, con fecha</option>
                  <option value="no">No, sin fecha</option>
                </select>
              </div>
              
              {/* Fecha desde */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Fecha rechazo desde
                </label>
                <input
                  type="date"
                  value={filtrosLocales.fecha_rechazo_desde}
                  onChange={(e) => setFiltrosLocales(prev => ({ ...prev, fecha_rechazo_desde: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm sm:text-base"
                />
              </div>
              
              {/* Fecha hasta */}
              <div>
                <label className="block text-xs sm:text-sm font-medium text-gray-700 mb-1">
                  Fecha rechazo hasta
                </label>
                <input
                  type="date"
                  value={filtrosLocales.fecha_rechazo_hasta}
                  onChange={(e) => setFiltrosLocales(prev => ({ ...prev, fecha_rechazo_hasta: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-red-500 focus:border-red-500 text-sm sm:text-base"
                />
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row sm:justify-end gap-3 mt-4 sm:mt-6">
              <button
                onClick={limpiarFiltros}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base order-2 sm:order-1"
              >
                Limpiar filtros
              </button>
              <button
                onClick={aplicarFiltros}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm sm:text-base order-1 sm:order-2"
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        )}

        {/* Lista de leads - RESPONSIVE */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          {cargando ? (
            <div className="p-6 sm:p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <p className="mt-2 text-gray-600 text-sm sm:text-base">Cargando leads...</p>
            </div>
          ) : leads.data.length === 0 ? (
            <div className="p-6 sm:p-8 text-center">
              <AlertCircle className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm sm:text-base">
                {busqueda || Object.values(filtrosLocales).some(v => v) 
                  ? 'No se encontraron leads con esos filtros' 
                  : 'No hay leads perdidos registrados'
                }
              </p>
              {(busqueda || Object.values(filtrosLocales).some(v => v)) && (
                <button
                  onClick={limpiarFiltros}
                  className="mt-2 text-red-600 hover:text-red-800 text-sm sm:text-base"
                >
                  Limpiar filtros para ver todos
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Tabla para pantallas grandes */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Lead
                      </th>
                      <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Estado
                      </th>
                      <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Motivo
                      </th>
                      <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Posibilidades
                      </th>
                      <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Tiempo desde rechazo
                      </th>
                      <th scope="col" className="px-4 sm:px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leads.data.map((lead) => {
                      if (!lead.seguimientoPerdida) {
                        console.warn(`Lead ${lead.id} no tiene seguimientoPerdida`);
                        return null;
                      }
                      
                      const diasDesdeRechazo = calcularDiasDesdeRechazo(lead.seguimientoPerdida.created);
                    
                      return (
                        <tr key={lead.id} className="hover:bg-gray-50">
                          <td className="px-4 sm:px-6 py-4">
                            <div>
                              <div className="flex items-center gap-3">
                                <div className="flex-shrink-0 h-8 w-8 sm:h-10 sm:w-10 bg-red-100 rounded-full flex items-center justify-center">
                                  <User className="h-4 w-4 sm:h-5 sm:w-5 text-red-600" />
                                </div>
                                <div>
                                  <div className="font-medium text-gray-900 text-sm sm:text-base">{lead.nombre_completo}</div>
                                  <div className="text-xs text-gray-500">
                                    {lead.email && (
                                      <div className="flex items-center gap-1">
                                        <Mail className="h-3 w-3" />
                                        <span className="truncate max-w-[120px] sm:max-w-[180px]">{lead.email}</span>
                                      </div>
                                    )}
                                    {lead.telefono && (
                                      <div className="flex items-center gap-1">
                                        <Phone className="h-3 w-3" />
                                        {lead.telefono}
                                      </div>
                                    )}
                                  </div>
                                </div>
                              </div>
                              <div className="mt-1 text-xs text-gray-500">
                                ID: {lead.id} • {formatearFecha(lead.created)}
                              </div>
                            </div>
                          </td>
                          
                          <td className="px-4 sm:px-6 py-4">
                            {getBadgeEstado(lead.estado_lead.nombre, lead.estado_lead.tipo)}
                          </td>
                          
                          <td className="px-4 sm:px-6 py-4">
                            <div className="text-sm font-medium text-gray-900">
                              {lead.seguimientoPerdida.motivo.nombre}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatearFecha(lead.seguimientoPerdida.created)}
                            </div>
                          </td>
                          
                          <td className="px-4 sm:px-6 py-4">
                            {lead.seguimientoPerdida && getBadgePosibilidades(lead.seguimientoPerdida.posibilidades_futuras)}
                            {lead.seguimientoPerdida?.fecha_posible_recontacto && (
                              <div className="mt-1 text-xs text-gray-600 flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                Recontacto: {formatearFecha(lead.seguimientoPerdida.fecha_posible_recontacto)}
                              </div>
                            )}
                          </td>
                          
                          <td className="px-4 sm:px-6 py-4">
                            <div className={`text-sm font-medium ${getColorDias(diasDesdeRechazo)}`}>
                              {diasDesdeRechazo} días
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatearFecha(lead.seguimientoPerdida.created)}
                            </div>
                          </td>
                          
                          <td className="px-4 sm:px-6 py-4 text-sm font-medium">
                            <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                              <Link
                                href={`/comercial/leads/${lead.id}`}
                                className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-xs sm:text-sm"
                              >
                                <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                                Ver detalles
                              </Link>
                              {['Perdido', 'Info Enviada', 'Recontactando', 'Reagendado'].includes(lead.estado_lead.nombre) && (
                                <button
                                    onClick={() => abrirModalSeguimiento(lead.id)}
                                    className="text-green-600 hover:text-green-900 flex items-center gap-1 text-xs sm:text-sm"
                                    disabled={cargandoModal}
                                >
                                  {cargandoModal ? (
                                    <>
                                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                      Cargando...
                                    </>
                                  ) : (
                                    <>
                                      <MessageSquare className="h-3 w-3 sm:h-4 sm:w-4" />
                                      Seguimiento
                                    </>
                                  )}
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    }).filter(Boolean)}
                  </tbody>
                </table>
              </div>
              
              {/* Cards para pantallas móviles */}
              <div className="md:hidden">
                <div className="divide-y divide-gray-200">
                  {leads.data.map((lead) => {
                    if (!lead.seguimientoPerdida) {
                      console.warn(`Lead ${lead.id} no tiene seguimientoPerdida`);
                      return null;
                    }
                    
                    const diasDesdeRechazo = calcularDiasDesdeRechazo(lead.seguimientoPerdida.created);
                    
                    return (
                      <div key={lead.id} className="p-4 hover:bg-gray-50">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex items-center gap-3">
                            <div className="flex-shrink-0 h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                              <User className="h-5 w-5 text-red-600" />
                            </div>
                            <div>
                              <div className="font-medium text-gray-900">{lead.nombre_completo}</div>
                              <div className="text-xs text-gray-500 mt-1">
                                {lead.email && (
                                  <div className="flex items-center gap-1">
                                    <Mail className="h-3 w-3" />
                                    <span className="truncate max-w-[150px]">{lead.email}</span>
                                  </div>
                                )}
                                {lead.telefono && (
                                  <div className="flex items-center gap-1 mt-1">
                                    <Phone className="h-3 w-3" />
                                    {lead.telefono}
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3 mb-3">
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Estado</div>
                            {getBadgeEstado(lead.estado_lead.nombre, lead.estado_lead.tipo)}
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Tiempo desde rechazo</div>
                            <div className={`text-sm font-medium ${getColorDias(diasDesdeRechazo)}`}>
                              {diasDesdeRechazo} días
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Motivo</div>
                            <div className="text-sm font-medium text-gray-900 truncate">
                              {lead.seguimientoPerdida.motivo.nombre}
                            </div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Posibilidades</div>
                            {getBadgePosibilidades(lead.seguimientoPerdida.posibilidades_futuras)}
                          </div>
                        </div>
                        
                        <div className="flex justify-between items-center pt-3 border-t border-gray-100">
                          <div className="text-xs text-gray-500">
                            {formatearFecha(lead.seguimientoPerdida.created)}
                          </div>
                          <div className="flex items-center gap-2">
                            <Link
                              href={`/comercial/leads/${lead.id}`}
                              className="text-red-600 hover:text-red-900 flex items-center gap-1 text-xs"
                            >
                              <Eye className="h-3 w-3" />
                              Ver
                            </Link>
                            {['Perdido', 'Info Enviada', 'Recontactando', 'Reagendado'].includes(lead.estado_lead.nombre) && (
                              <button
                                onClick={() => abrirModalSeguimiento(lead.id)}
                                className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-xs"
                                disabled={cargandoModal}
                              >
                                {cargandoModal ? (
                                  <>
                                    <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-blue-600"></div>
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="h-3 w-3" />
                                    Seguimiento
                                  </>
                                )}
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  }).filter(Boolean)}
                </div>
              </div>
              
              {/* Paginación - RESPONSIVE */}
              {leads.links && leads.links.length > 3 && (
                <div className="px-4 sm:px-6 py-4 border-t border-gray-200">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="text-sm text-gray-700 text-center sm:text-left">
                      Mostrando {leads.data.length} de {leads.meta.total} leads
                    </div>
                    
                    <div className="flex justify-center sm:justify-end">
                      <div className="flex flex-wrap justify-center gap-1">
                        {leads.links.map((link, index) => (
                          <button
                            key={index}
                            onClick={() => {
                              if (link.url) {
                                const url = new URL(link.url);
                                router.get(url.pathname + url.search, {}, {
                                  preserveState: true,
                                  onStart: () => setCargando(true),
                                  onFinish: () => setCargando(false),
                                });
                              }
                            }}
                            disabled={!link.url || link.active}
                            className={`px-2 py-1 text-xs sm:px-3 sm:py-1 sm:text-sm rounded-md ${
                              link.active
                                ? 'bg-red-600 text-white'
                                : link.url
                                ? 'text-gray-700 hover:bg-gray-100'
                                : 'text-gray-400 cursor-not-allowed'
                            }`}
                            dangerouslySetInnerHTML={{ __html: link.label }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
        
        {/* Sección de motivos más comunes - RESPONSIVE (Opción 2 mejorada) */}
        {estadisticas.por_motivo.length > 0 && (
          <div className="mt-6 sm:mt-8 bg-white rounded-lg shadow p-4 sm:p-6">
            <h3 className="font-medium text-gray-900 mb-3 sm:mb-4 flex items-center gap-2 text-sm sm:text-base">
              <PieChart className="h-4 w-4 sm:h-5 sm:w-5" />
              Motivos de pérdida más frecuentes
            </h3>
            
            <div className="grid grid-cols-1 xs:grid-cols-2 md:grid-cols-3 lg:grid-cols-3 xl:grid-cols-3 gap-3 sm:gap-4">
              {estadisticas.por_motivo.slice(0, 6).map((motivo) => {
                const porcentaje = estadisticas.total > 0 
                  ? Math.round((motivo.total / estadisticas.total) * 100) 
                  : 0;
                
                return (
                  <div key={motivo.id} className="border border-gray-200 rounded-lg p-3 sm:p-4 hover:shadow-md transition-shadow">
                    <div className="flex justify-between items-start mb-2 sm:mb-3">
                      <h4 className="font-medium text-gray-900 text-xs sm:text-sm truncate pr-2">
                        {motivo.motivo}
                      </h4>
                      <span className="text-base sm:text-lg font-bold text-red-600 whitespace-nowrap">{motivo.total}</span>
                    </div>
                    
                    {/* Mini gráfico circular - RESPONSIVE */}
                    <div className="relative w-16 h-16 sm:w-20 sm:h-20 mx-auto mb-2 sm:mb-3">
                      <svg className="w-full h-full" viewBox="0 0 36 36">
                        {/* Fondo */}
                        <circle cx="18" cy="18" r="15.9155" fill="none" stroke="#f3f4f6" strokeWidth="3" />
                        
                        {/* Porcentaje */}
                        <circle
                          cx="18"
                          cy="18"
                          r="15.9155"
                          fill="none"
                          stroke="#ef4444"
                          strokeWidth="3"
                          strokeDasharray={`${porcentaje} 100`}
                          strokeLinecap="round"
                          transform="rotate(-90 18 18)"
                        />
                        
                        {/* Texto en el centro */}
                        <text x="18" y="18" textAnchor="middle" dy=".3em" className="text-[8px] sm:text-[10px] font-bold fill-red-600">
                          {porcentaje}%
                        </text>
                      </svg>
                    </div>
                    
                    {/* Estadísticas detalladas - RESPONSIVE */}
                    <div className="grid grid-cols-3 gap-1 sm:gap-2 text-center">
                      <div className="flex flex-col items-center">
                        <div className="text-xs text-gray-500 mb-1">Recuperados</div>
                        <div className="text-xs sm:text-sm font-semibold text-green-600">{motivo.recuperados}</div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="text-xs text-gray-500 mb-1">Recontactados</div>
                        <div className="text-xs sm:text-sm font-semibold text-amber-600">{motivo.recontactados}</div>
                      </div>
                      <div className="flex flex-col items-center">
                        <div className="text-xs text-gray-500 mb-1">Perdidos</div>
                        <div className="text-xs sm:text-sm font-semibold text-red-600">{motivo.aun_perdidos}</div>
                      </div>
                    </div>
                    
                    {/* Porcentajes detallados (solo en pantallas medianas+) */}
                    <div className="hidden sm:grid grid-cols-3 gap-1 sm:gap-2 text-center mt-2">
                      <div className="text-xs text-green-600">
                        {motivo.total > 0 ? Math.round((motivo.recuperados / motivo.total) * 100) : 0}%
                      </div>
                      <div className="text-xs text-amber-600">
                        {motivo.total > 0 ? Math.round((motivo.recontactados / motivo.total) * 100) : 0}%
                      </div>
                      <div className="text-xs text-red-600">
                        {motivo.total > 0 ? Math.round((motivo.aun_perdidos / motivo.total) * 100) : 0}%
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            {/* Resumen total para pantallas muy pequeñas */}
            <div className="sm:hidden mt-4 pt-3 border-t border-gray-200">
              <div className="text-xs text-gray-500 text-center">
                Total: {estadisticas.total} leads • {estadisticas.por_motivo.length} motivos diferentes
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Modal de Recontactar */}
      <SeguimientoLeadModal
        isOpen={modalSeguimientoOpen}
        onClose={() => {
          setModalSeguimientoOpen(false);
          setLeadSeleccionado(null);
          setSeguimientoSeleccionado(null);
        }}
        lead={leadSeleccionado}
        seguimiento={seguimientoSeleccionado}
        tiposComentario={tiposComentarioSeguimiento}
        estadosLead={estadosLeadSeguimiento}
        onSuccess={() => {
          aplicarFiltros();
        }}
      />
    </AppLayout>
  );
}