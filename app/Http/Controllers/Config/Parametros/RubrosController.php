<?php
// app/Http/Controllers/Config/Parametros/RubrosController.php

namespace App\Http\Controllers\Config\Parametros;

use App\Http\Controllers\Controller;
use App\Traits\Authorizable;
use App\Models\Rubro;
use App\Models\Lead;
use App\Models\Empresa;
use Inertia\Inertia;
use Illuminate\Support\Facades\DB;

class RubrosController extends Controller
{
    use Authorizable;

    public function __construct()
    {
        $this->initializeAuthorization();
    }

    public function index()
    {
        // 🔥 VERIFICAR PERMISO BASE
        $this->authorizePermiso(config('permisos.VER_CONFIGURACION'));
        
        $rubros = Rubro::orderBy('nombre')
            ->get()
            ->map(function ($rubro) {
                $totalLeads = Lead::where('rubro_id', $rubro->id)->count();
                $totalEmpresas = Empresa::where('rubro_id', $rubro->id)->count();
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

        $totalLeadsConRubro = Lead::whereNotNull('rubro_id')->count();
        $totalLeadsSinRubro = Lead::whereNull('rubro_id')->count();
        
        $totalEmpresasConRubro = Empresa::whereNotNull('rubro_id')->count();
        $totalEmpresasSinRubro = Empresa::whereNull('rubro_id')->count();

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
                'suma_leads_por_rubro' => $sumaLeadsPorRubro,
                'suma_empresas_por_rubro' => $sumaEmpresasPorRubro,
            ]
        ]);
    }
}