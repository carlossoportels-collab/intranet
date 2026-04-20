<?php
// app/Http/Controllers/Comercial/LeadsPerdidosController.php

namespace App\Http\Controllers\Comercial;

use App\Http\Controllers\Controller;
use App\Services\LeadPerdido\LeadPerdidoFilterService;
use App\Services\LeadPerdido\LeadPerdidoStatsService;
use App\Services\LeadPerdido\LeadPerdidoSeguimientoService;
use App\Models\Lead;
use App\Models\MotivoPerdida;
use App\Models\TipoComentario;
use App\Models\EstadoLead;
use App\Http\Requests\ProcesarSeguimientoRequest;
use App\DTOs\SeguimientoPerdidoData;
use App\Traits\Authorizable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class LeadsPerdidosController extends Controller
{
    use Authorizable;

    public function __construct(
        protected LeadPerdidoFilterService $filterService,
        protected LeadPerdidoStatsService $statsService,
        protected LeadPerdidoSeguimientoService $seguimientoService
    ) {
        $this->initializeAuthorization();
    }

    /**
     * Vista principal de leads perdidos/recontactados
     */
public function index(Request $request)
{
    $this->authorizePermiso(config('permisos.VER_LEADS_PERDIDOS'));
    
    $usuario = auth()->user();
    
    // Obtener filtros
    $filters = $request->only(['search', 'localidad', 'estado', 'motivo_id', 'posibilidades_futuras', 'con_recontacto', 'prefijo_id']);
    
    // Construir query base
    $query = $this->filterService->getQueryBase();
    
    // Obtener prefijos para filtro de comerciales
    $prefijosFiltro = $this->filterService->getPrefijosFiltro($usuario);
    $prefijoUsuario = $this->filterService->getPrefijoUsuarioComercial($usuario);
    
    // Aplicar filtro de prefijo si viene en request
    if ($request->has('prefijo_id') && $request->prefijo_id) {
        $this->filterService->aplicarFiltros($query, ['prefijo_id' => $request->prefijo_id]);
    } elseif ($prefijoUsuario && $usuario->rol_id == 5) {
        $query->where('prefijo_id', $prefijoUsuario['id']);
    }
    
    // Aplicar filtros de permisos
    $this->applyPrefijoFilter($query, $usuario);
    
    // Aplicar el resto de los filtros
    $this->filterService->aplicarFiltros($query, $filters);
    
    // Obtener leads paginados
    $leads = $query->orderBy('created', 'desc')
        ->paginate(15)
        ->withQueryString();
    
    // Transformar leads
    $leadsTransformados = $this->transformLeads($leads);
    
    // 🔥 Obtener estadísticas CON los filtros aplicados
    $estadisticas = $this->statsService->getEstadisticas($usuario, $filters);
    
    // Obtener datos para filtros
    $datosFiltros = $this->filterService->getDatosFiltros();
    
    // Obtener datos del usuario
    $usuarioData = $this->getUsuarioData($usuario);
    // Obtener IDs de leads
    $leadIds = $leads->pluck('id')->toArray();

    // Obtener conteos de comentarios y presupuestos
    $comentariosPorLead = $this->filterService->getConteoComentarios($leadIds);
    $presupuestosPorLead = $this->filterService->getConteoPresupuestos($leadIds);

    return Inertia::render('Comercial/LeadsPerdidos', [
        'leads' => $leadsTransformados,
        'estadisticas' => $estadisticas,
        'filtros' => $filters,
        'usuario' => $usuarioData,
        'comentariosPorLead' => $comentariosPorLead,
        'presupuestosPorLead' => $presupuestosPorLead,
        'prefijosFiltro' => $prefijosFiltro,
        'prefijoUsuario' => $prefijoUsuario,
        ...$datosFiltros,
    ]);
}
    /**
     * Transformar leads al formato de la vista
     */
private function transformLeads($leads)
{
    $leadsData = $leads->getCollection()->map(function($lead) {
        $seguimiento = $lead->seguimientoPerdida;
        
        if (!$seguimiento) {
            return null;
        }

        return [
            'id' => $lead->id,
            'nombre_completo' => $lead->nombre_completo,
            'email' => $lead->email,
            'telefono' => $lead->telefono,
            'estado_lead' => $lead->estadoLead ? [
                'id' => $lead->estadoLead->id,
                'nombre' => $lead->estadoLead->nombre,
                'tipo' => $lead->estadoLead->tipo,
                'color_hex' => $lead->estadoLead->color_hex,
            ] : null,
            'seguimientoPerdida' => [
                'id' => $seguimiento->id,
                'motivo' => $seguimiento->motivo ? [
                    'id' => $seguimiento->motivo->id,
                    'nombre' => $seguimiento->motivo->nombre,
                ] : null,
                'posibilidades_futuras' => $seguimiento->posibilidades_futuras ?? 'no',
                'fecha_posible_recontacto' => $seguimiento->fecha_posible_recontacto,
                'created' => $seguimiento->created ?? $lead->created,
            ],
            'created' => $lead->created,
            'origen' => $lead->origen ? [
                'id' => $lead->origen->id,
                'nombre' => $lead->origen->nombre,
            ] : null,
            'localidad' => $lead->localidad ? [
                'id' => $lead->localidad->id,
                'nombre' => $lead->localidad->nombre,
                'provincia' => $lead->localidad->provincia ? [
                    'id' => $lead->localidad->provincia->id,
                    'nombre' => $lead->localidad->provincia->nombre,
                ] : null,
            ] : null,
            'comercial' => $lead->comercial?->personal ? [
                'personal' => [
                    'nombre' => $lead->comercial->personal->nombre ?? '',
                    'apellido' => $lead->comercial->personal->apellido ?? '',
                ]
            ] : null,
        ];
    })->filter();

    return new \Illuminate\Pagination\LengthAwarePaginator(
        $leadsData,
        $leads->total(),
        $leads->perPage(),
        $leads->currentPage(),
        ['path' => $leads->path()]
    );
}

    /**
     * Mostrar modal para nuevo seguimiento
     */
    public function modalSeguimiento($id)
    {
        $lead = Lead::findOrFail($id);
        
        $this->authorizeLeadAccess($lead, config('permisos.GESTIONAR_LEADS_PERDIDOS'));
        
        $seguimiento = $lead->seguimientoPerdida()
            ->whereNull('deleted_at')
            ->firstOrFail();

        $tiposComentarioSeguimiento = TipoComentario::where('es_activo', 1)
            ->where('aplica_a', 'recontacto')
            ->orderBy('nombre')
            ->get();

        $estadosLead = EstadoLead::where('activo', 1)
            ->whereIn('tipo', ['recontacto', 'contactado', 'seguimiento', 'negociacion', 'propuesta'])
            ->orWhere('nombre', 'Perdido')
            ->get();

        return response()->json([
            'lead' => [
                'id' => $lead->id,
                'nombre_completo' => $lead->nombre_completo,
                'email' => $lead->email,
                'telefono' => $lead->telefono,
                'estado_lead_id' => $lead->estado_lead_id,
                'estado_actual_nombre' => $lead->estadoLead?->nombre ?? 'Perdido',
            ],
            'seguimiento' => [
                'motivo_nombre' => $seguimiento->motivo?->nombre ?? 'Desconocido',
                'posibilidades_futuras' => $seguimiento->posibilidades_futuras,
                'fecha_posible_recontacto' => $seguimiento->fecha_posible_recontacto,
                'created' => $seguimiento->created,
            ],
            'tiposComentarioSeguimiento' => $tiposComentarioSeguimiento,
            'estadosLead' => $estadosLead,
        ]);
    }

    /**
     * Procesar nuevo seguimiento
     */
    public function procesarSeguimiento(ProcesarSeguimientoRequest $request, $id)
    {
        $lead = Lead::findOrFail($id);
        
        $this->authorizeLeadAccess($lead, config('permisos.GESTIONAR_LEADS_PERDIDOS'));
        
        $data = SeguimientoPerdidoData::fromRequest(
            $request->validated(),
            $id,
            auth()->id()
        );

        $result = $this->seguimientoService->procesarSeguimiento($data);

        if (!$result['success']) {
            return $this->handleErrorResponse($request, $result['message']);
        }

        return $this->handleSuccessResponse($request, $result['message']);
    }

    /**
     * Obtener datos del usuario
     */
    private function getUsuarioData($usuario): array
    {
        $usuario->load('personal');
        
        $prefijosAsignados = [];
        $cantidadPrefijos = 0;
        
        if (!$usuario->ve_todas_cuentas) {
            $prefijosAsignados = $this->getPrefijosPermitidos($usuario->id) ?? [];
            $cantidadPrefijos = count($prefijosAsignados);
        }
        
        $data = [
            've_todas_cuentas' => (bool) $usuario->ve_todas_cuentas,
            'rol_id' => $usuario->rol_id,
            'personal_id' => $usuario->personal_id,
            'prefijos_asignados' => $prefijosAsignados,
            'cantidad_prefijos' => $cantidadPrefijos,
            'nombre_completo' => $usuario->personal 
                ? $usuario->personal->nombre . ' ' . $usuario->personal->apellido
                : $usuario->nombre_usuario,
        ];
        
        // Si es comercial
        if ($usuario->rol_id == 5) {
            $comercialUsuario = DB::table('comercial')
                ->where('personal_id', $usuario->personal_id)
                ->where('activo', 1)
                ->first();
                
            if ($comercialUsuario) {
                $data['comercial'] = [
                    'es_comercial' => true,
                    'prefijo_id' => $comercialUsuario->prefijo_id,
                ];
            }
        }
        
        return $data;
    }

    private function handleSuccessResponse(Request $request, string $message)
    {
        if ($request->header('X-Inertia')) {
            return redirect()->back()
                ->with('success', $message)
                ->with('toast_type', 'success');
        }

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => true,
                'message' => $message
            ]);
        }

        return redirect()->back()->with('success', $message);
    }

    private function handleErrorResponse(Request $request, string $message)
    {
        if ($request->header('X-Inertia')) {
            return redirect()->back()
                ->withErrors(['error' => $message])
                ->with('toast_type', 'error')
                ->withInput();
        }

        if ($request->wantsJson() || $request->ajax()) {
            return response()->json([
                'success' => false,
                'message' => $message,
            ], 500);
        }

        return redirect()->back()
            ->withErrors(['error' => $message])
            ->withInput();
    }
}