// resources/js/Pages/Config/GestionAdmin.tsx

import { useState } from 'react';
import axios from 'axios';

import AppLayout from '@/layouts/app-layout';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs } from '@/components/ui/Tabs';
import { useToast } from '@/contexts/ToastContext';
import { 
    Building, Car, Package, FileText, 
    Plus, Trash2, Edit, Loader2
} from 'lucide-react';

interface EmpresaAgregar {
    codigoalfa: string;
    prefijo_codigo: string | null;
    codigoalf2: number;
    nombre_mix: string | null;
    razonsoc: string | null;
    altaregist: string | null;
}

interface EmpresaEliminar {
    id: number;
    codigoalfa: string;
    nombre_mix: string | null;
    razonsoc: string | null;
    vehiculos_asociados: number;
}

interface EmpresaActualizar {
    id: number;
    codigoalfa: string;
    diferencias: Array<{
        campo: string;
        valor_actual: string | null;
        valor_nuevo: string | null;
    }>;
}
interface CargarResponse {
    success: boolean;
    message?: string;
    error?: string;
    stats?: {
        empresas: number;
        vehiculos: number;
        accesorios: number;
        abonos: number;
        total_filas: number;
    };
}
interface VehiculoAgregar {
    codigoalfa: string;
    prefijo_codigo: string | null;
    numero_alfa: number | null;
    avl_patente: string | null;
    avl_identificador: string | null;
    avl_marca: string | null;
    avl_modelo: string | null;
    avl_anio: number | null;
    avl_color: string | null;
    nombre_mix: string | null;
    razonsoc: string | null;
}

interface VehiculoEliminar {
    codigoalfa: string;
    avl_patente: string | null;
    nombre_mix: string | null;
    motivo: string;
}

interface AccesorioItem {
    codigoalfa: string;
    enganche: number;
    panico: number;
    cabina: number;
    carga: number;
    corte: number;
    antivandalico: number;
}

interface AbonoItem {
    codigoalfa: string;
    abono_codigo: string | null;
    abono_nombre: string | null;
    abono_precio: number | null;
    abono_descuento: number | null;
}

interface ComparacionData {
    empresas: {
        para_agregar: EmpresaAgregar[];
        para_eliminar: EmpresaEliminar[];
        para_actualizar: EmpresaActualizar[];
    };
    vehiculos: {
        para_agregar: VehiculoAgregar[];
        para_eliminar: VehiculoEliminar[];
    };
    accesorios: {
        para_agregar: AccesorioItem[];
        para_eliminar: AccesorioItem[];
    };
    abonos: {
        para_agregar: AbonoItem[];
        para_eliminar: AbonoItem[];
    };
    resumen: {
        empresas_agregar: number;
        empresas_eliminar: number;
        empresas_actualizar: number;
        vehiculos_agregar: number;
        vehiculos_eliminar: number;
        accesorios_agregar: number;
        accesorios_eliminar: number;
        abonos_agregar: number;
        abonos_eliminar: number;
    };
}

interface Props {
    empresasCargadas: any[];
    totalEmpresas: number;
    totalVehiculos: number;
    totalAccesorios: number;
    totalAbonos: number;
    error: string | null;
}

