// resources/js/components/contratos/sections/ResponsablesSection.tsx
import { Plus, Trash2, User, ChevronDown, ChevronUp } from 'lucide-react';
import React, { useState } from 'react';

interface Props {
    responsables: any[];
    setResponsables: (responsables: any[]) => void;
    tiposResponsabilidad: any[];
    empresaId: number;
    tipoResponsabilidadContacto?: number;
}

export default function ResponsablesSection({
    responsables,
    setResponsables,
    tiposResponsabilidad,
    empresaId,
    tipoResponsabilidadContacto = 0
}: Props) {
    const [isExpanded, setIsExpanded] = useState(false);
    const [showForm, setShowForm] = useState(false);
    const [nuevoResponsable, setNuevoResponsable] = useState({
        tipo_responsabilidad_id: '',
        nombre_completo: '',
        telefono: '',
        email: ''
    });

    // Filtrar solo responsables activos
    const responsablesActivos = responsables.filter(r => r.es_activo !== false);
    
    const tieneResponsableFlota = responsablesActivos.some(r => r.tipo_responsabilidad_id === 3);
    const tieneResponsablePagos = responsablesActivos.some(r => r.tipo_responsabilidad_id === 4);
    const tieneResponsableAmbos = responsablesActivos.some(r => r.tipo_responsabilidad_id === 5);

    // Determinar qué opciones mostrar
    const getOpcionesDisponibles = () => {
        const opciones = [];
        
        if (tieneResponsableAmbos) return [];
        
        if (!tieneResponsableFlota && tipoResponsabilidadContacto !== 3) {
            const tipo = tiposResponsabilidad.find(t => t.id === 3);
            if (tipo) opciones.push(tipo);
        }
        
        if (!tieneResponsablePagos && tipoResponsabilidadContacto !== 4) {
            const tipo = tiposResponsabilidad.find(t => t.id === 4);
            if (tipo) opciones.push(tipo);
        }
        
        if (!tieneResponsableFlota && !tieneResponsablePagos && !tieneResponsableAmbos) {
            const tipo = tiposResponsabilidad.find(t => t.id === 5);
            if (tipo) opciones.push(tipo);
        }
        
        return opciones;
    };

    const opcionesDisponibles = getOpcionesDisponibles();

    const getMensajeInformativo = () => {
        if (tieneResponsableAmbos) {
            return 'Ya existe un responsable de flota y pagos.';
        }
        
        switch(tipoResponsabilidadContacto) {
            case 5:
                return 'El contacto principal es responsable de flota y pagos.';
            case 4:
                return tieneResponsableFlota 
                    ? 'Contacto principal responsable de pagos.'
                    : 'Contacto principal responsable de pagos. Debe agregar responsable de flota.';
            case 3:
                return tieneResponsablePagos
                    ? 'Contacto principal responsable de flota.'
                    : 'Contacto principal responsable de flota. Debe agregar responsable de pagos.';
            default:
                if (tieneResponsableFlota && tieneResponsablePagos) {
                    return 'Ya tiene responsables de flota y pagos.';
                } else if (tieneResponsableFlota) {
                    return 'Debe agregar responsable de pagos.';
                } else if (tieneResponsablePagos) {
                    return 'Debe agregar responsable de flota.';
                } else {
                    return 'Debe agregar responsables de flota y/o pagos.';
                }
        }
    };

    const handleInputChange = (field: string, value: string) => {
        if (field === 'telefono') {
            const soloNumeros = value.replace(/\D/g, '');
            if (soloNumeros.length <= 20) {
                setNuevoResponsable(prev => ({ ...prev, [field]: soloNumeros }));
            }
        } else {
            setNuevoResponsable(prev => ({ ...prev, [field]: value }));
        }
    };

    // 🔥 Guardar responsable en el estado LOCAL, no en el backend
    const agregarResponsableLocal = () => {
        if (!nuevoResponsable.tipo_responsabilidad_id) {
            return; // Toast manejado por el padre si es necesario
        }
        if (!nuevoResponsable.nombre_completo) {
            return;
        }

        const nuevoId = Date.now(); // ID temporal para el estado local
        
        const nuevoResp = {
            id: nuevoId,
            empresa_id: empresaId,
            tipo_responsabilidad_id: parseInt(nuevoResponsable.tipo_responsabilidad_id),
            tipo_responsabilidad: tiposResponsabilidad.find(t => t.id === parseInt(nuevoResponsable.tipo_responsabilidad_id)),
            nombre_completo: nuevoResponsable.nombre_completo,
            telefono: nuevoResponsable.telefono || null,
            email: nuevoResponsable.email || null,
            es_activo: true,
            is_new: true // Marcar como nuevo para saber que hay que guardarlo
        };

        setResponsables([...responsables, nuevoResp]);
        
        // Resetear formulario
        setNuevoResponsable({
            tipo_responsabilidad_id: '',
            nombre_completo: '',
            telefono: '',
            email: ''
        });
        setShowForm(false);
    };

    // 🔥 Eliminar responsable del estado LOCAL
    const eliminarResponsableLocal = (id: number) => {
        setResponsables(responsables.map(r => 
            r.id === id ? { ...r, es_activo: false, deleted: true } : r
        ));
    };

    const cancelar = () => {
        setNuevoResponsable({
            tipo_responsabilidad_id: '',
            nombre_completo: '',
            telefono: '',
            email: ''
        });
        setShowForm(false);
    };

    const puedeAgregar = opcionesDisponibles.length > 0 && !tieneResponsableAmbos;
    const cantidadActivos = responsablesActivos.length;

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <button
                type="button"
                onClick={() => setIsExpanded(!isExpanded)}
                className="w-full px-4 py-3 bg-gray-50 border-b border-gray-200 flex items-center justify-between hover:bg-gray-100 transition-colors"
            >
                <div className="flex items-center gap-2">
                    <User className="h-4 w-4 text-gray-600" />
                    <h3 className="font-medium text-gray-900">Responsables de Flota y Pagos</h3>
                    {cantidadActivos > 0 && (
                        <span className="text-xs bg-gray-200 text-gray-700 px-2 py-0.5 rounded-full">
                            {cantidadActivos}
                        </span>
                    )}
                </div>
                <div className="flex items-center gap-2">
                    {!isExpanded && (
                        <span className="text-xs text-gray-400 truncate max-w-[200px]">{getMensajeInformativo()}</span>
                    )}
                    {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-gray-400" />
                    ) : (
                        <ChevronDown className="h-4 w-4 text-gray-400" />
                    )}
                </div>
            </button>
            
            {isExpanded && (
                <div className="p-4 space-y-4">
                    <div className="flex justify-between items-center">
                        <p className="text-xs text-gray-500">{getMensajeInformativo()}</p>
                        {!showForm && puedeAgregar && (
                            <button
                                type="button"
                                onClick={() => setShowForm(true)}
                                className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
                            >
                                <Plus className="h-4 w-4" />
                                Agregar responsable
                            </button>
                        )}
                    </div>
                    
                    {showForm && (
                        <div className="border border-gray-200 bg-white rounded-lg p-4">
                            <h4 className="text-sm font-medium text-gray-900 mb-3">Nuevo responsable</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">
                                        Tipo <span className="text-red-500">*</span>
                                    </label>
                                    <select
                                        value={nuevoResponsable.tipo_responsabilidad_id}
                                        onChange={(e) => handleInputChange('tipo_responsabilidad_id', e.target.value)}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                    >
                                        <option value="">Seleccionar</option>
                                        {opcionesDisponibles.map(tipo => (
                                            <option key={tipo.id} value={tipo.id}>
                                                {tipo.nombre}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                                <div className="col-span-2">
                                    <label className="block text-xs text-gray-600 mb-1">
                                        Nombre Completo <span className="text-red-500">*</span>
                                    </label>
                                    <input
                                        type="text"
                                        value={nuevoResponsable.nombre_completo}
                                        onChange={(e) => handleInputChange('nombre_completo', e.target.value)}
                                        maxLength={200}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="Nombre y apellido"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">
                                        Teléfono <span className="text-gray-400 text-[10px]">(solo números)</span>
                                    </label>
                                    <input
                                        type="tel"
                                        value={nuevoResponsable.telefono}
                                        onChange={(e) => handleInputChange('telefono', e.target.value)}
                                        maxLength={20}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="Ej: 1144170730"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs text-gray-600 mb-1">
                                        Email <span className="text-gray-400 text-[10px]">(opcional)</span>
                                    </label>
                                    <input
                                        type="email"
                                        value={nuevoResponsable.email}
                                        onChange={(e) => handleInputChange('email', e.target.value)}
                                        maxLength={150}
                                        className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-green-500 focus:border-transparent"
                                        placeholder="ejemplo@correo.com"
                                    />
                                </div>
                            </div>
                            <div className="flex justify-end gap-2 mt-4">
                                <button
                                    type="button"
                                    onClick={cancelar}
                                    className="px-3 py-1.5 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
                                >
                                    Cancelar
                                </button>
                                <button
                                    type="button"
                                    onClick={agregarResponsableLocal}
                                    className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
                                >
                                    Agregar
                                </button>
                            </div>
                        </div>
                    )}

                    {responsablesActivos.length > 0 && (
                        <div className="space-y-3">
                            {responsablesActivos.map((resp) => (
                                <div key={resp.id} className="border border-gray-200 rounded-lg p-4">
                                    <div className="flex justify-between items-start mb-3">
                                        <div>
                                            <h4 className="font-medium text-sm text-gray-900">
                                                {resp.tipo_responsabilidad_id === 3 ? '🚛 Responsable de Flota' : 
                                                 resp.tipo_responsabilidad_id === 4 ? '💰 Responsable de Pagos' : 
                                                 '👤 Responsable de Flota y Pagos'}
                                            </h4>
                                            <p className="text-xs text-gray-500">{resp.tipo_responsabilidad?.nombre}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => eliminarResponsableLocal(resp.id)}
                                            className="text-red-600 hover:text-red-700 transition-colors"
                                        >
                                            <Trash2 className="h-4 w-4" />
                                        </button>
                                    </div>
                                    
                                    <div className="grid grid-cols-2 gap-2 text-sm">
                                        <div className="col-span-2">
                                            <p className="text-xs text-gray-500">Nombre completo</p>
                                            <p className="text-sm font-medium">{resp.nombre_completo}</p>
                                        </div>
                                        {resp.telefono && (
                                            <div>
                                                <p className="text-xs text-gray-500">Teléfono</p>
                                                <p className="text-sm">{resp.telefono}</p>
                                            </div>
                                        )}
                                        {resp.email && (
                                            <div>
                                                <p className="text-xs text-gray-500">Email</p>
                                                <p className="text-sm break-all">{resp.email}</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                    
                    {/* Indicador de que hay cambios pendientes */}
                    {responsables.some(r => r.is_new || r.deleted) && (
                        <div className="text-xs text-yellow-600 bg-yellow-50 p-2 rounded border border-yellow-200">
                            ⚠️ Hay cambios pendientes. Guarde el contrato para aplicar los cambios.
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}