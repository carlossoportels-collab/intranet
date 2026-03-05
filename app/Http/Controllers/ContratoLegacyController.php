<?php
// app/Http/Controllers/ContratoLegacyController.php

namespace App\Http\Controllers;

use App\Models\ContratoLegacy;
use Symfony\Component\HttpFoundation\BinaryFileResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class ContratoLegacyController extends Controller
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

        $contrato = ContratoLegacy::find($id);
        
        if (!$contrato) {
            abort(404, 'Contrato no encontrado');
        }

        // 📌 IMPORTANTE: Los contratos legacy tienen nombre como "contrato-501528-CLEANE SRL" (sin extensión)
        // Primero, buscar archivos que comiencen con "contrato-{id}"
        $pattern = "contrato-{$id}-*";
        
        // Rutas donde buscar
        $directories = [
            public_path("storage/contratos_legacy/"),
            storage_path("app/public/contratos_legacy/"),
            storage_path("app/contratos_legacy/"),
        ];

        $filePath = null;
        $filename = null;

        foreach ($directories as $directory) {
            if (!is_dir($directory)) {
                continue;
            }
            
            // Buscar archivos que coincidan con el patrón
            $files = glob($directory . $pattern . '.pdf');
            
            if (!empty($files)) {
                $filePath = $files[0]; // Tomar el primer archivo encontrado
                $filename = basename($filePath);
                Log::info("✅ PDF encontrado para contrato legacy {$id}", [
                    'path' => $filePath,
                    'filename' => $filename
                ]);
                break;
            }
        }

        if (!$filePath) {
            Log::error('PDF no encontrado para contrato legacy', [
                'id' => $id,
                'pattern' => $pattern,
                'directories' => $directories
            ]);
            abort(404, 'Archivo PDF no encontrado');
        }

        return response()->file($filePath, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => $disposition . '; filename="' . $filename . '"'
        ]);
    }
}