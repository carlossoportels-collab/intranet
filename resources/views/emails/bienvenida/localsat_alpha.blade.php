<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>LocalSat | Alpha</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');
        
        /* Estilos base solo para clientes que soporten CSS */
        .ExternalClass, .ReadMsgBody {
            width: 100%;
            background-color: #eef2f5;
        }
        body, .body {
            margin: 0;
            padding: 0;
            background-color: #eef2f5;
            font-family: 'Space Grotesk', 'Segoe UI', Helvetica, Arial, sans-serif;
        }
        table {
            border-collapse: collapse;
            mso-table-lspace: 0;
            mso-table-rspace: 0;
        }
        td {
            padding: 0;
        }
        img {
            border: 0;
            height: auto;
            line-height: 100%;
            outline: none;
            text-decoration: none;
            -ms-interpolation-mode: bicubic;
        }
        .ExternalClass {
            width: 100%;
        }
        @media only screen and (max-width: 600px) {
            table[class="container"] {
                width: 100% !important;
            }
            td[class="responsive-padding"] {
                padding: 20px !important;
            }
            td[class="platform-cell"] {
                display: block !important;
                width: 100% !important;
                text-align: center !important;
                margin-bottom: 10px !important;
            }
            table[class="commercial-table"] td {
                display: block !important;
                text-align: center !important;
            }
            table[class="commercial-table"] td[class="commercial-avatar-cell"] {
                padding-bottom: 15px !important;
            }
        }
    </style>
