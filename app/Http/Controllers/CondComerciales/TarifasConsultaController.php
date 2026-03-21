<?php
// app/Http/Controllers/CondComerciales/TarifasConsultaController.php

namespace App\Http\Controllers\CondComerciales;

use App\Http\Controllers\Controller;
use App\Traits\Authorizable; // 🔥 IMPORTAR TRAIT
use App\Models\ProductoServicio;
use App\Models\TipoPrdSrv;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;

class TarifasConsultaController extends Controller
{
    use Authorizable; // 🔥 AGREGAR TRAIT

    public function __construct()
    {
        $this->initializeAuthorization(); // 🔥 INICIALIZAR
    }

    public function index()
    {
        // 🔥 VERIFICAR PERMISO DE CONSULTA
        $this->authorizePermiso(config('permisos.VER_TARIFAS_CONSULTA'));
        
        $usuario = Auth::user();
        
        // Obtener compañías permitidas para el usuario USANDO EL TRAIT
        $companiasPermitidas = $this->getCompaniasPermitidas();
        $puedeVerTodas = $this->canViewAllRecords();
        
        // Query base para productos y servicios activos
        $query = ProductoServicio::where('es_activo', 1)
            ->with('tipo');
        
        // Aplicar filtro por compañía usando EL TRAIT
        $query = $this->applyCompaniaFilter($query);
        
        // Ejecutar query y ordenar
        $productosServicios = $query->orderBy('codigopro')
            ->get()
            ->map(function ($producto) {
                return [
                    'id' => $producto->id,
                    'codigopro' => $producto->codigopro,
                    'nombre' => $producto->nombre,
                    'descripcion' => $producto->descripcion,
                    'precio' => $producto->precio,
                    'tipo_id' => $producto->tipo_id,
                    'compania_id' => $producto->compania_id,
                    'es_activo' => $producto->es_activo,
                    'created' => $producto->created,
                    'modified' => $producto->modified,
                    'tipo' => $producto->tipo ? [
                        'id' => $producto->tipo->id,
                        'nombre_tipo_abono' => $producto->tipo->nombre_tipo_abono,
                        'descripcion' => $producto->tipo->descripcion,
                        'es_activo' => $producto->tipo->es_activo,
                        'created' => $producto->tipo->created,
                    ] : null,
                ];
            });

        // Obtener tipos activos
        $tiposQuery = TipoPrdSrv::where('es_activo', 1);
        
        // Si NO puede ver todas las compañías, filtramos los tipos
        // para mostrar solo aquellos que tienen productos de su compañía
        if (!$puedeVerTodas && !empty($companiasPermitidas)) {
            $tiposQuery->whereHas('productos', function($q) use ($companiasPermitidas) {
                $q->whereIn('compania_id', $companiasPermitidas)
                  ->where('es_activo', 1);
            });
        }
        
        $tiposPrdSrv = $tiposQuery->orderBy('nombre_tipo_abono')
            ->get();

        // Obtener información de la compañía del usuario para mostrar en la UI
        $companiaUsuario = null;
        if (!$puedeVerTodas && !empty($companiasPermitidas)) {
            $companiaUsuario = DB::table('companias')
                ->where('id', $companiasPermitidas[0])
                ->first(['id', 'nombre']);
        }

        return Inertia::render('CondComerciales/TarifasConsulta', [
            'productos_servicios' => $productosServicios,
            'tipos_prd_srv' => $tiposPrdSrv,
            'permisos' => [
                'puede_ver_todas' => $puedeVerTodas,
                'companias_permitidas' => $companiasPermitidas,
                'compania_actual' => $companiaUsuario ? [
                    'id' => $companiaUsuario->id,
                    'nombre' => $companiaUsuario->nombre ?? 'Compañía',
                ] : null,
            ],
        ]);
    }
}