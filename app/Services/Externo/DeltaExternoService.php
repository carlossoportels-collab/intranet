<?php
// app/Services/Externo/DeltaExternoService.php

namespace App\Services\Externo;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Services\Externo\DeltaService;

class DeltaExternoService
{
    protected $url;
    protected $user;
    protected $pass;

    public function __construct(string $user, string $pass)
    {
        $this->user = $user;
        $this->pass = $pass;
        $this->url = config('services.delta.url', 'https://seguimiento2.localsat.com.ar/api/v2/api.jss');
        
        Log::info('DeltaExternoService inicializado', [
            'url' => $this->url,
            'user' => $this->user,
        ]);
    }

    /**
     * Obtener datos actuales de todos los vehículos del usuario
     */
    public function obtenerTodosLosVehiculos(): ?array
    {
        $payload = [
            'user' => $this->user,
            'pwd' => $this->pass,
            'action' => 'DATOSACTUALES'
        ];

        Log::info('DeltaExternoService - Consultando todos los vehículos', [
            'user' => $this->user
        ]);

        return $this->consultar($payload);
    }

    /**
     * Obtener datos de un vehículo específico por patente
     */
    public function obtenerVehiculoPorPatente(string $patente): ?array
    {
        $payload = [
            'user' => $this->user,
            'pwd' => $this->pass,
            'action' => 'DATOSACTUALES',
            'vehiculos' => [$patente],
            'TipoID' => 'patente'
        ];

        Log::info('DeltaExternoService - Consultando vehículo', [
            'patente' => $patente
        ]);

        return $this->consultar($payload);
    }

    /**
     * Obtener lista de empresas del usuario
     */
    public function obtenerEmpresas(): ?array
    {
        $payload = [
            'user' => $this->user,
            'pwd' => $this->pass,
            'action' => 'GETEMPRESAS'
        ];

        Log::info('DeltaExternoService - Consultando empresas', [
            'user' => $this->user
        ]);

        return $this->consultar($payload);
    }

    /**
     * Obtener vehículos de una empresa específica
     */
    public function obtenerVehiculosPorEmpresa(string $empresaId): ?array
    {
        $payload = [
            'user' => $this->user,
            'pwd' => $this->pass,
            'action' => 'DATOSACTUALES',
            'vehiculos' => [$empresaId],
            'TipoID' => 'empresa'
        ];

        Log::info('DeltaExternoService - Consultando vehículos por empresa', [
            'empresa_id' => $empresaId
        ]);

        return $this->consultar($payload);
    }

    /**
     * Consulta genérica a la API
     */
    protected function consultar(array $data)
    {
        try {
            Log::info('DeltaExternoService - Enviando request', ['payload' => $data]);

            $response = Http::timeout(15)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ])
                ->post($this->url, $data);

            Log::info('DeltaExternoService - Respuesta recibida', [
                'status' => $response->status(),
                'body_preview' => substr($response->body(), 0, 500)
            ]);

            if ($response->successful()) {
                $json = $response->json();
                
                if (is_array($json)) {
                    if (isset($json[0]['status']) && $json[0]['status'] === 'rechazado') {
                        Log::error('DeltaExternoService - API rechazó la petición', [
                            'mensaje' => $json[0]['mensajeError'] ?? 'Error desconocido'
                        ]);
                        return null;
                    }
                    
                    Log::info('DeltaExternoService - Respuesta exitosa', [
                        'cantidad_resultados' => count($json)
                    ]);
                    return $json;
                }
                
                if (isset($json['status']) && $json['status'] === 'rechazado') {
                    Log::error('DeltaExternoService - API rechazó la petición', [
                        'mensaje' => $json['mensajeError'] ?? 'Error desconocido'
                    ]);
                    return null;
                }
                
                return $json;
            }

            Log::error('DeltaExternoService - Error en API', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            return null;

        } catch (\Exception $e) {
            Log::error('DeltaExternoService - Excepción', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return null;
        }
    }

