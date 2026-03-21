<?php
// app/Http/Controllers/rrhh/Personal/LicenciasController.php

namespace App\Http\Controllers\rrhh\Personal;

use App\Http\Controllers\Controller;
use App\Traits\Authorizable; // 🔥 IMPORTAR TRAIT
use App\Models\PersonalLicencia;
use App\Models\MotivoLicencia;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class LicenciasController extends Controller
{
    use Authorizable; // 🔥 AGREGAR TRAIT

    public function __construct()
    {
        $this->initializeAuthorization(); // 🔥 INICIALIZAR
    }

    public function index(Request $request)
    {
        // 🔥 VERIFICAR PERMISO
        $this->authorizePermiso(config('permisos.VER_LICENCIAS'));
        
        $user = Auth::user();
        $puedeGestionar = $this->permisoService->usuarioTienePermiso($user->id, config('permisos.GESTIONAR_LICENCIAS'));
        
        $query = PersonalLicencia::with(['personal', 'motivo', 'creadoPor'])
            ->orderBy('desde', 'desc');
        
        // Si no puede gestionar, ver solo sus propias licencias
        if (!$puedeGestionar) {
            $query->where('personal_id', $user->personal_id);
        }
        
        if ($request->filled('motivo_id')) {
            $query->where('motivo_licencia_id', $request->motivo_id);
        }
        
        if ($request->filled('empleado') && $puedeGestionar) {
            $query->whereHas('personal', function($q) use ($request) {
                $q->whereRaw("CONCAT(nombre, ' ', apellido) LIKE ?", ["%{$request->empleado}%"]);
            });
        }
        
        $perPage = $request->get('per_page', 10);
        $licencias = $query->paginate($perPage)->withQueryString();
        
        $licencias->getCollection()->transform(function ($licencia) {
            return [
                'id' => $licencia->id,
                'personal_id' => $licencia->personal_id,
                'empleado' => $licencia->personal ? $licencia->personal->nombre_completo : ($licencia->nombre_personal ?? 'Sin nombre'),
                'tipo' => $licencia->motivo ? $licencia->motivo->nombre : 'Sin tipo',
                'tipo_id' => $licencia->motivo_licencia_id,
                'fecha_inicio' => $licencia->desde->format('Y-m-d'),
                'fecha_fin' => $licencia->hasta->format('Y-m-d'),
                'dias_totales' => $licencia->dias_totales,
                'dias_restantes' => $licencia->dias_restantes,
                'observacion' => $licencia->observacion ?? 'Sin observación',
                'estado' => $licencia->estado,
                'fecha_solicitud' => $licencia->created_at->format('Y-m-d'),
                'creado_por' => $licencia->creadoPor ? $licencia->creadoPor->nombre_usuario : null
            ];
        });
        
        $motivos = MotivoLicencia::orderBy('nombre')->get()->map(function ($motivo) {
            return [
                'id' => $motivo->id,
                'nombre' => $motivo->nombre
            ];
        });
        
        return Inertia::render('rrhh/Personal/Licencias', [
            'licencias' => $licencias,
            'motivos' => $motivos,
            'filters' => $request->only(['estado', 'motivo_id', 'empleado']),
            'userRole' => $user->rol_id,
            'puedeGestionar' => $puedeGestionar,
        ]);
    }
    
    public function store(Request $request)
    {
        // 🔥 VERIFICAR PERMISO DE GESTIÓN
        $this->authorizePermiso(config('permisos.GESTIONAR_LICENCIAS'));
        
        $validated = $request->validate([
            'personal_id' => 'required|exists:personal,id',
            'motivo_licencia_id' => 'required|exists:motivo_licencias,id',
            'desde' => 'required|date',
            'hasta' => 'required|date|after_or_equal:desde',
            'observacion' => 'nullable|string'
        ]);
        
        $personal = \App\Models\Personal::find($validated['personal_id']);
        $validated['nombre_personal'] = $personal->nombre_completo;
        $validated['created_by'] = Auth::id();
        
        PersonalLicencia::create($validated);
        
        return redirect()->back()->with('success', 'Licencia creada correctamente');
    }
    
    public function update(Request $request, $id)
    {
        // 🔥 VERIFICAR PERMISO DE GESTIÓN
        $this->authorizePermiso(config('permisos.GESTIONAR_LICENCIAS'));
        
        $licencia = PersonalLicencia::findOrFail($id);
        
        $validated = $request->validate([
            'personal_id' => 'required|exists:personal,id',
            'motivo_licencia_id' => 'required|exists:motivo_licencias,id',
            'desde' => 'required|date',
            'hasta' => 'required|date|after_or_equal:desde',
            'observacion' => 'nullable|string'
        ]);
        
        $validated['updated_by'] = Auth::id();
        
        $licencia->update($validated);
        
        return redirect()->back()->with('success', 'Licencia actualizada correctamente');
    }
    
    public function destroy($id)
    {
        // 🔥 VERIFICAR PERMISO DE GESTIÓN
        $this->authorizePermiso(config('permisos.GESTIONAR_LICENCIAS'));
        
        $licencia = PersonalLicencia::findOrFail($id);
        $licencia->deleted_by = Auth::id();
        $licencia->save();
        $licencia->delete();
        
        return redirect()->back()->with('success', 'Licencia eliminada correctamente');
    }
}