</head>
<body style="margin: 0; padding: 0; background-color: #eef2f5; font-family: 'Space Grotesk', 'Segoe UI', Helvetica, Arial, sans-serif;">
    
    <center style="width: 100%; table-layout: fixed;">
        <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#eef2f5" style="background-color: #eef2f5;">
            <tr>
                <td align="center" style="padding: 40px 20px;">
                    <!-- Contenedor principal -->
                    <table width="100%" max-width="600" border="0" cellpadding="0" cellspacing="0" bgcolor="#f5f7fa" style="max-width: 620px; width: 100%; background-color: #f5f7fa; border: 1px solid #e2e8f0; border-radius: 8px;">
                        <!-- Header -->
                        <tr>
                            <td style="padding: 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="background-color: #ffffff; border-bottom: 1px solid #e2e8f0; border-radius: 8px 8px 0 0;">
                                    <tr>
                                        <td align="center" style="padding: 32px 32px 28px 32px;">
                                            <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                                <tr>
                                                    <td align="left" style="padding-right: 18px; width: 20px;">
                                                        <div style="width: 12px; height: 12px; background: #ff5000; border-radius: 50%; box-shadow: 0 0 8px rgba(255,80,0,0.5);"></div>
                                                      </td>
                                                    <td align="left">
                                                        <h1 style="font-size: 22px; letter-spacing: 3px; color: #1f2a3e; text-transform: uppercase; font-weight: 700; margin: 0;">LOCALSAT · ALPHA</h1>
                                                        <p style="font-size: 10px; color: #ff5000; font-family: 'JetBrains Mono', monospace; letter-spacing: 0.8px; margin: 0;">// SISTEMA DE RASTREO SATELITAL //</p>
                                                      </td>
                                                  </tr>
                                             </table>
                                        </td>
                                     </tr>
                                </table>
                            </td>
                         </tr>
                        
                        <!-- Content -->
                        <tr>
                            <td style="padding: 32px 32px 28px 32px;">
                                <!-- Greeting -->
                                <div style="font-size: 14px; border-left: 3px solid #ff5000; padding-left: 18px; color: #4a5b6e; margin-bottom: 28px;">
                                    <strong style="color: #1f2a3e;">{{ $primerNombreLead }}</strong> · ¡bienvenido a LocalSat!<br>
                                    Recordá que ante cualquier problema, tu comercial está para ayudarte.
                                </div>
                                
                                <!-- Data rows -->
                                <table width="100%" border="0" cellpadding="0" cellspacing="0" style="margin-bottom: 12px;">
                                    <tr>
                                        <td style="padding-bottom: 12px;">
                                            <table width="100%" border="0" cellpadding="14" cellspacing="0" bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
                                                <tr>
                                                    <td align="left" style="color: #ff5000; font-weight: 700; font-family: 'JetBrains Mono', monospace; padding-left: 18px;">[ USUARIO ]</td>
                                                    <td align="left" style="color: #1f2a3e; font-weight: 600; font-family: 'JetBrains Mono', monospace; padding-left: 18px;">{{ $nombreFlota }}</td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                    <tr>
                                        <td>
                                            <table width="100%" border="0" cellpadding="14" cellspacing="0" bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-radius: 8px;">
                                                <tr>
                                                    <td align="left" style="color: #ff5000; font-weight: 700; font-family: 'JetBrains Mono', monospace; padding-left: 18px;">[ CONTRASEÑA ]</td>
                                                    <td align="left" style="color: #1f2a3e; font-weight: 600; font-family: 'JetBrains Mono', monospace; padding-left: 18px;">1234</td>
                                                </tr>
                                            </table>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Info note -->
                                <div style="font-size: 11px; padding: 14px 18px; background: #ffffff; border-left: 3px solid #ff5000; border: 1px solid #e2e8f0; border-radius: 8px; color: #5b6e8c; margin-bottom: 28px;">
                                    ⚡ El acceso estará disponible el mismo día de la instalación. Cambiá tu contraseña por seguridad.
                                </div>
                                
                                <!-- Platform grid usando tablas (2 columnas) -->
                                <div style="margin-bottom: 28px;">
                                    <h3 style="font-size: 13px; font-weight: bold; color: #1f2a3e; margin: 0 0 16px 0; text-align: center;">PLATAFORMAS DISPONIBLES</h3>
                                    <table width="100%" border="0" cellpadding="0" cellspacing="0">
                                        <tr>
                                            <td width="50%" style="padding-right: 8px; padding-bottom: 12px;">
                                                <a href="http://seguimiento.localsat.com.ar/welcome.php" target="_blank" style="display: block; padding: 14px 12px; border: 1px solid #e2e8f0; text-align: center; text-decoration: none; color: #1f2a3e; font-size: 12px; font-weight: 600; background-color: #ffffff; border-radius: 8px;">🌐 WEB ALPHA</a>
                                            </td>
                                            <td width="50%" style="padding-left: 8px; padding-bottom: 12px;">
                                                <a href="https://play.google.com/store/apps/details?id=com.bykom.app.avl" target="_blank" style="display: block; padding: 14px 12px; border: 1px solid #e2e8f0; text-align: center; text-decoration: none; color: #1f2a3e; font-size: 12px; font-weight: 600; background-color: #ffffff; border-radius: 8px;">📱 ANDROID FLOTA SEGURA</a>
                                            </td>
                                        </tr>
                                        <tr>
                                            <td width="50%" style="padding-right: 8px;">
                                                <a href="https://apps.apple.com/ar/app/flota-segura/id1445879938" target="_blank" style="display: block; padding: 14px 12px; border: 1px solid #e2e8f0; text-align: center; text-decoration: none; color: #1f2a3e; font-size: 12px; font-weight: 600; background-color: #ffffff; border-radius: 8px;">🍏 iOS FLOTA SEGURA</a>
                                            </td>
                                            <td width="50%" style="padding-left: 8px;">
                                                <a href="https://www.localsat.com.ar/guia-de-uso/alpha/app" target="_blank" style="display: block; padding: 14px 12px; border: 1px solid #e2e8f0; text-align: center; text-decoration: none; color: #1f2a3e; font-size: 12px; font-weight: 600; background-color: #ffffff; border-radius: 8px;">📡 GUÍA ALPHA</a>
                                            </td>
                                        </tr>
                                    </table>
                                </div>
                                
                                <!-- Info box -->
                                <div style="background: #ffffff; border-left: 4px solid #ff5000; padding: 18px 20px; border: 1px solid #e2e8f0; border-radius: 8px; color: #4a5b6e; font-size: 12px; margin-bottom: 28px;">
                                    <strong style="color: #ff5000; display: block; margin-bottom: 8px;">📱 PRIMER ACCESO</strong>
                                    <p style="margin: 0;">Ingresá primero por la web para registrar tu email en la opción flota segura. Allí generarás un código de seguridad para la app.</p>
                                </div>
                                
                                <!-- Commercial card -->
                                <table width="100%" border="0" cellpadding="20" cellspacing="0" bgcolor="#ffffff" style="background-color: #ffffff; border: 1px solid #e2e8f0; border-left: 4px solid #ff5000; border-radius: 12px; margin-bottom: 28px;" class="commercial-table">
                                    <tr>
                                        <td width="90" align="center" valign="middle" style="padding: 20px 0 20px 20px;" class="commercial-avatar-cell">
                                            <div style="width: 80px; height: 80px; border-radius: 50%; overflow: hidden; background: #ff5000; display: flex; align-items: center; justify-content: center; margin: 0 auto; box-shadow: 0 0 0 2px rgba(255,80,0,0.2);">
                                                @if(!empty($fotoComercial) && file_exists(public_path('images/comerciales/' . $fotoComercial)))
                                                    @if(isset($message))
                                                        <img src="{{ $message->embed(public_path('images/comerciales/' . $fotoComercial)) }}" style="width: 100%; height: 100%; object-fit: cover; object-position: center center;">
                                                    @else
                                                        <img src="{{ asset('images/comerciales/' . $fotoComercial) }}" style="width: 100%; height: 100%; object-fit: cover; object-position: center center;">
                                                    @endif
                                                @else
                                                    <span style="color: white; font-size: 32px; font-weight: bold;">{{ $inicialesComercial }}</span>
                                                @endif
                                            </div>
                                        </td>
                                        <td align="left" valign="middle" style="padding: 20px 20px 20px 10px;">
                                            <h4 style="color: #1f2a3e; font-size: 18px; font-weight: 700; margin: 0 0 6px 0;">{{ $comercialNombre }}</h4>
                                            <p style="color: #5b6e8c; font-size: 12px; margin: 4px 0;">📞 {{ $comercialTelefono }}</p>
                                            <p style="color: #5b6e8c; font-size: 12px; margin: 4px 0;">✉️ {{ $comercialEmail }}</p>
                                            <span style="display: inline-block; background: #ff5000; color: white; font-size: 9px; font-weight: bold; padding: 4px 14px; letter-spacing: 0.5px; margin-top: 8px; border-radius: 20px;">ASESOR COMERCIAL ASIGNADO</span>
                                        </td>
                                    </tr>
                                </table>
                                
                                <!-- Button -->
                                <a href="https://www.localsat.com.ar" target="_blank" style="display: block; width: 100%; padding: 14px; background: #ff5000; color: white; text-align: center; text-decoration: none; font-weight: 800; letter-spacing: 1.5px; font-size: 13px; text-transform: uppercase; border-radius: 8px;">🌐 ACCEDER AL SITIO WEB</a>
                            </td>
                        </tr>
                        
                        <!-- Footer -->
                        <tr>
                            <td style="padding: 0;">
                                <table width="100%" border="0" cellpadding="0" cellspacing="0" bgcolor="#ffffff" style="background-color: #ffffff; border-top: 1px solid #e2e8f0; border-radius: 0 0 8px 8px;">
                                    <tr>
                                        <td align="center" style="padding: 24px 32px;">
                                            <p style="font-size: 10px; color: #8b9bb0; margin: 0 0 5px 0;">
                                                <a href="mailto:soporte@localsat.com.ar" style="color: #ff5000; text-decoration: none;">SOPORTE@LOCALSAT.COM.AR</a> · 📞 0810 888 8205
                                            </p>
                                            <p style="font-size: 10px; color: #8b9bb0; margin: 0;">
                                                <a href="https://www.localsat.com.ar" style="color: #ff5000; text-decoration: none;">WWW.LOCALSAT.COM.AR</a> · RASTREO SATELITAL 24/7
                                            </p>
                                        </td>
                                    </tr>
                                </table>
                            </td>
                        </tr>
                    </table>
                </td>
            </tr>
        </table>
    </center>
</body>
</html>