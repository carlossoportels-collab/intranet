<?php
// app/Services/Contrato/ContratoNotificationService.php

namespace App\Services\Contrato;

use App\Models\Contrato;
use App\Models\Notificacion;
use Carbon\Carbon;
use Illuminate\Support\Facades\Log;

class ContratoNotificationService
{
    /**
     * NOTA: Se eliminó notificarContratoCreado() porque no es necesario
     */

    /**
     * Notificar cuando un contrato pasa a pendiente (1 mes sin instalar)
     */
    public function notificarContratoPendiente(Contrato $contrato): void
    {
        // Verificar si ya existe una notificación similar no leída
        $existe = Notificacion::where('usuario_id', $contrato->created_by)
            ->where('entidad_tipo', 'contrato')
            ->where('entidad_id', $contrato->id)
            ->where('tipo', 'contrato_pendiente')
            ->where('leida', false)
            ->exists();

        if ($existe) {
            return;
        }

        $numeroContrato = str_pad($contrato->id, 6, '0', STR_PAD_LEFT);
        $dias = Carbon::parse($contrato->created)->diffInDays(now());
        
        Notificacion::create([
            'usuario_id' => $contrato->created_by,
            'titulo' => '⏳ Contrato pendiente de instalación',
            'mensaje' => "El contrato N° {$numeroContrato} para {$contrato->cliente_nombre_completo} lleva {$dias} días sin instalación. Por favor, coordinar la instalación.",
            'tipo' => 'contrato_pendiente',
            'entidad_tipo' => 'contrato',
            'entidad_id' => $contrato->id,
            'leida' => false,
            'fecha_notificacion' => now(),
            'prioridad' => 'alta',
            'created' => now()
        ]);

        Log::info('Notificación de contrato pendiente', [
            'contrato_id' => $contrato->id,
            'numero' => $numeroContrato,
            'dias' => $dias
        ]);
    }

    /**
     * Notificar cuando un contrato se marca como instalado
     */
    public function notificarContratoInstalado(Contrato $contrato): void
    {
        $numeroContrato = str_pad($contrato->id, 6, '0', STR_PAD_LEFT);
        
        Notificacion::create([
            'usuario_id' => $contrato->created_by,
            'titulo' => '✅ Contrato instalado',
            'mensaje' => "El contrato N° {$numeroContrato} para {$contrato->cliente_nombre_completo} ha sido marcado como instalado.",
            'tipo' => 'contrato_instalado',
            'entidad_tipo' => 'contrato',
            'entidad_id' => $contrato->id,
            'leida' => false,
            'fecha_notificacion' => now(),
            'prioridad' => 'normal',
            'created' => now()
        ]);

        Log::info('Notificación de contrato instalado', [
            'contrato_id' => $contrato->id,
            'numero' => $numeroContrato
        ]);
    }

    /**
     * Verificar contratos (para el comando diario)
     */
    public function verificarContratos(): array
    {
        $hoy = Carbon::now()->startOfDay();
        $notificacionesCreadas = 0;
        $contratosProcesados = 0;

        // Contratos activos con más de 1 mes sin instalación
        $fechaLimite = $hoy->copy()->subMonth();
        
        $contratosPendientes = Contrato::where('estado_id', 1) // Activos
            ->where('created', '<', $fechaLimite)
            ->whereNull('deleted_at')
            ->get();

        foreach ($contratosPendientes as $contrato) {
            // Cambiar estado a pendiente (5)
            $contrato->estado_id = 5;
            $contrato->save();
            
            // Crear notificación
            $this->notificarContratoPendiente($contrato);
            $notificacionesCreadas++;
            $contratosProcesados++;
        }

        Log::info('Verificación de contratos completada', [
            'procesados' => $contratosProcesados,
            'notificaciones' => $notificacionesCreadas
        ]);

        return [
            'procesados' => $contratosProcesados,
            'notificaciones' => $notificacionesCreadas
        ];
    }

    /**
     * Marcar notificaciones como leídas cuando se ve un contrato
     */
    public function marcarNotificacionesComoLeidas(int $contratoId, int $usuarioId): int
    {
        return Notificacion::where('entidad_tipo', 'contrato')
            ->where('entidad_id', $contratoId)
            ->where('usuario_id', $usuarioId)
            ->where('leida', false)
            ->update([
                'leida' => true,
                'fecha_leida' => now()
            ]);
    }
}