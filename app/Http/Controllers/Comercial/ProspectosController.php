<?php

namespace App\Http\Controllers\Comercial;

use App\Http\Controllers\Controller;
use App\Services\Lead\LeadFilterService;
use App\Services\Lead\LeadStatisticsService;
use App\Services\Lead\LeadCommentService;
use App\Models\Lead;
use App\Models\EstadoLead;
use App\Models\TipoComentario;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;
use App\Traits\Authorizable;

class ProspectosController extends Controller
{
    use Authorizable;

    public function __construct(
        private LeadFilterService $filterService,
        private LeadStatisticsService $statsService,
        private LeadCommentService $commentService
    ) {
        $this->initializeAuthorization();
    }
    
    public function index(Request $request)
    {
        // Verificar autenticación
        if (!auth()->check()) {
            return redirect('/login');
        }
        
        $usuario = auth()->user();
        
        // Verificar permiso para ver prospectos
        $this->authorizePermiso(config('permisos.VER_PROSPECTOS'));
        
        // Construir query base
        $query = $this->filterService->getQueryBase();

        $prefijosFiltro = $this->filterService->getPrefijosFiltro($usuario);
        $prefijoUsuario = $this->filterService->getPrefijoUsuarioComercial($usuario);
        
        // Aplicar filtro de prefijo si viene en request
        if ($request->has('prefijo_id') && $request->prefijo_id) {
            $this->filterService->aplicarFiltroPrefijo($query, $request->prefijo_id);
        } elseif ($prefijoUsuario && $usuario->rol_id == 5) {
            // Si es comercial y no eligió filtro, mostrar solo sus leads
            $query->where('prefijo_id', $prefijoUsuario['id']);
        }
        
        // Aplicar filtros
        $filters = $request->only(['search', 'estado_id', 'origen_id', 'fecha_inicio', 'fecha_fim']);
        $this->filterService->aplicarFiltros($query, $filters);
        
        // Aplicar permisos de prefijos (usando el trait)
        $this->applyPrefijoFilter($query, $usuario);
        
        // Obtener leads paginados
        $leads = $query->orderBy('created', 'desc')
            ->paginate(15)
            ->withQueryString();
        
        // Obtener estadísticas
        $estadisticas = $this->statsService->getEstadisticas($usuario);
        
        // Obtener datos para filtros
        $datosFiltros = $this->filterService->getDatosFiltros();
        
        // Obtener comerciales activos
        $comerciales = $this->filterService->getComercialesActivos($usuario);
        $hay_comerciales = $comerciales->count() > 0;
        
        // Obtener conteos
        $leadIds = $leads->pluck('id')->toArray();
        $comentariosPorLead = $this->filterService->getConteoComentarios($leadIds);
        $presupuestosPorLead = $this->filterService->getConteoPresupuestos($leadIds);
        
        // Obtener datos del usuario
        $usuarioData = $this->getUsuarioData($usuario);
        
        return Inertia::render('Comercial/Prospectos', [
            'leads' => $leads,
            'estadisticas' => $estadisticas,
            'filters' => $filters,
            'usuario' => $usuarioData,
            ...$datosFiltros,
            'comerciales' => $comerciales,
            'hay_comerciales' => $hay_comerciales,
            'comentariosPorLead' => $comentariosPorLead,
            'presupuestosPorLead' => $presupuestosPorLead,
            'prefijosFiltro' => $prefijosFiltro,
            'prefijoUsuario' => $prefijoUsuario,
            'filters' => $request->only(['search', 'estado_id', 'origen_id', 'prefijo_id', 'fecha_inicio', 'fecha_fim']),
        ]);
    }
    
    /**
     * Ver comentarios de un lead
     */
    public function comentarios($id)
    {
        try {
            $lead = Lead::findOrFail($id);
            
            // Verificar acceso al lead
            $this->authorizeLeadAccess($lead, config('permisos.VER_PROSPECTOS'));
            
            $datos = $this->commentService->getComentariosLead($id);
            
            // Si es AJAX
            if (request()->expectsJson()) {
                return response()->json($datos);
            }
            
            // Si no, renderizar página completa
            $tiposComentario = TipoComentario::where('es_activo', 1)
                ->where(function($query) {
                    $query->where('aplica_a', 'lead')
                          ->orWhere('aplica_a', 'ambos');
                })
                ->get();
            
            return Inertia::render('Comercial/LeadComentarios', array_merge($datos, [
                'tiposComentario' => $tiposComentario,
            ]));
            
        } catch (\Exception $e) {
            Log::error('Error en comentarios:', [
                'lead_id' => $id,
                'error' => $e->getMessage()
            ]);
            
            return $this->errorResponse($e->getMessage(), 400);
        }
    }
    
