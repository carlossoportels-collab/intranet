<?php

namespace App\Http\Controllers\Config\Parametros;

use App\Http\Controllers\Controller;
use App\Models\OrigenContacto;
use App\Models\Lead;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class OrigenProspectoController extends Controller
{
    public function index()
    {
        // Obtener todos los orígenes
        $origenes = OrigenContacto::orderBy('nombre')
            ->get()
            ->map(function ($origen) {
                return [
                    'id' => $origen->id,
                    'nombre' => $origen->nombre,
                    'descripcion' => $origen->descripcion,
                    'color' => $origen->color,
                    'icono' => $origen->icono,
                    'activo' => $origen->activo,
                ];
            });

        // Estadísticas de efectividad basadas en leads
        $efectividadPorOrigen = Lead::select(
                'origen_id',
                DB::raw('COUNT(*) as total_leads'),
                DB::raw('SUM(CASE WHEN es_cliente = 1 THEN 1 ELSE 0 END) as clientes_convertidos')
            )
            ->whereNotNull('origen_id')
            ->groupBy('origen_id')
            ->get()
            ->keyBy('origen_id');

        // Totales globales
        $totalLeadsConOrigen = Lead::whereNotNull('origen_id')->count();
        $totalClientesConOrigen = Lead::whereNotNull('origen_id')
            ->where('es_cliente', 1)
            ->count();
        
        $efectividadGlobal = $totalLeadsConOrigen > 0 
            ? round(($totalClientesConOrigen / $totalLeadsConOrigen) * 100) 
            : 0;

        // Combinar orígenes con estadísticas
        $origenesConEfectividad = $origenes->map(function ($origen) use ($efectividadPorOrigen) {
            $stats = $efectividadPorOrigen->get($origen['id']);
            $totalLeads = $stats->total_leads ?? 0;
            $clientesConvertidos = $stats->clientes_convertidos ?? 0;
            
            $efectividad = $totalLeads > 0 
                ? round(($clientesConvertidos / $totalLeads) * 100) 
                : 0;

            return array_merge($origen, [
                'efectividad' => $efectividad,
                'total_leads' => $totalLeads,
                'clientes_convertidos' => $clientesConvertidos
            ]);
        });

        // SOLO orígenes con leads para mostrar en la tabla
        $origenesConLeads = $origenesConEfectividad->filter(function ($item) {
            return $item['total_leads'] > 0;
        })->values(); // reindexar

        return Inertia::render('Config/Parametros/OrigenProspecto', [
            'origenesProspecto' => $origenesConLeads,
            'resumenGlobal' => [
                'total_origenes' => $origenesConLeads->count(),
                'total_leads_con_origen' => $totalLeadsConOrigen,
                'total_leads_sin_origen' => Lead::whereNull('origen_id')->count(),
                'efectividad_global' => $efectividadGlobal,
                'clientes_convertidos' => $totalClientesConOrigen
            ]
        ]);
    }
}