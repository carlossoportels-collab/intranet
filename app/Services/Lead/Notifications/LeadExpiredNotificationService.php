<?php
// app/Services/Lead/Notifications/LeadExpiredNotificationService.php

namespace App\Services\Lead\Notifications;

use App\Models\Lead;
use App\Models\EstadoLead;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Cache;
use Carbon\Carbon;

class LeadExpiredNotificationService
{
    private ?array $estadosExcluirIds = null;
    private bool $estadosCargados = false;
    private int $diasInactividadVencimiento = 45; // 45 días sin actividad
    
    /**
     * Constructor - SIN CONSULTAS A DB
     */
    public function __construct()
    {
        // No hacer consultas aquí
        // Los estados se cargarán bajo demanda con getEstadosExcluirIds()
    }
    
    /**
     * Obtener IDs de estados que deben excluirse (carga lazy)
     */
    private function getEstadosExcluirIds(): array
    {
        // Si ya están cargados, devolverlos
        if ($this->estadosCargados) {
            return $this->estadosExcluirIds ?? [];
        }

        // Si estamos en consola/build, evitar consultas a DB
        if ($this->shouldSkipDatabase()) {
            Log::info('Saltando consulta de estados excluir en entorno de build/consola');
            $this->estadosExcluirIds = [];
            $this->estadosCargados = true;
            return [];
        }

        try {
            // Usar cache para reducir consultas repetitivas
            $this->estadosExcluirIds = Cache::remember('estados_excluir_ids', 3600, function () {
                return EstadoLead::whereIn('tipo', ['final_negativo', 'final_positivo', 'recontacto'])
                    ->where('activo', 1)
                    ->pluck('id')
                    ->toArray();
            });

        } catch (\Exception $e) {
            // Si hay error (ej: DB no disponible), loguear y devolver array vacío
            Log::warning('No se pudieron cargar estados a excluir: ' . $e->getMessage());
            $this->estadosExcluirIds = [];
        }

        $this->estadosCargados = true;
        return $this->estadosExcluirIds ?? [];
    }

    /**
     * Determina si debemos evitar consultas a DB
     */
    private function shouldSkipDatabase(): bool
    {
        return app()->runningInConsole() || 
               app()->environment('production') && !$this->databaseAvailable();
    }

    /**
     * Verifica si la base de datos está disponible
     */
    private function databaseAvailable(): bool
    {
        try {
            DB::connection()->getPdo();
            return true;
        } catch (\Exception $e) {
            return false;
        }
    }

