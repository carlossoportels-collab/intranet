<?php

namespace App\Services\Lead;

use App\Models\OrigenContacto;
use App\Models\EstadoLead;
use App\Models\TipoComentario;
use App\Models\Rubro;
use App\Models\Provincia;
use Illuminate\Support\Facades\Cache;
use App\Services\Lead\LeadFilterService;

class LeadFormService
{
    private const CACHE_TTL = 3600;
    
    private LeadFilterService $filterService;
    
    public function __construct(LeadFilterService $filterService)
    {
        $this->filterService = $filterService;
    }

    public function getFormData($usuario = null): array 
    {
        return Cache::remember('lead_form_data', self::CACHE_TTL, function () use ($usuario) {
            $data = [
                'origenes' => OrigenContacto::where('activo', 1)->get(),
                'estadosLead' => EstadoLead::where('activo', 1)->get(),
                'tiposComentario' => TipoComentario::where('es_activo', 1)->get(),
                'rubros' => Rubro::where('activo', 1)->get(),
                'provincias' => Provincia::orderBy('nombre')->get(),
            ];
            
            // Si hay usuario, incluir comerciales filtrados
            if ($usuario) {
                $data['comerciales'] = $this->filterService->getComercialesActivos($usuario);
                $data['hay_comerciales'] = $data['comerciales']->isNotEmpty();
            }
            
            return $data;
        });
    }

    public function clearFormDataCache(): void
    {
        Cache::forget('lead_form_data');
    }
}