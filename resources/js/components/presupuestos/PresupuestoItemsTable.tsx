// resources/js/components/presupuestos/PresupuestoItemsTable.tsx

import React from 'react';

import { Amount } from '@/components/ui/Amount';

interface Props {
    items: any[];
    variant?: 'mobile' | 'desktop'; // Ahora es una prop que elige una variante
}

export const PresupuestoItemsTable: React.FC<Props> = ({ items, variant = 'desktop' }) => {
    if (!items || items.length === 0) return null;

    if (variant === 'mobile') {
        return (
            <div className="block sm:hidden space-y-3">
                {items.map((item) => (
                    <div key={item.id} className="bg-gray-50 p-3 rounded-lg border border-gray-200">
                        <div className="font-medium text-sm mb-2 break-words">
                            {item.producto_servicio?.nombre || 'Producto no disponible'}
                            {item.aplica_a_todos_vehiculos && (
                                <span className="ml-2 text-xs bg-blue-100 text-blue-800 px-2 py-0.5 rounded-full">
                                    todos
                                </span>
                            )}
                        </div>
                        <div className="grid grid-cols-2 gap-2 text-xs">
                            <div>
                                <span className="text-gray-600">Cantidad:</span>
                                <span className="ml-1 font-medium">{item.cantidad}</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Precio:</span>
                                <Amount value={item.valor} className="ml-1 font-medium" />
                            </div>
                            <div>
                                <span className="text-gray-600">Bonif.:</span>
                                <span className="ml-1 font-medium text-green-600">{item.bonificacion}%</span>
                            </div>
                            <div>
                                <span className="text-gray-600">Subtotal:</span>
                                <Amount value={item.subtotal} className="ml-1 font-bold" />
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        );
    }

    return (
        <div className="hidden sm:block overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Producto</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Cant.</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Precio Unit.</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Bonif.</th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase">Subtotal</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {items.map((item) => (
                        <tr key={item.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">
                                <div className="flex items-center gap-2">
                                    <span className="break-words">{item.producto_servicio?.nombre}</span>
                                    {item.aplica_a_todos_vehiculos && (
                                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                                            para todos
                                        </span>
                                    )}
                                </div>
                            </td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">{item.cantidad}</td>
                            <td className="px-4 py-3 text-sm text-gray-900 text-right">
                                <Amount value={item.valor} />
                            </td>
                            <td className="px-4 py-3 text-sm text-green-600 text-right">{item.bonificacion}%</td>
                            <td className="px-4 py-3 text-sm font-medium text-gray-900 text-right">
                                <Amount value={item.subtotal} />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    );
};