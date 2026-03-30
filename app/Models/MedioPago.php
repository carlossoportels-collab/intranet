<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MedioPago extends Model
{
    use SoftDeletes;

    protected $table = 'metodos_pago';
    
    protected $fillable = [
        'nombre',
        'descripcion',
        'tipo',
        'requiere_datos_adicionales',
        'es_activo',
        'icono',
        'deleted_by'
    ];

    protected $casts = [
        'requiere_datos_adicionales' => 'boolean',
        'es_activo' => 'boolean',
        'created' => 'datetime',
        'deleted_at' => 'datetime'
    ];

    protected $appends = ['tipo_texto'];

    // Relaciones
    public function presupuestosTasa(): HasMany
    {
        return $this->hasMany(Presupuesto::class, 'tasa_metodo_pago_id');
    }

    public function presupuestosAbono(): HasMany
    {
        return $this->hasMany(Presupuesto::class, 'abono_metodo_pago_id');
    }

    // Scopes
    public function scopeActivos($query)
    {
        return $query->where('es_activo', 1);
    }

    public function scopePorTipo($query, $tipo)
    {
        return $query->where('tipo', $tipo);
    }

    // Accessors
public function getTipoTextoAttribute(): string
{
    $tipos = [
        'debito' => 'Débito',
        'credito' => 'Crédito',
        'transferencia' => 'Transferencia',
        'efectivo' => 'Efectivo',
        'cheque' => 'Cheque',
        'otro' => 'Otro',
    ];
    
    return $tipos[$this->tipo] ?? ($this->tipo ?? 'No especificado');
}

    public function getIconoHtmlAttribute(): string
    {
        return $this->icono ?? match($this->tipo) {
            'debito' => '💳',
            'credito' => '💰',
            'transferencia' => '🏦',
            'efectivo' => '💵',
            default => '💲'
        };
    }
}