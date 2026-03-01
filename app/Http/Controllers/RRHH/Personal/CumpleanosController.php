<?php
// app/Http/Controllers/rrhh/Personal/CumpleanosController.php

namespace App\Http\Controllers\rrhh\Personal;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Personal;

class CumpleanosController extends Controller
{
    public function index(Request $request)
    {
        // Obtener personal con fecha de nacimiento válida
        $personal = Personal::whereNotNull('fecha_nacimiento')
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
            ->get();
        
        return Inertia::render('rrhh/Personal/Cumpleanos', [
            'personal' => $personal,
            'filtros' => $request->only(['mes', 'departamento']),
        ]);
    }
}