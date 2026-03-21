<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;
use App\Services\Error\ErrorNotificationService;
use Illuminate\Support\Facades\Log;

class Handler extends ExceptionHandler
{
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    protected $errorNotificationService;

    public function __construct(ErrorNotificationService $errorNotificationService)
    {
        parent::__construct(app());
        $this->errorNotificationService = $errorNotificationService;
    }

    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            if ($this->shouldReport($e) && app()->environment('production')) {
                try {
                    $this->errorNotificationService->notifyError500($e, request());
                } catch (\Exception $notificationError) {
                    Log::error('Error al enviar notificación de error: ' . $notificationError->getMessage());
                }
            }
        });
    }

public function render($request, Throwable $exception)
{
    if ($this->isHttpException($exception)) {
        $statusCode = $exception->getStatusCode();
        
        $errorViews = [
            403 => 'errors.403',
            404 => 'errors.404',
            419 => 'errors.419',
            500 => 'errors.500',
            503 => 'errors.503',
        ];

        if (isset($errorViews[$statusCode])) {
            $defaultMessages = [
                403 => 'NO TIENES PERMISOS<br>PARA ACCEDER A ESTE RECURSO.',
                404 => 'LA PÁGINA QUE BUSCAS<br>NO EXISTE O FUE MOVIDA.',
                419 => 'TU SESIÓN HA CADUCADO<br>POR SEGURIDAD.',
                500 => 'ERROR INTERNO DEL SERVIDOR.<br>LOS TÉCNICOS HAN SIDO NOTIFICADOS.',
                503 => 'EL SISTEMA ESTÁ<br>TEMPORALMENTE EN MANTENIMIENTO.',
            ];
            
            $message = $exception->getMessage() ?: $defaultMessages[$statusCode];
            
            return response()->view($errorViews[$statusCode], [
                'code' => $statusCode,
                'message' => $message,
            ], $statusCode);
        }
    }

    return parent::render($request, $exception);
}

    private function getTitle(int $statusCode): string
    {
        return match ($statusCode) {
            403 => '403 - Acceso prohibido',
            404 => '404 - Página no encontrada',
            419 => '419 - Sesión expirada',
            500 => '500 - Error del servidor',
            503 => '503 - Mantenimiento',
            default => 'Error',
        };
    }

    private function getMessageForBlade(int $statusCode): string
    {
        return match ($statusCode) {
            403 => 'NO TIENES PERMISOS<br>PARA ACCEDER A ESTE RECURSO.',
            404 => 'LA PÁGINA QUE BUSCAS<br>NO EXISTE O FUE MOVIDA.',
            419 => 'TU SESIÓN HA EXPIRADO.<br>INICIA SESIÓN NUEVAMENTE.',
            500 => 'ERROR INTERNO DEL SERVIDOR.<br>EL EQUIPO HA SIDO NOTIFICADO.',
            503 => 'SITIO EN MANTENIMIENTO.<br>INTENTA MÁS TARDE.',
            default => 'HA OCURRIDO UN ERROR.',
        };
    }
}