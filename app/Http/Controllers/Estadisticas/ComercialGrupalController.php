<?php
// app/Http/Controllers/Estadisticas/ComercialGrupalController.php

namespace App\Http\Controllers\Estadisticas;

use App\Http\Controllers\Controller;
use App\Models\Comercial;
use App\Models\Lead;
use App\Models\Contrato;
use Illuminate\Http\Request;
use Inertia\Inertia;

class ComercialGrupalController extends Controller
{
    /**
     * Constructor para aplicar middleware de permiso
     */
    public function __construct()
    {
        $this->middleware('permiso:ver_estadisticas_grupales');
    }

    /**
     * Lista de comerciales con resumen de rendimiento
     */
    public function index(Request $request)
    {
        $periodo = $request->get('periodo', 'mes_actual');
        $fechas = $this->calcularRangoFechas($periodo);
        
        $comerciales = Comercial::with(['personal', 'prefijo'])
            ->where('activo', true)
            ->get();
        
        $rendimiento = [];
        
        foreach ($comerciales as $comercial) {
            $prefijoId = $comercial->prefijo_id;
            
            $leads = Lead::where('prefijo_id', $prefijoId)
                ->whereBetween('created', [$fechas['inicio'], $fechas['fin']]);
            
            $totalLeads = $leads->count();
            
            $contratos = Contrato::whereIn('lead_id', $leads->pluck('id'))
                ->whereBetween('created', [$fechas['inicio'], $fechas['fin']]);
            
            $totalContratos = $contratos->count();
            $tasaConversion = $totalLeads > 0 ? round(($totalContratos / $totalLeads) * 100, 2) : 0;
            
            $rendimiento[] = [
                'id' => $comercial->id,
                'nombre' => $comercial->nombre_completo,
                'prefijo' => $comercial->prefijo?->codigo ?? 'N/A',
                'total_leads' => $totalLeads,
                'total_contratos' => $totalContratos,
                'tasa_conversion' => $tasaConversion,
                'avatar' => null,
            ];
        }
        
        // Ordenar por tasa de conversión
        usort($rendimiento, fn($a, $b) => $b['tasa_conversion'] <=> $a['tasa_conversion']);
        
        return Inertia::render('Estadisticas/Comerciales/Index', [
            'periodo' => $periodo,
            'comerciales' => $rendimiento,
        ]);
    }
    
    /**
     * Calcular rango de fechas
     */
    private function calcularRangoFechas(string $periodo): array
    {
        $hoy = now();
        
        return match($periodo) {
            'hoy' => [
                'inicio' => $hoy->copy()->startOfDay(),
                'fin' => $hoy->copy()->endOfDay(),
                'label' => 'Hoy'
            ],
            'semana_actual' => [
                'inicio' => $hoy->copy()->startOfWeek(),
                'fin' => $hoy->copy()->endOfWeek(),
                'label' => 'Esta Semana'
            ],
            'mes_actual' => [
                'inicio' => $hoy->copy()->startOfMonth(),
                'fin' => $hoy->copy()->endOfMonth(),
                'label' => 'Este Mes'
            ],
            'mes_pasado' => [
                'inicio' => $hoy->copy()->subMonth()->startOfMonth(),
                'fin' => $hoy->copy()->subMonth()->endOfMonth(),
                'label' => 'Mes Pasado'
            ],
            'trimestre_actual' => [
                'inicio' => $hoy->copy()->startOfQuarter(),
                'fin' => $hoy->copy()->endOfQuarter(),
                'label' => 'Este Trimestre'
            ],
            'anio_actual' => [
                'inicio' => $hoy->copy()->startOfYear(),
                'fin' => $hoy->copy()->endOfYear(),
                'label' => 'Este Año'
            ],
            default => [
                'inicio' => $hoy->copy()->startOfMonth(),
                'fin' => $hoy->copy()->endOfMonth(),
                'label' => 'Este Mes'
            ]
        };
    }
}