<?php
// app/Http/Controllers/Comercial/LeadController.php

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
use App\Models\TipoComentario;
use App\Models\EstadoLead;
use App\Traits\Authorizable;
use Illuminate\Http\RedirectResponse;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use Inertia\Response;

class LeadController extends Controller
{
    use Authorizable;

    public function __construct(
        private LeadCreationService $leadService,
        private LeadDetailsService $detailsService,
        private LeadFormService $formService,
        private LeadFilterService $filterService 
    ) {
        $this->initializeAuthorization();
    }

    /**
     * Mostrar un lead individual
     */
    public function show($id): Response
    {
        // Verificar acceso al lead
        $lead = Lead::with([
            'estadoLead',
            'seguimientoPerdida.motivo',
            'prefijo',
            'prefijo.comercial.personal',
            'rubro',
            'origen',
            'localidad.provincia'
        ])->findOrFail($id);
        
        $this->authorizeLeadAccess($lead, config('permisos.VER_PROSPECTOS'));
        
        $dashboardData = $this->detailsService->getLeadDashboardData($id, auth()->id());
        
        if (empty($dashboardData)) {
            abort(404, 'Lead no encontrado');
        }

        $formData = $this->formService->getFormData();
        
        $datosFiltros = app(LeadFilterService::class)->getDatosFiltros();
        $comerciales = $this->filterService->getComercialesActivos(auth()->user());

        // Obtener el tipo de estado del lead para determinar qué tipos de comentario cargar
        $estadoTipo = $lead->estadoLead->tipo ?? null;
        
        $tiposComentario = [];
        $tiposComentarioSeguimiento = [];
        $estadosLeadSeguimiento = [];
        
        // Para leads con tipo 'recontacto' - usar modal de seguimiento de leads perdidos
        if ($estadoTipo === 'final_negativo' || $estadoTipo === 'recontacto') {
            // Tipos de comentario para leads perdidos/seguimiento
            $tiposComentarioSeguimiento = TipoComentario::where('aplica_a', 'recontacto')
                ->where('es_activo', 1)
                ->orderBy('nombre')
                ->get();
            
            // Para el modal de seguimiento también necesitamos los tipos generales por si acaso
            $tiposComentario = TipoComentario::where('aplica_a', 'lead')
                ->where('es_activo', 1)
                ->orderBy('nombre')
                ->get();
                
            $estadosLeadSeguimiento = EstadoLead::where('activo', 1)
                ->orderBy('nombre')
                ->get();
                
        } elseif ($estadoTipo === 'final_positivo') {
            // Tipos de comentario para clientes
            $tiposComentario = TipoComentario::where('aplica_a', 'cliente')
                ->where('es_activo', 1)
                ->orderBy('nombre')
                ->get();
                
        } else {
            // Tipos de comentario para leads nuevos/activos (por defecto)
            $tiposComentario = TipoComentario::where('aplica_a', 'lead')
                ->where('es_activo', 1)
                ->orderBy('nombre')
                ->get();
        }

        // Tipos de comentario generales como respaldo
        $tiposComentarioGenerales = TipoComentario::where('es_activo', 1)
            ->orderBy('nombre')
            ->get();

        return Inertia::render('Comercial/Leads/Show', array_merge(
            $dashboardData, 
            $formData,
            $datosFiltros,
            [
                'comerciales' => $comerciales,
                'tiposComentario' => $tiposComentario,
                'tiposComentarioGenerales' => $tiposComentarioGenerales,
                'tiposComentarioSeguimiento' => $tiposComentarioSeguimiento,
                'estadosLeadSeguimiento' => $estadosLeadSeguimiento,
                'lead' => $lead,
            ]
        ));
    }

