// resources/js/components/cuentas/EstadisticasAbonosCards.tsx

import React, { useState } from 'react';
import { EstadisticaAbonoPorTipo, AbonoDetallePorNombre } from '@/types/cuentas';
import { formatMoney } from '@/utils/formatters';

interface EstadisticasAbonosCardsProps {
    tiposPrincipales: EstadisticaAbonoPorTipo[];
    totalAbonos: number;
    totalMonto: number;
    puedeVerMontos: boolean;
}

// Función para categorizar un abono por su nombre (solo para tipo_id 1 y 2)
const categorizarAbono = (nombre: string, tipoId: number): 'delta' | 'muni' | 'alpha' | null => {
    if (tipoId !== 1 && tipoId !== 2) {
        return null;
    }
    
    const nombreLower = nombre.toLowerCase();
    
    if (nombreLower.includes('delta') || 
        nombreLower.includes('caroya') || 
        nombreLower.includes('kla.be') ||
        nombreLower.includes('planify')) {
        return 'delta';
    }
    
    if (nombreLower.includes('municipalidad') || 
        nombreLower.includes('m.') || 
        nombreLower.includes(' m ')) {
        return 'muni';
    }
    
    return 'alpha';
};

// Colores para cada categoría
const coloresCards = [
    {
        bg: 'bg-gradient-to-br from-indigo-50 to-indigo-100/50',
        border: 'border-indigo-200',
        header: 'bg-indigo-600',
        headerText: 'text-white',
        badge: 'bg-indigo-100 text-indigo-800',
        acento: 'text-indigo-600',
        lightBg: 'bg-indigo-50'
    },
    {
        bg: 'bg-gradient-to-br from-emerald-50 to-emerald-100/50',
        border: 'border-emerald-200',
        header: 'bg-emerald-600',
        headerText: 'text-white',
        badge: 'bg-emerald-100 text-emerald-800',
        acento: 'text-emerald-600',
        lightBg: 'bg-emerald-50'
    },
    {
        bg: 'bg-gradient-to-br from-amber-50 to-amber-100/50',
        border: 'border-amber-200',
        header: 'bg-amber-600',
        headerText: 'text-white',
        badge: 'bg-amber-100 text-amber-800',
        acento: 'text-amber-600',
        lightBg: 'bg-amber-50'
    },
    {
        bg: 'bg-gradient-to-br from-rose-50 to-rose-100/50',
        border: 'border-rose-200',
        header: 'bg-rose-600',
        headerText: 'text-white',
        badge: 'bg-rose-100 text-rose-800',
        acento: 'text-rose-600',
        lightBg: 'bg-rose-50'
    }
];

