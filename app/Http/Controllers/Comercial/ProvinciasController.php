<?php

namespace App\Http\Controllers\Comercial;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Provincia;
use Illuminate\Support\Facades\Log;

class ProvinciasController extends Controller
{
    /**
     * Obtener todas las provincias activas
     */
    public function index()
    {
        try {
            $provincias = Provincia::activo()
                ->ordenar()
                ->get(['id', 'nombre']);  // ← Cambiado de 'provincia' a 'nombre'
            
            return response()->json([
                'success' => true,
                'data' => $provincias
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error en ProvinciaController::index', [
                'message' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener provincias'
            ], 500);
        }
    }
    
    /**
     * Obtener localidades por provincia
     */
    public function localidades($provinciaId)
    {
        try {
            $provincia = Provincia::with(['localidades' => function($query) {
                $query->activo()->ordenar();
            }])->findOrFail($provinciaId);
            
            $localidades = $provincia->localidades->map(function ($localidad) {
                return [
                    'id' => $localidad->id,
                    'nombre' => $localidad->nombre,  // ← Cambiado de 'localidad' a 'nombre'
                    'codigo_postal' => $localidad->codigo_postal,
                ];
            });
            
            return response()->json([
                'success' => true,
                'data' => $localidades
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error en ProvinciaController::localidades', [
                'message' => $e->getMessage(),
                'provincia_id' => $provinciaId
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Error al obtener localidades'
            ], 500);
        }
    }
}