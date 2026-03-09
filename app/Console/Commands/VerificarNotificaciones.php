<?php
// app/Console/Commands/VerificarNotificaciones.php

namespace App\Console\Commands;

use App\Services\Notificaciones\CumpleaniosNotificationService;
use App\Services\Lead\Notifications\LeadCommentNotificationService;
use App\Services\Lead\Notifications\LeadAssignmentNotificationService;
use App\Services\Lead\Notifications\LeadExpiredNotificationService;
use App\Services\Presupuesto\PresupuestoNotificationService;
use App\Services\Contrato\ContratoNotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class VerificarNotificaciones extends Command
{
    protected $signature = 'notificaciones:verificar';
    protected $description = 'Verifica y genera notificaciones automáticas';
    
    protected $cumpleaniosNotificationService;
    protected $commentNotificationService;
    protected $assignmentNotificationService;
    protected $expiredNotificationService;
    protected $presupuestoNotificationService;
    protected $contratoNotificationService;

    public function __construct(
        CumpleaniosNotificationService $cumpleaniosNotificationService,
        LeadCommentNotificationService $commentNotificationService,
        LeadAssignmentNotificationService $assignmentNotificationService,
        LeadExpiredNotificationService $expiredNotificationService,
        PresupuestoNotificationService $presupuestoNotificationService,
        ContratoNotificationService $contratoNotificationService
    ) {
        parent::__construct();
        $this->cumpleaniosNotificationService = $cumpleaniosNotificationService;
        $this->commentNotificationService = $commentNotificationService;
        $this->assignmentNotificationService = $assignmentNotificationService;
        $this->expiredNotificationService = $expiredNotificationService;
        $this->presupuestoNotificationService = $presupuestoNotificationService;
        $this->contratoNotificationService = $contratoNotificationService;
    }
    
    public function handle()
    {
        $this->info('[' . now()->format('Y-m-d H:i:s') . '] Iniciando verificación de notificaciones...');
        
        try {
            // ===== CUMPLEAÑOS =====
            $this->info('Verificando cumpleaños...');
            $resultadoCumpleanios = $this->cumpleaniosNotificationService->verificarCumpleanios();
            $this->info("✓ Cumpleaños procesados: {$resultadoCumpleanios['procesados']}");
            $this->info("✓ Notificaciones de cumpleaños: {$resultadoCumpleanios['notificaciones']}");
            
            // ===== LEADS VENCIDOS =====
            $this->info('Verificando leads vencidos (30 días)...');
            $resultadoVencidos = $this->expiredNotificationService->verificarLeadsVencidos();
            $this->info("✓ Leads vencidos procesados: {$resultadoVencidos['procesados']}");
            $this->info("✓ Notificaciones de vencimiento: {$resultadoVencidos['notificaciones']}");
            
            // ===== LEADS =====
            $this->info('✓ Notificaciones de leads: se manejan al asignar');
            
            // ===== PRESUPUESTOS =====
            $this->info('Verificando presupuestos...');
            $resultadoPresupuestos = $this->presupuestoNotificationService->verificarPresupuestos();
            $this->info("✓ Presupuestos procesados: {$resultadoPresupuestos['procesados']}");
            $this->info("✓ Notificaciones de presupuestos: {$resultadoPresupuestos['notificaciones']}");
            
            // ===== CONTRATOS =====
            $this->info('Verificando contratos...');
            $resultadoContratos = $this->contratoNotificationService->verificarContratos();
            $this->info("✓ Contratos procesados: {$resultadoContratos['procesados']}");
            $this->info("✓ Notificaciones de contratos: {$resultadoContratos['notificaciones']}");
            
            $this->info('[' . now()->format('Y-m-d H:i:s') . '] Verificación completada exitosamente.');
            
        } catch (\Exception $e) {
            $this->error('Error en la verificación: ' . $e->getMessage());
            Log::error('Error en verificación de notificaciones: ' . $e->getMessage(), [
                'exception' => $e,
                'trace' => $e->getTraceAsString()
            ]);
            return 1;
        }
        
        return 0;
    }
}