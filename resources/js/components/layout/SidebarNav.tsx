// SidebarNav.tsx - Versión con permisos y filtrado por usuarios
import { Link } from '@inertiajs/react';
import { 
    ChevronDown, ChevronRight, 
    FileText, Building, 
    Settings, Users, Tag,
    Briefcase, FileCheck, Bell, Calendar,
    CreditCard, Package, 
    UserCog, FileQuestion, Megaphone,
    Cog, CreditCard as CreditCardIcon, 
    Lightbulb, Target, Layers,
    Cake, FileSignature, User, Wrench, 
    Briefcase as BriefcaseIcon, Shield,
    Folder, BarChart,
    Eye, Search, Receipt,
    Phone, Mail
} from 'lucide-react';
import React, { useState } from 'react';

interface SidebarNavProps {
    className?: string;
    collapsed?: boolean;
    auth?: {
        user?: {
            id: number;
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
}

export default function SidebarNav({ className = '', auth }: SidebarNavProps) {
    const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({});

    const toggleItem = (id: string) => {
        setExpandedItems(prev => ({
            ...prev,
            [id]: !prev[id]
        }));
    };

    const userData = auth?.user;
    const permisos = userData?.permisos || [];
    const veTodasCuentas = userData?.ve_todas_cuentas || false;

    const tienePermiso = (permisoRequerido?: string): boolean => {
        if (!permisoRequerido) return true;
        return permisos.includes(permisoRequerido);
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
                        { id: 'terminos-condiciones', name: 'Términos y condiciones', href: '/config/parametros/terminos-condiciones', icon: <FileText size={12} />, permiso: 'gestionar_parametros' },
                    ]
                },
                {
                    id: 'gestion-tarifas',
                    name: 'Gestión de Tarifas',
                    icon: <Tag size={14} />,
                    href: '/config/tarifas',
                    permiso: 'gestionar_tarifas',
                },
                {
                    id: 'gestion-promociones',
                    name: 'Gestión de Promociones',
                    icon: <Tag size={14} />,
                    href: '/config/promociones',
                    permiso: 'gestionar_promociones',
                },
                {
                    id: 'gestion-usuarios',
                    name: 'Gestión de Usuarios',
                    icon: <UserCog size={14} />,
                    permiso: 'gestionar_usuarios',
                    children: [
                        { id: 'usuarios-sistema', name: 'Usuarios del sistema', href: '/config/usuarios', icon: <User size={12} />, permiso: 'gestionar_usuarios' },
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
                { id: 'convenios-vigentes', name: 'Convenios vigentes', href: '/comercial/convenios', icon: <FileCheck size={14} />, permiso: 'ver_convenios_vigentes' },
                { 
                    id: 'documentacion', 
                    name: 'Documentación', 
                    href: '/comercial/documentacion', 
                    icon: <Folder size={14} />,
                    permiso: 'ver_documentacion'
                },
                { id: 'novedades', name: 'Novedades', href: '/comercial/novedades', icon: <Megaphone size={14} />, permiso: 'ver_novedades' },
                { id: 'reenvios-activos', name: 'Reenvíos activos', href: '/comercial/reenvios', icon: <Mail size={14} />, permiso: 'ver_reenvios_activos' },
            ]
        },
        {
            id: 'gestion-comercial',
            name: 'Gestión Comercial',
            icon: <Briefcase size={16} />,
            permiso: 'ver_prospectos_leads',
            children: [
                { id: 'actividad', name: 'Actividad', href: '/comercial/actividad', icon: <Bell size={14} />, permiso: 'ver_actividad' },
                { id: 'contactos', name: 'Contactos', href: '/comercial/contactos', icon: <Users size={14} />, permiso: 'ver_contactos' },
                {
                    id: 'cuentas',
                    name: 'Cuentas',
                    icon: <Building size={14} />,
                    permiso: 'ver_cuentas',
                    children: [
                        { id: 'detalles', name: 'Detalles', href: '/comercial/cuentas', icon: <Search size={12} />, permiso: 'ver_detalles_cuenta' },
                        { id: 'certificados-flota', name: 'Certificados flota', href: '/comercial/cuentas/certificados', icon: <FileCheck size={12} />, permiso: 'ver_certificados_flota' },
                        { id: 'cambio-titularidad', name: 'Cambio Titularidad', href: '/comercial/cuentas/cambio-titularidad', icon: <User size={12} />, permiso: 'gestionar_cambio_titularidad' },
                        { id: 'cambio-razon-social', name: 'Cambio Razón Social', href: '/comercial/cuentas/cambio-razon-social', icon: <Building size={12} />, permiso: 'gestionar_cambio_razon_social' },
                    ]
                },
                { id: 'contratos', name: 'Contratos', href: '/comercial/contratos', icon: <FileText size={14} />, permiso: 'ver_contratos' },
                { id: 'presupuestos', name: 'Presupuestos', href: '/comercial/presupuestos', icon: <FileText size={14} />, permiso: 'ver_presupuestos' },
                { id: 'recordatorios', name: 'Recordatorios', href: '/notificaciones/programadas', icon: <Calendar size={14} />, permiso: 'ver_recordatorios' },
                { id: 'prospectos', name: 'Prospectos & Leads', href: '/comercial/prospectos', icon: <Target size={14} />, permiso: 'ver_prospectos_leads' },
                { id: 'perdidas', name: 'Leads perdidos', href: '/comercial/leads-perdidos', icon: <Receipt size={14} />, permiso: 'ver_leads_perdidos' },
            ]
        },
        {
            id: 'estadisticas',
            name: 'Estadísticas',
            icon: <BarChart size={16} />,
            visibleForUsers: [3, 5],
            children: [
                { 
                    id: 'comercial-grupal', 
                    name: 'Desempeño Grupal', 
                    href: '/estadisticas/comercial-grupal', 
                    icon: <Users size={14} />,
                },
                { 
                    id: 'comercial-individual', 
                    name: 'Rendimiento Individual', 
                    href: '/estadisticas/comercial-individual', 
                    icon: <User size={14} />,
                },
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
                        { id: 'datos-personales', name: 'Datos personales', href: '/rrhh/personal/datos', icon: <User size={12} />, permiso: 'ver_datos_personales' },
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
                        { id: 'equipo-comercial', name: 'Comercial', href: '/rrhh/equipos/comercial', icon: <BriefcaseIcon size={12} />, permiso: 'gestionar_equipo_comercial' },
                        { id: 'equipo-tecnico', name: 'Técnico', href: '/rrhh/equipos/tecnico', icon: <Wrench size={12} />, permiso: 'gestionar_equipo_tecnico' },
                    ]
                }
            ]
        }
    ];

    // 🔥 FUNCIÓN DE FILTRADO CORREGIDA - respeta visibleForUsers
    const filterNavItems = (items: NavItem[]): NavItem[] => {
        return items.filter(item => {
            // Verificar usuarios específicos
            if (item.visibleForUsers && !item.visibleForUsers.includes(userData?.id || 0)) {
                return false;
            }
            
            // Verificar roles
            if (item.visibleForRoles && !item.visibleForRoles.includes(userData?.rol_nombre || '')) {
                return false;
            }
            
            // Verificar permiso
            if (item.permiso && !tienePermiso(item.permiso)) {
                return false;
            }
            
            // Filtrar hijos recursivamente
            if (item.children) {
                item.children = filterNavItems(item.children);
                return item.children.length > 0;
            }
            
            return true;
        });
    };

    const filteredNavigation = filterNavItems(navigation);

    const renderNavItem = (item: NavItem, level = 0): React.ReactNode => {
        const hasChildren = item.children && item.children.length > 0;
        const hasNestedChildren = item.children?.some(child => child.children);
        const isExpanded = expandedItems[item.id];
        
        const isTopLevel = level === 0;
        const isSecondLevel = level === 1;
        const isThirdLevel = level >= 2;

        if (hasNestedChildren) {
            return (
                <div key={item.id} className="w-full">
                    <button
                        onClick={() => toggleItem(item.id)}
                        className={`flex items-center justify-between w-full px-4 py-3 text-sm transition-all duration-200 group sidebar-item
                            ${isTopLevel ? 'hover:bg-white/5' : ''}
                            ${isSecondLevel ? 'pl-8' : ''}
                            ${isThirdLevel ? 'pl-12' : ''}
                        `}
                        style={{ 
                            borderLeftColor: isExpanded ? 'var(--color-sat)' : 'transparent',
                            borderLeftWidth: '4px'
                        }}
                    >
                        <div className="flex items-center">
                            {item.icon && (
                                <span className={`mr-3 ${isTopLevel ? 'text-sat' : 'text-gray-400 group-hover:text-sat'}`}>
                                    {item.icon}
                                </span>
                            )}
                            <span className={`${isTopLevel ? 'text-white font-semibold' : isSecondLevel ? 'text-gray-300 font-medium' : 'text-gray-400'}`}>
                                {item.name}
                            </span>
                        </div>
                        <ChevronRight 
                            size={14} 
                            className={`text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                        />
                    </button>
                    
                    {isExpanded && (
                        <div className={`${isSecondLevel ? 'ml-8 border-l border-gray-700' : isThirdLevel ? 'ml-12 border-l border-gray-600' : ''}`}>
                            <div className="py-2">
                                {item.children?.map((child) => (
                                    <div key={child.id}>
                                        {renderNavItem(child, level + 1)}
                                    </div>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        if (hasChildren) {
            return (
                <div key={item.id} className="w-full">
                    <button
                        onClick={() => toggleItem(item.id)}
                        className={`flex items-center justify-between w-full px-4 py-3 text-sm transition-all duration-200 group sidebar-item
                            ${isTopLevel ? 'hover:bg-white/5' : ''}
                            ${isSecondLevel ? 'pl-8' : ''}
                            ${isThirdLevel ? 'pl-12' : ''}
                        `}
                        style={{ 
                            borderLeftColor: isExpanded ? 'var(--color-sat)' : 'transparent',
                            borderLeftWidth: '4px'
                        }}
                    >
                        <div className="flex items-center">
                            {item.icon && (
                                <span className={`mr-3 ${isTopLevel ? 'text-sat' : 'text-gray-400 group-hover:text-sat'}`}>
                                    {item.icon}
                                </span>
                            )}
                            <span className={`${isTopLevel ? 'text-white font-semibold' : 'text-gray-300'}`}>
                                {item.name}
                            </span>
                        </div>
                        <ChevronDown 
                            size={14} 
                            className={`text-gray-500 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
                        />
                    </button>
                    
                    {isExpanded && (
                        <div className={`${isSecondLevel ? 'ml-8 border-l border-gray-700' : ''}`}>
                            <div className="py-1">
                                {item.children!.map((child) => (
                                    <Link
                                        key={child.id}
                                        href={child.href || '#'}
                                        className="flex items-center px-4 py-2.5 text-sm text-gray-300 hover:text-white hover:bg-white/5 transition-colors sidebar-subitem ml-4"
                                    >
                                        {child.icon && (
                                            <span className="mr-3 text-gray-500">
                                                {child.icon}
                                            </span>
                                        )}
                                        <span>{child.name}</span>
                                    </Link>
                                ))}
                            </div>
                        </div>
                    )}
                </div>
            );
        }

        return (
            <Link
                key={item.id}
                href={item.href || '#'}
                className={`flex items-center px-4 py-3 text-sm transition-all duration-200 group sidebar-item
                    ${isTopLevel ? 'hover:bg-white/5' : ''}
                    ${isSecondLevel ? 'pl-8' : ''}
                    ${isThirdLevel ? 'pl-12' : ''}
                `}
                style={{ borderLeftWidth: '4px' }}
            >
                {item.icon && (
                    <span className={`mr-3 ${isTopLevel ? 'text-sat' : 'text-gray-400 group-hover:text-sat'}`}>
                        {item.icon}
                    </span>
                )}
                <span className={`${isTopLevel ? 'text-white font-semibold' : 'text-gray-300'}`}>
                    {item.name}
                </span>
            </Link>
        );
    };

    return (
        <nav className={`${className}`}>
            <div className="space-y-0.5">
                {filteredNavigation.map(item => renderNavItem(item))}
            </div>
        </nav>
    );
}