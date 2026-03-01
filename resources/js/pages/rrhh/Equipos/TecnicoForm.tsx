// resources/js/Pages/rrhh/Equipos/TecnicoForm.tsx
import { useForm, usePage } from '@inertiajs/react';
import { ArrowLeft, Save, User, MapPin } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import AlertError from '@/components/alert-error';
import AlertSuccess from '@/components/alert-succes';
import MapaUbicacion from '@/components/MapaUbicacion';
import AppLayout from '@/layouts/app-layout';

interface TecnicoFormProps {
    tecnico?: {
        id: number;
        personal_id: number;
        nombre_completo: string;
        direccion: string;
        latitud: number | null;
        longitud: number | null;
        activo: boolean;
    };
    personalDisponible?: Array<{
        id: number;
        nombre_completo: string;
        email: string;
        telefono: string;
    }>;
    modo: 'crear' | 'editar';
    errors?: Record<string, string>;
}

export default function TecnicoForm({ tecnico, personalDisponible = [], modo, errors: propErrors }: TecnicoFormProps) {
    const { data, setData, post, put, processing, errors: formErrors } = useForm({
        personal_id: tecnico?.personal_id || '',
        direccion: tecnico?.direccion || '',
        latitud: tecnico?.latitud ?? '', // Usar ?? para manejar null correctamente
        longitud: tecnico?.longitud ?? '', // Usar ?? para manejar null correctamente
        activo: tecnico?.activo ?? true,
    });

    // Obtener mensajes flash y errores de la página
    const { props } = usePage();
    const flash = (props as any).flash || {};
    const errors = { ...propErrors, ...formErrors };
    
    const [mostrarMapa, setMostrarMapa] = useState<boolean>(true);
    const [showAlert, setShowAlert] = useState<boolean>(false);
    const [alertType, setAlertType] = useState<'success' | 'error' | null>(null);
    const [alertMessage, setAlertMessage] = useState<string>('');

    // Efecto para mostrar alerts automáticamente
    useEffect(() => {
        if (flash.success) {
            setAlertType('success');
            setAlertMessage(flash.success);
            setShowAlert(true);
            
            // Ocultar automáticamente después de 5 segundos
            const timer = setTimeout(() => setShowAlert(false), 5000);
            return () => clearTimeout(timer);
        }
        
        if (flash.error) {
            setAlertType('error');
            setAlertMessage(flash.error);
            setShowAlert(true);
            
            // Ocultar automáticamente después de 7 segundos
            const timer = setTimeout(() => setShowAlert(false), 7000);
            return () => clearTimeout(timer);
        }
    }, [flash]);

    // También puedes cerrar manualmente
    const closeAlert = () => {
        setShowAlert(false);
        setAlertType(null);
        setAlertMessage('');
    };


    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        
        // Preparar datos para enviar
        const datosEnviar = {
            personal_id: data.personal_id,
            direccion: data.direccion,
            latitud: data.latitud === '' ? null : data.latitud,
            longitud: data.longitud === '' ? null : data.longitud,
            activo: data.activo,
        };
        
        if (modo === 'crear') {
            // CORREGIDO: Enviar con un solo objeto que incluye datos y opciones
            post('/rrhh/equipos/tecnicos', {
                ...datosEnviar,
                preserveScroll: true,
                onSuccess: () => {
                    // Opcional: código a ejecutar después del éxito
                },
                onError: (errors) => {
                    // Errors están manejados por formErrors
                },
            });
        } else {
            // CORREGIDO: Enviar con un solo objeto que incluye datos y opciones
            put(`/rrhh/equipos/tecnicos/${tecnico?.id}`, {
                ...datosEnviar,
                preserveScroll: true,
                onSuccess: () => {
                    // Opcional: código a ejecutar después del éxito
                },
                onError: (errors) => {
                    // Errors están manejados por formErrors
                },
            });
        }
    };

    // Manejar cambio de ubicación desde el mapa
    const handleUbicacionCambiada = (latitud: number, longitud: number, direccionCompleta?: string) => {
        setData({
            ...data,
            latitud,
            longitud,
            ...(direccionCompleta && { direccion: direccionCompleta }),
        });
    };

    // Toggle para mostrar/ocultar mapa
    const toggleMapa = () => {
        setMostrarMapa(!mostrarMapa);
    };

    // Función para manejar cambios en campos numéricos
    const handleNumberChange = (field: 'latitud' | 'longitud', value: string) => {
        if (value === '') {
            setData(field, '' as any); // TypeScript workaround
        } else {
            const numValue = parseFloat(value);
            if (!isNaN(numValue)) {
                setData(field, numValue);
            }
        }
    };

    // Helper para obtener valor de campo numérico
    const getNumberValue = (value: string | number | null): string => {
        if (value === '' || value === null) return '';
        return typeof value === 'string' ? value : value.toString();
    };

    return (
        <AppLayout title={modo === 'crear' ? 'Nuevo Técnico' : 'Editar Técnico'}>
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <div className="flex items-center gap-4 mb-4">
                        <a
                            href="/rrhh/equipos/tecnico"
                            className="text-gray-600 hover:text-gray-900"
                        >
                            <ArrowLeft size={20} />
                        </a>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">
                                {modo === 'crear' ? 'Nuevo Técnico' : 'Editar Técnico'}
                            </h1>
                            <p className="mt-1 text-gray-600">
                                {modo === 'crear' 
                                    ? 'Complete los datos para registrar un nuevo técnico'
                                    : 'Modifique los datos del técnico'}
                            </p>
                        </div>
                    </div>
                </div>
                {/* Alertas */}
                {showAlert && alertType === 'success' && (
                    <div className="mb-6">
                        <AlertSuccess 
                            message={alertMessage}
                            title="¡Éxito!"
                        />
                    </div>
                )}

                {showAlert && alertType === 'error' && (
                    <div className="mb-6">
                        <AlertError 
                            errors={[alertMessage]}
                            title="Error"
                        />
                    </div>
                )}
                {/* Formulario */}
                <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
                    <form onSubmit={handleSubmit}>
                        <div className="space-y-8">
                            {/* Información del Personal */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <h3 className="text-lg font-medium text-gray-900 mb-4 flex items-center gap-2">
                                    <User size={18} />
                                    Información del Personal
                                </h3>
                                
                                {modo === 'crear' ? (
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Seleccionar Personal
                                        </label>
                                        <select
                                            value={data.personal_id}
                                            onChange={(e) => setData('personal_id', e.target.value)}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-sat focus:border-sat"
                                            required
                                        >
                                            <option value="">Seleccione una persona</option>
                                            {personalDisponible.map((persona) => (
                                                <option key={persona.id} value={persona.id}>
                                                    {persona.nombre_completo} - {persona.telefono}
                                                </option>
                                            ))}
                                        </select>
                                        {errors.personal_id && (
                                            <p className="mt-1 text-sm text-red-600">{errors.personal_id}</p>
                                        )}
                                    </div>
                                ) : (
                                    <div className="p-3 bg-white rounded border">
                                        <div className="text-sm font-medium text-gray-900">
                                            {tecnico?.nombre_completo}
                                        </div>
                                        <div className="text-sm text-gray-600 mt-1">
                                            ID: {tecnico?.personal_id}
                                        </div>
                                    </div>
                                )}
                            </div>

                            {/* Dirección y Mapa */}
                            <div className="bg-gray-50 p-4 rounded-lg">
                                <div className="flex items-center justify-between mb-4">
                                    <h3 className="text-lg font-medium text-gray-900 flex items-center gap-2">
                                        <MapPin size={18} />
                                        Ubicación y Dirección
                                    </h3>
                                    <button
                                        type="button"
                                        onClick={toggleMapa}
                                        className="text-sm text-sat hover:text-sat-600 flex items-center gap-1"
                                    >
                                        {mostrarMapa ? 'Ocultar mapa' : 'Mostrar mapa'}
                                    </button>
                                </div>
                                
                                <div className="space-y-6">
                                    {/* Campo de dirección */}
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-2">
                                            Dirección Completa
                                        </label>
                                        <textarea
                                            value={data.direccion}
                                            onChange={(e) => setData('direccion', e.target.value)}
                                            rows={3}
                                            className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-sat focus:border-sat"
                                            placeholder="Calle, número, ciudad, provincia..."
                                            required
                                        />
                                        <p className="mt-1 text-xs text-gray-500">
                                            Ingresa la dirección completa para buscarla en el mapa
                                        </p>
                                        {errors.direccion && (
                                            <p className="mt-1 text-sm text-red-600">{errors.direccion}</p>
                                        )}
                                    </div>

                                    {/* Campos de coordenadas */}
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Latitud
                                            </label>
                                            <input
                                                type="number"
                                                step="any"
                                                value={getNumberValue(data.latitud)}
                                                onChange={(e) => handleNumberChange('latitud', e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-sat focus:border-sat"
                                                placeholder="-34.603722"
                                            />
                                            {errors.latitud && (
                                                <p className="mt-1 text-sm text-red-600">{errors.latitud}</p>
                                            )}
                                        </div>
                                        
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                                Longitud
                                            </label>
                                            <input
                                                type="number"
                                                step="any"
                                                value={getNumberValue(data.longitud)}
                                                onChange={(e) => handleNumberChange('longitud', e.target.value)}
                                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-sat focus:border-sat"
                                                placeholder="-58.381592"
                                            />
                                            {errors.longitud && (
                                                <p className="mt-1 text-sm text-red-600">{errors.longitud}</p>
                                            )}
                                        </div>
                                    </div>

                                    {/* Mapa */}
                                    {mostrarMapa && (
                                        <div className="mt-4">
                                            <MapaUbicacion
                                                latitud={typeof data.latitud === 'string' ? null : data.latitud}
                                                longitud={typeof data.longitud === 'string' ? null : data.longitud}
                                                direccion={data.direccion}
                                                onUbicacionCambiada={handleUbicacionCambiada}
                                                editable={true}
                                            />
                                        </div>
                                    )}

                                    {/* Nota sobre ubicación */}
                                    <div className="p-3 bg-blue-50 border border-blue-200 rounded">
                                        <p className="text-sm text-blue-800">
                                            <span className="font-medium">Nota:</span> Puedes usar el mapa interactivo para establecer las coordenadas fácilmente.
                                        </p>
                                    </div>
                                </div>
                            </div>

                        </div>

                        {/* Botones de acción */}
                        <div className="mt-8 pt-6 border-t border-gray-200 flex justify-end gap-3">
                            <a
                                href="/rrhh/equipos/tecnico"
                                className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                            >
                                Cancelar
                            </a>
                            <button
                                type="submit"
                                disabled={processing}
                                className="px-4 py-2 text-sm bg-sat text-white rounded hover:bg-sat-600 transition-colors flex items-center gap-2 disabled:opacity-50"
                            >
                                <Save size={16} />
                                {processing 
                                    ? (modo === 'crear' ? 'Creando...' : 'Actualizando...')
                                    : (modo === 'crear' ? 'Crear Técnico' : 'Actualizar Técnico')
                                }
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </AppLayout>
    );
}