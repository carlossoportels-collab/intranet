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
     * Generar nombre del archivo con razón social de la empresa
     */
    private function generarNombreArchivo(Contrato $contrato): string
    {
        $numeroContrato = str_pad($contrato->id, 8, '0', STR_PAD_LEFT);
        
        // Obtener razón social de la empresa
        $razonSocial = '';
        if ($contrato->empresa && !empty($contrato->empresa->razon_social)) {
            $razonSocial = $contrato->empresa->razon_social;
        }
        
        // Si no hay razón social, usar el nombre del cliente como fallback
        if (empty($razonSocial) && !empty($contrato->cliente_nombre_completo)) {
            $razonSocial = $contrato->cliente_nombre_completo;
        }
        
        // Si aún está vacío, usar solo el número
        if (empty($razonSocial)) {
            return "Contrato_{$numeroContrato}.pdf";
        }
        
        // Limpiar caracteres especiales para el nombre del archivo
        $nombreLimpio = preg_replace('/[^a-zA-Z0-9áéíóúñÑ\s-]/', '', $razonSocial);
        $nombreLimpio = str_replace(' ', '_', $nombreLimpio);
        
        // Limitar longitud máxima (ej: 50 caracteres para no exceder)
        if (strlen($nombreLimpio) > 50) {
            $nombreLimpio = substr($nombreLimpio, 0, 47) . '...';
        }
        
        return $nombreLimpio . '_Contrato_' . $numeroContrato . '.pdf';
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
                'isPhpEnabled' => true,
                'chroot' => public_path(),
            ]);

            $filename = $this->generarNombreArchivo($contrato);
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
                'isPhpEnabled' => true,
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
            
            // Generar el nombre amigable para el email
            $nombreAmigable = $this->generarNombreArchivo($contrato);

            return [
                'success' => true,
                'url' => "/temp/contrato/{$contrato->id}?v=" . time(),
                'filename' => $nombreAmigable
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