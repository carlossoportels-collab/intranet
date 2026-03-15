<?php
// app/Models/LoginAttempt.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class LoginAttempt extends Model
{
    protected $table = 'login_attempts';
    
    protected $fillable = [
        'acceso',
        'ip',
        'user_agent',
        'payload',
        'success'
    ];

    protected $casts = [
        'payload' => 'array',
        'success' => 'boolean',
        'created_at' => 'datetime',
        'updated_at' => 'datetime'
    ];

    // Scope para intentos fallidos
    public function scopeFailed($query)
    {
        return $query->where('success', false);
    }

    // Scope para intentos exitosos
    public function scopeSuccessful($query)
    {
        return $query->where('success', true);
    }

    // Scope para IP específica
    public function scopeFromIp($query, $ip)
    {
        return $query->where('ip', $ip);
    }

    // Scope para intentos sospechosos
    public function scopeSuspicious($query)
    {
        return $query->where('acceso', 'REGEXP', '(\'|--|union|select|drop|insert|update|delete|exec|execute)');
    }

    // Obtener intentos recientes de una IP
    public static function recentAttemptsFromIp($ip, $minutes = 15)
    {
        return self::where('ip', $ip)
            ->where('created_at', '>=', now()->subMinutes($minutes))
            ->count();
    }
}