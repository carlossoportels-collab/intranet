<?php
// app/Http/Controllers/Config/GestionAdminController.php

namespace App\Http\Controllers\Config;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
use Inertia\Inertia;

class GestionAdminController extends Controller
{
    private $mapeoAccesorios = [
        'Ficha Enganche' => 'enganche',
        'Pánico' => 'panico',
        'Sensor Puertas CABINA' => 'cabina',
        'Sensor Puertas CARGA' => 'carga',
        'Pare Motor' => 'corte',
        'Antivandalismo' => 'antivandalico'
    ];
    
    public function index()
    {
        $sessionId = Session::getId();
        
        $empresas = DB::table('admin_empresas_cargado')
            ->where('session_id', $sessionId)
            ->select('codigoalfa', 'prefijo_codigo', 'nombre_mix', 'razonsoc')
            ->get();
        
        return Inertia::render('Config/GestionAdmin', [
            'empresasCargadas' => $empresas,
            'totalEmpresas' => $empresas->count(),
            'totalVehiculos' => DB::table('admin_vehiculos_cargado')->where('session_id', $sessionId)->count(),
            'totalAccesorios' => DB::table('admin_vehiculos_accesorios_cargado')->where('session_id', $sessionId)->count(),
            'totalAbonos' => DB::table('admin_vehiculos_abonos_cargado')->where('session_id', $sessionId)->count(),
            'error' => null
        ]);
    }
    
    public function cargar(Request $request)
    {
        $request->validate([
            'archivo' => 'required|file|mimes:csv,txt|max:102400'
        ]);
        
        $sessionId = Session::getId();
        
        try {
            set_time_limit(600);
            
            $this->limpiarTodasLasCargas($sessionId);
            
            $stats = $this->procesarCSVCompleto($request->file('archivo'), $sessionId);
            
            return response()->json([
                'success' => true,
                'stats' => $stats,
                'message' => "Carga completada: {$stats['empresas']} empresas, {$stats['vehiculos']} vehículos, {$stats['accesorios']} accesorios, {$stats['abonos']} abonos"
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error al cargar CSV: ' . $e->getMessage());
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
            ], 500);
        }
    }
    
