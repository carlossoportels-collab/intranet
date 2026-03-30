<?php
// app/Http/Controllers/Comercial/ContratoController.php

namespace App\Http\Controllers\Comercial;

use App\Http\Controllers\Controller;
use App\Services\Contrato\ContratoService;
use App\Services\Contrato\ContratoPDFService;
use App\Services\Contrato\ContratoDataService;
use App\Models\CambioTitularidad;
use App\Models\CambioRazonSocial;
use App\Models\Presupuesto;
use App\Models\Empresa;
use App\Models\EmpresaContacto;
use App\Models\Contrato;
use App\Helpers\ContratoHelper;
use App\Models\TipoResponsabilidad;
use App\Models\TipoDocumento;
use App\Models\Nacionalidad;
use App\Models\AdminEmpresa;
use App\Models\AdminVehiculo;
use App\Models\ContratoVehiculo;
use App\Models\EmpresaResponsable;
use App\Models\DebitoCbu;
use App\Models\DebitoTarjeta;
use App\Models\CategoriaFiscal;
use App\Models\Plataforma;
use App\Models\Rubro;
use App\Models\Provincia;
use App\Traits\Authorizable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;


class ContratoController extends Controller
{
    use Authorizable;

    protected ContratoService $contratoService;
    protected ContratoPDFService $pdfService;
    protected ContratoDataService $dataService;

    public function __construct(
        ContratoService $contratoService,
        ContratoPDFService $pdfService,
        ContratoDataService $dataService
    ) {
        $this->initializeAuthorization();
        $this->contratoService = $contratoService;
        $this->pdfService = $pdfService;
        $this->dataService = $dataService;
    }

