<?php
// app/Http\Controllers\Config\Parametros\EstadosLeadController.php

namespace App\Http\Controllers\Config\Parametros;

use App\Http\Controllers\Controller;
use App\Models\EstadoLead;
use Illuminate\Http\Request;
use Inertia\Inertia;

class EstadosLeadController extends Controller
{
    public function index()
    {
        // Obtener todos los estados ordenados por orden_en_proceso
        $estados = EstadoLead::orderBy('id')->get();
        
        return Inertia::render('Config/Parametros/EstadosLead', [
            'estados' => $estados
        ]);
    }
    
    public function store(Request $request)
    {
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
        $estado = EstadoLead::findOrFail($id);
        $estado->delete();
        
        return redirect()->back()->with('success', 'Estado eliminado exitosamente');
    }
    
    public function toggleActivo($id)
    {
        $estado = EstadoLead::findOrFail($id);
        $estado->update(['activo' => !$estado->activo]);
        
        return redirect()->back()->with('success', 'Estado actualizado');
    }
}