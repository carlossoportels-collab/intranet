<?php
// app/Http/Controllers/RRHH/Equipos/EquipoTecnicoController.php

namespace App\Http\Controllers\rrhh\Equipos;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use App\Models\Tecnico;
use App\Models\Personal;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class EquipoTecnicoController extends Controller
{
    public function index(Request $request)
    {
        try {
            // Obtener técnicos con sus datos de personal
            $tecnicos = Tecnico::with(['personal' => function ($query) {
                $query->where('activo', 1)
                    ->select('id', 'nombre', 'apellido', 'email', 'telefono', 'fecha_nacimiento');
            }])
            ->where('activo', 1)
            ->get()
            ->map(function ($tecnico) {
                // Extraer provincia de la dirección (asumiendo formato: "Calle 123, Ciudad, Provincia")
                $direccion = $tecnico->direccion ?? '';
                $provincia = $this->extraerProvincia($direccion);
                
                return [
                    'id' => $tecnico->id,
                    'personal_id' => $tecnico->personal_id,
                    'nombre_completo' => $tecnico->personal ? 
                        $tecnico->personal->nombre . ' ' . $tecnico->personal->apellido : 'N/A',
                    'nombre' => $tecnico->personal->nombre ?? '',
                    'apellido' => $tecnico->personal->apellido ?? '',
                    'email' => $tecnico->personal->email ?? '',
                    'telefono' => $tecnico->personal->telefono ?? '',
                    'fecha_nacimiento' => $tecnico->personal->fecha_nacimiento ?? null,
                    'edad' => $tecnico->personal->fecha_nacimiento ? 
                        \Carbon\Carbon::parse($tecnico->personal->fecha_nacimiento)->age : null,
                    'direccion' => $direccion,
                    'provincia' => $provincia,
                    'latitud' => $tecnico->latitud,
                    'longitud' => $tecnico->longitud,
                    'tiene_ubicacion' => !is_null($tecnico->latitud) && !is_null($tecnico->longitud),
                    'activo' => (bool)$tecnico->activo,
                    'created' => $tecnico->created,
                ];
            });

            // Agrupar por provincia
            $tecnicosPorProvincia = $tecnicos->groupBy('provincia')->sortKeys();

            // Obtener lista de provincias únicas para filtros
            $provincias = $tecnicos->pluck('provincia')->unique()->filter()->sort()->values();

            return Inertia::render('rrhh/Equipos/EquipoTecnico', [
                'tecnicos' => $tecnicos,
                'tecnicosPorProvincia' => $tecnicosPorProvincia,
                'provincias' => $provincias,
                'total_tecnicos' => $tecnicos->count(),
                'tecnicos_con_ubicacion' => $tecnicos->where('tiene_ubicacion', true)->count(),
                'tecnicos_sin_ubicacion' => $tecnicos->where('tiene_ubicacion', false)->count(),
            ]);

        } catch (\Exception $e) {
            \Log::error('Error en EquipoTecnicoController: ' . $e->getMessage());
            
            return Inertia::render('rrhh/Equipos/EquipoTecnico', [
                'tecnicos' => [],
                'tecnicosPorProvincia' => [],
                'provincias' => [],
                'total_tecnicos' => 0,
                'tecnicos_con_ubicacion' => 0,
                'tecnicos_sin_ubicacion' => 0,
                'error' => 'Error al cargar los datos del equipo técnico.',
            ]);
        }
    }

    /**
     * Función auxiliar para extraer provincia de la dirección
     */
    private function extraerProvincia($direccion)
    {
        if (empty($direccion)) {
            return 'Sin Provincia';
        }

        // Lista de provincias argentinas comunes
        $provinciasArgentina = [
            'Buenos Aires', 'CABA', 'Capital Federal', 'Ciudad Autónoma de Buenos Aires',
            'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 'Entre Ríos',
            'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones',
            'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz',
            'Santa Fe', 'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
        ];

        $direccionLower = strtolower($direccion);
        
        foreach ($provinciasArgentina as $provincia) {
            if (str_contains($direccionLower, strtolower($provincia))) {
                return $provincia;
            }
        }

        // Si no encuentra provincia específica, intentar extraer última parte
        $partes = array_map('trim', explode(',', $direccion));
        
        if (count($partes) > 1) {
            $ultimaParte = end($partes);
            
            // Verificar si la última parte podría ser una provincia
            if (strlen($ultimaParte) > 3) {
                return $ultimaParte;
            }
        }

        return 'Sin Provincia';
    }
    
}