    private function procesarCSVCompleto($archivo, $sessionId)
    {
        $empresasCodigos = [];
        $empresas = [];
        $vehiculos = [];
        $accesorios = [];
        $abonos = [];
        
        $rowCount = 0;
        
        if (($handle = fopen($archivo->getPathname(), 'r')) !== false) {
            // Leer headers y limpiar BOM
            $rawHeaders = fgetcsv($handle, 0, ';', '"', '\\');
            
            // Limpiar BOM del primer header
            if (!empty($rawHeaders[0])) {
                $bom = pack('CCC', 0xEF, 0xBB, 0xBF);
                if (substr($rawHeaders[0], 0, 3) === $bom) {
                    $rawHeaders[0] = substr($rawHeaders[0], 3);
                }
                $rawHeaders[0] = ltrim($rawHeaders[0], "\xEF\xBB\xBF");
            }
            
            // Crear índice de columnas
            $headers = [];
            foreach ($rawHeaders as $i => $h) {
                $headerClean = strtolower(trim($h));
                $headers[$headerClean] = $i;
            }
            
            Log::info('Headers detectados: ' . json_encode(array_keys($headers)));
            
            // Índices de columnas
            $idxCodigoAlfa = $headers['codigoalfa'] ?? null;
            $idxCategoria = $headers['categoria'] ?? null;
            $idxTipobanda = $headers['tipobanda'] ?? null;
            $idxNombreMix = $headers['nombre_mix'] ?? null;
            $idxRazonsoc = $headers['razonsoc'] ?? null;
            $idxAltaregist = $headers['altaregist'] ?? null;
            $idxCodigoalf2 = $headers['codigoalf2'] ?? null;
            $idxAbAlta = $headers['ab_alta'] ?? null;
            $idxAbInicio = $headers['ab_inicio'] ?? null;
            $idxAvlIdentificador = $headers['avl_identificador'] ?? null;
            $idxAvlPatente = $headers['avl_patente'] ?? null;
            $idxAvlMarca = $headers['avl_marca'] ?? null;
            $idxAvlModelo = $headers['avl_modelo'] ?? null;
            $idxAvlAnio = $headers['avl_anio'] ?? null;
            $idxAvlColor = $headers['avl_color'] ?? null;
            $idxDatosAd4 = $headers['datos_ad4'] ?? null;
            $idxAbonoCodigo = $headers['abono_codigo'] ?? null;
            $idxAbonoNombre = $headers['abono_nombre'] ?? null;
            $idxAbonoPrecio = $headers['abono_precio'] ?? null;
            $idxAbonoDescuento = $headers['abono_descuento'] ?? null;
            $idxAbonoDescmotivo = $headers['abono_descmotivo'] ?? null;
            
            if ($idxCodigoAlfa === null) {
                throw new \Exception('No se encontró la columna CODIGOALFA');
            }
            if ($idxCategoria === null) {
                throw new \Exception('No se encontró la columna CATEGORIA');
            }
            
            // Contadores
            $vehiculosEncontrados = 0;
            $abonosEncontrados = 0;
            
            while (($data = fgetcsv($handle, 0, ';', '"', '\\')) !== false) {
                $rowCount++;
                
                $codigoalfa = trim($data[$idxCodigoAlfa] ?? '');
                if (empty($codigoalfa)) continue;
                
                $categoriaRaw = trim($data[$idxCategoria] ?? '');
                $categoria = strtoupper($categoriaRaw);
                
                // Limpiar tipobanda
                $tipobandaRaw = $idxTipobanda !== null ? trim($data[$idxTipobanda] ?? '') : '';
                $tipobandaNum = null;
                if (!empty($tipobandaRaw)) {
                    $tipobandaClean = preg_replace('/[^0-9]/', '', $tipobandaRaw);
                    if (is_numeric($tipobandaClean) && $tipobandaClean !== '') {
                        $tipobandaNum = (int)$tipobandaClean;
                    }
                }
                
                // 1. EMPRESAS
                if ($categoria === 'CUENTA MADRE') {
                    if (!in_array($codigoalfa, $empresasCodigos)) {
                        $prefijo = explode('-', $codigoalfa)[0] ?? null;
                        
                        $empresa = [
                            'session_id' => $sessionId,
                            'fecha_carga' => now(),
                            'codigoalfa' => $codigoalfa,
                            'prefijo_codigo' => $prefijo,
                            'altaregist' => ($idxAltaregist !== null && !empty($data[$idxAltaregist])) ? $this->convertirFecha($data[$idxAltaregist]) : null,
                            'codigoalf2' => ($idxCodigoalf2 !== null && !empty($data[$idxCodigoalf2])) ? intval($data[$idxCodigoalf2]) : 0,
                            'nombre_mix' => ($idxNombreMix !== null && !empty($data[$idxNombreMix])) ? trim($data[$idxNombreMix]) : null,
                            'razonsoc' => ($idxRazonsoc !== null && !empty($data[$idxRazonsoc])) ? trim($data[$idxRazonsoc]) : null,
                        ];
                        
                        $empresas[] = $empresa;
                        $empresasCodigos[] = $codigoalfa;
                    }
                }
                
                // 2. VEHÍCULOS
                if ($tipobandaNum === 1 && $categoria !== 'CUENTA MADRE') {
                    $vehiculosEncontrados++;
                    
                    $prefijo = explode('-', $codigoalfa)[0] ?? null;
                    $numero = (strpos($codigoalfa, '-') !== false) ? intval(explode('-', $codigoalfa)[1]) : null;
                    
                    // Buscar empresa por prefijo
                    $empresaCodigo = null;
                    foreach ($empresasCodigos as $ec) {
                        if (strpos($ec, $prefijo . '-') === 0) {
                            $empresaCodigo = $ec;
                            break;
                        }
                    }
                    
                    $vehiculo = [
                        'session_id' => $sessionId,
                        'fecha_carga' => now(),
                        'codigoalfa' => $codigoalfa,
                        'prefijo_codigo' => $prefijo,
                        'numero_alfa' => $numero,
                        'nombre_mix' => ($idxNombreMix !== null && !empty($data[$idxNombreMix])) ? trim($data[$idxNombreMix]) : null,
                        'razonsoc' => ($idxRazonsoc !== null && !empty($data[$idxRazonsoc])) ? trim($data[$idxRazonsoc]) : null,
                        'avl_identificador' => ($idxAvlIdentificador !== null && !empty($data[$idxAvlIdentificador])) ? trim($data[$idxAvlIdentificador]) : null,
                        'avl_patente' => ($idxAvlPatente !== null && !empty($data[$idxAvlPatente])) ? trim($data[$idxAvlPatente]) : null,
                        'avl_marca' => ($idxAvlMarca !== null && !empty($data[$idxAvlMarca])) ? trim($data[$idxAvlMarca]) : null,
                        'avl_modelo' => ($idxAvlModelo !== null && !empty($data[$idxAvlModelo])) ? trim($data[$idxAvlModelo]) : null,
                        'avl_anio' => ($idxAvlAnio !== null && !empty($data[$idxAvlAnio])) ? intval($data[$idxAvlAnio]) : null,
                        'avl_color' => ($idxAvlColor !== null && !empty($data[$idxAvlColor])) ? trim($data[$idxAvlColor]) : null,
                        'ab_alta' => ($idxAbAlta !== null && !empty($data[$idxAbAlta])) ? $this->convertirFecha($data[$idxAbAlta]) : null,
                        'ab_inicio' => ($idxAbInicio !== null && !empty($data[$idxAbInicio])) ? $this->convertirFecha($data[$idxAbInicio]) : null,
                        'empresa_codigoalfa' => $empresaCodigo,
                    ];
                    
                    $vehiculos[] = $vehiculo;
                    
                    // 3. ACCESORIOS - SIEMPRE crear un registro por vehículo (¡ELIMINA EL IF!)
                    $accesoriosData = $this->procesarAccesorios($data[$idxDatosAd4] ?? '');
                    $accesorios[] = array_merge([
                        'session_id' => $sessionId,
                        'fecha_carga' => now(),
                        'codigoalfa' => $codigoalfa,
                    ], $accesoriosData);
                }
                                
                // 4. ABONOS
                if ($tipobandaNum === 6) {
                    $abonosEncontrados++;
                    
                    $prefijo = explode('-', $codigoalfa)[0] ?? null;
                    $numero = (strpos($codigoalfa, '-') !== false) ? intval(explode('-', $codigoalfa)[1]) : null;
                    
                    $abono = [
                        'session_id' => $sessionId,
                        'fecha_carga' => now(),
                        'codigoalfa' => $codigoalfa,
                        'prefijo_codigo' => $prefijo,
                        'numero_alfa' => $numero,
                        'abono_codigo' => ($idxAbonoCodigo !== null && !empty($data[$idxAbonoCodigo])) ? trim($data[$idxAbonoCodigo]) : null,
                        'abono_nombre' => ($idxAbonoNombre !== null && !empty($data[$idxAbonoNombre])) ? trim($data[$idxAbonoNombre]) : null,
                        'abono_precio' => ($idxAbonoPrecio !== null && !empty($data[$idxAbonoPrecio])) ? $this->convertirDecimal($data[$idxAbonoPrecio]) : null,
                        'abono_descuento' => ($idxAbonoDescuento !== null && !empty($data[$idxAbonoDescuento])) ? $this->convertirDecimal($data[$idxAbonoDescuento]) : null,
                        'abono_descmotivo' => ($idxAbonoDescmotivo !== null && !empty($data[$idxAbonoDescmotivo])) ? trim($data[$idxAbonoDescmotivo]) : null,
                    ];
                    
                    $abonos[] = $abono;
                }
                
                // Insertar lotes
                if (count($empresas) >= 500) {
                    $this->insertarEmpresas($empresas);
                    $empresas = [];
                }
                if (count($vehiculos) >= 500) {
                    $this->insertarVehiculos($vehiculos);
                    $vehiculos = [];
                }
                if (count($accesorios) >= 500) {
                    $this->insertarAccesorios($accesorios);
                    $accesorios = [];
                }
                if (count($abonos) >= 500) {
                    $this->insertarAbonos($abonos);
                    $abonos = [];
                }
            }
            fclose($handle);
            
            Log::info("CONTADORES - Vehículos encontrados: $vehiculosEncontrados, Abonos encontrados: $abonosEncontrados");
        }
        
        // Insertar restantes
        if (!empty($empresas)) $this->insertarEmpresas($empresas);
        if (!empty($vehiculos)) $this->insertarVehiculos($vehiculos);
        if (!empty($accesorios)) $this->insertarAccesorios($accesorios);
        if (!empty($abonos)) $this->insertarAbonos($abonos);
        
        $totalEmpresas = count($empresasCodigos);
        $totalVehiculos = DB::table('admin_vehiculos_cargado')->where('session_id', $sessionId)->count();
        $totalAccesorios = DB::table('admin_vehiculos_accesorios_cargado')->where('session_id', $sessionId)->count();
        $totalAbonos = DB::table('admin_vehiculos_abonos_cargado')->where('session_id', $sessionId)->count();
        
        Log::info("=== RESUMEN CARGA COMPLETA ===");
        Log::info("Empresas: $totalEmpresas");
        Log::info("Vehículos: $totalVehiculos");
        Log::info("Accesorios: $totalAccesorios");
        Log::info("Abonos: $totalAbonos");
        Log::info("Total filas procesadas: $rowCount");
        
        return [
            'empresas' => $totalEmpresas,
            'vehiculos' => $totalVehiculos,
            'accesorios' => $totalAccesorios,
            'abonos' => $totalAbonos,
            'total_filas' => $rowCount
        ];
    }
    
