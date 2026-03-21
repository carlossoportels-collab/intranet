// resources/js/components/cuentas/ComercialFilter.tsx

import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, User } from 'lucide-react';

interface Comercial {
    id: number;
    nombre: string;
    prefijo_id: number;
    prefijo_codigo: string;
    email: string | null;
    compania_id: number;
}

interface PrefijoFiltro {
    id: string | number;
    codigo: string;
    descripcion: string;
    comercial_nombre?: string;
    display_text: string;
}

interface ComercialFilterProps {
    comerciales: Comercial[];
    prefijosFiltro?: PrefijoFiltro[];
    value: number | null;
    onChange: (comercialId: number | null) => void;
    usuarioEsComercial: boolean;
    prefijoUsuario?: PrefijoFiltro | null;
}

export const ComercialFilter: React.FC<ComercialFilterProps> = ({
    comerciales = [],
    prefijosFiltro = [],
    value,
    onChange,
    usuarioEsComercial,
    prefijoUsuario
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const getDisplayText = (id: number | null): string => {
        if (!id) return 'Todos los comerciales';
        const comercial = comerciales.find(c => c.id === id);
        return comercial ? `${comercial.nombre} - ${comercial.prefijo_codigo}` : 'Todos los comerciales';
    };

    // Si no hay comerciales
    if (!comerciales || comerciales.length === 0) {
        return (
            <div className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50 flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="text-gray-500 italic">Sin comerciales</span>
            </div>
        );
    }

    // CASO 1: Usuario es comercial - mostrar como texto fijo
    if (usuarioEsComercial && prefijoUsuario) {
        return (
            <div className="w-full px-3 py-2 border border-gray-300 rounded text-sm bg-gray-50 flex items-center gap-2">
                <User className="h-4 w-4 text-gray-500 flex-shrink-0" />
                <span className="text-gray-700 truncate">
                    {prefijoUsuario.display_text}
                </span>
            </div>
        );
    }

    // CASO 2: Usuario NO es comercial - mostrar selector
    return (
        <div className="relative w-full" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setIsOpen(!isOpen)}
                className={`w-full px-3 py-2 border border-gray-300 rounded text-sm flex items-center justify-between hover:bg-gray-50 transition-colors ${
                    value ? 'bg-blue-50 border-blue-300' : 'bg-white'
                }`}
            >
                <div className="flex items-center gap-2 truncate">
                    <User className={`h-4 w-4 ${value ? 'text-blue-600' : 'text-gray-500'} flex-shrink-0`} />
                    <span className={`truncate ${value ? 'text-blue-700' : 'text-gray-700'}`}>
                        {getDisplayText(value)}
                    </span>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${isOpen ? 'rotate-180' : ''} text-gray-500 flex-shrink-0`} />
            </button>

            {isOpen && (
                <div className="absolute z-10 mt-1 w-full bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {/* Opción "Todos" */}
                    <button
                        onClick={() => {
                            onChange(null);
                            setIsOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
                            !value ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                        }`}
                    >
                        Todos los comerciales
                    </button>

                    {/* Separador */}
                    <div className="border-t border-gray-200 my-1"></div>

                    {/* Lista de comerciales - formato simple: "Nombre - Prefijo" */}
                    {comerciales.map((comercial) => (
                        <button
                            key={comercial.id}
                            onClick={() => {
                                onChange(comercial.id);
                                setIsOpen(false);
                            }}
                            className={`w-full text-left px-3 py-2 text-sm hover:bg-gray-100 transition-colors ${
                                value === comercial.id ? 'bg-blue-50 text-blue-700 font-medium' : 'text-gray-700'
                            }`}
                        >
                            {comercial.nombre} - {comercial.prefijo_codigo}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
};