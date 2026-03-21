<?php
// app/Http/Controllers/Comercial/Cuentas/ExternoController.php

namespace App\Http\Controllers\Comercial\Cuentas;

use App\Http\Controllers\Controller;
use App\Services\Externo\ExternoLogService;
use App\Traits\SanitizesData;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use Barryvdh\DomPDF\Facade\Pdf;
use App\Models\AdminVehiculo;
use App\Models\Empresa;
use App\Services\Externo\DeltaExternoService;
use App\Services\Externo\AlphaExternoService;

class ExternoController extends Controller
{
    use SanitizesData; // 👈 AGREGAR EL TRAIT
    
    const PLATAFORMA_DELTA = 'delta';
    const PLATAFORMA_ALPHA = 'alpha';
    const ALPHA_TIPO_FLOTA = 'flota';
    const ALPHA_TIPO_ALIAS = 'alias';

    protected $logService;

    public function __construct(ExternoLogService $logService)
    {
        $this->logService = $logService;
    }

    /**
     * Página de inicio con selección de plataforma
     */
    public function index()
    {
        return Inertia::render('Comercial/Cuentas/Externo', [
            'plataformas' => [
                [
                    'id' => self::PLATAFORMA_DELTA, 
                    'nombre' => 'Delta', 
                    'descripcion' => 'Acceso a vehículos Delta',
                    'logo' => '/images/logos/cybermapa_logo.png',
                    'poweredBy' => 'Cybermapa',
                    'poweredUrl' => 'https://seguimiento2.localsat.com.ar/StreetZ/'
                ],
                [
                    'id' => self::PLATAFORMA_ALPHA, 
                    'nombre' => 'Alpha', 
                    'descripcion' => 'Acceso a vehículos Alpha',
                    'logo' => '/images/logos/bykom_logo.png',
                    'poweredBy' => 'Bykom',
                    'poweredUrl' => 'http://seguimiento.localsat.com.ar/welcome.php'
                ],
            ],
            'alphaTipos' => [
                ['id' => self::ALPHA_TIPO_FLOTA, 'nombre' => 'Flota', 'descripcion' => 'Acceso por flota completa'],
                ['id' => self::ALPHA_TIPO_ALIAS, 'nombre' => 'Alias', 'descripcion' => 'Acceso por usuario/alias'],
            ]
        ]);
    }

    /**
     * Login según plataforma
     */
    public function login(Request $request)
    {
        $plataforma = $request->plataforma;
        
        if ($plataforma === self::PLATAFORMA_DELTA) {
            return $this->loginDelta($request);
        } elseif ($plataforma === self::PLATAFORMA_ALPHA) {
            return $this->loginAlpha($request);
        }
        
        return back()->withErrors(['error' => 'Plataforma no válida']);
    }

