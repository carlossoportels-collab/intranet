<?php
// app/Http/Controllers/RRHH/Equipos/TecnicoController.php

namespace App\Http\Controllers\rrhh\Equipos;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Tecnico;
use App\Models\Personal;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Validator;

class TecnicoController extends Controller
{
    /**
     * Mostrar formulario para crear nuevo técnico
     */
    public function create()
    {
        \Log::info('Accediendo a create técnico');
        
        // Obtener personal disponible que no sea técnico
        $personalDisponible = Personal::where('activo', 1)
            ->whereNotExists(function ($query) {
                $query->select(DB::raw(1))
                    ->from('tecnicos')
                    ->whereRaw('tecnicos.personal_id = personal.id')
                    ->where('tecnicos.activo', 1);
            })
            ->select('id', 'nombre', 'apellido', 'email', 'telefono')
            ->orderBy('nombre')
            ->get()
            ->map(function ($personal) {
                return [
                    'id' => $personal->id,
                    'nombre_completo' => $personal->nombre . ' ' . $personal->apellido,
                    'email' => $personal->email,
                    'telefono' => $personal->telefono,
                ];
            });

        \Log::info('Personal disponible:', ['count' => $personalDisponible->count()]);

        return Inertia::render('rrhh/Equipos/TecnicoForm', [
            'personalDisponible' => $personalDisponible,
            'modo' => 'crear',
        ]);
    }
    
        private function getUserId()
    {
        $user = auth()->user();
        return $user ? $user->id : null;
    }
    
