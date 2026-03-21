<?php
// app/Http/Controllers/Comercial/Cuentas/DetallesController.php

namespace App\Http\Controllers\Comercial\Cuentas;

use App\Http\Controllers\Controller;
use App\Traits\Authorizable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Empresa;
use App\Models\Comercial;
use App\Models\AdminEmpresa;
use App\Models\AdminVehiculoAbono;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Carbon\Carbon;

class DetallesController extends Controller
{
    use Authorizable;

    public function __construct()
    {
        $this->initializeAuthorization();
    }

    public function index(Request $request)
    {
        $this->authorizePermiso(config('permisos.VER_DETALLES_CUENTA'));
        
        $usuario = Auth::user();
        $prefijosPermitidos = $this->getPrefijosPermitidos();
        
        // Obtener el filtro de comercial del request
        $comercialFilter = $request->get('comercial_id');
        $prefijoCodigoFiltro = null;
        
        // Determinar qué prefijo usar para filtrar
        if ($comercialFilter) {
            // Si hay filtro explícito de comercial, usar ese
            $comercial = Comercial::with('prefijo')->find($comercialFilter);
            if ($comercial && $comercial->prefijo) {
                $prefijoCodigoFiltro = $comercial->prefijo->codigo;
            }
        } elseif ($usuario->rol_id == 5) {
            // Si es usuario comercial y no hay filtro, obtener su propio prefijo
            $comercialUsuario = Comercial::where('personal_id', $usuario->personal_id)
                ->with('prefijo')
                ->first();
            
            if ($comercialUsuario && $comercialUsuario->prefijo) {
                $prefijoCodigoFiltro = $comercialUsuario->prefijo->codigo;
            }
        }
        
        // Obtener empresas
        $empresasQuery = Empresa::with([
            'contactos' => function ($query) {
                $query->where('es_activo', 1)
                      ->whereNull('deleted_at')
                      ->with('lead');
            },
            'prefijo',
            'adminEmpresa',
            'adminEmpresa.vehiculosImportados' => function ($query) use ($prefijoCodigoFiltro) {
                if ($prefijoCodigoFiltro) {
                    $query->where('prefijo_codigo', $prefijoCodigoFiltro);
                }
            },
            'adminEmpresa.vehiculosImportados.abonos' => function ($query) use ($prefijoCodigoFiltro) {
                if ($prefijoCodigoFiltro) {
                    $query->where('prefijo_codigo', $prefijoCodigoFiltro);
                }
            }
        ])->whereNull('deleted_at');
        
        $this->applyPrefijoFilter($empresasQuery, $usuario);
        
        if ($prefijoCodigoFiltro) {
            $empresasQuery->whereHas('prefijo', function ($query) use ($prefijoCodigoFiltro) {
                $query->where('codigo', $prefijoCodigoFiltro);
            });
        }
        
        $empresas = $empresasQuery->orderBy('created', 'desc')->get();
        
        // Obtener prefijos y localidades
        $prefijos = DB::table('prefijos')
            ->where('activo', 1)
            ->pluck('codigo', 'id')
            ->toArray();
            
        $localidades = DB::table('localidades')
            ->join('provincias', 'localidades.provincia_id', '=', 'provincias.id')
            ->where('localidades.activo', 1)
            ->where('provincias.activo', 1)
            ->select(
                'localidades.id',
                'localidades.nombre',
                'localidades.codigo_postal',
                'provincias.nombre as provincia_nombre'
            )
            ->get()
            ->keyBy('id');
        
        // Calcular estadísticas básicas
        $total = $empresas->count();
        
        $fechaLimite = Carbon::now()->subDays(30);
        $nuevas = $empresas->filter(function ($empresa) use ($fechaLimite) {
            return $empresa->created && $empresa->created->gte($fechaLimite);
        })->count();
        
        // Transformar datos de empresas
        $empresasData = $empresas->map(function ($empresa) use ($prefijos, $localidades) {
            $codigoPrefijo = isset($prefijos[$empresa->prefijo_id]) ? $prefijos[$empresa->prefijo_id] : 'N/A';
            $codigoAlfaEmpresa = $codigoPrefijo . '-' . $empresa->numeroalfa;
            
            $localidadFiscal = null;
            if ($empresa->localidad_fiscal_id && isset($localidades[$empresa->localidad_fiscal_id])) {
                $loc = $localidades[$empresa->localidad_fiscal_id];
                $localidadFiscal = [
                    'localidad' => $loc->nombre,
                    'provincia' => $loc->provincia_nombre,
                    'codigo_postal' => $loc->codigo_postal,
                ];
            }
            
            $adminEmpresa = $empresa->adminEmpresa;
            
            return [
                'id' => $empresa->id,
                'prefijo_id' => $empresa->prefijo_id,
                'numeroalfa' => $empresa->numeroalfa,
                'codigo_alfa_empresa' => $codigoAlfaEmpresa,
                'nombre_fantasia' => $empresa->nombre_fantasia,
                'razon_social' => $empresa->razon_social,
                'cuit' => $empresa->cuit,
                'direccion_fiscal' => $empresa->direccion_fiscal,
                'codigo_postal_fiscal' => $empresa->codigo_postal_fiscal,
                'localidad_fiscal_id' => $empresa->localidad_fiscal_id,
                'localidad_fiscal' => $localidadFiscal,
                'telefono_fiscal' => $empresa->telefono_fiscal,
                'email_fiscal' => $empresa->email_fiscal,
                'es_activo' => (bool) $empresa->es_activo,
                'created' => $empresa->created ? $empresa->created->toDateTimeString() : null,
                'contactos' => $empresa->contactos->map(function ($contacto) {
                    return [
                        'id' => $contacto->id,
                        'empresa_id' => $contacto->empresa_id,
                        'es_contacto_principal' => (bool) $contacto->es_contacto_principal,
                        'es_activo' => (bool) $contacto->es_activo,
                        'lead' => $contacto->lead ? [
                            'id' => $contacto->lead->id,
                            'nombre_completo' => $contacto->lead->nombre_completo,
                            'email' => $contacto->lead->email,
                            'telefono' => $contacto->lead->telefono,
                        ] : null,
                    ];
                }),
                'vehiculos' => $adminEmpresa && $adminEmpresa->vehiculosImportados ? $adminEmpresa->vehiculosImportados->map(function ($vehiculo) {
                    return [
                        'id' => $vehiculo->id,
                        'codigo_alfa' => $vehiculo->codigoalfa,
                        'prefijo_codigo' => $vehiculo->prefijo_codigo,
                        'numero_alfa' => $vehiculo->numero_alfa,
                        'nombre_mix' => $vehiculo->nombre_mix,
                        'ab_alta' => $vehiculo->ab_alta ? $vehiculo->ab_alta->toDateString() : null,
                        'avl_anio' => $vehiculo->avl_anio,
                        'avl_color' => $vehiculo->avl_color,
                        'avl_identificador' => $vehiculo->avl_identificador,
                        'avl_marca' => $vehiculo->avl_marca,
                        'avl_modelo' => $vehiculo->avl_modelo,
                        'avl_patente' => $vehiculo->avl_patente,
                        'categoria' => 'IMPORTADO',
                        'empresa_id' => $vehiculo->empresa_id,
                        'abonos' => $vehiculo->abonos ? $vehiculo->abonos->map(function ($abono) {
                            return [
                                'id' => $abono->id,
                                'abono_codigo' => $abono->abono_codigo,
                                'abono_nombre' => $abono->abono_nombre,
                                'abono_precio' => (float) $abono->abono_precio,
                                'abono_descuento' => (float) $abono->abono_descuento,
                                'abono_descmotivo' => $abono->abono_descmotivo,
                                'prefijo_codigo' => $abono->prefijo_codigo,
                                'numero_alfa' => $abono->numero_alfa,
                                'created_at' => $abono->created_at ? $abono->created_at->toDateTimeString() : null,
                            ];
                        }) : [],
                    ];
                })->values() : [],
            ];
        });
        
        // Obtener comerciales
        $comerciales = Comercial::with(['personal', 'prefijo'])
            ->where('activo', 1)
            ->orderBy('id')
            ->get()
            ->map(function($comercial) {
                $nombre = $comercial->personal 
                    ? $comercial->personal->nombre . ' ' . $comercial->personal->apellido
                    : 'Comercial #' . $comercial->id;
                
                return [
                    'id' => $comercial->id,
                    'nombre' => $nombre,
                    'prefijo_id' => $comercial->prefijo_id,
                    'prefijo_codigo' => $comercial->prefijo->codigo ?? 'N/A',
                    'email' => $comercial->personal->email ?? null,
                    'compania_id' => $comercial->compania_id,
                ];
            })->toArray();
        
        // Estadísticas de abonos filtradas
        $abonosQuery = AdminVehiculoAbono::with(['producto.tipo']);
        
        if ($prefijoCodigoFiltro) {
            $abonosQuery->where('prefijo_codigo', $prefijoCodigoFiltro);
        } else {
            $numerosAlfaPermitidos = $empresas->pluck('numeroalfa')->filter()->toArray();
            if (!empty($numerosAlfaPermitidos)) {
                $abonosQuery->whereHas('vehiculo', function($query) use ($numerosAlfaPermitidos) {
                    $query->whereHas('adminEmpresa', function($q) use ($numerosAlfaPermitidos) {
                        $q->whereIn('codigoalf2', $numerosAlfaPermitidos);
                    });
                });
            }
        }
        
        $abonosEstadisticas = $abonosQuery->get();
        
        // Procesar estadísticas de abonos
        $estadisticasAbonos = [];
        foreach ($abonosEstadisticas as $abono) {
            $tipoNombre = 'Sin categoría';
            $tipoId = 0;
            
            if ($abono->producto && $abono->producto->tipo) {
                $tipoNombre = $abono->producto->tipo->nombre_tipo_abono;
                $tipoId = $abono->producto->tipo->id;
            }
            
            $key = $tipoId . '_' . $tipoNombre;
            
            if (!isset($estadisticasAbonos[$key])) {
                $estadisticasAbonos[$key] = [
                    'tipo_id' => $tipoId,
                    'tipo_nombre' => $tipoNombre,
                    'cantidad' => 0,
                    'total_sin_descuento' => 0,
                    'total_con_descuento' => 0,
                    'abonos' => []
                ];
            }
            
            $estadisticasAbonos[$key]['cantidad']++;
            $estadisticasAbonos[$key]['total_sin_descuento'] += $abono->abono_precio;
            
            if ($abono->abono_descuento && $abono->abono_descuento > 0) {
                $descuento = $abono->abono_precio * ($abono->abono_descuento / 100);
                $estadisticasAbonos[$key]['total_con_descuento'] += ($abono->abono_precio - $descuento);
            } else {
                $estadisticasAbonos[$key]['total_con_descuento'] += $abono->abono_precio;
            }
            
            $abonoNombre = $abono->abono_nombre;
            if (!isset($estadisticasAbonos[$key]['abonos'][$abonoNombre])) {
                $estadisticasAbonos[$key]['abonos'][$abonoNombre] = [
                    'nombre' => $abonoNombre,
                    'cantidad' => 0,
                    'total_sin_descuento' => 0,
                    'total_con_descuento' => 0,
                ];
            }
            
            $estadisticasAbonos[$key]['abonos'][$abonoNombre]['cantidad']++;
            $estadisticasAbonos[$key]['abonos'][$abonoNombre]['total_sin_descuento'] += $abono->abono_precio;
            
            if ($abono->abono_descuento && $abono->abono_descuento > 0) {
                $descuento = $abono->abono_precio * ($abono->abono_descuento / 100);
                $estadisticasAbonos[$key]['abonos'][$abonoNombre]['total_con_descuento'] += ($abono->abono_precio - $descuento);
            } else {
                $estadisticasAbonos[$key]['abonos'][$abonoNombre]['total_con_descuento'] += $abono->abono_precio;
            }
        }
        
        // Formatear estadísticas de abonos
        foreach ($estadisticasAbonos as &$tipo) {
            $tipo['abonos'] = array_values($tipo['abonos']);
            usort($tipo['abonos'], function($a, $b) {
                return $b['cantidad'] - $a['cantidad'];
            });
        }
        
        usort($estadisticasAbonos, function($a, $b) {
            return $b['cantidad'] - $a['cantidad'];
        });
        
        $tiposPrincipales = array_slice($estadisticasAbonos, 0, 4);
        $totalAbonosGeneral = array_sum(array_column($estadisticasAbonos, 'cantidad'));
        $totalMontoGeneral = array_sum(array_column($estadisticasAbonos, 'total_con_descuento'));
        
        // Información del usuario
        $infoUsuario = [
            've_todas_cuentas' => (bool) $usuario->ve_todas_cuentas,
            'prefijos' => $prefijosPermitidos,
            'rol_id' => $usuario->rol_id,
            'puede_ver_montos' => in_array($usuario->rol_id, [1, 2]),
            'prefijo_usuario' => $this->getPrefijoUsuarioComercial($usuario),
        ];
        
        // Prefijos para filtro (para usuarios no comerciales)
        $prefijosFiltro = [];
        if (!$usuario->ve_todas_cuentas) {
            foreach ($prefijosPermitidos as $prefijoId) {
                $prefijo = \App\Models\Prefijo::find($prefijoId);
                if ($prefijo) {
                    $comercial = Comercial::where('prefijo_id', $prefijoId)->first();
                    $prefijosFiltro[] = [
                        'id' => $prefijo->id,
                        'codigo' => $prefijo->codigo,
                        'descripcion' => $prefijo->descripcion,
                        'comercial_nombre' => $comercial && $comercial->personal 
                            ? $comercial->personal->nombre . ' ' . $comercial->personal->apellido 
                            : null,
                        'display_text' => $prefijo->codigo . ' - ' . ($comercial && $comercial->personal 
                            ? $comercial->personal->nombre . ' ' . $comercial->personal->apellido 
                            : $prefijo->descripcion),
                    ];
                }
            }
        }
        
        return Inertia::render('Comercial/Cuentas/Detalles', [
            'empresas' => $empresasData,
            'estadisticas' => [
                'total' => $total,
                'abonos' => $totalAbonosGeneral,
                'nuevas' => $nuevas,
            ],
            'estadisticas_abonos' => [
                'tipos_principales' => $tiposPrincipales,
                'total_abonos' => $totalAbonosGeneral,
                'total_monto' => $totalMontoGeneral,
            ],
            'usuario' => $infoUsuario,
            'comerciales' => $comerciales,
            'prefijosFiltro' => $prefijosFiltro,
            'filters' => [
                'comercial_id' => $comercialFilter,
            ],
        ]);
    }

