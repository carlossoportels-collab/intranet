<?php
// app/Http/Controllers/Comercial/Utils/Paso1LeadController.php

namespace App\Http\Controllers\Comercial\Utils;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class Paso1LeadController extends Controller
{
    /**
     * Crear nuevo lead (para cambio de titularidad)
     */
    public function store(Request $request)
    {
        try {
            Log::info('=== CREATE LEAD (Cambio Titularidad) ===', [
                'request_data' => $request->all(),
                'user_id' => auth()->id()
            ]);
            
            $validated = $request->validate([
                'nombre_completo' => 'required|string|max:100',
                'genero' => 'required|in:masculino,femenino,otro,no_especifica',
                'telefono' => 'required|string|max:20',
                'email' => 'required|email|max:150',
                'localidad_id' => 'required|exists:localidades,id',
                'rubro_id' => 'required|exists:rubros,id',
                'origen_id' => 'required|exists:origenes_contacto,id',
                'prefijo_id' => 'nullable|exists:prefijos,id',
            ]);

            // Obtener prefijo_id
            $prefijoId = $validated['prefijo_id'] ?? null;
            $usuario = auth()->user();
            
            // Si no viene prefijo_id y el usuario es comercial, usar su prefijo
            if (!$prefijoId && $usuario->rol_id == 5) {
                $comercial = \App\Models\Comercial::where('personal_id', $usuario->personal_id)
                    ->where('activo', 1)
                    ->first();
                if ($comercial) {
                    $prefijoId = $comercial->prefijo_id;
                }
            }
            
            // Si aún no hay prefijo_id, buscar un prefijo por defecto
            if (!$prefijoId) {
                $prefijoPorDefecto = \App\Models\Prefijo::where('activo', 1)->first();
                if ($prefijoPorDefecto) {
                    $prefijoId = $prefijoPorDefecto->id;
                    Log::info('Usando prefijo por defecto', ['prefijo_id' => $prefijoId]);
                }
            }

            if (!$prefijoId) {
                throw new \Exception('No se pudo determinar un prefijo para el lead.');
            }

            // Crear el lead
            $lead = Lead::create([
                'prefijo_id' => $prefijoId,
                'nombre_completo' => $validated['nombre_completo'],
                'genero' => $validated['genero'],
                'telefono' => $validated['telefono'],
                'email' => $validated['email'],
                'localidad_id' => $validated['localidad_id'],
                'rubro_id' => $validated['rubro_id'],
                'origen_id' => $validated['origen_id'],
                'estado_lead_id' => 1,
                'es_cliente' => false,
                'es_activo' => true,
                'created_by' => auth()->id(),
                'created' => now(),
            ]);

            Log::info('✅ Lead creado', ['lead_id' => $lead->id, 'prefijo_id' => $prefijoId]);
            
            // 🔥 Devolver JSON
            return response()->json([
                'success' => true,
                'message' => 'Lead creado correctamente',
                'lead_id' => $lead->id
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error creando lead:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Error al crear lead: ' . $e->getMessage()
            ], 500);
        }
    }

    /**
     * Actualizar datos del lead existente
     */
    public function update(Request $request, $leadId)
    {
        try {
            Log::info('=== UPDATE LEAD ===', [
                'lead_id' => $leadId,
                'request_data' => $request->all(),
                'user_id' => auth()->id()
            ]);
            
            $validated = $request->validate([
                'nombre_completo' => 'required|string|max:100',
                'genero' => 'required|in:masculino,femenino,otro,no_especifica',
                'telefono' => 'required|string|max:20',
                'email' => 'required|email|max:150',
                'localidad_id' => 'required|exists:localidades,id',
                'rubro_id' => 'required|exists:rubros,id',
                'origen_id' => 'required|exists:origenes_contacto,id',
            ]);

            $lead = Lead::findOrFail($leadId);
            
            $lead->update([
                'nombre_completo' => $validated['nombre_completo'],
                'genero' => $validated['genero'],
                'telefono' => $validated['telefono'],
                'email' => $validated['email'],
                'localidad_id' => $validated['localidad_id'],
                'rubro_id' => $validated['rubro_id'],
                'origen_id' => $validated['origen_id'],
                'modified' => now(),
                'modified_by' => auth()->id(),
            ]);
            
            // 🔥 Devolver JSON
            return response()->json([
                'success' => true,
                'message' => 'Datos del lead actualizados correctamente',
                'lead_id' => $lead->id
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error actualizando lead:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Error al actualizar lead: ' . $e->getMessage()
            ], 500);
        }
    }
}