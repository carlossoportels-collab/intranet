// resources/js/Pages/Comercial/Contactos.tsx
import { Head, router } from '@inertiajs/react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { Eye, MessageSquare, FileText, Briefcase, FileSignature } from 'lucide-react'; // ← Agregar FileSignature
import React, { useState, useCallback } from 'react';

import ClienteComentarioModal from '@/components/Modals/ClienteComentarioModal';
import { Pagination, EmptyState } from '@/components/ui';
import AppLayout from '@/layouts/app-layout';
import { TipoComentario } from '@/types/leads';
interface Lead {
    id: number;
    nombre_completo: string;
    email?: string;
    telefono?: string;
}


interface Empresa {
    id: number;
    nombre_fantasia: string;
    razon_social: string;
    cuit: string;
}

interface Contacto {
    id: number;
    empresa_id: number;
    lead_id: number;
    es_contacto_principal: boolean;
    es_activo: boolean;
    created: string;
    lead?: Lead;
    empresa?: Empresa;
}

interface Props {
    contactos: {
        data: Contacto[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
    };
    estadisticas: {
        total: number;
        principales: number;
    };
    filters?: {
        search?: string;
    };
    usuario: {
        ve_todas_cuentas: boolean;
        rol_id: number;
        personal_id: number;
        nombre_completo?: string;
    };
    comentariosPorLead?: Record<number, number>;
    presupuestosPorLead?: Record<number, number>;
    contratosPorLead?: Record<number, number>; // ← NUEVO
}

export default function Contactos({ 
    contactos, 
    estadisticas, 
    filters = {},
    usuario,
    comentariosPorLead = {},
    presupuestosPorLead = {},
    contratosPorLead = {} // ← NUEVO
}: Props) {
    const [search, setSearch] = useState(filters.search || '');
    const [showMobileFilters, setShowMobileFilters] = useState(false);
    const [showComentarioModal, setShowComentarioModal] = useState(false);
    const [selectedContact, setSelectedContact] = useState<Contacto | null>(null);
    const [tiposComentario, setTiposComentario] = useState<TipoComentario[]>([]);
    const [comentariosExistentes, setComentariosExistentes] = useState(0);
    
    const { data: contactosData, current_page, last_page, total, per_page } = contactos;
    
    const handleSearch = (e: React.FormEvent) => {
        e.preventDefault();
        router.get('/comercial/contactos', { search }, {
            preserveState: true,
            replace: true,
        });
    };

    const clearSearch = () => {
        setSearch('');
        router.get('/comercial/contactos', {}, {
            preserveState: true,
            replace: true,
        });
    };
    
    const handlePageChange = useCallback((page: number) => {
        const params = new URLSearchParams();
        if (search) params.append('search', search);
        params.append('page', page.toString());
        
        router.get(`/comercial/contactos?${params.toString()}`);
    }, [search]);
    
    const handleOpenComentario = useCallback(async (contact: Contacto) => {
        try {
            setSelectedContact(contact);
            
            const response = await fetch('/comercial/tipos-comentario/cliente');
            
            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            const tipos = await response.json();
            setTiposComentario(Array.isArray(tipos) ? tipos : []);
            setComentariosExistentes(comentariosPorLead[contact.lead_id] || 0);
            setShowComentarioModal(true);
        } catch (error) {
            console.error('Error cargando tipos de comentario:', error);
        }
    }, [comentariosPorLead]);
    
    const handleCloseModals = useCallback(() => {
        setShowComentarioModal(false);
        setSelectedContact(null);
        setTiposComentario([]);
        setComentariosExistentes(0);
    }, []);
    
    const contarComentariosDeLead = useCallback((leadId: number): number => {
        return comentariosPorLead[leadId] || 0;
    }, [comentariosPorLead]);
    
    const contarPresupuestosDeLead = useCallback((leadId: number): number => {
        return presupuestosPorLead[leadId] || 0;
    }, [presupuestosPorLead]);
    
    const contarContratosDeLead = useCallback((leadId: number): number => { // ← NUEVO
        return contratosPorLead[leadId] || 0;
    }, [contratosPorLead]);

    const formatDate = (dateString: string | null) => {
        if (!dateString) return 'N/A';
        try {
            return format(new Date(dateString), 'dd/MM/yyyy', { locale: es });
        } catch {
            return 'Fecha inválida';
        }
    };

    return (
        <AppLayout title="Contactos">
            <Head title="Contactos" />
            
            <div className="mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">
                            Clientes
                        </h1>
                        <p className="mt-1 text-gray-600 text-base">
                            Gestión de clientes
                        </p>
                    </div>
                    
                    <div className="flex flex-wrap gap-2">
                        <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            usuario.ve_todas_cuentas 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-blue-100 text-blue-800'
                        }`}>
                            {usuario.ve_todas_cuentas ? '🔓 Ve todos los contactos' : '🔒 Contactos limitados'}
                        </span>
                        <button
                            type="button"
                            onClick={() => setShowMobileFilters(!showMobileFilters)}
                            className="md:hidden inline-flex items-center px-3 py-1 border border-gray-300 rounded text-sm text-gray-700 hover:bg-gray-50"
                        >
                            {showMobileFilters ? 'Ocultar búsqueda' : 'Mostrar búsqueda'}
                        </button>
                    </div>
                </div>
            </div>
            
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-4 md:p-6 mb-6">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                    <h2 className="text-lg font-semibold text-gray-900">
                        Listado de Contactos
                    </h2>
                    
                    <div className="flex gap-3">
                        <div className="px-3 py-1 bg-blue-50 rounded-lg border border-blue-200">
                            <span className="text-xs text-gray-600">Totales</span>
                            <p className="text-lg font-bold text-blue-600">{estadisticas.total}</p>
                        </div>
                        <div className="px-3 py-1 bg-purple-50 rounded-lg border border-purple-200">
                            <span className="text-xs text-gray-600">Principales</span>
                            <p className="text-lg font-bold text-purple-600">{estadisticas.principales}</p>
                        </div>
                    </div>
                </div>
                
                <div className={`${showMobileFilters ? 'block' : 'hidden md:block'} mb-6`}>
                    <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-2">
                        <input
                            type="text"
                            placeholder="Buscar por nombre, email, teléfono o empresa..."
                            className="flex-grow px-4 py-2 border-2 border-gray-200 rounded-lg focus:border-local focus:ring-2 focus:ring-local/20 text-sm bg-white transition-all"
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-local text-white text-sm font-medium rounded-lg hover:bg-local-600 transition-colors flex-1 sm:flex-none"
                            >
                                Buscar
                            </button>
                            {search && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="px-4 py-2 bg-gray-200 text-gray-700 text-sm font-medium rounded-lg hover:bg-gray-300 transition-colors flex-1 sm:flex-none"
                                >
                                    Limpiar
                                </button>
                            )}
                        </div>
                    </form>
                </div>
                
                {contactosData.length === 0 ? (
                    <EmptyState 
                        hasFilters={!!search}
                        onClearFilters={clearSearch}
                        message="No hay contactos disponibles"
                        suggestion="Los leads que se convierten en clientes aparecerán aquí"
                    />
                ) : (
                    <>
                        {/* Versión móvil */}
                        <div className="md:hidden space-y-4">
                            {contactosData.map((contacto) => (
                                <div key={contacto.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                                    <div className="flex items-start gap-3 mb-3">
                                        <div className="flex-1">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h3 className="font-semibold text-gray-900">
                                                        {contacto.lead?.nombre_completo || 'Sin nombre'}
                                                    </h3>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        {contacto.lead?.email || 'Sin email'} • {contacto.lead?.telefono || 'Sin teléfono'}
                                                    </p>
                                                </div>
                                                <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                                    contacto.es_contacto_principal 
                                                        ? 'bg-purple-100 text-purple-800' 
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {contacto.es_contacto_principal ? 'Principal' : 'Secundario'}
                                                </span>
                                            </div>
                                            
                                            {contacto.empresa && (
                                                <div className="mt-2 p-2 bg-gray-50 rounded">
                                                    <p className="text-xs font-medium text-gray-700">Empresa:</p>
                                                    <p className="text-sm text-gray-900">{contacto.empresa.nombre_fantasia || 'Sin nombre'}</p>
                                                    <p className="text-xs text-gray-500 truncate">{contacto.empresa.razon_social}</p>
                                                </div>
                                            )}
                                            
                                            <div className="flex items-center gap-3 mt-3">
                                                <div className="flex items-center gap-1 text-xs bg-blue-50 px-2 py-1 rounded-full">
                                                    <FileText className="h-3 w-3 text-blue-600" />
                                                    <span className="font-medium text-blue-700">
                                                        {contarPresupuestosDeLead(contacto.lead_id)} presupuestos
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs bg-green-50 px-2 py-1 rounded-full">
                                                    <MessageSquare className="h-3 w-3 text-green-600" />
                                                    <span className="font-medium text-green-700">
                                                        {contarComentariosDeLead(contacto.lead_id)} comentarios
                                                    </span>
                                                </div>
                                                <div className="flex items-center gap-1 text-xs bg-amber-50 px-2 py-1 rounded-full">
                                                    <FileSignature className="h-3 w-3 text-amber-600" /> {/* ← Cambiado a FileSignature */}
                                                    <span className="font-medium text-amber-700">
                                                        {contarContratosDeLead(contacto.lead_id)} contratos
                                                    </span>
                                                </div>
                                            </div>
                                            
                                            <div className="mt-2 text-xs text-gray-500">
                                                Registro: {formatDate(contacto.created)}
                                            </div>
                                            
                                            <div className="flex flex-wrap gap-3 mt-3 pt-2 border-t border-gray-100">
                                                <button
                                                    onClick={() => router.get(`/comercial/leads/${contacto.lead_id}`)}
                                                    className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                                                >
                                                    <Eye className="h-4 w-4 mr-1" />
                                                    Detalles
                                                </button>
                                                <button
                                                    onClick={() => handleOpenComentario(contacto)}
                                                    className="inline-flex items-center text-green-600 hover:text-green-800 text-sm px-2 py-1 hover:bg-green-50 rounded transition-colors"
                                                >
                                                    <MessageSquare className="h-4 w-4 mr-1" />
                                                    Seguimiento
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        
                        {/* Versión desktop */}
                        <div className="hidden md:block overflow-x-auto">
                            <table className="min-w-full divide-y divide-gray-200">
                                <thead className="bg-gray-50">
                                    <tr>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Contacto
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Empresa
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Tipo
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Presupuestos
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Comentarios
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Contratos {/* ← Cambiado de "Contratos" a "Contratos" pero con ícono diferente */}
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Registro
                                        </th>
                                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                            Acciones
                                        </th>
                                    </tr>
                                </thead>
                                <tbody className="bg-white divide-y divide-gray-200">
                                    {contactosData.map((contacto) => (
                                        <tr key={contacto.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3">
                                                <div>
                                                    <p className="font-medium text-gray-900">
                                                        {contacto.lead?.nombre_completo || 'Sin nombre'}
                                                    </p>
                                                    <p className="text-xs text-gray-500">
                                                        {contacto.lead?.email || 'Sin email'} • {contacto.lead?.telefono || 'Sin teléfono'}
                                                    </p>
                                                </div>
                                            </td>
                                            <td className="px-4 py-3">
                                                {contacto.empresa ? (
                                                    <div>
                                                        <p className="font-medium text-gray-900">
                                                            {contacto.empresa.nombre_fantasia || 'Sin nombre'}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {contacto.empresa.razon_social || 'Sin razón social'}
                                                        </p>
                                                    </div>
                                                ) : (
                                                    <span className="text-sm text-gray-400">Sin empresa</span>
                                                )}
                                            </td>
                                            <td className="px-4 py-3">
                                                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                                                    contacto.es_contacto_principal 
                                                        ? 'bg-purple-100 text-purple-800' 
                                                        : 'bg-gray-100 text-gray-800'
                                                }`}>
                                                    {contacto.es_contacto_principal ? 'Principal' : 'Secundario'}
                                                </span>
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {contarPresupuestosDeLead(contacto.lead_id)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {contarComentariosDeLead(contacto.lead_id)}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-700">
                                                {contarContratosDeLead(contacto.lead_id)} {/* ← NUEVO */}
                                            </td>
                                            <td className="px-4 py-3 text-sm text-gray-500">
                                                {formatDate(contacto.created)}
                                            </td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center space-x-3">
                                                    <button
                                                        onClick={() => router.get(`/comercial/leads/${contacto.lead_id}`)}
                                                        className="inline-flex items-center text-blue-600 hover:text-blue-800 text-sm px-2 py-1 hover:bg-blue-50 rounded transition-colors"
                                                    >
                                                        <Eye className="h-4 w-4 mr-1" />
                                                        Detalles
                                                    </button>
                                                    
                                                    <button
                                                        onClick={() => handleOpenComentario(contacto)}
                                                        className="inline-flex items-center text-green-600 hover:text-green-800 text-sm px-2 py-1 hover:bg-green-50 rounded transition-colors"
                                                    >
                                                        <MessageSquare className="h-4 w-4 mr-1" />
                                                        Seguimiento
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        
                        <Pagination
                            currentPage={current_page}
                            lastPage={last_page}
                            total={total}
                            perPage={per_page}
                            baseUrl="/comercial/contactos"
                            only={['contactos', 'comentariosPorLead', 'presupuestosPorLead', 'contratosPorLead']} // ← Agregado contratosPorLead
                        />
                    </>
                )}
            </div>

            <ClienteComentarioModal
                isOpen={showComentarioModal}
                onClose={handleCloseModals}
                lead={selectedContact?.lead ? { 
                    id: selectedContact.lead_id,
                    nombre_completo: selectedContact.lead.nombre_completo,
                    email: selectedContact.lead.email,
                    telefono: selectedContact.lead.telefono
                } : null}
                tiposComentario={tiposComentario}
                comentariosExistentes={comentariosExistentes}
                onSuccess={() => {
                    router.reload({ only: ['contactos', 'comentariosPorLead', 'contratosPorLead'] }); // ← Agregado contratosPorLead
                }}
            />
        </AppLayout>
    );
}