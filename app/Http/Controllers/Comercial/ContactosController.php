<?php
// app/Http/Controllers/Comercial/ContactosController.php

namespace App\Http\Controllers\Comercial;

use App\Http\Controllers\Controller;
use App\Services\Lead\LeadFilterService;
use App\Traits\Authorizable; 
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\EmpresaContacto;
use App\Models\Lead;
use Illuminate\Support\Facades\DB;

class ContactosController extends Controller
{
    use Authorizable; 

    protected LeadFilterService $filterService;

    public function __construct(LeadFilterService $filterService)
    {
        $this->filterService = $filterService;
        $this->initializeAuthorization(); 
    }

    public function index(Request $request)
    {
        $this->authorizePermiso(config('permisos.VER_CONTACTOS'));
        
        $usuario = auth()->user();
        
        // ==========================================
        // 1. QUERY PARA CONTACTOS EXISTENTES (empresa_contactos)
        // ==========================================
        $contactosQuery = EmpresaContacto::with([
            'lead', 
            'lead.localidad.provincia',
            'empresa'
        ])->where('es_activo', 1)
        ->whereNull('deleted_at');
        
        // Filtrar contactos existentes por localidad
        if ($request->filled('localidad_nombre')) {
            $contactosQuery->whereHas('lead.localidad', function ($query) use ($request) {
                $query->where('nombre', 'like', '%' . $request->localidad_nombre . '%');
            });
        }
        
        // Filtrar contactos existentes por permisos
        if (!$usuario->ve_todas_cuentas) {
            $prefijosUsuario = $this->getPrefijosPermitidos();
            
            if (!empty($prefijosUsuario)) {
                $empresasIds = DB::table('empresas')
                    ->whereIn('prefijo_id', $prefijosUsuario)
                    ->whereNull('deleted_at')
                    ->pluck('id')
                    ->toArray();
                
                if (!empty($empresasIds)) {
                    $contactosQuery->whereIn('empresa_id', $empresasIds);
                } else {
                    $contactosQuery->whereRaw('1 = 0');
                }
            } else {
                $contactosQuery->whereRaw('1 = 0');
            }
        }
        
        // Búsqueda por nombre/email/empresa para contactos existentes
        if ($request->filled('search')) {
            $search = $request->search;
            $contactosQuery->where(function ($query) use ($search) {
                $query->whereHas('lead', function ($q) use ($search) {
                    $q->where('nombre_completo', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('telefono', 'like', "%{$search}%");
                })->orWhereHas('empresa', function ($q) use ($search) {
                    $q->where('nombre_fantasia', 'like', "%{$search}%")
                      ->orWhere('razon_social', 'like', "%{$search}%");
                });
            });
        }
        
        // ==========================================
        // 2. QUERY PARA LEADS UPGRADEADOS (prefijo_id = 7 Y es_cliente = 1)
        // ==========================================
        $leadsUpgradeQuery = Lead::with([
            'localidad.provincia'
        ])
        ->where('prefijo_id', 7)
        ->where('es_cliente', 1)
        ->where('es_activo', 1)
        ->whereNull('deleted_at')
        ->whereDoesntHave('empresaContacto');
        
        // Filtrar leads upgrade por localidad
        if ($request->filled('localidad_nombre')) {
            $leadsUpgradeQuery->whereHas('localidad', function ($query) use ($request) {
                $query->where('nombre', 'like', '%' . $request->localidad_nombre . '%');
            });
        }
        
        // Filtrar leads upgrade por permisos
        if (!$usuario->ve_todas_cuentas) {
            $prefijosUsuario = $this->getPrefijosPermitidos();
            
            if (!empty($prefijosUsuario)) {
                if (!in_array(7, $prefijosUsuario)) {
                    $leadsUpgradeQuery->whereRaw('1 = 0');
                }
            } else {
                $leadsUpgradeQuery->whereRaw('1 = 0');
            }
        }
        
        // Búsqueda para leads upgrade
        if ($request->filled('search')) {
            $search = $request->search;
            $leadsUpgradeQuery->where(function ($query) use ($search) {
                $query->where('nombre_completo', 'like', "%{$search}%")
                      ->orWhere('email', 'like', "%{$search}%")
                      ->orWhere('telefono', 'like', "%{$search}%");
            });
        }
        
        // ==========================================
        // 3. OBTENER Y COMBINAR RESULTADOS
        // ==========================================
        $contactosCollection = $contactosQuery->orderBy('created', 'desc')->get();
        $leadsUpgradeCollection = $leadsUpgradeQuery->orderBy('created', 'desc')->get();
        
        // Transformar leads upgrade a formato compatible con contactos
        $leadsUpgradeTransformados = $leadsUpgradeCollection->map(function($lead) {
            return (object) [
                'id' => -$lead->id,
                'empresa_id' => null,
                'lead_id' => $lead->id,
                'es_contacto_principal' => true,
                'es_activo' => true,
                'created' => $lead->created,
                'modified' => $lead->modified,
                'deleted_at' => null,
                'lead' => $lead,
                'empresa' => null,
                'es_upgrade' => true,
            ];
        });
        
        // Combinar ambas colecciones
        $todosLosContactos = $contactosCollection->concat($leadsUpgradeTransformados);
        
        // Ordenar por fecha de creación
        $todosLosContactos = $todosLosContactos->sortByDesc(function($item) {
            return $item->created;
        })->values();
        
        // ==========================================
        // 4. PAGINACIÓN MANUAL
        // ==========================================
        $perPage = 15;
        $currentPage = $request->get('page', 1);
        $offset = ($currentPage - 1) * $perPage;
        
        $paginatedItems = $todosLosContactos->slice($offset, $perPage)->values();
        
        $paginatedResult = new \Illuminate\Pagination\LengthAwarePaginator(
            $paginatedItems,
            $todosLosContactos->count(),
            $perPage,
            $currentPage,
            ['path' => $request->url(), 'query' => $request->query()]
        );
        
        // ==========================================
        // 5. ESTADÍSTICAS
        // ==========================================
        $contactosPrincipalesQuery = clone $contactosQuery;
        $contactosPrincipales = $contactosPrincipalesQuery->where('es_contacto_principal', 1)->count();
        $leadsUpgradePrincipales = $leadsUpgradeCollection->count();
        $totalPrincipales = $contactosPrincipales + $leadsUpgradePrincipales;
        
        // ==========================================
        // 6. OBTENER CONTADORES
        // ==========================================
        $leadIdsContactos = $contactosCollection->pluck('lead_id')->filter()->values()->toArray();
        $leadIdsUpgrade = $leadsUpgradeCollection->pluck('id')->filter()->values()->toArray();
        $todosLeadIds = array_merge($leadIdsContactos, $leadIdsUpgrade);
        
        $comentariosPorLead = $this->filterService->getConteoComentarios($todosLeadIds);
        $presupuestosPorLead = $this->filterService->getConteoPresupuestos($todosLeadIds);
        $contratosPorLead = $this->getConteoContratos($todosLeadIds);
        
        // ==========================================
        // 7. DATOS PARA FILTROS
        // ==========================================
        $localidades = \App\Models\Localidad::with('provincia')
            ->where('activo', 1)
            ->orderBy('nombre')
            ->get()
            ->map(function ($localidad) {
                return [
                    'id' => $localidad->id,
                    'nombre' => $localidad->nombre,
                    'provincia_nombre' => $localidad->provincia?->nombre,
                    'nombre_completo' => $localidad->nombre_completo,
                ];
            });
        
        $prefijosAsignados = [];
        $cantidadPrefijos = 0;
        if (!$usuario->ve_todas_cuentas) {
            $prefijosAsignados = $this->getPrefijosPermitidos();
            $cantidadPrefijos = count($prefijosAsignados);
        }
        
        return Inertia::render('Comercial/Contactos', [
            'contactos' => $paginatedResult,
            'estadisticas' => [
                'total' => $todosLosContactos->count(),
                'principales' => $totalPrincipales,
            ],
            'filters' => $request->only(['search', 'localidad_nombre']),
            'usuario' => [
                've_todas_cuentas' => (bool) $usuario->ve_todas_cuentas,
                'rol_id' => $usuario->rol_id,
                'personal_id' => $usuario->personal_id,
                'nombre_completo' => $usuario->personal ? 
                    $usuario->personal->nombre . ' ' . $usuario->personal->apellido : 
                    $usuario->nombre_usuario,
                'cantidad_prefijos' => $cantidadPrefijos,
                'prefijos_asignados' => $prefijosAsignados,
            ],
            'comentariosPorLead' => $comentariosPorLead,
            'presupuestosPorLead' => $presupuestosPorLead,
            'contratosPorLead' => $contratosPorLead,
            'localidades' => $localidades,
        ]);
    }
    
    /**
     * Mostrar un contacto específico
     */
    public function show($id)
    {
        $usuario = auth()->user();
        
        // Verificar si es un lead upgrade (ID negativo)
        if ($id < 0) {
            $leadId = abs($id);
            $lead = Lead::with(['localidad.provincia'])
                ->where('id', $leadId)
                ->where('prefijo_id', 7)
                ->where('es_cliente', 1)
                ->where('es_activo', 1)
                ->whereNull('deleted_at')
                ->firstOrFail();
            
            if (!$usuario->ve_todas_cuentas) {
                $prefijosUsuario = $this->getPrefijosPermitidos();
                if (!in_array(7, $prefijosUsuario)) {
                    abort(403, 'No tiene permisos para ver este contacto.');
                }
            }
            
            return Inertia::render('Comercial/ContactoShow', [
                'contacto' => (object) [
                    'id' => -$lead->id,
                    'empresa_id' => null,
                    'lead_id' => $lead->id,
                    'es_contacto_principal' => true,
                    'es_activo' => true,
                    'created' => $lead->created,
                    'lead' => $lead,
                    'empresa' => null,
                    'es_upgrade' => true,
                ],
                'usuario' => [
                    've_todas_cuentas' => (bool) $usuario->ve_todas_cuentas,
                ],
            ]);
        }
        
        // Contacto normal
        $contacto = EmpresaContacto::with(['lead', 'lead.localidad.provincia', 'empresa', 'empresa.comercial.personal'])
            ->where('id', $id)
            ->where('es_activo', 1)
            ->whereNull('deleted_at')
            ->firstOrFail();
        
        if (!$usuario->ve_todas_cuentas) {
            $prefijosUsuario = $this->getPrefijosPermitidos();
            
            if (!empty($prefijosUsuario)) {
                $empresaPrefijo = DB::table('empresas')
                    ->where('id', $contacto->empresa_id)
                    ->whereNull('deleted_at')
                    ->value('prefijo_id');
                
                if (!in_array($empresaPrefijo, $prefijosUsuario)) {
                    abort(403, 'No tiene permisos para ver este contacto.');
                }
            } else {
                abort(403, 'No tiene permisos para ver contactos.');
            }
        }
        
        return Inertia::render('Comercial/ContactoShow', [
            'contacto' => $contacto,
            'usuario' => [
                've_todas_cuentas' => (bool) $usuario->ve_todas_cuentas,
            ],
        ]);
    }
    
    /**
     * Crear un nuevo contacto
     */
    public function create()
    {
        $this->authorizePermiso(config('permisos.GESTIONAR_CONTACTOS'));
        
        $usuario = auth()->user();
        
        $empresasQuery = DB::table('empresas')
            ->select('id', 'razon_social', 'nombre_fantasia', 'prefijo_id')
            ->whereNull('deleted_at')
            ->orderBy('nombre_fantasia');
        
        if (!$usuario->ve_todas_cuentas) {
            $prefijosUsuario = $this->getPrefijosPermitidos();
            
            if (!empty($prefijosUsuario)) {
                $empresasQuery->whereIn('prefijo_id', $prefijosUsuario);
            } else {
                $empresasQuery->whereRaw('1 = 0');
            }
        }
        
        $empresas = $empresasQuery->get();
        
        return Inertia::render('Comercial/ContactoCreate', [
            'empresas' => $empresas,
            'usuario' => [
                've_todas_cuentas' => (bool) $usuario->ve_todas_cuentas,
            ],
        ]);
    }
    
    /**
     * Store a newly created resource in storage.
     */
    public function store(Request $request)
    {
        $this->authorizePermiso(config('permisos.GESTIONAR_CONTACTOS'));
        
        $validated = $request->validate([
            'empresa_id' => 'required|exists:empresas,id',
            'lead_id' => 'required|exists:leads,id',
            'es_contacto_principal' => 'boolean',
            'cargo' => 'nullable|string|max:100',
            'departamento' => 'nullable|string|max:100',
        ]);
        
        $usuario = auth()->user();
        if (!$usuario->ve_todas_cuentas) {
            $prefijosUsuario = $this->getPrefijosPermitidos();
            
            if (!empty($prefijosUsuario)) {
                $empresaPrefijo = DB::table('empresas')
                    ->where('id', $validated['empresa_id'])
                    ->whereNull('deleted_at')
                    ->value('prefijo_id');
                
                if (!in_array($empresaPrefijo, $prefijosUsuario)) {
                    return back()->withErrors([
                        'empresa_id' => 'No tiene permisos para crear contactos en esta empresa.'
                    ]);
                }
            } else {
                return back()->withErrors([
                    'empresa_id' => 'No tiene permisos para crear contactos.'
                ]);
            }
        }
        
        $contacto = EmpresaContacto::create([
            'empresa_id' => $validated['empresa_id'],
            'lead_id' => $validated['lead_id'],
            'es_contacto_principal' => $validated['es_contacto_principal'] ?? false,
            'cargo' => $validated['cargo'] ?? null,
            'departamento' => $validated['departamento'] ?? null,
            'es_activo' => true,
            'created' => now(),
            'created_by' => $usuario->id,
        ]);
        
        return redirect()->route('comercial.contactos.show', $contacto->id)
            ->with('success', 'Contacto creado exitosamente');
    }
    
    /**
     * Editar un contacto existente
     */
    public function edit($id)
    {
        $this->authorizePermiso(config('permisos.GESTIONAR_CONTACTOS'));
        
        $usuario = auth()->user();
        
        $contacto = EmpresaContacto::with(['lead', 'empresa'])
            ->where('id', $id)
            ->where('es_activo', 1)
            ->whereNull('deleted_at')
            ->firstOrFail();
        
        if (!$usuario->ve_todas_cuentas) {
            $prefijosUsuario = $this->getPrefijosPermitidos();
            
            if (!empty($prefijosUsuario)) {
                $empresaPrefijo = DB::table('empresas')
                    ->where('id', $contacto->empresa_id)
                    ->whereNull('deleted_at')
                    ->value('prefijo_id');
                
                if (!in_array($empresaPrefijo, $prefijosUsuario)) {
                    abort(403, 'No tiene permisos para editar este contacto.');
                }
            } else {
                abort(403, 'No tiene permisos para editar contactos.');
            }
        }
        
        $empresasQuery = DB::table('empresas')
            ->select('id', 'razon_social', 'nombre_fantasia', 'prefijo_id')
            ->whereNull('deleted_at')
            ->orderBy('nombre_fantasia');
        
        if (!$usuario->ve_todas_cuentas) {
            $prefijosUsuario = $this->getPrefijosPermitidos();
            
            if (!empty($prefijosUsuario)) {
                $empresasQuery->whereIn('prefijo_id', $prefijosUsuario);
            } else {
                $empresasQuery->whereRaw('1 = 0');
            }
        }
        
        $empresas = $empresasQuery->get();
        
        return Inertia::render('Comercial/ContactoEdit', [
            'contacto' => $contacto,
            'empresas' => $empresas,
            'usuario' => [
                've_todas_cuentas' => (bool) $usuario->ve_todas_cuentas,
            ],
        ]);
    }
    
    /**
     * Actualizar un contacto existente
     */
    public function update(Request $request, $id)
    {
        $this->authorizePermiso(config('permisos.GESTIONAR_CONTACTOS'));
        
        $contacto = EmpresaContacto::where('id', $id)
            ->where('es_activo', 1)
            ->whereNull('deleted_at')
            ->firstOrFail();
        
        $usuario = auth()->user();
        if (!$usuario->ve_todas_cuentas) {
            $prefijosUsuario = $this->getPrefijosPermitidos();
            
            if (!empty($prefijosUsuario)) {
                $empresaPrefijo = DB::table('empresas')
                    ->where('id', $contacto->empresa_id)
                    ->whereNull('deleted_at')
                    ->value('prefijo_id');
                
                if (!in_array($empresaPrefijo, $prefijosUsuario)) {
                    return back()->withErrors([
                        'empresa_id' => 'No tiene permisos para actualizar este contacto.'
                    ]);
                }
            } else {
                return back()->withErrors([
                    'empresa_id' => 'No tiene permisos para actualizar contactos.'
                ]);
            }
        }
        
        $validated = $request->validate([
            'empresa_id' => 'required|exists:empresas,id',
            'es_contacto_principal' => 'boolean',
            'cargo' => 'nullable|string|max:100',
            'departamento' => 'nullable|string|max:100',
        ]);
        
        if ($contacto->empresa_id != $validated['empresa_id'] && !$usuario->ve_todas_cuentas) {
            $prefijosUsuario = $this->getPrefijosPermitidos();
            
            if (!empty($prefijosUsuario)) {
                $nuevaEmpresaPrefijo = DB::table('empresas')
                    ->where('id', $validated['empresa_id'])
                    ->whereNull('deleted_at')
                    ->value('prefijo_id');
                
                if (!in_array($nuevaEmpresaPrefijo, $prefijosUsuario)) {
                    return back()->withErrors([
                        'empresa_id' => 'No tiene permisos para asignar este contacto a la nueva empresa.'
                    ]);
                }
            }
        }
        
        $contacto->update([
            'empresa_id' => $validated['empresa_id'],
            'es_contacto_principal' => $validated['es_contacto_principal'] ?? false,
            'cargo' => $validated['cargo'] ?? null,
            'departamento' => $validated['departamento'] ?? null,
            'modified' => now(),
            'modified_by' => $usuario->id,
        ]);
        
        return redirect()->route('comercial.contactos.show', $contacto->id)
            ->with('success', 'Contacto actualizado exitosamente');
    }
    
    /**
     * Eliminar un contacto (soft delete)
     */
    public function destroy($id)
    {
        $this->authorizePermiso(config('permisos.GESTIONAR_CONTACTOS'));
        
        $contacto = EmpresaContacto::where('id', $id)
            ->where('es_activo', 1)
            ->whereNull('deleted_at')
            ->firstOrFail();
        
        $usuario = auth()->user();
        if (!$usuario->ve_todas_cuentas) {
            $prefijosUsuario = $this->getPrefijosPermitidos();
            
            if (!empty($prefijosUsuario)) {
                $empresaPrefijo = DB::table('empresas')
                    ->where('id', $contacto->empresa_id)
                    ->whereNull('deleted_at')
                    ->value('prefijo_id');
                
                if (!in_array($empresaPrefijo, $prefijosUsuario)) {
                    abort(403, 'No tiene permisos para eliminar este contacto.');
                }
            } else {
                abort(403, 'No tiene permisos para eliminar contactos.');
            }
        }
        
        $contacto->update([
            'deleted_at' => now(),
            'deleted_by' => $usuario->id,
        ]);
        
        return redirect()->route('comercial.contactos.index')
            ->with('success', 'Contacto eliminado exitosamente');
    }

    /**
     * Obtener conteo de contratos (nuevos + legacy)
     */
    private function getConteoContratos(array $leadIds): array
    {
        if (empty($leadIds)) {
            return [];
        }

        $contratosNuevos = DB::table('contratos')
            ->select('lead_id', DB::raw('COUNT(*) as total'))
            ->whereIn('lead_id', $leadIds)
            ->where('activo', 1)
            ->whereNull('deleted_at')
            ->groupBy('lead_id')
            ->pluck('total', 'lead_id')
            ->toArray();

        $contratosLegacy = DB::table('contratos_legacy')
            ->select('lead_id', DB::raw('COUNT(*) as total'))
            ->whereIn('lead_id', $leadIds)
            ->groupBy('lead_id')
            ->pluck('total', 'lead_id')
            ->toArray();

        $resultado = [];
        foreach ($leadIds as $leadId) {
            $total = ($contratosNuevos[$leadId] ?? 0) + ($contratosLegacy[$leadId] ?? 0);
            if ($total > 0) {
                $resultado[$leadId] = $total;
            }
        }

        return $resultado;
    }
}