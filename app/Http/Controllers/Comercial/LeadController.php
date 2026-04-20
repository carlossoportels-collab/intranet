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
use Illuminate\Support\Facades\DB;
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

/**
 * Convertir un lead en cliente (upgrade)
 */

public function upgradeToClient($id)
{
    try {
        $lead = Lead::findOrFail($id);
        
        // Verificar que el lead tenga prefijo_id = 7
        if ($lead->prefijo_id != 7) {
            return redirect()->back()->withErrors(['error' => 'Este lead no es elegible para upgrade']);
        }

        // Verificar que no sea ya cliente
        if ($lead->es_cliente) {
            return redirect()->back()->withErrors(['error' => 'Este lead ya es cliente']);
        }
        
        // Verificar si venía de un estado perdido (para saber si es recuperación)
        $estadoAnterior = EstadoLead::find($lead->estado_lead_id);
        $tiposPerdidos = ['final_negativo', 'recontacto'];
        $idsPerdidos = [8, 13, 14, 15, 16, 17];
        $eraPerdido = in_array($estadoAnterior?->tipo, $tiposPerdidos) || in_array($estadoAnterior?->id, $idsPerdidos);
        
        DB::beginTransaction();
        
        try {
            $usuarioId = auth()->id();
            $nombreLead = $lead->nombre_completo;
            
            // Eliminar notificaciones pendientes
            $notificacionesEliminadas = $this->eliminarNotificacionesLead($lead->id, $usuarioId);
            
            // Actualizar el lead
            $lead->es_cliente = 1;
            $lead->estado_lead_id = 7;
            $lead->modified_by = $usuarioId;
            $lead->modified = now();
            
            // 🔥 MARCAR COMO RECUPERADO (solo si venía de estado perdido)
            if ($eraPerdido) {
                $lead->es_recuperacion = 1;
            }
            
            $lead->save();
            
            // Registrar en auditoría
            DB::table('auditoria_log')->insert([
                'tabla_afectada' => 'leads',
                'registro_id' => $lead->id,
                'accion' => 'update',
                'usuario_id' => $usuarioId,
                'valores_anteriores' => json_encode([
                    'es_cliente' => 0,
                    'estado_lead_id' => $lead->getOriginal('estado_lead_id'),
                    'es_recuperacion' => $lead->getOriginal('es_recuperacion'),
                    'era_perdido' => $eraPerdido,
                ]),
                'valores_nuevos' => json_encode([
                    'es_cliente' => 1,
                    'estado_lead_id' => 7,
                    'es_recuperacion' => $eraPerdido ? 1 : $lead->es_recuperacion,
                    'notificaciones_eliminadas' => $notificacionesEliminadas,
                ]),
                'ip_address' => request()->ip(),
                'user_agent' => request()->userAgent(),
                'created' => now(),
            ]);
            
            DB::commit();
            
            $mensaje = $eraPerdido 
                ? "{$nombreLead} ha sido convertido a cliente y marcado como recuperado exitosamente"
                : "{$nombreLead} ha sido convertido a cliente exitosamente";
            
            return redirect()->back()->with('success', $mensaje);
            
        } catch (\Exception $e) {
            DB::rollBack();
            throw $e;
        }
        
    } catch (\Exception $e) {
        Log::error('Error en upgradeToClient:', [
            'lead_id' => $id,
            'error' => $e->getMessage()
        ]);
        
        return redirect()->back()->withErrors(['error' => 'Error al convertir el lead: ' . $e->getMessage()]);
    }
}

/**
 *  NUEVO: Marcar lead como recuperado en seguimientos_perdida
 */
private function marcarLeadComoRecuperado(Lead $lead, int $usuarioId): void
{
    try {
        $seguimiento = DB::table('seguimientos_perdida')
            ->where('lead_id', $lead->id)
            ->whereNull('deleted_at')
            ->first();
        
        if ($seguimiento && !$seguimiento->restaurado) {
            DB::table('seguimientos_perdida')
                ->where('id', $seguimiento->id)
                ->update([
                    'restaurado' => 1,
                    'fecha_restauracion' => now(),
                    'restaurado_por' => $usuarioId,
                ]);
            
            Log::info('Lead marcado como recuperado en upgradeToClient', [
                'lead_id' => $lead->id,
                'lead_nombre' => $lead->nombre_completo,
                'estado_anterior_id' => $lead->getOriginal('estado_lead_id'),
                'usuario_id' => $usuarioId
            ]);
        }
    } catch (\Exception $e) {
        Log::error('Error al marcar lead como recuperado en upgradeToClient', [
            'lead_id' => $lead->id,
            'error' => $e->getMessage()
        ]);
        // No lanzamos excepción para no interrumpir el upgrade
    }
}

/**
 * Eliminar todas las notificaciones pendientes asociadas a un lead
 */
