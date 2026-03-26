// resources/js/Pages/Comercial/Cuentas/CambioTitularidad.tsx
import React, { useState, useMemo } from 'react';
import { Head, router } from '@inertiajs/react';
import axios from 'axios';

import AppLayout from '@/layouts/app-layout';
import { useToast } from '@/contexts/ToastContext';
import Pagination from '@/components/ui/Pagination';
import { 
    Truck, Building, FileText, CheckCircle, User, Search, 
    ArrowLeft, ArrowRight, X, AlertCircle, Loader, Clock, Eye
} from 'lucide-react';

// Componentes reutilizables
import AltaEmpresaModal from '@/components/empresa/AltaEmpresaModal'
import { Comercial } from '@/types/leads'; 

// Tipos
interface Vehiculo {
    id: number;
    codigo_alfa: string;
    avl_patente: string;
    avl_marca: string;
    avl_modelo: string;
    avl_anio: number;
    avl_color: string;
    empresa_id: number;
    nombre_mix?: string;
}

interface Empresa {
    id: number;
    codigo: string;
    numeroalfa: number;
    nombre_fantasia: string;
    razon_social: string;
    cuit: string;
    prefijo_id: number;
    es_activo: boolean;
}

interface HistorialItem {
    id: number;
    fecha_cambio: string;
    usuario: string;
    cantidad_vehiculos: number;
    empresa_origen: {
        id: number;
        codigo: string;
        nombre: string;
        cuit: string;
    };
    empresa_destino: {
        id: number;
        codigo: string;
        nombre: string;
        cuit: string;
    };
    vehiculos: any[];
    contrato_id?: string;
}

interface HistorialData {
    current_page: number;
    last_page: number;
    per_page: number;
    total: number;
    data: HistorialItem[];
}

interface Props {
    empresas: Empresa[];
    vehiculos: Record<number, Vehiculo[]>;
    historial: HistorialData;
    provincias: any[];
    rubros: any[];
    origenes: any[];
    tiposDocumento: any[];
    nacionalidades: any[];
    tiposResponsabilidad: any[];
    categoriasFiscales: any[];
    plataformas: any[];
    comerciales: Comercial[];
    usuario: {
        ve_todas_cuentas: boolean;
        prefijos: number[];
        rol_id: number;
        comercial?: {
            prefijo_id?: number;
        };
    };
}

type TipoOperacion = 'entre_empresas' | 'nueva_empresa' | null;

