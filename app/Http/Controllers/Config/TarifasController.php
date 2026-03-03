<?php
// app/Http/Controllers/Config/TarifasController.php

namespace App\Http\Controllers\Config;

use App\Http\Controllers\Controller;
use App\Models\ProductoServicio;
use App\Models\TipoPrdSrv;
use App\Models\Compania;
use App\Helpers\PermissionHelper;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Validation\Rule;
use Illuminate\Http\UploadedFile;
use PhpOffice\PhpSpreadsheet\IOFactory;

class TarifasController extends Controller
{
    /**
     * Display a listing of the resource.
     */
    public function index()
    {
        $usuario = Auth::user();
        
        // Obtener compañías permitidas
        $companiasPermitidas = PermissionHelper::getCompaniasPermitidas();
        $puedeVerTodas = PermissionHelper::puedeVerTodos();
        
        // Query base para productos
        $query = ProductoServicio::with('tipo');
        
        // Aplicar filtro por compañía
        $query = PermissionHelper::aplicarFiltroCompania($query);
        
        // Obtener productos ordenados
        $productosServicios = $query->orderBy('codigopro')->get();
        
        // Obtener tipos activos
        $tipos = TipoPrdSrv::where('es_activo', 1)
            ->orderBy('nombre_tipo_abono')
            ->get();
        
        // Obtener compañías (para filtros)
        $companiasQuery = Compania::where('es_activo', 1);
        
        if (!$puedeVerTodas && !empty($companiasPermitidas)) {
            $companiasQuery->whereIn('id', $companiasPermitidas);
        }
        
        $companias = $companiasQuery->orderBy('nombre')->get();
        
        // Obtener información de compañía actual
        $companiaActual = null;
        if (!$puedeVerTodas && !empty($companiasPermitidas)) {
            $companiaActual = $companias->firstWhere('id', $companiasPermitidas[0]);
        }

        return Inertia::render('Config/Tarifas/Index', [
            'productos_servicios' => $productosServicios,
            'tipos' => $tipos,
            'companias' => $companias,
            'permisos' => [
                'puede_ver_todas' => $puedeVerTodas,
                'companias_permitidas' => $companiasPermitidas,
                'compania_actual' => $companiaActual ? [
                    'id' => $companiaActual->id,
                    'nombre' => $companiaActual->nombre,
                ] : null,
            ],
        ]);
    }

    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $usuario = Auth::user();
        
        // Validación
        $validated = $request->validate([
            'codigopro' => 'required|string|max:11|unique:productos_servicios,codigopro',
            'nombre' => 'required|string|max:200',
            'descripcion' => 'nullable|string',
            'precio' => 'required|numeric|min:0',
            'tipo_id' => 'required|exists:tipo_prd_srv,id',
            'compania_id' => [
                'required',
                'exists:companias,id',
                function ($attribute, $value, $fail) use ($usuario) {
                    // Verificar permisos de compañía
                    if (!$usuario->ve_todas_cuentas) {
                        $companiasPermitidas = PermissionHelper::getCompaniasPermitidas();
                        if (!in_array($value, $companiasPermitidas)) {
                            $fail('No tiene permisos para crear productos en esta compañía.');
                        }
                    }
                },
            ],
            'es_activo' => 'boolean',
            'es_presupuestable' => 'boolean',
        ]);

        // Agregar timestamps
        $validated['created'] = now();
        $validated['modified'] = now();
        $validated['created_by'] = $usuario->id;
        $validated['modified_by'] = $usuario->id;

        // Crear producto
        $producto = ProductoServicio::create($validated);

