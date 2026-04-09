<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Lead extends Model
{
    use SoftDeletes;
    
    protected $table = 'leads';
    protected $primaryKey = 'id';
    
    const CREATED_AT = 'created';
    const UPDATED_AT = 'modified';
    const DELETED_AT = 'deleted_at';
    
    protected $fillable = [
        'prefijo_id',
        'nombre_completo',
        'genero',
        'telefono',
        'email',
        'localidad_id',
        'rubro_id',
        'origen_id',
        'estado_lead_id',
        'es_cliente',
        'es_activo',
        'created_by',
        'modified_by',
    ];
    
    protected $casts = [
        'es_cliente' => 'boolean',
        'es_activo' => 'boolean',
        'created' => 'datetime',
        'modified' => 'datetime'
    ];
    
    protected $appends = ['localidad_completa', 'asignado_nombre']; // ← Agregar 'asignado_nombre'
    
    // Relaciones existentes...
    public function origen(): BelongsTo
    {
        return $this->belongsTo(OrigenContacto::class, 'origen_id');
    }
    
    public function estadoLead(): BelongsTo
    {
        return $this->belongsTo(EstadoLead::class, 'estado_lead_id');
    }
    
    public function localidad(): BelongsTo
    {
        return $this->belongsTo(Localidad::class, 'localidad_id');
    }
    
    public function rubro(): BelongsTo
    {
        return $this->belongsTo(Rubro::class, 'rubro_id');
    }
    
    public function prefijo(): BelongsTo
    {
        return $this->belongsTo(Prefijo::class, 'prefijo_id');
    }
    
    public function comercial(): BelongsTo
    {
        return $this->belongsTo(Comercial::class, 'prefijo_id', 'prefijo_id');

    }
    public function notas(): HasMany
    {
        return $this->hasMany(NotaLead::class, 'lead_id');
    }
    
    public function comentarios(): HasMany
    {
        return $this->hasMany(Comentario::class, 'lead_id');
    }
    
    public function comentariosLegacy(): HasMany
    {
        return $this->hasMany(ComentarioLegacy::class, 'lead_id');
    }
    
    public function notificaciones(): HasMany
    {
        return $this->hasMany(Notificacion::class, 'entidad_id')
            ->where('entidad_tipo', 'lead');
    }
    
    public function auditorias(): HasMany
    {
        return $this->hasMany(AuditoriaLog::class, 'registro_id')
            ->where('tabla_afectada', 'leads');
    }
    
    public function usuarioCreacion(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'created_by');
    }
    
    public function seguimientoPerdida(): HasOne
    {
    return $this->hasOne(SeguimientoPerdida::class, 'lead_id')
        ->whereNull('deleted_at')
        ->latest('created');
    }

    // Accessors
    public function getLocalidadCompletaAttribute(): ?string
    {
        if ($this->localidad && $this->localidad->provincia) {
            return "{$this->localidad->localidad}, {$this->localidad->provincia->provincia}";
        }
        
        if ($this->localidad) {
            return $this->localidad->localidad;
        }
        
        return null;
    }
    
    // Scopes
    public function scopeActivo($query)
    {
        return $query->where('es_activo', true);
    }
    
    public function scopeNoClientes($query)
    {
        return $query->where('es_cliente', false);
    }
    
    public function scopeConPrefijo($query, $prefijoId)
    {
        return $query->where('prefijo_id', $prefijoId);
    }
    
    // Métodos de negocio
    public function asignarPrefijo(?int $prefijoId): void
    {
        $this->prefijo_id = $prefijoId;
        $this->save();
    }
    
    public function cambiarEstado(int $estadoId, int $usuarioId): void
    {
        $this->estado_lead_id = $estadoId;
        $this->modified_by = $usuarioId;
        $this->save();
    }
    
    public function presupuestosLegacy()
    {
        return $this->hasMany(PresupuestoLegacy::class, 'lead_id');
    }

    public function contratoLegacy()
    {
        return $this->hasMany(ContratoLegacy::class, 'lead_id');
    }

    public function empresaContacto(): HasOne
    {
        return $this->hasOne(EmpresaContacto::class, 'lead_id')
                    ->where('es_activo', true);
    }

    // Y este accessor para obtener la empresa directamente
    public function getEmpresaAttribute()
    {
        return $this->empresaContacto?->empresa;
    }

    /**
 * Notificaciones de recordatorio no leídas para este lead
 */
public function recordatoriosNoLeidos()
{
    return $this->hasMany(\App\Models\Notificacion::class, 'entidad_id', 'id')
        ->where('entidad_tipo', 'lead')
        ->whereIn('tipo', [
            'comentario_recordatorio',
            'lead_posible_recontacto',
            'recontacto_recordatorio',
            'lead_sin_contactar'
        ])
        ->where('leida', false)
        ->whereNull('deleted_at');
}
/**
 * Accessor para obtener el nombre del comercial asignado
 */
/**
 * Accessor para obtener el nombre del comercial asignado
 */
/**
 * Accessor para obtener el nombre del comercial asignado
 */
public function getAsignadoNombreAttribute(): ?string
{
     
    // Intentar obtener el nombre
    try {
        $nombre = $this->prefijo?->comercial?->personal?->nombre_completo ?? 
                  $this->prefijo?->comercial?->first()?->personal?->nombre_completo ?? 
                  'Sin asignar';
        return $nombre;
    } catch (\Exception $e) {
        \Log::error('Error obteniendo nombre comercial', [
            'lead_id' => $this->id,
            'error' => $e->getMessage()
        ]);
        return 'Sin asignar';
    }
}

}