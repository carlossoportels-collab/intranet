<?php

namespace App\Http\Controllers\Comercial;

use App\Http\Controllers\Controller;
use App\Models\Presupuesto;
use App\Models\Lead;
use App\Models\MedioPago;
use App\Models\Comercial;
use App\Services\Presupuesto\ProductoServicioService;
use App\Services\Presupuesto\PresupuestoService;
use App\Services\Promocion\PromocionService;
use App\Helpers\PermissionHelper;
use Inertia\Inertia;
use Illuminate\Http\Request;

class PresupuestosController extends Controller
{
    protected $productoService;
    protected $presupuestoService;
    protected $promocionService;

    public function __construct(
        ProductoServicioService $productoService, 
        PresupuestoService $presupuestoService,
        PromocionService $promocionService
    ) {
        $this->productoService = $productoService;
        $this->presupuestoService = $presupuestoService;
        $this->promocionService = $promocionService;
    }

    public function index(Request $request)
    {
        $usuario = auth()->user();
        
        $query = Presupuesto::with(['lead', 'prefijo', 'estado', 'promocion']);
        
        // Aplicar filtros
        if ($request->filled('estado_id')) {
            $query->where('estado_id', $request->estado_id);
        }
        
        if ($request->filled('prefijo_id')) {
            $query->where('prefijo_id', $request->prefijo_id);
        }
        
        if ($request->filled('promocion_id')) {
            if ($request->promocion_id === '0' || $request->promocion_id === 'sin_promocion') {
                $query->where(function($q) {
                    $q->whereNull('promocion_id')
                    ->orWhere('promocion_id', 0);
                });
            } else {
                $query->where('promocion_id', $request->promocion_id);
            }
        }
        
        if ($request->filled('fecha_inicio')) {
            $query->whereDate('created', '>=', $request->fecha_inicio);
        }
        
        if ($request->filled('fecha_fin')) {
            $query->whereDate('created', '<=', $request->fecha_fin);
        }
        
        // Aplicar filtro por prefijos según permisos
        if (!$usuario->ve_todas_cuentas) {
            $prefijosPermitidos = PermissionHelper::getPrefijosPermitidos($usuario->id);
            $query->whereIn('prefijo_id', $prefijosPermitidos);
        }
        
        $presupuestos = $query->orderBy('created', 'desc')->paginate(5);

        // Agregar referencia a cada presupuesto
        $presupuestos->through(function ($presupuesto) {
            $presupuesto->referencia = sprintf('LS-%s-%s', date('Y', strtotime($presupuesto->created)), $presupuesto->id);
            $presupuesto->total_presupuesto = (float) $presupuesto->total_presupuesto; 
            return $presupuesto;
        });

        // Estadísticas para las cards
        $estadisticasQuery = Presupuesto::query();
        
        if (!$usuario->ve_todas_cuentas) {
            $prefijosPermitidos = PermissionHelper::getPrefijosPermitidos($usuario->id);
            $estadisticasQuery->whereIn('prefijo_id', $prefijosPermitidos);
        }
        
        $estadisticas = [
            'total' => (clone $estadisticasQuery)->count(),
            'activos' => (clone $estadisticasQuery)->where('estado_id', 1)->count(),
            'vencidos' => (clone $estadisticasQuery)->where('estado_id', 2)->count(),
            'aprobados' => (clone $estadisticasQuery)->where('estado_id', 3)->count(),
            'rechazados' => (clone $estadisticasQuery)->where('estado_id', 4)->count(),
        ];

        // Obtener prefijo del usuario si es comercial (similar a ProspectosController)
        $prefijoUsuario = null;
        if ($usuario->rol_id == 5) {
            // Buscar el comercial asociado al usuario
            $comercial = \App\Models\Comercial::with('personal')
                ->where('personal_id', $usuario->personal_id)
                ->where('activo', 1)
                ->first();
                
            if ($comercial) {
                $prefijo = \App\Models\Prefijo::find($comercial->prefijo_id);
                if ($prefijo) {
                    $nombreComercial = $comercial->personal->nombre . ' ' . $comercial->personal->apellido;
                    $prefijoUsuario = [
                        'id' => (string) $prefijo->id,
                        'codigo' => $prefijo->codigo,
                        'descripcion' => $prefijo->descripcion,
                        'comercial_nombre' => $nombreComercial,
                        'display_text' => "[{$prefijo->codigo}] {$nombreComercial}"
                    ];
                }
            }
        }
        
        // Obtener prefijos para filtro (con nombres de comerciales)
        $prefijosFiltro = \App\Models\Prefijo::with('comercial.personal')
            ->where('activo', 1)
            ->get()
            ->map(function($prefijo) {
                $comercial = $prefijo->comercial->first();
                $nombreComercial = $comercial && $comercial->personal 
                    ? $comercial->personal->nombre . ' ' . $comercial->personal->apellido
                    : null;
                
                return [
                    'id' => (string) $prefijo->id,
                    'codigo' => $prefijo->codigo,
                    'descripcion' => $prefijo->descripcion,
                    'comercial_nombre' => $nombreComercial,
                    'display_text' => $nombreComercial 
                        ? "[{$prefijo->codigo}] {$nombreComercial} "
                        : "[{$prefijo->codigo}] {$prefijo->descripcion}"
                ];
            })
            ->toArray();

        // Obtener datos para filtros
        $estados = \App\Models\EstadoEntidad::all(['id', 'nombre']);
        $promociones = \App\Models\Promocion::where('activo', 1)->get(['id', 'nombre']);

        return Inertia::render('Comercial/Presupuestos/Index', [
            'presupuestos' => $presupuestos,
            'estadisticas' => $estadisticas,
            'usuario' => [
                've_todas_cuentas' => $usuario->ve_todas_cuentas,
                'rol_id' => $usuario->rol_id,
                'nombre_completo' => $usuario->personal ? 
                    $usuario->personal->nombre . ' ' . $usuario->personal->apellido : 
                    $usuario->nombre_usuario,
                'prefijos_asignados' => $usuario->ve_todas_cuentas ? null : PermissionHelper::getPrefijosPermitidos($usuario->id)
            ],
            'prefijosFiltro' => $prefijosFiltro,
            'prefijoUsuario' => $prefijoUsuario,
            'estados' => $estados,
            'promociones' => $promociones
        ]);
    }

