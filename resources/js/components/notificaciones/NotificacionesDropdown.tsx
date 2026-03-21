// resources/js/Components/Notificaciones/NotificacionesDropdown.tsx
import { router, usePage } from '@inertiajs/react';
import { 
  Bell, 
  Check, 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  FileText, 
  Users,
  RefreshCw,
  Calendar,
  Eye,
  Cake,
  Gift,
  Sparkles,
  MessageCircle,
  X,
  ChevronRight
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { notificacionesApi } from '@/utils/axiosHelper';
import { useToast } from '@/contexts/ToastContext';

interface Notificacion {
  id: number;
  usuario_id: number;
  titulo: string;
  mensaje: string;
  tipo: string;
  entidad_tipo: 'lead' | 'presupuesto' | 'contrato' | 'comentario' | 'seguimiento_perdida' | 'personal';
  entidad_id: number | null;
  leida: boolean;
  fecha_notificacion: string;
  prioridad: 'baja' | 'normal' | 'alta' | 'urgente';
  created: string;
  lead_nombre?: string;
  lead_id?: number;
  personal_id?: number;
  personal_nombre?: string;
}

interface PageProps {
  auth: {
    user: {
      id: number;
      nombre_usuario: string;
      nombre_completo: string;
      rol_id: number;
    };
  };
  [key: string]: any;
}

const NotificacionesDropdown: React.FC = () => {
  const toast = useToast();
  
  const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
  const [sinLeer, setSinLeer] = useState<number>(0);
  const [mostrarDropdown, setMostrarDropdown] = useState<boolean>(false);
  const [cargando, setCargando] = useState<boolean>(false);
  const [animando, setAnimando] = useState<boolean>(false);
  
  const { props } = usePage<PageProps>();
  const usuario = props.auth?.user;
  
  useEffect(() => {
    if (usuario?.id) {
      cargarNotificaciones();
    }
    
    const handleActualizacion = () => {
      cargarNotificaciones();
    };
    
    window.addEventListener('notificaciones-actualizadas', handleActualizacion);
    
    return () => {
      window.removeEventListener('notificaciones-actualizadas', handleActualizacion);
    };
  }, [usuario?.id]);
  
  const cargarNotificaciones = async (): Promise<void> => {
    if (cargando || !usuario?.id) return;
    
    setCargando(true);
    
    try {
      const response = await notificacionesApi.getNoLeidas({
        limit: 10
      });
      
      if (response.data.success) {
        const notificacionesActivas = response.data.data.filter((notif: Notificacion) => 
          esNotificacionActiva(notif.fecha_notificacion)
        );
        
        setNotificaciones(notificacionesActivas);
        setSinLeer(response.data.meta?.total_no_leidas || 0);
      }
    } catch (error) {
      console.error('Error cargando notificaciones:', error);
      try {
        const contadorResponse = await notificacionesApi.getContador();
        if (contadorResponse.data.success) {
          setSinLeer(contadorResponse.data.total_no_leidas || 0);
        }
      } catch (contadorError) {
        console.error('Error cargando contador:', contadorError);
      }
    } finally {
      setCargando(false);
    }
  };
  
  const marcarComoLeida = async (id: number, e: React.MouseEvent): Promise<void> => {
    e.stopPropagation();
    
    try {
      setCargando(true);
      const response = await notificacionesApi.marcarLeida(id);
      
      if (response.data.success) {
        setNotificaciones(prev => prev.filter(n => n.id !== id));
        setSinLeer(response.data.meta?.total_no_leidas || 0);
        toast.success('Notificación marcada como leída', 2000);
      }
    } catch (error) {
      console.error('Error marcando como leída:', error);
      toast.error('Error al marcar la notificación');
    } finally {
      setCargando(false);
    }
  };
  
  const marcarTodasComoLeidas = async (): Promise<void> => {
    try {
      setAnimando(true);
      const response = await notificacionesApi.marcarTodasLeidas();
      
      if (response.data.success) {
        setNotificaciones([]);
        setSinLeer(0);
        toast.success('Todas las notificaciones fueron leídas', 3000);
      }
    } catch (error) {
      console.error('Error marcando todas como leídas:', error);
      toast.error('Error al marcar las notificaciones');
    } finally {
      setAnimando(false);
    }
  };
  
  const navegarAEntidad = (notificacion: Notificacion): void => {
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
        ruta = `/comercial/leads-perdidos/${notificacion.entidad_id}`;
        break;
      case 'personal':
        ruta = `/rrhh/personal/cumpleanos`;
        break;
      default:
        return;
    }
    
    if (!notificacion.leida) {
      notificacionesApi.marcarLeida(notificacion.id).catch(console.error);
      setNotificaciones(prev => prev.filter(n => n.id !== notificacion.id));
      setSinLeer(prev => Math.max(0, prev - 1));
    }
    
    router.visit(ruta);
    setMostrarDropdown(false);
  };

  const enviarWhatsAppCumpleanios = async (notificacion: Notificacion, e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const response = await fetch(`/api/personal/${notificacion.entidad_id}`);
      const data = await response.json();
      
      if (!data.telefono) {
        toast.error('El empleado no tiene teléfono registrado');
        return;
      }

      let telefono = data.telefono.replace(/[\s\-\(\)]/g, '');
      
      if (!telefono.startsWith('54')) {
        if (telefono.startsWith('15')) {
          telefono = '54' + telefono;
        } else if (telefono.startsWith('11')) {
          telefono = '54' + telefono;
        } else if (telefono.length === 10) {
          telefono = '54' + telefono;
        }
      }

      const mensaje = `¡Feliz cumpleaños ${data.nombre}!`;
      
      const url = `https://wa.me/${telefono}?text=${encodeURIComponent(mensaje)}`;
      window.open(url, '_blank');
      
      await notificacionesApi.marcarLeida(notificacion.id);
      setNotificaciones(prev => prev.filter(n => n.id !== notificacion.id));
      setSinLeer(prev => Math.max(0, prev - 1));
      
      toast.success('¡Mensaje enviado!', 2000);
      
    } catch (error) {
      console.error('Error enviando WhatsApp:', error);
      toast.error('Error al enviar el mensaje');
    }
  };
  
  const getIconoPorTipo = (tipo: string): { icon: React.ReactNode, bg: string } => {
    switch(tipo) {
      case 'cumpleanos':
        return { 
          icon: <Cake className="h-4 w-4 text-pink-600" />,
          bg: 'bg-pink-50'
        };
      case 'lead_sin_contactar':
        return { 
          icon: <Clock className="h-4 w-4 text-orange-600" />,
          bg: 'bg-orange-50'
        };
      case 'lead_proximo_contacto':
        return { 
          icon: <AlertCircle className="h-4 w-4 text-red-600" />,
          bg: 'bg-red-50'
        };
      case 'presupuesto_por_vencer':
      case 'presupuesto_vencido':
        return { 
          icon: <FileText className="h-4 w-4 text-yellow-600" />,
          bg: 'bg-yellow-50'
        };
      case 'contrato_activo':
      case 'contrato_pendiente':
      case 'contrato_instalado':
        return { 
          icon: <FileText className="h-4 w-4 text-blue-600" />,
          bg: 'bg-blue-50'
        };
      case 'recordatorio_seguimiento':
        return { 
          icon: <Calendar className="h-4 w-4 text-purple-600" />,
          bg: 'bg-purple-50'
        };
      case 'asignacion_lead':
        return { 
          icon: <Users className="h-4 w-4 text-green-600" />,
          bg: 'bg-green-50'
        };
      case 'comentario_recordatorio':
        return { 
          icon: <CheckCircle className="h-4 w-4 text-indigo-600" />,
          bg: 'bg-indigo-50'
        };
      case 'lead_posible_recontacto':
        return { 
          icon: <RefreshCw className="h-4 w-4 text-cyan-600" />,
          bg: 'bg-cyan-50'
        };
      default:
        return { 
          icon: <Bell className="h-4 w-4 text-gray-600" />,
          bg: 'bg-gray-50'
        };
    }
  };
  
  const getColorPrioridad = (prioridad: string): { bg: string, border: string, text: string } => {
    switch(prioridad) {
      case 'urgente':
        return { 
          bg: 'bg-gradient-to-r from-red-50 to-red-100/50',
          border: 'border-l-4 border-l-red-500',
          text: 'text-red-700'
        };
      case 'alta':
        return { 
          bg: 'bg-gradient-to-r from-orange-50 to-orange-100/50',
          border: 'border-l-4 border-l-orange-500',
          text: 'text-orange-700'
        };
      case 'normal':
        return { 
          bg: 'bg-gradient-to-r from-blue-50 to-blue-100/50',
          border: 'border-l-4 border-l-blue-500',
          text: 'text-blue-700'
        };
      case 'baja':
        return { 
          bg: 'bg-gradient-to-r from-gray-50 to-gray-100/50',
          border: 'border-l-4 border-l-gray-400',
          text: 'text-gray-700'
        };
      default:
        return { 
          bg: 'bg-white',
          border: 'border-l-4 border-l-gray-300',
          text: 'text-gray-700'
        };
    }
  };
  
  const formatFecha = (fechaString: string): string => {
    try {
      const fecha = new Date(fechaString);
      
      if (isNaN(fecha.getTime())) {
        return 'Fecha inválida';
      }
      
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      const fechaComparar = new Date(fecha);
      fechaComparar.setHours(0, 0, 0, 0);
      
      const diferencia = hoy.getTime() - fechaComparar.getTime();
      const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
      
      if (dias === 0) {
        return `Hoy ${fecha.toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`;
      } else if (dias === 1) {
        return `Ayer ${fecha.toLocaleTimeString('es-ES', { 
          hour: '2-digit', 
          minute: '2-digit' 
        })}`;
      } else if (dias < 7) {
        return `Hace ${dias} días`;
      } else {
        return fecha.toLocaleDateString('es-ES', {
          day: '2-digit',
          month: 'short'
        });
      }
    } catch (error) {
      return 'Fecha inválida';
    }
  };
  
  const esNotificacionActiva = (fechaString: string): boolean => {
    try {
      const fechaNotificacion = new Date(fechaString);
      const ahora = new Date();
      return fechaNotificacion <= ahora;
    } catch {
      return false;
    }
  };
  
  if (!usuario) {
    return null;
  }
  
  return (
    <div className="relative">
      <button 
        onClick={() => {
          setMostrarDropdown(!mostrarDropdown);
          if (!mostrarDropdown) {
            cargarNotificaciones();
          }
        }}
        className="relative p-2 text-gray-600 hover:text-indigo-600 transition-all duration-200 rounded-lg hover:bg-indigo-50"
        title="Notificaciones"
        type="button"
      >
        <Bell size={20} />
        {sinLeer > 0 && (
          <span className="absolute -top-1 -right-1 h-4 w-4 bg-gradient-to-r from-red-500 to-rose-500 text-white text-[10px] rounded-full flex items-center justify-center border border-white shadow-lg">
            {sinLeer > 9 ? '9+' : sinLeer}
          </span>
        )}
      </button>
      
      {mostrarDropdown && (
        <>
          <div className="absolute right-0 mt-2 w-80 bg-white rounded-xl shadow-2xl overflow-hidden z-50 border border-gray-200 animate-in slide-in-from-top-2 fade-in duration-200">
            {/* Header compacto */}
            <div className="p-3 border-b bg-gradient-to-r from-orange-400 to-orange-500 text-black">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <h3 className="font-semibold text-sm">Notificaciones</h3>
                  {sinLeer > 0 && (
                    <span className="bg-white/20 text-black text-[10px] px-1.5 py-0.5 rounded-full">
                      {sinLeer} nuevas
                    </span>
                  )}
                </div>
                
                <div className="flex items-center gap-1">
                  {sinLeer > 0 && (
                    <button 
                      onClick={marcarTodasComoLeidas}
                      className="p-1 bg-white/20 hover:bg-white/30 rounded text-black text-xs transition-colors"
                      title="Marcar todas como leídas"
                      disabled={animando}
                    >
                      <Check className="h-3.5 w-3.5" />
                    </button>
                  )}
                  
                  <button 
                    onClick={() => cargarNotificaciones()}
                    className={`p-1 bg-white/20 hover:bg-white/30 rounded text-black transition-colors ${cargando ? 'animate-spin' : ''}`}
                    title="Actualizar"
                    disabled={cargando}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
            
            {/* Lista de notificaciones - sin scroll horizontal */}
            <div className="max-h-96 overflow-y-auto overflow-x-hidden">
              {notificaciones.length === 0 ? (
                <div className="p-6 text-center">
                  <div className="bg-indigo-50 rounded-full w-12 h-12 flex items-center justify-center mx-auto mb-2">
                    <Bell className="h-5 w-5 text-indigo-400" />
                  </div>
                  <p className="text-gray-600 text-sm font-medium">¡Todo despejado!</p>
                  <p className="text-xs text-gray-400 mt-1">
                    No hay notificaciones nuevas
                  </p>
                </div>
              ) : (
                notificaciones.map((notificacion, index) => {
                  const icono = getIconoPorTipo(notificacion.tipo);
                  const prioridad = getColorPrioridad(notificacion.prioridad);
                  
                  return (
                    <div 
                      key={notificacion.id}
                      className={`
                        relative group cursor-pointer transition-all duration-200
                        ${prioridad.bg} ${prioridad.border}
                        hover:shadow-md
                        ${index < notificaciones.length - 1 ? 'border-b border-gray-100' : ''}
                      `}
                      onClick={() => navegarAEntidad(notificacion)}
                    >
                      <div className="p-3">
                        <div className="flex items-start gap-2">
                          {/* Icono más pequeño */}
                          <div className={`${icono.bg} p-1.5 rounded-lg flex-shrink-0`}>
                            {icono.icon}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <div className="flex justify-between items-start gap-1">
                              <h4 className={`font-medium text-xs truncate ${prioridad.text}`}>
                                {notificacion.titulo}
                              </h4>
                              
                              <div className="flex items-center gap-0.5 flex-shrink-0">
                                {notificacion.tipo === 'cumpleanos' && (
                                  <button 
                                    onClick={(e) => enviarWhatsAppCumpleanios(notificacion, e)}
                                    className="p-1 text-green-600 hover:text-green-700 rounded hover:bg-green-100 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Felicitar por WhatsApp"
                                  >
                                    <MessageCircle className="h-3 w-3" />
                                  </button>
                                )}
                                
                                <button 
                                  onClick={(e) => marcarComoLeida(notificacion.id, e)}
                                  className="p-1 text-gray-400 hover:text-green-600 rounded hover:bg-green-50 transition-colors opacity-0 group-hover:opacity-100"
                                  title="Marcar como leída"
                                >
                                  <Check className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                            
                            <p className="text-xs text-gray-600 mt-0.5 line-clamp-2 break-words">
                              {notificacion.mensaje}
                            </p>
                            
                            <div className="flex justify-between items-center mt-1">
                              <span className="text-[10px] text-gray-400 flex items-center gap-0.5">
                                <Clock className="h-2.5 w-2.5" />
                                {formatFecha(notificacion.fecha_notificacion)}
                              </span>
                              
                              {notificacion.prioridad === 'urgente' && (
                                <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">
                                  Urgente
                                </span>
                              )}
                              {notificacion.prioridad === 'alta' && (
                                <span className="text-[10px] bg-orange-100 text-orange-700 px-1.5 py-0.5 rounded-full font-medium">
                                  Alta
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            {/* Footer compacto */}
            {(notificaciones.length > 0 || sinLeer > 0) && (
              <div className="p-2 border-t bg-gray-50 grid grid-cols-2 gap-1">
                <a 
                  href="/notificaciones" 
                  className="text-xs text-center text-indigo-600 hover:text-indigo-700 hover:bg-indigo-50 p-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                  onClick={(e) => {
                    e.preventDefault();
                    router.visit('/notificaciones');
                    setMostrarDropdown(false);
                  }}
                >
                  <Eye className="h-3.5 w-3.5" />
                  Ver activas
                </a>
                
                <a 
                  href="/notificaciones/programadas" 
                  className="text-xs text-center text-emerald-600 hover:text-emerald-700 hover:bg-emerald-50 p-1.5 rounded-lg transition-colors flex items-center justify-center gap-1"
                  onClick={(e) => {
                    e.preventDefault();
                    router.visit('/notificaciones/programadas');
                    setMostrarDropdown(false);
                  }}
                >
                  <Calendar className="h-3.5 w-3.5" />
                  Programadas
                </a>
              </div>
            )}
          </div>
          
          {/* Backdrop */}
          <div 
            className="fixed inset-0 z-40"
            onClick={() => setMostrarDropdown(false)}
          />
        </>
      )}
    </div>
  );
};

export default NotificacionesDropdown;