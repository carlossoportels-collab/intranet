<?php

namespace App\Providers;

use Carbon\CarbonImmutable;
use Illuminate\Support\Facades\Date;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\ServiceProvider;
use Illuminate\Validation\Rules\Password;
use App\Services\Lead\LeadStatisticsService;
use App\Services\Lead\LeadQueryService;
use App\Services\Lead\LeadPresupuestoLegacyService;
use App\Services\Lead\LeadDetailsService;
use App\Services\PermisoService;
use App\Services\Presupuesto\PresupuestoNotificationService;
use App\Services\Error\ErrorNotificationService; // 🔥 NUEVO: Importar el servicio de errores
use Illuminate\Support\Facades\URL;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // Tus servicios existentes (SIEMPRE se registran)
        $this->app->singleton(LeadStatisticsService::class);
        $this->app->singleton(LeadQueryService::class);
        $this->app->singleton(LeadPresupuestoLegacyService::class);
        $this->app->singleton(PresupuestoNotificationService::class);
        $this->app->singleton(LeadDetailsService::class);
        $this->app->singleton(PermisoService::class);
        
        // 🔥 NUEVO: Registrar el servicio de notificaciones de error
        $this->app->singleton(ErrorNotificationService::class);
        
        // Registrar paquetes de desarrollo SOLO en local
        if ($this->app->environment('local')) {
            $this->registerDevelopmentProviders();
        }
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        if (app()->environment('production')) {
            URL::forceScheme('https');
        }
        
        // Llamar a configureDefaults() en boot
        $this->configureDefaults();
    }

    /**
     * Configure default application settings.
     */
    protected function configureDefaults(): void
    {
        Date::use(CarbonImmutable::class);

        DB::prohibitDestructiveCommands(
            $this->app->isProduction(),
        );

        Password::defaults(fn (): ?Password => $this->app->isProduction()
            ? Password::min(12)
                ->mixedCase()
                ->letters()
                ->numbers()
                ->symbols()
                ->uncompromised()
            : null
        );
    }
    
    /**
     * Register development-only service providers.
     */
    protected function registerDevelopmentProviders(): void
    {
        $providers = [
            \BeyondCode\QueryDetector\QueryDetectorServiceProvider::class,
        ];
        
        foreach ($providers as $provider) {
            if (class_exists($provider)) {
                $this->app->register($provider);
            }
        }
    }
}