// resources/js/components/cuentas/EditarContactoModal.tsx
import React, { useState, useEffect } from 'react';
import { X, User, Mail, Phone, MapPin, Briefcase, Calendar, CreditCard, Globe, Loader } from 'lucide-react';

interface Props {
    isOpen: boolean;
    onClose: () => void;
    contacto: any;
    onSave: (contactoId: number, data: any) => void;
    origenes: any[];
    rubros: any[];
    provincias: any[];
    tiposDocumento?: any[];
    nacionalidades?: any[];
    tiposResponsabilidad?: any[];
}

export default function EditarContactoModal({ 
    isOpen, 
    onClose, 
    contacto, 
    onSave,
    origenes,
    rubros,
    provincias,
    tiposDocumento = [],
    nacionalidades = [],
    tiposResponsabilidad = []
}: Props) {
    const [formData, setFormData] = useState({
        // Datos de lead
        nombre_completo: '',
        email: '',
        telefono: '',
        genero: 'no_especifica',
        localidad_id: '',
        rubro_id: '',
        origen_id: '',
        
        // Datos de empresa_contactos
        tipo_responsabilidad_id: '',
        tipo_documento_id: '',
        nro_documento: '',
        nacionalidad_id: '',
        fecha_nacimiento: '',
        direccion_personal: '',
        codigo_postal_personal: '',
        es_contacto_principal: false
    });

    const [errores, setErrores] = useState({});
    const [isSearchingLocalidades, setIsSearchingLocalidades] = useState(false);
    const [localidadesResult, setLocalidadesResult] = useState<any[]>([]);
    const [showLocalidadesDropdown, setShowLocalidadesDropdown] = useState(false);
    const [localidadNombre, setLocalidadNombre] = useState('');

    useEffect(() => {
        if (contacto) {
            console.log('Contacto a editar:', contacto);
            
            // Inicializar nombre de localidad si existe
            if (contacto.lead?.localidad) {
                setLocalidadNombre(`${contacto.lead.localidad.nombre}, ${contacto.lead.localidad.provincia}`);
            }
            
            setFormData({
                // Datos de lead
                nombre_completo: contacto.lead?.nombre_completo || '',
                email: contacto.lead?.email || '',
                telefono: contacto.lead?.telefono || '',
                genero: contacto.lead?.genero || 'no_especifica',
                localidad_id: contacto.lead?.localidad_id?.toString() || '',
                rubro_id: contacto.lead?.rubro_id?.toString() || '',
                origen_id: contacto.lead?.origen_id?.toString() || '',
                
                // Datos de empresa_contactos
                tipo_responsabilidad_id: contacto.tipo_responsabilidad_id?.toString() || '',
                tipo_documento_id: contacto.tipo_documento_id?.toString() || '',
                nro_documento: contacto.nro_documento || '',
                nacionalidad_id: contacto.nacionalidad_id?.toString() || '',
                fecha_nacimiento: contacto.fecha_nacimiento || '',
                direccion_personal: contacto.direccion_personal || '',
                codigo_postal_personal: contacto.codigo_postal_personal || '',
                es_contacto_principal: contacto.es_contacto_principal || false
            });
        }
    }, [contacto]);

    // Buscar localidades
    const handleLocalidadSearch = async (searchTerm: string) => {
        if (searchTerm.length < 3) {
            setLocalidadesResult([]);
            setShowLocalidadesDropdown(false);
            return;
        }
        
        setIsSearchingLocalidades(true);
        
        try {
            const response = await fetch(`/comercial/localidades/buscar?search=${encodeURIComponent(searchTerm)}`);
            const data = await response.json();
            
            if (data.success) {
                setLocalidadesResult(data.data);
                setShowLocalidadesDropdown(true);
            }
        } catch (error) {
            console.error('Error buscando localidades:', error);
        } finally {
            setIsSearchingLocalidades(false);
        }
    };

    const handleLocalidadSelect = (localidad: any) => {
        setFormData(prev => ({
            ...prev,
            localidad_id: localidad.id.toString()
        }));
        setLocalidadNombre(`${localidad.nombre || localidad.localidad}, ${localidad.provincia}`);
        setShowLocalidadesDropdown(false);
        setLocalidadesResult([]);
    };

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value, type } = e.target;
        const checked = type === 'checkbox' ? (e.target as HTMLInputElement).checked : undefined;
        
        setFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onSave(contacto.id, formData);
    };

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
                <div className="sticky top-0 bg-white border-b border-slate-200 px-6 py-4 flex justify-between items-center">
                    <div className="flex items-center gap-3">
                        <div className="p-2 bg-indigo-100 rounded-lg">
                            <User className="h-5 w-5 text-indigo-600" />
                        </div>
                        <div>
                            <h3 className="text-lg font-semibold text-slate-900">
                                Editar Contacto Principal
                            </h3>
                            <p className="text-sm text-slate-500">
                                {contacto?.lead?.nombre_completo}
                            </p>
                        </div>
                    </div>
                    <button onClick={onClose} className="text-slate-400 hover:text-slate-600">
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Datos del Lead */}
                    <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-200">
                            Datos Principales del Contacto
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Nombre Completo *
                                </label>
                                <input
                                    type="text"
                                    name="nombre_completo"
                                    value={formData.nombre_completo}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Género
                                </label>
                                <select
                                    name="genero"
                                    value={formData.genero}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="masculino">Masculino</option>
                                    <option value="femenino">Femenino</option>
                                    <option value="otro">Otro</option>
                                    <option value="no_especifica">No especifica</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Email *
                                </label>
                                <input
                                    type="email"
                                    name="email"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Teléfono *
                                </label>
                                <input
                                    type="text"
                                    name="telefono"
                                    value={formData.telefono}
                                    onChange={handleChange}
                                    required
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Rubro
                                </label>
                                <select
                                    name="rubro_id"
                                    value={formData.rubro_id}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Seleccionar rubro</option>
                                    {rubros.map(rubro => (
                                        <option key={rubro.id} value={rubro.id}>{rubro.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Origen
                                </label>
                                <select
                                    name="origen_id"
                                    value={formData.origen_id}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Seleccionar origen</option>
                                    {origenes.map(origen => (
                                        <option key={origen.id} value={origen.id}>{origen.nombre}</option>
                                    ))}
                                </select>
                            </div>
                        </div>
                    </div>

                    {/* Localidad con autocomplete */}
                    <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-200">
                            Ubicación
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Localidad
                                </label>
                                <div className="relative">
                                    <input
                                        type="text"
                                        value={localidadNombre}
                                        onChange={(e) => {
                                            setLocalidadNombre(e.target.value);
                                            handleLocalidadSearch(e.target.value);
                                        }}
                                        placeholder="Escriba al menos 3 letras para buscar..."
                                        className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                    />
                                    {isSearchingLocalidades && (
                                        <div className="absolute right-3 top-2.5">
                                            <Loader className="animate-spin h-4 w-4 text-indigo-600" />
                                        </div>
                                    )}
                                    
                                    {/* Dropdown de resultados */}
                                    {showLocalidadesDropdown && localidadesResult.length > 0 && (
                                        <div className="absolute z-10 mt-1 w-full bg-white border border-slate-200 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                                            {localidadesResult.map((localidad) => (
                                                <button
                                                    key={localidad.id}
                                                    type="button"
                                                    onClick={() => handleLocalidadSelect(localidad)}
                                                    className="w-full text-left px-4 py-2 hover:bg-indigo-50 focus:outline-none focus:bg-indigo-50 border-b border-slate-100 last:border-b-0"
                                                    onMouseDown={(e) => e.preventDefault()}
                                                >
                                                    <div className="font-medium text-sm">{localidad.nombre || localidad.localidad}</div>
                                                    <div className="text-xs text-slate-600">
                                                        {localidad.provincia} (CP: {localidad.codigo_postal})
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                                <p className="text-xs text-slate-500 mt-1">
                                    Escriba al menos 3 letras para buscar localidades
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Datos Personales del Contacto */}
                    <div>
                        <h4 className="text-sm font-semibold text-slate-700 mb-3 pb-2 border-b border-slate-200">
                            Datos Personales y Documentación
                        </h4>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Tipo de Responsabilidad
                                </label>
                                <select
                                    name="tipo_responsabilidad_id"
                                    value={formData.tipo_responsabilidad_id}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Seleccionar</option>
                                    {tiposResponsabilidad.map(tipo => (
                                        <option key={tipo.id} value={tipo.id}>{tipo.nombre}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Tipo de Documento
                                </label>
                                <select
                                    name="tipo_documento_id"
                                    value={formData.tipo_documento_id}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Seleccionar</option>
                                    {tiposDocumento.map(tipo => (
                                        <option key={tipo.id} value={tipo.id}>{tipo.nombre} ({tipo.abreviatura})</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Número de Documento
                                </label>
                                <input
                                    type="text"
                                    name="nro_documento"
                                    value={formData.nro_documento}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Nacionalidad
                                </label>
                                <select
                                    name="nacionalidad_id"
                                    value={formData.nacionalidad_id}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                >
                                    <option value="">Seleccionar</option>
                                    {nacionalidades.map(nac => (
                                        <option key={nac.id} value={nac.id}>{nac.pais}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Fecha de Nacimiento
                                </label>
                                <input
                                    type="date"
                                    name="fecha_nacimiento"
                                    value={formData.fecha_nacimiento}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Código Postal Personal
                                </label>
                                <input
                                    type="text"
                                    name="codigo_postal_personal"
                                    value={formData.codigo_postal_personal}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="block text-sm font-medium text-slate-700 mb-1">
                                    Dirección Personal
                                </label>
                                <input
                                    type="text"
                                    name="direccion_personal"
                                    value={formData.direccion_personal}
                                    onChange={handleChange}
                                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500"
                                />
                            </div>
                            <div className="md:col-span-2">
                                <label className="flex items-center gap-2">
                                    <input
                                        type="checkbox"
                                        name="es_contacto_principal"
                                        checked={formData.es_contacto_principal}
                                        onChange={handleChange}
                                        className="rounded border-slate-300 text-indigo-600"
                                    />
                                    <span className="text-sm text-slate-700">Es contacto principal</span>
                                </label>
                            </div>
                        </div>
                    </div>

                    {/* Botones */}
                    <div className="flex justify-end gap-3 pt-4 border-t border-slate-200">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50"
                        >
                            Cancelar
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-lg hover:bg-indigo-700"
                        >
                            Guardar Cambios
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}