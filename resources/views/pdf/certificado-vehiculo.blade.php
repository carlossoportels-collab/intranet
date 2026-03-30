{{-- resources/views/pdf/certificado-vehiculo.blade.php --}}
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificado de Servicio - {{ $vehiculo->avl_patente ?? $vehiculo->codigoalfa }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #333;
            line-height: 1.4;
            background-color: white;
            font-size: 13px;
            padding: 15px 20px;
            position: relative;
            min-height: 100vh;
        }
        
        /* HEADER */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 15px;
            border-bottom: 2px solid #fa6400;
            padding-bottom: 8px;
        }
        
        .header-table td {
            vertical-align: middle;
            padding: 3px 0;
        }
        
        .logo-cell {
            width: 50%;
            text-align: left;
        }
        
        .logo-cell img {
            max-height: 70px;
            max-width: 200px;
            object-fit: contain;
        }
        
        .web-cell {
            width: 50%;
            text-align: right;
        }
        
        .web-text {
            font-size: 15px;
            font-weight: bold;
            color: #fa6400;
        }
        
        .title-section {
            margin-bottom: 15px;
        }
        
        .title-section h1 {
            font-size: 24px;
            color: #3b3b3d;
            font-weight: bold;
            letter-spacing: 1px;
        }
        
        /* CONTENIDO PRINCIPAL */
        .main-content {
            width: 100%;
            margin-bottom: 100px;
        }
        
        .fecha {
            text-align: right;
            margin-bottom: 15px;
            font-size: 13px;
            color: #555;
        }
        
        .destinatario {
            margin-bottom: 12px;
            font-size: 14px;
        }
        
        .destinatario strong {
            color: #3b3b3d;
        }
        
        .cuerpo p {
            margin-bottom: 8px;
            text-align: justify;
            font-size: 13px;
            line-height: 1.4;
        }
        
        /* DATOS DEL VEHÍCULO */
        .datos-vehiculo-titulo {
            color: #fa6400;
            font-size: 14px;
            font-weight: bold;
            margin: 8px 0 4px 0;
        }
        
        .datos-vehiculo {
            margin: 3px 0 10px 0;
            font-size: 13px;
            width: 100%;
        }
        
        .datos-vehiculo table {
            width: 100%;
            border-collapse: collapse;
        }
        
        .datos-vehiculo td {
            padding: 1px 0;
            vertical-align: baseline;
        }
        
        .datos-vehiculo-label {
            font-weight: bold;
            color: #3b3b3d;
            width: 70px;
            white-space: nowrap;
            padding-right: 10px;
        }
        
        .datos-vehiculo-value {
            color: #333;
        }
        
        .lista-elementos {
            margin: 6px 0 10px 40px;
        }
        
        .lista-elementos li {
            margin-bottom: 2px;
            font-size: 12px;
        }
        
        .empresa-nombre {
            font-weight: bold;
            color: #fa6400;
        }
        
        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }
        
        /* FOOTER */
        .footer {
            position: absolute;
            bottom: 10px;
            left: 20px;
            right: 20px;
            width: calc(100% - 40px);
            margin: 0 auto;
            background-color: white;
            z-index: 1000;
        }

        .footer-divider {
            width: 100%;
            height: 2px;
            background-color: #fa6400;
            margin-bottom: 8px;
        }

        .footer-content {
            width: 100%;
            padding: 5px 0;
        }
        
        .footer-info {
            width: 100%;
            overflow: hidden;
            font-size: 11px;
            text-align: center;
        }
        
        .footer-telefono {
            float: left;
            width: 25%;
            text-align: left;
            color: #333333 !important;
            font-weight: normal;
        }
        
        .footer-email {
            float: right;
            width: 25%;
            text-align: right;
            color: #333333 !important;
            font-weight: normal;
        }
        
        .footer-direccion {
            float: left;
            width: 50%;
            text-align: center;
            color: #333333 !important;
            font-weight: normal;
        }
        
        .footer-info .datos {
            color: #fa6400 !important;
            font-weight: bold;
            margin-right: 3px;
        }
        
        @page {
            margin: 20px;
        }
    </style>
