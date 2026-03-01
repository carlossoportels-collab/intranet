// resources/js/components/layout/Header.tsx
import { Link, usePage } from '@inertiajs/react';
import { Search, Plus, Bell, Menu, X, RefreshCw } from 'lucide-react';
import React, { useState } from 'react';

import CrearLeadModal from '@/components/leads/CrearLeadModal';
import NotificacionesDropdown from '@/components/notificaciones/NotificacionesDropdown';

interface HeaderProps {
    sidebarOpen: boolean;
    setSidebarOpen: (open: boolean) => void;
}

interface PageProps {
    compania: {
        nombre: string;
        logo: string;
        short_name: string;
        colores: {
            primary: string;
            secondary: string;
        };
    };
    auth: {
        user: {
            id: number;
            nombre_usuario: string;
            nombre_completo: string;
            rol_id: number;
            comercial?: {
                es_comercial: boolean;
                prefijo_id?: number;
            } | null;
        };
    };
    origenes: any[];
    rubros: any[];
    provincias: any[];
    comerciales: any[];
    hay_comerciales: boolean;
    [key: string]: any;
}

export default function Header({ sidebarOpen, setSidebarOpen }: HeaderProps) {
    const [searchQuery, setSearchQuery] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const { props } = usePage<PageProps>();
    
    // Datos de la compañía desde Inertia
    const compania = props.compania;
    const usuario = props.auth?.user;
    const origenes = props.origenes || [];
    const rubros = props.rubros || [];
    const provincias = props.provincias || [];
    const comerciales = props.comerciales || [];
    const hayComerciales = props.hay_comerciales || false;

    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        // Implementar lógica de búsqueda aquí
    };

    return (
        <>
            <header className="bg-white shadow-sm border-b border-gray-200 sticky top-0 z-50">
                <div className="px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16">
                        <div className="flex items-center">
                            <button
                                onClick={() => setSidebarOpen(!sidebarOpen)}
                                className="lg:hidden p-2 rounded-md text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                                type="button"
                            >
                                {sidebarOpen ? <X size={24} /> : <Menu size={24} />}
                            </button>
                            <div className="ml-2 lg:ml-0">
                                <Link href="/">
                                    <img 
                                        src={`/images/logos/${compania.logo}`}
                                        alt={`Logo ${compania.nombre}`}
                                        className="h-14 w-auto object-contain"
                                        loading="lazy" 
                                        width="112"
                                        height="56"     
                                        onError={(e) => {
                                            const target = e.target as HTMLImageElement;
                                            target.src = '/images/logos/logo.webp';
                                        }}
                                    />
                                </Link>
                            </div>
                        </div>

                        <div className="flex-1 max-w-2xl mx-4">
                            <form onSubmit={handleSearch} className="flex gap-2 items-center">
                    
                                
                                <button 
                                    type="button"
                                    onClick={() => setIsModalOpen(true)}
                                    title="Agregar nuevo lead"
                                    className="p-2 bg-sat text-white rounded-md hover:bg-sat-600 transition-colors"
                                >
                                    <Plus size={20} />
                                </button>
                            </form>
                        </div>

                        <div className="flex items-center">
                            <NotificacionesDropdown />
                        </div>
                    </div>
                </div>
            </header>

            {/* Modal para crear nuevo lead - Disponible para todos los usuarios */}
            {usuario && (
                <CrearLeadModal
                    isOpen={isModalOpen}
                    onClose={() => setIsModalOpen(false)}
                    usuario={usuario}
                    origenes={origenes}
                    rubros={rubros}
                    provincias={provincias}
                    comerciales={comerciales}
                    hay_comerciales={hayComerciales}
                />
            )}
        </>
    );
}