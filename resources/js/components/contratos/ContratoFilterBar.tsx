// resources/js/components/contratos/ContratoFilterBar.tsx
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay, subDays, subMonths } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, X, Filter, ChevronLeft, ChevronRight, User } from 'lucide-react';
import React, { useState, useRef, useEffect } from 'react';

interface MiniCalendarProps {
    selectedDate: Date | null;
    onSelectDate: (date: Date) => void;
    month: Date;
    onMonthChange: (date: Date) => void;
    minDate?: Date;
    maxDate?: Date;
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ 
    selectedDate, 
    onSelectDate, 
    month, 
    onMonthChange,
    minDate,
    maxDate
}) => {
    const start = startOfMonth(month);
    const end = endOfMonth(month);
    const days = eachDayOfInterval({ start, end });
    
    const daysOfWeek = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];
    
    const handlePrevMonth = () => {
        const prevMonth = subMonths(month, 1);
        onMonthChange(prevMonth);
    };
    
    const handleNextMonth = () => {
        const nextMonth = new Date(month);
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        onMonthChange(nextMonth);
    };
    
    const isDateDisabled = (date: Date): boolean => {
        if (minDate && date < minDate) return true;
        if (maxDate && date > maxDate) return true;
        return false;
    };
    
    return (
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200">
            <div className="flex items-center justify-between mb-3">
                <button
                    type="button"
                    onClick={handlePrevMonth}
                    className="p-1 hover:bg-gray-100 rounded"
                >
                    <ChevronLeft className="h-4 w-4 text-gray-600" />
                </button>
                <span className="text-sm font-semibold text-gray-700">
                    {format(month, 'MMMM yyyy', { locale: es })}
                </span>
                <button
                    type="button"
                    onClick={handleNextMonth}
                    className="p-1 hover:bg-gray-100 rounded"
                >
                    <ChevronRight className="h-4 w-4 text-gray-600" />
                </button>
            </div>
            
            <div className="grid grid-cols-7 gap-1 mb-2">
                {daysOfWeek.map((day, index) => (
                    <div key={index} className="text-center text-xs font-medium text-gray-500">
                        {day}
                    </div>
                ))}
            </div>
            
            <div className="grid grid-cols-7 gap-1">
                {Array.from({ length: start.getDay() === 0 ? 6 : start.getDay() - 1 }).map((_, index) => (
                    <div key={`empty-${index}`} className="h-7"></div>
                ))}
                
                {days.map((day) => {
                    const isSelected = selectedDate && isSameDay(day, selectedDate);
                    const isCurrentDay = isToday(day);
                    const isCurrentMonth = isSameMonth(day, month);
                    const disabled = isDateDisabled(day);
                    
                    return (
                        <button
                            key={day.toString()}
                            type="button"
                            onClick={() => !disabled && onSelectDate(day)}
                            disabled={disabled}
                            className={`
                                h-7 w-7 flex items-center justify-center text-xs rounded
                                ${isSelected ? 'bg-orange-600 text-white' : ''}
                                ${!isSelected && isCurrentDay ? 'bg-orange-100 text-orange-600 font-bold' : ''}
                                ${!isSelected && !isCurrentDay && isCurrentMonth ? 'text-gray-700 hover:bg-gray-100' : ''}
                                ${!isSelected && !isCurrentMonth ? 'text-gray-400' : ''}
                                ${disabled ? 'text-gray-300 cursor-not-allowed hover:bg-transparent' : ''}
                            `}
                        >
                            {format(day, 'd')}
                        </button>
                    );
                })}
            </div>
        </div>
    );
};

interface PrefijoFiltro {
    id: string;
    codigo: string;
    descripcion: string;
    comercial_nombre?: string;
    display_text: string;
}

interface Props {
    estadoValue: string;
    onEstadoChange: (value: string) => void;
    prefijoValue: string;
    onPrefijoChange: (value: string) => void;
    fechaInicio: string;
    fechaFin: string;
    onFechaInicioChange: (value: string) => void;
    onFechaFinChange: (value: string) => void;
    estados: Array<{ id: number; nombre: string }>;
    prefijosFiltro: PrefijoFiltro[];
    onClearFilters: () => void;
    hayFiltrosActivos: boolean;
    usuarioEsComercial: boolean;
    prefijoUsuario?: PrefijoFiltro | null;
}


