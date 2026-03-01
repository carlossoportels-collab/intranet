// resources/js/Pages/Auth/Login.tsx
import { Head, useForm, Link } from '@inertiajs/react';
import { Lock, Eye, EyeOff, Shield } from 'lucide-react';
import React, { useState } from 'react';

export default function Login() {
    const [showPassword, setShowPassword] = useState(false);
    const { data, setData, post, processing, errors } = useForm({
        acceso: '',
        password: '',
        remember: false,
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/login');
    };

    return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-local-900 relative overflow-hidden">
            <Head title="Login" />
            
            {/* Patrón de fondo sutil CSS */}
            <div className="absolute inset-0 opacity-10"
                style={{
                    backgroundImage: `
                        linear-gradient(45deg, var(--color-local-800) 25%, transparent 25%),
                        linear-gradient(-45deg, var(--color-local-800) 25%, transparent 25%),
                        linear-gradient(45deg, transparent 75%, var(--color-local-800) 75%),
                        linear-gradient(-45deg, transparent 75%, var(--color-local-800) 75%)
                    `,
                    backgroundSize: '60px 60px',
                    backgroundPosition: '0 0, 0 30px, 30px -30px, -30px 0px'
                }}>
            </div>

            {/* Contenedor principal */}
            <div className="relative w-full max-w-md animate-fadeIn">
                {/* Tarjeta de login */}
                <div className="bg-white/95 backdrop-blur-sm rounded-xl shadow-2xl overflow-hidden border border-gray-200">
                    {/* Encabezado */}
                    <div className="bg-local p-8 text-center relative">
                        <div className="absolute bottom-0 left-0 right-0 h-1 bg-sat"></div>
                        
                        <div className="inline-flex items-center justify-center h-14 w-14 rounded-full bg-white/10 backdrop-blur-sm border border-white/20 mb-4">
                            <Lock className="h-7 w-7 text-white" />
                        </div>
                        
                        <h1 className="text-2xl font-bold text-white mb-2 tracking-tight">
                            ACCESO INTRANET
                        </h1>
                        <p className="text-local-100 font-medium">
                            Ingrese sus credenciales autorizadas
                        </p>
                    </div>

                    {/* Formulario */}
                    <div className="p-6">
                        <form onSubmit={handleSubmit} className="space-y-5">
                            {/* Campo Acceso */}
                            <div>
                                <label className="block text-sm font-semibold text-local mb-2">
                                    Acceso
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                                        </svg>
                                    </div>
                                    <input
                                        type="text"
                                        name="acceso"
                                        value={data.acceso}
                                        onChange={(e) => setData('acceso', e.target.value)}
                                        className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg 
                                                   focus:border-sat focus:ring-2 focus:ring-sat/20 
                                                   bg-white transition-all duration-200
                                                   placeholder:text-gray-400 text-gray-900"
                                        placeholder="Usuario o identificador"
                                        required
                                        autoComplete="username"
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
                                        className="w-full pl-10 pr-12 py-3 border border-gray-300 rounded-lg 
                                                   focus:border-sat focus:ring-2 focus:ring-sat/20 
                                                   bg-white transition-all duration-200
                                                   placeholder:text-gray-400 text-gray-900"
                                        placeholder="••••••••"
                                        required
                                        autoComplete="current-password"
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute inset-y-0 right-0 pr-3 flex items-center 
                                                   text-gray-500 hover:text-sat transition-colors"
                                        aria-label={showPassword ? "Ocultar contraseña" : "Mostrar contraseña"}
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
                                <label htmlFor="remember" className="ml-2 block text-sm text-gray-700 cursor-pointer">
                                    Recordar esta sesión
                                </label>
                            </div>

                            {/* Botón de Ingreso */}
                            <button
                                type="submit"
                                disabled={processing}
                                className="w-full bg-sat text-white py-3 px-4 rounded-lg font-bold text-base
                                           hover:bg-sat-600 focus:outline-none focus:ring-2 focus:ring-sat/30
                                           active:scale-[0.98] transition-all duration-200 
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
                                        <span>INGRESAR A LA INTRANET</span>
                                    </div>
                                )}
                            </button>
                        </form>
                    </div>

                    {/* Pie de tarjeta */}
                    <div className="px-6 py-3 bg-gray-50 border-t border-gray-200">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="h-2 w-2 rounded-full bg-green-500"></div>
                                <span className="text-xs font-medium text-gray-700">
                                    Conexión segura
                                </span>
                            </div>
                            <span className="text-xs font-bold text-local">
                                v0.1
                            </span>
                        </div>
                    </div>
                </div>

                {/* Mensaje de copyright */}
                <div className="mt-6 text-center">
                    <p className="text-sm text-white/90 font-medium">
                        © {new Date().getFullYear()} - Intranet
                    </p>
                </div>
            </div>
        </div>
    );
}