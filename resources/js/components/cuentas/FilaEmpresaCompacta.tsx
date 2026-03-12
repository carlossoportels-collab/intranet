// resources/js/components/cuentas/FilaEmpresaCompacta.tsx
import React from 'react';
import { Empresa } from '@/types/cuentas';
import { formatShortDate } from '@/utils/formatters';

interface FilaEmpresaCompactaProps {
    empresa: Empresa;
    isSelected: boolean;
    onClick: (empresa: Empresa) => void;
}

const FilaEmpresaCompacta: React.FC<FilaEmpresaCompactaProps> = ({ empresa, isSelected, onClick }) => {
    const contactoPrincipal = empresa.contactos.find(c => c.es_contacto_principal && c.es_activo);
    const vehiculosCount = empresa.vehiculos.length;
    const abonosCount = empresa.vehiculos.reduce((acc, v) => acc + (v.abonos?.length || 0), 0);

    return (
        <div 
            className={`relative border-b border-slate-200 cursor-pointer transition-all duration-200
                ${isSelected 
                    ? 'bg-gradient-to-r from-indigo-50 via-indigo-50/50 to-white border-l-4 border-l-indigo-600 shadow-md' 
                    : 'hover:bg-indigo-50/30 hover:shadow-sm'
                }
            `}
            onClick={() => onClick(empresa)}
        >
            {/* Indicador de selección lateral */}
            {isSelected && (
                <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-600 to-indigo-400"></div>
            )}

            {/* Versión móvil */}
            <div className="block sm:hidden p-4">
                <div className="flex items-start justify-between">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`font-mono text-xs font-semibold px-2 py-1 rounded-lg ${
                                isSelected 
                                    ? 'bg-indigo-600 text-white shadow-md' 
                                    : 'bg-slate-100 text-slate-700'
                            }`}>
                                {empresa.codigo_alfa_empresa}
                            </span>
                            {!empresa.es_activo && (
                                <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full">
                                    Inactiva
                                </span>
                            )}
                        </div>
                        <h3 className={`font-semibold text-base mb-1 ${
                            isSelected ? 'text-indigo-900' : 'text-slate-900'
                        }`}>
                            {empresa.nombre_fantasia || 'Sin nombre'}
                        </h3>
                        <p className="text-sm text-slate-500 mb-2">
                            {empresa.razon_social || 'Sin razón social'}
                        </p>
                        <div className="flex items-center gap-2 text-sm">
                            <span className="font-mono text-slate-600">
                                {empresa.cuit || 'N/A'}
                            </span>
                            <span className="text-slate-300">•</span>
                            <span className="text-slate-500">
                                {formatShortDate(empresa.created)}
                            </span>
                        </div>
                        
                        {/* Contacto principal en móvil */}
                        {contactoPrincipal?.lead && (
                            <div className="mt-2 pt-2 border-t border-slate-100">
                                <p className="text-xs text-slate-500">
                                    <span className="font-medium">Contacto:</span> {contactoPrincipal.lead.nombre_completo}
                                </p>
                            </div>
                        )}
                    </div>
                    
                    {/* Métricas y flecha */}
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1">
                            <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                isSelected 
                                    ? 'bg-indigo-600 text-white' 
                                    : 'bg-indigo-100 text-indigo-700'
                            }`}>
                                {vehiculosCount}v
                            </span>
                            {abonosCount > 0 && (
                                <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                                    isSelected 
                                        ? 'bg-indigo-500 text-white' 
                                        : 'bg-emerald-100 text-emerald-700'
                                }`}>
                                    {abonosCount}a
                                </span>
                            )}
                        </div>
                        <div className={`p-1.5 rounded-full transition-all ${
                            isSelected 
                                ? 'bg-indigo-200 rotate-180' 
                                : 'bg-slate-100'
                        }`}>
                            <svg 
                                className={`w-5 h-5 transition-all ${
                                    isSelected ? 'text-indigo-700' : 'text-slate-500'
                                }`} 
                                fill="none" 
                                stroke="currentColor" 
                                viewBox="0 0 24 24"
                            >
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                            </svg>
                        </div>
                    </div>
                </div>
            </div>

            {/* Versión desktop */}
            <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2.5 text-sm">
                <div className="col-span-2">
                    <span className={`font-mono text-xs font-semibold px-2.5 py-1 rounded-lg inline-flex items-center transition-all ${
                        isSelected 
                            ? 'bg-indigo-600 text-white shadow-md scale-105' 
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                        {empresa.codigo_alfa_empresa}
                    </span>
                </div>

                <div className="col-span-3">
                    <div className="flex items-center gap-2">
                        <span className={`font-medium truncate ${
                            isSelected ? 'text-indigo-900 font-semibold' : 'text-slate-900'
                        }`}>
                            {empresa.nombre_fantasia || 'Sin nombre'}
                        </span>
                        {!empresa.es_activo && (
                            <span className="text-xs bg-rose-100 text-rose-700 px-2 py-0.5 rounded-full font-medium">
                                Inactiva
                            </span>
                        )}
                    </div>
                    <p className="text-xs text-slate-500 truncate">
                        {empresa.razon_social || 'Sin razón social'}
                    </p>
                </div>

                <div className="col-span-2">
                    <span className={`text-xs font-mono px-2 py-1 rounded ${
                        isSelected 
                            ? 'bg-indigo-100 text-indigo-800' 
                            : 'bg-slate-50 text-slate-600'
                    }`}>
                        {empresa.cuit || 'N/A'}
                    </span>
                </div>

                <div className="col-span-2">
                    {contactoPrincipal?.lead ? (
                        <div className="text-xs">
                            <p className={`font-medium truncate flex items-center gap-1 ${
                                isSelected ? 'text-indigo-900' : 'text-slate-900'
                            }`}>
                                {contactoPrincipal.lead.nombre_completo}
                                {contactoPrincipal.es_contacto_principal && (
                                    <span className={`${isSelected ? 'text-indigo-400' : 'text-amber-500'}`}>★</span>
                                )}
                            </p>
                            <p className="text-slate-500 truncate text-xs">
                                {contactoPrincipal.lead.email || contactoPrincipal.lead.telefono}
                            </p>
                        </div>
                    ) : (
                        <span className="text-xs text-slate-400 italic">Sin contacto</span>
                    )}
                </div>

                <div className="col-span-1">
                    <div className="flex items-center gap-1.5">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                            isSelected 
                                ? 'bg-indigo-600 text-white' 
                                : 'bg-indigo-100 text-indigo-700'
                        }`}>
                            {vehiculosCount}v
                        </span>
                        {abonosCount > 0 && (
                            <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                                isSelected 
                                    ? 'bg-indigo-500 text-white' 
                                    : 'bg-emerald-100 text-emerald-700'
                            }`}>
                                {abonosCount}a
                            </span>
                        )}
                    </div>
                </div>

                <div className="col-span-1">
                    <span className={`text-xs ${
                        isSelected ? 'text-indigo-600 font-medium' : 'text-slate-400'
                    }`}>
                        {formatShortDate(empresa.created)}
                    </span>
                </div>

                <div className="col-span-1 flex justify-end">
                    <div className={`p-1 rounded-full transition-all ${
                        isSelected ? 'bg-indigo-200 rotate-180' : 'bg-transparent'
                    }`}>
                        <svg 
                            className={`w-4 h-4 transition-all ${
                                isSelected ? 'text-indigo-700' : 'text-slate-400'
                            }`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default FilaEmpresaCompacta;