<?php
// app/Http/Controllers/Comercial/PresupuestosController.php

namespace App\Http\Controllers\Comercial;

use App\Http\Controllers\Controller;
use App\Traits\Authorizable; // 🔥 IMPORTAR TRAIT
use App\Models\Presupuesto;
use App\Models\Lead;
use App\Models\MedioPago;
use App\Models\Comercial;
use App\Models\Personal;
use App\Services\Presupuesto\ProductoServicioService;
use App\Services\Presupuesto\PresupuestoService;
use App\Services\Promocion\PromocionService;
use Inertia\Inertia;
use Illuminate\Http\Request;
use Barryvdh\DomPDF\Facade\Pdf;

class PresupuestosController extends Controller
{
    use Authorizable; // 🔥 AGREGAR TRAIT

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
        
        $this->initializeAuthorization(); // 🔥 INICIALIZAR
    }

    public function index(Request $request)
    {
        // 🔥 VERIFICAR PERMISO
        $this->authorizePermiso(config('permisos.VER_PRESUPUESTOS'));
        
        $usuario = auth()->user();
        
        $query = Presupuesto::with(['lead', 'prefijo', 'estado', 'promocion']);
        
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
        
        // 🔥 APLICAR FILTRO DE PREFIJOS usando el trait
        $this->applyPrefijoFilter($query, $usuario);
        
        $presupuestos = $query->orderBy('created', 'desc')->paginate(5);

        $presupuestos->through(function ($presupuesto) {
            $presupuesto->referencia = sprintf('LS-%s-%s', date('Y', strtotime($presupuesto->created)), $presupuesto->id);
            $presupuesto->total_presupuesto = (float) $presupuesto->total_presupuesto; 
            return $presupuesto;
        });

        // 🔥 ESTADÍSTICAS con filtro de prefijos
        $estadisticasQuery = Presupuesto::query();
        $this->applyPrefijoFilter($estadisticasQuery, $usuario);
        
        $estadisticas = [
            'total' => (clone $estadisticasQuery)->count(),
            'activos' => (clone $estadisticasQuery)->where('estado_id', 1)->count(),
            'vencidos' => (clone $estadisticasQuery)->where('estado_id', 2)->count(),
            'aprobados' => (clone $estadisticasQuery)->where('estado_id', 3)->count(),
            'rechazados' => (clone $estadisticasQuery)->where('estado_id', 4)->count(),
        ];

        // 🔥 OBTENER PREFIJOS PERMITIDOS usando el trait
        $prefijosPermitidos = $this->getPrefijosPermitidos();
        
        // Obtener prefijo del usuario si es comercial
        $prefijoUsuario = null;
        if ($usuario->rol_id == 5) {
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
        
        // Obtener todos los prefijos para el filtro
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
                'prefijos_asignados' => $usuario->ve_todas_cuentas ? null : $prefijosPermitidos
            ],
            'prefijosFiltro' => $prefijosFiltro,
            'prefijoUsuario' => $prefijoUsuario,
            'estados' => $estados,
            'promociones' => $promociones
        ]);
    }

    public function create(Request $request)
    {
        // 🔥 VERIFICAR PERMISO DE GESTIÓN
        $this->authorizePermiso(config('permisos.GESTIONAR_PRESUPUESTOS'));
        
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
        
        // 🔥 VERIFICAR ACCESO AL LEAD
        $this->authorizeLeadAccess($lead);
        
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
        
        // 🔥 OBTENER PREFIJOS PERMITIDOS
        $prefijos = $this->getPrefijosPermitidos();
        
        $promociones = $this->promocionService->getPromocionesVigentes();
        
        $usuarioData = [
            'rol_id' => $usuario->rol_id,
            'nombre_completo' => $usuario->personal?->nombre_completo ?? $usuario->nombre_usuario,
            'comercial' => null
        ];
        
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
        // 🔥 VERIFICAR PERMISO DE GESTIÓN
        $this->authorizePermiso(config('permisos.GESTIONAR_PRESUPUESTOS'));
        
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
            
            $lead = Lead::find($request->lead_id);
            if ($lead && !$lead->es_cliente) {
                $lead->update([
                    'estado_lead_id' => 4,
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
        // 🔥 VERIFICAR ACCESO AL PRESUPUESTO (por prefijo)
        $this->authorizeLeadAccess($presupuesto); // Reutilizamos la misma lógica
        
        // Cargar todas las relaciones necesarias
        $presupuesto->load([
            'lead', 
            'prefijo.comercial.personal',
            'tasa', 
            'abono',
            'promocion.productos',
            'agregados.productoServicio.tipo',
            'estado'
        ]);

        // Obtener el comercial correctamente (puede ser colección o modelo)
        $comercial = null;
        $comercialEmail = '';
        $companiaNombre = 'LOCALSAT';
        $companiaId = 1;

        if ($presupuesto->prefijo) {
            $comercial = $presupuesto->prefijo->comercial;
            
            if ($comercial instanceof \Illuminate\Database\Eloquent\Collection) {
                $comercial = $comercial->first();
            }
            
            if ($comercial) {
                if ($comercial->personal) {
                    $comercialEmail = $comercial->personal->email ?? '';
                }
                
                $companiaId = $comercial->compania_id ?? 1;
                
                if ($comercial->compania) {
                    $companiaNombre = $comercial->compania->nombre ?? 'LOCALSAT';
                }
            }
        }

        $presupuesto->comercial_email = $comercialEmail;
        $presupuesto->compania_nombre = $companiaNombre;
        $presupuesto->compania_id = $companiaId;
        $presupuesto->nombre_comercial = $presupuesto->nombre_comercial;
        
        return Inertia::render('Comercial/Presupuestos/Show', [
            'presupuesto' => $presupuesto
        ]);
    }

    public function edit(Presupuesto $presupuesto)
    {
        // 🔥 VERIFICAR ACCESO Y PERMISO DE GESTIÓN
        $this->authorizeLeadAccess($presupuesto);
        $this->authorizePermiso(config('permisos.GESTIONAR_PRESUPUESTOS'));
        
        $usuario = auth()->user();
        
        $presupuesto->load([
            'lead',
            'tasa',
            'abono',
            'promocion',
            'agregados.productoServicio',
            'prefijo'
        ]);
        
        $tasas = $this->productoService->getTasas();
        $abonos = $this->productoService->getAbonos();
        $convenios = $this->productoService->getConvenios();
        $accesorios = $this->productoService->getAccesorios();
        $servicios = $this->productoService->getServicios();
        $metodosPago = MedioPago::where('es_activo', 1)->get();
        $promociones = $this->promocionService->getPromocionesVigentes();
        
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
        // 🔥 VERIFICAR ACCESO Y PERMISO DE GESTIÓN
        $this->authorizeLeadAccess($presupuesto);
        $this->authorizePermiso(config('permisos.GESTIONAR_PRESUPUESTOS'));
        
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
        // 🔥 VERIFICAR ACCESO Y PERMISO DE GESTIÓN
        $this->authorizeLeadAccess($presupuesto);
        $this->authorizePermiso(config('permisos.GESTIONAR_PRESUPUESTOS'));
        
        $presupuesto->delete();
        return redirect()->route('comercial.presupuestos')->with('success', 'Presupuesto eliminado');
    }

    public function generarPdf(Request $request, Presupuesto $presupuesto)
    {
        // 🔥 VERIFICAR ACCESO AL PRESUPUESTO
        $this->authorizeLeadAccess($presupuesto);
        
        // Recargar el presupuesto con todas las relaciones necesarias
        $presupuesto = Presupuesto::with([
            'lead',
            'tasa',
            'abono',
            'promocion.productos',
            'prefijo.comercial.personal'
        ])->find($presupuesto->id);

        // Cargar los agregados por separado con sus relaciones
        $agregados = \App\Models\PresupuestoAgregado::with(['productoServicio.tipo'])
            ->where('presupuesto_id', $presupuesto->id)
            ->get();

        $presupuesto->setRelation('agregados', $agregados);

        $codigoPrefijo = $presupuesto->prefijo?->codigo ?? 'LS';
        $anio = date('Y', strtotime($presupuesto->created));
        $referencia = sprintf('%s-%s-%s', $codigoPrefijo, $anio, $presupuesto->id);
        $presupuesto->referencia = $referencia;

        $fechaCreacion = \Carbon\Carbon::parse($presupuesto->created)->startOfDay();
        $fechaValidez = \Carbon\Carbon::parse($presupuesto->validez)->startOfDay();
        $presupuesto->dias_validez = (int) $fechaCreacion->diffInDays($fechaValidez);

        if (empty($presupuesto->lead->empresa)) {
            $presupuesto->lead->empresa = $presupuesto->lead->nombre_completo;
        }
        
        if (empty($presupuesto->lead->contacto)) {
            $presupuesto->lead->contacto = $presupuesto->lead->nombre_completo;
        }

        $compania = $this->getCompaniaData($presupuesto);

        $servicios_clasificados = [];
        $accesorios_clasificados = [];

        foreach ($agregados as $item) {
            if (!$item->productoServicio) {
                continue;
            }
            
            $tipoId = $item->productoServicio->tipo_id;
            
            if ($tipoId == 5) {
                $accesorios_clasificados[] = $item;
            } elseif ($tipoId == 3) {
                $servicios_clasificados[] = $item;
            }
        }

        $download = $request->has('download') && $request->download == 1;

        $pdf = Pdf::loadView('pdf.presupuesto', [
            'presupuesto' => $presupuesto,
            'compania' => $compania,
            'servicios_clasificados' => $servicios_clasificados,
            'accesorios_clasificados' => $accesorios_clasificados
        ])
        ->setPaper('A4')
        ->setOptions([
            'defaultFont' => 'sans-serif',
            'isHtml5ParserEnabled' => true,
            'isRemoteEnabled' => true,
            'chroot' => public_path(),
        ]);

        if ($download) {
            return $pdf->download('Presupuesto_' . $referencia . '.pdf');
        } else {
            return $pdf->stream('Presupuesto_' . $referencia . '.pdf');
        }
    }
    
    public function generarPdfTemp(Request $request, Presupuesto $presupuesto)
    {
        // 🔥 VERIFICAR ACCESO AL PRESUPUESTO
        $this->authorizeLeadAccess($presupuesto);
        
        \Log::info('========== GENERAR PDF TEMP ==========');
        \Log::info('Presupuesto ID: ' . $presupuesto->id);
        
        try {
            $presupuesto->load([
                'lead',
                'tasa',
                'abono',
                'promocion.productos',
                'agregados.productoServicio',
                'prefijo.comercial.personal'
            ]);

            foreach ($presupuesto->agregados as $agregado) {
                if ($agregado->productoServicio) {
                    $agregado->productoServicio->load('tipo');
                }
            }

            $codigoPrefijo = $presupuesto->prefijo?->codigo ?? 'LS';
            $anio = date('Y', strtotime($presupuesto->created));
            $referencia = sprintf('%s-%s-%s', $codigoPrefijo, $anio, $presupuesto->id);
            $presupuesto->referencia = $referencia;

            $fechaCreacion = \Carbon\Carbon::parse($presupuesto->created)->startOfDay();
            $fechaValidez = \Carbon\Carbon::parse($presupuesto->validez)->startOfDay();
            $presupuesto->dias_validez = (int) $fechaCreacion->diffInDays($fechaValidez);

            if (empty($presupuesto->lead->empresa)) {
                $presupuesto->lead->empresa = $presupuesto->lead->nombre_completo;
            }
            
            if (empty($presupuesto->lead->contacto)) {
                $presupuesto->lead->contacto = $presupuesto->lead->nombre_completo;
            }

            $compania = $this->getCompaniaData($presupuesto);

            $servicios_clasificados = [];
            $accesorios_clasificados = [];

            if ($presupuesto->agregados && $presupuesto->agregados->count() > 0) {
                foreach ($presupuesto->agregados as $item) {
                    if ($item->productoServicio) {
                        $tipoId = $item->productoServicio->tipo_id;
                        
                        if ($tipoId == 5) {
                            $accesorios_clasificados[] = $item;
                        } elseif ($tipoId == 3) {
                            $servicios_clasificados[] = $item;
                        }
                    }
                }
            }
            
            $pdf = Pdf::loadView('pdf.presupuesto', [
                'presupuesto' => $presupuesto,
                'compania' => $compania,
                'servicios_clasificados' => $servicios_clasificados,
                'accesorios_clasificados' => $accesorios_clasificados
            ])
            ->setPaper('A4')
            ->setOptions([
                'defaultFont' => 'sans-serif',
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'chroot' => public_path(),
            ]);
        
            $filename = "presupuesto-{$presupuesto->id}-" . time() . ".pdf";
            $path = storage_path("app/temp/{$filename}");
            
            if (!file_exists(storage_path('app/temp'))) {
                mkdir(storage_path('app/temp'), 0755, true);
            }
            
            file_put_contents($path, $pdf->output());
            
            $this->limpiarArchivosTemporales();
        
            return redirect()->back()->with('pdfData', [
                'success' => true,
                'url' => "/temp/presupuesto/{$presupuesto->id}?v=" . time(),
                'filename' => "Presupuesto_{$referencia}.pdf"
            ]);
        
        } catch (\Exception $e) {
            \Log::error('❌ Error generando PDF temporal:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
        
            return redirect()->back()->with('pdfData', [
                'success' => false,
                'error' => 'Error al generar el PDF: ' . $e->getMessage()
            ]);
        }
    }

    private function getCompaniaData(Presupuesto $presupuesto)
    {
        $compania = [
            'nombre' => 'LOCALSAT',
            'logo' => null
        ];
        
        if ($presupuesto->prefijo && $presupuesto->prefijo->comercial) {
            $comercial = $presupuesto->prefijo->comercial;
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
                
                if ($compania['logo'] && !file_exists($compania['logo'])) {
                    \Log::warning('Logo no encontrado: ' . $compania['logo']);
                    $compania['logo'] = null;
                }
            }
        }
        
        return $compania;
    }

    private function limpiarArchivosTemporales()
    {
        $tempDir = storage_path('app/temp');
        if (!file_exists($tempDir)) return;
        
        $archivos = glob($tempDir . '/*.pdf');
        $now = time();
        
        foreach ($archivos as $archivo) {
            if (is_file($archivo) && $now - filemtime($archivo) > 600) {
                unlink($archivo);
            }
        }
    }

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

    public function getPromociones()
    {
        return response()->json($this->promocionService->getPromocionesVigentes());
    }
}