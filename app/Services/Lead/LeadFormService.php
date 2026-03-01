<?php

namespace App\Services\Lead;

use App\Models\OrigenContacto;
use App\Models\EstadoLead;
use App\Models\TipoComentario;
use App\Models\Rubro;
use App\Models\Provincia;
use App\Models\Comercial;
use Illuminate\Support\Facades\Cache;

class LeadFormService
{
    private const CACHE_TTL = 3600; // 1 hora

    public function getFormData(): array
    {
        return Cache::remember('lead_form_data', self::CACHE_TTL, function () {
            return [
                'origenes' => OrigenContacto::where('activo', 1)->get(),
                'estadosLead' => EstadoLead::where('activo', 1)->get(),
                'tiposComentario' => TipoComentario::where('es_activo', 1)->get(),
                'rubros' => Rubro::where('activo', 1)->get(),
                'provincias' => Provincia::orderBy('nombre')->get(),
                'comerciales' => $this->getComercialesActivos(),
            ];
        });
    }

    private function getComercialesActivos()
    {
        return Comercial::with('personal')
            ->where('activo', 1)
            ->get()
            ->map(function ($comercial) {
                $comercial->nombre_completo = $comercial->personal->nombre_completo ?? 'Sin nombre';
                return $comercial;
            });
    }

    public function clearFormDataCache(): void
    {
        Cache::forget('lead_form_data');
    }
}