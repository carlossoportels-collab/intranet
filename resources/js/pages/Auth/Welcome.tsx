// resources/js/Pages/Auth/Welcome.tsx
import { Head } from '@inertiajs/react';
import { User, Building2 } from 'lucide-react';
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
    const [timeLeft, setTimeLeft] = useState(3); 
    
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
        const countdownInterval = setInterval(() => {
            setTimeLeft(prev => {
                if (prev <= 1) {
                    clearInterval(countdownInterval);
                    setTimeout(() => {
                        window.location.href = redirect_to;
                    }, 300);
                    return 0;
                }
                return prev - 1;
            });
        }, 1000);
        
        return () => {
            clearInterval(countdownInterval);
        };
    }, [redirect_to]);
    
    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-space relative overflow-hidden">
            <Head title={`Bienvenido a ${compania}`} />
            
            {/* Contenedor de estrellas */}
            <div id="star-container"></div>
            
            <div className="relative w-full max-w-md z-10 animate-fadeIn">
                {/* Tarjeta principal */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-200">
                    {/* HEADER NARANJA SUAVE */}
                    <div className="bg-orange-50 p-8 text-center relative overflow-hidden border-b border-orange-100">
                        {/* Línea decorativa inferior naranja */}
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-sat"></div>
                        
                        {/* Logo de la compañía */}
                        <div className="mb-6">
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

                        {/* Info del usuario - versión simplificada */}
                        <div className="inline-flex items-center gap-3 bg-white/80 backdrop-blur-sm rounded-full px-6 py-3 border border-orange-200 shadow-sm">
                            <div className="h-10 w-10 rounded-full bg-sat flex items-center justify-center shadow-sm">
                                <User className="h-5 w-5 text-white" />
                            </div>
                            <div className="text-left">
                                <p className="font-semibold text-sat-700 text-base">{nombre}</p>
                                <p className="text-xs text-sat-600">Acceso autorizado</p>
                            </div>
                        </div>
                    </div>
                    
                    {/* Contenido - SIMPLIFICADO */}
                    <div className="p-8">
                        {/* Solo indicador de redirección */}
                        <div className="text-center mb-6">
                            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gray-100 border border-gray-200">
                                <span className="text-sm text-gray-600">
                                    Redirigiendo en {timeLeft}s
                                </span>
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
                    
                    {/* Pie de página simplificado */}
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                        <div className="flex items-center justify-center gap-2">
                            <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                            <span className="text-xs text-gray-600">
                                Conectado
                            </span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}