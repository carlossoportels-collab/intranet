<?php

namespace App\Http\Controllers\Comercial;

use App\Http\Controllers\Controller;
use App\Models\MotivoPerdida;

class MotivoPerdidaController extends Controller
{
    /**
     * Obtener motivos de pérdida activos para el modal
     */
    public function getMotivosActivos()
    {
        try {
            
            $motivos = MotivoPerdida::where('es_activo', 1)
                ->orderBy('nombre')
                ->get(['id', 'nombre', 'descripcion', 'es_activo']);
            
            
            return response()->json($motivos);
            
        } catch (\Exception $e) {
            
            return response()->json([
                'error' => 'Error al cargar motivos de pérdida',
                'message' => $e->getMessage()
            ], 500);
        }
    }
}