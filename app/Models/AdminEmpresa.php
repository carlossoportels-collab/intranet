<?php
// app/Models/AdminEmpresa.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AdminEmpresa extends Model
{
    protected $table = 'admin_empresas';
    
    public $timestamps = false;
    
    protected $fillable = [
        'altaregist',
        'codigoalfa',        // Completo: BA-501053
        'codigoalf2',        // Solo número: 501053
        'prefijo_codigo',    // Nuevo: BA
        'nombre_mix',
        'razonsoc'
    ];
    
    protected $casts = [
        'altaregist' => 'date',
        'codigoalf2' => 'integer',
        'id' => 'integer'
    ];
    
    /**
     * Relación con los vehículos importados
     */
    public function vehiculosImportados()
    {
        return $this->hasMany(AdminVehiculo::class, 'empresa_id', 'id');
    }
    
    /**
     * Relación con la empresa del sistema a través de codigoalf2 = numeroalfa
     */
    public function empresaSistema()
    {
        return $this->belongsTo(Empresa::class, 'codigoalf2', 'numeroalfa');
    }
    
    /**
     * Relación con el prefijo por código
     */
    public function prefijo()
    {
        return $this->belongsTo(Prefijo::class, 'prefijo_codigo', 'codigo');
    }
    
    /**
     * Accessor para obtener el código completo con prefijo
     */
    public function getCodigoCompletoAttribute()
    {
        return $this->prefijo_codigo ? $this->prefijo_codigo . '-' . $this->codigoalf2 : $this->codigoalfa;
    }
}