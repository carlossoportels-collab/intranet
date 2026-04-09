// SidebarNav.tsx - Versión corregida con Estadísticas como sección independiente

import { Link, usePage } from '@inertiajs/react';
import {
    ChevronDown, ChevronRight,
    FileText, Building,
    Settings, Users, Tag,
    Briefcase, FileCheck, Bell, Calendar,
    CreditCard, Package,
    UserCog, FileQuestion, Database,
    Cog, CreditCard as CreditCardIcon,
    Lightbulb, Target, Layers,
    Cake, FileSignature, User, Wrench,
    Briefcase as BriefcaseIcon, Shield,
    Folder, BarChart,
    Eye, Search, Receipt,
    Phone, Mail, ArrowRightLeft, PieChart
} from 'lucide-react';
import React, { useState, useEffect } from 'react';
import { router } from '@inertiajs/react';

interface SidebarNavProps {
    className?: string;
    collapsed?: boolean;
    auth?: {
        user?: {
            id: number;
            rol_id?: number;
            rol_nombre: string;
            permisos?: string[];
            ve_todas_cuentas?: boolean;
            comercial?: {
                compania_id: number | null;
                prefijo_id?: number | null;
            } | null;
            [key: string]: any;
        };
    };
}

interface NavItem {
    id: string;
    name: string;
    href?: string;
    icon?: React.ReactNode;
    children?: NavItem[];
    badge?: number;
    permiso?: string;
    visibleForRoles?: string[];
    visibleForUsers?: number[];
    requiereVerTodasCuentas?: boolean;
    parentId?: string | null;
}

