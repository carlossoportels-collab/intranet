<?php
// app/Services/Presupuesto/PresupuestoService.php

namespace App\Services\Presupuesto;

use App\Models\Presupuesto;
use App\Models\PresupuestoAgregado;
use App\Models\Lead;
use App\Services\Promocion\PromocionService;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Auth;

class PresupuestoService
{
    protected $promocionService;
    protected $notificationService;

    public function __construct(
        PromocionService $promocionService,
        PresupuestoNotificationService $notificationService
    ) {
        $this->promocionService = $promocionService;
        $this->notificationService = $notificationService;
    }

    /**
     * Calcular subtotal para promociones 2x1 y 3x2 (EXACTO)
     */
    private function calcularSubtotalPack(float $valor, int $cantidad, string $tipoPromocion): float
    {
        if ($tipoPromocion === '2x1') {
            // 2x1: por cada 2, pagás 1
            $grupos = intdiv($cantidad, 2);
            $resto = $cantidad % 2;
            $unidadesPagas = $grupos + $resto;
            return round($valor * $unidadesPagas, 2);
        } elseif ($tipoPromocion === '3x2') {
            // 3x2: por cada 3, pagás 2
            $grupos = intdiv($cantidad, 3);
            $resto = $cantidad % 3;
            $unidadesPagas = ($grupos * 2) + $resto;
            return round($valor * $unidadesPagas, 2);
        }
        
        // Si no es promoción de packs, devolver 0 (no debería llegar aquí)
        return 0;
    }

    /**
     * Calcular subtotal con bonificación normal o promoción
     */
    private function calcularSubtotalConPromocion(
        float $valor, 
        int $cantidad, 
        ?string $tipoPromocion, 
        float $bonificacion = 0
    ): float {
        if ($tipoPromocion === '2x1' || $tipoPromocion === '3x2') {
            return $this->calcularSubtotalPack($valor, $cantidad, $tipoPromocion);
        }
        
        $subtotal = $valor * $cantidad;
        if ($bonificacion > 0) {
            $subtotal = $subtotal * (1 - $bonificacion / 100);
        }
        return round($subtotal, 2);
    }