    private function procesarAccesorios($datosAd4)
    {
        // Siempre inicializar con ceros
        $accesorios = [
            'enganche' => 0,
            'panico' => 0,
            'cabina' => 0,
            'carga' => 0,
            'corte' => 0,
            'antivandalico' => 0
        ];
        
        if (empty($datosAd4)) {
            return $accesorios;  // Retorna todos ceros
        }
        
        $partes = explode('|', $datosAd4);
        foreach ($partes as $parte) {
            if (strpos($parte, ':') !== false) {
                list($clave, $valor) = explode(':', $parte, 2);
                $clave = trim($clave);
                $valor = trim($valor);
                
                if (isset($this->mapeoAccesorios[$clave]) && (strtoupper($valor) === 'SI' || $valor === '1')) {
                    $accesorios[$this->mapeoAccesorios[$clave]] = 1;
                }
            }
        }
        
        return $accesorios;
    }
        
    private function insertarEmpresas($empresas)
    {
        try {
            DB::table('admin_empresas_cargado')->insert($empresas);
        } catch (\Exception $e) {
            Log::warning('Error en lote de empresas: ' . $e->getMessage());
        }
    }
    
    private function insertarVehiculos($vehiculos)
    {
        foreach ($vehiculos as $v) {
            try {
                DB::table('admin_vehiculos_cargado')->insert($v);
            } catch (\Exception $e) {
                Log::warning('Error insertando vehículo: ' . $e->getMessage() . ' - Codigo: ' . ($v['codigoalfa'] ?? 'unknown'));
            }
        }
    }
    