const EstadisticasAbonosCards: React.FC<EstadisticasAbonosCardsProps> = ({ 
    tiposPrincipales, 
    totalAbonos, 
    totalMonto,
    puedeVerMontos 
}) => {
    const [tipoExpandido, setTipoExpandido] = useState<number | null>(null);
    const [todasExpandidas, setTodasExpandidas] = useState(false);

    if (!tiposPrincipales || tiposPrincipales.length === 0) {
        return null;
    }

    const toggleTodas = () => {
        setTodasExpandidas(!todasExpandidas);
        setTipoExpandido(null);
    };

    const toggleExpandido = (index: number) => {
        setTipoExpandido(tipoExpandido === index ? null : index);
        setTodasExpandidas(false);
    };

    return (
        <div className="mb-8 w-full">
            {/* Header con totales y botón expandir */}
            <div className="flex items-center justify-between mb-4 px-1">
                <div className="flex items-center gap-4">
                    <h2 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
                        <svg className="w-5 h-5 text-sat-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                        </svg>
                        Abonos por categoría
                    </h2>
                    
                    {/* Botón para expandir/colapsar todas */}
                    <button
                        onClick={toggleTodas}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                        title={todasExpandidas ? 'Colapsar todas' : 'Expandir todas'}
                    >
                        <svg 
                            className={`w-4 h-4 transition-transform ${todasExpandidas ? '' : 'rotate-180'}`} 
                            fill="none" 
                            stroke="currentColor" 
                            viewBox="0 0 24 24"
                        >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                        </svg>
                        <span>{todasExpandidas ? 'Colapsar' : 'Expandir'}</span>
                    </button>
                </div>

                <div className="flex items-center gap-2 text-sm bg-white px-4 py-2 rounded-lg border border-slate-200">
                    {puedeVerMontos && (
                        <>
                            <span className="w-px h-4 bg-slate-200"></span>
                            <span className="text-slate-600">
                                <span className="font-medium text-slate-800">{formatMoney(totalMonto)}</span> total
                            </span>
                        </>
                    )}
                </div>
            </div>

            {/* Grid de cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 w-full">
                {tiposPrincipales.map((tipo, index) => {
                    const colores = coloresCards[index % coloresCards.length];
                    const expandido = todasExpandidas || tipoExpandido === index;
                    const tieneDescuento = tipo.total_sin_descuento !== tipo.total_con_descuento;
                    
                    // Separar los abonos por categoría
                    const abonosDelta: typeof tipo.abonos = [];
                    const abonosMuni: typeof tipo.abonos = [];
                    const abonosAlpha: typeof tipo.abonos = [];
                    const otrosAbonos: typeof tipo.abonos = [];
                    
                    tipo.abonos?.forEach(abono => {
                        const categoria = categorizarAbono(abono.nombre, tipo.tipo_id);
                        
                        if (categoria === 'delta') {
                            abonosDelta.push(abono);
                        } else if (categoria === 'muni') {
                            abonosMuni.push(abono);
                        } else if (categoria === 'alpha') {
                            abonosAlpha.push(abono);
                        } else {
                            otrosAbonos.push(abono);
                        }
                    });
                    
                    const tieneDelta = abonosDelta.length > 0;
                    const tieneMuni = abonosMuni.length > 0;
                    const tieneAlpha = abonosAlpha.length > 0;
                    const tieneOtros = otrosAbonos.length > 0;
                    
                    return (
                        <div 
                            key={`${tipo.tipo_id}-${index}`} 
                            className={`rounded-xl border ${colores.border} ${colores.bg} overflow-hidden shadow-sm hover:shadow-md transition-all w-full flex flex-col`}
                        >
                            {/* Header de la card */}
                            <div className={`${colores.header} ${colores.headerText} px-4 py-3 font-medium flex items-center justify-between`}>
                                <span className="font-semibold truncate">{tipo.tipo_nombre}</span>
                                <span className="bg-white/20 px-2 py-0.5 rounded-full text-xs font-bold">
                                    {tipo.cantidad}
                                </span>
                            </div>

                            {/* Cuerpo de la card */}
                            <div className="p-4 flex-1 flex flex-col">
                                {/* Resumen de totales */}
                                <div className="mb-3 pb-3 border-b border-slate-200">
                                    <div className="text-xs text-slate-500 mb-1">Total</div>
                                    {puedeVerMontos ? (
                                        tieneDescuento ? (
                                            <div className="flex flex-wrap items-baseline gap-1">
                                                <span className="text-xs line-through text-slate-400">
                                                    {formatMoney(tipo.total_sin_descuento)}
                                                </span>
                                                <span className={`font-bold ${colores.acento}`}>
                                                    {formatMoney(tipo.total_con_descuento)}
                                                </span>
                                            </div>
                                        ) : (
                                            <span className={`font-bold ${colores.acento}`}>
                                                {formatMoney(tipo.total_sin_descuento)}
                                            </span>
                                        )
                                    ) : (
                                        <span className={`font-bold ${colores.acento}`}>
                                            {tipo.cantidad} abonos
                                        </span>
                                    )}
                                </div>

                                {/* Lista de abonos por categorías */}
                                <div className="space-y-4 flex-1">
                                    {/* Sección Delta */}
                                    {tieneDelta && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold text-indigo-600 uppercase tracking-wider">Delta</span>
                                                <div className="flex-1 h-px bg-indigo-200"></div>
                                                <span className="text-xs bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full">
                                                    {abonosDelta.length}
                                                </span>
                                            </div>
                                            {abonosDelta.slice(0, expandido ? undefined : 2).map((abono, i) => (
                                                <div key={i} className="text-xs pl-2">
                                                    <div className="flex justify-between items-start gap-2 mb-1">
                                                        <span 
                                                            className="text-slate-700 font-medium break-words pr-2 flex-1"
                                                            style={{ wordBreak: 'break-word' }}
                                                        >
                                                            {abono.nombre}
                                                        </span>
                                                        <span className="bg-indigo-100 text-indigo-800 px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0">
                                                            {abono.cantidad}
                                                        </span>
                                                    </div>
                                                    
                                                    {puedeVerMontos && (
                                                        <div className="flex justify-between items-center text-slate-500 ml-1">
                                                            <span className="text-slate-400">Total:</span>
                                                            {abono.total_sin_descuento !== abono.total_con_descuento ? (
                                                                <div className="text-right flex items-center gap-1 flex-wrap justify-end">
                                                                    <span className="line-through text-slate-400 text-[10px]">
                                                                        {formatMoney(abono.total_sin_descuento)}
                                                                    </span>
                                                                    <span className="font-medium text-indigo-600 text-xs">
                                                                        {formatMoney(abono.total_con_descuento)}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="font-medium text-slate-600">
                                                                    {formatMoney(abono.total_sin_descuento)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Sección Municipal */}
                                    {tieneMuni && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold text-emerald-600 uppercase tracking-wider">Municipal</span>
                                                <div className="flex-1 h-px bg-emerald-200"></div>
                                                <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full">
                                                    {abonosMuni.length}
                                                </span>
                                            </div>
                                            {abonosMuni.slice(0, expandido ? undefined : 2).map((abono, i) => (
                                                <div key={i} className="text-xs pl-2">
                                                    <div className="flex justify-between items-start gap-2 mb-1">
                                                        <span 
                                                            className="text-slate-700 font-medium break-words pr-2 flex-1"
                                                            style={{ wordBreak: 'break-word' }}
                                                        >
                                                            {abono.nombre}
                                                        </span>
                                                        <span className="bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0">
                                                            {abono.cantidad}
                                                        </span>
                                                    </div>
                                                    
                                                    {puedeVerMontos && (
                                                        <div className="flex justify-between items-center text-slate-500 ml-1">
                                                            <span className="text-slate-400">Total:</span>
                                                            {abono.total_sin_descuento !== abono.total_con_descuento ? (
                                                                <div className="text-right flex items-center gap-1 flex-wrap justify-end">
                                                                    <span className="line-through text-slate-400 text-[10px]">
                                                                        {formatMoney(abono.total_sin_descuento)}
                                                                    </span>
                                                                    <span className="font-medium text-emerald-600 text-xs">
                                                                        {formatMoney(abono.total_con_descuento)}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="font-medium text-slate-600">
                                                                    {formatMoney(abono.total_sin_descuento)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Sección Alpha */}
                                    {tieneAlpha && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">Alpha</span>
                                                <div className="flex-1 h-px bg-amber-200"></div>
                                                <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full">
                                                    {abonosAlpha.length}
                                                </span>
                                            </div>
                                            {abonosAlpha.slice(0, expandido ? undefined : 2).map((abono, i) => (
                                                <div key={i} className="text-xs pl-2">
                                                    <div className="flex justify-between items-start gap-2 mb-1">
                                                        <span 
                                                            className="text-slate-700 font-medium break-words pr-2 flex-1"
                                                            style={{ wordBreak: 'break-word' }}
                                                        >
                                                            {abono.nombre}
                                                        </span>
                                                        <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0">
                                                            {abono.cantidad}
                                                        </span>
                                                    </div>
                                                    
                                                    {puedeVerMontos && (
                                                        <div className="flex justify-between items-center text-slate-500 ml-1">
                                                            <span className="text-slate-400">Total:</span>
                                                            {abono.total_sin_descuento !== abono.total_con_descuento ? (
                                                                <div className="text-right flex items-center gap-1 flex-wrap justify-end">
                                                                    <span className="line-through text-slate-400 text-[10px]">
                                                                        {formatMoney(abono.total_sin_descuento)}
                                                                    </span>
                                                                    <span className="font-medium text-amber-600 text-xs">
                                                                        {formatMoney(abono.total_con_descuento)}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="font-medium text-slate-600">
                                                                    {formatMoney(abono.total_sin_descuento)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {/* Sección Otros */}
                                    {tieneOtros && (
                                        <div className="space-y-2">
                                            <div className="flex items-center gap-2">
                                                <span className="text-xs font-semibold text-slate-600 uppercase tracking-wider">Otros</span>
                                                <div className="flex-1 h-px bg-slate-200"></div>
                                                <span className="text-xs bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full">
                                                    {otrosAbonos.length}
                                                </span>
                                            </div>
                                            {otrosAbonos.slice(0, expandido ? undefined : 2).map((abono, i) => (
                                                <div key={i} className="text-xs pl-2">
                                                    <div className="flex justify-between items-start gap-2 mb-1">
                                                        <span 
                                                            className="text-slate-700 font-medium break-words pr-2 flex-1"
                                                            style={{ wordBreak: 'break-word' }}
                                                        >
                                                            {abono.nombre}
                                                        </span>
                                                        <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded-full font-medium whitespace-nowrap flex-shrink-0">
                                                            {abono.cantidad}
                                                        </span>
                                                    </div>
                                                    
                                                    {puedeVerMontos && (
                                                        <div className="flex justify-between items-center text-slate-500 ml-1">
                                                            <span className="text-slate-400">Total:</span>
                                                            {abono.total_sin_descuento !== abono.total_con_descuento ? (
                                                                <div className="text-right flex items-center gap-1 flex-wrap justify-end">
                                                                    <span className="line-through text-slate-400 text-[10px]">
                                                                        {formatMoney(abono.total_sin_descuento)}
                                                                    </span>
                                                                    <span className="font-medium text-slate-600 text-xs">
                                                                        {formatMoney(abono.total_con_descuento)}
                                                                    </span>
                                                                </div>
                                                            ) : (
                                                                <span className="font-medium text-slate-600">
                                                                    {formatMoney(abono.total_sin_descuento)}
                                                                </span>
                                                            )}
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    {!tieneDelta && !tieneMuni && !tieneAlpha && !tieneOtros && (
                                        <div className="text-xs text-slate-400 italic text-center py-2">
                                            Sin abonos específicos
                                        </div>
                                    )}
                                </div>

                                {/* Botón "Ver más" individual */}
                                {(abonosDelta.length + abonosMuni.length + abonosAlpha.length + otrosAbonos.length) > 3 && (
                                    <button
                                        onClick={() => toggleExpandido(index)}
                                        className={`mt-3 w-full text-xs ${colores.acento} hover:opacity-80 flex items-center justify-center gap-1 py-2 border-t border-slate-200 transition-colors`}
                                    >
                                        <span>{expandido ? 'Ver menos' : `Ver +${(abonosDelta.length + abonosMuni.length + abonosAlpha.length + otrosAbonos.length) - 3} más`}</span>
                                        <svg 
                                            className={`w-3 h-3 transition-transform ${expandido ? 'rotate-180' : ''}`} 
                                            fill="none" 
                                            stroke="currentColor" 
                                            viewBox="0 0 24 24"
                                        >
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
};

export default EstadisticasAbonosCards;