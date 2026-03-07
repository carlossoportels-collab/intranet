// resources/js/Pages/EnConstruccion.tsx
import React from 'react';
import { Head, Link } from '@inertiajs/react';
import { Construction, Wrench, ArrowLeft, Clock, HardHat } from 'lucide-react';

import AppLayout from '@/layouts/app-layout';

interface Props {
    titulo?: string;
    mensaje?: string;
    feature?: string;
    estimatedTime?: string;
    contacto?: string;
    showBackButton?: boolean;
}

export default function EnConstruccion({ 
    titulo = "Página en Construcción",
    mensaje = "Estamos trabajando para brindarte la mejor experiencia.",
    feature = "Esta funcionalidad",
    estimatedTime = "próximamente",
    contacto = "soporte@localsat.com.ar",
    showBackButton = true
}: Props) {
    
    return (
        <AppLayout title={titulo}>
            <Head title={titulo} />
            
            <div className="min-h-[calc(100vh-200px)] flex items-center justify-center p-4">
                <div className="max-w-2xl w-full">
                    {/* Tarjeta principal */}
                    <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                        {/* Cabecera con gradiente */}
                        <div className="bg-gradient-to-r from-amber-500 to-orange-500 px-6 py-8 text-center">
                            <div className="flex justify-center mb-4">
                                <div className="bg-white/20 p-4 rounded-full backdrop-blur-sm">
                                    <Construction className="h-16 w-16 text-white" />
                                </div>
                            </div>
                            <h1 className="text-3xl font-bold text-white mb-2">
                                {titulo}
                            </h1>
                            <p className="text-amber-100 text-lg">
                                {mensaje}
                            </p>
                        </div>

                        {/* Contenido */}
                        <div className="p-8">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                                {/* Card 1: En desarrollo */}
                                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-amber-100 rounded-lg">
                                            <Wrench className="h-5 w-5 text-amber-600" />
                                        </div>
                                        <h3 className="font-semibold text-slate-900">En desarrollo</h3>
                                    </div>
                                    <p className="text-sm text-slate-600">
                                        {feature} está siendo desarrollada por nuestro equipo técnico.
                                    </p>
                                </div>

                                {/* Card 2: Tiempo estimado */}
                                <div className="bg-slate-50 rounded-xl p-5 border border-slate-200">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="p-2 bg-blue-100 rounded-lg">
                                            <Clock className="h-5 w-5 text-blue-600" />
                                        </div>
                                        <h3 className="font-semibold text-slate-900">Disponible</h3>
                                    </div>
                                    <p className="text-sm text-slate-600">
                                        Estará lista {estimatedTime}. Te avisaremos cuando esté disponible.
                                    </p>
                                </div>
                            </div>

                            {/* Mensaje adicional */}
                            <div className="bg-indigo-50 rounded-xl p-5 border border-indigo-200 mb-8">
                                <div className="flex items-start gap-3">
                                    <div className="p-1.5 bg-indigo-100 rounded-full">
                                        <HardHat className="h-5 w-5 text-indigo-600" />
                                    </div>
                                    <div className="flex-1">
                                        <h4 className="font-medium text-indigo-900 mb-1">
                                            ¿Necesitás esta funcionalidad con urgencia?
                                        </h4>
                                        <p className="text-sm text-indigo-700">
                                            Contactanos a <a href={`mailto:${contacto}`} className="font-semibold underline hover:text-indigo-900">{contacto}</a> y evaluaremos priorizar su desarrollo.
                                        </p>
                                    </div>
                                </div>
                            </div>

                            {/* Botones de acción */}
                            <div className="flex flex-col sm:flex-row gap-3 justify-center">
                                {showBackButton && (
                                    <Link
                                        href="/"
                                        className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-slate-100 text-slate-700 rounded-lg hover:bg-slate-200 transition-colors"
                                    >
                                        <ArrowLeft className="h-4 w-4" />
                                        Volver al inicio
                                    </Link>
                                )}
                                <a
                                    href={`mailto:${contacto}`}
                                    className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                                >
                                    <HardHat className="h-4 w-4" />
                                    Contactar soporte
                                </a>
                            </div>
                        </div>

                        {/* Footer */}
                        <div className="px-8 py-4 bg-slate-50 border-t border-slate-200 text-center">
                            <p className="text-xs text-slate-500">
                                Estamos trabajando constantemente para mejorar tu experiencia. Gracias por tu paciencia.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}