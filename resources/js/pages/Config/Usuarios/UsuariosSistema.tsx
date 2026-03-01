// resources/js/Pages/Config/Usuarios/UsuariosSistema.tsx
import React, { useState } from 'react';

import AppLayout from '@/layouts/app-layout';

interface Usuario {
    id: number;
    nombre: string;
    email: string;
    rol: string;
    ultimo_acceso: string;
    estado: string;
    telefono?: string;
}

export default function UsuariosSistema() {
    const [usuarios] = useState<Usuario[]>([
        { id: 1, nombre: 'María López', email: 'maria@localsat.com', rol: 'Administrador', ultimo_acceso: '2024-01-15 14:30', estado: 'Activo', telefono: '+54 11 1234-5678' },
        { id: 2, nombre: 'Juan Pérez', email: 'juan@localsat.com', rol: 'Comercial', ultimo_acceso: '2024-01-15 10:15', estado: 'Activo', telefono: '+54 11 2345-6789' },
        { id: 3, nombre: 'Carlos Gómez', email: 'carlos@localsat.com', rol: 'Operativo', ultimo_acceso: '2024-01-14 16:45', estado: 'Activo', telefono: '+54 11 3456-7890' },
        { id: 4, nombre: 'Ana Rodríguez', email: 'ana@localsat.com', rol: 'RRHH', ultimo_acceso: '2024-01-13 09:20', estado: 'Inactivo', telefono: '+54 11 4567-8901' },
        { id: 5, nombre: 'Luis Martínez', email: 'luis@localsat.com', rol: 'Comercial', ultimo_acceso: '2024-01-15 11:30', estado: 'Activo', telefono: '+54 11 5678-9012' },
    ]);

    const getRolColor = (rol: string) => {
        switch (rol) {
            case 'Administrador': return 'bg-red-100 text-red-800';
            case 'Comercial': return 'bg-blue-100 text-blue-800';
            case 'Operativo': return 'bg-green-100 text-green-800';
            case 'RRHH': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AppLayout title="Usuarios del Sistema">
            <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    Usuarios del Sistema
                </h1>
                <p className="mt-1 text-gray-600 text-base">
                    Gestión de usuarios y acceso a la plataforma
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">
                            Usuarios Registrados
                        </h2>
                        <p className="text-sm text-gray-600">
                            Administre los usuarios con acceso al sistema
                        </p>
                    </div>
                    <button className="px-4 py-2 bg-sat text-white text-sm rounded hover:bg-sat-600 transition-colors">
                        + Nuevo Usuario
                    </button>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 rounded border border-blue-100">
                        <div className="text-sm font-medium text-blue-700">Total usuarios</div>
                        <div className="text-2xl font-bold text-blue-900">{usuarios.length}</div>
                    </div>
                    <div className="p-4 bg-green-50 rounded border border-green-100">
                        <div className="text-sm font-medium text-green-700">Activos</div>
                        <div className="text-2xl font-bold text-green-900">
                            {usuarios.filter(u => u.estado === 'Activo').length}
                        </div>
                    </div>
                    <div className="p-4 bg-purple-50 rounded border border-purple-100">
                        <div className="text-sm font-medium text-purple-700">Roles diferentes</div>
                        <div className="text-2xl font-bold text-purple-900">
                            {new Set(usuarios.map(u => u.rol)).size}
                        </div>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded border border-yellow-100">
                        <div className="text-sm font-medium text-yellow-700">Conectados hoy</div>
                        <div className="text-2xl font-bold text-yellow-900">
                            {usuarios.filter(u => {
                                const fechaAcceso = new Date(u.ultimo_acceso);
                                const hoy = new Date();
                                return fechaAcceso.toDateString() === hoy.toDateString();
                            }).length}
                        </div>
                    </div>
                </div>

                {/* Desktop Table */}
                <div className="hidden md:block overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">ID</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Usuario</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Email</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Rol</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Teléfono</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Último Acceso</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Estado</th>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {usuarios.map((usuario) => (
                                <tr key={usuario.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4">{usuario.id}</td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center">
                                            <div className="h-8 w-8 rounded-full bg-local flex items-center justify-center text-white font-semibold mr-3">
                                                {usuario.nombre.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="font-medium">{usuario.nombre}</div>
                                                <div className="text-xs text-gray-500">Usuario #{usuario.id}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex items-center">
                                            <div className="mr-2 text-gray-400">✉️</div>
                                            <span className="text-gray-600">{usuario.email}</span>
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${getRolColor(usuario.rol)}`}>
                                            {usuario.rol}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        {usuario.telefono || 'No especificado'}
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="text-gray-600">
                                            {new Date(usuario.ultimo_acceso).toLocaleDateString('es-ES', {
                                                day: '2-digit',
                                                month: '2-digit',
                                                year: 'numeric',
                                                hour: '2-digit',
                                                minute: '2-digit'
                                            })}
                                        </div>
                                    </td>
                                    <td className="py-3 px-4">
                                        <span className={`px-2 py-1 text-xs rounded-full ${usuario.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                            {usuario.estado}
                                        </span>
                                    </td>
                                    <td className="py-3 px-4">
                                        <div className="flex gap-2">
                                            <button className="text-sat hover:text-sat-600 text-sm">
                                                Editar
                                            </button>
                                            <button className="text-gray-600 hover:text-gray-900 text-sm">
                                                {usuario.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                                            </button>
                                            <button className="text-gray-600 hover:text-gray-900 text-sm">
                                                Reestablecer
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-4">
                    {usuarios.map((usuario) => (
                        <div key={usuario.id} className="p-4 border border-gray-200 rounded-lg hover:border-sat transition-colors">
                            <div className="flex items-start mb-4">
                                <div className="h-10 w-10 rounded-full bg-local flex items-center justify-center text-white font-semibold mr-3">
                                    {usuario.nombre.charAt(0)}
                                </div>
                                <div className="flex-1">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <div className="font-medium text-gray-900">{usuario.nombre}</div>
                                            <div className="text-sm text-gray-600">{usuario.email}</div>
                                        </div>
                                        <div className="flex flex-col items-end gap-1">
                                            <span className={`px-2 py-1 text-xs rounded-full ${getRolColor(usuario.rol)}`}>
                                                {usuario.rol}
                                            </span>
                                            <span className={`px-2 py-1 text-xs rounded-full ${usuario.estado === 'Activo' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                                {usuario.estado}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3 mb-4">
                                <div>
                                    <div className="text-sm text-gray-600">Teléfono</div>
                                    <div className="font-medium">{usuario.telefono || 'No especificado'}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Último acceso</div>
                                    <div className="font-medium text-sm">
                                        {new Date(usuario.ultimo_acceso).toLocaleDateString('es-ES')}
                                    </div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">ID</div>
                                    <div className="font-medium">#{usuario.id}</div>
                                </div>
                                <div>
                                    <div className="text-sm text-gray-600">Conectado hoy</div>
                                    <div className="font-medium">
                                        {new Date(usuario.ultimo_acceso).toDateString() === new Date().toDateString() ? 'Sí' : 'No'}
                                    </div>
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button className="flex-1 px-3 py-1.5 text-sm text-sat border border-sat rounded hover:bg-sat-50 transition-colors">
                                    Editar
                                </button>
                                <button className="flex-1 px-3 py-1.5 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                                    {usuario.estado === 'Activo' ? 'Desactivar' : 'Activar'}
                                </button>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Quick Actions */}
                <div className="mt-8 p-4 bg-gray-50 rounded border">
                    <h3 className="font-medium text-gray-900 mb-3">Acciones Rápidas</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <button className="p-3 bg-white rounded border border-gray-200 hover:border-sat transition-colors text-left">
                            <div className="font-medium text-gray-900 mb-1">Importar usuarios</div>
                            <div className="text-sm text-gray-600">Desde archivo CSV/Excel</div>
                        </button>
                        <button className="p-3 bg-white rounded border border-gray-200 hover:border-sat transition-colors text-left">
                            <div className="font-medium text-gray-900 mb-1">Exportar lista</div>
                            <div className="text-sm text-gray-600">Generar reporte PDF/Excel</div>
                        </button>
                        <button className="p-3 bg-white rounded border border-gray-200 hover:border-sat transition-colors text-left">
                            <div className="font-medium text-gray-900 mb-1">Auditoría de acceso</div>
                            <div className="text-sm text-gray-600">Ver historial completo</div>
                        </button>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}