// resources/js/Pages/Notificaciones/Index.tsx

import { Head, Link, router, usePage } from '@inertiajs/react';
import { 
  Bell, 
  Check, 
  Trash2, 
  Filter, 
  X, 
  AlertCircle, 
  Clock, 
  FileText, 
  Users,
  CheckCircle,
  Eye,
  Search,
  RefreshCw,
  Menu,
  X as XIcon,
  Square,
  CheckSquare,
  Maximize2,
  Minimize2
} from 'lucide-react';
import React, { useState } from 'react';

import AppLayout from '@/layouts/app-layout';
import Pagination from '@/components/ui/Pagination';
import ConfirmDialog from '@/components/ui/ConfirmDialog';
import { notificacionesApi } from '@/utils/axiosHelper';
import { useToast } from '@/contexts/ToastContext';

interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  entidad_tipo: 'lead' | 'presupuesto' | 'contrato' | 'comentario' | 'seguimiento_perdida' | 'personal';
  entidad_id: number | null;
  leida: boolean;
  fecha_notificacion: string;
  prioridad: 'baja' | 'normal' | 'alta' | 'urgente';
  created: string;
}

interface PageProps {
  auth: {
    user: any;
  };
  notificaciones: {
    data: Notificacion[];
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    from: number;
    to: number;
    links: any[];
  };
  filtros: {
    tipo?: string;
    leida?: string;
    prioridad?: string;
  };
  totalNoLeidas: number;
  flash?: {
    success?: string;
    error?: string;
  };
}

