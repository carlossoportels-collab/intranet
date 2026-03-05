<?php
// app/Exceptions/Handler.php

namespace App\Exceptions;

use Illuminate\Foundation\Exceptions\Handler as ExceptionHandler;
use Throwable;
use Inertia\Inertia;
use Symfony\Component\HttpKernel\Exception\HttpExceptionInterface;

class Handler extends ExceptionHandler
{
    /**
     * The list of the inputs that are never flashed to the session on validation exceptions.
     *
     * @var array<int, string>
     */
    protected $dontFlash = [
        'current_password',
        'password',
        'password_confirmation',
    ];

    /**
     * Register the exception handling callbacks for the application.
     */
    public function register(): void
    {
        $this->reportable(function (Throwable $e) {
            //
        });
    }

    /**
     * Render an exception into an HTTP response.
     */
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
                return Inertia::render($errorPages[$statusCode], [
                    'status' => $statusCode,
                    'message' => $exception->getMessage() ?: $this->getDefaultMessage($statusCode),
                ])->toResponse($request)->setStatusCode($statusCode);
            }
        }

        // Para errores 500 en producción, mostrar página personalizada
        if (app()->environment('production') && !$this->isHttpException($exception)) {
            return Inertia::render('Errors/500', [
                'status' => 500,
                'message' => 'Ha ocurrido un error interno en el servidor.',
            ])->toResponse($request)->setStatusCode(500);
        }

        return parent::render($request, $exception);
    }

    /**
     * Obtener mensaje por defecto para cada código de error
     */
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