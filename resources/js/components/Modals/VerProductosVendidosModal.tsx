// resources/js/Components/Modals/VerProductosVendidosModal.tsx

import React, { useEffect } from 'react';
import { X, Package, Settings, Wrench, TrendingUp, DollarSign } from 'lucide-react';

interface Producto {
    id: number;
    nombre: string;
    cantidad: number;
    total_vendido: number;
}

interface VerProductosVendidosModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    productos: Producto[];
    tipo: 'servicios' | 'accesorios';
}

export default function VerProductosVendidosModal({ 
    isOpen, 
    onClose, 
    title, 
    productos, 
    tipo 
}: VerProductosVendidosModalProps) {
    const formatCurrency = (value: number) => {
        if (isNaN(value) || !value) return '$ 0';
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };

    const formatNumber = (value: number) => {
        if (isNaN(value) || !value) return '0';
        return new Intl.NumberFormat('es-AR').format(value);
    };

    const totalProductos = productos.length;
    const totalCantidad = productos.reduce((sum, p) => sum + (p.cantidad || 0), 0);
    const totalValor = productos.reduce((sum, p) => sum + (p.total_vendido || 0), 0);

    useEffect(() => {
        if (isOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'unset';
        }
        
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, [isOpen]);

    if (!isOpen) return null;

    return (
        <>
            <div 
                className="fixed inset-0 bg-black/60 z-[99990]"
                onClick={onClose}
            />
            
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[99999] pointer-events-none">
                <div 
                    className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden pointer-events-auto"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 rounded-lg ${tipo === 'servicios' ? 'bg-blue-50' : 'bg-orange-50'}`}>
                                {tipo === 'servicios' ? (
                                    <Settings className="h-6 w-6 text-blue-600" />
                                ) : (
                                    <Wrench className="h-6 w-6 text-orange-600" />
                                )}
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">{title}</h2>
                                <p className="text-sm text-gray-600 mt-1">{productos.length} productos disponibles</p>
                            </div>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Resumen rápido */}
                    <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
                        <div className="flex flex-wrap gap-6 text-sm">
                            <div className="flex items-center gap-2">
                                <Package className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-600">Productos:</span>
                                <span className="font-semibold text-gray-900">{formatNumber(totalProductos)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <TrendingUp className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-600">Unidades vendidas:</span>
                                <span className="font-semibold text-gray-900">{formatNumber(totalCantidad)}</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <DollarSign className="h-4 w-4 text-gray-500" />
                                <span className="text-gray-600">Valor total:</span>
                                <span className="font-semibold text-gray-900">{formatCurrency(totalValor)}</span>
                            </div>
                        </div>
                    </div>

                    {/* Tabla de productos */}
                    <div className="overflow-y-auto max-h-[calc(90vh-200px)]">
                        {productos.length === 0 ? (
                            <div className="text-center py-12">
                                <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-lg font-medium text-gray-900 mb-2">No hay productos registrados</h3>
                                <p className="text-gray-600">No se encontraron {tipo === 'servicios' ? 'servicios' : 'accesorios'} en el período seleccionado</p>
                            </div>
                        ) : (
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50 sticky top-0">
                                    <tr>
                                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Producto</th>
                                        <th className="px-6 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">Cantidad</th>
                                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Total Vendido</th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-100">
                                    {productos.map((producto) => (
                                        <tr key={producto.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <div className="flex items-center gap-2">
                                                    {tipo === 'servicios' ? (
                                                        <Settings className="h-4 w-4 text-blue-500" />
                                                    ) : (
                                                        <Wrench className="h-4 w-4 text-orange-500" />
                                                    )}
                                                    <span className="text-sm font-medium text-gray-900">{producto.nombre}</span>
                                                </div>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-center">
                                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                                    {formatNumber(producto.cantidad)}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                                                {formatCurrency(producto.total_vendido)}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="px-6 py-4 border-t border-gray-200 bg-gray-50">
                        <div className="flex justify-end">
                            <button
                                onClick={onClose}
                                className="px-4 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors text-sm font-medium"
                            >
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}