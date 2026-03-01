// resources/js/components/empresa/pasos/Paso1DatosLead.tsx
import { User, Phone, Mail, MapPin, Briefcase, Building, Loader } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { DatosLeadForm } from '@/types/empresa';
import { Origen, Rubro, Provincia, Localidad } from '@/types/leads';

interface Props {
    data: DatosLeadForm;
    origenes: Origen[];
    rubros: Rubro[];
    provincias: Provincia[];
    onChange: (field: string, value: any) => void;
    errores: Record<string, string>;
    localidadInicial?: string;
    provinciaInicial?: number | string;
}

export default function Paso1DatosLead({
    data,
    origenes,
    rubros,
    provincias,
    onChange,
    errores,
    localidadInicial = '',
    provinciaInicial = ''
}: Props) {
    const [searchLocalidad, setSearchLocalidad] = useState(localidadInicial);
    const [showLocalidadesDropdown, setShowLocalidadesDropdown] = useState(false);
    const [isSearchingLocalidades, setIsSearchingLocalidades] = useState(false);
    const [localidadesResult, setLocalidadesResult] = useState<Localidad[]>([]);
    const [provinciaId, setProvinciaId] = useState<number | string>(provinciaInicial);

    // Actualizar cuando cambian las props iniciales
    useEffect(() => {
        if (localidadInicial) {
            setSearchLocalidad(localidadInicial);
        }
        if (provinciaInicial) {
            setProvinciaId(provinciaInicial);
        }
    }, [localidadInicial, provinciaInicial]);

    // Cuando cambia la provincia en el select, actualizamos estado local y limpiamos localidad
    const handleProvinciaChange = (value: string) => {
        setProvinciaId(value);
        onChange('localidad_id', ''); // Limpiar localidad en el formData
        setSearchLocalidad('');
        setLocalidadesResult([]);
        setShowLocalidadesDropdown(false);
    };

    // Búsqueda de localidades
    const handleLocalidadSearch = async (searchTerm: string) => {
        setSearchLocalidad(searchTerm);
        
        if (searchTerm.length < 3) {
            setLocalidadesResult([]);
            setShowLocalidadesDropdown(false);
            return;
        }
        
        setIsSearchingLocalidades(true);
        
        try {
            // Construir params correctamente
            const params = new URLSearchParams();
            params.append('search', searchTerm);
            
            if (provinciaId) {
                params.append('provincia_id', provinciaId.toString());
            }
            
            const response = await fetch(`/comercial/localidades/buscar?${params}`);
            const result = await response.json();
            
            if (result.success) {
                const localidadesTransformadas = result.data.map((item: any) => ({
                    id: item.id,
                    nombre: item.nombre || item.localidad, // ← Cambiado a 'nombre'
                    provincia_id: item.provincia_id,
                    provincia: item.provincia,
                    codigo_postal: item.codigo_postal,
                }));
                
                setLocalidadesResult(localidadesTransformadas);
                setShowLocalidadesDropdown(true);
            }
        } catch (error) {
            console.error('Error buscando localidades:', error);
        } finally {
            setIsSearchingLocalidades(false);
        }
    };

    // Al seleccionar una localidad
    const handleLocalidadSelect = (localidad: Localidad) => {
        onChange('localidad_id', localidad.id);
        setSearchLocalidad(localidad.nombre); // ← Cambiado a 'nombre'
        setProvinciaId(localidad.provincia_id?.toString() || '');
        setShowLocalidadesDropdown(false);
        setLocalidadesResult([]);
    };

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200 mb-6">
                <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-blue-600" />
                    <div>
                        <h3 className="font-medium text-blue-900">Datos del Lead</h3>
                        <p className="text-sm text-blue-700">
                            Complete o confirme la información del contacto principal (todos los campos son obligatorios)
                        </p>
                    </div>
                </div>
            </div>

            {/* Nombre completo */}
            <div className="space-y-2">
                <label htmlFor="nombre_completo" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    Nombre completo <span className="text-red-500">*</span>
                </label>
                <input
                    type="text"
                    id="nombre_completo"
                    name="nombre_completo"
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                        errores['lead.nombre_completo'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                    value={data.nombre_completo}
                    onChange={(e) => onChange('nombre_completo', e.target.value)}
                    required
                />
                {errores['lead.nombre_completo'] && (
                    <p className="text-xs text-red-600">{errores['lead.nombre_completo']}</p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Email */}
                <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Mail className="h-4 w-4" />
                        Email <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="email"
                        id="email"
                        name="email"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            errores['lead.email'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        value={data.email}
                        onChange={(e) => onChange('email', e.target.value)}
                        required
                    />
                    {errores['lead.email'] && (
                        <p className="text-xs text-red-600">{errores['lead.email']}</p>
                    )}
                </div>

                {/* Teléfono */}
                <div className="space-y-2">
                    <label htmlFor="telefono" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Phone className="h-4 w-4" />
                        Teléfono <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="tel"
                        id="telefono"
                        name="telefono"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            errores['lead.telefono'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        value={data.telefono}
                        onChange={(e) => onChange('telefono', e.target.value)}
                        required
                    />
                    {errores['lead.telefono'] && (
                        <p className="text-xs text-red-600">{errores['lead.telefono']}</p>
                    )}
                </div>

                {/* Género */}
                <div className="space-y-2">
                    <label htmlFor="genero" className="block text-sm font-medium text-gray-700">
                        Género <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="genero"
                        name="genero"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            errores['lead.genero'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        value={data.genero}
                        onChange={(e) => onChange('genero', e.target.value)}
                        required
                    >
                        <option value="no_especifica">No especifica</option>
                        <option value="masculino">Masculino</option>
                        <option value="femenino">Femenino</option>
                        <option value="otro">Otro</option>
                    </select>
                    {errores['lead.genero'] && (
                        <p className="text-xs text-red-600">{errores['lead.genero']}</p>
                    )}
                </div>

                {/* Provincia */}
                <div className="space-y-2">
                    <label htmlFor="provincia_id" className="block text-sm font-medium text-gray-700">
                        Provincia <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="provincia_id"
                        name="provincia_id"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            errores['lead.provincia_id'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        value={provinciaId}
                        onChange={(e) => handleProvinciaChange(e.target.value)}
                        required
                    >
                        <option value="">Seleccionar provincia</option>
                        {provincias.map((provincia) => (
                            <option key={provincia.id} value={provincia.id}>
                                {provincia.nombre} {/* ← Cambiado de 'provincia' a 'nombre' */}
                            </option>
                        ))}
                    </select>
                    {errores['lead.provincia_id'] && (
                        <p className="text-xs text-red-600">{errores['lead.provincia_id']}</p>
                    )}
                </div>
            </div>

            {/* Localidad con autocomplete */}
            <div className="space-y-2">
                <label htmlFor="localidad_nombre" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                    <MapPin className="h-4 w-4" />
                    Localidad <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <input
                        type="text"
                        id="localidad_nombre"
                        name="localidad_nombre"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            errores['lead.localidad_id'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        value={searchLocalidad}
                        onChange={(e) => handleLocalidadSearch(e.target.value)}
                        placeholder="Escriba al menos 3 letras para buscar..."
                        required
                    />
                    {isSearchingLocalidades && (
                        <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                    )}
                    
                    {/* Dropdown de resultados */}
                    {showLocalidadesDropdown && localidadesResult.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {localidadesResult.map((localidad) => (
                                <button
                                    key={localidad.id}
                                    type="button"
                                    onClick={() => handleLocalidadSelect(localidad)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 border-b border-gray-100 last:border-b-0"
                                >
                                    <div className="font-medium">{localidad.nombre}</div> {/* ← Cambiado a 'nombre' */}
                                    <div className="text-sm text-gray-600">
                                        {localidad.provincia}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {errores['lead.localidad_id'] && (
                    <p className="text-xs text-red-600">{errores['lead.localidad_id']}</p>
                )}
                <p className="text-xs text-gray-500">
                    Escriba al menos 3 letras para buscar localidades
                </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Rubro */}
                <div className="space-y-2">
                    <label htmlFor="rubro_id" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Briefcase className="h-4 w-4" />
                        Rubro <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="rubro_id"
                        name="rubro_id"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            errores['lead.rubro_id'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        value={data.rubro_id}
                        onChange={(e) => onChange('rubro_id', e.target.value ? Number(e.target.value) : '')}
                        required
                    >
                        <option value="">Seleccionar rubro</option>
                        {rubros.map(rubro => (
                            <option key={rubro.id} value={rubro.id}>
                                {rubro.nombre}
                            </option>
                        ))}
                    </select>
                    {errores['lead.rubro_id'] && (
                        <p className="text-xs text-red-600">{errores['lead.rubro_id']}</p>
                    )}
                </div>

                {/* Origen */}
                <div className="space-y-2">
                    <label htmlFor="origen_id" className="block text-sm font-medium text-gray-700 flex items-center gap-2">
                        <Building className="h-4 w-4" />
                        Origen <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="origen_id"
                        name="origen_id"
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                            errores['lead.origen_id'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        value={data.origen_id}
                        onChange={(e) => onChange('origen_id', e.target.value ? Number(e.target.value) : '')}
                        required
                    >
                        <option value="">Seleccionar origen</option>
                        {origenes.map(origen => (
                            <option key={origen.id} value={origen.id}>
                                {origen.nombre}
                            </option>
                        ))}
                    </select>
                    {errores['lead.origen_id'] && (
                        <p className="text-xs text-red-600">{errores['lead.origen_id']}</p>
                    )}
                </div>
            </div>
        </div>
    );
}