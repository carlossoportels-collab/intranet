<?php
// app/Http/Controllers/NotificacionController.php

namespace App\Http\Controllers;

use App\Traits\Authorizable; // 🔥 IMPORTAR TRAIT
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;
use Carbon\Carbon;

class NotificacionController extends Controller
{
    use Authorizable; // 🔥 AGREGAR TRAIT

    public function __construct()
    {
        $this->initializeAuthorization(); // 🔥 INICIALIZAR
    }

    /**
     * Vista principal de notificaciones (página completa)
     */
public function index(Request $request)
{
    $this->authorizePermiso(config('permisos.VER_NOTIFICACIONES'));
    
    $usuarioId = Auth::id();
    
    $query = $this->baseQuery($usuarioId)
        ->where('fecha_notificacion', '<=', Carbon::now());
    
    $this->aplicarFiltros($query, $request);
    
    $notificaciones = $query->paginate(10);
    
    // 🔥 TRANSFORMAR NOTIFICACIONES CON LEAD_ID
    $notificaciones->getCollection()->transform(function($notificacion) {
        $notif = $this->transformarNotificacion($notificacion);
        
        $notif->lead_id = null;
        $notif->lead_nombre = null;
        
        if ($notif->entidad_tipo === 'comentario') {
            $comentario = DB::table('comentarios')
                ->select('comentarios.lead_id', 'leads.nombre_completo')
                ->join('leads', 'comentarios.lead_id', '=', 'leads.id')
                ->where('comentarios.id', $notif->entidad_id)
                ->first();
            if ($comentario) {
                $notif->lead_id = $comentario->lead_id;
                $notif->lead_nombre = $comentario->nombre_completo;
            }
        } elseif ($notif->entidad_tipo === 'lead') {
            $lead = DB::table('leads')
                ->select('nombre_completo')
                ->where('id', $notif->entidad_id)
                ->first();
            if ($lead) {
                $notif->lead_nombre = $lead->nombre_completo;
                $notif->lead_id = $notif->entidad_id;
            }
        } elseif ($notif->entidad_tipo === 'seguimiento_perdida') {
            $seguimiento = DB::table('seguimientos_perdida')
                ->select('seguimientos_perdida.lead_id', 'leads.nombre_completo')
                ->join('leads', 'seguimientos_perdida.lead_id', '=', 'leads.id')
                ->where('seguimientos_perdida.id', $notif->entidad_id)
                ->first();
            if ($seguimiento) {
                $notif->lead_id = $seguimiento->lead_id;
                $notif->lead_nombre = $seguimiento->nombre_completo;
            }
        }
        
        return $notif;
    });
    
    $totalNoLeidas = $this->contarNoLeidas($usuarioId);
    
    return Inertia::render('Notificaciones/Index', [
        'notificaciones' => $notificaciones,
        'filtros' => $request->only(['tipo', 'leida', 'prioridad']),
        'totalNoLeidas' => $totalNoLeidas,
    ]);
}
    
    /**
     * Vista de notificaciones programadas (futuras)
     */
    public function programadas(Request $request)
    {
        // 🔥 VERIFICAR PERMISO
        $this->authorizePermiso(config('permisos.VER_NOTIFICACIONES_PROGRAMADAS'));
        
        $usuarioId = Auth::id();
        
        // Query base - NOTIFICACIONES FUTURAS (fecha > ahora)
        $query = $this->baseQuery($usuarioId)
            ->where('fecha_notificacion', '>', Carbon::now());
        
        // Aplicar filtros
        if ($request->filled('tipo')) {
            $query->where('tipo', $request->tipo);
        }
        
        if ($request->filled('prioridad')) {
            $query->where('prioridad', $request->prioridad);
        }
        
        if ($request->filled('busqueda')) {
            $busqueda = $request->busqueda;
            $query->where(function($q) use ($busqueda) {
                $q->where('titulo', 'like', "%{$busqueda}%")
                  ->orWhere('mensaje', 'like', "%{$busqueda}%");
            });
        }
        
        // Paginación
        $programadas = $query->paginate(10);
        
        // Transformar resultados con información adicional
        $programadas->getCollection()->transform(function($notificacion) {
            $notif = $this->transformarNotificacion($notificacion);
            $notif->fecha_programada = Carbon::parse($notif->fecha_notificacion);
            $notif->dias_faltantes = Carbon::now()->diffInDays($notif->fecha_programada, false);
            
            // Información adicional según el tipo de entidad
            $notif->lead_nombre = null;
            $notif->lead_id = null;
            
            if ($notif->entidad_tipo === 'comentario') {
                $comentario = DB::table('comentarios')
                    ->select('comentarios.lead_id', 'leads.nombre_completo')
                    ->join('leads', 'comentarios.lead_id', '=', 'leads.id')
                    ->where('comentarios.id', $notif->entidad_id)
                    ->first();
                if ($comentario) {
                    $notif->lead_id = $comentario->lead_id;
                    $notif->lead_nombre = $comentario->nombre_completo;
                }
            }
            
            if ($notif->entidad_tipo === 'lead') {
                $lead = DB::table('leads')
                    ->select('nombre_completo')
                    ->where('id', $notif->entidad_id)
                    ->first();
                if ($lead) {
                    $notif->lead_nombre = $lead->nombre_completo;
                    $notif->lead_id = $notif->entidad_id;
                }
            }
            
            if ($notif->entidad_tipo === 'seguimiento_perdida') {
                $seguimiento = DB::table('seguimientos_perdida')
                    ->select('seguimientos_perdida.lead_id', 'leads.nombre_completo')
                    ->join('leads', 'seguimientos_perdida.lead_id', '=', 'leads.id')
                    ->where('seguimientos_perdida.id', $notif->entidad_id)
                    ->first();
                if ($seguimiento) {
                    $notif->lead_id = $seguimiento->lead_id;
                    $notif->lead_nombre = $seguimiento->nombre_completo;
                }
            }
            
            return $notif;
        });
        
        // Estadísticas
        $estadisticas = [
            'total' => $this->baseQuery($usuarioId)->where('fecha_notificacion', '>', Carbon::now())->count(),
            'hoy' => $this->baseQuery($usuarioId)->whereDate('fecha_notificacion', Carbon::today())->count(),
            'semana' => $this->baseQuery($usuarioId)
                ->whereBetween('fecha_notificacion', [Carbon::now(), Carbon::now()->addDays(7)])
                ->count(),
            'mes' => $this->baseQuery($usuarioId)
                ->whereBetween('fecha_notificacion', [Carbon::now(), Carbon::now()->addDays(30)])
                ->count(),
        ];
        
        return Inertia::render('Notificaciones/Programadas', [
            'programadas' => $programadas,
            'estadisticas' => $estadisticas,
            'filtros' => $request->only(['tipo', 'prioridad', 'busqueda']),
            'tipos' => $this->getTiposNotificaciones(),
        ]);
    }
    