private function eliminarNotificacionesLead(int $leadId, int $usuarioId): array
{
    $tiposEliminados = [];
    
    try {
        // 1. Eliminar notificaciones de tipo 'lead_sin_contactar'
        $leadSinContactar = DB::table('notificaciones')
            ->where('entidad_id', $leadId)
            ->where('entidad_tipo', 'lead')
            ->where('tipo', 'lead_sin_contactar')
            ->whereNull('deleted_at')
            ->update([
                'deleted_at' => now(),
                'deleted_by' => $usuarioId
            ]);
        
        if ($leadSinContactar > 0) {
            $tiposEliminados['lead_sin_contactar'] = $leadSinContactar;
        }
        
        // 2. Eliminar notificaciones de tipo 'lead_vencido'
        $leadVencido = DB::table('notificaciones')
            ->where('entidad_id', $leadId)
            ->where('entidad_tipo', 'lead')
            ->where('tipo', 'lead_vencido')
            ->whereNull('deleted_at')
            ->update([
                'deleted_at' => now(),
                'deleted_by' => $usuarioId
            ]);
        
        if ($leadVencido > 0) {
            $tiposEliminados['lead_vencido'] = $leadVencido;
        }
        
        // 3. Eliminar notificaciones de tipo 'lead_posible_recontacto'
        $posibleRecontacto = DB::table('notificaciones')
            ->where('entidad_id', $leadId)
            ->where('entidad_tipo', 'lead')
            ->where('tipo', 'lead_posible_recontacto')
            ->whereNull('deleted_at')
            ->update([
                'deleted_at' => now(),
                'deleted_by' => $usuarioId
            ]);
        
        if ($posibleRecontacto > 0) {
            $tiposEliminados['lead_posible_recontacto'] = $posibleRecontacto;
        }
        
        // 4. Eliminar notificaciones de tipo 'asignacion_lead'
        $asignacion = DB::table('notificaciones')
            ->where('entidad_id', $leadId)
            ->where('entidad_tipo', 'lead')
            ->where('tipo', 'asignacion_lead')
            ->whereNull('deleted_at')
            ->update([
                'deleted_at' => now(),
                'deleted_by' => $usuarioId
            ]);
        
        if ($asignacion > 0) {
            $tiposEliminados['asignacion_lead'] = $asignacion;
        }
        
        // 5. Eliminar notificaciones de tipo 'comentario_recordatorio' (buscar por comentarios del lead)
        $comentariosIds = DB::table('comentarios')
            ->where('lead_id', $leadId)
            ->whereNull('deleted_at')
            ->pluck('id')
            ->toArray();
        
        $recordatoriosComentarios = 0;
        if (!empty($comentariosIds)) {
            $recordatoriosComentarios = DB::table('notificaciones')
                ->where('tipo', 'comentario_recordatorio')
                ->where('entidad_tipo', 'comentario')
                ->whereIn('entidad_id', $comentariosIds)
                ->whereNull('deleted_at')
                ->update([
                    'deleted_at' => now(),
                    'deleted_by' => $usuarioId
                ]);
            
            if ($recordatoriosComentarios > 0) {
                $tiposEliminados['comentario_recordatorio'] = $recordatoriosComentarios;
            }
        }
        
        // 6. Eliminar notificaciones de tipo 'recontacto_recordatorio' (buscar por seguimientos_perdida)
        $seguimientosIds = DB::table('seguimientos_perdida')
            ->where('lead_id', $leadId)
            ->whereNull('deleted_at')
            ->pluck('id')
            ->toArray();
        
        $recontactoRecordatorio = 0;
        if (!empty($seguimientosIds)) {
            $recontactoRecordatorio = DB::table('notificaciones')
                ->where('tipo', 'recontacto_recordatorio')
                ->where('entidad_tipo', 'seguimiento_perdida')
                ->whereIn('entidad_id', $seguimientosIds)
                ->whereNull('deleted_at')
                ->update([
                    'deleted_at' => now(),
                    'deleted_by' => $usuarioId
                ]);
            
            if ($recontactoRecordatorio > 0) {
                $tiposEliminados['recontacto_recordatorio'] = $recontactoRecordatorio;
            }
        }
        
        $total = array_sum($tiposEliminados);
        
        Log::info('Notificaciones eliminadas por upgrade a cliente', [
            'lead_id' => $leadId,
            'total' => $total,
            'detalles' => $tiposEliminados
        ]);
        
        return [
            'total' => $total,
            'detalles' => $tiposEliminados
        ];
        
    } catch (\Exception $e) {
        Log::error('Error eliminando notificaciones del lead:', [
            'lead_id' => $leadId,
            'error' => $e->getMessage()
        ]);
        
        return [
            'total' => 0,
            'detalles' => [],
            'error' => $e->getMessage()
        ];
    }
}
}