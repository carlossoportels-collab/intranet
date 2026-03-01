// resources/js/Pages/Comercial/Actividad.tsx
import { 
    Calendar, Users, FileText, FileSignature, Building, 
    ChevronRight, Filter, Plus, TrendingUp,
    UserPlus, Truck, Briefcase
} from 'lucide-react';
import React, { useState } from 'react';

import AppLayout from '@/layouts/app-layout';

interface ActividadComercialProps {
    // Props si las necesitas
}

interface ActividadItem {
    id: number;
    fecha: string;
    tipo_entidad: 'CONTACTO' | 'PRESUPUESTO' | 'CONTRATO' | 'COMENTARIO';
    nombre: string;
    empresa?: string;
    estado: string;
    informacion: string;
    cantidad?: number;
    color_estado: string;
}

interface EstadisticasCard {
    titulo: string;
    total: number;
    nuevos: number;
    color: string;
    icono: React.ReactNode;
    detalles: Array<{label: string; valor: number}>;
}

export default function ActividadComercial({}: ActividadComercialProps) {
    // Estados para filtros
    const [rangoFecha, setRangoFecha] = useState<string>('mes');
    const [fechaPersonalizada, setFechaPersonalizada] = useState<string>('');
    const [filtroActividad, setFiltroActividad] = useState<string>('todas');
    
    // Datos de ejemplo
    const [estadisticasData] = useState<EstadisticasCard[]>([
        {
            titulo: 'Contactos',
            total: 248,
            nuevos: 12,
            color: 'bg-blue-500',
            icono: <Users className="h-5 w-5" />,
            detalles: [
                { label: 'Nuevos', valor: 12 },
                { label: 'En negociación', valor: 45 },
                { label: 'Calificados', valor: 89 },
                { label: 'Descartados', valor: 102 }
            ]
        },
        {
            titulo: 'Presupuestos',
            total: 156,
            nuevos: 8,
            color: 'bg-green-500',
            icono: <FileText className="h-5 w-5" />,
            detalles: [
                { label: 'Enviados', valor: 32 },
                { label: 'Aprobados', valor: 18 },
                { label: 'Rechazados', valor: 45 },
                { label: 'Vencidos', valor: 61 }
            ]
        },
        {
            titulo: 'Contratos',
            total: 89,
            nuevos: 5,
            color: 'bg-purple-500',
            icono: <FileSignature className="h-5 w-5" />,
            detalles: [
                { label: 'Activos', valor: 67 },
                { label: 'Pendientes', valor: 8 },
                { label: 'Finalizados', valor: 12 },
                { label: 'Cancelados', valor: 2 }
            ]
        },
        {
            titulo: 'Empresas',
            total: 45,
            nuevos: 3,
            color: 'bg-amber-500',
            icono: <Building className="h-5 w-5" />,
            detalles: [
                { label: '1-5 vehículos', valor: 18 },
                { label: '6-15 vehículos', valor: 12 },
                { label: '16-30 vehículos', valor: 9 },
                { label: '+30 vehículos', valor: 6 }
            ]
        }
    ]);

    const [actividadReciente] = useState<ActividadItem[]>([
        {
            id: 1,
            fecha: '07/01/26',
            tipo_entidad: 'CONTACTO',
            nombre: 'JOSE SANCHEZ',
            empresa: 'Transportes Sanchez',
            estado: 'Negociación',
            informacion: 'Facebook ad',
            cantidad: 1,
            color_estado: 'bg-yellow-100 text-yellow-800'
        },
        {
            id: 2,
            fecha: '05/01/26',
            tipo_entidad: 'PRESUPUESTO',
            nombre: 'MARTINEZ LOGISTICA',
            estado: 'Vencido',
            informacion: '8 vehículos',
            cantidad: 85000,
            color_estado: 'bg-red-100 text-red-800'
        },
        {
            id: 3,
            fecha: '03/01/26',
            tipo_entidad: 'CONTRATO',
            nombre: 'JOSE MARIA TRANSPORT',
            estado: 'Consolidado',
            informacion: '32 vehículos',
            cantidad: 320000,
            color_estado: 'bg-green-100 text-green-800'
        },
        {
            id: 4,
            fecha: '02/01/26',
            tipo_entidad: 'COMENTARIO',
            nombre: 'ARGENTRUCKING',
            estado: 'Cerrado',
            informacion: 'Capacitación',
            cantidad: 1,
            color_estado: 'bg-gray-100 text-gray-800'
        }
    ]);

    // Manejadores de filtros
    const aplicarFiltros = () => {
        console.log('Aplicando filtros:', { rangoFecha, fechaPersonalizada, filtroActividad });
        // Aquí iría la lógica real para filtrar
    };

    // Obtener icono según tipo de entidad
    const getIcono = (tipo: string) => {
        switch (tipo) {
            case 'CONTACTO': return <Users className="h-4 w-4" />;
            case 'PRESUPUESTO': return <FileText className="h-4 w-4" />;
            case 'CONTRATO': return <FileSignature className="h-4 w-4" />;
            case 'COMENTARIO': return <Briefcase className="h-4 w-4" />;
            default: return <Users className="h-4 w-4" />;
        }
    };

    return (
        <AppLayout title="Actividad Comercial">
            {/* Header - Ajustado para ser consistente con Dashboard */}
            <div className="mb-4"> {/* Reducido de mb-6 a mb-4 para coincidir con Dashboard */}
                <h1 className="text-3xl font-bold text-gray-900"> {/* Aumentado a text-3xl */}
                    Actividad Comercial
                </h1>
                <p className="mt-1 text-gray-600 text-base"> {/* Aumentado a text-base */}
                    Gestión y seguimiento de actividades comerciales
                </p>
            </div>

            {/* Barra de filtros - COMPLETAMENTE RESPONSIVE */}
            <div className="mb-4 p-4 bg-white rounded-lg shadow-sm border border-gray-200"> {/* Reducido mb */}
                <div className="flex flex-col lg:flex-row lg:items-center gap-3"> {/* Reducido gap */}
                    <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-gray-500" />
                        <span className="text-sm font-medium text-gray-700">Rango:</span>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setRangoFecha('mes')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${rangoFecha === 'mes' ? 'bg-sat text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            Mes actual
                        </button>
                        <button
                            onClick={() => setRangoFecha('15dias')}
                            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${rangoFecha === '15dias' ? 'bg-sat text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                        >
                            15 días
                        </button>
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => setRangoFecha('personalizado')}
                                className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${rangoFecha === 'personalizado' ? 'bg-sat text-white' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                            >
                                Fecha exacta
                            </button>
                            {rangoFecha === 'personalizado' && (
                                <input
                                    type="date"
                                    className="px-3 py-1.5 text-sm border border-gray-300 rounded-md focus:ring-sat focus:border-sat w-40"
                                    value={fechaPersonalizada}
                                    onChange={(e) => setFechaPersonalizada(e.target.value)}
                                />
                            )}
                        </div>
                    </div>

                    <div className="lg:ml-auto flex flex-col xs:flex-row items-start xs:items-center gap-3 mt-2 lg:mt-0">
                        <div className="flex items-center gap-2">
                            <Filter className="h-4 w-4 text-gray-500" />
                            <select 
                                className="text-sm border border-gray-300 rounded-md px-3 py-1.5 focus:ring-sat focus:border-sat w-full xs:w-auto"
                                value={filtroActividad}
                                onChange={(e) => setFiltroActividad(e.target.value)}
                            >
                                <option value="todas">Todas</option>
                                <option value="contactos">Contactos</option>
                                <option value="presupuestos">Presupuestos</option>
                                <option value="contratos">Contratos</option>
                                <option value="empresas">Empresas</option>
                            </select>
                        </div>
                        
                        <button 
                            onClick={aplicarFiltros}
                            className="px-4 py-1.5 text-sm font-medium text-white bg-sat rounded-md hover:bg-sat-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sat whitespace-nowrap"
                        >
                            Aplicar
                        </button>
                    </div>
                </div>
            </div>

            {/* Cards de estadísticas - RESPONSIVE COMO DASHBOARD */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-4"> {/* Mismo grid que Dashboard */}
                {estadisticasData.map((item, index) => (
                    <div key={index} className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 hover:border-sat transition-all"> {/* Estilo igual a Dashboard */}
                        <div className="flex items-center justify-between">
                            <div>
                                <p className="text-base font-medium text-gray-700"> {/* text-base igual que Dashboard */}
                                    {item.titulo}
                                </p>
                                <p className="text-3xl font-bold text-local mt-1"> {/* text-3xl igual que Dashboard */}
                                    {item.total}
                                </p>
                            </div>
                            <div className={`h-12 w-12 ${item.color.replace('bg-', 'bg-').replace('500', '100')} rounded-lg flex items-center justify-center`}>
                                <div className={`h-9 w-9 ${item.color} rounded-md flex items-center justify-center`}>
                                    <span className="text-white font-bold text-sm">
                                        {item.icono}
                                    </span>
                                </div>
                            </div>
                        </div>
                        
                        {/* Nuevos */}
                        <div className="flex items-center justify-between mt-3 p-2 bg-gray-50 rounded">
                            <div className="flex items-center">
                                <UserPlus className="h-3 w-3 mr-1 text-green-600" />
                                <span className="text-sm text-gray-600">Nuevos:</span>
                            </div>
                            <span className="font-semibold text-green-700">{item.nuevos}</span>
                        </div>

                        {/* Lista de estados - Responsive */}
                        <div className="mt-3 grid grid-cols-2 gap-2">
                            {item.detalles.map((detalle, idx) => (
                                <div key={idx} className="text-center p-2 bg-gray-50 rounded">
                                    <div className="text-xs text-gray-500 mb-1">{detalle.label}</div>
                                    <div className="text-sm font-medium text-gray-900">{detalle.valor}</div>
                                </div>
                            ))}
                        </div>

                        {/* Botón de acción */}
                        <button className="w-full mt-3 text-center text-sm text-gray-600 hover:text-sat hover:bg-gray-50 py-2 rounded border border-gray-200 hover:border-sat transition-colors flex items-center justify-center">
                            Ver {item.titulo.toLowerCase()}
                            <ChevronRight className="h-3 w-3 ml-1" />
                        </button>
                    </div>
                ))}
            </div>

            {/* Última actividad - Tabla RESPONSIVE */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 mb-4 overflow-hidden">
                <div className="p-4 border-b border-gray-200">
                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
                        <div className="flex items-center">
                            <TrendingUp className="h-5 w-5 mr-2 text-gray-600" />
                            <h2 className="text-xl font-semibold text-gray-900"> {/* text-xl igual que Dashboard */}
                                Última actividad
                            </h2>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-sm text-gray-500 hidden sm:block">
                                Actualizado: {new Date().toLocaleDateString('es-ES')}
                            </span>
                            <button className="px-3 py-1.5 text-sm bg-sat text-white rounded hover:bg-sat-600 transition-colors">
                                Ver Todo
                            </button>
                        </div>
                    </div>
                </div>
                
                <div className="p-4">
                    {/* Tabla responsiva */}
                    <div className="overflow-x-auto">
                        <div className="min-w-full">
                            <div className="hidden lg:block">
                                {/* Desktop table */}
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="py-3 px-4 text-left font-medium text-gray-700">Fecha</th>
                                            <th className="py-3 px-4 text-left font-medium text-gray-700">Entidad</th>
                                            <th className="py-3 px-4 text-left font-medium text-gray-700">Empresa / Contacto</th>
                                            <th className="py-3 px-4 text-left font-medium text-gray-700">Estado</th>
                                            <th className="py-3 px-4 text-left font-medium text-gray-700">Información</th>
                                            <th className="py-3 px-4 text-left font-medium text-gray-700">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {actividadReciente.map((item) => (
                                            <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                                                <td className="py-3 px-4 font-medium text-gray-900">{item.fecha}</td>
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center">
                                                        <div className="mr-2 text-gray-500">
                                                            {getIcono(item.tipo_entidad)}
                                                        </div>
                                                        <span className="text-gray-700">{item.tipo_entidad}</span>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div>
                                                        <div className="font-medium text-gray-900">{item.nombre}</div>
                                                        {item.empresa && (
                                                            <div className="text-sm text-gray-500">{item.empresa}</div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.color_estado}`}>
                                                        {item.estado}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4 text-gray-600">
                                                    <div>
                                                        {item.informacion}
                                                        {item.cantidad && item.cantidad > 1 && (
                                                            <div className="flex items-center mt-1 text-xs">
                                                                <Truck className="h-3 w-3 mr-1 text-gray-400" />
                                                                <span className="text-gray-500">
                                                                    {item.tipo_entidad === 'CONTRATO' ? '$ ' : ''}
                                                                    {item.cantidad.toLocaleString('es-ES')}
                                                                    {item.tipo_entidad === 'CONTRATO' ? '' : ' vehículos'}
                                                                </span>
                                                            </div>
                                                        )}
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <div className="flex gap-2">
                                                        <button className="text-sat hover:text-sat-600 text-sm font-medium hover:underline">
                                                            Ver
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>

                            {/* Mobile cards */}
                            <div className="lg:hidden space-y-3">
                                {actividadReciente.map((item) => (
                                    <div key={item.id} className="p-4 border border-gray-200 rounded-lg hover:border-sat transition-colors">
                                        <div className="flex justify-between items-start mb-2">
                                            <div className="flex items-center">
                                                <div className="mr-2 text-gray-500">
                                                    {getIcono(item.tipo_entidad)}
                                                </div>
                                                <span className="font-medium text-gray-900">{item.tipo_entidad}</span>
                                            </div>
                                            <span className="text-sm text-gray-500">{item.fecha}</span>
                                        </div>
                                        
                                        <div className="mb-2">
                                            <div className="font-medium text-gray-900">{item.nombre}</div>
                                            {item.empresa && (
                                                <div className="text-sm text-gray-500">{item.empresa}</div>
                                            )}
                                        </div>
                                        
                                        <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${item.color_estado}`}>
                                                {item.estado}
                                            </span>
                                            <div className="text-sm text-gray-600">
                                                {item.informacion}
                                                {item.cantidad && (
                                                    <div className="text-xs text-gray-500">
                                                        {item.tipo_entidad === 'CONTRATO' ? '$' : ''}
                                                        {item.cantidad.toLocaleString('es-ES')}
                                                        {item.tipo_entidad === 'CONTRATO' ? '' : ' vehículos'}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                        
                                        <div className="flex gap-2">
                                            <button className="flex-1 px-3 py-1.5 text-sm text-sat border border-sat rounded hover:bg-sat-50 transition-colors">
                                                Ver detalles
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>

                    {/* Paginación */}
                    <div className="flex flex-col sm:flex-row justify-between items-center mt-4 pt-4 border-t border-gray-200 gap-2">
                        <div className="text-sm text-gray-600">
                            Mostrando {actividadReciente.length} actividades
                        </div>
                        <div className="flex gap-2">
                            <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                                Anterior
                            </button>
                            <button className="px-3 py-1.5 text-sm border border-gray-300 rounded-md hover:bg-gray-50 transition-colors">
                                Siguiente
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}