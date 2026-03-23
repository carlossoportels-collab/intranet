<?php
// app/Http/Controllers/Comercial/Utils/Paso3EmpresaController.php

namespace App\Http\Controllers\Comercial\Utils;

use App\Http\Controllers\Controller;
use App\Models\Presupuesto;
use App\Models\Lead;
use App\Models\Empresa;
use App\Models\EmpresaContacto;
use App\Models\EmpresaResponsable;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class Paso3EmpresaController extends Controller
{
    public function store(Request $request)
    {
        Log::info('🟢 [PASO3] Iniciando creación de empresa', [
            'user_id' => auth()->id(),
            'user_rol' => auth()->user()->rol_id,
            'request_data' => $request->all()
        ]);

        try {
            $validated = $request->validate([
                'presupuesto_id' => 'required|integer|exists:presupuestos,id',
                'lead_id' => 'required|integer|exists:leads,id',
                'nombre_fantasia' => 'required|string|max:200',
                'razon_social' => 'required|string|max:200',
                'cuit' => 'required|string|max:13',
                'direccion_fiscal' => 'required|string|max:255',
                'codigo_postal_fiscal' => 'required|string|max:10',
                'localidad_fiscal_id' => 'required|integer|exists:localidades,id',
                'telefono_fiscal' => 'required|string|max:30',
                'email_fiscal' => 'required|email|max:150',
                'rubro_id' => 'required|integer|exists:rubros,id',
                'cat_fiscal_id' => 'required|integer|exists:categorias_fiscales,id',
                'plataforma_id' => 'required|integer|exists:plataformas,id',
                'nombre_flota' => 'required|string|max:200',
            ]);

            DB::beginTransaction();
            Log::info('🟢 [PASO3] Transacción iniciada');

            $lead = Lead::findOrFail($request->lead_id);
            $presupuesto = Presupuesto::findOrFail($request->presupuesto_id);
            
            Log::info('🟢 [PASO3] Datos encontrados', [
                'lead_id' => $lead->id,
                'presupuesto_id' => $presupuesto->id,
                'presupuesto_estado' => $presupuesto->estado_id
            ]);
            
            $contactoId = session('contacto_id');
            Log::info('🟢 [PASO3] Contacto de sesión', ['contacto_id' => $contactoId]);
            
            if (!$contactoId) {
                throw new \Exception('No se encontró el contacto. Complete el paso 2 primero.');
            }
            
            $contacto = EmpresaContacto::findOrFail($contactoId);
            Log::info('🟢 [PASO3] Contacto encontrado', ['contacto_id' => $contacto->id]);

            // Crear la empresa
            $empresa = Empresa::create([
                'alta_emp' => now(),
                'prefijo_id' => $lead->prefijo_id,
                'numeroalfa' => null,
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
                'es_activo' => true,
                'created_by' => auth()->id(),
                'created' => now(),
            ]);

            Log::info('🟢 [PASO3] Empresa creada', [
                'empresa_id' => $empresa->id,
                'nombre' => $empresa->nombre_fantasia
            ]);

            // Actualizar contacto con empresa_id
            $contacto->update([
                'empresa_id' => $empresa->id,
                'modified_by' => auth()->id(),
            ]);
            Log::info('🟢 [PASO3] Contacto actualizado con empresa_id', ['contacto_id' => $contacto->id]);

            // Actualizar responsables con empresa_id
            $tiposResponsabilidad = [3, 4, 5];
            foreach ($tiposResponsabilidad as $tipo) {
                $responsableId = session("responsable_{$tipo}_id");
                if ($responsableId) {
                    EmpresaResponsable::where('id', $responsableId)->update([
                        'empresa_id' => $empresa->id,
                        'modified_by' => auth()->id(),
                    ]);
                    Log::info('🟢 [PASO3] Responsable actualizado', [
                        'tipo' => $tipo,
                        'responsable_id' => $responsableId
                    ]);
                }
            }

            // Actualizar presupuesto
            $presupuesto->update([
                'estado_id' => 3, 
                'modified' => now(),
                'modified_by' => auth()->id(),
            ]);
            Log::info('🟢 [PASO3] Presupuesto actualizado', [
                'presupuesto_id' => $presupuesto->id,
                'nuevo_estado' => 3
            ]);

            DB::commit();
            Log::info('✅ [PASO3] Transacción confirmada');
            
            session()->forget(['contacto_id', 'responsable_3_id', 'responsable_4_id', 'responsable_5_id']);
            Log::info('🟢 [PASO3] Sesión limpiada');

            // 🔥 VERIFICAR LA RUTA ANTES DE REDIRIGIR
            $routeName = 'comercial.contratos.create';
            $routeParams = ['presupuestoId' => $presupuesto->id];
            
            Log::info('🟢 [PASO3] Preparando redirección', [
                'route_name' => $routeName,
                'route_params' => $routeParams,
                'full_url' => route($routeName, $routeParams)
            ]);
            
            // Verificar si la ruta existe
            try {
                $url = route($routeName, $routeParams);
                Log::info('🟢 [PASO3] Ruta válida', ['url' => $url]);
            } catch (\Exception $e) {
                Log::error('❌ [PASO3] La ruta no existe', [
                    'error' => $e->getMessage(),
                    'route_name' => $routeName
                ]);
                throw new \Exception('La ruta ' . $routeName . ' no existe. Verifica el nombre en routes/web.php');
            }
            
            // Verificar permisos
            $user = auth()->user();
            $permisoService = app(\App\Services\PermisoService::class);
            $tienePermiso = $permisoService->usuarioTienePermiso($user->id, config('permisos.GESTIONAR_CONTRATOS'));
            
            Log::info('🟢 [PASO3] Verificando permisos', [
                'user_id' => $user->id,
                'user_rol' => $user->rol_id,
                'permiso_necesario' => config('permisos.GESTIONAR_CONTRATOS'),
                'tiene_permiso' => $tienePermiso
            ]);

            if (!$tienePermiso) {
                Log::warning('⚠️ [PASO3] Usuario sin permiso para crear contrato', [
                    'user_id' => $user->id,
                    'rol' => $user->rol_id
                ]);
            }

            return redirect()->route($routeName, $routeParams)
                ->with('success', 'Empresa creada exitosamente. Complete los datos del contrato.')
                ->with('lead_id', $lead->id)
                ->with('empresa_id', $empresa->id);

        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('❌ [PASO3] Error:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => auth()->id(),
                'request_data' => $request->all()
            ]);
            
            if (request()->expectsJson()) {
                return response()->json([
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ], 500);
            }
            
            return redirect()->back()->with('error', 'Error al crear empresa: ' . $e->getMessage());
        }
    }
}