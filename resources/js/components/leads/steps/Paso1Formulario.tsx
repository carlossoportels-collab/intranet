// resources/js/components/leads/steps/Paso1Formulario.tsx
import React from 'react';
import { User, Phone, Mail, MapPin, Briefcase, Loader } from 'lucide-react';
import { Origen, Rubro, Provincia, Localidad, Comercial } from '@/types/leads';

interface Paso1FormularioProps {
    formData: any;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    handleLocalidadSearch: (searchTerm: string) => void;
    handleLocalidadSelect: (localidad: Localidad) => void;
    onSubmit: (e: React.FormEvent) => void; // Añadimos esta prop
    esComercial: boolean;
    hayComerciales: boolean;
    comerciales: Comercial[];
    origenes: Origen[];
    rubros: Rubro[];
    provincias: Provincia[];
    localidadesResult: Localidad[];
    showLocalidadesDropdown: boolean;
    isSearchingLocalidades: boolean;
    isSubmitting: boolean;
    onClose: () => void;
    usuario: any;
}

export default function Paso1Formulario({
    formData,
    handleChange,
    handleLocalidadSearch,
    handleLocalidadSelect,
    onSubmit, // Recibimos la función
    esComercial,
    hayComerciales,
    comerciales,
    origenes,
    rubros,
    provincias,
    localidadesResult,
    showLocalidadesDropdown,
    isSearchingLocalidades,
    isSubmitting,
    onClose,
    usuario
}: Paso1FormularioProps) {
    return (
        <form onSubmit={onSubmit}> {/* Usamos onSubmit aquí */}
            <div className="space-y-6">
                {/* Asignación de comercial */}
                <div className="space-y-2">
                    {esComercial ? (
                        <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <div className="flex items-center gap-3">
                                <User className="h-5 w-5 text-blue-600" />
                                <div>
                                    <h3 className="font-medium text-blue-900">
                                        Usted será asignado como comercial
                                    </h3>
                                    <p className="text-sm text-blue-700 mt-1">
                                        {usuario.nombre_completo}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ) : hayComerciales ? (
                        <div className="space-y-2">
                            <label htmlFor="prefijo_id" className="block text-sm font-medium text-gray-700">
                                Comercial a asignar *
                            </label>
                            <select
                                id="prefijo_id"
                                name="prefijo_id"
                                value={formData.prefijo_id}
                                onChange={handleChange}
                                required
                                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-sat focus:border-sat rounded-md"
                            >
                                <option value="">Seleccione un comercial</option>
                                {comerciales.map((comercial) => (
                                    <option key={comercial.id} value={comercial.prefijo_id}>
                                        {comercial.nombre}
                                    </option>
                                ))}
                            </select>
                            <p className="text-xs text-gray-500">
                                Seleccione el comercial que atenderá este lead
                            </p>
                        </div>
                    ) : (
                        <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            <div className="flex items-center gap-2">
                                <User className="h-5 w-5 text-yellow-600" />
                                <div>
                                    <h3 className="font-medium text-yellow-900">
                                        No hay comerciales disponibles
                                    </h3>
                                    <p className="text-sm text-yellow-700 mt-1">
                                        El lead se creará sin comercial asignado
                                    </p>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                {/* Resto del formulario igual... */}
                {/* Nombre y Género en fila */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor="nombre_completo" className="block text-sm font-medium text-gray-700">
                            Nombre completo *
                        </label>
                        <div className="relative">
                            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                id="nombre_completo"
                                name="nombre_completo"
                                value={formData.nombre_completo}
                                onChange={handleChange}
                                placeholder="Ej: Juan Pérez"
                                className="pl-10 mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sat focus:border-sat"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="genero" className="block text-sm font-medium text-gray-700">
                            Género
                        </label>
                        <select
                            id="genero"
                            name="genero"
                            value={formData.genero}
                            onChange={handleChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-sat focus:border-sat rounded-md"
                        >
                            <option value="no_especifica">No especifica</option>
                            <option value="masculino">Masculino</option>
                            <option value="femenino">Femenino</option>
                            <option value="otro">Otro</option>
                        </select>
                    </div>
                </div>

                {/* Teléfono y Email en fila */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor="telefono" className="block text-sm font-medium text-gray-700">
                            Teléfono
                        </label>
                        <div className="relative">
                            <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="tel"
                                id="telefono"
                                name="telefono"
                                value={formData.telefono}
                                onChange={handleChange}
                                placeholder="Ej: 011 1234-5678"
                                className="pl-10 mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sat focus:border-sat"
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                            Email
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="email"
                                id="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                placeholder="Ej: ejemplo@email.com"
                                className="pl-10 mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sat focus:border-sat"
                            />
                        </div>
                    </div>
                </div>

                {/* Provincia y Localidad con autocomplete */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <label htmlFor="provincia_id" className="block text-sm font-medium text-gray-700">
                            Provincia
                        </label>
                        <select
                            id="provincia_id"
                            name="provincia_id"
                            value={formData.provincia_id}
                            onChange={handleChange}
                            className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-sat focus:border-sat rounded-md"
                        >
                            <option value="">Todas las provincias</option>
                            {provincias.map((provincia) => (
                                <option key={provincia.id} value={provincia.id}>
                                    {provincia.nombre}
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="localidad_nombre" className="block text-sm font-medium text-gray-700">
                            Localidad
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <input
                                type="text"
                                id="localidad_nombre"
                                name="localidad_nombre"
                                value={formData.localidad_nombre}
                                onChange={(e) => {
                                    const value = e.target.value;
                                    handleChange(e);
                                    handleLocalidadSearch(value);
                                }}
                                placeholder="Escriba al menos 3 letras..."
                                className="pl-10 mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sat focus:border-sat"
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
                                            <div className="font-medium">{localidad.nombre}</div>
                                            <div className="text-sm text-gray-600">
                                                {localidad.provincia} (CP: {localidad.codigo_postal})
                                            </div>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        <p className="text-xs text-gray-500">
                            Escriba al menos 3 letras para buscar localidades
                        </p>
                    </div>
                </div>

                {/* Rubro */}
                <div className="space-y-2">
                    <label htmlFor="rubro_id" className="block text-sm font-medium text-gray-700">
                        Rubro
                    </label>
                    <div className="relative">
                        <Briefcase className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select
                            id="rubro_id"
                            name="rubro_id"
                            value={formData.rubro_id}
                            onChange={handleChange}
                            className="pl-10 mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sat focus:border-sat"
                        >
                            <option value="">Sin rubro</option>
                            {rubros.map((rubro) => (
                                <option key={rubro.id} value={rubro.id}>
                                    {rubro.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Origen de contacto */}
                <div className="space-y-2">
                    <label htmlFor="origen_id" className="block text-sm font-medium text-gray-700">
                        Origen de contacto *
                    </label>
                    <select
                        id="origen_id"
                        name="origen_id"
                        value={formData.origen_id}
                        onChange={handleChange}
                        required
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-sat focus:border-sat rounded-md"
                    >
                        <option value="">¿Cómo nos contactó?</option>
                        {origenes.map((origen) => (
                            <option key={origen.id} value={origen.id}>
                                {origen.nombre}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Botones del paso 1 */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                    type="button"
                    onClick={onClose}
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sat disabled:opacity-50"
                >
                    Cancelar
                </button>
                <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sat hover:bg-sat-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sat disabled:opacity-50"
                >
                    {isSubmitting ? 'Procesando...' : 'Continuar'}
                </button>
            </div>
        </form>
    );
}