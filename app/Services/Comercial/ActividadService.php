<?php
// app/Services/Comercial/ActividadService.php

namespace App\Services\Comercial;

use App\Models\Contrato;
use App\Models\Presupuesto;
use App\Models\Lead;
use App\Models\Comentario;
use App\Models\Comercial;
use App\Models\Prefijo;
use App\Models\EstadoLead;
use App\Models\EstadoEntidad;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;
use Carbon\Carbon;

class ActividadService
{
    /**
     * Obtener estadísticas mejoradas
     */
    public function getEstadisticas($comercialId = null, $fechaInicio = null, $fechaFin = null)
    {
        $queryLead = Lead::query();
        $queryPresupuesto = Presupuesto::query();
        $queryContrato = Contrato::query();
        
        // Aplicar filtro de comercial si se especifica
        $prefijosIds = $this->getPrefijosFiltro($comercialId);
        if (!empty($prefijosIds)) {
            $queryLead->whereIn('prefijo_id', $prefijosIds);
            $queryPresupuesto->whereIn('prefijo_id', $prefijosIds);
            $queryContrato->where(function($q) use ($prefijosIds) {
                $q->whereHas('presupuesto', function($sub) use ($prefijosIds) {
                    $sub->whereIn('prefijo_id', $prefijosIds);
                })->orWhereHas('empresa', function($sub) use ($prefijosIds) {
                    $sub->whereIn('prefijo_id', $prefijosIds);
                });
            });
        }
        
        // Aplicar filtro de fechas
        if ($fechaInicio) {
            $queryLead->whereDate('created', '>=', $fechaInicio);
            $queryPresupuesto->whereDate('created', '>=', $fechaInicio);
            $queryContrato->whereDate('created', '>=', $fechaInicio);
        }
        if ($fechaFin) {
            $queryLead->whereDate('created', '<=', $fechaFin);
            $queryPresupuesto->whereDate('created', '<=', $fechaFin);
            $queryContrato->whereDate('created', '<=', $fechaFin);
        }
        
        // Contactos - con estados y colores de la DB
        $contactos = $queryLead->with('estadoLead')->get();
        
        // Presupuestos - con estados de estados_entidades
        $presupuestos = $queryPresupuesto->with('estado')->get();
        
        // Contratos - con tipo de operación
        $contratos = $queryContrato->get();
        
        return [
            'contactos' => [
                'total' => $contactos->count(),
                'nuevos' => $contactos->where('created', '>=', now()->subDays(30))->count(),
                'por_estado' => $contactos->groupBy('estado_lead_id')->map(function($group) {
                    $estado = $group->first()->estadoLead;
                    return [
                        'label' => $estado ? $estado->nombre : 'Sin estado',
                        'valor' => $group->count(),
                        'color_hex' => $estado ? $estado->color_hex : '#6B7280'
                    ];
                })->values()
            ],
            'presupuestos' => [
                'total' => $presupuestos->count(),
                'nuevos' => $presupuestos->where('created', '>=', now()->subDays(30))->count(),
                'por_estado' => $presupuestos->groupBy('estado_id')->map(function($group) {
                    $estado = $group->first()->estado;
                    return [
                        'label' => $estado ? $estado->nombre : 'Sin estado',
                        'valor' => $group->count()
                    ];
                })->values()
            ],
            'contratos' => [
                'total' => $contratos->count(),
                'nuevos' => $contratos->where('created', '>=', now()->subDays(30))->count(),
                'por_tipo_operacion' => $contratos->groupBy('tipo_operacion')->map(function($group, $tipo) {
                    $labels = [
                        'venta_cliente' => 'Venta a Cliente',
                        'alta_nueva' => 'Alta Nueva',
                        'cambio_titularidad' => 'Cambio Titularidad',
                        'cambio_razon_social' => 'Cambio Razón Social',
                        'cambio_smartsat' => 'Cambio SmartSat'
                    ];
                    return [
                        'label' => $labels[$tipo] ?? $tipo,
                        'valor' => $group->count()
                    ];
                })->values()
            ]
        ];
    }
    
