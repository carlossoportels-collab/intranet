<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use App\Models\Empresa;
use App\Models\Usuario;

class CambioRazonSocial extends Model
{
    use HasFactory;

    protected $table = 'cambios_razon_social';
    
    public $timestamps = false;
    
    protected $fillable = [
        'empresa_id',
        'razon_social_anterior',
        'cuit_anterior',
        'razon_social_nueva',
        'cuit_nuevo',
        'datos_adicionales',
        'fecha_cambio',
        'usuario_id',
    ];

    protected $casts = [
        'fecha_cambio' => 'datetime',
        'datos_adicionales' => 'array',
    ];

    public function empresa()
    {
        return $this->belongsTo(Empresa::class);
    }

    public function usuario()
    {
        return $this->belongsTo(Usuario::class);
    }
}