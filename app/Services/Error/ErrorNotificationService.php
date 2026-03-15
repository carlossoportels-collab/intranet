<?php
// app/Services/Error/ErrorNotificationService.php

namespace App\Services\Error;

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Carbon\Carbon;
use Throwable;

class ErrorNotificationService
{
    /**
     * Usuario administrador que recibe alertas (ID 2)
     */
    const ADMIN_USER_ID = 2;

    /**
     * Enviar notificación por error 500 (versión simplificada)
     */
    public function notifyError500(Throwable $exception, $request = null)
    {
        $titulo = '🔥 Error 500';
        
        // Información básica siempre visible
        $infoBasica = sprintf(
            "URL: %s\nMétodo: %s\nIP: %s\n",
            $request ? $request->fullUrl() : 'CLI',
            $request ? $request->method() : 'N/A',
            $request ? $request->ip() : 'N/A'
        );

        // Mensaje de error (primera línea)
        $mensajeError = $exception->getMessage();
        $primerasPalabras = explode("\n", $mensajeError)[0];
        
        // Ubicación del error (archivo:línea)
        $ubicacion = sprintf(
            "%s:%d",
            basename($exception->getFile()),
            $exception->getLine()
        );

        // Stack trace resumido (solo primeras 3 líneas)
        $traceResumido = $this->getResumenStackTrace($exception->getTraceAsString(), 3);

        $mensaje = sprintf(
            "📍 %s\n\n%s🔍 Error: %s\n📁 %s\n\n📋 Trace:\n%s",
            $infoBasica,
            $request && $request->user() ? "👤 Usuario: {$request->user()->nombre_usuario} (ID: {$request->user()->id})\n" : "",
            $primerasPalabras,
            $ubicacion,
            $traceResumido
        );

        return $this->createNotification($titulo, $mensaje, [
            'prioridad' => 'urgente',
            'tipo' => 'error_servidor',
        ]);
    }

    /**
     * Obtener resumen del stack trace (solo primeras X líneas)
     */
    private function getResumenStackTrace($trace, $lineas = 3)
    {
        $lineas = explode("\n", $trace);
        $resumen = array_slice($lineas, 0, $lineas);
        
        $resultado = implode("\n", $resumen);
        
        if (count($lineas) > $lineas) {
            $resultado .= "\n... y " . (count($lineas) - $lineas) . " líneas más (ver log completo)";
        }
        
        return $resultado;
    }

    /**
     * Crear la notificación en la base de datos
     */
    private function createNotification($titulo, $mensaje, $options = [])
    {
        try {
            $data = [
                'usuario_id' => self::ADMIN_USER_ID,
                'titulo' => $titulo,
                'mensaje' => $mensaje,
                'tipo' => $options['tipo'] ?? 'error_servidor',
                'entidad_tipo' => $options['entidad_tipo'] ?? null,
                'entidad_id' => $options['entidad_id'] ?? null,
                'leida' => false,
                'fecha_leida' => null,
                'fecha_notificacion' => Carbon::now(),
                'prioridad' => $options['prioridad'] ?? 'alta',
                'created' => Carbon::now(),
                'deleted_at' => null,
                'deleted_by' => null,
            ];

            return DB::table('notificaciones')->insert($data);
        } catch (\Exception $e) {
            Log::error('Error al crear notificación de error: ' . $e->getMessage());
            return false;
        }
    }
    /**
     * Obtener estadísticas de errores
     */
    public function getErrorStats()
    {
        $last24h = Carbon::now()->subHours(24);
        $last7d = Carbon::now()->subDays(7);

        return [
            'ultimas_24h' => DB::table('notificaciones')
                ->where('usuario_id', self::ADMIN_USER_ID)
                ->where('tipo', 'error_servidor')
                ->where('created', '>=', $last24h)
                ->count(),
            
            'ultimos_7dias' => DB::table('notificaciones')
                ->where('usuario_id', self::ADMIN_USER_ID)
                ->where('tipo', 'error_servidor')
                ->where('created', '>=', $last7d)
                ->count(),
            
            'por_prioridad' => DB::table('notificaciones')
                ->where('usuario_id', self::ADMIN_USER_ID)
                ->where('tipo', 'error_servidor')
                ->select('prioridad', DB::raw('COUNT(*) as total'))
                ->groupBy('prioridad')
                ->get()
                ->pluck('total', 'prioridad'),
            
            'ultimo_error' => DB::table('notificaciones')
                ->where('usuario_id', self::ADMIN_USER_ID)
                ->where('tipo', 'error_servidor')
                ->latest('created')
                ->first(),
        ];
    }
}