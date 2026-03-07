<?php

namespace App\Http\Controllers\Config\Parametros;

use App\Http\Controllers\Controller;
use App\Models\MedioPago;
use Inertia\Inertia;
use Illuminate\Http\Request;

class MediosPagoController extends Controller
{
    public function index()
    {
        $mediosPago = MedioPago::activos()
            ->orderBy('nombre')
            ->get()
            ->map(function ($medio) {
                return [
                    'id' => $medio->id,
                    'nombre' => $medio->nombre,
                    'tipo' => $medio->tipo_texto,
                    'tipo_original' => $medio->tipo,
                    'requiere_datos' => $medio->requiere_datos_adicionales,
                    'activo' => $medio->es_activo,
                    'descripcion' => $medio->descripcion,
                    'icono' => $medio->icono_html,
                ];
            });

        return Inertia::render('Config/Parametros/MediosPago', [
            'mediosPago' => $mediosPago
        ]);
    }

    // Opcional: Método para obtener todos (incluyendo inactivos)
    public function getAll()
    {
        $mediosPago = MedioPago::orderBy('nombre')
            ->get()
            ->map(function ($medio) {
                return [
                    'id' => $medio->id,
                    'nombre' => $medio->nombre,
                    'tipo' => $medio->tipo_texto,
                    'tipo_original' => $medio->tipo,
                    'requiere_datos' => $medio->requiere_datos_adicionales,
                    'activo' => $medio->es_activo,
                    'descripcion' => $medio->descripcion,
                    'icono' => $medio->icono_html,
                ];
            });

        return Inertia::render('Config/Parametros/MediosPago', [
            'mediosPago' => $mediosPago
        ]);
    }
}