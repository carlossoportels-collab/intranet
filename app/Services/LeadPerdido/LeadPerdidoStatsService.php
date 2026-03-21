<?php
// app/Services/LeadPerdido/LeadPerdidoStatsService.php

namespace App\Services\LeadPerdido;

use App\Models\Usuario;
use App\Models\SeguimientoPerdida;
use App\Traits\HasPermisosService; // 🔥 IMPORTAR TRAIT
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class LeadPerdidoStatsService
{
    use HasPermisosService; // 🔥 AGREGAR TRAIT

    protected LeadPerdidoNotificationService $notificationService;

    public function __construct(LeadPerdidoNotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
        $this->initializePermisoService(); // 🔥 INICIALIZAR
    }

    /**
     * Obtener todas las estadísticas
     */
    public function getEstadisticas(Usuario $usuario): array
    {
        $query = $this->buildBaseQuery($usuario);
        $totalLeadsPerdidos = $query->count();

        return [
            'total' => $totalLeadsPerdidos,
            'por_estado' => $this->getEstadisticasPorEstado($query, $totalLeadsPerdidos),
            'por_motivo' => $this->getEstadisticasPorMotivo($usuario),
            'por_mes' => $this->getEstadisticasPorMes($usuario),
            'tasa_recontacto' => $this->calcularTasaRecontacto($query),
            'con_recontacto_programado' => $this->notificationService->contarNotificacionesProgramadas($usuario),
            'total_recontactados' => $this->contarRecontactados($query),
            'total_aun_perdidos' => $this->contarAunPerdidos($query),
        ];
    }

    private function buildBaseQuery(Usuario $usuario)
    {
        $query = SeguimientoPerdida::whereNull('seguimientos_perdida.deleted_at')
            ->whereHas('lead', fn($q) => $q->where('es_cliente', 0));

        if (!$usuario->ve_todas_cuentas) {
            $prefijosPermitidos = $this->getPrefijosPermitidos($usuario->id);
            
            if (empty($prefijosPermitidos)) {
                $query->whereRaw('1 = 0');
                return $query;
            }

            $query->whereHas('lead', fn($q) => $q->whereIn('prefijo_id', $prefijosPermitidos));
        }

        return $query;
    }

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

    private function getEstadisticasPorMotivo(Usuario $usuario)
    {
        $query = DB::table('seguimientos_perdida as sp')
            ->join('motivos_perdida as mp', 'sp.motivo_perdida_id', '=', 'mp.id')
            ->join('leads as l', 'sp.lead_id', '=', 'l.id')
            ->join('estados_lead as el', 'l.estado_lead_id', '=', 'el.id')
            ->whereNull('sp.deleted_at')
            ->where('l.es_cliente', 0);

        if (!$usuario->ve_todas_cuentas) {
            $prefijosPermitidos = $this->getPrefijosPermitidos($usuario->id);
            if (empty($prefijosPermitidos)) {
                return collect([]);
            }
            $query->whereIn('l.prefijo_id', $prefijosPermitidos);
        }

        return $query->select(
                'mp.id',
                'mp.nombre as motivo',
                DB::raw('COUNT(sp.id) as total'),
                DB::raw("SUM(CASE WHEN el.tipo = 'recontacto' THEN 1 ELSE 0 END) as recontactados"),
                DB::raw("SUM(CASE WHEN el.nombre = 'Perdido' THEN 1 ELSE 0 END) as aun_perdidos"),
                DB::raw("SUM(CASE WHEN el.tipo IN ('contactado', 'seguimiento', 'negociacion', 'propuesta') THEN 1 ELSE 0 END) as recuperados")
            )
            ->groupBy('mp.id', 'mp.nombre')
            ->orderByDesc('total')
            ->get();
    }

    private function getEstadisticasPorMes(Usuario $usuario)
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

    private function calcularTasaRecontacto($query): float
    {
        $totalRecontactados = $query->clone()
            ->whereHas('lead.estadoLead', fn($q) => $q->where('tipo', 'recontacto'))
            ->count();

        $total = $query->clone()->count();

        return $total > 0 ? round(($totalRecontactados / $total) * 100, 2) : 0;
    }

    private function contarRecontactados($query): int
    {
        return $query->clone()
            ->whereHas('lead.estadoLead', fn($q) => $q->where('tipo', 'recontacto'))
            ->count();
    }

    private function contarAunPerdidos($query): int
    {
        return $query->clone()
            ->whereHas('lead.estadoLead', fn($q) => $q->where('nombre', 'Perdido'))
            ->count();
    }
}