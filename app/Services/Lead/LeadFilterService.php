<?php
// app/Services/Lead/LeadFilterService.php

namespace App\Services\Lead;

use App\Models\Lead;
use App\Models\EstadoLead;
use App\Models\Prefijo;
use App\Models\Comercial;
use App\Traits\HasPermisosService; // 🔥 IMPORTAR TRAIT
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Collection;

class LeadFilterService
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
        return EstadoLead::whereIn('tipo', ['recontacto', 'final_negativo'])
            ->where('activo', 1)
            ->pluck('id')
            ->toArray();
    }
    
    public function getQueryBase(): \Illuminate\Database\Eloquent\Builder
    {
        return Lead::query()
            ->with(['origen', 'estadoLead', 'localidad.provincia', 'rubro', 'comercial.personal', 'notas.usuario.personal'])
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

        if (!empty($filters['prefijo_id'])) {
            $this->aplicarFiltroPrefijo($query, $filters['prefijo_id']);
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
        
    public function getConteoComentarios(array $leadIds): array
    {
        if (empty($leadIds)) {
            return [];
        }

        // Comentarios actuales (tabla comentarios)
        $comentariosActuales = DB::table('comentarios')
            ->select('lead_id', DB::raw('COUNT(*) as total'))
            ->whereIn('lead_id', $leadIds)
            ->whereNull('deleted_at')
            ->groupBy('lead_id')
            ->pluck('total', 'lead_id')
            ->toArray();

        // Comentarios legacy (tabla comentarios_legacy)
        $comentariosLegacy = DB::table('comentarios_legacy')
            ->select('lead_id', DB::raw('COUNT(*) as total'))
            ->whereIn('lead_id', $leadIds)
            ->groupBy('lead_id')
            ->pluck('total', 'lead_id')
            ->toArray();

        // Combinar resultados
        $resultado = [];
        foreach ($leadIds as $leadId) {
            $total = ($comentariosActuales[$leadId] ?? 0) + ($comentariosLegacy[$leadId] ?? 0);
            if ($total > 0) {
                $resultado[$leadId] = $total;
            }
        }

        return $resultado;
    }

    public function getConteoPresupuestos(array $leadIds): array
    {
        if (empty($leadIds)) {
            return [];
        }
        
        // Presupuestos actuales (tabla presupuestos)
        $presupuestosActuales = DB::table('presupuestos')
            ->select('lead_id', DB::raw('COUNT(*) as total'))
            ->whereIn('lead_id', $leadIds)
            ->whereNull('deleted_at')
            ->groupBy('lead_id')
            ->pluck('total', 'lead_id')
            ->toArray();

        // Presupuestos legacy (tabla presupuestos_legacy)
        $presupuestosLegacy = DB::table('presupuestos_legacy')
            ->select('lead_id', DB::raw('COUNT(*) as total'))
            ->whereIn('lead_id', $leadIds)
            ->groupBy('lead_id')
            ->pluck('total', 'lead_id')
            ->toArray();

        // Combinar resultados
        $resultado = [];
        foreach ($leadIds as $leadId) {
            $total = ($presupuestosActuales[$leadId] ?? 0) + ($presupuestosLegacy[$leadId] ?? 0);
            if ($total > 0) {
                $resultado[$leadId] = $total;
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