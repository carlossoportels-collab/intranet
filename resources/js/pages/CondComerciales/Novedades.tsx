// resources/js/Pages/Comercial/Novedades.tsx
import React, { useState } from 'react';

import AppLayout from '@/layouts/app-layout';

interface Novedad {
    id: number;
    titulo: string;
    contenido: string;
    categoria: string;
    fecha_publicacion: string;
    autor: string;
    importancia: 'alta' | 'media' | 'baja';
    leido: boolean;
}

export default function Novedades() {
    const [novedades] = useState<Novedad[]>([
        { 
            id: 1, 
            titulo: 'Nuevas tarifas a partir de Enero 2026', 
            contenido: 'Se actualizaron los precios de los servicios de transporte local y distribución urbana. Consulta las nuevas tarifas en la sección correspondiente.',
            categoria: 'Tarifas', 
            fecha_publicacion: '2026-01-05', 
            autor: 'María López', 
            importancia: 'alta',
            leido: true
        },
        { 
            id: 2, 
            titulo: 'Sistema de reportes mejorado', 
            contenido: 'Hemos implementado mejoras en el sistema de generación de reportes comerciales. Ahora incluye gráficos interactivos y exportación en múltiples formatos.',
            categoria: 'Sistema', 
            fecha_publicacion: '2026-01-10', 
            autor: 'Juan Pérez', 
            importancia: 'media',
            leido: false
        },
        { 
            id: 3, 
            titulo: 'Promoción especial primer trimestre', 
            contenido: 'Descuento del 15% en servicios de logística express para nuevos clientes durante el primer trimestre 2026.',
            categoria: 'Promociones', 
            fecha_publicacion: '2026-01-15', 
            autor: 'Carlos Gómez', 
            importancia: 'alta',
            leido: false
        },
        { 
            id: 4, 
            titulo: 'Mantenimiento programado del sistema', 
            contenido: 'El próximo sábado 20 de Enero el sistema estará fuera de servicio por mantenimiento preventivo desde las 02:00 hasta las 06:00 hs.',
            categoria: 'Mantenimiento', 
            fecha_publicacion: '2026-01-12', 
            autor: 'Soporte Técnico', 
            importancia: 'media',
            leido: true
        },
        { 
            id: 5, 
            titulo: 'Nuevo convenio con Transportes Rápidos S.A.', 
            contenido: 'Se ha firmado un nuevo convenio con descuento del 15% en todos los servicios. Los clientes de esta empresa ya pueden acceder a las condiciones especiales.',
            categoria: 'Convenios', 
            fecha_publicacion: '2026-01-08', 
            autor: 'Ana Rodríguez', 
            importancia: 'alta',
            leido: true
        },
    ]);

    const [filtroCategoria, setFiltroCategoria] = useState<string>('todas');
    const [filtroImportancia, setFiltroImportancia] = useState<string>('todas');

    const getImportanceColor = (importancia: string) => {
        switch (importancia) {
            case 'alta': return 'bg-red-100 text-red-800';
            case 'media': return 'bg-yellow-100 text-yellow-800';
            case 'baja': return 'bg-green-100 text-green-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const getCategoryColor = (categoria: string) => {
        switch (categoria) {
            case 'Tarifas': return 'bg-blue-100 text-blue-800';
            case 'Sistema': return 'bg-purple-100 text-purple-800';
            case 'Promociones': return 'bg-green-100 text-green-800';
            case 'Convenios': return 'bg-yellow-100 text-yellow-800';
            case 'Mantenimiento': return 'bg-gray-100 text-gray-800';
            default: return 'bg-gray-100 text-gray-800';
        }
    };

    const filteredNovedades = novedades.filter(n => {
        if (filtroCategoria !== 'todas' && n.categoria !== filtroCategoria) return false;
        if (filtroImportancia !== 'todas' && n.importancia !== filtroImportancia) return false;
        return true;
    });

    return (
        <AppLayout title="Novedades">
            <div className="mb-4">
                <h1 className="text-3xl font-bold text-gray-900">
                    Novedades
                </h1>
                <p className="mt-1 text-gray-600 text-base">
                    Información importante y actualizaciones del sistema
                </p>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                {/* Filtros */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">
                            Últimas Novedades
                        </h2>
                        <p className="text-sm text-gray-600">
                            Mantente informado sobre cambios y actualizaciones
                        </p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-3">
                        <select
                            value={filtroCategoria}
                            onChange={(e) => setFiltroCategoria(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-sat focus:border-sat"
                        >
                            <option value="todas">Todas las categorías</option>
                            <option value="Tarifas">Tarifas</option>
                            <option value="Sistema">Sistema</option>
                            <option value="Promociones">Promociones</option>
                            <option value="Convenios">Convenios</option>
                            <option value="Mantenimiento">Mantenimiento</option>
                        </select>
                        <select
                            value={filtroImportancia}
                            onChange={(e) => setFiltroImportancia(e.target.value)}
                            className="px-3 py-2 text-sm border border-gray-300 rounded focus:ring-sat focus:border-sat"
                        >
                            <option value="todas">Todas las importancias</option>
                            <option value="alta">Alta</option>
                            <option value="media">Media</option>
                            <option value="baja">Baja</option>
                        </select>
                        <button className="px-4 py-2 bg-sat text-white text-sm rounded hover:bg-sat-600 transition-colors">
                            Marcar todas como leídas
                        </button>
                    </div>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
                    <div className="p-4 bg-blue-50 rounded border border-blue-100">
                        <div className="text-sm font-medium text-blue-700">Total novedades</div>
                        <div className="text-2xl font-bold text-blue-900">{novedades.length}</div>
                    </div>
                    <div className="p-4 bg-yellow-50 rounded border border-yellow-100">
                        <div className="text-sm font-medium text-yellow-700">Sin leer</div>
                        <div className="text-2xl font-bold text-yellow-900">
                            {novedades.filter(n => !n.leido).length}
                        </div>
                    </div>
                    <div className="p-4 bg-red-50 rounded border border-red-100">
                        <div className="text-sm font-medium text-red-700">Importancia alta</div>
                        <div className="text-2xl font-bold text-red-900">
                            {novedades.filter(n => n.importancia === 'alta').length}
                        </div>
                    </div>
                    <div className="p-4 bg-green-50 rounded border border-green-100">
                        <div className="text-sm font-medium text-green-700">Este mes</div>
                        <div className="text-2xl font-bold text-green-900">
                            {novedades.filter(n => {
                                const fechaPub = new Date(n.fecha_publicacion);
                                const hoy = new Date();
                                return fechaPub.getMonth() === hoy.getMonth() && fechaPub.getFullYear() === hoy.getFullYear();
                            }).length}
                        </div>
                    </div>
                </div>

                {/* Novedades List */}
                <div className="space-y-4">
                    {filteredNovedades.map((novedad) => (
                        <div key={novedad.id} className={`p-4 border rounded-lg transition-colors ${
                            novedad.leido 
                                ? 'border-gray-200 bg-white hover:border-sat' 
                                : 'border-sat bg-sat-50 hover:border-sat-600'
                        }`}>
                            <div className="flex flex-col md:flex-row md:items-start gap-4">
                                {/* Left Column - Info */}
                                <div className="flex-1">
                                    <div className="flex flex-wrap items-start gap-2 mb-3">
                                        {!novedad.leido && (
                                            <span className="px-2 py-1 bg-red-100 text-red-800 text-xs rounded-full font-bold">
                                                NUEVO
                                            </span>
                                        )}
                                        <span className={`px-2 py-1 text-xs rounded-full ${getImportanceColor(novedad.importancia)}`}>
                                            {novedad.importancia.toUpperCase()}
                                        </span>
                                        <span className={`px-2 py-1 text-xs rounded-full ${getCategoryColor(novedad.categoria)}`}>
                                            {novedad.categoria}
                                        </span>
                                    </div>
                                    
                                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                                        {novedad.titulo}
                                    </h3>
                                    
                                    <p className="text-gray-600 mb-4">
                                        {novedad.contenido}
                                    </p>
                                    
                                    <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                                        <div className="flex items-center">
                                            <span className="mr-1">📅</span>
                                            {new Date(novedad.fecha_publicacion).toLocaleDateString('es-ES', {
                                                day: '2-digit',
                                                month: 'long',
                                                year: 'numeric'
                                            })}
                                        </div>
                                        <div className="flex items-center">
                                            <span className="mr-1">👤</span>
                                            {novedad.autor}
                                        </div>
                                        <div className="flex items-center">
                                            <span className="mr-1">🔢</span>
                                            ID: {novedad.id}
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Right Column - Actions */}
                                <div className="md:w-48 flex flex-col gap-2">
                                    <button className={`w-full px-3 py-2 text-sm rounded transition-colors ${
                                        novedad.leido 
                                            ? 'text-sat border border-sat hover:bg-sat-50' 
                                            : 'bg-sat text-white hover:bg-sat-600'
                                    }`}>
                                        {novedad.leido ? 'Volver a leer' : 'Marcar como leído'}
                                    </button>
                                    <button className="w-full px-3 py-2 text-sm text-gray-700 border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                                        Compartir
                                    </button>
                                    {novedad.categoria === 'Tarifas' && (
                                        <button className="w-full px-3 py-2 text-sm text-local border border-local rounded hover:bg-local-50 transition-colors">
                                            Ver tarifas
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Archive */}
                <div className="mt-8">
                    <h3 className="font-medium text-gray-900 mb-3">Archivo de Novedades</h3>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {['2026-01', '2026-12', '2026-11'].map((mes) => (
                            <button
                                key={mes}
                                className="p-4 bg-gray-50 rounded border border-gray-200 hover:border-sat transition-colors text-left"
                            >
                                <div className="font-medium text-gray-900 mb-1">
                                    {new Date(mes + '-01').toLocaleDateString('es-ES', { month: 'long', year: 'numeric' })}
                                </div>
                                <div className="text-sm text-gray-600">
                                    {novedades.filter(n => n.fecha_publicacion.startsWith(mes.substring(0, 7))).length} novedades
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}