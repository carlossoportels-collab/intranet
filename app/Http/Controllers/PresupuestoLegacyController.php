<?php
// app/Http/Controllers/PresupuestoLegacyController.php

namespace App\Http\Controllers;

use App\Models\PresupuestoLegacy;
use Illuminate\Http\Request;
use Inertia\Inertia;

class PresupuestoLegacyController extends Controller
{
    /**
     * Listado de presupuestos legacy
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        
        $query = PresupuestoLegacy::with(['lead', 'prefijo']);
        
        // Restricción: comerciales solo ven sus propios presupuestos
        if (!$user->ve_todas_cuentas && $user->es_comercial) {
            // Obtener el prefijo_id del comercial a través de personal->comercial
            $prefijoId = null;
            
            if ($user->personal && $user->personal->comercial) {
                $prefijoId = $user->personal->comercial->prefijo_id;
            }
            
            if ($prefijoId) {
                $query->where('prefijo_id', $prefijoId);
            } else {
                // Si el comercial no tiene prefijo asignado, no mostrar nada
                $query->whereRaw('1 = 0');
            }
        }
        
        // Ordenar por fecha más reciente primero
        $presupuestos = $query->orderBy('created_at', 'desc')
            ->paginate(15)
            ->through(function($presupuesto) {
                // Obtener resolución del prefijo (formato: código - nombre)
                $resolucion = '';
                if ($presupuesto->prefijo) {
                    $resolucion = $presupuesto->prefijo->codigo ?? '';
                    if ($presupuesto->prefijo->nombre) {
                        $resolucion .= $resolucion ? ' - ' . $presupuesto->prefijo->nombre : $presupuesto->prefijo->nombre;
                    }
                }
                
                return [
                    'id' => $presupuesto->id,
                    'nombre' => $presupuesto->nombre_presupuesto ?? "Presupuesto #{$presupuesto->id}",
                    'fecha' => $presupuesto->created_at ? $presupuesto->created_at->format('d/m/Y H:i') : 'Sin fecha',
                    'fecha_original' => $presupuesto->created_at?->toISOString(),
                    'total' => $presupuesto->total ?? 0,
                    'cliente' => $presupuesto->lead?->nombre_completo ?? 'Sin cliente',
                    'cliente_id' => $presupuesto->lead?->id,
                    'telefono' => $presupuesto->lead?->telefono,
                    'email' => $presupuesto->lead?->email,
                    'resolucion' => $resolucion,
                    'prefijo_id' => $presupuesto->prefijo_id,
                    'tiene_pdf' => !is_null($presupuesto->pdf_path),
                    'pdf_url' => $presupuesto->pdf_url,
                ];
            });
        
        return Inertia::render('Comercial/PresupuestosLegacy/Index', [
            'presupuestos' => $presupuestos
        ]);
    }
    
    /**
     * Ver PDF en el navegador
     */
    public function verPdf($id)
    {
        return $this->getPdfResponse($id, 'inline');
    }

    /**
     * Descargar PDF
     */
    public function descargarPdf($id)
    {
        return $this->getPdfResponse($id, 'attachment');
    }

    /**
     * Obtener respuesta del PDF
     */
    private function getPdfResponse($id, $disposition)
    {
        if (!auth()->check()) {
            abort(403, 'No autenticado');
        }

        $presupuesto = PresupuestoLegacy::with(['lead', 'prefijo'])->find($id);
        
        if (!$presupuesto) {
            abort(404, 'Presupuesto no encontrado');
        }
        
        // Verificar permisos: comerciales solo ven sus propios presupuestos
        $user = auth()->user();
        if (!$user->ve_todas_cuentas && $user->es_comercial) {
            // Obtener el prefijo_id del comercial
            $prefijoId = null;
            
            if ($user->personal && $user->personal->comercial) {
                $prefijoId = $user->personal->comercial->prefijo_id;
            }
            
            // Verificar si el presupuesto pertenece al comercial
            if (!$prefijoId || $presupuesto->prefijo_id !== $prefijoId) {
                abort(403, 'No tiene permiso para ver este presupuesto');
            }
        }

        // Buscar el archivo
        $filename = "presupuesto_{$id}.pdf";
        
        $paths = [
            public_path("storage/presupuestos_legacy/{$filename}"),
            storage_path("app/public/presupuestos_legacy/{$filename}"),
            storage_path("app/presupuestos_legacy/{$filename}"),
        ];

        if (!empty($presupuesto->pdf_path)) {
            array_unshift($paths, storage_path("app/public/{$presupuesto->pdf_path}"));
        }

        $filePath = null;
        foreach ($paths as $path) {
            if (file_exists($path)) {
                $filePath = $path;
                break;
            }
        }

        if (!$filePath) {
            abort(404, 'Archivo PDF no encontrado');
        }

        $nombreArchivo = ($presupuesto->nombre_presupuesto ?? "presupuesto_{$id}") . '.pdf';
        
        return response()->file($filePath, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => $disposition . '; filename="' . $nombreArchivo . '"'
        ]);
    }
}