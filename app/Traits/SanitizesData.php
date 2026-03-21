<?php
// app/Traits/SanitizesData.php

namespace App\Traits;

trait SanitizesData
{
    /**
     * Sanitizar un valor
     */
    protected function sanitizarValor($valor, $maxLength = 255)
    {
        if ($valor === null) return null;
        
        if (is_string($valor)) {
            // Eliminar etiquetas HTML
            $valor = strip_tags($valor);
            // Escapar caracteres HTML
            $valor = htmlspecialchars($valor, ENT_QUOTES, 'UTF-8');
            // Eliminar caracteres de control
            $valor = preg_replace('/[\x00-\x09\x0B\x0C\x0E-\x1F\x7F]/', '', $valor);
            // Limitar longitud
            if ($maxLength && strlen($valor) > $maxLength) {
                $valor = substr($valor, 0, $maxLength);
            }
        }
        
        return $valor;
    }
    
    /**
     * Sanitizar patente
     */
    protected function sanitizarPatente($patente)
    {
        if (!$patente) return null;
        
        // Eliminar espacios extras y convertir a mayúsculas
        $patente = preg_replace('/\s+/', ' ', trim($patente));
        $patente = strtoupper($patente);
        
        // Eliminar caracteres no permitidos en patente
        $patente = preg_replace('/[^A-Z0-9\s]/', '', $patente);
        
        return $this->sanitizarValor($patente, 20);
    }
    
    /**
     * Sanitizar array de vehículos
     */
    protected function sanitizarVehiculos(array $vehiculos): array
    {
        $sanitizados = [];
        
        foreach ($vehiculos as $vehiculo) {
            $sanitizados[] = [
                'id' => $this->sanitizarValor($vehiculo['id'] ?? null, 50),
                'movilId' => $this->sanitizarValor($vehiculo['movilId'] ?? null, 50),
                'identificador' => $this->sanitizarValor($vehiculo['identificador'] ?? null, 100),
                'patente' => $this->sanitizarPatente($vehiculo['patente'] ?? null),
                'empresa' => isset($vehiculo['empresa']) ? [
                    'id' => $this->sanitizarValor($vehiculo['empresa']['id'] ?? null, 50),
                    'nombre' => $this->sanitizarValor($vehiculo['empresa']['nombre'] ?? null, 200),
                    'cuit' => $this->sanitizarValor($vehiculo['empresa']['cuit'] ?? null, 20),
                ] : null,
            ];
        }
        
        return $sanitizados;
    }
}