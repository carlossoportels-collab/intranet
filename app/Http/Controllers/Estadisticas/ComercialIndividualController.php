<?php
// app/Http/Controllers/Estadisticas/ComercialIndividualController.php

namespace App\Http\Controllers\Estadisticas;

use App\Http\Controllers\Controller;
use App\Models\Comercial;
use App\Models\Lead;
use App\Models\Presupuesto;
use App\Models\Contrato;
use App\Models\NotaLead;
use App\Models\SeguimientoPerdida;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ComercialIndividualController extends Controller
{
    /**
     * Mostrar estadísticas detalladas de un comercial específico
     */
    public function show(Request $request, $id)
    {
        $comercial = Comercial::with(['personal', 'prefijo'])
            ->findOrFail($id);
        
        // IMPORTANTE: Obtener el prefijo_id del comercial
        $prefijoId = $comercial->prefijo_id;
        
        if (!$prefijoId) {
            return Inertia::render('Estadisticas/Individual/Show', [
                'error' => 'Este comercial no tiene un prefijo asignado',
                'comercial' => [
                    'id' => $comercial->id,
                    'nombre' => $comercial->nombre_completo,
                    'prefijo_codigo' => 'Sin prefijo',
                ],
                'resumenPersonal' => $this->getEmptyResumen(),
                'evolucionMensual' => [],
                'distribucionEstados' => [],
                'actividadReciente' => [],
                'topProductos' => [],
                'tiemposPromedio' => ['promedio_total' => 0, 'muestras' => 0],
                'comparativaPromedio' => ['tasa_comercial' => 0, 'tasa_equipo' => 0, 'diferencia' => 0, 'performance' => 'promedio'],
            ]);
        }
        
        $periodo = $request->get('periodo', 'mes_actual');
        $fechas = $this->calcularRangoFechas($periodo);
        
        return Inertia::render('Estadisticas/Individual/Show', [
            'periodo' => $periodo,
            'comercial' => [
                'id' => $comercial->id,
                'nombre' => $comercial->nombre_completo,
                'prefijo_codigo' => $comercial->prefijo?->codigo ?? 'N/A',
                'prefijo_id' => $prefijoId,
                'email' => $comercial->personal?->email,
                'telefono' => $comercial->personal?->telefono,
            ],
            'resumenPersonal' => $this->getResumenPersonal($prefijoId, $fechas),
            'evolucionMensual' => $this->getEvolucionMensual($prefijoId),
            'distribucionEstados' => $this->getDistribucionEstados($prefijoId, $fechas),
            'actividadReciente' => $this->getActividadReciente($prefijoId, $fechas),
            'topProductos' => $this->getTopProductosVendidos($prefijoId, $fechas),
            'tiemposPromedio' => $this->getTiemposPromedio($prefijoId, $fechas),
            'comparativaPromedio' => $this->getComparativaPromedio($prefijoId, $fechas),
        ]);
    }
    
    private function getEmptyResumen()
    {
        return [
            'total_leads' => 0,
            'leads_activos' => 0,
            'leads_convertidos' => 0,
            'leads_perdidos' => 0,
            'total_presupuestos' => 0,
            'total_contratos' => 0,
            'valor_presupuestos' => 0,
            'valor_promedio_contrato' => 0,
            'tasa_conversion' => 0,
            'efectividad_presupuestos' => 0,
            'total_notas' => 0,
        ];
    }
    
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
    
    private function getResumenPersonal(int $prefijoId, array $fechas): array
    {
        // Leads del prefijo (comercial)
        $leads = Lead::where('prefijo_id', $prefijoId)
            ->whereBetween('created', [$fechas['inicio'], $fechas['fin']]);
        
        $totalLeads = $leads->count();
        $leadsActivos = $leads->where('es_activo', true)->where('es_cliente', false)->count();
        $leadsConvertidos = $leads->where('es_cliente', true)->count();
        
        // IDs de leads para subconsultas
        $leadIds = $leads->pluck('id');
        
        // Presupuestos
        $presupuestos = Presupuesto::whereIn('lead_id', $leadIds)
            ->whereBetween('created', [$fechas['inicio'], $fechas['fin']]);
        
        $totalPresupuestos = $presupuestos->count();
        $valorPresupuestos = $presupuestos->sum('total_presupuesto');
        
        // Contratos
        $contratos = Contrato::whereIn('lead_id', $leadIds)
            ->whereBetween('created', [$fechas['inicio'], $fechas['fin']]);
        
        $totalContratos = $contratos->count();
        
        // Notas
        $notas = NotaLead::whereIn('lead_id', $leadIds)
            ->whereBetween('created', [$fechas['inicio'], $fechas['fin']])
            ->count();
        
        // Leads perdidos
        $leadsPerdidos = SeguimientoPerdida::whereIn('lead_id', $leadIds)
            ->whereBetween('created', [$fechas['inicio'], $fechas['fin']])
            ->whereNull('deleted_at')
            ->count();
        
        $tasaConversion = $totalLeads > 0 ? round(($totalContratos / $totalLeads) * 100, 2) : 0;
        $valorPromedioContrato = $totalContratos > 0 ? round($valorPresupuestos / $totalContratos, 2) : 0;
        $efectividadPresupuestos = $totalPresupuestos > 0 ? round(($totalContratos / $totalPresupuestos) * 100, 2) : 0;
        
        return [
            'total_leads' => $totalLeads,
            'leads_activos' => $leadsActivos,
            'leads_convertidos' => $leadsConvertidos,
            'leads_perdidos' => $leadsPerdidos,
            'total_presupuestos' => $totalPresupuestos,
            'total_contratos' => $totalContratos,
            'valor_presupuestos' => $valorPresupuestos,
            'valor_promedio_contrato' => $valorPromedioContrato,
            'tasa_conversion' => $tasaConversion,
            'efectividad_presupuestos' => $efectividadPresupuestos,
            'total_notas' => $notas,
        ];
    }
    
    private function getEvolucionMensual(int $prefijoId): array
    {
        $inicio = now()->subMonths(5)->startOfMonth();
        $meses = [];
        
        for ($i = 0; $i < 6; $i++) {
            $mes = $inicio->copy()->addMonths($i);
            $inicioMes = $mes->copy()->startOfMonth();
            $finMes = $mes->copy()->endOfMonth();
            
            $leads = Lead::where('prefijo_id', $prefijoId)
                ->whereBetween('created', [$inicioMes, $finMes])
                ->count();
            
            $contratos = Contrato::whereHas('lead', function($q) use ($prefijoId) {
                    $q->where('prefijo_id', $prefijoId);
                })
                ->whereBetween('created', [$inicioMes, $finMes])
                ->count();
            
            $valor = Presupuesto::whereHas('lead', function($q) use ($prefijoId) {
                    $q->where('prefijo_id', $prefijoId);
                })
                ->whereBetween('created', [$inicioMes, $finMes])
                ->sum('total_presupuesto');
            
            $meses[] = [
                'mes' => $mes->format('Y-m'),
                'nombre_mes' => $mes->translatedFormat('M Y'),
                'leads' => $leads,
                'contratos' => $contratos,
                'valor' => $valor,
            ];
        }
        
        return $meses;
    }
    
    private function getDistribucionEstados(int $prefijoId, array $fechas): array
    {
        $estados = DB::table('estados_lead')
            ->leftJoin('leads', function($join) use ($prefijoId, $fechas) {
                $join->on('estados_lead.id', '=', 'leads.estado_lead_id')
                    ->where('leads.prefijo_id', $prefijoId)
                    ->whereBetween('leads.created', [$fechas['inicio'], $fechas['fin']])
                    ->whereNull('leads.deleted_at');
            })
            ->select(
                'estados_lead.nombre',
                'estados_lead.color_hex',
                DB::raw('COUNT(leads.id) as total')
            )
            ->where('estados_lead.activo', true)
            ->groupBy('estados_lead.id', 'estados_lead.nombre', 'estados_lead.color_hex')
            ->having('total', '>', 0)
            ->get();
        
        return $estados->toArray();
    }
    
    private function getActividadReciente(int $prefijoId, array $fechas): array
    {
        $leadIds = Lead::where('prefijo_id', $prefijoId)
            ->whereBetween('created', [$fechas['inicio'], $fechas['fin']])
            ->pluck('id');
        
        $notas = NotaLead::whereIn('lead_id', $leadIds)
            ->with(['lead', 'usuario.personal'])
            ->orderBy('created', 'desc')
            ->limit(10)
            ->get()
            ->map(function($nota) {
                return [
                    'id' => $nota->id,
                    'tipo' => 'nota',
                    'lead_nombre' => $nota->lead->nombre_completo,
                    'contenido' => $nota->observacion,
                    'fecha' => $nota->created,
                    'fecha_formateada' => $nota->created->diffForHumans(),
                    'usuario' => $nota->usuario?->nombre_completo ?? 'Sistema',
                ];
            });
        
        return $notas->toArray();
    }
    
    private function getTopProductosVendidos(int $prefijoId, array $fechas): array
    {
        $leadIds = Lead::where('prefijo_id', $prefijoId)
            ->whereBetween('created', [$fechas['inicio'], $fechas['fin']])
            ->pluck('id');
        
        $productos = DB::table('presupuestos_agregados')
            ->join('presupuestos', 'presupuestos_agregados.presupuesto_id', '=', 'presupuestos.id')
            ->join('productos_servicios', 'presupuestos_agregados.prd_servicio_id', '=', 'productos_servicios.id')
            ->join('tipo_prd_srv', 'productos_servicios.tipo_id', '=', 'tipo_prd_srv.id')
            ->whereIn('presupuestos.lead_id', $leadIds)
            ->whereBetween('presupuestos.created', [$fechas['inicio'], $fechas['fin']])
            ->select(
                'productos_servicios.nombre',
                'tipo_prd_srv.nombre_tipo_abono as tipo',
                DB::raw('COUNT(*) as cantidad'),
                DB::raw('SUM(presupuestos_agregados.subtotal) as total_vendido')
            )
            ->groupBy('productos_servicios.id', 'productos_servicios.nombre', 'tipo_prd_srv.nombre_tipo_abono')
            ->orderBy('cantidad', 'desc')
            ->limit(10)
            ->get();
        
        return $productos->toArray();
    }
    
    private function getTiemposPromedio(int $prefijoId, array $fechas): array
    {
        $leadIds = Lead::where('prefijo_id', $prefijoId)
            ->whereBetween('created', [$fechas['inicio'], $fechas['fin']])
            ->where('es_cliente', true)
            ->pluck('id');
        
        $tiempos = [];
        
        foreach ($leadIds as $leadId) {
            $lead = Lead::find($leadId);
            $primerPresupuesto = Presupuesto::where('lead_id', $leadId)
                ->orderBy('created', 'asc')
                ->first();
            $contrato = Contrato::where('lead_id', $leadId)->first();
            
            if ($primerPresupuesto && $contrato && $lead) {
                $tiempoLeadPresupuesto = $primerPresupuesto->created->diffInDays($lead->created);
                $tiempoPresupuestoContrato = $contrato->created->diffInDays($primerPresupuesto->created);
                $tiempoTotal = $contrato->created->diffInDays($lead->created);
                
                $tiempos[] = [
                    'lead_presupuesto' => $tiempoLeadPresupuesto,
                    'presupuesto_contrato' => $tiempoPresupuestoContrato,
                    'total' => $tiempoTotal,
                ];
            }
        }
        
        $cantidad = count($tiempos);
        
        return [
            'promedio_lead_presupuesto' => $cantidad > 0 ? round(array_sum(array_column($tiempos, 'lead_presupuesto')) / $cantidad, 1) : 0,
            'promedio_presupuesto_contrato' => $cantidad > 0 ? round(array_sum(array_column($tiempos, 'presupuesto_contrato')) / $cantidad, 1) : 0,
            'promedio_total' => $cantidad > 0 ? round(array_sum(array_column($tiempos, 'total')) / $cantidad, 1) : 0,
            'muestras' => $cantidad,
        ];
    }
    
    private function getComparativaPromedio(int $prefijoId, array $fechas): array
    {
        // Datos del comercial
        $leadsComercial = Lead::where('prefijo_id', $prefijoId)
            ->whereBetween('created', [$fechas['inicio'], $fechas['fin']]);
        
        $contratosComercial = Contrato::whereIn('lead_id', $leadsComercial->pluck('id'))
            ->whereBetween('created', [$fechas['inicio'], $fechas['fin']]);
        
        $leadsCount = $leadsComercial->count();
        $contratosCount = $contratosComercial->count();
        $tasaComercial = $leadsCount > 0 ? round(($contratosCount / $leadsCount) * 100, 2) : 0;
        
        // Promedio del equipo (todos los prefijos con comerciales activos)
        $todosLosPrefijos = Comercial::where('activo', true)
            ->whereNotNull('prefijo_id')
            ->pluck('prefijo_id');
        
        $leadsEquipo = Lead::whereIn('prefijo_id', $todosLosPrefijos)
            ->whereBetween('created', [$fechas['inicio'], $fechas['fin']]);
        
        $contratosEquipo = Contrato::whereIn('lead_id', $leadsEquipo->pluck('id'))
            ->whereBetween('created', [$fechas['inicio'], $fechas['fin']]);
        
        $leadsEquipoCount = $leadsEquipo->count();
        $contratosEquipoCount = $contratosEquipo->count();
        $tasaEquipo = $leadsEquipoCount > 0 ? round(($contratosEquipoCount / $leadsEquipoCount) * 100, 2) : 0;
        
        $diferencia = $tasaComercial - $tasaEquipo;
        
        return [
            'tasa_comercial' => $tasaComercial,
            'tasa_equipo' => $tasaEquipo,
            'diferencia' => $diferencia,
            'performance' => $diferencia > 5 ? 'superior' : ($diferencia < -5 ? 'inferior' : 'promedio'),
        ];
    }
}