<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Presupuesto {{ $presupuesto->referencia ?? 'N/A' }}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Helvetica', 'Arial', sans-serif;
            color: #333;
            line-height: 1.3;
            background-color: white;
            font-size: 10px;
            padding: 15px 20px;
        }
        
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
            max-width: 220px;
            object-fit: contain;
        }
        
        .title-cell {
            width: 50%;
            text-align: right;
        }
        
        .title {
            font-size: 24px;
            font-weight: bold;
            color: #3b3b3d;
            margin: 0;
            line-height: 1.2;
        }
        
        .reference {
            font-size: 14px;
            color: #666;
            margin-top: 4px;
            font-weight: normal;
        }
        
        .promo-banner {
            background-color: #fff7ed;
            border: 1px solid #fed7aa;
            border-radius: 5px;
            padding: 8px 15px;
            margin: 15px 0;
            font-weight: bold;
            color: #fa6400;
            font-size: 12px;
        }
        
        .info-table {
            width: 100%;
            border-collapse: collapse;
            margin: 15px 0;
            background-color: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 4px;
        }
        
        .info-table td {
            padding: 12px;
            vertical-align: top;
            width: 50%;
        }
        
        .info-table td:first-child {
            border-right: 1px solid #e9ecef;
        }
        
        .info-title {
            color: #fa6400;
            font-size: 12px;
            font-weight: bold;
            margin: 0 0 10px 0;
            padding-bottom: 5px;
            border-bottom: 1px solid #ddd;
        }
        
        .info-row {
            display: flex;
            margin: 6px 0;
            font-size: 10px;
        }
        
        .info-label {
            font-weight: 600;
            color: #3b3b3d;
            width: 70px;
            flex-shrink: 0;
        }
        
        .info-value {
            flex: 1;
            color: #333;
            word-break: break-word;
        }
        
        .services-table {
            width: 100%;
            border-collapse: collapse;
            margin: 20px 0;
            font-size: 9px;
        }
        
        .services-table th {
            background-color: #3b3b3d;
            color: white;
            font-weight: bold;
            padding: 6px;
            text-align: left;
            font-size: 9px;
        }
        
        .services-table th.text-right,
        .services-table td.text-right {
            text-align: right;
        }
        
        .services-table td {
            padding: 5px 6px;
            border-bottom: 1px solid #e9ecef;
        }
        
        .category-row {
            background-color: #f2f2f2;
            font-weight: bold;
            color: #3b3b3d;
        }
        
        .category-row td {
            border-bottom: 1px solid #d1d5db;
        }
        
        .text-right {
            text-align: right;
        }
        
        .totals {
            margin-top: 15px;
            text-align: right;
            font-size: 10px;
        }
        
        .total-line {
            margin: 4px 0;
        }
        
        .total-label {
            font-weight: bold;
            color: #3b3b3d;
            margin-right: 15px;
        }
        
        .divider {
            border-top: 1px solid #ccc;
            margin: 8px 0;
            width: 280px;
            margin-left: auto;
        }
        
        .grand-total {
            font-size: 13px;
            font-weight: bold;
            color: #fa6400;
        }
        
        .note {
            font-size: 8px;
            color: #666;
            font-style: italic;
            margin-top: 3px;
        }
        
        .terms {
            margin-top: 25px;
            font-size: 9px;
            color: #666;
            border-top: 1px solid #ddd;
            padding-top: 10px;
        }
        
        .terms-title {
            font-weight: bold;
            font-size: 11px;
            color: #3b3b3d;
            margin-bottom: 8px;
        }
        
        .terms p {
            margin: 4px 0;
            line-height: 1.4;
            font-size: 9px;
        }
    </style>
