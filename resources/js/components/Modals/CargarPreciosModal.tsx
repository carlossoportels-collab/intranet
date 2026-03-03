// resources/js/Components/Modals/CargarPreciosModal.tsx
import axios from 'axios';
import { Download, X, Upload, AlertCircle, CheckCircle, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import React, { useState, useRef } from 'react';

interface PrevisualizacionItem {
    codigopro: string;
    nombre: string;
    precio_actual: number;
    precio_nuevo: number;
    diferencia: number;
    diferencia_porcentaje: number;
    total_instancias: number;
}


interface CargarPreciosModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess?: () => void;
}

export default function CargarPreciosModal({ isOpen, onClose, onSuccess }: CargarPreciosModalProps) {
    const [archivo, setArchivo] = useState<File | null>(null);
    const [cargando, setCargando] = useState(false);
    const [paso, setPaso] = useState<'seleccion' | 'preview' | 'resultado'>('seleccion');
    const [resultado, setResultado] = useState<any>(null);
    const [error, setError] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    if (!isOpen) return null;

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setArchivo(e.target.files[0]);
            setError(null);
        }
    };

    const handleProcesar = async () => {
        if (!archivo) {
            setError('Debe seleccionar un archivo');
            return;
        }

        const formData = new FormData();
        formData.append('archivo', archivo);

        setCargando(true);
        setError(null);

        try {
            const response = await axios.post('/config/tarifas/procesar-archivo', formData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });

            setResultado(response.data);
            
            if (response.data.requiere_confirmacion) {
                setPaso('preview');
            } else {
                setPaso('resultado');
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al procesar el archivo');
        } finally {
            setCargando(false);
        }
    };

    const handleConfirmar = async () => {
        setCargando(true);
        setError(null);

        try {
            const response = await axios.post('/config/tarifas/confirmar-actualizacion');
            
            setResultado(response.data);
            setPaso('resultado');
            
            if (onSuccess) {
                onSuccess();
            }
        } catch (err: any) {
            setError(err.response?.data?.error || 'Error al confirmar la actualización');
        } finally {
            setCargando(false);
        }
    };

    const resetModal = () => {
        setArchivo(null);
        setPaso('seleccion');
        setResultado(null);
        setError(null);
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    };

    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('es-AR', {
            style: 'currency',
            currency: 'ARS',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(amount);
    };

    const getDiferenciaColor = (diferencia: number) => {
        if (diferencia > 0) return 'text-green-600';
        if (diferencia < 0) return 'text-red-600';
        return 'text-gray-600';
    };

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-[99990]" onClick={onClose} />
            
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[99999] pointer-events-none">
                <div className="bg-white rounded-lg shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-hidden animate-fadeIn pointer-events-auto">
                    {/* Header */}
                    <div className="flex items-center justify-between p-6 border-b border-gray-200">
                        <div className="flex items-center gap-3">
                            <div className="p-2 bg-blue-100 rounded-lg">
                                <Upload className="h-6 w-6 text-blue-600" />
                            </div>
                            <div>
                                <h2 className="text-xl font-semibold text-gray-900">
                                    Cargar Precios
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    {paso === 'seleccion' && 'Seleccione un archivo Excel con los nuevos precios'}
                                    {paso === 'preview' && 'Revise los cambios antes de confirmar'}
                                    {paso === 'resultado' && 'Resultado de la carga'}
                                </p>
                            </div>
                        </div>
                        <button
                            onClick={() => {
                                resetModal();
                                onClose();
                            }}
                            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Body */}
                    <div className="p-6 overflow-y-auto max-h-[calc(90vh-140px)]">
                        {error && (
                            <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start gap-3">
                                <AlertCircle className="h-5 w-5 text-red-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h3 className="font-medium text-red-800">Error</h3>
                                    <p className="text-sm text-red-700 mt-1">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Paso 1: Selección de archivo */}
                        {paso === 'seleccion' && (
                            <div className="space-y-4">
                                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                                    <div className="flex items-start gap-3">
                                        <FileSpreadsheet className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h3 className="font-medium text-blue-800">Formato requerido</h3>
                                            <p className="text-sm text-blue-700 mt-1">
                                                El archivo debe contener las columnas:
                                            </p>
                                            <ul className="list-disc list-inside text-sm text-blue-700 mt-2">
                                                <li><span className="font-medium">CODIGOPRO</span> - Código del producto</li>
                                                <li><span className="font-medium">PRECIO1</span> - Precio nuevo</li>
                                            </ul>
                                        </div>
                                    </div>
                                </div>

                                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-sat transition-colors">
                                    <input
                                        type="file"
                                        ref={fileInputRef}
                                        onChange={handleFileChange}
                                        accept=".xlsx,.xls"
                                        className="hidden"
                                        id="file-upload"
                                    />
                                    <label
                                        htmlFor="file-upload"
                                        className="cursor-pointer"
                                    >
                                        <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                                        <p className="text-gray-700 mb-2">
                                            {archivo ? archivo.name : 'Haga clic para seleccionar un archivo'}
                                        </p>
                                        <p className="text-sm text-gray-500">
                                            Formatos aceptados: .xlsx, .xls (máx 10MB)
                                        </p>
                                    </label>
                                </div>
                            </div>
                        )}

                        {/* Paso 2: Previsualización */}
                        {paso === 'preview' && resultado && (
                            <div className="space-y-4">
                                {/* Resumen */}
                                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                                    <div className="flex items-start gap-3">
                                        <AlertTriangle className="h-5 w-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                                        <div>
                                            <h3 className="font-medium text-yellow-800">
                                                Se encontraron {resultado.productos_a_actualizar} productos con cambios
                                            </h3>
                                            <p className="text-sm text-yellow-700 mt-1">
                                                Revise los cambios antes de confirmar la actualización.
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Estadísticas */}
                                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                                        <p className="text-xs text-gray-500">Total en BD</p>
                                        <p className="text-xl font-bold text-gray-900">{resultado.total_en_bd}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                                        <p className="text-xs text-gray-500">En archivo</p>
                                        <p className="text-xl font-bold text-gray-900">{resultado.productos_en_archivo}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                                        <p className="text-xs text-gray-500">A actualizar</p>
                                        <p className="text-xl font-bold text-yellow-600">{resultado.productos_a_actualizar}</p>
                                    </div>
                                    <div className="bg-gray-50 p-3 rounded-lg text-center">
                                        <p className="text-xs text-gray-500">Sin cambios</p>
                                        <p className="text-xl font-bold text-green-600">{resultado.productos_sin_cambio}</p>
                                    </div>
                                </div>

                                {/* Productos no encontrados en archivo */}
                                {resultado.productos_no_en_archivo > 0 && (
                                    <div className="bg-blue-50 p-3 rounded-lg border border-blue-200">
                                        <div className="flex items-start gap-3">
                                            <AlertCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h4 className="font-medium text-blue-800">
                                                    {resultado.productos_no_en_archivo} productos no están en el archivo
                                                </h4>
                                                <p className="text-sm text-blue-700">
                                                    Estos productos mantendrán su precio actual (no se modificarán).
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {/* Previsualización de cambios */}
                                {resultado.previews && resultado.previews.length > 0 && (
                                    <div>
                                        <h3 className="font-medium text-gray-900 mb-3">Primeros {resultado.previews.length} cambios</h3>
                                        <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-lg p-2">
                                            {resultado.previews.map((item: PrevisualizacionItem, index: number) => (
                                                <div key={index} className="flex items-center justify-between p-2 hover:bg-gray-50 rounded">
                                                    <div className="flex-1">
                                                        <div className="font-medium text-sm">{item.codigopro}</div>
                                                        <div className="text-xs text-gray-500 truncate">{item.nombre}</div>
                                                        {item.total_instancias > 1 && (
                                                            <div className="text-xs text-blue-600 mt-1">
                                                                {item.total_instancias} productos con este código
                                                            </div>
                                                        )}
                                                    </div>
                                                    <div className="text-right">
                                                        <div className="text-sm line-through text-gray-400">
                                                            {formatCurrency(item.precio_actual)}
                                                        </div>
                                                        <div className={`text-sm font-bold ${getDiferenciaColor(item.diferencia)}`}>
                                                            {formatCurrency(item.precio_nuevo)}
                                                            <span className="text-xs ml-1">
                                                                ({item.diferencia_porcentaje > 0 ? '+' : ''}{item.diferencia_porcentaje}%)
                                                            </span>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {/* Productos no encontrados */}
                                {resultado.productos_no_encontrados && resultado.productos_no_encontrados.length > 0 && (
                                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200">
                                        <h4 className="font-medium text-orange-800 mb-2">
                                            {resultado.productos_no_encontrados.length} productos no encontrados
                                        </h4>
                                        <div className="text-sm text-orange-700 max-h-20 overflow-y-auto">
                                            {resultado.productos_no_encontrados.join(', ')}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                        {/* Paso 3: Resultado */}
                        {paso === 'resultado' && resultado && (
                            <div className="space-y-4">
                                {resultado.success ? (
                                    <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                                        <div className="flex items-start gap-3">
                                            <CheckCircle className="h-5 w-5 text-green-600 flex-shrink-0 mt-0.5" />
                                            <div>
                                                <h3 className="font-medium text-green-800">¡Actualización exitosa!</h3>
                                                <p className="text-sm text-green-700 mt-1">{resultado.mensaje}</p>
                                            </div>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
                                        <h3 className="font-medium text-gray-900 mb-2">Resumen del procesamiento</h3>
                                        <div className="space-y-2 text-sm">
                                            <p>Total productos procesados: <span className="font-bold">{resultado.total_procesados}</span></p>
                                            <p>Productos encontrados: <span className="font-bold">{resultado.productos_encontrados}</span></p>
                                            <p>Productos sin cambios: <span className="font-bold">{resultado.productos_sin_cambio}</span></p>
                                            {resultado.productos_no_encontrados && resultado.productos_no_encontrados.length > 0 && (
                                                <p>Productos no encontrados: <span className="font-bold">{resultado.productos_no_encontrados.length}</span></p>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 p-6 border-t border-gray-200">
                        {paso === 'seleccion' && (
                            <>
                                <button
                                    onClick={() => {
                                        resetModal();
                                        onClose();
                                    }}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Cancelar
                                </button>
                                <button
                                    onClick={handleProcesar}
                                    disabled={!archivo || cargando}
                                    className={`px-4 py-2 rounded-md text-sm font-medium text-white flex items-center gap-2 ${
                                        !archivo || cargando
                                            ? 'bg-gray-300 cursor-not-allowed'
                                            : 'bg-sat hover:bg-sat-600'
                                    }`}
                                >
                                    {cargando ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                            Procesando...
                                        </>
                                    ) : (
                                        <>
                                            <Upload className="h-4 w-4" />
                                            Procesar archivo
                                        </>
                                    )}
                                </button>
                            </>
                        )}

                        {paso === 'preview' && (
                            <>
                                <button
                                    onClick={() => setPaso('seleccion')}
                                    className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50"
                                >
                                    Volver
                                </button>
                                <button
                                    onClick={handleConfirmar}
                                    disabled={cargando}
                                    className={`px-4 py-2 rounded-md text-sm font-medium text-white flex items-center gap-2 ${
                                        cargando
                                            ? 'bg-gray-300 cursor-not-allowed'
                                            : 'bg-green-600 hover:bg-green-700'
                                    }`}
                                >
                                    {cargando ? (
                                        <>
                                            <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                                            Actualizando...
                                        </>
                                    ) : (
                                        <>
                                            <CheckCircle className="h-4 w-4" />
                                            Confirmar actualización
                                        </>
                                    )}
                                </button>
                            </>
                        )}

                        {paso === 'resultado' && (
                            <button
                                onClick={() => {
                                    resetModal();
                                    onClose();
                                }}
                                className="px-4 py-2 bg-sat text-white rounded-md text-sm font-medium hover:bg-sat-600"
                            >
                                Cerrar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}