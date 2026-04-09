<?php
// app/Models/AuditoriaDatoSensible.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class AuditoriaDatoSensible extends Model
{
    protected $table = 'auditoria_datos_sensibles';
    
    public $timestamps = false;
    
    protected $fillable = [
        'usuario_id',
        'contrato_id',
        'tipo_dato',
        'fecha_acceso',
        'ip_address',
        'user_agent',
        'created'
    ];

    protected $casts = [
        'fecha_acceso' => 'datetime',
        'created' => 'datetime'
    ];

    public function usuario(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    public function contrato(): BelongsTo
    {
        return $this->belongsTo(Contrato::class, 'contrato_id');
    }
}