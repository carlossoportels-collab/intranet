<?php
// app/Console/Commands/VerificarContratosPendientes.php

namespace App\Console\Commands;

use App\Services\Contrato\ContratoNotificationService;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Log;

class VerificarContratosPendientes extends Command
{
    protected $signature = 'contratos:verificar-pendientes';
    protected $description = 'Verifica contratos activos con más de 1 mes sin instalación';

    protected $contratoNotificationService;

    public function __construct(ContratoNotificationService $contratoNotificationService)
    {
        parent::__construct();
        $this->contratoNotificationService = $contratoNotificationService;
    }

    public function handle()
    {
        $this->info('[' . now()->format('Y-m-d H:i:s') . '] Verificando contratos pendientes...');
        
        try {
            $resultado = $this->contratoNotificationService->verificarContratos();
            
            $this->info("✓ Contratos procesados: {$resultado['procesados']}");
            $this->info("✓ Notificaciones creadas: {$resultado['notificaciones']}");
            
        } catch (\Exception $e) {
            $this->error('Error: ' . $e->getMessage());
            Log::error('Error en verificación de contratos: ' . $e->getMessage(), [
                'exception' => $e
            ]);
            return 1;
        }
        
        return 0;
    }
}