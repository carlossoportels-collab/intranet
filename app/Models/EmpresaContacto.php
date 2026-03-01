<?php
// app/Models/EmpresaContacto.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class EmpresaContacto extends Model
{
    use SoftDeletes;

    protected $table = 'empresa_contactos';
    
    public $timestamps = false;
    
    const DELETED_AT = 'deleted_at';
    
    protected $fillable = [
        'empresa_id',
        'lead_id',
        'es_contacto_principal',
        'tipo_responsabilidad_id',
        'tipo_documento_id',
        'nro_documento',
        'nacionalidad_id',
        'fecha_nacimiento',
        'direccion_personal',
        'codigo_postal_personal',
        'es_activo',
        'created_by',
        'modified_by',
        'deleted_by'
    ];
    
    protected $casts = [
        'es_activo' => 'boolean',
        'es_contacto_principal' => 'boolean',
        'fecha_nacimiento' => 'date:Y-m-d',
        'created' => 'datetime',
        'modified' => 'datetime',
        'deleted_at' => 'datetime'
    ];
    
    public function lead(): BelongsTo
    {
        return $this->belongsTo(Lead::class);
    }
    
    public function empresa(): BelongsTo
    {
        return $this->belongsTo(Empresa::class);
    }
    
    public function tipoResponsabilidad(): BelongsTo
    {
        return $this->belongsTo(TipoResponsabilidad::class, 'tipo_responsabilidad_id');
    }
    
    public function tipoDocumento(): BelongsTo
    {
        return $this->belongsTo(TipoDocumento::class, 'tipo_documento_id');
    }
    
    public function nacionalidad(): BelongsTo
    {
        return $this->belongsTo(Nacionalidad::class, 'nacionalidad_id');
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
    
    public function scopePrincipal($query)
    {
        return $query->where('es_contacto_principal', true);
    }

    public function getFechaNacimientoAttribute($value)
{
    return $value ? \Carbon\Carbon::parse($value)->format('Y-m-d') : null;
}
}