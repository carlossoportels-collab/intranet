// resources/js/Pages/Auth/Login.tsx
import { Head, useForm } from '@inertiajs/react';
import { Lock, Eye, EyeOff, Shield } from 'lucide-react';
import React, { useState, useEffect } from 'react';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        acceso: '',
        password: '',
        remember: false,
    });

    useEffect(() => {
        // Crear estrellas al montar el componente
        const starContainer = document.getElementById('star-container');
        if (starContainer) {
            // Limpiar contenido previo
            starContainer.innerHTML = '';

            // Crear estrellas fijas
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

            // Función para crear estrellas fugaces
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

            // Crear algunas estrellas fugaces iniciales
            for (let i = 0; i < 3; i++) {
                setTimeout(createShootingStar, i * 300);
            }

            // Intervalo regular para estrellas fugaces
            const interval = setInterval(createShootingStar, 2000);

            return () => {
                clearInterval(interval);
                if (starContainer) {
                    starContainer.innerHTML = '';
                }
            };
        }
    }, []);

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-space relative overflow-hidden">
            <Head title="Login" />
            
            {/* Contenedor de estrellas */}
            <div id="star-container"></div>

            {/* Contenedor principal */}
            <div className="relative w-full max-w-md animate-fadeIn z-10">
                {/* Tarjeta de login */}
                <div className="bg-white/95 backdrop-blur-sm rounded-3xl shadow-2xl overflow-hidden border border-gray-200">

                {/* HEADER NARANJA SUAVE */}
                <div className="bg-orange-50 p-8 text-center relative overflow-hidden border-b border-orange-100">
                    {/* Línea decorativa inferior naranja más intensa */}
                    <div className="absolute bottom-0 left-0 right-0 h-1 bg-sat"></div>
                    
                    <div className="inline-flex items-center justify-center h-16 w-16 rounded-full bg-sat mb-4 shadow-sm">
                        <Lock className="h-7 w-7 text-white" />
                    </div>
                    
                    <h1 className="text-2xl font-bold text-local-800 mb-2 tracking-tight">
                        ACCESO INTRANET
                    </h1>
                    <p className="text-local-700 font-medium">
                        Ingrese sus credenciales autorizadas
                    </p>
                </div>

                    {/* Formulario */}
                    <div className="p-8">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Campo Acceso */}
                            <div>
                                <label className="block text-sm font-semibold text-local mb-2">
                                    Acceso
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        name="acceso"
                                        value={data.acceso}
                                        onChange={(e) => setData('acceso', e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl 
                                                   focus:border-sat focus:ring-2 focus:ring-sat/20 
                                                   bg-white transition-all duration-200
                                                   placeholder:text-gray-400 text-gray-900"
                                        placeholder="Usuario o identificador"
                                        autoComplete="username"
                                        required
                                    />
                                </div>
                                {errors.acceso && (
                                    <p className="mt-1 text-sm text-red-600">{errors.acceso}</p>
                                )}
                            </div>

                            {/* Campo Contraseña */}
                            <div>
                                <label className="block text-sm font-semibold text-local mb-2">
                                    Contraseña
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <Lock className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        name="password"
                                        value={data.password}
                                        onChange={(e) => setData('password', e.target.value)}
                                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-xl 
                                                   focus:border-sat focus:ring-2 focus:ring-sat/20 
                                                   bg-white transition-all duration-200
                                                   placeholder:text-gray-400 text-gray-900"
                                        placeholder="••••••••"
                                        autoComplete="current-password"
                                        required
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center 
                                                   text-gray-500 hover:text-sat transition-colors"
                                    >
                                        {showPassword ? (
                                            <EyeOff className="h-5 w-5" />
                                        ) : (
                                            <Eye className="h-5 w-5" />
                                        )}
                                    </button>
                                </div>
                                {errors.password && (
                                    <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                                )}
                            </div>

                            {/* Recordar sesión */}
                            <div className="flex items-center">
                                <input
                                    type="checkbox"
                                    id="remember"
                                    checked={data.remember}
                                    onChange={(e) => setData('remember', e.target.checked)}
                                    className="h-4 w-4 text-sat focus:ring-2 focus:ring-sat/50 
                                               border-gray-300 rounded cursor-pointer"
                                />
                                <label htmlFor="remember" className="ml-2 block text-sm text-gray-600 cursor-pointer">
                                    Recordar esta sesión
                                </label>
                            </div>

                            {/* Botón de Ingreso */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-sat text-white py-3 px-4 rounded-xl font-bold text-base
                                           hover:bg-sat-600 focus:outline-none focus:ring-2 focus:ring-sat/30
                                           transition-all duration-200 
                                           disabled:opacity-70 disabled:cursor-not-allowed
                                           shadow-md hover:shadow-lg shadow-sat/20"
                            >
                                {processing ? (
                                    <div className="flex items-center justify-center gap-2">
                                        <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                        <span>VERIFICANDO ACCESO...</span>
                                    </div>
                                ) : (
                                    <div className="flex items-center justify-center gap-2">
                                        <Shield className="h-5 w-5" />
                                        <span>INGRESAR</span>
                                    </div>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Pie de página */}
                    <div className="px-8 py-4 bg-gray-50 border-t border-gray-200">
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