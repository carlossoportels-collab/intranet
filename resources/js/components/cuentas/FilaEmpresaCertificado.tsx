// resources/js/components/cuentas/FilaEmpresaCertificado.tsx

import React, { useState } from 'react';
import { ChevronDown, ChevronUp, Download, FileText, Truck, Eye } from 'lucide-react';
import { router } from '@inertiajs/react';

interface Vehiculo {
    id: number;
    patente: string;
    marca: string;
    modelo: string;
    anio: number;
    color: string;
    identificador: string;
    accesorios: string[];
    tiene_accesorios: boolean;
}

interface Empresa {
    id: number;
    codigo_alfa_empresa: string;
    nombre_fantasia: string;
    razon_social: string;
    cuit: string;
    total_vehiculos: number;
    vehiculos_con_accesorios: number;
    vehiculos: Vehiculo[];
}

interface FilaEmpresaCertificadoProps {
    empresa: Empresa;
}

export const FilaEmpresaCertificado: React.FC<FilaEmpresaCertificadoProps> = ({ empresa }) => {
    const [expandido, setExpandido] = useState(false);
    
    const toggleExpandido = () => {
        setExpandido(!expandido);
    };
    
    const descargarCertificadoFlota = () => {
        window.open(`/comercial/cuentas/certificados/flota/${empresa.id}`, '_blank');
    };

    const verCertificadoFlota = () => {
        // Abrir en una nueva pestaña para vista previa (sin descargar)
        window.open(`/comercial/cuentas/certificados/flota/${empresa.id}?preview=1`, '_blank');
    };
    
    const descargarCertificadoVehiculo = (vehiculoId: number) => {
        window.open(`/comercial/cuentas/certificados/vehiculo/${vehiculoId}`, '_blank');
    };
    
    const verCertificadoVehiculo = (vehiculoId: number) => {
        window.open(`/comercial/cuentas/certificados/vehiculo/${vehiculoId}?preview=1`, '_blank');
    };
    
    return (
        <div className="border-b border-gray-200 last:border-b-0">
            {/* Fila principal */}
            <div className="grid grid-cols-12 gap-2 px-4 py-3 hover:bg-gray-50 transition-colors">
                <div className="col-span-2 flex items-center">
                    <button
                        onClick={toggleExpandido}
                        className="mr-2 text-gray-400 hover:text-gray-600"
                    >
                        {expandido ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                    </button>
                    <span className="font-mono text-sm">{empresa.codigo_alfa_empresa}</span>
                </div>
                
                <div className="col-span-4">
                    <div className="text-sm font-medium text-gray-900 truncate" title={empresa.nombre_fantasia}>
                        {empresa.nombre_fantasia || empresa.razon_social}
                    </div>
                    <div className="text-xs text-gray-500">{empresa.cuit}</div>
                </div>
                
                <div className="col-span-2">
                    <div className="flex items-center gap-2">
                        <Truck size={14} className="text-gray-400" />
                        <span className="text-sm">{empresa.total_vehiculos} vehículos</span>
                    </div>
                    {empresa.vehiculos_con_accesorios > 0 && (
                        <div className="text-xs text-green-600 mt-1">
                            {empresa.vehiculos_con_accesorios} con accesorios
                        </div>
                    )}
                </div>
                
                <div className="col-span-2 flex items-center gap-2">
                    <button
                        onClick={verCertificadoFlota}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                        title="Vista previa del certificado"
                    >
                        <Eye size={12} />
                        <span>Ver</span>
                    </button>
                    <button
                        onClick={descargarCertificadoFlota}
                        className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition-colors"
                        title="Descargar certificado de flota"
                    >
                        <Download size={12} />
                        <span>PDF</span>
                    </button>
                </div>
                
                <div className="col-span-2 flex items-center gap-2">
                    <button
                        onClick={toggleExpandido}
                        className="text-xs text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                        <FileText size={12} />
                        <span>Ver vehículos</span>
                    </button>
                </div>
            </div>
            
            {/* Detalle expandido con vehículos */}
            {expandido && (
                <div className="bg-gray-50 px-4 py-3 border-t border-gray-200">
                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                        Vehículos de la flota
                    </h4>
                    
                    {empresa.vehiculos.length === 0 ? (
                        <p className="text-sm text-gray-500 italic">No hay vehículos registrados</p>
                    ) : (
                        <div className="space-y-2">
                            {empresa.vehiculos.map((vehiculo) => (
                                <div 
                                    key={vehiculo.id}
                                    className="grid grid-cols-12 gap-2 items-center bg-white p-2 rounded border border-gray-200 text-sm"
                                >
                                    <div className="col-span-2 font-mono">
                                        {vehiculo.patente || 'Sin patente'}
                                    </div>
                                    
                                    <div className="col-span-3">
                                        {vehiculo.marca} {vehiculo.modelo} {vehiculo.anio && `(${vehiculo.anio})`}
                                    </div>
                                    
                                    <div className="col-span-2">
                                        {vehiculo.color || 'N/A'}
                                    </div>
                                    
                                    <div className="col-span-3">
                                        {vehiculo.tiene_accesorios ? (
                                            <div className="flex flex-wrap gap-1">
                                                {vehiculo.accesorios.map((acc, idx) => (
                                                    <span 
                                                        key={idx}
                                                        className="text-xs bg-green-100 text-green-700 px-1.5 py-0.5 rounded"
                                                    >
                                                        {acc}
                                                    </span>
                                                ))}
                                            </div>
                                        ) : (
                                            <span className="text-xs text-gray-400">Sin accesorios</span>
                                        )}
                                    </div>
                                    
                                    <div className="col-span-2 flex justify-end gap-1">
                                        <button
                                            onClick={() => verCertificadoVehiculo(vehiculo.id)}
                                            className="flex items-center gap-1 px-2 py-1 text-xs bg-blue-50 text-blue-700 rounded hover:bg-blue-100 transition-colors"
                                            title="Vista previa"
                                        >
                                            <Eye size={10} />
                                        </button>
                                        <button
                                            onClick={() => descargarCertificadoVehiculo(vehiculo.id)}
                                            className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-50 text-indigo-700 rounded hover:bg-indigo-100 transition-colors"
                                            title="Descargar certificado individual"
                                        >
                                            <Download size={10} />
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};