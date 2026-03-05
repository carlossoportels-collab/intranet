<?php
// app/Services/Lead/LeadContratoService.php

namespace App\Services\Lead;

use App\Models\Contrato;
use App\Models\ContratoLegacy;
use App\Models\Lead;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class LeadContratoService
{
    /**
     * Obtiene contratos nuevos y legacy unificados para un lead
     */
    public function getContratosUnificados(Lead $lead): array
    {
        $contratosNuevos = $this->getContratosNuevos($lead->id);
        $contratosLegacy = $this->getContratosLegacy($lead->id);
        
        return [
            'nuevos' => $contratosNuevos,
            'legacy' => $contratosLegacy,
            'total' => count($contratosNuevos) + count($contratosLegacy),
            'total_nuevos' => count($contratosNuevos),
            'total_legacy' => count($contratosLegacy),
        ];
    }

    /**
     * Obtiene contratos del sistema nuevo
     */
    protected function getContratosNuevos(int $leadId): Collection
    {
        return Contrato::with(['empresa', 'estado'])
            ->where('lead_id', $leadId)
            ->where('activo', true)
            ->orderBy('created', 'desc')
            ->get()
            ->map(function ($contrato) {
                return [
                    'id' => $contrato->id,
                    'tipo' => 'nuevo',
                    'numero_contrato' => $contrato->numero_contrato,
                    'fecha_emision' => $contrato->fecha_emision?->format('d/m/Y H:i') ?? 'N/A',
                    'fecha_original' => $contrato->fecha_emision,
                    'estado' => $contrato->estado?->nombre ?? 'Activo',
                    'cliente_nombre' => $contrato->cliente_nombre_completo,
                    'empresa_razon_social' => $contrato->empresa_razon_social,
                    'total_mensual' => $contrato->presupuesto_total_mensual,
                    'total_inversion' => $contrato->presupuesto_total_inversion,
                    'cantidad_vehiculos' => $contrato->presupuesto_cantidad_vehiculos,
                    'vendedor' => $contrato->vendedor_nombre,
                    'tiene_pdf' => true,
                    'pdf_url' => "/comercial/contratos/{$contrato->id}/pdf",
                    'metadata' => [
                        'presupuesto_referencia' => $contrato->presupuesto_referencia,
                        'promocion' => $contrato->presupuesto_promocion,
                        'contacto_email' => $contrato->cliente_email,
                        'contacto_telefono' => $contrato->cliente_telefono,
                    ]
                ];
            });
    }

    /**
     * Verifica si existe PDF para contrato legacy
     */
    protected function tienePdfLegacy(int $contratoId): bool
    {
        // Los contratos legacy tienen nombre como "contrato-{id}-NOMBRE.pdf"
        $pattern = "contrato-{$contratoId}-*.pdf";
        
        $directories = [
            public_path("storage/contratos_legacy/"),
            storage_path("app/public/contratos_legacy/"),
            storage_path("app/contratos_legacy/"),
        ];

        foreach ($directories as $directory) {
            if (!is_dir($directory)) {
                continue;
            }
            
            $files = glob($directory . $pattern);
            if (!empty($files)) {
                Log::info("✅ PDF encontrado para contrato legacy {$contratoId}", [
                    'file' => basename($files[0])
                ]);
                return true;
            }
        }
        
        Log::warning("❌ PDF NO encontrado para contrato legacy {$contratoId}", [
            'pattern' => $pattern,
            'directories' => $directories
        ]);
        
        return false;
    }

    /**
     * Obtiene URL del PDF legacy
     */
    protected function getPdfUrlLegacy(int $contratoId): ?string
    {
        if ($this->tienePdfLegacy($contratoId)) {
            return "/contratos-legacy/{$contratoId}/pdf";
        }
        return null;
    }

    /**
     * Obtiene contratos del sistema legacy
     */
    protected function getContratosLegacy(int $leadId): Collection
    {
        return ContratoLegacy::porLead($leadId)
            ->orderBy('created', 'desc')
            ->get()
            ->map(function ($contrato) {
                
                // Verificar si tiene PDF
                $tienePdf = $this->tienePdfLegacy($contrato->id);
                
                // Obtener URL (si tiene PDF)
                $pdfUrl = $tienePdf ? $this->getPdfUrlLegacy($contrato->id) : null;
                
                // Intentar obtener el nombre del archivo para mostrarlo (opcional)
                $nombreArchivo = null;
                if ($tienePdf) {
                    $pattern = "contrato-{$contrato->id}-*.pdf";
                    $directories = [
                        public_path("storage/contratos_legacy/"),
                        storage_path("app/public/contratos_legacy/"),
                    ];
                    
                    foreach ($directories as $directory) {
                        if (!is_dir($directory)) continue;
                        $files = glob($directory . $pattern);
                        if (!empty($files)) {
                            $nombreArchivo = basename($files[0]);
                            break;
                        }
                    }
                }
                
                Log::info("Procesando contrato legacy ID: {$contrato->id}", [
                    'lead_id' => $contrato->lead_id,
                    'nombre_completo' => $contrato->nombre_completo,
                    'tienePdf' => $tienePdf,
                    'pdfUrl' => $pdfUrl,
                    'archivo' => $nombreArchivo
                ]);
                
                return [
                    'id' => $contrato->id,
                    'tipo' => 'legacy',
                    'numero_contrato' => $contrato->numero_contrato,
                    'nombre_completo' => $contrato->nombre_completo,
                    'razon_social' => $contrato->razon_social,
                    'fecha' => $contrato->created?->format('d/m/Y H:i') ?? 'N/A',
                    'fecha_original' => $contrato->created,
                    'tiene_pdf' => $tienePdf,
                    'pdf_url' => $pdfUrl,
                    'metadata' => [
                        'lead_id' => $contrato->lead_id,
                        'nombre_archivo' => $nombreArchivo,
                    ]
                ];
            });
    }

    /**
     * Obtiene estadísticas de contratos
     */
    public function getEstadisticas(Lead $lead): array
    {
        $contratos = $this->getContratosUnificados($lead);
        
        return [
            'total_contratos' => $contratos['total'],
            'total_nuevos' => $contratos['total_nuevos'],
            'total_legacy' => $contratos['total_legacy'],
            'total_con_pdf' => collect($contratos['nuevos'])->filter(fn($c) => $c['tiene_pdf'])->count() +
                               collect($contratos['legacy'])->filter(fn($c) => $c['tiene_pdf'])->count(),
        ];
    }
}