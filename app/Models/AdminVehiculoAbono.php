<?php
// app/Models/AdminVehiculoAbono.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminVehiculoAbono extends Model
{
    protected $table = 'admin_vehiculos_abonos';
    
    public $timestamps = false;
    
    protected $fillable = [
        'codigoalfa',        // Completo: BA-1007
        'prefijo_codigo',    // Nuevo: BA
        'numero_alfa',       // Nuevo: 1007
        'abono_codigo',
        'abono_nombre',
        'abono_precio',
        'abono_descuento',
        'abono_descmotivo',
        'created_at'
    ];
    
    protected $casts = [
        'abono_precio' => 'decimal:2',
        'abono_descuento' => 'decimal:2',
        'numero_alfa' => 'integer',
        'created_at' => 'datetime'
    ];
    
    /**
     * Relación con el vehículo
     */
    public function vehiculo()
    {
        return $this->belongsTo(AdminVehiculo::class, 'codigoalfa', 'codigoalfa');
    }
    
    /**
     * Relación con el vehículo por prefijo y número (más eficiente)
     */
    public function vehiculoPorPrefijo()
    {
        return $this->belongsTo(AdminVehiculo::class, 'numero_alfa', 'numero_alfa')
                    ->where('prefijo_codigo', $this->prefijo_codigo);
    }
    
    /**
     * Relación con el producto/servicio por abono_codigo
     */
    public function producto()
    {
        return $this->belongsTo(ProductoServicio::class, 'abono_codigo', 'codigopro');
    }
    
    /**
     * Relación con el prefijo por código
     */
    public function prefijo()
    {
        return $this->belongsTo(Prefijo::class, 'prefijo_codigo', 'codigo');
    }
    
    /**
     * Scope para filtrar por prefijo
     */
    public function scopePorPrefijo($query, $prefijoCodigo)
    {
        return $query->where('prefijo_codigo', $prefijoCodigo);
    }
    
    /**
     * Scope para abonos activos (últimos 30 días por ejemplo)
     */
    public function scopeActivos($query)
    {
        return $query->where('created_at', '>=', now()->subDays(30));
    }
    
    /**
     * Calcular precio final con descuento
     */
    public function getPrecioFinalAttribute()
    {
        if ($this->abono_descuento > 0) {
            return $this->abono_precio - ($this->abono_precio * ($this->abono_descuento / 100));
        }
        return $this->abono_precio;
    }
    
    /**
     * Accessor para obtener el código completo
     */
    public function getCodigoCompletoAttribute()
    {
        return $this->prefijo_codigo ? $this->prefijo_codigo . '-' . $this->numero_alfa : $this->codigoalfa;
    }
}