        return response()->json([
            'success' => true,
            'message' => 'Producto creado correctamente',
            'producto' => $producto
        ]);
    }

    /**
     * Update the specified resource in storage.
     */
    public function update(Request $request, $id)
    {
        $usuario = Auth::user();
        $producto = ProductoServicio::findOrFail($id);
        
        // Verificar permisos de compañía
        if (!$usuario->ve_todas_cuentas) {
            $companiasPermitidas = PermissionHelper::getCompaniasPermitidas();
            if (!in_array($producto->compania_id, $companiasPermitidas)) {
                abort(403, 'No tiene permisos para modificar este producto.');
            }
        }

        // Validación
        $validated = $request->validate([
            'nombre' => 'required|string|max:200',
            'descripcion' => 'nullable|string',
            'precio' => 'required|numeric|min:0',
            'es_activo' => 'boolean',
            'es_presupuestable' => 'boolean',
        ]);

        // Actualizar modified
        $validated['modified'] = now();
        $validated['modified_by'] = $usuario->id;

        // Actualizar producto
        $producto->update($validated);

        return redirect()->back()->with('success', 'Producto actualizado correctamente.');
    }

    /**
     * Toggle activo status.
     */
    public function toggleActivo($id)
    {
        $usuario = Auth::user();
        $producto = ProductoServicio::findOrFail($id);
        
        // Verificar permisos de compañía
        if (!$usuario->ve_todas_cuentas) {
            $companiasPermitidas = PermissionHelper::getCompaniasPermitidas();
            if (!in_array($producto->compania_id, $companiasPermitidas)) {
                abort(403, 'No tiene permisos para modificar este producto.');
            }
        }

        // Toggle estado activo
        $producto->es_activo = !$producto->es_activo;
        $producto->modified = now();
        $producto->modified_by = $usuario->id;
        $producto->save();

        $estado = $producto->es_activo ? 'activado' : 'desactivado';
        return redirect()->back()->with('success', "Producto {$estado} correctamente.");
    }

    /**
     * Toggle presupuestable status.
     */
    public function togglePresupuestable($id)
    {
        $usuario = Auth::user();
        $producto = ProductoServicio::findOrFail($id);
        
        // Verificar permisos de compañía
        if (!$usuario->ve_todas_cuentas) {
            $companiasPermitidas = PermissionHelper::getCompaniasPermitidas();
            if (!in_array($producto->compania_id, $companiasPermitidas)) {
                abort(403, 'No tiene permisos para modificar este producto.');
            }
        }

        // Toggle estado presupuestable
        $producto->es_presupuestable = !$producto->es_presupuestable;
        $producto->modified = now();
        $producto->modified_by = $usuario->id;
        $producto->save();

        $estado = $producto->es_presupuestable ? 'habilitado' : 'deshabilitado';
        return redirect()->back()->with('success', "Producto {$estado} para presupuestos correctamente.");
    }

    /**
     * Remove the specified resource from storage.
     */
    public function destroy($id)
    {
        $usuario = Auth::user();
        $producto = ProductoServicio::findOrFail($id);
        
        // Verificar permisos de compañía
        if (!$usuario->ve_todas_cuentas) {
            $companiasPermitidas = PermissionHelper::getCompaniasPermitidas();
            if (!in_array($producto->compania_id, $companiasPermitidas)) {
                abort(403, 'No tiene permisos para eliminar este producto.');
            }
        }

        // Soft delete
        $producto->deleted_at = now();
        $producto->deleted_by = $usuario->id;
        $producto->save();

        return redirect()->back()->with('success', 'Producto eliminado correctamente.');
    }

    /**
     * Export tarifas (opcional - para el botón Exportar)
     */
    public function export(Request $request)
    {
        $usuario = Auth::user();
        
        $query = ProductoServicio::with('tipo')
            ->where('es_activo', 1);
        
        // Aplicar filtros si vienen en la request
        if ($request->has('tipo_id') && $request->tipo_id !== 'todos') {
            $query->where('tipo_id', $request->tipo_id);
        }
        
        if ($request->has('compania_id') && $request->compania_id !== 'todos') {
            $query->where('compania_id', $request->compania_id);
        }
        
        // Aplicar filtro de permisos
        $query = PermissionHelper::aplicarFiltroCompania($query);
        
        $productos = $query->orderBy('tipo_id')->orderBy('nombre')->get();
        
        // Aquí puedes generar un CSV, Excel, etc.
        // Por ahora redirigimos con los datos
        return redirect()->back()->with('export_data', $productos);
    }

    
