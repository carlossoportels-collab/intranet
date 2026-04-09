<?php
// app/Http/Controllers/Estadisticas/EstadisticasGeneralesController.php

namespace App\Http\Controllers\Estadisticas;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Presupuesto;
use App\Models\Contrato;
use App\Models\Comercial;
use App\Models\SeguimientoPerdida;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EstadisticasGeneralesController extends Controller
{
    /**
     * Constructor para aplicar middleware de permiso
     */
    public function __construct()
    {
        $this->middleware('permiso:ver_estadisticas_grupales');
    }

    /**
     * Vista principal de estadísticas generales
     */
    public function index(Request $request)
    {
        $periodo = $request->get('periodo', 'mes_actual');
        $comercialId = $request->get('comercial_id', 'todos');
        $fechas = $this->calcularRangoFechas($periodo);
        
        return Inertia::render('Estadisticas/Generales/Index', [
            'periodo' => $periodo,
            'comercialId' => $comercialId,
            'resumenGeneral' => $this->getResumenGeneral($fechas, $comercialId),
            'rendimientoComerciales' => $this->getRendimientoComerciales($fechas),
            'embudoConversion' => $this->getEmbudoConversion($fechas, $comercialId),
            'tendenciasMensuales' => $this->getTendenciasMensuales($comercialId),
            'leadsPorEstado' => $this->getLeadsPorEstado($fechas, $comercialId),
            'topMotivosPerdida' => $this->getTopMotivosPerdida($fechas, $comercialId),
            'metricasPresupuestos' => $this->getMetricasPresupuestos($fechas, $comercialId),
            'leadsPorOrigen' => $this->getLeadsPorOrigen($fechas, $comercialId),
            'serviciosMasVendidos' => $this->getServiciosMasVendidos($fechas, $comercialId),
            'accesoriosMasVendidos' => $this->getAccesoriosMasVendidos($fechas, $comercialId),
            'tiposOperacionContratos' => $this->getTiposOperacionContratos($fechas, $comercialId),
        ]);
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
    
    private function getPrefijoIdsByComercial($comercialId)
    {
        if ($comercialId === 'todos') {
            return Comercial::where('activo', true)->pluck('prefijo_id')->filter()->toArray();
        }
        
        $comercial = Comercial::find($comercialId);
        return $comercial && $comercial->prefijo_id ? [$comercial->prefijo_id] : [];
    }
    
    private function getResumenGeneral(array $fechas, $comercialId): array
    {
        $prefijoIds = $this->getPrefijoIdsByComercial($comercialId);
        
        $query = Lead::whereBetween('created', [$fechas['inicio'], $fechas['fin']]);
        if (!empty($prefijoIds)) {
            $query->whereIn('prefijo_id', $prefijoIds);
        }
        
        $totalLeads = $query->count();
        $leadsConvertidos = (clone $query)->where('es_cliente', true)->count();
        
        $leadIds = $query->pluck('id');
        
        $totalPresupuestos = Presupuesto::whereIn('lead_id', $leadIds)
            ->whereBetween('created', [$fechas['inicio'], $fechas['fin']])
            ->count();
        
        $totalContratos = Contrato::whereIn('lead_id', $leadIds)
            ->whereBetween('created', [$fechas['inicio'], $fechas['fin']])
            ->count();
        
        $leadsPerdidos = SeguimientoPerdida::whereIn('lead_id', $leadIds)
            ->whereBetween('created', [$fechas['inicio'], $fechas['fin']])
            ->whereNull('deleted_at')
            ->count();
        
        $valorTotalPresupuestos = Presupuesto::whereIn('lead_id', $leadIds)
            ->whereBetween('created', [$fechas['inicio'], $fechas['fin']])
            ->sum('total_presupuesto');
        
        $tasaConversion = $totalLeads > 0 ? round(($totalContratos / $totalLeads) * 100, 2) : 0;
        $tasaExitoPresupuestos = $totalPresupuestos > 0 ? round(($totalContratos / $totalPresupuestos) * 100, 2) : 0;
        $valorPromedioContrato = $totalContratos > 0 ? round($valorTotalPresupuestos / $totalContratos, 2) : 0;
        
        $leadsActivos = (clone $query)->where('es_activo', true)->where('es_cliente', false)->count();
        
        return [
            'periodo' => $fechas['label'],
            'total_leads' => $totalLeads,
            'leads_convertidos' => $leadsConvertidos,
            'leads_activos' => $leadsActivos,
            'tasa_conversion' => $tasaConversion,
            'total_presupuestos' => $totalPresupuestos,
            'total_contratos' => $totalContratos,
            'tasa_exito_presupuestos' => $tasaExitoPresupuestos,
            'valor_total_presupuestos' => $valorTotalPresupuestos,
            'valor_promedio_contrato' => $valorPromedioContrato,
            'leads_perdidos' => $leadsPerdidos,
        ];
    }
    
    private function getRendimientoComerciales(array $fechas): array
    {
        $comerciales = Comercial::with(['personal', 'prefijo'])
            ->where('activo', true)
            ->get();
        
        $rendimiento = [];
        
        foreach ($comerciales as $comercial) {
            $prefijoId = $comercial->prefijo_id;
            
            if (!$prefijoId) continue;
            
            $leads = Lead::where('prefijo_id', $prefijoId)
                ->whereBetween('created', [$fechas['inicio'], $fechas['fin']]);
            
            $totalLeads = $leads->count();
            
            $presupuestos = Presupuesto::whereIn('lead_id', $leads->pluck('id'))
                ->whereBetween('created', [$fechas['inicio'], $fechas['fin']]);
            
            $totalPresupuestos = $presupuestos->count();
            $valorPresupuestos = $presupuestos->sum('total_presupuesto');
            
            $contratos = Contrato::whereIn('lead_id', $leads->pluck('id'))
                ->whereBetween('created', [$fechas['inicio'], $fechas['fin']]);
            
            $totalContratos = $contratos->count();
            $leadsConvertidos = $leads->where('es_cliente', true)->count();
            
            $tasaConversion = $totalLeads > 0 ? round(($totalContratos / $totalLeads) * 100, 2) : 0;
            $valorPromedio = $totalContratos > 0 ? round($valorPresupuestos / $totalContratos, 2) : 0;
            $efectividadPresupuestos = $totalPresupuestos > 0 ? round(($totalContratos / $totalPresupuestos) * 100, 2) : 0;
            
            $rendimiento[] = [
                'comercial_id' => $comercial->id,
                'nombre' => $comercial->nombre_completo,
                'prefijo_codigo' => $comercial->prefijo?->codigo ?? 'N/A',
                'total_leads' => $totalLeads,
                'total_presupuestos' => $totalPresupuestos,
                'total_contratos' => $totalContratos,
                'leads_convertidos' => $leadsConvertidos,
                'valor_total_presupuestos' => $valorPresupuestos,
                'valor_promedio_contrato' => $valorPromedio,
                'tasa_conversion' => $tasaConversion,
                'efectividad_presupuestos' => $efectividadPresupuestos,
            ];
        }
        
        usort($rendimiento, fn($a, $b) => $b['total_contratos'] <=> $a['total_contratos']);
        
        return $rendimiento;
    }
    
    private function getEmbudoConversion(array $fechas, $comercialId): array
    {
        $prefijoIds = $this->getPrefijoIdsByComercial($comercialId);
        
        $leadsQuery = Lead::whereBetween('created', [$fechas['inicio'], $fechas['fin']]);
        if (!empty($prefijoIds)) {
            $leadsQuery->whereIn('prefijo_id', $prefijoIds);
        }
        
        $leadIds = $leadsQuery->pluck('id');
        $totalLeads = $leadsQuery->count();
        
        $leadsConPresupuesto = Presupuesto::whereIn('lead_id', $leadIds)
            ->distinct('lead_id')
            ->count('lead_id');
        $leadsConContrato = Contrato::whereIn('lead_id', $leadIds)
            ->distinct('lead_id')
            ->count('lead_id');
        $leadsClientes = Lead::whereIn('id', $leadIds)
            ->where('es_cliente', true)
            ->count();
        
        return [
            'etapas' => [
                ['nombre' => 'Leads Generados', 'cantidad' => $totalLeads, 'porcentaje' => 100],
                ['nombre' => 'Con Presupuesto', 'cantidad' => $leadsConPresupuesto, 'porcentaje' => $totalLeads > 0 ? round(($leadsConPresupuesto / $totalLeads) * 100, 2) : 0],
                ['nombre' => 'Con Contrato', 'cantidad' => $leadsConContrato, 'porcentaje' => $totalLeads > 0 ? round(($leadsConContrato / $totalLeads) * 100, 2) : 0],
                ['nombre' => 'Clientes', 'cantidad' => $leadsClientes, 'porcentaje' => $totalLeads > 0 ? round(($leadsClientes / $totalLeads) * 100, 2) : 0],
            ]
        ];
    }
    
    private function getTendenciasMensuales($comercialId): array
    {
        $prefijoIds = $this->getPrefijoIdsByComercial($comercialId);
        $inicio = now()->subMonths(11)->startOfMonth();
        $meses = [];
        
        for ($i = 0; $i < 12; $i++) {
            $mes = $inicio->copy()->addMonths($i);
            $inicioMes = $mes->copy()->startOfMonth();
            $finMes = $mes->copy()->endOfMonth();
            
            $leadsQuery = Lead::whereBetween('created', [$inicioMes, $finMes]);
            if (!empty($prefijoIds)) {
                $leadsQuery->whereIn('prefijo_id', $prefijoIds);
            }
            
            $leads = $leadsQuery->count();
            $leadIds = $leadsQuery->pluck('id');
            
            $presupuestos = Presupuesto::whereIn('lead_id', $leadIds)
                ->whereBetween('created', [$inicioMes, $finMes])
                ->count();
            $contratos = Contrato::whereIn('lead_id', $leadIds)
                ->whereBetween('created', [$inicioMes, $finMes])
                ->count();
            $valorPresupuestos = Presupuesto::whereIn('lead_id', $leadIds)
                ->whereBetween('created', [$inicioMes, $finMes])
                ->sum('total_presupuesto');
            
            $meses[] = [
                'mes' => $mes->format('Y-m'),
                'nombre_mes' => $mes->translatedFormat('M Y'),
                'leads' => $leads,
                'presupuestos' => $presupuestos,
                'contratos' => $contratos,
                'valor_presupuestos' => $valorPresupuestos,
            ];
        }
        
        return $meses;
    }
    
    private function getLeadsPorEstado(array $fechas, $comercialId): array
    {
        $prefijoIds = $this->getPrefijoIdsByComercial($comercialId);
        
        $estados = DB::table('estados_lead')
            ->leftJoin('leads', function($join) use ($fechas, $prefijoIds) {
                $join->on('estados_lead.id', '=', 'leads.estado_lead_id')
                    ->whereBetween('leads.created', [$fechas['inicio'], $fechas['fin']])
                    ->whereNull('leads.deleted_at');
                if (!empty($prefijoIds)) {
                    $join->whereIn('leads.prefijo_id', $prefijoIds);
                }
            })
            ->select(
                'estados_lead.id',
                'estados_lead.nombre',
                'estados_lead.color_hex',
                DB::raw('COUNT(leads.id) as total')
            )
            ->where('estados_lead.activo', true)
            ->groupBy('estados_lead.id', 'estados_lead.nombre', 'estados_lead.color_hex')
            ->orderBy('total', 'desc')
            ->get();
        
        return $estados->toArray();
    }
    
    private function getTopMotivosPerdida(array $fechas, $comercialId): array
    {
        $prefijoIds = $this->getPrefijoIdsByComercial($comercialId);
        
        $leadsQuery = Lead::whereBetween('created', [$fechas['inicio'], $fechas['fin']]);
        if (!empty($prefijoIds)) {
            $leadsQuery->whereIn('prefijo_id', $prefijoIds);
        }
        $leadIds = $leadsQuery->pluck('id');
        
        $motivos = DB::table('motivos_perdida')
            ->leftJoin('seguimientos_perdida', function($join) use ($fechas, $leadIds) {
                $join->on('motivos_perdida.id', '=', 'seguimientos_perdida.motivo_perdida_id')
                    ->whereBetween('seguimientos_perdida.created', [$fechas['inicio'], $fechas['fin']])
                    ->whereNull('seguimientos_perdida.deleted_at');
                if ($leadIds->isNotEmpty()) {
                    $join->whereIn('seguimientos_perdida.lead_id', $leadIds);
                }
            })
            ->select(
                'motivos_perdida.id',
                'motivos_perdida.nombre',
                DB::raw('COUNT(seguimientos_perdida.id) as total')
            )
            ->where('motivos_perdida.es_activo', true)
            ->groupBy('motivos_perdida.id', 'motivos_perdida.nombre')
            ->orderBy('total', 'desc')
            ->limit(5)
            ->get();
        
        return $motivos->toArray();
    }
    
    private function getMetricasPresupuestos(array $fechas, $comercialId): array
    {
        $prefijoIds = $this->getPrefijoIdsByComercial($comercialId);
        
        $leadsQuery = Lead::whereBetween('created', [$fechas['inicio'], $fechas['fin']]);
        if (!empty($prefijoIds)) {
            $leadsQuery->whereIn('prefijo_id', $prefijoIds);
        }
        $leadIds = $leadsQuery->pluck('id');
        
        $presupuestos = Presupuesto::whereIn('lead_id', $leadIds)
            ->whereBetween('created', [$fechas['inicio'], $fechas['fin']]);
        $total = $presupuestos->count();
        
        $conPromocion = $presupuestos->whereNotNull('promocion_id')->count();
        $sinPromocion = $total - $conPromocion;
        
        return [
            'total' => $total,
            'con_promocion' => $conPromocion,
            'sin_promocion' => $sinPromocion,
            'porcentaje_con_promocion' => $total > 0 ? round(($conPromocion / $total) * 100, 2) : 0,
            'valor_promedio_general' => $total > 0 ? round($presupuestos->avg('total_presupuesto'), 2) : 0,
        ];
    }
    
    private function getLeadsPorOrigen(array $fechas, $comercialId): array
    {
        $prefijoIds = $this->getPrefijoIdsByComercial($comercialId);
        
        $origenes = DB::table('origenes_contacto')
            ->leftJoin('leads', function($join) use ($fechas, $prefijoIds) {
                $join->on('origenes_contacto.id', '=', 'leads.origen_id')
                    ->whereBetween('leads.created', [$fechas['inicio'], $fechas['fin']])
                    ->whereNull('leads.deleted_at');
                if (!empty($prefijoIds)) {
                    $join->whereIn('leads.prefijo_id', $prefijoIds);
                }
            })
            ->select(
                'origenes_contacto.id',
                'origenes_contacto.nombre',
                'origenes_contacto.color',
                DB::raw('COUNT(leads.id) as total')
            )
            ->where('origenes_contacto.activo', true)
            ->groupBy('origenes_contacto.id', 'origenes_contacto.nombre', 'origenes_contacto.color')
            ->orderBy('total', 'desc')
            ->get();
        
        $totalLeads = $origenes->sum('total');
        
        return $origenes->map(function($origen) use ($totalLeads) {
            return [
                'nombre' => $origen->nombre,
                'total' => $origen->total,
                'porcentaje' => $totalLeads > 0 ? round(($origen->total / $totalLeads) * 100, 1) : 0,
                'color' => $origen->color ?? '#3b82f6',
            ];
        })->toArray();
    }
    
/**
 * Servicios más vendidos (tipo_id = 3 según tipo_prd_srv)
 */
private function getServiciosMasVendidos(array $fechas, $comercialId): array
{
    $prefijoIds = $this->getPrefijoIdsByComercial($comercialId);
    
    $query = DB::table('presupuestos_agregados')
        ->join('presupuestos', 'presupuestos_agregados.presupuesto_id', '=', 'presupuestos.id')
        ->join('productos_servicios', 'presupuestos_agregados.prd_servicio_id', '=', 'productos_servicios.id')
        ->join('tipo_prd_srv', 'productos_servicios.tipo_id', '=', 'tipo_prd_srv.id')
        ->whereBetween('presupuestos.created', [$fechas['inicio'], $fechas['fin']])
        ->where('tipo_prd_srv.id', 3) // Servicios
        ->whereNull('presupuestos.deleted_at')
        ->whereNull('presupuestos_agregados.deleted_at');
    
    // Aplicar filtro por comercial si existe
    if (!empty($prefijoIds)) {
        $query->whereIn('presupuestos.prefijo_id', $prefijoIds);
    }
    
    $servicios = $query->select(
            'productos_servicios.id',
            'productos_servicios.nombre',
            DB::raw('COUNT(DISTINCT presupuestos_agregados.id) as cantidad'),
            DB::raw('SUM(presupuestos_agregados.subtotal) as total_vendido')
        )
        ->groupBy('productos_servicios.id', 'productos_servicios.nombre')
        ->orderBy('cantidad', 'desc')
        ->limit(10)
        ->get();
    
    return $servicios->map(function($item) {
        return [
            'id' => $item->id,
            'nombre' => $item->nombre,
            'cantidad' => (int) $item->cantidad,
            'total_vendido' => (float) $item->total_vendido,
        ];
    })->toArray();
}

/**
 * Accesorios más vendidos (tipo_id = 5 según tipo_prd_srv)
 */
private function getAccesoriosMasVendidos(array $fechas, $comercialId): array
{
    $prefijoIds = $this->getPrefijoIdsByComercial($comercialId);
    
    $query = DB::table('presupuestos_agregados')
        ->join('presupuestos', 'presupuestos_agregados.presupuesto_id', '=', 'presupuestos.id')
        ->join('productos_servicios', 'presupuestos_agregados.prd_servicio_id', '=', 'productos_servicios.id')
        ->join('tipo_prd_srv', 'productos_servicios.tipo_id', '=', 'tipo_prd_srv.id')
        ->whereBetween('presupuestos.created', [$fechas['inicio'], $fechas['fin']])
        ->where('tipo_prd_srv.id', 5) // Accesorios
        ->whereNull('presupuestos.deleted_at')
        ->whereNull('presupuestos_agregados.deleted_at');
    
    // Aplicar filtro por comercial si existe
    if (!empty($prefijoIds)) {
        $query->whereIn('presupuestos.prefijo_id', $prefijoIds);
    }
    
    $accesorios = $query->select(
            'productos_servicios.id',
            'productos_servicios.nombre',
            DB::raw('COUNT(DISTINCT presupuestos_agregados.id) as cantidad'),
            DB::raw('SUM(presupuestos_agregados.subtotal) as total_vendido')
        )
        ->groupBy('productos_servicios.id', 'productos_servicios.nombre')
        ->orderBy('cantidad', 'desc')
        ->limit(10)
        ->get();
    
    return $accesorios->map(function($item) {
        return [
            'id' => $item->id,
            'nombre' => $item->nombre,
            'cantidad' => (int) $item->cantidad,
            'total_vendido' => (float) $item->total_vendido,
        ];
    })->toArray();
}
    
    private function getTiposOperacionContratos(array $fechas, $comercialId): array
    {
        $prefijoIds = $this->getPrefijoIdsByComercial($comercialId);
        
        $leadsQuery = Lead::whereBetween('created', [$fechas['inicio'], $fechas['fin']]);
        if (!empty($prefijoIds)) {
            $leadsQuery->whereIn('prefijo_id', $prefijoIds);
        }
        $leadIds = $leadsQuery->pluck('id');
        
        $tipos = DB::table('contratos')
            ->whereIn('lead_id', $leadIds)
            ->whereBetween('created', [$fechas['inicio'], $fechas['fin']])
            ->whereNull('deleted_at')
            ->select(
                'tipo_operacion',
                DB::raw('COUNT(*) as total')
            )
            ->groupBy('tipo_operacion')
            ->orderBy('total', 'desc')
            ->get();
        
        $totalContratos = $tipos->sum('total');
        
        $nombresTipos = [
            'venta_cliente' => 'Venta a Cliente',
            'alta_nueva' => 'Alta Nueva',
            'cambio_titularidad' => 'Cambio de Titularidad',
            'cambio_razon_social' => 'Cambio de Razón Social',
            'cambio_smartsat' => 'Cambio SmartSAT',
        ];
        
        $colores = [
            'venta_cliente' => '#3b82f6',
            'alta_nueva' => '#10b981',
            'cambio_titularidad' => '#f97316',
            'cambio_razon_social' => '#eab308',
            'cambio_smartsat' => '#a855f7',
        ];
        
        return $tipos->map(function($tipo) use ($totalContratos, $nombresTipos, $colores) {
            return [
                'tipo' => $tipo->tipo_operacion,
                'nombre' => $nombresTipos[$tipo->tipo_operacion] ?? $tipo->tipo_operacion,
                'total' => $tipo->total,
                'porcentaje' => $totalContratos > 0 ? round(($tipo->total / $totalContratos) * 100, 1) : 0,
                'color' => $colores[$tipo->tipo_operacion] ?? '#6b7280',
            ];
        })->toArray();
    }
}