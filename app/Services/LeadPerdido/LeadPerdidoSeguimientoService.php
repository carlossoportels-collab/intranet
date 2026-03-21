<?php
// app/Services/LeadPerdido/LeadPerdidoSeguimientoService.php

namespace App\Services\LeadPerdido;

use App\Models\Lead;
use App\Models\Comentario;
use App\Models\TipoComentario;
use App\DTOs\SeguimientoPerdidoData;
use App\Traits\HasPermisosService; // 🔥 IMPORTAR TRAIT
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LeadPerdidoSeguimientoService
{
    use HasPermisosService; // 🔥 AGREGAR TRAIT

    protected LeadPerdidoNotificationService $notificationService;
    protected LeadPerdidoStateService $stateService;

    public function __construct(
        LeadPerdidoNotificationService $notificationService,
        LeadPerdidoStateService $stateService
    ) {
        $this->notificationService = $notificationService;
        $this->stateService = $stateService;
        $this->initializePermisoService(); // 🔥 INICIALIZAR
    }

    /**
     * Procesar un nuevo seguimiento para lead perdido
     * 
     * @return array [success, message, lead]
     */
    public function procesarSeguimiento(SeguimientoPerdidoData $data): array
    {
        $lead = Lead::findOrFail($data->leadId);
        $tipoComentario = TipoComentario::findOrFail($data->tipoComentarioId);

        DB::beginTransaction();

        try {
            // 1. Crear comentario
            $comentario = Comentario::create([
                'lead_id' => $data->leadId,
                'usuario_id' => $data->usuarioId,
                'tipo_comentario_id' => $data->tipoComentarioId,
                'comentario' => $data->comentario,
                'created' => now()
            ]);

            $mensaje = 'Seguimiento registrado exitosamente';

            // 2. Crear notificaciones si corresponde
            if ($data->creaRecordatorio && $data->fechaRecordatorio) {
                $this->notificationService->crearNotificacionSeguimiento(
                    $comentario,
                    $tipoComentario,
                    $data->fechaRecordatorio,
                    $data->usuarioId
                );
                $mensaje .= ' con recordatorio';

                // Eliminar notificaciones futuras existentes
                $this->notificationService->eliminarNotificacionesRecontactoFuturas(
                    $data->leadId,
                    $data->usuarioId,
                    $comentario->id
                );

                // Crear notificación de recontacto específica si no es rechazo definitivo
                if ($tipoComentario->nombre !== 'Rechazo definitivo') {
                    $this->notificationService->crearNotificacionRecontacto(
                        $lead,
                        $data->fechaRecordatorio,
                        $data->usuarioId,
                        $comentario->id
                    );
                    $mensaje .= ' y notificación de recontacto programada';
                }
            }

            // 3. Cambiar estado del lead si corresponde
            if ($data->cambiarEstadoLead) {
                $estadoCambiado = $this->stateService->cambiarEstadoPorComentario(
                    $lead,
                    $tipoComentario,
                    $data->usuarioId
                );
                if ($estadoCambiado) {
                    $mensaje .= ' y estado actualizado';
                }
            }

            DB::commit();

            return [
                'success' => true,
                'message' => $mensaje,
                'lead' => $lead->fresh(['estadoLead', 'comentarios'])
            ];

        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Error al procesar seguimiento:', [
                'lead_id' => $data->leadId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'message' => 'Error al guardar el seguimiento: ' . $e->getMessage(),
                'lead' => null
            ];
        }
    }

    /**
     * Verificar permisos para acceder a un lead
     */
    public function verificarPermisos(Lead $lead): void
    {
        $usuario = auth()->user();
        
        if ($usuario->ve_todas_cuentas) {
            return;
        }

        $prefijosPermitidos = $this->getPrefijosPermitidos($usuario->id);
        
        if (empty($prefijosPermitidos) || !in_array($lead->prefijo_id, $prefijosPermitidos)) {
            abort(403, 'No tiene permisos para acceder a este recurso');
        }
    }
}