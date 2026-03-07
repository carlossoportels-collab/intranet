// resources/js/components/ui/BadgeEnConstruccion.tsx
import React from 'react';
import { Construction } from 'lucide-react';

interface Props {
    size?: 'sm' | 'md' | 'lg';
    className?: string;
}

export default function BadgeEnConstruccion({ size = 'sm', className = '' }: Props) {
    const sizeClasses = {
        sm: 'text-[10px] px-1.5 py-0.5',
        md: 'text-xs px-2 py-1',
        lg: 'text-sm px-2.5 py-1.5'
    };

    return (
        <span className={`inline-flex items-center gap-1 bg-amber-100 text-amber-700 rounded-full font-medium ${sizeClasses[size]} ${className}`}>
            <Construction className="h-3 w-3" />
            Próximamente
        </span>
    );
}