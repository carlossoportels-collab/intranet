<?php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;
use App\Services\Error\ErrorNotificationService;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

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
            // Enviar notificación solo para errores 500 en producción
            if ($this->shouldReport($e) && app()->environment('production')) {
                try {
                    $this->errorNotificationService->notifyError500($e, request());
                } catch (\Exception $notificationError) {
                    // Si falla la notificación, al menos loguearlo
                    Log::error('Error al enviar notificación de error: ' . $notificationError->getMessage());
                }
            }
        });
    }

    public function render($request, Throwable $exception)
    {
        // Si es una excepción HTTP
        if ($this->isHttpException($exception)) {
            $statusCode = $exception->getStatusCode();
            
            // Mapeo de códigos de error a componentes
            $errorPages = [
                403 => 'Errors/403',
                404 => 'Errors/404',
                419 => 'Errors/419',
                500 => 'Errors/500',
                503 => 'Errors/503',
            ];

            // Si tenemos una página personalizada para este código
            if (isset($errorPages[$statusCode])) {
                return response()->view($errorPages[$statusCode], [
                    'status' => $statusCode,
                    'message' => $exception->getMessage() ?: $this->getDefaultMessage($statusCode),
                ], $statusCode);
            }
        }

        // Para errores 500 en producción, mostrar página personalizada
        if (app()->environment('production') && !$this->isHttpException($exception)) {
            return response()->view('Errors/500', [
                'status' => 500,
                'message' => 'Ha ocurrido un error interno en el servidor. Nuestro equipo ha sido notificado.',
            ], 500);
        }

        return parent::render($request, $exception);
    }

    private function getDefaultMessage(int $statusCode): string
    {
        return match ($statusCode) {
            403 => 'No tienes permisos para acceder a esta página.',
            404 => 'La página que buscas no existe.',
            419 => 'Tu sesión ha expirado. Por favor, inicia sesión nuevamente.',
            500 => 'Ha ocurrido un error interno en el servidor.',
            503 => 'El sitio está en mantenimiento. Por favor, intenta más tarde.',
            default => 'Ha ocurrido un error.',
        };
    }
}