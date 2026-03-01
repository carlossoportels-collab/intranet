<?php
// app/Helpers/ContratoHelper.php

namespace App\Helpers;

use App\Models\Contrato;
use App\Models\Prefijo;
use App\Models\Comercial;
use Illuminate\Support\Facades\DB;

class ContratoHelper
{
    /**
     * Generar el próximo número de contrato según la compañía
     */
    public static function generarNumeroContrato($prefijoId)
    {
        // Obtener el prefijo para determinar la compañía
        $prefijo = Prefijo::with('comercial.compania')->find($prefijoId);
        
        // Determinar la compañía (por defecto Localsat)
        $companiaId = 1; // Localsat por defecto
        
        if ($prefijo && $prefijo->comercial) {
            $comercial = $prefijo->comercial->first();
            $companiaId = $comercial?->compania_id ?? 1;
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
                ->lockForUpdate() // Bloquear para evitar duplicados
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
}