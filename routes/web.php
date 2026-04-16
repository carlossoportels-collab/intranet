<?php
use App\Http\Controllers\DashboardController;

// Auth
use App\Http\Controllers\Auth\LoginController;

// Comercial
use App\Http\Controllers\Comercial\ActividadController;
use App\Http\Controllers\Comercial\ContactosController;
use App\Http\Controllers\Comercial\PresupuestosController;
use App\Http\Controllers\Comercial\RecordatoriosController;
use App\Http\Controllers\Comercial\LeadContactController;
use App\Http\Controllers\Comercial\ProspectosController;
use App\Http\Controllers\Comercial\LeadController;
use App\Http\Controllers\Comercial\MotivoPerdidaController;
use App\Http\Controllers\Comercial\LeadsPerdidosController;
use App\Http\Controllers\Comercial\LocalidadController;
use App\Http\Controllers\Comercial\DocumentacionController;
use App\Http\Controllers\Comercial\ContratoController;

// Comercial - Cuentas
use App\Http\Controllers\Comercial\Cuentas\DetallesController;
use App\Http\Controllers\Comercial\Cuentas\CertificadosFlotaController;
use App\Http\Controllers\Comercial\Cuentas\CambioTitularidadController;
use App\Http\Controllers\Comercial\Cuentas\CambioRazonSocialController;
use App\Http\Controllers\Comercial\Cuentas\TransferenciasController;
use App\Http\Controllers\Comercial\Cuentas\ExternoController;

// Comercial - Utils
use App\Http\Controllers\Comercial\Utils\TipoResponsabilidadController;
use App\Http\Controllers\Comercial\Utils\TipoDocumentoController;
use App\Http\Controllers\Comercial\Utils\PaisController;
use App\Http\Controllers\Comercial\Utils\CategoriaFiscalController;
use App\Http\Controllers\Comercial\Utils\PlataformaController;
use App\Http\Controllers\Comercial\Utils\RubroController;
use App\Http\Controllers\Comercial\Utils\LeadDataController;
use App\Http\Controllers\Comercial\Utils\NacionalidadController;
use App\Http\Controllers\Comercial\Utils\Paso1LeadController;
use App\Http\Controllers\Comercial\Utils\Paso2ContactoController;
use App\Http\Controllers\Comercial\Utils\Paso3EmpresaController;
use App\Http\Controllers\Comercial\Utils\AuditoriaDatoSensibleController;

// Configuración
use App\Http\Controllers\Config\Parametros\EstadosLeadController;
use App\Http\Controllers\Config\Parametros\MediosPagoController;
use App\Http\Controllers\Config\Parametros\MotivosBajaController;
use App\Http\Controllers\Config\Parametros\OrigenProspectoController;
use App\Http\Controllers\Config\Parametros\RubrosController;
use App\Http\Controllers\Config\Parametros\TerminosCondicionesController;
use App\Http\Controllers\Config\TarifasController;
use App\Http\Controllers\Config\GestionAdminController;
use App\Http\Controllers\Config\PromocionController;
use App\Http\Controllers\Config\Usuarios\UsuariosSistemaController;
use App\Http\Controllers\Config\Usuarios\RolesPermisosController;

// Condiciones Comerciales
use App\Http\Controllers\CondComerciales\TarifasConsultaController;
use App\Http\Controllers\CondComerciales\ConveniosVigentesController;
use App\Http\Controllers\CondComerciales\NovedadesController;
use App\Http\Controllers\CondComerciales\ReenviosActivosController;

// RRHH
use App\Http\Controllers\RRHH\Equipos\EquipoComercialController;
use App\Http\Controllers\RRHH\Equipos\EquipoTecnicoController;
use App\Http\Controllers\RRHH\Equipos\ComercialController;
use App\Http\Controllers\RRHH\Equipos\TecnicoController;
use App\Http\Controllers\RRHH\Personal\CumpleanosController;
use App\Http\Controllers\RRHH\Personal\DatosPersonalesController;
use App\Http\Controllers\RRHH\Personal\LicenciasController;

// Estadísticas
use App\Http\Controllers\Estadisticas\EstadisticasGeneralesController;
use App\Http\Controllers\Estadisticas\ComercialIndividualController;
use App\Http\Controllers\Estadisticas\ComercialGrupalController;
use App\Http\Controllers\Estadisticas\SeguimientoAdsController;


// Notificaciones
use App\Http\Controllers\NotificacionController;

// Legacy
use App\Http\Controllers\PresupuestoLegacyController;
use App\Http\Controllers\ContratoLegacyController;

// API
use App\Http\Controllers\Api\EnvioEmailController;
use App\Http\Controllers\Comercial\EmpresaResponsableController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;


// ============================================
// RUTAS PÚBLICAS
// ============================================
Route::get('/login', [LoginController::class, 'show'])->name('login');
Route::post('/login', [LoginController::class, 'login']);
Route::post('/logout', [LoginController::class, 'logout'])->name('logout');

