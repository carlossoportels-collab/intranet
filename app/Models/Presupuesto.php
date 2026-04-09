<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Presupuesto extends Model
{
    use SoftDeletes;

    protected $table = 'presupuestos';

    const CREATED_AT = 'created';
    const UPDATED_AT = 'modified';
    const DELETED_AT = 'deleted_at';
    
    protected $fillable = [
        'prefijo_id',
        'lead_id',
        'promocion_id', // ← NUEVO
        'cantidad_vehiculos',
        'validez',
        'tasa_id',
        'valor_tasa',
        'tasa_bonificacion',
        'subtotal_tasa',
        'tasa_metodo_pago_id',
        'abono_id',
        'valor_abono',
        'abono_bonificacion',
        'subtotal_abono',
        'abono_metodo_pago_id',
        'subtotal_productos_agregados',
        'total_presupuesto',
        'estado_id',
        'activo',
        'created_by',
        'modified_by',
        'deleted_by'
    ];

    protected $casts = [
        'cantidad_vehiculos' => 'integer',
        'validez' => 'date',
        'valor_tasa' => 'decimal:2',
        'tasa_bonificacion' => 'decimal:2',
        'subtotal_tasa' => 'decimal:2',
        'valor_abono' => 'decimal:2',
        'abono_bonificacion' => 'decimal:2',
        'subtotal_abono' => 'decimal:2',
        'subtotal_productos_agregados' => 'decimal:2',
        'total_presupuesto' => 'decimal:2',
        'activo' => 'boolean',
        'created' => 'datetime',
        'modified' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    // Relaciones
    public function prefijo(): BelongsTo
    {
        return $this->belongsTo(Prefijo::class);
    }

    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }

    // ← NUEVA RELACIÓN CON PROMOCIÓN
    public function promocion(): BelongsTo
    {
        return $this->belongsTo(Promocion::class, 'promocion_id');
    }

    public function tasa(): BelongsTo
    {
        return $this->belongsTo(ProductoServicio::class, 'tasa_id');
    }

    public function abono(): BelongsTo
    {
        return $this->belongsTo(ProductoServicio::class, 'abono_id');
    }

    public function tasaMetodoPago(): BelongsTo
    {
        return $this->belongsTo(MedioPago::class, 'tasa_metodo_pago_id');
    }

    public function abonoMetodoPago(): BelongsTo
    {
        return $this->belongsTo(MedioPago::class, 'abono_metodo_pago_id');
    }

    public function estado(): BelongsTo
    {
        return $this->belongsTo(EstadoEntidad::class, 'estado_id');
    }

    public function creadoPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'created_by');
    }

    public function modificadoPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'modified_by');
    }

    public function eliminadoPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'deleted_by');
    }

    public function agregados(): HasMany
    {
        return $this->hasMany(PresupuestoAgregado::class);
    }

    // Accessors
    public function getReferenciaAttribute(): string
    {
        if (isset($this->attributes['referencia']) && !empty($this->attributes['referencia'])) {
            return $this->attributes['referencia'];
        }
        
        $codigo = $this->prefijo?->codigo ?? 'LS';
        return sprintf('%s-%s-%s', 
            $codigo,
            date('Y', strtotime($this->created)),
            $this->id
        );
    }

    public function createdBy()
{
    return $this->belongsTo(Usuario::class, 'created_by');
}

public function getNombreComercialAttribute()
{
    if (!$this->prefijo_id) {
        return 'No asignado';
    }
    
    if (!$this->relationLoaded('prefijo')) {
        $this->load('prefijo.comercial.personal');
    }
    
    if ($this->prefijo) {
        $comerciales = $this->prefijo->comercial;
        
        // 🔥 Convertir a colección siempre
        $coleccion = $comerciales instanceof \Illuminate\Database\Eloquent\Collection 
            ? $comerciales 
            : collect([$comerciales]);
        
        if ($coleccion->isNotEmpty()) {
            $comercial = $coleccion->firstWhere('activo', true) ?? $coleccion->first();
            
            if ($comercial && $comercial->personal) {
                return $comercial->personal->nombre_completo;
            }
        }
    }
    
    return $this->prefijo?->codigo ?? 'No asignado';
}

    public function getComercialAttribute()
    {
        return $this->prefijo ? $this->prefijo->comercial : null;
    }

    public function getTotalFormateadoAttribute(): string
    {
        return '$ ' . number_format($this->total_presupuesto, 2, ',', '.');
    }

    // ← NUEVO: Verificar si el presupuesto tiene promoción
    public function tienePromocion(): bool
    {
        return !is_null($this->promocion_id);
    }

    // ← NUEVO: Obtener productos de la promoción
    public function getProductosPromocion()
    {
        if (!$this->tienePromocion()) {
            return collect();
        }

        return $this->promocion->productos;
    }
}