    /**
     * Mostrar listado de contratos
     */
public function index(Request $request)
{
    $this->authorizePermiso(config('permisos.VER_CONTRATOS'));
    
    $user = auth()->user();
    $usuarioEsComercial = $user->rol_id === 5;
    
    $query = Contrato::with(['estado', 'empresa'])
        ->orderBy('created', 'desc');

    $prefijosUsuario = [];
    $prefijoUsuario = null;
    
    if ($usuarioEsComercial) {
        $comercial = \App\Models\Comercial::where('personal_id', $user->personal_id)->first();
        if ($comercial) {
            $prefijosUsuario = [$comercial->prefijo_id];
            
            $prefijo = \App\Models\Prefijo::with('comercial.personal')
                ->where('id', $comercial->prefijo_id)
                ->first();
                 
            if ($prefijo) {
                $nombreComercial = null;
                if ($comercial->personal) {
                    $nombreComercial = trim($comercial->personal->nombre . ' ' . $comercial->personal->apellido);
                }
                
                $prefijoUsuario = [
                    'id' => (string) $prefijo->id,
                    'codigo' => $prefijo->codigo,
                    'descripcion' => $prefijo->descripcion,
                    'comercial_nombre' => $nombreComercial,
                    'display_text' => "[{$prefijo->codigo}] " . ($nombreComercial ?? $prefijo->descripcion)
                ];
            }
        }
    }

    // Función para obtener prefijos permitidos
    $getPrefijosPermitidosFunc = function() use ($user, $prefijosUsuario) {
        if (!empty($prefijosUsuario)) {
            return $prefijosUsuario;
        }
        if (!$user->ve_todas_cuentas) {
            $prefijosPermitidos = $this->getPrefijosPermitidos();
            return !empty($prefijosPermitidos) ? $prefijosPermitidos : [];
        }
        return [];
    };
    
    $prefijosPermitidos = $getPrefijosPermitidosFunc();

    // Aplicar filtro por prefijo
    if (!empty($prefijosPermitidos)) {
        $query->where(function($q) use ($prefijosPermitidos) {
            $q->whereHas('presupuesto', function($subq) use ($prefijosPermitidos) {
                $subq->whereIn('prefijo_id', $prefijosPermitidos);
            })
            ->orWhereHas('empresa', function($subq) use ($prefijosPermitidos) {
                $subq->whereIn('prefijo_id', $prefijosPermitidos);
            });
        });
    } elseif ($request->filled('prefijo_id') && !$usuarioEsComercial) {
        $prefijoId = $request->prefijo_id;
        $query->where(function($q) use ($prefijoId) {
            $q->whereHas('presupuesto', function($subq) use ($prefijoId) {
                $subq->where('prefijo_id', $prefijoId);
            })
            ->orWhereHas('empresa', function($subq) use ($prefijoId) {
                $subq->where('prefijo_id', $prefijoId);
            });
        });
    } elseif (!$user->ve_todas_cuentas && empty($prefijosPermitidos)) {
        $query->whereRaw('1 = 0');
    }

    // Filtro por búsqueda
    if ($request->filled('search')) {
        $search = $request->search;
        $query->where(function($q) use ($search) {
            $q->where('id', 'LIKE', "%{$search}%")
            ->orWhere('cliente_nombre_completo', 'LIKE', "%{$search}%")
            ->orWhere('empresa_nombre_fantasia', 'LIKE', "%{$search}%")
            ->orWhere('presupuesto_referencia', 'LIKE', "%{$search}%");
        });
    }

    // Filtro por estado
    if ($request->filled('estado_id')) {
        $query->where('estado_id', $request->estado_id);
    }

    // Filtro por fecha
    if ($request->filled('fecha_inicio')) {
        $query->whereDate('fecha_emision', '>=', $request->fecha_inicio);
    }
    if ($request->filled('fecha_fin')) {
        $query->whereDate('fecha_emision', '<=', $request->fecha_fin);
    }

    $contratos = $query->paginate(15);

    // 🔥 Obtener datos para filtros (solo para no comerciales)
    $prefijosFiltro = [];
    if (!$usuarioEsComercial) {
        $prefijosFiltro = \App\Models\Prefijo::where('activo', true)
            ->get()
            ->map(function($prefijo) {
                // Buscar el comercial asociado a este prefijo
                $comercial = \App\Models\Comercial::with('personal')
                    ->where('prefijo_id', $prefijo->id)
                    ->where('activo', 1)
                    ->first();
                
                $nombreComercial = null;
                if ($comercial && $comercial->personal) {
                    $nombreComercial = trim($comercial->personal->nombre . ' ' . $comercial->personal->apellido);
                }
                
                return [
                    'id' => (string) $prefijo->id,
                    'codigo' => $prefijo->codigo,
                    'descripcion' => $prefijo->descripcion,
                    'comercial_nombre' => $nombreComercial,
                    'display_text' => $nombreComercial 
                        ? "[{$prefijo->codigo}] {$nombreComercial}"
                        : "[{$prefijo->codigo}] {$prefijo->descripcion}"
                ];
            })->toArray();
    }

    // Estadísticas filtradas por el mismo criterio
    $statsQuery = Contrato::query();
    
    if (!empty($prefijosPermitidos)) {
        $statsQuery->where(function($q) use ($prefijosPermitidos) {
            $q->whereHas('presupuesto', function($subq) use ($prefijosPermitidos) {
                $subq->whereIn('prefijo_id', $prefijosPermitidos);
            })
            ->orWhereHas('empresa', function($subq) use ($prefijosPermitidos) {
                $subq->whereIn('prefijo_id', $prefijosPermitidos);
            });
        });
    } elseif ($request->filled('prefijo_id') && !$usuarioEsComercial) {
        $prefijoId = $request->prefijo_id;
        $statsQuery->where(function($q) use ($prefijoId) {
            $q->whereHas('presupuesto', function($subq) use ($prefijoId) {
                $subq->where('prefijo_id', $prefijoId);
            })
            ->orWhereHas('empresa', function($subq) use ($prefijoId) {
                $subq->where('prefijo_id', $prefijoId);
            });
        });
    } elseif (!$user->ve_todas_cuentas && empty($prefijosPermitidos)) {
        $statsQuery->whereRaw('1 = 0');
    }

    $estadisticas = [
        'total' => (clone $statsQuery)->count(),
        'activos' => (clone $statsQuery)->where('estado_id', 1)->count(),
        'pendientes' => (clone $statsQuery)->where('estado_id', 5)->count(),
        'instalados' => (clone $statsQuery)->where('estado_id', 6)->count(),
    ];

    $estados = \App\Models\EstadoEntidad::whereIn('id', [1,5,6])->get(['id', 'nombre']);

    return Inertia::render('Comercial/Contratos/Index', [
        'contratos' => $contratos,
        'estadisticas' => $estadisticas,
        'usuario' => [
            've_todas_cuentas' => $user->ve_todas_cuentas ?? false,
            'rol_id' => $user->rol_id,
            'nombre_completo' => $user->nombre_completo,
        ],
        'prefijosFiltro' => $prefijosFiltro,
        'prefijoUsuario' => $prefijoUsuario,
        'estados' => $estados,
    ]);
}
    
