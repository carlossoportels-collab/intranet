<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Prefijo extends Model
{
    use SoftDeletes;
    
    protected $table = 'prefijos';
    
    const CREATED_AT = 'created';
    const UPDATED_AT = 'modified';
    const DELETED_AT = 'deleted_at';
    
    protected $fillable = [
        'codigo',
        'descripcion',
        'activo',
        'deleted_by'
    ];
    
    protected $casts = [
        'activo' => 'boolean',
        'created' => 'datetime'
    ];
    
    // Relaciones
    public function leads(): HasMany
    {
        return $this->hasMany(Lead::class, 'prefijo_id');
    }
    
    public function comercial()
    {
        return $this->hasMany(Comercial::class, 'prefijo_id', 'id');
    }
    
    public function getComercialActivoAttribute()
    {
        return $this->comercial()->where('activo', 1)->first();
    }
    
    // Scopes
    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }
    
    public function scopeConCodigo($query, string $codigo)
    {
        return $query->where('codigo', $codigo);
    }
    
    // Accessors
    public function getCodigoDescripcionAttribute(): string
    {
        return $this->codigo . ' - ' . $this->descripcion;
    }
    
    public function getEstadoAttribute(): string
    {
        return $this->activo ? 'Activo' : 'Inactivo';
    }
    
    // Métodos de negocio
    public function desactivar(int $usuarioId): void
    {
        $this->activo = false;
        $this->deleted_by = $usuarioId;
        $this->save();
    }
    
    public function reactivar(): void
    {
        $this->activo = true;
        $this->deleted_by = null;
        $this->save();
    }
    
    public function tieneLeadsActivos(): bool
    {
        return $this->leads()
            ->where('es_activo', true)
            ->where('es_cliente', false)
            ->exists();
    }
    
    public function contarLeads(): array
    {
        return [
            'total' => $this->leads()->count(),
            'activos' => $this->leads()->where('es_activo', true)->count(),
            'clientes' => $this->leads()->where('es_cliente', true)->count(),
        ];
    }

    /**
     * Obtener el ID de compañía del prefijo
     */
    public function getCompaniaIdAttribute()
    {
        $comercial = $this->comercial()->where('activo', true)->first();
        return $comercial ? $comercial->compania_id : 1;
    }
}