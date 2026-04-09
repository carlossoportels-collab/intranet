<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Localidad extends Model
{
    protected $table = 'localidades';
    protected $primaryKey = 'id';
    
    const CREATED_AT = 'created';
    const UPDATED_AT = null;
    
    protected $fillable = [
        'provincia_id',
        'nombre', // ← Ya está correcto
        'codigo_postal',
        'activo',
    ];
    
    protected $casts = [
        'activo' => 'boolean',
        'created' => 'datetime'
    ];
    
    protected $with = ['provincia'];
    protected $appends = ['nombre_completo'];
    
    public function provincia()
    {
        return $this->belongsTo(Provincia::class);
    }
    
    public function leads()
    {
        return $this->hasMany(Lead::class);
    }
    
    public function getNombreCompletoAttribute()
    {
        if ($this->provincia) {
            return "{$this->nombre}, {$this->provincia->nombre}"; // ← Cambiamos provincia->provincia a provincia->nombre
        }
        return $this->nombre; // ← Cambiamos de 'localidad' a 'nombre'
    }
    
    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }
    
    public function scopeOrdenar($query, $orden = 'asc')
    {
        return $query->orderBy('nombre', $orden); // ← Cambiamos de 'localidad' a 'nombre'
    }
    
    public function scopePorProvincia($query, $provinciaId)
    {
        if ($provinciaId) {
            return $query->where('provincia_id', $provinciaId);
        }
        return $query;
    }
    
    public function scopeBuscar($query, $termino)
    {
        return $query->where('activo', true)
            ->where(function($q) use ($termino) {
                $q->where('nombre', 'LIKE', "%{$termino}%") // ← Cambiamos de 'localidad' a 'nombre'
                  ->orWhere('codigo_postal', 'LIKE', "%{$termino}%");
            });
    }
}