    /**
     * API para dropdown - solo notificaciones NO LEÍDAS
     */
public function ajaxIndex(Request $request)
{
    $usuarioId = Auth::id();
    
    if (!$usuarioId) {
        return $this->jsonError('No autenticado', 401);
    }
    
    $query = $this->baseQuery($usuarioId)
        ->where('fecha_notificacion', '<=', Carbon::now());
    
    if (!$request->get('todas', false)) {
        $query->where('leida', false);
    }
    
    $limit = $request->get('limit', 10);
    $notificaciones = $query->limit($limit)->get()
        ->map(function($notif) {
            $notif = $this->transformarNotificacion($notif);
            
            // 🔥 OBTENER LEAD_ID PARA COMENTARIOS
            $notif->lead_id = null;
            $notif->lead_nombre = null;
            
            if ($notif->entidad_tipo === 'comentario') {
                $comentario = DB::table('comentarios')
                    ->select('comentarios.lead_id', 'leads.nombre_completo')
                    ->join('leads', 'comentarios.lead_id', '=', 'leads.id')
                    ->where('comentarios.id', $notif->entidad_id)
                    ->first();
                if ($comentario) {
                    $notif->lead_id = $comentario->lead_id;
                    $notif->lead_nombre = $comentario->nombre_completo;
                }
            } elseif ($notif->entidad_tipo === 'lead') {
                $lead = DB::table('leads')
                    ->select('nombre_completo')
                    ->where('id', $notif->entidad_id)
                    ->first();
                if ($lead) {
                    $notif->lead_nombre = $lead->nombre_completo;
                    $notif->lead_id = $notif->entidad_id;
                }
            } elseif ($notif->entidad_tipo === 'seguimiento_perdida') {
                $seguimiento = DB::table('seguimientos_perdida')
                    ->select('seguimientos_perdida.lead_id', 'leads.nombre_completo')
                    ->join('leads', 'seguimientos_perdida.lead_id', '=', 'leads.id')
                    ->where('seguimientos_perdida.id', $notif->entidad_id)
                    ->first();
                if ($seguimiento) {
                    $notif->lead_id = $seguimiento->lead_id;
                    $notif->lead_nombre = $seguimiento->nombre_completo;
                }
            }
            
            return $notif;
        });
    
    return response()->json([
        'success' => true,
        'data' => $notificaciones,
        'meta' => [
            'total_no_leidas' => $this->contarNoLeidas($usuarioId)
        ]
    ]);
}
    
    /**
     * Marcar una notificación como leída
     */
    public function marcarLeida($id)
    {
        return $this->marcarLeidas([$id]);
    }
    
    /**
     * Marcar múltiples notificaciones como leídas
     */
    public function marcarTodasLeidas(Request $request)
    {
        $usuarioId = Auth::id();
        
        $ids = $request->input('ids', []);
        
        if (empty($ids)) {
            // Marcar todas las no leídas
            $query = DB::table('notificaciones')
                ->where('usuario_id', $usuarioId)
                ->where('leida', false)
                ->whereNull('deleted_at');
            
            $porActualizar = $query->count();
            
            $query->update([
                'leida' => true,
                'fecha_leida' => now()
            ]);
            
            $mensaje = $porActualizar > 0 
                ? "{$porActualizar} notificaciones marcadas como leídas"
                : 'No hay notificaciones por marcar';
            
            return $this->jsonSuccess($mensaje, [
                'actualizadas' => $porActualizar,
                'total_no_leidas' => 0
            ]);
        }
        
        return $this->marcarLeidas($ids);
    }
    