    /**
     * Login Delta con logging y sanitización
     */
    private function loginDelta(Request $request)
    {
        // Validación más estricta
        $request->validate([
            'usuario' => 'required|string|max:100|regex:/^[a-zA-Z0-9_.-]+$/',
            'password' => 'required|string|max:100',
        ]);

        // Sanitizar usuario
        $usuario = $this->sanitizarValor($request->usuario, 100);
        $password = $request->password;

        try {
            $deltaExterno = new DeltaExternoService($usuario, $password);
            
            $vehiculosResponse = $deltaExterno->obtenerTodosLosVehiculos();
            
            if (!$vehiculosResponse || !is_array($vehiculosResponse) || empty($vehiculosResponse)) {
                $this->logService->logLoginFallido(
                    self::PLATAFORMA_DELTA, 
                    $usuario, 
                    $request, 
                    'Credenciales inválidas o sin vehículos'
                );
                return back()->withErrors(['error' => 'Credenciales inválidas o error de conexión']);
            }
            
            if (isset($vehiculosResponse[0]['status']) && $vehiculosResponse[0]['status'] === 'rechazado') {
                $this->logService->logLoginFallido(
                    self::PLATAFORMA_DELTA, 
                    $usuario, 
                    $request, 
                    $vehiculosResponse[0]['mensajeError'] ?? 'Credenciales inválidas'
                );
                return back()->withErrors(['error' => $vehiculosResponse[0]['mensajeError'] ?? 'Credenciales inválidas']);
            }
            
            $empresasResponse = $deltaExterno->obtenerEmpresas();
            
            // Formatear vehículos
            $vehiculos = $deltaExterno->formatearVehiculosLista($vehiculosResponse, $empresasResponse ?? []);
            
            // Sanitizar vehículos
            $vehiculos = $this->sanitizarVehiculos($vehiculos);
            
            // Limitar cantidad
            if (count($vehiculos) > 500) {
                Log::warning('Demasiados vehículos para usuario Delta', [
                    'usuario' => $usuario,
                    'cantidad' => count($vehiculos)
                ]);
                $vehiculos = array_slice($vehiculos, 0, 500);
            }
            
            if (empty($vehiculos)) {
                $this->logService->logLoginFallido(
                    self::PLATAFORMA_DELTA, 
                    $usuario, 
                    $request, 
                    'No se encontraron vehículos'
                );
                return back()->withErrors(['error' => 'No se encontraron vehículos para este usuario']);
            }
            
            // Guardar en sesión
            Session::put('plataforma', self::PLATAFORMA_DELTA);
            Session::put('delta_usuario', $usuario);
            Session::put('delta_password', $password);
            Session::put('delta_vehiculos', $vehiculos);
            Session::put('delta_datos_raw', $vehiculosResponse);
            
            $this->logService->logLoginExitoso(
                self::PLATAFORMA_DELTA, 
                $usuario, 
                $request
            );
            
            return redirect()->route('cuentas.moviles.listar');
            
        } catch (\Exception $e) {
            $this->logService->logLoginFallido(
                self::PLATAFORMA_DELTA, 
                $usuario, 
                $request, 
                $e->getMessage()
            );
            
            Log::error('Error login Delta:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return back()->withErrors(['error' => 'Error de conexión: ' . $e->getMessage()]);
        }
    }

    /**
     * Login Alpha con logging y sanitización
     */
    private function loginAlpha(Request $request)
    {
        // Validación más estricta
        $request->validate([
            'tipo_consulta' => 'required|in:' . self::ALPHA_TIPO_FLOTA . ',' . self::ALPHA_TIPO_ALIAS,
            'usuario' => 'required|string|max:100|regex:/^[a-zA-Z0-9_.-]+$/',
            'password' => 'required|string|max:100',
        ]);

        // Sanitizar datos
        $usuario = $this->sanitizarValor($request->usuario, 100);
        $password = $request->password;
        $tipoConsulta = $request->tipo_consulta;

        try {
            $alphaExterno = new AlphaExternoService($usuario, $password);
            
            $tipoNumero = ($tipoConsulta === self::ALPHA_TIPO_FLOTA) ? 3 : 4;
            $moviles = $alphaExterno->consultarMoviles($tipoNumero);
            
            if (!$moviles || empty($moviles)) {
                $this->logService->logLoginFallido(
                    self::PLATAFORMA_ALPHA, 
                    $usuario, 
                    $request, 
                    'Credenciales inválidas o sin vehículos',
                    $tipoConsulta
                );
                return back()->withErrors(['error' => 'Credenciales inválidas o sin vehículos']);
            }
            
            $vehiculos = $alphaExterno->formatearVehiculosLista($moviles);
            
            // Sanitizar vehículos
            $vehiculos = $this->sanitizarVehiculos($vehiculos);
            
            // Limitar cantidad
            if (count($vehiculos) > 500) {
                Log::warning('Demasiados vehículos para usuario Alpha', [
                    'usuario' => $usuario,
                    'cantidad' => count($vehiculos)
                ]);
                $vehiculos = array_slice($vehiculos, 0, 500);
            }
            
            if (empty($vehiculos)) {
                $this->logService->logLoginFallido(
                    self::PLATAFORMA_ALPHA, 
                    $usuario, 
                    $request, 
                    'No se encontraron vehículos',
                    $tipoConsulta
                );
                return back()->withErrors(['error' => 'No se encontraron vehículos para este usuario']);
            }
            
            Session::put('plataforma', self::PLATAFORMA_ALPHA);
            Session::put('alpha_usuario', $usuario);
            Session::put('alpha_password', $password);
            Session::put('alpha_tipo', $tipoConsulta);
            Session::put('alpha_tipo_numero', $tipoNumero);
            Session::put('alpha_moviles', $vehiculos);
            
            $this->logService->logLoginExitoso(
                self::PLATAFORMA_ALPHA, 
                $usuario, 
                $request,
                $tipoConsulta
            );
            
            return redirect()->route('cuentas.moviles.listar');
            
        } catch (\Exception $e) {
            $this->logService->logLoginFallido(
                self::PLATAFORMA_ALPHA, 
                $usuario, 
                $request, 
                $e->getMessage(),
                $tipoConsulta
            );
            
            Log::error('Error login Alpha:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return back()->withErrors(['error' => 'Error de conexión: ' . $e->getMessage()]);
        }
    }

    /**
     * Listar vehículos del usuario
     */
    public function listarVehiculos()
    {
        $plataforma = Session::get('plataforma');
        
        if (!$plataforma) {
            return redirect()->route('cuentas.moviles');
        }
        
        if ($plataforma === self::PLATAFORMA_DELTA) {
            $vehiculos = Session::get('delta_vehiculos', []);
        } else {
            $vehiculos = Session::get('alpha_moviles', []);
        }
        
        return Inertia::render('Comercial/Cuentas/ExternoVehiculos', [
            'plataforma' => $plataforma,
            'vehiculos' => $vehiculos,
        ]);
    }

    /**
     * Generar certificado para un vehículo
     */
    public function generarCertificado(Request $request, $vehiculoId)
    {
        $plataforma = Session::get('plataforma');
        
        if (!$plataforma) {
            return redirect()->route('cuentas.moviles');
        }
        
        if ($plataforma === self::PLATAFORMA_DELTA) {
            return $this->generarCertificadoDelta($vehiculoId);
        } else {
            return $this->generarCertificadoAlpha($vehiculoId);
        }
    }

/**
 * Generar certificado para vehículo Delta
 */
private function generarCertificadoDelta($vehiculoId)
{
    try {
        ini_set('memory_limit', '256M');
        ini_set('max_execution_time', 300);
        
        $usuario = Session::get('delta_usuario');
        $password = Session::get('delta_password');
        $vehiculos = Session::get('delta_vehiculos', []);
        
        // Buscar el vehículo por ID
        $vehiculoData = collect($vehiculos)->firstWhere('id', $vehiculoId);
        
        if (!$vehiculoData) {
            $this->logService->logCertificado(
                self::PLATAFORMA_DELTA,
                $usuario,
                $vehiculoId,
                request(),
                false,
                'Vehículo no encontrado'
            );
            return back()->withErrors(['error' => 'Vehículo no encontrado']);
        }
        
        // Sanitizar patente
        $patente = $this->sanitizarPatente($vehiculoData['patente']);
        $patenteLimpia = preg_replace('/[^A-Z0-9]/', '', strtoupper($patente));
        
        Log::info('Buscando patente en base de datos local', [
            'patente_original' => $patente,
            'patente_limpia' => $patenteLimpia
        ]);
        
        // Buscar en admin_vehiculos por patente
        $vehiculoDB = AdminVehiculo::with([
            'adminEmpresa.empresaSistema',
            'accesorios',
            'abonos' => function($query) {
                $query->with('producto.tipo');
            }
        ])->where('avl_patente', 'LIKE', "%{$patenteLimpia}%")
          ->orWhere('avl_patente', 'LIKE', "%{$patente}%")
          ->first();
        
        // Si no se encuentra, buscar con formato con espacios
        if (!$vehiculoDB) {
            $patenteConEspacios = preg_replace('/([A-Z]{2})([0-9]{3})([A-Z]{2})/', '$1 $2 $3', $patenteLimpia);
            $vehiculoDB = AdminVehiculo::where('avl_patente', 'LIKE', "%{$patenteConEspacios}%")
                ->first();
        }
        
        // Obtener empresa asociada
        $empresaArray = [];
        if ($vehiculoDB && $vehiculoDB->adminEmpresa && $vehiculoDB->adminEmpresa->empresaSistema) {
            $empresaSistema = $vehiculoDB->adminEmpresa->empresaSistema;
            $empresaArray = [
                'razon_social' => $empresaSistema->razon_social,
                'nombre_fantasia' => $empresaSistema->nombre_fantasia,
                'cuit' => $empresaSistema->cuit,
                'id' => $empresaSistema->id,
            ];
            Log::info('Empresa encontrada en DB local', $empresaArray);
        } else {
            $empresaArray = [
                'razon_social' => $vehiculoData['empresa']['nombre'] ?? 'Usuario Externo',
                'nombre_fantasia' => $vehiculoData['empresa']['nombre'] ?? 'Usuario Externo',
                'cuit' => $vehiculoData['empresa']['cuit'] ?? null,
            ];
        }
        
        // Consultar datos actuales del vehículo desde API externa
        $deltaExterno = new DeltaExternoService($usuario, $password);
        $response = $deltaExterno->obtenerVehiculoPorPatente($patente);
        
        if (!$response) {
            $this->logService->logCertificado(
                self::PLATAFORMA_DELTA,
                $usuario,
                $vehiculoId,
                request(),
                false,
                'No se pudo obtener la ubicación'
            );
            return back()->withErrors(['error' => 'No se pudo obtener la ubicación del vehículo']);
        }
        
        // Formatear datos para el certificado
        $datosVehiculo = $deltaExterno->formatearVehiculoCertificado($response, $vehiculoData['empresa'] ?? null);
        
        // Procesar accesorios desde DB
        $accesoriosActivos = [];
        if ($vehiculoDB && $vehiculoDB->accesorios) {
            $acc = $vehiculoDB->accesorios;
            if ($acc->enganche) $accesoriosActivos[] = 'Sensor de enganche';
            if ($acc->panico) $accesoriosActivos[] = 'Botón de pánico';
            if ($acc->cabina) $accesoriosActivos[] = 'Sensor de puerta de cabina';
            if ($acc->carga) $accesoriosActivos[] = 'Sensor de puerta de carga';
            if ($acc->antivandalico) $accesoriosActivos[] = 'Sensor anti vandalismo';
            if ($acc->corte) $accesoriosActivos[] = 'Dispositivo de corte';
        }
        
        // Procesar servicios desde DB
        $serviciosActivos = [];
        if ($vehiculoDB && $vehiculoDB->abonos && $vehiculoDB->abonos->count() > 0) {
            foreach ($vehiculoDB->abonos as $abono) {
                if ($abono->producto && $abono->producto->tipo_id == 3) {
                    $serviciosActivos[] = $abono->abono_nombre;
                }
            }
        }
        
        // Datos del vehículo desde DB
        $vehiculoDataDB = $vehiculoDB ? [
            'avl_patente' => $vehiculoDB->avl_patente ?? $datosVehiculo['patente'],
            'avl_marca' => $vehiculoDB->avl_marca,
            'avl_modelo' => $vehiculoDB->avl_modelo,
            'avl_anio' => $vehiculoDB->avl_anio,
            'avl_color' => $vehiculoDB->avl_color,
        ] : [
            'avl_patente' => $datosVehiculo['patente'],
            'avl_marca' => null,
            'avl_modelo' => null,
            'avl_anio' => null,
            'avl_color' => null,
        ];
        
        // Formatear fecha del certificado
        $fechaCertificado = now()->format('d \d\e F \d\e Y');
        $fechaCertificado = str_replace(
            ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
            $fechaCertificado
        );
        
        // Datos para la vista
        $viewData = [
            'vehiculo' => (object) $vehiculoDataDB,
            'empresa' => $empresaArray,
            'accesorios' => $accesoriosActivos,
            'servicios' => $serviciosActivos,
            'ultima_ubicacion' => [
                'fecha' => $datosVehiculo['fecha'],
                'latitud' => $datosVehiculo['latitud'],
                'longitud' => $datosVehiculo['longitud'],
                'direccion' => $datosVehiculo['direccion'],
                'mapa_url' => $datosVehiculo['mapa_url'],
            ],
            'fecha' => $fechaCertificado,
        ];
        
        // 🔥 GENERAR PDF - ESTO FALTA
        $pdf = Pdf::loadView('pdf.certificado-vehiculo', $viewData)
            ->setPaper('A4')
            ->setOptions([
                'defaultFont' => 'sans-serif',
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'chroot' => public_path(),
            ]);
        
        $nombreArchivo = 'Certificado_' . $datosVehiculo['patente'] . '_' . now()->format('Ymd') . '.pdf';
        $nombreArchivo = preg_replace('/[^a-zA-Z0-9_.-]/', '_', $nombreArchivo);
        
        // Log de éxito
        $this->logService->logCertificado(
            self::PLATAFORMA_DELTA,
            $usuario,
            $vehiculoId,
            request(),
            true
        );
        
        return $pdf->download($nombreArchivo);
        
    } catch (\Exception $e) {
        $this->logService->logCertificado(
            self::PLATAFORMA_DELTA,
            Session::get('delta_usuario'),
            $vehiculoId,
            request(),
            false,
            $e->getMessage()
        );
        
        Log::error('Error generando certificado Delta externo:', [
            'vehiculo_id' => $vehiculoId,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        
        return back()->withErrors(['error' => 'Error al generar certificado: ' . $e->getMessage()]);
    }
}

/**
 * Generar certificado para vehículo Alpha
 */
private function generarCertificadoAlpha($vehiculoId)
{
    try {
        ini_set('memory_limit', '256M');
        ini_set('max_execution_time', 300);
        
        $usuario = Session::get('alpha_usuario');
        $password = Session::get('alpha_password');
        $tipoNumero = Session::get('alpha_tipo_numero'); // 3 o 4
        $vehiculos = Session::get('alpha_moviles', []);
        
        // Buscar el vehículo por ID (movilId)
        $vehiculoData = collect($vehiculos)->firstWhere('id', $vehiculoId);
        
        if (!$vehiculoData) {
            $this->logService->logCertificado(
                self::PLATAFORMA_ALPHA,
                $usuario,
                $vehiculoId,
                request(),
                false,
                'Vehículo no encontrado'
            );
            return back()->withErrors(['error' => 'Vehículo no encontrado']);
        }
        
        Log::info('Generando certificado Alpha', [
            'movilId' => $vehiculoData['movilId'],
            'identificador' => $vehiculoData['identificador'],
            'patente' => $vehiculoData['patente']
        ]);
        
        // Crear servicio Alpha
        $alphaExterno = new AlphaExternoService($usuario, $password);
        
        // PASO 2: Consultar posiciones
        $posiciones = $alphaExterno->consultarPosiciones([$vehiculoData['movilId']], $tipoNumero);
        
        if (!$posiciones || empty($posiciones)) {
            $this->logService->logCertificado(
                self::PLATAFORMA_ALPHA,
                $usuario,
                $vehiculoId,
                request(),
                false,
                'No se pudo obtener la ubicación'
            );
            Log::error('No se pudo obtener ubicación para Alpha', ['movilId' => $vehiculoData['movilId']]);
            return back()->withErrors(['error' => 'No se pudo obtener la ubicación del vehículo']);
        }
        
        $posicion = $posiciones[0];
        
        // Formatear datos para el certificado
        $datosVehiculo = $alphaExterno->formatearVehiculoCertificado($posicion, $vehiculoData);
        
        // Buscar en DB local para obtener datos adicionales
        $patente = $vehiculoData['patente'];
        $patenteLimpia = $patente ? preg_replace('/[^A-Z0-9]/', '', strtoupper($patente)) : null;
        
        $vehiculoDB = null;
        if ($patenteLimpia) {
            $vehiculoDB = AdminVehiculo::with([
                'adminEmpresa.empresaSistema',
                'accesorios',
                'abonos' => function($query) {
                    $query->with('producto.tipo');
                }
            ])->where('avl_patente', 'LIKE', "%{$patenteLimpia}%")
              ->orWhere('avl_patente', 'LIKE', "%{$patente}%")
              ->first();
        }
        
        // Obtener empresa asociada
        $empresaArray = [];
        if ($vehiculoDB && $vehiculoDB->adminEmpresa && $vehiculoDB->adminEmpresa->empresaSistema) {
            $empresaSistema = $vehiculoDB->adminEmpresa->empresaSistema;
            $empresaArray = [
                'razon_social' => $empresaSistema->razon_social,
                'nombre_fantasia' => $empresaSistema->nombre_fantasia,
                'cuit' => $empresaSistema->cuit,
                'id' => $empresaSistema->id,
            ];
            Log::info('Empresa encontrada en DB local para Alpha', $empresaArray);
        } elseif ($vehiculoData['empresa']) {
            $empresaArray = [
                'razon_social' => $vehiculoData['empresa']['nombre'] ?? 'Usuario Externo',
                'nombre_fantasia' => $vehiculoData['empresa']['nombre'] ?? 'Usuario Externo',
                'cuit' => $vehiculoData['empresa']['cuit'] ?? null,
            ];
        } else {
            $empresaArray = [
                'razon_social' => 'Usuario Externo',
                'nombre_fantasia' => 'Usuario Externo',
                'cuit' => null,
            ];
        }
        
        // Procesar accesorios desde DB
        $accesoriosActivos = [];
        if ($vehiculoDB && $vehiculoDB->accesorios) {
            $acc = $vehiculoDB->accesorios;
            if ($acc->enganche) $accesoriosActivos[] = 'Sensor de enganche';
            if ($acc->panico) $accesoriosActivos[] = 'Botón de pánico';
            if ($acc->cabina) $accesoriosActivos[] = 'Sensor de puerta de cabina';
            if ($acc->carga) $accesoriosActivos[] = 'Sensor de puerta de carga';
            if ($acc->antivandalico) $accesoriosActivos[] = 'Sensor anti vandalismo';
            if ($acc->corte) $accesoriosActivos[] = 'Dispositivo de corte';
        }
        
        // Procesar servicios desde DB
        $serviciosActivos = [];
        if ($vehiculoDB && $vehiculoDB->abonos && $vehiculoDB->abonos->count() > 0) {
            foreach ($vehiculoDB->abonos as $abono) {
                if ($abono->producto && $abono->producto->tipo_id == 3) {
                    $serviciosActivos[] = $abono->abono_nombre;
                }
            }
        }
        
        // Datos del vehículo desde DB
        $vehiculoDataDB = $vehiculoDB ? [
            'avl_patente' => $vehiculoDB->avl_patente ?? $datosVehiculo['patente'],
            'avl_marca' => $vehiculoDB->avl_marca,
            'avl_modelo' => $vehiculoDB->avl_modelo,
            'avl_anio' => $vehiculoDB->avl_anio,
            'avl_color' => $vehiculoDB->avl_color,
        ] : [
            'avl_patente' => $datosVehiculo['patente'],
            'avl_marca' => null,
            'avl_modelo' => null,
            'avl_anio' => null,
            'avl_color' => null,
        ];
        
        // Formatear fecha del certificado
        $fechaCertificado = now()->format('d \d\e F \d\e Y');
        $fechaCertificado = str_replace(
            ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
            ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
            $fechaCertificado
        );
        
        // Datos para la vista
        $viewData = [
            'vehiculo' => (object) $vehiculoDataDB,
            'empresa' => $empresaArray,
            'accesorios' => $accesoriosActivos,
            'servicios' => $serviciosActivos,
            'ultima_ubicacion' => [
                'fecha' => $datosVehiculo['fecha'],
                'latitud' => $datosVehiculo['latitud'],
                'longitud' => $datosVehiculo['longitud'],
                'direccion' => $datosVehiculo['direccion'],
                'mapa_url' => $datosVehiculo['mapa_url'],
            ],
            'fecha' => $fechaCertificado,
        ];
        
        Log::info('Generando PDF para Alpha', [
            'patente' => $datosVehiculo['patente'],
            'identificador' => $datosVehiculo['identificador'],
            'tiene_ubicacion' => !empty($datosVehiculo['fecha'])
        ]);
        
        // 🔥 GENERAR PDF - ESTO FALTA
        $pdf = Pdf::loadView('pdf.certificado-vehiculo', $viewData)
            ->setPaper('A4')
            ->setOptions([
                'defaultFont' => 'sans-serif',
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'chroot' => public_path(),
            ]);
        
        $nombreArchivo = 'Certificado_' . ($datosVehiculo['patente'] ?? $vehiculoData['identificador']) . '_' . now()->format('Ymd') . '.pdf';
        $nombreArchivo = preg_replace('/[^a-zA-Z0-9_.-]/', '_', $nombreArchivo);
        
        Log::info('PDF Alpha generado', ['archivo' => $nombreArchivo]);
        
        // Log de éxito
        $this->logService->logCertificado(
            self::PLATAFORMA_ALPHA,
            $usuario,
            $vehiculoId,
            request(),
            true
        );
        
        return $pdf->download($nombreArchivo);
        
    } catch (\Exception $e) {
        $this->logService->logCertificado(
            self::PLATAFORMA_ALPHA,
            Session::get('alpha_usuario'),
            $vehiculoId,
            request(),
            false,
            $e->getMessage()
        );
        
        Log::error('Error generando certificado Alpha externo:', [
            'vehiculo_id' => $vehiculoId,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        
        return back()->withErrors(['error' => 'Error al generar certificado: ' . $e->getMessage()]);
    }
}

    /**
     * Generar certificado de flota para una empresa
     */
    public function generarCertificadoFlota($empresaId)
    {
        try {
            $empresa = Empresa::with([
                'adminEmpresa',
                'adminEmpresa.vehiculosImportados',
                'adminEmpresa.vehiculosImportados.accesorios'
            ])->where('id', $empresaId)
              ->whereNull('deleted_at')
              ->firstOrFail();
            
            $vehiculos = [];
            if ($empresa->adminEmpresa && $empresa->adminEmpresa->vehiculosImportados) {
                $vehiculos = $empresa->adminEmpresa->vehiculosImportados
                    ->filter(function($v) {
                        return !empty($v->avl_patente);
                    })
                    ->map(function($v) {
                        return [
                            'patente' => $v->avl_patente,
                        ];
                    })
                    ->sortBy('patente')
                    ->values()
                    ->toArray();
            }
            
            $fecha = now()->format('d \d\e F \d\e Y');
            $fecha = str_replace(
                ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'],
                ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'],
                $fecha
            );
            
            $viewData = [
                'empresa' => $empresa->toArray(),
                'vehiculos' => $vehiculos,
                'fecha' => $fecha
            ];
            
            $pdf = Pdf::loadView('pdf.certificado-flota', $viewData)
                ->setPaper('A4')
                ->setOptions([
                    'defaultFont' => 'sans-serif',
                    'isHtml5ParserEnabled' => true,
                    'isRemoteEnabled' => true,
                    'chroot' => public_path(),
                ]);
            
            $nombreArchivo = 'Certificado_Flota_' . 
                            ($empresa->nombre_fantasia ?: $empresa->razon_social) . '_' . 
                            now()->format('Ymd') . '.pdf';
            $nombreArchivo = preg_replace('/[^a-zA-Z0-9_.-]/', '_', $nombreArchivo);
            
            // Log de certificado de flota
            $plataforma = Session::get('plataforma');
            $usuario = Session::get($plataforma . '_usuario');
            $this->logService->logCertificadoFlota(
                $plataforma,
                $usuario,
                $empresaId,
                request(),
                true
            );
            
            return $pdf->download($nombreArchivo);
            
        } catch (\Exception $e) {
            $plataforma = Session::get('plataforma');
            $usuario = Session::get($plataforma . '_usuario');
            $this->logService->logCertificadoFlota(
                $plataforma,
                $usuario,
                $empresaId,
                request(),
                false,
                $e->getMessage()
            );
            
            Log::error('Error generando certificado de flota externo:', [
                'empresa_id' => $empresaId,
                'error' => $e->getMessage()
            ]);
            
            return back()->withErrors(['error' => 'Error al generar certificado de flota']);
        }
    }

    

    /**
     * Cerrar sesión
     */
    public function logout()
    {
        Session::forget([
            'plataforma', 
            'delta_usuario', 
            'delta_password', 
            'delta_vehiculos',
            'delta_datos_raw',
            'alpha_usuario', 
            'alpha_password', 
            'alpha_tipo', 
            'alpha_moviles'
        ]);
        return redirect()->route('cuentas.moviles');
    }
}