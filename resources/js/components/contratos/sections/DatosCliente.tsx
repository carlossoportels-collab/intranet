// resources/js/components/contratos/sections/DatosCliente.tsx
import { User, Phone, Mail, MapPin, Briefcase, Building } from 'lucide-react';
import React from 'react';

import { Lead } from '@/types/contratos';

interface Props {
    lead: Lead;
}

export default function DatosCliente({ lead }: Props) {
    // Actualizado para usar 'nombre' en lugar de 'localidad' y 'provincia'
    const localidadCompleta = lead.localidad ? 
        `${lead.localidad.nombre || lead.localidad.localidad || ''}${lead.localidad.provincia ? `, ${lead.localidad.provincia.nombre || lead.localidad.provincia.provincia || ''}` : ''}` 
        : '-';

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <User className="h-4 w-4 text-blue-600" />
                    Datos del Cliente
                </h3>
            </div>
            
            <div className="p-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-gray-500">Nombre completo</p>
                        <p className="text-sm font-medium">{lead.nombre_completo}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Género</p>
                        <p className="text-sm font-medium capitalize">{lead.genero?.replace('_', ' ') || '-'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" /> Teléfono
                        </p>
                        <p className="text-sm font-medium">{lead.telefono || '-'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" /> Email
                        </p>
                        <p className="text-sm font-medium">{lead.email || '-'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Briefcase className="h-3 w-3" /> Rubro
                        </p>
                        <p className="text-sm font-medium">{lead.rubro?.nombre || '-'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Building className="h-3 w-3" /> Origen
                        </p>
                        <p className="text-sm font-medium">{lead.origen?.nombre || '-'}</p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Localidad y Provincia
                        </p>
                        <p className="text-sm font-medium">{localidadCompleta}</p>
                    </div>
                </div>
            </div>
        </div>
    );
}