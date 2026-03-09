<?php
// app/Http/Controllers/Estadisticas/ComercialGrupalController.php

namespace App\Http\Controllers\Estadisticas;

use App\Http\Controllers\Controller;
use App\Models\Comercial;
use App\Models\Lead;
use App\Models\Presupuesto;
use App\Models\Contrato;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class ComercialGrupalController extends Controller
{
    public function index(Request $request)
    {
        // Obtener todos los comerciales activos con su información personal
        $comerciales = Comercial::with('personal')
            ->where('activo', true)
            ->get()
            ->map(function($c) {
                return [
                    'id' => $c->id,
                    'personal_id' => $c->personal_id,
                    'nombre_completo' => $c->nombre_completo,
                    'nombre' => $c->personal->nombre,
                    'apellido' => $c->personal->apellido,
                    'email' => $c->personal->email,
                    'telefono' => $c->personal->telefono,
                    'prefijo_id' => $c->prefijo_id,
                    'compania_id' => $c->compania_id,
                    'fecha_ingreso' => $c->created->format('Y-m-d'),
                    'activo' => $c->activo,
                ];
            });

        // Obtener estadísticas por comercial
        $estadisticas = [];
        $totales = [
            'ventas' => 0,
            'clientes_nuevos' => 0,
            'leads_activos' => 0,
            'presupuestos' => 0,
            'contratos' => 0,
        ];

        foreach ($comerciales as $comercial) {
            // Ventas del mes actual (presupuestos aceptados/convertidos)
            $ventasMensuales = Presupuesto::whereHas('lead', function($q) use ($comercial) {
                    $q->where('prefijo_id', $comercial['prefijo_id']);
                })
                ->whereMonth('created', now()->month)
                ->whereYear('created', now()->year)
                ->sum('total_presupuesto');

            // Leads activos (no clientes)
            $leadsActivos = Lead::where('prefijo_id', $comercial['prefijo_id'])
                ->where('es_cliente', false)
                ->where('es_activo', true)
                ->count();

            // Clientes nuevos del mes (leads que se convirtieron en clientes)
            $clientesNuevos = Lead::where('prefijo_id', $comercial['prefijo_id'])
                ->where('es_cliente', true)
                ->whereMonth('modified', now()->month)
                ->whereYear('modified', now()->year)
                ->count();

            // Presupuestos pendientes
            $presupuestosPendientes = Presupuesto::whereHas('lead', function($q) use ($comercial) {
                    $q->where('prefijo_id', $comercial['prefijo_id']);
                })
                ->where('estado_id', 1) // Asumiendo que estado_id 1 = pendiente
                ->count();

            // Contratos activos
            $contratosActivos = Contrato::whereHas('lead', function($q) use ($comercial) {
                    $q->where('prefijo_id', $comercial['prefijo_id']);
                })
                ->where('activo', true)
                ->count();

            // Experiencia (años desde que ingresó)
            $fechaIngreso = new \DateTime($comercial['fecha_ingreso']);
            $ahora = new \DateTime();
            $experiencia = $ahora->diff($fechaIngreso)->y;

            // Determinar nivel basado en experiencia
            $nivel = 'Junior';
            if ($experiencia >= 5) {
                $nivel = 'Senior';
            } elseif ($experiencia >= 2) {
                $nivel = 'Mid';
            }

            // Objetivo mensual (podrías tener una tabla de metas por comercial)
            $objetivoMensual = 150000; // Valor hardcodeado por ahora

            $estadisticas[] = [
                'comercial_id' => $comercial['id'],
                'nombre_completo' => $comercial['nombre_completo'],
                'ventas_mensuales' => $ventasMensuales,
                'objetivo_mensual' => $objetivoMensual,
                'clientes_nuevos' => $clientesNuevos,
                'leads_activos' => $leadsActivos,
                'presupuestos_pendientes' => $presupuestosPendientes,
                'contratos_activos' => $contratosActivos,
                'satisfaccion' => rand(85, 98), // Simulado por ahora
                'experiencia' => $experiencia,
                'nivel' => $nivel,
            ];

            // Acumular totales
            $totales['ventas'] += $ventasMensuales;
            $totales['clientes_nuevos'] += $clientesNuevos;
            $totales['leads_activos'] += $leadsActivos;
            $totales['presupuestos'] += $presupuestosPendientes;
            $totales['contratos'] += $contratosActivos;
        }

        // Metas de equipo (hardcodeadas por ahora)
        $metasEquipo = [
            ['mes' => 'Enero', 'objetivo' => 1200000, 'alcanzado' => 1250000, 'crecimiento' => 4.2],
            ['mes' => 'Febrero', 'objetivo' => 1300000, 'alcanzado' => 1280000, 'crecimiento' => -1.5],
            ['mes' => 'Marzo', 'objetivo' => 1400000, 'alcanzado' => 1420000, 'crecimiento' => 1.4],
            ['mes' => 'Abril', 'objetivo' => 1350000, 'alcanzado' => 1380000, 'crecimiento' => 2.2],
            ['mes' => 'Mayo', 'objetivo' => 1450000, 'alcanzado' => 1480000, 'crecimiento' => 2.1],
        ];

        return Inertia::render('Estadisticas/ComercialGrupal', [
            'comerciales' => $comerciales,
            'estadisticas' => $estadisticas,
            'metasEquipo' => $metasEquipo,
            'totales' => $totales,
        ]);
    }
}