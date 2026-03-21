<?php
// app/Http/Controllers/CondComerciales/ReenviosActivosController.php

namespace App\Http\Controllers\CondComerciales;

use App\Http\Controllers\Controller;
use App\Models\Reenvio;
use App\Traits\Authorizable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class ReenviosActivosController extends Controller
{
    use Authorizable;

    public function __construct()
    {
        $this->initializeAuthorization();
    }

    /**
     * Mostrar listado de reenvíos activos
     */
public function index(Request $request)
{
    $this->authorizePermiso(config('permisos.VER_REENVIOS'));
    
    $query = Reenvio::where('activo', 1); // Solo mostrar activos
    
    if ($request->filled('search')) {
        $query->where('prestadora', 'LIKE', "%{$request->search}%");
    }
    
    if ($request->filled('plataforma')) {
        if ($request->plataforma === 'cybermapa') {
            $query->where('cybermapa', 1);
        } elseif ($request->plataforma === 'bykom') {
            $query->where('bykom', 1);
        }
    }
    
    $reenvios = $query->orderBy('prestadora')->paginate(10);
    
    // Estadísticas simplificadas
    $estadisticas = [
        'total' => Reenvio::where('activo', 1)->count(),
        'cybermapa' => Reenvio::where('activo', 1)->where('cybermapa', 1)->count(),
        'bykom' => Reenvio::where('activo', 1)->where('bykom', 1)->count(),
        'ambas' => Reenvio::where('activo', 1)->where('cybermapa', 1)->where('bykom', 1)->count(),
    ];
    
    return Inertia::render('CondComerciales/ReenviosActivos', [
        'reenvios' => $reenvios,
        'estadisticas' => $estadisticas,
        'filters' => [
            'search' => $request->search,
            'plataforma' => $request->plataforma,
        ],
    ]);
}

    /**
     * Mostrar formulario para crear un nuevo reenvío
     */
    public function create()
    {
        $this->authorizePermiso(config('permisos.GESTIONAR_REENVIOS'));
        
        return Inertia::render('CondComerciales/ReenviosCreate');
    }

    /**
     * Guardar un nuevo reenvío
     */
    public function store(Request $request)
    {
        $this->authorizePermiso(config('permisos.GESTIONAR_REENVIOS'));
        
        $validated = $request->validate([
            'prestadora' => 'required|string|max:100|unique:reenvios,prestadora',
            'cybermapa' => 'boolean',
            'bykom' => 'boolean',
            'activo' => 'boolean',
        ]);
        
        try {
            $validated['created_by'] = auth()->id();
            $validated['modified_by'] = auth()->id();
            $validated['activo'] = $validated['activo'] ?? true;
            
            $reenvio = Reenvio::create($validated);
            
            return redirect()->route('cond-comerciales.reenvios.index')
                ->with('success', 'Reenvío creado exitosamente');
                
        } catch (\Exception $e) {
            Log::error('Error creando reenvío:', [
                'error' => $e->getMessage(),
                'data' => $validated
            ]);
            
            return back()->withErrors(['error' => 'Error al crear el reenvío: ' . $e->getMessage()]);
        }
    }

    /**
     * Mostrar un reenvío específico
     */
    public function show($id)
    {
        $this->authorizePermiso(config('permisos.VER_REENVIOS'));
        
        $reenvio = Reenvio::findOrFail($id);
        
        return Inertia::render('CondComerciales/ReenviosShow', [
            'reenvio' => $reenvio,
        ]);
    }

    /**
     * Mostrar formulario para editar un reenvío
     */
    public function edit($id)
    {
        $this->authorizePermiso(config('permisos.GESTIONAR_REENVIOS'));
        
        $reenvio = Reenvio::findOrFail($id);
        
        return Inertia::render('CondComerciales/ReenviosEdit', [
            'reenvio' => $reenvio,
        ]);
    }

    /**
     * Actualizar un reenvío
     */
    public function update(Request $request, $id)
    {
        $this->authorizePermiso(config('permisos.GESTIONAR_REENVIOS'));
        
        $reenvio = Reenvio::findOrFail($id);
        
        $validated = $request->validate([
            'prestadora' => 'required|string|max:100|unique:reenvios,prestadora,' . $id,
            'cybermapa' => 'boolean',
            'bykom' => 'boolean',
            'activo' => 'boolean',
        ]);
        
        try {
            $validated['modified_by'] = auth()->id();
            
            $reenvio->update($validated);
            
            return redirect()->route('cond-comerciales.reenvios.index')
                ->with('success', 'Reenvío actualizado exitosamente');
                
        } catch (\Exception $e) {
            Log::error('Error actualizando reenvío:', [
                'error' => $e->getMessage(),
                'id' => $id,
                'data' => $validated
            ]);
            
            return back()->withErrors(['error' => 'Error al actualizar el reenvío: ' . $e->getMessage()]);
        }
    }

    /**
     * Eliminar un reenvío (soft delete)
     */
    public function destroy($id)
    {
        $this->authorizePermiso(config('permisos.GESTIONAR_REENVIOS'));
        
        $reenvio = Reenvio::findOrFail($id);
        
        try {
            $reenvio->deleted_by = auth()->id();
            $reenvio->activo = false;
            $reenvio->save();
            $reenvio->delete();
            
            return redirect()->route('cond-comerciales.reenvios.index')
                ->with('success', 'Reenvío eliminado exitosamente');
                
        } catch (\Exception $e) {
            Log::error('Error eliminando reenvío:', [
                'error' => $e->getMessage(),
                'id' => $id
            ]);
            
            return back()->withErrors(['error' => 'Error al eliminar el reenvío: ' . $e->getMessage()]);
        }
    }
}