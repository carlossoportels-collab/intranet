<?php
// app/Http/Controllers/rrhh/Equipos/EquipoComercialController.php

namespace App\Http\Controllers\rrhh\Equipos;

use App\Http\Controllers\Controller;
use App\Models\Comercial;
use App\Models\Personal;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Carbon\Carbon;

class EquipoComercialController extends Controller
{
    public function index(Request $request)
    {
        // Obtener todos los comerciales con su información personal
        $comerciales = Comercial::with('personal')
            ->orderBy('created', 'desc')
            ->get()
            ->map(function($c) {
                // Calcular edad correctamente
                $edad = null;
                if ($c->personal && $c->personal->fecha_nacimiento) {
                    $fechaNacimiento = Carbon::parse($c->personal->fecha_nacimiento);
                    $edad = $fechaNacimiento->age; // Carbon tiene un método age que calcula la edad correctamente
                }

                // Obtener último acceso del usuario si existe
                $ultimoAcceso = null;
                if ($c->personal && $c->personal->usuario) {
                    $ultimoAcceso = $c->personal->usuario->ultimo_acceso;
                }

                return [
                    'id' => $c->id,
                    'personal_id' => $c->personal_id,
                    'nombre_completo' => $c->nombre_completo,
                    'nombre' => $c->personal->nombre ?? '',
                    'apellido' => $c->personal->apellido ?? '',
                    'email' => $c->personal->email ?? '',
                    'telefono' => $c->personal->telefono ?? '',
                    'fecha_nacimiento' => $c->personal->fecha_nacimiento ?? null,
                    'edad' => $edad,
                    'compania_id' => $c->compania_id,
                    'prefijo_id' => $c->prefijo_id,
                    'activo' => $c->activo,
                    'created' => $c->created,
                    'ultimo_acceso' => $ultimoAcceso,
                ];
            });

        // Calcular totales
        $total_comerciales = $comerciales->count();
        $activos = $comerciales->where('activo', true)->count();
        $con_email = $comerciales->where('email', '!=', '')->count();
        $con_telefono = $comerciales->where('telefono', '!=', '')->count();

        // Obtener compañías únicas
        $companias = collect([1, 2, 3])->map(function($id) {
            return $this->getNombreCompania($id);
        })->toArray();

        // Agrupar por compañía
        $comercialesPorCompania = [];
        foreach ($comerciales as $comercial) {
            $nombreCompania = $this->getNombreCompania($comercial['compania_id']);
            
            if (!isset($comercialesPorCompania[$nombreCompania])) {
                $comercialesPorCompania[$nombreCompania] = [];
            }
            $comercialesPorCompania[$nombreCompania][] = $comercial;
        }

        // Ordenar compañías alfabéticamente
        ksort($comercialesPorCompania);

        return Inertia::render('rrhh/Equipos/EquipoComercial', [
            'comerciales' => $comerciales,
            'comercialesPorCompania' => $comercialesPorCompania,
            'companias' => $companias,
            'total_comerciales' => $total_comerciales,
            'activos' => $activos,
            'con_email' => $con_email,
            'con_telefono' => $con_telefono,
        ]);
    }

    private function getNombreCompania($companiaId)
    {
        $companias = [
            1 => 'LocalSat',
            2 => 'SmartSat',
            3 => '360',
        ];
        
        return $companias[$companiaId] ?? 'Sin Compañía';
    }
}