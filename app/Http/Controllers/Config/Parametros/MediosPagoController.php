<?php
// app/Http/Controllers/Config/Parametros/MediosPagoController.php

namespace App\Http\Controllers\Config\Parametros;

use App\Http\Controllers\Controller;
use App\Traits\Authorizable;
use App\Models\MedioPago;
use Inertia\Inertia;
use Illuminate\Http\Request;

class MediosPagoController extends Controller
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

    public function getAll()
    {
        // 🔥 VERIFICAR PERMISO BASE
        $this->authorizePermiso(config('permisos.VER_CONFIGURACION'));
        
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