<?php
// app/Http/Controllers/Comercial/LeadContactController.php

namespace App\Http\Controllers\Comercial;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Comentario;
use App\Models\TipoComentario;
use App\Models\EstadoLead;
use App\Services\Lead\Notifications\LeadCommentNotificationService;
use App\Traits\Authorizable; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LeadContactController extends Controller
{
    use Authorizable; 

    private LeadCommentNotificationService $notificationService;

    public function __construct(LeadCommentNotificationService $notificationService)
    {
        $this->notificationService = $notificationService;
        $this->initializeAuthorization(); 
    }

    public function contactarWhatsApp(Request $request, $leadId)
    {
        try {
            DB::beginTransaction();
            
            // Cargar el lead con relaciones necesarias
            $lead = Lead::with(['comercial.personal', 'estadoLead'])->findOrFail($leadId);
                    
           
            // Verificar que el lead tiene un comercial asignado
            if (!$lead->comercial) {
                Log::warning('Lead sin comercial asignado', ['lead_id' => $leadId]);
                if (!empty($telefono)) {
                    $telefonoLimpio = preg_replace('/\D/', '', $telefono);
                    return redirect()->away("https://wa.me/{$telefonoLimpio}");
                }
                abort(404, 'Lead sin comercial asignado');
            }

            $telefono = $request->query('phone');
            $mensaje = $request->query('msg', '');
            
            $usuarioSistemaId = 9999; // Usuario de sistema
            
            // Obtener datos del comercial ASIGNADO al lead
            $comercial = $lead->comercial;
            $nombreComercial = $comercial->personal->nombre_completo ?? 'Comercial';
            $companiaId = $comercial->compania_id;
            
            // Obtener nombre de la compañía
            $nombreCompania = 'la empresa';
            if ($companiaId) {
                $compania = DB::table('companias')->find($companiaId);
                $nombreCompania = $compania ? $compania->nombre : 'la empresa';
            }
            
            // Obtener el ID del usuario comercial (para notificaciones)
            $usuarioComercial = DB::table('usuarios')
                ->where('personal_id', $comercial->personal_id)
                ->value('id');
            
            // ===== 1. CREAR COMENTARIO DE CONTACTO =====
            $comentario = Comentario::create([
                'lead_id' => $leadId,
                'usuario_id' => $usuarioSistemaId,
                'tipo_comentario_id' => 1, // Contacto inicial
                'comentario' => "📱 {$nombreComercial} contacto al lead a traves del link",
                'created' => now()
            ]);
            
            
            // ===== 2. CAMBIAR ESTADO DEL LEAD A "CONTACTADO" (ID 2) =====
            $estadoAnterior = $lead->estado_lead_id;
            $nuevoEstadoId = 2; // ID del estado "Contactado"
            
            if ($estadoAnterior != $nuevoEstadoId) {
                $lead->estado_lead_id = $nuevoEstadoId;
                $lead->modified = now();
                $lead->modified_by = $usuarioSistemaId;
                $lead->save();
                
                Log::info('Estado de lead actualizado', [
                    'lead_id' => $leadId,
                    'estado_anterior' => $estadoAnterior,
                    'estado_nuevo' => $nuevoEstadoId
                ]);
            }
            
            // ===== 3. CREAR RECORDATORIO PARA 7 DÍAS =====
            if ($usuarioComercial) {
                $tipoComentario = TipoComentario::find(1); // Contacto inicial
                
                $this->notificationService->crearNotificacionRecordatorio(
                    $comentario,
                    $tipoComentario,
                    7, // 7 días
                    $usuarioComercial // Usamos el ID del usuario, no el prefijo_id
                );
                
                Log::info('Recordatorio creado para 7 días', [
                    'lead_id' => $leadId,
                    'usuario_comercial' => $usuarioComercial
                ]);
            }
            
            // ===== 4. ELIMINAR NOTIFICACIONES DE "LEAD SIN CONTACTAR" =====
            $eliminadas = 0;
            if ($usuarioComercial) {
                // Pasar el ID del comentario que acabamos de crear para EXCLUIRLO
                $eliminadas = $this->notificationService->eliminarNotificacionesPendientes(
                    $leadId, 
                    $usuarioComercial,
                    $comentario->id // Excluir este comentario
                );
                
                Log::info('Notificaciones eliminadas', [
                    'lead_id' => $leadId,
                    'excluido_comentario_id' => $comentario->id,
                    'cantidad' => $eliminadas
                ]);
            }
                        
            DB::commit();
            
            // ===== 5. MENSAJE PARA WHATSAPP =====
            if (empty($mensaje)) {
                $primerNombreLead = explode(' ', $lead->nombre_completo)[0];
                $mensaje = "Hola {$primerNombreLead}, soy {$nombreComercial} de {$nombreCompania}.";
            }
            
            // Redirigir a WhatsApp
            if (!empty($telefono)) {
                $telefonoLimpio = preg_replace('/\D/', '', $telefono);
                $mensajeCodificado = urlencode($mensaje);
                
                return redirect()->away("https://wa.me/{$telefonoLimpio}?text={$mensajeCodificado}");
            }
            
            return redirect()->back()->with('error', 'No se proporcionó número de teléfono');
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Error en contacto WhatsApp:', [
                'error' => $e->getMessage(),
                'lead_id' => $leadId,
                'trace' => $e->getTraceAsString()
            ]);
            
            if (!empty($telefono)) {
                $telefonoLimpio = preg_replace('/\D/', '', $telefono);
                return redirect()->away("https://wa.me/{$telefonoLimpio}");
            }
            
            abort(404, 'Lead no encontrado o teléfono inválido');
        }
    }
}