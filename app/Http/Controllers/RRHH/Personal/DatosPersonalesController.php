<?php
// app/Http/Controllers/rrhh/Personal/DatosPersonalesController.php

namespace App\Http\Controllers\rrhh\Personal;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Personal;
use App\Models\TipoPersonal;
use Illuminate\Support\Facades\DB;

class DatosPersonalesController extends Controller
{
    public function index(Request $request)
    {
        // Obtener personal con tipo_personal
        $personal = Personal::with('tipoPersonal')
            ->whereNull('deleted_at')
            ->orderBy('nombre')
            ->get();
        
        // Obtener tipos de personal
        $tiposPersonal = TipoPersonal::where('activo', 1)
            ->whereNull('deleted_at')
            ->get(['id', 'nombre']);
        
        // Calcular estadísticas
        $total = $personal->count();
        $activos = $personal->where('activo', 1)->count();
        
        // Contar por tipo de personal
        $tiposCount = [];
        foreach ($tiposPersonal as $tipo) {
            $tiposCount[$tipo->nombre] = $personal->where('tipo_personal_id', $tipo->id)->count();
        }
        
        return Inertia::render('rrhh/Personal/DatosPersonales', [
            'personal' => $personal,
            'tiposPersonal' => $tiposPersonal,
            'estadisticas' => [
                'total' => $total,
                'activos' => $activos,
                'tiposCount' => $tiposCount,
            ],
            'filters' => $request->only(['search']),
        ]);
    }
}