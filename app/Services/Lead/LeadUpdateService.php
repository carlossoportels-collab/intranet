<?php
// app/Services/Lead/LeadUpdateService.php

namespace App\Services\Lead;

use App\Models\Lead;
use App\DTOs\LeadUpdateData;
use App\Models\EstadoLead;
use App\Models\SeguimientoPerdida;
use App\Traits\HasPermisosService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LeadUpdateService
{
    use HasPermisosService;

    public function __construct(
        private LeadAuditService $auditService,
        private LeadStateTransitionService $stateService
    ) {
        $this->initializePermisoService();
    }


public function updateLead(LeadUpdateData $data): array
{
    $lead = Lead::findOrFail($data->leadId);
    
    $this->verificarPermisos($lead);
    
    $estadoAnterior = $lead->estadoLead;
    $tiposPerdidos = ['final_negativo', 'recontacto'];
    $idsPerdidos = [8, 13, 14, 15, 16, 17];
    $eraPerdido = in_array($estadoAnterior?->tipo, $tiposPerdidos) || in_array($estadoAnterior?->id, $idsPerdidos);
    
    DB::beginTransaction();
    
    try {
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
            
            // 🔥 Detectar recuperación: si venía de estado perdido y ahora es cliente o ganado
            $ahoraEsCliente = $lead->es_cliente == 1 || ($nuevoEstado && $nuevoEstado->tipo === 'final_positivo');
            
            if ($eraPerdido && $ahoraEsCliente) {
                $this->marcarComoRecuperado($lead, $data->usuarioId);
            }
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

/**
 * Marcar lead como recuperado
 */
private function marcarComoRecuperado(Lead $lead, int $usuarioId): void
{
    try {
        $seguimiento = DB::table('seguimientos_perdida')
            ->where('lead_id', $lead->id)
            ->whereNull('deleted_at')
            ->first();
        
        if ($seguimiento && !$seguimiento->restaurado) {
            DB::table('seguimientos_perdida')
                ->where('id', $seguimiento->id)
                ->update([
                    'restaurado' => 1,
                    'fecha_restauracion' => now(),
                    'restaurado_por' => $usuarioId,
                ]);
        }
    } catch (\Exception $e) {
        Log::error('Error al marcar lead como recuperado', [
            'lead_id' => $lead->id,
            'error' => $e->getMessage()
        ]);
    }
}
    
    /**
     * Verificar si un estado es considerado "perdido" (puede ser recuperable)
     */
    private function esEstadoPerdido(?EstadoLead $estado): bool
    {
        if (!$estado) {
            return false;
        }
        
        // Tipos que indican que el lead estaba perdido
        $tiposPerdidos = ['final_negativo', 'recontacto'];
        
        // IDs específicos de estados perdidos (por si acaso)
        $idsPerdidos = [8, 14, 15]; // Perdido, Rechazo Definitivo, Sin Potencial
        
        return in_array($estado->tipo, $tiposPerdidos) || in_array($estado->id, $idsPerdidos);
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