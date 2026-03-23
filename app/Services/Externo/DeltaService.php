<?php
// app/Services/Externo/DeltaService.php

namespace App\Services\Externo;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class DeltaService
{
    protected $user;
    protected $pass;
    protected $url;

    public function __construct()
    {
        $this->user = config('services.delta.user');
        $this->pass = config('services.delta.pass');
        $this->url = config('services.delta.url');
        
        Log::info('DeltaService inicializado', [
            'url' => $this->url,
            'user' => $this->user,
            'pass_set' => !empty($this->pass)
        ]);
    }


    /**
     * Obtener datos actuales de vehículos
     */
    public function getDatosActuales(array $vehiculos, string $tipoId = 'patente')
    {
        // Si el tipo es patente, normalizar las patentes
        $vehiculosNormalizados = $vehiculos;
        if ($tipoId === 'patente') {
            $vehiculosNormalizados = $this->normalizarPatentes($vehiculos);
            Log::info('DeltaService - Patentes normalizadas', [
                'originales' => $vehiculos,
                'normalizadas' => $vehiculosNormalizados
            ]);
        }
        
        $payload = [
            'user' => $this->user,
            'pwd' => $this->pass,
            'action' => 'DATOSACTUALES',
            'vehiculos' => $vehiculosNormalizados,
            'TipoID' => $tipoId,
            'output' => ['la', 'lo', 'fc']
        ];

        Log::info('DeltaService - Consultando API', [
            'tipo_id' => $tipoId,
            'cantidad_vehiculos' => count($vehiculos),
            'primer_vehiculo' => $vehiculos[0] ?? null,
            'normalizado' => $vehiculosNormalizados[0] ?? null
        ]);

        return $this->consultar($payload);
    }

    /**
     * Obtener datos por patente
     */
    public function porPatente(array $patentes)
    {
        Log::info('DeltaService - Buscando por patente', ['patentes' => $patentes]);
        return $this->getDatosActuales($patentes, 'patente');
    }

    /**
     * Obtener datos por nombre de empresa
     */
    public function porNombre(array $patentes, string $nombreEmpresa)
    {
        Log::info('DeltaService - Buscando por nombre', [
            'nombre' => $nombreEmpresa,
            'patentes' => $patentes
        ]);
        return $this->getDatosActuales($patentes, 'nombre');
    }

