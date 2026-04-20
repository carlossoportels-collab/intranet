// resources/js/Pages/Comercial/LeadsPerdidos.tsx

import { Head, Link, router } from '@inertiajs/react';
import { 
  AlertCircle, 
  Filter, 
  Search, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  MessageSquare, 
  Calendar,
  Users,
  BarChart3,
  Eye,
  User,
  Phone,
  Mail,
  X,
  PieChart,
  Target,
  MapPin,
  Clock,
  FileText,
  Calendar as CalendarIcon,
  CheckCircle
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import SeguimientoLeadModal from '@/components/Modals/SeguimientoPerdidosModal';
import AppLayout from '@/layouts/app-layout';
import { Pagination } from '@/components/ui';

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
  localidad?: {
    id: number;
    nombre: string;
    provincia?: {
      id: number;
      nombre: string;
    };
  };
  comercial?: {
    personal: {
      nombre: string;
      apellido: string;
    };
  };
  presupuestos?: {
    total: number;
    ultimo_formateado?: string;
  };
  comentarios?: {
    total: number;
    ultimo_formateado?: string;
  };
}

interface Motivo {
  id: number;
  nombre: string;
}

interface PrefijoFiltro {
  id: string;
  codigo: string;
  descripcion: string;
  comercial_nombre?: string;
  display_text: string;
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

interface PageProps {
  auth: {
    user: any;
  };
  leads: {
    data: LeadPerdido[];
    current_page: number;
    last_page: number;
    total: number;
    per_page: number;
    links?: any[];
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
    prefijo_id?: string;
    localidad?: string;
  };
  prefijosFiltro: PrefijoFiltro[];
  prefijoUsuario?: PrefijoFiltro | null;
  usuario: {
    ve_todas_cuentas: boolean;
    rol_id: number;
  };
  comentariosPorLead?: Record<number, { total: number; ultimo_formateado?: string }>;
  presupuestosPorLead?: Record<number, { total: number; ultimo_formateado?: string }>;
}

export default function Index({ 
  leads, 
  motivos, 
  estadisticas, 
  filtros: initialFilters = {},
  prefijosFiltro = [],
  prefijoUsuario = null,
  usuario,
  comentariosPorLead = {},
  presupuestosPorLead = {}
}: PageProps) {
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [mostrarEstadisticas, setMostrarEstadisticas] = useState(true);
  const [cargando, setCargando] = useState(false);
  
  // Estados locales para filtros
  const [filtrosLocales, setFiltrosLocales] = useState({
    search: initialFilters?.search || '',
    localidad: initialFilters?.localidad || '',
    estado: initialFilters?.estado || '',
    motivo_id: initialFilters?.motivo_id || '',
    posibilidades_futuras: initialFilters?.posibilidades_futuras || '',
    con_recontacto: initialFilters?.con_recontacto || '',
    prefijo_id: initialFilters?.prefijo_id || '',
  });

  // Estados para el modal de recontacto
  const [modalSeguimientoOpen, setModalSeguimientoOpen] = useState(false);
  const [leadSeleccionado, setLeadSeleccionado] = useState<any>(null);
  const [seguimientoSeleccionado, setSeguimientoSeleccionado] = useState<any>(null);
  const [tiposComentarioSeguimiento, setTiposComentarioSeguimiento] = useState<any[]>([]);
  const [estadosLeadSeguimiento, setEstadosLeadSeguimiento] = useState<any[]>([]);
  const [cargandoModal, setCargandoModal] = useState(false);

  const usuarioEsComercial = usuario.rol_id === 5;
  const stats = estadisticas || {
    total: 0,
    por_estado: [],
    por_motivo: [],
    por_mes: [],
    tasa_recontacto: 0,
    con_recontacto_programado: 0,
    total_recontactados: 0,
    total_aun_perdidos: 0,
  };

  const aplicarFiltros = () => {
    const params: any = { ...filtrosLocales };
    
    router.get('/comercial/leads-perdidos', params, {
      preserveState: true,
      replace: true,
      onStart: () => setCargando(true),
      onFinish: () => setCargando(false),
    });
  };

  const limpiarFiltros = () => {
    setFiltrosLocales({
      search: '',
      localidad: '',
      estado: '',
      motivo_id: '',
      posibilidades_futuras: '',
      con_recontacto: '',
      prefijo_id: '',
    });
    router.get('/comercial/leads-perdidos', {}, {
      preserveState: true,
      replace: true,
      onStart: () => setCargando(true),
      onFinish: () => setCargando(false),
    });
  };

  const actualizarFiltro = (key: keyof typeof filtrosLocales, value: string) => {
    setFiltrosLocales(prev => ({ ...prev, [key]: value }));
  };

  const handlePageChange = (page: number) => {
    const params: any = { ...filtrosLocales, page };
    router.get('/comercial/leads-perdidos', params, {
      preserveState: true,
      preserveScroll: true,
      onStart: () => setCargando(true),
      onFinish: () => setCargando(false),
    });
  };

  const formatearFecha = (fechaString: string) => {
    try {
      if (!fechaString) return 'N/A';
      return new Date(fechaString).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch {
      return fechaString;
    }
  };

  const getBadgeEstado = (estado: string, tipo: string, colorHex?: string) => {
    if (colorHex) {
      return (
        <span 
          className="px-2 py-1 text-xs rounded-full"
          style={{ 
            backgroundColor: `${colorHex}20`,
            color: colorHex,
            border: `1px solid ${colorHex}40`
          }}
        >
          {estado}
        </span>
      );
    }
    
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
        return <span className="px-2 py-1 text-xs bg-green-100 text-green-800 rounded-full">Alta</span>;
      case 'tal_vez':
        return <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">Media</span>;
      case 'no':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Baja</span>;
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
    if (dias <= 7) return 'text-green-600 bg-green-50';
    if (dias <= 30) return 'text-yellow-600 bg-yellow-50';
    return 'text-red-600 bg-red-50';
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
        setTiposComentarioSeguimiento(data.tiposComentarioSeguimiento || []);
        setEstadosLeadSeguimiento(data.estadosLead || []);
        setModalSeguimientoOpen(true);
    } catch (error) {
        console.error('Error cargando modal de recontacto:', error);
        alert('Error al cargar información para recontactar');
    } finally {
        setCargandoModal(false);
    }
  };

  const hasActiveFilters = () => {
    return Object.values(filtrosLocales).some(v => v && v !== '');
  };

  // Opciones para el filtro de estado
  const estadoOptions = [
    { value: '', label: 'Todos los estados' },
    { value: 'perdido', label: 'Perdidos' },
    { value: 'recontactado', label: 'Recontactados' },
  ];

  // Opciones para recontacto programado
  const recontactoOptions = [
    { value: '', label: 'Todos' },
    { value: 'si', label: 'Con recontacto programado' },
    { value: 'no', label: 'Sin recontacto programado' },
  ];

  return (
    <AppLayout title="Leads Perdidos y Recontactados">
      <Head title="Leads Perdidos y Recontactados" />
      
      <div className="w-full px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                <AlertCircle className="h-7 w-7 text-red-500" />
                Leads Perdidos y Recontactados
              </h1>
              <p className="text-gray-600 mt-1">
                Gestión de leads rechazados y seguimiento de recontacto
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setMostrarEstadisticas(!mostrarEstadisticas)}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                title={mostrarEstadisticas ? 'Ocultar estadísticas' : 'Mostrar estadísticas'}
              >
                <BarChart3 className="h-5 w-5" />
              </button>
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              >
                <Filter className="h-4 w-4" />
                <span>{mostrarFiltros ? 'Ocultar filtros' : 'Mostrar filtros'}</span>
              </button>
            </div>
          </div>
        </div>

        {/* Filtros */}
        {mostrarFiltros && (
          <div className="mb-6 bg-white rounded-lg border border-gray-200 p-4">
            {/* Fila 1: Búsqueda y Localidad */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Buscar por nombre, email o teléfono..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500"
                  value={filtrosLocales.search}
                  onChange={(e) => actualizarFiltro('search', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && aplicarFiltros()}
                />
              </div>
              
              <div className="relative">
                <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  type="text"
                  placeholder="Filtrar por localidad..."
                  className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500"
                  value={filtrosLocales.localidad}
                  onChange={(e) => actualizarFiltro('localidad', e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && aplicarFiltros()}
                />
              </div>
            </div>
            
            {/* Fila 2: Estado, Recontacto programado, Comercial */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
              {/* Estado */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Estado actual</label>
                <select
                  value={filtrosLocales.estado}
                  onChange={(e) => actualizarFiltro('estado', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500"
                >
                  {estadoOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              {/* Recontacto programado */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Recontacto programado</label>
                <select
                  value={filtrosLocales.con_recontacto}
                  onChange={(e) => actualizarFiltro('con_recontacto', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500"
                >
                  {recontactoOptions.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label}</option>
                  ))}
                </select>
              </div>
              
              {/* Comercial */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Comercial</label>
                {usuarioEsComercial && prefijoUsuario ? (
                  <div className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-gray-50">
                    {prefijoUsuario.display_text}
                  </div>
                ) : (
                  <select
                    value={filtrosLocales.prefijo_id}
                    onChange={(e) => actualizarFiltro('prefijo_id', e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500"
                  >
                    <option value="">Todos los comerciales</option>
                    {prefijosFiltro.map(prefijo => (
                      <option key={prefijo.id} value={prefijo.id}>
                        {prefijo.display_text}
                      </option>
                    ))}
                  </select>
                )}
              </div>
              
              {/* Motivo de pérdida */}
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Motivo de pérdida</label>
                <select
                  value={filtrosLocales.motivo_id}
                  onChange={(e) => actualizarFiltro('motivo_id', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Todos los motivos</option>
                  {motivos && motivos.map(motivo => (
                    <option key={motivo.id} value={motivo.id}>{motivo.nombre}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {/* Fila 3: Posibilidades futuras */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">Posibilidades de recuperación</label>
                <select
                  value={filtrosLocales.posibilidades_futuras}
                  onChange={(e) => actualizarFiltro('posibilidades_futuras', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-red-500 focus:border-red-500"
                >
                  <option value="">Todas</option>
                  <option value="si">Altas</option>
                  <option value="tal_vez">Medias</option>
                  <option value="no">Bajas</option>
                </select>
              </div>
            </div>
            
            {/* Botones */}
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={limpiarFiltros}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm transition-colors"
              >
                Limpiar filtros
              </button>
              <button
                onClick={aplicarFiltros}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm transition-colors"
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        )}

        {/* Filtros activos */}
        {hasActiveFilters() && (
          <div className="mb-4 p-2 bg-blue-50 rounded-lg border border-blue-100">
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs font-medium text-blue-700">Filtros activos:</span>
              {filtrosLocales.search && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-blue-200 rounded text-xs text-blue-700">
                  Búsqueda: "{filtrosLocales.search}"
                  <button onClick={() => actualizarFiltro('search', '')} className="text-blue-500 hover:text-blue-700">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filtrosLocales.localidad && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-blue-200 rounded text-xs text-blue-700">
                  Localidad: {filtrosLocales.localidad}
                  <button onClick={() => actualizarFiltro('localidad', '')} className="text-blue-500 hover:text-blue-700">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filtrosLocales.estado && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-blue-200 rounded text-xs text-blue-700">
                  Estado: {estadoOptions.find(o => o.value === filtrosLocales.estado)?.label}
                  <button onClick={() => actualizarFiltro('estado', '')} className="text-blue-500 hover:text-blue-700">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filtrosLocales.con_recontacto && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-blue-200 rounded text-xs text-blue-700">
                  Recontacto: {recontactoOptions.find(o => o.value === filtrosLocales.con_recontacto)?.label}
                  <button onClick={() => actualizarFiltro('con_recontacto', '')} className="text-blue-500 hover:text-blue-700">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filtrosLocales.prefijo_id && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-blue-200 rounded text-xs text-blue-700">
                  Comercial: {prefijosFiltro.find(p => p.id === filtrosLocales.prefijo_id)?.display_text || filtrosLocales.prefijo_id}
                  <button onClick={() => actualizarFiltro('prefijo_id', '')} className="text-blue-500 hover:text-blue-700">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filtrosLocales.motivo_id && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-blue-200 rounded text-xs text-blue-700">
                  Motivo: {motivos.find(m => m.id === parseInt(filtrosLocales.motivo_id))?.nombre}
                  <button onClick={() => actualizarFiltro('motivo_id', '')} className="text-blue-500 hover:text-blue-700">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              {filtrosLocales.posibilidades_futuras && (
                <span className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-blue-200 rounded text-xs text-blue-700">
                  Posibilidades: {filtrosLocales.posibilidades_futuras === 'si' ? 'Altas' : filtrosLocales.posibilidades_futuras === 'tal_vez' ? 'Medias' : 'Bajas'}
                  <button onClick={() => actualizarFiltro('posibilidades_futuras', '')} className="text-blue-500 hover:text-blue-700">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              )}
              <button onClick={limpiarFiltros} className="text-xs text-blue-600 hover:text-blue-800 ml-2">
                Limpiar todos
              </button>
            </div>
          </div>
        )}

        {/* Estadísticas */}
        {mostrarEstadisticas && (
          <>
            {/* Tarjetas principales */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total perdidos</p>
                    <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
                  </div>
                  <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="h-5 w-5 text-red-500" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Recontactados</p>
                    <p className="text-2xl font-bold text-green-600">{stats.total_recontactados}</p>
                  </div>
                  <div className="h-10 w-10 bg-green-100 rounded-full flex items-center justify-center">
                    <TrendingUp className="h-5 w-5 text-green-500" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">Tasa: {stats.tasa_recontacto}%</p>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Aún perdidos</p>
                    <p className="text-2xl font-bold text-red-600">{stats.total_aun_perdidos}</p>
                  </div>
                  <div className="h-10 w-10 bg-red-100 rounded-full flex items-center justify-center">
                    <TrendingDown className="h-5 w-5 text-red-500" />
                  </div>
                </div>
              </div>
              
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Recontacto programado</p>
                    <p className="text-2xl font-bold text-amber-600">{stats.con_recontacto_programado}</p>
                  </div>
                  <div className="h-10 w-10 bg-amber-100 rounded-full flex items-center justify-center">
                    <Calendar className="h-5 w-5 text-amber-500" />
                  </div>
                </div>
              </div>
            </div>

            {/* Motivos de pérdida más frecuentes - Cards compactas */}
            {stats.por_motivo && stats.por_motivo.length > 0 && (
              <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3 flex items-center gap-2">
                  <Target className="h-4 w-4 text-red-500" />
                  Motivos de pérdida más frecuentes
                  <span className="text-xs text-gray-500 ml-2">({stats.por_motivo.length} motivos)</span>
                </h3>
                
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-2">
                  {stats.por_motivo.map((motivo) => {
                    const porcentaje = stats.total > 0 
                      ? Math.round((motivo.total / stats.total) * 100) 
                      : 0;
                    
                    return (
                      <div key={motivo.id} className="border border-gray-200 rounded-lg p-2 hover:shadow-md transition-shadow bg-white">
                        <div className="flex justify-between items-start mb-1">
                          <h4 className="font-medium text-gray-900 text-xs truncate flex-1" title={motivo.motivo}>
                            {motivo.motivo.length > 25 ? motivo.motivo.substring(0, 22) + '...' : motivo.motivo}
                          </h4>
                          <span className="text-sm font-bold text-red-600 ml-1">{motivo.total}</span>
                        </div>
                        
                        <div className="relative w-full h-1.5 bg-gray-100 rounded-full mb-2 overflow-hidden">
                          <div 
                            className="absolute left-0 top-0 h-full bg-red-500 rounded-full"
                            style={{ width: `${porcentaje}%` }}
                          />
                        </div>
                        
                        <div className="grid grid-cols-3 gap-1 text-center text-[10px]">
                          <div>
                            <div className="text-green-600 font-semibold">{motivo.recuperados}</div>
                            <div className="text-gray-400">Recup</div>
                          </div>
                          <div>
                            <div className="text-amber-600 font-semibold">{motivo.recontactados}</div>
                            <div className="text-gray-400">Recont</div>
                          </div>
                          <div>
                            <div className="text-red-600 font-semibold">{motivo.aun_perdidos}</div>
                            <div className="text-gray-400">Perd</div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        )}

        {/* Lista de leads */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
          {cargando ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-red-600"></div>
              <p className="mt-2 text-gray-600">Cargando leads...</p>
            </div>
          ) : !leads || leads.data.length === 0 ? (
            <div className="p-8 text-center">
              <AlertCircle className="h-12 w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">
                {hasActiveFilters() 
                  ? 'No se encontraron leads con esos filtros' 
                  : 'No hay leads perdidos registrados'}
              </p>
              {hasActiveFilters() && (
                <button onClick={limpiarFiltros} className="mt-2 text-red-600 hover:text-red-800 text-sm">
                  Limpiar filtros para ver todos
                </button>
              )}
            </div>
          ) : (
            <>
              {/* Tabla desktop */}
              <div className="hidden md:block overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Lead</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Ubicación</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Estado</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Motivo / Rechazo</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Presup.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Coment.</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tiempo</th>
                      {!usuarioEsComercial && (
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Comercial</th>
                      )}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Acciones</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {leads.data.map((lead) => {
                      if (!lead.seguimientoPerdida) return null;
                      
                      const diasDesdeRechazo = calcularDiasDesdeRechazo(lead.seguimientoPerdida.created);
                      const puedeRecontactar = ['Perdido', 'Info Enviada', 'Recontactando', 'Reagendado'].includes(lead.estado_lead.nombre);
                      const presupuestos = presupuestosPorLead[lead.id] || { total: 0, ultimo_formateado: null };
                      const comentarios = comentariosPorLead[lead.id] || { total: 0, ultimo_formateado: null };
                      
                      return (
                        <tr key={lead.id} className="hover:bg-gray-50 transition-colors">
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <div className="flex-shrink-0 h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                                <User className="h-4 w-4 text-red-600" />
                              </div>
                              <div>
                                <div className="font-medium text-gray-900 text-sm">{lead.nombre_completo}</div>
                                <div className="text-xs text-gray-500">
                                  {lead.email && (
                                    <div className="flex items-center gap-1">
                                      <Mail className="h-3 w-3" />
                                      <span className="truncate max-w-[150px]">{lead.email}</span>
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
                          </td>
                          
                          <td className="px-4 py-3">
                            {lead.localidad ? (
                              <div>
                                <div className="text-sm text-gray-900">{lead.localidad.nombre}</div>
                                {lead.localidad.provincia && (
                                  <div className="text-xs text-gray-500">{lead.localidad.provincia.nombre}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">No especificada</span>
                            )}
                          </td>
                          
                          <td className="px-4 py-3">
                            {getBadgeEstado(lead.estado_lead.nombre, lead.estado_lead.tipo, lead.estado_lead.color_hex)}
                            {lead.seguimientoPerdida?.fecha_posible_recontacto && (
                              <div className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                                <CalendarIcon className="h-3 w-3" />
                                {formatearFecha(lead.seguimientoPerdida.fecha_posible_recontacto)}
                              </div>
                            )}
                          </td>
                          
                          <td className="px-4 py-3">
                            <div className="text-sm font-medium text-gray-900">
                              {lead.seguimientoPerdida.motivo?.nombre || 'No especificado'}
                            </div>
                            <div className="text-xs text-gray-500">
                              {formatearFecha(lead.seguimientoPerdida.created)}
                            </div>
                            {getBadgePosibilidades(lead.seguimientoPerdida.posibilidades_futuras)}
                          </td>
                          
                          <td className="px-4 py-3 text-center">
                            {presupuestos.total > 0 ? (
                              <div>
                                <span className="text-sm font-semibold text-blue-600">{presupuestos.total}</span>
                                {presupuestos.ultimo_formateado && (
                                  <div className="text-xs text-gray-400">{presupuestos.ultimo_formateado}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">0</span>
                            )}
                          </td>
                          
                          <td className="px-4 py-3 text-center">
                            {comentarios.total > 0 ? (
                              <div>
                                <span className="text-sm font-semibold text-green-600">{comentarios.total}</span>
                                {comentarios.ultimo_formateado && (
                                  <div className="text-xs text-gray-400">{comentarios.ultimo_formateado}</div>
                                )}
                              </div>
                            ) : (
                              <span className="text-sm text-gray-400">0</span>
                            )}
                           </td>
                          
                          <td className="px-4 py-3">
                            <div className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getColorDias(diasDesdeRechazo)}`}>
                              <Clock className="h-3 w-3 mr-1" />
                              {diasDesdeRechazo} días
                            </div>
                           </td>
                          
                          {!usuarioEsComercial && (
                            <td className="px-4 py-3">
                              <div className="flex items-center gap-1">
                                <User className="h-3 w-3 text-gray-400" />
                                <span className="text-xs text-gray-700">
                                  {lead.comercial?.personal?.nombre} {lead.comercial?.personal?.apellido}
                                </span>
                              </div>
                             </td>
                          )}
                          
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2">
                              <Link
                                href={`/comercial/leads/${lead.id}`}
                                className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-xs"
                              >
                                <Eye className="h-3 w-3" />
                                Ver
                              </Link>
                              {puedeRecontactar && (
                                <button
                                  onClick={() => abrirModalSeguimiento(lead.id)}
                                  className="text-green-600 hover:text-green-900 flex items-center gap-1 text-xs"
                                  disabled={cargandoModal}
                                >
                                  <MessageSquare className="h-3 w-3" />
                                  Seguir
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
              
              {/* Cards móviles */}
              <div className="md:hidden divide-y divide-gray-200">
                {leads.data.map((lead) => {
                  if (!lead.seguimientoPerdida) return null;
                  
                  const diasDesdeRechazo = calcularDiasDesdeRechazo(lead.seguimientoPerdida.created);
                  const puedeRecontactar = ['Perdido', 'Info Enviada', 'Recontactando', 'Reagendado'].includes(lead.estado_lead.nombre);
                  const presupuestos = presupuestosPorLead[lead.id] || { total: 0 };
                  const comentarios = comentariosPorLead[lead.id] || { total: 0 };
                  
                  return (
                    <div key={lead.id} className="p-4 hover:bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex items-center gap-2">
                          <div className="flex-shrink-0 h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-red-600" />
                          </div>
                          <div>
                            <div className="font-medium text-gray-900 text-sm">{lead.nombre_completo}</div>
                            <div className="text-xs text-gray-500">
                              {lead.email || lead.telefono}
                            </div>
                          </div>
                        </div>
                        {getBadgeEstado(lead.estado_lead.nombre, lead.estado_lead.tipo, lead.estado_lead.color_hex)}
                      </div>
                      
                      <div className="grid grid-cols-2 gap-2 text-xs mb-2">
                        <div>
                          <span className="text-gray-500">Ubicación:</span>
                          <span className="ml-1">{lead.localidad?.nombre || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Motivo:</span>
                          <span className="ml-1 font-medium">{lead.seguimientoPerdida.motivo?.nombre || 'N/A'}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Tiempo:</span>
                          <span className={`ml-1 ${getColorDias(diasDesdeRechazo)}`}>{diasDesdeRechazo} días</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Presupuestos:</span>
                          <span className="ml-1 font-medium">{presupuestos.total}</span>
                        </div>
                        <div>
                          <span className="text-gray-500">Comentarios:</span>
                          <span className="ml-1 font-medium">{comentarios.total}</span>
                        </div>
                      </div>
                      
                      <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
                        <Link
                          href={`/comercial/leads/${lead.id}`}
                          className="text-blue-600 hover:text-blue-900 flex items-center gap-1 text-xs"
                        >
                          <Eye className="h-3 w-3" />
                          Ver detalles
                        </Link>
                        {puedeRecontactar && (
                          <button
                            onClick={() => abrirModalSeguimiento(lead.id)}
                            className="text-green-600 hover:text-green-900 flex items-center gap-1 text-xs"
                            disabled={cargandoModal}
                          >
                            <MessageSquare className="h-3 w-3" />
                            Seguimiento
                          </button>
                        )}
                      </div>
                    </div>
                  );
                }).filter(Boolean)}
              </div>
              
              {/* Paginación estilo Prospectos */}
              <div className="mt-4 px-4 py-3 border-t border-gray-200">
                <Pagination
                  currentPage={leads.current_page}
                  lastPage={leads.last_page}
                  total={leads.total}
                  perPage={leads.per_page}
                  onPageChange={handlePageChange}
                  only={['leads', 'comentariosPorLead', 'presupuestosPorLead']}
                />
              </div>
            </>
          )}
        </div>
      </div>
      
      {/* Modal de Seguimiento */}
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