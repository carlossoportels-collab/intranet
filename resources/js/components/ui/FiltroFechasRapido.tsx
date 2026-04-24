// resources/js/components/ui/FiltroFechasRapido.tsx
import React from 'react';
import { Calendar, ChevronDown } from 'lucide-react';

interface OpcionFecha {
    id: string;
    nombre: string;
}

interface Props {
    opciones: OpcionFecha[];
    value: string;
    onChange: (value: string) => void;
    className?: string;
}

export default function FiltroFechasRapido({ opciones, value, onChange, className = '' }: Props) {
    const [open, setOpen] = React.useState(false);
    const dropdownRef = React.useRef<HTMLDivElement>(null);
    
    const opcionSeleccionada = opciones.find(o => o.id === value);
    
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);
    
    return (
        <div className="relative" ref={dropdownRef}>
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className={`flex items-center gap-2 px-3 py-1.5 text-sm bg-white border border-gray-300 rounded-md hover:border-sat focus:ring-2 focus:ring-sat/20 transition-all ${className}`}
            >
                <Calendar className="h-4 w-4 text-gray-500" />
                <span className="text-gray-700">{opcionSeleccionada?.nombre || 'Filtrar por fecha'}</span>
                <ChevronDown className={`h-3 w-3 text-gray-500 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>
            
            {open && (
                <div className="absolute left-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 overflow-hidden">
                    {opciones.map((opcion) => (
                        <button
                            key={opcion.id}
                            onClick={() => {
                                onChange(opcion.id);
                                setOpen(false);
                            }}
                            className={`w-full px-4 py-2 text-left text-sm hover:bg-gray-50 transition-colors ${
                                value === opcion.id ? 'bg-sat/10 text-sat font-medium' : 'text-gray-700'
                            }`}
                        >
                            {opcion.nombre}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}