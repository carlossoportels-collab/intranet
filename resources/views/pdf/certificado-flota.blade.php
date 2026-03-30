{{-- resources/views/pdf/certificado-flota.blade.php --}}
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Certificado de Servicio - {{ $empresa['razon_social'] ?? $empresa['nombre_fantasia'] }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #333;
            line-height: 1.5;
            background-color: white;
            font-size: 12px;
            padding: 15px 20px;
            position: relative;
            min-height: 100vh;
        }
        
        /* HEADER */
        .header-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 20px;
            border-bottom: 2px solid #fa6400;
            padding-bottom: 10px;
        }
        
        .header-table td {
            vertical-align: middle;
            padding: 5px 0;
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
            font-size: 14px;
            font-weight: bold;
            color: #fa6400;
        }
        
        .title-section {
            margin-bottom: 20px;
        }
        
        .title-section h1 {
            font-size: 22px;
            color: #3b3b3d;
            font-weight: bold;
            letter-spacing: 1px;
        }
        
        /* CONTENIDO PRINCIPAL */
        .main-content {
            width: 100%;
            margin-bottom: 150px;
        }
        
        .fecha {
            text-align: right;
            margin-bottom: 25px;
            font-size: 12px;
            color: #555;
        }
        
        .destinatario {
            margin-bottom: 20px;
            font-size: 13px;
        }
        
        .destinatario strong {
            color: #3b3b3d;
        }
        
        .cuerpo {
            margin-bottom: 20px;
        }
        
        .cuerpo p {
            margin-bottom: 15px;
            text-align: justify;
            font-size: 12px;
            line-height: 1.6;
        }
        
        .lista-alarmas {
            margin: 10px 0 15px 40px;
        }
        
        .lista-alarmas li {
            margin-bottom: 5px;
            font-size: 11px;
        }
        
        .empresa-nombre {
            font-weight: bold;
            color: #fa6400;
        }
        
        /* DOMINIOS EN COLUMNAS */
        .dominios-container {
            margin: 15px 0 20px 0;
            width: 100%;
            overflow: hidden;
        }
        
        .dominios-titulo {
            font-weight: bold;
            margin-bottom: 10px;
            font-size: 12px;
        }
        
        .dominios-columna {
            float: left;
            width: 14.285%;
            padding-right: 10px;
        }
        
        .dominio-item {
            font-size: 11px;
            font-family: monospace;
            margin-bottom: 5px;
            white-space: nowrap;
        }
        
        .clearfix::after {
            content: "";
            clear: both;
            display: table;
        }
        
        /* FOOTER */
        .footer {
            position: absolute;
            bottom: 0;
            left: 20px;
            right: 20px;
            width: calc(100% - 40px);
            margin: 0 auto;
        }

        .footer-divider {
            width: 100%;
            height: 2px;
            background-color: #fa6400;
            margin-bottom: 15px;
        }
        
        .footer-content {
            width: 100%;
        }
        
        .footer-info {
            width: 100%;
            overflow: hidden;
            font-size: 10px;
            color: #555;
            text-align: center;
            font-weight: bold;
        }
        
        .footer-telefono {
            float: left;
            width: 25%;
            text-align: left;
        }
        
        .footer-email {
            float: right;
            width: 25%;
            text-align: right;
        }
        
        .footer-direccion {
            float: left;
            width: 50%;
            text-align: center;
        }
        
        .footer-info .datos {
            color: #fa6400;
            margin-right: 5px;
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
                $cantidadVehiculos = count($vehiculos);
                
                function distribuirEnColumnasVertical($items, $numColumnas = 7) {
                    $total = count($items);
                    if ($total == 0) return [];
                    
                    $itemsPorColumna = ceil($total / $numColumnas);
                    $columnas = [];
                    
                    for ($i = 0; $i < $numColumnas; $i++) {
                        $columnas[] = [];
                    }
                    
                    for ($i = 0; $i < $total; $i++) {
                        $columnaIndex = $i % $numColumnas;
                        $columnas[$columnaIndex][] = $items[$i];
                    }
                    
                    return $columnas;
                }
                
                $columnasDominios = distribuirEnColumnasVertical($vehiculos, 7);
            @endphp
            
            @if($cantidadVehiculos == 1)
                @php $vehiculo = $vehiculos[0]; @endphp
                <p>
                    Informamos que el vehículo <strong>{{ $vehiculo['patente'] }}</strong> perteneciente a 
                    <span class="empresa-nombre">{{ $nombreEmpresa }}</span> cuenta con el servicio de 
                    monitoreo satelital de nuestra empresa a través de un dispositivo GPS con comunicación GSM/GPRS.
                </p>
            @else
                <p>
                    Informamos que los vehículos detallados a continuación pertenecientes a 
                    <span class="empresa-nombre">{{ $nombreEmpresa }}</span> cuentan con el servicio de 
                    monitoreo satelital de nuestra empresa a través de un dispositivo GPS con comunicación GSM/GPRS.
                </p>
                
                <div class="dominios-container clearfix">
                    <div class="dominios-titulo">Dominios:</div>
                    
                    @foreach($columnasDominios as $indice => $columna)
                        @if(count($columna) > 0)
                            <div class="dominios-columna">
                                @foreach($columna as $vehiculo)
                                    <div class="dominio-item">{{ $vehiculo['patente'] }}</div>
                                @endforeach
                            </div>
                        @endif
                    @endforeach
                </div>
            @endif
            
            <p>{{ $cantidadVehiculos > 1 ? 'Dichas unidades están' : 'Dicha unidad está' }} equipada{{ $cantidadVehiculos > 1 ? 's' : '' }} con las siguientes alarmas:</p>
            
            <ul class="lista-alarmas">
                <li>Alarma por encendido de motor</li>
                <li>Alarma por vehículo en movimiento</li>
                <li>Alarma por vehículo sin señal</li>
                <li>Alarma por conexión o desconexión de batería</li>
                <li>Posición actual</li>
            </ul>
            
            <p>
                La cobertura del servicio brindado por nuestra empresa es de alcance nacional en todas aquellas
                zonas donde exista señal de telefonía celular.
            </p>
            
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