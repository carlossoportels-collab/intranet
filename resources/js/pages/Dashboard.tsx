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
            {/* Header con datos reales del usuario */}
            <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    ¡Bienvenido, {auth.user.nombre_usuario}!
                </h1>
                <p className="mt-1 text-gray-600 text-base">
                    Panel de Control LocalSat - Sistema de gestión empresarial
                </p>
                <p className="mt-1 text-sm text-gray-500">
                    Último acceso: {formatDate(auth.user.ultimo_acceso)}
                </p>
            </div>
            
            {/* Grid de estadísticas */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
                {/* Tarjeta 1 - Usuarios */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-sat transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-base font-medium text-gray-700">
                                Usuarios Activos
                            </p>
                            <p className="text-3xl font-bold text-local mt-1">
                                24
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-local-100 rounded-lg flex items-center justify-center">
                            <div className="h-9 w-9 bg-sat rounded-md flex items-center justify-center">
                                <span className="text-white font-bold text-sm">U</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center mt-2 text-sm">
                        <span className="text-green-600 font-medium">
                            ↑ 12%
                        </span>
                        <span className="text-gray-500 ml-2">este mes</span>
                    </div>
                </div>
                
                {/* Tarjeta 2 - Empresas */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-sat transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-base font-medium text-gray-700">
                                Empresas
                            </p>
                            <p className="text-3xl font-bold text-local mt-1">
                                156
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-local-100 rounded-lg flex items-center justify-center">
                            <div className="h-9 w-9 bg-sat rounded-md flex items-center justify-center">
                                <span className="text-white font-bold text-sm">E</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center mt-2 text-sm">
                        <span className="text-green-600 font-medium">
                            ↑ 8%
                        </span>
                        <span className="text-gray-500 ml-2">este trimestre</span>
                    </div>
                </div>
                
                {/* Tarjeta 3 - Contratos */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-sat transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-base font-medium text-gray-700">
                                Contratos Activos
                            </p>
                            <p className="text-3xl font-bold text-local mt-1">
                                89
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-local-100 rounded-lg flex items-center justify-center">
                            <div className="h-9 w-9 bg-sat rounded-md flex items-center justify-center">
                                <span className="text-white font-bold text-sm">C</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center mt-2 text-sm">
                        <span className="text-green-600 font-medium">
                            ↑ 5%
                        </span>
                        <span className="text-gray-500 ml-2">este mes</span>
                    </div>
                </div>
                
                {/* Tarjeta 4 - Presupuestos */}
                <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-sat transition-all">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="text-base font-medium text-gray-700">
                                Presupuestos Pend.
                            </p>
                            <p className="text-3xl font-bold text-local mt-1">
                                47
                            </p>
                        </div>
                        <div className="h-12 w-12 bg-local-100 rounded-lg flex items-center justify-center">
                            <div className="h-9 w-9 bg-sat rounded-md flex items-center justify-center">
                                <span className="text-white font-bold text-sm">P</span>
                            </div>
                        </div>
                    </div>
                    <div className="flex items-center mt-2 text-sm">
                        <span className="text-red-600 font-medium">
                            ↓ 3%
                        </span>
                        <span className="text-gray-500 ml-2">esta semana</span>
                    </div>
                </div>
            </div>
            
            {/* Dos columnas */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 mb-4">
                {/* Actividad Reciente */}
                <div className="lg:col-span-2 bg-white rounded-lg shadow-sm p-4">
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-xl font-semibold text-gray-900">
                            Actividad Reciente
                        </h2>
                        <button className="px-4 py-2 bg-sat text-white text-base rounded hover:bg-sat-600 transition-colors">
                            Ver Todo
                        </button>
                    </div>
                    
                    <div className="space-y-2">
                        <div className="flex items-center p-3 hover:bg-gray-50 rounded transition-colors">
                            <div className="h-10 w-10 bg-green-100 rounded flex items-center justify-center mr-3">
                                <span className="text-green-600">✓</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900 text-base">
                                    Sesión iniciada
                                </p>
                                <p className="text-sm text-gray-600">
                                    Usuario: {auth.user.nombre_usuario}
                                </p>
                            </div>
                            <div className="text-sm text-gray-500">Ahora</div>
                        </div>
                        
                        <div className="flex items-center p-3 hover:bg-gray-50 rounded transition-colors">
                            <div className="h-10 w-10 bg-blue-100 rounded flex items-center justify-center mr-3">
                                <span className="text-blue-600">$</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900 text-base">
                                    Nuevo Contrato generado
                                </p>
                                <p className="text-sm text-gray-600">
                                    Domvil S.A
                                </p>
                            </div>
                            <div className="text-sm text-gray-500">Hoy</div>
                        </div>
                        
                        <div className="flex items-center p-3 hover:bg-gray-50 rounded transition-colors">
                            <div className="h-10 w-10 bg-yellow-100 rounded flex items-center justify-center mr-3">
                                <span className="text-yellow-600">⏰</span>
                            </div>
                            <div className="flex-1">
                                <p className="font-medium text-gray-900 text-base">
                                    Recordatorios
                                </p>
                                <p className="text-sm text-gray-600">
                                    5 recordatorios pendientes
                                </p>
                            </div>
                            <div className="text-sm text-gray-500">Hoy</div>
                        </div>
                    </div>
                </div>
                
                {/* Accesos Rápidos */}
                <div className="bg-white rounded-lg shadow-sm p-4">
                    <h2 className="text-xl font-semibold text-gray-900 mb-3">
                        Accesos Rápidos
                    </h2>
                    
                    <div className="space-y-2">
                        <a href="/comercial/presupuestos" className="block w-full text-left p-3 rounded bg-local-50 hover:bg-local-100 transition-colors group">
                            <div className="font-medium text-local text-base group-hover:text-local-800">
                                Crear presupuesto
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                                Generar nueva cotización
                            </div>
                        </a>
                        
                        <a href="/comercial/contactos" className="block w-full text-left p-3 rounded bg-sat-50 hover:bg-sat-100 transition-colors group">
                            <div className="font-medium text-sat-700 text-base group-hover:text-sat-800">
                                Agregar contacto
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                                Nuevo cliente o proveedor
                            </div>
                        </a>
                        
                        <a href="/comercial/cuentas" className="block w-full text-left p-3 rounded bg-green-50 hover:bg-green-100 transition-colors group">
                            <div className="font-medium text-green-700 text-base group-hover:text-green-800">
                                Ver cuentas
                            </div>
                            <div className="text-sm text-gray-600 mt-1">
                                Gestionar empresas
                            </div>
                        </a>
                    </div>
                </div>
            </div>
            
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