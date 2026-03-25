<?php
// app/Helpers/ContratoHelper.php

namespace App\Helpers;

use App\Models\Contrato;
use App\Models\Prefijo;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

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
            Log::error('Prefijo no encontrado', ['prefijo_id' => $prefijoId]);
            throw new \Exception("Prefijo no encontrado");
        }

        // Obtener el comercial asociado al prefijo
        $comercial = $prefijo->comercial->first();
        
        // Determinar compañía (por defecto Localsat = 1)
        $companiaId = 1;
        
        if ($comercial && $comercial->compania) {
            $companiaId = $comercial->compania->id;
        } elseif ($comercial && $comercial->compania_id) {
            $companiaId = $comercial->compania_id;
        }
        
        // Obtener el rango según la compañía
        $rango = self::getRangoPorCompania($companiaId);
        $min = $rango['min'];
        $max = $rango['max'];
        
        Log::info('Generando número de contrato', [
            'prefijo_id' => $prefijoId,
            'compania_id' => $companiaId,
            'min' => $min,
            'max' => $max
        ]);
        
        // Usar transacción para evitar condiciones de carrera
        return DB::transaction(function () use ($min, $max) {
            // Buscar el último contrato en ese rango
            $ultimoContrato = Contrato::whereBetween('id', [$min, $max])
                ->orderBy('id', 'desc')
                ->lockForUpdate()
                ->first();
            
            if ($ultimoContrato) {
                $nuevoId = $ultimoContrato->id + 1;
                Log::info('Último contrato encontrado', [
                    'ultimo_id' => $ultimoContrato->id,
                    'nuevo_id' => $nuevoId
                ]);
            } else {
                $nuevoId = $min;
                Log::info('No hay contratos previos, comenzando desde mínimo', [
                    'nuevo_id' => $nuevoId
                ]);
            }
            
            // Verificar que no exceda el máximo
            if ($nuevoId > $max) {
                Log::error('No hay más números disponibles', [
                    'nuevo_id' => $nuevoId,
                    'max' => $max
                ]);
                throw new \Exception("No hay más números de contrato disponibles para esta compañía (rango: {$min} - {$max})");
            }
            
            return $nuevoId;
        });
    }
    
    /**
     * Versión simplificada sin transacción (útil para pruebas o si hay problemas de bloqueo)
     */
    public static function generarNumeroContratoSimple($prefijoId)
    {
        // Obtener el prefijo con su comercial
        $prefijo = Prefijo::with('comercial.compania')->find($prefijoId);
        
        if (!$prefijo) {
            throw new \Exception("Prefijo no encontrado");
        }
        
        // Obtener el comercial asociado al prefijo
        $comercial = $prefijo->comercial->first();
        
        // Determinar compañía (por defecto Localsat = 1)
        $companiaId = 1;
        
        if ($comercial && $comercial->compania) {
            $companiaId = $comercial->compania->id;
        } elseif ($comercial && $comercial->compania_id) {
            $companiaId = $comercial->compania_id;
        }
        
        $rango = self::getRangoPorCompania($companiaId);
        $min = $rango['min'];
        $max = $rango['max'];
        
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
            throw new \Exception("No hay más números de contrato disponibles para esta compañía (rango: {$min} - {$max})");
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
    
    /**
     * Verificar si un ID está dentro del rango válido para una compañía
     */
    public static function esIdValidoParaCompania($id, $companiaId)
    {
        $rango = self::getRangoPorCompania($companiaId);
        return $id >= $rango['min'] && $id <= $rango['max'];
    }
    
    /**
     * Obtener el siguiente número disponible para una compañía (con fallback)
     */
    public static function obtenerSiguienteDisponible($companiaId)
    {
        $rango = self::getRangoPorCompania($companiaId);
        $min = $rango['min'];
        $max = $rango['max'];
        
        // Buscar el primer número disponible en el rango
        $idsOcupados = Contrato::whereBetween('id', [$min, $max])
            ->pluck('id')
            ->toArray();
        
        for ($i = $min; $i <= $max; $i++) {
            if (!in_array($i, $idsOcupados)) {
                return $i;
            }
        }
        
        return null; // No hay disponibles
    }
}