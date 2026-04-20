<?php
// app/Services/LeadPerdido/LeadPerdidoFilterService.php

namespace App\Services\LeadPerdido;

use App\Models\Lead;
use App\Models\Prefijo;
use App\Models\MotivoPerdida;
use App\Traits\HasPermisosService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;

class LeadPerdidoFilterService
{
    use HasPermisosService;

    public function __construct()
    {
        $this->initializePermisoService();
    }

    /**
     * Obtener query base para leads perdidos/recontactados
     */
public function getQueryBase(): \Illuminate\Database\Eloquent\Builder
{
    return Lead::query()
        ->with([
            'estadoLead',
            'seguimientoPerdida.motivo',
            'origen',
            'comercial.personal',
            'prefijo.comercial.personal',
            'localidad.provincia'
        ])
        ->where('es_cliente', 0)  // Solo no clientes
        ->where('es_recuperacion', 0)  // 🔥 Excluir recuperados por defecto
        ->where(function($q) {
            $q->where('estado_lead_id', 8)  // Perdido
              ->orWhereHas('estadoLead', function($q2) {
                  $q2->where('tipo', 'recontacto');  // Recontactado
              });
        });
}

    /**
     * Aplicar filtros a la query
     */
    public function aplicarFiltros(\Illuminate\Database\Eloquent\Builder $query, array $filters): void
    {
        // Búsqueda por nombre, email o teléfono
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('nombre_completo', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('telefono', 'like', "%{$search}%");
            });
        }

        // Filtro por localidad (búsqueda LIKE)
        if (!empty($filters['localidad'])) {
            $query->whereHas('localidad', function($q) use ($filters) {
                $q->where('nombre', 'like', "%{$filters['localidad']}%");
            });
        }

        // Filtro por estado (perdido/recontactado/recuperado)
        if (!empty($filters['estado'])) {
        switch ($filters['estado']) {
            case 'perdido':
                $query->whereHas('estadoLead', function($q) {
                    $q->where('nombre', 'Perdido');
                });
                break;
            case 'recontactado':
                $query->whereHas('estadoLead', function($q) {
                    $q->where('tipo', 'recontacto');
                });
                break;
            case 'recuperado':
                // 🔥 CORREGIDO: Mostrar leads que fueron recuperados (restaurado = 1)
                $query->where('es_recuperacion', 1);
                break;
        }
    }

        // Filtro por motivo de pérdida
        if (!empty($filters['motivo_id'])) {
            $query->whereHas('seguimientoPerdida', function($q) use ($filters) {
                $q->where('motivo_perdida_id', $filters['motivo_id']);
            });
        }

        // Filtro por posibilidades futuras
        if (!empty($filters['posibilidades_futuras'])) {
            $query->whereHas('seguimientoPerdida', function($q) use ($filters) {
                $q->where('posibilidades_futuras', $filters['posibilidades_futuras']);
            });
        }

        // Filtro por fecha de rechazo
        if (!empty($filters['fecha_rechazo_desde'])) {
            $query->whereHas('seguimientoPerdida', function($q) use ($filters) {
                $q->whereDate('created', '>=', $filters['fecha_rechazo_desde']);
            });
        }
        if (!empty($filters['fecha_rechazo_hasta'])) {
            $query->whereHas('seguimientoPerdida', function($q) use ($filters) {
                $q->whereDate('created', '<=', $filters['fecha_rechazo_hasta']);
            });
        }

        // Filtro por fecha de recontacto programado
        if (!empty($filters['con_recontacto'])) {
            $query->whereHas('seguimientoPerdida', function($q) use ($filters) {
                match ($filters['con_recontacto']) {
                    'si' => $q->whereNotNull('fecha_posible_recontacto'),
                    'no' => $q->whereNull('fecha_posible_recontacto'),
                    default => null
                };
            });
        }

        // Filtro por comercial/prefijo
        if (!empty($filters['prefijo_id'])) {
            $query->where('prefijo_id', $filters['prefijo_id']);
        }
    }


    
    /**
     * Obtener prefijos para filtro de comerciales
     */
    public function getPrefijosFiltro($usuario): Collection
    {
        $query = Prefijo::query()
            ->select([
                'prefijos.id',
                'prefijos.codigo',
                'prefijos.descripcion',
                'comercial.personal_id',
                DB::raw("CONCAT(personal.nombre, ' ', personal.apellido) as comercial_nombre")
            ])
            ->leftJoin('comercial', 'prefijos.id', '=', 'comercial.prefijo_id')
            ->leftJoin('personal', 'comercial.personal_id', '=', 'personal.id')
            ->where('prefijos.activo', 1)
            ->orderBy('prefijos.codigo');

        // Si el usuario NO ve todas las cuentas, filtrar por sus prefijos asignados
        if (!$usuario->ve_todas_cuentas) {
            $prefijosPermitidos = $this->getPrefijosPermitidos($usuario->id);
            if (!empty($prefijosPermitidos)) {
                $query->whereIn('prefijos.id', $prefijosPermitidos);
            } else {
                $query->whereRaw('1 = 0');
            }
        }

        return $query->get()->map(function ($prefijo) {
            return [
                'id' => (string)$prefijo->id,
                'codigo' => $prefijo->codigo,
                'descripcion' => $prefijo->descripcion,
                'comercial_nombre' => $prefijo->comercial_nombre,
                'display_text' => $prefijo->comercial_nombre 
                    ? "{$prefijo->comercial_nombre} - {$prefijo->codigo}"
                    : "{$prefijo->codigo} - {$prefijo->descripcion}",
            ];
        });
    }

    /**
     * Obtener prefijo del usuario si es comercial
     */
    public function getPrefijoUsuarioComercial($usuario): ?array
    {
        if ($usuario->rol_id == 5) {
            $prefijo = Prefijo::select([
                    'prefijos.id',
                    'prefijos.codigo',
                    'prefijos.descripcion',
                    'comercial.personal_id',
                    DB::raw("CONCAT(personal.nombre, ' ', personal.apellido) as comercial_nombre")
                ])
                ->leftJoin('comercial', 'prefijos.id', '=', 'comercial.prefijo_id')
                ->leftJoin('personal', 'comercial.personal_id', '=', 'personal.id')
                ->where('comercial.personal_id', $usuario->personal_id)
                ->where('comercial.activo', 1)
                ->where('prefijos.activo', 1)
                ->first();

            if ($prefijo) {
                return [
                    'id' => (string)$prefijo->id,
                    'codigo' => $prefijo->codigo,
                    'descripcion' => $prefijo->descripcion,
                    'comercial_nombre' => $prefijo->comercial_nombre,
                    'display_text' => $prefijo->comercial_nombre 
                        ? "{$prefijo->comercial_nombre} - {$prefijo->codigo}"
                        : "{$prefijo->codigo} - {$prefijo->descripcion}",
                ];
            }
        }

        return null;
    }

    /**
     * Obtener datos para filtros (motivos, etc.)
     */
    public function getDatosFiltros(): array
    {
        return [
            'motivos' => MotivoPerdida::where('es_activo', 1)
                ->orderBy('nombre')
                ->get(['id', 'nombre']),
        ];
    }

    /**
 * Formatear fecha para mostrar (hoy, ayer, hace X días, etc.)
 */
