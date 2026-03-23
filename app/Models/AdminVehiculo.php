<?php
// app/Models/AdminVehiculo.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminVehiculo extends Model
{
    protected $table = 'admin_vehiculos';
    
    public $timestamps = false;
    
    protected $fillable = [
        'ab_alta',
        'ab_inicio',
        'codigoalfa',        // Completo: BA-1007
        'prefijo_codigo',    // Nuevo: BA
        'numero_alfa',       // Nuevo: 1007
        'nombre_mix',
        'razonsoc',
        'avl_identificador',
        'avl_patente',
        'avl_marca',
        'avl_modelo',
        'avl_anio',
        'avl_color',
        'empresa_id'         // FK a admin_empresas.id
    ];
    
    protected $casts = [
        'ab_alta' => 'date',
        'ab_inicio' => 'date',
        'avl_anio' => 'integer',
        'numero_alfa' => 'integer',
        'empresa_id' => 'integer'
    ];
    
    /**
     * Relación con la empresa importada
     */
    public function adminEmpresa()
    {
        return $this->belongsTo(AdminEmpresa::class, 'empresa_id', 'id');
    }
    
    /**
     * Relación con los abonos del vehículo
     */
    public function abonos()
    {
        return $this->hasMany(AdminVehiculoAbono::class, 'codigoalfa', 'codigoalfa');
    }
    
    /**
     * Relación con los accesorios del vehículo
     */
    public function accesorios()
    {
        return $this->hasOne(AdminVehiculoAccesorio::class, 'codigoalfa', 'codigoalfa');
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
     * Accessor para obtener el código completo
     */
    public function getCodigoCompletoAttribute()
    {
        return $this->prefijo_codigo ? $this->prefijo_codigo . '-' . $this->numero_alfa : $this->codigoalfa;
    }

    /**
     * Relación con la empresa del sistema a través de admin_empresas
     */
    public function empresaSistema()
    {
        return $this->hasOneThrough(
            Empresa::class,
            AdminEmpresa::class,
            'id',           // admin_empresas.id
            'numeroalfa',   // empresas.numeroalfa
            'empresa_id',   // admin_vehiculos.empresa_id
            'codigoalf2'    // admin_empresas.codigoalf2
        );
    }

}