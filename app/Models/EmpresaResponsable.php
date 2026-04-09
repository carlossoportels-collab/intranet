<?php
// app/Models/EmpresaResponsable.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmpresaResponsable extends Model
{
    use SoftDeletes;
    
    protected $table = 'empresa_responsables';
    
    const CREATED_AT = 'created';
    const UPDATED_AT = 'modified';
    const DELETED_AT = 'deleted_at';
    
    protected $fillable = [
        'empresa_id',
        'nombre_completo', 
        // 'cargo', // ← ELIMINAR esta línea porque no existe en la tabla
        'telefono',
        'email',
        'tipo_responsabilidad_id',
        'es_activo',
        'created_by',
        'modified_by',
        'deleted_by'
    ];
    
    protected $casts = [
        'es_activo' => 'boolean',
        'created' => 'datetime',
        'modified' => 'datetime'
    ];
    
    // Relaciones
    public function empresa()
    {
        return $this->belongsTo(Empresa::class, 'empresa_id');
    }
    
    public function tipoResponsabilidad()
    {
        return $this->belongsTo(TipoResponsabilidad::class, 'tipo_responsabilidad_id');
    }
    
    public function creadoPor()
    {
        return $this->belongsTo(Usuario::class, 'created_by');
    }
    
    public function modificadoPor()
    {
        return $this->belongsTo(Usuario::class, 'modified_by');
    }
    
    public function eliminadoPor()
    {
        return $this->belongsTo(Usuario::class, 'deleted_by');
    }
    
    // Scopes
    public function scopeActivo($query)
    {
        return $query->where('es_activo', true);
    }
    
    public function scopeDeEmpresa($query, $empresaId)
    {
        return $query->where('empresa_id', $empresaId);
    }
    
    // Accessors
    public function getEstadoAttribute(): string
    {
        return $this->es_activo ? 'Activo' : 'Inactivo';
    }
}