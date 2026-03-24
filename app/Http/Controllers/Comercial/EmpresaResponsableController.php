<?php
// app/Http/Controllers/Comercial/EmpresaResponsableController.php

namespace App\Http\Controllers\Comercial;

use App\Http\Controllers\Controller;
use App\Models\EmpresaResponsable;
use App\Traits\Authorizable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class EmpresaResponsableController extends Controller
{
    use Authorizable; 

    public function __construct()
    {
        $this->initializeAuthorization(); 
    }

    public function store(Request $request)
    {
     
        $this->authorizePermiso(config('permisos.GESTIONAR_EMPRESAS', 'gestionar_empresas'));
        
        try {
            $validated = $request->validate([
                'empresa_id' => 'required|integer|exists:empresas,id',
                'tipo_responsabilidad_id' => 'required|integer|exists:tipos_responsabilidad,id',
                'nombre' => 'required|string|max:100',
                'apellido' => 'required|string|max:100',
                'telefono' => 'nullable|string|max:20',
                'email' => 'nullable|email|max:150',
            ]);

            $responsable = EmpresaResponsable::create([
                'empresa_id' => $request->empresa_id,
                'tipo_responsabilidad_id' => $request->tipo_responsabilidad_id,
                'nombre' => $request->nombre,
                'apellido' => $request->apellido,
                'telefono' => $request->telefono,
                'email' => $request->email,
                'es_activo' => true,
                'created_by' => auth()->id(),
            ]);

            $responsable->load('tipoResponsabilidad');

            return redirect()->back()->with([
                'success' => 'Responsable guardado correctamente',
                'data' => [
                    'responsable' => $responsable
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Error guardando responsable:', ['error' => $e->getMessage()]);
            return redirect()->back()->with('error', 'Error al guardar responsable: ' . $e->getMessage());
        }
    }

    public function destroy($id)
    {
       
        $this->authorizePermiso(config('permisos.GESTIONAR_EMPRESAS', 'gestionar_empresas'));
        
        try {
            $responsable = EmpresaResponsable::findOrFail($id);
            $responsable->es_activo = false;
            $responsable->deleted_by = auth()->id();
            $responsable->save();

            return redirect()->back()->with('success', 'Responsable eliminado correctamente');

        } catch (\Exception $e) {
            Log::error('Error eliminando responsable:', ['error' => $e->getMessage()]);
            return redirect()->back()->with('error', 'Error al eliminar responsable: ' . $e->getMessage());
        }
    }
}