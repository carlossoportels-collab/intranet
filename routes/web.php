<?php

use Illuminate\Support\Facades\Route;
use Inertia\Inertia;

// Importaciones
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\Comercial\ActividadController;
use App\Http\Controllers\Comercial\ContactosController;
use App\Http\Controllers\Comercial\PresupuestosController;
use App\Http\Controllers\Comercial\RecordatoriosController;
use App\Http\Controllers\Comercial\ProspectosController;
use App\Http\Controllers\Comercial\LeadController;
use App\Http\Controllers\Comercial\MotivoPerdidaController;
use App\Http\Controllers\Comercial\LeadsPerdidosController;
use App\Http\Controllers\Comercial\LocalidadController;
use App\Http\Controllers\Comercial\Cuentas\DetallesController;
use App\Http\Controllers\Comercial\Cuentas\CertificadosFlotaController;
use App\Http\Controllers\Comercial\Cuentas\CambioTitularidadController;
use App\Http\Controllers\Comercial\Cuentas\CambioRazonSocialController;
use App\Http\Controllers\Config\Parametros\EstadosLeadController;
use App\Http\Controllers\Config\Parametros\MediosPagoController;
use App\Http\Controllers\Config\Parametros\MotivosBajaController;
use App\Http\Controllers\Config\Parametros\OrigenProspectoController;
use App\Http\Controllers\Config\Parametros\RubrosController;
use App\Http\Controllers\Config\Parametros\TerminosCondicionesController;
use App\Http\Controllers\Config\TarifasController;
use App\Http\Controllers\Config\PromocionController;
use App\Http\Controllers\Config\Usuarios\UsuariosSistemaController;
use App\Http\Controllers\Config\Usuarios\RolesPermisosController;
use App\Http\Controllers\CondComerciales\TarifasConsultaController;
use App\Http\Controllers\CondComerciales\ConveniosVigentesController;
use App\Http\Controllers\CondComerciales\NovedadesController;
use App\Http\Controllers\CondComerciales\ReenviosActivosController;
use App\Http\Controllers\RRHH\Equipos\EquipoComercialController;
use App\Http\Controllers\RRHH\Equipos\EquipoTecnicoController;
use App\Http\Controllers\RRHH\Personal\CumpleanosController;
use App\Http\Controllers\RRHH\Personal\DatosPersonalesController;
use App\Http\Controllers\RRHH\Personal\LicenciasController;
use App\Http\Controllers\Auth\LoginController;
use App\Http\Controllers\RRHH\Equipos\TecnicoController;
use App\Http\Controllers\NotificacionController;
use App\Http\Controllers\PresupuestoLegacyController;
use App\Http\Controllers\ContratoLegacyController;
use App\Http\Controllers\Comercial\DocumentacionController;

// ==================== NUEVOS CONTROLADORES PARA CONTRATOS ====================
use App\Http\Controllers\Comercial\Utils\TipoResponsabilidadController;
use App\Http\Controllers\Comercial\Utils\TipoDocumentoController;
use App\Http\Controllers\Comercial\Utils\PaisController;
use App\Http\Controllers\Comercial\Utils\CategoriaFiscalController;
use App\Http\Controllers\Comercial\Utils\PlataformaController;
use App\Http\Controllers\Comercial\Utils\RubroController;
use App\Http\Controllers\Comercial\Utils\ContratoController;
use App\Http\Controllers\Comercial\Utils\LeadDataController;
use App\Http\Controllers\Comercial\Utils\NacionalidadController;

// Rutas públicas
Route::get('/login', [LoginController::class, 'show'])->name('login');
Route::post('/login', [LoginController::class, 'login']);
Route::post('/logout', [LoginController::class, 'logout'])->name('logout');

