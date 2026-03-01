// resources/js/Components/WelcomeMessage.tsx
import { CheckCircle, Users, ShieldCheck, Clock } from 'lucide-react';
import React from 'react';

interface WelcomeMessageProps {
    userName?: string;
}

export default function WelcomeMessage({ userName }: WelcomeMessageProps) {
    return (
        <div className="bg-gradient-to-r from-sat-50 to-local-50 border border-sat-200 rounded-xl p-6 mb-6">
            <div className="flex items-start justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900 mb-2">
                        {userName ? `¡Bienvenido, ${userName}!` : '¡Bienvenido a LocalSat!'}
                    </h1>
                    <p className="text-gray-600 mb-4">
                        Sistema Intranet Corporativo - Acceso seguro verificado
                    </p>
                    
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="flex items-center gap-2">
                            <CheckCircle className="h-5 w-5 text-green-600" />
                            <span className="text-sm font-medium">Autenticado</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <ShieldCheck className="h-5 w-5 text-blue-600" />
                            <span className="text-sm font-medium">Sesión segura</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Clock className="h-5 w-5 text-purple-600" />
                            <span className="text-sm font-medium">Hora: {new Date().toLocaleTimeString('es-AR')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                            <Users className="h-5 w-5 text-sat" />
                            <span className="text-sm font-medium">Acceso autorizado</span>
                        </div>
                    </div>
                </div>
                <div className="hidden md:block">
                    <div className="h-12 w-12 rounded-full bg-local flex items-center justify-center">
                        <span className="text-white font-bold text-lg">LS</span>
                    </div>
                </div>
            </div>
        </div>
    );
}