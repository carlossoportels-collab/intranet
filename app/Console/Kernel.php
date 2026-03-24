<?php
// app/Console/Kernel.php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     * 
     * NOTA: Los comandos se ejecutan directamente desde el cron de DonWeb.
     * Este método se mantiene vacío por si en el futuro se necesita usar schedule:run.
     */
    protected function schedule(Schedule $schedule): void
    {

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