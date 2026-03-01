<?php

namespace App\Http\Controllers\rrhh\Personal;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class LicenciasController extends Controller
{
    public function index()
    {
        return Inertia::render('rrhh/Personal/Licencias');
    }
}