    /**
     * Obtener actividad reciente con último comentario
     */
    public function getActividadReciente($comercialId = null, $fechaInicio = null, $fechaFin = null, $limit = 300)
    {
        $actividad = collect();
        
        // Obtener prefijos permitidos
        $prefijosIds = $this->getPrefijosFiltro($comercialId);
        
        // 1. Leads creados con último comentario
        $leadsQuery = Lead::with(['prefijo', 'estadoLead', 'comentarios' => function($q) {
                $q->orderBy('created', 'desc')->limit(1);
            }])
            ->where('es_activo', true);
        
        if (!empty($prefijosIds)) {
            $leadsQuery->whereIn('prefijo_id', $prefijosIds);
        }
        
        if ($fechaInicio) {
            $leadsQuery->whereDate('created', '>=', $fechaInicio);
        }
        if ($fechaFin) {
            $leadsQuery->whereDate('created', '<=', $fechaFin);
        }
        
        $leads = $leadsQuery->orderBy('created', 'desc')->limit($limit)->get();
        
        foreach ($leads as $lead) {
            $ultimoComentario = $lead->comentarios->first();
            $estadoLead = $lead->estadoLead;
            
            $actividad->push([
                'id' => $lead->id,
                'fecha' => $lead->created,
                'fecha_formateada' => $this->formatearFecha($lead->created),
                'tipo_entidad' => 'LEAD',
                'nombre' => $lead->nombre_completo,
                'estado' => $estadoLead ? $estadoLead->nombre : 'Nuevo',
                'color_hex' => $estadoLead ? $estadoLead->color_hex : '#6B7280',
                'informacion' => $ultimoComentario ? $ultimoComentario->comentario : 'Sin comentarios',
                'prefijo' => $lead->prefijo ? $lead->prefijo->codigo : null,
                'url' => "/comercial/leads/{$lead->id}"
            ]);
        }
        
        // 2. Presupuestos creados
        $presupuestosQuery = Presupuesto::with(['lead', 'prefijo', 'estado', 'tasa', 'abono'])
            ->where('activo', true);
        
        if (!empty($prefijosIds)) {
            $presupuestosQuery->whereIn('prefijo_id', $prefijosIds);
        }
        
        if ($fechaInicio) {
            $presupuestosQuery->whereDate('created', '>=', $fechaInicio);
        }
        if ($fechaFin) {
            $presupuestosQuery->whereDate('created', '<=', $fechaFin);
        }
        
        $presupuestos = $presupuestosQuery->orderBy('created', 'desc')->limit($limit)->get();
        
        foreach ($presupuestos as $presupuesto) {
            $lead = $presupuesto->lead;
            $estado = $presupuesto->estado;
            $estadoId = $presupuesto->estado_id;
            
            $actividad->push([
                'id' => $presupuesto->id,
                'fecha' => $presupuesto->created,
                'fecha_formateada' => $this->formatearFecha($presupuesto->created),
                'tipo_entidad' => 'PRESUPUESTO',
                'nombre' => $lead ? $lead->nombre_completo : 'Sin lead',
                'estado' => $estado ? $estado->nombre : 'Sin estado',
                'estado_id' => $estadoId,
                'informacion' => $presupuesto->cantidad_vehiculos . ' vehículo(s) | Total: $' . number_format($presupuesto->total_presupuesto, 0, ',', '.'),
                'prefijo' => $presupuesto->prefijo ? $presupuesto->prefijo->codigo : null,
                'url' => "/comercial/presupuestos/{$presupuesto->id}"
            ]);
        }
        
        // 3. Contratos creados
        $contratosQuery = Contrato::with(['lead', 'empresa', 'estado', 'presupuesto'])
            ->where('activo', true);
        
        if (!empty($prefijosIds)) {
            $contratosQuery->where(function($q) use ($prefijosIds) {
                $q->whereHas('presupuesto', function($sub) use ($prefijosIds) {
                    $sub->whereIn('prefijo_id', $prefijosIds);
                })->orWhereHas('empresa', function($sub) use ($prefijosIds) {
                    $sub->whereIn('prefijo_id', $prefijosIds);
                });
            });
        }
        
        if ($fechaInicio) {
            $contratosQuery->whereDate('created', '>=', $fechaInicio);
        }
        if ($fechaFin) {
            $contratosQuery->whereDate('created', '<=', $fechaFin);
        }
        
        $contratos = $contratosQuery->orderBy('created', 'desc')->limit($limit)->get();
        
        foreach ($contratos as $contrato) {
            $tipoOperacion = $contrato->tipo_operacion;
            
            $prefijo = null;
            if ($contrato->presupuesto && $contrato->presupuesto->prefijo) {
                $prefijo = $contrato->presupuesto->prefijo->codigo;
            } elseif ($contrato->empresa && $contrato->empresa->prefijo) {
                $prefijo = $contrato->empresa->prefijo->codigo;
            }
            
            $actividad->push([
                'id' => $contrato->id,
                'fecha' => $contrato->created,
                'fecha_formateada' => $this->formatearFecha($contrato->created),
                'tipo_entidad' => 'CONTRATO',
                'nombre' => $contrato->cliente_nombre_completo ?: ($contrato->empresa ? $contrato->empresa->nombre_fantasia : 'Sin nombre'),
                'tipo_operacion' => $tipoOperacion,
                'informacion' => ($contrato->presupuesto_cantidad_vehiculos ?: 0) . ' vehículos',
                'prefijo' => $prefijo,
                'url' => "/comercial/contratos/{$contrato->id}"
            ]);
        }
        
        // Ordenar por fecha y limitar
        $actividad = $actividad->sortByDesc('fecha')->values()->take($limit);
        
        return $actividad;
    }
    
