<?php

namespace App\Http\Controllers\Comercial;

use App\Http\Controllers\Controller;
use App\Http\Requests\Lead\StoreLeadRequest;
use App\Services\Lead\LeadCreationService;
use App\Services\Lead\LeadDetailsService;
use App\Services\Lead\LeadFormService;
use App\Services\Lead\LeadFilterService;
use App\DTOs\LeadData;
use App\Models\Lead;
use App\Models\Empresa;
use App\Models\EmpresaContacto;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class LeadController extends Controller
{
    public function __construct(
        private LeadCreationService $leadService,
        private LeadDetailsService $detailsService,
        private LeadFormService $formService,
        private LeadFilterService $filterService 
    ) {}

    /**
     * Mostrar un lead individual
     */
    public function show($id): Response
    {
        $dashboardData = $this->detailsService->getLeadDashboardData($id, auth()->id());
        
        if (empty($dashboardData)) {
            abort(404, 'Lead no encontrado');
        }

        $formData = $this->formService->getFormData();
        
        $datosFiltros = app(LeadFilterService::class)->getDatosFiltros();
        $comerciales = $this->filterService->getComercialesActivos(auth()->user());

        return Inertia::render('Comercial/Leads/Show', array_merge(
            $dashboardData, 
            $formData,
            $datosFiltros,
            [
                'comerciales' => $comerciales,
            ]
        ));
    }

    /**
     * Almacenar nuevo lead - VERSIÓN PARA INERTIA
     */
    public function store(StoreLeadRequest $request)
    {
        try {
            $leadData = LeadData::fromRequest(
                $request->validated(),
                auth()->id()
            );

            $leadId = $this->leadService->createLead($leadData);

            $mensaje = $leadData->shouldCreateNote() 
                ? 'Lead creado exitosamente con nota'
                : 'Lead creado exitosamente';

            return redirect()
                ->back()
                ->with('success', $mensaje)
                ->with('lead_id', $leadId)
                ->with('nota_agregada', $leadData->shouldCreateNote());

        } catch (\Exception $e) {
            Log::error('Error en LeadController::store:', [
                'error' => $e->getMessage(),
                'data' => $request->all()
            ]);

            return redirect()
                ->back()
                ->withErrors(['error' => 'Error al crear el lead: ' . $e->getMessage()])
                ->withInput();
        }
    }
    /**
     * Verificar qué datos faltan para generar un contrato
     */
    public function verificarDatosContrato($id)
    {
        try {
            $lead = Lead::with([
                'localidad.provincia',
                'rubro',
                'origen',
                'estadoLead'
            ])->findOrFail($id);

            // Buscar el contacto a través de empresa_contactos
            $contacto = EmpresaContacto::with([
                'empresa.localidadFiscal.provincia',
                'empresa.rubro',
                'empresa.categoriaFiscal',
                'empresa.plataforma',
                'empresa.responsables',
                'tipoResponsabilidad',
                'tipoDocumento',
                'nacionalidad'
            ])->where('lead_id', $id)
            ->where('es_activo', true)
            ->first();

            $datosFaltantes = [];
            $pasoAMostrar = 1;

            // Si no hay contacto, significa que hay que crear la empresa desde cero
            if (!$contacto) {
                return response()->json([
                    'todosCompletos' => false,
                    'pasoAMostrar' => 1,
                    'datosFaltantes' => ['empresa', 'contacto'],
                    'message' => 'Debe crear la empresa para este lead'
                ]);
            }

            $empresa = $contacto->empresa;

            // Verificar datos del lead
            $camposLead = [
                'nombre_completo' => 'Nombre completo',
                'genero' => 'Género',
                'telefono' => 'Teléfono',
                'email' => 'Email',
                'localidad_id' => 'Localidad',
                'rubro_id' => 'Rubro',
                'origen_id' => 'Origen'
            ];

            $leadCompleto = true;
            foreach ($camposLead as $campo => $label) {
                if (empty($lead->$campo)) {
                    $leadCompleto = false;
                    $datosFaltantes[] = "lead.{$campo}";
                }
            }

            if (!$leadCompleto) {
                $pasoAMostrar = 1;
            }

            // Verificar datos del contacto
            $camposContacto = [
                'tipo_responsabilidad_id' => 'Tipo de responsabilidad',
                'tipo_documento_id' => 'Tipo de documento',
                'nro_documento' => 'Número de documento',
                'nacionalidad_id' => 'Nacionalidad',
                'fecha_nacimiento' => 'Fecha de nacimiento',
                'direccion_personal' => 'Dirección personal',
                'codigo_postal_personal' => 'Código postal'
            ];

            $contactoCompleto = true;
            foreach ($camposContacto as $campo => $label) {
                if (empty($contacto->$campo)) {
                    $contactoCompleto = false;
                    $datosFaltantes[] = "contacto.{$campo}";
                }
            }

            if (!$contactoCompleto && $pasoAMostrar === 1) {
                $pasoAMostrar = 2;
            }

            // Verificar datos de la empresa
            $camposEmpresa = [
                'nombre_fantasia' => 'Nombre de fantasía',
                'razon_social' => 'Razón social',
                'cuit' => 'CUIT',
                'direccion_fiscal' => 'Dirección fiscal',
                'codigo_postal_fiscal' => 'Código postal fiscal',
                'localidad_fiscal_id' => 'Localidad fiscal',
                'telefono_fiscal' => 'Teléfono fiscal',
                'email_fiscal' => 'Email fiscal',
                'rubro_id' => 'Rubro',
                'cat_fiscal_id' => 'Categoría fiscal',
                'plataforma_id' => 'Plataforma',
                'nombre_flota' => 'Nombre de flota'
            ];

            $empresaCompleta = true;
            foreach ($camposEmpresa as $campo => $label) {
                if (empty($empresa->$campo)) {
                    $empresaCompleta = false;
                    $datosFaltantes[] = "empresa.{$campo}";
                }
            }

            if (!$empresaCompleta && $contactoCompleto && $pasoAMostrar <= 2) {
                $pasoAMostrar = 3;
            }

            // Si todo está completo
            if ($empresaCompleta && $contactoCompleto && $leadCompleto) {
                return response()->json([
                    'todosCompletos' => true,
                    'message' => 'Todos los datos están completos'
                ]);
            }

            return response()->json([
                'todosCompletos' => false,
                'pasoAMostrar' => $pasoAMostrar,
                'datosFaltantes' => $datosFaltantes,
                'message' => 'Faltan completar algunos datos'
            ]);

        } catch (\Exception $e) {
            \Log::error('Error verificando datos para contrato:', [
                'error' => $e->getMessage(),
                'lead_id' => $id,
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'error' => 'Error al verificar datos: ' . $e->getMessage()
            ], 500);
        }
    }


}