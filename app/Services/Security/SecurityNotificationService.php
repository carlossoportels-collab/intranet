<?php
// app/Services/Security/SecurityNotificationService.php

namespace App\Services\Security;

use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class SecurityNotificationService
{
    /**
     * Usuario administrador que recibe alertas (ID 2)
     */
    const ADMIN_USER_ID = 2;

    /**
     * Enviar notificación por actividad sospechosa
     */
    public function notifySuspiciousActivity($acceso, $ip, $userAgent, $reason)
    {
        $titulo = '⚠️ Actividad sospechosa detectada';
        
        $mensaje = sprintf(
            "Se detectó un intento de acceso sospechoso:\n" .
            "- Usuario intentado: %s\n" .
            "- IP: %s\n" .
            "- User Agent: %s\n" .
            "- Razón: %s\n" .
            "- Fecha: %s",
            $acceso,
            $ip,
            $userAgent,
            $reason,
            Carbon::now()->format('d/m/Y H:i:s')
        );

        return $this->createNotification($titulo, $mensaje, [
            'prioridad' => 'alta',
            'tipo' => 'actividad_sospechosa',
            'entidad_tipo' => null,
            'entidad_id' => null,
        ]);
    }

    /**
     * Enviar notificación por IP bloqueada
     */
    public function notifyIpBlocked($ip, $reason, $blockedUntil)
    {
        $titulo = '🔒 IP bloqueada automáticamente';
        
        $mensaje = sprintf(
            "Se ha bloqueado una IP por actividad sospechosa:\n" .
            "- IP: %s\n" .
            "- Razón: %s\n" .
            "- Bloqueada hasta: %s\n" .
            "- Fecha: %s",
            $ip,
            $reason,
            $blockedUntil->format('d/m/Y H:i:s'),
            Carbon::now()->format('d/m/Y H:i:s')
        );

        return $this->createNotification($titulo, $mensaje, [
            'prioridad' => 'urgente',
            'tipo' => 'actividad_sospechosa',
            'entidad_tipo' => null,
            'entidad_id' => null,
        ]);
    }

    /**
     * Enviar notificación por múltiples intentos fallidos
     */
    public function notifyMultipleFailedAttempts($acceso, $ip, $attemptCount)
    {
        $titulo = '⚠️ Múltiples intentos fallidos de acceso';
        
        $mensaje = sprintf(
            "Se detectaron múltiples intentos fallidos de acceso:\n" .
            "- Usuario intentado: %s\n" .
            "- IP: %s\n" .
            "- Número de intentos: %d\n" .
            "- Fecha: %s",
            $acceso,
            $ip,
            $attemptCount,
            Carbon::now()->format('d/m/Y H:i:s')
        );

        return $this->createNotification($titulo, $mensaje, [
            'prioridad' => 'alta',
            'tipo' => 'actividad_sospechosa',
            'entidad_tipo' => null,
            'entidad_id' => null,
        ]);
    }

    /**
     * Crear la notificación en la base de datos
     */
    private function createNotification($titulo, $mensaje, $options = [])
    {
        $data = [
            'usuario_id' => self::ADMIN_USER_ID,
            'titulo' => $titulo,
            'mensaje' => $mensaje,
            'tipo' => $options['tipo'] ?? 'actividad_sospechosa',
            'entidad_tipo' => $options['entidad_tipo'] ?? null,
            'entidad_id' => $options['entidad_id'] ?? null,
            'leida' => false,
            'fecha_leida' => null,
            'fecha_notificacion' => Carbon::now(),
            'prioridad' => $options['prioridad'] ?? 'normal',
            'created' => Carbon::now(),
            'deleted_at' => null,
            'deleted_by' => null,
        ];

        return DB::table('notificaciones')->insert($data);
    }

    /**
     * Verificar si hay actividad sospechosa reciente
     */
    public function getRecentSuspiciousActivity($hours = 24)
    {
        return DB::table('login_attempts')
            ->where('created_at', '>=', Carbon::now()->subHours($hours))
            ->where(function($query) {
                $query->where('acceso', 'REGEXP', '(\'|--|union|select|drop|insert|update|delete|exec|execute)')
                      ->orWhere('payload', 'like', '%"suspicious":true%');
            })
            ->orderBy('created_at', 'desc')
            ->get();
    }

    /**
     * Obtener estadísticas de actividad sospechosa
     */
    public function getSuspiciousStats()
    {
        $last24h = Carbon::now()->subHours(24);
        $last7d = Carbon::now()->subDays(7);

        return [
            'ultimas_24h' => DB::table('login_attempts')
                ->where('created_at', '>=', $last24h)
                ->where(function($query) {
                    $query->where('acceso', 'REGEXP', '(\'|--|union|select|drop|insert|update|delete|exec|execute)')
                          ->orWhere('payload', 'like', '%"suspicious":true%');
                })
                ->count(),
            
            'ultimos_7dias' => DB::table('login_attempts')
                ->where('created_at', '>=', $last7d)
                ->where(function($query) {
                    $query->where('acceso', 'REGEXP', '(\'|--|union|select|drop|insert|update|delete|exec|execute)')
                          ->orWhere('payload', 'like', '%"suspicious":true%');
                })
                ->count(),
            
            'ips_bloqueadas' => DB::table('login_attempts')
                ->where('payload', 'like', '%"blocked":true%')
                ->distinct('ip')
                ->count('ip'),
        ];
    }
}