<?php
// app/Services/Contrato/ContratoDataService.php

namespace App\Services\Contrato;

use App\Models\Contrato;
use App\Models\EmpresaContacto;
use Illuminate\Support\Facades\Log;

class ContratoDataService
{
    private ContratoService $contratoService;

    public function __construct(ContratoService $contratoService)
    {
        $this->contratoService = $contratoService;
    }

    /**
     * Preparar datos para el show del contrato
     */
    public function prepararDatosShow(Contrato $contrato): array
    {
        // Cargar relaciones
        $contrato->load([
            'vehiculos',
            'debitoCbu',
            'debitoTarjeta',
            'estado',
            'empresa',
            'presupuesto' => function($query) {
                $query->with([
                    'lead',
                    'tasa',
                    'abono',
                    'promocion',
                    'agregados' => function($q) {
                        $q->with([
                            'productoServicio' => function($pq) {
                                $pq->with('tipo');
                            }
                        ]);
                    }
                ]);
            }
        ]);

        $contrato->numero_contrato = str_pad($contrato->id, 8, '0', STR_PAD_LEFT);
        
        // Determinar si el lead es cliente
        $lead = $this->obtenerLead($contrato);
        $contrato->lead_es_cliente = $this->contratoService->determinarEsCliente($lead, $contrato->empresa_id, $contrato->id);
        $contrato->lead_nombre_completo = $lead?->nombre_completo ?? '';
        
        // Datos del vendedor y compañía
        $this->enriquecerConDatosVendedor($contrato);
        $this->enriquecerConDatosCompania($contrato);
        
        // Hidratar productos
        $this->hidratarProductos($contrato);
        
        // Agregar datos económicos
        $this->enriquecerConDatosEconomicos($contrato);
        
        return ['contrato' => $contrato];
    }

    /**
     * Obtener lead asociado al contrato
     */
    private function obtenerLead(Contrato $contrato)
    {
        if ($contrato->presupuesto && $contrato->presupuesto->lead) {
            return $contrato->presupuesto->lead;
        }
        
        if ($contrato->empresa) {
            $contacto = EmpresaContacto::where('empresa_id', $contrato->empresa_id)
                ->where('es_activo', true)
                ->first();
            if ($contacto && $contacto->lead) {
                return $contacto->lead;
            }
        }
        
        return null;
    }

    /**
     * Enriquecer contrato con datos del vendedor
     */
    private function enriquecerConDatosVendedor(Contrato $contrato): void
    {
        $contrato->vendedor_email = '';
        $contrato->vendedor_telefono = '';
        
        if ($contrato->presupuesto && $contrato->presupuesto->prefijo) {
            $comercial = $contrato->presupuesto->prefijo->comercial;
            if ($comercial instanceof \Illuminate\Database\Eloquent\Collection) {
                $comercial = $comercial->first();
            }
            if ($comercial && $comercial->personal) {
                $contrato->vendedor_email = $comercial->personal->email ?? '';
                $contrato->vendedor_telefono = $comercial->personal->telefono ?? '';
            }
        }
    }

    /**
     * Enriquecer contrato con datos de la compañía
     */
    private function enriquecerConDatosCompania(Contrato $contrato): void
    {
        $contrato->compania_id = 1;
        $contrato->compania_nombre = 'LOCALSAT';
        $contrato->plataforma_id = $contrato->empresa->plataforma_id ?? 1;
        
        if ($contrato->presupuesto && $contrato->presupuesto->prefijo) {
            $comercial = $contrato->presupuesto->prefijo->comercial;
            if ($comercial instanceof \Illuminate\Database\Eloquent\Collection) {
                $comercial = $comercial->first();
            }
            if ($comercial && $comercial->compania_id) {
                $contrato->compania_id = $comercial->compania_id ?? 1;
                if ($comercial->compania) {
                    $contrato->compania_nombre = $comercial->compania->nombre ?? 'LOCALSAT';
                }
            }
        }
    }

