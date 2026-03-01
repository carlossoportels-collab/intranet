import { Link } from '@inertiajs/react';
import React from 'react';

interface ApplicationLogoProps {
    className?: string;
}

export default function ApplicationLogo({ className = '' }: ApplicationLogoProps) {
    return (
        <Link href="/">
            <div className={`flex items-center space-x-2 ${className}`}>
                {/* Logo con colores LocalSat */}
                <div className="relative">
                    <div className="h-10 w-10 bg-local rounded-lg flex items-center justify-center">
                        <div className="h-6 w-6 bg-sat rounded-md flex items-center justify-center">
                            <span className="text-white font-bold text-sm">LS</span>
                        </div>
                    </div>
                </div>
                <div className="hidden md:block">
                    <span className="text-lg font-bold text-local">Intranet</span>
                    <span className="text-lg font-bold text-sat">2026</span>
                </div>
            </div>
        </Link>
    );
}