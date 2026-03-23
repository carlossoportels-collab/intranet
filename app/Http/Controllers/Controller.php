<?php

namespace App\Http\Controllers;

use Illuminate\Foundation\Bus\DispatchesJobs;
use Illuminate\Routing\Controller as BaseController;
use Illuminate\Foundation\Validation\ValidatesRequests;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;
use App\Traits\Authorizable;
use Inertia\Inertia;

class Controller extends BaseController
{
    use AuthorizesRequests, DispatchesJobs, ValidatesRequests, Authorizable;

    public function __construct()
    {
        $this->initializeAuthorization();
        
        // Compartir permisos con todas las vistas de Inertia
        Inertia::share([
            'auth' => function () {
                $user = auth()->user();
                if (!$user) return null;
                
                return [
                    'user' => [
                        'id' => $user->id,
                        'name' => $user->name,
                        'email' => $user->email,
                        'rol_id' => $user->rol_id,
                        've_todas_cuentas' => $user->ve_todas_cuentas ?? false,
                        'personal_id' => $user->personal_id ?? null,
                    ],
                    'permisos' => $this->permisoService->getPermisosUsuario($user->id),
                    'prefijosPermitidos' => $this->permisoService->getPrefijosPermitidos($user->id),
                    'puedeVerTodos' => $this->permisoService->puedeVerTodos($user->id),
                ];
            }
        ]);
    }
}