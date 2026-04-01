<?php
// app/Http/Controllers/Comercial/Cuentas/CertificadosFlotaController.php

namespace App\Http\Controllers\Comercial\Cuentas;

use App\Http\Controllers\Controller;
use App\Traits\Authorizable;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Empresa;
use App\Models\AdminVehiculo;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Services\Externo\DeltaService;
use App\Services\Externo\AlphaService;

class CertificadosFlotaController extends Controller
{
    use Authorizable;

    public function __construct()
    {
        $this->initializeAuthorization();
    }

    /**
     * Obtener logo según prefijo
     */
    private function obtenerLogoPorPrefijo(?string $prefijo): string
    {
        if ($prefijo === 'SS') {
            return 'images/logos/logosmart.png';
        }
        return 'images/logos/logo.png';
    }

    /**
     * Obtener prefijo de una patente desde la base de datos
     */
    private function obtenerPrefijoPorPatente(string $patente): ?string
    {
        try {
            $vehiculo = AdminVehiculo::where('avl_patente', $patente)
                ->orWhere('avl_patente', 'LIKE', "%{$patente}%")
                ->first();
            
            if ($vehiculo && !empty($vehiculo->prefijo_codigo)) {
                Log::info('Prefijo encontrado para patente', [
                    'patente' => $patente,
                    'prefijo_codigo' => $vehiculo->prefijo_codigo
                ]);
                return $vehiculo->prefijo_codigo;
            }
            
            return null;
        } catch (\Exception $e) {
            Log::error('Error obteniendo prefijo por patente', [
                'patente' => $patente,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

      public function index(Request $request)
    {
        $this->authorizePermiso(config('permisos.VER_CERTIFICADOS_FLOTA'));
        
        $usuario = Auth::user();
        $prefijosPermitidos = $this->getPrefijosPermitidos();
        
        try {
            // Obtener empresas con sus vehículos y accesorios
            $empresasQuery = Empresa::with([
                'prefijo',
                'adminEmpresa',
                'adminEmpresa.vehiculosImportados' => function ($query) {
                    $query->orderBy('avl_patente');
                },
                'adminEmpresa.vehiculosImportados.accesorios'
            ])->whereNull('deleted_at')
              ->where('es_activo', 1);
            
            // Aplicar filtro de prefijos permitidos
            $this->applyPrefijoFilter($empresasQuery, $usuario);
            
            // 🔥 NUEVO: Filtro de búsqueda - SOLO por nombre de empresa o patente
            if ($request->has('search') && !empty($request->search)) {
                    $search = $request->search;
                    $searchTerm = trim($search);
                    
                    Log::info('Buscando por término:', ['termino' => $searchTerm]);
                    
                    $empresasQuery->where(function($q) use ($searchTerm) {
                        // Búsqueda por nombre de empresa
                        $q->where('nombre_fantasia', 'like', "%{$searchTerm}%")
                        ->orWhere('razon_social', 'like', "%{$searchTerm}%")
                        // 🔥 Búsqueda por patente a través de la cadena de relaciones
                        ->orWhereHas('adminEmpresa', function($q2) use ($searchTerm) {
                            $q2->whereHas('vehiculosImportados', function($q3) use ($searchTerm) {
                                $q3->where('avl_patente', 'like', "%{$searchTerm}%");
                            });
                        });
                    });
                }
            
            $empresas = $empresasQuery->orderBy('nombre_fantasia')->get();
            
            // Obtener prefijos para el transformador
            $prefijos = DB::table('prefijos')
                ->where('activo', 1)
                ->pluck('codigo', 'id')
                ->toArray();
            
            // Transformar datos
            $empresasData = $empresas->map(function ($empresa) use ($prefijos) {
                $codigoPrefijo = isset($prefijos[$empresa->prefijo_id]) ? $prefijos[$empresa->prefijo_id] : 'N/A';
                $codigoAlfaEmpresa = $codigoPrefijo . '-' . $empresa->numeroalfa;
                
                $adminEmpresa = $empresa->adminEmpresa;
                $vehiculos = $adminEmpresa ? $adminEmpresa->vehiculosImportados : collect();
                
                // Métricas de vehículos
                $totalVehiculos = $vehiculos->count();
                $vehiculosConAccesorios = $vehiculos->filter(function($v) {
                    return $v->accesorios && (
                        $v->accesorios->enganche ||
                        $v->accesorios->panico ||
                        $v->accesorios->cabina ||
                        $v->accesorios->carga ||
                        $v->accesorios->corte ||
                        $v->accesorios->antivandalico
                    );
                })->count();
                
                return [
                    'id' => $empresa->id,
                    'prefijo_id' => $empresa->prefijo_id,
                    'numeroalfa' => $empresa->numeroalfa,
                    'codigo_alfa_empresa' => $codigoAlfaEmpresa,
                    'nombre_fantasia' => $empresa->nombre_fantasia,
                    'razon_social' => $empresa->razon_social,
                    'cuit' => $empresa->cuit,
                    'total_vehiculos' => $totalVehiculos,
                    'vehiculos_con_accesorios' => $vehiculosConAccesorios,
                    'vehiculos' => $vehiculos->map(function($vehiculo) {
                        $accesorios = $vehiculo->accesorios;
                        
                        // Lista de accesorios activos
                        $accesoriosActivos = [];
                        if ($accesorios) {
                            if ($accesorios->enganche) $accesoriosActivos[] = 'Enganche';
                            if ($accesorios->panico) $accesoriosActivos[] = 'Pánico';
                            if ($accesorios->cabina) $accesoriosActivos[] = 'Cabina';
                            if ($accesorios->carga) $accesoriosActivos[] = 'Carga';
                            if ($accesorios->corte) $accesoriosActivos[] = 'Corte';
                            if ($accesorios->antivandalico) $accesoriosActivos[] = 'Antivandalico';
                        }
                        
                        return [
                            'id' => $vehiculo->id,
                            'codigo_alfa' => $vehiculo->codigoalfa,
                            'patente' => $vehiculo->avl_patente,
                            'prefijo_codigo' => $vehiculo->prefijo_codigo ?? null,
                            'marca' => $vehiculo->avl_marca,
                            'modelo' => $vehiculo->avl_modelo,
                            'anio' => $vehiculo->avl_anio,
                            'color' => $vehiculo->avl_color,
                            'identificador' => $vehiculo->avl_identificador,
                            'nombre_mix' => $vehiculo->nombre_mix,
                            'accesorios' => $accesoriosActivos,
                            'tiene_accesorios' => !empty($accesoriosActivos),
                        ];
                    }),
                ];
            });
            
            // Información del usuario
            $infoUsuario = [
                've_todas_cuentas' => (bool) $usuario->ve_todas_cuentas,
                'prefijos' => $prefijosPermitidos,
                'rol_id' => $usuario->rol_id,
                'puede_ver_todas' => $usuario->ve_todas_cuentas || in_array($usuario->rol_id, [1, 2]),
            ];
            
            return Inertia::render('Comercial/Cuentas/CertificadosFlota', [
                'empresas' => $empresasData,
                'usuario' => $infoUsuario,
                'filters' => [
                    'search' => $request->search,
                ],
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error en index de certificados:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return back()->withErrors(['error' => 'Error al cargar los certificados']);
        }
    }
    
    /**
     * Generar certificado de flota completo para una empresa
     */
    public function generarCertificadoFlota(Request $request, $empresaId)
    {
        try {
            ini_set('memory_limit', '256M');
            ini_set('max_execution_time', 300);
            
            $usuario = Auth::user();
            
            if (!$usuario) {
                return redirect()->route('login');
            }
            
            $preview = $request->has('preview') && $request->preview == 1;
            $debug = $request->has('debug') && $request->debug == 1;
            
            Log::info('Iniciando generación de certificado flota', [
                'empresa_id' => $empresaId,
                'usuario_id' => $usuario->id,
                'preview' => $preview,
                'debug' => $debug
            ]);
            
            // Verificar que la empresa existe
            $empresa = Empresa::find($empresaId);
            
            if (!$empresa) {
                Log::error('Empresa no encontrada', ['empresa_id' => $empresaId]);
                return back()->withErrors(['error' => 'Empresa no encontrada']);
            }
            
            // Cargar relaciones por separado para mejor control
            $empresa->load('prefijo');
            $empresa->load('adminEmpresa');
            
            if ($empresa->adminEmpresa) {
                $empresa->adminEmpresa->load('vehiculosImportados');
            }
            
            Log::info('Empresa cargada', [
                'id' => $empresa->id,
                'nombre' => $empresa->nombre_fantasia ?: $empresa->razon_social,
                'tiene_admin' => !is_null($empresa->adminEmpresa)
            ]);
            
            // Verificar permisos
            $this->verificarAccesoEmpresa($empresa, $usuario);
            
            // Obtener vehículos con sus prefijos
            $vehiculos = [];
            $prefijoEmpresa = null;
            
            if ($empresa->adminEmpresa && $empresa->adminEmpresa->vehiculosImportados) {
                // Obtener el prefijo del primer vehículo (para el logo)
                $primerVehiculo = $empresa->adminEmpresa->vehiculosImportados->first();
                if ($primerVehiculo && !empty($primerVehiculo->prefijo_codigo)) {
                    $prefijoEmpresa = $primerVehiculo->prefijo_codigo;
                }
                
                $vehiculos = $empresa->adminEmpresa->vehiculosImportados
                    ->filter(function($v) {
                        return !empty($v->avl_patente);
                    })
                    ->map(function($v) {
                        return [
                            'patente' => $v->avl_patente,
                            'prefijo_codigo' => $v->prefijo_codigo ?? null,
                        ];
                    })
                    ->sortBy('patente')
                    ->values()
                    ->toArray();
            }
            
            //  Obtener logo según prefijo de la empresa o del primer vehículo
            $logoPath = $this->obtenerLogoPorPrefijo($prefijoEmpresa);
            $datosContacto = $this->obtenerDatosContactoPorPrefijo($prefijoEmpresa);

            Log::info('Vehículos obtenidos', [
                'cantidad' => count($vehiculos),
                'prefijo_empresa' => $prefijoEmpresa,
                'logo_path' => $logoPath
            ]);
            
            // Formatear fecha
            $fecha = now()->format('d \d\e F \d\e Y');
            $fecha = str_replace(
                ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
                $fecha
            );
            
            // Datos para la vista
            $viewData = [
                'empresa' => $empresa->toArray(),
                'vehiculos' => $vehiculos,
                'fecha' => $fecha,
                'logo_path' => $logoPath, //  Logo dinámico
                'prefijo' => $prefijoEmpresa, //  Prefijo para referencia
                'datos_contacto' => $datosContacto,
            ];
            
            // MODO DEBUG: devolver HTML
            if ($debug) {
                Log::info('Modo debug activado, devolviendo HTML');
                return view('pdf.certificado-flota', $viewData);
            }
            
            // Generar PDF
            Log::info('Generando PDF');
            
            $pdf = Pdf::loadView('pdf.certificado-flota', $viewData)
                ->setPaper('A4')
                ->setOptions([
                    'defaultFont' => 'sans-serif',
                    'isHtml5ParserEnabled' => true,
                    'isRemoteEnabled' => true,
                    'chroot' => public_path(),
                ]);
            
            // Nombre del archivo
            $nombreArchivo = 'Certificado_' . 
                            ($empresa->nombre_fantasia ?: $empresa->razon_social) . '_' . 
                            now()->format('Ymd') . '.pdf';
            $nombreArchivo = preg_replace('/[^a-zA-Z0-9_.-]/', '_', $nombreArchivo);
            
            Log::info('PDF generado correctamente', ['archivo' => $nombreArchivo]);
            
            if ($preview) {
                return $pdf->stream($nombreArchivo);
            } else {
                return $pdf->download($nombreArchivo);
            }
            
        } catch (\Exception $e) {
            Log::error('Error generando certificado:', [
                'empresa_id' => $empresaId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'file' => $e->getFile(),
                'line' => $e->getLine()
            ]);
            
            if ($request->wantsJson()) {
                return response()->json(['error' => 'Error al generar certificado: ' . $e->getMessage()], 500);
            }
            
            return back()->withErrors(['error' => 'Error al generar certificado: ' . $e->getMessage()]);
        }
    }
    
    /**
     * Verificar que el usuario tiene acceso a la empresa
     */
    private function verificarAccesoEmpresa($empresa, $usuario)
    {
        // Si puede ver todas, ok
        if ($usuario->ve_todas_cuentas || in_array($usuario->rol_id, [1, 2])) {
            return true;
        }
        
        // Verificar por prefijos permitidos
        $prefijosPermitidos = $this->getPrefijosPermitidos();
        if (!in_array($empresa->prefijo_id, $prefijosPermitidos)) {
            Log::warning('Intento de acceso no autorizado', [
                'usuario_id' => $usuario->id,
                'empresa_id' => $empresa->id,
                'prefijo_id' => $empresa->prefijo_id,
                'prefijos_permitidos' => $prefijosPermitidos
            ]);
            abort(403, 'No tiene permisos para acceder a esta empresa');
        }
        
        return true;
    }
    
    /**
     * Generar certificado individual para un vehículo
     */
    public function generarCertificadoVehiculo(Request $request, $vehiculoId)
    {
        try {
            ini_set('memory_limit', '256M');
            ini_set('max_execution_time', 300);
            
            $usuario = Auth::user();
            $preview = $request->has('preview') && $request->preview == 1;
            $debug = $request->has('debug') && $request->debug == 1;
            
            Log::info('=== INICIO GENERAR CERTIFICADO VEHÍCULO ===', [
                'vehiculo_id' => $vehiculoId,
                'usuario' => $usuario->id,
                'debug' => $debug
            ]);
            
            // Verificar que el vehículo existe
            $vehiculo = AdminVehiculo::with([
                'adminEmpresa.empresaSistema',
                'accesorios',
                'abonos' => function($query) {
                    $query->with('producto.tipo');
                }
            ])->where('id', $vehiculoId)
            ->firstOrFail();
            
            //  Obtener prefijo del vehículo
            $prefijoVehiculo = $vehiculo->prefijo_codigo ?? null;
            $datosContacto = $this->obtenerDatosContactoPorPrefijo($prefijoVehiculo);

            Log::info('Vehículo encontrado', [
                'id' => $vehiculo->id,
                'patente' => $vehiculo->avl_patente,
                'codigo' => $vehiculo->codigoalfa,
                'prefijo_codigo' => $prefijoVehiculo,
                'cantidad_abonos' => $vehiculo->abonos->count()
            ]);
            
            // Obtener la empresa
            $empresa = null;
            if ($vehiculo->adminEmpresa && $vehiculo->adminEmpresa->empresaSistema) {
                $empresa = $vehiculo->adminEmpresa->empresaSistema;
                Log::info('Empresa encontrada vía relación', [
                    'empresa_id' => $empresa->id,
                    'nombre' => $empresa->nombre_fantasia
                ]);
            }
            
            // Verificar permisos
            if ($empresa) {
                $this->verificarAccesoEmpresa($empresa, $usuario);
            }
            
            //  Obtener logo según prefijo del vehículo
            $logoPath = $this->obtenerLogoPorPrefijo($prefijoVehiculo);
            
            // Procesar accesorios
            $accesoriosActivos = [];
            if ($vehiculo->accesorios) {
                $acc = $vehiculo->accesorios;
                if ($acc->enganche) $accesoriosActivos[] = 'Sensor de enganche';
                if ($acc->panico) $accesoriosActivos[] = 'Botón de pánico';
                if ($acc->cabina) $accesoriosActivos[] = 'Sensor de puerta de cabina';
                if ($acc->carga) $accesoriosActivos[] = 'Sensor de puerta de carga';
                if ($acc->antivandalico) $accesoriosActivos[] = 'Sensor anti vandalismo';
                if ($acc->corte) $accesoriosActivos[] = 'Dispositivo de corte';
            }
            
            Log::info('Accesorios procesados', ['cantidad' => count($accesoriosActivos)]);
            
            // Procesar servicios
            $serviciosActivos = [];
            if ($vehiculo->abonos && $vehiculo->abonos->count() > 0) {
                foreach ($vehiculo->abonos as $abono) {
                    if ($abono->producto && $abono->producto->tipo_id == 3) {
                        $serviciosActivos[] = $abono->abono_nombre;
                    }
                }
            }
            
            Log::info('Servicios procesados', ['cantidad' => count($serviciosActivos)]);
            
            // Obtener última ubicación con DeltaService
            $ultimaUbicacion = null;
            $deltaService = app(DeltaService::class);
            $alphaService = app(AlphaService::class);

            if (!empty($vehiculo->avl_patente)) {
                Log::info('Consultando ubicación para vehículo', [
                    'patente' => $vehiculo->avl_patente,
                    'codigoalfa' => $vehiculo->codigoalfa,
                    'prefijo' => $prefijoVehiculo
                ]);
                
                // Detectar qué plataforma usa el vehículo según sus abonos
                $plataforma = $deltaService->getPlataformaVehiculo($vehiculo);
                
                Log::info('Plataforma detectada', [
                    'plataforma' => $plataforma,
                    'vehiculo_id' => $vehiculo->id,
                    'patente' => $vehiculo->avl_patente,
                    'codigoalfa' => $vehiculo->codigoalfa
                ]);
                
                if ($plataforma === 'delta') {
                    // Usar API Delta
                    $tipoBusqueda = 'patente';
                    $nombreEmpresa = $empresa['razon_social'] ?? $empresa['nombre_fantasia'] ?? '';
                    
                    if (!empty($nombreEmpresa)) {
                        $tipoBusqueda = $deltaService->detectarTipoBusqueda($nombreEmpresa);
                    }
                    
                    if ($tipoBusqueda === 'nombre') {
                        $response = $deltaService->porNombre([$vehiculo->avl_patente], $nombreEmpresa);
                    } else {
                        $response = $deltaService->porPatente([$vehiculo->avl_patente]);
                    }
                    
                    if ($response) {
                        $ultimaUbicacion = $deltaService->formatearUbicacion($response);
                    }
                    
                } else {
                    // Usar SOAP de Alpha (plataforma por defecto)
                    $codigoAlfa = $vehiculo->codigoalfa;
                    
                    if (empty($codigoAlfa)) {
                        Log::warning('Vehículo sin código alfa para consulta SOAP', [
                            'vehiculo_id' => $vehiculo->id,
                            'patente' => $vehiculo->avl_patente
                        ]);
                    } else {
                        $response = $alphaService->consultarUltimaPosicionPatente($vehiculo->avl_patente, $codigoAlfa);
                        
                        if ($response && !empty($response['latitud']) && !empty($response['longitud'])) {
                            // Formatear respuesta SOAP al mismo formato que DeltaService
                            $ultimaUbicacion = $this->formatearUbicacionAlpha($response);
                        }
                    }
                }
                
                if ($ultimaUbicacion) {
                    Log::info('Ubicación obtenida', ['data' => $ultimaUbicacion]);
                } else {
                    Log::warning('No se pudo obtener ubicación para el vehículo');
                }
            }
            
            // Formatear fecha
            $fecha = now()->format('d \d\e F \d\e Y');
            $fecha = str_replace(
                ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
                $fecha
            );
            
            $viewData = [
                'vehiculo' => $vehiculo,
                'empresa' => $empresa ? $empresa->toArray() : null,
                'accesorios' => $accesoriosActivos,
                'servicios' => $serviciosActivos,
                'ultima_ubicacion' => $ultimaUbicacion,
                'fecha' => $fecha,
                'logo_path' => $logoPath, //  Logo dinámico
                'prefijo' => $prefijoVehiculo, //  Prefijo para referencia
                'datos_contacto' => $datosContacto,
            ];
            
            Log::info('Datos preparados para la vista', [
                'tiene_ubicacion' => !is_null($ultimaUbicacion),
                'logo_path' => $logoPath,
                'prefijo' => $prefijoVehiculo
            ]);
            
            if ($debug) {
                Log::info('Modo debug - mostrando HTML');
                return view('pdf.certificado-vehiculo', $viewData);
            }
            
            Log::info('Generando PDF');
            
            $pdf = Pdf::loadView('pdf.certificado-vehiculo', $viewData)
                ->setPaper('A4')
                ->setOptions([
                    'defaultFont' => 'sans-serif',
                    'isHtml5ParserEnabled' => true,
                    'isRemoteEnabled' => true,
                    'chroot' => public_path(),
                ]);
            
            $nombreArchivo = 'Certificado_Vehiculo_' . 
                            ($vehiculo->avl_patente ?: $vehiculo->codigoalfa) . '_' . 
                            now()->format('Ymd') . '.pdf';
            $nombreArchivo = preg_replace('/[^a-zA-Z0-9_.-]/', '_', $nombreArchivo);
            
            Log::info('PDF generado', ['archivo' => $nombreArchivo]);
            
            if ($preview) {
                return $pdf->stream($nombreArchivo);
            } else {
                return $pdf->download($nombreArchivo);
            }
            
        } catch (\Exception $e) {
            Log::error('Error generando certificado de vehículo:', [
                'vehiculo_id' => $vehiculoId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return back()->withErrors(['error' => 'Error al generar certificado: ' . $e->getMessage()]);
        }
    }
    
    /**
     * Formatear respuesta de AlphaService al mismo formato que DeltaService
     */
    private function formatearUbicacionAlpha(?array $data): ?array
    {
        if (!$data) return null;
        
        // Obtener dirección
        $direccion = null;
        $mapaUrl = null;
        
        // Primero usar la aproximación que viene del servicio
        if (!empty($data['aproximacion'])) {
            $direccion = $data['aproximacion'];
            Log::info('Usando aproximación como dirección', ['direccion' => $direccion]);
        }
        
        // Si tenemos coordenadas, obtener dirección más precisa y mapa
        if (!empty($data['latitud']) && !empty($data['longitud'])) {
            $deltaService = app(DeltaService::class);
            
            // Solo obtener dirección de Nominatim si no tenemos aproximación
            if (empty($direccion)) {
                $direccion = $deltaService->obtenerDireccionDesdeCoordenadas($data['latitud'], $data['longitud']);
            }
            
            $mapaUrl = $deltaService->generarMapaEstatico($data['latitud'], $data['longitud']);
        }
        
        return [
            'fecha' => $data['fecha'],
            'latitud' => $data['latitud'],
            'longitud' => $data['longitud'],
            'direccion' => $direccion,
            'mapa_url' => $mapaUrl,
            'velocidad' => $data['velocidad'] ?? null,
            'estado' => $data['estado'] ?? null,
            'satelites' => $data['satelites'] ?? null,
            'plataforma' => 'alpha'
        ];
    }

/**
 * Obtener datos de contacto según prefijo
 */
private function obtenerDatosContactoPorPrefijo(?string $prefijo): array
{
    if ($prefijo === 'SS') {
        return [
            'telefono' => '11-3354-2174',
            'email' => 'comercial@smartsat.com.ar',
            'web' => 'www.smartsat.com.ar',
            'direccion' => '3 de Caballeria 432, Gualeguaychú, Entre Ríos',
        ];
    }
    // Por defecto LOCALSAT
    return [
        'telefono' => '0810-888-8205',
        'email' => 'info@localsat.com.ar',
        'web' => 'www.localsat.com.ar',
        'direccion' => '3 de Caballeria 432, Gualeguaychú, Entre Ríos',
    ];
}

    
}