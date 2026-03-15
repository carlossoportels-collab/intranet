// resources/js/components/modals/emails/mensajes/bienvenida/smartsat.ts

export const mensajeBienvenidaSmartSat = (
    contrato: any,
    comercialNombre: string,
    comercialEmail: string,
    comercialTelefono: string
): string => {
    const primerNombreLead = contrato.cliente_nombre_completo?.split(' ')[0] || 'cliente';
    const nombreFlota = contrato.empresa_nombre_flota;
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a SmartSat</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.5.1/css/all.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', Roboto, -apple-system, BlinkMacSystemFont, sans-serif;
            background: #f5f5f5;
            padding: 30px 20px;
        }
        
        .email-container {
            max-width: 620px;
            margin: 0 auto;
            background: #ffffff;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 10px 30px rgba(249, 172, 48, 0.1);
        }
        
        .header-smart {
            background: #fff9f0;
            padding: 40px 35px 20px;
            text-align: center;
            border-bottom: 1px solid #ffe0b0;
        }
        
        .header-logo {
            max-width: 200px;
            height: auto;
            margin-bottom: 15px;
        }
        
        .header-smart p {
            color: #666666;
            font-size: 16px;
            font-weight: 300;
        }
        
        .content {
            padding: 40px 35px;
        }
        
        .welcome-text {
            font-size: 16px;
            color: #333333;
            margin-bottom: 25px;
        }
        
        .welcome-text strong {
            color: #ea9b11;
            font-weight: 600;
        }
        
        .card {
            background: #ffffff;
            border-radius: 16px;
            padding: 25px;
            margin-bottom: 25px;
            border: 1px solid #f0f0f0;
            box-shadow: 0 4px 12px rgba(249, 172, 48, 0.05);
        }
        
        .card-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
        }
        
        .card-icon {
            width: 42px;
            height: 42px;
            background: #fff4e0;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #f9ac30;
            font-size: 20px;
        }
        
        .card-header h3 {
            font-size: 18px;
            font-weight: 600;
            color: #333333;
        }
        
        .credenciales-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
            background: #f8f8f8;
            border-radius: 12px;
            padding: 20px;
        }
        
        .credencial-item {
            text-align: center;
        }
        
        .credencial-label {
            font-size: 12px;
            color: #777777;
            text-transform: uppercase;
            letter-spacing: 0.3px;
            margin-bottom: 5px;
        }
        
        .credencial-value {
            font-size: 18px;
            font-weight: 500;
            color: #555555;
            background: white;
            padding: 8px 12px;
            border-radius: 8px;
            display: inline-block;
            border: 1px solid #e0e0e0;
        }
        
        .nota-instalacion {
            font-size: 13px;
            color: #ea9b11;
            margin-top: 15px;
            text-align: center;
            background: #fff9f0;
            padding: 10px;
            border-radius: 8px;
            border-left: 4px solid #f9ac30;
        }
        
        .accesos-lista {
            display: flex;
            flex-direction: column;
            gap: 12px;
        }
        
        .acceso-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 15px;
            background: #f8f8f8;
            border-radius: 12px;
            border: 1px solid #f0f0f0;
            transition: all 0.3s;
        }
        
        .acceso-item:hover {
            background: #f0f0f0;
            border-color: #e0e0e0;
        }
        
        .acceso-icon {
            width: 38px;
            height: 38px;
            background: white;
            border-radius: 10px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #f9ac30;
            font-size: 18px;
            border: 1px solid #f0f0f0;
        }
        
        .acceso-info {
            flex: 1;
        }
        
        .acceso-tipo {
            font-size: 13px;
            color: #777777;
            margin-bottom: 2px;
        }
        
        .acceso-url {
            font-size: 14px;
            color: #ea9b11;
            text-decoration: none;
            font-weight: 500;
        }
        
        .acceso-url:hover {
            text-decoration: underline;
        }
        
        .nota-acceso {
            background: #fff9f0;
            border: 1px solid #ffe0b0;
            border-radius: 12px;
            padding: 20px;
            margin-top: 20px;
        }
        
        .nota-acceso strong {
            color: #ea9b11;
            font-size: 15px;
            display: block;
            margin-bottom: 8px;
        }
        
        .nota-acceso p {
            color: #444444;
            font-size: 14px;
            line-height: 1.5;
            margin: 5px 0;
        }
        
        .nota-acceso .highlight {
            color: #f9ac30;
            font-weight: 500;
            margin-top: 8px;
        }
        
        .comercial {
            background: linear-gradient(135deg, #fff9f0, #ffffff);
            border-radius: 16px;
            padding: 25px;
            display: flex;
            align-items: center;
            gap: 20px;
            border: 1px solid #f0f0f0;
            margin: 25px 0;
            transition: all 0.3s;
        }
        
        .comercial:hover {
            border-color: #e0e0e0;
            box-shadow: 0 4px 12px rgba(0,0,0,0.02);
        }
        
        .comercial-foto {
            width: 80px;
            height: 80px;
            border-radius: 50%;
            overflow: hidden;
            border: 3px solid #f9ac30;
            background: #fff4e0;
        }
        
        .comercial-foto-placeholder {
            width: 100%;
            height: 100%;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #ea9b11;
            font-size: 32px;
            font-weight: 600;
        }
        
        .comercial-datos h4 {
            font-size: 18px;
            color: #333333;
            margin-bottom: 5px;
        }
        
        .comercial-datos p {
            color: #666666;
            font-size: 14px;
            margin: 3px 0;
            display: flex;
            align-items: center;
            gap: 6px;
        }
        
        .comercial-rol {
            display: inline-block;
            background: #fff4e0;
            color: #ea9b11;
            padding: 4px 10px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 600;
            margin-top: 5px;
        }
        
        .buttons-container {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin: 30px 0 20px;
        }
        
        .btn-smart {
            padding: 12px 24px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
            border: none;
            cursor: pointer;
        }
        
        .btn-primary {
            background: linear-gradient(135deg, #f9ac30, #ea9b11);
            color: white;
            box-shadow: 0 4px 12px rgba(249, 172, 48, 0.3);
        }
        
        .btn-primary:hover {
            background: #ea9b11;
            transform: translateY(-2px);
            box-shadow: 0 6px 16px rgba(249, 172, 48, 0.4);
        }
        
        .btn-secondary {
            background: #f8f8f8;
            color: #333333;
            border: 1px solid #f0f0f0;
        }
        
        .btn-secondary:hover {
            background: #e0e0e0;
            border-color: #cccccc;
            transform: translateY(-2px);
        }
        
        .footer {
            background: #333333;
            padding: 30px 35px;
            color: #999999;
            text-align: center;
            font-size: 13px;
        }
        
        .footer a {
            color: #f9ac30;
            text-decoration: none;
            transition: color 0.3s;
        }
        
        .footer a:hover {
            color: #ffffff;
            text-decoration: underline;
        }
        
        .footer-social {
            display: flex;
            justify-content: center;
            gap: 25px;
            margin-top: 15px;
        }
        
        .footer-social a {
            color: #999999;
            transition: all 0.3s;
            font-size: 14px;
            display: inline-flex;
            align-items: center;
            gap: 6px;
        }
        
        .footer-social a:hover {
            color: #f9ac30;
            transform: translateY(-2px);
        }
        
        .footer p {
            margin: 3px 0;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header-smart">
            <img src="/images/logos/logosmart.png" alt="SmartSat" class="header-logo" style="max-width: 200px; margin-bottom: 15px;">
            <p>Control de flotas inteligente</p>
        </div>
        
        <div class="content">
            <div class="welcome-text">
                Estimado/a <strong>${primerNombreLead}</strong>,
            </div>
            
            <div class="card">
                <div class="card-header">
                    <div class="card-icon">🔐</div>
                    <h3>Credenciales de acceso</h3>
                </div>
                <div class="credenciales-grid">
                    <div class="credencial-item">
                        <div class="credencial-label">ID FLOTA</div>
                        <div class="credencial-value">${nombreFlota.toLowerCase().replace(/\s+/g, '.')}</div>
                    </div>
                    <div class="credencial-item">
                        <div class="credencial-label">Contraseña</div>
                        <div class="credencial-value">1234</div>
                    </div>
                </div>
                
                <div class="nota-instalacion">
                    ⚡ El acceso estará disponible el mismo día de la instalación
                </div>
                
                <p style="color: #777777; font-size: 12px; margin-top: 15px; text-align: center;">
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
                    <strong>📱 Primer acceso</strong>
                    <p>Ingresá primero por la web con tu flota y seleccion la opcion flota segura.<br>
                    Allí registra tu email y recibirás un código de seguridad para la app.</p>
                    <p class="highlight">¿Necesitás ayuda? Tu comercial está para asistirte</p>
                </div>
            </div>
            
            <div class="comercial">
                <div class="comercial-foto">
                    <div class="comercial-foto-placeholder">${comercialNombre?.split(' ').map((n: string) => n[0]).join('') || 'RG'}</div>
                </div>
                <div class="comercial-datos">
                    <h4>${comercialNombre}</h4>
                    <p>📞 ${comercialTelefono}</p>
                    <p>✉️ ${comercialEmail }</p>
                    <span class="comercial-rol">Asesora Comercial</span>
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
                <a href="https://www.facebook.com/smartsatok" target="_blank">
                    <i class="fab fa-facebook-f"></i> Facebook
                </a>
                <a href="https://www.instagram.com/localsatok" target="_blank">
                    <i class="fab fa-instagram"></i> Instagram
                </a>
                <a href="https://www.linkedin.com/company/localsat/" target="_blank">
                    <i class="fab fa-linkedin-in"></i> LinkedIn
                </a>
            </div>
        </div>
    </div>
</body>
</html>`;
};