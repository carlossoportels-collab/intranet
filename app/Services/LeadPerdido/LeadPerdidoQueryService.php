<?php
// app/Services/LeadPerdido/LeadPerdidoQueryService.php

namespace App\Services\LeadPerdido;

use App\Models\Lead;
use App\Models\SeguimientoPerdida;
use App\Models\Usuario;
use App\Traits\HasPermisosService; // 🔥 IMPORTAR TRAIT
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class LeadPerdidoQueryService
{
    use HasPermisosService; // 🔥 AGREGAR TRAIT

    public function __construct()
    {
        $this->initializePermisoService(); // 🔥 INICIALIZAR
    }

    /**
     * Obtener listado paginado de leads perdidos con filtros
     */
    public function getLeadsPerdidosPaginated(Request $request, Usuario $usuario): LengthAwarePaginator
    {
        $query = $this->buildBaseQuery($request, $usuario);
        
        // Ordenar y paginar
        $seguimientos = $query->orderBy('seguimientos_perdida.created', 'desc')
            ->paginate(20);

        // Transformar a formato compatible con la vista
        return $this->transformToLeadFormat($seguimientos);
    }

    /**
     * Construir query base con todos los filtros
     */
    private function buildBaseQuery(Request $request, Usuario $usuario)
    {
        $query = SeguimientoPerdida::with([
            'motivo',
            'lead' => fn($q) => $q->with(['estadoLead', 'origen', 'localidad', 'rubro', 'comercial.personal'])
        ])
        ->whereNull('seguimientos_perdida.deleted_at')
        ->whereHas('lead', fn($q) => $q->where('es_cliente', 0));

        // Aplicar filtros
        $this->applyPermissionFilter($query, $usuario);
        $this->applyEstadoFilter($query, $request);
        $this->applyMotivoFilter($query, $request);
        $this->applyDateFilter($query, $request);
        $this->applyPosibilidadesFilter($query, $request);
        $this->applySearchFilter($query, $request);

        return $query;
    }

    private function applyPermissionFilter($query, Usuario $usuario): void
    {
        if ($usuario->ve_todas_cuentas) {
            return;
        }

        $prefijosPermitidos = $this->getPrefijosPermitidos($usuario->id);
        
        if (empty($prefijosPermitidos)) {
            $query->whereRaw('1 = 0');
            return;
        }

        $query->whereHas('lead', fn($q) => $q->whereIn('prefijo_id', $prefijosPermitidos));
    }

    private function applyEstadoFilter($query, Request $request): void
    {
        if (!$request->filled('estado')) return;

        match ($request->estado) {
            'perdido' => $query->whereHas('lead.estadoLead', fn($q) => $q->where('nombre', 'Perdido')),
            'recontactado' => $query->whereHas('lead.estadoLead', fn($q) => $q->where('tipo', 'recontacto')),
            'recuperado' => $query->whereHas('lead.estadoLead', fn($q) => $q->whereIn('tipo', ['contactado', 'seguimiento', 'negociacion', 'propuesta'])),
            default => null
        };
    }

    private function applyMotivoFilter($query, Request $request): void
    {
        if ($request->filled('motivo_id')) {
            $query->where('motivo_perdida_id', $request->motivo_id);
        }
    }

    private function applyDateFilter($query, Request $request): void
    {
        if ($request->filled('fecha_rechazo_desde')) {
            $query->whereDate('seguimientos_perdida.created', '>=', $request->fecha_rechazo_desde);
        }
        if ($request->filled('fecha_rechazo_hasta')) {
            $query->whereDate('seguimientos_perdida.created', '<=', $request->fecha_rechazo_hasta);
        }
    }

    private function applyPosibilidadesFilter($query, Request $request): void
    {
        if ($request->filled('posibilidades_futuras')) {
            $query->where('posibilidades_futuras', $request->posibilidades_futuras);
        }

        if ($request->filled('con_recontacto')) {
            match ($request->con_recontacto) {
                'si' => $query->whereNotNull('fecha_posible_recontacto'),
                'no' => $query->whereNull('fecha_posible_recontacto'),
                default => null
            };
        }
    }

    private function applySearchFilter($query, Request $request): void
    {
        if (!$request->filled('search')) return;

        $search = $request->search;
        $query->whereHas('lead', fn($q) => $q->where('nombre_completo', 'like', "%{$search}%")
            ->orWhere('email', 'like', "%{$search}%")
            ->orWhere('telefono', 'like', "%{$search}%"));
    }

    private function transformToLeadFormat($seguimientos): LengthAwarePaginator
    {
        $leadsData = $seguimientos->getCollection()->map(function($seguimiento) {
            if (!$seguimiento->lead) return null;

            return [
                'id' => $seguimiento->lead->id,
                'nombre_completo' => $seguimiento->lead->nombre_completo,
                'email' => $seguimiento->lead->email,
                'telefono' => $seguimiento->lead->telefono,
                'estado_lead' => $seguimiento->lead->estadoLead ? [
                    'id' => $seguimiento->lead->estadoLead->id,
                    'nombre' => $seguimiento->lead->estadoLead->nombre,
                    'tipo' => $seguimiento->lead->estadoLead->tipo,
                    'color_hex' => $seguimiento->lead->estadoLead->color_hex,
                ] : null,
                'seguimientoPerdida' => [
                    'id' => $seguimiento->id,
                    'motivo' => $seguimiento->motivo ? [
                        'id' => $seguimiento->motivo->id,
                        'nombre' => $seguimiento->motivo->nombre,
                    ] : null,
                    'posibilidades_futuras' => $seguimiento->posibilidades_futuras,
                    'fecha_posible_recontacto' => $seguimiento->fecha_posible_recontacto,
                    'created' => $seguimiento->created,
                ],
                'created' => $seguimiento->lead->created,
                'origen' => $seguimiento->lead->origen ? [
                    'id' => $seguimiento->lead->origen->id,
                    'nombre' => $seguimiento->lead->origen->nombre,
                ] : null,
                'comercial' => $seguimiento->lead->comercial?->personal ? [
                    'personal' => [
                        'nombre' => $seguimiento->lead->comercial->personal->nombre ?? '',
                        'apellido' => $seguimiento->lead->comercial->personal->apellido ?? '',
                    ]
                ] : null,
            ];
        })->filter();

        return new LengthAwarePaginator(
            $leadsData,
            $seguimientos->total(),
            $seguimientos->perPage(),
            $seguimientos->currentPage(),
            ['path' => $seguimientos->path()]
        );
    }

    /**
     * Obtener un seguimiento completo con todas sus relaciones
     */
    public function getSeguimientoWithLead(int $leadId): SeguimientoPerdida
    {
        return SeguimientoPerdida::with([
            'motivo',
            'lead' => fn($q) => $q->with([
                'estadoLead',
                'origen',
                'localidad',
                'rubro',
                'comercial.personal',
                'comentarios' => fn($q) => $q->with(['tipoComentario', 'usuario.personal'])
                    ->orderBy('created', 'desc')
            ])
        ])
        ->whereNull('seguimientos_perdida.deleted_at')
        ->whereHas('lead', fn($q) => $q->where('id', $leadId)->where('es_cliente', 0))
        ->firstOrFail();
    }
}