private function formatDateForDisplay($date): ?string
{
    if (!$date) return null;
    
    try {
        $fecha = new \DateTime($date);
        $hoy = new \DateTime();
        $ayer = (new \DateTime())->modify('-1 day');
        
        // Resetear horas para comparar solo fechas
        $fechaSinHora = $fecha->setTime(0, 0, 0);
        $hoySinHora = $hoy->setTime(0, 0, 0);
        $ayerSinHora = $ayer->setTime(0, 0, 0);
        
        if ($fechaSinHora == $hoySinHora) {
            return 'hoy';
        }
        
        if ($fechaSinHora == $ayerSinHora) {
            return 'ayer';
        }
        
        $diff = $fecha->diff($hoy);
        $dias = $diff->days;
        
        if ($dias < 7) {
            return "hace {$dias} días";
        }
        
        if ($dias < 30) {
            $semanas = floor($dias / 7);
            return "hace {$semanas} sem";
        }
        
        if ($dias < 365) {
            return $fecha->format('d/m');
        }
        
        return $fecha->format('d/m/y');
        
    } catch (\Exception $e) {
        return null;
    }
}

public function getConteoComentarios(array $leadIds): array
{
    if (empty($leadIds)) {
        return [];
    }

    // Comentarios actuales con fecha del último
    $comentariosActuales = DB::table('comentarios')
        ->select('lead_id', DB::raw('COUNT(*) as total'), DB::raw('MAX(created) as ultimo'))
        ->whereIn('lead_id', $leadIds)
        ->whereNull('deleted_at')
        ->groupBy('lead_id')
        ->get()
        ->keyBy('lead_id')
        ->toArray();

    // Comentarios legacy con fecha del último
    $comentariosLegacy = DB::table('comentarios_legacy')
        ->select('lead_id', DB::raw('COUNT(*) as total'), DB::raw('MAX(created) as ultimo'))
        ->whereIn('lead_id', $leadIds)
        ->groupBy('lead_id')
        ->get()
        ->keyBy('lead_id')
        ->toArray();

    // Combinar resultados
    $resultado = [];
    foreach ($leadIds as $leadId) {
        $total = ($comentariosActuales[$leadId]->total ?? 0) + ($comentariosLegacy[$leadId]->total ?? 0);
        if ($total > 0) {
            // Obtener la fecha más reciente entre ambos
            $fechaActual = $comentariosActuales[$leadId]->ultimo ?? null;
            $fechaLegacy = $comentariosLegacy[$leadId]->ultimo ?? null;
            $ultimo = null;
            $ultimoFormateado = null;
            
            if ($fechaActual && $fechaLegacy) {
                $ultimo = $fechaActual > $fechaLegacy ? $fechaActual : $fechaLegacy;
            } elseif ($fechaActual) {
                $ultimo = $fechaActual;
            } elseif ($fechaLegacy) {
                $ultimo = $fechaLegacy;
            }
            
            // ✅ Formatear la fecha para mostrar
            $ultimoFormateado = $this->formatDateForDisplay($ultimo);
            
            $resultado[$leadId] = [
                'total' => $total,
                'ultimo' => $ultimo,
                'ultimo_formateado' => $ultimoFormateado,  // ✅ Agregar campo formateado
            ];
        }
    }

    return $resultado;
}

