// resources/js/Pages/RRHH/Personal/Cumpleanos.tsx
import { Head } from '@inertiajs/react';
import { Cake, Gift, Calendar, PartyPopper, Users, ChevronRight, ChevronLeft } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import AppLayout from '@/layouts/app-layout';

interface EmpleadoCumple {
    id: number;
    nombre: string;
    apellido: string;
    fecha_nacimiento: string; // Formateada: 07/07/1982
    fecha_original: string; // Original de la DB: 1982-07-07T00:00:00.000000Z
    edad: number;
    departamento: string;
    puesto: string;
    email: string;
    telefono: string;
    proximo_cumple: number;
    mes: string;
    signo_zodiaco: string;
    dia_cumple: number; // Para ordenamiento: 7
    activo: boolean;
    cumple_hoy: boolean; // <-- AÑADIR ESTA LÍNEA

}

interface Props {
    personal: any[];
}

export default function Cumpleanos({ personal }: Props) {
    // Transformar datos del personal a empleados
    const [empleados, setEmpleados] = useState<EmpleadoCumple[]>([]);
    const [filtroMes, setFiltroMes] = useState<string>('todos');
    const [filtroDepartamento, setFiltroDepartamento] = useState<string>('todos');
    const [cumpleHoy, setCumpleHoy] = useState<EmpleadoCumple[]>([]);
    const [cumpleProximo, setCumpleProximo] = useState<EmpleadoCumple[]>([]);
    
    // Paginación para la tabla
    const [paginaActual, setPaginaActual] = useState<number>(1);
    const [itemsPorPagina] = useState<number>(5);
    const [showFilters, setShowFilters] = useState<boolean>(false);

    const meses = [
        'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
        'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];

    const departamentos = ['Ventas', 'Operaciones', 'Recursos Humanos', 'Tecnología'];

    // Función para formatear fecha - Maneja ambos formatos
    const formatFechaSimple = (fecha: string) => {
        if (!fecha) return 'N/A';
        try {
            // Intentar parsear diferentes formatos
            let dateObj: Date;
            
            // Formato 1: 1982-07-07T00:00:00.000000Z (ISO con timezone)
            // Formato 2: 1982-07-07 (simple)
            if (fecha.includes('T')) {
                dateObj = new Date(fecha);
            } else {
                // Si no tiene T, asumimos formato YYYY-MM-DD
                dateObj = new Date(fecha + 'T00:00:00');
            }
            
            // Verificar si es una fecha válida
            if (isNaN(dateObj.getTime())) {
                return 'Fecha inválida';
            }
            
            const dia = String(dateObj.getDate()).padStart(2, '0');
            const mes = String(dateObj.getMonth() + 1).padStart(2, '0');
            const anio = dateObj.getFullYear();
            
            return `${dia}/${mes}/${anio}`;
        } catch {
            return 'Fecha inválida';
        }
    };

    // Función para obtener solo el mes del cumpleaños
    const getMesCumple = (fechaNacimiento: string) => {
        if (!fechaNacimiento) return 'N/A';
        try {
            let dateObj: Date;
            
            if (fechaNacimiento.includes('T')) {
                dateObj = new Date(fechaNacimiento);
            } else {
                dateObj = new Date(fechaNacimiento + 'T00:00:00');
            }
            
            if (isNaN(dateObj.getTime())) {
                return 'N/A';
            }
            
            return meses[dateObj.getMonth()];
        } catch {
            return 'N/A';
        }
    };

    // Función para obtener el día del cumpleaños (para ordenamiento)
    const getDiaCumple = (fechaNacimiento: string) => {
        if (!fechaNacimiento) return 0;
        try {
            let dateObj: Date;
            
            if (fechaNacimiento.includes('T')) {
                dateObj = new Date(fechaNacimiento);
            } else {
                dateObj = new Date(fechaNacimiento + 'T00:00:00');
            }
            
            if (isNaN(dateObj.getTime())) {
                return 0;
            }
            
            return dateObj.getDate();
        } catch {
            return 0;
        }
    };

    // Función para verificar si cumple hoy
    const cumpleHoyFunc = (fechaNacimiento: string) => {
        if (!fechaNacimiento) return false;
        try {
            let fechaNac: Date;
            
            if (fechaNacimiento.includes('T')) {
                fechaNac = new Date(fechaNacimiento);
            } else {
                fechaNac = new Date(fechaNacimiento + 'T00:00:00');
            }
            
            if (isNaN(fechaNac.getTime())) {
                return false;
            }
            
            const hoy = new Date();
            const diaHoy = hoy.getDate();
            const mesHoy = hoy.getMonth();
            
            const diaCumple = fechaNac.getDate();
            const mesCumple = fechaNac.getMonth();
            
            return diaHoy === diaCumple && mesHoy === mesCumple;
        } catch {
            return false;
        }
    };

    // Funciones de cálculo
    const calcularEdad = (fechaNacimiento: string) => {
        if (!fechaNacimiento) return 0;
        try {
            let fechaNac: Date;
            
            if (fechaNacimiento.includes('T')) {
                fechaNac = new Date(fechaNacimiento);
            } else {
                fechaNac = new Date(fechaNacimiento + 'T00:00:00');
            }
            
            if (isNaN(fechaNac.getTime())) {
                return 0;
            }
            
            const hoy = new Date();
            let edad = hoy.getFullYear() - fechaNac.getFullYear();
            const mes = hoy.getMonth() - fechaNac.getMonth();
            if (mes < 0 || (mes === 0 && hoy.getDate() < fechaNac.getDate())) {
                edad--;
            }
            return edad;
        } catch {
            return 0;
        }
    };

    const calcularProximoCumple = (fechaNacimiento: string) => {
        if (!fechaNacimiento) return 365;
        
        try {
            let fechaNac: Date;
            
            if (fechaNacimiento.includes('T')) {
                fechaNac = new Date(fechaNacimiento);
            } else {
                fechaNac = new Date(fechaNacimiento + 'T00:00:00');
            }
            
            if (isNaN(fechaNac.getTime())) {
                return 365;
            }
            
            const hoy = new Date();
            const diaCumple = fechaNac.getDate();
            const mesCumple = fechaNac.getMonth();
            
            // Primero verificar si es hoy
            if (hoy.getDate() === diaCumple && hoy.getMonth() === mesCumple) {
                return 0;
            }
            
            let proxCumple = new Date(hoy.getFullYear(), mesCumple, diaCumple);
            
            if (proxCumple < hoy) {
                proxCumple = new Date(hoy.getFullYear() + 1, mesCumple, diaCumple);
            }
            
            const diffTime = proxCumple.getTime() - hoy.getTime();
            return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        } catch {
            return 365;
        }
    };

    const getSignoZodiaco = (fechaNacimiento: string) => {
        if (!fechaNacimiento) return 'N/A';
        
        try {
            let fecha: Date;
            
            if (fechaNacimiento.includes('T')) {
                fecha = new Date(fechaNacimiento);
            } else {
                fecha = new Date(fechaNacimiento + 'T00:00:00');
            }
            
            if (isNaN(fecha.getTime())) {
                return 'N/A';
            }
            
            const dia = fecha.getDate();
            const mes = fecha.getMonth() + 1;
            
            if ((mes === 1 && dia >= 20) || (mes === 2 && dia <= 18)) return 'Acuario';
            if ((mes === 2 && dia >= 19) || (mes === 3 && dia <= 20)) return 'Piscis';
            if ((mes === 3 && dia >= 21) || (mes === 4 && dia <= 19)) return 'Aries';
            if ((mes === 4 && dia >= 20) || (mes === 5 && dia <= 20)) return 'Tauro';
            if ((mes === 5 && dia >= 21) || (mes === 6 && dia <= 20)) return 'Géminis';
            if ((mes === 6 && dia >= 21) || (mes === 7 && dia <= 22)) return 'Cáncer';
            if ((mes === 7 && dia >= 23) || (mes === 8 && dia <= 22)) return 'Leo';
            if ((mes === 8 && dia >= 23) || (mes === 9 && dia <= 22)) return 'Virgo';
            if ((mes === 9 && dia >= 23) || (mes === 10 && dia <= 22)) return 'Libra';
            if ((mes === 10 && dia >= 23) || (mes === 11 && dia <= 21)) return 'Escorpio';
            if ((mes === 11 && dia >= 22) || (mes === 12 && dia <= 21)) return 'Sagitario';
            if ((mes === 12 && dia >= 22) || (mes === 1 && dia <= 19)) return 'Capricornio';
            
            return 'N/A';
        } catch {
            return 'N/A';
        }
    };

    useEffect(() => {
        // Transformar datos del personal a empleados
        const empleadosTransformados: EmpleadoCumple[] = personal.map(p => {
            const edad = calcularEdad(p.fecha_nacimiento);
            const proximoCumple = calcularProximoCumple(p.fecha_nacimiento);
            const mes = getMesCumple(p.fecha_nacimiento);
            const signo = getSignoZodiaco(p.fecha_nacimiento);
            const diaCumple = getDiaCumple(p.fecha_nacimiento);
            const cumpleHoy = cumpleHoyFunc(p.fecha_nacimiento);
            
            return {
                id: p.id,
                nombre: p.nombre,
                apellido: p.apellido,
                fecha_nacimiento: formatFechaSimple(p.fecha_nacimiento),
                fecha_original: p.fecha_nacimiento,
                edad: edad,
                departamento: 'General',
                puesto: 'Empleado',
                email: p.email,
                telefono: p.telefono || 'Sin teléfono',
                proximo_cumple: proximoCumple,
                mes: mes,
                signo_zodiaco: signo,
                dia_cumple: diaCumple,
                activo: p.activo === 1 || p.activo === true,
                cumple_hoy: cumpleHoy
            };
        });

        setEmpleados(empleadosTransformados);
        
        // Filtrar empleados que cumplen hoy (usando la función correcta)
        const hoy = empleadosTransformados.filter(e => e.cumple_hoy);
        const proximos = empleadosTransformados
            .filter(e => e.proximo_cumple > 0 && e.proximo_cumple <= 30)
            .sort((a, b) => a.proximo_cumple - b.proximo_cumple);
        
        setCumpleHoy(hoy);
        setCumpleProximo(proximos);
        
    }, [personal]);

    const filteredEmpleados = empleados.filter(e => {
        if (filtroMes !== 'todos') {
            if (e.mes !== filtroMes) return false;
        }
        if (filtroDepartamento !== 'todos' && e.departamento !== filtroDepartamento) {
            return false;
        }
        return true;
    })
    // Ordenar por día del cumpleaños
    .sort((a, b) => a.dia_cumple - b.dia_cumple);

    // Paginación
    const totalPaginas = Math.ceil(filteredEmpleados.length / itemsPorPagina);
    const indiceInicio = (paginaActual - 1) * itemsPorPagina;
    const indiceFin = indiceInicio + itemsPorPagina;
    const empleadosPaginados = filteredEmpleados.slice(indiceInicio, indiceFin);

    const getSignoColor = (signo: string) => {
        const colores: Record<string, string> = {
            'Aries': 'bg-red-100 text-red-800',
            'Tauro': 'bg-green-100 text-green-800',
            'Géminis': 'bg-yellow-100 text-yellow-800',
            'Cáncer': 'bg-blue-100 text-blue-800',
            'Leo': 'bg-orange-100 text-orange-800',
            'Virgo': 'bg-emerald-100 text-emerald-800',
            'Libra': 'bg-pink-100 text-pink-800',
            'Escorpio': 'bg-purple-100 text-purple-800',
            'Sagitario': 'bg-indigo-100 text-indigo-800',
            'Capricornio': 'bg-gray-100 text-gray-800',
            'Acuario': 'bg-cyan-100 text-cyan-800',
            'Piscis': 'bg-teal-100 text-teal-800',
        };
        return colores[signo] || 'bg-gray-100 text-gray-800';
    };

    const getProximoCumpleColor = (dias: number) => {
        if (dias === 0) return 'bg-green-100 text-green-800';
        if (dias <= 7) return 'bg-yellow-100 text-yellow-800';
        if (dias <= 30) return 'bg-blue-100 text-blue-800';
        return 'bg-gray-100 text-gray-800';
    };

    const getIniciales = (nombre: string, apellido: string) => {
        return (nombre.charAt(0) + apellido.charAt(0)).toUpperCase();
    };

    // Calcular estadísticas
    const estadisticas = {
        cumpleHoyCount: cumpleHoy.length,
        cumpleProximoCount: cumpleProximo.length,
        esteMesCount: empleados.filter(e => {
            const mesActual = new Date().getMonth();
            const mesCumple = meses.indexOf(e.mes);
            return mesCumple === mesActual;
        }).length,
        promedioEdad: empleados.length > 0 
            ? Math.round(empleados.reduce((sum, e) => sum + e.edad, 0) / empleados.length) 
            : 0
    };

    return (
        <AppLayout title="Cumpleaños">
            <Head title="Cumpleaños del Personal" />
            
            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Cumpleaños del Personal
                        </h1>
                        <p className="mt-1 text-gray-600 text-base">
                            Gestión y seguimiento de cumpleaños del equipo
                        </p>
                    </div>
                    
                    {/* Botón para mostrar filtros en móvil */}
                    <div className="flex flex-wrap gap-2">
                        <button
                            onClick={() => setShowFilters(!showFilters)}
                            className="md:hidden inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                        >
                            {showFilters ? 'Ocultar filtros' : 'Mostrar filtros'}
                        </button>
                    </div>
                </div>
            </div>

            {/* Filtros - Responsive */}
            <div className={`${showFilters ? 'block' : 'hidden md:block'} mb-6`}>
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por mes</label>
                            <select
                                value={filtroMes}
                                onChange={(e) => setFiltroMes(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-sat focus:border-sat"
                            >
                                <option value="todos">Todos los meses</option>
                                {meses.map((mes) => (
                                    <option key={mes} value={mes}>{mes}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Filtrar por departamento</label>
                            <select
                                value={filtroDepartamento}
                                onChange={(e) => setFiltroDepartamento(e.target.value)}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-sat focus:border-sat"
                            >
                                <option value="todos">Todos los departamentos</option>
                                {departamentos.map((depto) => (
                                    <option key={depto} value={depto}>{depto}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex items-end gap-2">
                            <button className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                                Enviar Recordatorios
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6">
                {/* Header y Stats */}
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <div>
                        <h2 className="text-lg font-semibold text-gray-900 mb-1">
                            Celebración de Cumpleaños
                        </h2>
                        <p className="text-sm text-gray-600">
                            Organice celebraciones y envíe felicitaciones
                        </p>
                    </div>
                </div>

                {/* Stats - Responsive */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4 mb-6">
                    <div className="p-3 md:p-4 bg-pink-50 rounded border border-pink-100">
                        <div className="flex items-center gap-2 mb-1 md:mb-2">
                            <PartyPopper size={18} className="text-pink-600" />
                            <div className="text-xs md:text-sm font-medium text-pink-700">Cumple hoy</div>
                        </div>
                        <div className="text-xl md:text-2xl font-bold text-pink-900">{estadisticas.cumpleHoyCount}</div>
                        {estadisticas.cumpleHoyCount > 0 && (
                            <div className="text-xs text-pink-600 mt-1">
                                ¡Celebra hoy!
                            </div>
                        )}
                    </div>
                    <div className="p-3 md:p-4 bg-blue-50 rounded border border-blue-100">
                        <div className="flex items-center gap-2 mb-1 md:mb-2">
                            <Calendar size={18} className="text-blue-600" />
                            <div className="text-xs md:text-sm font-medium text-blue-700">Próximos 30 días</div>
                        </div>
                        <div className="text-xl md:text-2xl font-bold text-blue-900">{estadisticas.cumpleProximoCount}</div>
                    </div>
                    <div className="p-3 md:p-4 bg-purple-50 rounded border border-purple-100">
                        <div className="flex items-center gap-2 mb-1 md:mb-2">
                            <Cake size={18} className="text-purple-600" />
                            <div className="text-xs md:text-sm font-medium text-purple-700">Este mes</div>
                        </div>
                        <div className="text-xl md:text-2xl font-bold text-purple-900">{estadisticas.esteMesCount}</div>
                        <div className="text-xs text-purple-600 mt-1">
                            {meses[new Date().getMonth()]}
                        </div>
                    </div>
                    <div className="p-3 md:p-4 bg-green-50 rounded border border-green-100">
                        <div className="flex items-center gap-2 mb-1 md:mb-2">
                            <Users size={18} className="text-green-600" />
                            <div className="text-xs md:text-sm font-medium text-green-700">Promedio edad</div>
                        </div>
                        <div className="text-xl md:text-2xl font-bold text-green-900">
                            {estadisticas.promedioEdad} años
                        </div>
                    </div>
                </div>

                {/* Birthday Highlights - Responsive */}
                {cumpleHoy.length > 0 && (
                    <div className="mb-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                        <div className="flex items-center gap-2 mb-3">
                            <PartyPopper size={20} className="text-green-600" />
                            <h3 className="font-semibold text-green-900">¡Cumpleaños de Hoy!</h3>
                            <span className="ml-2 px-2 py-1 text-xs bg-green-600 text-white rounded-full">
                                {cumpleHoy.length}
                            </span>
                        </div>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
                            {cumpleHoy.map((empleado) => (
                                <div key={empleado.id} className="p-3 md:p-4 bg-white rounded-lg border border-green-100">
                                    <div className="flex items-center gap-3 mb-3">
                                        <div className="h-10 w-10 md:h-12 md:w-12 rounded-full bg-gradient-to-r from-green-400 to-emerald-500 flex items-center justify-center text-white font-bold text-base md:text-lg">
                                            {getIniciales(empleado.nombre, empleado.apellido)}
                                        </div>
                                        <div>
                                            <div className="font-bold text-gray-900 text-sm md:text-base">
                                                {empleado.nombre} {empleado.apellido}
                                            </div>
                                            <div className="text-xs md:text-sm text-gray-600">{empleado.email}</div>
                                            <div className="text-xs text-gray-500">Cumple: {empleado.fecha_nacimiento}</div>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center">
                                        <span className="text-xs md:text-sm text-gray-700">🎂 {empleado.edad} años</span>
                                        <button className="px-2 md:px-3 py-1 text-xs md:text-sm bg-green-600 text-white rounded hover:bg-green-700 transition-colors">
                                            Felicitar
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Upcoming Birthdays - Responsive */}
                {cumpleProximo.length > 0 && (
                    <div className="mb-6">
                        <h3 className="font-medium text-gray-900 mb-3">Próximos Cumpleaños (30 días)</h3>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                            {cumpleProximo.map((empleado) => (
                                <div key={empleado.id} className="p-3 md:p-4 border border-gray-200 rounded-lg hover:border-sat transition-colors">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <div className="font-medium text-gray-900 text-sm md:text-base">{empleado.nombre} {empleado.apellido}</div>
                                            <div className="text-xs md:text-sm text-gray-600">{empleado.departamento}</div>
                                        </div>
                                        <span className={`px-2 py-1 text-xs rounded-full ${getProximoCumpleColor(empleado.proximo_cumple)}`}>
                                            {empleado.proximo_cumple === 0 ? 'Hoy' : `${empleado.proximo_cumple}d`}
                                        </span>
                                    </div>
                                    <div className="space-y-2">
                                        <div className="text-xs md:text-sm">
                                            <div className="text-gray-700">🎂 {empleado.fecha_nacimiento}</div>
                                            <div className="text-gray-600">Edad: {empleado.edad + 1}</div>
                                        </div>
                                        <span className={`px-2 py-1 text-xs rounded-full ${getSignoColor(empleado.signo_zodiaco)}`}>
                                            {empleado.signo_zodiaco}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {/* Calendario de Cumpleaños - Responsive */}
                <div className="mt-8">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-3">
                        <h3 className="font-medium text-gray-900">Calendario de Cumpleaños</h3>
                        <div className="text-sm text-gray-600">
                            Mostrando {empleadosPaginados.length} de {filteredEmpleados.length} empleados
                        </div>
                    </div>
                    
                    {empleadosPaginados.length === 0 ? (
                        <div className="text-center py-8">
                            <Cake className="w-12 h-12 mx-auto text-gray-400 mb-3" />
                            <p className="text-gray-500">
                                No hay empleados con los filtros seleccionados
                            </p>
                        </div>
                    ) : (
                        <>
                            {/* Versión móvil - Cards */}
                            <div className="md:hidden space-y-4">
                                {empleadosPaginados.map((empleado) => (
                                    <div key={empleado.id} className="border border-gray-200 rounded-lg p-4">
                                        <div className="flex items-center gap-3 mb-3">
                                            <div className="h-10 w-10 rounded-full bg-local flex items-center justify-center text-white text-sm font-semibold">
                                                {getIniciales(empleado.nombre, empleado.apellido)}
                                            </div>
                                            <div className="flex-1">
                                                <div className="font-medium text-gray-900">{empleado.nombre} {empleado.apellido}</div>
                                                <div className="text-xs text-gray-500">{empleado.email}</div>
                                            </div>
                                            <span className={`px-2 py-1 text-xs rounded-full ${getProximoCumpleColor(empleado.proximo_cumple)}`}>
                                                {empleado.proximo_cumple === 0 ? 'Hoy' : `${empleado.proximo_cumple}d`}
                                            </span>
                                        </div>
                                        
                                        <div className="grid grid-cols-2 gap-3 mb-3">
                                            <div>
                                                <div className="text-xs font-medium text-gray-700 mb-1">Fecha</div>
                                                <div className="text-sm text-gray-900">{empleado.fecha_nacimiento}</div>
                                            </div>
                                            <div>
                                                <div className="text-xs font-medium text-gray-700 mb-1">Edad</div>
                                                <div className="text-sm text-gray-900">{empleado.edad} años</div>
                                            </div>
                                            <div>
                                                <div className="text-xs font-medium text-gray-700 mb-1">Mes</div>
                                                <div className="text-sm">
                                                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                        {empleado.mes}
                                                    </span>
                                                </div>
                                            </div>
                                            <div>
                                                <div className="text-xs font-medium text-gray-700 mb-1">Signo</div>
                                                <div className="text-sm">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${getSignoColor(empleado.signo_zodiaco)}`}>
                                                        {empleado.signo_zodiaco}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                        
                                        <div className="flex justify-between pt-3 border-t border-gray-100">
                                            <div className="text-xs text-gray-600">
                                                {empleado.departamento}
                                            </div>
                                            <button className="text-xs text-sat hover:text-sat-600">
                                                Felicitar
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            
                            {/* Versión desktop - Tabla */}
                            <div className="hidden md:block overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead className="bg-gray-50">
                                        <tr>
                                            <th className="py-3 px-4 text-left font-medium text-gray-700">Empleado</th>
                                            <th className="py-3 px-4 text-left font-medium text-gray-700">Fecha</th>
                                            <th className="py-3 px-4 text-left font-medium text-gray-700">Edad</th>
                                            <th className="py-3 px-4 text-left font-medium text-gray-700">Mes</th>
                                            <th className="py-3 px-4 text-left font-medium text-gray-700">Signo</th>
                                            <th className="py-3 px-4 text-left font-medium text-gray-700">Próximo</th>
                                            <th className="py-3 px-4 text-left font-medium text-gray-700">Departamento</th>
                                            <th className="py-3 px-4 text-left font-medium text-gray-700">Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200">
                                        {empleadosPaginados.map((empleado) => (
                                            <tr key={empleado.id} className="hover:bg-gray-50">
                                                <td className="py-3 px-4">
                                                    <div className="flex items-center gap-3">
                                                        <div className="h-8 w-8 rounded-full bg-local flex items-center justify-center text-white text-xs font-semibold">
                                                            {getIniciales(empleado.nombre, empleado.apellido)}
                                                        </div>
                                                        <div>
                                                            <div className="font-medium">{empleado.nombre} {empleado.apellido}</div>
                                                            <div className="text-xs text-gray-500">{empleado.email}</div>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="py-3 px-4 text-gray-900">{empleado.fecha_nacimiento}</td>
                                                <td className="py-3 px-4 font-medium">{empleado.edad} años</td>
                                                <td className="py-3 px-4">
                                                    <span className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded-full">
                                                        {empleado.mes}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${getSignoColor(empleado.signo_zodiaco)}`}>
                                                        {empleado.signo_zodiaco}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">
                                                    <span className={`px-2 py-1 text-xs rounded-full ${getProximoCumpleColor(empleado.proximo_cumple)}`}>
                                                        {empleado.proximo_cumple === 0 ? 'Hoy' : `${empleado.proximo_cumple} días`}
                                                    </span>
                                                </td>
                                                <td className="py-3 px-4">{empleado.departamento}</td>
                                                <td className="py-3 px-4">
                                                    <button className="text-sat hover:text-sat-600 text-sm">
                                                        Felicitar
                                                    </button>
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                            
                            {/* Paginación - Responsive */}
                            {totalPaginas > 1 && (
                                <div className="flex flex-col sm:flex-row items-center justify-between mt-6 pt-4 border-t border-gray-200">
                                    <div className="text-sm text-gray-700 mb-4 sm:mb-0">
                                        Página {paginaActual} de {totalPaginas}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                        <button
                                            onClick={() => setPaginaActual(p => Math.max(1, p - 1))}
                                            disabled={paginaActual === 1}
                                            className={`px-3 py-1 border rounded text-sm flex items-center gap-1 ${
                                                paginaActual === 1 
                                                    ? 'text-gray-400 border-gray-300 cursor-not-allowed' 
                                                    : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <ChevronLeft size={14} />
                                            <span className="hidden sm:inline">Anterior</span>
                                        </button>
                                        
                                        {/* Números de página */}
                                        <div className="flex space-x-1">
                                            {Array.from({ length: Math.min(5, totalPaginas) }, (_, i) => {
                                                let numeroPagina;
                                                if (totalPaginas <= 5) {
                                                    numeroPagina = i + 1;
                                                } else if (paginaActual <= 3) {
                                                    numeroPagina = i + 1;
                                                } else if (paginaActual >= totalPaginas - 2) {
                                                    numeroPagina = totalPaginas - 4 + i;
                                                } else {
                                                    numeroPagina = paginaActual - 2 + i;
                                                }
                                                
                                                return (
                                                    <button
                                                        key={numeroPagina}
                                                        onClick={() => setPaginaActual(numeroPagina)}
                                                        className={`px-3 py-1 text-sm rounded ${
                                                            paginaActual === numeroPagina
                                                                ? 'bg-sat text-white'
                                                                : 'border border-gray-300 text-gray-700 hover:bg-gray-50'
                                                        }`}
                                                    >
                                                        {numeroPagina}
                                                    </button>
                                                );
                                            })}
                                        </div>
                                        
                                        <button
                                            onClick={() => setPaginaActual(p => Math.min(totalPaginas, p + 1))}
                                            disabled={paginaActual === totalPaginas}
                                            className={`px-3 py-1 border rounded text-sm flex items-center gap-1 ${
                                                paginaActual === totalPaginas 
                                                    ? 'text-gray-400 border-gray-300 cursor-not-allowed' 
                                                    : 'text-gray-700 border-gray-300 hover:bg-gray-50'
                                            }`}
                                        >
                                            <span className="hidden sm:inline">Próximo</span>
                                            <ChevronRight size={14} />
                                        </button>
                                    </div>
                                </div>
                            )}
                        </>
                    )}
                </div>

                {/* Monthly Stats - Responsive */}
                <div className="mt-8 p-4 bg-gray-50 rounded border">
                    <h3 className="font-medium text-gray-900 mb-3">Cumpleaños por Mes</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
                        {meses.map((mes) => {
                            const count = empleados.filter(e => e.mes === mes).length;
                            
                            return (
                                <div key={mes} className="text-center p-2 md:p-3 bg-white rounded border">
                                    <div className="text-xs md:text-sm font-medium text-gray-700">{mes.substring(0, 3)}</div>
                                    <div className="text-base md:text-lg font-bold text-sat mt-1">{count}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}