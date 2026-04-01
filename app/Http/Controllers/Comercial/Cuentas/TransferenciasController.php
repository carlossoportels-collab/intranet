<?php

namespace App\Http\Controllers\Comercial\Cuentas;

use App\Http\Controllers\Controller;
use App\Traits\Authorizable;
use App\Models\Lead;
use App\Models\Empresa;
use App\Models\Prefijo;
use App\Models\AdminEmpresa;
use App\Models\AdminVehiculo;
use App\Models\Presupuesto;
use App\Models\Notificacion;
use App\Models\Comentario;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class TransferenciasController extends Controller
{
    use Authorizable;

    public function __construct()
    {
        $this->initializeAuthorization();
    }

    public function index()
    {
        $this->authorizePermiso(config('permisos.GESTIONAR_TRANSFERENCIAS'));
        
        $usuario = Auth::user();
        $usuario->load('comercial');

        $esComercialSS = $usuario->rol_id === 5 && optional($usuario->comercial)->prefijo_id === 9;
        $esAdmin = in_array($usuario->rol_id, [1, 2]);

        // 🔥 DATA MAESTRA PARA LOS SELECTORES (Provincias, Rubros, etc.)
        $origenes = \App\Models\OrigenContacto::where('activo', true)->get();
        $rubros = \App\Models\Rubro::where('activo', true)->get();
        $provincias = \App\Models\Provincia::where('activo', true)->get(['id', 'nombre']);
        $tiposDocumento = \App\Models\TipoDocumento::where('es_activo', true)->get();
        $nacionalidades = \App\Models\Nacionalidad::all();
        $tiposResponsabilidad = \App\Models\TipoResponsabilidad::where('es_activo', true)->get();
        $categoriasFiscales = \App\Models\CategoriaFiscal::where('es_activo', true)
            ->orderBy('nombre')->get(['id', 'codigo', 'nombre']);
        $plataformas = \App\Models\Plataforma::where('es_activo', true)->get();

        $prefijos = Prefijo::activo()->with(['comercial.personal'])->get()->map(function($p) {
            return [
                'id' => $p->id, 'codigo' => $p->codigo,
                'comercial' => $p->comercial?->personal?->nombre_completo ?? 'Sin comercial'
            ];
        });

        $historial = DB::table('historial_transferencias')->orderBy('created_at', 'desc')->limit(50)->get()->map(function($h) {
            return [
                'id' => $h->id, 'entidad_id' => $h->entidad_id, 'entidad_nombre' => $h->nombre_entidad,
                'tipo_entidad' => $h->tipo_entidad, 'prefijo_origen' => $h->codigo_prefijo_origen,
                'prefijo_destino' => $h->codigo_prefijo_destino, 'prefijo_destino_id' => $h->prefijo_destino_id,
                'usuario' => $h->comercial_destino_nombre, 'fecha' => date('d/m/Y H:i', strtotime($h->created_at))
            ];
        });

        return Inertia::render('Comercial/Cuentas/Transferencias', [
            'prefijos_disponibles' => $prefijos,
            'historial' => $historial,
            'vista_inicial' => ($esComercialSS && !$esAdmin) ? 'smartsat' : 'transferir',
            'is_comercial_ss' => $esComercialSS,
            'is_admin' => $esAdmin,
            'origenes' => $origenes,
            'rubros' => $rubros,
            'provincias' => $provincias,
            'tiposDocumento' => $tiposDocumento,
            'nacionalidades' => $nacionalidades,
            'tiposResponsabilidad' => $tiposResponsabilidad,
            'categoriasFiscales' => $categoriasFiscales,
            'plataformas' => $plataformas
        ]);
    }

    public function buscar(Request $request)
    {
        $query = $request->input('q');
        $modo = $request->input('modo'); // 'lead' o 'cliente'

        if (strlen($query) < 3) return response()->json([]);

        if ($modo === 'lead') {
            return Lead::where('es_cliente', false)
                ->where(function($q) use ($query) {
                    $q->where('nombre_completo', 'LIKE', "%{$query}%")
                      ->orWhere('id', $query);
                })
                ->with('prefijo.comercial.personal')
                ->limit(10)
                ->get()
                ->map(fn($l) => [
                    'id' => $l->id,
                    'nombre' => $l->nombre_completo,
                    'identificador' => "ID: #{$l->id}",
                    'prefijo_actual' => $l->prefijo->codigo ?? 'N/A',
                    'comercial_actual' => $l->prefijo->comercial->personal->nombre_completo ?? 'N/A',
                    'prefijo_id' => $l->prefijo_id
                ]);
        }

        // Modo Cliente (Empresa)
        return Empresa::where(function($q) use ($query) {
                $q->where('razon_social', 'LIKE', "%{$query}%")
                  ->orWhere('nombre_fantasia', 'LIKE', "%{$query}%")
                  ->orWhere('cuit', 'LIKE', "%{$query}%")
                  ->orWhere('numeroalfa', $query);
            })
            ->with(['prefijo.comercial.personal'])
            ->limit(10)
            ->get()
            ->map(fn($e) => [
                'id' => $e->id,
                'nombre' => $e->nombre_fantasia ?: $e->razon_social,
                'identificador' => "CUIT: {$e->cuit} / Alfa: {$e->numeroalfa}",
                'prefijo_actual' => $e->prefijo->codigo ?? 'N/A',
                'comercial_actual' => $e->prefijo->comercial->personal->nombre_completo ?? 'N/A',
                'prefijo_id' => $e->prefijo_id,
                'numeroalfa' => $e->numeroalfa
            ]);
    }

    public function ejecutarTransferencia(Request $request)
    {
        $request->validate([
            'id' => 'required',
            'modo' => 'required|in:lead,cliente',
            'nuevo_prefijo_id' => 'required|exists:prefijos,id'
        ]);

        return DB::transaction(function () use ($request) {
            $nuevoPrefijo = Prefijo::with('comercial.personal')->findOrFail($request->nuevo_prefijo_id);
            $usuarioLogueado = Auth::user();
            $entidadNombre = '';
            $prefijoOrigenId = null;
            $codigoOrigen = null;
            $codigoDestino = $nuevoPrefijo->codigo;
            $detalleCambios = [];
            $leadsAfectados = [];
            
            // Usuario 9999 para comentarios automáticos (sistema)
            $usuarioSistema = \App\Models\Usuario::find(9999);
            $ahora = now();
            // Tipo de comentario "Seguimiento lead" (ID 2)
            $tipoComentarioId = 2;

            if ($request->modo === 'lead') {
                $lead = Lead::findOrFail($request->id);
                $entidadNombre = $lead->nombre_completo;
                $prefijoOrigenId = $lead->prefijo_id;
                $codigoOrigen = $lead->prefijo->codigo ?? 'N/A';
                
                // Obtener usuario del comercial origen
                $usuarioOrigen = null;
                if ($lead->prefijo && $lead->prefijo->comercial && $lead->prefijo->comercial->personal) {
                    $usuarioOrigen = $lead->prefijo->comercial->personal->usuario;
                }
                
                // Obtener usuario del comercial destino
                $usuarioDestino = null;
                if ($nuevoPrefijo->comercial && $nuevoPrefijo->comercial->personal) {
                    $usuarioDestino = $nuevoPrefijo->comercial->personal->usuario;
                }

                // 🔥 PRIMERO: ELIMINAR NOTIFICACIONES EXISTENTES PARA ESTE LEAD
                $this->eliminarNotificacionesPorLeads([$lead->id]);

                // Transferir el lead
                $lead->update(['prefijo_id' => $nuevoPrefijo->id]);
                
                // Log de presupuestos
                $presupuestosIds = Presupuesto::where('lead_id', $lead->id)->pluck('id')->toArray();
                Presupuesto::where('lead_id', $lead->id)->update(['prefijo_id' => $nuevoPrefijo->id]);
                
                $detalleCambios = [
                    'lead_id' => $lead->id,
                    'presupuestos_actualizados' => $presupuestosIds
                ];
                
                $leadsAfectados[] = $lead->id;
                
                // 🔥 LUEGO: CREAR NUEVAS NOTIFICACIONES PARA LEAD
                $this->crearNotificacionesTransferencia([
                    'tipo' => 'transferencia_lead',
                    'entidad_id' => $lead->id,
                    'entidad_nombre' => $entidadNombre,
                    'usuario_origen_id' => $usuarioOrigen?->id,
                    'usuario_destino_id' => $usuarioDestino?->id,
                    'prefijo_origen' => $codigoOrigen,
                    'prefijo_destino' => $codigoDestino,
                    'usuario_ejecutor' => $usuarioLogueado->nombre_completo,
                ]);
                
                // 🔥 CREAR COMENTARIO AUTOMÁTICO EN EL LEAD
                if ($usuarioSistema) {
                    $mensajeComentario = "🔁 Transferencia de Lead\n\n" .
                        "Este lead fue transferido de {$codigoOrigen} a {$codigoDestino}.\n" .
                        "Transferido por: {$usuarioLogueado->nombre_completo}\n" ;
                    
                    Comentario::create([
                        'lead_id' => $lead->id,
                        'usuario_id' => $usuarioSistema->id,
                        'tipo_comentario_id' => $tipoComentarioId,
                        'comentario' => $mensajeComentario,
                        'created' => $ahora,
                    ]);
                }

            } else {
                // MODO CLIENTE (Empresa)
                $empresa = Empresa::with('contactos.lead')->findOrFail($request->id);
                $entidadNombre = $empresa->nombre_fantasia ?: $empresa->razon_social;
                $prefijoOrigenId = $empresa->prefijo_id;
                $codigoOrigen = $empresa->prefijo->codigo ?? 'N/A';
                
                // Obtener usuario del comercial origen
                $usuarioOrigen = null;
                if ($empresa->prefijo && $empresa->prefijo->comercial && $empresa->prefijo->comercial->personal) {
                    $usuarioOrigen = $empresa->prefijo->comercial->personal->usuario;
                }
                
                // Obtener usuario del comercial destino
                $usuarioDestino = null;
                if ($nuevoPrefijo->comercial && $nuevoPrefijo->comercial->personal) {
                    $usuarioDestino = $nuevoPrefijo->comercial->personal->usuario;
                }

                // Obtener leads asociados antes de la transferencia
                $leadsIds = $empresa->contactos->pluck('lead_id')->filter()->toArray();
                
                // 🔥 PRIMERO: ELIMINAR NOTIFICACIONES EXISTENTES PARA TODOS LOS LEADS ASOCIADOS
                if (!empty($leadsIds)) {
                    $this->eliminarNotificacionesPorLeads($leadsIds);
                }

                // Transferir la empresa
                $empresa->update(['prefijo_id' => $nuevoPrefijo->id]);

                // Transferir los leads asociados
                Lead::whereIn('id', $leadsIds)->update(['prefijo_id' => $nuevoPrefijo->id]);
                
                $leadsAfectados = array_merge($leadsAfectados, $leadsIds);

                // Transferir presupuestos
                $presupuestosIds = Presupuesto::whereIn('lead_id', $leadsIds)->pluck('id')->toArray();
                Presupuesto::whereIn('lead_id', $leadsIds)->update(['prefijo_id' => $nuevoPrefijo->id]);

                // Transferir vehículos
                $vehiculosActualizados = [];
                if ($empresa->numeroalfa) {
                    AdminEmpresa::where('codigoalf2', $empresa->numeroalfa)
                        ->update(['prefijo_codigo' => $nuevoPrefijo->codigo]);
                    
                    $adminEmp = AdminEmpresa::where('codigoalf2', $empresa->numeroalfa)->first();
                    if ($adminEmp) {
                        $vehiculosActualizados = AdminVehiculo::where('empresa_id', $adminEmp->id)->pluck('id')->toArray();
                        AdminVehiculo::where('empresa_id', $adminEmp->id)
                            ->update(['prefijo_codigo' => $nuevoPrefijo->codigo]);
                    }
                }

                $detalleCambios = [
                    'empresa_id' => $empresa->id,
                    'leads_asociados' => $leadsIds,
                    'presupuestos_actualizados' => $presupuestosIds,
                    'vehiculos_actualizados' => $vehiculosActualizados,
                    'numeroalfa' => $empresa->numeroalfa
                ];
                
                // 🔥 LUEGO: CREAR NUEVAS NOTIFICACIONES PARA EMPRESA
                $this->crearNotificacionesTransferencia([
                    'tipo' => 'transferencia_empresa',
                    'entidad_id' => $empresa->id,
                    'entidad_nombre' => $entidadNombre,
                    'usuario_origen_id' => $usuarioOrigen?->id,
                    'usuario_destino_id' => $usuarioDestino?->id,
                    'prefijo_origen' => $codigoOrigen,
                    'prefijo_destino' => $codigoDestino,
                    'usuario_ejecutor' => $usuarioLogueado->nombre_completo,
                    'leads_asociados' => $leadsIds,
                ]);
                
                // 🔥 CREAR COMENTARIO EN CADA LEAD ASOCIADO
                if ($usuarioSistema && !empty($leadsIds)) {
                    $mensajeComentario = "🏢 Transferencia de Empresa\n\n" .
                        "La empresa {$entidadNombre} fue transferida de {$codigoOrigen} a {$codigoDestino}.\n" .
                        "Transferido por: {$usuarioLogueado->nombre_completo}\n" 
                        ;
                    
                    foreach ($leadsIds as $leadId) {
                        Comentario::create([
                            'lead_id' => $leadId,
                            'usuario_id' => $usuarioSistema->id,
                            'tipo_comentario_id' => $tipoComentarioId,
                            'comentario' => $mensajeComentario,
                            'created' => $ahora,
                        ]);
                    }
                }
            }

            // Guardar en Historial
            DB::table('historial_transferencias')->insert([
                'tipo_entidad' => $request->modo,
                'entidad_id' => $request->id,
                'nombre_entidad' => $entidadNombre,
                'prefijo_origen_id' => $prefijoOrigenId,
                'prefijo_destino_id' => $nuevoPrefijo->id,
                'codigo_prefijo_origen' => $codigoOrigen,
                'codigo_prefijo_destino' => $codigoDestino,
                'comercial_destino_nombre' => $nuevoPrefijo->comercial?->personal?->nombre_completo,
                'usuario_id' => $usuarioLogueado->id,
                'observaciones' => json_encode($detalleCambios),
                'created_at' => $ahora
            ]);

            return redirect()->route('comercial.cuentas.transferencias')
                ->with('success', "Transferencia exitosa");
        });
    }
    
    /**
     * Crear notificaciones para transferencia
     */
    private function crearNotificacionesTransferencia(array $data)
    {
        $ahora = now();
        
        // Notificación para el usuario que pierde el lead/empresa
        if ($data['usuario_origen_id']) {
            Notificacion::create([
                'usuario_id' => $data['usuario_origen_id'],
                'titulo' => $data['tipo'] === 'transferencia_lead' ? 'Lead transferido' : 'Empresa transferida',
                'mensaje' => $this->generarMensajePerdida($data),
                'tipo' => $data['tipo'],
                'entidad_tipo' => $data['tipo'] === 'transferencia_lead' ? 'lead' : 'empresa',
                'entidad_id' => $data['entidad_id'],
                'leida' => false,
                'fecha_notificacion' => $ahora,
                'prioridad' => 'normal',
                'created' => $ahora,
            ]);
        }
        
        // Notificación para el usuario que recibe el lead/empresa (con link)
        if ($data['usuario_destino_id']) {
            Notificacion::create([
                'usuario_id' => $data['usuario_destino_id'],
                'titulo' => $data['tipo'] === 'transferencia_lead' ? 'Nuevo lead asignado' : 'Nueva empresa asignada',
                'mensaje' => $this->generarMensajeAsignacion($data),
                'tipo' => $data['tipo'],
                'entidad_tipo' => $data['tipo'] === 'transferencia_lead' ? 'lead' : 'empresa',
                'entidad_id' => $data['entidad_id'],
                'leida' => false,
                'fecha_notificacion' => $ahora,
                'prioridad' => 'normal',
                'created' => $ahora,
            ]);
        }
    }
    
    /**
     * Generar mensaje para el usuario que perdió el lead/empresa
     */
    private function generarMensajePerdida(array $data): string
    {
        if ($data['tipo'] === 'transferencia_lead') {
            return "El lead {$data['entidad_nombre']} fue transferido de {$data['prefijo_origen']} a {$data['prefijo_destino']} por {$data['usuario_ejecutor']}.\n\nYa no tienes acceso a este lead.";
        }
        
        return "La empresa {$data['entidad_nombre']} fue transferida de {$data['prefijo_origen']} a {$data['prefijo_destino']} por {$data['usuario_ejecutor']}.\n\nYa no tienes acceso a esta empresa ni a sus asociados.";
    }
    
    /**
     * Generar mensaje para el usuario que recibió el lead/empresa (con link)
     */
    private function generarMensajeAsignacion(array $data): string
    {
        $ruta = $data['tipo'] === 'transferencia_lead' 
            ? "/comercial/leads/{$data['entidad_id']}"
            : "/comercial/cuentas/{$data['entidad_id']}";
        
        if ($data['tipo'] === 'transferencia_lead') {
            return "Se te ha asignado el lead {$data['entidad_nombre']} proveniente de {$data['prefijo_origen']}.\n\nTransferido por: {$data['usuario_ejecutor']}.";
        }
        
        $mensaje = "Se te ha asignado la empresa {$data['entidad_nombre']} proveniente de {$data['prefijo_origen']}.\n\nTransferido por: {$data['usuario_ejecutor']}.";
        
        if (!empty($data['leads_asociados'])) {
            $mensaje .= "\n\nLeads asociados transferidos: " . count($data['leads_asociados']);
        }
        
        return $mensaje;
    }
    
    /**
     * Eliminar notificaciones existentes para leads transferidos
     */
    private function eliminarNotificacionesPorLeads(array $leadIds)
    {
        // Tipos de notificaciones que deben eliminarse al transferir
        $tiposAEliminar = [
            'lead_sin_contactar',
            'lead_proximo_contacto',
            'recordatorio_seguimiento',
            'comentario_recordatorio',
            'lead_posible_recontacto',
            'lead_vencido',
            'recontacto_recordatorio',
            'asignacion_lead'
        ];
        
        // Eliminar notificaciones asociadas a estos leads
        Notificacion::where(function($query) use ($leadIds) {
            $query->where('entidad_tipo', 'lead')
                  ->whereIn('entidad_id', $leadIds);
        })->orWhere(function($query) use ($leadIds) {
            $query->where('entidad_tipo', 'comentario')
                  ->whereIn('entidad_id', function($subquery) use ($leadIds) {
                      $subquery->select('id')
                          ->from('comentarios')
                          ->whereIn('lead_id', $leadIds);
                  });
        })->orWhere(function($query) use ($leadIds) {
            $query->where('entidad_tipo', 'seguimiento_perdida')
                  ->whereIn('entidad_id', function($subquery) use ($leadIds) {
                      $subquery->select('id')
                          ->from('seguimientos_perdida')
                          ->whereIn('lead_id', $leadIds);
                  });
        })->orWhere(function($query) use ($leadIds, $tiposAEliminar) {
            $query->whereIn('tipo', $tiposAEliminar)
                  ->where('entidad_tipo', 'lead')
                  ->whereIn('entidad_id', $leadIds);
        })->delete();
    }
}