    /**
     * Hidratar productos del presupuesto
     */
    private function hidratarProductos(Contrato $contrato): void
    {
        if ($contrato->presupuesto && $contrato->presupuesto->agregados) {
            foreach ($contrato->presupuesto->agregados as $agregado) {
                if ($agregado->productoServicio) {
                    $agregado->producto_codigo = $agregado->productoServicio->codigopro ?? 'XXXX';
                    $agregado->producto_nombre = $agregado->productoServicio->nombre ?? 'Sin nombre';
                    $agregado->tipo_nombre = $agregado->productoServicio->tipo?->nombre_tipo_abono ?? 'Otros';
                }
            }
        }
        
        if ($contrato->presupuesto && $contrato->presupuesto->tasa) {
            $contrato->presupuesto->tasa_codigo = $contrato->presupuesto->tasa->codigopro ?? 'TASA';
            $contrato->presupuesto->tasa_nombre = $contrato->presupuesto->tasa->nombre ?? 'Tasa/Instalación';
        }
        
        if ($contrato->presupuesto && $contrato->presupuesto->abono) {
            $contrato->presupuesto->abono_codigo = $contrato->presupuesto->abono->codigopro ?? 'ABONO';
            $contrato->presupuesto->abono_nombre = $contrato->presupuesto->abono->nombre ?? 'Abono mensual';
        }
    }

