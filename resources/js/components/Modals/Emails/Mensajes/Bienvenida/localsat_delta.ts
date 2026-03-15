// resources/js/components/modals/emails/mensajes/bienvenida/localsat_delta.ts

export const mensajeBienvenidaLocalsatDelta = (
    contrato: any,
    comercialNombre: string,
    comercialEmail: string,
    comercialTelefono: string
): string => {
    const primerNombreLead = contrato.cliente_nombre_completo?.split(' ')[0] || 'cliente';
    const nombreFlota = contrato.empresa_nombre_flota || contrato.cliente_nombre_completo || 'usuario';
    
    // Generar nombre de archivo de la foto del comercial (todo minúsculas, sin espacios)
    const fotoComercial = comercialNombre?.toLowerCase().replace(/\s+/g, '') + '.png' || 'gustavomoyano.png';
    
    return `<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Bienvenido a LocalSat Delta</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Montserrat', 'Segoe UI', sans-serif;
            background: linear-gradient(145deg, #f6f9fc 0%, #e9f0f5 100%);
            padding: 30px 20px;
        }
        
        .email-container {
            max-width: 620px;
            margin: 0 auto;
            background: white;
            border-radius: 24px;
            overflow: hidden;
            box-shadow: 0 25px 50px -12px rgba(250, 100, 0, 0.25);
        }
        
        .header-delta {
            background: linear-gradient(115deg, #fa6400 0%, #ff8a3c 70%, #ffb07c 100%);
            padding: 45px 35px;
            position: relative;
            overflow: hidden;
        }
        
        .header-delta::before {
            content: '';
            position: absolute;
            top: -30%;
            right: -10%;
            width: 300px;
            height: 300px;
            background: radial-gradient(circle, rgba(255,255,255,0.15) 0%, transparent 70%);
            border-radius: 50%;
        }
        
        .header-logo {
            height: auto;
            margin-bottom: 5px;
        }
        
        .header-delta p {
            color: rgba(255,255,255,0.95);
            font-size: 18px;
            font-weight: 300;
            position: relative;
        }
        
        .content-premium {
            padding: 40px 35px;
        }
        
        .welcome-text {
            font-size: 16px;
            color: #2d3748;
            margin-bottom: 25px;
        }
        
        .welcome-text strong {
            color: #fa6400;
        }
        
        .card-delta {
            background: #ffffff;
            border-radius: 20px;
            padding: 25px;
            margin-bottom: 25px;
            box-shadow: 0 8px 20px rgba(0,0,0,0.02);
            border: 1px solid #f0f0f0;
            transition: all 0.3s;
        }
        
        .card-delta:hover {
            border-color: #fa6400;
            box-shadow: 0 8px 25px rgba(250, 100, 0, 0.05);
        }
        
        .card-header {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
        }
        
        .card-icon {
            width: 45px;
            height: 45px;
            background: linear-gradient(135deg, #fa6400 0%, #ff8a3c 100%);
            border-radius: 14px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-size: 22px;
        }
        
        .card-header h3 {
            font-size: 18px;
            font-weight: 600;
            color: #1a202c;
        }
        
        .credenciales-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 20px;
            background: #f8fafc;
            border-radius: 16px;
            padding: 20px;
        }
        
        .credencial-item {
            text-align: center;
        }
        
        .credencial-label {
            font-size: 12px;
            color: #718096;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 5px;
        }
        
        .credencial-value {
            font-size: 20px;
            font-weight: 500;
            color: #555555;
            background: white;
            padding: 8px 12px;
            border-radius: 12px;
            display: inline-block;
            border: 1px solid #e0e0e0;
        }
        
        .nota-instalacion {
            font-size: 13px;
            color: #fa6400;
            font-weight: 500;
            margin-top: 15px;
            text-align: center;
            background: #fff1e6;
            padding: 10px;
            border-radius: 8px;
            border-left: 4px solid #fa6400;
        }
        
        .accesos-lista {
            display: flex;
            flex-direction: column;
            gap: 15px;
        }
        
        .acceso-item {
            display: flex;
            align-items: center;
            gap: 12px;
            padding: 12px 15px;
            background: #f8fafc;
            border-radius: 14px;
            transition: all 0.3s;
        }
        
        .acceso-item:hover {
            background: #f0f0f0;
            border-color: #e0e0e0;
        }
        
        .acceso-icon {
            width: 40px;
            height: 40px;
            background: white;
            border-radius: 12px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fa6400;
            font-size: 20px;
            border: 1px solid #f0f0f0;
        }
        
        .acceso-info {
            flex: 1;
        }
        
        .acceso-tipo {
            font-size: 13px;
            color: #718096;
            margin-bottom: 2px;
        }
        
        .acceso-url {
            font-size: 14px;
            color: #fa6400;
            text-decoration: none;
            font-weight: 500;
            word-break: break-all;
        }
        
        .acceso-url:hover {
            text-decoration: underline;
        }
        
        .nota-servidor {
            background: #e6f7ff;
            border: 1px solid #91d5ff;
            border-radius: 8px;
            padding: 15px 20px;
            margin-top: 15px;
            font-size: 13px;
            color: #0050b3;
        }
        
        .nota-servidor strong {
            color: #fa6400;
            font-size: 14px;
            display: block;
            margin-bottom: 8px;
        }
        
        .comercial-premium {
            background: linear-gradient(135deg, #f8fafc 0%, #ffffff 100%);
            border-radius: 20px;
            padding: 25px;
            display: flex;
            align-items: center;
            gap: 25px;
            border: 1px solid #e2e8f0;
            margin: 25px 0;
        }
        
        .comercial-foto {
            width: 90px;
            height: 90px;
            border-radius: 50%;
            overflow: hidden;
            border: 3px solid #fa6400;
            box-shadow: 0 8px 15px rgba(250, 100, 0, 0.2);
        }
        
        .comercial-foto img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .comercial-datos h4 {
            font-size: 20px;
            color: #1a202c;
            margin-bottom: 8px;
        }
        
        .comercial-datos p {
            color: #4a5568;
            font-size: 14px;
            margin: 4px 0;
            display: flex;
            align-items: center;
            gap: 8px;
        }
        
        .comercial-rol {
            display: inline-block;
            background: #fa6400;
            color: white;
            padding: 4px 12px;
            border-radius: 20px;
            font-size: 12px;
            font-weight: 500;
            margin-top: 8px;
        }
        
        .button-container {
            display: flex;
            gap: 15px;
            justify-content: center;
            margin: 30px 0;
        }
        
        .btn-premium {
            padding: 12px 24px;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 600;
            font-size: 14px;
            transition: all 0.3s;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        
        .btn-primary-delta {
            background: #fa6400;
            color: white;
            box-shadow: 0 5px 15px rgba(250, 100, 0, 0.3);
        }
        
        .btn-primary-delta:hover {
            background: #e55a00;
            transform: translateY(-2px);
            box-shadow: 0 8px 20px rgba(250, 100, 0, 0.4);
        }
        
        .btn-secondary-delta {
            background: #f8f8f8;
            color: #333333;
            border: 1px solid #f0f0f0;
        }
        
        .btn-secondary-delta:hover {
            background: #e0e0e0;
            border-color: #cccccc;
            transform: translateY(-2px);
        }
        
        .footer-delta {
            background: #1a202c;
            padding: 30px 35px;
            color: #a0aec0;
            text-align: center;
            font-size: 13px;
        }
        
        .footer-delta a {
            color: #fa6400;
            text-decoration: none;
        }
        
        .footer-social {
            display: flex;
            justify-content: center;
            gap: 25px;
            margin-top: 15px;
        }
        
        .footer-social a {
            color: #a0aec0;
            transition: all 0.3s;
            font-size: 14px;
            display: inline-flex;
            align-items: center;
            gap: 8px;
        }
        
        .footer-social a:hover {
            color: #fa6400;
            transform: translateY(-2px);
        }
        
        .footer-social i {
            font-size: 18px;
        }
    </style>
</head>
<body>
    <div class="email-container">
        <div class="header-delta">
            <img src="/images/logos/logo.png" alt="LocalSat" class="header-logo">
            <p>Tecnología de rastreo satelital avanzada</p>
        </div>
        
        <div class="content-premium">
            <div class="welcome-text">
                Estimado/a <strong>${primerNombreLead}</strong>,
            </div>
            
            <div class="card-delta">
                <div class="card-header">
                    <div class="card-icon">🔐</div>
                    <h3>Credenciales de Acceso</h3>
                </div>
                <div class="credenciales-grid">
                    <div class="credencial-item">
                        <div class="credencial-label">Usuario</div>
                        <div class="credencial-value">${nombreFlota.toLowerCase().replace(/\s+/g, '.')}</div>
                    </div>
                    <div class="credencial-item">
                        <div class="credencial-label">Contraseña temporal</div>
                        <div class="credencial-value">1234</div>
                    </div>
                </div>
                
                <div class="nota-instalacion">
                    ⚡ El acceso estará disponible el mismo día que se realice la instalación.
                </div>
                
                <p style="color: #718096; font-size: 12px; margin-top: 15px;">* Cambia tu contraseña en el primer acceso por seguridad</p>
            </div>
            
            <div class="card-delta">
                <div class="card-header">
                    <div class="card-icon">🌐</div>
                    <h3>Plataformas Disponibles</h3>
                </div>
                <div class="accesos-lista">
                    <div class="acceso-item">
                        <div class="acceso-icon">🖥️</div>
                        <div class="acceso-info">
                            <div class="acceso-tipo">Acceso Web</div>
                            <a href="https://seguimiento2.localsat.com.ar/StreetZ/" target="_blank" class="acceso-url">seguimiento2.localsat.com.ar</a>
                        </div>
                    </div>
                    <div class="acceso-item">
                        <div class="acceso-icon">📱</div>
                        <div class="acceso-info">
                            <div class="acceso-tipo">App Android</div>
                            <a href="https://play.google.com/store/apps/details?id=com.cybermapa.optify2" target="_blank" class="acceso-url">Google Play - Optify</a>
                        </div>
                    </div>
                    <div class="acceso-item">
                        <div class="acceso-icon">🍏</div>
                        <div class="acceso-info">
                            <div class="acceso-tipo">App iOS</div>
                            <a href="https://apps.apple.com/ar/app/optify/id6459477562" target="_blank" class="acceso-url">App Store - Optify</a>
                        </div>
                    </div>
                </div>
                
                <div class="nota-servidor">
                    <strong>📱 Configuración de la app</strong>
                    <p>Al abrir la app, escribe <strong>"LOCALSAT"</strong> como servidor. Luego ingresa con tu usuario y contraseña.</p>
                </div>
            </div>
            
            <div class="comercial-premium">
                <div class="comercial-foto">
                    <img src="/images/comerciales/${fotoComercial}" alt="${comercialNombre}" onerror="this.style.display='none'; this.parentNode.innerHTML='<div class=\'comercial-foto-placeholder\'>${comercialNombre?.split(' ').map((n: string) => n[0]).join('') || 'GM'}</div>';">
                    <div class="comercial-foto-placeholder" style="display: none;">${comercialNombre?.split(' ').map((n: string) => n[0]).join('') || 'GM'}</div>
                </div>
                <div class="comercial-datos">
                    <h4>${comercialNombre}</h4>
                    <p>📞 ${comercialTelefono}</p>
                    <p>✉️ ${comercialEmail}</p>
                    <span class="comercial-rol">Asesor Comercial</span>
                </div>
            </div>
            
            <div class="button-container">
                <a href="https://www.localsat.com.ar/guia-de-uso/delta" target="_blank" class="btn-premium btn-primary-delta">📖 Guía Delta</a>
                <a href="https://www.localsat.com.ar" target="_blank" class="btn-premium btn-secondary-delta">🌐 Sitio web</a>
            </div>
        </div>
        
        <div class="footer-delta">
            <p>LocalSat Delta - Tecnología de rastreo satelital</p>
            <p>📧 soporte@localsat.com.ar · 📞 0810 888 8205</p>
            <p>www.localsat.com.ar</p>
            <div class="footer-social">
                <a href="https://www.facebook.com/localsat.com.ar" target="_blank">
                    <i class="bi bi-facebook"></i> Facebook
                </a>
                <a href="https://www.instagram.com/localsatok" target="_blank">
                    <i class="bi bi-instagram"></i> Instagram
                </a>
                <a href="https://www.linkedin.com/company/localsat/" target="_blank">
                    <i class="bi bi-linkedin"></i> LinkedIn
                </a>
            </div>
        </div>
    </div>
</body>
</html>`;
};