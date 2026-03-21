// resources/js/Pages/Comercial/Cuentas/ExternoVehiculos.tsx

import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { Download, LogOut, RefreshCw, Loader2, Building2, Truck } from 'lucide-react';

interface Empresa {
    id: string;
    nombre: string;
    cuit?: string;
    direccion?: string;
}

interface Vehiculo {
    id: string;
    movilId?: string;
    patente: string;
    identificador: string;
    descripcion?: string;
    alias?: string;
    empresa?: Empresa | null;
}

interface ExternoVehiculosProps {
    plataforma: string;
    vehiculos: Vehiculo[];
}

export default function ExternoVehiculos({ plataforma, vehiculos }: ExternoVehiculosProps) {
    const [cargando, setCargando] = useState<string | null>(null);
    const [generando, setGenerando] = useState<string | null>(null);

    const handleLogout = () => {
        router.post('/cuentas/moviles/logout', {}, {
            onSuccess: () => {
                router.get('/cuentas/moviles');
            }
        });
    };

    const handleGenerarCertificado = (vehiculoId: string) => {
        setGenerando(vehiculoId);
        window.open(`/cuentas/moviles/certificado/${vehiculoId}`, '_blank');
        setTimeout(() => setGenerando(null), 1000);
    };

    const handleCertificadoFlota = (empresaId: string, empresaNombre: string) => {
        const flotaId = `flota-${empresaId}`;
        setGenerando(flotaId);
        window.open(`/cuentas/moviles/certificado-flota/${empresaId}`, '_blank');
        setTimeout(() => setGenerando(null), 1000);
    };

    const handleRefresh = () => {
        setCargando('refresh');
        router.get('/cuentas/moviles/vehiculos', {}, {
            preserveState: true,
            onFinish: () => setCargando(null),
        });
    };

    // Agrupar vehículos por empresa
    const vehiculosPorEmpresa = vehiculos.reduce((acc, vehiculo) => {
        const empresaId = vehiculo.empresa?.id || 'sin-empresa';
        const empresaNombre = vehiculo.empresa?.nombre || 'Sin empresa';
        if (!acc[empresaId]) {
            acc[empresaId] = {
                empresa: vehiculo.empresa,
                nombre: empresaNombre,
                vehiculos: []
            };
        }
        acc[empresaId].vehiculos.push(vehiculo);
        return acc;
    }, {} as Record<string, { empresa: Empresa | null | undefined; nombre: string; vehiculos: Vehiculo[] }>);

    const plataformaNombre = plataforma === 'delta' ? 'Delta' : 'Alpha';

return (
        <>
            <Head title={`Mis vehículos - ${plataformaNombre}`} />
            
            {/* Contenedor principal con flex y min-height */}
            <div className="min-h-screen flex flex-col bg-slate-50">
                {/* Header - sticky top */}
                <div className="bg-white border-b border-slate-200 sticky top-0 z-10 flex-shrink-0">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                                <img 
                                    src="/images/logos/localsat_logo.png" 
                                    alt="Localsat" 
                                    className="h-10 w-auto"
                                />
                                <div className="h-6 w-px bg-slate-200" />
                                <div>
                                    <h1 className="text-xl font-bold text-slate-800">
                                        Mis vehículos - Local<span className="text-orange-500">Sat</span> - {plataformaNombre}
                                    </h1>
                                    <p className="text-sm text-slate-500">
                                        {vehiculos.length} vehículo(s) disponibles
                                    </p>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button
                                    onClick={handleRefresh}
                                    disabled={cargando === 'refresh'}
                                    className="p-2 text-slate-600 hover:bg-slate-100 rounded-lg transition-colors disabled:opacity-50"
                                >
                                    <RefreshCw className={`h-5 w-5 ${cargando === 'refresh' ? 'animate-spin' : ''}`} />
                                </button>
                                <button
                                    onClick={handleLogout}
                                    className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                >
                                    <LogOut className="h-4 w-4" />
                                    <span className="text-sm">Salir</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Contenido principal - ocupa todo el espacio disponible */}
                <div className="flex-1">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                        {vehiculos.length === 0 ? (
                            <div className="text-center py-12">
                                <img 
                                    src="/images/logos/localsat_logo.png" 
                                    alt="Localsat" 
                                    className="h-16 w-auto mx-auto mb-4 opacity-50"
                                />
                                <p className="text-slate-500">No se encontraron vehículos</p>
                                <button
                                    onClick={handleRefresh}
                                    className="mt-4 text-indigo-600 hover:text-indigo-800"
                                >
                                    Intentar nuevamente
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {Object.values(vehiculosPorEmpresa).map((grupo) => (
                                    <div key={grupo.nombre} className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
                                        {/* Header de empresa */}
                                        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 px-4 py-3 border-b border-slate-200">
                                            <div className="flex items-center justify-between">
                                                <div className="flex items-center gap-3">
                                                    <Building2 className="h-5 w-5 text-indigo-600" />
                                                    <div>
                                                        <h2 className="font-semibold text-slate-800">{grupo.nombre}</h2>
                                                        {grupo.empresa?.cuit && (
                                                            <p className="text-xs text-slate-500">CUIT: {grupo.empresa.cuit}</p>
                                                        )}
                                                    </div>
                                                </div>
                                                {grupo.empresa && (
                                                    <button
                                                        onClick={() => handleCertificadoFlota(grupo.empresa!.id, grupo.nombre)}
                                                        disabled={generando === `flota-${grupo.empresa!.id}`}
                                                        className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 text-white text-sm rounded-lg hover:bg-emerald-700 transition-colors disabled:opacity-50"
                                                    >
                                                        {generando === `flota-${grupo.empresa!.id}` ? (
                                                            <Loader2 className="h-4 w-4 animate-spin" />
                                                        ) : (
                                                            <Download className="h-4 w-4" />
                                                        )}
                                                        <span>Certificado de Flota</span>
                                                    </button>
                                                )}
                                            </div>
                                        </div>

                                        {/* Lista de vehículos */}
                                        <div className="divide-y divide-slate-100">
                                            {grupo.vehiculos.map((vehiculo) => (
                                                <div
                                                    key={vehiculo.id}
                                                    className="p-4 hover:bg-slate-50 transition-colors"
                                                >
                                                    <div className="flex items-center justify-between flex-wrap gap-4">
                                                        <div className="flex items-center gap-4">
                                                            <div className="p-2 bg-slate-100 rounded-lg">
                                                                <Truck className="h-6 w-6 text-slate-600" />
                                                            </div>
                                                            <div>
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono font-bold text-lg text-slate-800">
                                                                        {vehiculo.identificador || vehiculo.patente || 'Sin identificación'}
                                                                    </span>
                                                                    {vehiculo.patente && (
                                                                        <span className="text-xs bg-slate-100 text-slate-600 px-2 py-0.5 rounded-full">
                                                                            {vehiculo.patente}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                                {vehiculo.empresa && (
                                                                    <p className="text-sm text-slate-500 mt-1">
                                                                        {vehiculo.empresa.nombre}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button
                                                            onClick={() => handleGenerarCertificado(vehiculo.id)}
                                                            disabled={generando === vehiculo.id}
                                                            className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:opacity-50"
                                                        >
                                                            {generando === vehiculo.id ? (
                                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                            ) : (
                                                                <Download className="h-4 w-4" />
                                                            )}
                                                            <span>Certificado</span>
                                                        </button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Footer - sticky bottom */}
                <div className="border-t border-slate-200 bg-white flex-shrink-0">
                    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
                        <p className="text-xs text-slate-400 text-center">
                            Certificados de vehículos generados a partir de datos en tiempo real
                        </p>
                        <p className="text-xs text-slate-400 text-center mt-1">
                            © {new Date().getFullYear()} Localsat - Todos los derechos reservados
                        </p>
                    </div>
                </div>
            </div>
        </>
    );
}