public function getConteoPresupuestos(array $leadIds): array
{
    if (empty($leadIds)) {
        return [];
    }
    
    // Presupuestos actuales con fecha del último
    $presupuestosActuales = DB::table('presupuestos')
        ->select('lead_id', DB::raw('COUNT(*) as total'), DB::raw('MAX(created) as ultimo'))
        ->whereIn('lead_id', $leadIds)
        ->whereNull('deleted_at')
        ->groupBy('lead_id')
        ->get()
        ->keyBy('lead_id')
        ->toArray();

    // Presupuestos legacy con fecha del último
    $presupuestosLegacy = DB::table('presupuestos_legacy')
        ->select('lead_id', DB::raw('COUNT(*) as total'), DB::raw('MAX(created_at) as ultimo'))
        ->whereIn('lead_id', $leadIds)
        ->groupBy('lead_id')
        ->get()
        ->keyBy('lead_id')
        ->toArray();

    // Combinar resultados
    $resultado = [];
    foreach ($leadIds as $leadId) {
        $total = ($presupuestosActuales[$leadId]->total ?? 0) + ($presupuestosLegacy[$leadId]->total ?? 0);
        if ($total > 0) {
            // Obtener la fecha más reciente entre ambos
            $fechaActual = $presupuestosActuales[$leadId]->ultimo ?? null;
            $fechaLegacy = $presupuestosLegacy[$leadId]->ultimo ?? null;
            $ultimo = null;
            $ultimoFormateado = null;
            
            if ($fechaActual && $fechaLegacy) {
                $ultimo = $fechaActual > $fechaLegacy ? $fechaActual : $fechaLegacy;
            } elseif ($fechaActual) {
                $ultimo = $fechaActual;
            } elseif ($fechaLegacy) {
                $ultimo = $fechaLegacy;
            }
            
            // ✅ Formatear la fecha para mostrar
            $ultimoFormateado = $this->formatDateForDisplay($ultimo);
            
            $resultado[$leadId] = [
                'total' => $total,
                'ultimo' => $ultimo,
                'ultimo_formateado' => $ultimoFormateado,  // ✅ Agregar campo formateado
            ];
        }
    }

    return $resultado;
}
}