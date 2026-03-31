<?php
// app/Http/Controllers/Comercial/Cuentas/CambioTitularidadController.php

namespace App\Http\Controllers\Comercial\Cuentas;

use App\Http\Controllers\Controller;
use App\Traits\Authorizable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Empresa;
use App\Models\AdminVehiculo;
use App\Models\AdminEmpresa;
use App\Models\CambioTitularidad;
use App\Models\OrigenContacto;
use App\Models\Rubro;
use App\Models\Provincia;
use App\Models\TipoDocumento;
use App\Models\Nacionalidad;
use App\Models\TipoResponsabilidad;
use App\Models\CategoriaFiscal;
use App\Models\Plataforma;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;

class CambioTitularidadController extends Controller
{
    use Authorizable;

    public function __construct()
    {
        $this->initializeAuthorization();
    }

    /**
     * Mostrar formulario de cambio de titularidad
     */
    public function index(Request $request)
    {
        $this->authorizePermiso(config('permisos.GESTIONAR_CAMBIO_TITULARIDAD'));
        
        $usuario = Auth::user();
        $prefijosPermitidos = $this->getPrefijosPermitidos();
        
        // ============================================
        // 1. OBTENER VEHÍCULOS CON FILTROS DE PERMISOS
        // ============================================
        $vehiculosQuery = AdminVehiculo::with(['empresaSistema'])
            ->whereHas('empresaSistema', function($query) use ($usuario, $prefijosPermitidos) {
                if (!$usuario->ve_todas_cuentas) {
                    if (!empty($prefijosPermitidos)) {
                        $query->whereIn('prefijo_id', $prefijosPermitidos);
                    } else {
                        $query->whereRaw('1 = 0');
                    }
                }
            });

        $vehiculos = $vehiculosQuery->get();

        // Indexar vehículos por empresa_id
        $vehiculosPorEmpresa = [];
        foreach ($vehiculos as $vehiculo) {
            $empresaSistema = $vehiculo->empresaSistema;
            if (!$empresaSistema) continue;
            
            $empresaId = $empresaSistema->id;
            
            if (!isset($vehiculosPorEmpresa[$empresaId])) {
                $vehiculosPorEmpresa[$empresaId] = [];
            }
            
            $vehiculosPorEmpresa[$empresaId][] = [
                'id' => $vehiculo->id,
                'codigo_alfa' => $vehiculo->codigo_completo,
                'avl_patente' => $vehiculo->avl_patente ?? '',
                'avl_marca' => $vehiculo->avl_marca ?? '',
                'avl_modelo' => $vehiculo->avl_modelo ?? '',
                'avl_anio' => $vehiculo->avl_anio,
                'avl_color' => $vehiculo->avl_color ?? '',
                'empresa_id' => $empresaId,
                'nombre_mix' => $vehiculo->nombre_mix ?? '',
            ];
        }

        // ============================================
        // 2. OBTENER EMPRESAS PERMITIDAS
        // ============================================
        $empresasQuery = Empresa::whereNull('deleted_at')
            ->orderBy('nombre_fantasia');

        if (!$usuario->ve_todas_cuentas) {
            if (!empty($prefijosPermitidos)) {
                $empresasQuery->whereIn('prefijo_id', $prefijosPermitidos);
            } else {
                $empresasQuery->whereRaw('1 = 0');
            }
        }

        $empresas = $empresasQuery->get()
            ->map(function ($empresa) {
                $prefijos = DB::table('prefijos')
                    ->where('activo', 1)
                    ->pluck('codigo', 'id')
                    ->toArray();
                
                $codigoPrefijo = isset($prefijos[$empresa->prefijo_id]) ? $prefijos[$empresa->prefijo_id] : 'N/A';
                $codigoAlfaEmpresa = $codigoPrefijo . '-' . $empresa->numeroalfa;
                
                return [
                    'id' => $empresa->id,
                    'codigo' => $codigoAlfaEmpresa,
                    'numeroalfa' => $empresa->numeroalfa,
                    'nombre_fantasia' => $empresa->nombre_fantasia,
                    'razon_social' => $empresa->razon_social,
                    'cuit' => $empresa->cuit,
                    'prefijo_id' => $empresa->prefijo_id ?? 1,
                    'es_activo' => (bool) $empresa->es_activo,
                ];
            });

        // ============================================
        // 3. OBTENER HISTORIAL DE CAMBIOS
        // ============================================
        $historialQuery = CambioTitularidad::with([
                'empresaOrigen',
                'empresaDestino',
                'usuario.personal'
            ])
            ->orderBy('fecha_cambio', 'desc');

        if (!$usuario->ve_todas_cuentas) {
            $historialQuery->where(function($q) use ($prefijosPermitidos) {
                $q->whereHas('empresaOrigen', function($subq) use ($prefijosPermitidos) {
                    $subq->whereIn('prefijo_id', $prefijosPermitidos);
                })->orWhereHas('empresaDestino', function($subq) use ($prefijosPermitidos) {
                    $subq->whereIn('prefijo_id', $prefijosPermitidos);
                });
            });
        }

        $historial = $historialQuery->paginate(5);

        $historialTransformado = [
            'current_page' => $historial->currentPage(),
            'last_page' => $historial->lastPage(),
            'per_page' => $historial->perPage(),
            'total' => $historial->total(),
            'data' => $historial->map(function ($cambio) {
                $vehiculos = is_string($cambio->vehiculos) 
                    ? json_decode($cambio->vehiculos, true) 
                    : ($cambio->vehiculos ?? []);
                    
                $nombreUsuario = 'Sistema';
                if ($cambio->usuario) {
                    $nombreUsuario = $cambio->usuario->nombre_completo ?? 'Usuario';
                }
                    
                return [
                    'id' => $cambio->id,
                    'fecha_cambio' => $cambio->fecha_cambio ? Carbon::parse($cambio->fecha_cambio)->format('d/m/Y H:i') : null,
                    'usuario' => $nombreUsuario,
                    'cantidad_vehiculos' => is_array($vehiculos) ? count($vehiculos) : 0,
                    'contrato_id' => $cambio->contrato_id,
                    'empresa_origen' => $cambio->empresaOrigen ? [
                        'id' => $cambio->empresaOrigen->id,
                        'codigo' => $this->getCodigoEmpresa($cambio->empresaOrigen),
                        'nombre' => $cambio->empresaOrigen->nombre_fantasia,
                        'cuit' => $cambio->empresaOrigen->cuit,
                    ] : null,
                    'empresa_destino' => $cambio->empresaDestino ? [
                        'id' => $cambio->empresaDestino->id,
                        'codigo' => $this->getCodigoEmpresa($cambio->empresaDestino),
                        'nombre' => $cambio->empresaDestino->nombre_fantasia,
                        'cuit' => $cambio->empresaDestino->cuit,
                    ] : null,
                    'vehiculos' => $vehiculos,
                ];
            })->toArray()
        ];

        // ============================================
        // 4. DATOS PARA LOS FORMULARIOS
        // ============================================
        $origenes = OrigenContacto::where('activo', true)->get();
        $rubros = Rubro::where('activo', true)->get();
        $provincias = Provincia::where('activo', true)->get(['id', 'nombre']);
        $tiposDocumento = TipoDocumento::where('es_activo', true)->get();
        $nacionalidades = Nacionalidad::all();
        $tiposResponsabilidad = TipoResponsabilidad::where('es_activo', true)->get();
        $categoriasFiscales = CategoriaFiscal::where('es_activo', true)
            ->orderBy('nombre')
            ->get(['id', 'codigo', 'nombre']);
        $plataformas = Plataforma::where('es_activo', true)->get();

        $infoUsuario = [
            've_todas_cuentas' => (bool) $usuario->ve_todas_cuentas,
            'prefijos' => $prefijosPermitidos,
            'rol_id' => $usuario->rol_id,  // ← AGREGAR ESTO
            'comercial' => $usuario->comercial ? [
                'prefijo_id' => $usuario->comercial->prefijo_id,
                'es_comercial' => $usuario->comercial->es_comercial,
            ] : null,
        ];

        // ============================================
    // OBTENER COMERCIALES ACTIVOS
    // ============================================
    $comerciales = \App\Models\Comercial::with('personal')
        ->where('activo', 1)
        ->get()
        ->map(function($comercial) {
            return [
                'id' => $comercial->id,
                'prefijo_id' => $comercial->prefijo_id,
                'nombre' => $comercial->personal->nombre_completo ?? 'Sin nombre',
                'email' => $comercial->personal->email ?? '',
                'telefono' => $comercial->personal->telefono ?? '',
                'personal' => $comercial->personal ? [
                    'id' => $comercial->personal->id,
                    'nombre' => $comercial->personal->nombre,
                    'apellido' => $comercial->personal->apellido,
                    'email' => $comercial->personal->email,
                    'telefono' => $comercial->personal->telefono,
                    'nombre_completo' => $comercial->personal->nombre_completo,
                ] : null,
            ];
        });

        return Inertia::render('Comercial/Cuentas/CambioTitularidad', [
            'vehiculos' => $vehiculosPorEmpresa,
            'empresas' => $empresas,
            'historial' => $historialTransformado,
            'origenes' => $origenes,
            'rubros' => $rubros,
            'provincias' => $provincias,
            'tiposDocumento' => $tiposDocumento,
            'nacionalidades' => $nacionalidades,
            'tiposResponsabilidad' => $tiposResponsabilidad,
            'categoriasFiscales' => $categoriasFiscales,
            'plataformas' => $plataformas,
            'comerciales' => $comerciales, 
            'usuario' => $infoUsuario,
        ]);
    }


/**
 * Guardar cambio de titularidad
 */
public function store(Request $request)
{
    $this->authorizePermiso(config('permisos.GESTIONAR_CAMBIO_TITULARIDAD'));
    
    Log::info('=== INICIO CAMBIO TITULARIDAD ===');
    Log::info('Datos recibidos:', $request->all());
    
    $request->validate([
        'tipo_operacion' => 'required|in:entre_empresas,nueva_empresa',
        'empresa_origen_id' => 'required|exists:empresas,id',
        'vehiculos' => 'required|array|min:1',
        'vehiculos.*' => 'exists:admin_vehiculos,id',
        'empresa_destino_id' => 'required|exists:empresas,id',
    ]);

    $usuario = Auth::user();
    $prefijosPermitidos = $this->getPrefijosPermitidos();
    
    DB::beginTransaction();
    
    try {
        // ============================================
        // EMPRESA ORIGEN
        // ============================================
        $empresaOrigen = Empresa::findOrFail($request->empresa_origen_id);
        
        Log::info('Empresa origen:', [
            'id' => $empresaOrigen->id,
            'nombre' => $empresaOrigen->nombre_fantasia,
            'numeroalfa' => $empresaOrigen->numeroalfa
        ]);
        
        if (!$usuario->ve_todas_cuentas) {
            if (empty($prefijosPermitidos) || !in_array($empresaOrigen->prefijo_id, $prefijosPermitidos)) {
                throw new \Exception('No tiene permisos para ver esta empresa origen');
            }
        }
        
        // ============================================
        // ADMIN EMPRESA ORIGEN
        // ============================================
        $adminEmpresaOrigen = AdminEmpresa::where('codigoalf2', $empresaOrigen->numeroalfa)->first();
        
        if (!$adminEmpresaOrigen) {
            throw new \Exception('No se encontró el registro de la empresa en admin_empresas');
        }
        
        // ============================================
        // VEHÍCULOS
        // ============================================
        $vehiculos = AdminVehiculo::whereIn('id', $request->vehiculos)
            ->where('empresa_id', $adminEmpresaOrigen->id)
            ->get();
        
        if ($vehiculos->isEmpty()) {
            throw new \Exception('No se encontraron los vehículos seleccionados');
        }
        
        // ============================================
        // EMPRESA DESTINO (YA EXISTE)
        // ============================================
        $empresaDestino = Empresa::findOrFail($request->empresa_destino_id);
        
        Log::info('Empresa destino:', [
            'id' => $empresaDestino->id,
            'nombre' => $empresaDestino->nombre_fantasia,
            'numeroalfa' => $empresaDestino->numeroalfa
        ]);
        
        // ============================================
        // ADMIN EMPRESA DESTINO
        // ============================================
        $adminEmpresaDestino = AdminEmpresa::where('codigoalf2', $empresaDestino->numeroalfa)->first();
        
        if (!$adminEmpresaDestino) {
            $adminEmpresaDestino = AdminEmpresa::create([
                'codigoalf2' => $empresaDestino->numeroalfa,
                'nombre_fantasia' => $empresaDestino->nombre_fantasia,
                'razon_social' => $empresaDestino->razon_social,
                'cuit' => $empresaDestino->cuit,
                'es_activo' => 1,
            ]);
            Log::info('AdminEmpresa destino creada:', ['id' => $adminEmpresaDestino->id]);
        } else {
            Log::info('AdminEmpresa destino existente:', ['id' => $adminEmpresaDestino->id]);
        }
        
        // ============================================
        // TRANSFERIR VEHÍCULOS
        // ============================================
        $vehiculosActualizados = [];
        foreach ($vehiculos as $vehiculo) {
            $vehiculoData = [
                'id' => $vehiculo->id,
                'patente' => $vehiculo->avl_patente,
                'marca' => $vehiculo->avl_marca,
                'modelo' => $vehiculo->avl_modelo,
                'anio' => $vehiculo->avl_anio,
                'color' => $vehiculo->avl_color,
                'identificador' => $vehiculo->avl_identificador,
                'codigo_alfa' => $vehiculo->codigo_completo,
            ];
            
            $vehiculosActualizados[] = $vehiculoData;
            
            $vehiculo->empresa_id = $adminEmpresaDestino->id;
            $vehiculo->save();
            
            Log::info('Vehículo transferido:', [
                'id' => $vehiculo->id,
                'patente' => $vehiculo->avl_patente,
                'de_empresa' => $adminEmpresaOrigen->id,
                'a_empresa' => $adminEmpresaDestino->id
            ]);
        }
        
        // ============================================
        // REGISTRAR CAMBIO DE TITULARIDAD
        // ============================================
        $cambio = CambioTitularidad::create([
            'empresa_origen_id' => $empresaOrigen->id,
            'empresa_destino_id' => $empresaDestino->id,
            'vehiculos' => json_encode($vehiculosActualizados),
            'fecha_cambio' => now(),
            'usuario_id' => $usuario->id,
            'observaciones' => "Cambio de titularidad de " . count($vehiculos) . " vehículo(s)",
        ]);
        
        Log::info('Cambio de titularidad registrado:', [
            'id' => $cambio->id,
            'empresa_origen_id' => $cambio->empresa_origen_id,
            'empresa_destino_id' => $cambio->empresa_destino_id,
            'vehiculos' => count($vehiculosActualizados)
        ]);
        
        DB::commit();
        
        Log::info('=== FIN CAMBIO TITULARIDAD EXITOSO ===');
        
        // 🔥 REDIRIGIR A LA RUTA CORRECTA
        return redirect()->route('comercial.cuentas.cambio-titularidad')
            ->with('success', 'Cambio de titularidad registrado correctamente');
        
    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('=== ERROR CAMBIO TITULARIDAD ===');
        Log::error('Error: ' . $e->getMessage());
        Log::error('Trace: ' . $e->getTraceAsString());
        
        return back()->withErrors(['error' => 'Error al registrar el cambio: ' . $e->getMessage()]);
    }
}

