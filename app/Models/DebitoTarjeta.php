<?php
// app/Models/DebitoTarjeta.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Support\Facades\Crypt;

class DebitoTarjeta extends Model
{
    use SoftDeletes;

    protected $table = 'debitos_tarjeta';
    
    const CREATED_AT = 'created';
    const UPDATED_AT = 'modified';
    const DELETED_AT = 'deleted_at';
    
    protected $fillable = [
        'contrato_id',
        'tarjeta_emisor',
        'tarjeta_expiracion',
        'tarjeta_numero',
        'tarjeta_codigo',
        'tarjeta_banco',
        'titular_tarjeta',
        'tipo_tarjeta',
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
     * Encriptar número de tarjeta al guardar
     */
    public function setTarjetaNumeroAttribute($value)
    {
        $this->attributes['tarjeta_numero'] = $value ? Crypt::encryptString($value) : null;
    }

    /**
     * Encriptar código de tarjeta al guardar
     */
    public function setTarjetaCodigoAttribute($value)
    {
        $this->attributes['tarjeta_codigo'] = $value ? Crypt::encryptString($value) : null;
    }

    /**
     * Desencriptar número de tarjeta al acceder
     */
    public function getTarjetaNumeroAttribute($value)
    {
        if (!$value) return null;
        
        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            return $value;
        }
    }

    /**
     * Desencriptar código de tarjeta al acceder
     */
    public function getTarjetaCodigoAttribute($value)
    {
        if (!$value) return null;
        
        try {
            return Crypt::decryptString($value);
        } catch (\Exception $e) {
            return $value;
        }
    }

    /**
     * Accessor para número de tarjeta enmascarado
     */
    public function getNumeroEnmascaradoAttribute(): string
    {
        $numero = $this->tarjeta_numero;
        if (!$numero) return '';
        return '•••• •••• •••• ' . substr($numero, -4);
    }

    /**
     * Accessor para expiración formateada
     */
    public function getExpiracionFormateadaAttribute(): string
    {
        return str_replace('/', ' / ', $this->tarjeta_expiracion);
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