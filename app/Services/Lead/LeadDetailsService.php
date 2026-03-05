<?php
// app/Services/Lead/LeadDetailsService.php

namespace App\Services\Lead;

use App\Models\Lead;
use App\Models\EstadoLead;
use App\Models\OrigenContacto;
use App\Models\Localidad;
use App\Models\Provincia;
use App\Models\Rubro;
use App\Models\Prefijo;
use App\Models\Comercial;
use App\Models\NotaLead;
use App\Models\Comentario;
use App\Models\ComentarioLegacy;
use App\Models\Notificacion;
use App\Models\AuditoriaLog;
use App\Models\TipoComentario;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Collection;
use Carbon\Carbon;

class LeadDetailsService
{
    private LeadStateTransitionService $stateTransitionService;
    private LeadPresupuestoService $presupuestoService;
    private LeadContratoService $contratoService; // ← NUEVO

    public function __construct(
        LeadStateTransitionService $stateTransitionService,
        LeadPresupuestoService $presupuestoService,
        LeadContratoService $contratoService // ← NUEVO
    ) {
        $this->stateTransitionService = $stateTransitionService;
        $this->presupuestoService = $presupuestoService;
        $this->contratoService = $contratoService; // ← NUEVO
    }

    public function getLeadWithDetails(int $id): ?Lead
    {
        $lead = Lead::with([
            'estadoLead',
            'origen',
            'localidad.provincia',
            'rubro',
            'prefijo',
            'comercial.personal.usuario'
        ])->find($id);

        if (!$lead) {
            return null;
        }

        // Asegurar que los IDs estén disponibles como propiedades
        $lead->estado_lead_id = $lead->estado_lead_id ?? $lead->estadoLead?->id;
        $lead->origen_id = $lead->origen_id ?? $lead->origen?->id;
        $lead->rubro_id = $lead->rubro_id ?? $lead->rubro?->id;
        $lead->localidad_id = $lead->localidad_id ?? $lead->localidad?->id;
        $lead->prefijo_id = $lead->prefijo_id ?? $lead->prefijo?->id;
        
        return $lead;
    }

    public function getFormData(): array
    {
        return [
            'origenes' => OrigenContacto::where('activo', 1)->get(),
            'rubros' => Rubro::where('activo', 1)->get(),
            'provincias' => Provincia::orderBy('provincia')->get(),
            'comerciales' => Comercial::with('personal')
                ->where('activo', 1)
                ->get()
                ->map(function($comercial) {
                    return [
                        'id' => $comercial->id,
                        'prefijo_id' => $comercial->prefijo_id,
                        'nombre' => $comercial->personal->nombre_completo ?? 'Sin nombre',
                        'email' => $comercial->personal->email ?? '',
                    ];
                }),
            'estadosLead' => EstadoLead::where('activo', 1)->get(),
            'tiposComentario' => TipoComentario::where('es_activo', 1)->get(),
        ];
    }

