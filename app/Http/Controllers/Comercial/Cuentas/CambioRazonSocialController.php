<?php
// app/Http/Controllers/Comercial/Cuentas/CambioRazonSocialController.php

namespace App\Http\Controllers\Comercial\Cuentas;

use App\Http\Controllers\Controller;
use App\Traits\Authorizable; // 🔥 IMPORTAR TRAIT
use Illuminate\Http\Request;
use Inertia\Inertia;
use App\Models\Empresa;
use App\Models\CambioRazonSocial;
use App\Models\EmpresaContacto;
use App\Models\Usuario;
use App\Models\OrigenContacto;
use App\Models\Rubro;
use App\Models\Provincia;
use App\Models\TipoDocumento;
use App\Models\Nacionalidad;
use App\Models\TipoResponsabilidad;
use App\Models\CategoriaFiscal;
use App\Models\Plataforma;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CambioRazonSocialController extends Controller
{
    use Authorizable; // 🔥 AGREGAR TRAIT

    public function __construct()
    {
        $this->initializeAuthorization(); // 🔥 INICIALIZAR
    }

    /**
     * Mostrar listado de cambios y formulario
     */
    public function index(Request $request)
    {
        // 🔥 VERIFICAR PERMISO
        $this->authorizePermiso(config('permisos.GESTIONAR_CAMBIO_RAZON_SOCIAL'));
        
        $usuario = Auth::user();
        
        // Obtener prefijos permitidos
        $prefijosPermitidos = $this->getPrefijosPermitidos();
        
        // Empresas para el buscador (con filtro de permisos)
        $empresasQuery = Empresa::whereNull('deleted_at')
            ->with('prefijo')
            ->orderBy('nombre_fantasia');
        
        if (!$this->canViewAllRecords()) {
            if (!empty($prefijosPermitidos)) {
                $empresasQuery->whereIn('prefijo_id', $prefijosPermitidos);
            } else {
                $empresasQuery->whereRaw('1 = 0');
            }
        }
        
        $empresas = $empresasQuery->get()
            ->map(function ($empresa) {
                $codigoPrefijo = $empresa->prefijo ? $empresa->prefijo->codigo : 'EMP';
                return [
                    'id' => $empresa->id,
                    'codigo' => $codigoPrefijo . '-' . $empresa->numeroalfa,
                    'nombre_fantasia' => $empresa->nombre_fantasia,
                    'razon_social' => $empresa->razon_social,
                    'cuit' => $empresa->cuit,
                ];
            });

        // Historial de cambios (con filtro de permisos)
        $historialQuery = CambioRazonSocial::with(['empresa.prefijo', 'usuario.personal'])
            ->orderBy('fecha_cambio', 'desc');
        
        if (!$this->canViewAllRecords()) {
            $historialQuery->whereHas('empresa', function($q) use ($prefijosPermitidos) {
                $q->whereIn('prefijo_id', $prefijosPermitidos);
            });
        }

        $historial = $historialQuery->paginate(5)
            ->through(function ($cambio) {
                $codigoPrefijo = $cambio->empresa->prefijo ? $cambio->empresa->prefijo->codigo : 'EMP';
                $nombreUsuario = 'Sistema';
                
                if ($cambio->usuario && $cambio->usuario->personal) {
                    $nombreUsuario = $cambio->usuario->personal->nombre . ' ' . $cambio->usuario->personal->apellido;
                } elseif ($cambio->usuario) {
                    $nombreUsuario = $cambio->usuario->nombre_usuario;
                }
                
                return [
                    'id' => $cambio->id,
                    'empresa' => [
                        'id' => $cambio->empresa->id,
                        'codigo' => $codigoPrefijo . '-' . $cambio->empresa->numeroalfa,
                        'nombre' => $cambio->empresa->nombre_fantasia,
                    ],
                    'razon_social_anterior' => $cambio->razon_social_anterior,
                    'razon_social_nueva' => $cambio->razon_social_nueva,
                    'cuit_anterior' => $cambio->cuit_anterior,
                    'cuit_nuevo' => $cambio->cuit_nuevo,
                    'fecha_cambio' => $cambio->fecha_cambio->format('d/m/Y H:i'),
                    'usuario' => $nombreUsuario,
                ];
            });

        // Datos para los formularios
        $origenes = OrigenContacto::where('activo', true)->get();
        $rubros = Rubro::where('activo', true)->get();
        $provincias = Provincia::where('activo', true)->get();
        $tiposDocumento = TipoDocumento::where('es_activo', true)->get();
        $nacionalidades = Nacionalidad::all();
        $tiposResponsabilidad = TipoResponsabilidad::where('es_activo', true)->get();
        $categoriasFiscales = CategoriaFiscal::where('es_activo', true)->orderBy('nombre')->get(['id', 'codigo', 'nombre']);
        $plataformas = Plataforma::where('es_activo', true)->get();

        return Inertia::render('Comercial/Cuentas/CambioRazonSocial', [
            'empresas' => $empresas,
            'historial' => $historial,
            'origenes' => $origenes,
            'rubros' => $rubros,
            'provincias' => $provincias,
            'tiposDocumento' => $tiposDocumento,
            'nacionalidades' => $nacionalidades,
            'tiposResponsabilidad' => $tiposResponsabilidad,
            'categoriasFiscales' => $categoriasFiscales,
            'plataformas' => $plataformas,
        ]);
    }

    /**
     * Obtener datos completos de una empresa
     */
    public function getEmpresaDataCompleta($id)
    {
        $usuario = Auth::user();
        $prefijosPermitidos = $this->getPrefijosPermitidos();
        
        $empresa = Empresa::with([
            'prefijo',
            'localidadFiscal.provincia',
            'rubro',
            'categoriaFiscal',
            'plataforma',
            'contactos' => function ($query) {
                $query->where('es_activo', true)
                    ->with('lead.localidad.provincia');
            },
            'responsables' => function ($query) {
                $query->where('es_activo', true);
            }
        ])->findOrFail($id);

        // Verificar permisos
        if (!$this->canViewAllRecords()) {
            if (empty($prefijosPermitidos) || !in_array($empresa->prefijo_id, $prefijosPermitidos)) {
                abort(403, 'No tiene permisos para ver esta empresa');
            }
        }

        $codigoPrefijo = $empresa->prefijo ? $empresa->prefijo->codigo : 'EMP';

        return response()->json([
            'id' => $empresa->id,
            'codigo' => $codigoPrefijo . '-' . $empresa->numeroalfa,
            'nombre_fantasia' => $empresa->nombre_fantasia,
            'razon_social' => $empresa->razon_social,
            'cuit' => $empresa->cuit,
            'direccion_fiscal' => $empresa->direccion_fiscal,
            'codigo_postal_fiscal' => $empresa->codigo_postal_fiscal,
            'localidad_fiscal_id' => $empresa->localidad_fiscal_id,
            'localidad_fiscal_nombre' => $empresa->localidadFiscal?->nombre,
            'localidad_fiscal_provincia_id' => $empresa->localidadFiscal?->provincia_id,
            'localidad_fiscal_codigo_postal' => $empresa->localidadFiscal?->codigo_postal,
            'telefono_fiscal' => $empresa->telefono_fiscal,
            'email_fiscal' => $empresa->email_fiscal,
            'rubro_id' => $empresa->rubro_id,
            'rubro' => $empresa->rubro ? $empresa->rubro->nombre : null,
            'cat_fiscal_id' => $empresa->cat_fiscal_id,
            'categoria_fiscal' => $empresa->categoriaFiscal ? [
                'id' => $empresa->categoriaFiscal->id,
                'nombre' => $empresa->categoriaFiscal->nombre,
                'abreviatura' => $empresa->categoriaFiscal->abreviatura,
            ] : null,
            'plataforma_id' => $empresa->plataforma_id,
            'plataforma_nombre' => $empresa->plataforma?->nombre,
            'nombre_flota' => $empresa->nombre_flota,
            'contactos' => $empresa->contactos->map(function ($contacto) {
                $fechaNacimiento = null;
                if ($contacto->fecha_nacimiento) {
                    $fechaNacimiento = is_object($contacto->fecha_nacimiento) 
                        ? $contacto->fecha_nacimiento->format('Y-m-d') 
                        : $contacto->fecha_nacimiento;
                }
                
                return [
                    'id' => $contacto->id,
                    'empresa_id' => $contacto->empresa_id,
                    'es_contacto_principal' => $contacto->es_contacto_principal,
                    'tipo_responsabilidad_id' => $contacto->tipo_responsabilidad_id,
                    'tipo_documento_id' => $contacto->tipo_documento_id,
                    'nro_documento' => $contacto->nro_documento,
                    'nacionalidad_id' => $contacto->nacionalidad_id,
                    'fecha_nacimiento' => $fechaNacimiento,
                    'direccion_personal' => $contacto->direccion_personal,
                    'codigo_postal_personal' => $contacto->codigo_postal_personal,
                    'lead' => $contacto->lead ? [
                        'id' => $contacto->lead->id,
                        'nombre_completo' => $contacto->lead->nombre_completo,
                        'genero' => $contacto->lead->genero,
                        'telefono' => $contacto->lead->telefono,
                        'email' => $contacto->lead->email,
                        'localidad_id' => $contacto->lead->localidad_id,
                        'localidad' => $contacto->lead->localidad ? [
                            'id' => $contacto->lead->localidad->id,
                            'nombre' => $contacto->lead->localidad->nombre,
                            'provincia_id' => $contacto->lead->localidad->provincia_id,
                            'provincia' => $contacto->lead->localidad->provincia?->nombre,
                        ] : null,
                        'rubro_id' => $contacto->lead->rubro_id,
                        'rubro' => $contacto->lead->rubro ? $contacto->lead->rubro->nombre : null,
                        'origen_id' => $contacto->lead->origen_id,
                        'origen' => $contacto->lead->origen ? $contacto->lead->origen->nombre : null,
                    ] : null,
                ];
            }),
            'responsables' => $empresa->responsables->map(function ($responsable) {
                return [
                    'id' => $responsable->id,
                    'empresa_id' => $responsable->empresa_id,
                    'tipo_responsabilidad_id' => $responsable->tipo_responsabilidad_id,
                    'nombre' => $responsable->nombre,
                    'apellido' => $responsable->apellido,
                    'telefono' => $responsable->telefono,
                    'email' => $responsable->email,
                    'es_activo' => $responsable->es_activo,
                ];
            }),
        ]);
    }

    /**
     * Guardar todos los datos actualizados (empresa, lead y contacto)
     */
    public function updateCompleto(Request $request)
    {
        // 🔥 VERIFICAR PERMISO
        $this->authorizePermiso(config('permisos.GESTIONAR_CAMBIO_RAZON_SOCIAL'));
        
        $request->validate([
            'empresa_id' => 'required|exists:empresas,id',
            
            // Datos de empresa
            'nombre_fantasia' => 'required|string|max:200',
            'razon_social' => 'required|string|max:200',
            'cuit' => 'required|string|max:13',
            'direccion_fiscal' => 'required|string|max:255',
            'codigo_postal_fiscal' => 'required|string|max:10',
            'localidad_fiscal_id' => 'required|exists:localidades,id',
            'telefono_fiscal' => 'required|string|max:30',
            'email_fiscal' => 'required|email|max:150',
            'rubro_id' => 'required|exists:rubros,id',
            'cat_fiscal_id' => 'required|exists:categorias_fiscales,id',
            'plataforma_id' => 'required|exists:plataformas,id',
            'nombre_flota' => 'required|string|max:200',
            
            // Datos de lead
            'lead_nombre_completo' => 'required|string|max:100',
            'lead_genero' => 'required|in:masculino,femenino,otro,no_especifica',
            'lead_telefono' => 'required|string|max:20',
            'lead_email' => 'required|email|max:150',
            'lead_localidad_id' => 'nullable|exists:localidades,id',
            'lead_rubro_id' => 'nullable|exists:rubros,id',
            'lead_origen_id' => 'nullable|exists:origenes_contacto,id',
            
            // Datos de contacto
            'contacto_tipo_responsabilidad_id' => 'nullable|exists:tipos_responsabilidad,id',
            'contacto_tipo_documento_id' => 'nullable|exists:tipos_documento,id',
            'contacto_nro_documento' => 'nullable|string|max:20',
            'contacto_nacionalidad_id' => 'nullable|exists:nacionalidades,id',
            'contacto_fecha_nacimiento' => 'nullable|date',
            'contacto_direccion_personal' => 'nullable|string|max:255',
            'contacto_codigo_postal_personal' => 'nullable|string|max:10',
        ]);

        $usuario = Auth::user();
        $prefijosPermitidos = $this->getPrefijosPermitidos();
        
        DB::beginTransaction();
        
        try {
            $empresa = Empresa::findOrFail($request->empresa_id);
            
            // Verificar permisos
            if (!$this->canViewAllRecords()) {
                if (empty($prefijosPermitidos) || !in_array($empresa->prefijo_id, $prefijosPermitidos)) {
                    throw new \Exception('No tiene permisos para modificar esta empresa');
                }
            }
            
            // Buscar contacto principal
            $contacto = EmpresaContacto::where('empresa_id', $empresa->id)
                ->where('es_contacto_principal', true)
                ->first();
                
            if (!$contacto) {
                $contacto = EmpresaContacto::where('empresa_id', $empresa->id)->first();
            }
            
            // Recolectar cambios para el historial
            $datosAdicionales = [];
            
            // Actualizar empresa
            $empresaUpdate = [
                'nombre_fantasia' => $request->nombre_fantasia,
                'razon_social' => $request->razon_social,
                'cuit' => $request->cuit,
                'direccion_fiscal' => $request->direccion_fiscal,
                'codigo_postal_fiscal' => $request->codigo_postal_fiscal,
                'localidad_fiscal_id' => $request->localidad_fiscal_id,
                'telefono_fiscal' => $request->telefono_fiscal,
                'email_fiscal' => $request->email_fiscal,
                'rubro_id' => $request->rubro_id,
                'cat_fiscal_id' => $request->cat_fiscal_id,
                'plataforma_id' => $request->plataforma_id,
                'nombre_flota' => $request->nombre_flota,
                'modified' => now(),
                'modified_by' => $usuario->id,
            ];
            
            // Detectar cambios en empresa
            foreach ($empresaUpdate as $campo => $nuevo) {
                if ($campo !== 'modified' && $campo !== 'modified_by' && $empresa->$campo != $nuevo) {
                    $datosAdicionales['empresa'][$campo] = [
                        'anterior' => $empresa->$campo,
                        'nuevo' => $nuevo
                    ];
                }
            }
            
            $empresa->update($empresaUpdate);
            
            // Actualizar lead si existe contacto
            if ($contacto && $contacto->lead) {
                $leadUpdate = [
                    'nombre_completo' => $request->lead_nombre_completo,
                    'genero' => $request->lead_genero,
                    'telefono' => $request->lead_telefono,
                    'email' => $request->lead_email,
                    'localidad_id' => $request->lead_localidad_id,
                    'rubro_id' => $request->lead_rubro_id,
                    'origen_id' => $request->lead_origen_id,
                    'modified' => now(),
                    'modified_by' => $usuario->id,
                ];
                
                // Detectar cambios en lead
                foreach ($leadUpdate as $campo => $nuevo) {
                    if ($campo !== 'modified' && $campo !== 'modified_by' && $contacto->lead->$campo != $nuevo) {
                        $datosAdicionales['lead'][$campo] = [
                            'anterior' => $contacto->lead->$campo,
                            'nuevo' => $nuevo
                        ];
                    }
                }
                
                $contacto->lead->update($leadUpdate);
                
                // Actualizar empresa_contactos
                $contactoUpdate = [
                    'tipo_responsabilidad_id' => $request->contacto_tipo_responsabilidad_id,
                    'tipo_documento_id' => $request->contacto_tipo_documento_id,
                    'nro_documento' => $request->contacto_nro_documento,
                    'nacionalidad_id' => $request->contacto_nacionalidad_id,
                    'fecha_nacimiento' => $request->contacto_fecha_nacimiento,
                    'direccion_personal' => $request->contacto_direccion_personal,
                    'codigo_postal_personal' => $request->contacto_codigo_postal_personal,
                    'modified' => now(),
                    'modified_by' => $usuario->id,
                ];
                
                // Detectar cambios en contacto
                foreach ($contactoUpdate as $campo => $nuevo) {
                    if ($campo !== 'modified' && $campo !== 'modified_by' && $contacto->$campo != $nuevo) {
                        $datosAdicionales['contacto'][$campo] = [
                            'anterior' => $contacto->$campo,
                            'nuevo' => $nuevo
                        ];
                    }
                }
                
                $contacto->update($contactoUpdate);
            }
            
            // Guardar en historial de cambios
            CambioRazonSocial::create([
                'empresa_id' => $request->empresa_id,
                'razon_social_anterior' => $empresa->getOriginal('razon_social'),
                'cuit_anterior' => $empresa->getOriginal('cuit'),
                'razon_social_nueva' => $request->razon_social,
                'cuit_nuevo' => $request->cuit,
                'datos_adicionales' => !empty($datosAdicionales) ? $datosAdicionales : null,
                'fecha_cambio' => now(),
                'usuario_id' => $usuario->id,
            ]);
            
            DB::commit();
            
            return redirect()->back()->with('success', 'Datos actualizados correctamente');
            
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error al actualizar datos: ' . $e->getMessage());
            return back()->withErrors(['error' => 'Error al actualizar datos']);
        }
    }

    /**
     * Ver detalles de un cambio específico
     */
    public function show($id)
    {
        $usuario = Auth::user();
        $prefijosPermitidos = $this->getPrefijosPermitidos();
        
        $cambio = CambioRazonSocial::with(['empresa.prefijo', 'usuario.personal'])->findOrFail($id);
        
        // Verificar permisos
        if (!$this->canViewAllRecords()) {
            if (empty($prefijosPermitidos) || !in_array($cambio->empresa->prefijo_id, $prefijosPermitidos)) {
                abort(403, 'No tiene permisos para ver este cambio');
            }
        }

        $codigoPrefijo = $cambio->empresa->prefijo ? $cambio->empresa->prefijo->codigo : 'EMP';
        $codigoEmpresa = $codigoPrefijo . '-' . $cambio->empresa->numeroalfa;

        $nombreUsuario = 'Sistema';
        if ($cambio->usuario && $cambio->usuario->personal) {
            $nombreUsuario = $cambio->usuario->personal->nombre . ' ' . $cambio->usuario->personal->apellido;
        } elseif ($cambio->usuario) {
            $nombreUsuario = $cambio->usuario->nombre_usuario;
        }

        return response()->json([
            'id' => $cambio->id,
            'empresa' => [
                'id' => $cambio->empresa->id,
                'codigo' => $codigoEmpresa,
                'nombre' => $cambio->empresa->nombre_fantasia,
            ],
            'razon_social_anterior' => $cambio->razon_social_anterior,
            'razon_social_nueva' => $cambio->razon_social_nueva,
            'cuit_anterior' => $cambio->cuit_anterior,
            'cuit_nuevo' => $cambio->cuit_nuevo,
            'datos_adicionales' => $cambio->datos_adicionales,
            'fecha_cambio' => $cambio->fecha_cambio->format('d/m/Y H:i'),
            'usuario' => $nombreUsuario,
        ]);
    }
}