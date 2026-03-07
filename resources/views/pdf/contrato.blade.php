{{-- resources/views/pdf/contrato.blade.php --}}
<!DOCTYPE html>
<html lang="es">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contrato #{{ str_pad($contrato->id, 8, '0', STR_PAD_LEFT) }}</title>
    <style>
        :root {
            --local-dark: rgb(60, 60, 62);
            --sat-orange: rgb(247, 98, 0);
            --border-color: #e0e0e0;
            --table-header-bg: #e0e0e0;
            --table-header-text: #333333;
        }
        
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Segoe UI', 'Helvetica Neue', Arial, sans-serif;
            color: #333;
            line-height: 1.25;
            background-color: white;
            font-size: 10px;
            padding: 5px 10px;
        }
        
        .contract-container {
            max-width: 1200px;
            margin: 0 auto;
            background: white;
        }
        
        .contract-header {
            padding: 5px 0 8px 0;
            border-bottom: 2px solid var(--local-dark);
            margin-bottom: 6px;
        }

        .header-grid {
            display: table;
            width: 100%;
            table-layout: fixed;
            margin-bottom: 4px;
        }

        .header-row {
            display: table-row;
        }

        .left-column, .center-column, .right-column {
            display: table-cell;
            vertical-align: middle;
        }

        .left-column {
            text-align: left;
        }

        .center-column {
            text-align: center;
        }

        .right-column {
            text-align: right;
        }

        .company-logo {
            font-size: 16px;
            font-weight: 800;
            letter-spacing: -0.5px;
            margin-bottom: 2px;
        }
        
        .company-logo .local {
            color: var(--local-dark);
        }

        .company-logo .sat {
            color: var(--sat-orange);
        }

        .company-info {
            font-size: 8.5px;
            color: #555;
            line-height: 1.3;
            margin-top: 2px;
        }

        .contract-title {
            font-size: 14px;
            font-weight: 600;
            color: var(--local-dark);
            margin-bottom: 1px;
        }

        .contract-subtitle {
            font-size: 8px;
            color: #666;
            margin-bottom: 4px;
        }

        .contract-details {
            font-size: 8px;
            display: inline-block;
            text-align: right;
        }

        .detail-item {
            display: flex;
            justify-content: flex-end;
            align-items: center;
            gap: 5px;
            margin-bottom: 2px;
        }

        .detail-label {
            font-weight: 600;
            color: var(--local-dark);
            width: 50px;
            text-align: left;
        }

        .detail-value {
            font-weight: normal;
            color: #333;
            min-width: 80px;
            text-align: left;
        }
        
        .section {
            margin-bottom: 6px;
            padding: 0 2px;
        }
        
        .section-title {
            color: var(--local-dark);
            font-size: 11px;
            font-weight: 600;
            margin-bottom: 5px;
            padding-bottom: 2px;
            border-bottom: 1px solid var(--sat-orange);
        }
        
        /* Tabla de 2 columnas */
        .data-table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 6px;
        }
        
        .data-table td {
            padding: 2px 4px;
            vertical-align: middle;
        }
/* Celda contenedora - fondo gris suave */
        .data-cell {
            display: flex;
            align-items: center;
            width: 100%;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 2px;
            padding: 3px 5px;
            min-height: 20px;
        }

        /* Label con ancho fijo */
        .data-label {
            font-weight: 600;
            color: #333333;
            font-size: 9px;
            width: 150px;
            white-space: nowrap;
            text-align: left;
            background: transparent;
        }

        /* Contenedor del valor - SIN overflow hidden para textos largos */
        .data-value {
            flex: 1;
            font-size: 9px;
            color: #000000;
            white-space: normal; /* Cambiado de nowrap a normal */
            word-wrap: break-word; /* Permite que las palabras largas se corten */
            overflow: visible; /* Cambiado de hidden a visible */
            text-align: left;
            background: transparent;
            border: none;
            padding: 0;
            margin-left: 5px;
            line-height: 1.4; /* Mejor altura de línea */
        }

        .fiscal-section {
            margin-top: 6px;
            padding-top: 5px;
            border-top: 1px dashed #ddd;
        }
        
        .tables-container {
            display: table;
            width: 100%;
            table-layout: fixed;
            border-collapse: collapse;
            margin-bottom: 6px;
        }

        .tables-row {
            display: table-row;
        }

        .tables-cell {
            display: table-cell;
            width: 50%;
            vertical-align: top;
            padding-right: 4px;
        }

        .tables-cell:last-child {
            padding-right: 0;
        }
        
        .table-header {
            font-weight: bold;
            color: var(--local-dark);
            font-size: 10px;
            margin-bottom: 2px;
        }
        
        .service-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 8.5px;
        }
        
        .service-table th {
            background: var(--table-header-bg) !important;
            color: var(--table-header-text) !important;
            padding: 4px;
            text-align: left;
            font-weight: 600;
            border: 1px solid #ccc;
            font-size: 8.5px;
        }
        
        .service-table td {
            padding: 3px 4px;
            border-bottom: 1px solid #eee;
            border-left: 1px solid #eee;
            border-right: 1px solid #eee;
        }
        
        .service-table .number {
            text-align: right;
            font-family: 'Courier New', monospace;
            white-space: nowrap;
            font-size: 8.5px;
        }
        
        .category-row {
            background: #f2f2f2;
            font-weight: bold;
            color: var(--local-dark);
            font-size: 9px;
        }
        
        .total-row {
            background: #fff3e0;
            font-weight: bold;
            border-top: 1px solid var(--sat-orange);
            color: var(--local-dark);
            font-size: 9px;
        }
        
        .payment-section {
            margin-bottom: 6px;
        }
        
        .payment-info {
            background: #f8f9fa;
            padding: 6px;
            border-radius: 3px;
            border: 1px solid #e9ecef;
        }
        
        .payment-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 5px;
            padding-bottom: 3px;
            border-bottom: 1px solid #ddd;
        }
        
        .payment-title {
            font-weight: 600;
            color: var(--local-dark);
            font-size: 10px;
        }
        
        .payment-status {
            font-size: 8px;
            color: var(--sat-orange);
            font-weight: 600;
        }
        
        .payment-details {
            display: table;
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 8px;
        }

        .payment-row {
            display: table-row;
        }

        .payment-cell {
            display: table-cell;
            width: 50%;
            padding-right: 5px;
            vertical-align: top;
        }

        .payment-cell:last-child {
            padding-right: 0;
        }
        
        .payment-field {
            display: flex;
            flex-direction: column;
            gap: 1px;
            margin-bottom: 5px;
        }
        
        .payment-label {
            font-weight: 600;
            color: var(--local-dark);
            font-size: 8.5px;
        }
        
        .payment-value {
            font-size: 9px;
            padding: 3px 4px;
        }
        
        .authorization-box {
            margin-top: 6px;
            padding: 6px;
            background: white;
            border: 1px solid #ddd;
            border-radius: 2px;
        }
        
        .authorization-title {
            font-weight: 600;
            color: var(--local-dark);
            font-size: 10px;
            margin-bottom: 4px;
        }
        
        .authorization-text {
            font-size: 8px;
            color: #555;
            line-height: 1.2;
            margin-bottom: 8px;
        }
        
        .authorization-text p {
            margin-bottom: 4px;
        }
        
        .signature-fields-three {
            display: table;
            width: 100%;
            table-layout: fixed;
            border-collapse: collapse;
        }

        .signature-row-three {
            display: table-row;
        }

        .signature-cell-three {
            display: table-cell;
            width: 33.33%;
            vertical-align: top;
            padding-right: 5px;
        }

        .signature-cell-three:last-child {
            padding-right: 0;
        }
        
        .signature-field {
            display: flex;
            flex-direction: column;
            gap: 1px;
        }
        
        .signature-label {
            font-weight: 600;
            color: var(--local-dark);
            font-size: 7.5px;
        }
        
        .signature-line {
            border-bottom: 1px solid #333;
            height: 15px;
            margin-top: 1px;
        }
        
        .installation-line {
            display: table;
            width: 100%;
            table-layout: fixed;
            margin-bottom: 6px;
            padding: 5px 8px;
            background: #f8f9fa;
            border: 1px solid #e9ecef;
            border-radius: 2px;
        }

        .installation-row {
            display: table-row;
        }

        .installation-item {
            display: table-cell;
            vertical-align: middle;
            text-align: center;
        }

        .installation-item:first-child {
            text-align: left;
        }

        .installation-item:last-child {
            text-align: right;
        }
        
        .installation-label {
            font-weight: 600;
            color: var(--local-dark);
            font-size: 9px;
            white-space: nowrap;
        }
        
        .installation-value {
            font-size: 9px;
            white-space: nowrap;
        }
        
        .vehicles-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 9px;
        }
        
        .vehicles-table th {
            background: var(--table-header-bg) !important;
            color: var(--table-header-text) !important;
            padding: 4px;
            text-align: left;
            font-weight: 600;
            border: 1px solid #ccc;
            font-size: 9px;
        }
        
        .vehicles-table td {
            padding: 3px 4px;
            border-bottom: 1px solid #eee;
            border-left: 1px solid #eee;
            border-right: 1px solid #eee;
            font-size: 9px;
        }
        
        .signature-section {
            margin-top: 15px;
            padding-top: 10px;
            border-top: 1px solid var(--border-color);
        }
        
        .signature-fields-final {
            display: table;
            width: 100%;
            table-layout: fixed;
            border-collapse: collapse;
            margin-top: 15px;
        }

        .signature-row-final {
            display: table-row;
        }

        .signature-cell-final {
            display: table-cell;
            width: 50%;
            text-align: center;
            vertical-align: bottom;
            padding-right: 10px;
        }

        .signature-cell-final:last-child {
            padding-right: 0;
        }
        
        .signature-line-final {
            border-bottom: 1px solid #333;
            height: 25px;
            margin-top: 8px;
            width: 100%;
        }
        
        .signature-label-final {
            font-size: 8px;
            color: #666;
            margin-top: 3px;
        }
        
        @media print {
            @page {
                size: A4;
                margin: 10mm;
            }
        }
    </style>
