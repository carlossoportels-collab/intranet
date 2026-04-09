// resources/js/Pages/Estadisticas/SeguimientoAds/LeadDetail.tsx

import React from 'react';
import { Head, router, Link } from '@inertiajs/react';
import AppLayout from '@/layouts/app-layout';
import {
    ArrowLeft, User, Phone, Mail, MapPin, Calendar,
    FileText, FileCheck, MessageSquare, AlertCircle,
    CheckCircle, XCircle, UserCircle
} from 'lucide-react';

interface Props {
    lead: {
        id: number;
        nombre: string;
        genero: string;
        telefono: string | null;
        email: string | null;
        localidad: string | null;
        rubro: string | null;
        origen: string | null;
        estado: string;
        estado_color: string;
        prefijo_codigo: string;
        prefijo_descripcion: string;
        comercial_nombre: string;
        es_cliente: boolean;
        es_activo: boolean;
        created: string;
        created_by: string;
    };
    presupuestos: Array<{
        id: number;
        referencia: string;
        total: number;
        estado: string;
        created: string;
        creado_por: string;
    }>;
    contratos: Array<{
        id: number;
        numero: string;
        fecha_emision: string;
        estado: string;
    }>;
    comentarios: Array<{
        id: number;
        contenido: string;
        tipo: string;
        created: string;
        usuario: string;
    }>;
    seguimiento_perdida: {
        motivo: string;
        notas: string;
        posibilidades: string;
        fecha_recontacto: string;
        created: string;
    } | null;
}