    /**
     * Formatear datos de vehículos para la lista (con empresa)
     */
    public function formatearVehiculosLista(array $vehiculosData, array $empresasData): array
    {
        $vehiculos = [];
        
        foreach ($vehiculosData as $item) {
            $patente = str_replace('%20', ' ', $item['patente'] ?? $item['nombre'] ?? '');
            $patenteLimpia = preg_replace('/[^A-Z0-9]/', '', strtoupper($patente));
            
            // Buscar en nuestra base de datos para obtener empresa local
            $vehiculoDB = \App\Models\AdminVehiculo::where('avl_patente', 'LIKE', "%{$patenteLimpia}%")
                ->orWhere('avl_patente', 'LIKE', "%{$patente}%")
                ->first();
            
            $empresaLocal = null;
            if ($vehiculoDB && $vehiculoDB->adminEmpresa && $vehiculoDB->adminEmpresa->empresaSistema) {
                $empresaSistema = $vehiculoDB->adminEmpresa->empresaSistema;
                $empresaLocal = [
                    'id' => $empresaSistema->id,
                    'nombre' => $empresaSistema->razon_social ?: $empresaSistema->nombre_fantasia,
                    'cuit' => $empresaSistema->cuit,
                ];
            }
            
            $vehiculos[] = [
                'id' => $item['nombre'] ?? $patente,
                'patente' => $patente,
                'alias' => $item['alias'] ?? null,
                'descripcion' => $item['alias'] ?? $item['nombre'] ?? null,
                'gps' => $item['gps'] ?? null,
                'empresa' => $empresaLocal, // Usar empresa de nuestra DB
                'ultima_posicion' => [
                    'latitud' => $item['latitud'] ?? null,
                    'longitud' => $item['longitud'] ?? null,
                    'fecha' => $item['fecha'] ?? null,
                    'velocidad' => $item['velocidad'] ?? null,
                ]
            ];
        }
        
        return $vehiculos;
    }

    /**
     * Formatear datos de un vehículo para el certificado
     */
    public function formatearVehiculoCertificado(array $data, ?array $empresa = null): array
    {
        $primerResultado = is_array($data) && isset($data[0]) ? $data[0] : $data;
        
        // Limpiar %20
        array_walk_recursive($primerResultado, function(&$item) {
            if (is_string($item)) {
                $item = str_replace('%20', ' ', $item);
            }
        });
        
        // Formatear fecha
        $fecha = $primerResultado['fecha'] ?? null;
        if ($fecha) {
            try {
                $fechaObj = \Carbon\Carbon::createFromFormat('d/m/Y H:i:s', $fecha);
                $fecha = $fechaObj->format('d/m/Y H:i:s');
            } catch (\Exception $e) {
                Log::warning('Error parseando fecha Delta externo', ['fecha' => $fecha]);
            }
        }
        
        $latitud = $primerResultado['latitud'] ?? null;
        $longitud = $primerResultado['longitud'] ?? null;
        
        // Obtener dirección y mapa
        $direccion = null;
        $mapaUrl = null;
        
        if ($latitud && $longitud) {
            $deltaService = app(DeltaService::class);
            $direccion = $deltaService->obtenerDireccionDesdeCoordenadas($latitud, $longitud);
            $mapaUrl = $deltaService->generarMapaEstatico($latitud, $longitud);
        }
        
        return [
            'patente' => $primerResultado['patente'] ?? $primerResultado['nombre'] ?? null,
            'alias' => $primerResultado['alias'] ?? null,
            'fecha' => $fecha,
            'latitud' => $latitud,
            'longitud' => $longitud,
            'direccion' => $direccion,
            'mapa_url' => $mapaUrl,
            'velocidad' => $primerResultado['velocidad'] ?? null,
            'sentido' => $primerResultado['sentido'] ?? null,
            'evento' => $primerResultado['evento'] ?? null,
            'empresa' => $empresa
        ];
    }
}