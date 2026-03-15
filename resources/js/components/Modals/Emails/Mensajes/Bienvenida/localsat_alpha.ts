// resources/js/components/modals/emails/mensajes/bienvenida/localsat_alpha.ts

export const mensajeBienvenidaLocalsatAlpha = (
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
    <title>Bienvenido a LocalSat Alpha</title>
    <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.min.css">
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Inter', 'Poppins', sans-serif;
            background: #0b1120;
            padding: 30px 20px;
        }
        
        .email-container {
            max-width: 620px;
            margin: 0 auto;
            background: #0f172a;
            border-radius: 30px;
            overflow: hidden;
            box-shadow: 0 30px 60px rgba(250, 100, 0, 0.3);
            border: 1px solid rgba(250, 100, 0, 0.2);
        }
        
        .header-tech {
            background: linear-gradient(145deg, #fa6400, #ff8a3c, #fa6400);
            background-size: 200% 200%;
            animation: gradient 10s ease infinite;
            padding: 40px 30px;
            text-align: center;
            position: relative;
            overflow: hidden;
        }
        
        @keyframes gradient {
            0% { background-position: 0% 50%; }
            50% { background-position: 100% 50%; }
            100% { background-position: 0% 50%; }
        }
        
        .header-logo {
            max-width: 200px;
            height: auto;
            margin-bottom: 15px;
        }
        
        .header-tech p {
            color: rgba(255,255,255,0.9);
            font-size: 16px;
            font-weight: 300;
            position: relative;
        }
        
        .content-tech { 
            padding: 35px 30px; 
            background: #0f172a; 
        }
        
        .welcome-text {
            font-size: 16px;
            color: #94a3b8;
            margin-bottom: 25px;
        }
        
        .welcome-text strong {
            color: white;
            font-weight: 600;
        }
        
        .card-tech {
            background: rgba(255,255,255,0.03);
            backdrop-filter: blur(10px);
            border: 1px solid rgba(250, 100, 0, 0.2);
            border-radius: 24px;
            padding: 25px;
            margin-bottom: 25px;
        }
        
        .card-tech-title {
            display: flex;
            align-items: center;
            gap: 12px;
            margin-bottom: 20px;
        }
        
        .card-tech-icon {
            width: 48px; height: 48px;
            background: linear-gradient(145deg, #fa6400, #ff8a3c);
            border-radius: 16px;
            display: flex; align-items: center; justify-content: center;
            color: white; font-size: 24px;
        }
        
        .card-tech-title h3 { 
            color: white; 
            font-size: 18px; 
            font-weight: 600; 
        }
        
        .tech-data-grid {
            display: grid;
            grid-template-columns: 1fr 1fr;
            gap: 15px;
        }
        
        .tech-data-item {
            background: rgba(0,0,0,0.3);
            border: 1px solid rgba(250, 100, 0, 0.2);
            border-radius: 16px;
            padding: 15px;
            text-align: center;
        }
        
        .tech-data-label {
            color: #94a3b8;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 1px;
            margin-bottom: 5px;
        }
        
        .tech-data-value {
            color: #fa6400;
            font-size: 22px;
            font-weight: 700;
            font-family: 'Courier New', monospace;
        }
        
        .nota-instalacion-tech {
            color: #fa6400;
            font-size: 12px;
            text-align: center;
            margin-top: 15px;
            padding: 8px;
            border: 1px dashed #fa6400;
            border-radius: 8px;
            background: rgba(250, 100, 0, 0.1);
        }
        
        .tech-accesos { 
            display: flex; 
            flex-direction: column; 
            gap: 12px; 
        }
        
        .tech-acceso {
            display: flex; align-items: center; gap: 15px;
            background: rgba(0,0,0,0.2);
            border: 1px solid rgba(250, 100, 0, 0.15);
            border-radius: 16px;
            padding: 15px;
        }
        
        .tech-acceso-icon {
            width: 45px; height: 45px;
            background: #1e293b;
            border-radius: 14px;
            display: flex; align-items: center; justify-content: center;
            color: #fa6400; font-size: 22px;
        }
        
        .tech-acceso-info { 
            flex: 1; 
        }
        
        .tech-acceso-tipo { 
            color: #94a3b8; 
            font-size: 12px; 
            margin-bottom: 2px; 
        }
        
        .tech-acceso-link {
            color: #fa6400; 
            text-decoration: none; 
            font-size: 13px; 
            font-weight: 500;
            word-break: break-all;
        }
        
        .tech-acceso-link:hover { 
            text-decoration: underline; 
        }
        
        .nota-alpha {
            background: #1e293b;
            border: 1px solid #fa6400;
            border-radius: 8px;
            padding: 15px 20px;
            margin-top: 15px;
            font-size: 13px;
            color: #94a3b8;
        }
        
        .nota-alpha strong {
            color: #fa6400;
            font-size: 14px;
            display: block;
            margin-bottom: 8px;
        }
        
        .comercial-tech {
            background: linear-gradient(145deg, rgba(250, 100, 0, 0.1), transparent);
            border: 1px solid rgba(250, 100, 0, 0.3);
            border-radius: 24px;
            padding: 25px;
            display: flex; align-items: center; gap: 25px;
            margin: 25px 0;
        }
        
        .comercial-tech-foto {
            width: 100px;
            height: 100px;
            border-radius: 50%;
            overflow: hidden;
            border: 3px solid #fa6400;
            box-shadow: 0 0 20px rgba(250, 100, 0, 0.5);
        }
        
        .comercial-tech-foto img {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }
        
        .comercial-tech-info h4 { 
            color: white; 
            font-size: 22px; 
            margin-bottom: 8px; 
        }
        
        .comercial-tech-info p {
            color: #94a3b8; 
            font-size: 14px; 
            margin: 5px 0;
            display: flex; 
            align-items: center; 
            gap: 8px;
        }
        
        .tech-badge {
            display: inline-block;
            background: #fa6400; 
            color: white;
            padding: 5px 12px; 
            border-radius: 30px;
            font-size: 12px; 
            font-weight: 600; 
            margin-top: 8px;
        }
        
        .tech-buttons {
            display: flex; 
            gap: 15px; 
            justify-content: center; 
            margin: 30px 0;
        }
        
        .btn-tech {
            padding: 12px 24px; 
            border-radius: 40px; 
            text-decoration: none;
            font-weight: 600; 
            font-size: 14px; 
            transition: all 0.3s;
            display: inline-flex; 
            align-items: center; 
            gap: 8px;
        }
        
        .btn-tech-primary {
            background: #fa6400; 
            color: white;
            box-shadow: 0 5px 15px rgba(250, 100, 0, 0.4);
        }
        
        .btn-tech-primary:hover { 
            background: #ff7a1a; 
            transform: scale(1.05); 
        }
        
        .btn-tech-secondary {
            background: #1e293b; 
            color: white;
            border: 1px solid #fa6400;
        }
        
        .btn-tech-secondary:hover { 
            background: #2d3748; 
            transform: scale(1.05); 
        }
        
        .footer-tech {
            background: #0a0f1a;
            padding: 30px;
            color: #64748b;
            text-align: center;
            border-top: 1px solid rgba(250, 100, 0, 0.2);
        }
        
        .footer-tech a { 
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
            color: #64748b;
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
        <div class="header-tech">
            <img src="/images/logos/logo.png" alt="LocalSat" class="header-logo">
            <p>Rastreo satelital de última generación</p>
        </div>
        <div class="content-tech">
            <div class="welcome-text">
                Estimado/a <strong>${primerNombreLead}</strong>,
            </div>
            
            <div class="card-tech">
                <div class="card-tech-title">
                    <div class="card-tech-icon">🔑</div>
                    <h3>Credenciales de Acceso</h3>
                </div>
                <div class="tech-data-grid">
                    <div class="tech-data-item">
                        <div class="tech-data-label">Usuario</div>
                        <div class="tech-data-value">${nombreFlota.toLowerCase().replace(/\s+/g, '.')}</div>
                    </div>
                    <div class="tech-data-item">
                        <div class="tech-data-label">Contraseña</div>
                        <div class="tech-data-value">1234</div>
                    </div>
                </div>
                <div class="nota-instalacion-tech">
                    ⚡ El acceso estará disponible el mismo día de la instalación.
                </div>
            </div>
            
            <div class="card-tech">
                <div class="card-tech-title">
                    <div class="card-tech-icon">🌍</div>
                    <h3>Acceso a Plataformas</h3>
                </div>
                <div class="tech-accesos">
                    <div class="tech-acceso">
                        <div class="tech-acceso-icon">💻</div>
                        <div class="tech-acceso-info">
                            <div class="tech-acceso-tipo">Plataforma Web Alpha</div>
                            <a href="http://seguimiento.localsat.com.ar/welcome.php" target="_blank" class="tech-acceso-link">seguimiento.localsat.com.ar</a>
                        </div>
                    </div>
                    <div class="tech-acceso">
                        <div class="tech-acceso-icon">📲</div>
                        <div class="tech-acceso-info">
                            <div class="tech-acceso-tipo">App Android</div>
                            <a href="https://play.google.com/store/apps/details?id=com.bykom.app.avl" target="_blank" class="tech-acceso-link">Google Play - AVL</a>
                        </div>
                    </div>
                    <div class="tech-acceso">
                        <div class="tech-acceso-icon">🍏</div>
                        <div class="tech-acceso-info">
                            <div class="tech-acceso-tipo">App iOS (Flota Segura)</div>
                            <a href="https://apps.apple.com/ar/app/flota-segura/id1445879938" target="_blank" class="tech-acceso-link">App Store - Flota Segura</a>
                        </div>
                    </div>
                </div>
                
                <div class="nota-alpha">
                    <strong>📱 Primer acceso</strong>
                    <p>Ingresá primero por la web para registrar tu email. Allí recibirás un código de seguridad para la app.</p>
                </div>
            </div>
            
            <div class="comercial-tech">
                <div class="comercial-tech-foto">
                    <img src="/images/comerciales/${fotoComercial}" alt="${comercialNombre}" onerror="this.style.display='none'; this.parentNode.innerHTML='<div class=\'comercial-tech-foto-placeholder\'>${comercialNombre?.split(' ').map((n: string) => n[0]).join('') || 'GM'}</div>';">
                    <div class="comercial-tech-foto-placeholder" style="display: none;">${comercialNombre?.split(' ').map((n: string) => n[0]).join('') || 'GM'}</div>
                </div>
                <div class="comercial-tech-info">
                    <h4>${comercialNombre || 'Gustavo Moyano'}</h4>
                    <p>📞 ${comercialTelefono || '11 3456-7890'}</p>
                    <p>✉️ ${comercialEmail || 'gustavo.moyano@localsat.com.ar'}</p>
                    <span class="tech-badge">Asesor Comercial</span>
                </div>
            </div>
            
            <div class="tech-buttons">
                <a href="https://www.localsat.com.ar/guia-de-uso/alpha/app" target="_blank" class="btn-tech btn-tech-primary">📖 Guía Alpha</a>
                <a href="https://www.localsat.com.ar" target="_blank" class="btn-tech btn-tech-secondary">🌐 Sitio web</a>
            </div>
        </div>
        <div class="footer-tech">
            <p>LocalSat Alpha · Tecnología en movimiento</p>
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