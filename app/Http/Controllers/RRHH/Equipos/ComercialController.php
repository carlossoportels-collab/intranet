<?php
// app/Http/Controllers/rrhh/Equipos/ComercialController.php

namespace App\Http\Controllers\rrhh\Equipos;

use App\Http\Controllers\Controller;
use App\Traits\Authorizable; // 🔥 IMPORTAR TRAIT
use App\Models\Comercial;
use App\Models\Personal;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ComercialController extends Controller
{
    use Authorizable; // 🔥 AGREGAR TRAIT

    public function __construct()
    {
        $this->initializeAuthorization(); // 🔥 INICIALIZAR
    }

    public function create()
    {
        // 🔥 VERIFICAR PERMISO
        $this->authorizePermiso(config('permisos.GESTIONAR_EQUIPO_COMERCIAL'));
        
        // Obtener personal que no tiene comercial asignado
        $personalDisponible = Personal::whereDoesntHave('comercial')
            ->where('activo', true)
            ->get()
            ->map(function($p) {
                return [
                    'id' => $p->id,
                    'nombre_completo' => $p->nombre_completo,
                ];
            });

        return Inertia::render('rrhh/Equipos/ComercialForm', [
            'personalDisponible' => $personalDisponible,
            'companias' => [
                ['id' => 1, 'nombre' => 'LocalSat'],
                ['id' => 2, 'nombre' => 'SmartSat'],
                ['id' => 3, 'nombre' => '360'],
            ],
        ]);
    }

    public function store(Request $request)
    {
        // 🔥 VERIFICAR PERMISO
        $this->authorizePermiso(config('permisos.GESTIONAR_EQUIPO_COMERCIAL'));
        
        // Validar y guardar
        // ... código existente ...
    }

    public function edit($id)
    {
        // 🔥 VERIFICAR PERMISO
        $this->authorizePermiso(config('permisos.GESTIONAR_EQUIPO_COMERCIAL'));
        
        $comercial = Comercial::with('personal')->findOrFail($id);
        
        return Inertia::render('rrhh/Equipos/ComercialForm', [
            'comercial' => $comercial,
            'companias' => [
                ['id' => 1, 'nombre' => 'LocalSat'],
                ['id' => 2, 'nombre' => 'SmartSat'],
                ['id' => 3, 'nombre' => '360'],
            ],
        ]);
    }

    public function update(Request $request, $id)
    {
        // 🔥 VERIFICAR PERMISO
        $this->authorizePermiso(config('permisos.GESTIONAR_EQUIPO_COMERCIAL'));
        
        // Actualizar
        // ... código existente ...
    }

    public function destroy($id)
    {
        // 🔥 VERIFICAR PERMISO
        $this->authorizePermiso(config('permisos.GESTIONAR_EQUIPO_COMERCIAL'));
        
        // Eliminar
        // ... código existente ...
    }
}