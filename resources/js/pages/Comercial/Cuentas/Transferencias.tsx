import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';
import AppLayout from '@/layouts/app-layout';
import { useToast } from '@/contexts/ToastContext';
import { 
    Search, Loader, ArrowRight, Shield, 
    RefreshCcw, Building, User, Info, CheckCircle2, History, FileText, Edit3, X,
    ChevronLeft, ChevronRight, Check, ClipboardList, AlertCircle
} from 'lucide-react';

import Paso3DatosEmpresa from '@/components/empresa/pasos/Paso3DatosEmpresa';
import Paso2DatosContacto from '@/components/empresa/pasos/Paso2DatosContacto';
import Paso1DatosLead from '@/components/empresa/pasos/Paso1DatosLead';

export default function Transferencias({ 
    auth, prefijos_disponibles = [], historial = [], vista_inicial, is_comercial_ss, is_admin,
    origenes = [], rubros = [], provincias = [], tiposDocumento = [], nacionalidades = [], 
    tiposResponsabilidad = [], categoriasFiscales = [], plataformas = [] 
}: any) {
    const { success, error } = useToast();
    const [opcionPrincipal, setOpcionPrincipal] = useState(vista_inicial);
    const [modoTransferencia, setModoTransferencia] = useState<'lead' | 'cliente'>('lead');
    const [busqueda, setBusqueda] = useState('');
    const [cargando, setCargando] = useState(false);
    const [resultados, setResultados] = useState<any[]>([]);
    const [seleccionado, setSeleccionado] = useState<any>(null);
    const [nuevoPrefijoId, setNuevoPrefijoId] = useState('');

    const [showChequeoModal, setShowChequeoModal] = useState(false);
    const [pasoValidacion, setPasoValidacion] = useState(1);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [erroresValidacion, setErroresValidacion] = useState<Record<string, string>>({});

    // Estados para los formularios
    const [idEmpresaActual, setIdEmpresaActual] = useState<number | null>(null);
    const [formDataEmpresa, setFormDataEmpresa] = useState<any>({});
    const [formDataLead, setFormDataLead] = useState<any>({});
    const [formDataContacto, setFormDataContacto] = useState<any>({});
    const [localidadFiscalNombre, setLocalidadFiscalNombre] = useState('');
    const [localidadFiscalProvinciaId, setLocalidadFiscalProvinciaId] = useState('');

    const abrirChequeo = async (id: number) => {
        setCargando(true);
        setErroresValidacion({});
        try {
            const resp = await axios.get(`/comercial/cuentas/cambio-razon-social/empresa/${id}/completa`);
            const data = resp.data;
            
            setIdEmpresaActual(data.id);
            
            setFormDataEmpresa({
                ...data,
                localidad_fiscal_id: data.localidad_fiscal_id?.toString() || '',
                rubro_id: data.rubro_id?.toString() || '',
                cat_fiscal_id: data.cat_fiscal_id?.toString() || '',
                plataforma_id: data.plataforma_id?.toString() || '',
            });
            setLocalidadFiscalNombre(data.localidad_fiscal_nombre || '');
            setLocalidadFiscalProvinciaId(data.localidad_fiscal_provincia_id?.toString() || '');

            const principal = data.contactos?.find((c: any) => c.es_contacto_principal);
            if (principal) {
                setFormDataContacto({
                    ...principal,
                    tipo_responsabilidad_id: principal.tipo_responsabilidad_id?.toString() || '',
                    tipo_documento_id: principal.tipo_documento_id?.toString() || '',
                    nacionalidad_id: principal.nacionalidad_id?.toString() || '',
                });

                if (principal.lead) {
                    setFormDataLead({
                        ...principal.lead,
                        localidad_id: principal.lead.localidad_id?.toString() || '',
                        rubro_id: principal.lead.rubro_id?.toString() || '',
                        origen_id: principal.lead.origen_id?.toString() || '',
                    });
                }
            }

            setShowChequeoModal(true);
            setPasoValidacion(1);
        } catch (err) { 
            error('Error al cargar datos'); 
        } finally {
            setCargando(false);
        }
    };

    // Handlers para cambios en los formularios (limpian errores)
    const handleChangeLead = (field: string, value: any) => {
        setFormDataLead((prev: any) => ({ ...prev, [field]: value }));
        if (erroresValidacion[field]) {
            setErroresValidacion((prev: any) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleChangeContacto = (field: string, value: any) => {
        setFormDataContacto((prev: any) => ({ ...prev, [field]: value }));
        if (erroresValidacion[field]) {
            setErroresValidacion((prev: any) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleChangeEmpresa = (field: string, value: any) => {
        setFormDataEmpresa((prev: any) => ({ ...prev, [field]: value }));
        if (erroresValidacion[field]) {
            setErroresValidacion((prev: any) => {
                const newErrors = { ...prev };
                delete newErrors[field];
                return newErrors;
            });
        }
    };

    const handleSiguiente = async () => {
        setIsSubmitting(true);
        setErroresValidacion({});
        
        try {
            if (pasoValidacion === 1) {
                await axios.put(`/comercial/utils/empresa/paso1/${formDataLead.id}`, formDataLead, {
                    headers: { 'Accept-Language': 'es' }
                });
                success('Lead actualizado');
                setPasoValidacion(prev => prev + 1);
            } else if (pasoValidacion === 2) {
                await axios.put(`/comercial/utils/empresa/paso2/${formDataContacto.id}`, {
                    ...formDataContacto,
                    lead_id: formDataLead.id
                }, {
                    headers: { 'Accept-Language': 'es' }
                });
                success('Contacto actualizado');
                setPasoValidacion(prev => prev + 1);
            }
        } catch (err: any) {
            const responseData = err.response?.data;
            
            if (responseData?.errors) {
                setErroresValidacion(responseData.errors);
                const primerError = Object.values(responseData.errors)[0];
                error(Array.isArray(primerError) ? primerError[0] : primerError);
            } else if (responseData?.error) {
                error(responseData.error);
            } else {
                error('Error al guardar los datos');
            }
        } finally { 
            setIsSubmitting(false); 
        }
    };

    const handleFinalizar = async () => {
        setIsSubmitting(true);
        setErroresValidacion({});
        
        try {
            await axios.put(`/comercial/utils/empresa/paso3/${idEmpresaActual}`, {
                ...formDataEmpresa,
                lead_id: formDataLead.id
            }, {
                headers: { 'Accept-Language': 'es' }
            });
            success('Empresa validada correctamente');
            setShowChequeoModal(false);
        } catch (err: any) {
            const responseData = err.response?.data;
            
            if (responseData?.errors) {
                setErroresValidacion(responseData.errors);
                const primerError = Object.values(responseData.errors)[0];
                error(Array.isArray(primerError) ? primerError[0] : primerError);
            } else if (responseData?.error) {
                error(responseData.error);
            } else {
                error('Error al actualizar la empresa');
            }
        } finally { 
            setIsSubmitting(false); 
        }
    };

    const handleSearch = async (val: string) => {
        setBusqueda(val);
        if (val.length < 3) { setResultados([]); return; }
        setCargando(true);
        try {
            const resp = await axios.get('/api/transferencias/buscar', { params: { q: val, modo: modoTransferencia } });
            setResultados(resp.data);
        } catch (err) { error('Error en búsqueda'); } finally { setCargando(false); }
    };

    const ejecutarPase = () => {
        if (!nuevoPrefijoId) return error('Seleccione destino');
        router.post('/comercial/cuentas/transferencias/ejecutar', {
            id: seleccionado.id, modo: modoTransferencia, nuevo_prefijo_id: nuevoPrefijoId
        }, { onSuccess: () => { success('Pase realizado'); setSeleccionado(null); } });
    };

    const historialSmartSat = useMemo(() => historial.filter((h: any) => h.prefijo_destino_id === 9 || h.prefijo_destino === 'SS'), [historial]);

    return (
        <AppLayout>
            <Head title="Transferencias" />
            <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
                {/* Selector de Navegación */}
                <div className="flex bg-slate-100 p-1 rounded-xl w-fit mb-8 border border-slate-200">
                    {(is_admin || !is_comercial_ss) && (
                        <button onClick={() => setOpcionPrincipal('transferir')} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${opcionPrincipal === 'transferir' ? 'bg-white text-sat shadow-sm' : 'text-slate-500'}`}>
                            <RefreshCcw size={16} /> Gestión de Pases
                        </button>
                    )}
                    <button onClick={() => setOpcionPrincipal('smartsat')} className={`flex items-center gap-2 px-6 py-2 rounded-lg text-sm font-semibold transition-all ${opcionPrincipal === 'smartsat' ? 'bg-white text-sat shadow-sm' : 'text-slate-500'}`}>
                        <Shield size={16} /> Mis Migraciones SmartSat
                    </button>
                </div>

                {/* VISTA ADMINISTRADOR */}
                {opcionPrincipal === 'transferir' && (
                    <div className="space-y-8 animate-in fade-in duration-500">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
                            <button onClick={() => { setModoTransferencia('lead'); setSeleccionado(null); }} className={`p-4 rounded-2xl border-2 text-left ${modoTransferencia === 'lead' ? 'border-sat bg-sat/5' : 'bg-white'}`}>
                                <div className="flex items-center gap-2 font-bold text-slate-800"><User size={18} className={modoTransferencia === 'lead' ? 'text-sat' : 'text-slate-400'}/> Lead</div>
                            </button>
                            <button onClick={() => { setModoTransferencia('cliente'); setSeleccionado(null); }} className={`p-4 rounded-2xl border-2 text-left ${modoTransferencia === 'cliente' ? 'border-sat bg-sat/5' : 'bg-white'}`}>
                                <div className="flex items-center gap-2 font-bold text-slate-800"><Building size={18} className={modoTransferencia === 'cliente' ? 'text-sat' : 'text-slate-400'}/> Cliente</div>
                            </button>
                        </div>

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6">
                            <input type="text" value={busqueda} onChange={(e) => handleSearch(e.target.value)} placeholder="Buscar..." className="w-full pl-4 pr-4 py-3 bg-slate-50 border-slate-200 rounded-xl outline-none focus:border-sat transition-all" />
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                                {resultados.map((res) => (
                                    <button key={res.id} onClick={() => setSeleccionado(res)} className={`flex items-center justify-between p-4 rounded-xl border transition-all ${seleccionado?.id === res.id ? 'border-sat bg-sat/5' : 'bg-white'}`}>
                                        <div className="text-left font-bold text-slate-800">{res.nombre}</div>
                                        <div className="text-right border-l pl-4 font-bold text-slate-700">{res.prefijo_actual}</div>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {seleccionado && (
                            <div className="bg-white rounded-2xl shadow-sm border border-sat/30 p-6 animate-in slide-in-from-top-4">
                                <div className="flex gap-6 items-end">
                                    <div className="flex-1">
                                        <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Comercial de Destino</label>
                                        <select value={nuevoPrefijoId} onChange={(e) => setNuevoPrefijoId(e.target.value)} className="w-full p-3 bg-slate-50 border-slate-200 rounded-xl outline-none focus:border-sat">
                                            <option value="">Seleccione...</option>
                                            {prefijos_disponibles.map((p: any) => (<option key={p.id} value={p.id}>{p.codigo} - {p.comercial}</option>))}
                                        </select>
                                    </div>
                                    <button onClick={ejecutarPase} className="px-8 py-3 bg-sat text-white rounded-xl font-bold"><CheckCircle2 size={20} /></button>
                                </div>
                            </div>
                        )}

                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <div className="p-4 bg-slate-50/50 border-b border-slate-100 flex items-center gap-2">
                                <History size={18} className="text-sat" />
                                <h3 className="font-bold text-slate-800 text-sm uppercase">Logs de Transferencias Recientes</h3>
                            </div>
                            <div className="overflow-x-auto">
                                <table className="w-full text-left text-sm">
                                    <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                                        <tr>
                                            <th className="p-4">Entidad</th>
                                            <th className="p-4">Movimiento</th>
                                            <th className="p-4">Destino</th>
                                            <th className="p-4 text-right">Fecha</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-100">
                                        {historial.map((log: any) => (
                                            <tr key={log.id} className="hover:bg-slate-50 transition-colors">
                                                <td className="p-4 font-bold text-slate-800">{log.entidad_nombre}</td>
                                                <td className="p-4">
                                                    <div className="flex items-center gap-2 font-mono text-xs">
                                                        <span>{log.prefijo_origen}</span> <ArrowRight size={12} className="text-sat" /> <span className="text-sat font-bold">{log.prefijo_destino}</span>
                                                    </div>
                                                </td>
                                                <td className="p-4 text-slate-600">{log.usuario}</td>
                                                <td className="p-4 text-right text-slate-400 text-xs">{log.fecha}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                )}

                {/* VISTA SMART-SAT */}
                {opcionPrincipal === 'smartsat' && (
                    <>
                        {/* Tarjeta de instrucciones */}
                        <div className="mb-6 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl overflow-hidden shadow-sm">
                            <div className="px-6 py-3 bg-blue-100 border-b border-blue-200">
                                <h2 className="text-sm font-semibold text-blue-800 flex items-center gap-2">
                                    <ClipboardList className="h-4 w-4" />
                                    Instrucciones para Migraciones SmartSAT
                                </h2>
                            </div>
                            <div className="px-6 py-4">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center text-sm font-bold">1</div>
                                        <div>
                                            <p className="font-medium text-gray-900">Validar datos</p>
                                            <p className="text-xs text-gray-600">Haga clic en <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-amber-50 text-amber-700 rounded text-xs border border-amber-200">Validar Datos</span> y complete los campos faltantes</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center justify-center text-gray-400">
                                        <ArrowRight className="h-5 w-5" />
                                    </div>
                                    <div className="flex items-center gap-3 flex-1">
                                        <div className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-sm font-bold">2</div>
                                        <div>
                                            <p className="font-medium text-gray-900">Generar contrato</p>
                                            <p className="text-xs text-gray-600">Una vez validado, haga clic en <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded text-xs border border-emerald-200">Generar contrato</span> para crear el contrato</p>
                                        </div>
                                    </div>
                                </div>
                                <div className="mt-4 pt-3 border-t border-blue-200">
                                    <p className="text-xs text-blue-700 flex items-center gap-1">
                                        <AlertCircle className="h-3 w-3" />
                                        Importante: Complete todos los datos antes de generar el contrato.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Tabla de Migraciones */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                            <table className="w-full text-left text-sm">
                                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                                    <tr>
                                        <th className="p-4">Entidad</th>
                                        <th className="p-4">Origen Anterior</th>
                                        <th className="p-4">Fecha de Pase</th>
                                        <th className="p-4 text-right">Acciones de Calidad</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-slate-100">
                                    {historialSmartSat.map((h: any) => (
                                        <tr key={h.id} className="hover:bg-slate-50">
                                            <td className="p-4 font-bold">{h.entidad_nombre}</td>
                                            <td className="p-4 font-mono text-xs">{h.prefijo_origen}</td>
                                            <td className="p-4 text-slate-400 text-xs">{h.fecha}</td>
                                            <td className="p-4 text-right space-x-2">
                                                <button onClick={() => abrirChequeo(h.entidad_id)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-bold border border-amber-200 hover:bg-amber-100 transition-colors">
                                                    <Edit3 size={14} /> Validar Datos
                                                </button>
                                                <button onClick={() => router.visit(`/comercial/contratos/desde-empresa/${h.entidad_id}`)} className="inline-flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg text-xs font-bold border border-emerald-200 hover:bg-emerald-100 transition-colors">
                                                    <FileText size={14} /> Generar contrato
                                                </button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </>
                )}
            </div>

            {/* MODAL DE CHEQUEO CON ERRORES FUNCIONALES */}
            {showChequeoModal && idEmpresaActual && (
                <div className="fixed inset-0 bg-black/60 z-[100] flex items-center justify-center p-4 backdrop-blur-sm">
                    <div className="bg-white rounded-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col shadow-2xl animate-in zoom-in-95 duration-200">
                        <div className="p-6 border-b flex justify-between items-center bg-white">
                            <div className="flex items-center gap-3">
                                <div className="p-2 rounded-lg bg-sat/10 text-sat"><Shield size={24}/></div>
                                <div><h2 className="text-xl font-bold text-slate-900">Validación de Datos</h2><p className="text-sm text-slate-500">Paso {pasoValidacion} de 3</p></div>
                            </div>
                            <button onClick={() => setShowChequeoModal(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors"><X size={20}/></button>
                        </div>
                        
                        <div className="px-6 py-4 border-b bg-slate-50 flex items-center justify-between">
                            {[1, 2, 3].map((p, idx) => (
                                <React.Fragment key={p}>
                                    <div className={`flex items-center gap-2 ${pasoValidacion === p ? 'text-sat' : 'text-slate-400'}`}>
                                        <div className={`w-8 h-8 rounded-full flex items-center justify-center border-2 font-bold ${pasoValidacion === p ? 'border-sat bg-sat text-white' : 'border-slate-300 bg-white'}`}>{p}</div>
                                        <span className="text-xs font-bold uppercase">{p === 1 ? 'Lead' : p === 2 ? 'Personal' : 'Empresa'}</span>
                                    </div>
                                    {idx < 2 && <div className={`flex-1 h-0.5 mx-4 ${pasoValidacion > p ? 'bg-sat' : 'bg-slate-200'}`} />}
                                </React.Fragment>
                            ))}
                        </div>

                        <div className="p-8 overflow-y-auto flex-1 bg-white">
                            {pasoValidacion === 1 && (
                                <Paso1DatosLead 
                                    data={formDataLead} 
                                    origenes={origenes} 
                                    rubros={rubros} 
                                    provincias={provincias} 
                                    onChange={handleChangeLead}
                                    errores={erroresValidacion}
                                    localidadInicial={formDataLead.localidad?.nombre || ''} 
                                    provinciaInicial={formDataLead.localidad?.provincia_id?.toString() || ''} 
                                />
                            )}
                            {pasoValidacion === 2 && (
                                <Paso2DatosContacto 
                                    data={formDataContacto} 
                                    tiposResponsabilidad={tiposResponsabilidad} 
                                    tiposDocumento={tiposDocumento} 
                                    nacionalidades={nacionalidades} 
                                    onChange={handleChangeContacto}
                                    errores={erroresValidacion}
                                />
                            )}
                            {pasoValidacion === 3 && (
                                <Paso3DatosEmpresa 
                                    data={formDataEmpresa} 
                                    onChange={handleChangeEmpresa}
                                    rubros={rubros} 
                                    provincias={provincias} 
                                    categoriasFiscales={categoriasFiscales} 
                                    plataformas={plataformas} 
                                    errores={erroresValidacion}
                                    localidadInicial={localidadFiscalNombre} 
                                    provinciaInicial={localidadFiscalProvinciaId} 
                                />
                            )}
                        </div>

                        <div className="p-6 border-t bg-slate-50 flex justify-between items-center">
                            <button 
                                onClick={() => {
                                    setPasoValidacion(prev => Math.max(1, prev - 1));
                                    setErroresValidacion({});
                                }} 
                                disabled={pasoValidacion === 1 || isSubmitting} 
                                className="px-6 py-2 text-slate-600 font-semibold disabled:opacity-30 flex items-center gap-2"
                            >
                                <ChevronLeft size={18}/> Anterior
                            </button>
                            <div className="flex gap-3">
                                {pasoValidacion < 3 ? (
                                    <button 
                                        onClick={handleSiguiente} 
                                        disabled={isSubmitting} 
                                        className="px-8 py-2 bg-slate-800 text-white rounded-xl font-bold flex items-center gap-2"
                                    >
                                        {isSubmitting ? <Loader className="animate-spin" size={18}/> : <>Siguiente <ChevronRight size={18}/></>}
                                    </button>
                                ) : (
                                    <button 
                                        onClick={handleFinalizar} 
                                        disabled={isSubmitting} 
                                        className="px-8 py-2 bg-sat text-white rounded-xl font-bold shadow-lg shadow-sat/20 flex items-center gap-2"
                                    >
                                        {isSubmitting ? <Loader className="animate-spin" size={18}/> : <>Finalizar y Validar <Check size={18}/></>}
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}