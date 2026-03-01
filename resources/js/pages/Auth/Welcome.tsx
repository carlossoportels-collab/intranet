// resources/js/Pages/Auth/Welcome.tsx
import { Head } from '@inertiajs/react';
import { CheckCircle, Loader2, User, Shield, Building2 } from 'lucide-react';
import React, { useState, useEffect } from 'react';

interface WelcomeProps {
    compania: string;
    logo: string;
    colores: {
        primary: string;
        secondary: string;
    };
    nombre: string;
    redirect_to: string;
}

export default function Welcome({ compania, logo, colores, nombre, redirect_to }: WelcomeProps) {
    const [timeLeft, setTimeLeft] = useState(2); 
    const [progress, setProgress] = useState(0);
    const [statusMessage, setStatusMessage] = useState('Verificando credenciales...');
    
    // Mensajes de estado que cambian cada segundo
    const statusMessages = [
        'Verificando credenciales...',
        'Cargando información del usuario...',
        'Redirigiendo al sistema...'
    ];
    
    useEffect(() => {
        let messageIndex = 0;
        setStatusMessage(statusMessages[messageIndex]);
        
        const progressInterval = setInterval(() => {
            setProgress(prev => {
                const newProgress = prev + (100 / 2);
                return newProgress >= 100 ? 100 : newProgress;
            });
        }, 1000);
        
        const messageInterval = setInterval(() => {
            messageIndex++;
            if (messageIndex < statusMessages.length) {
                setStatusMessage(statusMessages[messageIndex]);
            }
        }, 1000);
        
        const countdownInterval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    clearInterval(progressInterval);
                    clearInterval(messageInterval);
                    
                    setTimeout(() => {
                        window.location.href = redirect_to;
                    }, 300);
                    
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        
        return () => {
            clearInterval(progressInterval);
            clearInterval(messageInterval);
            clearInterval(countdownInterval);
        };
    }, [redirect_to]);
    
    const getThemeStyles = () => {
        return {
            cardBg: `linear-gradient(135deg, ${colores.primary} 0%, ${colores.secondary} 100%)`,
            progressBar: colores.secondary,
        };
    };
    
    const theme = getThemeStyles();
    
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-gray-50 to-gray-100">
            <Head title={`Bienvenido a ${compania}`} />
            
            <div className="w-full max-w-md">
                {/* Tarjeta principal */}
                <div className="rounded-xl shadow-lg overflow-hidden border border-gray-200 bg-white animate-fade-in-up">
                    {/* Encabezado con logo */}
                    <div 
                        className="p-6 text-center relative overflow-hidden"
                        style={{ background: theme.cardBg }}
                    >
                        <div className="relative z-10">
                            {/* Logo de la compañía */}
                            <div className="mb-4">
                                <div className="flex justify-center items-center">
                                    <img 
                                        src={`/images/logos/${logo}`}
                                        alt={`Logo ${compania}`}
                                        className="h-16 md:h-20 w-auto max-w-[70%] object-contain"
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/images/logos/logo.webp';
                                        }}
                                    />
                                </div>
                            </div>      

                            {/* Info del usuario */}
                            <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur-sm rounded-full px-4 py-2">
                                <div className="h-8 w-8 rounded-full bg-white flex items-center justify-center">
                                    <User className="h-4 w-4 text-gray-700" />
                                </div>
                                <div className="text-left">
                                    <p className="font-semibold text-white text-sm">{nombre}</p>
                                    <p className="text-xs text-white/80">Usuario verificado</p>
                                </div>
                                
                            </div>

                            {/* Tarjeta verde de acceso confirmado */}
                            <div className="inline-flex items-center gap-2 bg-green-500 text-white rounded-full px-4 py-2 mb-1 mt-2">
                                <CheckCircle className="h-4 w-4" />
                                <span className="text-sm font-medium">Acceso autorizado confirmado</span>
                            </div>
                        </div>
                    </div>
                    
                    {/* Contenido */}
                    <div className="p-6">
                        {/* Temporizador y barra de progreso */}
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-50 border border-gray-200 mb-3">
                                <Loader2 className="h-4 w-4 text-gray-500 animate-spin" />
                                <span className="text-sm font-medium text-gray-600">
                                    Redirección en: <span className="font-bold text-gray-800">{timeLeft}s</span>
                                </span>
                            </div>
                            
                            {/* Barra de progreso */}
                            <div className="h-2 bg-gray-100 rounded-full overflow-hidden mb-2">
                                <div 
                                    className="h-full transition-all duration-1000 ease-out"
                                    style={{ 
                                        width: `${progress}%`,
                                        backgroundColor: theme.progressBar
                                    }}
                                />
                            </div>
                            <p className="text-sm text-gray-500">
                                {Math.round(progress)}% completado
                            </p>
                        </div>
                        
                        {/* Mensaje de estado */}
                        <div className="mb-6 p-4 rounded-lg border border-gray-200 bg-gray-50">
                            <div className="flex items-center gap-3">
                                <Shield className="h-5 w-5 text-gray-500" />
                                <div className="text-left flex-1">
                                    <p className="text-sm font-medium text-gray-800 mb-1">Estado del sistema</p>
                                    <p className="text-xs text-gray-600 animate-pulse">
                                        {statusMessage}
                                    </p>
                                </div>
                            </div>
                        </div>
                        
                        {/* Información simple de la compañía */}
                        <div className="p-4 rounded-lg border border-gray-200 bg-blue-50">
                            <div className="flex items-start gap-3">
                                <div 
                                    className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: colores.primary }}
                                >
                                    <Building2 className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800 mb-1">
                                        Sistema {compania} 2026
                                    </p>
                                    <p className="text-xs text-gray-600">
                                        Plataforma de gestión empresarial • Versión 0.1
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Pie de página simple */}
                    <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                <span className="text-xs font-medium text-gray-700">
                                    Conexión segura
                                </span>
                            </div>
                            <span className="text-xs text-gray-500">
                                {timeLeft}s restantes
                            </span>
                        </div>
                    </div>
                </div>
                
                {/* Botón para saltar espera (solo visible después de 2 segundos) */}
                {timeLeft > 10 && (
                    <div className="mt-4 text-center">
                        <button
                            onClick={() => window.location.href = redirect_to}
                            className="px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors hover:opacity-90"
                            style={{ 
                                backgroundColor: colores.secondary,
                            }}
                        >
                            Ingresar ahora
                        </button>
                        <p className="mt-2 text-xs text-gray-500">
                            Serás redirigido automáticamente en {timeLeft} segundos
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}