    public function create(Request $request)
    {
        $usuario = auth()->user();
        $leadId = $request->get('lead_id');
        
        if (!$leadId) {
            return redirect()->route('comercial.prospectos')
                ->with('error', 'Debe seleccionar un lead para crear un presupuesto');
        }
        
        $lead = Lead::with('prefijo')->find($leadId);
        
        if (!$lead) {
            return redirect()->route('comercial.prospectos')
                ->with('error', 'El lead seleccionado no existe');
        }
        
        // Obtener comerciales activos
        $comerciales = \App\Models\Comercial::with('personal')
            ->where('activo', 1)
            ->get()
            ->map(function($comercial) {
                return [
                    'id' => $comercial->id,
                    'prefijo_id' => $comercial->prefijo_id,
                    'nombre' => $comercial->personal->nombre_completo ?? 'Sin nombre',
                    'email' => $comercial->personal->email ?? '',
                ];
            });
        
        // Obtener prefijos permitidos
        $prefijos = PermissionHelper::getPrefijosPermitidos($usuario->id);
        
        if ($usuario->ve_todas_cuentas) {
            $prefijos = \App\Models\Prefijo::where('activo', 1)->pluck('id')->toArray();
        }
        
        // Obtener promociones vigentes
        $promociones = $this->promocionService->getPromocionesVigentes();
        
        // Datos del usuario para el frontend
        $usuarioData = [
            'rol_id' => $usuario->rol_id,
            'nombre_completo' => $usuario->personal?->nombre_completo ?? $usuario->nombre_usuario,
            'comercial' => null
        ];
        
        // Si es comercial, obtener su información completa
        if ($usuario->rol_id == 5) {
            $comercialUsuario = \App\Models\Comercial::with('personal')
                ->where('personal_id', $usuario->personal_id)
                ->where('activo', 1)
                ->first();
            
            if ($comercialUsuario) {
                $usuarioData['comercial'] = [
                    'id' => $comercialUsuario->id,
                    'prefijo_id' => $comercialUsuario->prefijo_id,
                    'nombre' => $comercialUsuario->personal->nombre_completo ?? $usuario->nombre_completo,
                    'email' => $comercialUsuario->personal->email ?? '',
                    'es_comercial' => true
                ];
            }
        }
        
        return Inertia::render('Comercial/Presupuestos/Create', [
            'lead' => [
                'id' => $lead->id,
                'nombre_completo' => $lead->nombre_completo,
                'email' => $lead->email,
                'telefono' => $lead->telefono,
                'prefijo_id' => $lead->prefijo_id,
                'prefijo' => $lead->prefijo ? [
                    'id' => $lead->prefijo->id,
                    'codigo' => $lead->prefijo->codigo,
                    'descripcion' => $lead->prefijo->descripcion
                ] : null
            ],
            'usuario' => $usuarioData,
            'comerciales' => $comerciales,
            'prefijos' => $prefijos,
            'promociones' => $promociones,
            'tasas' => $this->productoService->getTasas(),
            'abonos' => $this->productoService->getAbonos(),
            'convenios' => $this->productoService->getConvenios(),
            'accesorios' => $this->productoService->getAccesorios(),
            'servicios' => $this->productoService->getServicios(),
            'metodosPago' => MedioPago::where('es_activo', 1)->get()
        ]);
    }


public function store(Request $request)
{
    \Log::info('=== PRESUPUESTO STORE - INICIO ===');
    \Log::info('Request data:', $request->all());
    
    try {
        $diasValidez = (int) $request->input('validez', 7);
        $fechaValidez = now()->addDays($diasValidez)->format('Y-m-d');
        
        $validated = $request->validate([
            'prefijo_id' => 'required|exists:prefijos,id',
            'lead_id' => 'required|exists:leads,id',
            'promocion_id' => 'nullable|exists:promociones,id',
            'cantidad_vehiculos' => 'required|integer|min:1',
            'validez' => 'required|integer|min:1',
            'tasa_id' => 'required|exists:productos_servicios,id',
            'valor_tasa' => 'required|numeric|min:0',
            'tasa_bonificacion' => 'nullable|numeric|min:0|max:100',
            'tasa_metodo_pago_id' => 'required|exists:metodos_pago,id',
            'abono_id' => 'required|exists:productos_servicios,id',
            'valor_abono' => 'required|numeric|min:0',
            'abono_bonificacion' => 'nullable|numeric|min:0|max:100',
            'abono_metodo_pago_id' => 'required|exists:metodos_pago,id',
            'agregados' => 'nullable|array',
            'agregados.*.prd_servicio_id' => 'required|exists:productos_servicios,id',
            'agregados.*.cantidad' => 'required|integer|min:1',
            'agregados.*.aplica_a_todos_vehiculos' => 'boolean',
            'agregados.*.valor' => 'required|numeric|min:0',
            'agregados.*.bonificacion' => 'nullable|numeric|min:0|max:100',
        ]);

        \Log::info('Validación exitosa', $validated);

        $validated['validez'] = $fechaValidez;

        $presupuesto = $this->presupuestoService->createPresupuesto($validated);
        
        \Log::info('Presupuesto creado con ID: ' . $presupuesto->id);
        
        // 🔥 NUEVO: Actualizar estado del lead a "propuesta enviada" (ID 4)
        // Solo si el lead NO es cliente
        $lead = Lead::find($request->lead_id);
        if ($lead && !$lead->es_cliente) {
            $lead->update([
                'estado_lead_id' => 4, // ID del estado "propuesta enviada"
                'modified_by' => auth()->id(),
            ]);
            \Log::info('Lead actualizado a propuesta enviada', ['lead_id' => $lead->id]);
        }
        
        return redirect()->route('comercial.presupuestos.show', $presupuesto->id)
            ->with('success', 'Presupuesto creado correctamente');
            
    } catch (\Illuminate\Validation\ValidationException $e) {
        \Log::error('Error de validación:', $e->errors());
        return back()->withErrors($e->errors())->withInput();
    } catch (\Exception $e) {
        \Log::error('Error general en store: ' . $e->getMessage());
        \Log::error('Trace: ' . $e->getTraceAsString());
        
        return back()->withErrors([
            'error' => 'Error al crear el presupuesto: ' . $e->getMessage()
        ])->withInput();
    }
}

