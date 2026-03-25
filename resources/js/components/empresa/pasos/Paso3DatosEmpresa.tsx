// resources/js/components/empresa/pasos/Paso3DatosEmpresa.tsx
import { Building, Hash, MapPin, Phone, Mail, Briefcase, Tag, Truck, Search, Loader } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { DatosEmpresaForm, CategoriaFiscal, Plataforma } from '@/types/empresa';
import { Provincia, Localidad } from '@/types/leads';

interface Props {
    data: DatosEmpresaForm;
    rubros: any[];
    categoriasFiscales: CategoriaFiscal[];
    plataformas: Plataforma[];
    provincias: Provincia[];
    onChange: (field: string, value: any) => void;
    errores: Record<string, string>;
    localidadInicial?: string;
    provinciaInicial?: number | string;
}

export default function Paso3DatosEmpresa({
    data,
    rubros,
    categoriasFiscales,
    plataformas,
    provincias,
    onChange,
    errores,
    localidadInicial = '',
    provinciaInicial = ''
}: Props) {
    const [searchLocalidad, setSearchLocalidad] = useState(localidadInicial);
    const [showLocalidadesDropdown, setShowLocalidadesDropdown] = useState(false);
    const [searching, setSearching] = useState(false);
    const [localidadesResult, setLocalidadesResult] = useState<Localidad[]>([]);
    const [provinciaId, setProvinciaId] = useState<number | string>(provinciaInicial);

    // Actualizar cuando cambian las props iniciales
    useEffect(() => {
        
        if (provinciaInicial) {
            setProvinciaId(provinciaInicial);
        }
        
        if (localidadInicial) {
            setSearchLocalidad(localidadInicial);
        }
    }, [localidadInicial, provinciaInicial]);

    const handleSearchLocalidad = async (value: string) => {
        setSearchLocalidad(value);
        if (value.length >= 3) {
            setSearching(true);
            
            try {
                const params = new URLSearchParams({
                    search: value,
                    ...(provinciaId && { provincia_id: provinciaId.toString() })
                });
                
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
                setSearching(false);
            }
        } else {
            setShowLocalidadesDropdown(false);
        }
    };

    const handleSelectLocalidad = (localidad: Localidad) => {
        onChange('localidad_fiscal_id', localidad.id);
        setSearchLocalidad(localidad.nombre); // ← Cambiado a 'nombre'
        setProvinciaId(localidad.provincia_id || '');
        setShowLocalidadesDropdown(false);
        setLocalidadesResult([]);
    };

    const handleProvinciaChange = (value: string) => {
        setProvinciaId(value ? Number(value) : '');
        onChange('localidad_fiscal_id', '');
        setSearchLocalidad('');
        setLocalidadesResult([]);
        setShowLocalidadesDropdown(false);
    };

    return (
        <div className="space-y-6">
            <div className="bg-green-50 p-4 rounded-lg border border-green-200 mb-6">
                <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-green-600" />
                    <div>
                        <h3 className="font-medium text-green-900">Datos de la Empresa</h3>
                        <p className="text-sm text-green-700">
                            Complete la información de la empresa (todos los campos son obligatorios)
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Nombre de Fantasía */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Nombre de Fantasía <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={data.nombre_fantasia}
                        onChange={(e) => onChange('nombre_fantasia', e.target.value)}
                        maxLength={200}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                            errores['empresa.nombre_fantasia'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Ej: Empresa SRL"
                        required
                    />
                    {errores['empresa.nombre_fantasia'] && (
                        <p className="text-xs text-red-600">{errores['empresa.nombre_fantasia']}</p>
                    )}
                </div>

                {/* Razón Social */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Razón Social <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={data.razon_social}
                        onChange={(e) => onChange('razon_social', e.target.value)}
                        maxLength={200}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                            errores['empresa.razon_social'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Ej: Empresa SRL"
                        required
                    />
                    {errores['empresa.razon_social'] && (
                        <p className="text-xs text-red-600">{errores['empresa.razon_social']}</p>
                    )}
                </div>

                {/* CUIT */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        CUIT <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Hash className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={data.cuit}
                            onChange={(e) => {
                                const value = e.target.value.replace(/[^0-9-]/g, '');
                                if (value.length <= 13) {
                                    onChange('cuit', value);
                                }
                            }}
                            maxLength={13}
                            className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                                errores['empresa.cuit'] ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Ej: 30-12345678-9"
                            required
                        />
                    </div>
                    {errores['empresa.cuit'] && (
                        <p className="text-xs text-red-600">{errores['empresa.cuit']}</p>
                    )}
                </div>

                {/* Teléfono Fiscal */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Teléfono Fiscal <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Phone className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="tel"
                            value={data.telefono_fiscal}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                if (value.length <= 30) {
                                    onChange('telefono_fiscal', value);
                                }
                            }}
                            maxLength={30}
                            className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                                errores['empresa.telefono_fiscal'] ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Ej: 01112345678"
                            required
                        />
                    </div>
                    {errores['empresa.telefono_fiscal'] && (
                        <p className="text-xs text-red-600">{errores['empresa.telefono_fiscal']}</p>
                    )}
                </div>

                {/* Email Fiscal */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Email Fiscal <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="email"
                            value={data.email_fiscal}
                            onChange={(e) => onChange('email_fiscal', e.target.value)}
                            maxLength={150}
                            className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                                errores['empresa.email_fiscal'] ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Ej: contacto@empresa.com"
                            required
                        />
                    </div>
                    {errores['empresa.email_fiscal'] && (
                        <p className="text-xs text-red-600">{errores['empresa.email_fiscal']}</p>
                    )}
                </div>

                {/* Código Postal Fiscal */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Código Postal Fiscal <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={data.codigo_postal_fiscal}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9-]/g, '');
                            if (value.length <= 10) {
                                onChange('codigo_postal_fiscal', value);
                            }
                        }}
                        maxLength={10}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                            errores['empresa.codigo_postal_fiscal'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Ej: 1000"
                        required
                    />
                    {errores['empresa.codigo_postal_fiscal'] && (
                        <p className="text-xs text-red-600">{errores['empresa.codigo_postal_fiscal']}</p>
                    )}
                </div>
            </div>

            {/* Dirección Fiscal */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Dirección Fiscal <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        value={data.direccion_fiscal}
                        onChange={(e) => onChange('direccion_fiscal', e.target.value)}
                        maxLength={255}
                        className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                            errores['empresa.direccion_fiscal'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Ej: Av. Corrientes 1234, Piso 5"
                        required
                    />
                </div>
                {errores['empresa.direccion_fiscal'] && (
                    <p className="text-xs text-red-600">{errores['empresa.direccion_fiscal']}</p>
                )}
            </div>

            {/* Provincia */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Provincia <span className="text-red-500">*</span>
                </label>
                <select
                    value={provinciaId}
                    onChange={(e) => handleProvinciaChange(e.target.value)}
                    className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                        errores['empresa.provincia_id'] ? 'border-red-300' : 'border-gray-300'
                    }`}
                >
                    <option value="">Seleccionar provincia</option>
                    {provincias.map((provincia) => (
                        <option key={provincia.id} value={provincia.id}>
                            {provincia.nombre} {/* ← Cambiado de 'provincia' a 'nombre' */}
                        </option>
                    ))}
                </select>
            </div>

            {/* Localidad Fiscal con buscador */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Localidad Fiscal <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        value={searchLocalidad}
                        onChange={(e) => handleSearchLocalidad(e.target.value)}
                        className={`w-full pl-10 pr-10 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                            errores['empresa.localidad_fiscal_id'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Escriba al menos 3 letras para buscar..."
                        required
                    />
                    {searching && (
                        <Loader className="absolute right-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 animate-spin" />
                    )}
                    
                    {showLocalidadesDropdown && localidadesResult.length > 0 && (
                        <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-md shadow-lg max-h-60 overflow-y-auto">
                            {localidadesResult.map((localidad) => (
                                <button
                                    key={localidad.id}
                                    type="button"
                                    onClick={() => handleSelectLocalidad(localidad)}
                                    className="w-full text-left px-4 py-2 hover:bg-gray-100 focus:outline-none focus:bg-gray-100 border-b border-gray-100 last:border-b-0"
                                >
                                    <div className="font-medium">{localidad.nombre}</div> {/* ← Cambiado a 'nombre' */}
                                    <div className="text-sm text-gray-600">{localidad.provincia}</div>
                                </button>
                            ))}
                        </div>
                    )}
                </div>
                {errores['empresa.localidad_fiscal_id'] && (
                    <p className="text-xs text-red-600">{errores['empresa.localidad_fiscal_id']}</p>
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                            className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                                errores['empresa.rubro_id'] ? 'border-red-300' : 'border-gray-300'
                            }`}
                        >
                            <option value="">Seleccionar rubro</option>
                            {rubros.map(rubro => (
                                <option key={rubro.id} value={rubro.id}>
                                    {rubro.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                    {errores['empresa.rubro_id'] && (
                        <p className="text-xs text-red-600">{errores['empresa.rubro_id']}</p>
                    )}
                </div>

                {/* Categoría Fiscal */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Categoría Fiscal <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Tag className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select
                            value={data.cat_fiscal_id}
                            onChange={(e) => onChange('cat_fiscal_id', e.target.value ? Number(e.target.value) : '')}
                            className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                                errores['empresa.cat_fiscal_id'] ? 'border-red-300' : 'border-gray-300'
                            }`}
                        >
                            <option value="">Seleccionar categoría</option>
                            {categoriasFiscales.map(cat => (
                                <option key={cat.id} value={cat.id}>
                                    {cat.codigo} - {cat.nombre}
                                </option>
                            ))}
                        </select>
                    </div>
                    {errores['empresa.cat_fiscal_id'] && (
                        <p className="text-xs text-red-600">{errores['empresa.cat_fiscal_id']}</p>
                    )}
                </div>

                {/* Plataforma */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Plataforma <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={data.plataforma_id}
                        onChange={(e) => onChange('plataforma_id', e.target.value ? Number(e.target.value) : '')}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                            errores['empresa.plataforma_id'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                    >
                        <option value="">Seleccionar plataforma</option>
                        {plataformas.map(plat => (
                            <option key={plat.id} value={plat.id}>
                                {plat.nombre}
                            </option>
                        ))}
                    </select>
                    {errores['empresa.plataforma_id'] && (
                        <p className="text-xs text-red-600">{errores['empresa.plataforma_id']}</p>
                    )}
                </div>
            </div>

            {/* Nombre de Flota */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Nombre de Flota <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <Truck className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        value={data.nombre_flota}
                        onChange={(e) => onChange('nombre_flota', e.target.value)}
                        maxLength={200}
                        className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500 ${
                            errores['empresa.nombre_flota'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Ej: Flota Principal"
                        required
                    />
                </div>
                {errores['empresa.nombre_flota'] && (
                    <p className="text-xs text-red-600">{errores['empresa.nombre_flota']}</p>
                )}
            </div>
        </div>
    );
}