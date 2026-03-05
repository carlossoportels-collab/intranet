<?php

namespace App\Http\Controllers\Comercial;

use App\Http\Controllers\Controller;
use App\Services\Lead\LeadFilterService;
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\EmpresaContacto;
use Illuminate\Support\Facades\DB;

class ContactosController extends Controller
{
    protected LeadFilterService $filterService;

    public function __construct(LeadFilterService $filterService)
    {
        $this->filterService = $filterService;
    }

    /**
     * Obtener los prefijos permitidos para un usuario
     */
    private function getPrefijosPermitidos($usuarioId)
    {
        return DB::table('usuario_prefijos')
            ->where('usuario_id', $usuarioId)
            ->where('activo', 1)
            ->whereNull('deleted_at')
            ->pluck('prefijo_id')
            ->toArray();
    }
    
    /**
     * Aplicar filtro de prefijos a una query
     */
    private function aplicarFiltroPrefijos($query, $usuario, $campoPrefijo = 'prefijo_id')
    {
        if (!$usuario->ve_todas_cuentas) {
            $prefijosPermitidos = $this->getPrefijosPermitidos($usuario->id);
            
            if (!empty($prefijosPermitidos)) {
                $query->whereIn($campoPrefijo, $prefijosPermitidos);
            } else {
                $query->whereRaw('1 = 0');
            }
        }
        
        return $query;
    }

