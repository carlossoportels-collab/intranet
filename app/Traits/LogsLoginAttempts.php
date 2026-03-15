<?php
// app/Traits/LogsLoginAttempts.php

namespace App\Traits;

use App\Models\LoginAttempt;
use Illuminate\Support\Facades\Request;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

trait LogsLoginAttempts
{
    /**
     * Registrar intento de login
     */
    protected function logLoginAttempt($acceso, $success, $extraData = [])
    {
        return LoginAttempt::create([
            'acceso' => $acceso,
            'ip' => Request::ip(),
            'user_agent' => Request::userAgent(),
            'payload' => array_merge($extraData, [
                'timestamp' => Carbon::now()->toDateTimeString(),
                'method' => Request::method(),
                'url' => Request::fullUrl(),
            ]),
            'success' => $success,
        ]);
    }

    /**
     * Detectar si es un intento sospechoso
     */
    protected function isSuspicious($acceso)
    {
        $patterns = [
            '/(\%27)|(\')|(\-\-)|(\%23)|(#)/i',
            '/((\%3D)|(=))[^\n]*((\%27)|(\')|(\-\-)|(\%3B)|(;))/i',
            '/\w*((\%27)|(\'))((\%6F)|o|(\%4F))((\%72)|r|(\%52))/i',
            '/(exec|execute|select|insert|drop|delete|update|union|alter|create|rename|truncate)/i',
            '/(information_schema|mysql|sys|performance_schema)/i',
            '/(0x[0-9a-f]+)/i', // Hexadecimal
            '/(char|ascii|hex|unhex|concat|group_concat)/i', // Funciones SQL
        ];

        foreach ($patterns as $pattern) {
            if (preg_match($pattern, $acceso)) {
                return true;
            }
        }

        return false;
    }

    /**
     * Verificar rate limiting por IP
     */
    protected function checkRateLimit($ip, $maxAttempts = 10, $minutes = 15)
    {
        $key = 'login_attempts_' . $ip;
        $attempts = Cache::get($key, 0);
        
        if ($attempts >= $maxAttempts) {
            return false;
        }
        
        Cache::put($key, $attempts + 1, now()->addMinutes($minutes));
        return true;
    }

    /**
     * Bloquear IP sospechosa
     */
    protected function blockIp($ip, $minutes = 60)
    {
        Cache::put('blocked_ip_' . $ip, true, now()->addMinutes($minutes));
        
        // Registrar el bloqueo en login_attempts
        LoginAttempt::create([
            'acceso' => 'SYSTEM_BLOCK',
            'ip' => $ip,
            'user_agent' => Request::userAgent(),
            'payload' => [
                'action' => 'ip_blocked',
                'duration' => $minutes,
                'timestamp' => Carbon::now()->toDateTimeString(),
                'reason' => 'Exceeded rate limit or suspicious activity'
            ],
            'success' => false,
        ]);
    }

    /**
     * Verificar si IP está bloqueada
     */
    protected function isIpBlocked($ip)
    {
        return Cache::has('blocked_ip_' . $ip);
    }

    /**
     * Obtener estadísticas de intentos
     */
    protected function getAttemptStats($ip)
    {
        return [
            'total_attempts' => LoginAttempt::where('ip', $ip)->count(),
            'failed_attempts' => LoginAttempt::where('ip', $ip)->where('success', false)->count(),
            'successful_attempts' => LoginAttempt::where('ip', $ip)->where('success', true)->count(),
            'last_attempt' => LoginAttempt::where('ip', $ip)->latest()->first()?->created_at,
            'is_blocked' => $this->isIpBlocked($ip),
            'suspicious_attempts' => LoginAttempt::where('ip', $ip)
                ->where('payload', 'like', '%"suspicious":true%')
                ->count(),
        ];
    }
}