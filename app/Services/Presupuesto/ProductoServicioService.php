<?php
// app/Services/Presupuesto/ProductoServicioService.php

namespace App\Services\Presupuesto;

use App\Models\ProductoServicio;
use App\Traits\HasPermisosService;
use Illuminate\Support\Collection;

class ProductoServicioService
{
    use HasPermisosService;

    public function __construct()
    {
        $this->initializePermisoService();
    }

    /**
     * Obtener tasas disponibles (solo TASAS y presupuestables)
     */
    public function getTasas(): Collection
    {
        $query = ProductoServicio::with('tipo')
            ->tasas()
            ->activos()
            ->presupuestables();

        $this->applyCompaniaFilter($query);

        return $query->orderBy('nombre')->get();
    }

    /**
     * Obtener abonos y convenios (presupuestables)
     */
    public function getAbonosYConvenios(): Collection
    {
        $query = ProductoServicio::with('tipo')
            ->abonos()
            ->activos()
            ->presupuestables();

        $this->applyCompaniaFilter($query);

        return $query->orderBy('nombre')->get();
    }

    /**
     * Obtener solo abonos (presupuestables)
     */
    public function getAbonos(): Collection
    {
        $query = ProductoServicio::with('tipo')
            ->soloAbonos()
            ->activos()
            ->presupuestables();

        $this->applyCompaniaFilter($query);

        return $query->orderBy('nombre')->get();
    }

    /**
     * Obtener solo convenios (presupuestables)
     */
    public function getConvenios(): Collection
    {
        $query = ProductoServicio::with('tipo')
            ->soloConvenios()
            ->activos()
            ->presupuestables();

        $this->applyCompaniaFilter($query);

        return $query->orderBy('nombre')->get();
    }

    /**
     * Obtener accesorios disponibles (presupuestables)
     */
    public function getAccesorios(): Collection
    {
        $query = ProductoServicio::with('tipo')
            ->accesorios()
            ->activos()
            ->presupuestables();

        $this->applyCompaniaFilter($query);

        return $query->orderBy('nombre')->get();
    }

    /**
     * Obtener servicios adicionales (presupuestables)
     */
    public function getServicios(): Collection
    {
        $query = ProductoServicio::with('tipo')
            ->servicios()
            ->activos()
            ->presupuestables();

        $this->applyCompaniaFilter($query);

        return $query->orderBy('nombre')->get();
    }

    /**
     * Obtener producto por ID (verificando que sea presupuestable)
     */
    public function find($id): ?ProductoServicio
    {
        if (!$id || $id == 0) {
            return null;
        }

        $producto = ProductoServicio::with('tipo')
            ->activos()
            ->presupuestables()
            ->find($id);
        
        if (!$producto) {
            return null;
        }

        // Verificar permisos de compañía
        $companiasPermitidas = $this->getCompaniasPermitidas();
        
        if (!in_array($producto->compania_id, $companiasPermitidas)) {
            return null;
        }

        return $producto;
    }

    /**
     * 🔥 NUEVO: Validar que un producto existe y es válido para presupuesto
     */
    public function validateProducto($id): bool
    {
        if (!$id || $id == 0) {
            return false;
        }

        $producto = ProductoServicio::activos()
            ->presupuestables()
            ->find($id);

        if (!$producto) {
            return false;
        }

        $companiasPermitidas = $this->getCompaniasPermitidas();
        
        return in_array($producto->compania_id, $companiasPermitidas);
    }

    /**
     * 🔥 NUEVO: Filtrar solo productos válidos de un array
     */
    public function filtrarProductosValidos(array $productosIds): array
    {
        if (empty($productosIds)) {
            return [];
        }

        return ProductoServicio::activos()
            ->presupuestables()
            ->whereIn('id', $productosIds)
            ->pluck('id')
            ->toArray();
    }
}