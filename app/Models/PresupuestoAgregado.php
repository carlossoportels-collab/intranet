<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class PresupuestoAgregado extends Model
{
    use SoftDeletes;

    protected $table = 'presupuestos_agregados';
    
    const CREATED_AT = 'created';
    const UPDATED_AT = null;
    const DELETED_AT = 'deleted_at';
    
    protected $fillable = [
        'presupuesto_id',
        'prd_servicio_id',
        'cantidad',
        'aplica_a_todos_vehiculos',
        'valor',
        'bonificacion',
        'subtotal',
        'deleted_by'
    ];

    protected $casts = [
        'cantidad' => 'integer',
        'aplica_a_todos_vehiculos' => 'boolean',
        'valor' => 'decimal:2',
        'bonificacion' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'created' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    // Relaciones
    public function presupuesto(): BelongsTo
    {
        return $this->belongsTo(Presupuesto::class);
    }

    public function productoServicio(): BelongsTo
    {
        return $this->belongsTo(ProductoServicio::class, 'prd_servicio_id');
    }

    public function eliminadoPor(): BelongsTo
    {
        return $this->belongsTo(User::class, 'deleted_by');
    }

    // Accessors
    public function getValorFormateadoAttribute(): string
    {
        return '$ ' . number_format($this->valor, 2, ',', '.');
    }

    public function getSubtotalFormateadoAttribute(): string
    {
        return '$ ' . number_format($this->subtotal, 2, ',', '.');
    }

    public function getBonificacionFormateadaAttribute(): string
    {
        return $this->bonificacion > 0 ? $this->bonificacion . '% OFF' : '-';
    }

    // Agregar este método
public function getTipoIdAttribute()
{
    return $this->productoServicio ? $this->productoServicio->tipo_id : null;
}

// También podrías agregar un accessor para el nombre
public function getProductoNombreAttribute()
{
    return $this->productoServicio ? $this->productoServicio->nombre : null;
}
}