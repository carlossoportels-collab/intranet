<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a SmartSat</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; padding: 30px 20px; }
        .email-container { max-width: 620px; margin: 0 auto; background: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 10px 30px rgba(249, 172, 48, 0.1); }
        .header-smart { background: #fff9f0; padding: 32px 32px 20px 32px; text-align: center; border-bottom: 1px solid #ffe0b0; }
        .header-logo { max-width: 200px; height: auto; margin-bottom: 15px; }
        .header-smart p { color: #666666; font-size: 16px; font-weight: 300; }
        .content { padding: 32px; }
        .welcome-text { font-size: 14px; border-left: 3px solid #ea9b11; padding-left: 18px; color: #4a5b6e; margin-bottom: 28px; }
        .welcome-text strong { color: #ea9b11; font-weight: 600; }
        .card { background: #ffffff; border-radius: 16px; padding: 20px; margin-bottom: 25px; border: 1px solid #f0f0f0; border-radius: 12px; }
        .card-header { display: flex; align-items: center; gap: 12px; margin-bottom: 20px; }
        .card-icon { width: 42px; height: 42px; background: #fff4e0; border-radius: 12px; display: flex; align-items: center; justify-content: center; color: #f9ac30; font-size: 20px; }
        .card-header h3 { font-size: 18px; font-weight: 600; color: #333333; margin: 0; }
        .credenciales-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 15px; background: #f8f8f8; border-radius: 12px; padding: 20px; }
        .credencial-item { text-align: center; }
        .credencial-label { font-size: 12px; color: #777777; text-transform: uppercase; margin-bottom: 5px; }
        .credencial-value { font-size: 16px; font-weight: 500; color: #555555; background: white; padding: 8px 12px; border-radius: 8px; display: inline-block; border: 1px solid #e0e0e0; font-family: monospace; }
        .nota-instalacion { font-size: 11px; color: #ea9b11; margin-top: 15px; text-align: center; background: #fff9f0; padding: 12px; border-radius: 8px; border-left: 4px solid #f9ac30; }
        .accesos-lista { display: flex; flex-direction: column; gap: 12px; }
        .acceso-item { display: flex; align-items: center; gap: 12px; padding: 12px 15px; background: #f8f8f8; border-radius: 12px; border: 1px solid #f0f0f0; }
        .acceso-icon { width: 38px; height: 38px; background: white; border-radius: 10px; display: flex; align-items: center; justify-content: center; color: #f9ac30; font-size: 18px; border: 1px solid #f0f0f0; }
        .acceso-info { flex: 1; }
        .acceso-tipo { font-size: 13px; color: #777777; margin-bottom: 2px; }
        .acceso-url { font-size: 13px; color: #ea9b11; text-decoration: none; font-weight: 500; word-break: break-all; }
        .nota-acceso { background: #fff9f0; border: 1px solid #ffe0b0; border-radius: 12px; padding: 18px; margin-top: 20px; }
        .nota-acceso strong { color: #ea9b11; font-size: 14px; display: block; margin-bottom: 8px; }
        .comercial { background: linear-gradient(135deg, #fff9f0, #ffffff); border-radius: 16px; padding: 20px; display: flex; align-items: center; gap: 20px; border: 1px solid #f0f0f0; margin: 25px 0; border-radius: 12px; }
        .comercial-foto { width: 100px; height: 100px; border-radius: 50%; overflow: hidden; background: #fff4e0; display: flex; align-items: center; justify-content: center; font-size: 40px; font-weight: 600; color: #ea9b11; border: 3px solid #f9ac30; flex-shrink: 0; }
        .comercial-foto img { width: 100%; height: 100%; object-fit: cover; }
        .comercial-datos h4 { font-size: 18px; color: #333333; margin-bottom: 5px; }
        .comercial-datos p { color: #666666; font-size: 13px; margin: 4px 0; display: flex; align-items: center; gap: 6px; }
        .comercial-rol { display: inline-block; background: #fff4e0; color: #ea9b11; padding: 4px 12px; border-radius: 20px; font-size: 11px; font-weight: 600; margin-top: 6px; }
        .buttons-container { display: flex; gap: 15px; justify-content: center; margin: 30px 0 20px; }
        .btn-smart { padding: 12px 24px; border-radius: 50px; text-decoration: none; font-weight: 600; font-size: 13px; display: inline-flex; align-items: center; gap: 8px; }
        .btn-primary { background: linear-gradient(135deg, #f9ac30, #ea9b11); color: white; border-radius: 8px; }
        .btn-secondary { background: #f8f8f8; color: #333333; border: 1px solid #f0f0f0; border-radius: 8px; }
        .footer { background: #333333; padding: 24px 32px; color: #999999; text-align: center; font-size: 11px; }
        .footer a { color: #f9ac30; text-decoration: none; }
        .footer-social { display: flex; justify-content: center; gap: 25px; margin-top: 12px; }
        @media (max-width: 550px) {
            .content { padding: 24px 20px; }
            .credenciales-grid { grid-template-columns: 1fr; }
            .comercial { flex-direction: column; text-align: center; }
            .buttons-container { flex-direction: column; align-items: center; }
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header-smart">
            <img src="https://comercial.localsat.com.ar/images/logos/logosmart.png" alt="SmartSat" class="header-logo">
            <p>Control de flotas inteligente</p>
        </div>
        
        <div class="content">
            <div class="welcome-text">
                <strong>{{ $primerNombreLead }}</strong> · ¡bienvenido a SmartSat!<br>
                Recordá que ante cualquier problema, tu comercial está para ayudarte.
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="card-icon">🔐</div>
                    <h3>Credenciales de acceso</h3>
                </div>
                <div class="credenciales-grid">
                    <div class="credencial-item">
                        <div class="credencial-label">USUARIO</div>
                        <div class="credencial-value">{{ $nombreFlota }}</div>
                    </div>
                    <div class="credencial-item">
                        <div class="credencial-label">CONTRASEÑA</div>
                        <div class="credencial-value">1234</div>
                    </div>
                </div>
                <div class="nota-instalacion">
                    ⚡ El acceso estará disponible el mismo día de la instalación
                </div>
                <p style="color: #777777; font-size: 11px; margin-top: 12px; text-align: center;">
                    * Cambia tu contraseña en el primer acceso por seguridad
                </p>
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="card-icon">🌐</div>
                    <h3>Plataformas disponibles</h3>
                </div>
                <div class="accesos-lista">
                    <div class="acceso-item">
                        <div class="acceso-icon">🖥️</div>
                        <div class="acceso-info">
                            <div class="acceso-tipo">Plataforma web</div>
                            <a href="http://seguimiento.localsat.com.ar/welcome.php" target="_blank" class="acceso-url">seguimiento.localsat.com.ar</a>
                        </div>
                    </div>
                    <div class="acceso-item">
                        <div class="acceso-icon">🤖</div>
                        <div class="acceso-info">
                            <div class="acceso-tipo">App Android</div>
                            <a href="https://play.google.com/store/apps/details?id=com.bykom.app.avl" target="_blank" class="acceso-url">Google Play - Flota Segura</a>
                        </div>
                    </div>
                    <div class="acceso-item">
                        <div class="acceso-icon">🍏</div>
                        <div class="acceso-info">
                            <div class="acceso-tipo">App iOS</div>
                            <a href="https://apps.apple.com/ar/app/flota-segura/id1445879938" target="_blank" class="acceso-url">App Store - Flota Segura</a>
                        </div>
                    </div>
                </div>
                
                <div class="nota-acceso">
                    <strong>📱 PRIMER ACCESO</strong>
                    <p>Ingresá primero por la web con tu flota y seleccioná la opción flota segura.<br>Allí generarás un código de seguridad para la app.</p>
                    <p style="color: #ea9b11; margin-top: 10px;">¿Necesitás ayuda? Tu comercial está para asistirte</p>
                </div>
            </div>
            
            <div class="comercial">
                <div class="comercial-foto">
                    @if(!empty($fotoComercial) && file_exists(public_path('images/comerciales/' . $fotoComercial)))
                        @if(isset($message))
                            <img src="{{ $message->embed(public_path('images/comerciales/' . $fotoComercial)) }}" width="100" height="100" style="width: 100px; height: 100px; object-fit: cover;">
                        @else
                            <img src="{{ asset('images/comerciales/' . $fotoComercial) }}" width="100" height="100" style="width: 100px; height: 100px; object-fit: cover;">
                        @endif
                    @else
                        {{ $inicialesComercial }}
                    @endif
                </div>
                <div class="comercial-datos">
                    <h4>{{ $comercialNombre }}</h4>
                    <p>📞 {{ $comercialTelefono }}</p>
                    <p>✉️ {{ $comercialEmail }}</p>
                    <span class="comercial-rol">Asesor Comercial</span>
                </div>
            </div>
            
            <div class="buttons-container">
                <a href="https://www.localsat.com.ar/guia-de-uso/alpha/app" target="_blank" class="btn-smart btn-primary">📖 Guía de uso</a>
                <a href="https://www.smartsat.com.ar/" target="_blank" class="btn-smart btn-secondary">🌐 Sitio web</a>
            </div>
        </div>
        
        <div class="footer">
            <p>SmartSat · Soluciones de rastreo satelital</p>
            <p>📧 comercial@smartsat.com.ar</p>
            <p>SmartSat forma parte de LocalSat</p>
            <div class="footer-social">
                <a href="https://www.facebook.com/smartsatok" target="_blank"><i class="fab fa-facebook-f"></i> Facebook</a>
                <a href="https://www.instagram.com/localsatok" target="_blank"><i class="fab fa-instagram"></i> Instagram</a>
                <a href="https://www.linkedin.com/company/localsat/" target="_blank"><i class="fab fa-linkedin-in"></i> LinkedIn</a>
            </div>
        </div>
    </div>
</body>
</html>