</head>
<body>
   @php
    $formatMoney = function($value) {
        if ($value === null || $value === '') return '-';
        if (!is_numeric($value)) return '-';
        $num = floatval($value);
        return '$ ' . number_format($num, 2, ',', '.');
    };

    $getTextoPromocion = function($productoId) use ($presupuesto) {
        if (!$presupuesto->promocion || !$presupuesto->promocion->productos) return null;
        
        $productoEnPromo = collect($presupuesto->promocion->productos)->firstWhere('producto_servicio_id', $productoId);
        
        if (!$productoEnPromo) return null;
        
        if ($productoEnPromo->tipo_promocion === '2x1') return '2x1';
        if ($productoEnPromo->tipo_promocion === '3x2') return '3x2';
        return $productoEnPromo->bonificacion . '%';
    };

    $getTextoDescuento = function($productoId, $bonificacion) use ($presupuesto, $getTextoPromocion) {
        $textoPromo = $getTextoPromocion($productoId);
        if ($textoPromo) return $textoPromo;
        
        if ($bonificacion > 0) {
            if ($productoId === ($presupuesto->abono->id ?? null)) {
                return $bonificacion . '% (Débito Automático)';
            }
            return $bonificacion . '% OFF';
        }
        return '-';
    };

    // 🔥 OBTENER LA EMPRESA CORRECTAMENTE
    $esCliente = $presupuesto->lead->es_cliente ?? false;
    $tieneEmpresa = false;
    $empresaTexto = '';
    $contactoTexto = $presupuesto->lead->nombre_completo ?? 'N/A';
    
    // Buscar la empresa a través de empresaContacto
    if ($presupuesto->lead && $presupuesto->lead->empresaContacto && $presupuesto->lead->empresaContacto->empresa) {
        $empresa = $presupuesto->lead->empresaContacto->empresa;
        if (!empty($empresa->razon_social)) {
            $tieneEmpresa = true;
            $empresaTexto = $empresa->razon_social;
        } elseif (!empty($empresa->nombre_fantasia)) {
            $tieneEmpresa = true;
            $empresaTexto = $empresa->nombre_fantasia;
        }
    }
    
    // Si no se encontró empresa, intentar con el accessor getEmpresaAttribute
    if (!$tieneEmpresa && $presupuesto->lead->empresa) {
        $empresaData = $presupuesto->lead->empresa;
        if (is_array($empresaData) && !empty($empresaData['razon_social'])) {
            $tieneEmpresa = true;
            $empresaTexto = $empresaData['razon_social'];
        } elseif (is_string($empresaData) && !empty($empresaData)) {
            $tieneEmpresa = true;
            $empresaTexto = $empresaData;
        }
    }
    
    $mostrarEmpresa = $tieneEmpresa && $esCliente;
    
    // Calcular totales
    $totalServicios = 0;
    $totalAccesorios = 0;

    $subtotalTasa = floatval($presupuesto->subtotal_tasa ?? 0);
    $subtotalAbono = floatval($presupuesto->subtotal_abono ?? 0);

    foreach ($servicios_clasificados ?? [] as $item) {
        $totalServicios += floatval($item->subtotal ?? 0);
    }

    foreach ($accesorios_clasificados ?? [] as $item) {
        $totalAccesorios += floatval($item->subtotal ?? 0);
    }

    $inversionInicial = $subtotalTasa + $totalAccesorios;
    $costoMensual = $subtotalAbono + $totalServicios;
    $totalPrimerMes = $inversionInicial + $costoMensual;
@endphp

<!-- HEADER (igual) -->
<table class="header-table">
     <tr>
        <td class="logo-cell">
            @if(!empty($compania['logo']) && file_exists($compania['logo']))
                <img src="{{ $compania['logo'] }}" alt="{{ $compania['nombre'] }}">
            @endif
        </td>
        <td class="title-cell">
            <div class="title">PRESUPUESTO COMERCIAL</div>
            <div class="reference">Ref: #{{ $presupuesto->referencia ?? 'N/A' }}</div>
        </td>
    </tr>
</table>

<!-- PROMOCIÓN -->
@if($presupuesto->promocion)
    <div class="promo-banner">
        PROMOCIÓN VIGENTE: {{ $presupuesto->promocion->nombre }}
    </div>
@endif

