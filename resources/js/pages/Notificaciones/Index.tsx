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
  ChevronLeft,
  ChevronRight,
  Eye,
  Search,
  RefreshCw,
  Menu,
  X as XIcon
} from 'lucide-react';
import React, { useState } from 'react';

import AlertError from '@/components/alert-error';
import AlertSuccess from '@/components/alert-succes';
import AppLayout from '@/layouts/app-layout';
import { notificacionesApi } from '@/utils/axiosHelper';

interface Notificacion {
  id: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  entidad_tipo: 'lead' | 'presupuesto' | 'contrato' | 'comentario' | 'seguimiento_perdida';
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
    links: any[];
    meta: any;
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

export default function Index({ notificaciones, filtros, totalNoLeidas, flash }: PageProps) {
  const [mostrarFiltros, setMostrarFiltros] = useState(false);
  const [busqueda, setBusqueda] = useState('');
  const [cargando, setCargando] = useState(false);
  const [showAlert, setShowAlert] = useState<boolean>(false);
  const [alertType, setAlertType] = useState<'success' | 'error' | 'confirm' | null>(null);
  const [alertMessage, setAlertMessage] = useState<string>('');
  const [notificacionAEliminar, setNotificacionAEliminar] = useState<Notificacion | null>(null);
  const [mostrarMenuMovil, setMostrarMenuMovil] = useState(false);
  
  const filtrosLocales = {
    tipo: filtros.tipo || '',
    leida: filtros.leida || '',
    prioridad: filtros.prioridad || ''
  };

  // Aplicar filtros
  const aplicarFiltros = () => {
    router.get('/notificaciones', filtrosLocales, {
      preserveState: true,
      replace: true,
      onStart: () => setCargando(true),
      onFinish: () => setCargando(false),
    });
  };

  // Limpiar filtros
  const limpiarFiltros = () => {
    router.get('/notificaciones', {}, {
      preserveState: true,
      replace: true,
      onStart: () => setCargando(true),
      onFinish: () => setCargando(false),
    });
  };

  // Mostrar alerta de confirmación
  const mostrarConfirmacionEliminar = (notificacion: Notificacion) => {
    setNotificacionAEliminar(notificacion);
    setAlertType('confirm');
    setAlertMessage(`¿Estás seguro de eliminar la notificación "${notificacion.titulo}"? Esta acción no se puede deshacer.`);
    setShowAlert(true);
  };

  // Marcar como leída
  const marcarComoLeida = async (id: number, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    
    try {
        setCargando(true);
        const response = await notificacionesApi.marcarLeida(id);
        
        if (response.data.success) {
            // 1. Actualizar dropdown
            window.dispatchEvent(new Event('notificaciones-actualizadas'));
            
            // 2. Recargar solo lo necesario
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

  // Marcar todas como leídas
  const marcarTodasLeidas = async () => {
    try {
        setCargando(true);
        const response = await notificacionesApi.marcarTodasLeidas();
        
        if (response.data.success) {
            // 1. Actualizar dropdown
            window.dispatchEvent(new Event('notificaciones-actualizadas'));
            
            // 2. Recargar solo lo necesario
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

  // Eliminar notificación
  const eliminarNotificacion = async () => {
    if (!notificacionAEliminar) return;
    
    try {
        setCargando(true);
        const response = await notificacionesApi.eliminar(notificacionAEliminar.id);
        
        if (response.data.success) {
            // 1. Emitir evento para actualizar dropdown
            window.dispatchEvent(new Event('notificaciones-actualizadas'));
            
            // 2. Mostrar mensaje de éxito
            setAlertType('success');
            setAlertMessage('Notificación eliminada correctamente');
            setShowAlert(true);
            
            // 3. Recargar
            router.reload({ 
                only: ['notificaciones', 'totalNoLeidas'],
            });
            
            // Ocultar alerta después de 3 segundos
            setTimeout(() => {
                if (alertType === 'success') {
                    setShowAlert(false);
                    setAlertType(null);
                }
            }, 3000);
        }
    } catch (error) {
        console.error('Error:', error);
        setAlertType('error');
        setAlertMessage('Error al eliminar la notificación');
        setShowAlert(true);
        
        setTimeout(() => {
            if (alertType === 'error') {
                setShowAlert(false);
                setAlertType(null);
            }
        }, 3000);
    } finally {
        setCargando(false);
        setNotificacionAEliminar(null);
    }
  };

  // Cancelar eliminación
  const cancelarEliminacion = () => {
    setShowAlert(false);
    setAlertType(null);
    setAlertMessage('');
    setNotificacionAEliminar(null);
  };

  // Cerrar alert manualmente
  const closeAlert = () => {
    setShowAlert(false);
    setAlertType(null);
    setAlertMessage('');
    setNotificacionAEliminar(null);
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
      default:
        return;
    }
    
    // Marcar como leída al navegar
    if (!notificacion.leida) {
      marcarComoLeida(notificacion.id);
    }
    
    router.visit(ruta);
  };

  // Funciones auxiliares
  const getIconoPorTipo = (tipo: string) => {
    switch(tipo) {
      case 'lead_sin_contactar':
        return <Clock className="h-5 w-5 text-orange-500" />;
      case 'lead_proximo_contacto':
        return <AlertCircle className="h-5 w-5 text-red-500" />;
      case 'presupuesto_por_vencer':
      case 'presupuesto_vencido':
        return <FileText className="h-5 w-5 text-yellow-500" />;
      case 'contrato_por_vencer':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'asignacion_lead':
        return <Users className="h-5 w-5 text-green-500" />;
      case 'comentario_recordatorio':
        return <CheckCircle className="h-5 w-5 text-purple-500" />;
      case 'lead_posible_recontacto':
      return <RefreshCw className="h-5 w-5 text-cyan-500" />;
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

  // Verificar si es notificación activa (fecha ya pasó)
  const esNotificacionActiva = (fechaString: string): boolean => {
    try {
      const fechaNotificacion = new Date(fechaString);
      const ahora = new Date();
      return fechaNotificacion <= ahora;
    } catch {
      return false;
    }
  };

  // Filtrar notificaciones por búsqueda y solo mostrar activas
  const notificacionesFiltradas = busqueda 
    ? notificaciones.data.filter(n => 
        (n.titulo.toLowerCase().includes(busqueda.toLowerCase()) ||
        n.mensaje.toLowerCase().includes(busqueda.toLowerCase())) &&
        esNotificacionActiva(n.fecha_notificacion) // ← Filtrar solo activas
      )
    : notificaciones.data.filter(n => esNotificacionActiva(n.fecha_notificacion)); // ← Filtrar solo activas

  return (
    <AppLayout title="Notificaciones">
      <Head title="Notificaciones" />
      
      <div className="max-w-7xl mx-auto py-4 sm:py-6 px-3 sm:px-4 lg:px-8">
        {/* Alertas */}
        {showAlert && alertType === 'success' && (
          <div className="mb-4 sm:mb-6 relative">
            <AlertSuccess 
              message={alertMessage}
              title="¡Éxito!"
            />
            <button
              onClick={closeAlert}
              className="absolute right-3 top-3 text-green-600 hover:text-green-800"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {showAlert && alertType === 'error' && (
          <div className="mb-4 sm:mb-6 relative">
            <AlertError 
              errors={[alertMessage]}
              title="Error"
            />
            <button
              onClick={closeAlert}
              className="absolute right-3 top-3 text-red-600 hover:text-red-800"
            >
              <X size={16} />
            </button>
          </div>
        )}

        {showAlert && alertType === 'confirm' && (
          <div className="mb-4 sm:mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 relative">
            <div className="flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <h3 className="font-medium text-amber-800 mb-1 text-sm sm:text-base">Confirmar eliminación</h3>
                <p className="text-amber-700 text-xs sm:text-sm">{alertMessage}</p>
                <div className="flex gap-2 mt-3 flex-wrap">
                  <button
                    onClick={cancelarEliminacion}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors flex-1 sm:flex-none"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={eliminarNotificacion}
                    className="px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-1 sm:gap-2 flex-1 sm:flex-none"
                  >
                    <Trash2 className="h-3 w-3 sm:h-4 sm:w-4" />
                    Eliminar
                  </button>
                </div>
              </div>
              <button
                onClick={closeAlert}
                className="text-amber-600 hover:text-amber-800 flex-shrink-0"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

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
              
              <button
                onClick={marcarTodasLeidas}
                disabled={totalNoLeidas === 0 || cargando}
                className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg text-sm sm:text-base ${
                  totalNoLeidas === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Check className="h-4 w-4" />
                <span className="hidden sm:inline">Marcar todas como leídas</span>
                <span className="sm:hidden">Marcar todas</span>
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
              
              <button
                onClick={marcarTodasLeidas}
                disabled={totalNoLeidas === 0 || cargando}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg flex-1 justify-center ${
                  totalNoLeidas === 0
                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                    : 'bg-blue-600 text-white hover:bg-blue-700'
                }`}
              >
                <Check className="h-4 w-4" />
                Marcar todas
              </button>
            </div>
          )}
          
          {/* Barra de búsqueda */}
          <div className="mt-3 sm:mt-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 sm:h-5 sm:w-5 text-gray-400" />
              <input
                type="text"
                value={busqueda}
                onChange={(e) => setBusqueda(e.target.value)}
                placeholder="Buscar en notificaciones activas..."
                className="w-full pl-9 sm:pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
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

        {/* Lista de notificaciones */}
        <div className="bg-white shadow-sm rounded-lg border border-gray-200 overflow-hidden">
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
                    className={`p-3 sm:p-4 hover:bg-gray-50 cursor-pointer transition-colors ${
                      !notificacion.leida ? 'bg-blue-50' : ''
                    }`}
                    onClick={() => navegarAEntidad(notificacion)}
                  >
                    <div className="flex items-start">
                      <div className="mr-2 sm:mr-3 mt-0.5 sm:mt-1 flex-shrink-0">
                        {getIconoPorTipo(notificacion.tipo)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 sm:gap-0">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className={`font-medium truncate ${
                                !notificacion.leida ? 'text-blue-700' : 'text-gray-700'
                              }`}>
                                {notificacion.titulo}
                              </h3>
                              {!notificacion.leida && (
                                <span className="inline-block h-2 w-2 rounded-full bg-blue-500 flex-shrink-0"></span>
                              )}
                            </div>
                            <p className="text-xs sm:text-sm text-gray-600 line-clamp-2">
                              {notificacion.mensaje}
                            </p>
                          </div>
                          
                          <div className="flex items-center justify-between sm:justify-end gap-2">
                            <div className="hidden sm:block">
                              {getBadgePrioridad(notificacion.prioridad)}
                            </div>
                            
                            <div className="flex items-center gap-1">
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
              
              {/* Paginación */}
              {notificaciones.links && notificaciones.links.length > 3 && (
                <div className="px-3 sm:px-4 py-3 border-t border-gray-200 sm:px-6">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-0">
                    <div className="text-xs sm:text-sm text-gray-700 text-center sm:text-left">
                      Mostrando {notificaciones.data.length} de {notificaciones.meta.total} notificaciones activas
                    </div>
                    
                    <div className="flex justify-center space-x-1 sm:space-x-2 overflow-x-auto">
                      {notificaciones.links.map((link, index) => (
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
                              ? 'bg-blue-600 text-white'
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
              )}
            </>
          )}
        </div>
      </div>
    </AppLayout>
  );
}