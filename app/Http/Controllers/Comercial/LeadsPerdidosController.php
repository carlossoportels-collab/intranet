<?php
// app/Http/Controllers/Comercial/LeadsPerdidosController.php

namespace App\Http\Controllers\Comercial;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\MotivoPerdida;
use App\Models\TipoComentario;
use App\Models\EstadoLead;
use App\Services\LeadPerdido\LeadPerdidoQueryService;
use App\Services\LeadPerdido\LeadPerdidoStatsService;
use App\Services\LeadPerdido\LeadPerdidoSeguimientoService;
use App\Http\Requests\ProcesarSeguimientoRequest;
use App\DTOs\SeguimientoPerdidoData;
use App\Traits\Authorizable; // 🔥 IMPORTAR TRAIT
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class LeadsPerdidosController extends Controller
{
    use Authorizable; // 🔥 AGREGAR TRAIT

    public function __construct(
        protected LeadPerdidoQueryService $queryService,
        protected LeadPerdidoStatsService $statsService,
        protected LeadPerdidoSeguimientoService $seguimientoService
    ) {
        $this->initializeAuthorization(); // 🔥 INICIALIZAR
    }

    /**
     * Vista principal de leads perdidos/recontactados
     */
    public function index(Request $request)
    {
        // 🔥 VERIFICAR PERMISO
        $this->authorizePermiso(config('permisos.VER_LEADS_PERDIDOS'));
        
        $usuario = auth()->user();
        
        $leads = $this->queryService->getLeadsPerdidosPaginated($request, $usuario);
        $motivos = MotivoPerdida::where('es_activo', 1)->orderBy('nombre')->get(['id', 'nombre']);
        $estadisticas = $this->statsService->getEstadisticas($usuario);

        return Inertia::render('Comercial/LeadsPerdidos', [
            'leads' => $leads,
            'motivos' => $motivos,
            'estadisticas' => $estadisticas,
            'filtros' => $request->only([
                'search', 'estado', 'motivo_id', 'fecha_rechazo_desde',
                'fecha_rechazo_hasta', 'posibilidades_futuras', 'con_recontacto'
            ]),
        ]);
    }

    /**
     * Mostrar detalles de un lead perdido/recontactado
     */
    public function show($id)
    {
        $seguimiento = $this->queryService->getSeguimientoWithLead($id);
        $lead = $seguimiento->lead;
        
        // Verificar permisos
        $this->seguimientoService->verificarPermisos($lead);

        $comentarioRechazo = $lead->comentarios->first(fn($c) => 
            $c->tipoComentario?->nombre === 'Rechazo lead'
        );

        $comentariosSeguimiento = $lead->comentarios->filter(fn($c) => 
            $c->tipoComentario?->aplica_a === 'recontacto'
        );

        $notificacion = DB::table('notificaciones')
            ->where('entidad_tipo', 'seguimiento_perdida')
            ->where('entidad_id', $seguimiento->id)
            ->whereNull('deleted_at')
            ->first();

        $historicoEstados = $this->getHistoricoEstados($lead->id);
        $tiempoDesdeRechazo = $this->calcularTiempoDesdeRechazo($seguimiento->created);

        return Inertia::render('Comercial/LeadsPerdidos/Show', [
            'lead' => $lead,
            'seguimiento' => $seguimiento,
            'comentarioRechazo' => $comentarioRechazo,
            'comentariosSeguimiento' => $comentariosSeguimiento,
            'notificacion' => $notificacion,
            'historicoEstados' => $historicoEstados,
            'tiempoDesdeRechazo' => $tiempoDesdeRechazo,
        ]);
    }

    /**
     * Mostrar modal para nuevo seguimiento
     */
    public function modalSeguimiento($id)
    {
        $lead = Lead::findOrFail($id);
        
        // 🔥 VERIFICAR ACCESO AL LEAD
        $this->authorizeLeadAccess($lead, config('permisos.GESTIONAR_LEADS_PERDIDOS'));
        
        $seguimiento = $lead->seguimientoPerdida()
            ->whereNull('deleted_at')
            ->firstOrFail();

        $tiposComentarioSeguimiento = TipoComentario::where('es_activo', 1)
            ->where('aplica_a', 'recontacto')
            ->orderBy('nombre')
            ->get();

        $estadosLead = EstadoLead::where('activo', 1)
            ->whereIn('tipo', ['recontacto', 'contactado', 'calificado', 'negociacion', 'propuesta'])
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
        
        // 🔥 VERIFICAR ACCESO AL LEAD Y PERMISO
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
     * Métodos auxiliares privados
     */
    private function getHistoricoEstados(int $leadId)
    {
        return DB::table('auditoria_log')
            ->where('tabla_afectada', 'leads')
            ->where('registro_id', $leadId)
            ->where('accion', 'UPDATE')
            ->orderBy('created', 'desc')
            ->get()
            ->map(function($log) {
                try {
                    $log->valores_nuevos = json_decode($log->valores_nuevos, true);
                    $log->valores_anteriores = json_decode($log->valores_anteriores, true);
                } catch (\Exception $e) {
                    $log->valores_nuevos = [];
                    $log->valores_anteriores = [];
                }
                return $log;
            });
    }

    private function calcularTiempoDesdeRechazo($fechaRechazo): ?array
    {
        if (!$fechaRechazo) {
            return null;
        }

        $fechaRechazo = \Carbon\Carbon::parse($fechaRechazo);
        
        return [
            'dias' => $fechaRechazo->diffInDays(now()),
            'meses' => $fechaRechazo->diffInMonths(now()),
            'texto' => $fechaRechazo->diffForHumans(),
        ];
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
                'error' => config('app.debug') ? $message : null
            ], 500);
        }

        return redirect()->back()
            ->withErrors(['error' => $message])
            ->withInput();
    }
}