</head>
<body>
    @php
        // 🔥 Usar datos de contacto dinámicos o valores por defecto
        $contacto = $datos_contacto ?? [
            'telefono' => '0810 888 8205',
            'email' => 'info@localsat.com.ar',
            'web' => 'www.localsat.com.ar',
            'direccion' => 'Mitre 112, Gualeguaychú, Entre Ríos',
        ];
    @endphp

    <!-- HEADER -->
    <table class="header-table">
        <tr>
            <td class="logo-cell">
                <img src="{{ public_path($logo_path ?? 'images/logos/logo.png') }}" alt="LOCALSAT">
            </td>
            <td class="web-cell">
                <div class="web-text">{{ $contacto['web'] }}</div>
            </td>
        </tr>
    </table>
    
    <div class="title-section">
        <h1>CERTIFICADO DE SERVICIO</h1>
    </div>
    
    <div class="main-content">
        <!-- FECHA -->
        <div class="fecha">
            Buenos Aires, {{ $fecha }}
        </div>
        
        <!-- DESTINATARIO -->
        <div class="destinatario">
            <strong>A quien corresponda:</strong>
        </div>
        
        <!-- CUERPO DEL CERTIFICADO -->
        <div class="cuerpo">
            @php
                $nombreEmpresa = $empresa['razon_social'] ?? $empresa['nombre_fantasia'] ?? 'la empresa';
                
                function normalizarTexto($texto) {
                    if (empty($texto)) return '';
                    $texto = mb_strtolower($texto, 'UTF-8');
                    return mb_convert_case($texto, MB_CASE_TITLE, 'UTF-8');
                }
                
                $accesoriosNormalizados = array_map('normalizarTexto', $accesorios);
                $serviciosNormalizados = array_map('normalizarTexto', $servicios);
                $todosElementos = array_merge($accesoriosNormalizados, $serviciosNormalizados);
                sort($todosElementos);
                
                if (isset($ultima_ubicacion['fecha']) && is_string($ultima_ubicacion['fecha'])) {
                    $ultima_ubicacion['fecha'] = str_replace('%20', ' ', $ultima_ubicacion['fecha']);
                }
            @endphp
            
            <p>
                Informamos que el siguiente vehículo perteneciente a 
                <span class="empresa-nombre">{{ $nombreEmpresa }}</span> cuenta con el servicio de 
                monitoreo satelital de nuestra empresa a través de un dispositivo GPS con comunicación GSM/GPRS.
            </p>
            
            <div class="datos-vehiculo-titulo">Datos del vehículo:</div>
            
            <div class="datos-vehiculo">
                <table>
                    @if(!empty($vehiculo->avl_patente))
                    <tr><td class="datos-vehiculo-label">Patente:</td><td class="datos-vehiculo-value">{{ $vehiculo->avl_patente }}</td></tr>
                    @endif
                    @if(!empty($vehiculo->avl_marca))
                    <tr><td class="datos-vehiculo-label">Marca:</td><td class="datos-vehiculo-value">{{ $vehiculo->avl_marca }}</td></tr>
                    @endif
                    @if(!empty($vehiculo->avl_modelo))
                    <tr><td class="datos-vehiculo-label">Modelo:</td><td class="datos-vehiculo-value">{{ $vehiculo->avl_modelo }}</td></tr>
                    @endif
                    @if(!empty($vehiculo->avl_anio))
                    <tr><td class="datos-vehiculo-label">Año:</td><td class="datos-vehiculo-value">{{ $vehiculo->avl_anio }}</td></tr>
                    @endif
                    @if(!empty($vehiculo->avl_color))
                    <tr><td class="datos-vehiculo-label">Color:</td><td class="datos-vehiculo-value">{{ $vehiculo->avl_color }}</td></tr>
                    @endif
                </table>
            </div>
            
            <p>Dicha unidad está equipada con los siguientes sensores, alarmas o servicios:</p>
            
            <ul class="lista-elementos">
                <li>Alarma por encendido de motor</li>
                <li>Alarma por vehículo en movimiento</li>
                <li>Alarma por vehículo sin señal</li>
                <li>Alarma por conexión o desconexión de batería</li>
                <li>Posición actual</li>
                @foreach($todosElementos as $elemento)
                    <li>{{ $elemento }}</li>
                @endforeach
            </ul>
            
            <p>
                La cobertura del servicio brindado por nuestra empresa es de alcance nacional en todas aquellas
                zonas donde exista señal de telefonía celular.
            </p>
            
            {{-- SECCIÓN DE UBICACIÓN --}}
            @if($ultima_ubicacion && $ultima_ubicacion['fecha'])
                @php
                    $direccionLimpia = $ultima_ubicacion['direccion'] ?? '';
                    $direccionLimpia = preg_replace('/^\d+,\s*\d+\s*-\s*/', '', $direccionLimpia);
                    $direccionLimpia = preg_replace('/^\d+\s*-\s*/', '', $direccionLimpia);
                    $direccionLimpia = preg_replace('/,\s*,/', ',', $direccionLimpia);
                @endphp

                <table style="width: 100%; margin-top: 15px; margin-bottom: 15px; background-color: #f8f9fa; border: 1px solid #e9ecef; border-radius: 6px; border-collapse: collapse;">
                    <tr>
                        <td colspan="2" style="padding: 12px 12px 5px 12px; border-bottom: 1px solid #fa6400;">
                            <span style="font-weight: bold; color: #3b3b3d; font-size: 14px;">Último reporte</span>
                        </td>
                    </tr>
                    <tr>
                        <td style="width: 65%; padding: 12px; vertical-align: middle; color: #333;">
                            <p style="margin: 4px 0; font-size: 12px;"><strong>Fecha:</strong> {{ $ultima_ubicacion['fecha'] }}</p>
                            
                            @if(!empty($direccionLimpia))
                            <p style="margin: 4px 0; font-size: 12px; line-height: 1.4;">
                                <strong>Dirección:</strong> {{ $direccionLimpia }}
                            </p>
                            @endif
                            
                            <p style="margin: 4px 0; font-size: 12px;">
                                <strong>Coordenadas:</strong> {{ $ultima_ubicacion['latitud'] }}, {{ $ultima_ubicacion['longitud'] }}
                            </p>
                        </td>
                        
                        @if(!empty($ultima_ubicacion['mapa_url']))
                        <td style="width: 35%; padding: 12px; text-align: center; vertical-align: middle;">
                            <img src="{{ $ultima_ubicacion['mapa_url'] }}" 
                                alt="Mapa" 
                                style="max-width: 100%; max-height: 150px; border-radius: 4px; border: 1px solid #ccc;">
                        </td>
                        @endif
                    </tr>
                </table>
            @endif
            
            <p>
                <strong>Al día de la fecha no se registran facturas impagas ni deuda alguna.</strong>
            </p>
        </div>
    </div>
    
    <!-- FOOTER -->
    <div class="footer">
        <div class="footer-divider"></div>
        
        <div class="footer-content">
            <div class="footer-info clearfix">
                <div class="footer-telefono">
                    <span class="datos">TELEFONO:</span> {{ $contacto['telefono'] }}
                </div>
                <div class="footer-direccion">
                    <span class="datos">CASA CENTRAL:</span> {{ $contacto['direccion'] }}
                </div>
                <div class="footer-email">
                    <span class="datos">EMAIL:</span> {{ $contacto['email'] }}
                </div>
            </div>
        </div>
    </div>
</body>
</html>