    /**
     * Mostrar formulario de creación de contrato desde presupuesto
     */
    public function create($presupuestoId)
    {
        $this->authorizePermiso(config('permisos.GESTIONAR_CONTRATOS'));
        
        $presupuesto = Presupuesto::with([
            'lead.localidad.provincia',
            'lead.rubro',
            'lead.origen',
            'prefijo.comercial.personal',
            'promocion.productos',
            'agregados' => function($query) {
                $query->with('productoServicio.tipo');
            },
            'tasa',
            'abono',
            'tasaMetodoPago',
            'abonoMetodoPago'
        ])->findOrFail($presupuestoId);

        $empresa = Empresa::with([
            'rubro',
            'categoriaFiscal',
            'plataforma',
            'localidadFiscal.provincia'
        ])->whereHas('contactos', function($q) use ($presupuesto) {
            $q->where('lead_id', $presupuesto->lead_id);
        })->first();

        $contacto = EmpresaContacto::with([
            'tipoResponsabilidad',
            'tipoDocumento',
            'nacionalidad'
        ])->where('lead_id', $presupuesto->lead_id)
            ->where('es_contacto_principal', true)
            ->first();

        if (!$empresa || !$contacto) {
            return redirect()->back()->with('error', 'Debe completar el alta de empresa primero');
        }

        if ($presupuesto->lead && $presupuesto->lead->localidad) {
            $presupuesto->lead->localidad_nombre = $presupuesto->lead->localidad->nombre;
            if ($presupuesto->lead->localidad->provincia) {
                $presupuesto->lead->provincia_nombre = $presupuesto->lead->localidad->provincia->nombre;
            }
        }

        if ($empresa->localidadFiscal) {
            $empresa->localidad_fiscal_nombre = $empresa->localidadFiscal->nombre;
            if ($empresa->localidadFiscal->provincia) {
                $empresa->provincia_fiscal_nombre = $empresa->localidadFiscal->provincia->nombre;
            }
        }

        $responsables = EmpresaResponsable::where('empresa_id', $empresa->id)
            ->where('es_activo', true)
            ->with('tipoResponsabilidad')
            ->get();

        $tiposResponsabilidad = TipoResponsabilidad::where('es_activo', true)->get();
        $tiposDocumento = TipoDocumento::where('es_activo', true)->get();
        $nacionalidades = Nacionalidad::where('activo', true)
            ->orderBy('pais')
            ->get(['id', 'pais', 'gentilicio']);
        $categoriasFiscales = CategoriaFiscal::where('es_activo', true)->get();
        $plataformas = Plataforma::where('es_activo', true)->get();
        $rubros = Rubro::where('activo', true)->get();
        $provincias = Provincia::where('activo', true)
            ->orderBy('nombre')
            ->get(['id', 'nombre']);

        return Inertia::render('Comercial/Contratos/Create', [
            'presupuesto' => $presupuesto,
            'empresa' => $empresa,
            'contacto' => $contacto,
            'responsables' => $responsables,
            'tiposResponsabilidad' => $tiposResponsabilidad,
            'tiposDocumento' => $tiposDocumento,
            'nacionalidades' => $nacionalidades,
            'categoriasFiscales' => $categoriasFiscales,
            'plataformas' => $plataformas,
            'rubros' => $rubros,
            'provincias' => $provincias,
        ]);
    }

    /**
     * Guardar nuevo contrato desde presupuesto
     */
    public function store(Request $request)
    {
        Log::info('🔵 store INICIO', [
            'user_id' => auth()->id(),
            'authenticated' => auth()->check(),
            'session_id' => session()->getId()
        ]);
        
        $this->authorizePermiso(config('permisos.GESTIONAR_CONTRATOS'));
        
        try {
            DB::beginTransaction();

            $presupuesto = Presupuesto::with([
                'lead.localidad.provincia',
                'lead.rubro',
                'lead.origen',
                'prefijo.comercial.personal',
                'prefijo.comercial.compania',
                'promocion',
                'createdBy'
            ])->findOrFail($request->presupuesto_id);

            $empresa = Empresa::with([
                'localidadFiscal.provincia',
                'rubro',
                'categoriaFiscal',
                'plataforma'
            ])->findOrFail($request->empresa_id);

            $contacto = EmpresaContacto::with([
                'tipoResponsabilidad',
                'tipoDocumento',
                'nacionalidad'
            ])->findOrFail($request->contacto_id);

            $lead = $contacto->lead;
            
            // Obtener datos del vendedor
            $vendedorData = $this->contratoService->obtenerDatosVendedor($presupuesto);
            
            // Determinar si es cliente
            $esCliente = $this->contratoService->determinarEsCliente($lead, $empresa->id);
            
            // Generar ID del contrato
            $contratoId = ContratoHelper::generarNumeroContrato($presupuesto->prefijo_id);
            
            // Construir datos del contrato
            $contratoData = $this->contratoService->construirDatosBaseContrato(
                $presupuesto, $empresa, $contacto, $lead, $vendedorData, $esCliente
            );
            $contratoData['id'] = $contratoId;
            
            $contrato = Contrato::create($contratoData);
            
            // Actualizar empresa
            $empresa->update(['numeroalfa' => $contratoId]);
            
            // Guardar responsables
            $this->contratoService->guardarResponsablesContrato($contrato, $empresa->id);
            
            // Guardar vehículos
            $this->contratoService->guardarVehiculosContrato($contrato, $request->vehiculos);
            
            // Guardar método de pago
            $this->contratoService->guardarMetodoPago($contrato, $request->metodo_pago, $request->datos_cbu ?? $request->datos_tarjeta);
            
            DB::commit();

            Log::info('Contrato creado exitosamente', ['contrato_id' => $contrato->id]);
            
            session()->save();
            
            return Inertia::location(route('comercial.contratos.show', $contrato->id));

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al generar contrato:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->back()->with('error', 'Error al generar contrato: ' . $e->getMessage());
        }
    }

    
  /**
     * Mostrar un contrato específico
     */
    public function show($id)
    {
        $contrato = Contrato::findOrFail($id);
        
        // Verificar acceso por prefijo
        $this->verificarAccesoContrato($contrato);
        
        $data = $this->dataService->prepararDatosShow($contrato);
        
        return Inertia::render('Comercial/Contratos/Show', $data);
    }

