// resources/js/components/filters/FilterBar.tsx
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isToday, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { Calendar, X, ChevronLeft, ChevronRight, User } from 'lucide-react';
import React, { useState, useRef } from 'react';

import { EstadoLead, Origen } from '@/types/leads';

interface PrefijoFiltro {
  id: string;
  codigo: string;
  descripcion: string;
  comercial_nombre?: string;
  display_text: string;
}

interface FilterBarProps {
  showMobileFilters: boolean;
  searchValue: string;
  onSearchChange: (value: string) => void;
  estadoValue: string;
  onEstadoChange: (value: string) => void;
  origenValue: string;
  onOrigenChange: (value: string) => void;
  prefijoValue: string;
  onPrefijoChange: (value: string) => void;
  fechaInicio: string;
  fechaFin: string;
  onFechaInicioChange: (value: string) => void;
  onFechaFinChange: (value: string) => void;
  estadosLead: EstadoLead[];
  origenes: Origen[];
  prefijosFiltro: PrefijoFiltro[];
  prefijoUsuario?: PrefijoFiltro | null;
  usuarioEsComercial: boolean;
}

// MiniCalendar component
interface CalendarProps {
  selectedDate: Date | null;
  onSelectDate: (date: Date) => void;
  month: Date;
  onMonthChange: (date: Date) => void;
  minDate?: Date;
  maxDate?: Date;
}