    /**
     * Guardar comentario
     */
    public function guardarComentario(Request $request, $id)
    {
        $request->validate([
            'comentario' => 'required|string|min:3',
            'tipo_comentario_id' => 'required|exists:tipo_comentario,id',
            'crea_recordatorio' => 'boolean',
            'dias_recordatorio' => 'nullable|integer|min:0',
            'cambiar_estado_lead' => 'boolean',
            'motivo_perdida_id' => 'nullable|exists:motivos_perdida,id',
            'notas_adicionales' => 'nullable|string',
            'posibilidades_futuras' => 'nullable|in:si,no,tal_vez',
            'fecha_posible_recontacto' => 'nullable|date|after:today',
        ]);
        
        try {
            $lead = Lead::findOrFail($id);
            
            // Verificar acceso al lead y permiso para gestionar leads
            $this->authorizeLeadModification($lead);
            
            $resultado = $this->commentService->crearComentario(
                $request->all(),
                $id,
                auth()->id()
            );
            
            return $this->successResponse($resultado['mensaje']);
            
        } catch (\Exception $e) {
            Log::error('Error al guardar comentario:', [
                'lead_id' => $id,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return $this->errorResponse('Error: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Datos para modal de comentario
     */
    public function comentariosModalData($id)
    {
        try {
            $lead = Lead::findOrFail($id);
            
            // Verificar acceso al lead
            $this->authorizeLeadAccess($lead, config('permisos.VER_PROSPECTOS'));
            
            // Contar comentarios existentes
            $comentariosExistentes = \App\Models\Comentario::where('lead_id', $id)
                ->whereNull('deleted_at')
                ->count();
            
            // Obtener estados lead
            $estadosLead = EstadoLead::where('activo', 1)->get();
            
            return response()->json([
                'lead' => [
                    'id' => $lead->id,
                    'nombre_completo' => $lead->nombre_completo,
                    'estado_lead_id' => $lead->estado_lead_id,
                ],
                'comentariosExistentes' => $comentariosExistentes,
                'estadosLead' => $estadosLead,
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error en comentariosModalData:', [
                'lead_id' => $id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json(['error' => $e->getMessage()], 400);
        }
    }
    
    /**
     * Obtener tipos de comentario para clientes
     */
    public function tiposComentarioCliente()
    {
        try {
            $tipos = TipoComentario::where('es_activo', 1)
                ->where(function($query) {
                    $query->where('aplica_a', 'cliente')
                          ->orWhere('aplica_a', 'ambos');
                })
                ->get();
            
            return response()->json($tipos);
        } catch (\Exception $e) {
            Log::error('Error cargando tipos de comentario para cliente:', [
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Error al cargar tipos'], 500);
        }
    }

    /**
     * Obtener tipos de comentario para recontacto (estados final_negativo)
     */
    public function tiposComentarioRecontacto()
    {
        try {
            $tipos = TipoComentario::where('es_activo', 1)
                ->where(function($query) {
                    $query->where('aplica_a', 'recontacto')
                          ->orWhere('aplica_a', 'ambos');
                })
                ->get();
            
            return response()->json($tipos);
        } catch (\Exception $e) {
            Log::error('Error cargando tipos de comentario para recontacto:', [
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Error al cargar tipos'], 500);
        }
    }

    /**
     * Obtener tipos de comentario para leads normales
     */
    public function tiposComentarioLead()
    {
        try {
            $tipos = TipoComentario::where('es_activo', 1)
                ->where(function($query) {
                    $query->where('aplica_a', 'lead')
                          ->orWhere('aplica_a', 'ambos');
                })
                ->get();
            
            return response()->json($tipos);
        } catch (\Exception $e) {
            Log::error('Error cargando tipos de comentario para lead:', [
                'error' => $e->getMessage()
            ]);
            return response()->json(['error' => 'Error al cargar tipos'], 500);
        }
    }
    
    /**
     * Método para obtener tiempos entre estados
     */
    public function tiemposEntreEstados($id)
    {
        try {
            $lead = Lead::findOrFail($id);
            
            // Verificar acceso al lead
            $this->authorizeLeadAccess($lead, config('permisos.VER_PROSPECTOS'));
            
            // Reutilizar el servicio que ya tenemos
            $datosDashboard = app(\App\Services\Lead\LeadDetailsService::class)
                ->getLeadDashboardData($id, auth()->id());
            
            return response()->json($datosDashboard['tiempos_estados'] ?? []);
            
        } catch (\Exception $e) {
            Log::error('Error en tiemposEntreEstados:', [
                'lead_id' => $id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'error' => 'Error al calcular tiempos',
                'message' => $e->getMessage()
            ], 500);
        }
    }
    
    /**
     * Editar lead
     */
    public function edit($id)
    {
        $lead = Lead::findOrFail($id);
        
        // Verificar acceso al lead y permiso para gestionar
        $this->authorizeLeadModification($lead);
        
        return Inertia::render('Comercial/LeadEdit', [
            'lead' => $lead,
        ]);
    }

    /**
     * Actualizar lead
     */
    public function update(Request $request, $id)
    {
        $lead = Lead::find($id);
        
        if (!$lead) {
            return $this->errorResponse('Lead no encontrado', 404);
        }
        
        // Verificar acceso al lead y permiso para gestionar
        $this->authorizeLeadModification($lead);
        
        $validated = $request->validate([
            'prefijo_id' => 'nullable|integer',
            'nombre_completo' => 'required|string|max:100',
            'genero' => 'required|in:masculino,femenino,otro,no_especifica',
            'telefono' => 'nullable|string|max:20',
            'email' => 'nullable|email|max:150',
            'localidad_id' => 'nullable|integer|exists:localidades,id',
            'rubro_id' => 'nullable|integer|exists:rubros,id',
            'origen_id' => 'nullable|integer|exists:origenes_contacto,id',
        ]);
        
        try {
            // Limpiar datos
            foreach (['prefijo_id', 'localidad_id', 'rubro_id', 'origen_id'] as $field) {
                $validated[$field] = !empty($validated[$field]) ? $validated[$field] : null;
            }
            
            $lead->update([
                ...$validated,
                'modified' => now(),
                'modified_by' => auth()->id(),
            ]);
            
            return $this->successResponse('Lead actualizado exitosamente', ['lead_id' => $id]);
            
        } catch (\Exception $e) {
            Log::error('Error actualizando lead:', [
                'error' => $e->getMessage(),
                'lead_id' => $id,
            ]);
            
            return $this->errorResponse('Error al actualizar el lead: ' . $e->getMessage(), 500);
        }
    }
    
    /**
     * Obtener datos del usuario
     */
    private function getUsuarioData($usuario): array
    {
        $usuario->load('personal');
        
        $prefijosAsignados = [];
        $cantidadPrefijos = 0;
        
        if (!$usuario->ve_todas_cuentas) {
            // 🔥 CAMBIO: Usar permisoService en lugar de prefijoService
            $prefijosAsignados = $this->permisoService->getPrefijosPermitidos($usuario->id) ?? [];
            $cantidadPrefijos = count($prefijosAsignados);
        }
        
        $data = [
            've_todas_cuentas' => (bool) $usuario->ve_todas_cuentas,
            'rol_id' => $usuario->rol_id,
            'personal_id' => $usuario->personal_id,
            'prefijos_asignados' => $prefijosAsignados,
            'cantidad_prefijos' => $cantidadPrefijos,
            'nombre_completo' => $usuario->personal 
                ? $usuario->personal->nombre . ' ' . $usuario->personal->apellido
                : $usuario->nombre_usuario,
        ];
        
        // Si es comercial
        if ($usuario->rol_id == 5) {
            $comercialUsuario = \Illuminate\Support\Facades\DB::table('comercial')
                ->where('personal_id', $usuario->personal_id)
                ->where('activo', 1)
                ->first();
                
            if ($comercialUsuario) {
                $data['comercial'] = [
                    'es_comercial' => true,
                    'prefijo_id' => $comercialUsuario->prefijo_id,
                ];
            }
        }
        
        return $data;
    }
}