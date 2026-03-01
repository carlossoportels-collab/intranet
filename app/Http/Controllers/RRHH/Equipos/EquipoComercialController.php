<?php

namespace App\Http\Controllers\rrhh\Equipos;

use App\Http\Controllers\Controller;
use Inertia\Inertia;

class EquipoComercialController extends Controller
{
    public function index()
    {
        return Inertia::render('rrhh/Equipos/EquipoComercial');
    }
}