    /**
     * Obtener opciones de fechas rápidas
     */
    public function getOpcionesFechas()
    {
        return [
            ['id' => 'hoy', 'nombre' => 'Hoy', 'inicio' => now()->startOfDay()->format('Y-m-d'), 'fin' => now()->endOfDay()->format('Y-m-d')],
            ['id' => 'ayer', 'nombre' => 'Ayer', 'inicio' => now()->subDay()->startOfDay()->format('Y-m-d'), 'fin' => now()->subDay()->endOfDay()->format('Y-m-d')],
            ['id' => 'semana', 'nombre' => 'Esta semana', 'inicio' => now()->startOfWeek()->format('Y-m-d'), 'fin' => now()->endOfWeek()->format('Y-m-d')],
            ['id' => 'mes', 'nombre' => 'Este mes', 'inicio' => now()->startOfMonth()->format('Y-m-d'), 'fin' => now()->endOfMonth()->format('Y-m-d')],
            ['id' => 'mes_pasado', 'nombre' => 'Mes pasado', 'inicio' => now()->subMonth()->startOfMonth()->format('Y-m-d'), 'fin' => now()->subMonth()->endOfMonth()->format('Y-m-d')],
            ['id' => 'trimestre', 'nombre' => 'Este trimestre', 'inicio' => now()->startOfQuarter()->format('Y-m-d'), 'fin' => now()->endOfQuarter()->format('Y-m-d')],
            ['id' => 'anio', 'nombre' => 'Este año', 'inicio' => now()->startOfYear()->format('Y-m-d'), 'fin' => now()->endOfYear()->format('Y-m-d')],
        ];
    }
    
    /**
     * Obtener lista de comerciales para el selector
     */
    public function getComercialesList()
    {
        $comerciales = Comercial::with(['personal', 'prefijo'])
            ->where('activo', true)
            ->get()
            ->map(function($comercial) {
                $personal = $comercial->personal;
                $prefijo = $comercial->prefijo;
                return [
                    'id' => $comercial->id,
                    'nombre' => $personal ? $personal->nombre_completo : 'Sin nombre',
                    'email' => $personal ? $personal->email : null,
                    'prefijo_id' => $comercial->prefijo_id,
                    'prefijo_codigo' => $prefijo ? $prefijo->codigo : null
                ];
            });
        
        return $comerciales;
    }
    
    /**
     * Obtener comerciales con sus prefijos para el filtro
     */
    public function getComercialesConPrefijos()
    {
        $usuario = Auth::user();
        
        // Si es comercial, no mostrar selector de comerciales
        if ($usuario->rol_id == 5) {
            return collect();
        }
        
        return $this->getComercialesList()->map(function($comercial) {
            return [
                'id' => $comercial['id'],
                'nombre' => $comercial['nombre'],
                'prefijo_id' => $comercial['prefijo_id'],
                'es_mi_actividad' => false
            ];
        });
    }
    
    /**
     * Obtener el comercial del usuario actual (para rol comercial)
     */
    public function getComercialActual()
    {
        $usuario = Auth::user();
        
        if ($usuario->rol_id == 5) {
            $comercial = Comercial::where('personal_id', $usuario->personal_id)
                ->where('activo', true)
                ->first();
            
            if ($comercial) {
                $personal = $comercial->personal;
                return [
                    'id' => $comercial->id,
                    'nombre' => $personal ? $personal->nombre_completo : 'Mi actividad',
                    'prefijo_id' => $comercial->prefijo_id,
                    'prefijo_codigo' => $comercial->prefijo ? $comercial->prefijo->codigo : null
                ];
            }
        }
        
        return null;
    }
    
    private function getPrefijosFiltro($comercialId = null)
    {
        if ($comercialId) {
            return $this->getPrefijosByComercial($comercialId);
        }
        
        $usuario = Auth::user();
        
        if ($usuario->rol_id == 5) {
            $comercial = Comercial::where('personal_id', $usuario->personal_id)
                ->where('activo', true)
                ->first();
            if ($comercial && $comercial->prefijo_id) {
                return [$comercial->prefijo_id];
            }
            return [];
        }
        
        if (!$usuario->ve_todas_cuentas) {
            return $this->getPrefijosPermitidosParaUsuario();
        }
        
        return [];
    }
    
    private function getPrefijosByComercial($comercialId)
    {
        $comercial = Comercial::with('prefijo')->find($comercialId);
        if ($comercial && $comercial->prefijo_id) {
            return [$comercial->prefijo_id];
        }
        return [];
    }
    
    private function getPrefijosPermitidosParaUsuario()
    {
        return [];
    }
    
    private function formatearFecha($fecha)
    {
        if (!$fecha) {
            return '';
        }
        return Carbon::parse($fecha)->format('d/m/Y H:i');
    }
}