    private function insertarAccesorios($accesorios)
    {
        try {
            DB::table('admin_vehiculos_accesorios_cargado')->insert($accesorios);
        } catch (\Exception $e) {
            Log::warning('Error en lote de accesorios: ' . $e->getMessage());
        }
    }
    
    private function insertarAbonos($abonos)
    {
        try {
            DB::table('admin_vehiculos_abonos_cargado')->insert($abonos);
        } catch (\Exception $e) {
            Log::warning('Error en lote de abonos: ' . $e->getMessage());
        }
    }
    
    private function convertirFecha($fecha)
    {
        if (empty($fecha)) return null;
        try {
            if (is_numeric($fecha)) {
                $unix = ($fecha - 25569) * 86400;
                return date('Y-m-d', $unix);
            }
            $result = date('Y-m-d', strtotime($fecha));
            return $result !== '1970-01-01' ? $result : null;
        } catch (\Exception $e) {
            return null;
        }
    }
    
    private function convertirDecimal($valor)
    {
        if (empty($valor)) return null;
        $valor = str_replace(',', '.', preg_replace('/[^\d,.-]/', '', $valor));
        return floatval($valor);
    }
    
    private function limpiarTodasLasCargas($sessionId)
    {
        DB::table('admin_empresas_cargado')->where('session_id', $sessionId)->delete();
        DB::table('admin_vehiculos_cargado')->where('session_id', $sessionId)->delete();
        DB::table('admin_vehiculos_accesorios_cargado')->where('session_id', $sessionId)->delete();
        DB::table('admin_vehiculos_abonos_cargado')->where('session_id', $sessionId)->delete();
        
        Log::info("Tablas limpiadas para session: $sessionId");
    }


/**
 * Compara los datos cargados vs los originales
 */
public function comparar(Request $request)
{
    $sessionId = Session::getId();
    
    // Verificar si hay datos cargados
    $hayDatos = DB::table('admin_empresas_cargado')->where('session_id', $sessionId)->exists();
    if (!$hayDatos) {
        return response()->json([
            'success' => false,
            'error' => 'No hay datos cargados. Primero cargue un archivo.'
        ], 400);
    }
    
    // 1. COMPARAR EMPRESAS
    $empresas = $this->compararEmpresas($sessionId);
    
    // 2. COMPARAR VEHÍCULOS
    $vehiculos = $this->compararVehiculos($sessionId);
    
    // 3. COMPARAR ACCESORIOS
    $accesorios = $this->compararAccesorios($sessionId);
    
    // 4. COMPARAR ABONOS
    $abonos = $this->compararAbonos($sessionId);
    
    return response()->json([
        'success' => true,
        'data' => [
            'empresas' => $empresas,
            'vehiculos' => $vehiculos,
            'accesorios' => $accesorios,
            'abonos' => $abonos,
            'resumen' => [
                'empresas_agregar' => count($empresas['para_agregar']),
                'empresas_eliminar' => count($empresas['para_eliminar']),
                'empresas_actualizar' => count($empresas['para_actualizar']),
                'vehiculos_agregar' => count($vehiculos['para_agregar']),
                'vehiculos_eliminar' => count($vehiculos['para_eliminar']),
                'accesorios_agregar' => count($accesorios['para_agregar']),
                'accesorios_eliminar' => count($accesorios['para_eliminar']),
                'abonos_agregar' => count($abonos['para_agregar']),
                'abonos_eliminar' => count($abonos['para_eliminar']),
            ]
        ]
    ]);
}


