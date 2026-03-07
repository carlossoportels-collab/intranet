<?php

namespace App\Http\Controllers\Config\Parametros;

use App\Http\Controllers\Controller;
use App\Models\Rubro;
use App\Models\Lead;
use App\Models\Empresa;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class RubrosController extends Controller
{
    public function index()
    {
        // Obtener todos los rubros
        $rubros = Rubro::orderBy('nombre')
            ->get()
            ->map(function ($rubro) {
                // Contar leads asociados a este rubro
                $totalLeads = Lead::where('rubro_id', $rubro->id)->count();
                
                // Contar empresas asociadas a este rubro
                $totalEmpresas = Empresa::where('rubro_id', $rubro->id)->count();
                
                // Total de registros asociados (leads + empresas)
                $totalAsociados = $totalLeads + $totalEmpresas;
                
                return [
                    'id' => $rubro->id,
                    'nombre' => $rubro->nombre,
                    'activo' => $rubro->activo,
                    'total_leads' => $totalLeads,
                    'total_empresas' => $totalEmpresas,
                    'total_asociados' => $totalAsociados
                ];
            });

        // Calcular totales globales - CORREGIDO
        $totalLeadsConRubro = Lead::whereNotNull('rubro_id')->count();
        $totalLeadsSinRubro = Lead::whereNull('rubro_id')->count();
        
        $totalEmpresasConRubro = Empresa::whereNotNull('rubro_id')->count();
        $totalEmpresasSinRubro = Empresa::whereNull('rubro_id')->count();

        // Verificar que los totales coincidan con la suma de los rubros
        $sumaLeadsPorRubro = $rubros->sum('total_leads');
        $sumaEmpresasPorRubro = $rubros->sum('total_empresas');

        return Inertia::render('Config/Parametros/Rubros', [
            'rubros' => $rubros,
            'resumen' => [
                'total_rubros' => $rubros->count(),
                'rubros_activos' => $rubros->filter(fn($r) => $r['activo'])->count(),
                'total_leads_con_rubro' => $totalLeadsConRubro,
                'total_leads_sin_rubro' => $totalLeadsSinRubro,
                'total_empresas_con_rubro' => $totalEmpresasConRubro,
                'total_empresas_sin_rubro' => $totalEmpresasSinRubro,
                'suma_leads_por_rubro' => $sumaLeadsPorRubro, // Para debug
                'suma_empresas_por_rubro' => $sumaEmpresasPorRubro, // Para debug
            ]
        ]);
    }
}