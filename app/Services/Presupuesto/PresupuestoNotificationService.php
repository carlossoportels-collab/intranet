<?php
// app/Services/Presupuesto/PresupuestoNotificationService.php

namespace App\Services\Presupuesto;

use App\Models\Presupuesto;
use App\Models\Notificacion;
use App\Models\Comercial;
use App\Models\Lead;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class PresupuestoNotificationService
{
    


    /**
     * Crear notificación para presupuesto vencido (genérico)
     */
    public function notificarVencido(Presupuesto $presupuesto): void
    {
        // Verificar si ya existe una notificación similar no leída
        $existe = Notificacion::where('usuario_id', $presupuesto->created_by)
            ->where('entidad_tipo', 'presupuesto')
            ->where('entidad_id', $presupuesto->id)
            ->where('tipo', 'presupuesto_vencido')
            ->where('leida', false)
            ->exists();

        if ($existe) {
            return;
        }

        $referencia = $this->getReferencia($presupuesto);
        
        Notificacion::create([
            'usuario_id' => $presupuesto->created_by,
            'titulo' => '⚠️ Presupuesto vencido',
            'mensaje' => "El presupuesto {$referencia} para {$presupuesto->lead->nombre_completo} ha vencido. Por favor, actualiza su estado.",
            'tipo' => 'presupuesto_vencido',
            'entidad_tipo' => 'presupuesto',
            'entidad_id' => $presupuesto->id,
            'leida' => false,
            'fecha_notificacion' => now(),
            'prioridad' => 'urgente',
            'created' => now()
        ]);

        Log::info('Notificación de presupuesto vencido', [
            'presupuesto_id' => $presupuesto->id,
            'referencia' => $referencia
        ]);
    }

    /**
     * NUEVO: Crear notificación para presupuesto vencido hace más de 30 días
     * con lead en estado activo
     */
    public function notificarPresupuestoVencidoLargo(Presupuesto $presupuesto, int $diasVencido): void
    {
        // Verificar si ya existe una notificación similar no leída para este presupuesto
        $existe = Notificacion::where('usuario_id', $presupuesto->created_by)
            ->where('entidad_tipo', 'presupuesto')
            ->where('entidad_id', $presupuesto->id)
            ->where('tipo', 'presupuesto_vencido_largo')
            ->where('leida', false)
            ->exists();

        if ($existe) {
            return;
        }

        $referencia = $this->getReferencia($presupuesto);
        $lead = $presupuesto->lead;
        
        Notificacion::create([
            'usuario_id' => $presupuesto->created_by,
            'titulo' => '⚠️ Presupuesto vencido hace más de 30 días',
            'mensaje' => "El presupuesto {$referencia} para {$lead->nombre_completo} lleva {$diasVencido} días vencido. El lead aún está activo, considera generar un nuevo presupuesto.",
            'tipo' => 'presupuesto_vencido_largo',
            'entidad_tipo' => 'presupuesto',
            'entidad_id' => $presupuesto->id,
            'leida' => false,
            'fecha_notificacion' => now(),
            'prioridad' => 'urgente',
            'created' => now()
        ]);

        Log::info('Notificación de presupuesto vencido largo plazo', [
            'presupuesto_id' => $presupuesto->id,
            'referencia' => $referencia,
            'lead_id' => $lead->id,
            'dias_vencido' => $diasVencido
        ]);
    }

    /**
     * Verificar presupuestos
     */
    public function verificarPresupuestos(): array
    {
        $hoy = Carbon::now()->startOfDay();
        $notificacionesCreadas = 0;
        $presupuestosProcesados = 0;

        // 1. Presupuestos que vencen mañana
        $manana = $hoy->copy()->addDay();
        $presupuestosManana = Presupuesto::whereDate('validez', $manana)
            ->where('estado_id', 1) // Activos
            ->whereNull('deleted_at')
            ->get();

        foreach ($presupuestosManana as $presupuesto) {
            $this->notificarVenceManana($presupuesto);
            $notificacionesCreadas++;
            $presupuestosProcesados++;
        }

        // 2. Presupuestos vencidos (fecha de validez menor a hoy)
        $presupuestosVencidos = Presupuesto::where('validez', '<', $hoy)
            ->where('estado_id', 1) // Activos
            ->whereNull('deleted_at')
            ->get();

        foreach ($presupuestosVencidos as $presupuesto) {
            // Cambiar estado a vencido
            $presupuesto->estado_id = 2; // Vencido
            $presupuesto->save();
            
            // Crear notificación de vencimiento normal
            $this->notificarVencido($presupuesto);
            $notificacionesCreadas++;
            $presupuestosProcesados++;
        }

        // 3. NUEVO: Presupuestos vencidos hace más de 30 días con lead activo
        $fechaLimite = $hoy->copy()->subDays(30);
        
        $presupuestosVencidosLargo = Presupuesto::where('validez', '<', $fechaLimite)
            ->where('estado_id', 2) // Estado vencido
            ->whereNull('deleted_at')
            ->whereHas('lead', function($query) {
                // Lead con estado_lead.tipo = 'activo'
                $query->whereHas('estadoLead', function($q) {
                    $q->where('tipo', 'activo');
                })->where('es_activo', 1);
            })
            ->get();

        foreach ($presupuestosVencidosLargo as $presupuesto) {
            $fechaVencimiento = Carbon::parse($presupuesto->validez);
            $diasVencido = $fechaVencimiento->diffInDays($hoy);
            
            // Verificar que no tenga ya una notificación de este tipo
            $yaNotificado = Notificacion::where('entidad_tipo', 'presupuesto')
                ->where('entidad_id', $presupuesto->id)
                ->where('tipo', 'presupuesto_vencido_largo')
                ->exists();
                
            if (!$yaNotificado) {
                $this->notificarPresupuestoVencidoLargo($presupuesto, $diasVencido);
                $notificacionesCreadas++;
                $presupuestosProcesados++;
            }
        }

        Log::info('Verificación de presupuestos completada', [
            'procesados' => $presupuestosProcesados,
            'notificaciones' => $notificacionesCreadas,
            'vencidos_largo_plazo' => $presupuestosVencidosLargo->count()
        ]);

        return [
            'procesados' => $presupuestosProcesados,
            'notificaciones' => $notificacionesCreadas
        ];
    }

    /**
     * Marcar notificaciones como leídas cuando se ve un presupuesto
     */
    public function marcarNotificacionesComoLeidas(int $presupuestoId, int $usuarioId): int
    {
        return Notificacion::where('entidad_tipo', 'presupuesto')
            ->where('entidad_id', $presupuestoId)
            ->where('usuario_id', $usuarioId)
            ->where('leida', false)
            ->update([
                'leida' => true,
                'fecha_leida' => now()
            ]);
    }

    /**
     * Eliminar notificaciones pendientes de un presupuesto
     */
    public function eliminarNotificacionesPendientes(int $presupuestoId, int $usuarioId): int
    {
        return Notificacion::where('entidad_tipo', 'presupuesto')
            ->where('entidad_id', $presupuestoId)
            ->where('usuario_id', $usuarioId)
            ->where('leida', false)
            ->where('fecha_notificacion', '>', now())
            ->update([
                'deleted_at' => now(),
                'deleted_by' => $usuarioId
            ]);
    }

    // ==================== MÉTODOS PRIVADOS ====================

    private function getReferencia(Presupuesto $presupuesto): string
    {
        if ($presupuesto->prefijo) {
            return $presupuesto->prefijo->codigo . '-' . 
                   date('Y', strtotime($presupuesto->created)) . '-' . 
                   $presupuesto->id;
        }
        return 'LS-' . date('Y', strtotime($presupuesto->created)) . '-' . $presupuesto->id;
    }

    private function calcularDiasValidez(Presupuesto $presupuesto): int
    {
        $fechaCreacion = Carbon::parse($presupuesto->created)->startOfDay();
        $fechaValidez = Carbon::parse($presupuesto->validez)->startOfDay();
        return (int) $fechaCreacion->diffInDays($fechaValidez);
    }
}