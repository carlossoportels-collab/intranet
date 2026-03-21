<?php
// app/Services/Presupuesto/ProductoServicioService.php

namespace App\Services\Presupuesto;

use App\Models\ProductoServicio;
use App\Traits\HasPermisosService; // 🔥 IMPORTAR TRAIT
use Illuminate\Support\Collection;

class ProductoServicioService
{
    use HasPermisosService; // 🔥 AGREGAR TRAIT

    public function __construct()
    {
        $this->initializePermisoService(); // 🔥 INICIALIZAR
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
}