    public function index(Request $request)
    {
        $usuario = auth()->user();
        
        // Base query para contactos (empresa_contactos con lead asociado)
        $contactosQuery = EmpresaContacto::with(['lead', 'empresa'])
            ->where('es_activo', 1)
            ->whereNull('deleted_at');
        
        // Filtrar por prefijos si el usuario no ve todos
        if (!$usuario->ve_todas_cuentas) {
            // Obtener prefijos del usuario
            $prefijosUsuario = $this->getPrefijosPermitidos($usuario->id);
            
            if (!empty($prefijosUsuario)) {
                // Primero obtener empresas con esos prefijos
                $empresasIds = DB::table('empresas')
                    ->whereIn('prefijo_id', $prefijosUsuario)
                    ->whereNull('deleted_at')
                    ->pluck('id')
                    ->toArray();
                
                // Luego filtrar contactos por esas empresas
                if (!empty($empresasIds)) {
                    $contactosQuery->whereIn('empresa_id', $empresasIds);
                } else {
                    $contactosQuery->whereRaw('1 = 0');
                }
            } else {
                $contactosQuery->whereRaw('1 = 0');
            }
        }
        
        // Aplicar búsqueda si existe
        if ($request->has('search') && $request->search) {
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
        
        // Ordenar por fecha de creación (más recientes primero)
        $contactos = $contactosQuery->orderBy('created', 'desc')
            ->paginate(15)
            ->withQueryString();
        
        // Contar contactos principales (con los mismos filtros)
        $contactosPrincipalesQuery = EmpresaContacto::query()
            ->where('es_activo', 1)
            ->where('es_contacto_principal', 1)
            ->whereNull('deleted_at');
        
        // Aplicar los mismos filtros de permisos
        if (!$usuario->ve_todas_cuentas) {
            $prefijosUsuario = $this->getPrefijosPermitidos($usuario->id);
            
            if (!empty($prefijosUsuario)) {
                $empresasIds = DB::table('empresas')
                    ->whereIn('prefijo_id', $prefijosUsuario)
                    ->whereNull('deleted_at')
                    ->pluck('id')
                    ->toArray();
                
                if (!empty($empresasIds)) {
                    $contactosPrincipalesQuery->whereIn('empresa_id', $empresasIds);
                } else {
                    $contactosPrincipalesQuery->whereRaw('1 = 0');
                }
            } else {
                $contactosPrincipalesQuery->whereRaw('1 = 0');
            }
        }
        
        $contactosPrincipales = $contactosPrincipalesQuery->count();
        
        // Obtener los prefijos asignados al usuario para mostrar en la vista
        $prefijosAsignados = [];
        $cantidadPrefijos = 0;
        if (!$usuario->ve_todas_cuentas) {
            $prefijosAsignados = $this->getPrefijosPermitidos($usuario->id);
            $cantidadPrefijos = count($prefijosAsignados);
        }
        
        // Obtener IDs de leads de los contactos para los conteos
        $leadIds = $contactos->pluck('lead_id')->filter()->values()->toArray();
        
        // Usar el LeadFilterService para obtener los conteos
        $comentariosPorLead = $this->filterService->getConteoComentarios($leadIds);
        $presupuestosPorLead = $this->filterService->getConteoPresupuestos($leadIds);
        $contratosPorLead = $this->getConteoContratos($leadIds);  // ← NUEVO
        
        return Inertia::render('Comercial/Contactos', [
            'contactos' => $contactos,
            'estadisticas' => [
                'total' => $contactos->total(),
                'principales' => $contactosPrincipales,
            ],
            'filters' => $request->only(['search']),
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
            'contratosPorLead' => $contratosPorLead, // ← NUEVO
        ]);
    }
    
    /**
     * Mostrar un contacto específico
     */
    public function show($id)
    {
        $usuario = auth()->user();
        
        $contacto = EmpresaContacto::with(['lead', 'empresa', 'empresa.comercial.personal'])
            ->where('id', $id)
            ->where('es_activo', 1)
            ->whereNull('deleted_at')
            ->firstOrFail();
        
        // Verificar permisos para ver este contacto
        if (!$usuario->ve_todas_cuentas) {
            $prefijosUsuario = $this->getPrefijosPermitidos($usuario->id);
            
            if (!empty($prefijosUsuario)) {
                // Verificar si la empresa del contacto tiene un prefijo permitido
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
        $usuario = auth()->user();
        
        // Obtener empresas disponibles según permisos
        $empresasQuery = DB::table('empresas')
            ->select('id', 'razon_social', 'nombre_fantasia', 'prefijo_id')
            ->whereNull('deleted_at')
            ->orderBy('nombre_fantasia');
        
        // Filtrar empresas por permisos
        if (!$usuario->ve_todas_cuentas) {
            $prefijosUsuario = $this->getPrefijosPermitidos($usuario->id);
            
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
        // Validar los datos del formulario
        $validated = $request->validate([
            'empresa_id' => 'required|exists:empresas,id',
            'lead_id' => 'required|exists:leads,id',
            'es_contacto_principal' => 'boolean',
            'cargo' => 'nullable|string|max:100',
            'departamento' => 'nullable|string|max:100',
        ]);
        
        // Verificar permisos para crear contacto en esta empresa
        $usuario = auth()->user();
        if (!$usuario->ve_todas_cuentas) {
            $prefijosUsuario = $this->getPrefijosPermitidos($usuario->id);
            
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
        
        // Crear el contacto
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
        $usuario = auth()->user();
        
        $contacto = EmpresaContacto::with(['lead', 'empresa'])
            ->where('id', $id)
            ->where('es_activo', 1)
            ->whereNull('deleted_at')
            ->firstOrFail();
        
        // Verificar permisos para editar este contacto
        if (!$usuario->ve_todas_cuentas) {
            $prefijosUsuario = $this->getPrefijosPermitidos($usuario->id);
            
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
        
        // Obtener empresas disponibles según permisos
        $empresasQuery = DB::table('empresas')
            ->select('id', 'razon_social', 'nombre_fantasia', 'prefijo_id')
            ->whereNull('deleted_at')
            ->orderBy('nombre_fantasia');
        
        // Filtrar empresas por permisos
        if (!$usuario->ve_todas_cuentas) {
            $prefijosUsuario = $this->getPrefijosPermitidos($usuario->id);
            
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
        $contacto = EmpresaContacto::where('id', $id)
            ->where('es_activo', 1)
            ->whereNull('deleted_at')
            ->firstOrFail();
        
        // Verificar permisos para actualizar este contacto
        $usuario = auth()->user();
        if (!$usuario->ve_todas_cuentas) {
            $prefijosUsuario = $this->getPrefijosPermitidos($usuario->id);
            
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
        
        // Validar los datos del formulario
        $validated = $request->validate([
            'empresa_id' => 'required|exists:empresas,id',
            'es_contacto_principal' => 'boolean',
            'cargo' => 'nullable|string|max:100',
            'departamento' => 'nullable|string|max:100',
        ]);
        
        // Verificar permisos para la nueva empresa si cambió
        if ($contacto->empresa_id != $validated['empresa_id'] && !$usuario->ve_todas_cuentas) {
            $prefijosUsuario = $this->getPrefijosPermitidos($usuario->id);
            
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
        
        // Actualizar el contacto
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
        $contacto = EmpresaContacto::where('id', $id)
            ->where('es_activo', 1)
            ->whereNull('deleted_at')
            ->firstOrFail();
        
        // Verificar permisos para eliminar este contacto
        $usuario = auth()->user();
        if (!$usuario->ve_todas_cuentas) {
            $prefijosUsuario = $this->getPrefijosPermitidos($usuario->id);
            
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
        
        // Soft delete del contacto
        $contacto->update([
            'deleted_at' => now(),
            'deleted_by' => $usuario->id,
        ]);
        
        return redirect()->route('comercial.contactos.index')
            ->with('success', 'Contacto eliminado exitosamente');
    }

    /**
     * Obtener conteo de comentarios (incluyendo legacy)
     */
    private function getConteoComentarios(array $leadIds): array
    {
        if (empty($leadIds)) {
            return [];
        }

        // Comentarios actuales
        $comentariosActuales = DB::table('comentarios')
            ->select('lead_id', DB::raw('COUNT(*) as total'))
            ->whereIn('lead_id', $leadIds)
            ->whereNull('deleted_at')
            ->groupBy('lead_id')
            ->pluck('total', 'lead_id')
            ->toArray();

        // Comentarios legacy
        $comentariosLegacy = DB::table('comentarios_legacy')
            ->select('lead_id', DB::raw('COUNT(*) as total'))
            ->whereIn('lead_id', $leadIds)
            ->groupBy('lead_id')
            ->pluck('total', 'lead_id')
            ->toArray();

        // Combinar
        $resultado = [];
        foreach ($leadIds as $leadId) {
            $total = ($comentariosActuales[$leadId] ?? 0) + ($comentariosLegacy[$leadId] ?? 0);
            if ($total > 0) {
                $resultado[$leadId] = $total;
            }
        }

        return $resultado;
    }

    /**
     * Obtener conteo de presupuestos (incluyendo legacy)
     */
    private function getConteoPresupuestos(array $leadIds): array
    {
        if (empty($leadIds)) {
            return [];
        }

        // Presupuestos actuales
        $presupuestosActuales = DB::table('presupuestos')
            ->select('lead_id', DB::raw('COUNT(*) as total'))
            ->whereIn('lead_id', $leadIds)
            ->whereNull('deleted_at')
            ->groupBy('lead_id')
            ->pluck('total', 'lead_id')
            ->toArray();

        // Presupuestos legacy
        $presupuestosLegacy = DB::table('presupuestos_legacy')
            ->select('lead_id', DB::raw('COUNT(*) as total'))
            ->whereIn('lead_id', $leadIds)
            ->groupBy('lead_id')
            ->pluck('total', 'lead_id')
            ->toArray();

        // Combinar
        $resultado = [];
        foreach ($leadIds as $leadId) {
            $total = ($presupuestosActuales[$leadId] ?? 0) + ($presupuestosLegacy[$leadId] ?? 0);
            if ($total > 0) {
                $resultado[$leadId] = $total;
            }
        }

        return $resultado;
    }

    /**
     * Obtener conteo de contratos (nuevos + legacy) ← NUEVO
     */
    private function getConteoContratos(array $leadIds): array
    {
        if (empty($leadIds)) {
            return [];
        }

        // Contratos nuevos
        $contratosNuevos = DB::table('contratos')
            ->select('lead_id', DB::raw('COUNT(*) as total'))
            ->whereIn('lead_id', $leadIds)
            ->where('activo', 1)
            ->whereNull('deleted_at')
            ->groupBy('lead_id')
            ->pluck('total', 'lead_id')
            ->toArray();

        // Contratos legacy
        $contratosLegacy = DB::table('contratos_legacy')
            ->select('lead_id', DB::raw('COUNT(*) as total'))
            ->whereIn('lead_id', $leadIds)
            ->groupBy('lead_id')
            ->pluck('total', 'lead_id')
            ->toArray();

        // Combinar
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