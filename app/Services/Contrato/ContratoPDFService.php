<?php
// app/Services/Contrato/ContratoPDFService.php

namespace App\Services\Contrato;

use App\Models\Contrato;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;

class ContratoPDFService
{
    private ContratoService $contratoService;

    public function __construct(ContratoService $contratoService)
    {
        $this->contratoService = $contratoService;
    }

    /**
     * Cargar todas las relaciones necesarias para el contrato
     */
    public function cargarRelaciones(Contrato $contrato): Contrato
    {
        return $contrato->load([
            'vehiculos',
            'debitoCbu',
            'debitoTarjeta',
            'estado',
            'empresa',
            'presupuesto' => function($query) {
                $query->with([
                    'tasa',
                    'abono',
                    'promocion.productos',
                    'agregados' => function($q) {
                        $q->with('productoServicio.tipo');
                    }
                ]);
            }
        ]);
    }

    /**
     * Generar y mostrar PDF (para vista en navegador)
     */
    public function generarPDFParaVista(Contrato $contrato)
    {
        $contrato = $this->cargarRelaciones($contrato);
        $compania = $this->contratoService->obtenerDatosCompania($contrato);
        
        return view('pdf.contrato', [
            'contrato' => $contrato,
            'compania' => $compania
        ]);
    }

    /**
     * Generar y descargar PDF
     */
    public function generarPDFParaDescarga(Contrato $contrato)
    {
        try {
            $contrato = $this->cargarRelaciones($contrato);
            $compania = $this->contratoService->obtenerDatosCompania($contrato);
            
            // Usar el facade Pdf con opciones habilitadas
            $pdf = Pdf::loadView('pdf.contrato', [
                'contrato' => $contrato,
                'compania' => $compania
            ])
            ->setPaper('A4')
            ->setOptions([
                'defaultFont' => 'sans-serif',
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'isPhpEnabled' => true,  // 🔥 Esto habilita <script type="text/php">
                'chroot' => public_path(),
            ]);

            $filename = 'contrato-' . str_pad($contrato->id, 8, '0', STR_PAD_LEFT) . '.pdf';
            return $pdf->download($filename);

        } catch (\Exception $e) {
            Log::error('Error generando PDF para descarga:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            throw $e;
        }
    }

    /**
     * Generar PDF temporal para email
     */
    public function generarPDFTemporal(Contrato $contrato): array
    {
        try {
            $contrato = $this->cargarRelaciones($contrato);
            $compania = $this->contratoService->obtenerDatosCompania($contrato);
            
            $pdf = Pdf::loadView('pdf.contrato', [
                'contrato' => $contrato,
                'compania' => $compania
            ])
            ->setPaper('A4')
            ->setOptions([
                'defaultFont' => 'sans-serif',
                'isHtml5ParserEnabled' => true,
                'isRemoteEnabled' => true,
                'isPhpEnabled' => true,  // 🔥 Esto habilita <script type="text/php">
                'chroot' => public_path(),
            ]);

            $filename = "contrato-{$contrato->id}-" . time() . ".pdf";
            $path = storage_path("app/temp/{$filename}");
            
            if (!file_exists(storage_path('app/temp'))) {
                mkdir(storage_path('app/temp'), 0755, true);
            }
            
            file_put_contents($path, $pdf->output());
            $this->limpiarArchivosTemporales();

            $numeroContrato = str_pad($contrato->id, 8, '0', STR_PAD_LEFT);

            return [
                'success' => true,
                'url' => "/temp/contrato/{$contrato->id}?v=" . time(),
                'filename' => "Contrato_{$numeroContrato}.pdf"
            ];

        } catch (\Exception $e) {
            Log::error('Error generando PDF temporal:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return [
                'success' => false,
                'error' => 'Error al generar el PDF: ' . $e->getMessage()
            ];
        }
    }

    /**
     * Limpiar archivos temporales antiguos
     */
    private function limpiarArchivosTemporales(): void
    {
        $tempDir = storage_path('app/temp');
        if (!file_exists($tempDir)) return;
        
        $archivos = glob($tempDir . '/*.pdf');
        $now = time();
        
        foreach ($archivos as $archivo) {
            if (is_file($archivo) && $now - filemtime($archivo) > 600) {
                unlink($archivo);
            }
        }
    }
}