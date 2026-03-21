<?php
// app/Models/AdminVehiculoAccesorio.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminVehiculoAccesorio extends Model
{
    protected $table = 'admin_vehiculos_accesorios';
    
    public $timestamps = false;
    
    protected $fillable = [
        'codigoalfa',
        'enganche',
        'panico',
        'cabina',
        'carga',
        'corte',
        'antivandalico'
    ];
    
    protected $casts = [
        'enganche' => 'boolean',
        'panico' => 'boolean',
        'cabina' => 'boolean',
        'carga' => 'boolean',
        'corte' => 'boolean',
        'antivandalico' => 'boolean'
    ];
    
    /**
     * Relación con el vehículo
     */
    public function vehiculo()
    {
        return $this->belongsTo(AdminVehiculo::class, 'codigoalfa', 'codigoalfa');
    }
    
    /**
     * Relación con el vehículo por prefijo y número (si tuviera esos campos)
     * Nota: Esta tabla no tiene prefijo_codigo en el script, pero podrías agregarlo
     */
    
    /**
     * Obtener lista de accesorios activos
     */
    public function getAccesoriosActivosAttribute()
    {
        $activos = [];
        
        if ($this->enganche) $activos[] = 'Enganche';
        if ($this->panico) $activos[] = 'Pánico';
        if ($this->cabina) $activos[] = 'Cabina';
        if ($this->carga) $activos[] = 'Carga';
        if ($this->corte) $activos[] = 'Corte';
        if ($this->antivandalico) $activos[] = 'Antivandalico';
        
        return $activos;
    }
    
    /**
     * Verificar si tiene algún accesorio
     */
    public function getTieneAccesoriosAttribute()
    {
        return $this->enganche || $this->panico || $this->cabina || 
               $this->carga || $this->corte || $this->antivandalico;
    }
}