    public function getLeadDashboardData(int $leadId, int $usuarioId): array
    {
        $lead = $this->getLeadWithDetails($leadId);
        
        if (!$lead) {
            return [];
        }

        $comercialAsignado = $this->getAssignedComercial($lead->prefijo_id);
        $lead->asignado_nombre = $comercialAsignado ? $comercialAsignado->personal->nombre_completo : 'Sin asignar';
        $lead->prefijo_codigo = $lead->prefijo?->codigo;
        
        $notas = $this->getLeadNotes($leadId);
        $comentarios = $this->getLeadComments($leadId);
        $notificaciones = $this->getLeadNotifications($leadId, $usuarioId);
        $tiemposEstados = $this->getStateTransitionTimes($leadId);
        
        // Obtener presupuestos unificados
        $presupuestosUnificados = $this->presupuestoService->getPresupuestosUnificados($lead);
        $estadisticasPresupuestos = $this->presupuestoService->getEstadisticas($lead);
        
        // Obtener contratos unificados ← NUEVO
        $contratosUnificados = $this->contratoService->getContratosUnificados($lead);
        $estadisticasContratos = $this->contratoService->getEstadisticas($lead);

        return [
            'lead' => $lead,
            'comercial_asignado' => $comercialAsignado,
            'asignado_nombre' => $comercialAsignado ? $comercialAsignado->personal->nombre_completo : 'Sin asignar',
            'notas' => $notas,
            'comentarios' => $comentarios,
            'notificaciones' => $notificaciones,
            'tiempos_estados' => $tiemposEstados,
            'presupuestos_nuevos' => $presupuestosUnificados['nuevos'],
            'presupuestos_legacy' => $presupuestosUnificados['legacy'],
            'contratos_nuevos' => $contratosUnificados['nuevos'], // ← NUEVO
            'contratos_legacy' => $contratosUnificados['legacy'], // ← NUEVO
            'estadisticas' => [
                'total_notas' => $notas->count(),
                'total_comentarios' => $comentarios->count(),
                'total_notificaciones' => $notificaciones->count(),
                'notificaciones_no_leidas' => $notificaciones->where('leida', false)->count(),
                // Estadísticas de presupuestos
                'total_presupuestos' => $estadisticasPresupuestos['total_presupuestos'],
                'total_presupuestos_nuevos' => $estadisticasPresupuestos['total_nuevos'],
                'total_presupuestos_legacy' => $estadisticasPresupuestos['total_legacy'],
                'total_presupuestos_con_pdf' => $estadisticasPresupuestos['total_con_pdf'],
                'total_importe_presupuestos' => $estadisticasPresupuestos['total_importe_formateado'],
                // Estadísticas de contratos ← NUEVO
                'total_contratos' => $estadisticasContratos['total_contratos'],
                'total_contratos_nuevos' => $estadisticasContratos['total_nuevos'],
                'total_contratos_legacy' => $estadisticasContratos['total_legacy'],
                'total_contratos_con_pdf' => $estadisticasContratos['total_con_pdf'],
            ]
        ];
    }

    public function getAssignedComercial(?int $prefijoId): ?Comercial
    {
        if (!$prefijoId) {
            return null;
        }

        return Comercial::with('personal')
            ->where('prefijo_id', $prefijoId)
            ->where('activo', 1)
            ->first();
    }

    public function getLeadNotes(int $leadId): Collection
    {
        return NotaLead::with('usuario.personal')
            ->where('lead_id', $leadId)
            ->orderBy('created', 'desc')
            ->get()
            ->map(function ($nota) {
                $nota->usuario_nombre = $nota->usuario->personal->nombre_completo ?? 'Usuario no encontrado';
                return $nota;
            });
    }

    public function getLeadComments(int $leadId): Collection
    {
        // Comentarios actuales
        $comentariosActuales = Comentario::with(['usuario.personal', 'tipoComentario'])
            ->where('lead_id', $leadId)
            ->orderBy('created', 'desc')
            ->get()
            ->map(function ($comentario) {
                $comentario->usuario_nombre = $comentario->usuario->personal->nombre_completo ?? 'Usuario no encontrado';
                $comentario->tipo_nombre = $comentario->tipoComentario->nombre ?? 'Comentario';
                return $comentario;
            });

        // Comentarios legacy
        $comentariosLegacy = ComentarioLegacy::where('lead_id', $leadId)
            ->orderBy('created', 'desc')
            ->get()
            ->map(function ($comentario) {
                $comentario->usuario_nombre = 'Sistema anterior';
                $comentario->tipo_nombre = 'Comentario';
                return $comentario;
            });

        // Combinar y ordenar
        return $comentariosActuales->concat($comentariosLegacy)
            ->sortByDesc('created')
            ->values();
    }

    public function getLeadNotifications(int $leadId, int $usuarioId): Collection
    {
        return Notificacion::where('entidad_tipo', 'lead')
            ->where('entidad_id', $leadId)
            ->where('usuario_id', $usuarioId)
            ->orderBy('fecha_notificacion', 'desc')
            ->get();
    }

    public function getStateTransitionTimes(int $leadId): array
    {
         return $this->stateTransitionService->calcularTiemposEntreEstados($leadId);
    }
}