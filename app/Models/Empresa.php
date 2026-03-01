<?php
// app/Models/Empresa.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Empresa extends Model
{
    use SoftDeletes;

    protected $table = 'empresas';
    
    public $timestamps = false;
    
    const DELETED_AT = 'deleted_at';
    
    protected $fillable = [
        'alta_emp',
        'prefijo_id',
        'numeroalfa',
        'nombre_fantasia',
        'razon_social',
        'cuit',
        'direccion_fiscal',
        'codigo_postal_fiscal',
        'localidad_fiscal_id',
        'telefono_fiscal',
        'email_fiscal',
        'rubro_id',
        'cat_fiscal_id',
        'plataforma_id',
        'nombre_flota',
        'es_activo',
        'created_by',
        'modified_by',
        'deleted_by'
    ];
    
    protected $casts = [
        'alta_emp' => 'date',
        'es_activo' => 'boolean',
        'created' => 'datetime',
        'modified' => 'datetime',
        'deleted_at' => 'datetime'
    ];
    
    public function prefijo(): BelongsTo
    {
        return $this->belongsTo(Prefijo::class);
    }
    
    public function localidadFiscal(): BelongsTo
    {
        return $this->belongsTo(Localidad::class, 'localidad_fiscal_id');
    }
    
    public function rubro(): BelongsTo
    {
        return $this->belongsTo(Rubro::class, 'rubro_id');
    }
    
    public function categoriaFiscal(): BelongsTo
    {
        return $this->belongsTo(CategoriaFiscal::class, 'cat_fiscal_id');
    }
    
    public function plataforma(): BelongsTo
    {
        return $this->belongsTo(Plataforma::class, 'plataforma_id');
    }
    
    public function vehiculos(): HasMany
    {
        return $this->hasMany(Vehiculo::class);
    }
    
    public function vehiculosConAbonos(): HasMany
    {
        return $this->hasMany(Vehiculo::class)->with(['abonosActivos']);
    }
    
    public function contactos(): HasMany
    {
        return $this->hasMany(EmpresaContacto::class);
    }
    
    public function contactosActivos(): HasMany
    {
        return $this->hasMany(EmpresaContacto::class)
                    ->where('es_activo', true);
    }
    
    public function contactoPrincipal(): HasMany
    {
        return $this->hasMany(EmpresaContacto::class)
                    ->where('es_contacto_principal', true)
                    ->where('es_activo', true);
    }
    
    public function creadoPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'created_by');
    }
    
    public function modificadoPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'modified_by');
    }
    
    public function eliminadoPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'deleted_by');
    }
    
    public function scopeActivo($query)
    {
        return $query->where('es_activo', true);
    }
    
    public function getNumeroalfaFormateadoAttribute(): string
    {
        if (!$this->numeroalfa) {
            return 'Pendiente';
        }
        return str_pad($this->numeroalfa, 6, '0', STR_PAD_LEFT);
    }
    
    public function getNombreCompletoAttribute(): string
    {
        if ($this->nombre_fantasia && $this->razon_social) {
            return "{$this->nombre_fantasia} - {$this->razon_social}";
        }
        return $this->nombre_fantasia ?? $this->razon_social ?? 'Sin nombre';
    }

        /**
     * Responsables de la empresa
     */
    public function responsables(): HasMany
    {
        return $this->hasMany(EmpresaResponsable::class, 'empresa_id');
    }

    /**
     * Responsables activos de la empresa
     */
    public function responsablesActivos(): HasMany
    {
        return $this->hasMany(EmpresaResponsable::class, 'empresa_id')
                    ->where('es_activo', true);
    }

    public function cambiosRazonSocial()
    {
    return $this->hasMany(CambioRazonSocial::class, 'empresa_id');
    }

}