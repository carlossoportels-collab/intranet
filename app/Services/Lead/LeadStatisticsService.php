<?php
// app/Services/Lead/LeadStatisticsService.php

namespace App\Services\Lead;

use App\Models\EstadoLead;
use App\Traits\HasPermisosService; // 🔥 IMPORTAR TRAIT
use Illuminate\Support\Facades\DB;

class LeadStatisticsService
{
    use HasPermisosService; // 🔥 AGREGAR TRAIT

    private array $estadosExcluirIds;
    
    public function __construct()
    {
        $this->initializePermisoService(); // 🔥 INICIALIZAR
        $this->estadosExcluirIds = $this->getEstadosExcluirIds();
    }
    
    private function getEstadosExcluirIds(): array
    {
        return EstadoLead::whereIn('tipo', ['recontacto', 'final_negativo','final_positivo'])
            ->where('activo', 1)
            ->pluck('id')
            ->toArray();
    }
    
    public function getEstadisticas($usuario): array
    {
        $query = DB::table('leads')
            ->select(
                DB::raw('COUNT(*) as total'),
                DB::raw('SUM(CASE WHEN estado_lead_id = 1 THEN 1 ELSE 0 END) as nuevo'),
                DB::raw('SUM(CASE WHEN estado_lead_id = 2 THEN 1 ELSE 0 END) as contactado'),
                DB::raw('SUM(CASE WHEN estado_lead_id = 3 THEN 1 ELSE 0 END) as seguimiento'),
                DB::raw('SUM(CASE WHEN estado_lead_id = 4 THEN 1 ELSE 0 END) as propuesta'),
                DB::raw('SUM(CASE WHEN estado_lead_id = 5 THEN 1 ELSE 0 END) as negociacion'),
                DB::raw('SUM(CASE WHEN estado_lead_id = 12 THEN 1 ELSE 0 END) as pausado')
            )
            ->where('es_cliente', 0)
            ->whereNotIn('estado_lead_id', $this->estadosExcluirIds)
            ->where('es_activo', 1);
        
        // Aplicar filtro de permisos usando el trait
        if (!$usuario->ve_todas_cuentas) {
            $prefijosPermitidos = $this->getPrefijosPermitidos($usuario->id);
            if (!empty($prefijosPermitidos)) {
                $query->whereIn('prefijo_id', $prefijosPermitidos);
            } else {
                $query->whereRaw('1 = 0');
            }
        }
        
        $estadisticasRow = $query->first();
        
        return [
            'total' => $estadisticasRow->total ?? 0,
            'nuevo' => $estadisticasRow->nuevo ?? 0,
            'contactado' => $estadisticasRow->contactado ?? 0,
            'seguimiento' => $estadisticasRow->seguimiento ?? 0,
            'propuesta' => $estadisticasRow->propuesta ?? 0,
            'negociacion' => $estadisticasRow->negociacion ?? 0,
            'pausado' => $estadisticasRow->pausado ?? 0,
        ];
    }
}