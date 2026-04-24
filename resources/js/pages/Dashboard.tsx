import { Head, usePage } from '@inertiajs/react';
import React from 'react';

import AppLayout from '@/layouts/app-layout';
import { PageProps } from '@/types';


export default function Dashboard() {
    const { auth } = usePage<PageProps>().props;
    
    if (!auth?.user) {
        return (
            <AppLayout title="Dashboard">
                <div className="p-6">
                    <div className="text-center py-12">
                        <p className="text-gray-500">Cargando información del usuario...</p>
                    </div>
                </div>
            </AppLayout>
        );
    }
    
    const formatDate = (dateString: string) => {
        if (!dateString) return 'Primer ingreso';
        const date = new Date(dateString);
        return date.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: '2-digit',
            year: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    return (
        <AppLayout title="Dashboard">

            {/* Módulos Principales */}
            <div className="bg-white rounded-lg shadow-sm p-4">
                <h2 className="text-xl font-semibold text-gray-900 mb-3">
                    Módulos Principales
                </h2>
                
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <a href="/config/tarifas" className="p-4 rounded-lg border border-gray-200 hover:border-sat hover:bg-gray-50 transition-all text-center group">
                        <div className="h-14 w-14 bg-local-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <div className="h-10 w-10 bg-local rounded flex items-center justify-center">
                                <span className="text-white font-bold text-lg">T</span>
                            </div>
                        </div>
                        <div className="font-medium text-gray-900 text-base group-hover:text-local">
                            Tarifas
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                            Precios y abonos
                        </div>
                    </a>
                    
                    <a href="/comercial" className="p-4 rounded-lg border border-gray-200 hover:border-sat hover:bg-gray-50 transition-all text-center group">
                        <div className="h-14 w-14 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <div className="h-10 w-10 bg-sat rounded flex items-center justify-center">
                                <span className="text-white font-bold text-lg">C</span>
                            </div>
                        </div>
                        <div className="font-medium text-gray-900 text-base group-hover:text-sat">
                            Comercial
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                            Ventas y contratos
                        </div>
                    </a>
                    
                    <a href="/config/usuarios" className="p-4 rounded-lg border border-gray-200 hover:border-sat hover:bg-gray-50 transition-all text-center group">
                        <div className="h-14 w-14 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <div className="h-10 w-10 bg-local rounded flex items-center justify-center">
                                <span className="text-white font-bold text-lg">A</span>
                            </div>
                        </div>
                        <div className="font-medium text-gray-900 text-base group-hover:text-local">
                            Usuarios
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                            Gestión de accesos
                        </div>
                    </a>
                    
                    <a href="/rrhh" className="p-4 rounded-lg border border-gray-200 hover:border-sat hover:bg-gray-50 transition-all text-center group">
                        <div className="h-14 w-14 bg-purple-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                            <div className="h-10 w-10 bg-sat rounded flex items-center justify-center">
                                <span className="text-white font-bold text-lg">R</span>
                            </div>
                        </div>
                        <div className="font-medium text-gray-900 text-base group-hover:text-sat">
                            RR.HH
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                            Personal y recursos
                        </div>
                    </a>
                </div>
            </div>
        </AppLayout>
    );
}