    public function show(Presupuesto $presupuesto)
    {
        // Cargar todas las relaciones necesarias
        $presupuesto->load([
            'lead', 
            'prefijo.comercial.personal',
            'tasa', 
            'abono',
            'promocion.productos', // ← Cambiar de 'promocion' a 'promocion.productos'
            'agregados.productoServicio.tipo',
            'estado'
        ]);

        $presupuesto->nombre_comercial = $presupuesto->nombre_comercial;
        
        return Inertia::render('Comercial/Presupuestos/Show', [
            'presupuesto' => $presupuesto
        ]);
    }

public function edit(Presupuesto $presupuesto)
{
    $usuario = auth()->user();
    
    // Cargar todas las relaciones necesarias
    $presupuesto->load([
        'lead',
        'tasa',
        'abono',
        'promocion',
        'agregados.productoServicio',
        'prefijo'
    ]);
    
    // Obtener datos necesarios para el formulario
    $tasas = $this->productoService->getTasas();
    $abonos = $this->productoService->getAbonos();
    $convenios = $this->productoService->getConvenios();
    $accesorios = $this->productoService->getAccesorios();
    $servicios = $this->productoService->getServicios();
    $metodosPago = MedioPago::where('es_activo', 1)->get();
    $promociones = $this->promocionService->getPromocionesVigentes();
    
    // Obtener comerciales activos
    $comerciales = \App\Models\Comercial::with('personal')
        ->where('activo', 1)
        ->get()
        ->map(function($comercial) {
            return [
                'id' => $comercial->id,
                'prefijo_id' => $comercial->prefijo_id,
                'nombre' => $comercial->personal->nombre_completo ?? 'Sin nombre',
                'email' => $comercial->personal->email ?? '',
            ];
        });
    
    return Inertia::render('Comercial/Presupuestos/Edit', [
        'presupuesto' => $presupuesto,
        'comerciales' => $comerciales,
        'tasas' => $tasas,
        'abonos' => $abonos,
        'convenios' => $convenios,
        'accesorios' => $accesorios,
        'servicios' => $servicios,
        'metodosPago' => $metodosPago,
        'promociones' => $promociones
    ]);
}

public function update(Request $request, Presupuesto $presupuesto)
{
    \Log::info('=== PRESUPUESTO UPDATE - INICIO ===');
    \Log::info('Request data:', $request->all());
    
    try {
        $diasValidez = (int) $request->input('validez', 7);
        $fechaValidez = now()->addDays($diasValidez)->format('Y-m-d');
        
        $validated = $request->validate([
            'prefijo_id' => 'required|exists:prefijos,id',
            'promocion_id' => 'nullable|exists:promociones,id',
            'cantidad_vehiculos' => 'required|integer|min:1',
            'validez' => 'required|integer|min:1',
            'tasa_id' => 'required|exists:productos_servicios,id',
            'valor_tasa' => 'required|numeric|min:0',
            'tasa_bonificacion' => 'nullable|numeric|min:0|max:100',
            'tasa_metodo_pago_id' => 'required|exists:metodos_pago,id',
            'abono_id' => 'required|exists:productos_servicios,id',
            'valor_abono' => 'required|numeric|min:0',
            'abono_bonificacion' => 'nullable|numeric|min:0|max:100',
            'abono_metodo_pago_id' => 'required|exists:metodos_pago,id',
            'agregados' => 'nullable|array',
            'agregados.*.prd_servicio_id' => 'required|exists:productos_servicios,id',
            'agregados.*.cantidad' => 'required|integer|min:1',
            'agregados.*.aplica_a_todos_vehiculos' => 'boolean',
            'agregados.*.valor' => 'required|numeric|min:0',
            'agregados.*.bonificacion' => 'nullable|numeric|min:0|max:100',
        ]);

        \Log::info('Validación exitosa', $validated);

        $validated['validez'] = $fechaValidez;

        $presupuestoActualizado = $this->presupuestoService->updatePresupuesto($presupuesto, $validated);
        
        \Log::info('Presupuesto actualizado con ID: ' . $presupuestoActualizado->id);
        
        return redirect()->route('comercial.presupuestos.show', $presupuestoActualizado->id)
            ->with('success', 'Presupuesto actualizado correctamente');
            
    } catch (\Illuminate\Validation\ValidationException $e) {
        \Log::error('Error de validación:', $e->errors());
        return back()->withErrors($e->errors())->withInput();
    } catch (\Exception $e) {
        \Log::error('Error general en update: ' . $e->getMessage());
        \Log::error('Trace: ' . $e->getTraceAsString());
        
        return back()->withErrors([
            'error' => 'Error al actualizar el presupuesto: ' . $e->getMessage()
        ])->withInput();
    }
}
    public function destroy(Presupuesto $presupuesto)
    {
        $presupuesto->delete();
        return redirect()->route('comercial.presupuestos')->with('success', 'Presupuesto eliminado');
    }


public function generarPdf(Presupuesto $presupuesto)
{
    // Cargar todas las relaciones necesarias
    $presupuesto->load([
        'lead',
        'tasa',
        'abono',
        'promocion.productos',
        'agregados.productoServicio.tipo',
        'prefijo.comercial.personal'
    ]);

    // Obtener la compañía del comercial (si existe)
    $compania = null;
    $nombreCompania = 'LOCALSAT'; // Default
    if ($presupuesto->prefijo && $presupuesto->prefijo->comercial) {
        $comercial = $presupuesto->prefijo->comercial;
        if ($comercial instanceof \Illuminate\Database\Eloquent\Collection) {
            $comercial = $comercial->first();
        }
        if ($comercial) {
            $companiaId = $comercial->compania_id;
            $nombreCompania = match($companiaId) {
                1 => 'LOCALSAT',
                2 => 'SMARTSAT',
                3 => '360 SAT',
                default => 'LOCALSAT'
            };
            $compania = [
                'id' => $companiaId,
                'nombre' => $nombreCompania,
                'logo' => match($companiaId) {
                    1 => '/images/logos/logo.png',
                    2 => '/images/logos/logosmart.png',
                    3 => '/images/logos/360-logo.png',
                    default => '/images/logos/logo.png'
                }
            ];
        }
    }
    
    $codigoPrefijo = $presupuesto->prefijo?->codigo ?? 'LS';
    $anio = date('Y', strtotime($presupuesto->created));
    
    $referencia = sprintf('%s-%s-%s', 
        $codigoPrefijo,
        $anio,
        $presupuesto->id
    );

    $presupuesto->referencia = $referencia;
    $presupuesto->nombre_comercial = $presupuesto->nombre_comercial;
    $presupuesto->compania = $compania;

    // Calcular días de validez
    $fechaCreacion = \Carbon\Carbon::parse($presupuesto->created)->startOfDay();
    $fechaValidez = \Carbon\Carbon::parse($presupuesto->validez)->startOfDay();
    $presupuesto->dias_validez = (int) $fechaCreacion->diffInDays($fechaValidez);

    // Preparar datos del lead
    if (empty($presupuesto->lead->empresa)) {
        $presupuesto->lead->empresa = $presupuesto->lead->nombre_completo;
    }
    
    if (empty($presupuesto->lead->contacto)) {
        $presupuesto->lead->contacto = $presupuesto->lead->nombre_completo;
    }

    $download = request()->has('download') && request()->download == 1;

    // Para jsPDF, necesitamos enviar los datos al frontend
    return Inertia::render('Comercial/Presupuestos/PDF', [
        'presupuesto' => $presupuesto,
        'download' => $download,
        'nombreArchivo' => $download ? sprintf('Presupuesto_%s_%s.pdf', $referencia, str_replace(' ', '_', $nombreCompania)) : null
    ]);
}
    // Endpoints AJAX
    public function getTasas()
    {
        return response()->json($this->productoService->getTasas());
    }

    public function getAbonos(Request $request)
    {
        $tipo = $request->get('tipo', 'abono');
        
        if ($tipo === 'convenio') {
            return response()->json($this->productoService->getConvenios());
        }
        
        return response()->json($this->productoService->getAbonos());
    }

    public function getAccesorios()
    {
        return response()->json($this->productoService->getAccesorios());
    }

    public function getServicios()
    {
        return response()->json($this->productoService->getServicios());
    }

    // ← NUEVO: Endpoint para obtener promociones vía AJAX
    public function getPromociones()
    {
        return response()->json($this->promocionService->getPromocionesVigentes());
    }
}