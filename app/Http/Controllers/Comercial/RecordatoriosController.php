<?php
// app/Http/Controllers/Comercial/RecordatoriosController.php

namespace App\Http\Controllers\Comercial;

use App\Http\Controllers\Controller;
use App\Traits\Authorizable;
use Inertia\Inertia;

class RecordatoriosController extends Controller
{
    use Authorizable;

    public function __construct()
    {
        $this->initializeAuthorization();
    }

    public function index()
    {
        // Verificar permiso para ver recordatorios
        $this->authorizePermiso(config('permisos.VER_RECORDATORIOS'));
        
        return Inertia::render('Comercial/Recordatorios');
    }
}