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
}