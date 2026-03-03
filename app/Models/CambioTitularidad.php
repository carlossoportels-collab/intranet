<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;


class CambioTitularidad extends Model
{
    use HasFactory;

    protected $table = 'cambios_titularidad';
    
    protected $primaryKey = 'id';
    public $incrementing = true;
    protected $keyType = 'int';
    
    public $timestamps = false; // Porque usamos fecha_cambio en lugar de created_at
    
    protected $fillable = [
        'empresa_origen_id',
        'empresa_destino_id',
        'vehiculos',
        'observaciones',
        'fecha_cambio',
        'usuario_id',
        'contrato_id'
    ];

    protected $casts = [
        'vehiculos' => 'array',
        'fecha_cambio' => 'datetime'
    ];

    /**
     * Relación con la empresa origen
     */
    public function empresaOrigen()
    {
        return $this->belongsTo(Empresa::class, 'empresa_origen_id');
    }

    /**
     * Relación con la empresa destino
     */
    public function empresaDestino()
    {
        return $this->belongsTo(Empresa::class, 'empresa_destino_id');
    }

    /**
     * Relación con el usuario que realizó el cambio
     */
    public function usuario()
    {
        return $this->belongsTo(Usuario::class, 'usuario_id');
    }

    /**
     * Relación con el contrato generado
     */
    public function contrato()
    {
        return $this->belongsTo(Contrato::class, 'contrato_id');
    }
}