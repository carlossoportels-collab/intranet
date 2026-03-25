<?php
// app/Models/Contrato.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Contrato extends Model
{
    use SoftDeletes;

    protected $table = 'contratos';
    protected $appends = ['numero_contrato'];
    
    const CREATED_AT = 'created';
    const UPDATED_AT = 'modified';
    const DELETED_AT = 'deleted_at';
    
    // Deshabilitar autoincrement para manejar IDs personalizados
    public $incrementing = false;
    protected $keyType = 'int';
    
    protected $fillable = [
        'id',
        'presupuesto_id',
        'lead_id',
        'empresa_id',
        'fecha_emision',
        'estado_id',
        'tipo_operacion',           // ← AGREGADO
        'vendedor_nombre',
        'vendedor_prefijo',
        'cliente_nombre_completo',
        'cliente_genero',
        'cliente_telefono',
        'cliente_email',
        'cliente_localidad',
        'cliente_provincia',
        'cliente_rubro',
        'cliente_origen',
        'contacto_tipo_responsabilidad',
        'contacto_tipo_documento',
        'contacto_nro_documento',
        'contacto_nacionalidad',
        'contacto_fecha_nacimiento',
        'contacto_direccion_personal',
        'contacto_codigo_postal_personal',
        'empresa_nombre_fantasia',
        'empresa_razon_social',
        'empresa_cuit',
        'empresa_domicilio_fiscal',
        'empresa_codigo_postal_fiscal',
        'empresa_localidad_fiscal',
        'empresa_provincia_fiscal',
        'empresa_telefono_fiscal',
        'empresa_email_fiscal',
        'empresa_actividad',
        'empresa_situacion_afip',
        'empresa_plataforma',
        'empresa_nombre_flota',
        'presupuesto_referencia',
        'presupuesto_cantidad_vehiculos',
        'presupuesto_total_inversion',
        'presupuesto_total_mensual',
        'presupuesto_promocion',
        'responsable_flota_nombre',
        'responsable_flota_telefono',
        'responsable_flota_email',
        'responsable_pagos_nombre',
        'responsable_pagos_telefono',
        'responsable_pagos_email',
        'activo',
        'created_by',
        'modified_by',
        'deleted_by'
    ];

    protected $casts = [
        'fecha_emision' => 'datetime',
        'contacto_fecha_nacimiento' => 'date',
        'presupuesto_cantidad_vehiculos' => 'integer',
        'presupuesto_total_inversion' => 'decimal:2',
        'presupuesto_total_mensual' => 'decimal:2',
        'activo' => 'boolean',
        'created' => 'datetime',
        'modified' => 'datetime',
        'tipo_operacion' => 'string',          // ← AGREGADO
    ];
    
    /**
     * Relación con el presupuesto original
     */
    public function presupuesto(): BelongsTo
    {
        return $this->belongsTo(Presupuesto::class);
    }

    /**
     * Relación con el lead
     */
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    /**
     * Relación con la empresa
     */
    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }

    /**
     * Relación con el estado
     */
    public function estado(): BelongsTo
    {
        return $this->belongsTo(EstadoEntidad::class, 'estado_id');
    }

    /**
     * Vehículos asociados al contrato
     */
    public function vehiculos(): HasMany
    {
        return $this->hasMany(ContratoVehiculo::class, 'contrato_id');
    }

    /**
     * Datos de débito por CBU
     */
    public function debitoCbu(): HasOne
    {
        return $this->hasOne(DebitoCbu::class, 'contrato_id');
    }

    /**
     * Datos de débito por tarjeta
     */
    public function debitoTarjeta(): HasOne
    {
        return $this->hasOne(DebitoTarjeta::class, 'contrato_id');
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
     * Scope para contratos activos
     */
    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }

    /**
     * Accessor para número de contrato formateado
     */
    public function getNumeroContratoAttribute(): string
    {
        return str_pad($this->id, 8, '0', STR_PAD_LEFT);
    }
    
    /**
     * Accessor para obtener el tipo de operación en español
     */
    public function getTipoOperacionTextoAttribute(): string
    {
        return match($this->tipo_operacion) {
            'venta_cliente' => 'Venta a Cliente',
            'alta_nueva' => 'Alta Nueva',
            'cambio_titularidad' => 'Cambio de Titularidad',
            'cambio_razon_social' => 'Cambio de Razón Social',
            default => 'No especificado'
        };
    }
}