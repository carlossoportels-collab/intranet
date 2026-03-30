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
                // 🔥 PASAMOS LA DATA MAESTRA AL FRONTEND
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
        $detalleCambios = []; // Array para el JSON de observaciones

        if ($request->modo === 'lead') {
            $lead = Lead::findOrFail($request->id);
            $entidadNombre = $lead->nombre_completo;
            $prefijoOrigenId = $lead->prefijo_id;
            $codigoOrigen = $lead->prefijo->codigo ?? 'N/A';

            $lead->update(['prefijo_id' => $nuevoPrefijo->id]);
            
            // Log de presupuestos
            $presupuestosIds = Presupuesto::where('lead_id', $lead->id)->pluck('id')->toArray();
            Presupuesto::where('lead_id', $lead->id)->update(['prefijo_id' => $nuevoPrefijo->id]);
            
            $detalleCambios = [
                'lead_id' => $lead->id,
                'presupuestos_actualizados' => $presupuestosIds
            ];

        } else {
            // MODO CLIENTE
            $empresa = Empresa::with('contactos.lead')->findOrFail($request->id);
            $entidadNombre = $empresa->nombre_fantasia ?: $empresa->razon_social;
            $prefijoOrigenId = $empresa->prefijo_id;
            $codigoOrigen = $empresa->prefijo->codigo ?? 'N/A';

            $empresa->update(['prefijo_id' => $nuevoPrefijo->id]);

            $leadsIds = $empresa->contactos->pluck('lead_id')->filter()->toArray();
            Lead::whereIn('id', $leadsIds)->update(['prefijo_id' => $nuevoPrefijo->id]);

            $presupuestosIds = Presupuesto::whereIn('lead_id', $leadsIds)->pluck('id')->toArray();
            Presupuesto::whereIn('lead_id', $leadsIds)->update(['prefijo_id' => $nuevoPrefijo->id]);

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
        }

        // Guardar en Historial con JSON
        DB::table('historial_transferencias')->insert([
            'tipo_entidad' => $request->modo,
            'entidad_id' => $request->id,
            'nombre_entidad' => $entidadNombre,
            'prefijo_origen_id' => $prefijoOrigenId,
            'prefijo_destino_id' => $nuevoPrefijo->id,
            'codigo_prefijo_origen' => $codigoOrigen,
            'codigo_prefijo_destino' => $nuevoPrefijo->codigo,
            'comercial_destino_nombre' => $nuevoPrefijo->comercial?->personal?->nombre_completo,
            'usuario_id' => $usuarioLogueado->id,
            'observaciones' => json_encode($detalleCambios), // JSON detallado
            'created_at' => now()
        ]);

        return redirect()->route('comercial.cuentas.transferencias')
            ->with('success', "Transferencia exitosa");
    });
}
}