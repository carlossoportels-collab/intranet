// resources/js/components/contratos/sections/DatosEmpresa.tsx
import { Building, Hash, MapPin, Phone, Mail, Briefcase, Tag, Cpu } from 'lucide-react';
import React from 'react';

import { Empresa } from '@/types/contratos';

interface Props {
    empresa: Empresa;
}

export default function DatosEmpresa({ empresa }: Props) {
    // Actualizado para usar 'nombre' en lugar de 'localidad' y 'provincia'
    const direccionFiscalCompleta = 
        `${empresa.direccion_fiscal || ''}${empresa.localidad_fiscal ? `, ${empresa.localidad_fiscal.nombre || empresa.localidad_fiscal.localidad || ''}` : ''}${empresa.localidad_fiscal?.provincia ? `, ${empresa.localidad_fiscal.provincia.nombre || empresa.localidad_fiscal.provincia.provincia || ''}` : ''}${empresa.codigo_postal_fiscal ? ` (CP: ${empresa.codigo_postal_fiscal})` : ''}`.trim() || '-';

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <Building className="h-4 w-4 text-purple-600" />
                    Datos de la Empresa
                </h3>
            </div>
            
            <div className="p-4">
                <div className="grid grid-cols-2 gap-4">
                    {/* Fila 1 */}
                    <div>
                        <p className="text-xs text-gray-500">Nombre de fantasía</p>
                        <p className="text-sm font-medium break-words">{empresa.nombre_fantasia}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Razón social</p>
                        <p className="text-sm font-medium break-words">{empresa.razon_social}</p>
                    </div>

                    {/* Fila 2 */}
                    <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Hash className="h-3 w-3" /> CUIT
                        </p>
                        <p className="text-sm font-medium break-words">{empresa.cuit}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Phone className="h-3 w-3" /> Teléfono fiscal
                        </p>
                        <p className="text-sm font-medium break-words">{empresa.telefono_fiscal || '-'}</p>
                    </div>

                    {/* Fila 3 */}
                    <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Briefcase className="h-3 w-3" /> Rubro
                        </p>
                        <p className="text-sm font-medium break-words">{empresa.rubro?.nombre || '-'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Tag className="h-3 w-3" /> Categoría fiscal
                        </p>
                        <p className="text-sm font-medium break-words">{empresa.categoria_fiscal?.nombre || '-'}</p>
                    </div>

                    {/* Fila 4 */}
                    <div>
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Cpu className="h-3 w-3" /> Plataforma
                        </p>
                        <p className="text-sm font-medium break-words">{empresa.plataforma?.nombre || '-'}</p>
                    </div>
                    <div>
                        <p className="text-xs text-gray-500">Nombre de flota</p>
                        <p className="text-sm font-medium break-words">{empresa.nombre_flota || '-'}</p>
                    </div>

                    {/* Fila 5 - Dirección (izquierda) */}
                    <div className="col-span-1">
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> Dirección fiscal
                        </p>
                        <p className="text-sm font-medium break-words whitespace-normal">
                            {direccionFiscalCompleta}
                        </p>
                    </div>

                    {/* Fila 5 - Email (derecha) */}
                    <div className="col-span-1">
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                            <Mail className="h-3 w-3" /> Email fiscal
                        </p>
                        <p className="text-sm font-medium break-all">
                            {empresa.email_fiscal || '-'}
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}