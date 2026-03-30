<?php
// app/Services/Externo/AlphaExternoService.php

namespace App\Services\Externo;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use App\Services\Externo\DeltaService;

class AlphaExternoService
{
    protected $wsdl;
    protected $user;
    protected $pass;

    public function __construct(string $user, string $pass)
    {
        $this->user = $user;
        $this->pass = $pass;
        $this->wsdl = config('services.alpha.wsdl', 'http://190.64.141.171:8009/wcAdmin/services/ServiceDataBykom?wsdl');
        
        Log::info('AlphaExternoService inicializado', [
            'wsdl' => $this->wsdl,
            'user' => $this->user,
        ]);
    }

    /**
     * Obtener prefijo de una patente desde la base de datos
     */
    private function obtenerPrefijoPorPatente(string $patente): ?string
    {
        try {
            $vehiculo = \App\Models\AdminVehiculo::where('avl_patente', $patente)
                ->orWhere('avl_patente', 'LIKE', "%{$patente}%")
                ->first();
            
            if ($vehiculo && !empty($vehiculo->prefijo_codigo)) {
                Log::info('Prefijo encontrado para patente', [
                    'patente' => $patente,
                    'prefijo_codigo' => $vehiculo->prefijo_codigo
                ]);
                return $vehiculo->prefijo_codigo;
            }
            
            Log::info('No se encontró prefijo para patente', ['patente' => $patente]);
            return null;
        } catch (\Exception $e) {
            Log::error('Error obteniendo prefijo por patente', [
                'patente' => $patente,
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Obtener logo según prefijo
     */
    public function obtenerLogoPorPrefijo(?string $prefijo): string
    {
        // Si el prefijo es SS (SMARTSAT), usar logosmart.png
        if ($prefijo === 'SS') {
            return 'images/logos/logosmart.png';
        }
        // Por defecto, usar logo.png (LOCALSAT)
        return 'images/logos/logo.png';
    }

    /**
     * PASO 1: Consultar moviles por tipo
     * tipo 3 = flota, tipo 4 = alias
     */
    public function consultarMoviles(int $tipo): ?array
    {
        $xml = <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.wc.web.com.ar">
   <soapenv:Header/>
   <soapenv:Body>
      <ws:consultarMovilesUsuario>
         <user>{$this->user}</user>
         <pass>{$this->pass}</pass>
         <tipo>{$tipo}</tipo>
      </ws:consultarMovilesUsuario>
   </soapenv:Body>
</soapenv:Envelope>
XML;

        $response = $this->enviarRequest($xml);
        
        if ($response) {
            return $this->parsearMoviles($response);
        }
        
        return null;
    }

    /**
     * PASO 2: Consultar posiciones de moviles
     */
    public function consultarPosiciones(array $movilIds, int $tipo): ?array
    {
        $movilIdStr = implode(',', $movilIds);
        
        $xml = <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.wc.web.com.ar">
   <soapenv:Header/>
   <soapenv:Body>
      <ws:consultarPosicionesMovilesUsuario>
         <user>{$this->user}</user>
         <pass>{$this->pass}</pass>
         <tipo>{$tipo}</tipo>
         <movilId>{$movilIdStr}</movilId>
      </ws:consultarPosicionesMovilesUsuario>
   </soapenv:Body>
</soapenv:Envelope>
XML;

        $response = $this->enviarRequest($xml);
        
        if ($response) {
            return $this->parsearPosiciones($response);
        }
        
        return null;
    }

    /**
     * Enviar request SOAP
     */
    protected function enviarRequest(string $xml): ?string
    {
        try {
            $response = Http::timeout(15)
                ->withHeaders([
                    'Content-Type' => 'text/xml; charset=utf-8',
                    'SOAPAction' => ''
                ])
                ->send('POST', $this->wsdl, [
                    'body' => $xml
                ]);
            
            if ($response->successful()) {
                Log::info('AlphaExternoService - Request exitoso', [
                    'status' => $response->status(),
                    'body_length' => strlen($response->body())
                ]);
                return $response->body();
            }
            
            Log::error('AlphaExternoService - Error en respuesta', [
                'status' => $response->status(),
                'body' => substr($response->body(), 0, 500)
            ]);
            
            return null;
            
        } catch (\Exception $e) {
            Log::error('AlphaExternoService - Error enviando request', [
                'error' => $e->getMessage()
            ]);
            return null;
        }
    }

    /**
     * Parsear respuesta de moviles
     */
    protected function parsearMoviles(string $xml): array
    {
        $moviles = [];
        
        try {
            $dom = new \DOMDocument();
            $dom->loadXML($xml);
            
            $xpath = new \DOMXPath($dom);
            $xpath->registerNamespace('ax21', 'http://response.bean.ws.wc.web.com.ar/xsd');
            $xpath->registerNamespace('ns', 'http://ws.wc.web.com.ar');
            
            $returnNodes = $xpath->query('//ns:return');
            
            if ($returnNodes->length == 0) {
                $returnNodes = $xpath->query('//return');
            }
            
            if ($returnNodes->length == 0) {
                $returnNodes = $xpath->query('//*[local-name()="return"]');
            }
            
            Log::info('AlphaExternoService - Nodos return encontrados', ['cantidad' => $returnNodes->length]);
            
            foreach ($returnNodes as $node) {
                $movilId = $xpath->query('.//ax21:movilId', $node)->item(0);
                $identificador = $xpath->query('.//ax21:identificador', $node)->item(0);
                $patente = $xpath->query('.//ax21:patente', $node)->item(0);
                
                if (!$movilId) {
                    $movilId = $xpath->query('.//movilId', $node)->item(0);
                }
                if (!$identificador) {
                    $identificador = $xpath->query('.//identificador', $node)->item(0);
                }
                if (!$patente) {
                    $patente = $xpath->query('.//patente', $node)->item(0);
                }
                
                if ($movilId && $identificador) {
                    $patenteValue = $patente ? trim($patente->nodeValue) : null;
                    
                    // 🔥 OBTENER PREFIJO DESDE LA BASE DE DATOS
                    $prefijo = $patenteValue ? $this->obtenerPrefijoPorPatente($patenteValue) : null;
                    
                    $moviles[] = [
                        'movilId' => trim($movilId->nodeValue),
                        'identificador' => trim($identificador->nodeValue),
                        'patente' => $patenteValue,
                        'prefijo' => $prefijo, // 🔥 Agregar prefijo
                    ];
                }
            }
            
            Log::info('AlphaExternoService - Moviles parseados', ['cantidad' => count($moviles)]);
            
        } catch (\Exception $e) {
            Log::error('AlphaExternoService - Error parseando moviles', [
                'error' => $e->getMessage(),
                'xml_preview' => substr($xml, 0, 1000)
            ]);
        }
        
        return $moviles;
    }

    /**
     * Parsear respuesta de posiciones
     */
    protected function parsearPosiciones(string $xml): array
    {
        $posiciones = [];
        
        try {
            $dom = new \DOMDocument();
            $dom->loadXML($xml);
            
            $xpath = new \DOMXPath($dom);
            $xpath->registerNamespace('ax21', 'http://response.bean.ws.wc.web.com.ar/xsd');
            $xpath->registerNamespace('ns', 'http://ws.wc.web.com.ar');
            
            $returnNodes = $xpath->query('//ns:return');
            
            if ($returnNodes->length == 0) {
                $returnNodes = $xpath->query('//*[local-name()="return"]');
            }
            
            Log::info('AlphaExternoService - Nodos posicion encontrados', ['cantidad' => $returnNodes->length]);
            
            foreach ($returnNodes as $node) {
                $movilId = $xpath->query('.//ax21:movilId', $node)->item(0);
                $fecha = $xpath->query('.//ax21:fechaMensaje', $node)->item(0);
                $latitud = $xpath->query('.//ax21:latitud', $node)->item(0);
                $longitud = $xpath->query('.//ax21:longitud', $node)->item(0);
                $aproximacion = $xpath->query('.//ax21:aproximacion', $node)->item(0);
                $velocidad = $xpath->query('.//ax21:velocidad', $node)->item(0);
                
                if (!$movilId) {
                    $movilId = $xpath->query('.//movilId', $node)->item(0);
                }
                if (!$fecha) {
                    $fecha = $xpath->query('.//fechaMensaje', $node)->item(0);
                }
                if (!$latitud) {
                    $latitud = $xpath->query('.//latitud', $node)->item(0);
                }
                if (!$longitud) {
                    $longitud = $xpath->query('.//longitud', $node)->item(0);
                }
                if (!$aproximacion) {
                    $aproximacion = $xpath->query('.//aproximacion', $node)->item(0);
                }
                
                if ($movilId && $fecha) {
                    $posiciones[] = [
                        'movilId' => trim($movilId->nodeValue),
                        'fecha' => trim($fecha->nodeValue),
                        'latitud' => $latitud ? trim($latitud->nodeValue) : null,
                        'longitud' => $longitud ? trim($longitud->nodeValue) : null,
                        'direccion' => $aproximacion ? trim($aproximacion->nodeValue) : null,
                        'velocidad' => $velocidad ? trim($velocidad->nodeValue) : null,
                    ];
                }
            }
            
            Log::info('AlphaExternoService - Posiciones parseadas', ['cantidad' => count($posiciones)]);
            
        } catch (\Exception $e) {
            Log::error('AlphaExternoService - Error parseando posiciones', [
                'error' => $e->getMessage(),
                'xml_preview' => substr($xml, 0, 1000)
            ]);
        }
        
        return $posiciones;
    }

    /**
     * Formatear datos de vehículos para la lista
     */
    public function formatearVehiculosLista(array $moviles): array
    {
        $vehiculos = [];
        
        foreach ($moviles as $movil) {
            $patente = $movil['patente'] ?? null;
            $patenteLimpia = $patente ? preg_replace('/[^A-Z0-9]/', '', strtoupper($patente)) : null;
            
            $vehiculoDB = null;
            if ($patenteLimpia) {
                $vehiculoDB = \App\Models\AdminVehiculo::where('avl_patente', 'LIKE', "%{$patenteLimpia}%")
                    ->orWhere('avl_patente', 'LIKE', "%{$patente}%")
                    ->first();
            }
            
            $empresaLocal = null;
            if ($vehiculoDB && $vehiculoDB->adminEmpresa && $vehiculoDB->adminEmpresa->empresaSistema) {
                $empresaSistema = $vehiculoDB->adminEmpresa->empresaSistema;
                $empresaLocal = [
                    'id' => $empresaSistema->id,
                    'nombre' => $empresaSistema->razon_social ?: $empresaSistema->nombre_fantasia,
                    'cuit' => $empresaSistema->cuit,
                ];
            }
            
            // 🔥 Usar el prefijo obtenido de la DB o el que vino en el movil
            $prefijo = $movil['prefijo'] ?? ($vehiculoDB->prefijo_codigo ?? null);
            
            $vehiculos[] = [
                'id' => $movil['movilId'],
                'movilId' => $movil['movilId'],
                'identificador' => $movil['identificador'],
                'patente' => $movil['patente'],
                'prefijo' => $prefijo,
                'empresa' => $empresaLocal,
            ];
        }
        
        return $vehiculos;
    }

    /**
     * Formatear datos de un vehículo para el certificado
     */
    public function formatearVehiculoCertificado(array $posicion, ?array $vehiculoData = null): array
    {
        // Limpiar fecha
        $fecha = $posicion['fecha'] ?? null;
        if ($fecha) {
            try {
                $fechaObj = \Carbon\Carbon::createFromFormat('d/m/Y H:i:s', $fecha);
                $fecha = $fechaObj->format('d/m/Y H:i:s');
            } catch (\Exception $e) {
                Log::warning('Error parseando fecha Alpha', ['fecha' => $fecha]);
            }
        }
        
        $latitud = $posicion['latitud'] ?? null;
        $longitud = $posicion['longitud'] ?? null;
        
        // Obtener dirección y mapa
        $direccion = $posicion['direccion'] ?? null;
        $mapaUrl = null;
        
        if ($latitud && $longitud) {
            $deltaService = app(DeltaService::class);
            if (!$direccion) {
                $direccion = $deltaService->obtenerDireccionDesdeCoordenadas($latitud, $longitud);
            }
            $mapaUrl = $deltaService->generarMapaEstatico($latitud, $longitud);
        }
        
        return [
            'patente' => $vehiculoData['patente'] ?? null,
            'identificador' => $vehiculoData['identificador'] ?? null,
            'movilId' => $posicion['movilId'] ?? $vehiculoData['movilId'] ?? null,
            'prefijo' => $vehiculoData['prefijo'] ?? null,
            'fecha' => $fecha,
            'latitud' => $latitud,
            'longitud' => $longitud,
            'direccion' => $direccion,
            'mapa_url' => $mapaUrl,
            'velocidad' => $posicion['velocidad'] ?? null,
        ];
    }
}