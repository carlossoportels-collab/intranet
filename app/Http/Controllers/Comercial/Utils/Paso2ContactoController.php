<?php
// app/Http/Controllers/Comercial/Utils/Paso2ContactoController.php

namespace App\Http\Controllers\Comercial\Utils;

use App\Http\Controllers\Controller;
use App\Models\EmpresaContacto;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class Paso2ContactoController extends Controller
{
    /**
     * Crear nuevo contacto
     */
    public function store(Request $request)
    {
        try {
            $validated = $request->validate([
                'lead_id' => 'required|exists:leads,id',
                'tipo_responsabilidad_id' => 'required|exists:tipos_responsabilidad,id',
                'tipo_documento_id' => 'required|exists:tipos_documento,id',
                'nro_documento' => 'required|string|max:20',
                'nacionalidad_id' => 'required|exists:nacionalidades,id',
                'fecha_nacimiento' => 'required|date',
                'direccion_personal' => 'required|string|max:255',
                'codigo_postal_personal' => 'required|string|max:10',
            ]);

            // Verificar si ya existe un contacto para este lead
            $contactoExistente = EmpresaContacto::where('lead_id', $request->lead_id)
                ->where('es_activo', true)
                ->first();
                
            if ($contactoExistente) {
                // Actualizar el existente
                $contactoExistente->update($validated);
                $contacto = $contactoExistente;
            } else {
                // Crear nuevo
                $contacto = EmpresaContacto::create([
                    'lead_id' => $request->lead_id,
                    'empresa_id' => null,
                    'es_contacto_principal' => true,
                    'es_activo' => true,
                    'created_by' => auth()->id(),
                    'created' => now(),
                    ...$validated
                ]);
            }
            
            // 🔥 Guardar contacto_id en sesión para paso 3
            session(['contacto_id' => $contacto->id]);
            
            // 🔥 Devolver respuesta Inertia
            return redirect()->back()->with('success', 'Datos personales guardados correctamente');
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return redirect()->back()->withErrors($e->errors());
        } catch (\Exception $e) {
            Log::error('Error guardando contacto:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->back()->withErrors(['error' => 'Error al guardar datos personales: ' . $e->getMessage()]);
        }
    }

    /**
     * Actualizar contacto existente
     */
    public function update(Request $request, $contactoId)
    {
        try {
            Log::info('=== UPDATE CONTACTO ===', [
                'contacto_id' => $contactoId,
                'request_data' => $request->all(),
                'user_id' => auth()->id()
            ]);
            
            $validated = $request->validate([
                'lead_id' => 'required|exists:leads,id',
                'tipo_responsabilidad_id' => 'required|exists:tipos_responsabilidad,id',
                'tipo_documento_id' => 'required|exists:tipos_documento,id',
                'nro_documento' => 'required|string|max:20',
                'nacionalidad_id' => 'required|exists:nacionalidades,id',
                'fecha_nacimiento' => 'required|date',
                'direccion_personal' => 'required|string|max:255',
                'codigo_postal_personal' => 'required|string|max:10',
            ]);

            $contacto = EmpresaContacto::findOrFail($contactoId);
            
            // Verificar que el contacto pertenece al lead
            if ($contacto->lead_id != $request->lead_id) {
                return redirect()->back()->withErrors(['error' => 'El contacto no pertenece a este lead']);
            }
            
            $contacto->update($validated);
            
            // 🔥 Guardar contacto_id en sesión para paso 3
            session(['contacto_id' => $contacto->id]);
            
            // 🔥 Devolver respuesta Inertia
            return redirect()->back()->with('success', 'Datos personales actualizados correctamente');
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return redirect()->back()->withErrors($e->errors());
        } catch (\Exception $e) {
            Log::error('Error actualizando contacto:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->back()->withErrors(['error' => 'Error al actualizar contacto: ' . $e->getMessage()]);
        }
    }
}