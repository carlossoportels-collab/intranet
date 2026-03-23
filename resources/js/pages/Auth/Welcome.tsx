// resources/js/Pages/Auth/Welcome.tsx
import { Head, router } from '@inertiajs/react';
import { User, Building2, CheckCircle, Shield, Clock, Loader2 } from 'lucide-react';
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
    const [currentStep, setCurrentStep] = useState(0);
    
    const steps = [
        { text: "Validando credenciales...", icon: Shield, color: "text-purple-500" },
        { text: "Cargando información de usuario...", icon: User, color: "text-blue-500" },
        { text: "Preparando el sistema...", icon: Clock, color: "text-green-500" },
        { text: "Cargando datos...", icon: Loader2, color: "text-sat" },
    ];
    
    useEffect(() => {
        // Crear estrellas al montar el componente
        const starContainer = document.getElementById('star-container');
        if (starContainer) {
            starContainer.innerHTML = '';

            const starCount = 50;
            for (let i = 0; i < starCount; i++) {
                const star = document.createElement('div');
                star.className = 'star-bright';
                const size = Math.random() * 3 + 1 + 'px';
                star.style.width = size;
                star.style.height = size;
                star.style.left = Math.random() * 100 + '%';
                star.style.top = Math.random() * 100 + '%';
                star.style.setProperty('--duration', (2 + Math.random() * 4) + 's');
                star.style.animationDelay = Math.random() * 5 + 's';
                starContainer.appendChild(star);
            }

            function createShootingStar() {
                if (!starContainer) return;
                const shootingStar = document.createElement('div');
                shootingStar.className = 'shooting-star';
                shootingStar.style.left = (50 + Math.random() * 50) + '%';
                shootingStar.style.top = (Math.random() * 50) + '%';
                shootingStar.style.animationDuration = (2 + Math.random() * 2) + 's';
                starContainer.appendChild(shootingStar);
                
                setTimeout(() => {
                    if (shootingStar.parentNode) {
                        shootingStar.remove();
                    }
                }, 3000);
            }

            for (let i = 0; i < 3; i++) {
                setTimeout(createShootingStar, i * 300);
            }

            const interval = setInterval(createShootingStar, 2000);

            return () => {
                clearInterval(interval);
                if (starContainer) {
                    starContainer.innerHTML = '';
                }
            };
        }
    }, []);
    
    useEffect(() => {
        // Cambiar paso cada 800ms
        const stepInterval = setInterval(() => {
            setCurrentStep(prev => {
                if (prev < steps.length - 1) {
                    return prev + 1;
                }
                return prev;
            });
        }, 800);
        
        // Redirigir después de 3 segundos
        const timer = setTimeout(() => {
            router.visit(redirect_to);
        }, 3200);
        
        return () => {
            clearInterval(stepInterval);
            clearTimeout(timer);
        };
    }, [redirect_to, steps.length]);
    
    const CurrentIcon = steps[currentStep]?.icon || Loader2;
    const currentStepText = steps[currentStep]?.text || "Procesando...";
    const currentStepColor = steps[currentStep]?.color || "text-sat";
    
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-space relative overflow-hidden">
            <Head title={`Bienvenido a ${compania}`} />
            
            {/* Contenedor de estrellas */}
            <div id="star-container"></div>
            
            <div className="relative w-full max-w-md z-10 animate-fadeIn">
                {/* Tarjeta de bienvenida */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
                    
                    {/* HEADER */}
                    <div className="bg-orange-50 p-8 text-center relative overflow-hidden border-b border-orange-100">
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-sat"></div>
                        
                        <div className="mb-4">
                            <div className="flex justify-center items-center">
                                <img 
                                    src={`/images/logos/${logo}`}
                                    alt={`Logo ${compania}`}
                                    className="h-16 md:h-20 w-auto max-w-[70%] object-contain"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = '/images/logos/logo.png';
                                    }}
                                />
                            </div>
                        </div>
                        
                        <h1 className="text-2xl font-bold text-local-800 mb-2 tracking-tight">
                            ACCESO EXITOSO
                        </h1>
                        <p className="text-local-700 font-medium">
                            Bienvenido a la Intranet
                        </p>
                    </div>
                    
                    {/* Contenido principal */}
                    <div className="p-8">
                        {/* Info del usuario */}
                        <div className="flex items-center justify-center gap-3 mb-8">
                            <div className="h-12 w-12 rounded-full bg-sat flex items-center justify-center shadow-sm">
                                <User className="h-6 w-6 text-white" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-gray-900 text-lg">{nombre}</p>
                                <p className="text-xs text-gray-500">Acceso autorizado</p>
                            </div>
                        </div>
                        
                        {/* Animación de carga */}
                        <div className="mb-6">
                            <div className="bg-gray-50 rounded-xl p-5 border border-gray-200">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className={`${currentStepColor} animate-pulse`}>
                                        <CurrentIcon className={`h-5 w-5 ${currentStep === steps.length - 1 ? 'animate-spin' : ''}`} />
                                    </div>
                                    <span className="text-sm font-medium text-gray-700">
                                        {currentStepText}
                                    </span>
                                </div>
                                
                                {/* Barra de progreso */}
                                <div className="w-full bg-gray-200 rounded-full h-1.5 overflow-hidden">
                                    <div 
                                        className="bg-sat h-1.5 rounded-full transition-all duration-300 ease-out"
                                        style={{ width: `${(currentStep + 1) * (100 / steps.length)}%` }}
                                    ></div>
                                </div>
                            </div>
                        </div>
                        
                        {/* Información de la compañía */}
                        <div className="p-4 rounded-xl border border-gray-200 bg-gray-50">
                            <div className="flex items-center gap-3">
                                <div 
                                    className="h-8 w-8 rounded-full flex items-center justify-center flex-shrink-0"
                                    style={{ backgroundColor: colores.primary }}
                                >
                                    <Building2 className="h-4 w-4 text-white" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium text-gray-800">
                                        Sistema INTRANET 2026
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        v1.0
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Pie de página */}
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-xs font-medium text-gray-700">
                                    Conexión segura
                                </span>
                            </div>
                            <span className="text-xs font-bold text-local">
                                v1.0
                            </span>
                        </div>
                    </div>
                </div>
                
                {/* Mensaje de copyright */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-white/70 font-medium">
                        © {new Date().getFullYear()} - Intranet
                    </p>
                </div>
            </div>
        </div>
    );
}