export default function GestionAdmin({ 
    empresasCargadas, 
    totalEmpresas, 
    totalVehiculos, 
    totalAccesorios, 
    totalAbonos, 
    error 
}: Props) {
    const [archivo, setArchivo] = useState<File | null>(null);
    const [cargando, setCargando] = useState(false);
    const [comparando, setComparando] = useState(false);
    const [comparacion, setComparacion] = useState<ComparacionData | null>(null);
    const [aplicando, setAplicando] = useState(false);
    const toast = useToast();

const handleCargar = async () => {
    if (!archivo) return;
    
    setCargando(true);
    const formData = new FormData();
    formData.append('archivo', archivo);
    
    try {
        const response = await axios.post<CargarResponse>('/config/gestion-admin/cargar', formData, {
            headers: {
                'Content-Type': 'multipart/form-data',
                'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content')
            },
            withCredentials: true
        });
        
        if (response.data.success) {
            toast?.success(response.data.message || 'Carga completada');
            setTimeout(() => window.location.reload(), 1500);
        } else {
            toast?.error(response.data.error || 'Error al cargar');
        }
    } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 419) {
            toast?.error('Sesión expirada. Recargando página...');
            setTimeout(() => window.location.reload(), 1500);
        } else {
            console.error('Error:', error);
            toast?.error('Error al cargar el archivo');
        }
    } finally {
        setCargando(false);
    }
};

    const handleComparar = async () => {
        setComparando(true);
        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch('/config/gestion-admin/comparar', {
                headers: { 'X-CSRF-TOKEN': token || '' }
            });
            const data = await response.json();
            
            if (data.success) {
                setComparacion(data.data);
                toast?.success('Comparación completada');
            } else {
                toast?.error(data.error);
            }
        } catch (error) {
            toast?.error('Error al comparar');
        } finally {
            setComparando(false);
        }
    };

    const handleAplicarCambios = async () => {
        if (!confirm('¿Estás seguro de aplicar todos los cambios? Esta acción no se puede deshacer.')) return;
        
        setAplicando(true);
        try {
            const token = document.querySelector('meta[name="csrf-token"]')?.getAttribute('content');
            const response = await fetch('/config/gestion-admin/aplicar-cambios', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-CSRF-TOKEN': token || ''
                },
                body: JSON.stringify({ confirmar: true })
            });
            const data = await response.json();
            
            if (data.success) {
                toast?.success(data.message);
                setTimeout(() => window.location.reload(), 2000);
            } else {
                toast?.error(data.error);
            }
        } catch (error) {
            toast?.error('Error al aplicar cambios');
        } finally {
            setAplicando(false);
        }
    };

    // Tab: Resumen
    const ResumenTab = () => {
        if (!comparacion) return null;
        const r = comparacion.resumen;
        return (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                <div className="p-4 bg-red-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-red-600">{r.empresas_eliminar}</div>
                    <div className="text-sm text-gray-600">Empresas a eliminar</div>
                </div>
                <div className="p-4 bg-green-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-green-600">{r.empresas_agregar}</div>
                    <div className="text-sm text-gray-600">Empresas a agregar</div>
                </div>
                <div className="p-4 bg-yellow-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-yellow-600">{r.empresas_actualizar}</div>
                    <div className="text-sm text-gray-600">Empresas a actualizar</div>
                </div>
                <div className="p-4 bg-blue-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-blue-600">{r.vehiculos_agregar}</div>
                    <div className="text-sm text-gray-600">Vehículos a agregar</div>
                </div>
                <div className="p-4 bg-orange-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-orange-600">{r.vehiculos_eliminar}</div>
                    <div className="text-sm text-gray-600">Vehículos a eliminar</div>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-purple-600">{r.accesorios_agregar}</div>
                    <div className="text-sm text-gray-600">Accesorios a agregar</div>
                </div>
                <div className="p-4 bg-pink-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-pink-600">{r.accesorios_eliminar}</div>
                    <div className="text-sm text-gray-600">Accesorios a eliminar</div>
                </div>
                <div className="p-4 bg-indigo-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-indigo-600">{r.abonos_agregar}</div>
                    <div className="text-sm text-gray-600">Abonos a agregar</div>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg text-center">
                    <div className="text-2xl font-bold text-amber-600">{r.abonos_eliminar}</div>
                    <div className="text-sm text-gray-600">Abonos a eliminar</div>
                </div>
            </div>
        );
    };

    // Tab: Empresas
    const EmpresasTab = () => {
        if (!comparacion) return null;
        const { para_agregar, para_eliminar, para_actualizar } = comparacion.empresas;
        
        return (
            <div className="space-y-6">
                {para_eliminar.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                            <Trash2 className="h-4 w-4" /> Empresas a eliminar ({para_eliminar.length})
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-auto">
                            {para_eliminar.map((emp, i) => (
                                <div key={i} className="text-sm p-3 bg-red-50 rounded-lg border border-red-200">
                                    <div className="font-mono font-medium">{emp.codigoalfa}</div>
                                    <div className="text-gray-600">{emp.nombre_mix || emp.razonsoc || 'Sin nombre'}</div>
                                    <Badge variant="outline" className="mt-1">{emp.vehiculos_asociados} vehículos asociados</Badge>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {para_agregar.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Empresas a agregar ({para_agregar.length})
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-auto">
                            {para_agregar.map((emp, i) => (
                                <div key={i} className="text-sm p-3 bg-green-50 rounded-lg border border-green-200">
                                    <div className="font-mono font-medium">{emp.codigoalfa}</div>
                                    <div className="text-gray-600">{emp.nombre_mix || emp.razonsoc || 'Sin nombre'}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {para_actualizar.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-yellow-600 mb-3 flex items-center gap-2">
                            <Edit className="h-4 w-4" /> Empresas a actualizar ({para_actualizar.length})
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-auto">
                            {para_actualizar.map((emp, i) => (
                                <div key={i} className="text-sm p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                                    <div className="font-mono font-medium mb-2">{emp.codigoalfa}</div>
                                    {emp.diferencias.map((diff, j) => (
                                        <div key={j} className="text-xs ml-2">
                                            <span className="font-medium">{diff.campo}:</span>{' '}
                                            <span className="line-through text-red-600">{diff.valor_actual || 'NULL'}</span>{' '}
                                            →{' '}
                                            <span className="text-green-600">{diff.valor_nuevo || 'NULL'}</span>
                                        </div>
                                    ))}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {para_eliminar.length === 0 && para_agregar.length === 0 && para_actualizar.length === 0 && (
                    <div className="text-center text-gray-500 py-8">No hay cambios en empresas</div>
                )}
            </div>
        );
    };

    // Tab: Vehículos
    const VehiculosTab = () => {
        if (!comparacion) return null;
        const { para_agregar, para_eliminar } = comparacion.vehiculos;
        
        if (para_agregar.length === 0 && para_eliminar.length === 0) {
            return <div className="text-center text-gray-500 py-8">No hay cambios en vehículos</div>;
        }
        
        return (
            <div className="space-y-6">
                {para_eliminar.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                            <Trash2 className="h-4 w-4" /> Vehículos a eliminar ({para_eliminar.length})
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-auto">
                            {para_eliminar.map((veh, i) => (
                                <div key={i} className="text-sm p-3 bg-red-50 rounded-lg border border-red-200">
                                    <div className="font-mono font-medium">{veh.codigoalfa}</div>
                                    <div className="text-gray-600">{veh.avl_patente || 'Sin patente'}</div>
                                    <div className="text-xs text-gray-500 mt-1">{veh.nombre_mix || veh.motivo}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {para_agregar.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Vehículos a agregar ({para_agregar.length})
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-auto">
                            {para_agregar.map((veh, i) => (
                                <div key={i} className="text-sm p-3 bg-green-50 rounded-lg border border-green-200">
                                    <div className="font-mono font-medium">{veh.codigoalfa}</div>
                                    <div className="text-gray-600">{veh.avl_patente || 'Sin patente'}</div>
                                    <div className="text-xs text-gray-500">{veh.avl_marca} {veh.avl_modelo}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Tab: Accesorios
    const AccesoriosTab = () => {
        if (!comparacion) return null;
        const { para_agregar, para_eliminar } = comparacion.accesorios;
        
        if (para_agregar.length === 0 && para_eliminar.length === 0) {
            return <div className="text-center text-gray-500 py-8">No hay cambios en accesorios</div>;
        }
        
        return (
            <div className="space-y-6">
                {para_eliminar.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                            <Trash2 className="h-4 w-4" /> Accesorios a eliminar ({para_eliminar.length})
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-auto">
                            {para_eliminar.map((acc, i) => (
                                <div key={i} className="text-sm p-3 bg-red-50 rounded-lg border border-red-200">
                                    <div className="font-mono font-medium">{acc.codigoalfa}</div>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {acc.enganche === 1 && <Badge className="bg-blue-100 text-blue-800">Enganche</Badge>}
                                        {acc.panico === 1 && <Badge className="bg-red-100 text-red-800">Pánico</Badge>}
                                        {acc.cabina === 1 && <Badge className="bg-green-100 text-green-800">Cabina</Badge>}
                                        {acc.carga === 1 && <Badge className="bg-yellow-100 text-yellow-800">Carga</Badge>}
                                        {acc.corte === 1 && <Badge className="bg-purple-100 text-purple-800">Corte</Badge>}
                                        {acc.antivandalico === 1 && <Badge className="bg-orange-100 text-orange-800">Antivandalico</Badge>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {para_agregar.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Accesorios a agregar ({para_agregar.length})
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-auto">
                            {para_agregar.map((acc, i) => (
                                <div key={i} className="text-sm p-3 bg-green-50 rounded-lg border border-green-200">
                                    <div className="font-mono font-medium">{acc.codigoalfa}</div>
                                    <div className="flex flex-wrap gap-2 mt-1">
                                        {acc.enganche === 1 && <Badge className="bg-blue-100 text-blue-800">Enganche</Badge>}
                                        {acc.panico === 1 && <Badge className="bg-red-100 text-red-800">Pánico</Badge>}
                                        {acc.cabina === 1 && <Badge className="bg-green-100 text-green-800">Cabina</Badge>}
                                        {acc.carga === 1 && <Badge className="bg-yellow-100 text-yellow-800">Carga</Badge>}
                                        {acc.corte === 1 && <Badge className="bg-purple-100 text-purple-800">Corte</Badge>}
                                        {acc.antivandalico === 1 && <Badge className="bg-orange-100 text-orange-800">Antivandalico</Badge>}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    // Tab: Abonos
    const AbonosTab = () => {
        if (!comparacion) return null;
        const { para_agregar, para_eliminar } = comparacion.abonos;
        
        if (para_agregar.length === 0 && para_eliminar.length === 0) {
            return <div className="text-center text-gray-500 py-8">No hay cambios en abonos</div>;
        }
        
        return (
            <div className="space-y-6">
                {para_eliminar.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-red-600 mb-3 flex items-center gap-2">
                            <Trash2 className="h-4 w-4" /> Abonos a eliminar ({para_eliminar.length})
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-auto">
                            {para_eliminar.map((abo, i) => (
                                <div key={i} className="text-sm p-3 bg-red-50 rounded-lg border border-red-200">
                                    <div className="font-mono font-medium">{abo.codigoalfa}</div>
                                    <div className="text-gray-600">{abo.abono_nombre || abo.abono_codigo}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
                
                {para_agregar.length > 0 && (
                    <div>
                        <h3 className="font-semibold text-green-600 mb-3 flex items-center gap-2">
                            <Plus className="h-4 w-4" /> Abonos a agregar ({para_agregar.length})
                        </h3>
                        <div className="space-y-2 max-h-96 overflow-auto">
                            {para_agregar.map((abo, i) => (
                                <div key={i} className="text-sm p-3 bg-green-50 rounded-lg border border-green-200">
                                    <div className="font-mono font-medium">{abo.codigoalfa}</div>
                                    <div className="text-gray-600">{abo.abono_nombre || abo.abono_codigo}</div>
                                    {abo.abono_precio && (
                                        <div className="text-xs text-gray-500 mt-1">Precio: ${abo.abono_precio}</div>
                                    )}
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        );
    };

    const tabItems = [
        { id: 'resumen', label: 'Resumen', icon: <FileText className="h-4 w-4" />, content: <ResumenTab /> },
        { id: 'empresas', label: `Empresas`, icon: <Building className="h-4 w-4" />, content: <EmpresasTab /> },
        { id: 'vehiculos', label: `Vehículos`, icon: <Car className="h-4 w-4" />, content: <VehiculosTab /> },
        { id: 'accesorios', label: `Accesorios`, icon: <Package className="h-4 w-4" />, content: <AccesoriosTab /> },
        { id: 'abonos', label: `Abonos`, icon: <FileText className="h-4 w-4" />, content: <AbonosTab /> },
    ];

    return (
        <AppLayout title="Gestión Admin">
            <div className="p-6">
                <h1 className="text-2xl font-bold mb-2">Gestión Admin</h1>
                <p className="text-gray-600 mb-6">Carga y sincronización de datos desde archivo Excel</p>
                
                {error && (
                    <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-lg">{error}</div>
                )}
                
                {/* Panel 1: Carga de archivo */}
                <Card className="mb-6">
                    <CardHeader>
                        <CardTitle>1. Cargar Archivo CSV</CardTitle>
                    </CardHeader>
                    <CardContent>
                        <div className="flex flex-col sm:flex-row gap-4">
                            <div className="flex-1">
                                <input 
                                    type="file" 
                                    accept=".csv,.txt" 
                                    onChange={(e) => setArchivo(e.target.files?.[0] || null)}
                                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                    disabled={cargando}
                                />
                                <p className="text-xs text-gray-400 mt-1">CSV con separador punto y coma (;)</p>
                            </div>
                            <Button onClick={handleCargar} disabled={!archivo || cargando} className="bg-sat whitespace-nowrap">
                                {cargando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Package className="mr-2 h-4 w-4" />}
                                Cargar Archivo
                            </Button>
                        </div>
                        
                        {totalEmpresas > 0 && (
                            <div className="mt-4 grid grid-cols-2 md:grid-cols-4 gap-3">
                                <div className="p-3 bg-blue-50 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-blue-600">{totalEmpresas}</div>
                                    <div className="text-xs text-gray-600">Empresas</div>
                                </div>
                                <div className="p-3 bg-green-50 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-green-600">{totalVehiculos}</div>
                                    <div className="text-xs text-gray-600">Vehículos</div>
                                </div>
                                <div className="p-3 bg-purple-50 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-purple-600">{totalAccesorios}</div>
                                    <div className="text-xs text-gray-600">Accesorios</div>
                                </div>
                                <div className="p-3 bg-orange-50 rounded-lg text-center">
                                    <div className="text-2xl font-bold text-orange-600">{totalAbonos}</div>
                                    <div className="text-xs text-gray-600">Abonos</div>
                                </div>
                            </div>
                        )}
                    </CardContent>
                </Card>

                {/* Panel 2: Comparación */}
                {totalEmpresas > 0 && (
                    <Card className="mb-6">
                        <CardHeader>
                            <CardTitle>2. Comparar con Base de Datos</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Button onClick={handleComparar} disabled={comparando} variant="outline">
                                {comparando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <FileText className="mr-2 h-4 w-4" />}
                                Comparar
                            </Button>
                        </CardContent>
                    </Card>
                )}

                {/* Panel 3: Resultados */}
                {comparacion && (
                    <Card>
                        <CardHeader>
                            <CardTitle>3. Resultados de la Comparación</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <Tabs items={tabItems} defaultTab="resumen" />
                            
                            <div className="mt-6 pt-4 border-t flex justify-end">
                                <Button 
                                    onClick={handleAplicarCambios} 
                                    disabled={aplicando}
                                    className="bg-green-600 hover:bg-green-700"
                                >
                                    {aplicando ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Plus className="mr-2 h-4 w-4" />}
                                    Aplicar Todos los Cambios
                                </Button>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>
        </AppLayout>
    );
}