export default function Index({ notificaciones, filtros, totalNoLeidas }: PageProps) {
  const toast = useToast();
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [mensajeExpandido, setMensajeExpandido] = useState<number | null>(null);
  
  // Estados para selección múltiple
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // Estados para confirmación
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [confirmAction, setConfirmAction] = useState<{
    type: 'delete' | 'deleteSelected';
    notificacion?: Notificacion;
  } | null>(null);
  
  const [mostrarMenuMovil, setMostrarMenuMovil] = useState(false);
  
  const filtrosLocales = {
    tipo: filtros.tipo || '',
    leida: filtros.leida || '',
    prioridad: filtros.prioridad || ''
  };

  // Filtrar notificaciones por búsqueda
  const notificacionesFiltradas = busqueda 
    ? notificaciones.data.filter(n => 
        n.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
        n.mensaje.toLowerCase().includes(busqueda.toLowerCase())
      )
    : notificaciones.data;

  // Actualizar selectAll cuando cambian los datos
  React.useEffect(() => {
    if (selectAll) {
      setSelectedIds(notificacionesFiltradas.map(n => n.id));
    } else {
      setSelectedIds([]);
    }
  }, [notificacionesFiltradas, selectAll]);

  // Aplicar filtros
  const aplicarFiltros = () => {
    router.get('/notificaciones', filtrosLocales, {
      preserveState: true,
      replace: true,
      onStart: () => setCargando(true),
      onFinish: () => setCargando(false),
    });
    setSelectedIds([]);
    setSelectAll(false);
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    router.get('/notificaciones', {}, {
      preserveState: true,
      replace: true,
      onStart: () => setCargando(true),
      onFinish: () => setCargando(false),
    });
    setSelectedIds([]);
    setSelectAll(false);
  };

  // Mostrar confirmación para eliminar una notificación
  const mostrarConfirmacionEliminar = (notificacion: Notificacion) => {
    setConfirmAction({
      type: 'delete',
      notificacion
    });
    setConfirmDialogOpen(true);
  };

  // Mostrar confirmación para eliminar seleccionadas
  const mostrarConfirmacionEliminarSeleccionadas = () => {
    if (selectedIds.length === 0) return;
    setConfirmAction({
      type: 'deleteSelected'
    });
    setConfirmDialogOpen(true);
  };

  // Ejecutar eliminación
  const ejecutarEliminacion = async () => {
    if (!confirmAction) return;
    
    setCargando(true);
    
    try {
      if (confirmAction.type === 'delete' && confirmAction.notificacion) {
        // Eliminar una notificación
        const response = await notificacionesApi.eliminar(confirmAction.notificacion.id);
        
        if (response.data.success) {
          toast.success('Notificación eliminada correctamente');
          
          // Actualizar dropdown
          window.dispatchEvent(new Event('notificaciones-actualizadas'));
          
          // Recargar
          router.reload({ 
            only: ['notificaciones', 'totalNoLeidas'],
          });
        }
      } else if (confirmAction.type === 'deleteSelected') {
        // Eliminar múltiples notificaciones
        let successCount = 0;
        let errorCount = 0;
        
        for (const id of selectedIds) {
          try {
            const response = await notificacionesApi.eliminar(id);
            if (response.data.success) {
              successCount++;
            } else {
              errorCount++;
            }
          } catch {
            errorCount++;
          }
        }
        
        if (successCount > 0) {
          toast.success(`${successCount} notificación(es) eliminada(s) correctamente${errorCount > 0 ? `. ${errorCount} fallaron` : ''}`);
          
          // Actualizar dropdown
          window.dispatchEvent(new Event('notificaciones-actualizadas'));
          
          // Recargar
          router.reload({ 
            only: ['notificaciones', 'totalNoLeidas'],
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar la(s) notificación(es)');
    } finally {
      setCargando(false);
      setConfirmDialogOpen(false);
      setConfirmAction(null);
      setSelectedIds([]);
      setSelectAll(false);
    }
  };

  // Marcar como leída
  const marcarComoLeida = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    try {
        setCargando(true);
        const response = await notificacionesApi.marcarLeida(id);
        
        if (response.data.success) {
            window.dispatchEvent(new Event('notificaciones-actualizadas'));
            router.reload({ 
                only: ['notificaciones', 'totalNoLeidas'],
            });
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        setCargando(false);
    }
  };

  // Marcar seleccionadas como leídas
  const marcarSeleccionadasLeidas = async () => {
    if (selectedIds.length === 0) return;
    
    setCargando(true);
    
    try {
      let successCount = 0;
      
      for (const id of selectedIds) {
        const response = await notificacionesApi.marcarLeida(id);
        if (response.data.success) {
          successCount++;
        }
      }
      
      if (successCount > 0) {
        toast.success(`${successCount} notificación(es) marcada(s) como leída(s)`);
        
        window.dispatchEvent(new Event('notificaciones-actualizadas'));
        router.reload({ 
          only: ['notificaciones', 'totalNoLeidas'],
        });
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setCargando(false);
      setSelectedIds([]);
      setSelectAll(false);
    }
  };

  // Marcar todas como leídas
  const marcarTodasLeidas = async () => {
    try {
        setCargando(true);
        const response = await notificacionesApi.marcarTodasLeidas();
        
        if (response.data.success) {
            window.dispatchEvent(new Event('notificaciones-actualizadas'));
            router.reload({ 
                only: ['notificaciones', 'totalNoLeidas'],
            });
        }
    } catch (error) {
        console.error('Error:', error);
    } finally {
        setCargando(false);
    }
  };

  // Manejar selección de una notificación
  const toggleSelect = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    
    setSelectedIds(prev => {
      const newSelected = prev.includes(id) 
        ? prev.filter(itemId => itemId !== id)
        : [...prev, id];
      
      // Actualizar selectAll
      setSelectAll(newSelected.length === notificacionesFiltradas.length && notificacionesFiltradas.length > 0);
      
      return newSelected;
    });
  };

  // Manejar seleccionar/deseleccionar todas
  const toggleSelectAll = () => {
    if (selectAll) {
      setSelectedIds([]);
    } else {
      setSelectedIds(notificacionesFiltradas.map(n => n.id));
    }
    setSelectAll(!selectAll);
  };

  // Cancelar confirmación
  const cancelarConfirmacion = () => {
    setConfirmDialogOpen(false);
    setConfirmAction(null);
  };

  // Navegar a entidad
  const navegarAEntidad = (notificacion: Notificacion) => {
    if (!notificacion.entidad_tipo || !notificacion.entidad_id) return;
    
    let ruta = '';
    switch(notificacion.entidad_tipo) {
      case 'lead':
        ruta = `/comercial/leads/${notificacion.entidad_id}`;
        break;
      case 'presupuesto':
        ruta = `/comercial/presupuestos/${notificacion.entidad_id}`;
        break;
      case 'contrato':
        ruta = `/comercial/cuentas/${notificacion.entidad_id}`;
        break;
      case 'comentario':
        ruta = `/comercial/leads/${notificacion.entidad_id}`;
        break;
      case 'seguimiento_perdida':
        ruta = `/comercial/seguimientos-perdida`;
        break;
      case 'personal':
        ruta = `/rrhh/personal/cumpleanos`;
        break;
      default:
        return;
    }
    
    if (!notificacion.leida) {
      marcarComoLeida(notificacion.id);
    }
    
    router.visit(ruta);
  };

  // Toggle expandir mensaje
  const toggleExpandirMensaje = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setMensajeExpandido(mensajeExpandido === id ? null : id);
  };

  // Funciones auxiliares
  const getIconoPorTipo = (tipo: string) => {
    switch(tipo) {
      case 'cumpleanos':
        return <Clock className="h-5 w-5 text-pink-500" />;
      case 'lead_sin_contactar':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'lead_proximo_contacto':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'presupuesto_por_vencer':
      case 'presupuesto_vencido':
        return <FileText className="h-5 w-5 text-yellow-500" />;
      case 'contrato_activo':
      case 'contrato_pendiente':
      case 'contrato_instalado':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'recordatorio_seguimiento':
        return <CheckCircle className="h-5 w-5 text-purple-500" />;
      case 'asignacion_lead':
        return <Users className="h-5 w-5 text-green-500" />;
      case 'comentario_recordatorio':
        return <CheckCircle className="h-5 w-5 text-indigo-500" />;
      case 'lead_posible_recontacto':
        return <RefreshCw className="h-5 w-5 text-cyan-500" />;
      case 'actividad_sospechosa':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Bell className="h-5 w-5 text-gray-500" />;
    }
  };

  const getBadgePrioridad = (prioridad: string) => {
    switch(prioridad) {
      case 'urgente':
        return <span className="px-2 py-1 text-xs bg-red-100 text-red-800 rounded-full">Urgente</span>;
      case 'alta':
        return <span className="px-2 py-1 text-xs bg-orange-100 text-orange-800 rounded-full">Alta</span>;
      case 'normal':
        return <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">Normal</span>;
      case 'baja':
        return <span className="px-2 py-1 text-xs bg-gray-100 text-gray-800 rounded-full">Baja</span>;
      default:
        return null;
    }
  };

  const formatFecha = (fechaString: string) => {
    try {
      const fecha = new Date(fechaString);
      const hoy = new Date();
      
      if (fecha.toDateString() === hoy.toDateString()) {
        return `Hoy ${fecha.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}`;
      }
      
      return fecha.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Fecha inválida';
    }
  };

  return (
    <AppLayout title="Notificaciones">
      <Head title="Notificaciones" />
      
      <div className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-8">
        {/* Confirm Dialog */}
        <ConfirmDialog
          isOpen={confirmDialogOpen}
          onClose={cancelarConfirmacion}
          onConfirm={ejecutarEliminacion}
          title={confirmAction?.type === 'delete' ? 'Eliminar Notificación' : 'Eliminar Notificaciones Seleccionadas'}
          message={
            confirmAction?.type === 'delete' && confirmAction.notificacion
              ? `¿Estás seguro de eliminar la notificación "${confirmAction.notificacion.titulo}"? Esta acción no se puede deshacer.`
              : `¿Estás seguro de eliminar ${selectedIds.length} notificación(es) seleccionada(s)? Esta acción no se puede deshacer.`
          }
          confirmText="Eliminar"
          cancelText="Cancelar"
          type="danger"
        />

        {/* Header - Responsive */}
        <div className="mb-4 sm:mb-6">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-xl sm:text-2xl font-bold text-gray-900 flex items-center gap-2">
                  <Bell className="h-5 w-5 sm:h-6 sm:w-6" />
                  Notificaciones
                </h1>
                <p className="text-gray-600 mt-1 text-sm sm:text-base">
                  {totalNoLeidas > 0 
                    ? `${totalNoLeidas} notificación(es) activa(s) sin leer`
                    : 'Todas las notificaciones activas están leídas'
                  }
                </p>
                <p className="text-xs text-gray-500 mt-1">
                  * Solo se muestran notificaciones cuya fecha programada ya llegó
                </p>
              </div>
              
              {/* Botón menú móvil */}
              <button
                onClick={() => setMostrarMenuMovil(!mostrarMenuMovil)}
                className="sm:hidden p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
              >
                {mostrarMenuMovil ? <XIcon size={20} /> : <Menu size={20} />}
              </button>
            </div>
            
            {/* Botones de acción - Desktop */}
            <div className="hidden sm:flex items-center gap-2">
              <button
                onClick={() => router.reload()}
                disabled={cargando}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                title="Actualizar"
              >
                <RefreshCw className={`h-5 w-5 ${cargando ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={() => setMostrarFiltros(!mostrarFiltros)}
                className="flex items-center gap-2 px-3 sm:px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
              >
                <Filter className="h-4 w-4" />
                Filtros
              </button>
              
            </div>
          </div>
          
          {/* Botones de acción - Mobile (si menú está abierto) */}
          {mostrarMenuMovil && (
            <div className="sm:hidden mt-4 flex flex-wrap gap-2">
              <button
                onClick={() => router.reload()}
                disabled={cargando}
                className="p-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg"
                title="Actualizar"
              >
                <RefreshCw className={`h-5 w-5 ${cargando ? 'animate-spin' : ''}`} />
              </button>
              
              <button
                onClick={() => {
                  setMostrarFiltros(!mostrarFiltros);
                  setMostrarMenuMovil(false);
                }}
                className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 flex-1 justify-center"
              >
                <Filter className="h-4 w-4" />
                Filtros
              </button>
            </div>
          )}
          
        </div>

        {/* Filtros - Responsive */}
        {mostrarFiltros && (
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-3 sm:p-4 mb-4 sm:mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tipo
                </label>
                <select
                  value={filtrosLocales.tipo}
                  onChange={(e) => {
                    filtrosLocales.tipo = e.target.value;
                    aplicarFiltros();
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Todos los tipos</option>
                  <option value="asignacion_lead">Asignación lead</option>
                  <option value="lead_sin_contactar">Lead sin contactar</option>
                  <option value="lead_proximo_contacto">Próximo contacto</option>
                  <option value="presupuesto_por_vencer">Presupuesto por vencer</option>
                  <option value="presupuesto_vencido">Presupuesto vencido</option>
                  <option value="contrato_por_vencer">Contrato por vencer</option>
                  <option value="comentario_recordatorio">Recordatorio</option>
                  <option value="lead_posible_recontacto">Posible recontacto lead</option>
                  <option value="cumpleanos">Cumpleaños</option>
                  <option value="actividad_sospechosa">⚠️ Actividad sospechosa</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado
                </label>
                <select
                  value={filtrosLocales.leida}
                  onChange={(e) => {
                    filtrosLocales.leida = e.target.value;
                    aplicarFiltros();
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Todas</option>
                  <option value="false">Sin leer</option>
                  <option value="true">Leídas</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Prioridad
                </label>
                <select
                  value={filtrosLocales.prioridad}
                  onChange={(e) => {
                    filtrosLocales.prioridad = e.target.value;
                    aplicarFiltros();
                  }}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg shadow-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="">Todas</option>
                  <option value="urgente">Urgente</option>
                  <option value="alta">Alta</option>
                  <option value="normal">Normal</option>
                  <option value="baja">Baja</option>
                </select>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row justify-end gap-2 mt-4">
              <button
                onClick={limpiarFiltros}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 text-sm sm:text-base"
              >
                Limpiar filtros
              </button>
              <button
                onClick={aplicarFiltros}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm sm:text-base"
              >
                Aplicar filtros
              </button>
            </div>
          </div>
        )}

        {/* Barra de selección múltiple - ARRIBA */}
        {notificacionesFiltradas.length > 0 && (
          <div className="bg-gray-50 border border-gray-200 rounded-t-lg p-3 flex flex-wrap items-center justify-between gap-2">
            <div className="flex items-center gap-4">
              <button
                onClick={toggleSelectAll}
                className="flex items-center gap-2 text-sm text-gray-700 hover:text-blue-600"
              >
                {selectAll ? (
                  <>
                    <CheckSquare className="h-4 w-4" />
                    <span>Deseleccionar todo</span>
                  </>
                ) : (
                  <>
                    <Square className="h-4 w-4" />
                    <span>Seleccionar todo</span>
                  </>
                )}
              </button>
              <span className="text-xs text-gray-500">
                {selectedIds.length} de {notificacionesFiltradas.length} seleccionadas
              </span>
            </div>
            
            {selectedIds.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={marcarSeleccionadasLeidas}
                  disabled={cargando}
                  className="px-3 py-1.5 bg-green-600 text-white text-sm rounded hover:bg-green-700 transition-colors flex items-center gap-1"
                >
                  <Check className="h-4 w-4" />
                  Marcar como leídas
                </button>
                <button
                  onClick={mostrarConfirmacionEliminarSeleccionadas}
                  disabled={cargando}
                  className="px-3 py-1.5 bg-red-600 text-white text-sm rounded hover:bg-red-700 transition-colors flex items-center gap-1"
                >
                  <Trash2 className="h-4 w-4" />
                  Eliminar seleccionadas
                </button>
              </div>
            )}
          </div>
        )}

        {/* Lista de notificaciones */}
        <div className={`bg-white shadow-sm rounded-b-lg border border-t-0 border-gray-200 overflow-hidden ${notificacionesFiltradas.length === 0 ? 'rounded-lg border-t' : ''}`}>
          {cargando ? (
            <div className="p-6 sm:p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-6 w-6 sm:h-8 sm:w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600 text-sm sm:text-base">Cargando notificaciones...</p>
            </div>
          ) : notificacionesFiltradas.length === 0 ? (
            <div className="p-6 sm:p-8 text-center">
              <Bell className="h-10 w-10 sm:h-12 sm:w-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500 text-sm sm:text-base">
                {busqueda || Object.values(filtrosLocales).some(v => v) 
                  ? 'No se encontraron notificaciones activas con esos filtros' 
                  : 'No hay notificaciones activas'
                }
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Las notificaciones programadas aparecerán cuando llegue su fecha
              </p>
              {(busqueda || Object.values(filtrosLocales).some(v => v)) && (
                <button
                  onClick={limpiarFiltros}
                  className="mt-2 text-blue-600 hover:text-blue-800 text-sm sm:text-base"
                >
                  Limpiar filtros para ver todas
                </button>
              )}
            </div>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {notificacionesFiltradas.map((notificacion) => (
                  <div 
                    key={notificacion.id}
                    className={`p-3 sm:p-4 hover:bg-gray-50 transition-colors ${
                      !notificacion.leida ? 'bg-blue-50' : ''
                    }`}
                  >
                    <div className="flex items-start">
                      {/* Checkbox para selección */}
                      <div className="mr-2 sm:mr-3 mt-1" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={(e) => toggleSelect(notificacion.id, e)}
                          className="text-gray-400 hover:text-blue-600"
                        >
                          {selectedIds.includes(notificacion.id) ? (
                            <CheckSquare className="h-5 w-5 text-blue-600" />
                          ) : (
                            <Square className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      
                      {/* Icono */}
                      <div className="mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                        {getIconoPorTipo(notificacion.tipo)}
                      </div>
                      
                      {/* Contenido (clickeable para navegar) */}
                      <div 
                        className="flex-1 min-w-0 cursor-pointer"
                        onClick={() => navegarAEntidad(notificacion)}
                      >
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-medium ${
                                !notificacion.leida ? 'text-blue-700' : 'text-gray-700'
                              }`}>
                                {notificacion.titulo}
                              </h3>
                              {!notificacion.leida && (
                                <span className="inline-block h-2 w-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                              )}
                            </div>
                            
                            {/* Mensaje - SIN line-clamp, con opción de expandir */}
                            <div className="relative">
                              <p className={`text-xs sm:text-sm text-gray-600 whitespace-pre-wrap ${
                                mensajeExpandido === notificacion.id ? '' : 'max-h-20 overflow-hidden'
                              }`}>
                                {notificacion.mensaje}
                              </p>
                              
                              {/* Botón para expandir/colapsar si el mensaje es largo */}
                              {notificacion.mensaje.length > 150 && (
                                <button
                                  onClick={(e) => toggleExpandirMensaje(notificacion.id, e)}
                                  className="mt-1 text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                                >
                                  {mensajeExpandido === notificacion.id ? (
                                    <>Ver menos <Minimize2 className="h-3 w-3" /></>
                                  ) : (
                                    <>Ver mensaje completo <Maximize2 className="h-3 w-3" /></>
                                  )}
                                </button>
                              )}
                            </div>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-2">
                            <div className="hidden sm:block">
                              {getBadgePrioridad(notificacion.prioridad)}
                            </div>
                            
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              {!notificacion.leida && (
                                <button
                                  onClick={(e) => marcarComoLeida(notificacion.id, e)}
                                  className="p-1 text-gray-400 hover:text-green-600 rounded hover:bg-gray-100"
                                  title="Marcar como leída"
                                >
                                  <Check className="h-3 w-3 sm:h-4 sm:w-4" />
                                </button>
                              )}
                              
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  mostrarConfirmacionEliminar(notificacion);
                                }}
                                className="p-1 text-gray-400 hover:text-red-600 rounded hover:bg-gray-100"
                                title="Eliminar notificación"
                              >
                                <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                              </button>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-2 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-1 sm:gap-0">
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-gray-500">
                              {formatFecha(notificacion.fecha_notificacion)}
                            </span>
                            {/* Badge prioridad móvil */}
                            <div className="sm:hidden">
                              {getBadgePrioridad(notificacion.prioridad)}
                            </div>
                          </div>
                          
                          {notificacion.entidad_tipo && notificacion.entidad_id && (
                            <span className="text-xs text-gray-500">
                              {notificacion.entidad_tipo.charAt(0).toUpperCase() + notificacion.entidad_tipo.slice(1)} #{notificacion.entidad_id}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Paginación con componente existente */}
              {notificaciones.total > 0 && (
                <div className="px-3 sm:px-4 py-3 border-t border-gray-200">
                  <Pagination
                    currentPage={notificaciones.current_page}
                    lastPage={notificaciones.last_page}
                    total={notificaciones.total}
                    perPage={notificaciones.per_page}
                    preserveState={true}
                    preserveScroll={true}
                    only={['notificaciones']}
                  />
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}