export default function SidebarNav({ className = '', auth }: SidebarNavProps) {
    const { url } = usePage();

    // Cargar estado expandido desde localStorage al inicializar
    const loadExpandedFromStorage = (): Record<string, boolean> => {
        try {
            const stored = localStorage.getItem('sidebar_expanded_items');
            return stored ? JSON.parse(stored) : {};
        } catch {
            return {};
        }
    };

    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>(loadExpandedFromStorage);

    // Guardar en localStorage cuando cambie el estado
    useEffect(() => {
        localStorage.setItem('sidebar_expanded_items', JSON.stringify(expandedItems));
    }, [expandedItems]);

    // Sincronizar expansión con la ruta actual
    useEffect(() => {
        const currentPath = url.split('?')[0];
        
        const findActivePath = (items: NavItem[]): string[] => {
            for (const item of items) {
                if (item.href === currentPath) return [item.id];
                if (item.children) {
                    const childPath = findActivePath(item.children);
                    if (childPath.length > 0) return [item.id, ...childPath];
                }
            }
            return [];
        };

        const activeIds = findActivePath(navigation);
        if (activeIds.length > 0) {
            setExpandedItems(prev => {
                const newExpanded = { ...prev };
                activeIds.forEach(id => { newExpanded[id] = true; });
                return newExpanded;
            });
        }
    }, [url]);

    const toggleItem = (id: string, level: number) => {
        setExpandedItems(prev => {
            const isOpening = !prev[id];
            if (!isOpening) return { ...prev, [id]: false };

            const nextState: Record<string, boolean> = { ...prev };
            
            if (level === 0) {
                navigation.forEach(item => {
                    if (item.id !== id) nextState[item.id] = false;
                });
            }
            nextState[id] = true;
            return nextState;
        });
    };

    const userData = auth?.user;
    const permisos = userData?.permisos || [];
    const rolId = userData?.rol_id;

    const tienePermiso = (permisoRequerido?: string): boolean => {
        if (!permisoRequerido) return true;
        return permisos.includes(permisoRequerido);
    };

    const puedeVerEstadisticas = (): boolean => {
        // Usuarios con rol 3 o 5 pueden ver estadísticas
        // También pueden ver si tienen los permisos específicos
        return [3, 5].includes(rolId || 0) || 
               tienePermiso('ver_estadisticas_grupales') || 
               tienePermiso('ver_estadisticas_individuales');
    };

    const navigation: NavItem[] = [
        {
            id: 'configuracion',
            name: 'Configuración',
            icon: <Settings size={16} />,
            permiso: 'ver_configuracion',
            children: [
                {
                    id: 'parametros-generales',
                    name: 'Parámetros Generales',
                    icon: <Cog size={14} />,
                    permiso: 'gestionar_parametros',
                    children: [
                        { id: 'estados-lead', name: 'Estados de leads', href: '/config/parametros/estados-lead', icon: <Phone size={12} />, permiso: 'gestionar_parametros' },
                        { id: 'medios-pago', name: 'Medios de pago', href: '/config/parametros/medios-pago', icon: <CreditCardIcon size={12} />, permiso: 'gestionar_parametros' },
                        { id: 'motivos-baja', name: 'Motivos baja', href: '/config/parametros/motivos-baja', icon: <Lightbulb size={12} />, permiso: 'gestionar_parametros' },
                        { id: 'origen-prospecto', name: 'Origen de prospecto', href: '/config/parametros/origen-prospecto', icon: <Target size={12} />, permiso: 'gestionar_parametros' },
                        { id: 'rubros', name: 'Rubros', href: '/config/parametros/rubros', icon: <Layers size={12} />, permiso: 'gestionar_parametros' },
                    ]
                },
                { id: 'gestion-tarifas', name: 'Gestión de Tarifas', icon: <Tag size={14} />, href: '/config/tarifas', permiso: 'gestionar_tarifas' },
                { id: 'gestion-promociones', name: 'Gestión de Promociones', icon: <CreditCard size={14} />, href: '/config/promociones', permiso: 'gestionar_promociones' },
                { id: 'gestion-admin', name: 'Gestión Admin', href: '/config/gestion-admin', icon: <Database size={12} />, permiso: 'gestion_admin',visibleForUsers: [2]   },
                {
                    id: 'gestion-usuarios',
                    name: 'Gestión de Usuarios',
                    icon: <UserCog size={14} />,
                    permiso: 'gestionar_usuarios',
                    children: [
                        { id: 'roles-permisos', name: 'Roles y permisos', href: '/config/usuarios/roles', icon: <Shield size={12} />, permiso: 'gestionar_roles_permisos' },
                    ]
                }
            ]
        },
        {
            id: 'condiciones-comerciales',
            name: 'Cond Comerciales',
            icon: <FileText size={16} />,
            permiso: 'ver_tarifas_consulta',
            children: [
                { id: 'tarifas-consulta', name: 'Tarifas (consulta)', href: '/comercial/tarifas', icon: <Eye size={14} />, permiso: 'ver_tarifas_consulta' },
                { id: 'documentacion', name: 'Documentación', href: '/comercial/documentacion', icon: <Folder size={14} />, permiso: 'ver_documentacion' },
                { id: 'reenvios-activos', name: 'Reenvíos activos', href: '/comercial/reenvios', icon: <Mail size={14} />, permiso: 'ver_reenvios_activos' },
            ]
        },
        {
            id: 'gestion-comercial',
            name: 'Gestión Comercial',
            icon: <Briefcase size={16} />,
            permiso: 'ver_prospectos_leads',
            children: [
                { id: 'contactos', name: 'Clientes', href: '/comercial/contactos', icon: <Users size={14} />, permiso: 'ver_contactos' },
                {
                    id: 'cuentas',
                    name: 'Cuentas',
                    icon: <Building size={14} />,
                    permiso: 'ver_cuentas',
                    children: [
                        { id: 'detalles', name: 'Detalles', href: '/comercial/cuentas', icon: <Search size={12} />, permiso: 'ver_detalles_cuenta' },
                        { id: 'certificados-flota', name: 'Certificados', href: '/comercial/cuentas/certificados', icon: <FileCheck size={12} />, permiso: 'ver_certificados_flota' },
                        { id: 'cambio-titularidad', name: 'Cambio Titularidad', href: '/comercial/cuentas/cambio-titularidad', icon: <User size={12} />, permiso: 'gestionar_cambio_titularidad' },
                        { id: 'cambio-razon-social', name: 'Cambio RS', href: '/comercial/cuentas/cambio-razon-social', icon: <Building size={12} />, permiso: 'gestionar_cambio_razon_social' },
                        { id: 'transferencias', name: 'Transferencias', href: '/comercial/cuentas/transferencias', icon: <ArrowRightLeft size={12} />, permiso: 'gestionar_transferencias', visibleForUsers:[14 ]},
                    ]
                },
                { id: 'contratos', name: 'Contratos', href: '/comercial/contratos', icon: <FileText size={14} />, permiso: 'ver_contratos' },
                { id: 'presupuestos', name: 'Presupuestos', href: '/comercial/presupuestos', icon: <FileText size={14} />, permiso: 'ver_presupuestos' },
                { id: 'presupuestos-legacy', name: 'Presupuestos Anteriores', href: '/comercial/presupuestos-legacy', icon: <FileText size={14} /> },
                { id: 'recordatorios', name: 'Recordatorios', href: '/notificaciones/programadas', icon: <Calendar size={14} />, permiso: 'ver_recordatorios' },
                { id: 'prospectos', name: 'Prospectos & Leads', href: '/comercial/prospectos', icon: <Target size={14} />, permiso: 'ver_prospectos_leads' },
                { id: 'perdidas', name: 'Leads perdidos', href: '/comercial/leads-perdidos', icon: <Receipt size={14} />, permiso: 'ver_leads_perdidos' },
            ]
        },
        {
            id: 'rrhh',
            name: 'Recursos Humanos',
            icon: <Users size={16} />,
            permiso: 'ver_datos_personales',
            children: [
                {
                    id: 'personal',
                    name: 'Personal',
                    icon: <User size={14} />,
                    permiso: 'ver_datos_personales',
                    children: [
                        { id: 'detalles-personales', name: 'Datos personales', href: '/rrhh/personal/datos', icon: <User size={12} />, permiso: 'ver_datos_personales' },
                        { id: 'licencias', name: 'Licencias', href: '/rrhh/personal/licencias', icon: <FileCheck size={12} />, permiso: 'ver_licencias' },
                        { id: 'cumpleanos', name: 'Cumpleaños', href: '/rrhh/personal/cumpleanos', icon: <Cake size={12} />, permiso: 'ver_cumpleanos' },
                    ]
                },
                {
                    id: 'equipos',
                    name: 'Equipos',
                    icon: <Users size={14} />,
                    permiso: 'ver_equipos',
                    children: [
                        { id: 'equipo-tecnico', name: 'Técnico', href: '/rrhh/equipos/tecnico', icon: <Wrench size={12} />, permiso: 'gestionar_equipo_tecnico' },
                    ]
                }
            
            ]
            
        }
    ];
    

    // Agregar sección de Estadísticas SOLO si el usuario puede verlas
    if (puedeVerEstadisticas()) {
        navigation.push({
            id: 'estadisticas',
    name: 'Estadísticas',
    icon: <BarChart size={16} />,
    children: [
        { 
            id: 'estadisticas-generales', 
            name: 'Estadísticas Grupales', 
            href: '/estadisticas/generales', 
            icon: <PieChart size={14} />, 
            permiso: 'ver_estadisticas_grupales',
            visibleForUsers: [2]  
        },
        { 
            id: 'estadisticas-comerciales', 
            name: 'Rendimiento Comercial', 
            href: '/estadisticas/comerciales', 
            icon: <Users size={14} />, 
            permiso: 'ver_estadisticas_grupales',
            visibleForUsers: [2] 
        },
        // Solo visible para usuario ID 7
        { 
            id: 'seguimiento-ads', 
            name: 'Seguimiento ADS', 
            href: '/estadisticas/seguimiento-ads', 
            icon: <Target size={14} />,
            visibleForUsers: [2]
                },
                
            ]
        });
    }

    const filterNavItems = (items: NavItem[]): NavItem[] => {
        return items.filter(item => {
            // 1. Lógica específica para el ítem de Transferencias
            if (item.id === 'transferencias') {
                const isAdmin = [1, 2, 3].includes(userData?.rol_id || 0); 
                const isComercial = userData?.rol_id === 5;
                const prefijoId = userData?.comercial?.prefijo_id;

                if (!isAdmin) {
                    if (isComercial && prefijoId !== 9) {
                        return false;
                    }
                    if (!isComercial) return false; 
                }
            }

            // 2. Verificar usuarios específicos (visibleForUsers)
            if (item.id !== 'transferencias' && item.visibleForUsers && !item.visibleForUsers.includes(userData?.id || 0)) {
                return false;
            }
            
            // 3. Verificar roles (visibleForRoles)
            if (item.visibleForRoles && !item.visibleForRoles.includes(userData?.rol_nombre || '')) {
                return false;
            }
            
            // 4. Verificar permisos generales del sistema
            if (item.permiso && !tienePermiso(item.permiso)) {
                return false;
            }
            
            // 5. Filtrar hijos recursivamente
            if (item.children) {
                const filteredChildren = filterNavItems([...item.children]);
                if (filteredChildren.length > 0) {
                    item.children = filteredChildren;
                    return true;
                }
                return false;
            }
            
            return true;
        });
    };

    const isItemActive = (item: NavItem): boolean => {
        const currentPath = url.split('?')[0];
        if (item.href) return currentPath === item.href;
        if (item.children) return item.children.some(child => isItemActive(child));
        return false;
    };

    const renderNavItem = (item: NavItem, level = 0): React.ReactNode => {
        const hasChildren = item.children && item.children.length > 0;
        const isExpanded = expandedItems[item.id];
        const isActive = isItemActive(item);

        const paddingClass = level === 0 ? 'px-4' : level === 1 ? 'pl-8 pr-4' : 'pl-12 pr-4';
        
        const iconColor = (level === 0 || isActive) ? 'text-sat' : 'text-gray-400';
        const textColor = isActive 
            ? 'text-sat font-bold' 
            : (level === 0 ? 'text-white font-semibold' : 'text-gray-300');

        if (hasChildren) {
            return (
                <div key={item.id} className="w-full">
                    <button
                        onClick={() => toggleItem(item.id, level)}
                        className={`flex items-center justify-between w-full py-3 text-sm transition-all duration-200 group ${paddingClass}`}
                    >
                        <div className="flex items-center">
                            {item.icon && <span className={`mr-3 transition-colors ${iconColor}`}>{item.icon}</span>}
                            <span className={`transition-colors ${textColor}`}>{item.name}</span>
                        </div>
                        <ChevronRight
                            size={14}
                            className={`text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                        />
                    </button>
                    
                    {isExpanded && (
                        <div className="bg-transparent"> 
                            {item.children?.map((child) => renderNavItem(child, level + 1))}
                        </div>
                    )}
                </div>
            );
        }

        return (
            <Link
                key={item.id}
                href={item.href || '#'}
                className={`flex items-center py-2.5 text-sm transition-all duration-200 group ${paddingClass}`}
            >
                {item.icon && <span className={`mr-3 transition-colors ${iconColor}`}>{item.icon}</span>}
                <span className={`transition-colors ${textColor}`}>{item.name}</span>
            </Link>
        );
    };

    const filteredNavigation = filterNavItems([...navigation]);

    return (
        <nav className={`${className} select-none`}>
            <div className="space-y-0.5">
                {filteredNavigation.map(item => renderNavItem(item))}
            </div>
        </nav>
    );
}