<?php
// app/Models/PersonalLicencia.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\SoftDeletes;

class PersonalLicencia extends Model
{
    use SoftDeletes;
    
    protected $table = 'personal_licencias';
    
    const CREATED_AT = 'created_at';
    const UPDATED_AT = 'updated_at';
    const DELETED_AT = 'deleted_at';
    
    protected $fillable = [
        'personal_id',
        'nombre_personal',
        'desde',
        'hasta',
        'motivo_licencia_id',
        'observacion',
        'created_by',
        'updated_by',
        'deleted_by'
    ];
    
    protected $casts = [
        'id' => 'integer',
        'personal_id' => 'integer',
        'motivo_licencia_id' => 'integer',
        'desde' => 'date',
        'hasta' => 'date',
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
        'deleted_at' => 'datetime'
    ];
    
    protected $appends = ['dias_totales', 'estado', 'dias_restantes'];
    
    public function personal(): BelongsTo
    {
        return $this->belongsTo(Personal::class, 'personal_id');
    }
    
    public function motivo(): BelongsTo
    {
        return $this->belongsTo(MotivoLicencia::class, 'motivo_licencia_id');
    }
    
    public function creadoPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'created_by');
    }
    
    public function actualizadoPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'updated_by');
    }
    
    public function eliminadoPor(): BelongsTo
    {
        return $this->belongsTo(Usuario::class, 'deleted_by');
    }
    
    public function getDiasTotalesAttribute(): int
    {
        $desde = \Carbon\Carbon::parse($this->desde);
        $hasta = \Carbon\Carbon::parse($this->hasta);
        return $desde->diffInDays($hasta) + 1;
    }
    
    public function getEstadoAttribute(): string
    {
        $hoy = now()->startOfDay();
        $desde = \Carbon\Carbon::parse($this->desde)->startOfDay();
        $hasta = \Carbon\Carbon::parse($this->hasta)->endOfDay();
        
        if ($hoy < $desde) {
            return 'Programada';
        } elseif ($hoy >= $desde && $hoy <= $hasta) {
            return 'En Curso';
        } else {
            return 'Finalizada';
        }
    }
    
    public function getDiasRestantesAttribute(): int
    {
        $hoy = now()->startOfDay();
        $desde = \Carbon\Carbon::parse($this->desde)->startOfDay();
        $hasta = \Carbon\Carbon::parse($this->hasta)->endOfDay();
        
        if ($hoy < $desde) {
            return $this->dias_totales;
        } elseif ($hoy > $hasta) {
            return 0;
        } else {
            return $hasta->diffInDays($hoy) + 1;
        }
    }
}