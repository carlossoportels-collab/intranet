<?php
// app/Services/Externo/ExternoLogService.php

namespace App\Services\Externo;

use App\Models\ExternoActivityLog;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ExternoLogService
{
    /**
     * Registrar actividad externa
     */
    public function log(string $plataforma, string $accion, string $usuario = null, 
                        int $status = null, string $mensaje = null, array $metadata = [], 
                        Request $request = null, string $tipoConsulta = null)
    {
        try {
            $data = [
                'plataforma' => $plataforma,
                'usuario' => $usuario,
                'tipo_consulta' => $tipoConsulta,
                'accion' => $accion,
                'status' => $status,
                'mensaje' => $mensaje,
                'metadata' => $metadata,
            ];
            
            if ($request) {
                $data['ip'] = $request->ip();
                $data['user_agent'] = $request->userAgent();
            }
            
            // Guardar en base de datos
            ExternoActivityLog::create($data);
            
            // También log en archivo para monitoreo
            Log::channel('external')->info("{$plataforma} - {$accion}", [
                'usuario' => $usuario,
                'status' => $status,
                'mensaje' => $mensaje
            ]);
            
        } catch (\Exception $e) {
            // Si falla el guardado, al menos loguear en archivo
            Log::error('Error guardando log externo', [
                'error' => $e->getMessage(),
                'data' => $data ?? []
            ]);
        }
    }
    
    /**
     * Registrar login exitoso
     */
    public function logLoginExitoso(string $plataforma, string $usuario, Request $request, string $tipoConsulta = null)
    {
        $this->log(
            $plataforma, 
            'login', 
            $usuario, 
            200, 
            'Login exitoso',
            ['tipo_consulta' => $tipoConsulta],
            $request,
            $tipoConsulta
        );
    }
    
    /**
     * Registrar login fallido
     */
    public function logLoginFallido(string $plataforma, string $usuario, Request $request, string $error, string $tipoConsulta = null)
    {
        $this->log(
            $plataforma, 
            'login', 
            $usuario, 
            401, 
            $error,
            ['tipo_consulta' => $tipoConsulta],
            $request,
            $tipoConsulta
        );
    }
    
    /**
     * Registrar generación de certificado
     */
    public function logCertificado(string $plataforma, string $usuario, string $vehiculoId, Request $request, bool $exito = true, string $error = null)
    {
        $this->log(
            $plataforma, 
            'certificado', 
            $usuario, 
            $exito ? 200 : 500,
            $exito ? 'Certificado generado' : $error,
            ['vehiculo_id' => $vehiculoId],
            $request
        );
    }
    
    /**
     * Registrar certificado de flota
     */
    public function logCertificadoFlota(string $plataforma, string $usuario, string $empresaId, Request $request, bool $exito = true, string $error = null)
    {
        $this->log(
            $plataforma, 
            'certificado_flota', 
            $usuario, 
            $exito ? 200 : 500,
            $exito ? 'Certificado de flota generado' : $error,
            ['empresa_id' => $empresaId],
            $request
        );
    }
    
    /**
     * Registrar error de API externa
     */
    public function logErrorApi(string $plataforma, string $usuario, string $metodo, string $error, Request $request = null, array $extra = [])
    {
        $this->log(
            $plataforma, 
            'api_error', 
            $usuario, 
            500,
            "Error en {$metodo}: {$error}",
            $extra,
            $request
        );
    }
}