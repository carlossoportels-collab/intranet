// resources/js/Pages/Comercial/Cuentas/Externo.tsx

import { Head, router } from '@inertiajs/react';
import React, { useState } from 'react';
import { Building2, MapPin, Truck, Shield, Key, User, Lock, Settings, ExternalLink } from 'lucide-react';

interface Plataforma {
    id: string;
    nombre: string;
    descripcion: string;
    logo: string;
    poweredBy: string;
    poweredUrl: string;
}

interface AlphaTipo {
    id: string;
    nombre: string;
    descripcion: string;
}

interface ExternoProps {
    plataformas: Plataforma[];
    alphaTipos: AlphaTipo[];
}

export default function Externo({ plataformas, alphaTipos }: ExternoProps) {
    const [plataformaSeleccionada, setPlataformaSeleccionada] = useState<string | null>(null);
    const [tipoAlpha, setTipoAlpha] = useState<string>('flota');
    const [usuario, setUsuario] = useState('');
    const [password, setPassword] = useState('');
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setCargando(true);

        const data: any = {
            plataforma: plataformaSeleccionada,
            usuario,
            password,
        };

        if (plataformaSeleccionada === 'alpha') {
            data.tipo_consulta = tipoAlpha;
        }

        router.post('/cuentas/moviles/login', data, {
            onSuccess: () => {
                router.get('/cuentas/moviles/vehiculos');
            },
            onError: (errors) => {
                setError(errors.error || 'Error de autenticación');
                setCargando(false);
            },
            onFinish: () => setCargando(false),
        });
    };

    const plataforma = plataformas.find(p => p.id === plataformaSeleccionada);

    return (
        <>
            <Head title="Acceso a Certificados" />
            
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100 flex items-center justify-center p-4">
                <div className="max-w-md w-full">
                    {/* Logo y título */}
                    <div className="text-left mb-10">
                        <div className="inline-flex items-center justify-center p-2 mb-6">
                            <img 
                                src="/images/logos/logo.png" 
                                alt="Localsat" 
                                className="h-25 w-auto"
                            />
                        </div>
                        <h1 className="text-3xl text-center font-bold text-slate-800">Certificados de Servicio</h1>
                        
                    </div>

                    {/* Cards de plataformas */}
                    {!plataformaSeleccionada ? (
                        <div className="grid gap-4">
                            {plataformas.map((plat) => (
                                <button
                                    key={plat.id}
                                    onClick={() => setPlataformaSeleccionada(plat.id)}
                                    className="bg-white rounded-xl shadow-md hover:shadow-lg transition-all p-6 text-left border-2 border-transparent hover:border-orange-400"
                                >
                                    <div className="flex items-start gap-4">
                                        <div className="p-3 bg-indigo-50 rounded-lg">
                                            <img 
                                                src={plat.logo} 
                                                alt={plat.nombre} 
                                                className="h-8 w-8 object-contain"
                                            />
                                        </div>
                                        <div className="flex-1">
                                            <h3 className="text-xl font-bold text-slate-800">
                                            Local<span className="text-orange-500">Sat</span> - {plat.nombre}
                                            </h3>
                                            
                                            <div className="mt-2 text-xs text-slate-400 flex items-center gap-1">
                                                <span>Powered by</span>
                                                <a 
                                                    href={plat.poweredUrl} 
                                                    target="_blank" 
                                                    rel="noopener noreferrer"
                                                    onClick={(e) => e.stopPropagation()}
                                                    className="text-indigo-600 hover:underline flex items-center gap-0.5"
                                                    title="Atención: redirige al ingreso de la plataforma"
                                                >
                                                    {plat.poweredBy}
                                                    <ExternalLink className="h-3 w-3" />
                                                </a>
                                            </div>
                                        </div>
                                    </div>
                                </button>
                            ))}
                        </div>
                    ) : (
                        <div className="bg-white rounded-xl shadow-lg p-6">
                            {/* Botón volver */}
                            <button
                                onClick={() => setPlataformaSeleccionada(null)}
                                className="mb-6 text-sm text-indigo-600 hover:text-indigo-800 flex items-center gap-1"
                            >
                                ← Volver a plataformas
                            </button>

                            {/* Título plataforma con logo */}
                            <div className="flex items-center gap-3 mb-6">
                                <div className="p-2 bg-indigo-100 rounded-lg">
                                    <img 
                                        src={plataforma?.logo} 
                                        alt={plataforma?.nombre} 
                                        className="h-6 w-6 object-contain"
                                    />
                                </div>
                                <h2 className="text-xl font-bold text-slate-800"> Local<span className="text-orange-500">Sat</span> - {plataforma?.nombre}</h2>
                            </div>

                            {/* Selector tipo Alpha (solo para Alpha) */}
                            {plataformaSeleccionada === 'alpha' && (
                                <div className="mb-4">
                                    <label className="block text-sm font-medium text-slate-700 mb-2">
                                        Tipo de consulta
                                    </label>
                                    <div className="grid grid-cols-2 gap-3">
                                        {alphaTipos.map((tipo) => (
                                            <button
                                                key={tipo.id}
                                                type="button"
                                                onClick={() => setTipoAlpha(tipo.id)}
                                                className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                                                    tipoAlpha === tipo.id
                                                        ? 'bg-indigo-600 border-indigo-600 text-white'
                                                        : 'bg-white border-slate-300 text-slate-700 hover:bg-slate-50'
                                                }`}
                                            >
                                                {tipo.nombre}
                                            </button>
                                        ))}
                                    </div>
                                    <p className="text-xs text-slate-500 mt-1">
                                        {tipoAlpha === 'flota' ? 'Acceso por flota' : 'Acceso por alias'}
                                    </p>
                                </div>
                            )}

                            {/* Formulario login */}
                            <form onSubmit={handleSubmit} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Usuario
                                    </label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            type="text"
                                            value={usuario}
                                            onChange={(e) => setUsuario(e.target.value)}
                                            className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Ingrese su usuario"
                                            required
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-700 mb-1">
                                        Contraseña
                                    </label>
                                    <div className="relative">
                                        <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                                        <input
                                            type="password"
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-10 pr-3 py-2 border border-slate-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500"
                                            placeholder="Ingrese su contraseña"
                                            required
                                        />
                                    </div>
                                </div>

                                {error && (
                                    <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-2 rounded-lg text-sm">
                                        {error}
                                    </div>
                                )}

                                <button
                                    type="submit"
                                    disabled={cargando}
                                    className="w-full bg-indigo-600 text-white py-2 rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                >
                                    {cargando ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                                            Conectando...
                                        </>
                                    ) : (
                                        <>
                                            <Key className="h-4 w-4" />
                                            Acceder
                                        </>
                                    )}
                                </button>
                            </form>

                            {/* Copyright */}
                            <div className="mt-6 pt-4 border-t border-slate-200">
                                <p className="text-xs text-slate-400 text-center">
                                    © {new Date().getFullYear()} Localsat - Todos los derechos reservados
                                </p>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </>
    );
}