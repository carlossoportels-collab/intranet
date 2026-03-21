// resources/js/components/cuentas/DetalleEmpresaCompacto.tsx
import React, { useState } from 'react';
import { Empresa } from '@/types/cuentas';
import { formatMoney } from '@/utils/formatters';

interface DetalleEmpresaCompactoProps {
    empresa: Empresa;
}

const DetalleEmpresaCompacto: React.FC<DetalleEmpresaCompactoProps> = ({ empresa }) => {
    const [showFullInfo, setShowFullInfo] = useState(false);
    const contactosActivos = empresa.contactos.filter(c => c.es_activo);
    
    // Calcular totales de abonos
    const calcularTotalesAbonos = () => {
        let totalSinDescuento = 0;
        let totalConDescuento = 0;
        
        empresa.vehiculos.forEach(vehiculo => {
            vehiculo.abonos?.forEach(abono => {
                totalSinDescuento += abono.abono_precio;
                
                // Calcular con descuento si existe
                if (abono.abono_descuento && abono.abono_descuento > 0) {
                    const descuento = abono.abono_precio * (abono.abono_descuento / 100);
                    totalConDescuento += (abono.abono_precio - descuento);
                } else {
                    totalConDescuento += abono.abono_precio;
                }
            });
        });
        
        return { totalSinDescuento, totalConDescuento };
    };

    const { totalSinDescuento, totalConDescuento } = calcularTotalesAbonos();
    const tieneDescuentos = totalSinDescuento !== totalConDescuento;

    const getDireccionCompleta = () => {
        const partes = [];
        if (empresa.direccion_fiscal) partes.push(empresa.direccion_fiscal);
        if (empresa.localidad_fiscal) {
            const localidadInfo = [];
            if (empresa.localidad_fiscal.localidad) localidadInfo.push(empresa.localidad_fiscal.localidad);
            if (empresa.localidad_fiscal.provincia) localidadInfo.push(empresa.localidad_fiscal.provincia);
            if (localidadInfo.length > 0) partes.push(localidadInfo.join(', '));
        }
        if (empresa.codigo_postal_fiscal) partes.push(`CP: ${empresa.codigo_postal_fiscal}`);
        return partes.join(' - ') || 'N/A';
    };

    return (
        <div className="bg-white border-b border-slate-200">
            {/* Versión móvil: resumen ejecutivo */}
            <div className="block sm:hidden p-4">
                {/* Stats rápidas en fila - ACTUALIZADO */}
                <div className="flex items-center justify-between mb-4 bg-indigo-50 rounded-lg p-3">
                    <div className="text-center flex-1">
                        <span className="block text-xs text-indigo-600">Vehículos</span>
                        <span className="block text-lg font-bold text-indigo-900">{empresa.vehiculos.length}</span>
                    </div>
                    <div className="text-center flex-1 border-l border-indigo-200">
                        <span className="block text-xs text-indigo-600">Abonos</span>
                        <span className="block text-lg font-bold text-indigo-900">
                            {empresa.vehiculos.reduce((acc, v) => acc + (v.abonos?.length || 0), 0)}
                        </span>
                    </div>
                    <div className="text-center flex-1 border-l border-indigo-200">
                        <span className="block text-xs text-indigo-600">Total $</span>
                        {tieneDescuentos ? (
                            <>
                                <span className="block text-xs line-through text-indigo-400">
                                    {formatMoney(totalSinDescuento)}
                                </span>
                                <span className="block text-sm font-bold text-indigo-900">
                                    {formatMoney(totalConDescuento)}
                                </span>
                            </>
                        ) : (
                            <span className="block text-sm font-bold text-indigo-900">
                                {formatMoney(totalSinDescuento)}
                            </span>
                        )}
                    </div>
                </div>

                {/* Botón para ver más detalles */}
                <button
                    onClick={() => setShowFullInfo(!showFullInfo)}
                    className="w-full flex items-center justify-between px-3 py-2 bg-slate-50 rounded-lg text-sm text-slate-600"
                >
                    <span className="font-medium">{showFullInfo ? 'Ocultar' : 'Ver'} detalles de la empresa</span>
                    <svg 
                        className={`w-4 h-4 transition-transform ${showFullInfo ? 'rotate-180' : ''}`} 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                </button>

                {/* Detalles expandibles */}
                {showFullInfo && (
                    <div className="mt-4 space-y-4">
                        {/* Información fiscal */}
                        <div className="bg-slate-50 rounded-lg p-3">
                            <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">Información fiscal</h4>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-slate-500">CUIT:</span>
                                    <span className="font-mono font-medium">{empresa.cuit || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Teléfono:</span>
                                    <span>{empresa.telefono_fiscal || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-slate-500">Email:</span>
                                    <span className="truncate max-w-[200px]">{empresa.email_fiscal || 'N/A'}</span>
                                </div>
                            </div>
                        </div>

                        {/* Dirección */}
                        {getDireccionCompleta() !== 'N/A' && (
                            <div className="bg-slate-50 rounded-lg p-3">
                                <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">Dirección</h4>
                                <p className="text-sm text-slate-700">{getDireccionCompleta()}</p>
                            </div>
                        )}

                        {/* Contactos */}
                        {contactosActivos.length > 0 && (
                            <div className="bg-slate-50 rounded-lg p-3">
                                <h4 className="text-xs font-semibold text-slate-700 uppercase mb-2">
                                    Contactos ({contactosActivos.length})
                                </h4>
                                <div className="space-y-2">
                                    {contactosActivos.map(contacto => (
                                        <div key={contacto.id} className="text-sm">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">{contacto.lead?.nombre_completo || 'Sin nombre'}</span>
                                                {contacto.es_contacto_principal && (
                                                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                                        Principal
                                                    </span>
                                                )}
                                            </div>
                                            {contacto.lead?.email && (
                                                <p className="text-xs text-slate-500 mt-1">{contacto.lead.email}</p>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Versión desktop: grid original - ACTUALIZADO */}
            <div className="hidden sm:block bg-gray-50 border-b border-gray-200 px-4 py-3">
                <div className="grid grid-cols-4 gap-4 text-sm">
                    <div>
                        <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">Fiscal</h4>
                        <div className="space-y-1">
                            <div>
                                <span className="text-xs text-gray-500">CUIT:</span>
                                <span className="text-xs font-mono ml-1">{empresa.cuit || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500">Tel:</span>
                                <span className="text-xs ml-1">{empresa.telefono_fiscal || 'N/A'}</span>
                            </div>
                            <div>
                                <span className="text-xs text-gray-500">Email:</span>
                                <span className="text-xs ml-1 truncate">{empresa.email_fiscal || 'N/A'}</span>
                            </div>
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">Dirección</h4>
                        <p className="text-xs text-gray-600">
                            {empresa.direccion_fiscal || 'Sin dirección'}
                        </p>
                        {empresa.localidad_fiscal && (
                            <p className="text-xs text-gray-500 mt-1">
                                {empresa.localidad_fiscal.localidad}, {empresa.localidad_fiscal.provincia}
                            </p>
                        )}
                    </div>

                    <div>
                        <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">
                            Contactos ({contactosActivos.length})
                        </h4>
                        <div className="space-y-1">
                            {contactosActivos.slice(0, 2).map(contacto => (
                                <div key={contacto.id} className="text-xs">
                                    <span className="font-medium text-gray-900">
                                        {contacto.lead?.nombre_completo || 'Sin nombre'}
                                    </span>
                                    {contacto.es_contacto_principal && (
                                        <span className="ml-1 text-xs text-blue-600">★</span>
                                    )}
                                </div>
                            ))}
                            {contactosActivos.length > 2 && (
                                <span className="text-xs text-gray-500">
                                    +{contactosActivos.length - 2} más
                                </span>
                            )}
                        </div>
                    </div>

                    <div>
                        <h4 className="text-xs font-semibold text-gray-700 uppercase mb-2">Resumen</h4>
                        <div className="space-y-1">
                            <div>
                                <span className="text-xs text-gray-500">Total abonos:</span>
                                {tieneDescuentos ? (
                                    <div className="inline-block ml-1">
                                        <span className="text-xs line-through text-gray-400 mr-1">
                                            {formatMoney(totalSinDescuento)}
                                        </span>
                                        <span className="text-xs font-medium text-indigo-600">
                                            {formatMoney(totalConDescuento)}
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-xs font-medium ml-1">{formatMoney(totalSinDescuento)}</span>
                                )}
                            </div>
                            <div>
                                <span className="text-xs text-gray-500">Vehículos:</span>
                                <span className="text-xs font-medium ml-1">{empresa.vehiculos.length}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DetalleEmpresaCompacto;