    private function compararVehiculos($sessionId)
    {
        $vehiculosDB = DB::table('admin_vehiculos')
            ->select('codigoalfa', 'prefijo_codigo', 'numero_alfa', 'avl_patente', 'avl_identificador', 
                    'avl_marca', 'avl_modelo', 'avl_anio', 'avl_color', 'nombre_mix', 'razonsoc')
            ->get()
            ->keyBy('codigoalfa');
        
        $vehiculosCargados = DB::table('admin_vehiculos_cargado')
            ->where('session_id', $sessionId)
            ->select('codigoalfa', 'prefijo_codigo', 'numero_alfa', 'avl_patente', 'avl_identificador',
                    'avl_marca', 'avl_modelo', 'avl_anio', 'avl_color', 'nombre_mix', 'razonsoc', 'empresa_codigoalfa')
            ->get()
            ->keyBy('codigoalfa');
        
        $paraAgregar = [];
        $paraEliminar = [];
        
        // Vehículos para agregar (en cargado pero no en DB)
        foreach ($vehiculosCargados as $codigo => $cargado) {
            if (!$vehiculosDB->has($codigo)) {
                $paraAgregar[] = [
                    'codigoalfa' => $cargado->codigoalfa,
                    'prefijo_codigo' => $cargado->prefijo_codigo,
                    'numero_alfa' => $cargado->numero_alfa,
                    'avl_patente' => $cargado->avl_patente,
                    'nombre_mix' => $cargado->nombre_mix,
                ];
            }
        }
        
        // Vehículos para eliminar (en DB pero no en cargado)
        foreach ($vehiculosDB as $codigo => $db) {
            if (!$vehiculosCargados->has($codigo)) {
                $paraEliminar[] = [
                    'codigoalfa' => $db->codigoalfa,
                    'avl_patente' => $db->avl_patente,
                    'nombre_mix' => $db->nombre_mix,
                ];
            }
        }
        
        return [
            'para_agregar' => $paraAgregar,
            'para_eliminar' => $paraEliminar,
            'total_db' => $vehiculosDB->count(),
            'total_cargado' => $vehiculosCargados->count(),
        ];
    }
private function compararAccesorios($sessionId)
{
    $accesoriosDB = DB::table('admin_vehiculos_accesorios')
        ->select('codigoalfa', 'enganche', 'panico', 'cabina', 'carga', 'corte', 'antivandalico')
        ->get()
        ->keyBy('codigoalfa');
    
    $accesoriosCargados = DB::table('admin_vehiculos_accesorios_cargado')
        ->where('session_id', $sessionId)
        ->select('codigoalfa', 'enganche', 'panico', 'cabina', 'carga', 'corte', 'antivandalico')
        ->get()
        ->keyBy('codigoalfa');
    
    $paraAgregar = [];
    $paraActualizar = [];
    $paraEliminar = [];  // ← AGREGAR ESTA LÍNEA
    
    foreach ($accesoriosCargados as $codigo => $cargado) {
        if (!$accesoriosDB->has($codigo)) {
            $paraAgregar[] = (array) $cargado;
        } else {
            $db = $accesoriosDB[$codigo];
            $diferencias = [];
            
            $campos = ['enganche', 'panico', 'cabina', 'carga', 'corte', 'antivandalico'];
            foreach ($campos as $campo) {
                if ($db->$campo != $cargado->$campo) {
                    $diferencias[] = [
                        'campo' => $campo,
                        'valor_actual' => $db->$campo,
                        'valor_nuevo' => $cargado->$campo,
                    ];
                }
            }
            
            if (!empty($diferencias)) {
                $paraActualizar[] = [
                    'codigoalfa' => $codigo,
                    'diferencias' => $diferencias,
                ];
            }
        }
    }
    
    return [
        'para_agregar' => $paraAgregar,
        'para_actualizar' => $paraActualizar,
        'para_eliminar' => $paraEliminar,  // ← AGREGAR ESTA LÍNEA
        'total_db' => $accesoriosDB->count(),
        'total_cargado' => $accesoriosCargados->count(),
    ];
}

// Reemplaza el método compararAbonos
private function compararAbonos($sessionId)
{
    $abonosDB = DB::table('admin_vehiculos_abonos')
        ->select('codigoalfa', 'abono_codigo', 'abono_nombre', 'abono_precio', 'abono_descuento')
        ->get()
        ->keyBy(function($item) {
            return $item->codigoalfa . '|' . $item->abono_codigo;
        });
    
    $abonosCargados = DB::table('admin_vehiculos_abonos_cargado')
        ->where('session_id', $sessionId)
        ->select('codigoalfa', 'abono_codigo', 'abono_nombre', 'abono_precio', 'abono_descuento')
        ->get()
        ->keyBy(function($item) {
            return $item->codigoalfa . '|' . $item->abono_codigo;
        });
    
    $paraAgregar = [];
    $paraEliminar = [];  // ← AGREGAR ESTA LÍNEA
    $paraActualizar = [];  // ← AGREGAR ESTA LÍNEA
    
    foreach ($abonosCargados as $key => $cargado) {
        if (!$abonosDB->has($key)) {
            $paraAgregar[] = (array) $cargado;
        }
    }
    
    return [
        'para_agregar' => $paraAgregar,
        'para_eliminar' => $paraEliminar,  // ← AGREGAR ESTA LÍNEA
        'para_actualizar' => $paraActualizar,  // ← AGREGAR ESTA LÍNEA
        'total_db' => $abonosDB->count(),
        'total_cargado' => $abonosCargados->count(),
    ];
}

// También verifica el método compararEmpresas
private function compararEmpresas($sessionId)
{
    $empresasDB = DB::table('admin_empresas')
        ->select('id', 'codigoalfa', 'prefijo_codigo', 'codigoalf2', 'nombre_mix', 'razonsoc', 'altaregist')
        ->get()
        ->keyBy('codigoalfa');
    
    $empresasCargadas = DB::table('admin_empresas_cargado')
        ->where('session_id', $sessionId)
        ->select('codigoalfa', 'prefijo_codigo', 'codigoalf2', 'nombre_mix', 'razonsoc', 'altaregist')
        ->get()
        ->keyBy('codigoalfa');
    
    $paraAgregar = [];
    $paraEliminar = [];
    $paraActualizar = [];
    
    // Empresas para agregar (en cargado pero no en DB)
    foreach ($empresasCargadas as $codigo => $cargada) {
        if (!$empresasDB->has($codigo)) {
            $paraAgregar[] = [
                'codigoalfa' => $cargada->codigoalfa,
                'prefijo_codigo' => $cargada->prefijo_codigo,
                'codigoalf2' => $cargada->codigoalf2,
                'nombre_mix' => $cargada->nombre_mix,
                'razonsoc' => $cargada->razonsoc,
                'altaregist' => $cargada->altaregist,
            ];
        }
    }
    
    // Empresas para eliminar (en DB pero no en cargado)
    foreach ($empresasDB as $codigo => $db) {
        if (!$empresasCargadas->has($codigo)) {
            $vehiculosCount = DB::table('admin_vehiculos')->where('empresa_id', $db->id)->count();
            $paraEliminar[] = [
                'id' => $db->id,
                'codigoalfa' => $db->codigoalfa,
                'nombre_mix' => $db->nombre_mix,
                'razonsoc' => $db->razonsoc,
                'vehiculos_asociados' => $vehiculosCount,
            ];
        }
    }
    
    // Empresas para actualizar (existen en ambos pero con diferencias)
    foreach ($empresasCargadas as $codigo => $cargada) {
        if ($empresasDB->has($codigo)) {
            $db = $empresasDB[$codigo];
            $diferencias = [];
            
            if ($db->nombre_mix != $cargada->nombre_mix) {
                $diferencias[] = [
                    'campo' => 'nombre_mix',
                    'valor_actual' => $db->nombre_mix,
                    'valor_nuevo' => $cargada->nombre_mix,
                ];
            }
            if ($db->razonsoc != $cargada->razonsoc) {
                $diferencias[] = [
                    'campo' => 'razonsoc',
                    'valor_actual' => $db->razonsoc,
                    'valor_nuevo' => $cargada->razonsoc,
                ];
            }
            if ($db->prefijo_codigo != $cargada->prefijo_codigo) {
                $diferencias[] = [
                    'campo' => 'prefijo_codigo',
                    'valor_actual' => $db->prefijo_codigo,
                    'valor_nuevo' => $cargada->prefijo_codigo,
                ];
            }
            
            if (!empty($diferencias)) {
                $paraActualizar[] = [
                    'id' => $db->id,
                    'codigoalfa' => $codigo,
                    'diferencias' => $diferencias,
                ];
            }
        }
    }
    
    return [
        'para_agregar' => $paraAgregar,
        'para_eliminar' => $paraEliminar,
        'para_actualizar' => $paraActualizar,
    ];
}

}