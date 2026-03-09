<?php
// app/Models/MotivoLicencia.php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class MotivoLicencia extends Model
{
    protected $table = 'motivo_licencias';
    
    public $timestamps = false;
    
    protected $fillable = [
        'nombre'
    ];
    
    protected $casts = [
        'id' => 'integer'
    ];
    
    public function licencias(): HasMany
    {
        return $this->hasMany(PersonalLicencia::class, 'motivo_licencia_id');
    }
}