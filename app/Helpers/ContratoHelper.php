<?php
// app/Helpers/ContratoHelper.php

namespace App\Helpers;

use App\Models\Contrato;
use App\Models\Prefijo;
use Illuminate\Support\Facades\DB;

class ContratoHelper
{
    /**
     * Generar el próximo número de contrato según la compañía
     */
    public static function generarNumeroContrato($prefijoId)
    {
        // Obtener el prefijo con su comercial y compañía
        $prefijo = Prefijo::with('comercial.compania')->find($prefijoId);
        
        if (!$prefijo) {
            throw new \Exception("Prefijo no encontrado");
        }

        // Obtener el comercial asociado al prefijo
        $comercial = $prefijo->comercial->first(); // Es una relación hasMany
        
        // Determinar compañía
        $companiaId = 1; // Localsat por defecto
        
        if ($comercial && $comercial->compania) {
            $companiaId = $comercial->compania->id;
        } elseif ($comercial && $comercial->compania_id) {
            // Si no tiene la relación cargada pero tiene el ID
            $companiaId = $comercial->compania_id;
        }
        
        // Rango según compañía
        if ($companiaId == 2) { // Smartsat
            $min = 800000;
            $max = 899999;
        } else { // Localsat (1) u otros
            $min = 500000;
            $max = 599999;
        }
        
        // Usar transacción para evitar condiciones de carrera
        return DB::transaction(function () use ($min, $max) {
            // Buscar el último contrato en ese rango
            $ultimoContrato = Contrato::whereBetween('id', [$min, $max])
                ->orderBy('id', 'desc')
                ->lockForUpdate()
                ->first();
            
            if ($ultimoContrato) {
                $nuevoId = $ultimoContrato->id + 1;
            } else {
                $nuevoId = $min;
            }
            
            // Verificar que no exceda el máximo
            if ($nuevoId > $max) {
                throw new \Exception("No hay más números de contrato disponibles para esta compañía");
            }
            
            return $nuevoId;
        });
    }
    
    /**
     * Versión simplificada sin transacción (útil para pruebas o si hay problemas de bloqueo)
     */
    public static function generarNumeroContratoSimple($prefijoId)
    {
        // Obtener el prefijo
        $prefijo = Prefijo::find($prefijoId);
        
        // Obtener el ID de compañía usando el nuevo método del modelo
        $companiaId = $prefijo ? $prefijo->compania_id : 1; // 1 = Localsat por defecto
        
        // Rango según compañía
        if ($companiaId == 2) { // Smartsat
            $min = 800000;
            $max = 899999;
        } else { // Localsat (1) u otros
            $min = 500000;
            $max = 599999;
        }
        
        // Buscar el último contrato (sin lock)
        $ultimoContrato = Contrato::whereBetween('id', [$min, $max])
            ->orderBy('id', 'desc')
            ->first();
        
        if ($ultimoContrato) {
            $nuevoId = $ultimoContrato->id + 1;
        } else {
            $nuevoId = $min;
        }
        
        // Verificar que no exceda el máximo
        if ($nuevoId > $max) {
            throw new \Exception("No hay más números de contrato disponibles para esta compañía");
        }
        
        return $nuevoId;
    }
    
    /**
     * Formatear número de contrato para mostrar (con ceros a la izquierda)
     */
    public static function formatearNumeroContrato($id)
    {
        return str_pad($id, 8, '0', STR_PAD_LEFT);
    }
    
    /**
     * Determinar la compañía por el ID de contrato
     */
    public static function determinarCompaniaPorId($id)
    {
        if ($id >= 800000 && $id <= 899999) {
            return 'SMARTSAT';
        } elseif ($id >= 500000 && $id <= 599999) {
            return 'LOCALSAT';
        }
        return 'LOCALSAT'; // Por defecto
    }
    
    /**
     * Obtener el rango de números según compañía
     */
    public static function getRangoPorCompania($companiaId)
    {
        return match($companiaId) {
            2 => ['min' => 800000, 'max' => 899999], // Smartsat
            default => ['min' => 500000, 'max' => 599999], // Localsat
        };
    }
}