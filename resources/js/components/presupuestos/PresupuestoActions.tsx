// resources/js/components/presupuestos/PresupuestoActions.tsx

import { Link, router } from '@inertiajs/react';
import { Edit, Download, MessageCircle, Mail, Eye, Loader, Building, FileSignature, ChevronDown } from 'lucide-react';
import React, { useState, useCallback } from 'react';

import { useToast } from '@/contexts/ToastContext';
import EnviarPresupuestoEmailModal from '@/components/Modals/Emails/EnviarPresupuestoEmailModal';
import AltaEmpresaModal from '@/components/empresa/AltaEmpresaModal';
import { sendWhatsApp, sendWhatsAppWithFile } from '@/utils/whatsapp.utils';
import type { Lead, Origen, Rubro, Provincia } from '@/types/leads';

interface Props {
    presupuestoId: number;
    referencia: string;
    tieneTelefono: boolean;
    mensajeWhatsApp: string | null;
    telefono?: string;
    leadNombre: string;
    leadEmail: string;
    comercialEmail: string;
    comercialNombre: string;
    companiaId: number;
    companiaNombre: string;
    leadId?: number;
    leadEsCliente?: boolean;
    lead?: Lead | null;
    origenes?: Origen[];
    rubros?: Rubro[];
    provincias?: Provincia[];
}

interface PdfData {
    success: boolean;
    url?: string;
    filename?: string;
    error?: string;
}

export const PresupuestoActions: React.FC<Props> = ({ 
    presupuestoId, 
    referencia, 
    tieneTelefono, 
    mensajeWhatsApp,
    telefono,
    leadNombre,
    leadEmail,
    comercialEmail,
    comercialNombre,
    companiaId,
    companiaNombre,
    leadId,
    leadEsCliente = false,
    lead = null,
    origenes = [],
    rubros = [],
    provincias = []
}) => {
    const [generandoPDF, setGenerandoPDF] = useState(false);
    const [showEmailModal, setShowEmailModal] = useState(false);
    const [pdfUrl, setPdfUrl] = useState<string | null>(null);
    const [showWhatsAppMenu, setShowWhatsAppMenu] = useState(false);
    const [showAccionesMenu, setShowAccionesMenu] = useState(false);
    
    const [modalAltaEmpresaOpen, setModalAltaEmpresaOpen] = useState(false);
    const [verificandoDatos, setVerificandoDatos] = useState(false);
    const [modoCompletar, setModoCompletar] = useState(false);
    const [datosExistentes, setDatosExistentes] = useState<{ empresa?: any; contacto?: any } | undefined>(undefined);
    const [pasoInicial, setPasoInicial] = useState<number>(1); // 🔥 NUEVO: guardar el paso inicial
    
    const toast = useToast();

    const generarPDFTemporal = async (): Promise<string | null> => {
        return new Promise((resolve) => {
            router.post(`/comercial/presupuestos/${presupuestoId}/generar-pdf-temp`, {}, {
                preserveState: true,
                preserveScroll: true,
                onSuccess: (page: any) => {
                    const flash = page.props.flash as any;
                    const data = flash?.pdfData || page.props?.pdfData as PdfData;
                    
                    if (data?.success && data.url) {
                        resolve(data.url);
                    } else {
                        toast.error(data?.error || 'Error al generar PDF');
                        resolve(null);
                    }
                },
                onError: () => {
                    toast.error('Error al generar el PDF');
                    resolve(null);
                }
            });
        });
    };

    const generarPDFBlob = async (): Promise<Blob | null> => {
        try {
            const response = await fetch(`/comercial/presupuestos/${presupuestoId}/pdf?download=1`, {
                method: 'GET',
                headers: {
                    'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                    'Accept': 'application/pdf'
                }
            });
            
            if (!response.ok) {
                throw new Error(`Error al generar PDF: ${response.status}`);
            }
            
            return await response.blob();
        } catch {
            return null;
        }
    };

const handleDescargarPDF = async () => {
    setGenerandoPDF(true);
    toast.info('Generando PDF...');
    
    try {
        const response = await fetch(`/comercial/presupuestos/${presupuestoId}/pdf?download=1`, {
            method: 'GET',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                'Accept': 'application/pdf'
            }
        });
        
        if (!response.ok) throw new Error();
        
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        
        // 🔥 OBTENER EL NOMBRE DEL ARCHIVO DEL HEADER Content-Disposition
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `Presupuesto_${referencia}.pdf`;
        
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1].replace(/['"]/g, '');
            }
        }
        
        link.download = filename;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(url);
        
        toast.success('PDF descargado correctamente');
    } catch {
        toast.error('Error al generar el PDF');
    } finally {
        setGenerandoPDF(false);
    }
};

    const handleVerPDF = () => {
        window.open(`/comercial/presupuestos/${presupuestoId}/pdf`, '_blank');
    };

    const handleWhatsApp = () => {
        if (!telefono || !mensajeWhatsApp) return;
        setShowWhatsAppMenu(false);
        try {
            sendWhatsApp(telefono, mensajeWhatsApp);
            toast.success('Abriendo WhatsApp...');
        } catch {
            toast.error('No se pudo abrir WhatsApp');
        }
    };