    /**
     * Generar y mostrar/descargar PDF del contrato
     */
    public function generarPdf(Request $request, $id)
    {
        $contrato = Contrato::findOrFail($id);
        $this->verificarAccesoContrato($contrato);
        
        if ($request->has('download') && $request->download == 1) {
            return $this->pdfService->generarPDFParaDescarga($contrato);
        }
        
        return $this->pdfService->generarPDFParaVista($contrato);
    }

    /**
     * Generar PDF temporal para enviar por email
     */
    public function generarPdfTemp(Request $request, $id)
    {
        $contrato = Contrato::findOrFail($id);
        $this->verificarAccesoContrato($contrato);
        
        $result = $this->pdfService->generarPDFTemporal($contrato);
        
        return redirect()->back()->with('pdfData', $result);
    }


    /**
     * Crear contrato desde una empresa existente (sin presupuesto)
     */
public function createFromEmpresa($empresaId)
{
    $this->authorizePermiso(config('permisos.GESTIONAR_CONTRATOS'));
    
    Log::info('=== INICIO CREATE FROM EMPRESA ===');
    Log::info('Empresa ID: ' . $empresaId);
    
    $empresa = Empresa::with([
        'prefijo',
        'localidadFiscal.provincia',
        'rubro',
        'categoriaFiscal',
        'plataforma',
        'contactos' => function ($query) {
            $query->where('es_activo', true)
                  ->with([
                      'lead.localidad.provincia', 
                      'lead.rubro', 
                      'lead.origen',
                      'tipoResponsabilidad',
                      'tipoDocumento',
                      'nacionalidad'
                  ]);
        },
        'responsables' => function ($query) {
            $query->where('es_activo', true)
                  ->with('tipoResponsabilidad');
        }
    ])->findOrFail($empresaId);
    
    Log::info('Empresa encontrada:', [
        'id' => $empresa->id,
        'nombre' => $empresa->nombre_fantasia,
        'numeroalfa' => $empresa->numeroalfa
    ]);
    
    // ============================================
    // OBTENER CAMBIO DE TITULARIDAD ASOCIADO
    // ============================================
    $cambioTitularidad = CambioTitularidad::where('empresa_destino_id', $empresaId)
        ->orderBy('fecha_cambio', 'desc')
        ->first();
    
    Log::info('Cambio de titularidad encontrado:', [
        'cambio_id' => $cambioTitularidad?->id,
        'existe' => $cambioTitularidad ? 'SI' : 'NO',
        'fecha_cambio' => $cambioTitularidad?->fecha_cambio
    ]);
    
    // ============================================
    // OBTENER VEHÍCULOS
    // ============================================
    $vehiculos = collect();
    
    if ($cambioTitularidad && $cambioTitularidad->vehiculos) {
        // Prioridad 1: Vehículos del cambio de titularidad
        $vehiculosData = is_string($cambioTitularidad->vehiculos) 
            ? json_decode($cambioTitularidad->vehiculos, true) 
            : ($cambioTitularidad->vehiculos ?? []);
        
        foreach ($vehiculosData as $v) {
            $vehiculos->push([
                'id' => $v['id'] ?? null,
                'avl_patente' => $v['patente'] ?? '',
                'avl_marca' => $v['marca'] ?? '',
                'avl_modelo' => $v['modelo'] ?? '',
                'avl_anio' => $v['anio'] ?? null,
                'avl_color' => $v['color'] ?? '',
                'avl_identificador' => $v['identificador'] ?? '',
                'codigo_alfa' => $v['codigo_alfa'] ?? '',
            ]);
        }
        
        Log::info('Vehículos del cambio de titularidad:', [
            'cantidad' => $vehiculos->count(),
            'vehiculos' => $vehiculos->map(function($v) {
                return ['id' => $v['id'], 'patente' => $v['avl_patente']];
            })->toArray()
        ]);
    } else {
        // Prioridad 2: Vehículos de admin_vehiculos
        $adminEmpresa = AdminEmpresa::where('codigoalf2', $empresa->numeroalfa)->first();
        
        if ($adminEmpresa) {
            $vehiculos = AdminVehiculo::where('empresa_id', $adminEmpresa->id)
                ->orderBy('codigoalfa')
                ->get()
                ->map(function ($vehiculo) {
                    return [
                        'id' => $vehiculo->id,
                        'avl_patente' => $vehiculo->avl_patente,
                        'avl_marca' => $vehiculo->avl_marca,
                        'avl_modelo' => $vehiculo->avl_modelo,
                        'avl_anio' => $vehiculo->avl_anio,
                        'avl_color' => $vehiculo->avl_color,
                        'avl_identificador' => $vehiculo->avl_identificador,
                        'codigo_alfa' => $vehiculo->codigo_completo,
                    ];
                });
            
            Log::info('Vehículos de admin_vehiculos:', [
                'cantidad' => $vehiculos->count(),
                'admin_empresa_id' => $adminEmpresa->id
            ]);
        } else {
            Log::warning('No se encontró admin_empresa para la empresa', [
                'numeroalfa' => $empresa->numeroalfa
            ]);
        }
    }
    
    // ============================================
    // OBTENER CONTACTO PRINCIPAL Y LEAD
    // ============================================
    $contactoPrincipal = $empresa->contactos->firstWhere('es_contacto_principal', true);
    if (!$contactoPrincipal && $empresa->contactos->isNotEmpty()) {
        $contactoPrincipal = $empresa->contactos->first();
    }
    
    $lead = $contactoPrincipal?->lead;
    
    Log::info('Contacto y lead:', [
        'contacto_id' => $contactoPrincipal?->id,
        'lead_id' => $lead?->id,
        'lead_nombre' => $lead?->nombre_completo
    ]);
    
    // ============================================
    // FORMATEAR DATOS ADICIONALES
    // ============================================
    $codigoPrefijo = $empresa->prefijo ? $empresa->prefijo->codigo : 'EMP';
    $empresa->codigo_completo = $codigoPrefijo . '-' . $empresa->numeroalfa;

    if ($contactoPrincipal && $contactoPrincipal->lead && $contactoPrincipal->lead->localidad) {
        $contactoPrincipal->lead->localidad_nombre = $contactoPrincipal->lead->localidad->nombre;
        if ($contactoPrincipal->lead->localidad->provincia) {
            $contactoPrincipal->lead->provincia_nombre = $contactoPrincipal->lead->localidad->provincia->nombre;
        }
    }

    if ($empresa->localidadFiscal) {
        $empresa->localidad_fiscal_nombre = $empresa->localidadFiscal->nombre;
        if ($empresa->localidadFiscal->provincia) {
            $empresa->provincia_fiscal_nombre = $empresa->localidadFiscal->provincia->nombre;
        }
    }
    
    // ============================================
    // DATOS PARA COTIZACIÓN
    // ============================================
    $productoService = app(\App\Services\Presupuesto\ProductoServicioService::class);
    
    $tasas = $productoService->getTasas();
    $abonos = $productoService->getAbonos();
    $convenios = $productoService->getConvenios();
    $accesorios = $productoService->getAccesorios();
    $servicios = $productoService->getServicios();
    $metodosPago = \App\Models\MedioPago::where('es_activo', 1)->get(['id', 'nombre']);
    
    // ============================================
    // DATOS PARA FORMULARIOS
    // ============================================
    $tiposResponsabilidad = TipoResponsabilidad::where('es_activo', true)->get();
    $tiposDocumento = TipoDocumento::where('es_activo', true)->get();
    $nacionalidades = Nacionalidad::all();
    $categoriasFiscales = CategoriaFiscal::where('es_activo', true)->get();
    $plataformas = Plataforma::where('es_activo', true)->get();
    $rubros = Rubro::where('activo', true)->get();
    $provincias = Provincia::where('activo', true)->get();
    
    Log::info('=== FIN CREATE FROM EMPRESA ===');
    
    return Inertia::render('Comercial/Contratos/CreateFromEmpresa', [
        'empresa' => $empresa,
        'contacto' => $contactoPrincipal,
        'lead' => $lead,
        'responsables' => $empresa->responsables,
        'vehiculos' => $vehiculos,
        'tiposResponsabilidad' => $tiposResponsabilidad,
        'tiposDocumento' => $tiposDocumento,
        'nacionalidades' => $nacionalidades,
        'categoriasFiscales' => $categoriasFiscales,
        'plataformas' => $plataformas,
        'rubros' => $rubros,
        'provincias' => $provincias,
        'tasas' => $tasas,
        'abonos' => $abonos,
        'convenios' => $convenios,
        'accesorios' => $accesorios,
        'servicios' => $servicios,
        'metodosPago' => $metodosPago,
    ]);
}
    
/**
 * Guardar nuevo contrato desde empresa existente (con cotización opcional)
 * Puede tener un presupuesto asociado (creado desde la cotización)
 */
/**
 * Guardar nuevo contrato desde empresa existente (con cotización opcional)
 */
public function storeFromEmpresa(Request $request)
{
    $this->authorizePermiso(config('permisos.GESTIONAR_CONTRATOS'));
    
    Log::info('=== INICIO STORE FROM EMPRESA ===');
    
    $request->validate([
        'empresa_id' => 'required|exists:empresas,id',
        'contacto_id' => 'nullable|exists:empresa_contactos,id',
        'responsables' => 'nullable|array',
        'vehiculos' => 'nullable|array',
        'presupuesto_id' => 'nullable|exists:presupuestos,id',
        'cotizacion' => 'nullable|array',
        'metodo_pago' => 'nullable|in:cbu,tarjeta',
        'datos_cbu' => 'required_if:metodo_pago,cbu|nullable|array',
        'datos_tarjeta' => 'required_if:metodo_pago,tarjeta|nullable|array',
    ]);

    $usuario = Auth::user();
    DB::beginTransaction();
    
    try {
        // ============================================
        // OBTENER DATOS DEL VENDEDOR
        // ============================================
        $vendedorNombre = null;
        $vendedorPrefijo = null;
        
        if ($usuario->rol_id == 5) {
            $comercial = \App\Models\Comercial::with(['personal', 'prefijo'])
                ->where('personal_id', $usuario->personal_id)
                ->where('activo', 1)
                ->first();
                
            if ($comercial) {
                $vendedorNombre = $comercial->personal->nombre_completo ?? $usuario->nombre_completo;
                $vendedorPrefijo = $comercial->prefijo->codigo ?? null;
            }
        } else {
            $empresaTemp = Empresa::find($request->empresa_id);
            if ($empresaTemp && $empresaTemp->prefijo_id) {
                $comercial = \App\Models\Comercial::where('prefijo_id', $empresaTemp->prefijo_id)
                    ->where('activo', 1)
                    ->with(['personal', 'prefijo'])
                    ->first();
                    
                if ($comercial) {
                    $vendedorNombre = $comercial->personal->nombre_completo ?? null;
                    $vendedorPrefijo = $comercial->prefijo->codigo ?? null;
                }
            }
        }
        
        if (!$vendedorNombre) {
            $vendedorNombre = $usuario->personal->nombre_completo ?? $usuario->nombre_usuario ?? 'Sistema';
        }
        
        // ============================================
        // OBTENER EMPRESA, CONTACTO Y LEAD
        // ============================================
        $empresa = Empresa::with([
            'localidadFiscal.provincia',
            'rubro',
            'categoriaFiscal',
            'plataforma',
            'prefijo'
        ])->findOrFail($request->empresa_id);

        $contacto = EmpresaContacto::with(['lead.localidad.provincia', 'lead.rubro', 'lead.origen'])
            ->find($request->contacto_id) ?? 
            EmpresaContacto::where('empresa_id', $empresa->id)
                ->where('es_contacto_principal', true)
                ->first();
        
        $lead = $contacto ? $contacto->lead : null;

        $presupuesto = $request->presupuesto_id ?
            Presupuesto::with(['tasa', 'abono', 'agregados.productoServicio'])->find($request->presupuesto_id) : null;

        // ============================================
        // DETERMINAR TIPO DE OPERACIÓN (CON PRIORIDAD SMARTSAT)
        // ============================================
        $tipoOperacion = null;

        // 1. PRIORIDAD: Transferencia reciente a SmartSat (ID 9)
        $transferenciaSS = \App\Models\HistorialTransferencia::where('entidad_id', $empresa->id)
            ->where('tipo_entidad', 'cliente')
            ->where('prefijo_destino_id', 9)
            ->orderBy('created_at', 'desc')
            ->first();

        if ($transferenciaSS) {
            $tipoOperacion = 'cambio_smartsat';
            Log::info('Tipo operación: cambio_smartsat detectado vía Historial');
        } else {
            // 2. Cambio de Titularidad
            $cambioTit = \App\Models\CambioTitularidad::where('empresa_destino_id', $empresa->id)
                ->orderBy('fecha_cambio', 'desc')->first();

            if ($cambioTit) {
                $tipoOperacion = 'cambio_titularidad';
            } else {
                // 3. Cambio de Razón Social
                $cambioRS = \App\Models\CambioRazonSocial::where('empresa_id', $empresa->id)
                    ->orderBy('fecha_cambio', 'desc')->first();
                
                if ($cambioRS) {
                    $tipoOperacion = 'cambio_razon_social';
                } else {
                    // 4. Lógica estándar de cliente existente
                    $esCliente = (Contrato::where('empresa_id', $empresa->id)->exists() || ($lead && $lead->es_cliente));
                    $tipoOperacion = $esCliente ? 'venta_cliente' : 'alta_nueva';
                }
            }
        }

        // ============================================
        // GENERAR ID Y CREAR CONTRATO
        // ============================================
        $contratoId = \App\Helpers\ContratoHelper::generarNumeroContrato($empresa->prefijo_id);
        
        $contrato = new Contrato();
        $contrato->id = $contratoId;
        $contrato->presupuesto_id = $presupuesto?->id;
        $contrato->empresa_id = $empresa->id;
        $contrato->lead_id = $lead?->id;
        $contrato->fecha_emision = now();
        $contrato->estado_id = 1;
        $contrato->tipo_operacion = $tipoOperacion;
        $contrato->vendedor_nombre = $vendedorNombre;
        $contrato->vendedor_prefijo = $vendedorPrefijo;
        
        // Mapeo de datos del Lead/Cliente
        $contrato->cliente_nombre_completo = $lead?->nombre_completo ?? $empresa->nombre_fantasia;
        $contrato->cliente_genero = $lead?->genero ?? 'no_especifica';
        $contrato->cliente_telefono = $lead?->telefono ?? $empresa->telefono_fiscal;
        $contrato->cliente_email = $lead?->email ?? $empresa->email_fiscal;
        
        if ($lead && $lead->localidad) {
            $contrato->cliente_localidad = $lead->localidad->nombre;
            $contrato->cliente_provincia = $lead->localidad->provincia->nombre ?? null;
        }
        
        // Mapeo de datos de la Empresa
        $contrato->empresa_nombre_fantasia = $empresa->nombre_fantasia;
        $contrato->empresa_razon_social = $empresa->razon_social;
        $contrato->empresa_cuit = $empresa->cuit;
        $contrato->empresa_domicilio_fiscal = $empresa->direccion_fiscal;
        $contrato->empresa_codigo_postal_fiscal = $empresa->codigo_postal_fiscal;
        $contrato->empresa_localidad_fiscal = $empresa->localidadFiscal->nombre ?? null;
        $contrato->empresa_provincia_fiscal = $empresa->localidadFiscal->provincia->nombre ?? null;
        $contrato->empresa_situacion_afip = $empresa->categoriaFiscal->nombre ?? null;
        $contrato->empresa_actividad = $empresa->rubro->nombre ?? null;
        $contrato->empresa_plataforma = $empresa->plataforma->nombre ?? null;
        $contrato->empresa_nombre_flota = $empresa->nombre_flota;

        // Totales
        if ($presupuesto) {
            $contrato->presupuesto_cantidad_vehiculos = $presupuesto->cantidad_vehiculos;
            $contrato->presupuesto_total_inversion = ($presupuesto->subtotal_tasa ?? 0) + ($presupuesto->subtotal_productos_agregados ?? 0);
            $contrato->presupuesto_total_mensual = $presupuesto->subtotal_abono ?? 0;
        }

        $contrato->created_by = $usuario->id;
        $contrato->created = now();
        $contrato->activo = true;
        $contrato->save();

        // ============================================
        // ACTUALIZACIONES POST-GUARDADO
        // ============================================
        if ($presupuesto) {
            $presupuesto->update(['estado_id' => 3]);
        }

        // Actualizar empresa con el nuevo número de contrato (especialmente para SmartSat)
        $empresa->update(['numeroalfa' => $contratoId]);

        // Guardar vehículos, responsables y pagos...
        // [Lógica omitida igual a la original]

        DB::commit();
        return redirect()->route('comercial.contratos.show', $contrato->id)->with('success', 'Contrato generado exitosamente');

    } catch (\Exception $e) {
        DB::rollBack();
        Log::error('Error en storeFromEmpresa: ' . $e->getMessage());
        return back()->withErrors(['error' => 'Error al generar contrato: ' . $e->getMessage()]);
    }
}
    /**
     * Guardar cotización como presupuesto (desde CreateFromEmpresa)
     */
public function guardarCotizacion(Request $request)
{
    $this->authorizePermiso(config('permisos.GESTIONAR_PRESUPUESTOS'));
    
    Log::info('=== INICIO GUARDAR COTIZACION ===');
    Log::info('Datos recibidos:', $request->all());
    
    try {
        $validated = $request->validate([
            'prefijo_id' => 'required|exists:prefijos,id',
            'lead_id' => 'required|exists:leads,id',
            'cantidad_vehiculos' => 'required|integer|min:1',
            'validez' => 'required|integer|min:1',
            'tasa_id' => 'nullable|exists:productos_servicios,id',
            'valor_tasa' => 'nullable|numeric|min:0',
            'tasa_bonificacion' => 'nullable|numeric|min:0|max:100',
            'abono_id' => 'nullable|exists:productos_servicios,id',
            'valor_abono' => 'nullable|numeric|min:0',
            'abono_bonificacion' => 'nullable|numeric|min:0|max:100',
            'agregados' => 'nullable|array',
        ]);

        $fechaValidez = now()->addDays($validated['validez'])->format('Y-m-d');
        
        Log::info('Creando presupuesto con:', [
            'prefijo_id' => $validated['prefijo_id'],
            'lead_id' => $validated['lead_id'],
            'cantidad_vehiculos' => $validated['cantidad_vehiculos'],
            'tasa_id' => $validated['tasa_id'],
            'abono_id' => $validated['abono_id']
        ]);
        
        $presupuestoService = app(\App\Services\Presupuesto\PresupuestoService::class);
        
        $presupuesto = $presupuestoService->createPresupuesto([
            'prefijo_id' => $validated['prefijo_id'],
            'lead_id' => $validated['lead_id'],
            'cantidad_vehiculos' => $validated['cantidad_vehiculos'],
            'validez' => $fechaValidez,
            'tasa_id' => $validated['tasa_id'],
            'valor_tasa' => $validated['valor_tasa'],
            'tasa_bonificacion' => $validated['tasa_bonificacion'],
            'tasa_metodo_pago_id' => null,
            'abono_id' => $validated['abono_id'],
            'valor_abono' => $validated['valor_abono'],
            'abono_bonificacion' => $validated['abono_bonificacion'],
            'abono_metodo_pago_id' => null,
            'agregados' => $validated['agregados'] ?? []
        ]);
        
        Log::info('Presupuesto creado:', [
            'id' => $presupuesto->id,
            'total' => $presupuesto->total_presupuesto
        ]);
        
        Log::info('=== FIN GUARDAR COTIZACION EXITOSO ===');
        
        return response()->json([
            'success' => true,
            'message' => 'Cotización guardada como presupuesto',
            'presupuesto' => [
                'id' => $presupuesto->id,
                'created' => $presupuesto->created,
                'total_presupuesto' => $presupuesto->total_presupuesto
            ]
        ]);
        
    } catch (\Exception $e) {
        Log::error('=== ERROR GUARDAR COTIZACION ===');
        Log::error('Error: ' . $e->getMessage());
        Log::error('Trace: ' . $e->getTraceAsString());
        
        return response()->json([
            'success' => false,
            'error' => $e->getMessage()
        ], 422);
    }
}