export const ContratoFilterBar: React.FC<Props> = ({
    estadoValue,
    onEstadoChange,
    prefijoValue,
    onPrefijoChange,
    fechaInicio,
    fechaFin,
    onFechaInicioChange,
    onFechaFinChange,
    estados,
    prefijosFiltro,
    onClearFilters,
    hayFiltrosActivos,
    usuarioEsComercial,
    prefijoUsuario
}) => {
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [showDatePicker, setShowDatePicker] = useState(false);
    const [showCalendarDesde, setShowCalendarDesde] = useState(false);
    const [showCalendarHasta, setShowCalendarHasta] = useState(false);
    const [currentMonthDesde, setCurrentMonthDesde] = useState<Date>(new Date());
    const [currentMonthHasta, setCurrentMonthHasta] = useState<Date>(new Date());
    
    const datePickerRef = useRef<HTMLDivElement>(null);
    const calendarDesdeRef = useRef<HTMLDivElement>(null);
    const calendarHastaRef = useRef<HTMLDivElement>(null);


    //  Sincronizar el prefijoValue cuando el usuario es comercial
    useEffect(() => {
        if (usuarioEsComercial && prefijoUsuario?.id) {
            // Si el usuario es comercial, forzar que el filtro use su prefijo
            if (prefijoValue !== prefijoUsuario.id) {
                onPrefijoChange(prefijoUsuario.id);
            }
        }
    }, [usuarioEsComercial, prefijoUsuario?.id]);

    // Cerrar calendarios al hacer click fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (calendarDesdeRef.current && !calendarDesdeRef.current.contains(event.target as Node)) {
                setShowCalendarDesde(false);
            }
            if (calendarHastaRef.current && !calendarHastaRef.current.contains(event.target as Node)) {
                setShowCalendarHasta(false);
            }
            if (datePickerRef.current && !datePickerRef.current.contains(event.target as Node)) {
                setShowDatePicker(false);
            }
        };
        
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const formatDateForInput = (date: Date): string => {
        return format(date, 'yyyy-MM-dd');
    };

    const formatDateDisplay = (dateString: string) => {
        if (!dateString) return '';
        try {
            return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
        } catch {
            return '';
        }
    };

    const getToday = (): Date => new Date();
    const getLast7Days = (): Date => subDays(new Date(), 7);
    const getLast30Days = (): Date => subDays(new Date(), 30);

    const applyQuickDateRange = (range: 'today' | 'week' | 'month' | 'all') => {
        const today = getToday();
        
        switch(range) {
            case 'today':
                onFechaInicioChange(formatDateForInput(today));
                onFechaFinChange(formatDateForInput(today));
                break;
            case 'week':
                onFechaInicioChange(formatDateForInput(getLast7Days()));
                onFechaFinChange(formatDateForInput(today));
                break;
            case 'month':
                onFechaInicioChange(formatDateForInput(getLast30Days()));
                onFechaFinChange(formatDateForInput(today));
                break;
            case 'all':
                onFechaInicioChange('');
                onFechaFinChange('');
                break;
        }
        setShowDatePicker(false);
    };

    const handleSelectDateDesde = (date: Date) => {
        const formattedDate = formatDateForInput(date);
        onFechaInicioChange(formattedDate);
        setShowCalendarDesde(false);
        
        if (fechaFin && new Date(formattedDate) > new Date(fechaFin)) {
            onFechaFinChange(formattedDate);
        }
    };

    const handleSelectDateHasta = (date: Date) => {
        const formattedDate = formatDateForInput(date);
        onFechaFinChange(formattedDate);
        setShowCalendarHasta(false);
        
        if (fechaInicio && new Date(formattedDate) < new Date(fechaInicio)) {
            onFechaInicioChange(formattedDate);
        }
    };

    // Determinar si debemos mostrar el selector de prefijo
    const mostrarSelectorPrefijo = !usuarioEsComercial;

    return (
        <>
            {/* Mobile Toggle */}
            <div className="mb-4 flex justify-between items-center md:hidden">
                <button
                    onClick={() => setShowMobileFilters(!showMobileFilters)}
                    className="flex items-center gap-2 px-4 py-2 bg-white border border-gray-300 rounded-lg text-sm"
                >
                    <Filter className="h-4 w-4" />
                    Filtros
                    {hayFiltrosActivos && (
                        <span className="ml-1 w-2 h-2 bg-orange-500 rounded-full"></span>
                    )}
                </button>
                {hayFiltrosActivos && (
                    <button
                        onClick={onClearFilters}
                        className="text-sm text-red-600 flex items-center gap-1"
                    >
                        <X className="h-4 w-4" />
                        Limpiar
                    </button>
                )}
            </div>

            {/* Filtros */}
            <div className={`${showMobileFilters ? 'block' : 'hidden md:block'} mb-6`}>
                {/* Versión Desktop - todos en una fila */}
                <div className="hidden md:flex md:items-center md:gap-3">
                    {/* Filtro por Fecha */}
                    <div className="relative flex-1" ref={datePickerRef}>
                        <div 
                            className={`w-full px-3 py-2 border border-gray-300 rounded text-sm flex items-center justify-between cursor-pointer ${fechaInicio || fechaFin ? 'bg-blue-50 border-blue-300' : ''}`}
                            onClick={() => setShowDatePicker(!showDatePicker)}
                        >
                            <div className="flex items-center gap-2 truncate">
                                <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                <span className="text-gray-700 truncate">
                                    {fechaInicio && fechaFin 
                                        ? `${formatDateDisplay(fechaInicio)} - ${formatDateDisplay(fechaFin)}`
                                        : 'Rango de fecha'}
                                </span>
                            </div>
                        </div>
                        
                        {showDatePicker && (
                            <div className="absolute z-10 mt-1 left-0 w-[320px] bg-white border border-gray-300 rounded-lg shadow-lg">
                                <div className="p-4">
                                    <div className="mb-4">
                                        <h4 className="text-sm font-semibold text-gray-700 mb-2">Rápidos</h4>
                                        <div className="grid grid-cols-2 gap-2">
                                            <button
                                                type="button"
                                                onClick={() => applyQuickDateRange('today')}
                                                className="text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                                            >
                                                Hoy
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => applyQuickDateRange('week')}
                                                className="text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                                            >
                                                Últimos 7 días
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => applyQuickDateRange('month')}
                                                className="text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                                            >
                                                Últimos 30 días
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => applyQuickDateRange('all')}
                                                className="text-xs px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded text-gray-700"
                                            >
                                                Todo
                                            </button>
                                        </div>
                                    </div>
                                    
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Desde
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    value={fechaInicio}
                                                    max={formatDateForInput(getToday())}
                                                    onChange={(e) => onFechaInicioChange(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCalendarDesde(!showCalendarDesde)}
                                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                                                >
                                                    <Calendar className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {showCalendarDesde && (
                                            <div ref={calendarDesdeRef} className="mt-2">
                                                <MiniCalendar
                                                    selectedDate={fechaInicio ? new Date(fechaInicio) : null}
                                                    onSelectDate={handleSelectDateDesde}
                                                    month={currentMonthDesde}
                                                    onMonthChange={setCurrentMonthDesde}
                                                    maxDate={getToday()}
                                                />
                                            </div>
                                        )}
                                        
                                        <div>
                                            <label className="block text-xs font-medium text-gray-700 mb-1">
                                                Hasta
                                            </label>
                                            <div className="relative">
                                                <input
                                                    type="date"
                                                    value={fechaFin}
                                                    max={formatDateForInput(getToday())}
                                                    min={fechaInicio}
                                                    onChange={(e) => onFechaFinChange(e.target.value)}
                                                    className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowCalendarHasta(!showCalendarHasta)}
                                                    className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-500"
                                                >
                                                    <Calendar className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                        
                                        {showCalendarHasta && (
                                            <div ref={calendarHastaRef} className="mt-2">
                                                <MiniCalendar
                                                    selectedDate={fechaFin ? new Date(fechaFin) : null}
                                                    onSelectDate={handleSelectDateHasta}
                                                    month={currentMonthHasta}
                                                    onMonthChange={setCurrentMonthHasta}
                                                    minDate={fechaInicio ? new Date(fechaInicio) : undefined}
                                                    maxDate={getToday()}
                                                />
                                            </div>
                                        )}
                                    </div>
                                    
                                    <div className="mt-4 pt-3 border-t border-gray-200">
                                        <div className="flex justify-end">
                                            <button
                                                type="button"
                                                onClick={() => setShowDatePicker(false)}
                                                className="px-3 py-1.5 text-sm border border-gray-300 rounded text-gray-700 hover:bg-gray-50"
                                            >
                                                Cerrar
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Filtro por Estado */}
                    <select 
                        className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                        value={estadoValue}
                        onChange={(e) => onEstadoChange(e.target.value)}
                    >
                        <option value="">Todos los estados</option>
                        {estados.map(estado => (
                            <option key={estado.id} value={estado.id}>
                                {estado.nombre}
                            </option>
                        ))}
                    </select>
                    
                    {/* Comercial/Prefijo - IGUAL QUE EN PresupuestoFilterBar */}
                    {usuarioEsComercial && prefijoUsuario ? (
                        // Para comerciales: mostrar como texto (solo lectura)
                        <div className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50 flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                            <span className="text-gray-700 truncate" title={prefijoUsuario.display_text}>
                                {prefijoUsuario.display_text}
                            </span>
                        </div>
                    ) : mostrarSelectorPrefijo ? (
                        // Para otros usuarios: select normal
                        <select 
                            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
                            value={prefijoValue}
                            onChange={(e) => onPrefijoChange(e.target.value)}
                        >
                            <option value="">Todos los comerciales</option>
                            {prefijosFiltro.map(prefijo => (
                                <option key={prefijo.id} value={prefijo.id}>
                                    {prefijo.display_text}
                                </option>
                            ))}
                        </select>
                    ) : null}

                    {/* Botón limpiar filtros */}
                    {hayFiltrosActivos && (
                        <button
                            onClick={onClearFilters}
                            className="px-4 py-2 border border-gray-300 rounded text-sm text-red-600 hover:bg-gray-50 whitespace-nowrap"
                        >
                            <X className="h-4 w-4 inline mr-1" />
                            Limpiar
                        </button>
                    )}
                </div>

                {/* Versión Mobile - grid 2 columnas */}
                <div className="md:hidden grid grid-cols-2 gap-3">
                    {/* Filtro por Fecha (ocupa 2 columnas) */}
                    <div className="relative col-span-2" ref={datePickerRef}>
                        <div 
                            className={`w-full px-3 py-2 border border-gray-300 rounded text-sm flex items-center justify-between cursor-pointer ${fechaInicio || fechaFin ? 'bg-blue-50 border-blue-300' : ''}`}
                            onClick={() => setShowDatePicker(!showDatePicker)}
                        >
                            <div className="flex items-center gap-2 truncate">
                                <Calendar className="h-4 w-4 text-gray-500 flex-shrink-0" />
                                <span className="text-gray-700 truncate">
                                    {fechaInicio && fechaFin 
                                        ? `${formatDateDisplay(fechaInicio)} - ${formatDateDisplay(fechaFin)}`
                                        : 'Rango de fecha'}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Filtro por Estado */}
                    <select 
                        className="px-3 py-2 border border-gray-300 rounded text-sm"
                        value={estadoValue}
                        onChange={(e) => onEstadoChange(e.target.value)}
                    >
                        <option value="">Todos los estados</option>
                        {estados.map(estado => (
                            <option key={estado.id} value={estado.id}>
                                {estado.nombre}
                            </option>
                        ))}
                    </select>

                    <div className="col-span-2"></div>
                    
                    {/* Comercial/Prefijo - Versión Mobile */}
                    {usuarioEsComercial && prefijoUsuario ? (
                        // Para comerciales: mostrar como texto
                        <div className="col-span-2 px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50 flex items-center gap-2">
                            <User className="h-4 w-4 text-gray-500" />
                            <span className="text-gray-700 truncate">
                                {prefijoUsuario.display_text}
                            </span>
                        </div>
                    ) : mostrarSelectorPrefijo ? (
                        // Para otros usuarios: select normal
                        <select 
                            className="col-span-2 px-3 py-2 border border-gray-300 rounded text-sm"
                            value={prefijoValue}
                            onChange={(e) => onPrefijoChange(e.target.value)}
                        >
                            <option value="">Todos los comerciales</option>
                            {prefijosFiltro.map(prefijo => (
                                <option key={prefijo.id} value={prefijo.id}>
                                    {prefijo.display_text}
                                </option>
                            ))}
                        </select>
                    ) : null}

                    {/* Botón limpiar filtros móvil */}
                    {hayFiltrosActivos && (
                        <button
                            onClick={onClearFilters}
                            className="col-span-2 px-4 py-2 border border-gray-300 rounded text-sm text-red-600 hover:bg-gray-50"
                        >
                            <X className="h-4 w-4 inline mr-1" />
                            Limpiar filtros
                        </button>
                    )}
                </div>
            </div>
        </>
    );
};