const MiniCalendar: React.FC<CalendarProps> = ({ 
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
    const prevMonth = new Date(month);
    prevMonth.setMonth(prevMonth.getMonth() - 1);
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
                ${isSelected ? 'bg-blue-600 text-white' : ''}
                ${!isSelected && isCurrentDay ? 'bg-blue-100 text-blue-600 font-bold' : ''}
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

const FilterBar: React.FC<FilterBarProps> = ({
  showMobileFilters,
  searchValue,
  onSearchChange,
  estadoValue,
  onEstadoChange,
  origenValue,
  onOrigenChange,
  prefijoValue,
  onPrefijoChange,
  fechaInicio,
  fechaFin,
  onFechaInicioChange,
  onFechaFinChange,
  estadosLead,
  origenes,
  prefijosFiltro,
  prefijoUsuario,
  usuarioEsComercial
}) => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showCalendarDesde, setShowCalendarDesde] = useState(false);
  const [showCalendarHasta, setShowCalendarHasta] = useState(false);
  const [currentMonthDesde, setCurrentMonthDesde] = useState<Date>(new Date());
  const [currentMonthHasta, setCurrentMonthHasta] = useState<Date>(new Date());
  
  const datePickerRef = useRef<HTMLDivElement>(null);
  const calendarDesdeRef = useRef<HTMLDivElement>(null);
  const calendarHastaRef = useRef<HTMLDivElement>(null);
  
  const formatDateForInput = (date: Date): string => {
    return format(date, 'yyyy-MM-dd');
  };
  
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
    } catch {
      return 'Fecha inválida';
    }
  };
  
  const getToday = (): Date => new Date();
  const getLast7Days = (): Date => {
    const date = new Date();
    date.setDate(date.getDate() - 7);
    return date;
  };
  const getLast30Days = (): Date => {
    const date = new Date();
    date.setDate(date.getDate() - 30);
    return date;
  };
  
  const applyQuickDateRange = (range: 'today' | 'week' | 'month' | 'all') => {
    const today = getToday();
    let startDate: Date | null = null;
    const endDate = today;
    
    switch(range) {
      case 'today':
        startDate = today;
        break;
      case 'week':
        startDate = getLast7Days();
        break;
      case 'month':
        startDate = getLast30Days();
        break;
      case 'all':
        onFechaInicioChange('');
        onFechaFinChange('');
        setShowDatePicker(false);
        return;
    }
    
    if (startDate) {
      onFechaInicioChange(formatDateForInput(startDate));
      onFechaFinChange(formatDateForInput(endDate));
      setShowDatePicker(false);
    }
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
  
  const clearDateFilter = () => {
    onFechaInicioChange('');
    onFechaFinChange('');
    setShowDatePicker(false);
  };
  
  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // El debounce en el hook ya maneja esto
  };
  
  return (
    <div className={`${showMobileFilters ? 'block' : 'hidden md:block'} mb-6`}>
      <form onSubmit={handleSearchSubmit} className="mb-4">
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            placeholder="Buscar por nombre, email o teléfono..."
            className="flex-grow px-3 py-2 border border-gray-300 rounded text-sm"
            value={searchValue}
            onChange={(e) => onSearchChange(e.target.value)}
          />
          <button
            type="submit"
            className="px-4 py-2 bg-sat text-white text-sm rounded hover:bg-sat-600 transition-colors"
          >
            Buscar
          </button>
        </div>
      </form>
      
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <select 
          className="px-3 py-2 border border-gray-300 rounded text-sm"
          value={estadoValue}
          onChange={(e) => onEstadoChange(e.target.value)}
        >
          <option value="">Todos los estados</option>
          {estadosLead.map(estado => (
            <option key={estado.id} value={estado.id}>
              {estado.nombre}
            </option>
          ))}
        </select>
        
        <select 
          className="px-3 py-2 border border-gray-300 rounded text-sm"
          value={origenValue}
          onChange={(e) => onOrigenChange(e.target.value)}
        >
          <option value="">Todos los orígenes</option>
          {origenes.map(origen => (
            <option key={origen.id} value={origen.id}>
              {origen.nombre}
            </option>
          ))}
        </select>
        <div className="relative" ref={datePickerRef}>
          <div 
            className={`w-full px-3 py-2 border border-gray-300 rounded text-sm flex items-center justify-between cursor-pointer ${fechaInicio || fechaFin ? 'bg-blue-50 border-blue-300' : ''}`}
            onClick={() => setShowDatePicker(!showDatePicker)}
          >
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-gray-700">
                {fechaInicio && fechaFin 
                  ? `${formatDate(fechaInicio)} - ${formatDate(fechaFin)}`
                  : 'Rango de fecha'}
              </span>
            </div>
            {(fechaInicio || fechaFin) && (
              <div 
                className="text-gray-500 hover:text-gray-700"
                onClick={(e) => {
                  e.stopPropagation();
                  clearDateFilter();
                }}
              >
                <X className="h-4 w-4" />
              </div>
            )}
          </div>
          
          {showDatePicker && (
            <div className="absolute z-10 mt-1 w-full md:w-[600px] bg-white border border-gray-300 rounded-lg shadow-lg">
              <div className="p-4">
                <div className="mb-4">
                  <h4 className="text-sm font-semibold text-gray-700 mb-2">Rápidos</h4>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
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
                      Todo el tiempo
                    </button>
                  </div>
                </div>
                
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="flex-1">
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                  </div>
                  
                  <div className="flex-1">
                    <div className="mb-2">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
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
                </div>
                
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div className="text-sm text-gray-600">
                      {fechaInicio && fechaFin && (
                        <span>
                          Mostrando registros del {formatDate(fechaInicio)} al {formatDate(fechaFin)}
                        </span>
                      )}
                    </div>
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
                       {/* Comercial/Prefijo */}
        <div className="relative">
          {usuarioEsComercial && prefijoUsuario ? (
            // Para comerciales: mostrar como texto, no como select
            <div className="px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50">
              <div className="flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700 truncate" title={prefijoUsuario.display_text}>
                  {prefijoUsuario.display_text}
                </span>
              </div>
              <input type="hidden" value={prefijoUsuario.id} />
            </div>
          ) : (
            // Para otros usuarios: select normal
            <select 
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
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
          )}
        </div>
      </div>
    </div>
  );
};

export default FilterBar;