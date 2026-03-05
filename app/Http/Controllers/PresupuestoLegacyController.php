<?php
// app/Http/Controllers/PresupuestoLegacyController.php

namespace App\Http\Controllers;

use App\Models\PresupuestoLegacy;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Illuminate\Http\Request;

class PresupuestoLegacyController extends Controller
{
    /**
     * Ver PDF en el navegador
     */
    public function verPdf($id): BinaryFileResponse
    {
        return $this->getPdfResponse($id, 'inline');
    }

    /**
     * Descargar PDF
     */
    public function descargarPdf($id): BinaryFileResponse
    {
        return $this->getPdfResponse($id, 'attachment');
    }

    /**
     * Obtener respuesta del PDF
     */
    private function getPdfResponse($id, $disposition): BinaryFileResponse
    {
        
        // Verificar autenticación
        if (!auth()->check()) {
            abort(403, 'No autenticado');
        }

        $presupuesto = PresupuestoLegacy::find($id);
        
        if (!$presupuesto) {
            abort(404, 'Presupuesto no encontrado');
        }

        // 📌 IMPORTANTE: Buscar el archivo con el nombre correcto (presupuesto_ID.pdf)
        $filename = "presupuesto_{$id}.pdf";
        
        // Rutas donde buscar
        $paths = [
            // Ruta principal según storage link
            public_path("storage/presupuestos_legacy/{$filename}"),
            // Ruta directa en storage
            storage_path("app/public/presupuestos_legacy/{$filename}"),
            // Ruta alternativa
            storage_path("app/presupuestos_legacy/{$filename}"),
        ];

        // Si hay pdf_path en la BD, también probar esa ruta exacta
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
            \Log::error('PDF no encontrado para presupuesto legacy', [
                'id' => $id,
                'pdf_path_db' => $presupuesto->pdf_path,
                'paths_buscadas' => $paths
            ]);
            abort(404, 'Archivo PDF no encontrado');
        }

        $nombreArchivo = ($presupuesto->nombre_presupuesto ?? "presupuesto_{$id}") . '.pdf';
        
        return response()->file($filePath, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => $disposition . '; filename="' . $nombreArchivo . '"'
        ]);
    }
}