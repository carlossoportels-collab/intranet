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

            // 🔥 Redirigir a la página de creación de contrato con Inertia
            return redirect()->route('comercial.contratos.create', ['presupuestoId' => $presupuesto->id])
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
            
            // 🔥 Devolver respuesta Inertia con error
            return redirect()->back()->withErrors(['error' => 'Error al crear empresa: ' . $e->getMessage()]);
        }
    }

    public function update(Request $request, $empresaId)
    {
        try {
            Log::info('=== UPDATE EMPRESA ===', [
                'empresa_id' => $empresaId,
                'request_data' => $request->all(),
                'user_id' => auth()->id()
            ]);
            
            $validated = $request->validate([
                'presupuesto_id' => 'nullable|exists:presupuestos,id',
                'lead_id' => 'required|exists:leads,id',
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
            ]);

            // Buscar la empresa
            $empresa = Empresa::findOrFail($empresaId);
            
            // Actualizar la empresa
            $empresa->update($validated);
            
            // 🔥 Redirigir de vuelta con mensaje de éxito
            return redirect()->back()->with('success', 'Datos de empresa actualizados correctamente');
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            return redirect()->back()->withErrors($e->errors());
        } catch (\Exception $e) {
            Log::error('Error actualizando empresa:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return redirect()->back()->withErrors(['error' => 'Error al actualizar empresa: ' . $e->getMessage()]);
        }
    }
}