<?php
// app/Http/Controllers/Comercial/Cuentas/CambioTitularidadController.php

namespace App\Http\Controllers\Comercial\Cuentas;

use App\Http\Controllers\Controller;
use App\Traits\Authorizable; // 🔥 IMPORTAR TRAIT
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Empresa;
use App\Models\Vehiculo;
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
    use Authorizable; // 🔥 AGREGAR TRAIT

    public function __construct()
    {
        $this->initializeAuthorization(); // 🔥 INICIALIZAR
    }

    /**
     * Mostrar formulario de cambio de titularidad
     */
    public function index(Request $request)
    {
        // 🔥 VERIFICAR PERMISO
        $this->authorizePermiso(config('permisos.GESTIONAR_CAMBIO_TITULARIDAD'));
        
        $usuario = Auth::user();
        $prefijosPermitidos = $this->getPrefijosPermitidos();
        
        // ============================================
        // 1. OBTENER VEHÍCULOS CON FILTROS DE PERMISOS
        // ============================================
        $vehiculosQuery = Vehiculo::with('empresa')
            ->whereHas('empresa', function($query) use ($usuario, $prefijosPermitidos) {
                $query->whereNull('deleted_at');
                
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
            if (!isset($vehiculosPorEmpresa[$vehiculo->empresa_id])) {
                $vehiculosPorEmpresa[$vehiculo->empresa_id] = [];
            }
            
            $vehiculosPorEmpresa[$vehiculo->empresa_id][] = [
                'id' => $vehiculo->id,
                'codigo_alfa' => $vehiculo->codigo_alfa ?? '',
                'avl_patente' => $vehiculo->avl_patente ?? '',
                'avl_marca' => $vehiculo->avl_marca ?? '',
                'avl_modelo' => $vehiculo->avl_modelo ?? '',
                'avl_anio' => $vehiculo->avl_anio,
                'avl_color' => $vehiculo->avl_color ?? '',
                'empresa_id' => $vehiculo->empresa_id,
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
     * Guardar cambio de titularidad (SIMPLE)
     */
    public function store(Request $request)
    {
        // 🔥 VERIFICAR PERMISO
        $this->authorizePermiso(config('permisos.GESTIONAR_CAMBIO_TITULARIDAD'));
        
        $request->validate([
            'tipo_operacion' => 'required|in:entre_empresas,nueva_empresa',
            'empresa_origen_id' => 'required|exists:empresas,id',
            'vehiculos' => 'required|array|min:1',
            'vehiculos.*' => 'exists:vehiculos,id',
            'empresa_destino_id' => 'required_if:tipo_operacion,entre_empresas|nullable|exists:empresas,id',
            
            // Solo para nueva empresa
            'nombre_fantasia' => 'required_if:tipo_operacion,nueva_empresa|nullable|string|max:200',
            'razon_social' => 'required_if:tipo_operacion,nueva_empresa|nullable|string|max:200',
            'cuit' => 'required_if:tipo_operacion,nueva_empresa|nullable|string|max:13',
        ]);

        $usuario = Auth::user();
        $prefijosPermitidos = $this->getPrefijosPermitidos();
        
        DB::beginTransaction();
        
        try {
            // ============================================
            // VALIDAR EMPRESA ORIGEN
            // ============================================
            $empresaOrigen = Empresa::find($request->empresa_origen_id);
            if (!$empresaOrigen) {
                throw new \Exception('Empresa origen no encontrada');
            }
            
            if (!$usuario->ve_todas_cuentas) {
                if (empty($prefijosPermitidos) || !in_array($empresaOrigen->prefijo_id, $prefijosPermitidos)) {
                    throw new \Exception('No tiene permisos para ver esta empresa origen');
                }
            }
            
            // ============================================
            // VALIDAR VEHÍCULOS
            // ============================================
            $vehiculos = Vehiculo::whereIn('id', $request->vehiculos)
                ->where('empresa_id', $empresaOrigen->id)
                ->get();
            
            if ($vehiculos->isEmpty()) {
                throw new \Exception('No se encontraron los vehículos seleccionados');
            }

            // ============================================
            // DETERMINAR EMPRESA DESTINO
            // ============================================
            $empresaDestinoId = null;
            
            if ($request->tipo_operacion === 'entre_empresas') {
                // Empresa existente
                $empresaDestino = Empresa::findOrFail($request->empresa_destino_id);
                
                if (!$usuario->ve_todas_cuentas) {
                    if (empty($prefijosPermitidos) || !in_array($empresaDestino->prefijo_id, $prefijosPermitidos)) {
                        throw new \Exception('No tiene permisos para ver esta empresa destino');
                    }
                }
                
                $empresaDestinoId = $empresaDestino->id;
                
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
            }

            // ============================================
            // ACTUALIZAR VEHÍCULOS A NUEVA EMPRESA
            // ============================================
            foreach ($vehiculos as $vehiculo) {
                $vehiculo->empresa_id = $empresaDestinoId;
                $vehiculo->save();
            }

            // ============================================
            // REGISTRAR EN HISTORIAL
            // ============================================
            $vehiculosData = $vehiculos->map(function ($v) {
                return [
                    'id' => $v->id,
                    'codigo_alfa' => $v->codigo_alfa,
                    'patente' => $v->avl_patente,
                    'marca' => $v->avl_marca,
                    'modelo' => $v->avl_modelo,
                    'anio' => $v->avl_anio,
                    'color' => $v->avl_color,
                ];
            })->toArray();

            $cambio = CambioTitularidad::create([
                'empresa_origen_id' => $empresaOrigen->id,
                'empresa_destino_id' => $empresaDestinoId,
                'vehiculos' => json_encode($vehiculosData),
                'fecha_cambio' => now(),
                'usuario_id' => $usuario->id,
                'observaciones' => "Cambio de titularidad de {$vehiculos->count()} vehículo(s)",
            ]);

            DB::commit();

            // ============================================
            // REDIRIGIR A CREACIÓN DE CONTRATO
            // ============================================
            return redirect()->route('comercial.contratos.desde-empresa', ['empresaId' => $empresaDestinoId])
                ->with('success', 'Cambio de titularidad registrado. Ahora complete el contrato.');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al registrar cambio de titularidad: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'usuario_id' => $usuario->id,
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
        
        $vehiculos = Vehiculo::where('empresa_id', $id)
            ->orderBy('codigo_alfa')
            ->get()
            ->map(function ($vehiculo) {
                return [
                    'id' => $vehiculo->id,
                    'codigo_alfa' => $vehiculo->codigo_alfa,
                    'avl_patente' => $vehiculo->avl_patente,
                    'avl_marca' => $vehiculo->avl_marca,
                    'avl_modelo' => $vehiculo->avl_modelo,
                    'avl_anio' => $vehiculo->avl_anio,
                    'avl_color' => $vehiculo->avl_color,
                    'nombre_mix' => $vehiculo->nombre_mix,
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