/**
 * Procesar archivo de precios para actualización masiva
 */
public function procesarArchivo(Request $request)
{
    $request->validate([
        'archivo' => 'required|file|mimes:xlsx,xls|max:10240', // 10MB max
    ]);

    $archivo = $request->file('archivo');
    
    try {
        // Obtener TODOS los productos activos de la base de datos
        $productosDB = ProductoServicio::where('es_activo', 1)
            ->with('compania:id,nombre')
            ->get(['id', 'codigopro', 'nombre', 'precio', 'compania_id']);
        
        if ($productosDB->isEmpty()) {
            return response()->json([
                'error' => 'No hay productos activos en la base de datos para actualizar'
            ], 422);
        }
        
        // Cargar el archivo Excel
        $spreadsheet = IOFactory::load($archivo->getPathname());
        $worksheet = $spreadsheet->getActiveSheet();
        $rows = $worksheet->toArray();
        
        // Buscar índices de columnas (primera fila = headers)
        $headers = $rows[0] ?? [];
        $codigoproIndex = array_search('CODIGOPRO', $headers);
        $precioIndex = array_search('PRECIO1', $headers);
        
        if ($codigoproIndex === false || $precioIndex === false) {
            return response()->json([
                'error' => 'El archivo no contiene las columnas requeridas: CODIGOPRO y PRECIO1'
            ], 422);
        }
        
        // Crear un mapa de precios del archivo (por código)
        $preciosArchivo = [];
        for ($i = 1; $i < count($rows); $i++) {
            $row = $rows[$i];
            if (empty($row[$codigoproIndex])) continue;
            
            $codigopro = trim($row[$codigoproIndex]);
            $precioRaw = $row[$precioIndex] ?? '0';
            
            // Convertir formato argentino a número float
            $precio = $this->convertirFormatoArgentino($precioRaw);
            
            if ($precio > 0) {
                $preciosArchivo[$codigopro] = $precio;
            }
        }
        
        // Procesar TODOS los productos de la BD (incluyendo duplicados por código)
        $productosParaActualizar = [];
        $preciosSinCambio = [];
        $productosPorCodigo = [];
        
        // Agrupar productos por código para mejor visualización
        foreach ($productosDB as $producto) {
            $productosPorCodigo[$producto->codigopro][] = $producto;
        }
        
        foreach ($productosDB as $producto) {
            $codigopro = $producto->codigopro;
            
            if (isset($preciosArchivo[$codigopro])) {
                $precioNuevo = $preciosArchivo[$codigopro];
                $precioActual = floatval($producto->precio);
                
                // Redondear a 2 decimales para comparar
                $precioActualRedondeado = round($precioActual, 2);
                $precioNuevoRedondeado = round($precioNuevo, 2);
                
                if ($precioActualRedondeado != $precioNuevoRedondeado) {
                    $productosParaActualizar[] = [
                        'id' => $producto->id,
                        'codigopro' => $codigopro,
                        'nombre' => $producto->nombre,
                        'compania_id' => $producto->compania_id,
                        'precio_actual' => $precioActual,
                        'precio_nuevo' => $precioNuevo,
                        'diferencia' => $precioNuevo - $precioActual,
                        'diferencia_porcentaje' => $precioActual > 0 
                            ? round(($precioNuevo - $precioActual) / $precioActual * 100, 2)
                            : 0,
                    ];
                } else {
                    $preciosSinCambio[] = $codigopro;
                }
            }
        }
        
        // Agrupar por código para mostrar mejor la información
        $productosAgrupados = [];
        foreach ($productosParaActualizar as $item) {
            $codigo = $item['codigopro'];
            if (!isset($productosAgrupados[$codigo])) {
                $productosAgrupados[$codigo] = [
                    'codigopro' => $codigo,
                    'nombre' => $item['nombre'],
                    'precio_nuevo' => $item['precio_nuevo'],
                    'instancias' => []
                ];
            }
            $productosAgrupados[$codigo]['instancias'][] = $item;
        }
        
        // Guardar datos en sesión para confirmación
        if (count($productosParaActualizar) > 0) {
            session(['precios_a_actualizar' => $productosParaActualizar]);
        }
        
        // Preparar previews agrupados
        $previews = [];
        foreach ($productosAgrupados as $codigo => $grupo) {
            $primerItem = $grupo['instancias'][0];
            $totalInstancias = count($grupo['instancias']);
            
            $previews[] = [
                'codigopro' => $codigo,
                'nombre' => $grupo['nombre'] . ($totalInstancias > 1 ? " ({$totalInstancias} productos)" : ''),
                'precio_actual' => $primerItem['precio_actual'],
                'precio_nuevo' => $grupo['precio_nuevo'],
                'diferencia' => $primerItem['diferencia'],
                'diferencia_porcentaje' => $primerItem['diferencia_porcentaje'],
                'total_instancias' => $totalInstancias
            ];
        }
        
        return response()->json([
            'total_en_bd' => $productosDB->count(),
            'productos_en_archivo' => count($preciosArchivo),
            'productos_a_actualizar' => count($productosParaActualizar),
            'productos_sin_cambio' => count($preciosSinCambio),
            'codigos_unicos_a_actualizar' => count($productosAgrupados),
            'previews' => array_slice($previews, 0, 10),
            'requiere_confirmacion' => count($productosParaActualizar) > 0,
        ]);
        
    } catch (\Exception $e) {
        \Log::error('Error procesando archivo de precios', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        
        return response()->json([
            'error' => 'Error al procesar el archivo: ' . $e->getMessage()
        ], 500);
    }
}

private function convertirFormatoArgentino($valor)
{
    if (is_numeric($valor)) {
        return floatval($valor);
    }
    
    $valor = trim(strval($valor));
    
    if (empty($valor)) {
        return 0;
    }
    
    if (strpos($valor, ',') !== false) {
        $valor = str_replace('.', '', $valor);
        $valor = str_replace(',', '.', $valor);
    } else {
        $puntos = substr_count($valor, '.');
        
        if ($puntos === 1) {
            // No hacer nada
        } elseif ($puntos > 1) {
            $valor = str_replace('.', '', $valor);
        }
    }
    
    $valor = str_replace(' ', '', $valor);
    $resultado = floatval($valor);
    
    return $resultado;
}

    /**
 * Confirmar y ejecutar la actualización de precios
 */
public function confirmarActualizacion(Request $request)
{
    $productosParaActualizar = session('precios_a_actualizar');
    
    if (!$productosParaActualizar || count($productosParaActualizar) === 0) {
        return response()->json([
            'error' => 'No hay precios pendientes para actualizar'
        ], 422);
    }
    
    $usuario = Auth::user();
    $actualizados = 0;
    $errores = [];
    
    DB::beginTransaction();
    
    try {
        foreach ($productosParaActualizar as $item) {
            $producto = ProductoServicio::find($item['id']);
            
            if ($producto) {
                $producto->precio = $item['precio_nuevo'];
                $producto->modified = now();
                $producto->modified_by = $usuario->id;
                $producto->save();
                
                $actualizados++;
            }
        }
        
        DB::commit();
        
        session()->forget('precios_a_actualizar');
        
        return response()->json([
            'success' => true,
            'mensaje' => "Se actualizaron {$actualizados} productos correctamente",
            'actualizados' => $actualizados
        ]);
        
    } catch (\Exception $e) {
        DB::rollBack();
        
        return response()->json([
            'error' => 'Error al actualizar: ' . $e->getMessage()
        ], 500);
    }
}
}