    /**
     * Obtener detalles de un cambio específico
     */
    public function show($id)
    {
        $usuario = Auth::user();
        $prefijosPermitidos = $this->getPrefijosPermitidos();
        
        $cambio = CambioTitularidad::with([
            'empresaOrigen',
            'empresaDestino',
            'usuario.personal'
        ])->findOrFail($id);
        
        if (!$usuario->ve_todas_cuentas) {
            $tienePermisoOrigen = $cambio->empresaOrigen && 
                !empty($prefijosPermitidos) && 
                in_array($cambio->empresaOrigen->prefijo_id, $prefijosPermitidos);
                
            $tienePermisoDestino = $cambio->empresaDestino && 
                !empty($prefijosPermitidos) && 
                in_array($cambio->empresaDestino->prefijo_id, $prefijosPermitidos);
            
            if (!$tienePermisoOrigen && !$tienePermisoDestino) {
                abort(403, 'No tiene permisos para ver este cambio');
            }
        }

        $vehiculos = is_string($cambio->vehiculos) 
            ? json_decode($cambio->vehiculos, true) 
            : ($cambio->vehiculos ?? []);

        return response()->json([
            'id' => $cambio->id,
            'fecha_cambio' => $cambio->fecha_cambio ? Carbon::parse($cambio->fecha_cambio)->format('d/m/Y H:i') : null,
            'usuario' => $cambio->usuario ? ($cambio->usuario->nombre_completo ?? 'Usuario') : 'Sistema',
            'cantidad_vehiculos' => is_array($vehiculos) ? count($vehiculos) : 0,
            'empresa_origen' => $cambio->empresaOrigen ? [
                'id' => $cambio->empresaOrigen->id,
                'codigo' => $this->getCodigoEmpresa($cambio->empresaOrigen),
                'nombre' => $cambio->empresaOrigen->nombre_fantasia,
                'cuit' => $cambio->empresaOrigen->cuit,
            ] : null,
            'empresa_destino' => $cambio->empresaDestino ? [
                'id' => $cambio->empresaDestino->id,
                'codigo' => $this->getCodigoEmpresa($cambio->empresaDestino),
                'nombre' => $cambio->empresaDestino->nombre_fantasia,
                'cuit' => $cambio->empresaDestino->cuit,
            ] : null,
            'vehiculos' => $vehiculos,
        ]);
    }

