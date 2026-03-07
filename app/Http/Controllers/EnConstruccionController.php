<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Inertia\Inertia;

class EnConstruccionController extends Controller
{
    /**
     * Muestra la página de "En Construcción" con mensajes personalizados
     */
    public function __invoke(Request $request)
    {
        // Valores por defecto
        $titulo = $request->input('titulo', 'Página en Construcción');
        $feature = $request->input('feature', 'Esta funcionalidad');
        $mensaje = $request->input('mensaje', 'Estamos trabajando para brindarte la mejor experiencia.');
        $estimatedTime = $request->input('estimatedTime', 'próximamente');
        $contacto = $request->input('contacto', config('mail.support_address', 'soporte@localsat.com.ar'));
        $showBackButton = $request->input('showBackButton', true);

        return Inertia::render('EnConstruccion', [
            'titulo' => $titulo,
            'feature' => $feature,
            'mensaje' => $mensaje,
            'estimatedTime' => $estimatedTime,
            'contacto' => $contacto,
            'showBackButton' => $showBackButton,
        ]);
    }

    /**
     * Método alternativo para rutas específicas
     */
    public function index(Request $request, $feature = null)
    {
        $configuraciones = [
            'actividad' => [
                'titulo' => 'Actividad Comercial',
                'feature' => 'El registro de actividad comercial',
                'estimatedTime' => 'en las próximas semanas'
            ],
            'novedades' => [
                'titulo' => 'Novedades Comerciales',
                'feature' => 'El módulo de novedades',
                'estimatedTime' => 'en desarrollo'
            ],
            'reenvios' => [
                'titulo' => 'Reenvíos Activos',
                'feature' => 'La gestión de reenvíos activos',
                'estimatedTime' => 'próximamente'
            ],
            'certificados' => [
                'titulo' => 'Certificados de Flota',
                'feature' => 'La generación de certificados de flota',
                'estimatedTime' => 'próximamente'
            ],
            'cambio-titularidad' => [
                'titulo' => 'Cambio de Titularidad',
                'feature' => 'La funcionalidad de cambio de titularidad',
                'estimatedTime' => 'en desarrollo'
            ],
            'terminos' => [
                'titulo' => 'Términos y Condiciones',
                'feature' => 'La gestión de términos y condiciones',
                'estimatedTime' => 'próximamente'
            ],
            'usuarios' => [
                'titulo' => 'Usuarios del Sistema',
                'feature' => 'La administración de usuarios',
                'estimatedTime' => 'en las próximas semanas'
            ],
            'roles' => [
                'titulo' => 'Roles y Permisos',
                'feature' => 'La gestión de roles y permisos',
                'estimatedTime' => 'próximamente'
            ],
        ];

        $config = $configuraciones[$feature] ?? [];

        return Inertia::render('EnConstruccion', [
            'titulo' => $config['titulo'] ?? 'Página en Construcción',
            'feature' => $config['feature'] ?? 'Esta funcionalidad',
            'estimatedTime' => $config['estimatedTime'] ?? 'próximamente',
            'contacto' => config('mail.support_address', 'soporte@localsat.com.ar'),
            'showBackButton' => true,
        ]);
    }
}