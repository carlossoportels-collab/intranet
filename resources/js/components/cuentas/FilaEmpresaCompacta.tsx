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
            className={`border-b border-slate-200 hover:bg-indigo-50/50 cursor-pointer transition-all ${
                isSelected ? 'bg-indigo-50 border-indigo-200 shadow-sm' : ''
            }`}
            onClick={() => onClick(empresa)}
        >
            {/* Versión móvil: ultra simple */}
            <div className="block sm:hidden p-4">
                <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                            <span className={`font-mono text-xs font-semibold px-2 py-1 rounded-lg ${
                                isSelected 
                                    ? 'bg-indigo-600 text-white' 
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
                        <h3 className="font-semibold text-slate-900 text-base mb-1">
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
                    </div>
                    
                    {/* Métricas a la derecha */}
                    <div className="flex flex-col items-end gap-2">
                        <div className="flex items-center gap-1">
                            <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded-full font-medium">
                                {vehiculosCount}v
                            </span>
                            {abonosCount > 0 && (
                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                                    {abonosCount}a
                                </span>
                            )}
                        </div>
                        <div className={`p-1.5 rounded-full transition-colors ${
                            isSelected ? 'bg-indigo-200' : 'bg-slate-100'
                        }`}>
                            <svg 
                                className={`w-5 h-5 transition-transform ${
                                    isSelected ? 'rotate-180 text-indigo-600' : 'text-slate-500'
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

                {/* Contacto principal (si existe) - opcional en móvil */}
                {contactoPrincipal?.lead && (
                    <div className="mt-2 pt-2 border-t border-slate-100">
                        <p className="text-xs text-slate-500">
                            <span className="font-medium">Contacto:</span> {contactoPrincipal.lead.nombre_completo}
                            {contactoPrincipal.lead.email && ` • ${contactoPrincipal.lead.email}`}
                        </p>
                    </div>
                )}
            </div>

            {/* Versión desktop: grid original (sin cambios) */}
            <div className="hidden sm:grid grid-cols-12 gap-2 px-4 py-2.5 text-sm">
                {/* ... contenido desktop igual que antes ... */}
                <div className="col-span-2">
                    <span className={`font-mono text-xs font-semibold px-2.5 py-1 rounded-lg inline-flex items-center ${
                        isSelected 
                            ? 'bg-indigo-600 text-white shadow-sm' 
                            : 'bg-slate-100 text-slate-700 border border-slate-200'
                    }`}>
                        {empresa.codigo_alfa_empresa}
                    </span>
                </div>

                <div className="col-span-3">
                    <div className="flex items-center gap-2">
                        <span className="font-medium text-slate-900 truncate">
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
                    <span className="text-xs font-mono text-slate-600 bg-slate-50 px-2 py-1 rounded">
                        {empresa.cuit || 'N/A'}
                    </span>
                </div>

                <div className="col-span-2">
                    {contactoPrincipal?.lead ? (
                        <div className="text-xs">
                            <p className="font-medium text-slate-900 truncate flex items-center gap-1">
                                {contactoPrincipal.lead.nombre_completo}
                                {contactoPrincipal.es_contacto_principal && (
                                    <span className="text-amber-500" title="Contacto principal">★</span>
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
                        <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-medium">
                            {vehiculosCount}v
                        </span>
                        {abonosCount > 0 && (
                            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                                {abonosCount}a
                            </span>
                        )}
                    </div>
                </div>

                <div className="col-span-1">
                    <span className="text-xs text-slate-400">
                        {formatShortDate(empresa.created)}
                    </span>
                </div>

                <div className="col-span-1 flex justify-end">
                    <div className={`p-1 rounded-full transition-colors ${
                        isSelected ? 'bg-indigo-100' : 'bg-transparent'
                    }`}>
                        <svg 
                            className={`w-4 h-4 transition-transform ${
                                isSelected ? 'rotate-180 text-indigo-600' : 'text-slate-400'
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