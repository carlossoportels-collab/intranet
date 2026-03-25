// resources/js/components/empresa/pasos/Paso1DatosLead.tsx
import React, { useState, useEffect } from 'react';
import { User, Phone, Mail, MapPin, Briefcase, Loader, AlertCircle } from 'lucide-react';
import { Origen, Rubro, Provincia, Localidad } from '@/types/leads';

interface Props {
    data: any;
    origenes: Origen[];
    rubros: Rubro[];
    provincias: Provincia[];
    onChange: (field: string, value: any) => void;
    errores: Record<string, string>;
    localidadInicial?: string;
    provinciaInicial?: string | number; // ← Cambiado para aceptar string o number
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
    const [localidadSearch, setLocalidadSearch] = useState(localidadInicial);
    const [localidadesResult, setLocalidadesResult] = useState<Localidad[]>([]);
    const [showDropdown, setShowDropdown] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [selectedProvinciaId, setSelectedProvinciaId] = useState<string>(provinciaInicial ? String(provinciaInicial) : '');

    // Buscar localidades cuando cambia el texto
    useEffect(() => {
        const searchLocalidades = async () => {
            if (localidadSearch.length >= 3) {
                setIsSearching(true);
                try {
                    const params = new URLSearchParams();
                    params.append('search', localidadSearch);
                    if (selectedProvinciaId) {
                        params.append('provincia_id', selectedProvinciaId);
                    }
                    const response = await fetch(`/comercial/localidades/buscar?${params.toString()}`);
                    const results = await response.json();
                    setLocalidadesResult(results);
                    setShowDropdown(true);
                } catch (error) {
                    console.error('Error buscando localidades:', error);
                } finally {
                    setIsSearching(false);
                }
            } else {
                setLocalidadesResult([]);
                setShowDropdown(false);
            }
        };

        const delayDebounce = setTimeout(() => {
            searchLocalidades();
        }, 300);

        return () => clearTimeout(delayDebounce);
    }, [localidadSearch, selectedProvinciaId]);

    const handleProvinciaChange = (value: string) => {
        setSelectedProvinciaId(value);
        // Limpiar localidad cuando cambia la provincia
        onChange('localidad_id', '');
        setLocalidadSearch('');
        setLocalidadesResult([]);
        setShowDropdown(false);
    };

    const getError = (field: string): string | undefined => {
        return errores[`lead.${field}`];
    };

    return (
        <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                <h3 className="font-medium text-blue-900 mb-2">Datos del Lead</h3>
                <p className="text-sm text-blue-700">Complete la información del cliente potencial</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Nombre completo */}
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

                {/* Género */}
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

                {/* Teléfono */}
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

                {/* Email */}
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

                {/* Provincia */}
                <div className="space-y-2">
                    <label htmlFor="provincia_id" className="block text-sm font-medium text-gray-700">
                        Provincia
                    </label>
                    <select
                        id="provincia_id"
                        value={selectedProvinciaId}
                        onChange={(e) => handleProvinciaChange(e.target.value)}
                        className="w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                        <option value="">Todas las provincias</option>
                        {provincias.map((prov) => (
                            <option key={prov.id} value={String(prov.id)}>
                                {prov.nombre}
                            </option>
                        ))}
                    </select>
                </div>

                {/* Localidad */}
                <div className="space-y-2">
                    <label htmlFor="localidad" className="block text-sm font-medium text-gray-700">
                        Localidad <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            id="localidad"
                            value={localidadSearch}
                            onChange={(e) => {
                                setLocalidadSearch(e.target.value);
                                if (e.target.value === '') {
                                    onChange('localidad_id', '');
                                }
                            }}
                            className={`pl-10 w-full border ${getError('localidad_id') ? 'border-red-500' : 'border-gray-300'} rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-blue-500 focus:border-blue-500`}
                            placeholder="Escriba al menos 3 letras..."
                        />
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
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {localidadesResult.map((loc) => (
                                <button
                                    key={loc.id}
                                    type="button"
                                    onClick={() => {
                                        onChange('localidad_id', loc.id);
                                        setLocalidadSearch(loc.nombre);
                                        setShowDropdown(false);
                                    }}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 border-b border-gray-100 last:border-b-0"
                                >
                                    <div className="font-medium">{loc.nombre}</div>
                                    <div className="text-xs text-gray-500">{loc.provincia} (CP: {loc.codigo_postal})</div>
                                </button>
                            ))}
                        </div>
                    )}
                    <p className="text-xs text-gray-500">
                        Escriba al menos 3 letras para buscar localidades
                    </p>
                </div>

                {/* Rubro */}
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

                {/* Origen */}
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