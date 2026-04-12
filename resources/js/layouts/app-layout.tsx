// resources/js/layouts/app-layout.tsx

import { Head, usePage } from '@inertiajs/react';
import React, { ReactNode, useState, useEffect } from 'react';
import { Menu, X, ChevronLeft, ChevronRight } from 'lucide-react';

import Footer from '@/components/layout/Footer';
import Header from '@/components/layout/Header';
import SidebarNav from '@/components/layout/SidebarNav';

interface AppLayoutProps {
    children: ReactNode;
    title?: string;
}

interface PageProps {
    compania: {
        nombre: string;
        logo: string;
        colores: {
            primary: string;
            secondary: string;
        };
    };
    auth?: {
        user?: {
            id: number;
            rol_nombre: string;
            [key: string]: any;
        };
    };
    [key: string]: any;
}

export default function AppLayout({ children, title }: AppLayoutProps) {
    const [sidebarOpen, setSidebarOpen] = useState(false);
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [headerHeight, setHeaderHeight] = useState(0);
    const { props } = usePage<PageProps>();
    
    const pageTitle = title || (props.compania ? props.compania.nombre : 'Intranet 2026');

    // Cargar estado colapsado desde localStorage
    useEffect(() => {
        const saved = localStorage.getItem('sidebar_collapsed');
        if (saved !== null) {
            setSidebarCollapsed(JSON.parse(saved));
        }
    }, []);

    // Medir el header después del montaje
    useEffect(() => {
        const header = document.querySelector('header');
        if (header) {
            setHeaderHeight(header.offsetHeight);
        }
    }, []);

    const toggleSidebarCollapse = () => {
        const newState = !sidebarCollapsed;
        setSidebarCollapsed(newState);
        localStorage.setItem('sidebar_collapsed', JSON.stringify(newState));
    };

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            <Head title={pageTitle} />
            
            <Header 
                sidebarOpen={sidebarOpen} 
                setSidebarOpen={setSidebarOpen} 
            />
            
            <div className="flex flex-1 overflow-hidden relative">
                {/* Mobile sidebar overlay */}
                {sidebarOpen && (
                    <div 
                        className="lg:hidden fixed inset-0 z-40 bg-black/50"
                        onClick={() => setSidebarOpen(false)}
                    />
                )}
                
                {/* Mobile sidebar */}
                <aside className={`lg:hidden fixed top-0 left-0 z-50 h-full w-64 bg-local text-white transform transition-transform duration-300 ease-in-out ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
                    <div className="flex justify-end p-4">
                        <button onClick={() => setSidebarOpen(false)} className="text-white">
                            <X className="h-5 w-5" />
                        </button>
                    </div>
                    <div className="h-full overflow-y-auto px-3 py-4">
                        <SidebarNav 
                            className="flex-1 overflow-y-auto"
                            auth={props.auth}
                            collapsed={false}
                        />
                        <div className="mt-4">
                            <Footer />
                        </div>
                    </div>
                </aside>
                
                {/* Desktop sidebar - CON BOTÓN DE COLAPSAR */}
                <aside 
                    className={`hidden lg:flex flex-col bg-local text-white border-r border-gray-800 transition-all duration-300 ease-in-out relative ${
                        sidebarCollapsed ? 'w-16' : 'w-64'
                    }`}
                >
                    {/* Botón de colapsar */}
                    <button
                        onClick={toggleSidebarCollapse}
                        className="absolute -right-3 top-6 z-10 p-1.5 bg-local rounded-full shadow-md hover:opacity-80 transition-colors text-white border border-gray-700"
                        title={sidebarCollapsed ? "Expandir menú" : "Colapsar menú"}
                    >
                        {sidebarCollapsed ? (
                            <ChevronRight className="h-3 w-3" />
                        ) : (
                            <ChevronLeft className="h-3 w-3" />
                        )}
                    </button>
                    
                    <div className={`flex-1 px-3 py-4 overflow-y-auto ${sidebarCollapsed ? 'px-2' : ''}`}>
                        <SidebarNav 
                            className="flex-1 overflow-y-auto"
                            auth={props.auth}
                            collapsed={sidebarCollapsed}
                        />
                    </div>
                    {!sidebarCollapsed && (
                        <div className="px-3 pb-4">
                            <Footer />
                        </div>
                    )}
                    {sidebarCollapsed && (
                        <div className="px-2 pb-4 flex justify-center">
                            <div className="w-8 h-8" /> {/* Espaciador cuando está colapsado */}
                        </div>
                    )}
                </aside>

                <main 
                    className={`flex-1 overflow-y-auto p-2 transition-all duration-300 ease-in-out ${
                        sidebarCollapsed ? 'lg:pl-2' : 'lg:pl-0'
                    }`}
                    style={{ height: `calc(100vh - ${headerHeight}px)` }}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}