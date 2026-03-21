<?php
// app/Traits/HasPermisosService.php

namespace App\Traits;

use App\Services\PermisoService;

trait HasPermisosService
{
    protected $permisoService;

    protected function initializePermisoService()
    {
        $this->permisoService = app(PermisoService::class);
    }

    protected function getPrefijosPermitidos($usuarioId = null)
    {
        $usuarioId = $usuarioId ?? auth()->id();
        return $this->permisoService->getPrefijosPermitidos($usuarioId);
    }

    protected function puedeVerTodasLasCuentas($usuarioId = null)
    {
        return $this->permisoService->puedeVerTodos($usuarioId);
    }

    protected function getCompaniasPermitidas($usuarioId = null)
    {
        return $this->permisoService->getCompaniasPermitidas($usuarioId);
    }

    protected function applyPrefijoFilter($query, $usuario = null)
    {
        return $this->permisoService->aplicarFiltroPrefijos($query, $usuario);
    }

    protected function applyCompaniaFilter($query, $campo = 'compania_id')
    {
        return $this->permisoService->aplicarFiltroCompania($query, $campo);
    }
}