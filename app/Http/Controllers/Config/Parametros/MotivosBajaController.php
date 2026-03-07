<?php

namespace App\Http\Controllers\Config\Parametros;

use App\Http\Controllers\Controller;
use App\Models\MotivoPerdida;
use Inertia\Inertia;

class MotivosBajaController extends Controller
{
    public function index()
    {
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