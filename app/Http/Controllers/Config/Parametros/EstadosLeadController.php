<?php
// app/Http/Controllers/Config/Parametros/EstadosLeadController.php

namespace App\Http\Controllers\Config\Parametros;

use App\Http\Controllers\Controller;
use App\Traits\Authorizable;
use App\Models\EstadoLead;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EstadosLeadController extends Controller
{
    use Authorizable;

    public function __construct()
    {
        $this->initializeAuthorization();
    }

    public function index()
    {
        // 🔥 VERIFICAR PERMISO BASE
        $this->authorizePermiso(config('permisos.VER_CONFIGURACION'));
        
        $estados = EstadoLead::orderBy('id')->get();
        
        return Inertia::render('Config/Parametros/EstadosLead', [
            'estados' => $estados
        ]);
    }
    
    public function store(Request $request)
    {
        // 🔥 VERIFICAR PERMISO DE GESTIÓN
        $this->authorizePermiso(config('permisos.GESTIONAR_PARAMETROS'));
        
        $request->validate([
            'nombre' => 'required|string|max:50',
            'tipo' => 'required|in:nuevo,activo,final_positivo,final_negativo',
            'orden_en_proceso' => 'required|integer',
            'descripcion' => 'nullable|string',
            'color_hex' => 'required|string|max:7',
        ]);
        
        EstadoLead::create($request->all());
        
        return redirect()->back()->with('success', 'Estado creado exitosamente');
    }
    
    public function update(Request $request, $id)
    {
        // 🔥 VERIFICAR PERMISO DE GESTIÓN
        $this->authorizePermiso(config('permisos.GESTIONAR_PARAMETROS'));
        
        $estado = EstadoLead::findOrFail($id);
        
        $request->validate([
            'nombre' => 'required|string|max:50',
            'tipo' => 'required|in:nuevo,activo,final_positivo,final_negativo',
            'orden_en_proceso' => 'required|integer',
            'descripcion' => 'nullable|string',
            'color_hex' => 'required|string|max:7',
        ]);
        
        $estado->update($request->all());
        
        return redirect()->back()->with('success', 'Estado actualizado exitosamente');
    }
    
    public function destroy($id)
    {
        // 🔥 VERIFICAR PERMISO DE GESTIÓN
        $this->authorizePermiso(config('permisos.GESTIONAR_PARAMETROS'));
        
        $estado = EstadoLead::findOrFail($id);
        $estado->delete();
        
        return redirect()->back()->with('success', 'Estado eliminado exitosamente');
    }
    
    public function toggleActivo($id)
    {
        // 🔥 VERIFICAR PERMISO DE GESTIÓN
        $this->authorizePermiso(config('permisos.GESTIONAR_PARAMETROS'));
        
        $estado = EstadoLead::findOrFail($id);
        $estado->update(['activo' => !$estado->activo]);
        
        return redirect()->back()->with('success', 'Estado actualizado');
    }
}