<?php
// app/Services/PermisoService.php

namespace App\Services;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

class PermisoService
{
    /**
     * Verificar si un usuario tiene un permiso específico
     */
    public function usuarioTienePermiso($usuarioId, $permisoNombre)
    {
        $cacheKey = "usuario_permisos_{$usuarioId}";
        
        $permisos = Cache::remember($cacheKey, 3600, function () use ($usuarioId) {
            $usuario = DB::table('usuarios')->where('id', $usuarioId)->first();
            if (!$usuario) return [];
            
            return DB::table('permisos_roles as pr')
                ->join('permisos as p', 'pr.permiso_id', '=', 'p.id')
                ->where('pr.rol_id', $usuario->rol_id)
                ->where('p.activo', 1)
                ->pluck('p.nombre')
                ->toArray();
        });
        
        return in_array($permisoNombre, $permisos);
    }

    /**
     * Obtener TODOS los permisos de un usuario (para frontend)
     */
    public function getPermisosUsuario($usuarioId)
    {
        $usuario = DB::table('usuarios')->where('id', $usuarioId)->first();
        if (!$usuario) return [];
        
        return DB::table('permisos_roles as pr')
            ->join('permisos as p', 'pr.permiso_id', '=', 'p.id')
            ->where('pr.rol_id', $usuario->rol_id)
            ->where('p.activo', 1)
            ->pluck('p.nombre')
            ->toArray();
    }

    /**
     * Obtener los prefijos permitidos para un usuario
     */
    public function getPrefijosPermitidos($usuarioId)
    {
        return Cache::remember("usuario_prefijos_{$usuarioId}", 3600, function () use ($usuarioId) {
            return DB::table('usuario_prefijos')
                ->where('usuario_id', $usuarioId)
                ->where('activo', 1)
                ->whereNull('deleted_at')
                ->pluck('prefijo_id')
                ->toArray();
        });
    }
    
    /**
     * Obtener la compañía del usuario logueado
     */
    public function getCompaniaUsuario($usuarioId = null)
    {
        $usuarioId = $usuarioId ?? auth()->id();
        
        if (!$usuarioId) {
            return null;
        }
        
        return Cache::remember("usuario_compania_{$usuarioId}", 3600, function () use ($usuarioId) {
            $usuario = DB::table('usuarios')->where('id', $usuarioId)->first();
            if (!$usuario) return null;
            
            $comercial = DB::table('comercial')
                ->where('personal_id', $usuario->personal_id)
                ->first();
            
            return $comercial ? $comercial->compania_id : null;
        });
    }
    
    /**
     * Verificar si el usuario puede ver todos los registros
     */
    public function puedeVerTodos($usuarioId = null)
    {
        $usuarioId = $usuarioId ?? auth()->id();
        
        if (!$usuarioId) return false;
        
        return Cache::remember("usuario_ve_todas_{$usuarioId}", 3600, function () use ($usuarioId) {
            $usuario = DB::table('usuarios')->where('id', $usuarioId)->first();
            return $usuario && $usuario->ve_todas_cuentas;
        });
    }
    
    /**
     * Aplicar filtro de compañía a una query
     */
    public function aplicarFiltroCompania($query, $campoCompania = 'compania_id', $usuarioId = null)
    {
        $usuarioId = $usuarioId ?? auth()->id();
        
        if (!$usuarioId) {
            return $query->whereRaw('1 = 0');
        }
        
        // Si puede ver todas las cuentas, no filtramos
        if ($this->puedeVerTodos($usuarioId)) {
            return $query;
        }
        
        // Obtener compañía del usuario
        $companiaId = $this->getCompaniaUsuario($usuarioId);
        
        if ($companiaId) {
            return $query->where($campoCompania, $companiaId);
        }
        
        // Si no tiene compañía asignada, no ve nada
        return $query->whereRaw('1 = 0');
    }
    
    /**
     * Aplicar filtro de prefijos a una query
     */
    public function aplicarFiltroPrefijos($query, $usuario = null)
    {
        $usuario = $usuario ?? auth()->user();
        
        if (!$usuario) {
            return $query->whereRaw('1 = 0');
        }
        
        if (!$usuario->ve_todas_cuentas) {
            $prefijosPermitidos = $this->getPrefijosPermitidos($usuario->id);
            
            if (!empty($prefijosPermitidos)) {
                $query->whereIn('prefijo_id', $prefijosPermitidos);
            } else {
                $query->whereRaw('1 = 0');
            }
        }
        
        return $query;
    }
    
    /**
     * Obtener los IDs de compañía permitidos para el usuario
     */
    public function getCompaniasPermitidas($usuarioId = null)
    {
        $usuarioId = $usuarioId ?? auth()->id();
        
        if (!$usuarioId) {
            return [];
        }
        
        if ($this->puedeVerTodos($usuarioId)) {
            // Si ve todas, devolvemos todas las compañías activas
            return DB::table('companias')
                ->where('es_activo', 1)
                ->pluck('id')
                ->toArray();
        }
        
        $companiaId = $this->getCompaniaUsuario($usuarioId);
        
        return $companiaId ? [$companiaId] : [];
    }

    /**
     * Limpiar caché de permisos de un usuario
     */
    public function limpiarCache($usuarioId)
    {
        Cache::forget("usuario_permisos_{$usuarioId}");
        Cache::forget("usuario_prefijos_{$usuarioId}");
        Cache::forget("usuario_ve_todas_{$usuarioId}");
        Cache::forget("usuario_compania_{$usuarioId}");
    }

    /**
     * Limpiar caché de todos los usuarios (útil después de cambios masivos)
     */
    public function limpiarCacheTodos()
    {
        // No podemos limpiar por patrón fácilmente, pero podemos hacerlo por usuarios activos
        $usuarios = DB::table('usuarios')->where('activo', 1)->pluck('id');
        foreach ($usuarios as $usuarioId) {
            $this->limpiarCache($usuarioId);
        }
    }
}