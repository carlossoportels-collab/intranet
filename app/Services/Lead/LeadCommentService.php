<?php

namespace App\Services\Lead;

use App\Models\Lead;
use App\Models\Comentario;
use App\Models\TipoComentario;
use App\Models\EstadoLead;
use App\Models\SeguimientoPerdida;
use App\Models\MotivoPerdida;
use App\Models\Presupuesto;
use App\Services\Lead\Notifications\LeadCommentNotificationService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LeadCommentService
{
    
    public function __construct(
        private LeadCommentNotificationService $notificationService,
        private LeadAuditService $auditService
    ) {
        $this->notificationService = $notificationService;
        $this->auditService = $auditService;
    }
    
    /**
     * Crear comentario con todas sus funcionalidades
     */
    public function crearComentario(array $data, int $leadId, int $usuarioId): array
    {
        $lead = Lead::findOrFail($leadId);
        
        DB::beginTransaction();
        
        try {
            $tipoComentario = TipoComentario::findOrFail($data['tipo_comentario_id']);
            $esRechazo = $tipoComentario->nombre === 'Rechazo lead';
            
            // Validar comentario solo si NO es rechazo
            if (!$esRechazo && empty($data['comentario'])) {
                throw new \Exception('El comentario es obligatorio para este tipo de acción.');
            }
            
            // Para rechazo, si no hay comentario, usar uno por defecto
            $comentarioTexto = $data['comentario'];
            if ($esRechazo && empty($comentarioTexto)) {
                $motivo = MotivoPerdida::find($data['motivo_perdida_id'] ?? 0);
                $comentarioTexto = 'Lead rechazado' . ($motivo ? ' - Motivo: ' . $motivo->nombre : '');
            }
            
            // 1. Crear comentario
            $comentario = Comentario::create([
                'lead_id' => $leadId,
                'usuario_id' => $usuarioId,
                'tipo_comentario_id' => $data['tipo_comentario_id'],
                'comentario' => $comentarioTexto,
                'created' => now()
            ]);
            
            $resultado = [
                'comentario' => $comentario,
                'mensaje' => 'Comentario guardado exitosamente',
                'acciones' => ['comentario_creado']
            ];
            
            // 2. Manejar rechazo de lead (solo si no es cliente)
            if ($esRechazo && $lead->es_cliente != 1) {
                $this->procesarRechazoLead($data, $lead, $usuarioId, $comentario);
                $resultado['mensaje'] = 'Lead rechazado exitosamente. Se registró en seguimientos de pérdida.';
                $resultado['acciones'][] = 'rechazo_procesado';
            }
            
            // 3. Manejar notificaciones de recordatorio (solo si no es rechazo)
            if (!$esRechazo && !empty($data['crea_recordatorio']) && !empty($data['dias_recordatorio'])) {
                $this->notificationService->crearNotificacionRecordatorio(
                    $comentario, 
                    $tipoComentario, 
                    $data['dias_recordatorio'], 
                    $usuarioId
                );
                $resultado['mensaje'] .= ' con recordatorio';
                $resultado['acciones'][] = 'recordatorio_creado';
            }
            
            // 4. Cambiar estado del lead automáticamente (solo si no es cliente)
            if (!empty($data['cambiar_estado_lead']) && $lead->es_cliente != 1) {
                $estadoCambiado = $this->cambiarEstadoLead($lead, $tipoComentario, $usuarioId);
                if ($estadoCambiado) {
                    $resultado['mensaje'] .= ' y estado actualizado';
                    $resultado['acciones'][] = 'estado_cambiado';
                    $resultado['nuevo_estado'] = $estadoCambiado;
                }
            }
            
            DB::commit();
            return $resultado;
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
    }
        
    /**
     * Obtener comentarios de un lead
     */
    public function getComentariosLead(int $leadId): array
    {
        $lead = Lead::findOrFail($leadId);
        
        $comentarios = Comentario::with(['tipoComentario', 'usuario.personal'])
            ->where('lead_id', $leadId)
            ->whereNull('deleted_at')
            ->orderBy('created', 'desc')
            ->get();
        
        $comentariosLegacy = DB::table('comentarios_legacy')
            ->where('lead_id', $leadId)
            ->orderBy('created', 'desc')
            ->get();
        
        return [
            'lead' => [
                'id' => $lead->id,
                'nombre_completo' => $lead->nombre_completo,
                'email' => $lead->email,
                'telefono' => $lead->telefono,
                'es_cliente' => $lead->es_cliente,
            ],
            'comentarios' => $comentarios,
            'comentariosLegacy' => $comentariosLegacy,
        ];
    }
    
    /**
     * Procesar rechazo de lead
     */
    private function procesarRechazoLead(array $data, Lead $lead, int $usuarioId, Comentario $comentario): void
    {
        if (empty($data['motivo_perdida_id'])) {
            throw new \Exception('Para rechazar un lead es necesario seleccionar un motivo de pérdida.');
        }
        
        // Crear seguimiento de pérdida
        $seguimiento = SeguimientoPerdida::create([
            'lead_id' => $lead->id,
            'motivo_perdida_id' => $data['motivo_perdida_id'],
            'notas_adicionales' => $data['notas_adicionales'] ?? null,
            'created' => now(),
            'posibilidades_futuras' => $data['posibilidades_futuras'] ?? 'no',
            'fecha_posible_recontacto' => $data['fecha_posible_recontacto'] ?? null,
        ]);
        
        // 🔥 NUEVO: Actualizar presupuestos a estado 4 (Rechazado)
        $this->actualizarPresupuestosRechazados($lead->id, $usuarioId);
        
        // Crear notificación de recontacto si aplica
        if (!empty($data['fecha_posible_recontacto']) && ($data['posibilidades_futuras'] ?? 'no') !== 'no') {
            $this->notificationService->crearNotificacionRecontacto(
                $lead, 
                $data['fecha_posible_recontacto'], 
                $usuarioId, 
                $seguimiento->id
            );
        }
        
        // Eliminar notificaciones pendientes
        $this->notificationService->eliminarNotificacionesPendientes($lead->id, $usuarioId);
        
        // Registrar auditoría
        $this->auditService->registrarRechazoLead($lead, $usuarioId, $data, $comentario->id);
    }
    
    /**
     * 🔥 NUEVO: Actualizar presupuestos asociados al lead a estado Rechazado (4)
     */
    private function actualizarPresupuestosRechazados(int $leadId, int $usuarioId): void
    {
        try {
            // Buscar presupuestos activos del lead que no estén ya rechazados
            $presupuestos = Presupuesto::where('lead_id', $leadId)
                ->where('activo', 1)
                ->whereNull('deleted_at')
                ->where('estado_id', '!=', 4) // Estado 4 = Rechazado
                ->get();
            
            if ($presupuestos->isEmpty()) {
                return;
            }
            
            foreach ($presupuestos as $presupuesto) {
                $presupuesto->estado_id = 4; // Rechazado
                $presupuesto->modified = now();
                $presupuesto->modified_by = $usuarioId;
                $presupuesto->save();
                
                // Registrar auditoría del cambio
                DB::table('auditoria_log')->insert([
                    'tabla_afectada' => 'presupuestos',
                    'registro_id' => $presupuesto->id,
                    'accion' => 'UPDATE',
                    'usuario_id' => $usuarioId,
                    'valores_anteriores' => json_encode(['estado_id' => $presupuesto->getOriginal('estado_id')]),
                    'valores_nuevos' => json_encode(['estado_id' => 4, 'razon' => 'Lead rechazado']),
                    'ip_address' => request()->ip(),
                    'user_agent' => request()->userAgent(),
                    'created' => now(),
                ]);
            }
            
            Log::info('Presupuestos actualizados a rechazados', [
                'lead_id' => $leadId,
                'usuario_id' => $usuarioId,
                'cantidad_presupuestos' => $presupuestos->count()
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error al actualizar presupuestos a rechazados', [
                'lead_id' => $leadId,
                'error' => $e->getMessage()
            ]);
            // No lanzamos excepción para no interrumpir el flujo principal
        }
    }
    
    /**
     * Cambiar estado del lead
     */
    private function cambiarEstadoLead(Lead $lead, TipoComentario $tipoComentario, int $usuarioId): ?EstadoLead
    {
        $estadoMap = $this->getEstadoMap();
        $nuevoEstadoNombre = $estadoMap[$tipoComentario->nombre] ?? null;
        
        if (!$nuevoEstadoNombre) {
            return null;
        }
        
        $nuevoEstado = EstadoLead::where('nombre', $nuevoEstadoNombre)->first();
        
        if (!$nuevoEstado || $lead->estado_lead_id == $nuevoEstado->id) {
            return null;
        }
        
        $estadoAnterior = EstadoLead::find($lead->estado_lead_id);
        $lead->estado_lead_id = $nuevoEstado->id;
        $lead->modified = now();
        $lead->modified_by = $usuarioId;
        $lead->save();
        
        // Registrar auditoría
        $this->auditService->registrarCambioEstado(
            $lead->id, 
            $estadoAnterior, 
            $nuevoEstado, 
            $usuarioId, 
            $tipoComentario->nombre
        );
        
        return $nuevoEstado;
    }
    
    /**
     * Obtener mapeo de tipos de comentario a estados
     */
    private function getEstadoMap(): array
    {
        return [
            'Contacto inicial' => 'Contactado',
            'Seguimiento lead' => 'Seguimiento',
            'Negociación' => 'Negociación',
            'Propuesta enviada' => 'Propuesta Enviada',
            'Rechazo lead' => 'Perdido',
            'Pausa temporal' => 'Pausado',
        ];
    }
    
    /**
     * Obtener recordatorios futuros de un lead
     */
    public function obtenerRecordatoriosFuturos(int $leadId, int $usuarioId): array
    {
        $comentariosIds = Comentario::where('lead_id', $leadId)
            ->whereNull('deleted_at')
            ->pluck('id');
        
        if ($comentariosIds->isEmpty()) {
            return [];
        }
        
        return DB::table('notificaciones as n')
            ->join('comentarios as c', 'n.entidad_id', '=', 'c.id')
            ->where('n.usuario_id', $usuarioId)
            ->where('n.tipo', 'comentario_recordatorio')
            ->whereIn('n.entidad_id', $comentariosIds)
            ->where('n.entidad_tipo', 'comentario')
            ->where('n.fecha_notificacion', '>', now())
            ->whereNull('n.deleted_at')
            ->select(
                'n.id',
                'n.titulo',
                'n.fecha_notificacion',
                'n.prioridad',
                'c.comentario',
                DB::raw('DATEDIFF(n.fecha_notificacion, NOW()) as dias_restantes')
            )
            ->orderBy('n.fecha_notificacion', 'asc')
            ->get()
            ->toArray();
    }
}