    private function getPrefijoUsuarioComercial($usuario)
    {
        if ($usuario->rol_id != 5) {
            return null;
        }
        
        $comercial = Comercial::where('personal_id', $usuario->personal_id)
            ->where('activo', 1)
            ->with('prefijo')
            ->first();
        
        if (!$comercial || !$comercial->prefijo) {
            return null;
        }
        
        $nombreComercial = $usuario->personal 
            ? $usuario->personal->nombre . ' ' . $usuario->personal->apellido 
            : 'Mi cuenta';
        
        return [
            'id' => $comercial->prefijo->id,
            'codigo' => $comercial->prefijo->codigo,
            'descripcion' => $comercial->prefijo->descripcion,
            'comercial_nombre' => $nombreComercial,
            'display_text' => $comercial->prefijo->codigo . ' - ' . $nombreComercial,
        ];
    }

    public function show($id)
    {
        $usuario = Auth::user();
        $prefijosPermitidos = $this->getPrefijosPermitidos();
        
        $empresa = Empresa::with([
            'contactos' => function ($query) {
                $query->where('es_activo', 1)
                      ->whereNull('deleted_at')
                      ->with('lead');
            },
            'prefijo',
            'adminEmpresa',
            'adminEmpresa.vehiculosImportados.abonos'
        ])->where('id', $id)
          ->whereNull('deleted_at')
          ->firstOrFail();
        
        if (!$this->canViewAllRecords()) {
            if (empty($prefijosPermitidos) || !in_array($empresa->prefijo_id, $prefijosPermitidos)) {
                abort(403, 'No tiene permisos para ver esta empresa.');
            }
        }
        
        $prefijos = DB::table('prefijos')
            ->where('activo', 1)
            ->pluck('codigo', 'id')
            ->toArray();
            
        $localidades = DB::table('localidades')
            ->join('provincias', 'localidades.provincia_id', '=', 'provincias.id')
            ->where('localidades.activo', 1)
            ->where('provincias.activo', 1)
            ->select(
                'localidades.id',
                'localidades.nombre',
                'localidades.codigo_postal',
                'provincias.nombre as provincia_nombre'
            )
            ->get()
            ->keyBy('id');
        
        $codigoPrefijo = isset($prefijos[$empresa->prefijo_id]) ? $prefijos[$empresa->prefijo_id] : 'N/A';
        $codigoAlfaEmpresa = $codigoPrefijo . '-' . $empresa->numeroalfa;
        
        $localidadFiscal = null;
        if ($empresa->localidad_fiscal_id && isset($localidades[$empresa->localidad_fiscal_id])) {
            $loc = $localidades[$empresa->localidad_fiscal_id];
            $localidadFiscal = [
                'localidad' => $loc->nombre,
                'provincia' => $loc->provincia_nombre,
                'codigo_postal' => $loc->codigo_postal,
            ];
        }
        
        $adminEmpresa = $empresa->adminEmpresa;
        
        $empresaData = [
            'id' => $empresa->id,
            'prefijo_id' => $empresa->prefijo_id,
            'numeroalfa' => $empresa->numeroalfa,
            'codigo_alfa_empresa' => $codigoAlfaEmpresa,
            'nombre_fantasia' => $empresa->nombre_fantasia,
            'razon_social' => $empresa->razon_social,
            'cuit' => $empresa->cuit,
            'direccion_fiscal' => $empresa->direccion_fiscal,
            'codigo_postal_fiscal' => $empresa->codigo_postal_fiscal,
            'localidad_fiscal_id' => $empresa->localidad_fiscal_id,
            'localidad_fiscal' => $localidadFiscal,
            'telefono_fiscal' => $empresa->telefono_fiscal,
            'email_fiscal' => $empresa->email_fiscal,
            'es_activo' => (bool) $empresa->es_activo,
            'created' => $empresa->created ? $empresa->created->toDateTimeString() : null,
            'contactos' => $empresa->contactos->map(function ($contacto) {
                return [
                    'id' => $contacto->id,
                    'empresa_id' => $contacto->empresa_id,
                    'es_contacto_principal' => (bool) $contacto->es_contacto_principal,
                    'es_activo' => (bool) $contacto->es_activo,
                    'lead' => $contacto->lead ? [
                        'id' => $contacto->lead->id,
                        'nombre_completo' => $contacto->lead->nombre_completo,
                        'email' => $contacto->lead->email,
                        'telefono' => $contacto->lead->telefono,
                    ] : null,
                ];
            }),
            
            'admin_empresa' => $adminEmpresa ? [
                'id' => $adminEmpresa->id,
                'codigoalfa' => $adminEmpresa->codigoalfa,
                'codigoalf2' => $adminEmpresa->codigoalf2,
                'altaregist' => $adminEmpresa->altaregist ? $adminEmpresa->altaregist->toDateString() : null,
                'nombre_mix' => $adminEmpresa->nombre_mix,
                'razonsoc' => $adminEmpresa->razonsoc,
                
                'vehiculos' => $adminEmpresa->vehiculosImportados->map(function ($vehiculo) {
                    return [
                        'id' => $vehiculo->id,
                        'codigo_alfa' => $vehiculo->codigoalfa,
                        'prefijo_codigo' => $vehiculo->prefijo_codigo,
                        'numero_alfa' => $vehiculo->numero_alfa,
                        'nombre_mix' => $vehiculo->nombre_mix,
                        'ab_alta' => $vehiculo->ab_alta ? $vehiculo->ab_alta->toDateString() : null,
                        'ab_inicio' => $vehiculo->ab_inicio ? $vehiculo->ab_inicio->toDateString() : null,
                        'avl_anio' => $vehiculo->avl_anio,
                        'avl_color' => $vehiculo->avl_color,
                        'avl_identificador' => $vehiculo->avl_identificador,
                        'avl_marca' => $vehiculo->avl_marca,
                        'avl_modelo' => $vehiculo->avl_modelo,
                        'avl_patente' => $vehiculo->avl_patente,
                        'abonos' => $vehiculo->abonos->map(function ($abono) {
                            return [
                                'id' => $abono->id,
                                'abono_codigo' => $abono->abono_codigo,
                                'abono_nombre' => $abono->abono_nombre,
                                'abono_precio' => (float) $abono->abono_precio,
                                'abono_descuento' => (float) $abono->abono_descuento,
                                'abono_descmotivo' => $abono->abono_descmotivo,
                                'prefijo_codigo' => $abono->prefijo_codigo,
                                'numero_alfa' => $abono->numero_alfa,
                                'created_at' => $abono->created_at ? $abono->created_at->toDateTimeString() : null,
                            ];
                        }),
                    ];
                }),
            ] : null,
            
            'vehiculos' => $adminEmpresa ? $adminEmpresa->vehiculosImportados->map(function ($vehiculo) {
                return [
                    'id' => $vehiculo->id,
                    'codigo_alfa' => $vehiculo->codigoalfa,
                    'prefijo_codigo' => $vehiculo->prefijo_codigo,
                    'numero_alfa' => $vehiculo->numero_alfa,
                    'nombre_mix' => $vehiculo->nombre_mix,
                    'ab_alta' => $vehiculo->ab_alta ? $vehiculo->ab_alta->toDateString() : null,
                    'avl_anio' => $vehiculo->avl_anio,
                    'avl_color' => $vehiculo->avl_color,
                    'avl_identificador' => $vehiculo->avl_identificador,
                    'avl_marca' => $vehiculo->avl_marca,
                    'avl_modelo' => $vehiculo->avl_modelo,
                    'avl_patente' => $vehiculo->avl_patente,
                    'categoria' => 'IMPORTADO',
                    'empresa_id' => $vehiculo->empresa_id,
                    'abonos' => $vehiculo->abonos->map(function ($abono) {
                        return [
                            'id' => $abono->id,
                            'abono_codigo' => $abono->abono_codigo,
                            'abono_nombre' => $abono->abono_nombre,
                            'abono_precio' => (float) $abono->abono_precio,
                            'abono_descuento' => (float) $abono->abono_descuento,
                            'abono_descmotivo' => $abono->abono_descmotivo,
                            'prefijo_codigo' => $abono->prefijo_codigo,
                            'numero_alfa' => $abono->numero_alfa,
                            'created_at' => $abono->created_at ? $abono->created_at->toDateTimeString() : null,
                        ];
                    }),
                ];
            })->values() : [],
        ];
        
        return Inertia::render('Comercial/Cuentas/DetalleEmpresa', [
            'empresa' => $empresaData,
            'usuario' => [
                've_todas_cuentas' => (bool) $usuario->ve_todas_cuentas,
                'prefijos' => $prefijosPermitidos,
            ],
        ]);
    }
}