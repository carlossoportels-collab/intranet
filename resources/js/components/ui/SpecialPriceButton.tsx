// resources/js/components/ui/SpecialPriceButton.tsx
import { MessageCircle } from 'lucide-react';
import React from 'react';

import { sendWhatsApp, createPriceQueryMessage } from '@/utils/whatsapp.utils';

interface SpecialPriceButtonProps {
    producto: {
        codigopro?: string;
        nombre: string;
    };
    className?: string;
}

export const SpecialPriceButton: React.FC<SpecialPriceButtonProps> = ({ 
    producto, 
    className = '' 
}) => {
    const handleClick = () => {
        const message = createPriceQueryMessage(producto);
        sendWhatsApp('5491138195916', message);
    };

    return (
        <button
            type="button"
            onClick={handleClick}
            className={`inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 transition-colors shadow-sm hover:shadow ${className}`}
        >
            <MessageCircle className="h-4 w-4" />
            <span>Consultar Precio</span>
        </button>
    );
};