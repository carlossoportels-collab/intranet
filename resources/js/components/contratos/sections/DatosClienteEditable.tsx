// components/contratos/sections/DatosClienteEditable.tsx
import React from 'react';
import { User, MapPin, Briefcase, Tag } from 'lucide-react';

interface Props {
    lead: any;
    onUpdate: (field: string, value: any) => void;
}

export default function DatosClienteEditable({ lead, onUpdate }: Props) {
    if (!lead) return null;

    return (
        <div className="bg-white rounded-lg border border-gray-200 p-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                <User className="h-5 w-5" />
                Datos del Cliente
            </h3>
            
            <div className="space-y-3">
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Nombre completo *</label>
                    <input
                        type="text"
                        value={lead.nombre_completo || ''}
                        onChange={(e) => onUpdate('nombre_completo', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <input
                        type="email"
                        value={lead.email || ''}
                        onChange={(e) => onUpdate('email', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>
                
                <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                    <input
                        type="text"
                        value={lead.telefono || ''}
                        onChange={(e) => onUpdate('telefono', e.target.value)}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    />
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Localidad</label>
                        <input
                            type="text"
                            value={lead.localidad_nombre || lead.localidad?.nombre || ''}
                            onChange={(e) => onUpdate('localidad_nombre', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Provincia</label>
                        <input
                            type="text"
                            value={lead.provincia_nombre || lead.localidad?.provincia?.nombre || ''}
                            onChange={(e) => onUpdate('provincia_nombre', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                </div>
                
                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Rubro</label>
                        <input
                            type="text"
                            value={lead.rubro?.nombre || lead.cliente_rubro || ''}
                            onChange={(e) => onUpdate('rubro_nombre', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Origen</label>
                        <input
                            type="text"
                            value={lead.origen?.nombre || lead.cliente_origen || ''}
                            onChange={(e) => onUpdate('origen_nombre', e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md"
                        />
                    </div>
                </div>
            </div>
        </div>
    );
}