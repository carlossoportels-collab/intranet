import { InertiaLinkProps } from '@inertiajs/react';
import { LucideIcon } from 'lucide-react';

import { Usuario } from './models';

export interface AuthUser {
    id: number;
    nombre_usuario: string;
    rol_id: number;
    ve_todas_cuentas: boolean;
    ultimo_acceso: string;
    iniciales: string;
}

export interface BreadcrumbItem {
    title: string;
    href: string;
}

export interface NavGroup {
    title: string;
    items: NavItem[];
}

export interface NavItem {
    title: string;
    href: NonNullable<InertiaLinkProps['href']>;
    icon?: LucideIcon | null;
    isActive?: boolean;
}

export interface SharedData {
    name: string;
    auth: Auth;
    sidebarOpen: boolean;
    [key: string]: unknown;
}

// Interface para datos comerciales
export interface ComercialData {
    id: number;
    compania_id: number | null;
    prefijo_id: number | null;
    activo: boolean;
}

// Interface principal para User
export interface User {
    id: number;
    nombre_usuario: string;
    rol_id: number;
    rol_nombre: string;
    ve_todas_cuentas: boolean;
    ultimo_acceso: string;
    iniciales: string;
    
    // Nuevos campos agregados
    personal_id: number;
    nombre_completo: string;
    nombre: string;
    apellido: string;
    email: string | null;
    telefono: string | null;
    
    comercial: ComercialData | null;
}


export interface MenuItem {
    name: string;
    href?: string;
    children?: MenuItem[];
}

export interface PageProps {
    [key: string]: any;
    auth?: {
        user: User | null;
    };
}

declare module '@inertiajs/react' {
    export interface PageProps {
        auth?: {
            user: User | null;
        };
        flash?: {
            success: string | null;
            error: string | null;
        };
        url: string;
        [key: string]: any;
    }
}

declare module 'leaflet' {
    export class Marker {
        constructor(latlng: any, options?: any);
        addTo(map: any): this;
    }
    
    export class TileLayer {
        constructor(url: string, options?: any);
        addTo(map: any): this;
    }
    
    export class Map {
        constructor(element: string | HTMLElement, options?: any);
        setView(latlng: any, zoom: number): this;
    }
    
    export namespace Icon {
        interface DefaultOptions {
            iconRetinaUrl?: string;
            iconUrl?: string;
            shadowUrl?: string;
        }
        
        class Default {
            static mergeOptions(options: DefaultOptions): void;
        }
    }
    
    export function map(element: string | HTMLElement, options?: any): Map;
}

export * from './leads'; 

export interface PaginationData<T> {
    data: T[];
    current_page: number;
    first_page_url: string;
    from: number;
    last_page: number;
    last_page_url: string;
    links: Array<{
        url: string | null;
        label: string;
        active: boolean;
    }>;
    next_page_url: string | null;
    path: string;
    per_page: number;
    prev_page_url: string | null;
    to: number;
    total: number;
}

export interface EstadoLead {
    id: number;
    nombre: string;
    tipo: 'nuevo' | 'activo' | 'final_positivo' | 'final_negativo';
    orden_en_proceso: number;
    descripcion: string | null;
    color_hex: string;
    activo: boolean;
    deleted_at?: string | null;
}