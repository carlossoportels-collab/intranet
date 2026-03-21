<?php
// app/Services/Externo/AlphaService.php

namespace App\Services\Externo;

use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class AlphaService
{
    protected $wsdl;
    protected $pass;

    public function __construct()
    {
        $this->wsdl = config('services.alpha.wsdl', 'http://190.64.141.171:8009/wcAdmin/services/ServiceDataBykom?wsdl');
        $this->pass = config('services.alpha.pass', '1234');
        
        Log::info('AlphaService inicializado', [
            'wsdl' => $this->wsdl
        ]);
    }

    /**
     * Consultar última posición por patente usando HTTP POST con XML
     */
    public function consultarUltimaPosicionPatente(string $patente, string $codigoAlfa)
    {
        try {
            // Construir el XML SOAP manualmente
            $xml = <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.wc.web.com.ar">
   <soapenv:Header/>
   <soapenv:Body>
      <ws:consultarUltimaPosicionPatente>
         <user>{$codigoAlfa}</user>
         <pass>{$this->pass}</pass>
         <tipo>2</tipo>
         <patente>{$patente}</patente>
      </ws:consultarUltimaPosicionPatente>
   </soapenv:Body>
</soapenv:Envelope>
XML;
            
            Log::info('AlphaService - Enviando petición SOAP', [
                'patente' => $patente,
                'codigoAlfa' => $codigoAlfa,
                'xml_length' => strlen($xml)
            ]);
            
            $response = Http::timeout(15)
                ->withHeaders([
                    'Content-Type' => 'text/xml; charset=utf-8',
                    'SOAPAction' => ''
                ])
                ->send('POST', $this->wsdl, [
                    'body' => $xml
                ]);
            
            Log::info('AlphaService - Respuesta recibida', [
                'status' => $response->status(),
                'body_preview' => substr($response->body(), 0, 500)
            ]);
            
            if ($response->successful()) {
                return $this->parsearRespuestaXML($response->body());
            }
            
            Log::error('AlphaService - Error en respuesta', [
                'status' => $response->status(),
                'body' => $response->body()
            ]);
            
            return null;
            
        } catch (\Exception $e) {
            Log::error('AlphaService - Error general', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return null;
        }
    }
    
/**
 * Parsear respuesta XML a formato estándar
 */
protected function parsearRespuestaXML(string $xml): ?array
{
    try {
        // Cargar XML
        $dom = new \DOMDocument();
        $dom->loadXML($xml);
        
        // Buscar nodos sin namespace primero (más simple)
        $fecha = null;
        $latitud = null;
        $longitud = null;
        
        // Buscar por nombre de etiqueta directamente
        $fechaNode = $dom->getElementsByTagName('fechaMensaje')->item(0);
        $latNode = $dom->getElementsByTagName('latitud')->item(0);
        $lngNode = $dom->getElementsByTagName('longitud')->item(0);
        
        if ($fechaNode) {
            $fecha = $fechaNode->nodeValue;
        }
        if ($latNode) {
            $latitud = $latNode->nodeValue;
        }
        if ($lngNode) {
            $longitud = $lngNode->nodeValue;
        }
        
        // Si no encontró, intentar con XPath y namespace
        if (!$fecha || !$latitud || !$longitud) {
            $xpath = new \DOMXPath($dom);
            
            // Registrar el namespace de la respuesta
            $xpath->registerNamespace('ax21', 'http://response.bean.ws.wc.web.com.ar/xsd');
            
            if (!$fecha) {
                $node = $xpath->query('//ax21:fechaMensaje')->item(0);
                $fecha = $node ? $node->nodeValue : null;
            }
            if (!$latitud) {
                $node = $xpath->query('//ax21:latitud')->item(0);
                $latitud = $node ? $node->nodeValue : null;
            }
            if (!$longitud) {
                $node = $xpath->query('//ax21:longitud')->item(0);
                $longitud = $node ? $node->nodeValue : null;
            }
        }
        
        // También podemos obtener la aproximación (dirección)
        $aproximacion = null;
        $aproxNode = $dom->getElementsByTagName('aproximacion')->item(0);
        if ($aproxNode) {
            $aproximacion = $aproxNode->nodeValue;
        } else {
            $xpath = new \DOMXPath($dom);
            $xpath->registerNamespace('ax21', 'http://response.bean.ws.wc.web.com.ar/xsd');
            $node = $xpath->query('//ax21:aproximacion')->item(0);
            $aproximacion = $node ? $node->nodeValue : null;
        }
        
        $resultado = [
            'fecha' => $fecha,
            'latitud' => $latitud,
            'longitud' => $longitud,
            'aproximacion' => $aproximacion,
            'velocidad' => $this->getXmlValue($dom, 'velocidad'),
            'estado' => $this->getXmlValue($dom, 'estado'),
            'satelites' => $this->getXmlValue($dom, 'satelites'),
            'alimentacion' => $this->getXmlValue($dom, 'alimentacion'),
            'odometro' => $this->getXmlValue($dom, 'odometro_total'),
            'raw_xml' => $xml
        ];
        
        Log::info('AlphaService - XML parseado', [
            'fecha' => $resultado['fecha'],
            'latitud' => $resultado['latitud'],
            'longitud' => $resultado['longitud'],
            'aproximacion' => $resultado['aproximacion'],
            'velocidad' => $resultado['velocidad']
        ]);
        
        return $resultado;
        
    } catch (\Exception $e) {
        Log::error('AlphaService - Error parseando XML', [
            'error' => $e->getMessage(),
            'xml_preview' => substr($xml, 0, 500)
        ]);
        return null;
    }
}

/**
 * Helper para obtener valor de un nodo XML
 */
private function getXmlValue($dom, string $tagName): ?string
{
    $node = $dom->getElementsByTagName($tagName)->item(0);
    if ($node) {
        return $node->nodeValue;
    }
    
    // Intentar con XPath si no se encuentra
    $xpath = new \DOMXPath($dom);
    $xpath->registerNamespace('ax21', 'http://response.bean.ws.wc.web.com.ar/xsd');
    $node = $xpath->query("//ax21:{$tagName}")->item(0);
    
    return $node ? $node->nodeValue : null;
}
    /**
 * Consultar moviles por flota
 */
public function consultarMovilesFlota(string $user, string $pass): ?array
{
    $xml = <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.wc.web.com.ar">
   <soapenv:Header/>
   <soapenv:Body>
      <ws:consultarMovilesFlota>
         <user>{$user}</user>
         <pass>{$pass}</pass>
      </ws:consultarMovilesFlota>
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
 * Consultar moviles por usuario/alias
 */
public function consultarMovilesUsuario(string $user, string $pass, int $tipo = 4): ?array
{
    $xml = <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.wc.web.com.ar">
   <soapenv:Header/>
   <soapenv:Body>
      <ws:consultarMovilesUsuario>
         <user>{$user}</user>
         <pass>{$pass}</pass>
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
 * Consultar posiciones de varios moviles
 */
public function consultarPosicionesMoviles(string $user, string $pass, array $movilIds): ?array
{
    $movilIdStr = implode(',', $movilIds);
    
    $xml = <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.wc.web.com.ar">
   <soapenv:Header/>
   <soapenv:Body>
      <ws:consultarPosicionesMoviles>
         <user>{$user}</user>
         <pass>{$pass}</pass>
         <movilId>{$movilIdStr}</movilId>
      </ws:consultarPosicionesMoviles>
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
 * Consultar posición de un movil (flota)
 */
public function consultarPosicionMovilFlota(string $user, string $pass, string $movilId): ?array
{
    $xml = <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.wc.web.com.ar">
   <soapenv:Header/>
   <soapenv:Body>
      <ws:consultarPosicionesMoviles>
         <user>{$user}</user>
         <pass>{$pass}</pass>
         <movilId>{$movilId}</movilId>
      </ws:consultarPosicionesMoviles>
   </soapenv:Body>
</soapenv:Envelope>
XML;

    $response = $this->enviarRequest($xml);
    
    if ($response) {
        $posiciones = $this->parsearPosiciones($response);
        return $posiciones[0] ?? null;
    }
    
    return null;
}

/**
 * Consultar posición de un movil (usuario)
 */
public function consultarPosicionMovilUsuario(string $user, string $pass, string $movilId, int $tipo = 4): ?array
{
    $xml = <<<XML
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ws="http://ws.wc.web.com.ar">
   <soapenv:Header/>
   <soapenv:Body>
      <ws:consultarPosicionesMovilesUsuario>
         <user>{$user}</user>
         <pass>{$pass}</pass>
         <tipo>{$tipo}</tipo>
         <movilId>{$movilId}</movilId>
      </ws:consultarPosicionesMovilesUsuario>
   </soapenv:Body>
</soapenv:Envelope>
XML;

    $response = $this->enviarRequest($xml);
    
    if ($response) {
        $posiciones = $this->parsearPosiciones($response);
        return $posiciones[0] ?? null;
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
            return $response->body();
        }
        
        Log::error('AlphaService - Error en respuesta', [
            'status' => $response->status(),
            'body' => $response->body()
        ]);
        
        return null;
        
    } catch (\Exception $e) {
        Log::error('AlphaService - Error enviando request', [
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
        
        $movilNodes = $xpath->query('//ax21:movil');
        
        foreach ($movilNodes as $node) {
            $movilId = $xpath->query('.//ax21:movilId', $node)->item(0);
            $patente = $xpath->query('.//ax21:patente', $node)->item(0);
            $descripcion = $xpath->query('.//ax21:descripcion', $node)->item(0);
            
            $moviles[] = [
                'id' => $movilId ? $movilId->nodeValue : null,
                'movilId' => $movilId ? $movilId->nodeValue : null,
                'patente' => $patente ? $patente->nodeValue : null,
                'descripcion' => $descripcion ? $descripcion->nodeValue : null,
            ];
        }
        
    } catch (\Exception $e) {
        Log::error('AlphaService - Error parseando moviles', [
            'error' => $e->getMessage()
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
        
        $posicionNodes = $xpath->query('//ax21:posicion');
        
        foreach ($posicionNodes as $node) {
            $movilId = $xpath->query('.//ax21:movilId', $node)->item(0);
            $fecha = $xpath->query('.//ax21:fechaMensaje', $node)->item(0);
            $latitud = $xpath->query('.//ax21:latitud', $node)->item(0);
            $longitud = $xpath->query('.//ax21:longitud', $node)->item(0);
            $aproximacion = $xpath->query('.//ax21:aproximacion', $node)->item(0);
            $velocidad = $xpath->query('.//ax21:velocidad', $node)->item(0);
            
            $posiciones[] = [
                'movilId' => $movilId ? $movilId->nodeValue : null,
                'fecha' => $fecha ? $fecha->nodeValue : null,
                'latitud' => $latitud ? $latitud->nodeValue : null,
                'longitud' => $longitud ? $longitud->nodeValue : null,
                'direccion' => $aproximacion ? $aproximacion->nodeValue : null,
                'velocidad' => $velocidad ? $velocidad->nodeValue : null,
            ];
        }
        
    } catch (\Exception $e) {
        Log::error('AlphaService - Error parseando posiciones', [
            'error' => $e->getMessage()
        ]);
    }
    
    return $posiciones;
}

}