<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class HistorialTransferencia extends Model
{
    protected $table = 'historial_transferencias';
    
    // Como la tabla usa created_at pero no updated_at:
    const UPDATED_AT = null;

    protected $fillable = [
        'tipo_entidad',
        'entidad_id',
        'nombre_entidad',
        'prefijo_origen_id',
        'prefijo_destino_id',
        'codigo_prefijo_origen',
        'codigo_prefijo_destino',
        'comercial_destino_nombre',
        'usuario_id',
        'observaciones'
    ];

    protected $casts = [
        'created_at' => 'datetime',
    ];
}