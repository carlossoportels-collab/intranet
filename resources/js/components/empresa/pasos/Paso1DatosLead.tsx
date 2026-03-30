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
    esComercial?: boolean;      // ← Nueva prop
    usuario?: any;              // ← Nueva prop
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
    
    // Ref para el dropdown
    const dropdownRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

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

    const getError = (field: string): string | undefined => {
        return errores[`lead.${field}`];
    };

    const showNoResults = hasSearched && 
                          !isSearching && 
                          !hasSelected && 
                          localidadSearch.length >= 3 && 
                          localidadesResult.length === 0;

    const showProvinciaSuggestion = localidadSearch.length >= 3 && !selectedProvinciaId;

    // Si es comercial, mostrar información de que se asignará automáticamente
if (esComercial && usuario?.comercial?.prefijo_id) {
    return (
        <div className="space-y-6">
            {/* 🔥 UN SOLO MENSAJE INTEGRADO */}
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                    <User className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                        <h3 className="font-medium text-blue-900">
                            Usted será asignado como comercial responsable
                        </h3>
                        <p className="text-sm text-blue-700 mt-1">
                            {usuario.nombre_completo || usuario?.personal?.nombre_completo || 'Comercial'}
                        </p>
                        <div className="mt-3 pt-3 border-t border-blue-200">
                            <p className="text-sm text-blue-700 font-medium">Datos del Lead</p>
                            <p className="text-xs text-blue-600 mt-1">
                                Complete la información del cliente basica
                            </p>
                        </div>
                    </div>
                </div>
            </div>


                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Los mismos campos de siempre */}
                    <div className="space-y-2">
                        <label htmlFor="nombre_completo" className="block text-sm font-medium text-gray-700">
                            Nombre completo <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                id="nombre_completo"
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

                    <div className="space-y-2">
                        <label htmlFor="genero" className="block text-sm font-medium text-gray-700">
                            Género <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="genero"
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

                    <div className="space-y-2">
                        <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                            Teléfono <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="tel"
                                id="telefono"
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

                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="email"
                                id="email"
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

                    <div className="space-y-2">
                        <label htmlFor="provincia_id" className="block text-sm font-medium text-gray-700">
                            Provincia <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="provincia_id"
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

                    <div className="space-y-2 relative" ref={dropdownRef}>
                        <label htmlFor="localidad" className="block text-sm font-medium text-gray-700">
                            Localidad <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                ref={inputRef}
                                type="text"
                                id="localidad"
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

                    <div className="space-y-2">
                        <label htmlFor="rubro_id" className="block text-sm font-medium text-gray-700">
                            Rubro <span className="text-red-500">*</span>
                        </label>
                        <div className="relative">
                            <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <select
                                id="rubro_id"
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

                    <div className="space-y-2">
                        <label htmlFor="origen_id" className="block text-sm font-medium text-gray-700">
                            Origen de contacto <span className="text-red-500">*</span>
                        </label>
                        <select
                            id="origen_id"
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

                <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                    <p className="text-xs text-yellow-700">
                        <strong>Nota:</strong> Todos los campos marcados con <span className="text-red-500">*</span> son obligatorios.
                    </p>
                </div>
            </div>
        );
    }

    // Si no es comercial, mostrar el formulario normal
    return (
        <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2">Datos del Lead</h3>
                <p className="text-sm text-blue-700">Complete la información del cliente potencial</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Todos los campos igual que arriba */}
                <div className="space-y-2">
                    <label htmlFor="nombre_completo" className="block text-sm font-medium text-gray-700">
                        Nombre completo <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            id="nombre_completo"
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

                <div className="space-y-2">
                    <label htmlFor="genero" className="block text-sm font-medium text-gray-700">
                        Género <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="genero"
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

                <div className="space-y-2">
                    <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                        Teléfono <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="tel"
                            id="telefono"
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

                <div className="space-y-2">
                    <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                        Email <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="email"
                            id="email"
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

                <div className="space-y-2">
                    <label htmlFor="provincia_id" className="block text-sm font-medium text-gray-700">
                        Provincia <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="provincia_id"
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

                <div className="space-y-2 relative" ref={dropdownRef}>
                    <label htmlFor="localidad" className="block text-sm font-medium text-gray-700">
                        Localidad <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            ref={inputRef}
                            type="text"
                            id="localidad"
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

                <div className="space-y-2">
                    <label htmlFor="rubro_id" className="block text-sm font-medium text-gray-700">
                        Rubro <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select
                            id="rubro_id"
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

                <div className="space-y-2">
                    <label htmlFor="origen_id" className="block text-sm font-medium text-gray-700">
                        Origen de contacto <span className="text-red-500">*</span>
                    </label>
                    <select
                        id="origen_id"
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

            <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                <p className="text-xs text-yellow-700">
                    <strong>Nota:</strong> Todos los campos marcados con <span className="text-red-500">*</span> son obligatorios.
                </p>
            </div>
        </div>
    );
}