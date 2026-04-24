<?php
// app/Http/Controllers/Comercial/ActividadController.php

namespace App\Http\Controllers\Comercial;

use App\Http\Controllers\Controller;
use App\Services\Comercial\ActividadService;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ActividadController extends Controller
{
    protected $actividadService;

    public function __construct(ActividadService $actividadService)
    {
        $this->actividadService = $actividadService;
    }

    public function index(Request $request)
    {
        $usuario = Auth::user();
        $esComercial = $usuario->rol_id == 5;
        
        // Obtener parámetros de filtro
        $comercialId = $request->get('comercial_id');
        $fechaInicio = $request->get('fecha_inicio');
        $fechaFin = $request->get('fecha_fin');
        $rangoRapido = $request->get('rango_rapido');
        
        // 🔥 SI NO HAY FILTROS DE FECHA, ESTABLECER "ESTE MES" POR DEFECTO
        if (!$fechaInicio && !$fechaFin && !$rangoRapido) {
            $rangoRapido = 'mes';
            $fechaInicio = now()->startOfMonth()->format('Y-m-d');
            $fechaFin = now()->endOfMonth()->format('Y-m-d');
        }
        
        // Si hay un rango rápido, calcular fechas
        if ($rangoRapido) {
            $opciones = $this->actividadService->getOpcionesFechas();
            $opcion = collect($opciones)->firstWhere('id', $rangoRapido);
            if ($opcion) {
                $fechaInicio = $opcion['inicio'];
                $fechaFin = $opcion['fin'];
            }
        }
        
        // Si es comercial y no se especificó un comercial, usar su ID
        if ($esComercial) {
            $comercialActual = $this->actividadService->getComercialActual();
            if ($comercialActual) {
                $comercialId = $comercialActual['id'];
            }
        }
        
        // Obtener datos
        $estadisticas = $this->actividadService->getEstadisticas($comercialId, $fechaInicio, $fechaFin);
        // 🔥 AUMENTAR EL LÍMITE DE REGISTROS A 50
        $actividadReciente = $this->actividadService->getActividadReciente($comercialId, $fechaInicio, $fechaFin, 50);
        $comerciales = $this->actividadService->getComercialesConPrefijos();
        $opcionesFechas = $this->actividadService->getOpcionesFechas();
        $comercialActual = $esComercial ? $this->actividadService->getComercialActual() : null;
        
        // Obtener total de elementos para paginación
        $total = $actividadReciente->count();
        $perPage = 15;
        $currentPage = (int)$request->get('page', 1);
        $paginated = $actividadReciente->slice(($currentPage - 1) * $perPage, $perPage)->values();
        
        return Inertia::render('Comercial/Actividad', [
            'estadisticas' => $estadisticas,
            'actividadReciente' => $paginated,
            'comerciales' => $comerciales,
            'opcionesFechas' => $opcionesFechas,
            'comercialActual' => $comercialActual,
            'esComercial' => $esComercial,
            'filtros' => [
                'comercial_id' => $comercialId,
                'fecha_inicio' => $fechaInicio,
                'fecha_fin' => $fechaFin,
                'rango_rapido' => $rangoRapido,
            ],
            'pagination' => [
                'current_page' => $currentPage,
                'last_page' => ceil($total / $perPage),
                'total' => $total,
                'per_page' => $perPage,
                'from' => ($currentPage - 1) * $perPage + 1,
                'to' => min($currentPage * $perPage, $total),
            ],
            'usuario' => [
                'rol_id' => $usuario->rol_id,
                've_todas_cuentas' => $usuario->ve_todas_cuentas,
                'es_comercial' => $esComercial,
            ]
        ]);
    }
}