const handleWhatsAppConPDF = async () => {
    if (!telefono || !mensajeWhatsApp) return;

    setShowWhatsAppMenu(false);
    setGenerandoPDF(true);
    toast.info('Preparando PDF...');
    
    try {
        const response = await fetch(`/comercial/presupuestos/${presupuestoId}/pdf?download=1`, {
            method: 'GET',
            headers: {
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') || '',
                'Accept': 'application/pdf'
            }
        });
        
        if (!response.ok) throw new Error();
        
        const pdfBlob = await response.blob();
        
        // 🔥 OBTENER EL NOMBRE DEL ARCHIVO DEL HEADER
        const contentDisposition = response.headers.get('Content-Disposition');
        let filename = `Presupuesto_${referencia}.pdf`;
        
        if (contentDisposition) {
            const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
            if (filenameMatch && filenameMatch[1]) {
                filename = filenameMatch[1].replace(/['"]/g, '');
            }
        }
        
        const result = await sendWhatsAppWithFile(telefono, mensajeWhatsApp, pdfBlob, filename);
        
        if (result.success) {
            toast.success('PDF preparado y WhatsApp abierto');
        } else {
            toast.error(result.error || 'Error al procesar la solicitud');
        }
    } catch {
        toast.error('Error al procesar la solicitud');
    } finally {
        setGenerandoPDF(false);
    }
};

    const handleOpenEmailModal = async () => {
        setGenerandoPDF(true);
        toast.info('Preparando PDF para email...');
        
        try {
            const url = await generarPDFTemporal();
            if (url) {
                setPdfUrl(url);
                setShowEmailModal(true);
            }
        } catch {
            toast.error('Error al preparar el PDF');
        } finally {
            setGenerandoPDF(false);
        }
    };

    const verificarYabrirModal = useCallback(async () => {
    if (!leadId) {
        toast.error('No se pudo identificar el lead');
        return;
    }

    setVerificandoDatos(true);
    
    try {
        const response = await fetch(`/comercial/leads/${leadId}/verificar-datos-contrato`);
        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(data.error || 'Error al verificar datos');
        }
        
        // 🔥 CONSTRUIR LEAD ACTUALIZADO CON LOS DATOS DEL BACKEND
        const leadActualizado = data.lead ? {
            ...lead,
            id: data.lead.id,
            nombre_completo: data.lead.nombre_completo,
            genero: data.lead.genero,
            telefono: data.lead.telefono,
            email: data.lead.email,
            localidad_id: data.lead.localidad_id,
            localidad: data.lead.localidad_nombre ? {
                nombre: data.lead.localidad_nombre,
                provincia_id: data.lead.provincia_id,
                provincia: data.lead.provincia_nombre ? { nombre: data.lead.provincia_nombre } : null
            } : null,
            rubro_id: data.lead.rubro_id,
            origen_id: data.lead.origen_id,
            prefijo_id: data.lead.prefijo_id,
        } : lead;
        
        setDatosExistentes({
            empresa: data.empresa || undefined,
            contacto: data.contacto || undefined
        });
        
        const paso = data.pasoAMostrar || 1;
        setPasoInicial(paso);
        
        const tieneAlgunDato = !!data.contacto || !!data.empresa;
        
        if (data.todosCompletos) {
            toast.success('Todos los datos están completos. Generando contrato...');
            setTimeout(() => {
                window.location.href = `/comercial/contratos/create-from-lead/${presupuestoId}`;
            }, 500);
        } else {
            setModoCompletar(tieneAlgunDato);
            setModalAltaEmpresaOpen(true);
            
            const nombresPasos = { 1: 'Datos del Lead', 2: 'Datos Personales', 3: 'Datos de Empresa' };
            toast.info(`Complete los datos faltantes en "${nombresPasos[paso as 1 | 2 | 3]}"`);
        }
    } catch (error) {
        console.error('Error verificando datos:', error);
        toast.error('Error al verificar datos del cliente');
    } finally {
        setVerificandoDatos(false);
    }
}, [leadId, presupuestoId, toast, lead]);

    const handleAccionPrincipal = useCallback(async () => {
        await verificarYabrirModal();
    }, [verificarYabrirModal]);

    const handleModalClose = useCallback((empresaGuardada?: boolean, irAContrato?: boolean) => {
        setModalAltaEmpresaOpen(false);
        setModoCompletar(false);
        setDatosExistentes(undefined);
        
        if (empresaGuardada) {
            toast.success('Datos guardados correctamente');
            router.reload({ only: ['presupuesto', 'lead'] });
        } else if (irAContrato && presupuestoId) {
            router.visit(`/comercial/contratos/create-from-lead/${presupuestoId}`);
        }
    }, [presupuestoId, toast]);

    const estaCargandoAccion = verificandoDatos;

    React.useEffect(() => {
        const handleClickOutside = () => {
            setShowWhatsAppMenu(false);
            setShowAccionesMenu(false);
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, []);

    return (
        <>
            <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1">
                    <Link
                        href={`/comercial/presupuestos/${presupuestoId}/edit`}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-l-lg hover:bg-blue-700 text-sm transition-colors"
                    >
                        <Edit className="h-4 w-4" />
                        <span className="hidden sm:inline">Editar</span>
                    </Link>
                    
                    {leadId && (
                        <button
                            onClick={handleAccionPrincipal}
                            disabled={estaCargandoAccion}
                            className={`flex items-center gap-2 px-3 py-2 text-sm rounded-r-lg transition-colors disabled:opacity-50 -ml-px bg-blue-600 text-white hover:bg-blue-700`}
                        >
                            {estaCargandoAccion ? (
                                <>
                                    <Loader className="h-4 w-4 animate-spin" />
                                    <span>Verificando...</span>
                                </>
                            ) : (
                                <>
                                    <FileSignature className="h-4 w-4" />
                                    <span className="hidden sm:inline">Generar Contrato</span>
                                </>
                            )}
                        </button>
                    )}
                </div>

                {tieneTelefono && mensajeWhatsApp && telefono && (
                    <div className="relative">
                        <button
                            onClick={(e) => {
                                e.stopPropagation();
                                setShowWhatsAppMenu(!showWhatsAppMenu);
                                setShowAccionesMenu(false);
                            }}
                            className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm transition-colors"
                        >
                            <MessageCircle className="h-4 w-4" />
                            <span className="hidden sm:inline">WhatsApp</span>
                            <ChevronDown className="h-3 w-3" />
                        </button>
                        
                        {showWhatsAppMenu && (
                            <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 overflow-hidden">
                                <button
                                    onClick={handleWhatsApp}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                                >
                                    <MessageCircle className="h-4 w-4 text-green-600" />
                                    Solo mensaje
                                </button>
                                <button
                                    onClick={handleWhatsAppConPDF}
                                    disabled={generandoPDF}
                                    className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {generandoPDF ? (
                                        <Loader className="h-4 w-4 animate-spin" />
                                    ) : (
                                        <MessageCircle className="h-4 w-4 text-green-600" />
                                    )}
                                    Con PDF adjunto
                                </button>
                            </div>
                        )}
                    </div>
                )}

                <div className="relative">
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            setShowAccionesMenu(!showAccionesMenu);
                            setShowWhatsAppMenu(false);
                        }}
                        className="flex items-center gap-2 px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm transition-colors"
                    >
                        <Mail className="h-4 w-4" />
                        <span className="hidden sm:inline">Enviar</span>
                        <ChevronDown className="h-3 w-3" />
                    </button>
                    
                    {showAccionesMenu && (
                        <div className="absolute right-0 mt-1 w-48 bg-white rounded-lg shadow-lg border border-gray-200 z-10 overflow-hidden">
                            <button
                                onClick={handleOpenEmailModal}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                                <Mail className="h-4 w-4 text-blue-600" />
                                Enviar por email
                            </button>
                            <button
                                onClick={handleVerPDF}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                            >
                                <Eye className="h-4 w-4 text-orange-600" />
                                Ver PDF
                            </button>
                            <button
                                onClick={handleDescargarPDF}
                                disabled={generandoPDF}
                                className="w-full px-4 py-2 text-left text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2 disabled:opacity-50"
                            >
                                {generandoPDF ? (
                                    <Loader className="h-4 w-4 animate-spin" />
                                ) : (
                                    <Download className="h-4 w-4 text-purple-600" />
                                )}
                                Descargar PDF
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {pdfUrl && (
                <EnviarPresupuestoEmailModal
                    isOpen={showEmailModal}
                    onClose={() => {
                        setShowEmailModal(false);
                        setPdfUrl(null);
                    }}
                    presupuestoId={presupuestoId}
                    referencia={referencia}
                    leadNombre={leadNombre}
                    leadEmail={leadEmail}
                    comercialEmail={comercialEmail}
                    comercialNombre={comercialNombre}
                    mensajeWhatsApp={mensajeWhatsApp}
                    companiaId={companiaId}
                    companiaNombre={companiaNombre}
                    pdfUrl={pdfUrl}
                />
            )}

            <AltaEmpresaModal
                isOpen={modalAltaEmpresaOpen}
                onClose={handleModalClose}
                presupuestoId={presupuestoId}
                lead={lead}
                origenes={origenes}
                rubros={rubros}
                provincias={provincias}
                modoCompletar={modoCompletar}
                datosExistentes={datosExistentes}
                pasoInicial={pasoInicial} 
            />
        </>
    );
};