    public function createPresupuesto(array $data, Lead $lead = null)
    {
        
        return DB::transaction(function () use ($data, $lead) {
            try {
                // Obtener la promoción si existe
                $promocion = null;
                $promocionId = $data['promocion_id'] ?? null;
                $tipoPromocionTasa = null;
                $tipoPromocionAbono = null;
                
                if ($promocionId) {
                    $promocion = \App\Models\Promocion::with('productos')->find($promocionId);
                    
                    if ($promocion) {
                        // Determinar si la tasa tiene promoción 2x1/3x2
                        $productoTasa = $promocion->productos->firstWhere('producto_servicio_id', $data['tasa_id']);
                        if ($productoTasa && ($productoTasa->tipo_promocion === '2x1' || $productoTasa->tipo_promocion === '3x2')) {
                            $tipoPromocionTasa = $productoTasa->tipo_promocion;
                        }
                        
                        // Determinar si el abono tiene promoción 2x1/3x2
                        $productoAbono = $promocion->productos->firstWhere('producto_servicio_id', $data['abono_id']);
                        if ($productoAbono && ($productoAbono->tipo_promocion === '2x1' || $productoAbono->tipo_promocion === '3x2')) {
                            $tipoPromocionAbono = $productoAbono->tipo_promocion;
                        }
                    }
                }
                
                // Calcular subtotal de tasa (considerando promoción 2x1/3x2)
                $subtotalTasa = $this->calcularSubtotalConPromocion(
                    $data['valor_tasa'] ?? 0,
                    $data['cantidad_vehiculos'],
                    $tipoPromocionTasa,
                    $data['tasa_bonificacion'] ?? 0
                );
                
                // Calcular subtotal de abono (considerando promoción 2x1/3x2)
                $subtotalAbono = $this->calcularSubtotalConPromocion(
                    $data['valor_abono'] ?? 0,
                    $data['cantidad_vehiculos'],
                    $tipoPromocionAbono,
                    $data['abono_bonificacion'] ?? 0
                );
                
                // Calcular subtotal de agregados (considerando promociones)
                $subtotalAgregados = $this->calcularSubtotalAgregadosConPromocion(
                    $data['agregados'] ?? [],
                    $promocion,
                    $data['cantidad_vehiculos']
                );
                
                
                // Crear presupuesto
                $presupuestoData = [
                    'prefijo_id' => $data['prefijo_id'],
                    'lead_id' => $lead?->id ?? $data['lead_id'],
                    'promocion_id' => $promocionId,
                    'cantidad_vehiculos' => $data['cantidad_vehiculos'],
                    'validez' => $data['validez'],
                    'tasa_id' => $data['tasa_id'],
                    'valor_tasa' => $data['valor_tasa'],
                    'tasa_bonificacion' => $data['tasa_bonificacion'] ?? 0,
                    'subtotal_tasa' => $subtotalTasa,
                    'tasa_metodo_pago_id' => $data['tasa_metodo_pago_id'],
                    'abono_id' => $data['abono_id'],
                    'valor_abono' => $data['valor_abono'],
                    'abono_bonificacion' => $data['abono_bonificacion'] ?? 0,
                    'subtotal_abono' => $subtotalAbono,
                    'abono_metodo_pago_id' => $data['abono_metodo_pago_id'],
                    'subtotal_productos_agregados' => $subtotalAgregados,
                    'total_presupuesto' => $subtotalTasa + $subtotalAbono + $subtotalAgregados,
                    'estado_id' => 1,
                    'activo' => true,
                    'created_by' => Auth::id(),
                ];

                $presupuesto = Presupuesto::create($presupuestoData);
                
                if (!$presupuesto || !$presupuesto->id) {
                    \Log::error('No se pudo crear el presupuesto: el modelo no devolvió ID');
                    throw new \Exception('Error al crear el presupuesto en la base de datos');
                }

                // Crear agregados
                if (!empty($data['agregados'])) {
                    
                    foreach ($data['agregados'] as $index => $agregado) {
                        // Determinar si este producto tiene promoción
                        $tipoPromocionAgregado = null;
                        if ($promocion) {
                            $productoAgregado = $promocion->productos
                                ->firstWhere('producto_servicio_id', $agregado['prd_servicio_id']);
                            if ($productoAgregado && ($productoAgregado->tipo_promocion === '2x1' || $productoAgregado->tipo_promocion === '3x2')) {
                                $tipoPromocionAgregado = $productoAgregado->tipo_promocion;
                            }
                        }
                        
                        $cantidad = $agregado['aplica_a_todos_vehiculos'] ? $data['cantidad_vehiculos'] : $agregado['cantidad'];
                        
                        $subtotal = $this->calcularSubtotalConPromocion(
                            $agregado['valor'],
                            $cantidad,
                            $tipoPromocionAgregado,
                            $agregado['bonificacion'] ?? 0
                        );
                        
                        $agregadoCreado = $presupuesto->agregados()->create([
                            'prd_servicio_id' => $agregado['prd_servicio_id'],
                            'cantidad' => $agregado['cantidad'],
                            'aplica_a_todos_vehiculos' => $agregado['aplica_a_todos_vehiculos'] ?? false,
                            'valor' => $agregado['valor'],
                            'bonificacion' => $agregado['bonificacion'] ?? 0,
                            'subtotal' => $subtotal,
                        ]);
                        
                    }
                }
                
                // Crear notificación
                $this->notificationService->notificarPresupuestoCreado($presupuesto);

                return $presupuesto;
                
            } catch (\Exception $e) {
                \Log::error('ERROR EN TRANSACCIÓN: ' . $e->getMessage());
                \Log::error('Trace: ' . $e->getTraceAsString());
                throw $e;
            }
        });
    }
    
    /**
     * Calcular subtotal de agregados considerando promociones
     */
    private function calcularSubtotalAgregadosConPromocion(array $agregados, $promocion, $cantidadVehiculos)
    {
        $total = 0;
        foreach ($agregados as $agregado) {
            $tipoPromocion = null;
            if ($promocion) {
                $productoAgregado = $promocion->productos
                    ->firstWhere('producto_servicio_id', $agregado['prd_servicio_id']);
                if ($productoAgregado && ($productoAgregado->tipo_promocion === '2x1' || $productoAgregado->tipo_promocion === '3x2')) {
                    $tipoPromocion = $productoAgregado->tipo_promocion;
                }
            }
            
            $cantidad = $agregado['aplica_a_todos_vehiculos'] ? $cantidadVehiculos : $agregado['cantidad'];
            
            $total += $this->calcularSubtotalConPromocion(
                $agregado['valor'],
                $cantidad,
                $tipoPromocion,
                $agregado['bonificacion'] ?? 0
            );
        }
        return $total;
    }