export default function CambioTitularidad({
    empresas = [],
    vehiculos = {},
    historial: historialInicial,
    provincias = [],
    rubros = [],
    origenes = [],
    tiposDocumento = [],
    nacionalidades = [],
    tiposResponsabilidad = [],
    categoriasFiscales = [],
    comerciales = [],
    plataformas = [],
    usuario,
}: Props) {
    const toast = useToast();
    const [tipoOperacion, setTipoOperacion] = useState<TipoOperacion>(null);
    const [pasoActual, setPasoActual] = useState(1);
    const [loading, setLoading] = useState(false);
    const [errores, setErrores] = useState<Record<string, string>>({});
    const [historial, setHistorial] = useState<HistorialData>(historialInicial);
    const [detalleModal, setDetalleModal] = useState<{ show: boolean; cambio: HistorialItem | null }>({ 
        show: false, 
        cambio: null 
    });
    
    // Estados para empresa origen
    const [empresaOrigen, setEmpresaOrigen] = useState<Empresa | null>(null);
    const [searchEmpresaTerm, setSearchEmpresaTerm] = useState('');
    const [showEmpresaResults, setShowEmpresaResults] = useState(false);
    
    // Estados para vehículos
    const [vehiculosSeleccionados, setVehiculosSeleccionados] = useState<Vehiculo[]>([]);
    const [searchVehiculoTerm, setSearchVehiculoTerm] = useState('');
    const [showVehiculoResults, setShowVehiculoResults] = useState(false);
    
    // Estados para empresa destino
    const [empresaDestino, setEmpresaDestino] = useState<Empresa | null>(null);
    const [searchDestinoTerm, setSearchDestinoTerm] = useState('');
    const [showDestinoResults, setShowDestinoResults] = useState(false);
    
    // Estado para nueva empresa
    const [showAltaEmpresaModal, setShowAltaEmpresaModal] = useState(false);

    // Filtros de empresas según permisos
    const empresasFiltradas = useMemo(() => {
        return empresas.filter(empresa => {
            if (usuario?.ve_todas_cuentas) return true;
            return usuario?.prefijos?.includes(empresa.prefijo_id);
        });
    }, [empresas, usuario]);

    // Filtrar empresas para el buscador de origen
    const filteredEmpresas = useMemo(() => {
        if (!searchEmpresaTerm) return [];
        return empresasFiltradas.filter(e => 
            e.nombre_fantasia.toLowerCase().includes(searchEmpresaTerm.toLowerCase()) ||
            e.razon_social.toLowerCase().includes(searchEmpresaTerm.toLowerCase()) ||
            e.cuit.includes(searchEmpresaTerm) ||
            e.codigo.toLowerCase().includes(searchEmpresaTerm.toLowerCase())
        ).slice(0, 10);
    }, [empresasFiltradas, searchEmpresaTerm]);

    // Filtrar empresas para el buscador de destino
    const filteredDestino = useMemo(() => {
        if (!searchDestinoTerm) return [];
        return empresasFiltradas.filter(e => 
            e.id !== empresaOrigen?.id && (
                e.nombre_fantasia.toLowerCase().includes(searchDestinoTerm.toLowerCase()) ||
                e.razon_social.toLowerCase().includes(searchDestinoTerm.toLowerCase()) ||
                e.cuit.includes(searchDestinoTerm) ||
                e.codigo.toLowerCase().includes(searchDestinoTerm.toLowerCase())
            )
        ).slice(0, 10);
    }, [empresasFiltradas, searchDestinoTerm, empresaOrigen]);

    // Filtrar vehículos de la empresa seleccionada
    const filteredVehiculos = useMemo(() => {
        if (!empresaOrigen || !vehiculos[empresaOrigen.id]) return [];
        const vehiculosEmpresa = vehiculos[empresaOrigen.id];
        if (!searchVehiculoTerm) return vehiculosEmpresa.slice(0, 10);
        
        return vehiculosEmpresa.filter(v => {
            const codigo = v.codigo_alfa || '';
            const patente = v.avl_patente || '';
            const marca = v.avl_marca || '';
            const modelo = v.avl_modelo || '';
            const searchLower = searchVehiculoTerm.toLowerCase();
            
            return codigo.toLowerCase().includes(searchLower) ||
                   patente.toLowerCase().includes(searchLower) ||
                   marca.toLowerCase().includes(searchLower) ||
                   modelo.toLowerCase().includes(searchLower);
        }).slice(0, 10);
    }, [empresaOrigen, vehiculos, searchVehiculoTerm]);

    // Handlers
    const handleSelectTipo = (tipo: 'entre_empresas' | 'nueva_empresa') => {
        setTipoOperacion(tipo);
        setPasoActual(2);
        setErrores({});
        setEmpresaOrigen(null);
        setVehiculosSeleccionados([]);
        setEmpresaDestino(null);
    };

    const handleSelectEmpresaOrigen = (empresa: Empresa) => {
        setEmpresaOrigen(empresa);
        setSearchEmpresaTerm('');
        setShowEmpresaResults(false);
        setVehiculosSeleccionados([]);
        if (errores.empresa_origen) {
            setErrores(prev => {
                const newErrors = { ...prev };
                delete newErrors.empresa_origen;
                return newErrors;
            });
        }
    };

    const handleSelectVehiculo = (vehiculo: Vehiculo) => {
        if (!vehiculosSeleccionados.find(v => v.id === vehiculo.id)) {
            setVehiculosSeleccionados([...vehiculosSeleccionados, vehiculo]);
        }
        setSearchVehiculoTerm('');
        setShowVehiculoResults(false);
        if (errores.vehiculos) {
            setErrores(prev => {
                const newErrors = { ...prev };
                delete newErrors.vehiculos;
                return newErrors;
            });
        }
    };

    const handleRemoveVehiculo = (id: number) => {
        setVehiculosSeleccionados(vehiculosSeleccionados.filter(v => v.id !== id));
    };

    const handleSelectEmpresaDestino = (empresa: Empresa) => {
        setEmpresaDestino(empresa);
        setSearchDestinoTerm('');
        setShowDestinoResults(false);
        if (errores.empresa_destino) {
            setErrores(prev => {
                const newErrors = { ...prev };
                delete newErrors.empresa_destino;
                return newErrors;
            });
        }
    };

    // 🔥 Handler para cuando se cierra el modal con éxito
    const handleModalClose = (empresaGuardada?: boolean, irAContrato?: boolean) => {
        setShowAltaEmpresaModal(false);
        
        if (empresaGuardada) {
            // Recargar las empresas para obtener la nueva
            router.reload({
                only: ['empresas'],
                onSuccess: () => {
                    toast.success('Empresa creada correctamente');
                }
            });
        }
    };

    // Validaciones
    const validarPaso = (): boolean => {
        const nuevosErrores: Record<string, string> = {};

        if (pasoActual === 2 && !empresaOrigen) {
            nuevosErrores['empresa_origen'] = 'Debe seleccionar una empresa origen';
        }

        if (pasoActual === 3 && vehiculosSeleccionados.length === 0) {
            nuevosErrores['vehiculos'] = 'Debe seleccionar al menos un vehículo';
        }

        if (pasoActual === 4) {
            if (tipoOperacion === 'entre_empresas' && !empresaDestino) {
                nuevosErrores['empresa_destino'] = 'Debe seleccionar una empresa destino';
            }
            if (tipoOperacion === 'nueva_empresa' && !empresaDestino) {
                nuevosErrores['empresa_destino'] = 'Debe completar el alta de la empresa';
            }
        }

        setErrores(nuevosErrores);
        return Object.keys(nuevosErrores).length === 0;
    };

    // Navegación
    const handleSiguiente = () => {
        if (!validarPaso()) return;

        if (pasoActual === 2) setPasoActual(3);
        else if (pasoActual === 3) setPasoActual(4);
        else if (pasoActual === 4) handleGuardar();
    };

    const handleAnterior = () => {
        if (pasoActual === 2) {
            setTipoOperacion(null);
            setPasoActual(1);
        } else {
            setPasoActual(pasoActual - 1);
        }
    };

    const handleCancelar = () => {
        setTipoOperacion(null);
        setPasoActual(1);
        setEmpresaOrigen(null);
        setVehiculosSeleccionados([]);
        setEmpresaDestino(null);
    };

    const handleGuardar = () => {
        if (tipoOperacion === 'nueva_empresa' && !empresaDestino) {
            toast.error('Debe completar el alta de la empresa');
            return;
        }

        setLoading(true);

        const datosEnvio: any = {
            tipo_operacion: tipoOperacion,
            empresa_origen_id: empresaOrigen?.id,
            vehiculos: vehiculosSeleccionados.map(v => v.id),
        };

        if (tipoOperacion === 'entre_empresas') {
            datosEnvio.empresa_destino_id = empresaDestino?.id;
        } else {
            datosEnvio.empresa_destino_id = empresaDestino?.id;
        }

        router.post('/comercial/cuentas/cambio-titularidad', datosEnvio, {
            onSuccess: () => {
                toast.success('Cambio de titularidad registrado');
                setLoading(false);
                handleCancelar();
                // Recargar historial
                router.reload({ only: ['historial'] });
            },
            onError: (errors) => {
                setErrores(errors);
                toast.error('Error al registrar el cambio');
                setLoading(false);
            },
        });
    };

    const verDetalle = async (id: number) => {
        try {
            const response = await axios.get(`/comercial/cuentas/cambio-titularidad/${id}`);
            setDetalleModal({ show: true, cambio: response.data });
        } catch (error) {
            console.error('Error al cargar detalle:', error);
            toast.error('Error al cargar el detalle');
        }
    };

    const cambiarPagina = (page: number) => {
        router.get('/comercial/cuentas/cambio-titularidad', { page }, {
            preserveState: true,
            preserveScroll: true,
            only: ['historial'],
            onSuccess: (page: any) => {
                setHistorial(page.props.historial as HistorialData);
            }
        });
    };

    return (
        <AppLayout title="Cambio de Titularidad">
            <Head title="Cambio de Titularidad" />

            <div className="px-4 sm:px-6 lg:px-8 py-6">
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">Cambio de Titularidad</h1>
                    <p className="mt-1 text-sm text-gray-600">Transfiera vehículos a otra empresa</p>
                </div>

                {/* PASO 1: SELECCIÓN DE TIPO */}
                {pasoActual === 1 && (
                    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-6 mb-8">
                        <h2 className="text-lg font-semibold text-gray-900 mb-6">¿Qué tipo de operación desea realizar?</h2>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <button
                                onClick={() => handleSelectTipo('entre_empresas')}
                                className="p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left"
                            >
                                <Building className="h-8 w-8 text-indigo-600 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Entre empresas existentes</h3>
                                <p className="text-sm text-gray-500">
                                    Transferir vehículos a otra empresa ya registrada
                                </p>
                            </button>

                            <button
                                onClick={() => handleSelectTipo('nueva_empresa')}
                                className="p-6 border-2 border-gray-200 rounded-lg hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left"
                            >
                                <User className="h-8 w-8 text-indigo-600 mb-4" />
                                <h3 className="text-lg font-semibold text-gray-900 mb-2">Alta de nueva empresa</h3>
                                <p className="text-sm text-gray-500">
                                    Crear una nueva empresa y transferir los vehículos
                                </p>
                            </button>
                        </div>
                    </div>
                )}

                {/* PASOS 2-4: FLUJO PRINCIPAL */}
                {pasoActual > 1 && (
                    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-visible mb-8">
                        {/* Header */}
                        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-4 border-b border-indigo-100">
                            <h2 className="text-lg font-semibold text-indigo-900">
                                {tipoOperacion === 'entre_empresas' ? 'Cambio entre empresas existentes' : 'Alta de nueva empresa'}
                            </h2>
                            <p className="text-sm text-indigo-600">
                                Paso {pasoActual - 1} de 3: {
                                    pasoActual === 2 ? 'Seleccionar empresa origen' :
                                    pasoActual === 3 ? 'Seleccionar vehículos' :
                                    'Seleccionar empresa destino'
                                }
                            </p>
                        </div>

                        <div className="p-6">
                            {/* PASO 2: EMPRESA ORIGEN */}
                            {pasoActual === 2 && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-semibold text-gray-900">Seleccionar Empresa Origen</h2>
                                    
                                    <div className="relative">
                                        <input
                                            type="text"
                                            value={searchEmpresaTerm}
                                            onChange={(e) => {
                                                setSearchEmpresaTerm(e.target.value);
                                                setShowEmpresaResults(true);
                                            }}
                                            onFocus={() => setShowEmpresaResults(true)}
                                            onBlur={() => setTimeout(() => setShowEmpresaResults(false), 200)}
                                            placeholder="Buscar por código, nombre, razón social o CUIT..."
                                            className="w-full px-4 py-3 pl-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                            autoComplete="off"
                                        />
                                        <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                        
                                        {showEmpresaResults && searchEmpresaTerm && (
                                            <div className="absolute z-[100] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                                                {filteredEmpresas.length > 0 ? filteredEmpresas.map(e => (
                                                    <button
                                                        key={e.id}
                                                        type="button"
                                                        className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-gray-100"
                                                        onClick={() => handleSelectEmpresaOrigen(e)}
                                                    >
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-mono text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                                                                {e.codigo}
                                                            </span>
                                                            <span className="text-xs text-gray-500 font-mono">{e.cuit}</span>
                                                        </div>
                                                        <p className="font-medium text-gray-900 text-sm">{e.nombre_fantasia}</p>
                                                        <p className="text-xs text-gray-500 truncate">{e.razon_social}</p>
                                                    </button>
                                                )) : (
                                                    <div className="px-4 py-4 text-sm text-gray-500 text-center">No se encontraron empresas</div>
                                                )}
                                            </div>
                                        )}
                                    </div>

                                    {empresaOrigen && (
                                        <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                            <h3 className="text-sm font-medium text-indigo-900 mb-2">Empresa seleccionada:</h3>
                                            <div className="flex items-center gap-2 mb-1">
                                                <span className="font-mono text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded">
                                                    {empresaOrigen.codigo}
                                                </span>
                                                <span className="text-xs text-indigo-700">{empresaOrigen.cuit}</span>
                                            </div>
                                            <p className="font-medium">{empresaOrigen.nombre_fantasia}</p>
                                            <p className="text-sm text-gray-600">{empresaOrigen.razon_social}</p>
                                        </div>
                                    )}

                                    {errores.empresa_origen && (
                                        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                                            <AlertCircle className="h-4 w-4" />
                                            <p className="text-sm">{errores.empresa_origen}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* PASO 3: VEHÍCULOS */}
                            {pasoActual === 3 && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-semibold text-gray-900">Seleccionar Vehículos a Transferir</h2>
                                    
                                    {!empresaOrigen ? (
                                        <div className="text-center py-8 bg-gray-50 rounded-lg">
                                            <Truck className="h-12 w-12 text-gray-300 mx-auto mb-3" />
                                            <p className="text-gray-500">Debe seleccionar primero una empresa origen</p>
                                        </div>
                                    ) : (
                                        <>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={searchVehiculoTerm}
                                                    onChange={(e) => {
                                                        setSearchVehiculoTerm(e.target.value);
                                                        setShowVehiculoResults(true);
                                                    }}
                                                    onFocus={() => setShowVehiculoResults(true)}
                                                    onBlur={() => setTimeout(() => setShowVehiculoResults(false), 200)}
                                                    placeholder="Buscar por código, patente o marca..."
                                                    className="w-full px-4 py-3 pl-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                                <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                                
                                                {showVehiculoResults && filteredVehiculos.length > 0 && (
                                                    <div className="absolute z-[100] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                                                        {filteredVehiculos.map(v => (
                                                            <button
                                                                key={v.id}
                                                                type="button"
                                                                className="w-full text-left px-4 py-2 hover:bg-indigo-50 border-b border-gray-100"
                                                                onClick={() => handleSelectVehiculo(v)}
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <span className="font-mono text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                                                                        {v.codigo_alfa}
                                                                    </span>
                                                                    <span className="text-sm font-medium">{v.avl_patente}</span>
                                                                </div>
                                                                <p className="text-xs text-gray-600 mt-1">
                                                                    {v.avl_marca} {v.avl_modelo} - {v.avl_anio}
                                                                </p>
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                            </div>

                                            {vehiculosSeleccionados.length > 0 && (
                                                <div className="border border-gray-200 rounded-lg overflow-hidden">
                                                    <table className="w-full text-sm">
                                                        <thead className="bg-gray-50 border-b border-gray-200">
                                                            <tr>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Código</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600">Patente</th>
                                                                <th className="px-4 py-2 text-left text-xs font-medium text-gray-600 hidden sm:table-cell">Vehículo</th>
                                                                <th className="px-4 py-2 text-right text-xs font-medium text-gray-600">Acción</th>
                                                            </tr>
                                                        </thead>
                                                        <tbody className="divide-y divide-gray-200">
                                                            {vehiculosSeleccionados.map(v => (
                                                                <tr key={v.id}>
                                                                    <td className="px-4 py-2 font-mono text-indigo-600">{v.codigo_alfa}</td>
                                                                    <td className="px-4 py-2 font-medium">{v.avl_patente}</td>
                                                                    <td className="px-4 py-2 hidden sm:table-cell">
                                                                        {v.avl_marca} {v.avl_modelo} {v.avl_anio}
                                                                    </td>
                                                                    <td className="px-4 py-2 text-right">
                                                                        <button
                                                                            onClick={() => handleRemoveVehiculo(v.id)}
                                                                            className="text-red-600 hover:text-red-800 text-xs flex items-center gap-1 ml-auto"
                                                                        >
                                                                            <X className="h-3 w-3" />
                                                                            Quitar
                                                                        </button>
                                                                    </td>
                                                                </tr>
                                                            ))}
                                                        </tbody>
                                                    </table>
                                                </div>
                                            )}

                                            {errores.vehiculos && (
                                                <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                                                    <AlertCircle className="h-4 w-4" />
                                                    <p className="text-sm">{errores.vehiculos}</p>
                                                </div>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* PASO 4: EMPRESA DESTINO */}
                            {pasoActual === 4 && (
                                <div className="space-y-4">
                                    <h2 className="text-lg font-semibold text-gray-900">
                                        {tipoOperacion === 'entre_empresas' ? 'Seleccionar Empresa Destino' : 'Nueva Empresa'}
                                    </h2>
                                    
                                    {tipoOperacion === 'entre_empresas' ? (
                                        // SELECCIÓN DE EMPRESA EXISTENTE
                                        <>
                                            <div className="relative">
                                                <input
                                                    type="text"
                                                    value={searchDestinoTerm}
                                                    onChange={(e) => {
                                                        setSearchDestinoTerm(e.target.value);
                                                        setShowDestinoResults(true);
                                                    }}
                                                    onFocus={() => setShowDestinoResults(true)}
                                                    onBlur={() => setTimeout(() => setShowDestinoResults(false), 200)}
                                                    placeholder="Buscar por código, nombre, razón social o CUIT..."
                                                    className="w-full px-4 py-3 pl-10 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                                />
                                                <Search className="absolute left-3 top-3.5 h-4 w-4 text-gray-400" />
                                                
                                                {showDestinoResults && searchDestinoTerm && (
                                                    <div className="absolute z-[100] left-0 right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl max-h-80 overflow-y-auto">
                                                        {filteredDestino.length > 0 ? filteredDestino.map(e => (
                                                            <button
                                                                key={e.id}
                                                                type="button"
                                                                className="w-full text-left px-4 py-3 hover:bg-indigo-50 border-b border-gray-100"
                                                                onClick={() => handleSelectEmpresaDestino(e)}
                                                            >
                                                                <div className="flex items-center justify-between mb-1">
                                                                    <span className="font-mono text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                                                                        {e.codigo}
                                                                    </span>
                                                                    <span className="text-xs text-gray-500 font-mono">{e.cuit}</span>
                                                                </div>
                                                                <p className="font-medium text-gray-900 text-sm">{e.nombre_fantasia}</p>
                                                                <p className="text-xs text-gray-500 truncate">{e.razon_social}</p>
                                                            </button>
                                                        )) : (
                                                            <div className="px-4 py-4 text-sm text-gray-500 text-center">No se encontraron empresas</div>
                                                        )}
                                                    </div>
                                                )}
                                            </div>

                                            {empresaDestino && (
                                                <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
                                                    <h3 className="text-sm font-medium text-indigo-900 mb-2">Empresa seleccionada:</h3>
                                                    <div className="flex items-center gap-2 mb-1">
                                                        <span className="font-mono text-xs bg-indigo-200 text-indigo-800 px-2 py-1 rounded">
                                                            {empresaDestino.codigo}
                                                        </span>
                                                        <span className="text-xs text-indigo-700">{empresaDestino.cuit}</span>
                                                    </div>
                                                    <p className="font-medium">{empresaDestino.nombre_fantasia}</p>
                                                    <p className="text-sm text-gray-600">{empresaDestino.razon_social}</p>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        // NUEVA EMPRESA: Mostrar solo botón para abrir modal
                                        <div className="flex flex-col items-center justify-center py-8 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                                            <Building className="h-12 w-12 text-gray-400 mb-3" />
                                            <p className="text-gray-600 text-center mb-4">
                                                Complete los datos de la nueva empresa
                                            </p>
                                            <button
                                                onClick={() => setShowAltaEmpresaModal(true)}
                                                className="px-6 py-3 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 flex items-center gap-2 transition-colors"
                                            >
                                                <Building className="h-4 w-4" />
                                                Completar alta de empresa
                                            </button>
                                            <p className="text-xs text-gray-400 mt-3">
                                                Se abrirá un formulario con todos los campos necesarios
                                            </p>
                                        </div>
                                    )}

                                    {errores.empresa_destino && (
                                        <div className="flex items-center gap-2 text-red-600 bg-red-50 p-3 rounded-lg">
                                            <AlertCircle className="h-4 w-4" />
                                            <p className="text-sm">{errores.empresa_destino}</p>
                                        </div>
                                    )}
                                </div>
                            )}

                            {/* BOTONES DE NAVEGACIÓN */}
                            <div className="flex justify-between mt-8 pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    onClick={handleAnterior}
                                    className="px-4 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50 flex items-center gap-2"
                                >
                                    <ArrowLeft className="h-4 w-4" />
                                    {pasoActual === 2 ? 'Cancelar' : 'Anterior'}
                                </button>
                                
                                <button
                                    type="button"
                                    onClick={handleSiguiente}
                                    disabled={loading}
                                    className="px-6 py-2 bg-indigo-600 text-white rounded-lg text-sm hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                                >
                                    {loading ? (
                                        <>
                                            <Loader className="h-4 w-4 animate-spin" />
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            {pasoActual === 4 ? 'Guardar Cambio' : 'Siguiente'}
                                            <ArrowRight className="h-4 w-4" />
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                {/* HISTORIAL DE CAMBIOS */}
                <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
                        <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                            <Clock className="h-5 w-5 text-gray-500" />
                            Historial de Cambios de Titularidad
                        </h2>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-50 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Fecha</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Empresa Origen</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Empresa Destino</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Vehículos</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Usuario</th>
                                    <th className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase">Acciones</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {historial.data.map((cambio) => (
                                    <tr key={cambio.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 text-sm text-gray-600">{cambio.fecha_cambio}</td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                                                    {cambio.empresa_origen.codigo}
                                                </span>
                                                <div>
                                                    <p className="font-medium text-gray-900">{cambio.empresa_origen.nombre}</p>
                                                    <p className="text-xs text-gray-500">{cambio.empresa_origen.cuit}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-2">
                                                <span className="font-mono text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                                    {cambio.empresa_destino.codigo}
                                                </span>
                                                <div>
                                                    <p className="font-medium text-gray-900">{cambio.empresa_destino.nombre}</p>
                                                    <p className="text-xs text-gray-500">{cambio.empresa_destino.cuit}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                                {cambio.cantidad_vehiculos} vehículos
                                            </span>
                                        </td>
                                        <td className="px-6 py-4 text-sm text-gray-600">{cambio.usuario}</td>
                                        <td className="px-6 py-4">
                                            <button
                                                onClick={() => verDetalle(cambio.id)}
                                                className="text-indigo-600 hover:text-indigo-800 text-sm font-medium flex items-center gap-1"
                                            >
                                                <Eye className="h-4 w-4" />
                                                Ver
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                                {historial.data.length === 0 && (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-8 text-center text-gray-500">
                                            No hay cambios de titularidad registrados
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>

                    {historial.last_page > 1 && (
                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
                            <Pagination
                                currentPage={historial.current_page}
                                lastPage={historial.last_page}
                                total={historial.total}
                                perPage={historial.per_page}
                                onPageChange={cambiarPagina}
                                preserveState={true}
                                preserveScroll={true}
                            />
                        </div>
                    )}
                </div>
            </div>

            {/* MODAL DE ALTA DE EMPRESA */}
            <AltaEmpresaModal
                isOpen={showAltaEmpresaModal}
                onClose={handleModalClose}
                presupuestoId={null}
                lead={null}
                origenes={origenes}
                rubros={rubros}
                provincias={provincias}
                usuario={usuario}
                comerciales={comerciales} 
                hayComerciales={comerciales.length > 0}  
            />

            {/* MODAL DE DETALLE */}
            {detalleModal.show && detalleModal.cambio && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" onClick={() => setDetalleModal({ show: false, cambio: null })}>
                    <div className="bg-white rounded-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                        <div className="bg-gradient-to-r from-indigo-50 to-violet-50 px-6 py-4 border-b border-indigo-100 flex justify-between items-center sticky top-0">
                            <div>
                                <h3 className="text-lg font-semibold text-indigo-900">Detalle del Cambio</h3>
                                <p className="text-sm text-indigo-600">{detalleModal.cambio.fecha_cambio}</p>
                            </div>
                            <button onClick={() => setDetalleModal({ show: false, cambio: null })} className="text-gray-400 hover:text-gray-600">
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        
                        <div className="p-6 space-y-6">
                            <div className="grid md:grid-cols-2 gap-6">
                                <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase mb-4">Empresa Origen</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs bg-indigo-100 text-indigo-700 px-2 py-1 rounded">
                                                {detalleModal.cambio.empresa_origen.codigo}
                                            </span>
                                        </div>
                                        <p className="font-medium">{detalleModal.cambio.empresa_origen.nombre}</p>
                                        <p className="text-sm font-mono text-gray-600">{detalleModal.cambio.empresa_origen.cuit}</p>
                                    </div>
                                </div>
                                
                                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                    <h4 className="text-xs font-semibold text-green-600 uppercase mb-4">Empresa Destino</h4>
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <span className="font-mono text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                                                {detalleModal.cambio.empresa_destino.codigo}
                                            </span>
                                        </div>
                                        <p className="font-medium">{detalleModal.cambio.empresa_destino.nombre}</p>
                                        <p className="text-sm font-mono text-gray-600">{detalleModal.cambio.empresa_destino.cuit}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="border-t border-gray-200 pt-4">
                                <h4 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
                                    <Truck className="h-4 w-4" />
                                    Vehículos transferidos ({detalleModal.cambio.cantidad_vehiculos})
                                </h4>
                                <div className="bg-gray-50 rounded-lg p-4">
                                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                        {detalleModal.cambio.vehiculos?.map((v: any, idx: number) => (
                                            <div key={idx} className="flex items-center gap-2 p-2 bg-white rounded border border-gray-200">
                                                <span className="font-mono text-indigo-600">{v.codigo_alfa}</span>
                                                <span className="text-gray-600">{v.patente}</span>
                                                <span className="text-xs text-gray-500 ml-auto">
                                                    {v.marca} {v.modelo} {v.anio}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>

                            <div className="bg-gray-50 rounded-lg p-4">
                                <div className="grid grid-cols-2 gap-4 text-sm">
                                    <div>
                                        <span className="text-xs text-gray-500">Registrado por</span>
                                        <p className="font-medium">{detalleModal.cambio.usuario}</p>
                                    </div>
                                    <div>
                                        <span className="text-xs text-gray-500">Fecha</span>
                                        <p className="font-medium">{detalleModal.cambio.fecha_cambio}</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex justify-end">
                            <button onClick={() => setDetalleModal({ show: false, cambio: null })} className="px-4 py-2 text-sm bg-white border border-gray-300 rounded-lg hover:bg-gray-50">
                                Cerrar
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </AppLayout>
    );
}