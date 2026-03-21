<?php
// app/Http/Controllers/rrhh/Personal/CumpleanosController.php

namespace App\Http\Controllers\rrhh\Personal;

use App\Http\Controllers\Controller;
use App\Traits\Authorizable; // 🔥 IMPORTAR TRAIT
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Personal;

class CumpleanosController extends Controller
{
    use Authorizable; // 🔥 AGREGAR TRAIT

    public function __construct()
    {
        $this->initializeAuthorization(); // 🔥 INICIALIZAR
    }

    public function index(Request $request)
    {
        // 🔥 VERIFICAR PERMISO
        $this->authorizePermiso(config('permisos.VER_CUMPLEANOS'));
        
        // Obtener personal con fecha de nacimiento válida y su tipo
        $personal = Personal::with('tipoPersonal')
            ->whereNotNull('fecha_nacimiento')
            ->whereNull('deleted_at')
            ->orderByRaw("
                CASE 
                    WHEN MONTH(fecha_nacimiento) > MONTH(CURRENT_DATE()) 
                    OR (MONTH(fecha_nacimiento) = MONTH(CURRENT_DATE()) AND DAY(fecha_nacimiento) >= DAY(CURRENT_DATE()))
                    THEN 0 
                    ELSE 1 
                END,
                MONTH(fecha_nacimiento),
                DAY(fecha_nacimiento)
            ")
            ->get()
            ->map(function($p) {
                return [
                    'id' => $p->id,
                    'nombre' => $p->nombre,
                    'apellido' => $p->apellido,
                    'email' => $p->email,
                    'telefono' => $p->telefono,
                    'fecha_nacimiento' => $p->fecha_nacimiento,
                    'activo' => $p->activo,
                    'departamento' => $p->tipoPersonal?->nombre ?? 'General',
                    'tipo_personal_id' => $p->tipo_personal_id,
                ];
            });
        
        // Obtener departamentos únicos para los filtros
        $departamentos = $personal->pluck('departamento')->unique()->values();
        
        return Inertia::render('rrhh/Personal/Cumpleanos', [
            'personal' => $personal,
            'departamentos' => $departamentos,
        ]);
    }
}