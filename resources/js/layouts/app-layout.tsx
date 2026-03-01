import { Head, usePage } from '@inertiajs/react';
import React, { ReactNode, useState } from 'react';

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
    const { props } = usePage<PageProps>();
    
    const pageTitle = title || (props.compania ? props.compania.nombre : 'Intranet 2026');

    return (
            <div className="min-h-screen bg-gray-50">
                <Head title={pageTitle} />
                
                <Header 
                    sidebarOpen={sidebarOpen} 
                    setSidebarOpen={setSidebarOpen} 
                />
                
                <div className="flex min-h-screen pt-16">
                    {sidebarOpen && (
                        <aside className="lg:hidden fixed inset-0 z-40 pt-16 bg-local text-white">
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
                    
                    <aside className="hidden lg:flex lg:w-64 lg:flex-col fixed inset-y-0 pt-16 bg-local text-white border-r border-gray-800">
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

                    <main className={`flex-1 lg:ml-64 pt-4 ${sidebarOpen ? 'overflow-hidden' : ''}`}>
                        <div className="container mx-auto px-4 py-6">
                            {children}
                        </div>
                    </main>
                </div>
            </div>
    );
}