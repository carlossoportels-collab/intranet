// resources/js/components/empresa/pasos/Paso1DatosLead.tsx

import React, { useState, useEffect, useRef } from 'react';
import { User, Phone, Mail, MapPin, Briefcase, Loader, AlertCircle, Search, X } from 'lucide-react';
import { Origen, Rubro, Provincia, Localidad } from '@/types/leads';

interface Props {
    data: any;
    origenes: Origen[];
    rubros: Rubro[];
    provincias: Provincia[];
    onChange: (field: string, value: any) => void;
    errores: Record<string, string>;
    localidadInicial?: string;
    provinciaInicial?: string | number;
    esComercial?: boolean;
    usuario?: any;
}

export default function Paso1DatosLead({
    data,
    origenes,
    rubros,
    provincias,
    onChange,
    errores,
    localidadInicial = '',
    provinciaInicial = '',
    esComercial = false,
    usuario
}: Props) {
    const [localidadSearch, setLocalidadSearch] = useState(localidadInicial);
    const [localidadesResult, setLocalidadesResult] = useState<Localidad[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedProvinciaId, setSelectedProvinciaId] = useState<string>(provinciaInicial ? String(provinciaInicial) : '');
    const [hasSearched, setHasSearched] = useState(false);
    const [hasSelected, setHasSelected] = useState(!!data.localidad_id);
    
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    // Helper para obtener errores específicos
    const getError = (field: string): string | undefined => {
        return errores[`lead.${field}`];
    };

    // Actualizar hasSelected cuando cambia localidad_id
    useEffect(() => {
        setHasSelected(!!data.localidad_id);
    }, [data.localidad_id]);

    // Cerrar dropdown al hacer clic fuera
    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setShowDropdown(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    // Buscar localidades cuando cambia el texto
    useEffect(() => {
        const searchLocalidades = async () => {
            if (hasSelected) {
                return;
            }
            
            if (localidadSearch.length >= 3) {
                setIsSearching(true);
                setHasSearched(true);
                try {
                    const params = new URLSearchParams();
                    params.append('search', localidadSearch);
                    if (selectedProvinciaId) {
                        params.append('provincia_id', selectedProvinciaId);
                    }
                    const response = await fetch(`/comercial/localidades/buscar?${params.toString()}`);
                    const result = await response.json();
                    
                    let localidades = [];
                    if (result.success && result.data) {
                        localidades = result.data;
                    } else if (Array.isArray(result)) {
                        localidades = result;
                    }
                    
                    const localidadesTransformadas = localidades.map((item: any) => ({
                        id: item.id,
                        nombre: item.nombre || item.localidad || '',
                        provincia: item.provincia || '',
                        codigo_postal: item.codigo_postal || '',
                        provincia_id: item.provincia_id,
                    }));
                    
                    setLocalidadesResult(localidadesTransformadas);
                    setShowDropdown(localidadesTransformadas.length > 0);
                } catch (error) {
                    console.error('Error buscando localidades:', error);
                    setLocalidadesResult([]);
                    setShowDropdown(false);
                } finally {
                    setIsSearching(false);
                }
            } else if (localidadSearch.length === 0) {
                setLocalidadesResult([]);
                setShowDropdown(false);
                setHasSearched(false);
            } else {
                setLocalidadesResult([]);
                setShowDropdown(false);
            }
        };

        const delayDebounce = setTimeout(() => {
            searchLocalidades();
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [localidadSearch, selectedProvinciaId, hasSelected]);

    const handleProvinciaChange = (value: string) => {
        setSelectedProvinciaId(value);
        onChange('localidad_id', '');
        setLocalidadSearch('');
        setLocalidadesResult([]);
        setShowDropdown(false);
        setHasSearched(false);
        setHasSelected(false);
        setTimeout(() => {
            inputRef.current?.focus();
        }, 100);
    };

    const handleLocalidadSelect = (localidad: Localidad) => {
        onChange('localidad_id', localidad.id);
        setLocalidadSearch(localidad.nombre);
        setShowDropdown(false);
        setLocalidadesResult([]);
        setHasSearched(false);
        setHasSelected(true);
    };

    const handleClearLocalidad = () => {
        onChange('localidad_id', '');
        setLocalidadSearch('');
        setLocalidadesResult([]);
        setShowDropdown(false);
        setHasSearched(false);
        setHasSelected(false);
        inputRef.current?.focus();
    };

    const showNoResults = hasSearched && 
                          !isSearching && 
                          !hasSelected && 
                          localidadSearch.length >= 3 && 
                          localidadesResult.length === 0;

    const showProvinciaSuggestion = localidadSearch.length >= 3 && !selectedProvinciaId;

    // Determinar el texto del comercial
    const nombreComercial = usuario?.nombre_completo || usuario?.personal?.nombre_completo || 'Comercial';

    return (
        <div className="space-y-6">
            {/* Header con mensaje para comercial o genérico */}
            <div className={`p-4 rounded-lg border ${esComercial ? 'bg-blue-50 border-blue-200' : 'bg-blue-50 border-blue-200'}`}>
                <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                        {esComercial ? (
                            <>
                                <h3 className="font-medium text-blue-900">
                                    Usted será asignado como comercial responsable
                                </h3>
                                <p className="text-sm text-blue-700 mt-1">{nombreComercial}</p>
                                <div className="mt-3 pt-3 border-t border-blue-200">
                                    <p className="text-sm text-blue-700 font-medium">Datos del Lead</p>
                                    <p className="text-xs text-blue-600 mt-1">
                                        Complete la información básica del cliente
                                    </p>
                                </div>
                            </>
                        ) : (
                            <>
                                <h3 className="font-medium text-blue-900">Datos del Lead</h3>
                                <p className="text-sm text-blue-700">Complete la información del cliente potencial</p>
                            </>
                        )}
                    </div>
                </div>
            </div>

            {/* Formulario de campos */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre completo */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Nombre completo <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={data.nombre_completo}
                            onChange={(e) => onChange('nombre_completo', e.target.value)}
                            className={`pl-10 w-full border ${getError('nombre_completo') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                            placeholder="Ej: Juan Pérez"
                        />
                    </div>
                    {getError('nombre_completo') && (
                        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3" />
                            {getError('nombre_completo')}
                        </p>
                    )}
                </div>

                {/* Género */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Género <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={data.genero}
                        onChange={(e) => onChange('genero', e.target.value)}
                        className={`w-full border ${getError('genero') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    >
                        <option value="no_especifica">No especifica</option>
                        <option value="masculino">Masculino</option>
                        <option value="femenino">Femenino</option>
                        <option value="otro">Otro</option>
                    </select>
                    {getError('genero') && (
                        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3" />
                            {getError('genero')}
                        </p>
                    )}
                </div>

                {/* Teléfono */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Teléfono <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="tel"
                            value={data.telefono}
                            onChange={(e) => onChange('telefono', e.target.value)}
                            className={`pl-10 w-full border ${getError('telefono') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                            placeholder="Ej: 011 1234-5678"
                        />
                    </div>
                    {getError('telefono') && (
                        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3" />
                            {getError('telefono')}
                        </p>
                    )}
                </div>

                {/* Email */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="email"
                            value={data.email}
                            onChange={(e) => onChange('email', e.target.value)}
                            className={`pl-10 w-full border ${getError('email') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                            placeholder="Ej: ejemplo@email.com"
                        />
                    </div>
                    {getError('email') && (
                        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3" />
                            {getError('email')}
                        </p>
                    )}
                </div>

                {/* Provincia */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Provincia <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={selectedProvinciaId}
                        onChange={(e) => handleProvinciaChange(e.target.value)}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Seleccionar provincia</option>
                        {provincias.map((prov) => (
                            <option key={prov.id} value={String(prov.id)}>
                                {prov.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Localidad con búsqueda */}
                <div className="space-y-2 relative" ref={dropdownRef}>
                    <label className="block text-sm font-medium text-gray-700">
                        Localidad <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            value={localidadSearch}
                            onChange={(e) => {
                                setLocalidadSearch(e.target.value);
                                if (e.target.value === '') {
                                    onChange('localidad_id', '');
                                    setHasSelected(false);
                                }
                            }}
                            className={`pl-10 pr-8 w-full border ${getError('localidad_id') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                            placeholder="Escriba al menos 3 letras..."
                            autoComplete="off"
                            disabled={hasSelected && !!data.localidad_id}
                        />
                        {localidadSearch && !hasSelected && (
                            <button
                                type="button"
                                onClick={handleClearLocalidad}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                            >
                                <X className="h-4 w-4" />
                            </button>
                        )}
                        {isSearching && (
                            <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                        )}
                    </div>
                    {getError('localidad_id') && (
                        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3" />
                            {getError('localidad_id')}
                        </p>
                    )}
                    
                    {showDropdown && localidadesResult.length > 0 && (
                        <div className="absolute z-20 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto" style={{ top: '100%' }}>
                            {localidadesResult.map((loc) => (
                                <button
                                    key={loc.id}
                                    type="button"
                                    onClick={() => handleLocalidadSelect(loc)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0 transition-colors"
                                >
                                    <div className="font-medium text-sm">{loc.nombre}</div>
                                    <div className="text-xs text-gray-500">
                                        {loc.provincia} {loc.codigo_postal ? `(CP: ${loc.codigo_postal})` : ''}
                                    </div>
                                </button>
                            ))}
                        </div>
                    )}
                    
                    {showNoResults && (
                        <p className="text-xs text-amber-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            No se encontraron localidades con ese nombre.
                        </p>
                    )}
                    
                    {showProvinciaSuggestion && (
                        <p className="text-xs text-blue-600 mt-1 flex items-center gap-1">
                            <AlertCircle className="h-3 w-3" />
                            Seleccione una provincia para obtener mejores resultados.
                        </p>
                    )}
                    
                    <p className="text-xs text-gray-500">
                        {selectedProvinciaId 
                            ? 'Escriba al menos 3 letras para buscar localidades' 
                            : 'Primero seleccione una provincia'}
                    </p>
                </div>

                {/* Rubro */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Rubro <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select
                            value={data.rubro_id}
                            onChange={(e) => onChange('rubro_id', e.target.value ? Number(e.target.value) : '')}
                            className={`pl-10 w-full border ${getError('rubro_id') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                        >
                            <option value="">Seleccione un rubro</option>
                            {rubros.map((rubro) => (
                                <option key={rubro.id} value={rubro.id}>{rubro.nombre}</option>
                            ))}
                        </select>
                    </div>
                    {getError('rubro_id') && (
                        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3" />
                            {getError('rubro_id')}
                        </p>
                    )}
                </div>

                {/* Origen de contacto */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Origen de contacto <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={data.origen_id}
                        onChange={(e) => onChange('origen_id', e.target.value ? Number(e.target.value) : '')}
                        className={`w-full border ${getError('origen_id') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                    >
                        <option value="">¿Cómo nos contactó?</option>
                        {origenes.map((origen) => (
                            <option key={origen.id} value={origen.id}>{origen.nombre}</option>
                        ))}
                    </select>
                    {getError('origen_id') && (
                        <p className="text-xs text-red-600 flex items-center gap-1 mt-1">
                            <AlertCircle className="h-3 w-3" />
                            {getError('origen_id')}
                        </p>
                    )}
                </div>
            </div>

            {/* Nota de campos obligatorios */}
            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-700">
                    <strong>Nota:</strong> Todos los campos marcados con <span className="text-red-500">*</span> son obligatorios.
                </p>
            </div>
        </div>
    );
}