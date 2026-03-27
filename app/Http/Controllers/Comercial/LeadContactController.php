<?php
namespace App\Http\Controllers\Comercial;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use App\Models\Comentario;
use App\Models\TipoComentario;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class LeadContactController extends Controller
{
    /**
     * Método ORIGINAL que mantiene compatibilidad con la ruta existente
     * Este método ahora redirige al nuevo flujo
     */
    public function contactarWhatsApp(Request $request, $leadId)
    {
        // Redirigir al nuevo método contactarLead con el parámetro click=0
        // para que muestre la página intermedia
        $telefono = $request->query('phone');
        $mensaje = $request->query('msg', '');
        
        $url = route('lead.contactar', ['lead' => $leadId]);
        $url .= "?phone={$telefono}&msg=" . urlencode($mensaje);
        
        return redirect()->away($url);
    }
    
    /**
     * Endpoint PÚBLICO para PREVISUALIZACIÓN (NO registra contacto)
     */
    public function previewInfo(Request $request, $leadId)
    {
        try {
            $lead = Lead::with('comercial.personal')->findOrFail($leadId);
            
            return response()->view('whatsapp.preview', [
                'lead' => $lead,
                'leadId' => $leadId,
                'nombreLead' => $lead->nombre_completo
            ])->header('X-Robots-Tag', 'noindex, nofollow');
            
        } catch (\Exception $e) {
            Log::error('Error en preview:', ['error' => $e->getMessage()]);
            abort(404);
        }
    }
    
    /**
     * Endpoint PÚBLICO que SOLO registra contacto si viene el parámetro 'click=1'
     */
    public function contactarLead(Request $request, $leadId)
    {
        try {
            // Si NO viene el parámetro 'click', mostrar página intermedia con botón
            if (!$request->has('click')) {
                $lead = Lead::with('comercial.personal')->findOrFail($leadId);
                
                return view('whatsapp.contactar', [
                    'lead' => $lead,
                    'leadId' => $leadId,
                    'telefono' => $request->query('phone'),
                    'mensaje' => $request->query('msg', '')
                ]);
            }
            
            // Si viene click=1, entonces SÍ registramos el contacto
            DB::beginTransaction();
            
            $lead = Lead::with(['comercial.personal', 'estadoLead'])->findOrFail($leadId);
            
            if (!$lead->comercial) {
                Log::warning('Lead sin comercial asignado', ['lead_id' => $leadId]);
                $telefono = $request->query('phone');
                if (!empty($telefono)) {
                    $telefonoLimpio = preg_replace('/\D/', '', $telefono);
                    return redirect()->away("https://wa.me/{$telefonoLimpio}");
                }
                abort(404, 'Lead sin comercial asignado');
            }

            $telefono = $request->query('phone');
            $mensaje = $request->query('msg', '');
            $usuarioSistemaId = 9999;
            
            $comercial = $lead->comercial;
            $nombreComercial = $comercial->personal->nombre_completo ?? 'Comercial';
            
            // Verificar si ya se registró contacto
            $comentarioExistente = Comentario::where('lead_id', $leadId)
                ->where('tipo_comentario_id', 1)
                ->where('usuario_id', $usuarioSistemaId)
                ->exists();
            
            if (!$comentarioExistente) {
                $comentario = Comentario::create([
                    'lead_id' => $leadId,
                    'usuario_id' => $usuarioSistemaId,
                    'tipo_comentario_id' => 1,
                    'comentario' => "📱 {$nombreComercial} contactó al lead a través del enlace de WhatsApp",
                    'created' => now()
                ]);
                
                Log::info('Contacto registrado desde clic real', [
                    'lead_id' => $leadId,
                    'comentario_id' => $comentario->id
                ]);
                
                // Actualizar estado
                if ($lead->estado_lead_id != 2) {
                    $lead->estado_lead_id = 2;
                    $lead->modified = now();
                    $lead->modified_by = $usuarioSistemaId;
                    $lead->save();
                }
                
                // Obtener ID del usuario comercial
                $usuarioComercial = DB::table('usuarios')
                    ->where('personal_id', $comercial->personal_id)
                    ->value('id');
                
                // Crear recordatorio y eliminar notificaciones (si existe el servicio)
                if ($usuarioComercial && $comentario && isset($this->notificationService)) {
                    try {
                        $tipoComentario = TipoComentario::find(1);
                        
                        if ($tipoComentario && method_exists($this->notificationService, 'crearNotificacionRecordatorio')) {
                            $this->notificationService->crearNotificacionRecordatorio(
                                $comentario,
                                $tipoComentario,
                                7,
                                $usuarioComercial
                            );
                        }
                        
                        if (method_exists($this->notificationService, 'eliminarNotificacionesPendientes')) {
                            $this->notificationService->eliminarNotificacionesPendientes(
                                $leadId,
                                $usuarioComercial,
                                $comentario->id
                            );
                        }
                    } catch (\Exception $e) {
                        Log::warning('Error en notificaciones', ['error' => $e->getMessage()]);
                    }
                }
            } else {
                Log::info('Contacto ya registrado previamente', ['lead_id' => $leadId]);
            }
            
            DB::commit();
            
            // Preparar mensaje para WhatsApp
            if (empty($mensaje)) {
                $primerNombreLead = explode(' ', $lead->nombre_completo)[0];
                $companiaId = $comercial->compania_id;
                $nombreCompania = 'la empresa';
                if ($companiaId) {
                    $compania = DB::table('companias')->find($companiaId);
                    $nombreCompania = $compania ? $compania->nombre : 'la empresa';
                }
                $mensaje = "Hola {$primerNombreLead}, soy {$nombreComercial} asesor comercial de {$nombreCompania}. En que puedo ayudarte?";
            }
            
            // Redirigir a WhatsApp
            if (!empty($telefono)) {
                $telefonoLimpio = preg_replace('/\D/', '', $telefono);
                $mensajeCodificado = urlencode($mensaje);
                
                return redirect()->away("https://wa.me/{$telefonoLimpio}?text={$mensajeCodificado}");
            }
            
            return redirect()->to('/')->with('error', 'No se pudo iniciar la conversación');
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error registrando contacto:', [
                'error' => $e->getMessage(),
                'lead_id' => $leadId,
                'trace' => $e->getTraceAsString()
            ]);
            
            $telefono = $request->query('phone');
            if (!empty($telefono)) {
                $telefonoLimpio = preg_replace('/\D/', '', $telefono);
                return redirect()->away("https://wa.me/{$telefonoLimpio}");
            }
            
            abort(404, 'Lead no encontrado');
        }
    }
}