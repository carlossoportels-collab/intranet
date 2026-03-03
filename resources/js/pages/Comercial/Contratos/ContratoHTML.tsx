// resources/js/Pages/Comercial/Contratos/ContratoHTML.tsx
import React from 'react';

interface Props {
    contrato: any;
    compania: {
        id: number;
        nombre: string;
        logo: string;
    };
}

export default function ContratoHTML({ contrato, compania }: Props) {
    const formatMoney = (value: any) => {
        if (!value && value !== 0) return '-';
        return '$ ' + Number(value).toFixed(2).replace('.', ',').replace(/\B(?=(\d{3})+(?!\d))/g, '.');
    };

    // Verificar si el contrato tiene presupuesto (viene de cambio de razón social o de presupuesto)
    const tienePresupuesto = !!contrato.presupuesto;
    
    // Determinar el método de pago para el texto de autorización
    const getMetodoPagoTexto = () => {
        if (contrato.debito_cbu) return "CBU";
        if (contrato.debito_tarjeta) return "TARJETA DE CRÉDITO/DÉBITO";
        return null;
    };

    // Función para enmascarar número de tarjeta
    const enmascararTarjeta = (numero: string) => {
        if (!numero) return '';
        const ultimos4 = numero.slice(-4);
        return `**** **** **** ${ultimos4}`;
    };

    const metodoPago = getMetodoPagoTexto();
    const tieneMetodoPago = !!(contrato.debito_cbu || contrato.debito_tarjeta);

    // Calcular totales para contratos sin presupuesto (desde cambio de razón social)
    const calcularTotales = () => {
        if (tienePresupuesto) {
            return {
                inversionInicial: 0,
                costoMensual: Number(contrato.presupuesto_total_mensual) || 0,
                totalPrimerMes: Number(contrato.presupuesto_total_mensual) || 0
            };
        } else {
            // Para contratos desde cambio de razón social, usamos el total_mensual_abonos
            const costoMensual = Number(contrato.presupuesto_total_mensual) || 0;
            return {
                inversionInicial: 0,
                costoMensual: costoMensual,
                totalPrimerMes: costoMensual // No hay inversión inicial
            };
        }
    };

    const totales = calcularTotales();

    // Estilos con tipos correctos para React
    const styles = {
        container: {
            maxWidth: '1200px',
            margin: '0 auto',
            background: 'white',
            padding: '5px 10px',
            fontFamily: "'Segoe UI', 'Helvetica Neue', Arial, sans-serif",
            color: '#333',
            lineHeight: 1.25,
            fontSize: '10px'
        } as React.CSSProperties,
        
        header: {
            padding: '5px 0 8px 0',
            borderBottom: '2px solid rgb(60, 60, 62)',
            marginBottom: '6px'
        } as React.CSSProperties,
        
        headerGrid: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '10px',
            alignItems: 'center',
            marginBottom: '4px'
        } as React.CSSProperties,
        
        leftColumn: {
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start'
        } as React.CSSProperties,
        
        centerColumn: {
            textAlign: 'center'
        } as React.CSSProperties,
        
        rightColumn: {
            textAlign: 'right'
        } as React.CSSProperties,
        
        companyLogo: {
            fontSize: '16px',
            fontWeight: 800,
            letterSpacing: '-0.5px',
            marginBottom: '2px'
        } as React.CSSProperties,
        
        local: {
            color: 'rgb(60, 60, 62)'
        } as React.CSSProperties,
        
        sat: {
            color: 'rgb(247, 98, 0)'
        } as React.CSSProperties,
        
        companyInfo: {
            fontSize: '8.5px',
            color: '#555',
            lineHeight: 1.3,
            marginTop: '2px'
        } as React.CSSProperties,
        
        contractTitle: {
            fontSize: '14px',
            fontWeight: 600,
            color: 'rgb(60, 60, 62)',
            marginBottom: '1px'
        } as React.CSSProperties,
        
        contractSubtitle: {
            fontSize: '8px',
            color: '#666',
            marginBottom: '4px'
        } as React.CSSProperties,
        
        contractDetails: {
            fontSize: '8px',
            display: 'flex',
            flexDirection: 'column',
            gap: '2px'
        } as React.CSSProperties,
        
        detailItem: {
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: '5px'
        } as React.CSSProperties,
        
        detailLabel: {
            fontWeight: 600,
            color: 'rgb(60, 60, 62)',
            width: '50px',
            textAlign: 'left'
        } as React.CSSProperties,
        
        detailValue: {
            fontWeight: 'normal',
            color: '#333',
            minWidth: '80px',
            textAlign: 'left'
        } as React.CSSProperties,
        
        section: {
            marginBottom: '6px',
            padding: '0 2px'
        } as React.CSSProperties,
        
        sectionTitle: {
            color: 'rgb(60, 60, 62)',
            fontSize: '11px',
            fontWeight: 600,
            marginBottom: '5px',
            paddingBottom: '2px',
            borderBottom: '1px solid rgb(247, 98, 0)'
        } as React.CSSProperties,
        
        dataGrid: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '4px',
            marginBottom: '6px'
        } as React.CSSProperties,
        
        dataRow: {
            display: 'flex',
            alignItems: 'center',
            minHeight: '18px'
        } as React.CSSProperties,
        
        dataLabel: {
            fontWeight: 600,
            color: 'rgb(60, 60, 62)',
            fontSize: '9px',
            minWidth: '100px',
            whiteSpace: 'nowrap'
        } as React.CSSProperties,
        
        dataValue: {
            flex: 1,
            padding: '3px 5px',
            background: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: '2px',
            fontSize: '9px'
        } as React.CSSProperties,
        
        fiscalSection: {
            marginTop: '6px',
            paddingTop: '5px',
            borderTop: '1px dashed #ddd'
        } as React.CSSProperties,
        
        tablesContainer: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '8px',
            marginBottom: '6px'
        } as React.CSSProperties,
        
        tableHeader: {
            fontWeight: 'bold',
            color: 'rgb(60, 60, 62)',
            fontSize: '10px',
            marginBottom: '2px'
        } as React.CSSProperties,
        
        serviceTable: {
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '8.5px'
        } as React.CSSProperties,
        
        serviceTableTh: {
            background: 'rgb(60, 60, 62)',
            color: 'white',
            padding: '4px',
            textAlign: 'left',
            fontWeight: 600,
            fontSize: '8.5px',
            border: 'none'
        } as React.CSSProperties,
        
        serviceTableTd: {
            padding: '3px 4px',
            borderBottom: '1px solid #eee'
        } as React.CSSProperties,
        
        number: {
            textAlign: 'right',
            fontFamily: "'Courier New', monospace",
            whiteSpace: 'nowrap',
            fontSize: '8.5px'
        } as React.CSSProperties,
        
        totalRow: {
            background: '#fff3e0',
            fontWeight: 'bold',
            borderTop: '1px solid rgb(247, 98, 0)',
            color: 'rgb(60, 60, 62)',
            fontSize: '9px'
        } as React.CSSProperties,
        
        paymentSection: {
            marginBottom: '6px'
        } as React.CSSProperties,
        
        paymentInfo: {
            background: '#f8f9fa',
            padding: '6px',
            borderRadius: '3px',
            border: '1px solid #e9ecef'
        } as React.CSSProperties,
        
        paymentHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '5px',
            paddingBottom: '3px',
            borderBottom: '1px solid #ddd'
        } as React.CSSProperties,
        
        paymentTitle: {
            fontWeight: 600,
            color: 'rgb(60, 60, 62)',
            fontSize: '10px'
        } as React.CSSProperties,
        
        paymentStatus: {
            fontSize: '8px',
            color: 'rgb(247, 98, 0)',
            fontWeight: 600
        } as React.CSSProperties,
        
        paymentDetails: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '5px',
            marginBottom: '8px'
        } as React.CSSProperties,
        
        paymentField: {
            display: 'flex',
            flexDirection: 'column',
            gap: '1px'
        } as React.CSSProperties,
        
        paymentLabel: {
            fontWeight: 600,
            color: 'rgb(60, 60, 62)',
            fontSize: '8.5px'
        } as React.CSSProperties,
        
        paymentValue: {
            fontSize: '9px',
            padding: '3px 4px',
            background: 'white',
            border: '1px solid #e9ecef',
            borderRadius: '2px'
        } as React.CSSProperties,
        
        authorizationBox: {
            marginTop: '6px',
            padding: '6px',
            background: 'white',
            border: '1px solid #ddd',
            borderRadius: '2px'
        } as React.CSSProperties,
        
        authorizationTitle: {
            fontWeight: 600,
            color: 'rgb(60, 60, 62)',
            fontSize: '10px',
            marginBottom: '4px'
        } as React.CSSProperties,
        
        authorizationText: {
            fontSize: '8px',
            color: '#555',
            lineHeight: 1.2,
            marginBottom: '8px'
        } as React.CSSProperties,
        
        signatureFieldsThree: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: '8px',
            fontSize: '8px'
        } as React.CSSProperties,
        
        signatureField: {
            display: 'flex',
            flexDirection: 'column',
            gap: '1px'
        } as React.CSSProperties,
        
        signatureLabel: {
            fontWeight: 600,
            color: 'rgb(60, 60, 62)',
            fontSize: '7.5px'
        } as React.CSSProperties,
        
        signatureLine: {
            borderBottom: '1px solid #333',
            height: '15px',
            marginTop: '1px'
        } as React.CSSProperties,
        
        installationLine: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '6px',
            padding: '5px 8px',
            background: '#f8f9fa',
            border: '1px solid #e9ecef',
            borderRadius: '2px'
        } as React.CSSProperties,
        
        installationItem: {
            display: 'flex',
            alignItems: 'center',
            gap: '5px',
            flex: 1,
            justifyContent: 'center'
        } as React.CSSProperties,
        
        installationLabel: {
            fontWeight: 600,
            color: 'rgb(60, 60, 62)',
            fontSize: '9px',
            whiteSpace: 'nowrap'
        } as React.CSSProperties,
        
        installationValue: {
            fontSize: '9px',
            whiteSpace: 'nowrap'
        } as React.CSSProperties,
        
        vehiclesTable: {
            width: '100%',
            borderCollapse: 'collapse',
            fontSize: '9px'
        } as React.CSSProperties,
        
        vehiclesTableTh: {
            background: 'rgb(60, 60, 62)',
            color: 'white',
            padding: '4px',
            textAlign: 'left',
            fontWeight: 600,
            fontSize: '9px'
        } as React.CSSProperties,
        
        vehiclesTableTd: {
            padding: '3px 4px',
            borderBottom: '1px solid #eee',
            fontSize: '9px'
        } as React.CSSProperties,
        
        signatureSection: {
            marginTop: '15px',
            paddingTop: '10px',
            borderTop: '1px solid #e0e0e0'
        } as React.CSSProperties,
        
        signatureFieldsFinal: {
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: '20px',
            marginTop: '15px'
        } as React.CSSProperties,
        
        signatureFieldFinal: {
            textAlign: 'center'
        } as React.CSSProperties,
        
        signatureLineFinal: {
            borderBottom: '1px solid #333',
            height: '25px',
            marginTop: '8px',
            width: '100%'
        } as React.CSSProperties,
        
        signatureLabelFinal: {
            fontSize: '8px',
            color: '#666',
            marginTop: '3px'
        } as React.CSSProperties
    };

    return (
        <div style={styles.container}>
            {/* Header en 3 columnas */}
            <div style={styles.header}>
                <div style={styles.headerGrid}>
                    {/* Columna izquierda - Logo y sello */}
                    <div style={styles.leftColumn}>
                        {compania.logo ? (
                            <img 
                                src={compania.logo} 
                                alt={compania.nombre}
                                style={{ height: '35px', marginBottom: '2px' }}
                            />
                        ) : (
                            <div style={styles.companyLogo}>
                                {compania.nombre.includes('SAT') ? (
                                    <>
                                        <span style={styles.local}>{compania.nombre.split('SAT')[0]}</span>
                                        <span style={styles.sat}>SAT</span>
                                    </>
                                ) : (
                                    <span style={styles.local}>{compania.nombre}</span>
                                )}
                            </div>
                        )}
                        
                        <div style={styles.companyInfo}>
                            <strong>LogSat S.A.</strong><br />
                            Av. Alvear 1881 piso 7 depto. E, Ciudad Autónoma<br />
                            de Buenos Aires (1129) - Tel: 0810 888 8205<br />
                            email: info@{compania.nombre.toLowerCase().replace(' ', '')}.com.ar - www.{compania.nombre.toLowerCase().replace(' ', '')}.com.ar<br />
                            CUIT: 30-71168696-3
                        </div>
                    </div>
                    
                    {/* Columna central - Título */}
                    <div style={styles.centerColumn}>
                        <div style={styles.contractTitle}>CONTRATO DE SERVICIO</div>
                        <div style={styles.contractSubtitle}>Sistema de Rastreo Satelital</div>
                    </div>
                    
                    {/* Columna derecha - Fecha, Contrato, Vendedor */}
                    <div style={styles.rightColumn}>
                        <div style={styles.contractDetails}>
                            <div style={styles.detailItem}>
                                <span style={styles.detailLabel}>Fecha:</span>
                                <span style={styles.detailValue}>{new Date(contrato.fecha_emision).toLocaleDateString('es-AR')}</span>
                            </div>
                            <div style={styles.detailItem}>
                                <span style={styles.detailLabel}>Contrato:</span>
                                <span style={styles.detailValue}>{contrato.id}</span>
                            </div>
                            <div style={styles.detailItem}>
                                <span style={styles.detailLabel}>Vendedor:</span>
                                <span style={styles.detailValue}>{contrato.vendedor_nombre?.split(' ')[0] || 'G. MOYANO'}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Datos del Cliente */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>Datos del Cliente</div>
                
                <div style={styles.dataGrid}>
                    <div style={styles.dataRow}>
                        <span style={styles.dataLabel}>Nombre completo:</span>
                        <span style={styles.dataValue}>{contrato.cliente_nombre_completo}</span>
                    </div>
                    <div style={styles.dataRow}>
                        <span style={styles.dataLabel}>DNI:</span>
                        <span style={styles.dataValue}>{contrato.contacto_nro_documento || '-'}</span>
                    </div>
                    <div style={styles.dataRow}>
                        <span style={styles.dataLabel}>Teléfono:</span>
                        <span style={styles.dataValue}>{contrato.cliente_telefono || '-'}</span>
                    </div>
                    <div style={styles.dataRow}>
                        <span style={styles.dataLabel}>Email:</span>
                        <span style={styles.dataValue}>{contrato.cliente_email || '-'}</span>
                    </div>
                    <div style={styles.dataRow}>
                        <span style={styles.dataLabel}>Domicilio:</span>
                        <span style={styles.dataValue}>{contrato.contacto_direccion_personal || '-'}</span>
                    </div>
                    <div style={styles.dataRow}>
                        <span style={styles.dataLabel}>Localidad:</span>
                        <span style={styles.dataValue}>
                            {contrato.cliente_localidad || ''}{contrato.cliente_provincia ? `, ${contrato.cliente_provincia}` : ''}
                        </span>
                    </div>
                </div>
                
                {/* Datos Fiscales y Responsables */}
                <div style={styles.fiscalSection}>
                    <div style={styles.sectionTitle}>Datos Fiscales y Responsables</div>
                    
                    <div style={styles.dataGrid}>
                        <div style={styles.dataRow}>
                            <span style={styles.dataLabel}>Razón social:</span>
                            <span style={styles.dataValue}>{contrato.empresa_razon_social}</span>
                        </div>
                        <div style={styles.dataRow}>
                            <span style={styles.dataLabel}>CUIT:</span>
                            <span style={styles.dataValue}>{contrato.empresa_cuit}</span>
                        </div>
                        <div style={styles.dataRow}>
                            <span style={styles.dataLabel}>Domicilio fiscal:</span>
                            <span style={styles.dataValue}>{contrato.empresa_domicilio_fiscal || '-'}</span>
                        </div>
                        <div style={styles.dataRow}>
                            <span style={styles.dataLabel}>Actividad:</span>
                            <span style={styles.dataValue}>{contrato.empresa_actividad || '-'}</span>
                        </div>
                        <div style={styles.dataRow}>
                            <span style={styles.dataLabel}>Situación AFIP:</span>
                            <span style={styles.dataValue}>{contrato.empresa_situacion_afip || '-'}</span>
                        </div>
                        <div style={styles.dataRow}>
                            <span style={styles.dataLabel}>Email empresa:</span>
                            <span style={styles.dataValue}>{contrato.empresa_email_fiscal || '-'}</span>
                        </div>
                        <div style={styles.dataRow}>
                            <span style={styles.dataLabel}>Responsable flota:</span>
                            <span style={styles.dataValue}>
                                {contrato.responsable_flota_nombre || '-'}
                                {contrato.responsable_flota_telefono ? ` - ${contrato.responsable_flota_telefono}` : ''}
                                {contrato.responsable_flota_email ? ` - ${contrato.responsable_flota_email}` : ''}
                            </span>
                        </div>
                        <div style={styles.dataRow}>
                            <span style={styles.dataLabel}>Responsable pagos:</span>
                            <span style={styles.dataValue}>
                                {contrato.responsable_pagos_nombre || '-'}
                                {contrato.responsable_pagos_telefono ? ` - ${contrato.responsable_pagos_telefono}` : ''}
                                {contrato.responsable_pagos_email ? ` - ${contrato.responsable_pagos_email}` : ''}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {/* Servicios Contratados - Condicional según tipo de contrato */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>Servicios Contratados</div>
                
                {tienePresupuesto ? (
                    // Vista para contratos con presupuesto (original)
                    <>
                        <div style={styles.tablesContainer}>
                            {/* Inversión Inicial */}
                            <div>
                                <div style={styles.tableHeader}>INVERSIÓN INICIAL</div>
                                <table style={styles.serviceTable}>
                                    <thead>
                                        <tr>
                                            <th style={styles.serviceTableTh}>Descripción</th>
                                            <th style={styles.serviceTableTh}>Cant.</th>
                                            <th style={styles.serviceTableTh}>P.Unit.</th>
                                            <th style={styles.serviceTableTh}>Desc.</th>
                                            <th style={styles.serviceTableTh}>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Tasa de instalación */}
                                        {contrato.presupuesto?.tasa && (
                                            <>
                                                <tr>
                                                    <td colSpan={5} style={{ background: '#f2f2f2', fontWeight: 'bold', color: 'rgb(60,60,62)', fontSize: '9px', padding: '3px 4px' }}>
                                                        SERVICIOS DE INSTALACIÓN
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style={styles.serviceTableTd}>{contrato.presupuesto.tasa.nombre}</td>
                                                    <td style={styles.serviceTableTd}>{contrato.presupuesto_cantidad_vehiculos}</td>
                                                    <td style={styles.serviceTableTd}>{formatMoney(contrato.presupuesto.valor_tasa)}</td>
                                                    <td style={styles.serviceTableTd}>
                                                        {(() => {
                                                            const productoPromo = contrato.presupuesto.promocion?.productos?.find(
                                                                (p: any) => p.producto_servicio_id === contrato.presupuesto.tasa.id
                                                            );
                                                            
                                                            if (productoPromo) {
                                                                if (productoPromo.tipo_promocion === '2x1') return '2x1';
                                                                if (productoPromo.tipo_promocion === '3x2') return '3x2';
                                                                if (productoPromo.tipo_promocion === 'porcentaje') {
                                                                    return `${productoPromo.bonificacion || contrato.presupuesto.tasa_bonificacion}%`;
                                                                }
                                                            }
                                                            
                                                            if (contrato.presupuesto.tasa_bonificacion > 0) {
                                                                return `${contrato.presupuesto.tasa_bonificacion}%`;
                                                            }
                                                            
                                                            return '-';
                                                        })()}
                                                    </td>
                                                    <td style={{ ...styles.serviceTableTd, ...styles.number }}>{formatMoney(contrato.presupuesto.subtotal_tasa)}</td>
                                                </tr>
                                            </>
                                        )}

                                        {/* Accesorios */}
                                        {contrato.presupuesto?.agregados?.filter((a: any) => {
                                            const tipoId = a.producto_servicio?.tipo?.id;
                                            return tipoId === 5;
                                        }).length > 0 && (
                                            <>
                                                <tr>
                                                    <td colSpan={5} style={{ background: '#f2f2f2', fontWeight: 'bold', color: 'rgb(60,60,62)', fontSize: '9px', padding: '3px 4px' }}>
                                                        ACCESORIOS
                                                    </td>
                                                </tr>
                                                {contrato.presupuesto.agregados
                                                    .filter((a: any) => a.producto_servicio?.tipo?.id === 5)
                                                    .map((item: any, index: number) => {
                                                        const productoPromo = contrato.presupuesto.promocion?.productos?.find(
                                                            (p: any) => p.producto_servicio_id === item.prd_servicio_id
                                                        );
                                                        
                                                        let descuentoTexto = '-';
                                                        
                                                        if (productoPromo) {
                                                            if (productoPromo.tipo_promocion === '2x1') descuentoTexto = '2x1';
                                                            else if (productoPromo.tipo_promocion === '3x2') descuentoTexto = '3x2';
                                                            else if (productoPromo.tipo_promocion === 'porcentaje') {
                                                                descuentoTexto = `${productoPromo.bonificacion || item.bonificacion}%`;
                                                            }
                                                        } else if (item.bonificacion > 0) {
                                                            descuentoTexto = `${item.bonificacion}%`;
                                                        }
                                                        
                                                        return (
                                                            <tr key={`acc-${index}`}>
                                                                <td style={styles.serviceTableTd}>{item.producto_servicio?.nombre}</td>
                                                                <td style={styles.serviceTableTd}>{item.cantidad}</td>
                                                                <td style={styles.serviceTableTd}>{formatMoney(item.valor)}</td>
                                                                <td style={styles.serviceTableTd}>{descuentoTexto}</td>
                                                                <td style={{ ...styles.serviceTableTd, ...styles.number }}>{formatMoney(item.subtotal)}</td>
                                                            </tr>
                                                        );
                                                    })}
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Costo Mensual */}
                            <div>
                                <div style={styles.tableHeader}>COSTO MENSUAL</div>
                                <table style={styles.serviceTable}>
                                    <thead>
                                        <tr>
                                            <th style={styles.serviceTableTh}>Descripción</th>
                                            <th style={styles.serviceTableTh}>Cant.</th>
                                            <th style={styles.serviceTableTh}>P.Unit.</th>
                                            <th style={styles.serviceTableTh}>Desc.</th>
                                            <th style={styles.serviceTableTh}>Subtotal</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {/* Abono base */}
                                        {contrato.presupuesto?.abono && (
                                            <>
                                                <tr>
                                                    <td colSpan={5} style={{ background: '#f2f2f2', fontWeight: 'bold', color: 'rgb(60,60,62)', fontSize: '9px', padding: '3px 4px' }}>
                                                        ABONO BASE
                                                    </td>
                                                </tr>
                                                <tr>
                                                    <td style={styles.serviceTableTd}>{contrato.presupuesto.abono.nombre}</td>
                                                    <td style={styles.serviceTableTd}>{contrato.presupuesto_cantidad_vehiculos}</td>
                                                    <td style={styles.serviceTableTd}>{formatMoney(contrato.presupuesto.valor_abono)}</td>
                                                    <td style={styles.serviceTableTd}>
                                                        {(() => {
                                                            const productoPromo = contrato.presupuesto.promocion?.productos?.find(
                                                                (p: any) => p.producto_servicio_id === contrato.presupuesto.abono.id
                                                            );
                                                            
                                                            if (productoPromo) {
                                                                if (productoPromo.tipo_promocion === '2x1') return '2x1';
                                                                if (productoPromo.tipo_promocion === '3x2') return '3x2';
                                                                if (productoPromo.tipo_promocion === 'porcentaje') {
                                                                    return `${productoPromo.bonificacion || contrato.presupuesto.abono_bonificacion}%`;
                                                                }
                                                            }
                                                            
                                                            if (contrato.presupuesto.abono_bonificacion > 0) {
                                                                return `${contrato.presupuesto.abono_bonificacion}%`;
                                                            }
                                                            
                                                            return '-';
                                                        })()}
                                                    </td>
                                                    <td style={{ ...styles.serviceTableTd, ...styles.number }}>{formatMoney(contrato.presupuesto.subtotal_abono)}</td>
                                                </tr>
                                            </>
                                        )}

                                        {/* Servicios */}
                                        {contrato.presupuesto?.agregados?.filter((a: any) => {
                                            const tipoId = a.producto_servicio?.tipo?.id;
                                            return tipoId === 3;
                                        }).length > 0 && (
                                            <>
                                                <tr>
                                                    <td colSpan={5} style={{ background: '#f2f2f2', fontWeight: 'bold', color: 'rgb(60,60,62)', fontSize: '9px', padding: '3px 4px' }}>
                                                        SERVICIOS ADICIONALES
                                                    </td>
                                                </tr>
                                                {contrato.presupuesto.agregados
                                                    .filter((a: any) => a.producto_servicio?.tipo?.id === 3)
                                                    .map((item: any, index: number) => {
                                                        const productoPromo = contrato.presupuesto.promocion?.productos?.find(
                                                            (p: any) => p.producto_servicio_id === item.prd_servicio_id
                                                        );
                                                        
                                                        let descuentoTexto = '-';
                                                        
                                                        if (productoPromo) {
                                                            if (productoPromo.tipo_promocion === '2x1') descuentoTexto = '2x1';
                                                            else if (productoPromo.tipo_promocion === '3x2') descuentoTexto = '3x2';
                                                            else if (productoPromo.tipo_promocion === 'porcentaje') {
                                                                descuentoTexto = `${productoPromo.bonificacion || item.bonificacion}%`;
                                                            }
                                                        } else if (item.bonificacion > 0) {
                                                            descuentoTexto = `${item.bonificacion}%`;
                                                        }
                                                        
                                                        return (
                                                            <tr key={`serv-${index}`}>
                                                                <td style={styles.serviceTableTd}>{item.producto_servicio?.nombre}</td>
                                                                <td style={styles.serviceTableTd}>{item.cantidad}</td>
                                                                <td style={styles.serviceTableTd}>{formatMoney(item.valor)}</td>
                                                                <td style={styles.serviceTableTd}>{descuentoTexto}</td>
                                                                <td style={{ ...styles.serviceTableTd, ...styles.number }}>{formatMoney(item.subtotal)}</td>
                                                            </tr>
                                                        );
                                                    })}
                                            </>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>

                        {/* Total Inversión Inicial */}
                        {(() => {
                            let totalInversion = 0;
                            if (contrato.presupuesto) {
                                totalInversion += Number(contrato.presupuesto.subtotal_tasa) || 0;
                                if (contrato.presupuesto.agregados && contrato.presupuesto.agregados.length > 0) {
                                    contrato.presupuesto.agregados.forEach((item: any) => {
                                        if (item.producto_servicio?.tipo?.id === 5) {
                                            totalInversion += Number(item.subtotal) || 0;
                                        }
                                    });
                                }
                            }
                            return totalInversion > 0 ? (
                                <div style={{ textAlign: 'right', marginTop: '5px', padding: '3px 4px', background: '#fff3e0', fontWeight: 'bold', borderTop: '1px solid rgb(247, 98, 0)', color: 'rgb(60, 60, 62)', fontSize: '9px' }}>
                                    Inversión Inicial: <span style={{ fontFamily: "'Courier New', monospace" }}>{formatMoney(totalInversion)}</span>
                                </div>
                            ) : null;
                        })()}

                        {/* Total Costo Mensual */}
                        {(() => {
                            let costoMensual = 0;
                            if (contrato.presupuesto) {
                                costoMensual += Number(contrato.presupuesto.subtotal_abono) || 0;
                                if (contrato.presupuesto.agregados && contrato.presupuesto.agregados.length > 0) {
                                    contrato.presupuesto.agregados.forEach((item: any) => {
                                        if (item.producto_servicio?.tipo?.id === 3) {
                                            costoMensual += Number(item.subtotal) || 0;
                                        }
                                    });
                                }
                            }
                            return costoMensual > 0 ? (
                                <div style={{ textAlign: 'right', marginTop: '5px', padding: '3px 4px', background: '#fff3e0', fontWeight: 'bold', borderTop: '1px solid rgb(247, 98, 0)', color: 'rgb(60, 60, 62)', fontSize: '9px' }}>
                                    Costo Mensual: <span style={{ fontFamily: "'Courier New', monospace" }}>{formatMoney(costoMensual)}</span>
                                </div>
                            ) : null;
                        })()}
                    </>
                ) : (
                    // Vista simplificada para contratos sin presupuesto (cambio de razón social)
                    <div style={{ padding: '10px', background: '#f8f9fa', border: '1px solid #e9ecef', borderRadius: '3px' }}>
                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                            <div>
                                <div style={styles.tableHeader}>COSTO MENSUAL</div>
                                <div style={{ marginTop: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', padding: '5px 0', borderBottom: '1px solid #eee' }}>
                                        <span>Abonos de la flota ({contrato.presupuesto_cantidad_vehiculos || 0} vehículos)</span>
                                        <span style={{ fontFamily: "'Courier New', monospace", fontWeight: 'bold' }}>{formatMoney(totales.costoMensual)}</span>
                                    </div>
                                </div>
                            </div>
                            <div>
                                <div style={styles.tableHeader}>TOTAL</div>
                                <div style={{ marginTop: '10px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', background: '#fff3e0', fontWeight: 'bold', border: '1px solid rgb(247, 98, 0)', borderRadius: '3px', padding: '5px 8px' }}>
                                        <span>Costo mensual total:</span>
                                        <span style={{ fontFamily: "'Courier New', monospace" }}>{formatMoney(totales.costoMensual)}</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Método de Pago - Solo se muestra si hay método de pago registrado */}
            {tieneMetodoPago && (
                <div style={styles.paymentSection}>
                    <div style={styles.sectionTitle}>Método de Pago y Autorización</div>
                    
                    <div style={styles.paymentInfo}>
                        <div style={styles.paymentHeader}>
                            <div style={styles.paymentTitle}>Débito automático autorizado</div>
                            <div style={styles.paymentStatus}>✓ Activo</div>
                        </div>
                        
                        <div style={styles.paymentDetails}>
                            {contrato.debito_cbu ? (
                                // Datos de CBU
                                <>
                                    <div style={styles.paymentField}>
                                        <span style={styles.paymentLabel}>Banco:</span>
                                        <span style={styles.paymentValue}>{contrato.debito_cbu.nombre_banco}</span>
                                    </div>
                                    <div style={styles.paymentField}>
                                        <span style={styles.paymentLabel}>CBU:</span>
                                        <span style={styles.paymentValue}>{contrato.debito_cbu.cbu}</span>
                                    </div>
                                    <div style={styles.paymentField}>
                                        <span style={styles.paymentLabel}>Alias:</span>
                                        <span style={styles.paymentValue}>{contrato.debito_cbu.alias_cbu || '-'}</span>
                                    </div>
                                    <div style={styles.paymentField}>
                                        <span style={styles.paymentLabel}>Titular:</span>
                                        <span style={styles.paymentValue}>{contrato.debito_cbu.titular_cuenta}</span>
                                    </div>
                                    <div style={styles.paymentField}>
                                        <span style={styles.paymentLabel}>Tipo cuenta:</span>
                                        <span style={styles.paymentValue}>
                                            {contrato.debito_cbu.tipo_cuenta === 'caja_ahorro' ? 'Caja de ahorro' : 'Cuenta corriente'}
                                        </span>
                                    </div>
                                </>
                            ) : contrato.debito_tarjeta ? (
                                // Datos de Tarjeta
                                <>
                                    <div style={styles.paymentField}>
                                        <span style={styles.paymentLabel}>Banco:</span>
                                        <span style={styles.paymentValue}>{contrato.debito_tarjeta.tarjeta_banco}</span>
                                    </div>
                                    <div style={styles.paymentField}>
                                        <span style={styles.paymentLabel}>Tarjeta:</span>
                                        <span style={styles.paymentValue}>{contrato.debito_tarjeta.tarjeta_emisor}</span>
                                    </div>
                                    <div style={styles.paymentField}>
                                        <span style={styles.paymentLabel}>Número:</span>
                                        <span style={styles.paymentValue}>{enmascararTarjeta(contrato.debito_tarjeta.tarjeta_numero)}</span>
                                    </div>
                                    <div style={styles.paymentField}>
                                        <span style={styles.paymentLabel}>Vencimiento:</span>
                                        <span style={styles.paymentValue}>{contrato.debito_tarjeta.tarjeta_expiracion}</span>
                                    </div>
                                    <div style={styles.paymentField}>
                                        <span style={styles.paymentLabel}>Titular:</span>
                                        <span style={styles.paymentValue}>{contrato.debito_tarjeta.titular_tarjeta}</span>
                                    </div>
                                    <div style={styles.paymentField}>
                                        <span style={styles.paymentLabel}>Tipo:</span>
                                        <span style={styles.paymentValue}>
                                            {contrato.debito_tarjeta.tipo_tarjeta === 'debito' ? 'Débito' : 'Crédito'}
                                        </span>
                                    </div>
                                </>
                            ) : null}
                        </div>
                        
                        {/* Declaración de Autorización - Solo se muestra si hay método de pago */}
                        {metodoPago && (
                            <div style={styles.authorizationBox}>
                                <div style={styles.authorizationTitle}>Declaración de Autorización</div>
                                <div style={styles.authorizationText}>
                                    <p>Autorizo por la presente a que el pago correspondiente a las facturas mensuales por la contratación del servicio ofrecido por {compania.nombre} sean debitados en forma directa y automática en el resumen de mi {metodoPago}.</p>
                                    <p>Dejo especialmente establecido que podrá dar por cumplida la presente autorización mediante la sola declaración fehaciente comunicada, sin perjuicio tal, de los importes que pudieran corresponderme en función de servicios ya recibidos con anterioridad.</p>
                                    <p>La aprobación de esta solicitud será supeditada a la aceptación de la entidad emisora. Asimismo faculto a {compania.nombre} a presentar esta AUTORIZACIÓN donde sea requerida a efectos de cumplimentar la misma.</p>
                                    <p><em>Nota: IVA (21%) no incluido.</em></p>
                                </div>
                                
                                <div style={styles.signatureFieldsThree}>
                                    <div style={styles.signatureField}>
                                        <span style={styles.signatureLabel}>Firma:</span>
                                        <div style={styles.signatureLine}></div>
                                    </div>
                                    <div style={styles.signatureField}>
                                        <span style={styles.signatureLabel}>Aclaración:</span>
                                        <div style={styles.signatureLine}></div>
                                    </div>
                                    <div style={styles.signatureField}>
                                        <span style={styles.signatureLabel}>Tipo y Nro. documento:</span>
                                        <div style={styles.signatureLine}></div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* Datos de Instalación */}
            <div style={styles.section}>
                <div style={styles.sectionTitle}>Datos de Instalación</div>
                
                <div style={styles.installationLine}>
                    <div style={styles.installationItem}>
                        <span style={styles.installationLabel}>Plataforma:</span>
                        <span style={styles.installationValue}>{contrato.empresa_plataforma || '-'}</span>
                    </div>
                    <div style={styles.installationItem}>
                        <span style={styles.installationLabel}>Nombre de flota:</span>
                        <span style={styles.installationValue}>{contrato.empresa_nombre_flota || '-'}</span>
                    </div>
                    <div style={styles.installationItem}>
                        <span style={styles.installationLabel}>Unidades a equipar:</span>
                        <span style={styles.installationValue}>{contrato.presupuesto_cantidad_vehiculos || 0} vehículos</span>
                    </div>
                </div>
                
                {contrato.vehiculos?.length > 0 && (
                    <table style={styles.vehiclesTable}>
                        <thead>
                            <tr>
                                <th style={styles.vehiclesTableTh}>Patente</th>
                                <th style={styles.vehiclesTableTh}>Modelo</th>
                                <th style={styles.vehiclesTableTh}>Marca</th>
                                <th style={styles.vehiclesTableTh}>Año</th>
                                <th style={styles.vehiclesTableTh}>Color</th>
                                <th style={styles.vehiclesTableTh}>Identificador</th>
                            </tr>
                        </thead>
                        <tbody>
                            {contrato.vehiculos.map((v: any) => (
                                <tr key={v.id}>
                                    <td style={styles.vehiclesTableTd}>{v.patente}</td>
                                    <td style={styles.vehiclesTableTd}>{v.modelo || '-'}</td>
                                    <td style={styles.vehiclesTableTd}>{v.marca || '-'}</td>
                                    <td style={styles.vehiclesTableTd}>{v.anio || '-'}</td>
                                    <td style={styles.vehiclesTableTd}>{v.color || '-'}</td>
                                    <td style={styles.vehiclesTableTd}>{v.identificador || '-'}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Firma Final */}
            <div style={styles.signatureSection}>
                <div style={styles.sectionTitle}>Firma y Aceptación del Contrato</div>
                
                <div style={styles.signatureFieldsFinal}>
                    <div style={styles.signatureFieldFinal}>
                        <div style={styles.signatureLineFinal}></div>
                        <div style={styles.signatureLabelFinal}>Firma del Cliente</div>
                    </div>
                    <div style={styles.signatureFieldFinal}>
                        <div style={styles.signatureLineFinal}></div>
                        <div style={styles.signatureLabelFinal}>Aclaración de Firma</div>
                    </div>
                </div>
            </div>
        </div>
    );
}