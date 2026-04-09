<?php
// app/Models/DebitoCbu.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class DebitoCbu extends Model
{
    use SoftDeletes;

    protected $table = 'debitos_cbu';
    
    const CREATED_AT = 'created';
    const UPDATED_AT = 'modified';
    const DELETED_AT = 'deleted_at';
    
    protected $fillable = [
        'contrato_id',
        'nombre_banco',
        'cbu',
        'alias_cbu',
        'titular_cuenta',
        'tipo_cuenta',
        'es_activo',
        'created_by',
        'modified_by',
        'deleted_by'
    ];

    protected $casts = [
        'es_activo' => 'boolean',
        'created' => 'datetime',
        'modified' => 'datetime'
    ];

    /**
     * Encriptar CBU al guardar
     */
    public function setCbuAttribute($value)
    {
        $this->attributes['cbu'] = $value ? Crypt::encryptString($value) : null;
    }

    /**
     * Desencriptar CBU al acceder
     */
    public function getCbuAttribute($value)
    {
        if (!$value) return null;
        
        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            return $value;
        }
    }

    /**
     * Accessor para CBU formateado
     */
    public function getCbuFormateadoAttribute(): string
    {
        return wordwrap($this->cbu, 4, '-', true);
    }

    /**
     * Relación con el contrato
     */
    public function contrato(): BelongsTo
    {
        return $this->belongsTo(Contrato::class);
    }

    /**
     * Usuario que creó el registro
     */
    public function creadoPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'created_by');
    }

    /**
     * Usuario que modificó el registro
     */
    public function modificadoPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'modified_by');
    }

    /**
     * Usuario que eliminó el registro
     */
    public function eliminadoPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'deleted_by');
    }

    /**
     * Scope para registros activos
     */
    public function scopeActivo($query)
    {
        return $query->where('es_activo', true);
    }
}