    /**
     * Enriquecer contrato con datos económicos del presupuesto
     */
    private function enriquecerConDatosEconomicos(Contrato $contrato): void
    {
        $presupuesto = $contrato->presupuesto;
        
        if (!$presupuesto) {
            $this->setDefaultValues($contrato);
            return;
        }

        // Cantidad de vehículos
        $cantidadVehiculos = $presupuesto->cantidad_vehiculos ?? 1;
        
        // ========== TASA (Instalación) - Usar subtotal del presupuesto directamente ==========
        $contrato->tasa = $presupuesto->tasa;
        $contrato->valor_tasa = $presupuesto->valor_tasa ?? 0;
        $contrato->tasa_bonificacion = $presupuesto->tasa_bonificacion ?? 0;
        // Usar subtotal_tasa que ya tiene el descuento aplicado por el servicio
        $contrato->subtotal_tasa = $presupuesto->subtotal_tasa ?? ($contrato->valor_tasa * $cantidadVehiculos);
        
        // ========== ABONO - Usar subtotal del presupuesto directamente ==========
        $contrato->abono = $presupuesto->abono;
        $contrato->valor_abono = $presupuesto->valor_abono ?? 0;
        $contrato->abono_bonificacion = $presupuesto->abono_bonificacion ?? 0;
        // Usar subtotal_abono que ya tiene el descuento aplicado por el servicio
        $contrato->subtotal_abono = $presupuesto->subtotal_abono ?? ($contrato->valor_abono * $cantidadVehiculos);
        
        // ========== ACCESORIOS Y SERVICIOS ==========
        $accesorios = [];
        $servicios = [];
        $totalAccesorios = 0;
        $totalServicios = 0;
        
        if ($presupuesto->agregados && $presupuesto->agregados->count() > 0) {
            foreach ($presupuesto->agregados as $agregado) {
                $tipo = $agregado->tipo_nombre ?? $agregado->productoServicio?->tipo?->nombre_tipo_abono ?? 'Otros';
                $cantidad = $agregado->cantidad ?? 1;
                $valorUnitario = $agregado->valor ?? 0;
                // Subtotal base (sin descuento) = valor unitario * cantidad
                $subtotalBase = $valorUnitario * $cantidad;
                $bonificacion = $agregado->bonificacion ?? 0;
                // Usar el subtotal que ya tiene el descuento aplicado
                $subtotal = $agregado->subtotal ?? $subtotalBase;
                
                $itemData = [
                    'id' => $agregado->id,
                    'prd_servicio_id' => $agregado->prd_servicio_id,
                    'cantidad' => $cantidad,
                    'valor' => $valorUnitario,
                    'bonificacion' => $bonificacion,
                    'subtotal' => $subtotal,
                    'subtotal_base' => $subtotalBase,
                    'producto_servicio' => $agregado->productoServicio,
                    'producto_codigo' => $agregado->producto_codigo ?? 'XXXX',
                    'producto_nombre' => $agregado->producto_nombre ?? 'Sin nombre',
                    'tipo_nombre' => $tipo
                ];
                
                // Clasificar por tipo
                if (strtolower($tipo) === 'accesorio' || strpos(strtolower($tipo), 'accesorio') !== false) {
                    $accesorios[] = $itemData;
                    $totalAccesorios += $subtotal;
                } else {
                    $servicios[] = $itemData;
                    $totalServicios += $subtotal;
                }
            }
        }
        
        $contrato->accesorios = $accesorios;
        $contrato->servicios = $servicios;
        $contrato->total_accesorios = $totalAccesorios;
        $contrato->total_servicios = $totalServicios;
        
        // ========== TOTALES ==========
        // Inversión inicial = Subtotal Tasa + Total Accesorios
        $contrato->total_inversion_inicial = ($contrato->subtotal_tasa ?? 0) + $totalAccesorios;
        
        // Costo mensual = Subtotal Abono + Total Servicios
        $contrato->total_mensual = ($contrato->subtotal_abono ?? 0) + $totalServicios;
        
        // ========== PROMOCIÓN ==========
        $contrato->promocion_id = $presupuesto->promocion_id;
        $contrato->promocion = $presupuesto->promocion;
        
        // Obtener IDs de productos con promoción (bonificación > 0)
        $productosConPromocion = [];
        if ($presupuesto->agregados) {
            foreach ($presupuesto->agregados as $agregado) {
                if (($agregado->bonificacion ?? 0) > 0 && $agregado->prd_servicio_id) {
                    $productosConPromocion[] = $agregado->prd_servicio_id;
                }
            }
        }
        if (($presupuesto->tasa_bonificacion ?? 0) > 0 && $presupuesto->tasa?->id) {
            $productosConPromocion[] = $presupuesto->tasa->id;
        }
        if (($presupuesto->abono_bonificacion ?? 0) > 0 && $presupuesto->abono?->id) {
            $productosConPromocion[] = $presupuesto->abono->id;
        }
        
        $contrato->productos_con_promocion = array_unique($productosConPromocion);
        
        Log::info('Datos económicos del contrato', [
            'contrato_id' => $contrato->id,
            'cantidad_vehiculos' => $cantidadVehiculos,
            'subtotal_tasa' => $contrato->subtotal_tasa,
            'subtotal_abono' => $contrato->subtotal_abono,
            'total_inversion_inicial' => $contrato->total_inversion_inicial,
            'total_mensual' => $contrato->total_mensual,
            'total_accesorios' => $totalAccesorios,
            'total_servicios' => $totalServicios
        ]);
    }

    /**
     * Establecer valores por defecto cuando no hay presupuesto
     */
    private function setDefaultValues(Contrato $contrato): void
    {
        $contrato->tasa = null;
        $contrato->abono = null;
        $contrato->accesorios = [];
        $contrato->servicios = [];
        $contrato->valor_tasa = 0;
        $contrato->tasa_bonificacion = 0;
        $contrato->subtotal_tasa = 0;
        $contrato->valor_abono = 0;
        $contrato->abono_bonificacion = 0;
        $contrato->subtotal_abono = 0;
        $contrato->total_accesorios = 0;
        $contrato->total_servicios = 0;
        $contrato->total_inversion_inicial = 0;
        $contrato->total_mensual = 0;
        $contrato->promocion_id = null;
        $contrato->promocion = null;
        $contrato->productos_con_promocion = [];
    }
}