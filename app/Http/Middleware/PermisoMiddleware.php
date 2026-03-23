<?php
// app/Http/Middleware/PermisoMiddleware.php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\PermisoService;
use Illuminate\Support\Facades\Log;

class PermisoMiddleware
{
    protected $permisoService;

    public function __construct(PermisoService $permisoService)
    {
        $this->permisoService = $permisoService;
    }

    public function handle(Request $request, Closure $next, $permisoNombre)
    {
        if (!auth()->check()) {
            Log::warning('PermisoMiddleware: Usuario no autenticado');
            return redirect()->route('login');
        }

        $usuario = auth()->user();
        $usuarioId = $usuario->id;
        
        // LOG 2: Verificar si el servicio responde
        $tienePermiso = $this->permisoService->usuarioTienePermiso($usuarioId, $permisoNombre);

        
        if (!$tienePermiso) {
            Log::warning('ACCESO DENEGADO - 403', [
                'usuario_id' => $usuarioId,
                'usuario_nombre' => $usuario->nombre_usuario,
                'rol_id' => $usuario->rol_id,
                'permiso' => $permisoNombre,
                'url' => $request->fullUrl()
            ]);
            
            abort(403, 'No tienes permiso para acceder a esta página.');
        }

        return $next($request);
    }
}