<?php
// app/Services/Contrato/ContratoService.php

namespace App\Services\Contrato;

use App\Models\Contrato;
use App\Models\Presupuesto;
use App\Models\Empresa;
use App\Models\EmpresaContacto;
use App\Models\EmpresaResponsable;
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
    public function determinarEsCliente($lead, $empresaId, $contratoId = null): bool
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
        
        return $query->count() > 0;
    }

    /**
     * Determinar tipo de operación
     */
    public function determinarTipoOperacion($empresaId, $lead, $esCliente): string
    {
        $cambioTitularidad = \App\Models\CambioTitularidad::where('empresa_destino_id', $empresaId)
            ->orderBy('fecha_cambio', 'desc')
            ->first();

        $cambioRazonSocial = \App\Models\CambioRazonSocial::where('empresa_id', $empresaId)
            ->orderBy('fecha_cambio', 'desc')
            ->first();

        if ($cambioTitularidad) return 'cambio_titularidad';
        if ($cambioRazonSocial) return 'cambio_razon_social';
        if ($esCliente) return 'venta_cliente';
        
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
     * Construir datos base del contrato
     */
    public function construirDatosBaseContrato($presupuesto, $empresa, $contacto, $lead, $vendedorData, $esCliente): array
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
}