    /**
     * Almacenar nuevo técnico
     */
    public function store(Request $request)
    {
        \Log::info('=== STORE TÉCNICO ===');
        \Log::info('Request data:', $request->all());
        \Log::info('User ID:', ['user_id' => auth()->id()]);
        
        $validator = Validator::make($request->all(), [
            'personal_id' => 'required|exists:personal,id',
            'direccion' => 'required|string|max:255',
            'latitud' => 'nullable|numeric|between:-90,90',
            'longitud' => 'nullable|numeric|between:-180,180',
        ]);

        if ($validator->fails()) {
            \Log::error('Validation failed:', $validator->errors()->toArray());
            return back()
                ->withErrors($validator)
                ->withInput();
        }

        try {
            DB::beginTransaction();
            
            \Log::info('Iniciando transacción para crear técnico');

            // Verificar si ya existe un registro para este personal
            $tecnicoExistente = Tecnico::where('personal_id', $request->personal_id)->first();
            
            if ($tecnicoExistente) {
                \Log::info('Técnico existente encontrado, actualizando:', ['id' => $tecnicoExistente->id]);
                
                // Actualizar el técnico existente
                $tecnicoExistente->update([
                    'direccion' => $request->direccion,
                    'latitud' => $request->latitud,
                    'longitud' => $request->longitud,
                    'activo' => 1,
                    'modified' => now(),
                    'deleted_at' => null,
                    'deleted_by' => null,
                ]);
                $tecnico = $tecnicoExistente;
            } else {
                \Log::info('Creando nuevo técnico');
                
                // Crear nuevo técnico - El modelo manejará created_by, modified_by, created, modified
                $tecnico = Tecnico::create([
                    'personal_id' => $request->personal_id,
                    'direccion' => $request->direccion,
                    'latitud' => $request->latitud,
                    'longitud' => $request->longitud,
                    'activo' => 1,
                    'created_by' => auth()->id(),
                    'modified_by' => auth()->id(),
                    'created' => now(),
                    'modified' => now(),
                ]);
            }

            DB::commit();
            
            \Log::info('Transacción completada. Técnico ID:', ['id' => $tecnico->id]);
            \Log::info('Datos del técnico creado:', $tecnico->toArray());

            return redirect()->route('rrhh.equipos.tecnico')
                ->with('success', 'Técnico creado exitosamente.');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error creating técnico: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            
            return back()
                ->with('error', 'Error al crear el técnico: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Mostrar formulario para editar técnico
     */
    public function edit($id)
    {
        \Log::info('=== EDIT TÉCNICO ===');
        \Log::info('ID recibido:', ['id' => $id]);
        
        try {
            $tecnico = Tecnico::with('personal')->findOrFail($id);
            
            \Log::info('Técnico encontrado:', [
                'id' => $tecnico->id,
                'personal_id' => $tecnico->personal_id,
                'activo' => $tecnico->activo
            ]);

            return Inertia::render('rrhh/Equipos/TecnicoForm', [
                'tecnico' => [
                    'id' => $tecnico->id,
                    'personal_id' => $tecnico->personal_id,
                    'nombre_completo' => $tecnico->personal ? 
                        $tecnico->personal->nombre . ' ' . $tecnico->personal->apellido : 'N/A',
                    'direccion' => $tecnico->direccion,
                    'latitud' => $tecnico->latitud,
                    'longitud' => $tecnico->longitud,
                    'activo' => (bool)$tecnico->activo,
                ],
                'modo' => 'editar',
            ]);
        } catch (\Exception $e) {
            \Log::error('Error fetching técnico for edit: ' . $e->getMessage());
            return redirect()->route('rrhh.equipos.tecnico')
                ->with('error', 'Técnico no encontrado.');
        }
    }

    /**
     * Actualizar técnico
     */
    public function update(Request $request, $id)
    {
        \Log::info('=== UPDATE TÉCNICO ===');
        \Log::info('ID:', ['id' => $id]);
        \Log::info('Request data:', $request->all());
        \Log::info('Auth ID:', ['auth_id' => auth()->id()]);
        
        try {
            $tecnico = Tecnico::findOrFail($id);
            
            \Log::info('Técnico encontrado para update:', [
                'id' => $tecnico->id,
                'activo_actual' => $tecnico->activo
            ]);
            
            $validator = Validator::make($request->all(), [
                'direccion' => 'required|string|max:255',
                'latitud' => 'nullable|numeric|between:-90,90',
                'longitud' => 'nullable|numeric|between:-180,180',
                'activo' => 'required|boolean',
            ]);

            if ($validator->fails()) {
                \Log::error('Validation failed:', $validator->errors()->toArray());
                return back()
                    ->withErrors($validator)
                    ->withInput();
            }

            DB::beginTransaction();
            
            \Log::info('Iniciando transacción para update');

            $updateData = [
                'direccion' => $request->direccion,
                'latitud' => $request->latitud,
                'longitud' => $request->longitud,
                'activo' => $request->activo,
                'modified_by' => auth()->id(),
                'modified' => now(),
            ];
            
            // Solo manejar deleted_at/deleted_by si se está desactivando
            if ($request->activo == 0 && $tecnico->activo == 1) {
                $updateData['deleted_at'] = now();
                $updateData['deleted_by'] = auth()->id();
            } elseif ($request->activo == 1 && $tecnico->activo == 0) {
                // Si se está reactivando, limpiar deleted_at/deleted_by
                $updateData['deleted_at'] = null;
                $updateData['deleted_by'] = null;
            }

            \Log::info('Update data:', $updateData);
            $tecnico->update($updateData);

            DB::commit();
            
            \Log::info('Técnico actualizado:', [
                'id' => $tecnico->id,
                'nuevo_activo' => $tecnico->activo,
                'deleted_at' => $tecnico->deleted_at,
                'modified_by' => $tecnico->modified_by
            ]);

            return redirect()->route('rrhh.equipos.tecnico')
                ->with('success', 'Técnico actualizado exitosamente.');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error updating técnico: ' . $e->getMessage());
            
            return back()
                ->with('error', 'Error al actualizar el técnico: ' . $e->getMessage())
                ->withInput();
        }
    }

    /**
     * Eliminar técnico (soft delete)
     */
    public function destroy($id)
    {
        \Log::info('=== DESTROY TÉCNICO ===');
        \Log::info('ID:', ['id' => $id]);
        \Log::info('Auth ID:', ['auth_id' => auth()->id()]);
        
        try {
            $tecnico = Tecnico::findOrFail($id);
            
            \Log::info('Técnico encontrado para delete:', [
                'id' => $tecnico->id,
                'activo_actual' => $tecnico->activo
            ]);
            
            DB::beginTransaction();

            // Soft delete: marcar como inactivo
            $tecnico->update([
                'activo' => 0,
                'modified_by' => auth()->id(),
                'modified' => now(),
                'deleted_at' => now(),
                'deleted_by' => auth()->id(),
            ]);

            DB::commit();
            
            \Log::info('Técnico eliminado (soft):', [
                'id' => $tecnico->id,
                'nuevo_activo' => $tecnico->activo,
                'deleted_at' => $tecnico->deleted_at,
                'deleted_by' => $tecnico->deleted_by
            ]);

            return redirect()->route('rrhh.equipos.tecnico')
                ->with('success', 'Técnico eliminado exitosamente.');

        } catch (\Exception $e) {
            DB::rollBack();
            \Log::error('Error deleting técnico: ' . $e->getMessage());
            
            return redirect()->route('rrhh.equipos.tecnico')
                ->with('error', 'Error al eliminar el técnico: ' . $e->getMessage());
        }
    }
}