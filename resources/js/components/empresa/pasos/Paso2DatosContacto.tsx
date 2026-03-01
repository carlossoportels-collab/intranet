// resources/js/components/empresa/pasos/Paso2DatosContacto.tsx
import { User, CreditCard, Globe, Calendar, MapPin } from 'lucide-react';
import React from 'react';

import { DatosContactoForm, TipoResponsabilidad, TipoDocumento, Nacionalidad } from '@/types/empresa';

interface Props {
    data: DatosContactoForm;
    tiposResponsabilidad: TipoResponsabilidad[];
    tiposDocumento: TipoDocumento[];
    nacionalidades: Nacionalidad[]; 
    onChange: (field: string, value: any) => void;
    errores: Record<string, string>;
}

export default function Paso2DatosContacto({
    data,
    tiposResponsabilidad,
    tiposDocumento,
    nacionalidades,
    onChange,
    errores
}: Props) {
    return (
        <div className="space-y-6">
            <div className="bg-purple-50 p-4 rounded-lg border border-purple-200 mb-6">
                <div className="flex items-center gap-3">
                    <User className="h-5 w-5 text-purple-600" />
                    <div>
                        <h3 className="font-medium text-purple-900">Datos Personales del Contacto</h3>
                        <p className="text-sm text-purple-700">
                            Complete la información personal para el registro
                        </p>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Tipo de Responsabilidad */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Tipo de Responsabilidad <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={data.tipo_responsabilidad_id}
                        onChange={(e) => onChange('tipo_responsabilidad_id', e.target.value ? Number(e.target.value) : '')}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 ${
                            errores['contacto.tipo_responsabilidad_id'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                    >
                        <option value="">Seleccionar tipo</option>
                        {tiposResponsabilidad.map(tipo => (
                            <option key={tipo.id} value={tipo.id}>
                                {tipo.nombre}
                            </option>
                        ))}
                    </select>
                    {errores['contacto.tipo_responsabilidad_id'] && (
                        <p className="text-xs text-red-600">{errores['contacto.tipo_responsabilidad_id']}</p>
                    )}
                </div>

                {/* Tipo de Documento */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Tipo de Documento <span className="text-red-500">*</span>
                    </label>
                    <select
                        value={data.tipo_documento_id}
                        onChange={(e) => onChange('tipo_documento_id', e.target.value ? Number(e.target.value) : '')}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 ${
                            errores['contacto.tipo_documento_id'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                    >
                        <option value="">Seleccionar tipo</option>
                        {tiposDocumento.map(tipo => (
                            <option key={tipo.id} value={tipo.id}>
                                {tipo.nombre} ({tipo.abreviatura})
                            </option>
                        ))}
                    </select>
                    {errores['contacto.tipo_documento_id'] && (
                        <p className="text-xs text-red-600">{errores['contacto.tipo_documento_id']}</p>
                    )}
                </div>

                {/* Número de Documento */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Número de Documento <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <CreditCard className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="text"
                            value={data.nro_documento}
                            onChange={(e) => {
                                const value = e.target.value.replace(/\D/g, '');
                                if (value.length <= 20) {
                                    onChange('nro_documento', value);
                                }
                            }}
                            maxLength={20}
                            className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 ${
                                errores['contacto.nro_documento'] ? 'border-red-300' : 'border-gray-300'
                            }`}
                            placeholder="Ej: 12345678"
                            required
                        />
                    </div>
                    {errores['contacto.nro_documento'] && (
                        <p className="text-xs text-red-600">{errores['contacto.nro_documento']}</p>
                    )}
                </div>

                {/* Nacionalidad */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Nacionalidad <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Globe className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <select
                            value={data.nacionalidad_id}
                            onChange={(e) => onChange('nacionalidad_id', e.target.value ? Number(e.target.value) : '')}
                            className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 ${
                                errores['contacto.nacionalidad_id'] ? 'border-red-300' : 'border-gray-300'
                            }`}
                        >
                            <option value="">Seleccionar país</option>
                            {nacionalidades.map(nacionalidad => (
                                <option key={nacionalidad.id} value={nacionalidad.id}>
                                    {nacionalidad.pais}
                                </option>
                            ))}
                        </select>
                    </div>
                    {errores['contacto.nacionalidad_id'] && (
                        <p className="text-xs text-red-600">{errores['contacto.nacionalidad_id']}</p>
                    )}
                </div>

                {/* Fecha de Nacimiento */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Fecha de Nacimiento <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                        <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <input
                            type="date"
                            value={data.fecha_nacimiento}
                            onChange={(e) => onChange('fecha_nacimiento', e.target.value)}
                            max={new Date().toISOString().split('T')[0]}
                            className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 ${
                                errores['contacto.fecha_nacimiento'] ? 'border-red-300' : 'border-gray-300'
                            }`}
                            required
                        />
                    </div>
                    {errores['contacto.fecha_nacimiento'] && (
                        <p className="text-xs text-red-600">{errores['contacto.fecha_nacimiento']}</p>
                    )}
                </div>

                {/* Código Postal Personal */}
                <div className="space-y-2">
                    <label className="block text-sm font-medium text-gray-700">
                        Código Postal <span className="text-red-500">*</span>
                    </label>
                    <input
                        type="text"
                        value={data.codigo_postal_personal}
                        onChange={(e) => {
                            const value = e.target.value.replace(/[^0-9-]/g, '');
                            if (value.length <= 10) {
                                onChange('codigo_postal_personal', value);
                            }
                        }}
                        maxLength={10}
                        className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 ${
                            errores['contacto.codigo_postal_personal'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Ej: 1000"
                        required
                    />
                    {errores['contacto.codigo_postal_personal'] && (
                        <p className="text-xs text-red-600">{errores['contacto.codigo_postal_personal']}</p>
                    )}
                </div>
            </div>

            {/* Dirección Personal */}
            <div className="space-y-2">
                <label className="block text-sm font-medium text-gray-700">
                    Dirección Personal <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                    <MapPin className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <input
                        type="text"
                        value={data.direccion_personal}
                        onChange={(e) => onChange('direccion_personal', e.target.value)}
                        maxLength={255}
                        className={`w-full pl-10 pr-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-purple-500 focus:border-purple-500 ${
                            errores['contacto.direccion_personal'] ? 'border-red-300' : 'border-gray-300'
                        }`}
                        placeholder="Ej: Av. Siempre Viva 123, Piso 3, Depto B"
                        required
                    />
                </div>
                {errores['contacto.direccion_personal'] && (
                    <p className="text-xs text-red-600">{errores['contacto.direccion_personal']}</p>
                )}
            </div>
        </div>
    );
}