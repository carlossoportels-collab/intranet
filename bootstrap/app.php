<?php


use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use App\Http\Middleware\PermisoMiddleware; // 🔥 IMPORTAR

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware) {
        // Cookies que NO se encriptan
        $middleware->encryptCookies(except: ['appearance', 'sidebar_state']);
        
        // Middlewares web (en orden de ejecución)
        $middleware->web(append: [
            \App\Http\Middleware\HandleAppearance::class,
            \Illuminate\Http\Middleware\AddLinkHeadersForPreloadedAssets::class,
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);
        
        // Aliases para usar en rutas
        $middleware->alias([
            'usuario.activo' => \App\Http\Middleware\CheckUsuarioActivo::class,
            'usuario' => \App\Http\Middleware\UsuarioEspecificoMiddleware::class,
            'permiso' => \App\Http\Middleware\PermisoMiddleware::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions) {
        //
    })
    ->create();