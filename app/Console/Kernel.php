<?php
// app/Console/Kernel.php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     */
    protected function schedule(Schedule $schedule): void
    {
        // Verificación de notificaciones cada hora (de 9 AM a 7 PM)
        $schedule->command('notificaciones:verificar')
            ->hourly()
            ->between('7:00', '19:00')
            ->daily();
        
        // Limpiar notificaciones antiguas (más de 30 días) cada domingo a las 3 AM
        $schedule->command('notificaciones:limpiar')
            ->weeklyOn(0, '03:00');

        $schedule->command('presupuestos:verificar-vencidos')
             ->daily();

        $schedule->command('contratos:verificar-pendientes')->daily();     
            
        // Backups de la base de datos (ajusta según tu configuración)
        // $schedule->command('db:backup')->dailyAt('02:00');
    }

    /**
     * Register the commands for the application.
     */
    protected function commands(): void
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }
}