    public function updatePresupuesto(Presupuesto $presupuesto, array $data)
{

    
    return DB::transaction(function () use ($presupuesto, $data) {
        try {
            // Obtener la promoción si existe
            $promocion = null;
            $promocionId = $data['promocion_id'] ?? null;
            
            if ($promocionId) {
                $promocion = \App\Models\Promocion::with('productos')->find($promocionId);
            }
            
            // Calcular subtotales (igual que en create)
            $subtotalTasa = $this->calcularSubtotalConPromocion(
                $data['valor_tasa'] ?? 0,
                $data['cantidad_vehiculos'],
                $this->getTipoPromocion($promocion, $data['tasa_id']),
                $data['tasa_bonificacion'] ?? 0
            );
            
            $subtotalAbono = $this->calcularSubtotalConPromocion(
                $data['valor_abono'] ?? 0,
                $data['cantidad_vehiculos'],
                $this->getTipoPromocion($promocion, $data['abono_id']),
                $data['abono_bonificacion'] ?? 0
            );
            
            $subtotalAgregados = $this->calcularSubtotalAgregadosConPromocion(
                $data['agregados'] ?? [],
                $promocion,
                $data['cantidad_vehiculos']
            );
            
            // Actualizar presupuesto
            $presupuesto->update([
                'prefijo_id' => $data['prefijo_id'],
                'promocion_id' => $promocionId,
                'cantidad_vehiculos' => $data['cantidad_vehiculos'],
                'validez' => $data['validez'],
                'tasa_id' => $data['tasa_id'],
                'valor_tasa' => $data['valor_tasa'],
                'tasa_bonificacion' => $data['tasa_bonificacion'] ?? 0,
                'subtotal_tasa' => $subtotalTasa,
                'tasa_metodo_pago_id' => $data['tasa_metodo_pago_id'],
                'abono_id' => $data['abono_id'],
                'valor_abono' => $data['valor_abono'],
                'abono_bonificacion' => $data['abono_bonificacion'] ?? 0,
                'subtotal_abono' => $subtotalAbono,
                'abono_metodo_pago_id' => $data['abono_metodo_pago_id'],
                'subtotal_productos_agregados' => $subtotalAgregados,
                'total_presupuesto' => $subtotalTasa + $subtotalAbono + $subtotalAgregados,
                'modified_by' => Auth::id(),
            ]);
            
            // Eliminar agregados anteriores
            $presupuesto->agregados()->delete();
            
            // Crear nuevos agregados
            if (!empty($data['agregados'])) {
                foreach ($data['agregados'] as $agregado) {
                    $tipoPromocion = $this->getTipoPromocion($promocion, $agregado['prd_servicio_id']);
                    
                    $cantidad = $agregado['aplica_a_todos_vehiculos'] ? $data['cantidad_vehiculos'] : $agregado['cantidad'];
                    
                    $subtotal = $this->calcularSubtotalConPromocion(
                        $agregado['valor'],
                        $cantidad,
                        $tipoPromocion,
                        $agregado['bonificacion'] ?? 0
                    );
                    
                    $presupuesto->agregados()->create([
                        'prd_servicio_id' => $agregado['prd_servicio_id'],
                        'cantidad' => $agregado['cantidad'],
                        'aplica_a_todos_vehiculos' => $agregado['aplica_a_todos_vehiculos'] ?? false,
                        'valor' => $agregado['valor'],
                        'bonificacion' => $agregado['bonificacion'] ?? 0,
                        'subtotal' => $subtotal,
                    ]);
                }
            }
            
            
            return $presupuesto->fresh();
            
        } catch (\Exception $e) {
            \Log::error('ERROR EN TRANSACCIÓN UPDATE: ' . $e->getMessage());
            throw $e;
        }
    });
}

private function getTipoPromocion($promocion, $productoId)
{
    if (!$promocion) return null;
    
    $producto = $promocion->productos->firstWhere('producto_servicio_id', $productoId);
    if (!$producto) return null;
    
    if ($producto->tipo_promocion === '2x1' || $producto->tipo_promocion === '3x2') {
        return $producto->tipo_promocion;
    }
    
    return null;
}

}