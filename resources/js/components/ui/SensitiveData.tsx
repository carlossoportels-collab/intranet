// resources/js/components/ui/SensitiveData.tsx
import { router } from '@inertiajs/react';
import { Eye, EyeOff } from 'lucide-react';
import React, { useState } from 'react';

import { useToast } from '@/contexts/ToastContext';

interface Props {
    value: string;
    mask?: string;
    maskLength?: number;
    contratoId?: number;
    tipoDato?: 'cbu' | 'tarjeta_numero' | 'tarjeta_codigo' | 'tarjeta_vencimiento';
}

export const SensitiveData: React.FC<Props> = ({ 
    value, 
    mask = '•', 
    maskLength = 12,
    contratoId,
    tipoDato
}) => {
    const [show, setShow] = useState(false);
    const [loading, setLoading] = useState(false);
    const toast = useToast();

    const handleReveal = () => {
        if (!show && contratoId && tipoDato) {
            setLoading(true);
            
            router.post('/comercial/utils/auditoria/dato-sensible', {
                contrato_id: contratoId,
                tipo_dato: tipoDato
            }, {
                preserveScroll: true,
                onSuccess: () => {
                    setShow(true);
                    setLoading(false);
                },
                onError: (errors) => {
                    console.error('Error registrando acceso:', errors);
                    toast.error('No se pudo registrar el acceso');
                    setLoading(false);
                }
            });
        } else {
            setShow(!show);
        }
    };

    return (
        <div className="flex items-center gap-2">
            <span className="font-mono">
                {show ? value : mask.repeat(maskLength)}
            </span>
            <button
                onClick={handleReveal}
                disabled={loading}
                className="text-gray-400 hover:text-gray-600 disabled:opacity-50"
                title={show ? 'Ocultar' : 'Mostrar'}
            >
                {loading ? (
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-gray-400 border-t-transparent" />
                ) : show ? (
                    <EyeOff className="h-4 w-4" />
                ) : (
                    <Eye className="h-4 w-4" />
                )}
            </button>
        </div>
    );
};