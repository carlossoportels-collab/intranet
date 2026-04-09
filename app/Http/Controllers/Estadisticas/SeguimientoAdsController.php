<?php
// app/Http/Controllers/Estadisticas/SeguimientoAdsController.php

namespace App\Http\Controllers\Estadisticas;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Presupuesto;
use App\Models\Contrato;
use App\Models\NotaLead;
use App\Models\SeguimientoPerdida;
use App\Models\Comentario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class SeguimientoAdsController extends Controller
{
    /**
     * Constructor - solo para usuario ID 7
     */
      public function __construct()
    {
        $this->middleware(function ($request, $next) {
            $allowedUsers = [2, 5, 7]; // Usuarios permitidos
            if (!in_array(auth()->id(), $allowedUsers)) {
                abort(403, 'No tienes acceso a esta sección');
            }
            return $next($request);
        });
    }

    /**
     * Vista principal de seguimiento de leads creados por el usuario
     */
    public function index(Request $request)
    {
        $usuarioId = 7;
        $periodo = $request->get('periodo', 'mes_actual');
        $estadoFilter = $request->get('estado', 'todos');
        $fechas = $this->calcularRangoFechas($periodo);
        
        // Query base de leads creados por el usuario 7
        $leadsQuery = Lead::where('created_by', $usuarioId)
            ->whereBetween('created', [$fechas['inicio'], $fechas['fin']])
            ->with([
                'estadoLead', 
                'prefijo.comercial.personal', 
                'origen',
                'localidad.provincia'  // ← IMPORTANTE: Cargar la provincia
            ]);
        
        // Aplicar filtro por estado
        if ($estadoFilter !== 'todos') {
            switch($estadoFilter) {
                case 'activos':
                    $leadsQuery->where('es_activo', true)->where('es_cliente', false);
                    break;
                case 'clientes':
                    $leadsQuery->where('es_cliente', true);
                    break;
                case 'inactivos':
                    $leadsQuery->where('es_activo', false);
                    break;
                default:
                    if (is_numeric($estadoFilter)) {
                        $leadsQuery->where('estado_lead_id', $estadoFilter);
                    }
                    break;
            }
        }
        
        $leads = $leadsQuery->orderBy('created', 'desc')->get();
        
        $totalLeads = $leads->count();
        
        // Estadísticas resumidas
        $leadsConvertidos = $leads->where('es_cliente', true)->count();
        $leadsActivos = $leads->where('es_activo', true)->where('es_cliente', false)->count();
        $leadsInactivos = $leads->where('es_activo', false)->count();
        
        // IDs de leads
        $leadIds = $leads->pluck('id');
        
        // Presupuestos generados
        $presupuestos = Presupuesto::whereIn('lead_id', $leadIds)
            ->whereBetween('created', [$fechas['inicio'], $fechas['fin']]);
        
        $totalPresupuestos = $presupuestos->count();
        $valorPresupuestos = $presupuestos->sum('total_presupuesto');
        
        // Contratos generados
        $contratos = Contrato::whereIn('lead_id', $leadIds)
            ->whereBetween('created', [$fechas['inicio'], $fechas['fin']]);
        
        $totalContratos = $contratos->count();
        
        // Notas creadas
        $notas = NotaLead::whereIn('lead_id', $leadIds)
            ->whereBetween('created', [$fechas['inicio'], $fechas['fin']])
            ->count();
        
        // Leads perdidos
        $leadsPerdidos = SeguimientoPerdida::whereIn('lead_id', $leadIds)
            ->whereBetween('created', [$fechas['inicio'], $fechas['fin']])
            ->whereNull('deleted_at')
            ->count();
        
        // Obtener todos los estados disponibles para el filtro
        $estadosDisponibles = DB::table('estados_lead')
            ->where('activo', true)
            ->orderBy('nombre')
            ->get();
        
        // Distribución por estado (para gráfico)
        $distribucionEstados = $leads->groupBy('estado_lead_id')
            ->map(function($group) {
                $estado = $group->first()->estadoLead;
                return [
                    'nombre' => $estado?->nombre ?? 'Sin estado',
                    'color' => $estado?->color_hex ?? '#CBD5E1',
                    'total' => $group->count(),
                ];
            })
            ->values();
        
        // Distribución por prefijo (comercial asignado)
        $distribucionPrefijos = $leads->groupBy('prefijo_id')
            ->map(function($group) {
                $lead = $group->first();
                $prefijo = $lead->prefijo;
                $comercial = $prefijo?->comercial;
                $personal = $comercial?->personal;
                
                return [
                    'codigo' => $prefijo?->codigo ?? 'Sin asignar',
                    'comercial_nombre' => $personal?->nombre_completo ?? 'Sin comercial asignado',
                    'total' => $group->count(),
                ];
            })
            ->values()
            ->sortByDesc('total')
            ->values();
        
        // Conversión por mes (últimos 6 meses)
        $conversionMensual = $this->getConversionMensual($usuarioId);
        
        // Tasa de conversión
        $tasaConversion = $totalLeads > 0 ? round(($totalContratos / $totalLeads) * 100, 2) : 0;
        
        return Inertia::render('Estadisticas/SeguimientoAds/Index', [
            'periodo' => $periodo,
            'estadoFilter' => $estadoFilter,
            'estadosDisponibles' => $estadosDisponibles,
            'resumen' => [
                'total_leads' => $totalLeads,
                'leads_activos' => $leadsActivos,
                'leads_convertidos' => $leadsConvertidos,
                'leads_inactivos' => $leadsInactivos,
                'leads_perdidos' => $leadsPerdidos,
                'total_presupuestos' => $totalPresupuestos,
                'total_contratos' => $totalContratos,
                'valor_presupuestos' => $valorPresupuestos,
                'tasa_conversion' => $tasaConversion,
                'total_notas' => $notas,
            ],
            'distribucionEstados' => $distribucionEstados,
            'distribucionPrefijos' => $distribucionPrefijos,
            'conversionMensual' => $conversionMensual,
            'leads' => $leads->map(function($lead) {
                $prefijo = $lead->prefijo;
                $comercial = $prefijo?->comercial;
                $personal = $comercial?->personal;
                
                // CORREGIDO: Obtener localidad correctamente
                $localidad = $lead->localidad;
                $provincia = $localidad?->provincia;
                $localidadNombre = $localidad?->nombre ?? '';
                $provinciaNombre = $provincia?->nombre ?? '';
                $localidadCompleta = $localidadNombre ? ($provinciaNombre ? "{$localidadNombre}, {$provinciaNombre}" : $localidadNombre) : '';
                
                return [
                    'id' => $lead->id,
                    'nombre' => $lead->nombre_completo,
                    'telefono' => $lead->telefono,
                    'email' => $lead->email,
                    'estado_id' => $lead->estado_lead_id,
                    'estado' => $lead->estadoLead?->nombre ?? 'Sin estado',
                    'estado_color' => $lead->estadoLead?->color_hex ?? '#CBD5E1',
                    'prefijo_codigo' => $prefijo?->codigo ?? 'Sin asignar',
                    'comercial_nombre' => $personal?->nombre_completo ?? 'Sin comercial',
                    'origen' => $lead->origen?->nombre ?? 'No especificado',
                    'es_cliente' => $lead->es_cliente,
                    'es_activo' => $lead->es_activo,
                    'created' => $lead->created,
                    'created_formateado' => $lead->created->format('d/m/Y H:i'),
                    'localidad' => $localidadCompleta,
                ];
            }),
        ]);
    }
    
    /**
     * Detalle de un lead específico
     */
    public function showLead($id)
    {
        $usuarioId = 7;
        
        $lead = Lead::where('created_by', $usuarioId)
            ->with([
                'estadoLead', 
                'prefijo.comercial.personal', 
                'origen', 
                'localidad.provincia'  // ← IMPORTANTE: Cargar la provincia
            ])
            ->findOrFail($id);
        
        // CORREGIDO: Obtener localidad correctamente
        $localidad = $lead->localidad;
        $provincia = $localidad?->provincia;
        $localidadNombre = $localidad?->nombre ?? '';
        $provinciaNombre = $provincia?->nombre ?? '';
        $localidadCompleta = $localidadNombre ? ($provinciaNombre ? "{$localidadNombre}, {$provinciaNombre}" : $localidadNombre) : '';
        
        // Presupuestos del lead
        $presupuestos = Presupuesto::where('lead_id', $lead->id)
            ->with(['estado', 'creadoPor.personal'])
            ->orderBy('created', 'desc')
            ->get();
        
        // Contratos del lead
        $contratos = Contrato::where('lead_id', $lead->id)
            ->with(['estado', 'creadoPor.personal'])
            ->orderBy('created', 'desc')
            ->get();
        
        // Comentarios
        $comentarios = Comentario::where('lead_id', $lead->id)
            ->with(['usuario.personal', 'tipoComentario'])
            ->orderBy('created', 'desc')
            ->get();
        
        // Seguimiento de pérdida
        $seguimientoPerdida = SeguimientoPerdida::where('lead_id', $lead->id)
            ->with(['motivo'])
            ->first();
        
        // Obtener el comercial asignado correctamente
        $prefijo = $lead->prefijo;
        $comercial = $prefijo?->comercial;
        $personalComercial = $comercial?->personal;
        
        return Inertia::render('Estadisticas/SeguimientoAds/LeadDetail', [
            'lead' => [
                'id' => $lead->id,
                'nombre' => $lead->nombre_completo,
                'genero' => $lead->genero,
                'telefono' => $lead->telefono,
                'email' => $lead->email,
                'localidad' => $localidadCompleta,
                'rubro' => $lead->rubro?->nombre,
                'origen' => $lead->origen?->nombre,
                'estado' => $lead->estadoLead?->nombre,
                'estado_color' => $lead->estadoLead?->color_hex,
                'prefijo_codigo' => $prefijo?->codigo ?? 'Sin asignar',
                'prefijo_descripcion' => $prefijo?->descripcion ?? '',
                'comercial_nombre' => $personalComercial?->nombre_completo ?? 'Sin comercial asignado',
                'es_cliente' => $lead->es_cliente,
                'es_activo' => $lead->es_activo,
                'created' => $lead->created->format('d/m/Y H:i'),
                'created_by' => $lead->usuarioCreacion?->nombre_completo,
            ],
            'presupuestos' => $presupuestos->map(function($p) {
                return [
                    'id' => $p->id,
                    'referencia' => $p->referencia,
                    'total' => $p->total_presupuesto,
                    'estado' => $p->estado?->nombre,
                    'created' => $p->created->format('d/m/Y'),
                    'creado_por' => $p->creadoPor?->nombre_completo,
                ];
            })->toArray(),
            'contratos' => $contratos->map(function($c) {
                return [
                    'id' => $c->id,
                    'numero' => $c->numero_contrato,
                    'fecha_emision' => $c->fecha_emision?->format('d/m/Y'),
                    'estado' => $c->estado?->nombre,
                ];
            })->toArray(),
            'comentarios' => $comentarios->map(function($c) {
                return [
                    'id' => $c->id,
                    'contenido' => $c->comentario,
                    'tipo' => $c->tipoComentario?->nombre,
                    'created' => $c->created->format('d/m/Y H:i'),
                    'usuario' => $c->usuario?->nombre_completo,
                ];
            })->toArray(),
            'seguimiento_perdida' => $seguimientoPerdida ? [
                'motivo' => $seguimientoPerdida->motivo?->nombre,
                'notas' => $seguimientoPerdida->notas_adicionales,
                'posibilidades' => $seguimientoPerdida->posibilidades_futuras,
                'fecha_recontacto' => $seguimientoPerdida->fecha_posible_recontacto?->format('d/m/Y'),
                'created' => $seguimientoPerdida->created->format('d/m/Y'),
            ] : null,
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
    
    private function getConversionMensual(int $usuarioId): array
    {
        $inicio = now()->subMonths(5)->startOfMonth();
        $meses = [];
        
        for ($i = 0; $i < 6; $i++) {
            $mes = $inicio->copy()->addMonths($i);
            $inicioMes = $mes->copy()->startOfMonth();
            $finMes = $mes->copy()->endOfMonth();
            
            $leads = Lead::where('created_by', $usuarioId)
                ->whereBetween('created', [$inicioMes, $finMes])
                ->count();
            
            $contratos = Contrato::whereHas('lead', function($q) use ($usuarioId) {
                    $q->where('created_by', $usuarioId);
                })
                ->whereBetween('created', [$inicioMes, $finMes])
                ->count();
            
            $tasa = $leads > 0 ? round(($contratos / $leads) * 100, 2) : 0;
            
            $meses[] = [
                'mes' => $mes->format('Y-m'),
                'nombre_mes' => $mes->translatedFormat('M Y'),
                'leads' => $leads,
                'contratos' => $contratos,
                'tasa_conversion' => $tasa,
            ];
        }
        
        return $meses;
    }
}