</head>
<body>
    @php
        $formatMoney = function($value) {
            if ($value === null || $value === '') return '-';
            if (!is_numeric($value)) return '-';
            return '$ ' . number_format($value, 2, ',', '.');
        };
        
        $tienePresupuesto = !empty($contrato->presupuesto);
        
        $getMetodoPagoTexto = function() use ($contrato) {
            if (!empty($contrato->debitoCbu)) return "CBU";
            if (!empty($contrato->debitoTarjeta)) return "TARJETA DE CRÉDITO/DÉBITO";
            return null;
        };
        
        $tieneMetodoPago = !empty($contrato->debitoCbu) || !empty($contrato->debitoTarjeta);
        
        $metodoPago = $getMetodoPagoTexto();
        
        $totalInversion = 0;
        $costoMensual = 0;
        
        if ($tienePresupuesto) {
            $totalInversion = ($contrato->presupuesto->subtotal_tasa ?? 0);
            $costoMensual = ($contrato->presupuesto->subtotal_abono ?? 0);
            
            if (!empty($contrato->presupuesto->agregados)) {
                foreach ($contrato->presupuesto->agregados as $item) {
                    if ($item->tipo_id == 5) {
                        $totalInversion += $item->subtotal ?? 0;
                    } elseif ($item->tipo_id == 3) {
                        $costoMensual += $item->subtotal ?? 0;
                    }
                }
            }
        } else {
            $costoMensual = $contrato->presupuesto_total_mensual ?? 0;
        }
        
        $totalPrimerMes = $totalInversion + $costoMensual;
    @endphp

    <div class="contract-container">
        <!-- Header -->
        <div class="contract-header">
            <div class="header-grid">
                <div class="header-row">
                    <div class="left-column">
                        @if(!empty($compania['logo']) && file_exists($compania['logo']))
                            <img src="{{ $compania['logo'] }}" alt="{{ $compania['nombre'] }}" style="height: 35px; margin-bottom: 2px;">
                        @else
                            <div class="company-logo">
                                @if(str_contains($compania['nombre'], 'SAT'))
                                    <span class="local">{{ str_replace('SAT', '', $compania['nombre']) }}</span>
                                    <span class="sat">SAT</span>
                                @else
                                    <span class="local">{{ $compania['nombre'] }}</span>
                                @endif
                            </div>
                        @endif
                        
                        <div class="company-info">
                            <strong>LogSat S.A.</strong><br />
                            Av. Alvear 1881 piso 7 depto. E, Ciudad Autónoma<br />
                            de Buenos Aires (1129) - Tel: 0810 888 8205<br />
                            email: info@localsat.com.ar - www.localsat.com.ar<br />
                            CUIT: 30-71168696-3
                        </div>
                    </div>
                    
                    <div class="center-column">
                        <div class="contract-title">CONTRATO DE SERVICIO</div>
                        <div class="contract-subtitle">Sistema de Rastreo Satelital</div>
                    </div>
                    
                    <div class="right-column">
                        <div class="contract-details">
                            <div class="detail-item">
                                <span class="detail-label">Fecha:</span>
                                <span class="detail-value">{{ \Carbon\Carbon::parse($contrato->fecha_emision)->format('d/m/Y') }}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Contrato:</span>
                                <span class="detail-value">{{ str_pad($contrato->id, 8, '0', STR_PAD_LEFT) }}</span>
                            </div>
                            <div class="detail-item">
                                <span class="detail-label">Vendedor:</span>
                                <span class="detail-value">{{ explode(' ', $contrato->vendedor_nombre)[0] ?? 'G. MOYANO' }}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        <!-- Datos del Cliente - TABLA DE 2 COLUMNAS CON ANCHOS FIJOS Y ALINEACIÓN DERECHA -->
        <div class="section">
            <div class="section-title">Datos del Cliente</div>
            
            <table class="data-table">
                <tr>
                    <td width="50%">
                        <div class="data-cell">
                            <span class="data-label">Nombre completo:</span>
                            <span class="data-value">{{ $contrato->cliente_nombre_completo }}</span>
                        </div>
                    </td>
                    <td width="50%">
                        <div class="data-cell">
                            <span class="data-label">DNI:</span>
                            <span class="data-value">{{ $contrato->contacto_nro_documento ?? '-' }}</span>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td width="50%">
                        <div class="data-cell">
                            <span class="data-label">Teléfono:</span>
                            <span class="data-value">{{ $contrato->cliente_telefono ?? '-' }}</span>
                        </div>
                    </td>
                    <td width="50%">
                        <div class="data-cell">
                            <span class="data-label">Email:</span>
                            <span class="data-value">{{ $contrato->cliente_email ?? '-' }}</span>
                        </div>
                    </td>
                </tr>
                <tr>
                    <td width="50%">
                        <div class="data-cell">
                            <span class="data-label">Domicilio:</span>
                            <span class="data-value">{{ $contrato->contacto_direccion_personal ?? '-' }}</span>
                        </div>
                    </td>
                    <td width="50%">
                        <div class="data-cell">
                            <span class="data-label">Localidad:</span>
                            <span class="data-value">{{ $contrato->cliente_localidad ?? '' }}{{ $contrato->cliente_provincia ? ', ' . $contrato->cliente_provincia : '' }}</span>
                        </div>
                    </td>
                </tr>
            </table>
            
            <!-- Datos Fiscales y Responsables - TABLA DE 2 COLUMNAS CON ANCHOS FIJOS Y ALINEACIÓN DERECHA -->
            <div class="fiscal-section">
                <div class="section-title">Datos Fiscales y Responsables</div>
                
                <table class="data-table">
                    <tr>
                        <td width="50%">
                            <div class="data-cell">
                                <span class="data-label">Razón social:</span>
                                <span class="data-value">{{ $contrato->empresa_razon_social }}</span>
                            </div>
                        </td>
                        <td width="50%">
                            <div class="data-cell">
                                <span class="data-label">CUIT:</span>
                                <span class="data-value">{{ $contrato->empresa_cuit }}</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td width="50%">
                            <div class="data-cell">
                                <span class="data-label">Domicilio fiscal:</span>
                                <span class="data-value">{{ $contrato->empresa_domicilio_fiscal ?? '-' }}</span>
                            </div>
                        </td>
                        <td width="50%">
                            <div class="data-cell">
                                <span class="data-label">Actividad:</span>
                                <span class="data-value">{{ $contrato->empresa_actividad ?? '-' }}</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td width="50%">
                            <div class="data-cell">
                                <span class="data-label">Situación AFIP:</span>
                                <span class="data-value">{{ $contrato->empresa_situacion_afip ?? '-' }}</span>
                            </div>
                        </td>
                        <td width="50%">
                            <div class="data-cell">
                                <span class="data-label">Email empresa:</span>
                                <span class="data-value">{{ $contrato->empresa_email_fiscal ?? '-' }}</span>
                            </div>
                        </td>
                    </tr>
                    <tr>
                        <td width="50%">
                            <div class="data-cell">
                                <span class="data-label">Responsable flota:</span>
                                <span class="data-value">
                                    {{ $contrato->responsable_flota_nombre ?? '-' }}
                                    @if($contrato->responsable_flota_telefono) - {{ $contrato->responsable_flota_telefono }}@endif
                                    @if($contrato->responsable_flota_email) - {{ $contrato->responsable_flota_email }}@endif
                                </span>
                            </div>
                        </td>
                        <td width="50%">
                            <div class="data-cell">
                                <span class="data-label">Responsable pagos:</span>
                                <span class="data-value">
                                    {{ $contrato->responsable_pagos_nombre ?? '-' }}
                                    @if($contrato->responsable_pagos_telefono) - {{ $contrato->responsable_pagos_telefono }}@endif
                                    @if($contrato->responsable_pagos_email) - {{ $contrato->responsable_pagos_email }}@endif
                                </span>
                            </div>
                        </td>
                    </tr>
                </table>
            </div>
        </div>

        <!-- Servicios Contratados -->
        <div class="section">
            <div class="section-title">Servicios Contratados</div>
            
            @if($tienePresupuesto)
                <div class="tables-container">
                    <div class="tables-row">
                        <div class="tables-cell">
                            <div class="table-header">INVERSIÓN INICIAL</div>
                            <table class="service-table">
                                <thead>
                                    <tr>
                                        <th>Descripción</th>
                                        <th>Cant.</th>
                                        <th>P.Unit.</th>
                                        <th>Desc.</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @if(!empty($contrato->presupuesto) && !empty($contrato->presupuesto->tasa))
                                        <tr class="category-row">
                                            <td colspan="5">SERVICIOS DE INSTALACIÓN</td>
                                        </tr>
                                        <tr>
                                            <td>{{ $contrato->presupuesto->tasa->nombre }}</td>
                                            <td class="number">{{ $contrato->presupuesto_cantidad_vehiculos }}</td>
                                            <td class="number">{{ $formatMoney($contrato->presupuesto->valor_tasa) }}</td>
                                            <td class="number">
                                                @php
                                                    $tasaPromo = null;
                                                    if (!empty($contrato->presupuesto->promocion) && !empty($contrato->presupuesto->promocion->productos)) {
                                                        $tasaPromo = $contrato->presupuesto->promocion->productos->firstWhere('producto_servicio_id', $contrato->presupuesto->tasa->id);
                                                    }
                                                    
                                                    $descuentoTexto = '-';
                                                    if ($tasaPromo) {
                                                        if ($tasaPromo->tipo_promocion === '2x1') $descuentoTexto = '2x1';
                                                        elseif ($tasaPromo->tipo_promocion === '3x2') $descuentoTexto = '3x2';
                                                        elseif ($tasaPromo->tipo_promocion === 'porcentaje') {
                                                            $bonificacion = $tasaPromo->bonificacion ?? $contrato->presupuesto->tasa_bonificacion;
                                                            $descuentoTexto = $bonificacion . '%';
                                                        }
                                                    } elseif (!empty($contrato->presupuesto->tasa_bonificacion) && $contrato->presupuesto->tasa_bonificacion > 0) {
                                                        $descuentoTexto = $contrato->presupuesto->tasa_bonificacion . '%';
                                                    }
                                                @endphp
                                                {{ $descuentoTexto }}
                                            </td>
                                            <td class="number">{{ $formatMoney($contrato->presupuesto->subtotal_tasa) }}</td>
                                        </tr>
                                    @endif

                                    @if(!empty($contrato->presupuesto) && !empty($contrato->presupuesto->agregados))
                                        @php
                                            $accesorios = collect($contrato->presupuesto->agregados)->filter(function($item) {
                                                return $item->tipo_id == 5;
                                            });
                                        @endphp
                                        @if($accesorios->count() > 0)
                                            <tr class="category-row">
                                                <td colspan="5">ACCESORIOS</td>
                                            </tr>
                                            @foreach($accesorios as $item)
                                                @php
                                                    $itemPromo = null;
                                                    if (!empty($contrato->presupuesto->promocion) && !empty($contrato->presupuesto->promocion->productos)) {
                                                        $itemPromo = $contrato->presupuesto->promocion->productos->firstWhere('producto_servicio_id', $item->prd_servicio_id);
                                                    }
                                                    
                                                    $descuentoTexto = '-';
                                                    if ($itemPromo) {
                                                        if ($itemPromo->tipo_promocion === '2x1') $descuentoTexto = '2x1';
                                                        elseif ($itemPromo->tipo_promocion === '3x2') $descuentoTexto = '3x2';
                                                        elseif ($itemPromo->tipo_promocion === 'porcentaje') {
                                                            $bonificacion = $itemPromo->bonificacion ?? $item->bonificacion;
                                                            $descuentoTexto = $bonificacion . '%';
                                                        }
                                                    } elseif (!empty($item->bonificacion) && $item->bonificacion > 0) {
                                                        $descuentoTexto = $item->bonificacion . '%';
                                                    }
                                                @endphp
                                                <tr>
                                                    <td>{{ $item->producto_nombre ?? 'Producto' }}</td>
                                                    <td class="number">{{ $item->cantidad }}</td>
                                                    <td class="number">{{ $formatMoney($item->valor) }}</td>
                                                    <td class="number">{{ $descuentoTexto }}</td>
                                                    <td class="number">{{ $formatMoney($item->subtotal) }}</td>
                                                </tr>
                                            @endforeach
                                        @endif
                                    @endif
                                </tbody>
                            </table>
                        </div>
                        
                        <div class="tables-cell">
                            <div class="table-header">COSTO MENSUAL</div>
                            <table class="service-table">
                                <thead>
                                    <tr>
                                        <th>Descripción</th>
                                        <th>Cant.</th>
                                        <th>P.Unit.</th>
                                        <th>Desc.</th>
                                        <th>Subtotal</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    @if(!empty($contrato->presupuesto) && !empty($contrato->presupuesto->abono))
                                        <tr class="category-row">
                                            <td colspan="5">ABONO BASE</td>
                                        </tr>
                                        <tr>
                                            <td>{{ $contrato->presupuesto->abono->nombre }}</td>
                                            <td class="number">{{ $contrato->presupuesto_cantidad_vehiculos }}</td>
                                            <td class="number">{{ $formatMoney($contrato->presupuesto->valor_abono) }}</td>
                                            <td class="number">
                                                @php
                                                    $abonoPromo = null;
                                                    if (!empty($contrato->presupuesto->promocion) && !empty($contrato->presupuesto->promocion->productos)) {
                                                        $abonoPromo = $contrato->presupuesto->promocion->productos->firstWhere('producto_servicio_id', $contrato->presupuesto->abono->id);
                                                    }
                                                    
                                                    $descuentoTexto = '-';
                                                    if ($abonoPromo) {
                                                        if ($abonoPromo->tipo_promocion === '2x1') $descuentoTexto = '2x1';
                                                        elseif ($abonoPromo->tipo_promocion === '3x2') $descuentoTexto = '3x2';
                                                        elseif ($abonoPromo->tipo_promocion === 'porcentaje') {
                                                            $bonificacion = $abonoPromo->bonificacion ?? $contrato->presupuesto->abono_bonificacion;
                                                            $descuentoTexto = $bonificacion . '%';
                                                        }
                                                    } elseif (!empty($contrato->presupuesto->abono_bonificacion) && $contrato->presupuesto->abono_bonificacion > 0) {
                                                        $descuentoTexto = $contrato->presupuesto->abono_bonificacion . '%';
                                                    }
                                                @endphp
                                                {{ $descuentoTexto }}
                                            </td>
                                            <td class="number">{{ $formatMoney($contrato->presupuesto->subtotal_abono) }}</td>
                                        </tr>
                                    @endif

                                    @if(!empty($contrato->presupuesto) && !empty($contrato->presupuesto->agregados))
                                        @php
                                            $servicios = collect($contrato->presupuesto->agregados)->filter(function($item) {
                                                return $item->tipo_id == 3;
                                            });
                                        @endphp
                                        @if($servicios->count() > 0)
                                            <tr class="category-row">
                                                <td colspan="5">SERVICIOS ADICIONALES</td>
                                            </tr>
                                            @foreach($servicios as $item)
                                                @php
                                                    $itemPromo = null;
                                                    if (!empty($contrato->presupuesto->promocion) && !empty($contrato->presupuesto->promocion->productos)) {
                                                        $itemPromo = $contrato->presupuesto->promocion->productos->firstWhere('producto_servicio_id', $item->prd_servicio_id);
                                                    }
                                                    
                                                    $descuentoTexto = '-';
                                                    if ($itemPromo) {
                                                        if ($itemPromo->tipo_promocion === '2x1') $descuentoTexto = '2x1';
                                                        elseif ($itemPromo->tipo_promocion === '3x2') $descuentoTexto = '3x2';
                                                        elseif ($itemPromo->tipo_promocion === 'porcentaje') {
                                                            $bonificacion = $itemPromo->bonificacion ?? $item->bonificacion;
                                                            $descuentoTexto = $bonificacion . '%';
                                                        }
                                                    } elseif (!empty($item->bonificacion) && $item->bonificacion > 0) {
                                                        $descuentoTexto = $item->bonificacion . '%';
                                                    }
                                                @endphp
                                                <tr>
                                                    <td>{{ $item->producto_nombre ?? 'Servicio' }}</td>
                                                    <td class="number">{{ $item->cantidad }}</td>
                                                    <td class="number">{{ $formatMoney($item->valor) }}</td>
                                                    <td class="number">{{ $descuentoTexto }}</td>
                                                    <td class="number">{{ $formatMoney($item->subtotal) }}</td>
                                                </tr>
                                            @endforeach
                                        @endif
                                    @endif
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            @else
                <div style="padding: 10px; background: #f8f9fa; border: 1px solid #e9ecef; border-radius: 3px; margin-bottom: 10px;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <tr>
                            <td style="width: 50%; vertical-align: top; padding-right: 10px;">
                                <div class="table-header">COSTO MENSUAL</div>
                                <div style="margin-top: 10px;">
                                    <div style="display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee;">
                                        <span>Abonos de la flota ({{ $contrato->presupuesto_cantidad_vehiculos ?? 0 }} vehículos)</span>
                                        <span style="font-family: 'Courier New', monospace; font-weight: bold;">{{ $formatMoney($costoMensual) }}</span>
                                    </div>
                                </div>
                            </td>
                            <td style="width: 50%; vertical-align: top;">
                                <div class="table-header">TOTAL</div>
                                <div style="margin-top: 10px;">
                                    <div style="display: flex; justify-content: space-between; padding: 8px; background: #fff3e0; font-weight: bold; border: 1px solid rgb(247, 98, 0); border-radius: 3px;">
                                        <span>Costo mensual total:</span>
                                        <span style="font-family: 'Courier New', monospace;">{{ $formatMoney($costoMensual) }}</span>
                                    </div>
                                </div>
                            </td>
                        </tr>
                    </table>
                </div>
            @endif
            
            @if($tienePresupuesto && $totalInversion > 0)
                <div style="text-align: right; margin-top: 10px; padding: 5px 8px; background: #e6f0fa; font-weight: bold; border: 1px solid rgb(60, 60, 62); border-radius: 3px; color: rgb(60, 60, 62); font-size: 11px;">
                    TOTAL PRIMER MES: <span style="font-family: 'Courier New', monospace; font-size: 12px;">{{ $formatMoney($totalPrimerMes) }}</span>
                </div>
            @endif
        </div>

        <!-- Método de Pago -->
        @if($tieneMetodoPago)
            <div class="payment-section">
                <div class="section-title">Método de Pago y Autorización</div>
                
                <div class="payment-info">
                    <div class="payment-header">
                        <div class="payment-title">Débito automático autorizado</div>
                    </div>
                    
                    <div class="payment-details">
                        @if(!empty($contrato->debitoCbu))
                            <div class="payment-row">
                                <div class="payment-cell">
                                    <div class="payment-field">
                                        <span class="payment-label">Banco:</span>
                                        <span class="payment-value">{{ $contrato->debitoCbu->nombre_banco ?? '-' }}</span>
                                    </div>
                                </div>
                                <div class="payment-cell">
                                    <div class="payment-field">
                                        <span class="payment-label">CBU:</span>
                                        <span class="payment-value">{{ $contrato->debitoCbu->cbu ?? '-' }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="payment-row">
                                <div class="payment-cell">
                                    <div class="payment-field">
                                        <span class="payment-label">Alias:</span>
                                        <span class="payment-value">{{ $contrato->debitoCbu->alias_cbu ?? '-' }}</span>
                                    </div>
                                </div>
                                <div class="payment-cell">
                                    <div class="payment-field">
                                        <span class="payment-label">Titular:</span>
                                        <span class="payment-value">{{ $contrato->debitoCbu->titular_cuenta ?? '-' }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="payment-row">
                                <div class="payment-cell">
                                    <div class="payment-field">
                                        <span class="payment-label">Tipo cuenta:</span>
                                        <span class="payment-value">{{ ($contrato->debitoCbu->tipo_cuenta ?? '') === 'caja_ahorro' ? 'Caja de ahorro' : 'Cuenta corriente' }}</span>
                                    </div>
                                </div>
                                <div class="payment-cell">
                                </div>
                            </div>
                        @elseif(!empty($contrato->debitoTarjeta))
                            <div class="payment-row">
                                <div class="payment-cell">
                                    <div class="payment-field">
                                        <span class="payment-label">Banco:</span>
                                        <span class="payment-value">{{ $contrato->debitoTarjeta->tarjeta_banco ?? '-' }}</span>
                                    </div>
                                </div>
                                <div class="payment-cell">
                                    <div class="payment-field">
                                        <span class="payment-label">Tarjeta:</span>
                                        <span class="payment-value">{{ $contrato->debitoTarjeta->tarjeta_emisor ?? '-' }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="payment-row">
                                <div class="payment-cell">
                                    <div class="payment-field">
                                        <span class="payment-label">Número:</span>
                                        <span class="payment-value">{{ $contrato->debitoTarjeta->tarjeta_numero ?? '-' }}</span>
                                    </div>
                                </div>
                                <div class="payment-cell">
                                    <div class="payment-field">
                                        <span class="payment-label">Vencimiento:</span>
                                        <span class="payment-value">{{ $contrato->debitoTarjeta->tarjeta_expiracion ?? '-' }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="payment-row">
                                <div class="payment-cell">
                                    <div class="payment-field">
                                        <span class="payment-label">Titular:</span>
                                        <span class="payment-value">{{ $contrato->debitoTarjeta->titular_tarjeta ?? '-' }}</span>
                                    </div>
                                </div>
                                <div class="payment-cell">
                                    <div class="payment-field">
                                        <span class="payment-label">CCV:</span>
                                        <span class="payment-value">{{ $contrato->debitoTarjeta->tarjeta_ccv ?? '-' }}</span>
                                    </div>
                                </div>
                            </div>
                            <div class="payment-row">
                                <div class="payment-cell">
                                    <div class="payment-field">
                                        <span class="payment-label">Tipo:</span>
                                        <span class="payment-value">{{ ($contrato->debitoTarjeta->tipo_tarjeta ?? '') === 'debito' ? 'Débito' : 'Crédito' }}</span>
                                    </div>
                                </div>
                                <div class="payment-cell">
                                </div>
                            </div>
                        @endif
                    </div>
                    
                    @if($metodoPago)
                        <div class="authorization-box">
                            <div class="authorization-title">Declaración de Autorización</div>
                            <div class="authorization-text">
                                <p>Autorizo por la presente a que el pago correspondiente a las facturas mensuales por la contratación del servicio ofrecido por {{ $compania['nombre'] }} sean debitados en forma directa y automática en el resumen de mi {{ $metodoPago }}.</p>
                                <p>Dejo especialmente establecido que podrá dar por cumplida la presente autorización mediante la sola declaración fehaciente comunicada, sin perjuicio tal, de los importes que pudieran corresponderme en función de servicios ya recibidos con anterioridad.</p>
                                <p>La aprobación de esta solicitud será supeditada a la aceptación de la entidad emisora. Asimismo faculto a {{ $compania['nombre'] }} a presentar esta AUTORIZACIÓN donde sea requerida a efectos de cumplimentar la misma.</p>
                                <p><em>Nota: IVA (21%) no incluido.</em></p>
                            </div>
                            
                            <div class="signature-fields-three">
                                <div class="signature-row-three">
                                    <div class="signature-cell-three">
                                        <div class="signature-field">
                                            <span class="signature-label">Firma:</span>
                                            <div class="signature-line"></div>
                                        </div>
                                    </div>
                                    <div class="signature-cell-three">
                                        <div class="signature-field">
                                            <span class="signature-label">Aclaración:</span>
                                            <div class="signature-line"></div>
                                        </div>
                                    </div>
                                    <div class="signature-cell-three">
                                        <div class="signature-field">
                                            <span class="signature-label">Tipo y Nro. documento:</span>
                                            <div class="signature-line"></div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    @endif
                </div>
            </div>
        @endif

        <!-- Datos de Instalación -->
        <div class="section">
            <div class="section-title">Datos de Instalación</div>
            
            <div class="installation-line">
                <div class="installation-row">
                    <div class="installation-item">
                        <span class="installation-label">Plataforma:</span>
                        <span class="installation-value">{{ $contrato->empresa_plataforma ?? '-' }}</span>
                    </div>
                    <div class="installation-item">
                        <span class="installation-label">Nombre de flota:</span>
                        <span class="installation-value">{{ $contrato->empresa_nombre_flota ?? '-' }}</span>
                    </div>
                    <div class="installation-item">
                        <span class="installation-label">Unidades a equipar:</span>
                        <span class="installation-value">{{ $contrato->presupuesto_cantidad_vehiculos ?? 0 }} vehículos</span>
                    </div>
                </div>
            </div>
            
            @if($contrato->vehiculos && $contrato->vehiculos->count() > 0)
                <table class="vehicles-table">
                    <thead>
                        <tr>
                            <th>Patente</th>
                            <th>Modelo</th>
                            <th>Marca</th>
                            <th>Año</th>
                            <th>Color</th>
                            <th>Identificador</th>
                        </tr>
                    </thead>
                    <tbody>
                        @foreach($contrato->vehiculos as $vehiculo)
                            <tr>
                                <td>{{ $vehiculo->patente }}</td>
                                <td>{{ $vehiculo->modelo ?? '-' }}</td>
                                <td>{{ $vehiculo->marca ?? '-' }}</td>
                                <td>{{ $vehiculo->anio ?? '-' }}</td>
                                <td>{{ $vehiculo->color ?? '-' }}</td>
                                <td>{{ $vehiculo->identificador ?? '-' }}</td>
                            </tr>
                        @endforeach
                    </tbody>
                </table>
            @endif
        </div>

        <!-- Firma Final -->
        <div class="signature-section">
            <div class="section-title">Firma y Aceptación del Contrato</div>
            
            <div class="signature-fields-final">
                <div class="signature-row-final">
                    <div class="signature-cell-final">
                        <div class="signature-line-final"></div>
                        <div class="signature-label-final">Firma del Cliente</div>
                    </div>
                    <div class="signature-cell-final">
                        <div class="signature-line-final"></div>
                        <div class="signature-label-final">Aclaración de Firma</div>
                    </div>
                </div>
            </div>
        </div>
    </div>

 <!-- Condiciones del Contrato -->
<div style="page-break-before: always; margin-top: 20px;">
    <div class="section-title">CONDICIONES GENERALES DEL SERVICIO</div>
    
    <div style="font-family: Arial, sans-serif; font-size: 7pt; line-height: 1.3; text-align: justify;">
        <p style="margin-bottom: 8px;">
            <u><strong>GLOSARIO:</strong></u><br />
            <strong>a) Modem GPS:</strong> consiste en un equipo informático propiedad exclusiva de la EMPRESA que se instala en el vehículo del CLIENTE. Este equipo informático emite señales que por medio de satélites se logra determinar la ubicación geográfica del vehículo en un mapa digitalizado.<br />
            <strong>b) GPS:</strong> sistema de posicionamiento global por medio de satélites.<br />
            <strong>c) Servidor Web:</strong> Centro de Datos con acceso remoto o vía web, que permite al CLIENTE, acceder a la información sobre la ubicación del vehículo. Para el acceso del CLIENTE al SERVIDOR deberá emplear una clave personal e intransferible.<br />
            <strong>d) Licencia de uso:</strong> La EMPRESA es titular y/o licenciataria del sistema informático y software que permite: (i) captar las señales de MODEM-GPS; (ii) traducir dichas señales y diagramar la ubicación del vehículo respectivo en un mapa; (iii) acceder al CLIENTE al SERVIDOR WEB para observar en su pantalla el mapa y la ubicación del vehículo en cuestión.<br />
            <strong>e) Pantalla:</strong> Dispositivo que permite visualizar la información existente en el SERVIDOR WEB (es decir, el mapa y la ubicación del vehículo en dicho mapa, además de otros datos e información útil).<br />
            <strong>f) Servicio de Recupero:</strong> servicio prestado por fuerzas de seguridad o policiales que permiten que el vehículo que tenga el <strong>Modem GPS (VEHICULO)</strong> que haya sufrido un siniestro (robo, etc.) pueda ser efectivamente recuperado de terceros y puesto a disposición del CLIENTE. Este servicio solamente se presta cuando el VEHICULO sufre un siniestro en la zona de la Ciudad de Buenos Aires y en un radio de 80 Kms. a contar desde km cero de la República Argentina (Plaza Mariano Moreno, Ciudad de Buenos Aires).
        </p>

        <ol style="margin-left: 15px; padding-left: 0; list-style-position: outside; font-size: 7pt;">
            <li style="margin-bottom: 8px;">
                <strong>ANTECEDENTES</strong> – LA EMPRESA es una compañía que brinda a sus clientes un servicio de monitoreo y/o seguimiento de vehículos, denominado comercialmente "<strong>{{ $compania['nombre'] }}</strong>", como también el servicio de recupero del vehículo siniestrado. El servicio a prestar por la EMPRESA consiste en la instalación en el vehículo designado por el CLIENTE de un MODEM-GPS. Este MODEM GPS emite o transmite una señal (mensajes) que es captada vía GPRS por los servidores de la empresa. EL CLIENTE accederá a la información existente en el SERVIDOR WEB vía Internet mediante la utilización de una <strong>clave de acceso particular y exclusiva</strong>, la cual le será proporcionada por la EMPRESA con la firma de este contrato. El CLIENTE tendrá derecho a acceder a la información existente en el SERVIDOR WEB sobre la ubicación del vehículo, mediante la utilización de una licencia de uso propiedad de la EMPRESA, que le mostrará al CLIENTE en una pantalla de computadora o teléfono celular con dicha capacidad técnica. Ambas deberán tener acceso a Internet para acceder a la información de dichos servidores. Adicionalmente, EL CLIENTE podrá contratar el servicio de recupero del VEHÍCULO, que permite que personal de seguridad o policial recupere el VEHICULO en caso de sufrir un siniestro (ej: robo). En dicho caso el CLIENTE deberá dar aviso a la EMPRESA para que este accione las medidas de seguridad a fin de recuperar el VEHÍCULO en las condiciones que se encuentre.
            </li>

            <li style="margin-bottom: 8px;">
                <strong>COMODATO</strong> – LA EMPRESA instalará en el/los vehículo/s en carácter de comodato los equipo/s MODEM-GPS. EL CLIENTE usará de/los equipo/s propiedad de la EMPRESA, en calidad de comodatario, mientras pague el precio del servicio de Monitoreo que se pacta en el presente. Dicho equipamiento incluirá los accesorios que se detallan en el ANEXO al que se hizo referencia, el que suscrito por las partes se considerará como parte integrante de este contrato.
            </li>

            <li style="margin-bottom: 8px;">
                <strong>COSTO DE LA INSTALACION</strong> – LA EMPRESA cobrará al CLIENTE por única vez por el concepto de TASA DE CONEXIÓN de la cantidad de equipos MODEM GPS antes detallados. Dicho importe incluye la instalación de los equipos y de los accesorios contratados en este contrato en calidad de comodato.
            </li>

            <li style="margin-bottom: 8px;">
                <strong>PRECIO DEL SERVICIO</strong> – Por el total de los servicios contratados, en relación a la cantidad de equipos de MODEM-GPS instalados, EL CLIENTE deberá abonar dentro de los 15 primeros días de cada mes en carácter de pago adelantado en las oficinas de la EMPRESA. o en cualquier sistema de pago habilitado por LA EMPRESA. EL CLIENTE acepta pagar todo impuesto, tasa o cargo que cualquier ente del gobierno impusiera, como así también recibirá los beneficios o descuentos que otras compañías puedan otorgar por el hecho de recibir el servicio que por medio de este acuerdo se este contratando. Si el/los vehículo/s circulara/n fuera del país, la proporción de Km. circulados en el exterior se cobrará adicionalmente según anexo tarifas internacionales, para lo cual será necesario la previa habilitación del servicio ROAMING.
            </li>

            <li style="margin-bottom: 8px;">
                <strong>PRECIO SERVICIO DE RECUPERO</strong> – El servicio de recupero tiene un costo adicional por cada tarea de recupero que el CLIENTE active. Se deja constancia que el servicio de recupero es realizado por terceras firmas contratadas por la EMPRESA.
            </li>

            <li style="margin-bottom: 8px;">
                <strong>PRECIO – VARIACIÓN.</strong> – Durante la vigencia del contrato, la EMPRESA a su exclusivo criterio podrá modificar el precio del servicio, debiendo para ello comunicarlo al CLIENTE con una anticipación de 30 días corridos a la entrega en vigencia de la nueva tarifa. La comunicación al CLIENTE se realizará vía e-mail a la cuenta de correo electrónico que el CLIENTE indique. De no obtener objeciones por parte del CLIENTE con la nueva tarifa dentro del plazo de 15 días corridos de recibido el correo electrónico, esta se entenderá que ha sido aceptada por el CLIENTE, procediéndose en el mes respectivo a la facturación del servicio con el nuevo importe. Si el CLIENTE no aceptase la nueva tarifa, se mantendrá el servicio durante los 30 días corridos a contar a partir de la notificación con la tarifa originaria, finalizando el contrato vencido dicho plazo, sin penalidad para ninguna de las PARTES.
            </li>

            <li style="margin-bottom: 8px;">
                <strong>CONTRATACION DE NUEVAS UNIDADES Y/O SERVICIOS ADICIONALES</strong> – Durante la vigencia del presente Contrato y/o sus prórrogas el CLIENTE podrá requerir un incremento adicional de EQUIPOS. A tales efectos la EMPRESA instalará los EQUIPOS y el número de EQUIPOS instalados se indicará en la nueva factura. La falta de observación de la factura respecto de la cantidad de EQUIPOS y/o su pago implicará la conformidad del CLIENTE respecto de la cantidad de EQUIPOS instalados en sus vehículos.
            </li>

            <li style="margin-bottom: 8px;">
                <strong>INCUMPLIMIENTO</strong> – SI EL CLIENTE no abonara en tiempo su cuota u otros cargos que se puedan generar, LA EMPRESA podrá, tras enviar una advertencia de corte por escrito (incluso vía e-mail), dejar de prestar todos los servicios aquí contratados. Asimismo y dentro de la hipótesis de incumplimiento en el pago, EL CLIENTE autoriza a LA EMPRESA a retirar el equipo instalado en el vehículo y a que LA EMPRESA bloquee el MODEM GPS y el acceso WEB a "{{ $compania['nombre'] }}" para que EL CLIENTE no pueda acceder a los servicios contratados hasta que EL CLIENTE regularice el pago. El hecho de que LA EMPRESA no aplicara alguno de estos derechos, no quita a LA EMPRESA el derecho de emplearlos en cualquier momento tras una nueva notificación. LA EMPRESA tendrá el derecho de aplicar intereses moratorios de dos veces la tasa activa mensual del Banco Nación Argentina para operaciones de redescuento a 30 días sobre el importe adeudado. LA EMPRESA frente a la falta de pago y/u otro incumplimiento por parte del CLIENTE podrá resolver el presente contrato sin necesidad de intimación previa, sirviendo éste de pacto expreso, y reclamar al CLIENTE los daños y perjuicios derivados de dicho incumplimiento, así como las mensualidades que faltaren abonar correspondientes a todo el período contractual. Los gastos, tributos y honorarios que por concepto de gestiones, judiciales o extrajudiciales, se devenguen como consecuencia de las acciones que ejercitare LA EMPRESA por incumplimiento de EL CLIENTE, serán de cargo de este último.<br />
                Resuelto el contrato por cualquiera de las partes y con independencia de la causa o motivo que se invoque para ello, el CLIENTE deberá poner a disposición de la EMPRESA en el domicilio de la EMPRESA, el o todos los vehículos en forma simultánea en cuestión, a fin de que la EMPRESA extraiga en una única oportunidad el o los equipos MODEM GPS alojados en el o los vehículos. La falta a puesta a disposición del vehículo por parte del CLIENTE, dentro de los 5 días corridos de resuelto o finalizado el presente contrato o sus prórrogas, hará incurrir en mora de pleno derecho y sin necesidad de intimación alguna al CLIENTE, aplicándosele una multa de U$S5 (dólares estadounidenses cinco), por cada día de demora a favor de la EMPRESA, que se computará hasta el día de la puesta a disposición del vehículo y/o recupero judicial del mismo y/o pago del valor de reposición del equipo (U$S 250 – dólares estadounidenses doscientos cincuenta). Ello, sin perjuicio de la facultad de la EMPRESA de obtener judicialmente la restitución del equipo y/o el pago del costo de reposición por parte del CLIENTE.
            </li>

            <li style="margin-bottom: 8px;">
                <strong>PLAZO</strong> – El plazo de este contrato es de 24 meses y será automáticamente renovado por períodos anuales a menos que alguna de las partes notifique a la otra en forma escrita la no-renovación con 10 días de anticipación al vencimiento originario.
                EL CLIENTEdeclara haber leído y estar de acuerdo con las cláusulas ubicadas al frente y al dorso de este contrato. EL CLIENTE declara haber sido instruido y tener pleno conocimiento del servicio que contrata y que LA EMPRESA le ha informado acerca del alcance del servicio, sus limitaciones y sus consecuencias y/o efectos.
            </li>
        </ol>
    </div>
