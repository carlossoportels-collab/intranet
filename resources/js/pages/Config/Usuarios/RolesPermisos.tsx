// resources/js/Pages/Config/Usuarios/RolesPermisos.tsx
import React, { useState } from 'react';

import AppLayout from '@/layouts/app-layout';

interface Rol {
    id: number;
    nombre: string;
    descripcion: string;
    usuarios_asignados: number;
    permisos: number;
    fecha_creacion: string;
    estado: string;
}

interface Permiso {
    id: number;
    modulo: string;
    nombre: string;
    descripcion: string;
    asignado: boolean;
}

export default function RolesPermisos() {
    const [roles] = useState<Rol[]>([
        { id: 1, nombre: 'Administrador', descripcion: 'Acceso total al sistema', usuarios_asignados: 3, permisos: 42, fecha_creacion: '2023-01-15', estado: 'Activo' },
        { id: 2, nombre: 'Comercial', descripcion: 'Gestión comercial y ventas', usuarios_asignados: 8, permisos: 28, fecha_creacion: '2023-02-20', estado: 'Activo' },
        { id: 3, nombre: 'Operativo', descripcion: 'Operaciones y seguimiento', usuarios_asignados: 12, permisos: 22, fecha_creacion: '2023-03-10', estado: 'Activo' },
        { id: 4, nombre: 'RRHH', descripcion: 'Gestión de personal', usuarios_asignados: 2, permisos: 18, fecha_creacion: '2023-04-05', estado: 'Activo' },
        { id: 5, nombre: 'Consulta', descripcion: 'Solo lectura', usuarios_asignados: 5, permisos: 15, fecha_creacion: '2023-05-15', estado: 'Inactivo' },
    ]);

    const [permisos] = useState<Permiso[]>([
        { id: 1, modulo: 'Dashboard', nombre: 'Ver dashboard', descripcion: 'Acceso al panel principal', asignado: true },
        { id: 2, modulo: 'Gestión Comercial', nombre: 'Crear contactos', descripcion: 'Agregar nuevos contactos', asignado: true },
        { id: 3, modulo: 'Gestión Comercial', nombre: 'Editar contactos', descripcion: 'Modificar información de contactos', asignado: true },
        { id: 4, modulo: 'Configuración', nombre: 'Administrar usuarios', descripcion: 'Gestión completa de usuarios', asignado: false },
        { id: 5, modulo: 'Configuración', nombre: 'Editar parámetros', descripcion: 'Modificar configuración del sistema', asignado: false },
        { id: 6, modulo: 'Tarifas', nombre: 'Ver tarifas', descripcion: 'Consulta de precios', asignado: true },
        { id: 7, modulo: 'Tarifas', nombre: 'Modificar tarifas', descripcion: 'Edición de precios y abonos', asignado: false },
        { id: 8, modulo: 'RRHH', nombre: 'Ver personal', descripcion: 'Consulta de información de personal', asignado: true },
        { id: 9, modulo: 'RRHH', nombre: 'Gestionar personal', descripcion: 'Administración completa de RRHH', asignado: false },
    ]);

    const [selectedRol, setSelectedRol] = useState<Rol>(roles[0]);

    const getRolColor = (nombre: string) => {
        switch (nombre) {
            case 'Administrador': return 'bg-red-100 text-red-800';
            case 'Comercial': return 'bg-blue-100 text-blue-800';
            case 'Operativo': return 'bg-green-100 text-green-800';
            case 'RRHH': return 'bg-purple-100 text-purple-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <AppLayout title="Roles y Permisos">
            <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    Roles y Permisos
                </h1>
                <p className="mt-1 text-gray-600 text-base">
                    Gestión de roles y permisos de acceso al sistema
                </p>
            </div>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Column - Roles List */}
                <div className="lg:col-span-1">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-lg font-semibold text-gray-900">Roles del Sistema</h2>
                            <button className="px-3 py-1.5 bg-sat text-white text-sm rounded hover:bg-sat-600 transition-colors">
                                + Nuevo Rol
                            </button>
                        </div>

                        <div className="space-y-3">
                            {roles.map((rol) => (
                                <button
                                    key={rol.id}
                                    onClick={() => setSelectedRol(rol)}
                                    className={`w-full text-left p-4 rounded-lg border transition-colors ${
                                        selectedRol.id === rol.id 
                                            ? 'border-sat bg-sat-50' 
                                            : 'border-gray-200 hover:border-sat hover:bg-gray-50'
                                    }`}
                                >
                                    <div className="flex justify-between items-start mb-2">
                                        <div className="flex items-center">
                                            <div className={`h-3 w-3 rounded-full mr-2 ${
                                                rol.estado === 'Activo' ? 'bg-green-500' : 'bg-gray-400'
                                            }`}></div>
                                            <div className="font-medium text-gray-900">{rol.nombre}</div>
                                        </div>
                                        <span className={`px-2 py-1 text-xs rounded-full ${getRolColor(rol.nombre)}`}>
                                            {rol.usuarios_asignados} usuarios
                                        </span>
                                    </div>
                                    <div className="text-sm text-gray-600 mb-3">{rol.descripcion}</div>
                                    <div className="flex justify-between text-xs text-gray-500">
                                        <span>{rol.permisos} permisos</span>
                                        <span>Creado: {rol.fecha_creacion}</span>
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Stats */}
                        <div className="mt-6 p-4 bg-gray-50 rounded border">
                            <h3 className="font-medium text-gray-900 mb-2">Resumen de Roles</h3>
                            <div className="space-y-2">
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Roles activos:</span>
                                    <span className="font-medium">{roles.filter(r => r.estado === 'Activo').length}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Total usuarios asignados:</span>
                                    <span className="font-medium">{roles.reduce((sum, r) => sum + r.usuarios_asignados, 0)}</span>
                                </div>
                                <div className="flex justify-between text-sm">
                                    <span className="text-gray-600">Permisos promedio:</span>
                                    <span className="font-medium">
                                        {Math.round(roles.reduce((sum, r) => sum + r.permisos, 0) / roles.length)}
                                    </span>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Right Column - Permissions */}
                <div className="lg:col-span-2">
                    <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-gray-900 mb-1">
                                    Permisos del Rol: {selectedRol.nombre}
                                </h2>
                                <p className="text-sm text-gray-600">
                                    {selectedRol.descripcion}
                                </p>
                            </div>
                            <div className="flex gap-2">
                                <button className="px-3 py-1.5 text-sm border border-sat text-sat rounded hover:bg-sat-50 transition-colors">
                                    Editar Rol
                                </button>
                                <button className="px-3 py-1.5 text-sm bg-sat text-white rounded hover:bg-sat-600 transition-colors">
                                    Asignar Permisos
                                </button>
                            </div>
                        </div>

                        {/* Role Info */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                            <div className="p-4 bg-gray-50 rounded border">
                                <div className="text-sm font-medium text-gray-700">Usuarios asignados</div>
                                <div className="text-2xl font-bold text-local">{selectedRol.usuarios_asignados}</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded border">
                                <div className="text-sm font-medium text-gray-700">Permisos asignados</div>
                                <div className="text-2xl font-bold text-blue-600">{selectedRol.permisos}</div>
                            </div>
                            <div className="p-4 bg-gray-50 rounded border">
                                <div className="text-sm font-medium text-gray-700">Fecha creación</div>
                                <div className="text-lg font-bold text-gray-900">{selectedRol.fecha_creacion}</div>
                            </div>
                        </div>

                        {/* Permissions by Module */}
                        <div className="mb-6">
                            <h3 className="font-medium text-gray-900 mb-4">Permisos por Módulo</h3>
                            <div className="space-y-4">
                                {['Dashboard', 'Gestión Comercial', 'Configuración', 'Tarifas', 'RRHH'].map((modulo) => {
                                    const permisosModulo = permisos.filter(p => p.modulo === modulo);
                                    const asignados = permisosModulo.filter(p => p.asignado).length;
                                    const total = permisosModulo.length;
                                    
                                    if (total === 0) return null;
                                    
                                    return (
                                        <div key={modulo} className="border border-gray-200 rounded-lg overflow-hidden">
                                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                                <div className="flex justify-between items-center">
                                                    <div className="font-medium text-gray-900">{modulo}</div>
                                                    <div className="text-sm text-gray-600">
                                                        {asignados} de {total} permisos asignados
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="p-4">
                                                <div className="space-y-3">
                                                    {permisosModulo.map((permiso) => (
                                                        <div key={permiso.id} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded">
                                                            <div className="flex-1">
                                                                <div className="font-medium text-gray-900">{permiso.nombre}</div>
                                                                <div className="text-sm text-gray-600">{permiso.descripcion}</div>
                                                            </div>
                                                            <div className="flex items-center">
                                                                <input
                                                                    type="checkbox"
                                                                    checked={permiso.asignado}
                                                                    onChange={() => {}}
                                                                    className="h-4 w-4 text-sat focus:ring-sat border-gray-300 rounded"
                                                                />
                                                                <span className="ml-2 text-sm">
                                                                    {permiso.asignado ? 'Asignado' : 'No asignado'}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Bulk Actions */}
                        <div className="border border-gray-200 rounded-lg">
                            <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                                <h3 className="font-medium text-gray-900">Acciones Masivas</h3>
                            </div>
                            <div className="p-4">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                    <button className="p-3 border border-green-200 text-green-700 bg-green-50 rounded hover:bg-green-100 transition-colors text-left">
                                        <div className="font-medium mb-1">Seleccionar todos</div>
                                        <div className="text-sm">Asignar todos los permisos</div>
                                    </button>
                                    <button className="p-3 border border-red-200 text-red-700 bg-red-50 rounded hover:bg-red-100 transition-colors text-left">
                                        <div className="font-medium mb-1">Desmarcar todos</div>
                                        <div className="text-sm">Quitar todos los permisos</div>
                                    </button>
                                    <button className="p-3 border border-blue-200 text-blue-700 bg-blue-50 rounded hover:bg-blue-100 transition-colors text-left">
                                        <div className="font-medium mb-1">Permisos por defecto</div>
                                        <div className="text-sm">Restaurar configuración inicial</div>
                                    </button>
                                    <button className="p-3 border border-purple-200 text-purple-700 bg-purple-50 rounded hover:bg-purple-100 transition-colors text-left">
                                        <div className="font-medium mb-1">Copiar de otro rol</div>
                                        <div className="text-sm">Importar configuración</div>
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Permissions Matrix */}
            <div className="mt-6 bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4">Matriz de Permisos</h2>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50">
                            <tr>
                                <th className="py-3 px-4 text-left font-medium text-gray-700">Permiso</th>
                                {roles.filter(r => r.estado === 'Activo').map((rol) => (
                                    <th key={rol.id} className="py-3 px-4 text-center font-medium text-gray-700">
                                        <div className="flex flex-col items-center">
                                            <span>{rol.nombre}</span>
                                            <span className="text-xs text-gray-500">({rol.usuarios_asignados} users)</span>
                                        </div>
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-200">
                            {permisos.slice(0, 6).map((permiso) => (
                                <tr key={permiso.id} className="hover:bg-gray-50">
                                    <td className="py-3 px-4">
                                        <div>
                                            <div className="font-medium">{permiso.nombre}</div>
                                            <div className="text-xs text-gray-500">{permiso.modulo}</div>
                                        </div>
                                    </td>
                                    {roles.filter(r => r.estado === 'Activo').map((rol) => (
                                        <td key={rol.id} className="py-3 px-4 text-center">
                                            <div className="flex justify-center">
                                                <div className={`h-6 w-6 rounded flex items-center justify-center ${
                                                    permiso.asignado && rol.nombre === 'Administrador' 
                                                        ? 'bg-green-100 text-green-600' 
                                                        : 'bg-gray-100 text-gray-400'
                                                }`}>
                                                    {permiso.asignado && rol.nombre === 'Administrador' ? '✓' : '—'}
                                                </div>
                                            </div>
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <div className="mt-4 text-center">
                    <button className="text-sat hover:text-sat-600 text-sm">
                        Ver matriz completa →
                    </button>
                </div>
            </div>
        </AppLayout>
    );
}