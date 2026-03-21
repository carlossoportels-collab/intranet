<?php
// app/Models/Permiso.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;

class Permiso extends Model
{
    use SoftDeletes;

    protected $table = 'permisos';
    
    protected $fillable = [
        'nombre',
        'descripcion',
        'modulo',
        'activo',
        'created_by',
        'modified_by',
        'deleted_by'
    ];

    protected $casts = [
        'activo' => 'boolean',
        'created' => 'datetime',
        'modified' => 'datetime',
        'deleted_at' => 'datetime',
    ];

    const CREATED_AT = 'created';
    const UPDATED_AT = 'modified';

    // Relación con roles (muchos a muchos)
    public function roles()
    {
        return $this->belongsToMany(Rol::class, 'permisos_roles', 'permiso_id', 'rol_id')
            ->withPivot('created', 'created_by')
            ->withTimestamps();
    }

    // Scope para permisos activos
    public function scopeActivos($query)
    {
        return $query->where('activo', true);
    }

    // Scope para filtrar por módulo
    public function scopeModulo($query, $modulo)
    {
        return $query->where('modulo', $modulo);
    }
}