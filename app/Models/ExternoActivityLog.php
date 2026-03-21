<?php
// app/Models/ExternoActivityLog.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ExternoActivityLog extends Model
{
    protected $table = 'externo_activity_logs';
    
    protected $fillable = [
        'plataforma',
        'usuario',
        'tipo_consulta',
        'accion',
        'ip',
        'user_agent',
        'status',
        'mensaje',
        'metadata'
    ];
    
    protected $casts = [
        'metadata' => 'array',
    ];
    
    // Scope para filtrar por plataforma
    public function scopePlataforma($query, $plataforma)
    {
        return $query->where('plataforma', $plataforma);
    }
    
    // Scope para filtrar por usuario
    public function scopeUsuario($query, $usuario)
    {
        return $query->where('usuario', $usuario);
    }
    
    // Scope para filtrar por fecha
    public function scopeFecha($query, $fecha)
    {
        return $query->whereDate('created_at', $fecha);
    }
}