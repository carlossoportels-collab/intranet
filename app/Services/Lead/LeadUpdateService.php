<?php
// app/Services/Lead/LeadUpdateService.php

namespace App\Services\Lead;

use App\Models\Lead;
use App\DTOs\LeadUpdateData;
use App\Models\EstadoLead;
use App\Traits\HasPermisosService; // 🔥 IMPORTAR TRAIT
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LeadUpdateService
{
    use HasPermisosService; // 🔥 AGREGAR TRAIT

    public function __construct(
        private LeadAuditService $auditService,
        private LeadStateTransitionService $stateService
    ) {
        $this->initializePermisoService(); // 🔥 INICIALIZAR
    }

    public function updateLead(LeadUpdateData $data): array
    {
        $lead = Lead::findOrFail($data->leadId);
        
        // Verificar permisos (si aplica)
        $this->verificarPermisos($lead);
        
        // Guardar estado anterior para auditoría
        $estadoAnterior = $lead->estadoLead;
        
        DB::beginTransaction();
        
        try {
            // Actualizar solo los campos proporcionados
            $cambios = $lead->update($data->toArray());
            
            if (!$cambios) {
                DB::commit();
                return [
                    'success' => true,
                    'message' => 'No se realizaron cambios',
                    'lead' => $lead->fresh()
                ];
            }
            
            // Registrar auditoría si cambió el estado
            if ($data->estadoLeadId && $estadoAnterior && $estadoAnterior->id != $data->estadoLeadId) {
                $nuevoEstado = EstadoLead::find($data->estadoLeadId);
                $this->auditService->registrarCambioEstado(
                    $lead->id,
                    $estadoAnterior,
                    $nuevoEstado,
                    $data->usuarioId,
                    'Actualización manual'
                );
            }
            
            DB::commit();
            
            Log::info('Lead actualizado', [
                'lead_id' => $lead->id,
                'usuario_id' => $data->usuarioId,
                'cambios' => array_keys($data->toArray())
            ]);
            
            return [
                'success' => true,
                'message' => 'Lead actualizado exitosamente',
                'lead' => $lead->fresh()
            ];
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Error actualizando lead:', [
                'lead_id' => $lead->id,
                'error' => $e->getMessage()
            ]);
            
            return [
                'success' => false,
                'message' => 'Error al actualizar el lead: ' . $e->getMessage(),
                'lead' => null
            ];
        }
    }

    private function verificarPermisos(Lead $lead): void
    {
        $usuario = auth()->user();
        
        if ($usuario->ve_todas_cuentas) {
            return;
        }

        $prefijosPermitidos = $this->getPrefijosPermitidos($usuario->id);
        
        if (empty($prefijosPermitidos) || !in_array($lead->prefijo_id, $prefijosPermitidos)) {
            abort(403, 'No tiene permisos para modificar este lead');
        }
    }
}