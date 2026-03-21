// resources/js/layouts/app-layout.tsx

import { Head, usePage } from '@inertiajs/react';
import React, { ReactNode, useState, useEffect } from 'react';

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
    const [headerHeight, setHeaderHeight] = useState(0);
    const { props } = usePage<PageProps>();
    
    const pageTitle = title || (props.compania ? props.compania.nombre : 'Intranet 2026');

    useEffect(() => {
        // Medir el header después del montaje
        const header = document.querySelector('header');
        if (header) {
            setHeaderHeight(header.offsetHeight);
        }
    }, []);

    return (
        <div className="h-screen flex flex-col bg-gray-50 overflow-hidden">
            <Head title={pageTitle} />
            
            <Header 
                sidebarOpen={sidebarOpen} 
                setSidebarOpen={setSidebarOpen} 
            />
            
            <div className="flex flex-1 overflow-hidden relative">
                {sidebarOpen && (
                    <aside className="lg:hidden absolute inset-0 z-40 bg-local text-white overflow-y-auto">
                        <div className="h-full overflow-y-auto px-3 py-4">
                            <SidebarNav 
                                className="flex-1 overflow-y-auto"
                                auth={props.auth}
                            />
                            <div className="mt-4">
                                <Footer />
                            </div>
                        </div>
                    </aside>
                )}
                
                <aside className="hidden lg:flex lg:w-64 flex-col bg-local text-white border-r border-gray-800 overflow-y-auto">
                    <div className="flex-1 px-3 py-4 overflow-y-auto">
                        <SidebarNav 
                            className="flex-1 overflow-y-auto"
                            auth={props.auth}
                        />
                    </div>
                    <div className="px-3 pb-4">
                        <Footer />
                    </div>
                </aside>

                {/* 🔥 MAIN CON ALTURA CALCULADA */}
                <main 
                    className="flex-1 overflow-y-auto p-2"
                    style={{ height: `calc(100vh - ${headerHeight}px)` }}
                >
                    {children}
                </main>
            </div>
        </div>
    );
}