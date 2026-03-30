<?php
// app/Services/Contrato/ContratoService.php

namespace App\Services\Contrato;

use App\Models\Contrato;
use App\Models\Presupuesto;
use App\Models\Empresa;
use App\Models\EmpresaContacto;
use App\Models\EmpresaResponsable;
use App\Models\HistorialTransferencia;
use App\Models\CambioTitularidad; 
use App\Models\CambioRazonSocial;
use App\Models\DebitoCbu;
use App\Models\DebitoTarjeta;
use App\Models\ContratoVehiculo;
use App\Helpers\ContratoHelper;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ContratoService
{
    /**
     * Generar datos del vendedor desde presupuesto
     */
    public function obtenerDatosVendedor(Presupuesto $presupuesto): array
    {
        $vendedorNombre = null;
        $vendedorPrefijo = null;

        if ($presupuesto->created_by) {
            $usuarioCreador = $presupuesto->createdBy;
            if ($usuarioCreador && $usuarioCreador->personal) {
                $vendedorNombre = $usuarioCreador->personal->nombre_completo;
                
                $comercial = \App\Models\Comercial::where('personal_id', $usuarioCreador->personal->id)
                    ->where('activo', 1)
                    ->first();
                    
                if ($comercial && $comercial->prefijo) {
                    $vendedorPrefijo = $comercial->prefijo->codigo;
                }
            }
        }

        if (!$vendedorNombre) {
            $comercial = $presupuesto->prefijo?->comercial?->first();
            if ($comercial && $comercial->personal) {
                $vendedorNombre = $comercial->personal->nombre_completo;
                $vendedorPrefijo = $presupuesto->prefijo?->codigo;
            }
        }

        return [
            'vendedor_nombre' => $vendedorNombre,
            'vendedor_prefijo' => $vendedorPrefijo,
        ];
    }

    /**
     * Determinar si el lead es cliente
     */
    public function determinarEsCliente($lead, int $empresaId, ?int $contratoId = null): bool
    {
        if (!$lead) {
            return Contrato::where('empresa_id', $empresaId)->count() > 0;
        }

        if ($lead->es_cliente) return true;
        if ($lead->estado_lead && $lead->estado_lead->tipo === 'final_positivo') return true;
        
        $query = Contrato::where('lead_id', $lead->id);
        if ($contratoId) {
            $query->where('id', '!=', $contratoId);
        }
        
        if ($query->count() > 0) return true;
        
        return Contrato::where('empresa_id', $empresaId)
            ->when($contratoId, fn($q) => $q->where('id', '!=', $contratoId))
            ->count() > 0;
    }

    /**
     * Determinar tipo de operación
     */
public function determinarTipoOperacion(int $empresaId, $lead, bool $esCliente): string
{
    // 1. PRIORIDAD ABSOLUTA: Verificar si existe una transferencia a SmartSat (ID 9)
    $transferenciaSS = HistorialTransferencia::where('entidad_id', $empresaId)
        ->where('tipo_entidad', 'cliente')
        ->where('prefijo_destino_id', 9)
        ->orderBy('created_at', 'desc')
        ->first();

    if ($transferenciaSS) {
        return 'cambio_smartsat';
    }

    // 2. Verificar Cambio de Titularidad
    $cambioTitularidad = CambioTitularidad::where('empresa_destino_id', $empresaId)
        ->orderBy('fecha_cambio', 'desc')
        ->first();
    if ($cambioTitularidad) return 'cambio_titularidad';

    // 3. Verificar Cambio de Razón Social
    $cambioRazonSocial = CambioRazonSocial::where('empresa_id', $empresaId)
        ->orderBy('fecha_cambio', 'desc')
        ->first();
    if ($cambioRazonSocial) return 'cambio_razon_social';

    // 4. Si no hay registros de cambios especiales, verificar si ya es cliente
    if ($esCliente) {
        return 'venta_cliente';
    }
    
    return 'alta_nueva';
}

    /**
     * Obtener datos de compañía para PDF
     */
    public function obtenerDatosCompania($contrato): array
    {
        $compania = [
            'id' => 1,
            'nombre' => 'LOCALSAT',
            'logo' => public_path('images/logos/logo.png')
        ];

        if ($contrato->presupuesto && $contrato->presupuesto->prefijo) {
            $comercial = $contrato->presupuesto->prefijo->comercial;
            if ($comercial instanceof \Illuminate\Database\Eloquent\Collection) {
                $comercial = $comercial->first();
            }
            if ($comercial && $comercial->compania_id) {
                $companiaId = $comercial->compania_id;
                $compania = [
                    'id' => $companiaId,
                    'nombre' => match($companiaId) {
                        1 => 'LOCALSAT',
                        2 => 'SMARTSAT',
                        3 => '360 SAT',
                        default => 'LOCALSAT'
                    },
                    'logo' => public_path(match($companiaId) {
                        1 => 'images/logos/logo.png',
                        2 => 'images/logos/logosmart.png',
                        3 => 'images/logos/360-logo.png',
                        default => 'images/logos/logo.png'
                    })
                ];
            }
        }

        return $compania;
    }

    /**
     * Construir datos base del contrato desde presupuesto
     */
    public function construirDatosBaseContrato(Presupuesto $presupuesto, Empresa $empresa, $contacto, $lead, array $vendedorData, bool $esCliente): array
    {
        return [
            'presupuesto_id' => $presupuesto->id,
            'lead_id' => $presupuesto->lead_id,
            'empresa_id' => $empresa->id,
            'fecha_emision' => now(),
            'estado_id' => 1,
            'tipo_operacion' => $this->determinarTipoOperacion($empresa->id, $lead, $esCliente),
            'vendedor_nombre' => $vendedorData['vendedor_nombre'],
            'vendedor_prefijo' => $vendedorData['vendedor_prefijo'],
            'cliente_nombre_completo' => $presupuesto->lead->nombre_completo,
            'cliente_genero' => $presupuesto->lead->genero,
            'cliente_telefono' => $presupuesto->lead->telefono,
            'cliente_email' => $presupuesto->lead->email,
            'cliente_localidad' => $presupuesto->lead->localidad?->nombre,
            'cliente_provincia' => $presupuesto->lead->localidad?->provincia?->nombre,
            'cliente_rubro' => $presupuesto->lead->rubro?->nombre,
            'cliente_origen' => $presupuesto->lead->origen?->nombre,
            'contacto_tipo_responsabilidad' => $contacto->tipoResponsabilidad?->nombre,
            'contacto_tipo_documento' => $contacto->tipoDocumento?->nombre,
            'contacto_nro_documento' => $contacto->nro_documento,
            'contacto_nacionalidad' => $contacto->nacionalidad?->pais,
            'contacto_fecha_nacimiento' => $contacto->fecha_nacimiento,
            'contacto_direccion_personal' => $contacto->direccion_personal,
            'contacto_codigo_postal_personal' => $contacto->codigo_postal_personal,
            'empresa_nombre_fantasia' => $empresa->nombre_fantasia,
            'empresa_razon_social' => $empresa->razon_social,
            'empresa_cuit' => $empresa->cuit,
            'empresa_domicilio_fiscal' => $empresa->direccion_fiscal,
            'empresa_codigo_postal_fiscal' => $empresa->codigo_postal_fiscal,
            'empresa_localidad_fiscal' => $empresa->localidadFiscal?->nombre,
            'empresa_provincia_fiscal' => $empresa->localidadFiscal?->provincia?->nombre,
            'empresa_telefono_fiscal' => $empresa->telefono_fiscal,
            'empresa_email_fiscal' => $empresa->email_fiscal,
            'empresa_actividad' => $empresa->rubro?->nombre,
            'empresa_situacion_afip' => $empresa->categoriaFiscal?->nombre,
            'empresa_plataforma' => $empresa->plataforma?->nombre,
            'empresa_nombre_flota' => $empresa->nombre_flota,
            'presupuesto_referencia' => $presupuesto->referencia,
            'presupuesto_cantidad_vehiculos' => $presupuesto->cantidad_vehiculos,
            'presupuesto_total_inversion' => $presupuesto->total_presupuesto,
            'presupuesto_total_mensual' => $presupuesto->subtotal_abono,
            'presupuesto_promocion' => $presupuesto->promocion?->nombre,
            'created_by' => auth()->id(),
        ];
    }

    /**
     * Guardar responsables del contrato
     */
    public function guardarResponsablesContrato(Contrato $contrato, int $empresaId): void
    {
        $responsableFlota = EmpresaResponsable::where('empresa_id', $empresaId)
            ->where('es_activo', true)
            ->whereIn('tipo_responsabilidad_id', [3, 5])
            ->first();

        $responsablePagos = EmpresaResponsable::where('empresa_id', $empresaId)
            ->where('es_activo', true)
            ->whereIn('tipo_responsabilidad_id', [4, 5])
            ->first();

        $contrato->update([
            'responsable_flota_nombre' => $responsableFlota?->nombre_completo,
            'responsable_flota_telefono' => $responsableFlota?->telefono,
            'responsable_flota_email' => $responsableFlota?->email,
            'responsable_pagos_nombre' => $responsablePagos?->nombre_completo,
            'responsable_pagos_telefono' => $responsablePagos?->telefono,
            'responsable_pagos_email' => $responsablePagos?->email,
        ]);
    }

    /**
     * Guardar vehículos del contrato
     */
    public function guardarVehiculosContrato(Contrato $contrato, array $vehiculos): void
    {
        foreach ($vehiculos as $index => $vehiculo) {
            if (!empty($vehiculo['patente'])) {
                ContratoVehiculo::create([
                    'contrato_id' => $contrato->id,
                    'patente' => $vehiculo['patente'],
                    'marca' => $vehiculo['marca'] ?? null,
                    'modelo' => $vehiculo['modelo'] ?? null,
                    'anio' => $vehiculo['anio'] ?? null,
                    'color' => $vehiculo['color'] ?? null,
                    'identificador' => $vehiculo['identificador'] ?? null,
                    'tipo' => $vehiculo['tipo'] ?? null,
                    'orden' => $index + 1,
                    'created' => now(),
                ]);
            }
        }
    }

    /**
     * Guardar método de pago del contrato
     */
    public function guardarMetodoPago(Contrato $contrato, ?string $metodoPago, ?array $datos): void
    {
        if ($metodoPago === 'cbu' && $datos) {
            DebitoCbu::create([
                'contrato_id' => $contrato->id,
                'nombre_banco' => $datos['nombre_banco'],
                'cbu' => $datos['cbu'],
                'alias_cbu' => $datos['alias_cbu'] ?? null,
                'titular_cuenta' => $datos['titular_cuenta'],
                'tipo_cuenta' => $datos['tipo_cuenta'],
                'es_activo' => true,
                'created_by' => auth()->id(),
            ]);
        } elseif ($metodoPago === 'tarjeta' && $datos) {
            DebitoTarjeta::create([
                'contrato_id' => $contrato->id,
                'tarjeta_emisor' => $datos['tarjeta_emisor'],
                'tarjeta_expiracion' => $datos['tarjeta_expiracion'],
                'tarjeta_numero' => $datos['tarjeta_numero'],
                'tarjeta_codigo' => $datos['tarjeta_codigo'] ?? null,
                'tarjeta_banco' => $datos['tarjeta_banco'],
                'titular_tarjeta' => $datos['titular_tarjeta'],
                'tipo_tarjeta' => $datos['tipo_tarjeta'],
                'es_activo' => true,
                'created_by' => auth()->id(),
            ]);
        }
    }
}