// ============================================
// RUTAS PÚBLICAS PARA USUARIOS EXTERNOS 
// ============================================

Route::prefix('cuentas')->name('cuentas.')->middleware(['throttle:10,1'])->group(function () {
    Route::get('/moviles', [ExternoController::class, 'index'])->name('moviles');
    Route::post('/moviles/login', [ExternoController::class, 'login'])->name('moviles.login');
    Route::get('/moviles/vehiculos', [ExternoController::class, 'listarVehiculos'])->name('moviles.listar');
    Route::get('/moviles/certificado/{vehiculoId}', [ExternoController::class, 'generarCertificado'])->name('moviles.certificado');
    Route::get('/moviles/certificado-flota/{empresaId}', [ExternoController::class, 'generarCertificadoFlota'])->name('moviles.certificado-flota');
    Route::post('/moviles/logout', [ExternoController::class, 'logout'])->name('moviles.logout');
});

// ============================================
// RUTAS PÚBLICAS PARA WHATSAPP (sin autenticación)
// ============================================
Route::get('/comercial/lead/{lead}/contactar-whatsapp', [LeadContactController::class, 'contactarWhatsApp'])
    ->name('lead.contactar-whatsapp');

// Nueva ruta para previsualización (NO registra)
Route::get('/lead/{lead}/info', [LeadContactController::class, 'previewInfo'])
    ->name('lead.preview-info');

// Nueva ruta para contacto real (registra SOLO con click=1)
Route::get('/lead/{lead}/contactar', [LeadContactController::class, 'contactarLead'])
    ->name('lead.contactar');

// ============================================
// RUTAS TEMPORALES (PDFs)
// ============================================
Route::prefix('temp')->name('temp.')->group(function () {
    Route::get('/presupuesto/{id}', function ($id) {
        $path = storage_path("app/temp/presupuesto-{$id}-*.pdf");
        $archivos = glob($path);
        
        if (empty($archivos)) {
            abort(404, 'Archivo no encontrado');
        }
        
        $archivo = $archivos[0];
        
        if (filemtime($archivo) < now()->subMinutes(10)->timestamp) {
            unlink($archivo);
            abort(404, 'Link expirado');
        }
        
        return response()->file($archivo, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="presupuesto.pdf"'
        ]);
    })->name('presupuesto');
    
    Route::get('/contrato/{id}', function ($id) {
        // Normalizar ID a 8 dígitos con ceros a la izquierda
        $idNormalizado = str_pad($id, 8, '0', STR_PAD_LEFT);
        
        // Buscar con ID normalizado (8 dígitos)
        $path = storage_path("app/temp/contrato-{$idNormalizado}-*.pdf");
        $archivos = glob($path);
        
        // Si no encuentra, buscar con ID original (por si acaso)
        if (empty($archivos)) {
            $path = storage_path("app/temp/contrato-{$id}-*.pdf");
            $archivos = glob($path);
        }
        
        if (empty($archivos)) {
            abort(404, 'Archivo no encontrado');
        }
        
        $archivo = $archivos[0];
        
        if (filemtime($archivo) < now()->subMinutes(10)->timestamp) {
            unlink($archivo);
            abort(404, 'Link expirado');
        }
        
        return response()->file($archivo, [
            'Content-Type' => 'application/pdf',
            'Content-Disposition' => 'inline; filename="contrato.pdf"'
        ]);
    })->name('contrato');
});