    /**
     * Obtener vehículos de una empresa
     */
    public function getVehiculosEmpresa($id)
    {
        $usuario = Auth::user();
        $prefijosPermitidos = $this->getPrefijosPermitidos();
        
        $empresa = Empresa::find($id);
        if (!$empresa) {
            return response()->json(['success' => false, 'message' => 'Empresa no encontrada'], 404);
        }
        
        if (!$usuario->ve_todas_cuentas) {
            if (empty($prefijosPermitidos) || !in_array($empresa->prefijo_id, $prefijosPermitidos)) {
                return response()->json(['success' => false, 'message' => 'No tiene permisos'], 403);
            }
        }
        
        // Obtener admin_empresa relacionada
        $adminEmpresa = AdminEmpresa::where('codigoalf2', $empresa->numeroalfa)->first();
        
        if (!$adminEmpresa) {
            return response()->json(['success' => true, 'data' => []]);
        }
        
        $vehiculos = AdminVehiculo::where('empresa_id', $adminEmpresa->id)
            ->orderBy('codigoalfa')
            ->get()
            ->map(function ($vehiculo) {
                return [
                    'id' => $vehiculo->id,
                    'codigo_alfa' => $vehiculo->codigo_completo,
                    'avl_patente' => $vehiculo->avl_patente,
                    'avl_marca' => $vehiculo->avl_marca,
                    'avl_modelo' => $vehiculo->avl_modelo,
                    'avl_anio' => $vehiculo->avl_anio,
                    'avl_color' => $vehiculo->avl_color,
                    'nombre_mix' => $vehiculo->nombre_mix,
                    'identificador' => $vehiculo->avl_identificador,
                ];
            });

        return response()->json(['success' => true, 'data' => $vehiculos]);
    }

    /**
     * Generar número alfa para nueva empresa
     */
    private function generarNumeroAlfa()
    {
        $ultimo = Empresa::max('numeroalfa');
        return $ultimo ? $ultimo + 1 : 1;
    }

    /**
     * Obtener código formateado de empresa
     */
    private function getCodigoEmpresa($empresa)
    {
        $prefijos = DB::table('prefijos')
            ->where('activo', 1)
            ->pluck('codigo', 'id')
            ->toArray();
        
        $codigoPrefijo = isset($prefijos[$empresa->prefijo_id]) ? $prefijos[$empresa->prefijo_id] : 'N/A';
        return $codigoPrefijo . '-' . $empresa->numeroalfa;
    }
}