    /**
     * Consulta genérica a la API
     */
    protected function consultar(array $data)
    {
        try {
            Log::info('DeltaService - Enviando request', ['payload' => $data]);

            $response = Http::timeout(15)
                ->withHeaders([
                    'Content-Type' => 'application/json',
                    'Accept' => 'application/json',
                ])
                ->post($this->url, $data);

            Log::info('DeltaService - Respuesta recibida', [
                'status' => $response->status(),
                'body_preview' => substr($response->body(), 0, 500)
            ]);

            if ($response->successful()) {
                $json = $response->json();
                
                if (isset($json['status']) && $json['status'] === 'rechazado') {
                    Log::error('DeltaService - API rechazó la petición', [
                        'mensaje' => $json['mensajeError'] ?? 'Error desconocido'
                    ]);
                    return null;
                }
                
                Log::info('DeltaService - Respuesta exitosa', [
                    'cantidad_resultados' => is_array($json) ? count($json) : 0
                ]);
                return $json;
            }

            Log::error('DeltaService - Error en API', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);

            return null;

        } catch (\Exception $e) {
            Log::error('DeltaService - Excepción', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return null;
        }
    }

/**
 * Formatear respuesta de ubicación para el certificado
 */
public function formatearUbicacion(?array $data): ?array
{
    if (!$data || empty($data)) {
        return null;
    }

    $primerResultado = is_array($data) && isset($data[0]) ? $data[0] : $data;

    if (empty($primerResultado['fecha_comunicacion'])) {
        Log::warning('DeltaService - No hay fecha de comunicación en la respuesta');
        return null;
    }

    // Limpiar todos los strings de %20
    array_walk_recursive($primerResultado, function(&$item) {
        if (is_string($item)) {
            $item = str_replace('%20', ' ', $item);
        }
    });

    // Formatear fecha
    $fecha = $primerResultado['fecha_comunicacion'] ?? null;
    if ($fecha) {
        $fecha = preg_replace('/\.\d+$/', '', $fecha);
        try {
            $fechaObj = \Carbon\Carbon::parse($fecha);
            $fecha = $fechaObj->format('d/m/Y H:i:s');
        } catch (\Exception $e) {
            Log::warning('DeltaService - Error parseando fecha', ['fecha' => $fecha]);
        }
    }

    $latitud = $primerResultado['latitud'] ?? null;
    $longitud = $primerResultado['longitud'] ?? null;
    
    // Obtener dirección si tenemos coordenadas
    $direccion = null;
    $mapaUrl = null;
    if ($latitud && $longitud) {
        $direccion = $this->obtenerDireccionDesdeCoordenadas($latitud, $longitud);
        $mapaUrl = $this->generarMapaEstatico($latitud, $longitud);
    }

    $ubicacion = [
        'fecha' => $fecha,
        'latitud' => $latitud,
        'longitud' => $longitud,
        'direccion' => $direccion,
        'mapa_url' => $mapaUrl, // Siempre definido, aunque sea null
        'patente_api' => $primerResultado['patente'] ?? $primerResultado['nombre'] ?? null,
        'estado' => $primerResultado['estado_vehiculo'] ?? null,
        'detenido_desde' => $primerResultado['detenido_desde'] ?? null,
        'full' => $primerResultado
    ];

    Log::info('DeltaService - Ubicación formateada', $ubicacion);
    
    return $ubicacion;
}



public function obtenerDireccionDesdeCoordenadas($lat, $lng)
{
    $apiKey = config('services.geoapify.key');
    // Usamos el endpoint de Reverse Geocode
    $url = "https://api.geoapify.com/v1/geocode/reverse?lat={$lat}&lon={$lng}&apiKey={$apiKey}&lang=es";

    try {
        $response = Http::get($url);
        if ($response->successful()) {
            $data = $response->json();
            $properties = $data['features'][0]['properties'] ?? null;

            if ($properties) {
                // Construimos una dirección "humana"
                $calle = $properties['street'] ?? '';
                $altura = $properties['housenumber'] ?? '';
                $localidad = $properties['city'] ?? $properties['suburb'] ?? '';
                $provincia = $properties['state'] ?? '';

                // Si no hay calle, usamos el 'formatted' de Geoapify pero lo limpiamos
                if (!$calle) {
                    return $properties['formatted'];
                }

                return trim("{$calle} {$altura}, {$localidad}, {$provincia}");
            }
        }
    } catch (\Exception $e) {
        Log::error("Error en Geocoding: " . $e->getMessage());
    }

    return "Dirección no disponible";
}

    /**
     * Acortar dirección para que no sea demasiado larga
     */
    private function acortarDireccion($direccion)
    {
        $partes = explode(',', $direccion);
        
        if (count($partes) > 4) {
            return implode(',', array_slice($partes, 0, 4));
        }
        
        return $direccion;
    }

    /**
     * Determinar qué tipo de búsqueda usar según la empresa
     */
    public function detectarTipoBusqueda(string $nombreEmpresa): string
    {
        $empresasPorNombre = [
            'BUZZI TOMAS ORIEL',
            'J P MELO SRL',
            'SERVICIOS ELECTRICOS GENERALES BUENOS AIRES SA'
        ];

        $nombreNormalizado = trim(strtoupper($nombreEmpresa));
        
        foreach ($empresasPorNombre as $empresa) {
            if (str_contains($nombreNormalizado, $empresa) || 
                str_contains($empresa, $nombreNormalizado)) {
                Log::info('DeltaService - Empresa detectada para búsqueda por nombre', [
                    'empresa' => $nombreEmpresa
                ]);
                return 'nombre';
            }
        }

        return 'patente';
    }

    /**
     * Obtener plataforma del vehículo según sus abonos
     * Retorna 'delta' o 'alpha'
     */
    public function getPlataformaVehiculo($vehiculo): string
    {
        if (!$vehiculo->abonos || $vehiculo->abonos->isEmpty()) {
            return 'alpha'; // Por defecto alpha
        }

        foreach ($vehiculo->abonos as $abono) {
            $nombre = strtoupper($abono->abono_nombre ?? '');
            
            // Si tiene abonos Delta, usar DeltaService
            if (str_contains($nombre, 'DELTA') || 
                str_contains($nombre, 'CAROYA') || 
                str_contains($nombre, 'PLANIFY')) {
                return 'delta';
            }
        }

        return 'alpha';
    }

/**
 * Normalizar patente: eliminar espacios y convertir a mayúsculas
 */
private function normalizarPatente(string $patente): string
{
    // Eliminar todos los espacios
    $patente = preg_replace('/\s+/', '', $patente);
    // Convertir a mayúsculas
    $patente = strtoupper($patente);
    return $patente;
}

/**
 * Normalizar array de patentes
 */
private function normalizarPatentes(array $patentes): array
{
    return array_map(function($patente) {
        return $this->normalizarPatente($patente);
    }, $patentes);
}

/**
 * Generar imagen de mapa estático con timeout y fallback
 */
public function generarMapaEstatico($lat, $lng, $width = 400, $height = 220)
{
    if (!$lat || !$lng) return null;

    $apiKey = config('services.geoapify.key');
    
    $params = [
        'style' => 'osm-carto',
        'width' => $width,
        'height' => $height,
        'center' => "lonlat:{$lng},{$lat}",
        'zoom' => 14,
        'marker' => "lonlat:{$lng},{$lat};color:#ff6600;size:medium",
        'scale' => 2,
        'apiKey' => $apiKey
    ];
    
    $url = "https://maps.geoapify.com/v1/staticmap?" . http_build_query($params);

    try {
        // Reducir timeout a 5 segundos
        $response = Http::timeout(5)
            ->withOptions([
                'connect_timeout' => 3,
                'read_timeout' => 5,
            ])
            ->get($url);

        if ($response->successful()) {
            $base64 = base64_encode($response->body());
            $mime = $response->header('Content-Type');
            return "data:{$mime};base64,{$base64}";
        }
        
        Log::warning('Geoapify error', ['status' => $response->status()]);
        return null;
        
    } catch (\Exception $e) {
        Log::warning('Error generando mapa estático', [
            'error' => $e->getMessage(),
            'lat' => $lat,
            'lng' => $lng
        ]);
        return null;
    }
}
}