<?php
// app/Models/ContratoLegacy.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class ContratoLegacy extends Model
{
    // Sin SoftDeletes porque la tabla no tiene deleted_at
    protected $table = 'contratos_legacy';
    
    const CREATED_AT = 'created';
    const UPDATED_AT = null; // No tiene campo modified
    
    // Deshabilitar autoincrement ya que usamos el ID original
    public $incrementing = false;
    protected $keyType = 'int';
    
    protected $fillable = [
        'id',
        'lead_id',
        'nombre_completo',
        'razon_social',
        'created'
    ];

    protected $casts = [
        'created' => 'datetime',
    ];
    
    protected $appends = ['numero_contrato'];

    /**
     * Relación con el lead
     */
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class, 'lead_id');
    }

    /**
     * Scope para filtrar por lead (sin soft deletes)
     */
    public function scopePorLead($query, $leadId)
    {
        return $query->where('lead_id', $leadId);
    }

    /**
     * Accessor para número de contrato formateado
     */
    public function getNumeroContratoAttribute(): string
    {
        return 'L-' . str_pad($this->id, 8, '0', STR_PAD_LEFT);
    }
}