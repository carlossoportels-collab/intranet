<?php
// app/Http/Controllers/rrhh/Personal/DatosPersonalesController.php

namespace App\Http\Controllers\rrhh\Personal;

use App\Http\Controllers\Controller;
use App\Traits\Authorizable; // 🔥 IMPORTAR TRAIT
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Personal;
use App\Models\TipoPersonal;
use Illuminate\Support\Facades\Auth;

class DatosPersonalesController extends Controller
{
    use Authorizable; // 🔥 AGREGAR TRAIT

    public function __construct()
    {
        $this->initializeAuthorization(); // 🔥 INICIALIZAR
    }

    public function index(Request $request)
    {
        $user = Auth::user();
        
        // 🔥 VERIFICAR PERMISO BASE
        $this->authorizePermiso(config('permisos.VER_DATOS_PERSONALES'));
        
        // Obtener personal con tipo_personal
        $query = Personal::with('tipoPersonal')
            ->whereNull('deleted_at')
            ->orderBy('apellido')
            ->orderBy('nombre');
        
        // Si NO tiene permiso para ver todos, ver solo su propio registro
        if (!$this->permisoService->usuarioTienePermiso($user->id, config('permisos.GESTIONAR_DATOS_PERSONALES'))) {
            $query->where('id', $user->personal_id);
        }
        
        // Aplicar búsqueda si existe
        if ($request->filled('search')) {
            $search = $request->search;
            $query->where(function($q) use ($search) {
                $q->where('nombre', 'LIKE', "%{$search}%")
                  ->orWhere('apellido', 'LIKE', "%{$search}%")
                  ->orWhere('email', 'LIKE', "%{$search}%")
                  ->orWhereRaw("CONCAT(nombre, ' ', apellido) LIKE ?", ["%{$search}%"]);
            });
        }
        
        $personal = $query->get();
        
        // Obtener tipos de personal activos
        $tiposPersonal = TipoPersonal::where('activo', 1)
            ->whereNull('deleted_at')
            ->orderBy('nombre')
            ->get(['id', 'nombre']);
        
        // Calcular estadísticas (solo si tiene permiso de gestión)
        $estadisticas = null;
        if ($this->permisoService->usuarioTienePermiso($user->id, config('permisos.GESTIONAR_DATOS_PERSONALES'))) {
            $total = $personal->count();
            $activos = $personal->where('activo', 1)->count();
            
            // Contar por tipo de personal
            $tiposCount = [];
            foreach ($tiposPersonal as $tipo) {
                $tiposCount[$tipo->nombre] = $personal->where('tipo_personal_id', $tipo->id)->count();
            }
            
            $estadisticas = [
                'total' => $total,
                'activos' => $activos,
                'tiposCount' => $tiposCount,
            ];
        }
        
        return Inertia::render('rrhh/Personal/DatosPersonales', [
            'personal' => $personal,
            'tiposPersonal' => $tiposPersonal,
            'estadisticas' => $estadisticas,
            'filters' => $request->only(['search']),
            'userRole' => $user->rol_id,
            'puedeGestionar' => $this->permisoService->usuarioTienePermiso($user->id, config('permisos.GESTIONAR_DATOS_PERSONALES')),
        ]);
    }
    
    public function store(Request $request)
    {
        // 🔥 VERIFICAR PERMISO DE GESTIÓN
        $this->authorizePermiso(config('permisos.GESTIONAR_DATOS_PERSONALES'));
        
        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'apellido' => 'required|string|max:100',
            'email' => 'nullable|email|unique:personal,email',
            'telefono' => 'nullable|string|max:20',
            'fecha_nacimiento' => 'nullable|date',
            'tipo_personal_id' => 'required|exists:tipo_personal,id',
            'activo' => 'boolean',
        ]);
        
        $validated['created_by'] = Auth::id();
        
        $personal = Personal::create($validated);
        
        return redirect()->back()->with('success', 'Personal creado correctamente');
    }
    
    public function update(Request $request, $id)
    {
        $user = Auth::user();
        $personal = Personal::findOrFail($id);
        
        // 🔥 VERIFICAR: Si no tiene permiso de gestión, solo puede editar su propio registro
        $puedeGestionar = $this->permisoService->usuarioTienePermiso($user->id, config('permisos.GESTIONAR_DATOS_PERSONALES'));
        
        if (!$puedeGestionar && $personal->id != $user->personal_id) {
            abort(403, 'No tiene permisos para editar este registro');
        }
        
        $validated = $request->validate([
            'nombre' => 'required|string|max:100',
            'apellido' => 'required|string|max:100',
            'email' => 'nullable|email|unique:personal,email,' . $id,
            'telefono' => 'nullable|string|max:20',
            'fecha_nacimiento' => 'nullable|date',
            'tipo_personal_id' => 'required|exists:tipo_personal,id',
            'activo' => 'boolean',
        ]);
        
        $validated['modified_by'] = Auth::id();
        
        $personal->update($validated);
        
        return redirect()->back()->with('success', 'Personal actualizado correctamente');
    }
    
    public function destroy($id)
    {
        // 🔥 VERIFICAR PERMISO DE GESTIÓN
        $this->authorizePermiso(config('permisos.GESTIONAR_DATOS_PERSONALES'));
        
        $personal = Personal::findOrFail($id);
        
        // Verificar que no tenga relaciones antes de eliminar
        if ($personal->usuario || $personal->comercial || $personal->tecnico) {
            return response()->json(['error' => 'No se puede eliminar porque tiene registros asociados'], 400);
        }
        
        $personal->delete();
        
        return redirect()->back()->with('success', 'Personal eliminado correctamente');
    }

    public function buscar(Request $request)
    {
        $query = $request->get('q');
        
        if (strlen($query) < 3) {
            return response()->json([]);
        }
        
        $personal = Personal::where('activo', 1)
            ->where(function($q) use ($query) {
                $q->where('nombre', 'LIKE', "%{$query}%")
                  ->orWhere('apellido', 'LIKE', "%{$query}%")
                  ->orWhereRaw("CONCAT(nombre, ' ', apellido) LIKE ?", ["%{$query}%"]);
            })
            ->orderBy('apellido')
            ->orderBy('nombre')
            ->limit(10)
            ->get()
            ->map(function($p) {
                return [
                    'id' => $p->id,
                    'nombre_completo' => trim($p->nombre . ' ' . $p->apellido)
                ];
            });
        
        return response()->json($personal);
    }
}