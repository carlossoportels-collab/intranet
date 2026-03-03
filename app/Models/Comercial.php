<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\SoftDeletes;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class Comercial extends Model
{
    use SoftDeletes;
    
    protected $table = 'comercial';
    protected $primaryKey = 'id';
    
    const CREATED_AT = 'created';
    const UPDATED_AT = 'modified';
    const DELETED_AT = 'deleted_at';
    
    protected $fillable = [
        'personal_id',
        'prefijo_id',
        'firma',
        'img_comercial',
        'compania_id',
        'activo',
        'created_by',
        'modified_by',
        'deleted_by'
    ];
    
    protected $casts = [
        'activo' => 'boolean',
        'compania_id' => 'integer',
        'created' => 'datetime',
        'modified' => 'datetime'
    ];
    
    public function personal(): BelongsTo
    {
        return $this->belongsTo(Personal::class, 'personal_id');
    }
    public function leads()
    {
        return $this->hasMany(Lead::class, 'prefijo_id', 'prefijo_id');
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
    
    public function scopeActivo($query)
    {
        return $query->where('activo', true);
    }
    
    public function getNombreCompletoAttribute()
    {
        if ($this->personal) {
            return $this->personal->nombre . ' ' . $this->personal->apellido;
        }
        return 'Comercial #' . $this->id;
    }

    public function compania(): BelongsTo
    {
    return $this->belongsTo(Compania::class, 'compania_id');
    }

}