<?php
// app/Models/ContratoVehiculo.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContratoVehiculo extends Model
{
    use SoftDeletes;

    protected $table = 'contrato_vehiculos';
    
    const CREATED_AT = 'created';
    const UPDATED_AT = null;
    const DELETED_AT = 'deleted_at';
    
    protected $fillable = [
        'contrato_id',
        'patente',
        'marca',
        'modelo',
        'anio',
        'color',
        'identificador',
        'tipo', 
        'orden',
        'deleted_by'
    ];

    protected $casts = [
        'anio' => 'integer',
        'orden' => 'integer',
        'created' => 'datetime'
    ];

    /**
     * Relación con el contrato
     */
    public function contrato(): BelongsTo
    {
        return $this->belongsTo(Contrato::class);
    }

    /**
     * Usuario que eliminó el registro
     */
    public function eliminadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    /**
     * Accessor para patente formateada
     */
    public function getPatenteFormateadaAttribute(): string
    {
        return strtoupper($this->patente);
    }
      public function setTipoAttribute($value)
    {
        $this->attributes['tipo'] = $value ?: null;
    }
}