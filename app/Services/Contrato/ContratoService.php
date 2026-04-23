<?php
// app/Services/Contrato/ContratoService.php

namespace App\Services\Contrato;

use App\Models\Contrato;
use App\Models\Presupuesto;
use App\Models\Empresa;
use App\Models\EmpresaContacto;
use App\Models\EmpresaResponsable;
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
        $cambioTitularidad = CambioTitularidad::where('empresa_destino_id', $empresaId)
            ->orderBy('fecha_cambio', 'desc')
            ->first();

        $cambioRazonSocial = CambioRazonSocial::where('empresa_id', $empresaId)
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
            'presupuesto_total_inversion' => $this->calcularTotalInversionInicial($presupuesto),
            'presupuesto_total_mensual' => $this->calcularTotalCostoMensual($presupuesto),
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

    
/**
 * Actualizar lead a cliente después de crear un contrato
 */
public function actualizarLeadACliente($leadId): void
{
    if (!$leadId) {
        Log::info('No hay lead_id para actualizar', ['lead_id' => $leadId]);
        return;
    }
    
    try {
        // Obtener el lead
        $lead = \App\Models\Lead::find($leadId);
        
        if (!$lead) {
            Log::warning('Lead no encontrado', ['lead_id' => $leadId]);
            return;
        }
        
        // Actualizar estado a GANADO (id = 7)
        $lead->estado_lead_id = 7;
        
        // Marcar como cliente
        $lead->es_cliente = true;
        
        $lead->save();
        
        Log::info('Lead actualizado a cliente', [
            'lead_id' => $leadId,
            'lead_nombre' => $lead->nombre_completo,
            'estado_lead_id' => 7,
            'es_cliente' => true
        ]);
        
        // ============================================
        // 1. ELIMINAR NOTIFICACIONES DEL LEAD
        // ============================================
        $eliminadasLead = \App\Models\Notificacion::where('entidad_tipo', 'lead')
            ->where('entidad_id', $leadId)
            ->delete();
        
        Log::info('Notificaciones de lead eliminadas', [
            'lead_id' => $leadId,
            'cantidad' => $eliminadasLead
        ]);
        
        // ============================================
        // 2. ELIMINAR NOTIFICACIONES DE COMENTARIOS DEL LEAD
        // ============================================
        $comentariosIds = \DB::table('comentarios')
            ->where('lead_id', $leadId)
            ->pluck('id')
            ->toArray();
        
        $eliminadasComentarios = 0;
        if (!empty($comentariosIds)) {
            $eliminadasComentarios = \App\Models\Notificacion::where('entidad_tipo', 'comentario')
                ->whereIn('entidad_id', $comentariosIds)
                ->delete();
            
            Log::info('Notificaciones de comentarios eliminadas', [
                'lead_id' => $leadId,
                'comentarios_ids' => $comentariosIds,
                'cantidad' => $eliminadasComentarios
            ]);
        }
        
        // ============================================
        // 3. ELIMINAR NOTIFICACIONES DE PRESUPUESTOS DEL LEAD
        // ============================================
        $presupuestosIds = \DB::table('presupuestos')
            ->where('lead_id', $leadId)
            ->pluck('id')
            ->toArray();
        
        $eliminadasPresupuestos = 0;
        if (!empty($presupuestosIds)) {
            $eliminadasPresupuestos = \App\Models\Notificacion::where('entidad_tipo', 'presupuesto')
                ->whereIn('entidad_id', $presupuestosIds)
                ->delete();
            
            Log::info('Notificaciones de presupuestos eliminadas', [
                'lead_id' => $leadId,
                'presupuestos_ids' => $presupuestosIds,
                'cantidad' => $eliminadasPresupuestos
            ]);
        }
        
        // ============================================
        // 4. ELIMINAR NOTIFICACIONES DE SEGUIMIENTO_PÉRDIDA (si existen)
        // ============================================
        $seguimientosIds = \DB::table('seguimientos_perdida')
            ->where('lead_id', $leadId)
            ->pluck('id')
            ->toArray();
        
        $eliminadasSeguimientos = 0;
        if (!empty($seguimientosIds)) {
            $eliminadasSeguimientos = \App\Models\Notificacion::where('entidad_tipo', 'seguimiento_perdida')
                ->whereIn('entidad_id', $seguimientosIds)
                ->delete();
            
            Log::info('Notificaciones de seguimientos pérdida eliminadas', [
                'lead_id' => $leadId,
                'seguimientos_ids' => $seguimientosIds,
                'cantidad' => $eliminadasSeguimientos
            ]);
        }
        
        // ============================================
        // RESUMEN FINAL
        // ============================================
        $totalEliminadas = $eliminadasLead + $eliminadasComentarios + $eliminadasPresupuestos + $eliminadasSeguimientos;
        
        Log::info('✅ Todas las notificaciones eliminadas para lead convertido a cliente', [
            'lead_id' => $leadId,
            'lead_nombre' => $lead->nombre_completo,
            'notificaciones_lead' => $eliminadasLead,
            'notificaciones_comentarios' => $eliminadasComentarios,
            'notificaciones_presupuestos' => $eliminadasPresupuestos,
            'notificaciones_seguimientos' => $eliminadasSeguimientos,
            'total_eliminadas' => $totalEliminadas
        ]);
        
    } catch (\Exception $e) {
        Log::error('Error al actualizar lead a cliente', [
            'lead_id' => $leadId,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
    }
}
    /**
 * Calcular total de inversión inicial (tasa + solo accesorios)
 */
public function calcularTotalInversionInicial($presupuesto): float
{
    $totalTasa = $presupuesto->subtotal_tasa ?? 0;
    $totalAccesorios = 0;
    
    if ($presupuesto->agregados && $presupuesto->agregados->count() > 0) {
        foreach ($presupuesto->agregados as $agregado) {
            // Verificar si es accesorio (tipo_id = 5)
            $tipoId = $agregado->productoServicio?->tipo_id;
            if ($tipoId == 5) {
                $totalAccesorios += $agregado->subtotal ?? 0;
            }
        }
    }
    
    return $totalTasa + $totalAccesorios;
}

/**
 * Calcular total de costo mensual (abono + solo servicios)
 */
public function calcularTotalCostoMensual($presupuesto): float
{
    $totalAbono = $presupuesto->subtotal_abono ?? 0;
    $totalServicios = 0;
    
    if ($presupuesto->agregados && $presupuesto->agregados->count() > 0) {
        foreach ($presupuesto->agregados as $agregado) {
            // Verificar si es servicio (tipo_id = 3)
            $tipoId = $agregado->productoServicio?->tipo_id;
            if ($tipoId == 3) {
                $totalServicios += $agregado->subtotal ?? 0;
            }
        }
    }
    
    return $totalAbono + $totalServicios;
}

public function asignarNumeroAlfaSiNoExiste(Empresa $empresa, string $numeroAlfa): void
{
    if (empty($empresa->numeroalfa)) {
        $empresa->update(['numeroalfa' => $numeroAlfa]);
        Log::info('numeroalfa asignado por primera vez', [
            'empresa_id' => $empresa->id,
            'numeroalfa' => $numeroAlfa
        ]);
    } else {
        Log::info('numeroalfa ya existía, no se actualiza', [
            'empresa_id' => $empresa->id,
            'numeroalfa_actual' => $empresa->numeroalfa,
            'intento_asignar' => $numeroAlfa
        ]);
    }
}
}