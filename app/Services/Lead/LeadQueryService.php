<?php

namespace App\Services\Lead;

use App\Models\Lead;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * LeadQueryService
 *
 * Responsabilidad: queries de bajo nivel con DB::table() para casos donde
 * se necesita rendimiento sin el overhead de Eloquent (ej: listados masivos,
 * joins complejos con selects específicos).
 *
 * Para lógica de negocio compleja, delega a los services especializados:
 *   - LeadDetailsService    → datos completos de un lead con relaciones
 *   - LeadStateTransitionService → tiempos entre estados (fuente de verdad)
 *   - LeadFormService       → datos de formularios con cache
 *   - LeadCommentService    → comentarios con lógica de negocio
 */
class LeadQueryService
{
    public function __construct(
        private LeadStateTransitionService $stateTransitionService,
        private LeadFormService $formService
    ) {}

    // ──────────────────────────────────────────────────────────────────
    //  LEAD
    // ──────────────────────────────────────────────────────────────────

    /**
     * Obtener lead con datos básicos de relaciones via JOIN.
     * Útil para contextos donde no se necesitan objetos Eloquent completos.
     * Para el dashboard completo del lead, usar LeadDetailsService.
     */
    public function getLeadWithDetails(int $id): ?object
    {
        return DB::table('leads')
            ->select([
                'leads.*',
                'estados_lead.nombre as estado_nombre',
                'estados_lead.color_hex as estado_color',
                'estados_lead.tipo as estado_tipo',
                'origenes_contacto.nombre as origen_nombre',
                'localidades.localidad as localidad_nombre',
                'provincias.provincia as provincia_nombre',
                'rubros.nombre as rubro_nombre',
                'prefijos.codigo as prefijo_codigo',
                'prefijos.descripcion as prefijo_descripcion',
            ])
            ->leftJoin('estados_lead',      'leads.estado_lead_id', '=', 'estados_lead.id')
            ->leftJoin('origenes_contacto', 'leads.origen_id',      '=', 'origenes_contacto.id')
            ->leftJoin('localidades',       'leads.localidad_id',   '=', 'localidades.id')
            ->leftJoin('provincias',        'localidades.provincia_id', '=', 'provincias.id')
            ->leftJoin('rubros',            'leads.rubro_id',       '=', 'rubros.id')
            ->leftJoin('prefijos',          'leads.prefijo_id',     '=', 'prefijos.id')
            ->where('leads.id', $id)
            ->whereNull('leads.deleted_at')
            ->first();
    }

    /**
     * Buscar un lead por ID sin relaciones.
     */
    public function findLead(int $id): ?object
    {
        return DB::table('leads')
            ->where('id', $id)
            ->whereNull('deleted_at')
            ->first();
    }

    // ──────────────────────────────────────────────────────────────────
    //  COMERCIAL
    // ──────────────────────────────────────────────────────────────────

    /**
     * Obtener comercial asignado a un prefijo.
     */
    public function getAssignedComercial(int $prefijoId): ?object
    {
        return DB::table('comercial')
            ->select([
                'comercial.*',
                DB::raw("CONCAT(personal.nombre, ' ', personal.apellido) as nombre_completo"),
                'personal.email',
            ])
            ->leftJoin('personal', 'comercial.personal_id', '=', 'personal.id')
            ->where('comercial.prefijo_id', $prefijoId)
            ->where('comercial.activo', 1)
            ->whereNull('comercial.deleted_at')
            ->first();
    }

    // ──────────────────────────────────────────────────────────────────
    //  NOTAS
    // ──────────────────────────────────────────────────────────────────

    /**
     * Obtener notas de un lead con nombre del usuario via JOIN.
     */
    public function getLeadNotes(int $leadId)
    {
        return DB::table('notas_lead')
            ->select([
                'notas_lead.*',
                DB::raw("CONCAT(personal.nombre, ' ', personal.apellido) as usuario_nombre"),
            ])
            ->leftJoin('usuarios', 'notas_lead.usuario_id', '=', 'usuarios.id')
            ->leftJoin('personal', 'usuarios.personal_id', '=', 'personal.id')
            ->where('notas_lead.lead_id', $leadId)
            ->whereNull('notas_lead.deleted_at')
            ->orderBy('notas_lead.created', 'desc')
            ->get();
    }

    // ──────────────────────────────────────────────────────────────────
    //  COMENTARIOS
    // ──────────────────────────────────────────────────────────────────

    /**
     * Obtener comentarios actuales y legacy combinados.
     * Para lógica de negocio (rechazo, recordatorios), usar LeadCommentService.
     */
    public function getLeadComments(int $leadId)
    {
        $actuales = DB::table('comentarios')
            ->select([
                'comentarios.*',
                DB::raw("CONCAT(personal.nombre, ' ', personal.apellido) as usuario_nombre"),
                'tipo_comentario.nombre as tipo_nombre',
            ])
            ->leftJoin('usuarios',         'comentarios.usuario_id',         '=', 'usuarios.id')
            ->leftJoin('personal',         'usuarios.personal_id',           '=', 'personal.id')
            ->leftJoin('tipo_comentario',  'comentarios.tipo_comentario_id', '=', 'tipo_comentario.id')
            ->where('comentarios.lead_id', $leadId)
            ->whereNull('comentarios.deleted_at')
            ->orderBy('comentarios.created', 'desc')
            ->get();

        $legacy = DB::table('comentarios_legacy')
            ->select([
                'comentarios_legacy.*',
                DB::raw("'Sistema anterior' as usuario_nombre"),
                DB::raw("'Comentario' as tipo_nombre"),
            ])
            ->where('comentarios_legacy.lead_id', $leadId)
            ->orderBy('comentarios_legacy.created', 'desc')
            ->get();

        return $actuales->concat($legacy)->sortByDesc('created')->values();
    }

    // ──────────────────────────────────────────────────────────────────
    //  NOTIFICACIONES
    // ──────────────────────────────────────────────────────────────────

    /**
     * Obtener notificaciones de un lead para un usuario.
     */
    public function getLeadNotifications(int $leadId, int $usuarioId)
    {
        return DB::table('notificaciones')
            ->where('entidad_tipo', 'lead')
            ->where('entidad_id', $leadId)
            ->where('usuario_id', $usuarioId)
            ->whereNull('deleted_at')
            ->orderBy('fecha_notificacion', 'desc')
            ->get()
            ->map(function ($notif) {
                $notif->leida = (bool) $notif->leida;
                return $notif;
            });
    }

    // ──────────────────────────────────────────────────────────────────
    //  TIEMPOS ENTRE ESTADOS
    // ──────────────────────────────────────────────────────────────────

    /**
     * Delega a LeadStateTransitionService que es la fuente de verdad.
     * Nunca retorna datos hardcodeados — si no hay datos reales, retorna [].
     */
    public function getStateTransitionTimes(int $leadId): array
    {
        return $this->stateTransitionService->calcularTiemposEntreEstados($leadId);
    }

    // ──────────────────────────────────────────────────────────────────
    //  DATOS DE FORMULARIOS
    // ──────────────────────────────────────────────────────────────────

    /**
     * Delega a LeadFormService que maneja cache automático (1 hora).
     * No duplicar queries que ya están cacheadas.
     */
    public function getFormData(): array
    {
        return $this->formService->getFormData();
    }
}