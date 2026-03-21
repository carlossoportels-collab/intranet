<?php
// app/Models/Rol.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Rol extends Model
{
    use SoftDeletes;

    protected $table = 'roles';
    
    protected $fillable = [
        'nombre',
        'nivel_permiso',
        'descripcion',
        'activo',
        'es_oculto',
        'created_by',
        'modified_by',
        'deleted_by'
    ];

    protected $casts = [
        'activo' => 'boolean',
        'es_oculto' => 'boolean',
        'created' => 'datetime',
        'modified' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    const CREATED_AT = 'created';
    const UPDATED_AT = 'modified';

    // Relación con permisos (muchos a muchos)
    public function permisos()
    {
        return $this->belongsToMany(Permiso::class, 'permisos_roles', 'rol_id', 'permiso_id')
            ->withPivot('created', 'created_by')
            ->withTimestamps();
    }

    // Scope para roles activos
    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }
}