<?php
// app/Services/Lead/LeadFilterService.php

namespace App\Services\Lead;

use App\Models\Lead;
use App\Models\EstadoLead;
use App\Models\Prefijo;
use App\Models\Comercial;
use App\Traits\HasPermisosService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

class LeadFilterService
{
    use HasPermisosService;

    private array $estadosExcluirIds;
    
    public function __construct()
    {
        $this->initializePermisoService();
        $this->estadosExcluirIds = $this->getEstadosExcluirIds();
    }
    
    private function getEstadosExcluirIds(): array
    {
        return EstadoLead::whereIn('tipo', ['recontacto', 'final_negativo'])
            ->where('activo', 1)
            ->pluck('id')
            ->toArray();
    }
    
    public function getQueryBase(): \Illuminate\Database\Eloquent\Builder
    {
        return Lead::query()
            ->with([
                'origen', 
                'estadoLead', 
                'localidad.provincia', 
                'rubro', 
                'prefijo.comercial.personal',  // ← Cambiar 'comercial.personal' por esto
                'notas.usuario.personal'
            ])
            ->where('es_cliente', 0)
            ->whereNotIn('estado_lead_id', $this->estadosExcluirIds);
    }

    public function aplicarFiltros(\Illuminate\Database\Eloquent\Builder $query, array $filters): void
    {
        // Filtro de búsqueda
        if (!empty($filters['search'])) {
            $search = $filters['search'];
            $query->where(function ($q) use ($search) {
                $q->where('nombre_completo', 'like', "%{$search}%")
                  ->orWhere('email', 'like', "%{$search}%")
                  ->orWhere('telefono', 'like', "%{$search}%");
            });
        }
        
        // Filtro por estado
        if (!empty($filters['estado_id'])) {
            $query->where('estado_lead_id', $filters['estado_id']);
        }
        
        // Filtro por origen
        if (!empty($filters['origen_id'])) {
            $query->where('origen_id', $filters['origen_id']);
        }

        // Filtro por prefijo
        if (!empty($filters['prefijo_id'])) {
            $this->aplicarFiltroPrefijo($query, $filters['prefijo_id']);
        }
        
        // 🔥 NUEVO: Filtro por nombre de localidad (búsqueda LIKE)
        if (!empty($filters['localidad_nombre'])) {
            $searchTerm = $filters['localidad_nombre'];
            $query->whereHas('localidad', function ($q) use ($searchTerm) {
                $q->where('nombre', 'like', "%{$searchTerm}%");
            });
        }
        
        // Filtro por fecha
        if (!empty($filters['fecha_inicio'])) {
            $query->whereDate('created', '>=', $filters['fecha_inicio']);
        }
        
        if (!empty($filters['fecha_fin'])) {
            $query->whereDate('created', '<=', $filters['fecha_fin']);
        }
    }
    
    public function aplicarPermisos(\Illuminate\Database\Eloquent\Builder $query, $usuario): void
    {
        $this->applyPrefijoFilter($query, $usuario);
    }
    
    public function getComercialesActivos($usuario): Collection
    {
        $query = Comercial::with('personal')
            ->where('activo', 1);
        
        // Aplicar filtro de permisos usando el trait
        if (!$usuario->ve_todas_cuentas) {
            $prefijosPermitidos = $this->getPrefijosPermitidos($usuario->id);
            
            if (!empty($prefijosPermitidos)) {
                $query->whereIn('prefijo_id', $prefijosPermitidos);
            } else {
                return collect([]);
            }
        }
        
        $resultados = $query->get();
        
        // Log del primer comercial para ver qué datos tiene
        if ($resultados->isNotEmpty()) {
            $primerComercial = $resultados->first();
        }
        
        $mapeados = $resultados->map(function ($comercial) {
            $datos = [
                'id' => $comercial->id,
                'prefijo_id' => $comercial->prefijo_id,
                'personal_id' => $comercial->personal_id,
                'nombre' => $comercial->personal->nombre_completo ?? 'Sin nombre',
                'email' => $comercial->personal->email ?? '',
                'telefono' => $comercial->personal->telefono ?? '',
                'personal' => $comercial->personal ? [
                    'id' => $comercial->personal->id,
                    'nombre' => $comercial->personal->nombre,
                    'apellido' => $comercial->personal->apellido,
                    'email' => $comercial->personal->email,
                    'telefono' => $comercial->personal->telefono,
                ] : null,
            ];
            
            return $datos;
        });
            
        return $mapeados;
    }
        
// app/Services/Lead/LeadFilterService.php

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

    public function getDatosFiltros($usuario = null): array
    {
        $data = [
            'origenes' => \App\Models\OrigenContacto::where('activo', true)->get(),
            'estadosLead' => \App\Models\EstadoLead::where('activo', true)
                ->whereNotIn('tipo', ['recontacto', 'final_negativo','final_positivo'])
                ->get(),
            'tiposComentario' => \App\Models\TipoComentario::where('es_activo', true)
                ->where(function($query) {
                    $query->where('aplica_a', 'lead')
                        ->orWhere('aplica_a', 'ambos');
                })
                ->get(),
            'rubros' => \App\Models\Rubro::where('activo', true)->get(),
            'provincias' => \App\Models\Provincia::where('activo', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre']),
        ];
        
        // Si se pasa el usuario, incluir comerciales
        if ($usuario) {
            $data['comerciales'] = $this->getComercialesActivos($usuario);
        }
        
        return $data;
    }

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
                $query->whereRaw('1 = 0'); // No mostrar nada
            }
        }
        
        return $query->get()->map(function ($prefijo) {
            return [
                'id' => $prefijo->id,
                'codigo' => $prefijo->codigo,
                'descripcion' => $prefijo->descripcion,
                'comercial_nombre' => $prefijo->comercial_nombre,
                'display_text' => $prefijo->comercial_nombre 
                    ? "{$prefijo->comercial_nombre} - {$prefijo->codigo}"
                    : "{$prefijo->codigo} - {$prefijo->descripcion}",
            ];
        });
    }
    
    public function aplicarFiltroPrefijo($query, ?string $prefijoId): void
    {
        if ($prefijoId && $prefijoId !== '') {
            $query->where('prefijo_id', $prefijoId);
        }
    }
    
    public function getPrefijoUsuarioComercial($usuario): ?array
    {
        if ($usuario->rol_id == 5) { // rol_id 5 = comercial
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
                    'id' => $prefijo->id,
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
}