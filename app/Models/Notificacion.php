<?php
// app/Models/Notificacion.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Notificacion extends Model
{
    use SoftDeletes;
    
    protected $table = 'notificaciones';
    
    public $timestamps = false;
    
    protected $fillable = [
        'usuario_id',
        'titulo',
        'mensaje',
        'tipo',
        'entidad_tipo',
        'entidad_id',
        'leida',
        'fecha_leida',
        'fecha_notificacion',
        'prioridad',
    ];
    
    protected $casts = [
        'leida' => 'boolean',
        'fecha_notificacion' => 'datetime',
        'fecha_leida' => 'datetime',
    ];
    
    // 🔥 Tipos de notificaciones
    const TIPO_TRANSFERENCIA_LEAD = 'transferencia_lead';
    const TIPO_TRANSFERENCIA_EMPRESA = 'transferencia_empresa';
    
    public function usuario()
    {
        return $this->belongsTo(Usuario::class);
    }
    
    public function scopeNoLeidas($query)
    {
        return $query->where('leida', false);
    }
    
    public function scopeLeidas($query)
    {
        return $query->where('leida', true);
    }
    
    public function scopePorUsuario($query, $usuarioId)
    {
        return $query->where('usuario_id', $usuarioId);
    }
    
    // 🔥 Scope para notificaciones de transferencia
    public function scopeTransferencias($query)
    {
        return $query->whereIn('tipo', [self::TIPO_TRANSFERENCIA_LEAD, self::TIPO_TRANSFERENCIA_EMPRESA]);
    }
}