</div>

<!-- PRIMERA FIRMA - después de cláusula 10 (sin salto de página forzado) -->
<div style="margin-top: 30px;">
    <div class="signature-section">
        <div class="section-title">Firma y Aceptación del Contrato</div>
        <div class="signature-fields-final">
            <div class="signature-row-final">
                <div class="signature-cell-final">
                    <div class="signature-line-final"></div>
                    <div class="signature-label-final">Firma del Cliente</div>
                </div>
                <div class="signature-cell-final">
                    <div class="signature-line-final"></div>
                    <div class="signature-label-final">Aclaración de Firma</div>
                </div>
            </div>
        </div>
    </div>
</div>

<!-- Continuación de condiciones - cláusulas 11 a 22 -->
<div style="page-break-before: always; margin-top: 20px;">
    <div class="section-title">CONDICIONES GENERALES DEL SERVICIO (CONTINUACIÓN)</div>
    
    <div style="font-family: Arial, sans-serif; font-size: 7pt; line-height: 1.3; text-align: justify;">
        <ol start="11" style="margin-left: 15px; padding-left: 0; list-style-position: outside; font-size: 7pt;">
            <li style="margin-bottom: 8px;">
                <strong>RESPONSABILIDAD</strong> – El CLIENTE declara conocer que la EMPRESA no es una compañía de seguros, de vigilancia o custodia o sistema de alarma, por ende la misma no es responsable por la seguridad, vigilancia o custodia del vehículo, ni por los daños, robos, etc. que pudieran acaecer en el mismo, ni sobre sus bienes ni personas, ni sobre terceros o bienes de terceros que pudieran estar en el mismo, tanto en caso de que el sistema de rastreo haya funcionado o no. LA EMPRESA brindará los servicios aquí convenidos siendo cargo de la misma los gastos de comunicación entre el vehículo y el software servidor de la EMPRESA. EL CLIENTE deberá poseer una computadora con las exigencias mínimas requeridas para el acceso WEB "{{ $compania['nombre'] }}", como así también deberá suministrar y mantener una conexión de Internet, la cual permitirá la comunicación entre el CLIENTE (Navegador WEB instalado en la computadora del CLIENTE) y el software servidor. LA EMPRESA no será responsable en ningún caso por interrupciones temporales o permanentes o efectos en la presentación de la ubicación vehicular.<br />
                La EMPRESA no será responsable por los eventuales daños que se ocasionen con motivo o relación a las tareas del servicio de recupero que presenten terceras personas, firmas, servicios de seguridad privados o fuerzas policiales estatales. La EMPRESA se limitará a dar aviso de la alarma comunicada por el CLIENTE de la existencia de un VEHICULO siniestrado a las fuerzas de seguridad privadas (contratadas al efecto) o seguridad pública (fuerzas policiales) para que éstas tomen las medidas necesarias a fin de recuperar el VEHÍCULO por parte del CLIENTE. Serán por cuenta del CLIENTE las gestiones policiales, administrativas y judiciales que deba realizar a fin de obtener la tenencia del VEHÍCULO recuperado. El CLIENTE deberá cumplir con las denuncias policiales o judiciales que correspondan conforme los procedimientos usuales y suministrar toda la documentación necesaria que acredite la titularidad del VEHÍCULO siniestrado.
            </li>

            <li style="margin-bottom: 8px;">
                <strong>CESION DE CONTRATO</strong> – El presente contrato no podrá ser cedido ni utilizado para ningún fin comercial que no sea lo estipulado en el objeto del presente.
            </li>

            <li style="margin-bottom: 8px;">
                <strong>RECLAMOS DE UN TERCERO</strong> – EL CLIENTE exime a LA EMPRESA de toda responsabilidad por cualquier reclamación que se viera afectado por la instalación del MODEM GPS o sus accesorios y/o por los servicios contratados.
            </li>

            <li style="margin-bottom: 8px;">
                <strong>SUSPENSIÓN O CANCELACIÓN DE ESTE CONTRATO</strong> – Este acuerdo será suspendido o cancelado sin obligaciones de ninguna de las partes hacia la otra, en caso de que el lugar donde funciona el Centro de Servidores de la EMPRESA sea destruido por fuego o catástrofe o sea sustancialmente dañado que le imposibilite operar. En estas circunstancias, LA EMPRESA deberá notificárselo al CLIENTE, siempre y cuando cuente con los medios para hacerlo. También podrá ser cancelado si por razones ajenas a LA EMPRESA ésta no pudiera brindar más el servicio, como por ejemplo ante nuevas disposiciones legales, o caída del servicio de Internet o del servicio GPRS de la telefonía celular. LA EMPRESA podrá cancelar sin responsabilidad alguna este contrato si EL CLIENTE no realiza las reparaciones o no sigue las recomendaciones de mantenimiento.
            </li>

            <li style="margin-bottom: 8px;">
                <strong>PLAZO DE CONTRATACIÓN MÍNIMO</strong> – El CLIENTE podrá rescindir o finalizar anticipadamente el presente contrato sin expresión de causa transcurridos los seis (6) primeros meses de contratación, debiendo para ello comunicar fehacientemente a la EMPRESA su intención de finalizar el contrato con una anticipación de 30 días corridos, entregar a la EMPRESA el/los MODEM-GPS instalados conforme la cláusula SEGUNDA, y abonar en concepto de multa la suma equivalente a dos (2) meses de abono mensual si el contrato se cancela antes del año de vigencia y un (1) mes de abono mensual si se cancela antes de los dos (2) años de vigencia contractual. Si el CLIENTE decidiere finalizar anticipadamente el contrato antes del plazo de seis (6) meses, deberá pagar el abono mensual correspondiente a estos seis (6) meses, además de la penalidad de dos (2) meses antes establecida, aclarándose que el plazo de seis (6) meses es el plazo mínimo de duración del contrato.
            </li>

            <li style="margin-bottom: 8px;">
                <strong>COMUNICACIÓN SATELITES * MODEM-GPS * SERVIDOR {{ $compania['nombre'] }}</strong> – a) La comunicación entre los satélites que brindan el servicio GPS y el MODEM – GPS la logra el GPS incorporado en el MODEM –GPS instalado en el vehículo. Se deja constancia que puede existir un error en el cálculo de ubicación y que ésta será imposible de calcular en caso de que el vehículo no tenga visión directa a los satélites sin obstáculos ("vista al cielo sin obstáculos"), por ejemplo si está debajo de un techo, en un garaje, dentro de un contenedor etc. b) La comunicación entre el MODEM- GPS y el Servidor LocalSat, se realiza mediante el servicio GPRS brindado por las empresas de telefonía celular, limitándose el área de cobertura de este servicio al área de cobertura brindado por las compañías celulares. c) La comunicación entre el servidor LocalSat y el Navegador WEB "LocalSat" es vía Internet y será necesario que tanto el computador del CLIENTE este conectado al servicio Internet (responsabilidad del CLIENTE) como el software servidor (responsabilidad de LA EMPRESA). d) EL CLIENTE comprende que el no funcionamiento de cualquiera de las comunicaciones descriptas recientemente en este punto, ocasionará que sea imposible conocer la ubicación del vehículo. Dicha falta de funcionamiento puede deberse entre otras razones, a problemas de las empresas que brindan dichos servicios o al hecho de que los mismos hayan sido cortados, interferidos o dañados. e) EL CLIENTE ACEPTA y reconoce que el MODEM –GPS utiliza varias tecnologías de comunicación y que las mismas pueden ser afectadas por ciertas condiciones climáticas, atmosféricas o ambientales, o interferencias varias, perjudicando el servicio ya sea su continuidad, disponibilidad o alcance, generando situaciones tales como bloqueos, interrupciones o falta de cobertura, por lo que la EMPRESA no garantiza la ubicación del vehículo en todo momento.
            </li>

            <li style="margin-bottom: 8px;">
                <strong>MANTENIMIENTO DEL EQUIPO</strong> – EL CLIENTE se obliga a mantener el MODEM-GPS en correcto estado de funcionamiento siguiendo las recomendaciones que la EMPRESA le indique. Asimismo deberá cuidar el aparato que se le da en comodato como un buen hombre de negocios, debiendo restituirlo cuando el contrato llegue a su fin o cuando LA EMPRESA se lo indique. El sistema es alimentado a través de la batería del vehículo y será responsabilidad de EL CLIENTE que así sea. El costo de su reposición es por cuenta de EL CLIENTE. LA EMPRESA realizará todos los servicios necesarios para el buen funcionamiento del sistema sin costo adicional alguno, excepto aquellos que sean ajenos a problemas propios del equipo, como por ejemplo: accidentes de tránsito que generen daños al equipo, que sea mojado por el lavado incorrecto del vehículo, etc. El equipo instalado en el vehículo será mantenido técnicamente exclusivamente por LA EMPRESA. LA EMPRESA quedará libre de toda obligación de reparación de este equipo si el mismo es manipulado internamente por personas no autorizadas por LA EMPRESA. Esta garantía no incluye la reparación por daños ocasionados por mal uso del equipo.
            </li>

            <li style="margin-bottom: 8px;">
                <strong>INTERRUPCIÓN DEL SERVICIO</strong> – LA EMPRESA no será responsable por la demora en la conexión del servicio o en la continuidad del mismo cuando sea por causas ajenas a su control como ser incendio, inundación, catástrofe, atentado, huelga, motín, falta de servicio telefónica o eléctrico, servicio de telefonía celular, servicio de Internet o servicio de GPS, etc. y no tiene la obligación de sustituir el servicio cuando cualquiera de estas situaciones suceda. LA EMPRESA tendrá un plazo de 20 días para volver a brindar los servicios, en caso de no poder cumplir, EL CLIENTE podrá suspender este contrato sin tener que abonar importe alguno a LA EMPRESA.
            </li>

            <li style="margin-bottom: 8px;">
                <strong>FALTA DE RESTITUCIÓN DEL EQUIPO MODEM - GPS</strong> – a) EL CLIENTE es responsable por devolver a LA EMPRESA el equipo en las mismas condiciones que se le fue instalado, y en caso de no hacerlo, LA EMPRESA tendrá derecho a solicitar al CLIENTE el pago del mismo. EL CLIENTE es responsable de la restitución del equipo MODEM – GPS aún en caso de robo, hurto o accidente. LA EMPRESA pone en conocimiento mediante éste que el costo estimado del equipo MODEM – GPS es de aproximadamente U$S 250 por cada equipo, importe que deberá abonar el CLIENTE a la EMPRESA en el supuesto caso que no restituya el equipo MODEM –GPS. b) En caso de robo o accidente de tránsito, EL CLIENTE se obliga a comunicar el hecho a LA EMPRESA, todo dentro de un plazo máximo de 48 horas. La desinstalación del EQUIPO, cuando esta sea motivada por la finalización del contrato, NO tendrá costo DE DESINSTALACIÓN para el CLIENTE, siempre que se realice en el domicilio de la EMPRESA. Si por pedido del CLIENTE éste desea que la desinstalación se realice en su domicilio, la EMPRESA realizará un presupuesto de desinstalación de los EQUIPOS a cargo exclusivo del CLIENTE y que deberá ser abonado previa a la desinstalación. El "costo de desinstalación" es independiente de las indemnizaciones o multas por baja anticipada y/o restitución tardía o costo de reposición de los EQUIPOS no restituidos.
            </li>

            <li style="margin-bottom: 8px;">
                <strong>SERVICIOS ADICIONALES</strong> – EL CLIENTE podrá contratar a LA EMPRESA servicios adicionales por lo cual pueden existir otros contratos paralelos a éste, los cuales no alteran ni modifican las cláusulas previstas en el presente.
            </li>

            <li style="margin-bottom: 8px;">
                <strong>LEY APLICABLE Y JURIDICCION</strong> – Este contrato se regirá e interpretará conforme a las leyes de la República Argentina. Las partes convienen y aceptan que todas las disputas y conflictos a que de lugar la aplicación, ejecución, interpretación, o cualquier otra cuestión relacionada con el presente contrato se sustanciarán ante los jueces de la ciudad de Buenos Aires. El CLIENTE renuncia a la facultad de recusar sin causa a los eventuales magistrados que entiendan en la controversia.
            </li>

            <li style="margin-bottom: 8px;">
                <strong>DOMICILIOS</strong> – Las partes fijan domicilios especiales a todos los efectos judiciales o extrajudiciales a que de lugar este contrato en los indicados en la comparecencia. Para que la modificación de domicilio surta efecto, deberá ser notificada en forma fehaciente y por escrito a la contraparte.
            </li>
        </ol>

        <p style="margin-top: 15px; margin-bottom: 10px; text-align: center;">
            <strong>En prueba de conformidad, se suscribe el presente, recibiendo el CLIENTE copia del mismo.</strong>
        </p>
    </div>
</div>

<!-- SEGUNDA FIRMA - final después de todas las condiciones -->
<div style="margin-top: 30px;">
    <div class="signature-section">
        <div class="section-title">Firma y Aceptación del Contrato</div>
        <div class="signature-fields-final">
            <div class="signature-row-final">
                <div class="signature-cell-final">
                    <div class="signature-line-final"></div>
                    <div class="signature-label-final">Firma del Cliente</div>
                </div>
                <div class="signature-cell-final">
                    <div class="signature-line-final"></div>
                    <div class="signature-label-final">Aclaración de Firma</div>
                </div>
            </div>
        </div>
    </div>
</div>

</body>
</html>