    /**
     * Almacenar nuevo lead - VERSIÓN PARA INERTIA
     */
    public function store(StoreLeadRequest $request)
    {
        //  VERIFICAR PERMISO PARA GESTIONAR LEADS
        $this->authorizePermiso(config('permisos.GESTIONAR_LEADS'));
        
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
// app/Http/Controllers/Comercial/LeadController.php

public function verificarDatosContrato($id)
{
    try {
        $lead = Lead::with([
            'localidad.provincia',
            'rubro',
            'origen',
            'estadoLead'
        ])->findOrFail($id);
        
        $this->authorizeLeadAccess($lead, config('permisos.VER_PROSPECTOS'));

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

        $pasoAMostrar = 1;
        $empresaData = null;
        $contactoData = null;
        
        // 🔥 DATOS DEL LEAD ACTUALIZADOS
        $leadData = [
            'id' => $lead->id,
            'nombre_completo' => $lead->nombre_completo,
            'genero' => $lead->genero,
            'telefono' => $lead->telefono,
            'email' => $lead->email,
            'localidad_id' => $lead->localidad_id,
            'localidad_nombre' => $lead->localidad?->nombre,
            'provincia_id' => $lead->localidad?->provincia_id,
            'provincia_nombre' => $lead->localidad?->provincia?->nombre,
            'rubro_id' => $lead->rubro_id,
            'origen_id' => $lead->origen_id,
            'prefijo_id' => $lead->prefijo_id,
        ];

        // Si no hay contacto, paso 1
        if (!$contacto) {
            return response()->json([
                'todosCompletos' => false,
                'pasoAMostrar' => 1,
                'datosFaltantes' => ['empresa', 'contacto'],
                'message' => 'Debe crear la empresa para este lead',
                'lead' => $leadData,  // 🔥 DEVOLVER DATOS DEL LEAD
                'empresa' => null,
                'contacto' => null
            ]);
        }

        $empresa = $contacto->empresa;

        // Preparar datos de empresa existentes
        if ($empresa) {
            $empresaData = [
                'id' => $empresa->id,
                'nombre_fantasia' => $empresa->nombre_fantasia,
                'razon_social' => $empresa->razon_social,
                'cuit' => $empresa->cuit,
                'direccion_fiscal' => $empresa->direccion_fiscal,
                'codigo_postal_fiscal' => $empresa->codigo_postal_fiscal,
                'localidad_fiscal_id' => $empresa->localidad_fiscal_id,
                'telefono_fiscal' => $empresa->telefono_fiscal,
                'email_fiscal' => $empresa->email_fiscal,
                'rubro_id' => $empresa->rubro_id,
                'cat_fiscal_id' => $empresa->cat_fiscal_id,
                'plataforma_id' => $empresa->plataforma_id,
                'nombre_flota' => $empresa->nombre_flota,
                'localidad_nombre' => $empresa->localidadFiscal?->nombre,
                'provincia_id' => $empresa->localidadFiscal?->provincia_id,
                'provincia_nombre' => $empresa->localidadFiscal?->provincia?->nombre,
            ];
        }

        // Preparar datos de contacto existentes
        if ($contacto) {
            $contactoData = [
                'id' => $contacto->id,
                'tipo_responsabilidad_id' => $contacto->tipo_responsabilidad_id,
                'tipo_documento_id' => $contacto->tipo_documento_id,
                'nro_documento' => $contacto->nro_documento,
                'nacionalidad_id' => $contacto->nacionalidad_id,
                'fecha_nacimiento' => $contacto->fecha_nacimiento,
                'direccion_personal' => $contacto->direccion_personal,
                'codigo_postal_personal' => $contacto->codigo_postal_personal,
            ];
        }

        // Verificar datos del lead (usando los datos reales)
        $camposLead = [
            'nombre_completo' => $lead->nombre_completo,
            'telefono' => $lead->telefono,
            'email' => $lead->email,
            'localidad_id' => $lead->localidad_id,
            'rubro_id' => $lead->rubro_id,
            'origen_id' => $lead->origen_id,
        ];

        $leadCompleto = true;
        foreach ($camposLead as $campo => $valor) {
            if (empty($valor)) {
                $leadCompleto = false;
                break;
            }
        }

        // Si el lead está incompleto, paso 1
        if (!$leadCompleto) {
            $pasoAMostrar = 1;
        }

        // Verificar datos del contacto
        $camposContacto = [
            'tipo_responsabilidad_id' => $contacto->tipo_responsabilidad_id,
            'tipo_documento_id' => $contacto->tipo_documento_id,
            'nro_documento' => $contacto->nro_documento,
            'nacionalidad_id' => $contacto->nacionalidad_id,
            'fecha_nacimiento' => $contacto->fecha_nacimiento,
            'direccion_personal' => $contacto->direccion_personal,
            'codigo_postal_personal' => $contacto->codigo_postal_personal,
        ];

        $contactoCompleto = true;
        foreach ($camposContacto as $campo => $valor) {
            if (empty($valor)) {
                $contactoCompleto = false;
                break;
            }
        }

        // Si el lead está completo pero el contacto incompleto, paso 2
        if ($leadCompleto && !$contactoCompleto) {
            $pasoAMostrar = 2;
        }

        // Verificar datos de la empresa
        $empresaCompleta = false;
        if ($empresa) {
            $camposEmpresa = [
                'nombre_fantasia' => $empresa->nombre_fantasia,
                'razon_social' => $empresa->razon_social,
                'cuit' => $empresa->cuit,
                'direccion_fiscal' => $empresa->direccion_fiscal,
                'codigo_postal_fiscal' => $empresa->codigo_postal_fiscal,
                'localidad_fiscal_id' => $empresa->localidad_fiscal_id,
                'telefono_fiscal' => $empresa->telefono_fiscal,
                'email_fiscal' => $empresa->email_fiscal,
                'rubro_id' => $empresa->rubro_id,
                'cat_fiscal_id' => $empresa->cat_fiscal_id,
                'plataforma_id' => $empresa->plataforma_id,
                'nombre_flota' => $empresa->nombre_flota,
            ];
            
            $empresaCompleta = true;
            foreach ($camposEmpresa as $campo => $valor) {
                if (empty($valor)) {
                    $empresaCompleta = false;
                    break;
                }
            }
        }

        // Si lead y contacto están completos pero empresa incompleta, paso 3
        if ($leadCompleto && $contactoCompleto && !$empresaCompleta) {
            $pasoAMostrar = 3;
        }

        // Si todo está completo
        if ($empresaCompleta && $contactoCompleto && $leadCompleto) {
            return response()->json([
                'todosCompletos' => true,
                'message' => 'Todos los datos están completos',
                'lead' => $leadData,  // 🔥 DEVOLVER DATOS DEL LEAD
                'empresa' => $empresaData,
                'contacto' => $contactoData
            ]);
        }

        return response()->json([
            'todosCompletos' => false,
            'pasoAMostrar' => $pasoAMostrar,
            'datosFaltantes' => $datosFaltantes ?? [],
            'message' => 'Faltan completar algunos datos',
            'lead' => $leadData,  // 🔥 DEVOLVER DATOS DEL LEAD
            'empresa' => $empresaData,
            'contacto' => $contactoData
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