// resources/js/components/contratos/sections/DatosPersonalesCliente.tsx
import { User, CreditCard, Globe, Calendar, MapPin } from 'lucide-react';
import React from 'react';

import { Contacto } from '@/types/contratos';

interface Props {
    contacto: Contacto;
}

export default function DatosPersonalesCliente({ contacto }: Props) {
    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <User className="h-4 w-4 text-green-600" />
                    Datos Personales del Cliente
                </h3>
            </div>
            
            <div className="p-4">
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <p className="text-xs text-gray-500">Tipo de responsabilidad</p>
                        <p className="text-sm font-medium">{contacto.tipo_responsabilidad?.nombre || '-'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <CreditCard className="h-3 w-3" /> Documento
                        </p>
                        <p className="text-sm font-medium">
                            {contacto.tipo_documento ? 
                             `${contacto.tipo_documento.abreviatura} ${contacto.nro_documento || ''}`.trim() 
                             : '-'}
                        </p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Globe className="h-3 w-3" /> Nacionalidad
                        </p>
                        <p className="text-sm font-medium">{contacto.nacionalidad?.pais || '-'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Calendar className="h-3 w-3" /> Fecha nacimiento
                        </p>
                        <p className="text-sm font-medium">
                            {contacto.fecha_nacimiento ? new Date(contacto.fecha_nacimiento).toLocaleDateString('es-AR') : '-'}
                        </p>
                    </div>
                    <div className="col-span-2">
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Dirección personal
                        </p>
                        <p className="text-sm font-medium">
                            {contacto.direccion_personal || '-'}
                            {contacto.codigo_postal_personal && ` (CP: ${contacto.codigo_postal_personal})`}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}