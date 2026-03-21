<?php
// app/Traits/Authorizable.php

namespace App\Traits;

use Illuminate\Support\Facades\Log;

trait Authorizable
{
    protected $permisoService;

    /**
     * Inicializar servicios (llamar desde el constructor)
     */
    protected function initializeAuthorization()
    {
        $this->permisoService = app(\App\Services\PermisoService::class);
    }

    /**
     * Verificar si el usuario tiene un permiso
     */
    protected function authorizePermiso(string $permiso, ?string $message = null)
    {
        $usuario = auth()->user();
        
        if (!$usuario) {
            abort(401, 'No autenticado');
        }

        if (!$this->permisoService->usuarioTienePermiso($usuario->id, $permiso)) {
            Log::warning('Intento de acceso sin permiso', [
                'usuario_id' => $usuario->id,
                'permiso' => $permiso,
                'ruta' => request()->path()
            ]);
            
            abort(403, $message ?? 'No tienes permiso para realizar esta acción.');
        }
        
        return true;
    }

    /**
     * Verificar si el usuario puede acceder a un lead específico (por prefijo)
     */
    protected function authorizeLeadAccess($lead, ?string $permisoAdicional = null)
    {
        $usuario = auth()->user();
        
        // Si tiene permiso para ver todas las cuentas, ok
        if ($this->permisoService->puedeVerTodos($usuario->id)) {
            return true;
        }
        
        // Verificar si tiene permiso para el prefijo del lead
        $prefijosPermitidos = $this->permisoService->getPrefijosPermitidos($usuario->id);
        
        if (!in_array($lead->prefijo_id, $prefijosPermitidos)) {
            Log::warning('Intento de acceso a lead sin autorización', [
                'usuario_id' => $usuario->id,
                'lead_id' => $lead->id,
                'prefijo_lead' => $lead->prefijo_id,
                'prefijos_permitidos' => $prefijosPermitidos
            ]);
            
            abort(403, 'No tienes permiso para acceder a este lead.');
        }
        
        // Si además requiere un permiso específico
        if ($permisoAdicional) {
            $this->authorizePermiso($permisoAdicional);
        }
        
        return true;
    }

    /**
     * Verificar si el usuario puede modificar un lead
     */
    protected function authorizeLeadModification($lead)
    {
        return $this->authorizeLeadAccess($lead, 'gestionar_leads');
    }

    /**
     * Verificar si el usuario puede ver estadísticas
     */
    protected function authorizeEstadisticas()
    {
        $usuarioId = auth()->id();
        
        // Usuarios especiales para estadísticas (3 y 5)
        $usuariosEspeciales = [3, 5];
        
        if (in_array($usuarioId, $usuariosEspeciales)) {
            return true;
        }
        
        return $this->authorizePermiso('ver_estadisticas_grupales');
    }

    /**
     * Obtener query con filtro de prefijos para leads
     */
    protected function applyPrefijoFilter($query, $usuario = null)
    {
        $usuario = $usuario ?? auth()->user();
        
        return $this->permisoService->aplicarFiltroPrefijos($query, $usuario);
    }

    /**
     * Verificar si el usuario puede ver todos los registros
     */
    protected function canViewAllRecords(): bool
    {
        return $this->permisoService->puedeVerTodos();
    }

    /**
     * Obtener compañía del usuario
     */
    protected function getUsuarioCompania()
    {
        return $this->permisoService->getCompaniaUsuario();
    }

    /**
     * Obtener prefijos permitidos del usuario
     */
    protected function getPrefijosPermitidos()
    {
        return $this->permisoService->getPrefijosPermitidos(auth()->id());
    }

    /**
     * Obtener compañías permitidas para el usuario
     */
    protected function getCompaniasPermitidas()
    {
        return $this->permisoService->getCompaniasPermitidas();
    }

    /**
     * Aplicar filtro de compañía a una query
     */
    protected function applyCompaniaFilter($query, $campoCompania = 'compania_id')
    {
        return $this->permisoService->aplicarFiltroCompania($query, $campoCompania);
    }

    /**
     * Manejar respuesta de error con formato consistente
     */
    protected function errorResponse(string $message, int $status = 400, array $extra = [])
    {
        if (request()->expectsJson() || request()->header('X-Inertia')) {
            return back()->withErrors(['error' => $message]);
        }
        
        return response()->json(array_merge([
            'success' => false,
            'message' => $message
        ], $extra), $status);
    }

    /**
     * Manejar respuesta de éxito con formato consistente
     */
    protected function successResponse(string $message, array $extra = [], int $status = 200)
    {
        if (request()->expectsJson() || request()->header('X-Inertia')) {
            return redirect()->back()->with('success', $message);
        }
        
        return response()->json(array_merge([
            'success' => true,
            'message' => $message
        ], $extra), $status);
    }
}