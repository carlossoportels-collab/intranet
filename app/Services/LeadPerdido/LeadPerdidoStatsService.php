<?php
// app/Services/LeadPerdido/LeadPerdidoStatsService.php

namespace App\Services\LeadPerdido;

use App\Models\Usuario;
use App\Models\SeguimientoPerdida;
use App\Traits\HasPermisosService;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LeadPerdidoStatsService
{
    use HasPermisosService;

    protected LeadPerdidoNotificationService $notificationService;

    public function __construct(LeadPerdidoNotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
        $this->initializePermisoService();
    }

    /**
     * Obtener todas las estadísticas con filtros aplicados
     */
    public function getEstadisticas(Usuario $usuario, array $filtros = []): array
    {
        $query = $this->buildBaseQuery($usuario, $filtros);
        $totalLeadsPerdidos = $query->count();

        return [
            'total' => $totalLeadsPerdidos,
            'por_estado' => $this->getEstadisticasPorEstado($query, $totalLeadsPerdidos),
            'por_motivo' => $this->getEstadisticasPorMotivo($usuario, $filtros),
            'por_mes' => $this->getEstadisticasPorMes($usuario, $filtros),
            'tasa_recontacto' => $this->calcularTasaRecontacto($query),
            'con_recontacto_programado' => $this->contarRecontactoProgramado($usuario, $filtros),
            'total_recontactados' => $this->contarRecontactados($query),
            'total_aun_perdidos' => $this->contarAunPerdidos($query),
        ];
    }

    /**
     * Construir query base con filtros
     */
    private function buildBaseQuery(Usuario $usuario, array $filtros = [])
    {
        $query = SeguimientoPerdida::whereNull('seguimientos_perdida.deleted_at')
            ->whereHas('lead', fn($q) => $q->where('es_cliente', 0));

        // Permisos
        if (!$usuario->ve_todas_cuentas) {
            $prefijosPermitidos = $this->getPrefijosPermitidos($usuario->id);
            if (empty($prefijosPermitidos)) {
                $query->whereRaw('1 = 0');
                return $query;
            }
            $query->whereHas('lead', fn($q) => $q->whereIn('prefijo_id', $prefijosPermitidos));
        }

        $this->aplicarFiltrosQuery($query, $filtros);

        return $query;
    }

    /**
     * Aplicar filtros a la query
     */
    private function aplicarFiltrosQuery($query, array $filtros): void
    {
        if (!empty($filtros['prefijo_id'])) {
            $query->whereHas('lead', fn($q) => $q->where('prefijo_id', $filtros['prefijo_id']));
        }

        if (!empty($filtros['motivo_id'])) {
            $query->where('motivo_perdida_id', $filtros['motivo_id']);
        }

        if (!empty($filtros['posibilidades_futuras'])) {
            $query->where('posibilidades_futuras', $filtros['posibilidades_futuras']);
        }

        if (!empty($filtros['search'])) {
            $search = $filtros['search'];
            $query->whereHas('lead', function($q) use ($search) {
                $q->where('nombre_completo', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('telefono', 'like', "%{$search}%");
            });
        }

        if (!empty($filtros['localidad'])) {
            $localidad = $filtros['localidad'];
            $query->whereHas('lead.localidad', function($q) use ($localidad) {
                $q->where('nombre', 'like', "%{$localidad}%");
            });
        }
    }

    /**
     * Estadísticas por estado
     */
    private function getEstadisticasPorEstado($query, int $total): array
    {
        return $query->with('lead.estadoLead')
            ->get()
            ->groupBy('lead.estadoLead.nombre')
            ->map(fn($items, $estadoNombre) => [
                'estado' => $estadoNombre,
                'tipo' => $items->first()->lead->estadoLead?->tipo ?? 'desconocido',
                'total' => $items->count(),
                'porcentaje' => $total > 0 ? round(($items->count() / $total) * 100, 2) : 0
            ])
            ->values()
            ->toArray();
    }

    /**
     * Estadísticas por motivo
     */
private function getEstadisticasPorMotivo(Usuario $usuario, array $filtros = [])
{
    $query = DB::table('seguimientos_perdida as sp')
        ->join('motivos_perdida as mp', 'sp.motivo_perdida_id', '=', 'mp.id')
        ->join('leads as l', 'sp.lead_id', '=', 'l.id')
        ->join('estados_lead as el', 'l.estado_lead_id', '=', 'el.id')
        ->whereNull('sp.deleted_at')
        ->where('l.es_cliente', 0);

    // Permisos
    if (!$usuario->ve_todas_cuentas) {
        $prefijosPermitidos = $this->getPrefijosPermitidos($usuario->id);
        if (empty($prefijosPermitidos)) {
            return collect([]);
        }
        $query->whereIn('l.prefijo_id', $prefijosPermitidos);
    }

    $this->aplicarFiltrosStats($query, $filtros);

    return $query->select(
            'mp.id',
            'mp.nombre as motivo',
            DB::raw('COUNT(sp.id) as total'),
            DB::raw("SUM(CASE WHEN el.tipo = 'recontacto' THEN 1 ELSE 0 END) as recontactados"),
            DB::raw("SUM(CASE WHEN el.nombre = 'Perdido' THEN 1 ELSE 0 END) as aun_perdidos"),
            // 🔥 Usar es_recuperacion de la tabla leads
            DB::raw("SUM(CASE WHEN l.es_recuperacion = 1 THEN 1 ELSE 0 END) as recuperados")
        )
        ->groupBy('mp.id', 'mp.nombre')
        ->orderByDesc('total')
        ->get();
}

    /**
     * Aplicar filtros a query de estadísticas (DB::table)
     */
    private function aplicarFiltrosStats($query, array $filtros): void
    {
        if (!empty($filtros['prefijo_id'])) {
            $query->where('l.prefijo_id', $filtros['prefijo_id']);
        }

        if (!empty($filtros['motivo_id'])) {
            $query->where('sp.motivo_perdida_id', $filtros['motivo_id']);
        }

        if (!empty($filtros['posibilidades_futuras'])) {
            $query->where('sp.posibilidades_futuras', $filtros['posibilidades_futuras']);
        }

        if (!empty($filtros['search'])) {
            $search = $filtros['search'];
            $query->where(function($q) use ($search) {
                $q->where('l.nombre_completo', 'like', "%{$search}%")
                  ->orWhere('l.email', 'like', "%{$search}%")
                  ->orWhere('l.telefono', 'like', "%{$search}%");
            });
        }

        if (!empty($filtros['localidad'])) {
            $localidad = $filtros['localidad'];
            $query->whereExists(function($q) use ($localidad) {
                $q->select(DB::raw(1))
                  ->from('localidades as loc')
                  ->whereColumn('loc.id', 'l.localidad_id')
                  ->where('loc.nombre', 'like', "%{$localidad}%");
            });
        }
    }

    /**
     * Estadísticas por mes
     */
    private function getEstadisticasPorMes(Usuario $usuario, array $filtros = [])
    {
        $query = DB::table('seguimientos_perdida as sp')
            ->join('leads as l', 'sp.lead_id', '=', 'l.id')
            ->join('estados_lead as el', 'l.estado_lead_id', '=', 'el.id')
            ->where('sp.created', '>=', Carbon::now()->subMonths(6))
            ->whereNull('sp.deleted_at')
            ->where('l.es_cliente', 0);

        if (!$usuario->ve_todas_cuentas) {
            $prefijosPermitidos = $this->getPrefijosPermitidos($usuario->id);
            if (empty($prefijosPermitidos)) {
                return collect([]);
            }
            $query->whereIn('l.prefijo_id', $prefijosPermitidos);
        }

        $this->aplicarFiltrosStats($query, $filtros);

        return $query->select(
                DB::raw('DATE_FORMAT(sp.created, "%Y-%m") as mes'),
                DB::raw('COUNT(sp.id) as total'),
                DB::raw("SUM(CASE WHEN el.tipo = 'recontacto' THEN 1 ELSE 0 END) as recontactados"),
                DB::raw("SUM(CASE WHEN el.nombre = 'Perdido' THEN 1 ELSE 0 END) as aun_perdidos")
            )
            ->groupBy('mes')
            ->orderBy('mes')
            ->get();
    }

    /**
     * Calcular tasa de recontacto
     */
    private function calcularTasaRecontacto($query): float
    {
        $totalRecontactados = $query->clone()
            ->whereHas('lead.estadoLead', fn($q) => $q->where('tipo', 'recontacto'))
            ->count();

        $total = $query->clone()->count();

        return $total > 0 ? round(($totalRecontactados / $total) * 100, 2) : 0;
    }

    /**
     * Contar recontactados
     */
    private function contarRecontactados($query): int
    {
        return $query->clone()
            ->whereHas('lead.estadoLead', fn($q) => $q->where('tipo', 'recontacto'))
            ->count();
    }

    /**
     * Contar aún perdidos
     */
    private function contarAunPerdidos($query): int
    {
        return $query->clone()
            ->whereHas('lead.estadoLead', fn($q) => $q->where('nombre', 'Perdido'))
            ->count();
    }

    /**
     * Contar recontacto programado
     */
    private function contarRecontactoProgramado(Usuario $usuario, array $filtros = []): int
    {
        $query = SeguimientoPerdida::whereNotNull('fecha_posible_recontacto')
            ->where('fecha_posible_recontacto', '>=', now())
            ->whereNull('deleted_at')
            ->whereHas('lead', fn($q) => $q->where('es_cliente', 0));

        if (!$usuario->ve_todas_cuentas) {
            $prefijosPermitidos = $this->getPrefijosPermitidos($usuario->id);
            if (empty($prefijosPermitidos)) {
                return 0;
            }
            $query->whereHas('lead', fn($q) => $q->whereIn('prefijo_id', $prefijosPermitidos));
        }

        $this->aplicarFiltrosQuery($query, $filtros);

        return $query->count();
    }

    
}