    /**
     * Verifica leads que llevan 45 días sin cambiar de estado
     * Los marca como vencidos (estado_lead_id = 9) y crea notificaciones
     * 
     * Lógica:
     * - Se marcan leads con más de 45 días sin actividad
     * - Se EXCLUYEN leads que tienen recordatorios NO LEÍDOS
     *   (Si el comercial tiene un recordatorio pendiente, no se marca como vencido)
     */
    public function verificarLeadsVencidos(): array
    {
        $procesados = 0;
        $notificaciones = 0;
        $estadoVencido = 9; // ID del estado "Vencido"

        try {
            // Obtener estados excluir
            $estadosExcluirBase = $this->getEstadosExcluirIds();
            $estadosExcluir = array_merge($estadosExcluirBase, [$estadoVencido]);
            
            $fechaLimite = Carbon::now()->subDays($this->diasInactividadVencimiento);
            
            // Buscar leads que cumplan las condiciones
            $leadsVencidos = Lead::where('es_cliente', 0)
                ->where('es_activo', 1)
                ->whereNotIn('estado_lead_id', $estadosExcluir)
                ->where(function($query) use ($fechaLimite) {
                    $query->whereNotNull('modified')
                          ->where('modified', '<=', $fechaLimite)
                          ->orWhere(function($q) use ($fechaLimite) {
                              $q->whereNull('modified')
                                ->where('created', '<=', $fechaLimite);
                          });
                })
                // Excluir leads que tienen recordatorios NO LEÍDOS
                ->whereDoesntHave('recordatoriosNoLeidos')
                ->get();

            foreach ($leadsVencidos as $lead) {
                DB::beginTransaction();
                
                try {
                    // Guardar estado anterior para auditoría
                    $estadoAnterior = $lead->estado_lead_id;
                    $estadoAnteriorObj = EstadoLead::find($estadoAnterior);
                    
                    // Calcular días ANTES de modificar el lead
                    $fechaOriginal = $lead->getOriginal('modified') ?? $lead->getOriginal('created');
                    $diasSinCambio = Carbon::parse($fechaOriginal)->diffInDays(now());
                    
                    // Cambiar estado a vencido
                    $lead->estado_lead_id = $estadoVencido;
                    $lead->modified = now();
                    $lead->save();
                    
                    // Buscar el comercial asignado
                    $comercialUsuarioId = $this->getComercialUsuarioId($lead->prefijo_id);
                    
                    if ($comercialUsuarioId) {
                        // Crear notificación con los días calculados
                        $this->crearNotificacionVencido($comercialUsuarioId, $lead, $estadoAnteriorObj, $diasSinCambio);
                        $notificaciones++;
                    } else {
                        Log::warning('No se encontró comercial asignado para lead vencido', [
                            'lead_id' => $lead->id,
                            'prefijo_id' => $lead->prefijo_id
                        ]);
                    }
                    
                    DB::commit();
                    $procesados++;
                    
                    Log::info('Lead marcado como vencido', [
                        'lead_id' => $lead->id,
                        'nombre' => $lead->nombre_completo,
                        'estado_anterior' => $estadoAnteriorObj?->nombre,
                        'dias_sin_cambio' => $diasSinCambio,
                        'prefijo_id' => $lead->prefijo_id
                    ]);
                    
                } catch (\Exception $e) {
                    DB::rollBack();
                    Log::error('Error procesando lead vencido', [
                        'lead_id' => $lead->id,
                        'error' => $e->getMessage()
                    ]);
                }
            }

            return [
                'procesados' => $procesados,
                'notificaciones' => $notificaciones
            ];

        } catch (\Exception $e) {
            Log::error('Error en verificación de leads vencidos', [
                'error' => $e->getMessage()
            ]);
            
            return [
                'procesados' => 0,
                'notificaciones' => 0,
                'error' => $e->getMessage()
            ];
        }
    }

    /**
     * Obtener ID de usuario del comercial asignado al prefijo
     */
    private function getComercialUsuarioId(int $prefijoId): ?int
    {
        return DB::table('comercial as c')
            ->join('personal as p', 'c.personal_id', '=', 'p.id')
            ->join('usuarios as u', 'p.id', '=', 'u.personal_id')
            ->where('c.prefijo_id', $prefijoId)
            ->where('c.activo', 1)
            ->value('u.id');
    }

    /**
     * Crear notificación de lead vencido
     */
    private function crearNotificacionVencido(int $usuarioId, Lead $lead, ?EstadoLead $estadoAnterior, int $dias): void
    {
        $nombreEstadoAnterior = $estadoAnterior?->nombre ?? 'desconocido';
        
        DB::table('notificaciones')->insert([
            'usuario_id' => $usuarioId,
            'titulo' => 'Lead vencido por inactividad',
            'mensaje' => "El lead {$lead->nombre_completo} lleva {$dias} días en estado '{$nombreEstadoAnterior}' sin actividad y ha sido marcado como vencido automáticamente.",
            'tipo' => 'lead_vencido',
            'entidad_tipo' => 'lead',
            'entidad_id' => $lead->id,
            'leida' => false,
            'fecha_notificacion' => now(),
            'prioridad' => 'alta',
            'created' => now()
        ]);
        
        Log::info('Notificación de lead vencido creada', [
            'usuario_id' => $usuarioId,
            'lead_id' => $lead->id,
            'dias' => $dias
        ]);
    }

    /**
     * Método público para obtener estados excluir (si se necesita desde afuera)
     */
    public function obtenerEstadosExcluir(): array
    {
        return $this->getEstadosExcluirIds();
    }
    
    /**
     * Método público para obtener días de inactividad para vencimiento
     */
    public function getDiasInactividadVencimiento(): int
    {
        return $this->diasInactividadVencimiento;
    }
}