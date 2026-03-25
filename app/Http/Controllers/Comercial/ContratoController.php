<?php
// app/Http/Controllers/Comercial/ContratoController.php

namespace App\Http\Controllers\Comercial;

use App\Http\Controllers\Controller;
use App\Helpers\ContratoHelper;
use App\Models\Presupuesto;
use App\Models\Lead;
use App\Models\Empresa;
use App\Models\EmpresaContacto;
use App\Models\EmpresaResponsable;
use App\Models\Contrato;
use App\Models\ContratoVehiculo;
use App\Models\DebitoCbu;
use App\Models\DebitoTarjeta;
use App\Models\TipoResponsabilidad;
use App\Models\TipoDocumento;
use App\Models\Nacionalidad;
use App\Models\CategoriaFiscal;
use App\Models\Plataforma;
use App\Models\Rubro;
use App\Models\Provincia;
use App\Models\AdminEmpresa;
use App\Models\AdminVehiculo;
use App\Models\CambioTitularidad;
use App\Models\CambioRazonSocial;
use App\Traits\Authorizable; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Auth;
use Barryvdh\DomPDF\Facade\Pdf;
use Inertia\Inertia;

class ContratoController extends Controller
{
    use Authorizable; 

    public function __construct()
    {
         \Log::info('ContratoController constructor', [
        'user_id' => auth()->id(),
        'is_authenticated' => auth()->check(),
        'session_id' => session()->getId()
    ]);

        $this->initializeAuthorization();
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
                 
            $prefijoUsuario = [
                'id' => (string) $comercial->prefijo->id,
                'codigo' => $comercial->prefijo->codigo,
                'descripcion' => $comercial->prefijo->descripcion,
                'comercial_nombre' => $comercial->personal?->nombre_completo,
                'display_text' => $comercial->prefijo->codigo . ' - ' . ($comercial->personal?->nombre_completo ?? 'Sin comercial')
            ];
        }
    }

    //  Función para obtener prefijos permitidos
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

    //  Aplicar filtro por prefijo (tanto por presupuesto como por empresa)
    if (!empty($prefijosPermitidos)) {
        $query->where(function($q) use ($prefijosPermitidos) {
            // Contratos con presupuesto (filtro por prefijo del presupuesto)
            $q->whereHas('presupuesto', function($subq) use ($prefijosPermitidos) {
                $subq->whereIn('prefijo_id', $prefijosPermitidos);
            })
            // O contratos sin presupuesto (filtro por prefijo de la empresa)
            ->orWhereHas('empresa', function($subq) use ($prefijosPermitidos) {
                $subq->whereIn('prefijo_id', $prefijosPermitidos);
            });
        });
    } elseif ($request->filled('prefijo_id') && !$usuarioEsComercial) {
        // Filtro manual por prefijo
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
        // No tiene permisos para ver nada
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

    // Obtener datos para filtros (solo para no comerciales)
    $prefijosFiltro = [];
    if (!$usuarioEsComercial) {
        $prefijosFiltro = \App\Models\Prefijo::with('comercial.personal')
            ->where('activo', true)
            ->get()
            ->map(function($prefijo) {
                $comercial = $prefijo->comercial->first();
                return [
                    'id' => (string) $prefijo->id,
                    'codigo' => $prefijo->codigo,
                    'descripcion' => $prefijo->descripcion,
                    'comercial_nombre' => $comercial?->personal?->nombre_completo,
                    'display_text' => $prefijo->codigo . ' - ' . ($comercial?->personal?->nombre_completo ?? 'Sin comercial')
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
    
    Log::info('🔵 store DESPUÉS DE authorizePermiso', [
        'user_id' => auth()->id(),
        'authenticated' => auth()->check()
    ]);
    
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

        $vendedorNombre = null;
    $vendedorPrefijo = null;
    
    // Buscar el comercial del presupuesto a través del usuario que lo creó
    if ($presupuesto->created_by) {
        $usuarioCreador = \App\Models\Usuario::with('personal')->find($presupuesto->created_by);
        
        if ($usuarioCreador && $usuarioCreador->personal) {
            // El usuario que creó el presupuesto tiene un personal asociado
            $vendedorNombre = $usuarioCreador->personal->nombre_completo;
            
            // Buscar el comercial asociado a ese personal
            $comercial = \App\Models\Comercial::where('personal_id', $usuarioCreador->personal->id)
                ->where('activo', 1)
                ->first();
                
            if ($comercial && $comercial->prefijo) {
                $vendedorPrefijo = $comercial->prefijo->codigo;
            }
        }
    }
    
    // Si no se encontró por el usuario creador, usar el comercial del prefijo
    if (!$vendedorNombre) {
        $comercial = $presupuesto->prefijo?->comercial?->first();
        if ($comercial && $comercial->personal) {
            $vendedorNombre = $comercial->personal->nombre_completo;
            $vendedorPrefijo = $presupuesto->prefijo?->codigo;
        }
    }
    
    Log::info('Vendedor asignado al contrato', [
        'presupuesto_id' => $presupuesto->id,
        'created_by' => $presupuesto->created_by,
        'vendedor_nombre' => $vendedorNombre,
        'vendedor_prefijo' => $vendedorPrefijo
    ]);

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

        // Generar ID del contrato
        Log::info('Generando ID con Helper', ['prefijo_id' => $presupuesto->prefijo_id]);
        $contratoId = ContratoHelper::generarNumeroContrato($presupuesto->prefijo_id);
        Log::info('ID generado por Helper', ['contrato_id' => $contratoId]);

        // Determinar si es cliente
        $esCliente = false;
        if ($lead && $lead->es_cliente) {
            $esCliente = true;
        }
        if ($lead && $lead->estado_lead && $lead->estado_lead->tipo === 'final_positivo') {
            $esCliente = true;
        }
        $contratosPrevios = Contrato::where('lead_id', $lead->id)->count();
        if ($contratosPrevios > 0) {
            $esCliente = true;
        }

        $contratoData = [
            'id' => $contratoId,
            'presupuesto_id' => $presupuesto->id,
            'lead_id' => $presupuesto->lead_id,
            'empresa_id' => $empresa->id,
            'fecha_emision' => now(),
            'estado_id' => 1,
            'tipo_operacion' => $esCliente ? 'venta_cliente' : 'alta_nueva',
            'vendedor_nombre' => $vendedorNombre,
            'vendedor_prefijo' => $vendedorPrefijo,
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

        $contrato = Contrato::create($contratoData);
        Log::info('Contrato creado con ID', ['contrato_id' => $contrato->id]);

        $empresa->update(['numeroalfa' => $contratoId]);

        $responsableFlota = EmpresaResponsable::where('empresa_id', $empresa->id)
            ->where('es_activo', true)
            ->whereIn('tipo_responsabilidad_id', [3, 5])
            ->first();

        $responsablePagos = EmpresaResponsable::where('empresa_id', $empresa->id)
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

        foreach ($request->vehiculos as $index => $vehiculo) {
            if (!empty($vehiculo['patente'])) {
                ContratoVehiculo::create([
                    'contrato_id' => $contrato->id,
                    'patente' => $vehiculo['patente'],
                    'marca' => $vehiculo['marca'] ?? null,
                    'modelo' => $vehiculo['modelo'] ?? null,
                    'anio' => $vehiculo['anio'] ?? null,
                    'color' => $vehiculo['color'] ?? null,
                    'identificador' => $vehiculo['identificador'] ?? null,
                    'orden' => $index + 1,
                    'created' => now(),
                ]);
            }
        }

        if ($request->metodo_pago === 'cbu' && $request->datos_cbu) {
            DebitoCbu::create([
                'contrato_id' => $contrato->id,
                'nombre_banco' => $request->datos_cbu['nombre_banco'],
                'cbu' => $request->datos_cbu['cbu'],
                'alias_cbu' => $request->datos_cbu['alias_cbu'] ?? null,
                'titular_cuenta' => $request->datos_cbu['titular_cuenta'],
                'tipo_cuenta' => $request->datos_cbu['tipo_cuenta'],
                'es_activo' => true,
                'created_by' => auth()->id(),
            ]);
        } elseif ($request->metodo_pago === 'tarjeta' && $request->datos_tarjeta) {
            DebitoTarjeta::create([
                'contrato_id' => $contrato->id,
                'tarjeta_emisor' => $request->datos_tarjeta['tarjeta_emisor'],
                'tarjeta_expiracion' => $request->datos_tarjeta['tarjeta_expiracion'],
                'tarjeta_numero' => $request->datos_tarjeta['tarjeta_numero'],
                'tarjeta_codigo' => $request->datos_tarjeta['tarjeta_codigo'] ?? null,
                'tarjeta_banco' => $request->datos_tarjeta['tarjeta_banco'],
                'titular_tarjeta' => $request->datos_tarjeta['titular_tarjeta'],
                'tipo_tarjeta' => $request->datos_tarjeta['tipo_tarjeta'],
                'es_activo' => true,
                'created_by' => auth()->id(),
            ]);
        }

        DB::commit();

        Log::info('🔵 store - ANTES DE REDIRIGIR', [
            'user_id' => auth()->id(),
            'authenticated' => auth()->check(),
            'session_id' => session()->getId(),
            'contrato_id' => $contrato->id
        ]);

        // 🔥 CRUCIAL: Guardar la sesión explícitamente
        session()->save();

        Log::info('🔵 store - SESIÓN GUARDADA', [
            'session_name' => session()->getName(),
            'session_id' => session()->getId()
        ]);

        // 🔥 USAR Inertia::location para forzar la redirección
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
        $contrato = Contrato::with([
            'vehiculos',
            'debitoCbu',
            'debitoTarjeta',
            'estado',
            'empresa',
            'presupuesto' => function($query) {
                $query->with([
                    'lead',
                    'tasa',
                    'abono',
                    'promocion',
                    'agregados' => function($q) {
                        $q->with([
                            'productoServicio' => function($pq) {
                                $pq->with('tipo');
                            }
                        ]);
                    }
                ]);
            }
        ])->findOrFail($id);
        
        // Verificar acceso por prefijo
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
        
        $contrato->numero_contrato = str_pad($contrato->id, 8, '0', STR_PAD_LEFT);
        
        // Determinar si el lead es cliente
        $contrato->lead_es_cliente = false;
        $contrato->lead_nombre_completo = '';
        
        if ($contrato->presupuesto && $contrato->presupuesto->lead) {
            $lead = $contrato->presupuesto->lead;
            $contrato->lead_nombre_completo = $lead->nombre_completo ?? '';
            if ($lead->es_cliente) {
                $contrato->lead_es_cliente = true;
            }
            if ($lead->estado_lead && $lead->estado_lead->tipo === 'final_positivo') {
                $contrato->lead_es_cliente = true;
            }
            $contratosPrevios = Contrato::where('lead_id', $lead->id)
                ->where('id', '!=', $contrato->id)
                ->count();
            if ($contratosPrevios > 0) {
                $contrato->lead_es_cliente = true;
            }
        } elseif ($contrato->empresa) {
            $contacto = EmpresaContacto::where('empresa_id', $contrato->empresa_id)
                ->where('es_activo', true)
                ->first();
            if ($contacto && $contacto->lead) {
                $lead = $contacto->lead;
                $contrato->lead_nombre_completo = $lead->nombre_completo ?? '';
                if ($lead->es_cliente) {
                    $contrato->lead_es_cliente = true;
                }
                if ($lead->estado_lead && $lead->estado_lead->tipo === 'final_positivo') {
                    $contrato->lead_es_cliente = true;
                }
            }
        }
        
        $contratosPreviosEmpresa = Contrato::where('empresa_id', $contrato->empresa_id)
            ->where('id', '!=', $contrato->id)
            ->count();
        if ($contratosPreviosEmpresa > 0) {
            $contrato->lead_es_cliente = true;
        }
        
        // Datos del vendedor y compañía
        $contrato->vendedor_email = '';
        $contrato->vendedor_telefono = '';
        $contrato->compania_id = 1;
        $contrato->compania_nombre = 'LOCALSAT';
        $contrato->plataforma_id = $contrato->empresa->plataforma_id ?? 1;
        
        if ($contrato->presupuesto && $contrato->presupuesto->prefijo) {
            $comercial = $contrato->presupuesto->prefijo->comercial;
            if ($comercial instanceof \Illuminate\Database\Eloquent\Collection) {
                $comercial = $comercial->first();
            }
            if ($comercial && $comercial->compania_id) {
                $contrato->compania_id = $comercial->compania_id ?? 1;
                if ($comercial->compania) {
                    $contrato->compania_nombre = $comercial->compania->nombre ?? 'LOCALSAT';
                }
            }
        }
        
        // Hidratar productos
        if ($contrato->presupuesto && $contrato->presupuesto->agregados) {
            foreach ($contrato->presupuesto->agregados as $agregado) {
                if ($agregado->productoServicio) {
                    $agregado->producto_codigo = $agregado->productoServicio->codigopro ?? 'XXXX';
                    $agregado->producto_nombre = $agregado->productoServicio->nombre ?? 'Sin nombre';
                    $agregado->tipo_nombre = $agregado->productoServicio->tipo?->nombre_tipo_abono ?? 'Otros';
                }
            }
        }
        
        if ($contrato->presupuesto && $contrato->presupuesto->tasa) {
            $contrato->presupuesto->tasa_codigo = $contrato->presupuesto->tasa->codigopro ?? 'TASA';
            $contrato->presupuesto->tasa_nombre = $contrato->presupuesto->tasa->nombre ?? 'Tasa/Instalación';
        }
        
        if ($contrato->presupuesto && $contrato->presupuesto->abono) {
            $contrato->presupuesto->abono_codigo = $contrato->presupuesto->abono->codigopro ?? 'ABONO';
            $contrato->presupuesto->abono_nombre = $contrato->presupuesto->abono->nombre ?? 'Abono mensual';
        }
        
        return Inertia::render('Comercial/Contratos/Show', [
            'contrato' => $contrato
        ]);
    }

    /**
     * Generar PDF del contrato
     */
    public function generarPdf(Request $request, $id)
    {
        $contrato = Contrato::findOrFail($id);
        if ($contrato->presupuesto && $contrato->presupuesto->prefijo_id) {
            $lead = new \stdClass();
            $lead->prefijo_id = $contrato->presupuesto->prefijo_id;
            $this->authorizeLeadAccess($lead);
        }
        
        $contrato = Contrato::with([
            'vehiculos',
            'debitoCbu',
            'debitoTarjeta',
            'estado',
            'empresa',
            'presupuesto' => function($query) {
                $query->with([
                    'tasa',
                    'abono',
                    'promocion.productos',
                    'agregados' => function($q) {
                        $q->with('productoServicio.tipo');
                    }
                ]);
            }
        ])->findOrFail($id);

        $compania = [
            'id' => 1,
            'nombre' => 'LOCALSAT',
            'logo' => '/images/logos/logo.png'
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
                    'logo' => match($companiaId) {
                        1 => '/images/logos/logo.png',
                        2 => '/images/logos/logosmart.png',
                        3 => '/images/logos/360-logo.png',
                        default => '/images/logos/logo.png'
                    }
                ];
            }
        }
        
        if ($request->has('download') && $request->download == 1) {
            return $this->descargarPdf($id);
        }
        
        return Inertia::render('Comercial/Contratos/ContratoHTML', [
            'contrato' => $contrato,
            'compania' => $compania
        ]);
    }

    /**
     * Descargar PDF del contrato
     */
    public function descargarPdf($id)
    {
        $contrato = Contrato::findOrFail($id);
        if ($contrato->presupuesto && $contrato->presupuesto->prefijo_id) {
            $lead = new \stdClass();
            $lead->prefijo_id = $contrato->presupuesto->prefijo_id;
            $this->authorizeLeadAccess($lead);
        }
        
        $contrato = Contrato::with([
            'vehiculos',
            'debitoCbu',
            'debitoTarjeta',
            'estado',
            'empresa',
            'presupuesto' => function($query) {
                $query->with([
                    'tasa',
                    'abono',
                    'promocion.productos',
                    'agregados'
                ]);
            }
        ])->findOrFail($id);

        if ($contrato->presupuesto && $contrato->presupuesto->agregados) {
            foreach ($contrato->presupuesto->agregados as $agregado) {
                $producto = \App\Models\ProductoServicio::with('tipo')->find($agregado->prd_servicio_id);
                $agregado->producto_nombre = $producto ? $producto->nombre : 'Producto #' . $agregado->prd_servicio_id;
                $agregado->tipo_id = $producto?->tipo_id;
                $agregado->tipo_nombre = $producto?->tipo?->nombre_tipo_abono ?? '';
                $agregado->producto_data = $producto;
            }
        }

        if ($contrato->presupuesto && $contrato->presupuesto->tasa_id && !$contrato->presupuesto->tasa) {
            $tasa = \App\Models\ProductoServicio::find($contrato->presupuesto->tasa_id);
            $contrato->presupuesto->tasa = $tasa;
        }

        if ($contrato->presupuesto && $contrato->presupuesto->abono_id && !$contrato->presupuesto->abono) {
            $abono = \App\Models\ProductoServicio::find($contrato->presupuesto->abono_id);
            $contrato->presupuesto->abono = $abono;
        }

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

        try {
            $pdf = Pdf::loadView('pdf.contrato', [
                'contrato' => $contrato,
                'compania' => $compania
            ])
            ->setPaper('A4')
            ->setOptions([
                'defaultFont' => 'sans-serif',
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'chroot' => public_path(),
            ]);

            return $pdf->download('contrato-' . str_pad($contrato->id, 8, '0', STR_PAD_LEFT) . '.pdf');

        } catch (\Exception $e) {
            \Log::error('Error generando PDF con Dompdf:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json(['error' => 'Error al generar PDF: ' . $e->getMessage()], 500);
        }
    }

    /**
     * Crear contrato desde una empresa existente (sin presupuesto)
     */
    public function createFromEmpresa($empresaId)
    {
        $this->authorizePermiso(config('permisos.GESTIONAR_CONTRATOS'));
        
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

        $adminEmpresa = AdminEmpresa::where('codigoalf2', $empresa->numeroalfa)->first();
        
        $vehiculos = collect();
        
        if ($adminEmpresa) {
            $vehiculos = AdminVehiculo::where('empresa_id', $adminEmpresa->id)
                ->orderBy('codigoalfa')
                ->get()
                ->map(function ($vehiculo) {
                    $abonos = collect();
                    
                    if (method_exists($vehiculo, 'abonos')) {
                        $abonos = $vehiculo->abonos()->get();
                    } else {
                        $abonos = \App\Models\AdminVehiculoAbono::where('codigoalfa', $vehiculo->codigoalfa)
                            ->get()
                            ->map(function ($abono) {
                                return [
                                    'id' => $abono->id,
                                    'abono_codigo' => $abono->abono_codigo,
                                    'abono_nombre' => $abono->abono_nombre,
                                    'abono_precio' => (float) $abono->abono_precio,
                                    'abono_descuento' => (float) $abono->abono_descuento,
                                    'abono_descmotivo' => $abono->abono_descmotivo,
                                ];
                            });
                    }
                    
                    return [
                        'id' => $vehiculo->id,
                        'codigo_alfa' => $vehiculo->codigo_completo,
                        'avl_patente' => $vehiculo->avl_patente,
                        'avl_marca' => $vehiculo->avl_marca,
                        'avl_modelo' => $vehiculo->avl_modelo,
                        'avl_anio' => $vehiculo->avl_anio,
                        'avl_color' => $vehiculo->avl_color,
                        'avl_identificador' => $vehiculo->avl_identificador,
                        'abonos' => $abonos,
                    ];
                });
        }

        $totalMensualAbonos = 0;
        foreach ($vehiculos as $vehiculo) {
            foreach ($vehiculo['abonos'] as $abono) {
                $precioConDescuento = $abono['abono_precio'] - ($abono['abono_precio'] * ($abono['abono_descuento'] / 100));
                $totalMensualAbonos += $precioConDescuento;
            }
        }

        $codigoPrefijo = $empresa->prefijo ? $empresa->prefijo->codigo : 'EMP';
        $empresa->codigo_completo = $codigoPrefijo . '-' . $empresa->numeroalfa;

        $contactoPrincipal = $empresa->contactos->firstWhere('es_contacto_principal', true);
        if (!$contactoPrincipal && $empresa->contactos->isNotEmpty()) {
            $contactoPrincipal = $empresa->contactos->first();
        }

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

        $tiposResponsabilidad = TipoResponsabilidad::where('es_activo', true)->get();
        $tiposDocumento = TipoDocumento::where('es_activo', true)->get();
        $nacionalidades = Nacionalidad::all();
        $categoriasFiscales = CategoriaFiscal::where('es_activo', true)->get();
        $plataformas = Plataforma::where('es_activo', true)->get();
        $rubros = Rubro::where('activo', true)->get();
        $provincias = Provincia::where('activo', true)->get();

        return Inertia::render('Comercial/Contratos/CreateFromEmpresa', [
            'empresa' => $empresa,
            'contacto' => $contactoPrincipal,
            'responsables' => $empresa->responsables,
            'vehiculos' => $vehiculos,
            'totalMensualAbonos' => $totalMensualAbonos,
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
     * Guardar nuevo contrato desde empresa existente (sin presupuesto)
     */
    public function storeFromEmpresa(Request $request)
    {
        $this->authorizePermiso(config('permisos.GESTIONAR_CONTRATOS'));
        
        $request->validate([
            'empresa_id' => 'required|exists:empresas,id',
            'contacto_id' => 'nullable|exists:empresa_contactos,id',
            'responsables' => 'nullable|array',
            'metodo_pago' => 'nullable|in:cbu,tarjeta',
            'datos_cbu' => 'required_if:metodo_pago,cbu|nullable|array',
            'datos_tarjeta' => 'required_if:metodo_pago,tarjeta|nullable|array',
            'total_mensual_abonos' => 'nullable|numeric',
        ]);

        $usuario = Auth::user();
        
        DB::beginTransaction();
        
        try {
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
            
            $empresa = Empresa::with([
                'localidadFiscal.provincia',
                'rubro',
                'categoriaFiscal',
                'plataforma',
                'prefijo'
            ])->findOrFail($request->empresa_id);
            
            $contacto = null;
            $lead = null;
            
            if ($request->contacto_id) {
                $contacto = EmpresaContacto::with([
                    'lead.localidad.provincia',
                    'lead.rubro',
                    'lead.origen',
                    'tipoResponsabilidad',
                    'tipoDocumento',
                    'nacionalidad'
                ])->find($request->contacto_id);
                
                if ($contacto && $contacto->lead) {
                    $lead = $contacto->lead;
                }
            }
            
            if (!$contacto) {
                $contacto = EmpresaContacto::where('empresa_id', $empresa->id)
                    ->where('es_contacto_principal', true)
                    ->with(['lead', 'tipoResponsabilidad', 'tipoDocumento', 'nacionalidad'])
                    ->first();
                    
                if ($contacto && $contacto->lead) {
                    $lead = $contacto->lead;
                }
            }
            
            if (!$lead) {
                $contacto = EmpresaContacto::where('empresa_id', $empresa->id)
                    ->where('es_activo', true)
                    ->with(['lead', 'tipoResponsabilidad', 'tipoDocumento', 'nacionalidad'])
                    ->first();
                    
                if ($contacto && $contacto->lead) {
                    $lead = $contacto->lead;
                }
            }
            
            // Determinar si es cliente
            $esCliente = false;
            
            $contratosPreviosEmpresa = Contrato::where('empresa_id', $empresa->id)->count();
            if ($contratosPreviosEmpresa > 0) {
                $esCliente = true;
            }
            
            if ($lead) {
                if ($lead->es_cliente) {
                    $esCliente = true;
                }
                if ($lead->estado_lead && $lead->estado_lead->tipo === 'final_positivo') {
                    $esCliente = true;
                }
                $contratosPreviosLead = Contrato::where('lead_id', $lead->id)->count();
                if ($contratosPreviosLead > 0) {
                    $esCliente = true;
                }
            }
            
            // Determinar tipo de operación
            $tipoOperacion = null;
            
            $cambioTitularidad = CambioTitularidad::where('empresa_destino_id', $empresa->id)
                ->orderBy('fecha_cambio', 'desc')
                ->first();
                
            $cambioRazonSocial = CambioRazonSocial::where('empresa_id', $empresa->id)
                ->orderBy('fecha_cambio', 'desc')
                ->first();
            
            if ($cambioTitularidad) {
                $tipoOperacion = 'cambio_titularidad';
            } elseif ($cambioRazonSocial) {
                $tipoOperacion = 'cambio_razon_social';
            } elseif ($esCliente) {
                $tipoOperacion = 'venta_cliente';
            } else {
                $tipoOperacion = 'alta_nueva';
            }
            
            $contratoId = ContratoHelper::generarNumeroContrato($empresa->prefijo_id);
            
            $contrato = new Contrato();
            $contrato->id = $contratoId;
            $contrato->presupuesto_id = null;
            $contrato->empresa_id = $empresa->id;
            $contrato->lead_id = $lead?->id ?? null;
            $contrato->fecha_emision = now();
            $contrato->estado_id = 1;
            $contrato->tipo_operacion = $tipoOperacion;
            $contrato->vendedor_nombre = $vendedorNombre;
            $contrato->vendedor_prefijo = $vendedorPrefijo;
            $contrato->cliente_nombre_completo = $lead?->nombre_completo ?? $empresa->nombre_fantasia;
            $contrato->cliente_genero = $lead?->genero ?? 'no_especifica';
            $contrato->cliente_telefono = $lead?->telefono ?? $empresa->telefono_fiscal;
            $contrato->cliente_email = $lead?->email ?? $empresa->email_fiscal;
            
            if ($lead && $lead->localidad) {
                $contrato->cliente_localidad = $lead->localidad->nombre;
                if ($lead->localidad->provincia) {
                    $contrato->cliente_provincia = $lead->localidad->provincia->nombre;
                }
            }
            
            $contrato->cliente_rubro = $lead?->rubro?->nombre;
            $contrato->cliente_origen = $lead?->origen?->nombre;
            
            if ($contacto) {
                $contrato->contacto_tipo_responsabilidad = $contacto->tipoResponsabilidad?->nombre;
                $contrato->contacto_tipo_documento = $contacto->tipoDocumento?->nombre;
                $contrato->contacto_nro_documento = $contacto->nro_documento;
                $contrato->contacto_nacionalidad = $contacto->nacionalidad?->pais;
                $contrato->contacto_fecha_nacimiento = $contacto->fecha_nacimiento;
                $contrato->contacto_direccion_personal = $contacto->direccion_personal;
                $contrato->contacto_codigo_postal_personal = $contacto->codigo_postal_personal;
            }
            
            $contrato->empresa_nombre_fantasia = $empresa->nombre_fantasia;
            $contrato->empresa_razon_social = $empresa->razon_social;
            $contrato->empresa_cuit = $empresa->cuit;
            $contrato->empresa_domicilio_fiscal = $empresa->direccion_fiscal;
            $contrato->empresa_codigo_postal_fiscal = $empresa->codigo_postal_fiscal;
            
            if ($empresa->localidadFiscal) {
                $contrato->empresa_localidad_fiscal = $empresa->localidadFiscal->nombre;
                if ($empresa->localidadFiscal->provincia) {
                    $contrato->empresa_provincia_fiscal = $empresa->localidadFiscal->provincia->nombre;
                }
            }
            
            $contrato->empresa_telefono_fiscal = $empresa->telefono_fiscal;
            $contrato->empresa_email_fiscal = $empresa->email_fiscal;
            $contrato->empresa_actividad = $empresa->rubro?->nombre;
            $contrato->empresa_situacion_afip = $empresa->categoriaFiscal?->nombre;
            $contrato->empresa_plataforma = $empresa->plataforma?->nombre;
            $contrato->empresa_nombre_flota = $empresa->nombre_flota;
            $contrato->presupuesto_cantidad_vehiculos = 0;
            $contrato->presupuesto_total_mensual = $request->total_mensual_abonos ?? 0;
            $contrato->created_by = $usuario->id;
            $contrato->created = now();
            $contrato->modified = now();
            $contrato->activo = true;
            $contrato->save();
            
            $adminEmpresa = \App\Models\AdminEmpresa::where('codigoalf2', $empresa->numeroalfa)->first();
            
            $cantidadVehiculos = 0;
            if ($adminEmpresa) {
                $vehiculos = \App\Models\AdminVehiculo::where('empresa_id', $adminEmpresa->id)
                    ->orderBy('codigoalfa')
                    ->get();
                
                foreach ($vehiculos as $index => $vehiculo) {
                    ContratoVehiculo::create([
                        'contrato_id' => $contrato->id,
                        'patente' => $vehiculo->avl_patente,
                        'marca' => $vehiculo->avl_marca,
                        'modelo' => $vehiculo->avl_modelo,
                        'anio' => $vehiculo->avl_anio,
                        'color' => $vehiculo->avl_color,
                        'identificador' => $vehiculo->avl_identificador,
                        'orden' => $index + 1,
                        'created' => now(),
                    ]);
                    $cantidadVehiculos++;
                }
                
                $contrato->presupuesto_cantidad_vehiculos = $cantidadVehiculos;
                $contrato->save();
            }
            
            if ($request->has('responsables') && is_array($request->responsables)) {
                foreach ($request->responsables as $responsableData) {
                    if (isset($responsableData['nombre_completo']) && !empty($responsableData['nombre_completo'])) {
                        EmpresaResponsable::create([
                            'empresa_id' => $empresa->id,
                            'tipo_responsabilidad_id' => $responsableData['tipo_responsabilidad_id'] ?? null,
                            'nombre_completo' => $responsableData['nombre_completo'],
                            'telefono' => $responsableData['telefono'] ?? null,
                            'email' => $responsableData['email'] ?? null,
                            'es_activo' => true,
                            'created_by' => $usuario->id,
                            'created' => now(),
                        ]);
                    }
                }
            }
            
            $responsableFlota = EmpresaResponsable::where('empresa_id', $empresa->id)
                ->where('es_activo', true)
                ->whereIn('tipo_responsabilidad_id', [3, 5])
                ->first();
                
            $responsablePagos = EmpresaResponsable::where('empresa_id', $empresa->id)
                ->where('es_activo', true)
                ->whereIn('tipo_responsabilidad_id', [4, 5])
                ->first();
                
            $contrato->responsable_flota_nombre = $responsableFlota?->nombre_completo;
            $contrato->responsable_flota_telefono = $responsableFlota?->telefono;
            $contrato->responsable_flota_email = $responsableFlota?->email;
            $contrato->responsable_pagos_nombre = $responsablePagos?->nombre_completo;
            $contrato->responsable_pagos_telefono = $responsablePagos?->telefono;
            $contrato->responsable_pagos_email = $responsablePagos?->email;
            $contrato->save();
            
            if ($request->metodo_pago === 'cbu' && $request->datos_cbu) {
                DebitoCbu::create([
                    'contrato_id' => $contrato->id,
                    'nombre_banco' => $request->datos_cbu['nombre_banco'],
                    'cbu' => $request->datos_cbu['cbu'],
                    'alias_cbu' => $request->datos_cbu['alias_cbu'] ?? null,
                    'titular_cuenta' => $request->datos_cbu['titular_cuenta'],
                    'tipo_cuenta' => $request->datos_cbu['tipo_cuenta'],
                    'es_activo' => true,
                    'created_by' => $usuario->id,
                    'created' => now(),
                ]);
            } elseif ($request->metodo_pago === 'tarjeta' && $request->datos_tarjeta) {
                DebitoTarjeta::create([
                    'contrato_id' => $contrato->id,
                    'tarjeta_emisor' => $request->datos_tarjeta['tarjeta_emisor'],
                    'tarjeta_expiracion' => $request->datos_tarjeta['tarjeta_expiracion'],
                    'tarjeta_numero' => $request->datos_tarjeta['tarjeta_numero'],
                    'tarjeta_codigo' => $request->datos_tarjeta['tarjeta_codigo'] ?? null,
                    'tarjeta_banco' => $request->datos_tarjeta['tarjeta_banco'],
                    'titular_tarjeta' => $request->datos_tarjeta['titular_tarjeta'],
                    'tipo_tarjeta' => $request->datos_tarjeta['tipo_tarjeta'],
                    'es_activo' => true,
                    'created_by' => $usuario->id,
                    'created' => now(),
                ]);
            }

            DB::commit();

            return redirect()->route('comercial.contratos.show', $contrato->id)
                ->with('success', 'Contrato generado exitosamente');

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al generar contrato desde empresa: ' . $e->getMessage(), [
                'trace' => $e->getTraceAsString(),
                'empresa_id' => $request->empresa_id ?? null,
                'usuario_id' => $usuario->id ?? null
            ]);
            return back()->withErrors(['error' => 'Error al generar contrato: ' . $e->getMessage()]);
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
     * Generar PDF temporal para enviar por email
     */
    public function generarPdfTemp(Request $request, $id)
    {
        $contrato = Contrato::findOrFail($id);
        if ($contrato->presupuesto && $contrato->presupuesto->prefijo_id) {
            $lead = new \stdClass();
            $lead->prefijo_id = $contrato->presupuesto->prefijo_id;
            $this->authorizeLeadAccess($lead);
        }
        
        try {
            $contrato = Contrato::with([
                'vehiculos',
                'debitoCbu',
                'debitoTarjeta',
                'estado',
                'empresa',
                'presupuesto' => function($query) {
                    $query->with([
                        'tasa',
                        'abono',
                        'promocion.productos',
                        'agregados' => function($q) {
                            $q->with('productoServicio.tipo');
                        }
                    ]);
                }
            ])->findOrFail($id);

            if ($contrato->presupuesto && $contrato->presupuesto->agregados) {
                foreach ($contrato->presupuesto->agregados as $agregado) {
                    $producto = \App\Models\ProductoServicio::with('tipo')->find($agregado->prd_servicio_id);
                    $agregado->producto_nombre = $producto ? $producto->nombre : 'Producto #' . $agregado->prd_servicio_id;
                    $agregado->tipo_id = $producto?->tipo_id;
                    $agregado->tipo_nombre = $producto?->tipo?->nombre_tipo_abono ?? '';
                    $agregado->producto_data = $producto;
                }
            }

            if ($contrato->presupuesto && $contrato->presupuesto->tasa_id && !$contrato->presupuesto->tasa) {
                $tasa = \App\Models\ProductoServicio::find($contrato->presupuesto->tasa_id);
                $contrato->presupuesto->tasa = $tasa;
            }

            if ($contrato->presupuesto && $contrato->presupuesto->abono_id && !$contrato->presupuesto->abono) {
                $abono = \App\Models\ProductoServicio::find($contrato->presupuesto->abono_id);
                $contrato->presupuesto->abono = $abono;
            }

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

            $pdf = Pdf::loadView('pdf.contrato', [
                'contrato' => $contrato,
                'compania' => $compania
            ])
            ->setPaper('A4')
            ->setOptions([
                'defaultFont' => 'sans-serif',
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'chroot' => public_path(),
            ]);

            $filename = "contrato-{$contrato->id}-" . time() . ".pdf";
            $path = storage_path("app/temp/{$filename}");
            
            if (!file_exists(storage_path('app/temp'))) {
                mkdir(storage_path('app/temp'), 0755, true);
            }
            
            file_put_contents($path, $pdf->output());
            
            $this->limpiarArchivosTemporales();

            $numeroContrato = str_pad($contrato->id, 8, '0', STR_PAD_LEFT);

            return redirect()->back()->with('pdfData', [
                'success' => true,
                'url' => "/temp/contrato/{$contrato->id}?v=" . time(),
                'filename' => "Contrato_{$numeroContrato}.pdf"
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

    /**
     * Limpiar archivos temporales antiguos
     */
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

    /**
     * Método auxiliar para verificar que todos los datos necesarios están completos
     */
    private function verificarDatosCompletos($empresa, $contacto, $lead)
    {
        $camposRequeridos = [
            'empresa' => ['nombre_fantasia', 'razon_social', 'cuit', 'direccion_fiscal', 
                         'codigo_postal_fiscal', 'localidad_fiscal_id', 'telefono_fiscal', 
                         'email_fiscal', 'rubro_id', 'cat_fiscal_id', 'plataforma_id', 'nombre_flota'],
            'contacto' => ['tipo_responsabilidad_id', 'tipo_documento_id', 'nro_documento', 
                          'nacionalidad_id', 'fecha_nacimiento', 'direccion_personal', 'codigo_postal_personal'],
            'lead' => ['nombre_completo', 'genero', 'telefono', 'email', 'localidad_id', 'rubro_id', 'origen_id']
        ];

        $faltantes = [];

        foreach ($camposRequeridos['empresa'] as $campo) {
            if (empty($empresa->$campo)) {
                $faltantes[] = "empresa.{$campo}";
            }
        }

        foreach ($camposRequeridos['contacto'] as $campo) {
            if (empty($contacto->$campo)) {
                $faltantes[] = "contacto.{$campo}";
            }
        }

        foreach ($camposRequeridos['lead'] as $campo) {
            if (empty($lead->$campo)) {
                $faltantes[] = "lead.{$campo}";
            }
        }

        if (!empty($faltantes)) {
            throw new \Exception('Faltan datos requeridos: ' . implode(', ', $faltantes));
        }

        return true;
    }
}