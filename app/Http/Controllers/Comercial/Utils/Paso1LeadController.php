<?php

namespace App\Http\Controllers\Comercial\Utils;

use App\Http\Controllers\Controller;
use App\Models\Lead;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class Paso1LeadController extends Controller
{
    /**
     * Actualizar datos del lead
     */
    public function update(Request $request)
    {
        try {
            Log::info('=== UPDATE LEAD ===', [
                'request_data' => $request->all(),
                'user_id' => auth()->id()
            ]);
            
            $validated = $request->validate([
                'lead_id' => 'required|exists:leads,id',
                'nombre_completo' => 'required|string|max:100',
                'genero' => 'required|in:masculino,femenino,otro,no_especifica',
                'telefono' => 'required|string|max:20',
                'email' => 'required|email|max:150',
                'localidad_id' => 'required|exists:localidades,id',
                'rubro_id' => 'required|exists:rubros,id',
                'origen_id' => 'required|exists:origenes_contacto,id',
            ]);

            $lead = Lead::findOrFail($request->lead_id);
            
            // Actualizar el lead
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
            
            // 🔥 Devolver respuesta Inertia - Redirigir de vuelta con mensaje de éxito
            return redirect()->back()->with('success', 'Datos del lead actualizados correctamente');
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            // 🔥 Devolver errores de validación para Inertia
            return redirect()->back()->withErrors($e->errors());
        } catch (\Exception $e) {
            Log::error('Error actualizando lead:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            // 🔥 Devolver error para Inertia
            return redirect()->back()->withErrors(['error' => 'Error al actualizar lead: ' . $e->getMessage()]);
        }
    }
}