<!-- DOS COLUMNAS: CLIENTE y DETALLES -->
<table class="info-table">
    <tr>
        <td>
            <div class="info-title">CLIENTE</div>
            @if($mostrarEmpresa)
                <div class="info-row">
                    <span class="info-label">Empresa:</span>
                    <span class="info-value">{{ $empresaTexto }}</span>
                </div>
            @endif
            <div class="info-row">
                <span class="info-label">Contacto:</span>
                <span class="info-value">{{ $contactoTexto }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Email:</span>
                <span class="info-value">{{ $presupuesto->lead->email ?? 'N/A' }}</span>
            </div>
            @if($presupuesto->lead->telefono)
            <div class="info-row">
                <span class="info-label">Teléfono:</span>
                <span class="info-value">{{ $presupuesto->lead->telefono }}</span>
            </div>
            @endif
        </td>
        <td>
            <div class="info-title">DETALLES</div>
            <div class="info-row">
                <span class="info-label">Fecha:</span>
                <span class="info-value">{{ \Carbon\Carbon::parse($presupuesto->created)->format('d/m/Y') }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Validez:</span>
                <span class="info-value">{{ \Carbon\Carbon::parse($presupuesto->validez)->format('d/m/Y') }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Asesor:</span>
                <span class="info-value">{{ $presupuesto->nombre_comercial ?? 'No asignado' }}</span>
            </div>
            <div class="info-row">
                <span class="info-label">Unidades:</span>
                <span class="info-value">{{ $presupuesto->cantidad_vehiculos ?? 1 }} Vehículo(s)</span>
            </div>
        </td>
    </tr>
</table>

    <!-- TABLA DE SERVICIOS (igual que antes) -->
    <table class="services-table">
        <thead>
            <tr>
                <th>Descripción</th>
                <th class="text-right">Cant.</th>
                <th class="text-right">Precio Unit.</th>
                <th class="text-right">Promoción</th>
                <th class="text-right">Subtotal</th>
            </tr>
        </thead>
        <tbody>
            @if($presupuesto->tasa)
                <tr class="category-row">
                    <td colspan="5">SERVICIO DE INSTALACIÓN</td>
                </tr>
                <tr>
                    <td>{{ $presupuesto->tasa->nombre ?? 'Tasa' }}</td>
                    <td class="text-right">{{ $presupuesto->cantidad_vehiculos }}</td>
                    <td class="text-right">{{ $formatMoney($presupuesto->valor_tasa) }}</td>
                    <td class="text-right">{{ $getTextoDescuento($presupuesto->tasa->id, $presupuesto->tasa_bonificacion ?? 0) }}</td>
                    <td class="text-right">{{ $formatMoney($presupuesto->subtotal_tasa) }}</td>
                </tr>
            @endif

            @if(count($accesorios_clasificados ?? []) > 0)
                <tr class="category-row">
                    <td colspan="5">ACCESORIOS</td>
                </tr>
                @foreach($accesorios_clasificados as $item)
                    <tr>
                        <td>{{ $item->productoServicio->nombre ?? 'Producto #' . $item->prd_servicio_id }}</td>
                        <td class="text-right">{{ $item->cantidad }}</td>
                        <td class="text-right">{{ $formatMoney($item->valor) }}</td>
                        <td class="text-right">{{ $getTextoDescuento($item->prd_servicio_id, $item->bonificacion ?? 0) }}</td>
                        <td class="text-right">{{ $formatMoney($item->subtotal) }}</td>
                    </tr>
                @endforeach
            @endif

            @if($presupuesto->abono)
                <tr class="category-row">
                    <td colspan="5">ABONO MENSUAL</td>
                </tr>
                <tr>
                    <td>{{ $presupuesto->abono->nombre ?? 'Abono' }}</td>
                    <td class="text-right">{{ $presupuesto->cantidad_vehiculos }}</td>
                    <td class="text-right">{{ $formatMoney($presupuesto->valor_abono) }}</td>
                    <td class="text-right">{{ $getTextoDescuento($presupuesto->abono->id, $presupuesto->abono_bonificacion ?? 0) }}</td>
                    <td class="text-right">{{ $formatMoney($presupuesto->subtotal_abono) }}</td>
                </tr>
            @endif

            @if(count($servicios_clasificados ?? []) > 0)
                <tr class="category-row">
                    <td colspan="5">SERVICIOS ADICIONALES</td>
                </tr>
                @foreach($servicios_clasificados as $item)
                    <tr>
                        <td>{{ $item->productoServicio->nombre ?? 'Producto #' . $item->prd_servicio_id }}</td>
                        <td class="text-right">{{ $item->cantidad }}</td>
                        <td class="text-right">{{ $formatMoney($item->valor) }}</td>
                        <td class="text-right">{{ $getTextoDescuento($item->prd_servicio_id, $item->bonificacion ?? 0) }}</td>
                        <td class="text-right">{{ $formatMoney($item->subtotal) }}</td>
                    </tr>
                @endforeach
            @endif
        </tbody>
    </table>

    <!-- TOTALES -->
    <div class="totals">
        <div class="total-line grand-total">
            <span class="total-label">Inversión Inicial:</span>
            <span class="total-value">{{ $formatMoney($inversionInicial) }}</span>
        </div>
        <div class="total-line grand-total">
            <span class="total-label">Costo Mensual:</span>
            <span class="total-value">{{ $formatMoney($costoMensual) }}</span>
        </div>
        <div class="divider"></div>
    </div>

    <!-- TÉRMINOS Y CONDICIONES (con letra más grande) -->
    <div class="terms">
        <div class="terms-title">TÉRMINOS Y CONDICIONES</div>
        
        @if($presupuesto->promocion)
            <p>• Promoción aplicada: {{ $presupuesto->promocion->nombre }}</p>
            @if($presupuesto->promocion->descripcion)
                <p>&nbsp;&nbsp;{{ $presupuesto->promocion->descripcion }}</p>
            @endif
        @endif
        
        <p>• Validez: {{ $presupuesto->dias_validez ?? 7 }} días hábiles dentro del mes en curso de la cotización.</p>
        <p>• Actualización: sujeta a variación IPC mensual. Los valores detallados podrán variar y serán los que rijan al momento de la contratación.</p>
        <p>• IVA: todos los precios no incluyen IVA (21%).</p>
        <p>• Soporte: asesoramiento comercial y servicio técnico en domicilio incluido.</p>
        
        @if(($presupuesto->abono_bonificacion ?? 0) > 0 && $presupuesto->abono && !$getTextoPromocion($presupuesto->abono->id))
            <p>• Descuento en abono del {{ $presupuesto->abono_bonificacion }}% por adhesión a débito automático.</p>
        @endif
    </div>
</body>
</html>