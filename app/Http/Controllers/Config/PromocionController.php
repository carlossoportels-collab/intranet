<?php
// app/Http/Controllers/Config/PromocionController.php

namespace App\Http\Controllers\Config;

use App\Http\Controllers\Controller;
use App\Traits\Authorizable; // 🔥 IMPORTAR TRAIT
use App\Models\Promocion;
use App\Services\Promocion\PromocionService;
use App\Services\Promocion\PromocionProductoService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;

class PromocionController extends Controller
{
    use Authorizable; // 🔥 AGREGAR TRAIT

    protected $promocionService;
    protected $productoService;

    public function __construct(PromocionService $promocionService, PromocionProductoService $productoService)
    {
        $this->promocionService = $promocionService;
        $this->productoService = $productoService;
        $this->initializeAuthorization(); // 🔥 INICIALIZAR
    }

    public function index(Request $request)
    {
        // 🔥 VERIFICAR PERMISO
        $this->authorizePermiso(config('permisos.GESTIONAR_PROMOCIONES'));
        
        $usuario = auth()->user();
        
        $promociones = Promocion::withAllRelations()
            ->orderBy('created', 'desc')
            ->paginate(10)
            ->through(function ($promocion) {
                $nombreCreador = null;
                if ($promocion->creador && $promocion->creador->personal) {
                    $personal = $promocion->creador->personal;
                    $nombreCreador = trim($personal->nombre . ' ' . $personal->apellido);
                }

                return [
                    'id' => $promocion->id,
                    'nombre' => $promocion->nombre,
                    'descripcion' => $promocion->descripcion,
                    'fecha_inicio' => $promocion->fecha_inicio->format('Y-m-d'),
                    'fecha_fin' => $promocion->fecha_fin->format('Y-m-d'),
                    'activo' => $promocion->activo,
                    'estado' => $promocion->estado,
                    'created' => $promocion->created,
                    'productos' => $promocion->productos->map(function ($prod) {
                        return [
                            'id' => $prod->id,
                            'bonificacion' => $prod->bonificacion,
                            'tipo_promocion' => $prod->tipo_promocion,
                            'cantidad_minima' => $prod->cantidad_minima,
                            'productoServicio' => [
                                'id' => $prod->productoServicio->id,
                                'nombre' => $prod->productoServicio->nombre,
                                'codigopro' => $prod->productoServicio->codigopro,
                                'tipo_id' => $prod->productoServicio->tipo_id,
                                'compania' => $prod->productoServicio->compania ? [
                                    'id' => $prod->productoServicio->compania->id,
                                    'nombre' => $prod->productoServicio->compania->nombre
                                ] : null
                            ]
                        ];
                    }),
                    'creador' => $promocion->creador ? [
                        'id' => $promocion->creador->id,
                        'name' => $nombreCreador ?? $promocion->creador->nombre_usuario
                    ] : null
                ];
            });

        $estadisticas = $this->promocionService->obtenerEstadisticas();
        $productos = $this->productoService->getProductosCompania1();

        return Inertia::render('Config/Promociones/Index', [
            'promociones' => $promociones,
            'estadisticas' => $estadisticas,
            'productos' => $productos
        ]);
    }

    public function create()
    {
        return redirect()->route('config.promociones.index');
    }

    public function store(Request $request)
    {
        // 🔥 VERIFICAR PERMISO
        $this->authorizePermiso(config('permisos.GESTIONAR_PROMOCIONES'));
        
        $validated = $request->validate([
            'nombre' => 'required|string|max:200',
            'descripcion' => 'nullable|string',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
            'activo' => 'boolean',
            'productos' => 'required|array|min:1',
            'productos.*.producto_servicio_id' => 'required|exists:productos_servicios,id',
            'productos.*.tipo_promocion' => 'required|in:porcentaje,2x1,3x2',
            'productos.*.bonificacion' => 'required|numeric|min:0|max:100',
            'productos.*.cantidad_minima' => 'nullable|integer|min:1'
        ]);

        try {
            $promocion = $this->promocionService->crearPromocion($validated);
            
            return redirect()->route('config.promociones.index')
                ->with('success', 'Promoción creada exitosamente');
        } catch (\Exception $e) {
            return back()->with('error', 'Error al crear la promoción: ' . $e->getMessage());
        }
    }

    public function edit(Promocion $promocione)
    {
        // 🔥 VERIFICAR PERMISO
        $this->authorizePermiso(config('permisos.GESTIONAR_PROMOCIONES'));
        
        $promocione->load('productos.productoServicio.compania');
        
        $productos = $this->productoService->getProductosCompania1();
        $tiposProductos = $this->productoService->getTiposProductos();

        return Inertia::render('Config/Promociones/Index', [
            'promocion' => [
                'id' => $promocione->id,
                'nombre' => $promocione->nombre,
                'descripcion' => $promocione->descripcion,
                'fecha_inicio' => $promocione->fecha_inicio->format('Y-m-d'),
                'fecha_fin' => $promocione->fecha_fin->format('Y-m-d'),
                'activo' => $promocione->activo,
                'productos' => $promocione->productos->map(function ($prod) {
                    return [
                        'id' => $prod->id,
                        'producto_servicio_id' => $prod->producto_servicio_id,
                        'tipo_promocion' => $prod->tipo_promocion,
                        'bonificacion' => $prod->bonificacion,
                        'cantidad_minima' => $prod->cantidad_minima,
                        'nombre_producto' => $prod->productoServicio->nombre,
                        'codigo_producto' => $prod->productoServicio->codigopro,
                        'tipo_id' => $prod->productoServicio->tipo_id,
                        'compania_nombre' => $prod->productoServicio->compania?->nombre
                    ];
                })
            ],
            'productos' => $productos,
            'tiposProductos' => $tiposProductos
        ]);
    }

    public function update(Request $request, Promocion $promocione)
    {
        // 🔥 VERIFICAR PERMISO
        $this->authorizePermiso(config('permisos.GESTIONAR_PROMOCIONES'));
        
        $validated = $request->validate([
            'nombre' => 'required|string|max:200',
            'descripcion' => 'nullable|string',
            'fecha_inicio' => 'required|date',
            'fecha_fin' => 'required|date|after_or_equal:fecha_inicio',
            'activo' => 'boolean',
            'productos' => 'required|array|min:1',
            'productos.*.producto_servicio_id' => 'required|exists:productos_servicios,id',
            'productos.*.tipo_promocion' => 'required|in:porcentaje,2x1,3x2',
            'productos.*.bonificacion' => 'required|numeric|min:0|max:100',
            'productos.*.cantidad_minima' => 'nullable|integer|min:1'
        ]);

        try {
            $promocion = $this->promocionService->actualizarPromocion($promocione, $validated);
            
            return redirect()->route('config.promociones.index')
                ->with('success', 'Promoción actualizada exitosamente');
        } catch (\Exception $e) {
            return back()->with('error', 'Error al actualizar la promoción: ' . $e->getMessage());
        }
    }

    public function destroy(Promocion $promocione)
    {
        // 🔥 VERIFICAR PERMISO
        $this->authorizePermiso(config('permisos.GESTIONAR_PROMOCIONES'));
        
        try {
            $promocione->productos()->delete();
            $promocione->delete();
            
            return redirect()->route('config.promociones.index')
                ->with('success', 'Promoción eliminada exitosamente');
        } catch (\Exception $e) {
            return back()->with('error', 'Error al eliminar la promoción');
        }
    }
}