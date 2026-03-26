<?php
// app/Http/Controllers/Comercial/Utils/Paso2ContactoController.php

namespace App\Http\Controllers\Comercial\Utils;

use App\Http\Controllers\Controller;
use App\Models\EmpresaContacto;
use App\Models\EmpresaResponsable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class Paso2ContactoController extends Controller
{
    public function store(Request $request)
    {
        try {
            Log::info('=== STORE CONTACTO ===', [
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

            // Buscar o crear contacto
            $contacto = EmpresaContacto::where('lead_id', $request->lead_id)
                ->where('es_activo', true)
                ->first();
                
            if ($contacto) {
                $contacto->update($validated);
                $mensaje = 'Contacto actualizado correctamente';
                Log::info('Contacto actualizado', ['contacto_id' => $contacto->id]);
            } else {
                $contacto = EmpresaContacto::create([
                    'lead_id' => $request->lead_id,
                    'empresa_id' => null,
                    'es_contacto_principal' => true,
                    'es_activo' => true,
                    'created_by' => auth()->id(),
                    'created' => now(),
                    ...$validated
                ]);
                $mensaje = 'Contacto creado correctamente';
                Log::info('Contacto creado', ['contacto_id' => $contacto->id]);
            }
            
            // 🔥 GUARDAR RESPONSABLE SI EL TIPO ES 3, 4 o 5
            $tipoResponsabilidad = $validated['tipo_responsabilidad_id'];
            $tiposQueRequierenResponsable = [3, 4, 5]; // Flota, Pagos, Ambos
            
            if (in_array($tipoResponsabilidad, $tiposQueRequierenResponsable)) {
                $nombreCompleto = $validated['nombre_completo'] ?? 
                    ($contacto->lead->nombre_completo ?? 'Sin nombre');
                
                // Buscar si ya existe un responsable con este tipo para esta empresa
                $responsable = EmpresaResponsable::where('empresa_id', $contacto->empresa_id)
                    ->where('tipo_responsabilidad_id', $tipoResponsabilidad)
                    ->where('es_activo', true)
                    ->first();
                
                $datosResponsable = [
                    'empresa_id' => $contacto->empresa_id,
                    'tipo_responsabilidad_id' => $tipoResponsabilidad,
                    'nombre_completo' => $nombreCompleto,
                    'telefono' => $validated['telefono'] ?? $contacto->lead->telefono ?? null,
                    'email' => $validated['email'] ?? $contacto->lead->email ?? null,
                    'es_activo' => true,
                    'created_by' => auth()->id(),
                    'created' => now(),
                ];
                
                if ($responsable) {
                    $responsable->update($datosResponsable);
                    Log::info('Responsable actualizado', [
                        'responsable_id' => $responsable->id,
                        'tipo' => $tipoResponsabilidad
                    ]);
                } else {
                    $responsable = EmpresaResponsable::create($datosResponsable);
                    Log::info('Responsable creado', [
                        'responsable_id' => $responsable->id,
                        'tipo' => $tipoResponsabilidad
                    ]);
                }
                
                // Guardar en sesión para referencia
                session(["responsable_{$tipoResponsabilidad}_id" => $responsable->id]);
            }
            
            // Guardar contacto_id en sesión
            session(['contacto_id' => $contacto->id]);
            
            // Devolver JSON
            return response()->json([
                'success' => true,
                'message' => $mensaje,
                'contacto_id' => $contacto->id,
                'responsable_ids' => [
                    3 => session('responsable_3_id'),
                    4 => session('responsable_4_id'),
                    5 => session('responsable_5_id'),
                ]
            ]);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Error de validación en contacto:', ['errors' => $e->errors()]);
            return response()->json([
                'success' => false,
                'errors' => $e->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('Error guardando contacto:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Error al guardar datos personales: ' . $e->getMessage()
            ], 500);
        }
    }

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
            
            if ($contacto->lead_id != $request->lead_id) {
                return response()->json([
                    'success' => false,
                    'error' => 'El contacto no pertenece a este lead'
                ], 400);
            }
            
            $contacto->update($validated);
            
            // 🔥 ACTUALIZAR RESPONSABLE SI EL TIPO ES 3, 4 o 5
            $tipoResponsabilidad = $validated['tipo_responsabilidad_id'];
            $tiposQueRequierenResponsable = [3, 4, 5];
            
            if (in_array($tipoResponsabilidad, $tiposQueRequierenResponsable)) {
                $nombreCompleto = $validated['nombre_completo'] ?? 
                    ($contacto->lead->nombre_completo ?? 'Sin nombre');
                
                $responsable = EmpresaResponsable::where('empresa_id', $contacto->empresa_id)
                    ->where('tipo_responsabilidad_id', $tipoResponsabilidad)
                    ->where('es_activo', true)
                    ->first();
                
                $datosResponsable = [
                    'empresa_id' => $contacto->empresa_id,
                    'tipo_responsabilidad_id' => $tipoResponsabilidad,
                    'nombre_completo' => $nombreCompleto,
                    'telefono' => $validated['telefono'] ?? $contacto->lead->telefono ?? null,
                    'email' => $validated['email'] ?? $contacto->lead->email ?? null,
                    'es_activo' => true,
                    'modified_by' => auth()->id(),
                    'modified' => now(),
                ];
                
                if ($responsable) {
                    $responsable->update($datosResponsable);
                    Log::info('Responsable actualizado', [
                        'responsable_id' => $responsable->id,
                        'tipo' => $tipoResponsabilidad
                    ]);
                } else {
                    $datosResponsable['created_by'] = auth()->id();
                    $datosResponsable['created'] = now();
                    $responsable = EmpresaResponsable::create($datosResponsable);
                    Log::info('Responsable creado', [
                        'responsable_id' => $responsable->id,
                        'tipo' => $tipoResponsabilidad
                    ]);
                }
                
                session(["responsable_{$tipoResponsabilidad}_id" => $responsable->id]);
            }
            
            Log::info('Contacto actualizado', ['contacto_id' => $contacto->id]);
            
            session(['contacto_id' => $contacto->id]);
            
            return response()->json([
                'success' => true,
                'message' => 'Datos personales actualizados correctamente',
                'contacto_id' => $contacto->id,
                'responsable_ids' => [
                    3 => session('responsable_3_id'),
                    4 => session('responsable_4_id'),
                    5 => session('responsable_5_id'),
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error actualizando contacto:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Error al actualizar contacto: ' . $e->getMessage()
            ], 500);
        }
    }
}