    /**
     * Crear contrato desde lead - Redirige al formulario de creación
     */
    public function createFromLead($presupuestoId)
    {
        $this->authorizePermiso(config('permisos.GESTIONAR_CONTRATOS'));
        
        try {
            $presupuesto = Presupuesto::with([
                'lead.localidad.provincia',
                'lead.rubro',
                'lead.origen',
                'prefijo.comercial.personal',
                'createdBy.personal',
                'promocion.productos',
                'agregados' => function($query) {
                    $query->with('productoServicio.tipo');
                },
                'tasa',
                'abono',
                'tasaMetodoPago',
                'abonoMetodoPago'
            ])->findOrFail($presupuestoId);

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

            $empresa = Empresa::with([
                'localidadFiscal.provincia',
                'rubro',
                'categoriaFiscal',
                'plataforma'
            ])->whereHas('contactos', function($q) use ($presupuesto) {
                $q->where('lead_id', $presupuesto->lead_id);
            })->first();

            $contacto = EmpresaContacto::with([
                'tipoResponsabilidad',
                'tipoDocumento',
                'nacionalidad'
            ])->where('lead_id', $presupuesto->lead_id)
                ->where('es_contacto_principal', true)
                ->first();

            if (!$contacto) {
                $contacto = EmpresaContacto::with([
                    'tipoResponsabilidad',
                    'tipoDocumento',
                    'nacionalidad'
                ])->where('lead_id', $presupuesto->lead_id)
                    ->first();
            }

            if (!$empresa || !$contacto) {
                return redirect()->back()->with('error', 'La empresa o contacto no están correctamente configurados');
            }

            if ($presupuesto->lead && $presupuesto->lead->localidad) {
                $presupuesto->lead->localidad_nombre = $presupuesto->lead->localidad->nombre;
                if ($presupuesto->lead->localidad->provincia) {
                    $presupuesto->lead->provincia_nombre = $presupuesto->lead->localidad->provincia->nombre;
                }
            }

            if ($empresa->localidadFiscal) {
                $empresa->localidad_fiscal_nombre = $empresa->localidadFiscal->nombre;
                if ($empresa->localidadFiscal->provincia) {
                    $empresa->provincia_fiscal_nombre = $empresa->localidadFiscal->provincia->nombre;
                }
            }

            $responsables = EmpresaResponsable::where('empresa_id', $empresa->id)
                ->where('es_activo', true)
                ->with('tipoResponsabilidad')
                ->get();

            $tiposResponsabilidad = TipoResponsabilidad::where('es_activo', true)->get();
            $tiposDocumento = TipoDocumento::where('es_activo', true)->get();
            $nacionalidades = Nacionalidad::where('activo', true)
                ->orderBy('pais')
                ->get(['id', 'pais', 'gentilicio']);
            $categoriasFiscales = CategoriaFiscal::where('es_activo', true)->get();
            $plataformas = Plataforma::where('es_activo', true)->get();
            $rubros = Rubro::where('activo', true)->get();
            $provincias = Provincia::where('activo', true)
                ->orderBy('nombre')
                ->get(['id', 'nombre']);

            return Inertia::render('Comercial/Contratos/Create', [
                'presupuesto' => $presupuesto,
                'vendedor_nombre' => $vendedorNombre,
                'vendedor_prefijo' => $vendedorPrefijo,
                'empresa' => $empresa,
                'contacto' => $contacto,
                'responsables' => $responsables,
                'tiposResponsabilidad' => $tiposResponsabilidad,
                'tiposDocumento' => $tiposDocumento,
                'nacionalidades' => $nacionalidades,
                'categoriasFiscales' => $categoriasFiscales,
                'plataformas' => $plataformas,
                'rubros' => $rubros,
                'provincias' => $provincias,
            ]);

        } catch (\Exception $e) {
            \Log::error('Error al preparar creación de contrato desde lead:', [
                'error' => $e->getMessage(),
                'presupuesto_id' => $presupuestoId,
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->back()->with('error', 'Error al preparar el contrato: ' . $e->getMessage());
        }
    }
   /**
     * Verificar acceso al contrato por prefijo
     */
    private function verificarAccesoContrato(Contrato $contrato): void
    {
        if ($contrato->presupuesto && $contrato->presupuesto->prefijo_id) {
            $lead = new \stdClass();
            $lead->prefijo_id = $contrato->presupuesto->prefijo_id;
            $this->authorizeLeadAccess($lead);
        } elseif (!$this->canViewAllRecords()) {
            $empresa = Empresa::find($contrato->empresa_id);
            if ($empresa && $empresa->prefijo_id) {
                $lead = new \stdClass();
                $lead->prefijo_id = $empresa->prefijo_id;
                $this->authorizeLeadAccess($lead);
            } else {
                abort(403, 'No tiene permisos para ver este contrato.');
            }
        }
    }

}