Route::middleware(['auth', 'usuario.activo'])->group(function () {
    // ==================== RUTAS PRINCIPALES ====================
    Route::get('/welcome', [LoginController::class, 'welcome'])->name('welcome');
    Route::get('/', [DashboardController::class, 'index'])->name('home');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    
    // ==================== GESTIÓN COMERCIAL ====================
    Route::prefix('comercial')->group(function () {
        // ========== RUTAS SIMPLES (SIN PARÁMETROS) ==========
        Route::get('/actividad', [ActividadController::class, 'index'])->name('comercial.actividad');
        Route::get('/contactos', [ContactosController::class, 'index'])->name('comercial.contactos');
        Route::get('/prospectos', [ProspectosController::class, 'index'])->name('comercial.prospectos');
        Route::get('/leads-perdidos', [LeadsPerdidosController::class, 'index'])->name('comercial.leadsperdidos');
        Route::get('/tarifas', [TarifasConsultaController::class, 'index'])->name('comercial.tarifas');
        Route::get('/convenios', [ConveniosVigentesController::class, 'index'])->name('comercial.convenios');
        Route::get('/novedades', [NovedadesController::class, 'index'])->name('comercial.novedades');
        Route::get('/reenvios', [ReenviosActivosController::class, 'index'])->name('comercial.reenvios');
                // Rutas para documentación
        Route::get('/documentacion', [DocumentacionController::class, 'index'])->name('documentacion.index');
        Route::get('/documentacion/browse', [DocumentacionController::class, 'browse'])->name('documentacion.browse');
        Route::get('/documentacion/download', [DocumentacionController::class, 'download'])->name('documentacion.download');

        
        // ========== ENDPOINTS API (SIN PARÁMETROS) ==========
        Route::get('/motivos-perdida-activos', [MotivoPerdidaController::class, 'getMotivosActivos']);
        Route::get('/localidades/buscar', [LocalidadController::class, 'buscar'])->name('comercial.localidades.buscar');
        
        // ========== TIPOS DE COMENTARIO (SIN PARÁMETROS DE LEAD) ==========
        Route::get('/tipos-comentario/cliente', [ProspectosController::class, 'tiposComentarioCliente']);
        Route::get('/tipos-comentario/recontacto', [ProspectosController::class, 'tiposComentarioRecontacto']);
        Route::get('/tipos-comentario/lead', [ProspectosController::class, 'tiposComentarioLead']);
        
        // ========== PRESUPUESTOS ==========
        Route::get('/presupuestos', [PresupuestosController::class, 'index'])->name('comercial.presupuestos');
        Route::get('/presupuestos/create', [PresupuestosController::class, 'create'])->name('comercial.presupuestos.create');
        Route::post('/presupuestos', [PresupuestosController::class, 'store'])->name('comercial.presupuestos.store');
        Route::get('/presupuestos/{presupuesto}', [PresupuestosController::class, 'show'])->name('comercial.presupuestos.show');
        Route::get('/presupuestos/{presupuesto}/edit', [PresupuestosController::class, 'edit'])->name('comercial.presupuestos.edit');
        Route::put('/presupuestos/{presupuesto}', [PresupuestosController::class, 'update'])->name('comercial.presupuestos.update');
        Route::delete('/presupuestos/{presupuesto}', [PresupuestosController::class, 'destroy'])->name('comercial.presupuestos.destroy');
        Route::get('/presupuestos/{presupuesto}/pdf', [PresupuestosController::class, 'generarPdf'])->name('comercial.presupuestos.pdf');
        Route::post('/presupuestos/{presupuesto}/enviar-email', [PresupuestosController::class, 'enviarEmail'])->name('comercial.presupuestos.enviar-email');

        // ========== API PARA ENVÍO DE EMAILS ==========
        Route::prefix('api')->group(function () {
            Route::post('/presupuestos/{presupuesto}/enviar-email', [App\Http\Controllers\Api\EnvioEmailController::class, 'enviarPresupuesto'])
                ->name('api.presupuestos.enviar-email');
            Route::post('/contratos/{contrato}/enviar-email', [App\Http\Controllers\Api\EnvioEmailController::class, 'enviarContrato'])
                ->name('api.contratos.enviar-email');
        });

        // ========== ENDPOINTS AJAX PARA PRESUPUESTOS ==========
        Route::prefix('api/presupuestos')->group(function () {
            Route::get('/tasas', [PresupuestosController::class, 'getTasas']);
            Route::get('/abonos', [PresupuestosController::class, 'getAbonos']);
            Route::get('/accesorios', [PresupuestosController::class, 'getAccesorios']);
            Route::get('/servicios', [PresupuestosController::class, 'getServicios']);
        });
        
        // ========== EMPRESAS ==========
        Route::post('/empresa/responsables', [App\Http\Controllers\Comercial\EmpresaResponsableController::class, 'store'])->name('comercial.empresa.responsables.store');
        Route::delete('/empresa/responsables/{id}', [App\Http\Controllers\Comercial\EmpresaResponsableController::class, 'destroy'])->name('comercial.empresa.responsables.destroy');
        
        // ========== UTILS PARA CONTRATOS ==========
        Route::prefix('utils')->group(function () {
            Route::get('/tipos-responsabilidad/activos', [TipoResponsabilidadController::class, 'activos']);
            Route::get('/tipos-documento/activos', [TipoDocumentoController::class, 'activos']);
            Route::get('/nacionalidades', [NacionalidadController::class, 'index']);
            Route::get('/categorias-fiscales/activas', [CategoriaFiscalController::class, 'activas']);
            Route::get('/plataformas/activas', [PlataformaController::class, 'activas']);
            Route::get('/rubros/activos', [RubroController::class, 'activos']);
            Route::post('/empresa/paso1', [App\Http\Controllers\Comercial\Utils\Paso1LeadController::class, 'update']);
            Route::post('/empresa/paso2', [App\Http\Controllers\Comercial\Utils\Paso2ContactoController::class, 'store']);
            Route::post('/empresa/paso3', [App\Http\Controllers\Comercial\Utils\Paso3EmpresaController::class, 'store']);
            Route::post('/auditoria/dato-sensible', [App\Http\Controllers\Comercial\Utils\AuditoriaDatoSensibleController::class, 'store'])->name('comercial.utils.auditoria.dato-sensible');
        });
        
        // ========== CONTRATOS ==========
        Route::prefix('contratos')->group(function () {
            Route::get('/', [App\Http\Controllers\Comercial\ContratoController::class, 'index'])->name('comercial.contratos.index');
            Route::get('/crear/{presupuestoId}', [App\Http\Controllers\Comercial\ContratoController::class, 'create'])->name('comercial.contratos.create');
            Route::post('/', [App\Http\Controllers\Comercial\ContratoController::class, 'store'])->name('comercial.contratos.store');
            Route::get('/{id}/pdf', [App\Http\Controllers\Comercial\ContratoController::class, 'generarPdf'])->name('comercial.contratos.pdf');
            Route::get('/{id}', [App\Http\Controllers\Comercial\ContratoController::class, 'show'])->name('comercial.contratos.show');
            
            // Rutas para contrato desde empresa existente
            Route::get('/desde-empresa/{empresaId}', [App\Http\Controllers\Comercial\ContratoController::class, 'createFromEmpresa'])
                ->name('comercial.contratos.desde-empresa');  // GET para mostrar formulario
            
            Route::post('/desde-empresa', [App\Http\Controllers\Comercial\ContratoController::class, 'storeFromEmpresa'])
                ->name('comercial.contratos.store-from-empresa');  // ← POST para guardar (FALTABA)
        });
                
        // ========== CUENTAS ==========
        Route::prefix('cuentas')->group(function () {
            // Rutas GET (vistas)
            Route::get('/', [DetallesController::class, 'index'])->name('comercial.cuentas.detalles');
            Route::get('/certificados', [CertificadosFlotaController::class, 'index'])->name('comercial.cuentas.certificados');
            Route::get('/cambio-titularidad', [CambioTitularidadController::class, 'index'])->name('comercial.cuentas.cambio-titularidad');
            Route::get('/cambio-razon-social', [CambioRazonSocialController::class, 'index'])->name('comercial.cuentas.cambio-razon-social');
            
            // Rutas POST para cambio de razón social
            Route::post('/cambio-razon-social', [CambioRazonSocialController::class, 'store'])->name('comercial.cuentas.cambio-razon-social.store');
            Route::post('/actualizar-contacto', [CambioRazonSocialController::class, 'actualizarContacto'])->name('comercial.cuentas.actualizar-contacto');
            Route::post('/cambio-razon-social/completo', [CambioRazonSocialController::class, 'updateCompleto'])->name('comercial.cuentas.cambio-razon-social.completo');
            
            // Rutas POST para cambio de titularidad
            Route::post('/cambio-titularidad', [CambioTitularidadController::class, 'store'])->name('comercial.cuentas.cambio-titularidad.store');
            
            // Rutas GET para datos (API)
            Route::get('/cambio-razon-social/empresa/{id}/completa', [CambioRazonSocialController::class, 'getEmpresaDataCompleta'])->name('comercial.cuentas.cambio-razon-social.empresa-completa');
            Route::get('/cambio-razon-social/{id}', [CambioRazonSocialController::class, 'show'])->name('comercial.cuentas.cambio-razon-social.show');
            
            // Rutas GET para datos de titularidad (si las necesitas)
            Route::get('/cambio-titularidad/empresa/{id}/vehiculos', [CambioTitularidadController::class, 'getVehiculosEmpresa'])->name('comercial.cuentas.cambio-titularidad.vehiculos');
            Route::get('/cambio-titularidad/{id}', [CambioTitularidadController::class, 'show'])->name('comercial.cuentas.cambio-titularidad.show');
        });
        // ========== RUTAS CON PARÁMETROS LEAD (AL FINAL) ==========
        Route::prefix('leads/{lead}')->group(function () {
            Route::get('/', [LeadController::class, 'show'])->name('comercial.leads.show');
            Route::put('/', [ProspectosController::class, 'update'])->name('leads.update');
            Route::post('/comentarios', [ProspectosController::class, 'guardarComentario']);
            Route::get('/tiempos-estados', [ProspectosController::class, 'tiemposEntreEstados'])->name('leads.tiempos-estados');
            Route::get('/comentarios-modal-data', [ProspectosController::class, 'comentariosModalData'])->name('leads.comentarios-modal-data');
            Route::get('/datos-alta', [App\Http\Controllers\Comercial\Utils\LeadDataController::class, 'getDatosAlta']);
            
            // 🔹 RUTA CORREGIDA - Usamos {lead} pero con el modelo importado en el controlador
            Route::get('/verificar-datos-contrato', [LeadController::class, 'verificarDatosContrato'])->name('comercial.leads.verificar-datos-contrato');
        });

        // Rutas existentes fuera del grupo
        Route::get('/leads', [LeadController::class, 'index'])->name('comercial.leads.index');
        Route::post('/leads', [LeadController::class, 'store'])->name('comercial.leads.store');

        // Ruta para crear contrato desde lead
        Route::get('/contratos/create-from-lead/{presupuestoId}', [App\Http\Controllers\Comercial\ContratoController::class, 'createFromLead'])
            ->name('comercial.contratos.create-from-lead');

        // ========== LEADS PERDIDOS CON PARÁMETROS ==========
        Route::prefix('leads-perdidos/{lead}')->group(function () {
            Route::get('/modal-seguimiento', [LeadsPerdidosController::class, 'modalSeguimiento'])->name('leads-perdidos.modal-seguimiento');
            Route::post('/seguimiento', [LeadsPerdidosController::class, 'procesarSeguimiento'])->name('leads-perdidos.seguimiento');
        });
    });
    
    // ==================== CONFIGURACIÓN ====================
    Route::prefix('config')->group(function () {
        // Parámetros
        Route::prefix('parametros')->group(function () {
            Route::get('/medios-pago', [MediosPagoController::class, 'index'])->name('config.medios-pago');
            Route::get('/motivos-baja', [MotivosBajaController::class, 'index'])->name('config.motivos-baja');
            Route::get('/origen-prospecto', [OrigenProspectoController::class, 'index'])->name('config.origen-prospecto');
            Route::get('/rubros', [RubrosController::class, 'index'])->name('config.rubros');
            Route::get('/terminos-condiciones', [TerminosCondicionesController::class, 'index'])->name('config.terminos-condiciones');
            
            // Estados Lead CRUD
            Route::prefix('estados-lead')->group(function () {
                Route::get('/', [EstadosLeadController::class, 'index'])->name('config.estados-lead');
                Route::post('/', [EstadosLeadController::class, 'store']);
                Route::put('/{id}', [EstadosLeadController::class, 'update']);
                Route::delete('/{id}', [EstadosLeadController::class, 'destroy']);
                Route::post('/{id}/toggle-activo', [EstadosLeadController::class, 'toggleActivo']);
            });
        });
        
        // Tarifas
        Route::prefix('tarifas')->name('tarifas.')->group(function () {
            Route::get('/', [TarifasController::class, 'index'])->name('index');
            Route::post('/', [TarifasController::class, 'store'])->name('store');
            Route::put('/{id}', [TarifasController::class, 'update'])->name('update');
            Route::put('/{id}/toggle-activo', [TarifasController::class, 'toggleActivo'])->name('toggle-activo');
            Route::put('/{id}/toggle-presupuestable', [TarifasController::class, 'togglePresupuestable'])->name('tarifas.toggle-presupuestable');
            Route::delete('/{id}', [TarifasController::class, 'destroy'])->name('destroy');
            Route::get('/export', [TarifasController::class, 'export'])->name('export');
            Route::post('/procesar-archivo', [TarifasController::class, 'procesarArchivo'])->name('procesar-archivo');
            Route::post('/confirmar-actualizacion', [TarifasController::class, 'confirmarActualizacion'])->name('confirmar-actualizacion');
        });

        // Promociones
        Route::prefix('promociones')->group(function () {
            Route::get('/', [PromocionController::class, 'index'])->name('config.promociones.index');
            Route::get('/create', [PromocionController::class, 'create'])->name('config.promociones.create');
            Route::post('/', [PromocionController::class, 'store'])->name('config.promociones.store');
            Route::get('/{promocione}/edit', [PromocionController::class, 'edit'])->name('config.promociones.edit');
            Route::put('/{promocione}', [PromocionController::class, 'update'])->name('config.promociones.update');
            Route::delete('/{promocione}', [PromocionController::class, 'destroy'])->name('config.promociones.destroy');
            
            Route::prefix('api')->group(function () {
                Route::get('/productos', [PromocionController::class, 'getProductos'])->name('config.promociones.api.productos');
                Route::get('/productos/tipo/{tipo}', [PromocionController::class, 'getProductosPorTipo'])->name('config.promociones.api.productos-por-tipo');
            });
        });
                            
        // Usuarios
        Route::prefix('usuarios')->group(function () {
            Route::get('/', [UsuariosSistemaController::class, 'index'])->name('config.usuarios');
        });
    });
    
// ==================== RRHH ====================
Route::prefix('rrhh')->name('rrhh.')->middleware(['auth'])->group(function () {
    
    // ===== EQUIPOS =====
    Route::prefix('equipos')->name('equipos.')->group(function () {
        // Vista principal del equipo técnico
        Route::get('/tecnico', [EquipoTecnicoController::class, 'index'])->name('tecnico');
        
        // CRUD de técnicos
        Route::prefix('tecnicos')->name('tecnicos.')->group(function () {
            Route::get('/create', [TecnicoController::class, 'create'])->name('create');
            Route::post('/', [TecnicoController::class, 'store'])->name('store');
            Route::get('/{tecnico}/edit', [TecnicoController::class, 'edit'])->name('edit');
            Route::put('/{tecnico}', [TecnicoController::class, 'update'])->name('update');
            Route::delete('/{tecnico}', [TecnicoController::class, 'destroy'])->name('destroy');
        });
    });
    
    // ===== PERSONAL =====
    Route::prefix('personal')->name('personal.')->group(function () {
        // Datos personales
        Route::get('/datos', [DatosPersonalesController::class, 'index'])->name('datos');
        Route::get('/datos/crear', [DatosPersonalesController::class, 'create'])->name('datos.create');
        Route::post('/datos', [DatosPersonalesController::class, 'store'])->name('datos.store');
        Route::get('/datos/{id}/editar', [DatosPersonalesController::class, 'edit'])->name('datos.edit');
        Route::put('/datos/{id}', [DatosPersonalesController::class, 'update'])->name('datos.update');
        Route::delete('/datos/{id}', [DatosPersonalesController::class, 'destroy'])->name('datos.destroy');
        
        // Cumpleaños
        Route::get('/cumpleanos', [CumpleanosController::class, 'index'])->name('cumpleanos');
        
        // ===== LICENCIAS =====
        Route::prefix('licencias')->name('licencias.')->group(function () {
            Route::get('/', [LicenciasController::class, 'index'])->name('index');
            Route::get('/crear', [LicenciasController::class, 'create'])->name('create');
            Route::post('/', [LicenciasController::class, 'store'])->name('store');
            Route::get('/{id}', [LicenciasController::class, 'show'])->name('show');
            Route::get('/{id}/editar', [LicenciasController::class, 'edit'])->name('edit');
            Route::put('/{id}', [LicenciasController::class, 'update'])->name('update');
            Route::delete('/{id}', [LicenciasController::class, 'destroy'])->name('destroy');
        });
    });
});

  //   Route::prefix('estadisticas')->name('estadisticas.')->group(function () {
     //    Route::get('/comercial-grupal', [App\Http\Controllers\Estadisticas\ComercialGrupalController::class, 'index'])->name('comercial-grupal');
     //    Route::get('/comercial-individual/{id}', [App\Http\Controllers\Estadisticas\ComercialIndividualController::class, 'show'])->name('comercial-individual');
  //   });

// ===== ENDPOINTS API (fuera del prefijo rrhh pero con auth) =====
Route::middleware(['auth'])->prefix('api')->name('api.')->group(function () {
    // Búsqueda de personal para modales
    Route::get('/personal/buscar', [DatosPersonalesController::class, 'buscar'])->name('personal.buscar');
    
    // Obtener datos de un empleado por ID para cumpleaños y WhatsApp
    Route::get('/personal/{id}', function ($id) {
        $personal = App\Models\Personal::find($id);
        if (!$personal) {
            return response()->json(['error' => 'Personal no encontrado'], 404);
        }
        return response()->json([
            'id' => $personal->id,
            'nombre' => $personal->nombre,
            'apellido' => $personal->apellido,
            'nombre_completo' => $personal->nombre_completo,
            'telefono' => $personal->telefono,
            'email' => $personal->email,
        ]);
    })->name('personal.show');
});
    
    // ==================== NOTIFICACIONES ====================
    Route::prefix('notificaciones')->group(function () {
        Route::get('/', [NotificacionController::class, 'index'])->name('notificaciones.index');
        Route::get('/programadas', [NotificacionController::class, 'programadas'])->name('notificaciones.programadas');
        
        Route::prefix('ajax')->group(function () {
            Route::get('/', [NotificacionController::class, 'ajaxIndex'])->name('notificaciones.ajax.index');
            Route::post('/{id}/marcar-leida', [NotificacionController::class, 'marcarLeida'])->name('notificaciones.marcar-leida');
            Route::post('/marcar-todas-leidas', [NotificacionController::class, 'marcarTodasLeidas'])->name('notificaciones.marcar-todas');
            Route::delete('/{id}', [NotificacionController::class, 'destroy'])->name('notificaciones.destroy');
            Route::get('/contador', [NotificacionController::class, 'contador'])->name('notificaciones.contador');
        });
    });

    // ==================== PRESUPUESTOS LEGACY ====================
    Route::prefix('presupuestos-legacy')->group(function () {
        Route::get('/{id}/pdf', [PresupuestoLegacyController::class, 'verPdf'])->name('presupuestos-legacy.pdf');
        Route::get('/{id}/descargar', [PresupuestoLegacyController::class, 'descargarPdf'])->name('presupuestos-legacy.descargar');
    });
    
    // ==================== CONTRATOS LEGACY ====================
    Route::prefix('contratos-legacy')->middleware(['auth'])->group(function () {
        Route::get('/{id}/pdf', [ContratoLegacyController::class, 'verPdf'])->name('contratos-legacy.pdf');
        Route::get('/{id}/descargar', [ContratoLegacyController::class, 'descargarPdf'])->name('contratos-legacy.descargar');
    });

    // ==================== FALLBACK ====================
    Route::fallback(function () {
        return Inertia::render('Errors/404');
    });
});