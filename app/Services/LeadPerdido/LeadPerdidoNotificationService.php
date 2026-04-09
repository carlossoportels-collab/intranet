<?php
// app/Services/LeadPerdido/LeadPerdidoNotificationService.php

namespace App\Services\LeadPerdido;

use App\Models\Lead;
use App\Models\Comentario;
use App\Models\TipoComentario;
use App\Models\SeguimientoPerdida;
use App\Models\Usuario;
use App\Traits\HasPermisosService; // 🔥 IMPORTAR TRAIT
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LeadPerdidoNotificationService
{
    use HasPermisosService; // 🔥 AGREGAR TRAIT

    public function __construct()
    {
        $this->initializePermisoService(); // 🔥 INICIALIZAR
    }

    /**
     * Crear notificación de seguimiento (recordatorio)
     */
    public function crearNotificacionSeguimiento(
        Comentario $comentario,
        TipoComentario $tipoComentario,
        string $fechaRecordatorio,
        int $usuarioId
    ): bool {
        try {
            $this->eliminarRecordatoriosFuturos($comentario->lead_id, $usuarioId);
            
            $fechaRecordatorioObj = \Carbon\Carbon::parse($fechaRecordatorio);
            $diasFaltantes = now()->diffInDays($fechaRecordatorioObj, false);
            
            $prioridad = match(true) {
                $diasFaltantes <= 2 => 'urgente',
                $diasFaltantes <= 7 => 'alta',
                default => 'normal'
            };

            $tituloBase = $tipoComentario->nombre === 'Reagendado' 
                ? 'Reagendado: ' 
                : '';
            
            DB::table('notificaciones')->insert([
                'usuario_id' => $usuarioId,
                'titulo' => $tituloBase . 'Seguimiento: ' . $tipoComentario->nombre,
                'mensaje' => substr($comentario->comentario, 0, 150) . '...',
                'tipo' => 'recontacto_recordatorio',
                'entidad_tipo' => 'comentario',
                'entidad_id' => $comentario->id,
                'leida' => false,
                'fecha_notificacion' => $fechaRecordatorioObj,
                'prioridad' => $prioridad,
                'created' => now()
            ]);

            Log::info('Notificación de seguimiento creada', [
                'comentario_id' => $comentario->id,
                'lead_id' => $comentario->lead_id,
                'fecha_recordatorio' => $fechaRecordatorio
            ]);

            return true;
        } catch (\Exception $e) {
            Log::error('Error al crear notificación de seguimiento:', [
                'comentario_id' => $comentario->id,
                'error' => $e->getMessage()
            ]);
            return false;
        }
    }

/**
 * Crear notificación de recontacto para lead perdido
 */
public function crearNotificacionRecontacto(
    Lead $lead,
    string $fechaRecontacto,
    int $usuarioId,
    int $comentarioId
): bool {
    try {
        $fechaRecontactoObj = \Carbon\Carbon::parse($fechaRecontacto);
        $diasFaltantes = now()->diffInDays($fechaRecontactoObj, false);

        if ($diasFaltantes <= 0) {
            Log::warning('Fecha de recontacto no es futura');
            return false;
        }

        $prioridad = match(true) {
            $diasFaltantes <= 3 => 'alta',
            $diasFaltantes <= 7 => 'normal',
            $diasFaltantes <= 14 => 'normal',
            default => 'baja'
        };

        // Obtener el tipo de comentario para personalizar el título
        $comentario = Comentario::with('tipoComentario')->find($comentarioId);
        $tipoNombre = $comentario?->tipoComentario?->nombre ?? 'Seguimiento';

        DB::table('notificaciones')->insert([
            'usuario_id' => $usuarioId,
            'titulo' => "Recontacto: {$tipoNombre}",
            'mensaje' => substr($comentario?->comentario ?? 'Recordatorio de recontacto', 0, 150),
            'tipo' => 'lead_posible_recontacto',
            'entidad_tipo' => 'comentario',
            'entidad_id' => $comentarioId,
            'leida' => false,
            'fecha_notificacion' => $fechaRecontactoObj,
            'prioridad' => $prioridad,
            'created' => now()
        ]);

        Log::info('Notificación de recontacto creada', [
            'comentario_id' => $comentarioId,
            'lead_id' => $lead->id,
            'fecha_recontacto' => $fechaRecontacto
        ]);

        return true;
    } catch (\Exception $e) {
        Log::error('Error al crear notificación de recontacto:', [
            'lead_id' => $lead->id,
            'error' => $e->getMessage()
        ]);
        return false;
    }
}

    /**
     * Eliminar todas las notificaciones pendientes de un lead
     */
    public function eliminarNotificacionesPendientes(int $leadId, int $usuarioId): int
    {
        try {
            return DB::table('notificaciones')
                ->where('usuario_id', $usuarioId)
                ->whereIn('tipo', ['recontacto_recordatorio', 'lead_sin_contactar'])
                ->where('entidad_id', $leadId)
                ->where('leida', false)
                ->whereNull('deleted_at')
                ->where('fecha_notificacion', '>', now())
                ->update([
                    'deleted_at' => now(),
                    'deleted_by' => $usuarioId
                ]);
        } catch (\Exception $e) {
            Log::error('Error eliminando notificaciones:', [
                'lead_id' => $leadId,
                'error' => $e->getMessage()
            ]);
            return 0;
        }
    }

    /**
     * Eliminar recordatorios futuros para un lead
     */
    private function eliminarRecordatoriosFuturos(int $leadId, int $usuarioId): int
    {
        $comentariosIds = DB::table('comentarios')
            ->where('lead_id', $leadId)
            ->whereNull('deleted_at')
            ->pluck('id')
            ->toArray();

        $eliminados = 0;

        if (!empty($comentariosIds)) {
            $eliminados += DB::table('notificaciones')
                ->where('usuario_id', $usuarioId)
                ->where('tipo', 'recontacto_recordatorio')
                ->whereIn('entidad_id', $comentariosIds)
                ->where('entidad_tipo', 'comentario')
                ->where('fecha_notificacion', '>', now())
                ->whereNull('deleted_at')
                ->update([
                    'deleted_at' => now(),
                    'deleted_by' => $usuarioId
                ]);
        }

        return $eliminados;
    }

    /**
     * Eliminar notificaciones de recontacto futuras
     */
    public function eliminarNotificacionesRecontactoFuturas(
        int $leadId,
        int $usuarioId,
        ?int $excluirComentarioId = null
    ): int {
        try {
            $comentariosIds = DB::table('comentarios')
                ->where('lead_id', $leadId)
                ->whereNull('deleted_at')
                ->pluck('id')
                ->toArray();

            if ($excluirComentarioId) {
                $comentariosIds = array_filter($comentariosIds, 
                    fn($id) => $id != $excluirComentarioId
                );
            }

            $eliminadas = 0;

            if (!empty($comentariosIds)) {
                $eliminadas += DB::table('notificaciones')
                    ->where('usuario_id', $usuarioId)
                    ->where('tipo', 'lead_posible_recontacto')
                    ->whereIn('entidad_id', $comentariosIds)
                    ->where('entidad_tipo', 'comentario')
                    ->where('fecha_notificacion', '>', now())
                    ->whereNull('deleted_at')
                    ->update(['deleted_at' => now(), 'deleted_by' => $usuarioId]);
            }

            // También eliminar de seguimientos_perdida
            $eliminadas += DB::table('notificaciones')
                ->where('usuario_id', $usuarioId)
                ->where('tipo', 'lead_posible_recontacto')
                ->where('entidad_tipo', 'seguimiento_perdida')
                ->whereExists(fn($q) => $q->select(DB::raw(1))
                    ->from('seguimientos_perdida')
                    ->whereColumn('seguimientos_perdida.id', 'notificaciones.entidad_id')
                    ->where('seguimientos_perdida.lead_id', $leadId))
                ->where('fecha_notificacion', '>', now())
                ->whereNull('deleted_at')
                ->update(['deleted_at' => now(), 'deleted_by' => $usuarioId]);

            return $eliminadas;
        } catch (\Exception $e) {
            Log::error('Error eliminando notificaciones futuras:', [
                'lead_id' => $leadId,
                'error' => $e->getMessage()
            ]);
            return 0;
        }
    }

    /**
     * Contar notificaciones de recontacto programadas
     */
    public function contarNotificacionesProgramadas(Usuario $usuario): int
    {
        $usuarioId = $usuario->id;
        
        // Función helper para construir cada query
        $buildQuery = function(string $entidadTipo, string $tablaJoin, string $leadAlias) use ($usuario, $usuarioId) {
            $query = DB::table('notificaciones as n')
                ->join("{$tablaJoin} as tj", function($join) use ($entidadTipo) {
                    $join->on('n.entidad_id', '=', 'tj.id')
                         ->where('n.entidad_tipo', '=', $entidadTipo);
                })
                ->join("leads as {$leadAlias}", "tj.lead_id", '=', "{$leadAlias}.id")
                ->where('n.tipo', 'lead_posible_recontacto')
                ->where("{$leadAlias}.es_cliente", 0)
                ->whereNull('n.deleted_at')
                ->where('n.leida', 0)
                ->where('n.fecha_notificacion', '>=', now()->startOfDay())
                ->whereNull('tj.deleted_at')
                ->whereNull("{$leadAlias}.deleted_at");

            // Aplicar filtro de permisos usando el servicio
            if (!$usuario->ve_todas_cuentas) {
                $prefijosPermitidos = $this->getPrefijosPermitidos($usuarioId);
                if (empty($prefijosPermitidos)) {
                    return null; // Indicar que no hay resultados
                }
                $query->whereIn("{$leadAlias}.prefijo_id", $prefijosPermitidos);
            }

            return $query;
        };

        $total = 0;

        // Contar seguimientos_perdida
        if ($querySeguimiento = $buildQuery('seguimiento_perdida', 'seguimientos_perdida', 'l1')) {
            $total += $querySeguimiento->count();
        }

        // Contar comentarios
        if ($queryComentario = $buildQuery('comentario', 'comentarios', 'l2')) {
            // Necesitamos el EXISTS adicional para comentarios
            $queryComentario->whereExists(function($q) {
                $q->select(DB::raw(1))
                  ->from('seguimientos_perdida')
                  ->whereColumn('seguimientos_perdida.lead_id', 'l2.id')
                  ->whereNull('seguimientos_perdida.deleted_at');
            });
            
            $total += $queryComentario->count();
        }

        return $total;
    }
}