export default function LeadDetail({ lead, presupuestos, contratos, comentarios, seguimiento_perdida }: Props) {
    const formatCurrency = (value: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0
        }).format(value);
    };
    
    // Asegurar que los arrays existan (por si vienen undefined)
    const presupuestosList = presupuestos || [];
    const contratosList = contratos || [];
    const comentariosList = comentarios || [];
    
    return (
        <AppLayout>
            <Head title={`Lead: ${lead?.nombre || 'Detalle'}`} />
            
            <div className="py-6">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Botón volver */}
                    <Link
                        href="/estadisticas/seguimiento-ads"
                        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4"
                    >
                        <ArrowLeft size={20} />
                        <span>Volver a Mis Leads</span>
                    </Link>
                    
                    {/* Header del lead */}
                    <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
                        <div className="flex items-start justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center">
                                    <span className="text-white text-2xl font-bold">
                                        {lead?.nombre?.charAt(0) || '?'}
                                    </span>
                                </div>
                                <div>
                                    <h1 className="text-2xl font-bold text-gray-900">{lead?.nombre || 'Sin nombre'}</h1>
                                    <div className="flex items-center gap-2 mt-1">
                                        {lead?.estado && (
                                            <span 
                                                className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium"
                                                style={{ 
                                                    backgroundColor: `${lead.estado_color}20`,
                                                    color: lead.estado_color
                                                }}
                                            >
                                                {lead.estado}
                                            </span>
                                        )}
                                        {lead?.es_cliente && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                                <CheckCircle size={12} /> Cliente
                                            </span>
                                        )}
                                        {!lead?.es_activo && !lead?.es_cliente && (
                                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                                                <XCircle size={12} /> Inactivo
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                            
                            <div className="text-right">
                                <div className="text-sm text-gray-500">Creado el</div>
                                <div className="font-medium text-gray-900">{lead?.created || '-'}</div>
                                <div className="text-xs text-gray-400">por {lead?.created_by || '-'}</div>
                            </div>
                        </div>
                    </div>
                    
                    {/* Información de contacto */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <User size={18} className="text-blue-500" />
                                <h3 className="font-medium text-gray-700">Datos Personales</h3>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Género:</span>
                                    <span className="text-gray-900">{lead?.genero || 'No especificado'}</span>
                                </div>
                                {lead?.localidad && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Localidad:</span>
                                        <span className="text-gray-900">{lead.localidad}</span>
                                    </div>
                                )}
                                {lead?.rubro && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Rubro:</span>
                                        <span className="text-gray-900">{lead.rubro}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <Phone size={18} className="text-green-500" />
                                <h3 className="font-medium text-gray-700">Contacto</h3>
                            </div>
                            <div className="space-y-2 text-sm">
                                {lead?.telefono && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Teléfono:</span>
                                        <a href={`tel:${lead.telefono}`} className="text-blue-600 hover:underline">
                                            {lead.telefono}
                                        </a>
                                    </div>
                                )}
                                {lead?.email && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Email:</span>
                                        <a href={`mailto:${lead.email}`} className="text-blue-600 hover:underline">
                                            {lead.email}
                                        </a>
                                    </div>
                                )}
                                {lead?.origen && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Origen:</span>
                                        <span className="text-gray-900">{lead.origen}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Asignación Comercial */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-4">
                            <div className="flex items-center gap-2 mb-3">
                                <UserCircle size={18} className="text-purple-500" />
                                <h3 className="font-medium text-gray-700">Asignación Comercial</h3>
                            </div>
                            <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Prefijo:</span>
                                    <span className="font-mono font-medium text-gray-900">{lead?.prefijo_codigo || 'Sin asignar'}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-gray-500">Comercial:</span>
                                    <span className="text-gray-900 font-medium">{lead?.comercial_nombre || 'Sin comercial'}</span>
                                </div>
                                {lead?.prefijo_descripcion && (
                                    <div className="flex justify-between">
                                        <span className="text-gray-500">Descripción:</span>
                                        <span className="text-gray-600 text-right">{lead.prefijo_descripcion}</span>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Presupuestos y Contratos */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                        {/* Presupuestos */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                                <FileText size={18} className="text-blue-500" />
                                <h3 className="font-semibold text-gray-900">Presupuestos</h3>
                                <span className="ml-auto text-sm text-gray-500">{presupuestosList.length} registros</span>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {presupuestosList.length > 0 ? (
                                    presupuestosList.map((presupuesto) => (
                                        <div key={presupuesto.id} className="p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <Link 
                                                        href={`/comercial/presupuestos/${presupuesto.id}`}
                                                        className="font-medium text-blue-600 hover:underline"
                                                    >
                                                        {presupuesto.referencia}
                                                    </Link>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Creado: {presupuesto.created} por {presupuesto.creado_por}
                                                    </p>
                                                </div>
                                                <div className="text-right">
                                                    <p className="font-bold text-gray-900">{formatCurrency(presupuesto.total)}</p>
                                                    <span className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600">
                                                        {presupuesto.estado || 'Pendiente'}
                                                    </span>
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-gray-500 text-sm">
                                        No hay presupuestos asociados
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Contratos */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                                <FileCheck size={18} className="text-green-500" />
                                <h3 className="font-semibold text-gray-900">Contratos</h3>
                                <span className="ml-auto text-sm text-gray-500">{contratosList.length} registros</span>
                            </div>
                            <div className="divide-y divide-gray-100">
                                {contratosList.length > 0 ? (
                                    contratosList.map((contrato) => (
                                        <div key={contrato.id} className="p-4">
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <Link 
                                                        href={`/comercial/contratos/${contrato.id}`}
                                                        className="font-medium text-blue-600 hover:underline"
                                                    >
                                                        {contrato.numero}
                                                    </Link>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        Fecha: {contrato.fecha_emision}
                                                    </p>
                                                </div>
                                                <span className="inline-flex px-2 py-0.5 rounded text-xs bg-green-100 text-green-700">
                                                    {contrato.estado || 'Activo'}
                                                </span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-gray-500 text-sm">
                                        No hay contratos asociados
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>
                    
                    {/* Comentarios y Seguimiento */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Comentarios */}
                        <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                            <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                                <MessageSquare size={18} className="text-yellow-500" />
                                <h3 className="font-semibold text-gray-900">Comentarios</h3>
                                <span className="ml-auto text-sm text-gray-500">{comentariosList.length} registros</span>
                            </div>
                            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
                                {comentariosList.length > 0 ? (
                                    comentariosList.map((comentario) => (
                                        <div key={comentario.id} className="p-4">
                                            {comentario.tipo && (
                                                <span className="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-600 mb-2">
                                                    {comentario.tipo}
                                                </span>
                                            )}
                                            <p className="text-sm text-gray-700">{comentario.contenido}</p>
                                            <div className="flex justify-between mt-2">
                                                <span className="text-xs text-gray-400">{comentario.usuario}</span>
                                                <span className="text-xs text-gray-400">{comentario.created}</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="p-4 text-center text-gray-500 text-sm">
                                        No hay comentarios registrados
                                    </div>
                                )}
                            </div>
                        </div>
                        
                        {/* Seguimiento de pérdida */}
                        {seguimiento_perdida && (
                            <div className="bg-white rounded-xl shadow-sm border border-gray-100">
                                <div className="p-4 border-b border-gray-100 flex items-center gap-2">
                                    <AlertCircle size={18} className="text-red-500" />
                                    <h3 className="font-semibold text-gray-900">Seguimiento de Pérdida</h3>
                                </div>
                                <div className="p-4 space-y-3">
                                    <div>
                                        <p className="text-xs text-gray-500 mb-1">Motivo</p>
                                        <p className="text-sm text-gray-900">{seguimiento_perdida.motivo}</p>
                                    </div>
                                    {seguimiento_perdida.notas && (
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Notas adicionales</p>
                                            <p className="text-sm text-gray-700">{seguimiento_perdida.notas}</p>
                                        </div>
                                    )}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <p className="text-xs text-gray-500 mb-1">Posibilidades futuras</p>
                                            <p className="text-sm font-medium text-gray-900">
                                                {seguimiento_perdida.posibilidades === 'si' ? 'Sí' : 
                                                 seguimiento_perdida.posibilidades === 'no' ? 'No' : 'Tal vez'}
                                            </p>
                                        </div>
                                        {seguimiento_perdida.fecha_recontacto && (
                                            <div>
                                                <p className="text-xs text-gray-500 mb-1">Fecha de recontacto</p>
                                                <p className="text-sm font-medium text-gray-900">{seguimiento_perdida.fecha_recontacto}</p>
                                            </div>
                                        )}
                                    </div>
                                    <div className="text-xs text-gray-400 text-right">
                                        Registrado: {seguimiento_perdida.created}
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </AppLayout>
    );
}