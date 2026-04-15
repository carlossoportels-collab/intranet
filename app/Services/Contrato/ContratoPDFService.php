<?php
// app/Services/Contrato/ContratoPDFService.php

namespace App\Services\Contrato;

use App\Models\Contrato;
use Barryvdh\DomPDF\Facade\Pdf;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

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
 * Generar nombre de archivo sanitizado
 */
private function generarNombreArchivo(Contrato $contrato, string $suffix = ''): string
{
    $numeroContrato = str_pad($contrato->id, 8, '0', STR_PAD_LEFT);
    
    // Obtener razón social de la empresa
    $razonSocial = '';
    if ($contrato->empresa && $contrato->empresa->razon_social) {
        // Sanitizar: eliminar caracteres especiales, reemplazar espacios por guiones
        $razonSocial = Str::slug($contrato->empresa->razon_social, '-');
        // Limitar longitud para evitar nombres demasiado largos
        $razonSocial = Str::limit($razonSocial, 50, '');
        $razonSocial = '-' . $razonSocial;
    }
    
    // ✅ SIN timestamp
    $filename = "contrato-{$numeroContrato}{$razonSocial}{$suffix}.pdf";
    
    return $filename;
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

        // Generar nombre SIN timestamp
        $numeroContrato = str_pad($contrato->id, 8, '0', STR_PAD_LEFT);
        $razonSocial = '';
        if ($contrato->empresa && $contrato->empresa->razon_social) {
            $razonSocial = Str::slug($contrato->empresa->razon_social, '-');
            $razonSocial = Str::limit($razonSocial, 50, '');
            $razonSocial = '-' . $razonSocial;
        }
        
        // ✅ SIN timestamp al final
        $filename = "contrato-{$numeroContrato}{$razonSocial}.pdf";
        $path = storage_path("app/temp/{$filename}");
        
        if (!file_exists(storage_path('app/temp'))) {
            mkdir(storage_path('app/temp'), 0755, true);
        }
        
        file_put_contents($path, $pdf->output());
        $this->limpiarArchivosTemporales();

        return [
            'success' => true,
            'url' => "/temp/contrato/{$contrato->id}?v=" . time(), // La versión va como query param, no en el nombre
            'filename' => $filename
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