    /**
     * Eliminar una notificación (soft delete)
     */
    public function destroy($id)
    {
        $usuarioId = Auth::id();
        
        $actualizado = DB::table('notificaciones')
            ->where('id', $id)
            ->where('usuario_id', $usuarioId)
            ->update([
                'deleted_at' => now(),
                'deleted_by' => $usuarioId
            ]);
        
        if ($actualizado) {
            return $this->jsonSuccess('Notificación eliminada', [
                'total_no_leidas' => $this->contarNoLeidas($usuarioId)
            ]);
        }
        
        return $this->jsonError('No se pudo eliminar la notificación', 400);
    }
    
    /**
     * Obtener contador de notificaciones no leídas
     */
    public function contador()
    {
        $usuarioId = Auth::id();
        
        $total = $this->contarNoLeidas($usuarioId);
        
        $porPrioridad = DB::table('notificaciones')
            ->where('usuario_id', $usuarioId)
            ->where('leida', false)
            ->whereNull('deleted_at')
            ->where('fecha_notificacion', '<=', now())
            ->select('prioridad', DB::raw('COUNT(*) as cantidad'))
            ->groupBy('prioridad')
            ->get()
            ->pluck('cantidad', 'prioridad')
            ->toArray();
        
        return response()->json([
            'success' => true,
            'data' => [
                'total' => $total,
                'por_prioridad' => $porPrioridad
            ]
        ]);
    }
    
    // ==================== MÉTODOS PRIVADOS ====================
    
    /**
     * Query base para notificaciones
     */
    private function baseQuery($usuarioId)
    {
        return DB::table('notificaciones')
            ->where('usuario_id', $usuarioId)
            ->whereNull('deleted_at');
    }
    
    /**
     * Aplicar filtros comunes a la query
     */
    private function aplicarFiltros($query, Request $request)
    {
        if ($request->filled('leida')) {
            $query->where('leida', $request->leida === 'true' ? 1 : 0);
        }
        
        if ($request->filled('tipo')) {
            $query->where('tipo', $request->tipo);
        }
        
        if ($request->filled('prioridad')) {
            $query->where('prioridad', $request->prioridad);
        }
    }
    
    /**
     * Transformar una notificación (convertir booleanos)
     */
    private function transformarNotificacion($notificacion)
    {
        $notificacion->leida = (bool) $notificacion->leida;
        return $notificacion;
    }
    
    /**
     * Contar notificaciones no leídas activas
     */
    private function contarNoLeidas($usuarioId)
    {
        return DB::table('notificaciones')
            ->where('usuario_id', $usuarioId)
            ->where('leida', false)
            ->whereNull('deleted_at')
            ->where('fecha_notificacion', '<=', now())
            ->count();
    }
    
    /**
     * Marcar múltiples notificaciones como leídas
     */
    private function marcarLeidas(array $ids)
    {
        $usuarioId = Auth::id();
        
        $actualizados = DB::table('notificaciones')
            ->whereIn('id', $ids)
            ->where('usuario_id', $usuarioId)
            ->whereNull('deleted_at')
            ->update([
                'leida' => true,
                'fecha_leida' => now()
            ]);
        
        return $this->jsonSuccess(
            $actualizados > 0 ? 'Notificaciones marcadas como leídas' : 'No se actualizó ninguna',
            [
                'actualizados' => $actualizados,
                'total_no_leidas' => $this->contarNoLeidas($usuarioId)
            ]
        );
    }
    
    /**
     * Respuesta JSON exitosa
     */
    private function jsonSuccess($message, $extra = [])
    {
        return response()->json(array_merge([
            'success' => true,
            'message' => $message
        ], $extra));
    }
    
    /**
     * Respuesta JSON de error
     */
    private function jsonError($message, $status = 400)
    {
        return response()->json([
            'success' => false,
            'error' => $message
        ], $status);
    }
    
    /**
     * Obtener lista de tipos de notificaciones
     */
    private function getTiposNotificaciones()
    {
        return [
            'lead_sin_contactar' => 'Lead sin contactar',
            'lead_proximo_contacto' => 'Próximo contacto',
            'presupuesto_por_vencer' => 'Presupuesto por vencer',
            'presupuesto_vencido' => 'Presupuesto vencido',
            'contrato_por_vencer' => 'Contrato por vencer',
            'recordatorio_seguimiento' => 'Recordatorio seguimiento',
            'asignacion_lead' => 'Asignación lead',
            'comentario_recordatorio' => 'Recordatorio comentario',
            'lead_posible_recontacto' => 'Posible recontacto de lead perdido',
            'actividad_sospechosa' => 'Actividad sospechosa',
            'error_servidor' => 'Error del servidor', 
            'transferencia_lead' => 'Transferencia de lead',
            'transferencia_empresa' => 'Transferencia de empresa', 
        ];
    }
}