import { usePage, Link } from '@inertiajs/react';
import { LogOut } from 'lucide-react';
import React from 'react';

import { PageProps } from '@/types';

export default function Footer({ className = '' }: { className?: string }) {
    const { auth } = usePage<PageProps>().props;
    const userData = auth?.user;
    
    const getUserInitials = () => {
        return userData?.iniciales || 'U';
    };

    return (
        <div className={`border-t border-gray-200 pt-3 ${className}`}>
            <div className="px-3">
                <div className="flex items-center justify-between p-3 rounded-lg bg-local-50">
                    <div className="flex items-center">
                        <div className="h-8 w-8 rounded-full bg-sat flex items-center justify-center text-white font-semibold mr-3">
                            <span className="text-sm">
                                {getUserInitials()}
                            </span>
                        </div>
                        <div>
                            {/* Mostrar nombre completo en vez del nombre de usuario */}
                            <p className="text-sm font-medium text-gray-900">
                                {userData?.nombre_completo || userData?.nombre_usuario || 'Usuario'}
                            </p>
                            <p className="text-xs text-gray-500">
                                {userData?.rol_nombre || 'Sin rol'}
                            </p>
                        </div>
                    </div>
                    <Link
                        href="/logout"
                        method="post"
                        as="button"
                        className="p-1.5 rounded-md text-gray-500 hover:text-red-600 hover:bg-red-50 transition-colors"
                        title="Cerrar sesión"
                    >
                        <LogOut size={18} />
                    </Link>
                </div>

                <div className="pt-3 text-center">
                    <p className="text-xs text-gray-400">
                        Intranet 2026 v0.1
                    </p>
                </div>
            </div>
        </div>
    );
}