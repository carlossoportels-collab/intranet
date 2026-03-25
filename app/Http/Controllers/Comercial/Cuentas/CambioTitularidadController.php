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
                'usuario'
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

        $historial = $historialQuery->paginate(10);

        $historialTransformado = [
            'current_page' => $historial->currentPage(),
            'last_page' => $historial->lastPage(),
            'per_page' => $historial->perPage(),
            'total' => $historial->total(),
            'data' => $historial->map(function ($cambio) {
                $vehiculos = is_string($cambio->vehiculos) 
                    ? json_decode($cambio->vehiculos, true) 
                    : ($cambio->vehiculos ?? []);
                    
                return [
                    'id' => $cambio->id,
                    'fecha_cambio' => $cambio->fecha_cambio ? Carbon::parse($cambio->fecha_cambio)->format('d/m/Y H:i') : null,
                    'usuario' => $cambio->usuario ? $cambio->usuario->name : 'Sistema',
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
        ];

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
            'usuario' => $infoUsuario,
        ]);
    }

/**
 * Guardar cambio de titularidad
 */
public function store(Request $request)
{
    $this->authorizePermiso(config('permisos.GESTIONAR_CAMBIO_TITULARIDAD'));
    
    $request->validate([
        'tipo_operacion' => 'required|in:entre_empresas,nueva_empresa',
        'empresa_origen_id' => 'required|exists:empresas,id',
        'vehiculos' => 'required|array|min:1',
        'vehiculos.*' => 'exists:admin_vehiculos,id',
        'empresa_destino_id' => 'required_if:tipo_operacion,entre_empresas|nullable|exists:empresas,id',
        
        // Solo para nueva empresa
        'nombre_fantasia' => 'required_if:tipo_operacion,nueva_empresa|nullable|string|max:200',
        'razon_social' => 'required_if:tipo_operacion,nueva_empresa|nullable|string|max:200',
        'cuit' => 'required_if:tipo_operacion,nueva_empresa|nullable|string|max:13',
    ]);

    $usuario = Auth::user();
    $prefijosPermitidos = $this->getPrefijosPermitidos();
    
    // LOG DE DEPURACIÓN
    Log::info('CambioTitularidad - Inicio', [
        'request' => $request->all(),
        'usuario_id' => $usuario->id,
        'vehiculos_solicitados' => $request->vehiculos
    ]);
    
    DB::beginTransaction();
    
    try {
        // ============================================
        // VALIDAR EMPRESA ORIGEN
        // ============================================
        $empresaOrigen = Empresa::find($request->empresa_origen_id);
        if (!$empresaOrigen) {
            throw new \Exception('Empresa origen no encontrada');
        }
        
        Log::info('Empresa origen encontrada', [
            'empresa_id' => $empresaOrigen->id,
            'empresa_nombre' => $empresaOrigen->nombre_fantasia,
            'numeroalfa' => $empresaOrigen->numeroalfa
        ]);
        
        if (!$usuario->ve_todas_cuentas) {
            if (empty($prefijosPermitidos) || !in_array($empresaOrigen->prefijo_id, $prefijosPermitidos)) {
                throw new \Exception('No tiene permisos para ver esta empresa origen');
            }
        }
        
        // ============================================
        // OBTENER ADMIN_EMPRESA DE LA EMPRESA ORIGEN
        // ============================================
        $adminEmpresaOrigen = AdminEmpresa::where('codigoalf2', $empresaOrigen->numeroalfa)->first();
        
        Log::info('AdminEmpresa origen', [
            'codigoalf2' => $empresaOrigen->numeroalfa,
            'admin_empresa_encontrada' => $adminEmpresaOrigen ? $adminEmpresaOrigen->id : 'NO ENCONTRADA'
        ]);
        
        if (!$adminEmpresaOrigen) {
            throw new \Exception('No se encontró el registro de la empresa en admin_empresas');
        }
        
        // ============================================
        // VALIDAR VEHÍCULOS - BUSCAR POR admin_empresa_id
        // ============================================
        $vehiculos = AdminVehiculo::whereIn('id', $request->vehiculos)
            ->where('empresa_id', $adminEmpresaOrigen->id)
            ->get();
        
        Log::info('Vehículos encontrados', [
            'admin_empresa_id' => $adminEmpresaOrigen->id,
            'vehiculos_encontrados' => $vehiculos->pluck('id')->toArray(),
            'vehiculos_solicitados' => $request->vehiculos,
            'cantidad_encontrados' => $vehiculos->count()
        ]);
        
        if ($vehiculos->isEmpty()) {
            // Mostrar vehículos disponibles para depuración
            $vehiculosDisponibles = AdminVehiculo::where('empresa_id', $adminEmpresaOrigen->id)
                ->limit(10)
                ->get(['id', 'codigoalfa', 'avl_patente'])
                ->toArray();
            
            Log::warning('No se encontraron vehículos', [
                'admin_empresa_id' => $adminEmpresaOrigen->id,
                'vehiculos_disponibles' => $vehiculosDisponibles
            ]);
            
            throw new \Exception('No se encontraron los vehículos seleccionados para esta empresa. Verifique que los vehículos pertenezcan a la empresa origen.');
        }
        
        // Verificar que se encontraron todos los vehículos solicitados
        if ($vehiculos->count() != count($request->vehiculos)) {
            $encontrados = $vehiculos->pluck('id')->toArray();
            $faltantes = array_diff($request->vehiculos, $encontrados);
            
            // Obtener información de los vehículos faltantes
            $vehiculosFaltantes = AdminVehiculo::whereIn('id', $faltantes)
                ->get(['id', 'codigoalfa', 'avl_patente', 'empresa_id'])
                ->toArray();
            
            Log::warning('Vehículos faltantes', [
                'faltantes' => $faltantes,
                'info_faltantes' => $vehiculosFaltantes
            ]);
            
            throw new \Exception('Algunos vehículos no pertenecen a esta empresa: ' . implode(', ', $faltantes));
        }

        // ============================================
        // DETERMINAR EMPRESA DESTINO
        // ============================================
        $empresaDestinoId = null;
        $empresaDestino = null;
        
        if ($request->tipo_operacion === 'entre_empresas') {
            // Empresa existente
            $empresaDestino = Empresa::findOrFail($request->empresa_destino_id);
            
            if (!$usuario->ve_todas_cuentas) {
                if (empty($prefijosPermitidos) || !in_array($empresaDestino->prefijo_id, $prefijosPermitidos)) {
                    throw new \Exception('No tiene permisos para ver esta empresa destino');
                }
            }
            
            $empresaDestinoId = $empresaDestino->id;
            
            Log::info('Empresa destino existente', [
                'empresa_id' => $empresaDestino->id,
                'numeroalfa' => $empresaDestino->numeroalfa
            ]);
            
        } else {
            // Crear empresa mínima
            $prefijoPorDefecto = !empty($prefijosPermitidos) ? $prefijosPermitidos[0] : 1;
            
            $empresaDestino = Empresa::create([
                'nombre_fantasia' => $request->nombre_fantasia,
                'razon_social' => $request->razon_social,
                'cuit' => $request->cuit,
                'prefijo_id' => $prefijoPorDefecto,
                'numeroalfa' => $this->generarNumeroAlfa(),
                'es_activo' => 1,
                'created_by' => $usuario->id,
                'created' => now(),
            ]);
            
            $empresaDestinoId = $empresaDestino->id;
            
            Log::info('Nueva empresa creada', [
                'empresa_id' => $empresaDestino->id,
                'numeroalfa' => $empresaDestino->numeroalfa
            ]);
        }

        // ============================================
        // OBTENER/CREAR ADMIN_EMPRESA DESTINO
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
            
            Log::info('AdminEmpresa destino creada', [
                'admin_empresa_id' => $adminEmpresaDestino->id
            ]);
        } else {
            Log::info('AdminEmpresa destino encontrada', [
                'admin_empresa_id' => $adminEmpresaDestino->id
            ]);
        }

        // ============================================
        // ACTUALIZAR VEHÍCULOS A NUEVA EMPRESA
        // ============================================
        $vehiculosActualizados = [];
        foreach ($vehiculos as $vehiculo) {
            // Guardar datos antes de actualizar
            $vehiculosActualizados[] = [
                'id' => $vehiculo->id,
                'codigo_alfa' => $vehiculo->codigo_completo,
                'patente' => $vehiculo->avl_patente,
                'marca' => $vehiculo->avl_marca,
                'modelo' => $vehiculo->avl_modelo,
                'anio' => $vehiculo->avl_anio,
                'color' => $vehiculo->avl_color,
                'identificador' => $vehiculo->avl_identificador,
            ];
            
            // Actualizar empresa_id en admin_vehiculos al ID de admin_empresa destino
            $vehiculo->empresa_id = $adminEmpresaDestino->id;
            $vehiculo->save();
        }
        
        Log::info('Vehículos actualizados', [
            'vehiculos_actualizados' => count($vehiculosActualizados)
        ]);

        // ============================================
        // REGISTRAR EN HISTORIAL
        // ============================================
        $cambio = CambioTitularidad::create([
            'empresa_origen_id' => $empresaOrigen->id,
            'empresa_destino_id' => $empresaDestinoId,
            'vehiculos' => json_encode($vehiculosActualizados),
            'fecha_cambio' => now(),
            'usuario_id' => $usuario->id,
            'observaciones' => "Cambio de titularidad de " . count($vehiculos) . " vehículo(s)",
        ]);

        DB::commit();

        Log::info('Cambio de titularidad registrado exitosamente', [
            'cambio_id' => $cambio->id,
            'vehiculos' => count($vehiculos)
        ]);

        // Redirigir a creación de contrato con la empresa destino
        return redirect()->route('comercial.contratos.desde-empresa', ['empresaId' => $empresaDestinoId])
            ->with('success', 'Cambio de titularidad registrado. Ahora complete el contrato.');

    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Error al registrar cambio de titularidad: ' . $e->getMessage(), [
            'trace' => $e->getTraceAsString(),
            'usuario_id' => $usuario->id,
            'request' => $request->all()
        ]);
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
            'usuario'
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
            'usuario' => $cambio->usuario ? $cambio->usuario->name : 'Sistema',
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