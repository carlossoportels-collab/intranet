// resources/js/Pages/Comercial/PresupuestosLegacy/Index.tsx

import { Link, router } from '@inertiajs/react';
import { 
    ArrowLeft, 
    Calendar, 
    User, 
    Eye, 
    Download, 
    FileText,
    Building,
    Phone,
    Mail,
    Loader,
    ExternalLink,
    Tag
} from 'lucide-react';
import React, { useState, useCallback } from 'react';

import { Amount } from '@/components/ui/Amount';
import { Badge } from '@/components/ui/badge';
import Pagination from '@/components/ui/Pagination';
import { useToast } from '@/contexts/ToastContext';
import AppLayout from '@/layouts/app-layout';

interface PresupuestoLegacy {
    id: number;
    nombre: string;
    fecha: string;
    fecha_original: string;
    total: number;
    cliente: string;
    cliente_id: number | null;
    telefono: string | null;
    email: string | null;
    resolucion: string;
    prefijo_id: number | null;
    tiene_pdf: boolean;
    pdf_url: string | null;
}

interface Props {
    presupuestos: {
        data: PresupuestoLegacy[];
        current_page: number;
        last_page: number;
        total: number;
        per_page: number;
    };
}

export default function PresupuestosLegacyIndex({ presupuestos }: Props) {
    const [generandoPDF, setGenerandoPDF] = useState<number | null>(null);
    const toast = useToast();

    const handleVerPdf = useCallback((presupuesto: PresupuestoLegacy, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!presupuesto.tiene_pdf || !presupuesto.pdf_url) {
            toast.error('No hay PDF disponible');
            return;
        }
        
        window.open(presupuesto.pdf_url, '_blank');
    }, [toast]);

    const handleDescargarPdf = useCallback(async (presupuesto: PresupuestoLegacy, e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        
        if (!presupuesto.tiene_pdf || !presupuesto.pdf_url) {
            toast.error('No hay PDF disponible');
            return;
        }
        
        setGenerandoPDF(presupuesto.id);
        
        try {
            window.open(`/presupuestos-legacy/${presupuesto.id}/descargar`, '_blank');
            setTimeout(() => setGenerandoPDF(null), 1000);
        } catch (error) {
            console.error('Error descargando PDF:', error);
            toast.error('Error al descargar el PDF');
            setGenerandoPDF(null);
        }
    }, [toast]);

    const handleIrALead = useCallback((leadId: number | null, e: React.MouseEvent) => {
        if (!leadId) {
            e.preventDefault();
            toast.error('No se pudo identificar el lead');
            return;
        }
        // El Link se encarga de la navegación
    }, [toast]);

    const handlePageChange = useCallback((page: number) => {
        router.visit(`/comercial/presupuestos-legacy?page=${page}`);
        setTimeout(() => {
            document.getElementById('presupuestos-list')?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    }, []);

    if (presupuestos.data.length === 0) {
        return (
            <AppLayout title="Presupuestos Anteriores">
                <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
                    <div className="mb-4 sm:mb-6">
                        <div className="flex items-center gap-2">
                            <button
                                onClick={() => router.visit('/comercial')}
                                className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                            >
                                <ArrowLeft className="h-5 w-5" />
                            </button>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                Presupuestos Anteriores
                            </h1>
                        </div>
                    </div>
                    
                    <div className="p-6 sm:p-8 text-center text-gray-500 bg-white rounded-lg border">
                        <FileText className="h-10 w-10 sm:h-12 sm:w-12 mx-auto mb-3 text-gray-400" />
                        <p className="text-base sm:text-lg font-medium">No hay presupuestos anteriores</p>
                        <p className="text-xs sm:text-sm">No se encontraron presupuestos legacy asociados</p>
                    </div>
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout title="Presupuestos Anteriores">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 py-4 sm:py-6">
                {/* Header */}
                <div className="mb-4 sm:mb-6">
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => router.visit('/comercial')}
                            className="p-1.5 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
                        >
                            <ArrowLeft className="h-5 w-5" />
                        </button>
                        <div>
                            <h1 className="text-xl sm:text-2xl font-bold text-gray-900">
                                Presupuestos Anteriores
                            </h1>
                            <p className="text-sm text-gray-500 mt-1">
                                Historial de presupuestos del sistema anterior
                            </p>
                        </div>
                    </div>
                </div>

                {/* Listado */}
                <div id="presupuestos-list" className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                    {/* Cabecera informativa */}
                    <div className="p-3 sm:p-4 bg-gray-50 border-b border-gray-200">
                        <div className="flex items-center gap-2 text-xs sm:text-sm">
                            <span className="font-medium text-gray-700">Total:</span>
                            <span className="bg-amber-100 text-amber-800 px-2 py-1 rounded-md">
                                {presupuestos.total} presupuestos
                            </span>
                        </div>
                    </div>

                    {/* Lista de presupuestos */}
                    <div className="divide-y divide-gray-200">
                        {presupuestos.data.map((presupuesto) => (
                            <div key={presupuesto.id} className="p-4 hover:bg-gray-50 transition-colors">
                                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2 mb-2 flex-wrap">
                                            <FileText className="h-4 w-4 lg:h-5 lg:w-5 text-amber-600 flex-shrink-0" />
                                            <h3 className="text-sm lg:text-base font-medium text-gray-900">
                                                {presupuesto.nombre}
                                            </h3>
                                            <Badge variant="outline" className="bg-amber-50 text-amber-700 border-amber-200">
                                                Legacy
                                            </Badge>
                                            {presupuesto.tiene_pdf && (
                                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200">
                                                    PDF
                                                </span>
                                            )}
                                        </div>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2 lg:gap-3 text-xs lg:text-sm">
                                            {/* Fecha */}
                                            <div className="flex items-center text-gray-600">
                                                <Calendar className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2 text-gray-400 flex-shrink-0" />
                                                <span>{presupuesto.fecha}</span>
                                            </div>
                                            
                                            {/* Cliente con enlace */}
                                            <div className="flex items-center text-gray-600">
                                                <User className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2 text-gray-400 flex-shrink-0" />
                                                {presupuesto.cliente_id ? (
                                                    <Link
                                                        href={`/comercial/leads/${presupuesto.cliente_id}`}
                                                        className="text-local hover:text-local-dark hover:underline flex items-center gap-1"
                                                        onClick={(e) => handleIrALead(presupuesto.cliente_id, e)}
                                                    >
                                                        <span className="truncate">{presupuesto.cliente}</span>
                                                        <ExternalLink className="h-3 w-3 flex-shrink-0" />
                                                    </Link>
                                                ) : (
                                                    <span className="truncate text-gray-400">{presupuesto.cliente}</span>
                                                )}
                                            </div>
                                            
                                            {/* Resolución del prefijo */}
                                            {presupuesto.resolucion && (
                                                <div className="flex items-center text-gray-600">
                                                    <Tag className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2 text-gray-400 flex-shrink-0" />
                                                    <span className="truncate font-mono text-xs">{presupuesto.resolucion}</span>
                                                </div>
                                            )}
                                            
                                            {/* Teléfono */}
                                            {presupuesto.telefono && (
                                                <div className="flex items-center text-gray-600">
                                                    <Phone className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2 text-gray-400 flex-shrink-0" />
                                                    <a 
                                                        href={`tel:${presupuesto.telefono}`}
                                                        className="hover:text-local hover:underline"
                                                    >
                                                        {presupuesto.telefono}
                                                    </a>
                                                </div>
                                            )}
                                            
                                            {/* Email */}
                                            {presupuesto.email && (
                                                <div className="flex items-center text-gray-600">
                                                    <Mail className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2 text-gray-400 flex-shrink-0" />
                                                    <a 
                                                        href={`mailto:${presupuesto.email}`}
                                                        className="hover:text-local hover:underline truncate"
                                                    >
                                                        {presupuesto.email}
                                                    </a>
                                                </div>
                                            )}
                                            
                                            {/* Total */}
                                            {presupuesto.total > 0 && (
                                                <div className="flex items-center text-gray-900 font-medium">
                                                    <span className="mr-1 lg:mr-2">💰</span>
                                                    <Amount value={presupuesto.total} className="text-xs lg:text-sm" />
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    
                                    {/* Botones de acción */}
                                    <div className="flex flex-row gap-2 flex-shrink-0">
                                        {presupuesto.tiene_pdf && presupuesto.pdf_url && (
                                            <>
                                                <button
                                                    onClick={(e) => handleVerPdf(presupuesto, e)}
                                                    className="inline-flex items-center px-2 lg:px-3 py-1.5 lg:py-2 border border-gray-300 shadow-sm text-xs lg:text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 justify-center"
                                                    title="Ver PDF"
                                                >
                                                    <Eye className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                                                    <span className="hidden sm:inline">Ver</span>
                                                </button>
                                                <button
                                                    onClick={(e) => handleDescargarPdf(presupuesto, e)}
                                                    disabled={generandoPDF === presupuesto.id}
                                                    className="inline-flex items-center px-2 lg:px-3 py-1.5 lg:py-2 border border-gray-300 shadow-sm text-xs lg:text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-amber-500 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                                                    title="Descargar PDF"
                                                >
                                                    {generandoPDF === presupuesto.id ? (
                                                        <>
                                                            <Loader className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2 animate-spin" />
                                                            <span className="hidden sm:inline">Descargando...</span>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Download className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                                                            <span className="hidden sm:inline">Descargar</span>
                                                        </>
                                                    )}
                                                </button>
                                            </>
                                        )}
                                        
                                        {/* Botón para ir al lead (si tiene cliente_id) */}
                                        {presupuesto.cliente_id && (
                                            <Link
                                                href={`/comercial/leads/${presupuesto.cliente_id}`}
                                                className="inline-flex items-center px-2 lg:px-3 py-1.5 lg:py-2 border border-gray-300 shadow-sm text-xs lg:text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-local justify-center"
                                                title="Ver lead asociado"
                                            >
                                                <ExternalLink className="h-3 w-3 lg:h-4 lg:w-4 mr-1 lg:mr-2" />
                                                <span className="hidden sm:inline">Ver Lead</span>
                                            </Link>
                                        )}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Paginación */}
                    {presupuestos.last_page > 1 && (
                        <div className="px-3 sm:px-4 py-3 border-t border-gray-200">
                            <Pagination
                                currentPage={presupuestos.current_page}
                                lastPage={presupuestos.last_page}
                                total={presupuestos.total}
                                perPage={presupuestos.per_page}
                                onPageChange={handlePageChange}
                                useLinks={false}
                            />
                        </div>
                    )}
                </div>
            </div>
        </AppLayout>
    );
}