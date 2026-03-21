<?php
// app/Http/Controllers/Config/Parametros/MotivosBajaController.php

namespace App\Http\Controllers\Config\Parametros;

use App\Http\Controllers\Controller;
use App\Traits\Authorizable;
use App\Models\MotivoPerdida;
use Inertia\Inertia;

class MotivosBajaController extends Controller
{
    use Authorizable;

    public function __construct()
    {
        $this->initializeAuthorization();
    }

    public function index()
    {
        // 🔥 VERIFICAR PERMISO BASE
        $this->authorizePermiso(config('permisos.VER_CONFIGURACION'));
        
        $motivosBaja = MotivoPerdida::orderBy('nombre')
            ->get()
            ->map(function ($motivo) {
                return [
                    'id' => $motivo->id,
                    'nombre' => $motivo->nombre,
                    'descripcion' => $motivo->descripcion,
                    'activo' => $motivo->es_activo,
                ];
            });

        return Inertia::render('Config/Parametros/MotivosBaja', [
            'motivosBaja' => $motivosBaja
        ]);
    }
}