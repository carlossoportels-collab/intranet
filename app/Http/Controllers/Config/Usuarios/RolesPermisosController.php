<?php
// app/Http/Controllers/Config/Usuarios/RolesPermisosController.php

namespace App\Http\Controllers\Config\Usuarios;

use App\Http\Controllers\Controller;
use App\Services\PermisoService;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class RolesPermisosController extends Controller
{
    protected $permisoService;

    public function __construct(PermisoService $permisoService)
    {
        $this->permisoService = $permisoService;
    }

    public function index()
    {
        $roles = DB::table('roles')
            ->where('activo', 1)
            ->where('es_oculto', 0)
            ->orderBy('nivel_permiso')
            ->get();

        $permisos = DB::table('permisos')
            ->where('activo', 1)
            ->orderBy('modulo')
            ->orderBy('nombre')
            ->get()
            ->groupBy('modulo');

        $asignaciones = DB::table('permisos_roles')
            ->select('rol_id', 'permiso_id')
            ->get()
            ->groupBy('rol_id')
            ->map(function ($items) {
                return $items->pluck('permiso_id')->toArray();
            });

        $usuariosPorRol = DB::table('usuarios')
            ->select('rol_id', DB::raw('COUNT(*) as total'))
            ->where('activo', 1)
            ->whereIn('rol_id', $roles->pluck('id'))
            ->groupBy('rol_id')
            ->pluck('total', 'rol_id');

        return Inertia::render('Config/Usuarios/RolesPermisos', [
            'roles' => $roles,
            'permisos' => $permisos,
            'asignaciones' => $asignaciones,
            'usuariosPorRol' => $usuariosPorRol,
        ]);
    }

    public function update(Request $request, $rolId)
    {
        $rol = DB::table('roles')
            ->where('id', $rolId)
            ->where('activo', 1)
            ->where('es_oculto', 0)
            ->first();

        if (!$rol) {
            return redirect()->back()->withErrors(['error' => 'Rol no encontrado']);
        }

        $validator = Validator::make($request->all(), [
            'permisos' => 'sometimes|array',
            'permisos.*' => 'exists:permisos,id'
        ]);

        if ($validator->fails()) {
            return redirect()->back()->withErrors($validator->errors());
        }

        try {
            DB::transaction(function () use ($rolId, $request) {
                DB::table('permisos_roles')
                    ->where('rol_id', $rolId)
                    ->delete();

                $permisos = $request->input('permisos', []);
                foreach ($permisos as $permisoId) {
                    DB::table('permisos_roles')->insert([
                        'rol_id' => $rolId,
                        'permiso_id' => $permisoId,
                        'created' => now(),
                        'created_by' => auth()->id(),
                    ]);
                }
            });

            $usuarios = DB::table('usuarios')->where('rol_id', $rolId)->pluck('id');
            foreach ($usuarios as $usuarioId) {
                $this->permisoService->limpiarCache($usuarioId);
            }

            return redirect()->back()->with('success', 'Permisos actualizados correctamente');

        } catch (\Exception $e) {
            Log::error('Error actualizando permisos:', [
                'rol_id' => $rolId,
                'error' => $e->getMessage()
            ]);

            return redirect()->back()->withErrors(['error' => 'Error al actualizar permisos']);
        }
    }
}