// ============================================
// RUTAS PROTEGIDAS (requieren autenticación)
// ============================================
// Route::middleware(['auth', 'usuario.activo'])->group(function () {
    Route::middleware(['web','auth'])->group(function () {
    // ========== RUTAS PRINCIPALES ==========
    Route::get('/welcome', [LoginController::class, 'welcome'])->name('welcome');
    Route::get('/', [DashboardController::class, 'index'])->name('home');
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    
    
    // ========== GESTIÓN COMERCIAL ==========
    Route::prefix('comercial')->name('comercial.')->group(function () {
        Route::get('/presupuestos-legacy', [PresupuestoLegacyController::class, 'index'])->name('presupuestos-legacy.index');
        // Rutas simples (sin parámetros)
        Route::get('/actividad', [ActividadController::class, 'index'])->name('actividad')->middleware('permiso:' . config('permisos.VER_ACTIVIDAD'));
        Route::get('/contactos', [ContactosController::class, 'index'])->name('contactos')->middleware('permiso:' . config('permisos.VER_CONTACTOS'));
        Route::get('/prospectos', [ProspectosController::class, 'index'])->name('prospectos')->middleware('permiso:' . config('permisos.VER_PROSPECTOS'));
        Route::get('/leads-perdidos', [LeadsPerdidosController::class, 'index'])->name('leadsperdidos')->middleware('permiso:' . config('permisos.VER_LEADS_PERDIDOS'));
        Route::get('/tarifas', [TarifasConsultaController::class, 'index'])->name('tarifas')->middleware('permiso:' . config('permisos.VER_TARIFAS_CONSULTA'));
        Route::get('/convenios', [ConveniosVigentesController::class, 'index'])->name('convenios')->middleware('permiso:' . config('permisos.VER_CONVENIOS'));
        Route::get('/novedades', [NovedadesController::class, 'index'])->name('novedades')->middleware('permiso:' . config('permisos.VER_NOVEDADES'));
        Route::get('/reenvios', [ReenviosActivosController::class, 'index'])->name('reenvios')->middleware('permiso:' . config('permisos.VER_REENVIOS'));
        Route::get('/documentacion', [DocumentacionController::class, 'index'])->name('documentacion.index')->middleware('permiso:' . config('permisos.VER_DOCUMENTACION'));
        Route::get('/documentacion/browse', [DocumentacionController::class, 'browse'])->name('documentacion.browse')->middleware('permiso:' . config('permisos.VER_DOCUMENTACION'));
        Route::get('/documentacion/download', [DocumentacionController::class, 'download'])->name('documentacion.download')->middleware('permiso:' . config('permisos.VER_DOCUMENTACION'));
        
        // Endpoints API
        Route::get('/motivos-perdida-activos', [MotivoPerdidaController::class, 'getMotivosActivos']);
        Route::get('/localidades/buscar', [LocalidadController::class, 'buscar'])->name('localidades.buscar');
        
            // ========== ENDPOINTS AJAX PARA PRESUPUESTOS ==========
        Route::prefix('api/presupuestos')->group(function () {
            Route::get('/tasas', [PresupuestosController::class, 'getTasas']);
            Route::get('/abonos', [PresupuestosController::class, 'getAbonos']);
            Route::get('/accesorios', [PresupuestosController::class, 'getAccesorios']);
            Route::get('/servicios', [PresupuestosController::class, 'getServicios']);
        });
        // Tipos de comentario
        Route::get('/tipos-comentario/cliente', [ProspectosController::class, 'tiposComentarioCliente']);
        Route::get('/tipos-comentario/recontacto', [ProspectosController::class, 'tiposComentarioRecontacto']);
        Route::get('/tipos-comentario/lead', [ProspectosController::class, 'tiposComentarioLead']);
        
        // ===== PRESUPUESTOS =====
        Route::prefix('presupuestos')->name('presupuestos.')->group(function () {
            Route::get('/', [PresupuestosController::class, 'index'])->name('index')->middleware('permiso:' . config('permisos.VER_PRESUPUESTOS'));
            Route::get('/create', [PresupuestosController::class, 'create'])->name('create')->middleware('permiso:' . config('permisos.GESTIONAR_PRESUPUESTOS'));
            Route::post('/', [PresupuestosController::class, 'store'])->name('store')->middleware('permiso:' . config('permisos.GESTIONAR_PRESUPUESTOS'));
            Route::get('/{presupuesto}', [PresupuestosController::class, 'show'])->name('show')->middleware('permiso:' . config('permisos.VER_PRESUPUESTOS'));
            Route::get('/{presupuesto}/edit', [PresupuestosController::class, 'edit'])->name('edit')->middleware('permiso:' . config('permisos.GESTIONAR_PRESUPUESTOS'));
            Route::put('/{presupuesto}', [PresupuestosController::class, 'update'])->name('update')->middleware('permiso:' . config('permisos.GESTIONAR_PRESUPUESTOS'));
            Route::delete('/{presupuesto}', [PresupuestosController::class, 'destroy'])->name('destroy')->middleware('permiso:' . config('permisos.GESTIONAR_PRESUPUESTOS'));
            Route::get('/{presupuesto}/pdf', [PresupuestosController::class, 'generarPdf'])->name('pdf')->middleware('permiso:' . config('permisos.VER_PRESUPUESTOS'));
            Route::post('/{presupuesto}/enviar-email', [PresupuestosController::class, 'enviarEmail'])->name('enviar-email')->middleware('permiso:' . config('permisos.GESTIONAR_PRESUPUESTOS'));
            Route::post('/{presupuesto}/generar-pdf-temp', [PresupuestosController::class, 'generarPdfTemp'])->name('generar-pdf-temp')->middleware('permiso:' . config('permisos.VER_PRESUPUESTOS'));
            
        });
        
        // ===== CONTRATOS =====
        Route::prefix('contratos')->name('contratos.')->group(function () {
            Route::get('/', [ContratoController::class, 'index'])->name('index')->middleware('permiso:' . config('permisos.VER_CONTRATOS'));
            
            // Ruta para crear contrato desde presupuesto (la que ya tenías)
            Route::get('/crear/{presupuestoId}', [ContratoController::class, 'create'])->name('create')->middleware('permiso:' . config('permisos.GESTIONAR_CONTRATOS'));
            
            // Ruta para crear contrato desde lead (la que estás usando)
            Route::get('/create-from-lead/{presupuestoId}', [ContratoController::class, 'createFromLead'])->name('create-from-lead')->middleware('permiso:' . config('permisos.GESTIONAR_CONTRATOS'));
            
            Route::post('/', [ContratoController::class, 'store'])->name('store')->middleware('permiso:' . config('permisos.GESTIONAR_CONTRATOS'));
            Route::get('/{id}/pdf', [ContratoController::class, 'generarPdf'])->name('pdf')->middleware('permiso:' . config('permisos.VER_CONTRATOS'));
            Route::get('/{id}', [ContratoController::class, 'show'])->name('show')->middleware('permiso:' . config('permisos.VER_CONTRATOS'));
            Route::post('/{contrato}/generar-pdf-temp', [ContratoController::class, 'generarPdfTemp'])->name('generar-pdf-temp')->middleware('permiso:' . config('permisos.VER_CONTRATOS'));
            Route::get('/desde-empresa/{empresaId}', [ContratoController::class, 'createFromEmpresa'])->name('desde-empresa')->middleware('permiso:' . config('permisos.GESTIONAR_CONTRATOS'));
            Route::post('/desde-empresa', [ContratoController::class, 'storeFromEmpresa'])->name('store-from-empresa')->middleware('permiso:' . config('permisos.GESTIONAR_CONTRATOS'));
            Route::post('/guardar-cotizacion', [ContratoController::class, 'guardarCotizacion'])->name('guardar-cotizacion');
            Route::get('/{id}/edit', [ContratoController::class, 'edit'])->name('edit')->middleware('permiso:' . config('permisos.GESTIONAR_CONTRATOS'));
            Route::put('/{id}', [ContratoController::class, 'update'])->name('update')->middleware('permiso:' . config('permisos.GESTIONAR_CONTRATOS'));
        });
        
        // ===== CUENTAS =====
        Route::prefix('cuentas')->name('cuentas.')->group(function () {
            Route::get('/', [DetallesController::class, 'index'])->name('detalles')->middleware('permiso:' . config('permisos.VER_DETALLES_CUENTA'));
            Route::get('/certificados', [CertificadosFlotaController::class, 'index'])->name('certificados')->middleware('permiso:' . config('permisos.VER_CERTIFICADOS_FLOTA'));
            Route::get('/certificados/flota/{empresaId}', [CertificadosFlotaController::class, 'generarCertificadoFlota'])->name('certificados.flota');
            Route::get('/certificados/vehiculo/{vehiculoId}', [CertificadosFlotaController::class, 'generarCertificadoVehiculo'])->name('certificados.vehiculo');
            Route::get('/cambio-titularidad', [CambioTitularidadController::class, 'index'])->name('cambio-titularidad')->middleware('permiso:' . config('permisos.GESTIONAR_CAMBIO_TITULARIDAD'));
            Route::get('/cambio-razon-social', [CambioRazonSocialController::class, 'index'])->name('cambio-razon-social')->middleware('permiso:' . config('permisos.GESTIONAR_CAMBIO_RAZON_SOCIAL'));
            Route::get('/transferencias', [TransferenciasController::class, 'index'])->name('transferencias')->middleware('permiso:' . config('permisos.GESTIONAR_TRANSFERENCIAS'));
            

            // API endpoints para cuentas
            Route::get('/cambio-razon-social/empresa/{id}/completa', [CambioRazonSocialController::class, 'getEmpresaDataCompleta'])->name('cambio-razon-social.empresa-completa');
            Route::get('/cambio-razon-social/{id}', [CambioRazonSocialController::class, 'show'])->name('cambio-razon-social.show');
            Route::get('/cambio-titularidad/empresa/{id}/vehiculos', [CambioTitularidadController::class, 'getVehiculosEmpresa'])->name('cambio-titularidad.vehiculos');
            Route::get('/cambio-titularidad/{id}', [CambioTitularidadController::class, 'show'])->name('cambio-titularidad.show');
            
            // POST endpoints
            Route::post('/cambio-razon-social', [CambioRazonSocialController::class, 'store'])->name('cambio-razon-social.store');
            Route::post('/actualizar-contacto', [CambioRazonSocialController::class, 'actualizarContacto'])->name('actualizar-contacto');
            Route::post('/cambio-razon-social/completo', [CambioRazonSocialController::class, 'updateCompleto'])->name('cambio-razon-social.completo');
            Route::post('/cambio-titularidad', [CambioTitularidadController::class, 'store'])->name('cambio-titularidad.store');
            Route::post('/transferencias/ejecutar', [TransferenciasController::class, 'ejecutarTransferencia'])->name('transferencias.ejecutar');
        });

        // ===== LEADS =====
        Route::get('/leads', [LeadController::class, 'index'])->name('leads.index')->middleware('permiso:' . config('permisos.VER_PROSPECTOS'));
        Route::post('/leads', [LeadController::class, 'store'])->name('leads.store')->middleware('permiso:' . config('permisos.GESTIONAR_LEADS'));

        Route::prefix('leads/{lead}')->name('leads.')->group(function () {
            Route::get('/', [LeadController::class, 'show'])->name('show')->middleware('permiso:' . config('permisos.VER_PROSPECTOS'));
            Route::put('/', [ProspectosController::class, 'update'])->name('update')->middleware('permiso:' . config('permisos.GESTIONAR_LEADS'));
            Route::post('/comentarios', [ProspectosController::class, 'guardarComentario'])->name('comentarios')->middleware('permiso:' . config('permisos.GESTIONAR_LEADS'));
            Route::get('/tiempos-estados', [ProspectosController::class, 'tiemposEntreEstados'])->name('tiempos-estados')->middleware('permiso:' . config('permisos.VER_PROSPECTOS'));
            Route::get('/comentarios-modal-data', [ProspectosController::class, 'comentariosModalData'])->name('comentarios-modal-data');
            Route::get('/datos-alta', [LeadDataController::class, 'getDatosAlta'])->name('datos-alta');
            Route::get('/verificar-datos-contrato', [LeadController::class, 'verificarDatosContrato'])->name('verificar-datos-contrato');
            Route::post('/upgrade', [LeadController::class, 'upgradeToClient'])->name('upgrade')->middleware('permiso:' . config('permisos.GESTIONAR_LEADS'));
        });
        
        // ===== LEADS PERDIDOS =====
        Route::prefix('leads-perdidos/{lead}')->name('leads-perdidos.')->group(function () {
            Route::get('/modal-seguimiento', [LeadsPerdidosController::class, 'modalSeguimiento'])->name('modal-seguimiento')->middleware('permiso:' . config('permisos.GESTIONAR_LEADS_PERDIDOS'));
            Route::post('/seguimiento', [LeadsPerdidosController::class, 'procesarSeguimiento'])->name('seguimiento')->middleware('permiso:' . config('permisos.GESTIONAR_LEADS_PERDIDOS'));
        });
        
        // ===== EMPRESAS Y UTILS =====
        Route::post('/empresa/responsables', [EmpresaResponsableController::class, 'store'])->name('empresa.responsables.store');
        Route::delete('/empresa/responsables/{id}', [EmpresaResponsableController::class, 'destroy'])->name('empresa.responsables.destroy');
        

        Route::prefix('utils')->name('utils.')->group(function () {
            Route::get('/tipos-responsabilidad/activos', [TipoResponsabilidadController::class, 'activos']);
            Route::get('/tipos-documento/activos', [TipoDocumentoController::class, 'activos']);
            Route::get('/nacionalidades', [NacionalidadController::class, 'index']);
            Route::get('/categorias-fiscales/activas', [CategoriaFiscalController::class, 'activas']);
            Route::get('/plataformas/activas', [PlataformaController::class, 'activas']);
            Route::get('/rubros/activos', [RubroController::class, 'activos']);
            Route::get('/empresa/verificar-datos/{leadId}', [Paso2ContactoController::class, 'verificarDatos']);

            Route::post('/empresa/paso1', [Paso1LeadController::class, 'store'])->name('empresa.paso1.store');
            Route::put('/empresa/paso1/{leadId}', [Paso1LeadController::class, 'update'])->name('empresa.paso1.update');
            
            Route::post('/empresa/paso2', [Paso2ContactoController::class, 'store'])->name('empresa.paso2.store');
            Route::put('/empresa/paso2/{contactoId}', [Paso2ContactoController::class, 'update'])->name('empresa.paso2.update');

            Route::post('/empresa/paso3', [Paso3EmpresaController::class, 'store'])->name('empresa.paso3.store');
            Route::put('/empresa/paso3/{empresaId}', [Paso3EmpresaController::class, 'update'])->name('empresa.paso3.update');
            
            Route::post('/auditoria/dato-sensible', [AuditoriaDatoSensibleController::class, 'store'])->name('auditoria.dato-sensible');
        });
    });
    
    // ========== CONFIGURACIÓN ==========
    Route::prefix('config')->name('config.')->middleware('permiso:' . config('permisos.VER_CONFIGURACION'))->group(function () {
        
        // Parámetros
        Route::prefix('parametros')->name('parametros.')->group(function () {
            Route::get('/medios-pago', [MediosPagoController::class, 'index'])->name('medios-pago');
            Route::get('/motivos-baja', [MotivosBajaController::class, 'index'])->name('motivos-baja');
            Route::get('/origen-prospecto', [OrigenProspectoController::class, 'index'])->name('origen-prospecto');
            Route::get('/rubros', [RubrosController::class, 'index'])->name('rubros');
            Route::get('/terminos-condiciones', [TerminosCondicionesController::class, 'index'])->name('terminos-condiciones');
            
            Route::prefix('estados-lead')->name('estados-lead.')->group(function () {
                Route::get('/', [EstadosLeadController::class, 'index'])->name('index');
                Route::post('/', [EstadosLeadController::class, 'store'])->name('store');
                Route::put('/{id}', [EstadosLeadController::class, 'update'])->name('update');
                Route::delete('/{id}', [EstadosLeadController::class, 'destroy'])->name('destroy');
                Route::post('/{id}/toggle-activo', [EstadosLeadController::class, 'toggleActivo'])->name('toggle-activo');
            });
        });
        
        // Tarifas
        Route::prefix('tarifas')->name('tarifas.')->group(function () {
            Route::get('/', [TarifasController::class, 'index'])->name('index');
            Route::post('/', [TarifasController::class, 'store'])->name('store');
            Route::put('/{id}', [TarifasController::class, 'update'])->name('update');
            Route::put('/{id}/toggle-activo', [TarifasController::class, 'toggleActivo'])->name('toggle-activo');
            Route::put('/{id}/toggle-presupuestable', [TarifasController::class, 'togglePresupuestable'])->name('toggle-presupuestable');
            Route::delete('/{id}', [TarifasController::class, 'destroy'])->name('destroy');
            Route::get('/export', [TarifasController::class, 'export'])->name('export');
            Route::post('/procesar-archivo', [TarifasController::class, 'procesarArchivo'])->name('procesar-archivo');
            Route::post('/confirmar-actualizacion', [TarifasController::class, 'confirmarActualizacion'])->name('confirmar-actualizacion');
        });

        // Promociones
        Route::prefix('promociones')->name('promociones.')->group(function () {
            Route::get('/', [PromocionController::class, 'index'])->name('index');
            Route::get('/create', [PromocionController::class, 'create'])->name('create');
            Route::post('/', [PromocionController::class, 'store'])->name('store');
            Route::get('/{promocione}/edit', [PromocionController::class, 'edit'])->name('edit');
            Route::put('/{promocione}', [PromocionController::class, 'update'])->name('update');
            Route::delete('/{promocione}', [PromocionController::class, 'destroy'])->name('destroy');
            
            Route::prefix('api')->name('api.')->group(function () {
                Route::get('/productos', [PromocionController::class, 'getProductos'])->name('productos');
                Route::get('/productos/tipo/{tipo}', [PromocionController::class, 'getProductosPorTipo'])->name('productos-por-tipo');
            });
        });

        // Gestion-admin
        Route::prefix('gestion-admin')->name('gestion-admin.')->group(function () {
            Route::get('/', [GestionAdminController::class, 'index'])->name('index');
            Route::post('/cargar', [GestionAdminController::class, 'cargar'])->name('cargar');
            Route::get('/comparar', [GestionAdminController::class, 'comparar'])->name('comparar');
            Route::post('/aplicar-cambios', [GestionAdminController::class, 'aplicarCambios'])->name('aplicar-cambios');
        });
                            
        // Usuarios
        Route::prefix('usuarios')->name('usuarios.')->group(function () {
            Route::get('/', [UsuariosSistemaController::class, 'index'])->name('index');
        });
         // Roles y Permisos
        Route::prefix('usuarios')->name('usuarios.')->group(function () {
                // Vista principal
                Route::get('/roles', [RolesPermisosController::class, 'index'])->name('roles');
                
                // API endpoints
                Route::get('/roles/{rol}', [RolesPermisosController::class, 'show'])->name('roles.show');
                Route::put('/roles/{rol}/permisos', [RolesPermisosController::class, 'update'])->name('roles.permisos.update');
                Route::post('/roles/{rol}/reset', [RolesPermisosController::class, 'reset'])->name('roles.reset');
                
                // Debug endpoints (opcional, podrías protegerlos con otro middleware)
                Route::get('/permisos', [RolesPermisosController::class, 'getPermisos'])->name('permisos');
                Route::get('/usuario/{usuario}/permisos', [RolesPermisosController::class, 'usuarioPermisos'])->name('usuario.permisos');
            });
    });
    




    // ========== RRHH ==========
    Route::prefix('rrhh')->name('rrhh.')->group(function () {
        
        // Personal
        Route::prefix('personal')->name('personal.')->group(function () {
            Route::get('/datos', [DatosPersonalesController::class, 'index'])->name('datos')->middleware('permiso:' . config('permisos.VER_DATOS_PERSONALES'));
            Route::get('/datos/crear', [DatosPersonalesController::class, 'create'])->name('datos.create')->middleware('permiso:' . config('permisos.GESTIONAR_DATOS_PERSONALES'));
            Route::post('/datos', [DatosPersonalesController::class, 'store'])->name('datos.store')->middleware('permiso:' . config('permisos.GESTIONAR_DATOS_PERSONALES'));
            Route::get('/datos/{id}/editar', [DatosPersonalesController::class, 'edit'])->name('datos.edit')->middleware('permiso:' . config('permisos.GESTIONAR_DATOS_PERSONALES'));
            Route::put('/datos/{id}', [DatosPersonalesController::class, 'update'])->name('datos.update')->middleware('permiso:' . config('permisos.GESTIONAR_DATOS_PERSONALES'));
            Route::delete('/datos/{id}', [DatosPersonalesController::class, 'destroy'])->name('datos.destroy')->middleware('permiso:' . config('permisos.GESTIONAR_DATOS_PERSONALES'));
            
            Route::get('/cumpleanos', [CumpleanosController::class, 'index'])->name('cumpleanos')->middleware('permiso:' . config('permisos.VER_CUMPLEANOS'));
            
            Route::prefix('licencias')->name('licencias.')->group(function () {
                Route::get('/', [LicenciasController::class, 'index'])->name('index')->middleware('permiso:' . config('permisos.VER_LICENCIAS'));
                Route::get('/crear', [LicenciasController::class, 'create'])->name('create')->middleware('permiso:' . config('permisos.GESTIONAR_LICENCIAS'));
                Route::post('/', [LicenciasController::class, 'store'])->name('store')->middleware('permiso:' . config('permisos.GESTIONAR_LICENCIAS'));
                Route::get('/{id}', [LicenciasController::class, 'show'])->name('show')->middleware('permiso:' . config('permisos.VER_LICENCIAS'));
                Route::get('/{id}/editar', [LicenciasController::class, 'edit'])->name('edit')->middleware('permiso:' . config('permisos.GESTIONAR_LICENCIAS'));
                Route::put('/{id}', [LicenciasController::class, 'update'])->name('update')->middleware('permiso:' . config('permisos.GESTIONAR_LICENCIAS'));
                Route::delete('/{id}', [LicenciasController::class, 'destroy'])->name('destroy')->middleware('permiso:' . config('permisos.GESTIONAR_LICENCIAS'));
            });
        });
        
        // Equipos
        Route::prefix('equipos')->name('equipos.')->group(function () {
            Route::get('/tecnico', [EquipoTecnicoController::class, 'index'])->name('tecnico')->middleware('permiso:' . config('permisos.VER_EQUIPOS'));
            Route::get('/comercial', [EquipoComercialController::class, 'index'])->name('comercial')->middleware('permiso:' . config('permisos.VER_EQUIPOS'));
            
            Route::prefix('tecnicos')->name('tecnicos.')->group(function () {
                Route::get('/create', [TecnicoController::class, 'create'])->name('create')->middleware('permiso:' . config('permisos.GESTIONAR_EQUIPO_TECNICO'));
                Route::post('/', [TecnicoController::class, 'store'])->name('store')->middleware('permiso:' . config('permisos.GESTIONAR_EQUIPO_TECNICO'));
                Route::get('/{tecnico}/edit', [TecnicoController::class, 'edit'])->name('edit')->middleware('permiso:' . config('permisos.GESTIONAR_EQUIPO_TECNICO'));
                Route::put('/{tecnico}', [TecnicoController::class, 'update'])->name('update')->middleware('permiso:' . config('permisos.GESTIONAR_EQUIPO_TECNICO'));
                Route::delete('/{tecnico}', [TecnicoController::class, 'destroy'])->name('destroy')->middleware('permiso:' . config('permisos.GESTIONAR_EQUIPO_TECNICO'));
            });

            Route::prefix('comerciales')->name('comerciales.')->group(function () {
                Route::get('/create', [ComercialController::class, 'create'])->name('create')->middleware('permiso:' . config('permisos.GESTIONAR_EQUIPO_COMERCIAL'));
                Route::post('/', [ComercialController::class, 'store'])->name('store')->middleware('permiso:' . config('permisos.GESTIONAR_EQUIPO_COMERCIAL'));
                Route::get('/{comercial}/edit', [ComercialController::class, 'edit'])->name('edit')->middleware('permiso:' . config('permisos.GESTIONAR_EQUIPO_COMERCIAL'));
                Route::put('/{comercial}', [ComercialController::class, 'update'])->name('update')->middleware('permiso:' . config('permisos.GESTIONAR_EQUIPO_COMERCIAL'));
                Route::delete('/{comercial}', [ComercialController::class, 'destroy'])->name('destroy')->middleware('permiso:' . config('permisos.GESTIONAR_EQUIPO_COMERCIAL'));
            });
        });
    });

    // ========== ESTADÍSTICAS ==========
    Route::prefix('estadisticas')->name('estadisticas.')->group(function () {
        // Estadísticas generales/grupales (requiere permiso grupal)
        Route::get('/generales', [EstadisticasGeneralesController::class, 'index'])
            ->name('generales')
            ->middleware('permiso:ver_estadisticas_grupales');
        
        // Lista de comerciales (requiere permiso grupal)
        Route::get('/comerciales', [ComercialGrupalController::class, 'index'])
            ->name('comerciales')
            ->middleware('permiso:ver_estadisticas_grupales');
        
        // Estadísticas individuales por comercial (requiere permiso individual)
        Route::get('/comercial/{id}', [ComercialIndividualController::class, 'show'])
            ->name('comercial.individual')
            ->middleware('permiso:ver_estadisticas_individuales');
        
        // Seguimiento ADS (solo usuario ID 7)
        Route::get('/seguimiento-ads', [SeguimientoAdsController::class, 'index'])
            ->name('seguimiento-ads');
        
        Route::get('/seguimiento-ads/lead/{id}', [SeguimientoAdsController::class, 'showLead'])
            ->name('seguimiento-ads.lead');
    });
    

    // ========== NOTIFICACIONES ==========
    Route::prefix('notificaciones')->name('notificaciones.')->group(function () {
        Route::get('/', [NotificacionController::class, 'index'])->name('index')->middleware('permiso:' . config('permisos.VER_NOTIFICACIONES'));
        Route::get('/programadas', [NotificacionController::class, 'programadas'])->name('programadas')->middleware('permiso:' . config('permisos.VER_NOTIFICACIONES_PROGRAMADAS'));
        
        Route::prefix('ajax')->name('ajax.')->group(function () {
            Route::get('/', [NotificacionController::class, 'ajaxIndex'])->name('index');
            Route::post('/{id}/marcar-leida', [NotificacionController::class, 'marcarLeida'])->name('marcar-leida');
            Route::post('/marcar-todas-leidas', [NotificacionController::class, 'marcarTodasLeidas'])->name('marcar-todas');
            Route::delete('/{id}', [NotificacionController::class, 'destroy'])->name('destroy');
            Route::get('/contador', [NotificacionController::class, 'contador'])->name('contador');
        });
    });

    // ========== RUTAS LEGACY ==========
    Route::prefix('presupuestos-legacy')->name('presupuestos-legacy.')->group(function () {
        Route::get('/{id}/ver', [PresupuestoLegacyController::class, 'verPdf'])->name('ver');  // ← Agregar esta línea
        Route::get('/{id}/pdf', [PresupuestoLegacyController::class, 'verPdf'])->name('pdf');
        Route::get('/{id}/descargar', [PresupuestoLegacyController::class, 'descargarPdf'])->name('descargar');
    });

    Route::prefix('contratos-legacy')->name('contratos-legacy.')->group(function () {
        Route::get('/{id}/ver', [ContratoLegacyController::class, 'verPdf'])->name('ver');     // ← Agregar esta línea
        Route::get('/{id}/pdf', [ContratoLegacyController::class, 'verPdf'])->name('pdf');
        Route::get('/{id}/descargar', [ContratoLegacyController::class, 'descargarPdf'])->name('descargar');
    });
});
// ============================================
// REDIRECCIÓN PARA URLs LEGACY ESTÁTICAS
// ============================================
Route::get('/storage/presupuestos_legacy/{filename}', function ($filename) {
    // Buscar patrón presupuesto_XXX.pdf
    if (preg_match('/presupuesto_(\d+)\.pdf/', $filename, $matches)) {
        $id = $matches[1];
        return redirect("/presupuestos-legacy/{$id}/ver");
    }
    
    // Si no coincide, intentar buscar por ID al final
    if (preg_match('/\/(\d+)\.pdf$/', $filename, $matches)) {
        $id = $matches[1];
        return redirect("/presupuestos-legacy/{$id}/ver");
    }
    
    abort(404, 'Archivo no encontrado');
})->where('filename', '.*\.pdf$');
// ============================================
// ENDPOINTS API (con auth)
// ============================================
Route::middleware(['web','auth'])->prefix('api')->name('api.')->group(function () {
    Route::get('/personal/buscar', [DatosPersonalesController::class, 'buscar'])->name('personal.buscar');
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
    
    // API para envío de emails
        Route::post('/email/enviar-presupuesto', [App\Http\Controllers\Api\EmailController::class, 'enviarPresupuesto'])->name('email.enviar-presupuesto');
        Route::post('/email/enviar-contrato', [App\Http\Controllers\Api\EmailController::class, 'enviarContrato'])->name('email.enviar-contrato');
       Route::post('/email/vista-previa-bienvenida', [App\Http\Controllers\Api\EmailController::class, 'vistaPreviaBienvenida'])->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class]);
       Route::get('/transferencias/buscar', [TransferenciasController::class, 'buscar'])->name('transferencias.buscar');




       
});

