// resources/js/Components/Modals/NuevaLicenciaModal.tsx

import axios from 'axios';
import { X, Save, Calendar, User, AlertCircle, CalendarDays } from 'lucide-react';
import React, { useState, useEffect, useRef } from 'react';
import { router } from '@inertiajs/react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { es } from 'date-fns/locale';

import { useToast } from '@/contexts/ToastContext';

interface Personal {
    id: number;
    nombre_completo: string;
}

interface Motivo {
    id: number;
    nombre: string;
}

interface NuevaLicenciaModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
    motivos: Motivo[];
}

interface FormErrors {
    [key: string]: string;
}

export default function NuevaLicenciaModal({ 
    isOpen, 
    onClose, 
    onSuccess,
    motivos
}: NuevaLicenciaModalProps) {
    const toast = useToast();
    const [formData, setFormData] = useState({
        personal_id: '',
        personal_nombre: '',
        motivo_licencia_id: '',
        desde: null as Date | null,
        hasta: null as Date | null,
        observacion: ''
    });
    
    const [errors, setErrors] = useState<FormErrors>({});
    const [cargando, setCargando] = useState(false);
    
    // Búsqueda de personal
    const [busqueda, setBusqueda] = useState('');
    const [resultadosBusqueda, setResultadosBusqueda] = useState<Personal[]>([]);
    const [buscando, setBuscando] = useState(false);
    const [mostrarResultados, setMostrarResultados] = useState(false);
    const searchRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    
    // Refs para DatePicker
    const datePickerDesdeRef = useRef<any>(null);
    const datePickerHastaRef = useRef<any>(null);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setMostrarResultados(false);
            }
        }
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        const buscarPersonal = async () => {
            if (busqueda.length < 3) {
                setResultadosBusqueda([]);
                return;
            }
            
            setBuscando(true);
            try {
                const response = await axios.get(`/api/personal/buscar?q=${encodeURIComponent(busqueda)}`);
                setResultadosBusqueda(Array.isArray(response.data) ? response.data : []);
                setMostrarResultados(true);
            } catch (error) {
                console.error('Error buscando personal:', error);
                setResultadosBusqueda([]);
            } finally {
                setBuscando(false);
            }
        };

        const timeoutId = setTimeout(buscarPersonal, 300);
        return () => clearTimeout(timeoutId);
    }, [busqueda]);

    const seleccionarPersonal = (personal: Personal) => {
        setFormData({
            ...formData,
            personal_id: personal.id.toString(),
            personal_nombre: personal.nombre_completo
        });
        setBusqueda(personal.nombre_completo);
        setMostrarResultados(false);
        if (errors.personal_id) {
            setErrors({ ...errors, personal_id: '' });
        }
    };

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData({ ...formData, [name]: value });
        
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const handleDateChange = (name: 'desde' | 'hasta', date: Date | null) => {
        setFormData({ ...formData, [name]: date });
        if (errors[name]) {
            setErrors({ ...errors, [name]: '' });
        }
    };

    const validateForm = () => {
        const newErrors: FormErrors = {};
        
        if (!formData.personal_id) {
            newErrors.personal_id = 'Seleccione un empleado';
        }
        
        if (!formData.motivo_licencia_id) {
            newErrors.motivo_licencia_id = 'Seleccione un tipo de licencia';
        }
        
        if (!formData.desde) {
            newErrors.desde = 'La fecha de inicio es requerida';
        }
        
        if (!formData.hasta) {
            newErrors.hasta = 'La fecha de fin es requerida';
        } else if (formData.desde && formData.hasta && formData.hasta < formData.desde) {
            newErrors.hasta = 'La fecha de fin debe ser posterior a la fecha de inicio';
        }
        
        return newErrors;
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        
        const newErrors = validateForm();
        if (Object.keys(newErrors).length > 0) {
            setErrors(newErrors);
            toast.error('Por favor, complete todos los campos requeridos');
            return;
        }
        
        setCargando(true);
        
        // Formatear fechas para enviar al servidor
        const formatDate = (date: Date | null) => {
            if (!date) return null;
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
        };
        
        try {
            router.post('/rrhh/personal/licencias', {
                personal_id: formData.personal_id,
                motivo_licencia_id: formData.motivo_licencia_id,
                desde: formatDate(formData.desde),
                hasta: formatDate(formData.hasta),
                observacion: formData.observacion || null
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    toast.success('Licencia creada correctamente');
                    
                    setFormData({
                        personal_id: '',
                        personal_nombre: '',
                        motivo_licencia_id: '',
                        desde: null,
                        hasta: null,
                        observacion: ''
                    });
                    setBusqueda('');
                    
                    if (onSuccess) {
                        onSuccess();
                    }
                    onClose();
                },
                onError: (errors) => {
                    if (errors.error) {
                        toast.error(errors.error);
                    } else {
                        setErrors(errors);
                        toast.error('Error de validación en el formulario');
                    }
                }
            });
        } catch (err) {
            toast.error('Error al crear la licencia');
        } finally {
            setCargando(false);
        }
    };

    const calcularDias = () => {
        if (!formData.desde || !formData.hasta) return null;
        
        const diffTime = Math.abs(formData.hasta.getTime() - formData.desde.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        
        return diffDays;
    };

    const diasCalculados = calcularDias();

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-[99990]" onClick={onClose} />
            
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[99999] pointer-events-none">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-3xl max-h-[98vh] overflow-hidden animate-fadeIn pointer-events-auto">
                    {/* Header - Sticky */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-white sticky top-0 z-10">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Calendar className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Nueva Solicitud de Licencia
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Complete los datos de la licencia
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Body - Formulario con scroll */}
                    <form onSubmit={handleSubmit} className="p-6 overflow-y-auto" style={{ maxHeight: 'calc(98vh - 140px)' }}>
                        <div className="space-y-4 pb-8">
                            {/* Empleado con búsqueda */}
                            <div ref={searchRef} className="relative">
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Empleado <span className="text-red-500">*</span>
                                </label>
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <User className="h-4 w-4 text-gray-400" />
                                    </div>
                                    <input
                                        ref={inputRef}
                                        type="text"
                                        value={busqueda}
                                        onChange={(e) => {
                                            setBusqueda(e.target.value);
                                            if (!e.target.value) {
                                                setFormData({ ...formData, personal_id: '', personal_nombre: '' });
                                            }
                                        }}
                                        onFocus={() => setMostrarResultados(true)}
                                        className={`w-full pl-10 pr-10 py-2 border rounded-md focus:ring-sat focus:border-sat ${
                                            errors.personal_id ? 'border-red-500' : 'border-gray-300'
                                        }`}
                                        placeholder="Escriba al menos 3 caracteres para buscar"
                                        disabled={cargando}
                                    />
                                    {buscando && (
                                        <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-gray-300 border-t-sat" />
                                        </div>
                                    )}
                                </div>
                                
                                {/* Resultados de búsqueda */}
                                {mostrarResultados && busqueda.length >= 3 && resultadosBusqueda.length > 0 && (
                                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                                        {resultadosBusqueda.map((personal) => (
                                            <div
                                                key={personal.id}
                                                onClick={() => seleccionarPersonal(personal)}
                                                className="px-4 py-2 hover:bg-gray-100 cursor-pointer flex items-center gap-2"
                                            >
                                                <User className="h-4 w-4 text-gray-400" />
                                                <span className="text-sm">{personal.nombre_completo}</span>
                                            </div>
                                        ))}
                                    </div>
                                )}
                                
                                {mostrarResultados && busqueda.length >= 3 && resultadosBusqueda.length === 0 && !buscando && (
                                    <div className="absolute z-50 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg p-4 text-center text-sm text-gray-500">
                                        No se encontraron resultados
                                    </div>
                                )}
                                
                                {errors.personal_id && (
                                    <p className="mt-1 text-xs text-red-600">{errors.personal_id}</p>
                                )}
                                
                                {formData.personal_nombre && !errors.personal_id && (
                                    <p className="mt-1 text-xs text-green-600">
                                        ✓ Seleccionado: {formData.personal_nombre}
                                    </p>
                                )}
                            </div>

                            {/* Tipo de Licencia */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Tipo de Licencia <span className="text-red-500">*</span>
                                </label>
                                <select
                                    name="motivo_licencia_id"
                                    value={formData.motivo_licencia_id}
                                    onChange={handleChange}
                                    className={`w-full px-3 py-2 border rounded-md focus:ring-sat focus:border-sat ${
                                        errors.motivo_licencia_id ? 'border-red-500' : 'border-gray-300'
                                    }`}
                                    disabled={cargando}
                                >
                                    <option value="">Seleccione un tipo</option>
                                    {motivos.map(motivo => (
                                        <option key={motivo.id} value={motivo.id}>
                                            {motivo.nombre}
                                        </option>
                                    ))}
                                </select>
                                {errors.motivo_licencia_id && (
                                    <p className="mt-1 text-xs text-red-600">{errors.motivo_licencia_id}</p>
                                )}
                            </div>

                            {/* Fechas */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Fecha Inicio <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <CalendarDays className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <DatePicker
                                            ref={datePickerDesdeRef}
                                            selected={formData.desde}
                                            onChange={(date: Date | null) => handleDateChange('desde', date)}
                                            selectsStart
                                            startDate={formData.desde}
                                            endDate={formData.hasta}
                                            minDate={new Date()}
                                            placeholderText="Seleccionar fecha"
                                            dateFormat="dd/MM/yyyy"
                                            className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-sat focus:border-sat ${
                                                errors.desde ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            popperClassName="z-[100000]"
                                            popperPlacement="bottom-start"
                                            locale={es}
                                            disabled={cargando}
                                        />
                                    </div>
                                    {errors.desde && (
                                        <p className="mt-1 text-xs text-red-600">{errors.desde}</p>
                                    )}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">
                                        Fecha Fin <span className="text-red-500">*</span>
                                    </label>
                                    <div className="relative">
                                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                            <CalendarDays className="h-4 w-4 text-gray-400" />
                                        </div>
                                        <DatePicker
                                            ref={datePickerHastaRef} // <-- Cambiado a datePickerHastaRef
                                            selected={formData.hasta} // <-- Cambiado a formData.hasta
                                            onChange={(date: Date | null) => handleDateChange('hasta', date)} // <-- Cambiado a 'hasta'
                                            selectsEnd
                                            startDate={formData.desde}
                                            endDate={formData.hasta}
                                            minDate={formData.desde || new Date()}
                                            placeholderText="Seleccionar fecha"
                                            dateFormat="dd/MM/yyyy"
                                            className={`w-full pl-10 pr-3 py-2 border rounded-md focus:ring-sat focus:border-sat ${
                                                errors.hasta ? 'border-red-500' : 'border-gray-300'
                                            }`}
                                            popperClassName="z-[100000]"
                                            popperPlacement="bottom-start"
                                            locale={es}
                                            disabled={cargando}
                                        />
                                    </div>
                                    {errors.hasta && (
                                        <p className="mt-1 text-xs text-red-600">{errors.hasta}</p>
                                    )}
                                </div>
                            </div>

                            {/* Días calculados o mensaje informativo */}
                            <div className="min-h-[80px] transition-all duration-300">
                                {diasCalculados ? (
                                    <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg animate-fadeIn">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-blue-100 rounded-full">
                                                <Calendar className="h-5 w-5 text-blue-600" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-blue-800">
                                                    Total de días calculados
                                                </p>
                                                <p className="text-2xl font-bold text-blue-600">
                                                    {diasCalculados} día{diasCalculados !== 1 ? 's' : ''}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg border-dashed">
                                        <div className="flex items-center gap-3">
                                            <div className="p-2 bg-gray-100 rounded-full">
                                                <Calendar className="h-5 w-5 text-gray-400" />
                                            </div>
                                            <div>
                                                <p className="text-sm font-medium text-gray-600">
                                                    {!formData.desde && !formData.hasta 
                                                        ? 'Seleccione fecha de inicio y fin para calcular los días'
                                                        : !formData.desde 
                                                            ? 'Seleccione fecha de inicio'
                                                            : 'Seleccione fecha de fin para completar el cálculo'
                                                    }
                                                </p>
                                                <p className="text-xs text-gray-500 mt-1">
                                                    {!formData.desde && !formData.hasta && 'Ambas fechas son requeridas'}
                                                    {formData.desde && !formData.hasta && 'La fecha de fin debe ser posterior a la de inicio'}
                                                    {!formData.desde && formData.hasta && 'Primero seleccione la fecha de inicio'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Observación */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Observación
                                </label>
                                <textarea
                                    name="observacion"
                                    value={formData.observacion}
                                    onChange={handleChange}
                                    rows={3}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-sat focus:border-sat"
                                    placeholder="Observaciones o motivo detallado (opcional)"
                                    disabled={cargando}
                                />
                            </div>
                        </div>
                    </form>

                    {/* Footer - Sticky */}
                    <div className="flex justify-end gap-3 p-6 border-t border-gray-200 bg-gray-50 sticky bottom-0">
                        <button
                            type="button"
                            onClick={onClose}
                            disabled={cargando}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            onClick={handleSubmit}
                            disabled={cargando}
                            className={`px-4 py-2 rounded-md text-sm font-medium text-white flex items-center gap-2 disabled:opacity-50 transition-colors ${
                                cargando
                                    ? 'bg-gray-300 cursor-not-allowed'
                                    : 'bg-sat hover:bg-sat-600'
                            }`}
                        >
                            {cargando ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                    Guardando...
                                </>
                            ) : (
                                <>
                                    <Save className="h-4 w-4" />
                                    Guardar Licencia
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
}