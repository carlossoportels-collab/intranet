<?php
// app/Models/Reenvio.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Reenvio extends Model
{
    use SoftDeletes;
    
    protected $table = 'reenvios';
    
    const CREATED_AT = 'created';
    const UPDATED_AT = 'modified';
    const DELETED_AT = 'deleted_at';
    
    protected $fillable = [
        'prestadora',
        'cybermapa',
        'bykom',
        'activo',
        'created_by',
        'modified_by',
        'deleted_by'
    ];
    
    protected $casts = [
        'cybermapa' => 'boolean',
        'bykom' => 'boolean',
        'activo' => 'boolean',
        'created' => 'datetime',
        'modified' => 'datetime',
        'deleted_at' => 'datetime'
    ];
    
    /**
     * Scope para filtrar activos
     */
    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }
    
    /**
     * Scope para filtrar por plataforma Cybermapa
     */
    public function scopeCybermapa($query)
    {
        return $query->where('cybermapa', true);
    }
    
    /**
     * Scope para filtrar por plataforma Bykom
     */
    public function scopeBykom($query)
    {
        return $query->where('bykom', true);
    }
    
    /**
     * Scope para filtrar por prestadora
     */
    public function scopePrestadora($query, $prestadora)
    {
        return $query->where('prestadora', 'LIKE', "%{$prestadora}%");
    }
    
    /**
     * Obtener el texto de plataformas activas
     */
    public function getPlataformasActivasAttribute()
    {
        $plataformas = [];
        if ($this->cybermapa) $plataformas[] = 'Cybermapa';
        if ($this->bykom) $plataformas[] = 'Bykom';
        return implode(' | ', $plataformas);
    }
}