// resources/js/components/contratos/sections/MetodoPagoSection.tsx
import { CreditCard, Landmark, XCircle } from 'lucide-react';
import React from 'react';

interface Props {
    metodoPago: 'cbu' | 'tarjeta' | null;
    setMetodoPago: (metodo: 'cbu' | 'tarjeta' | null) => void;
    datosCbu: {
        nombre_banco: string;
        cbu: string;
        alias_cbu: string;
        titular_cuenta: string;
        tipo_cuenta: string;
    };
    setDatosCbu: (datos: any) => void;
    datosTarjeta: {
        tarjeta_emisor: string;
        tarjeta_expiracion: string;
        tarjeta_numero: string;
        tarjeta_codigo: string;
        tarjeta_banco: string;
        titular_tarjeta: string;
        tipo_tarjeta: string;
    };
    setDatosTarjeta: (datos: any) => void;
}

// Valores iniciales para reset
const INITIAL_CBU = {
    nombre_banco: '',
    cbu: '',
    alias_cbu: '',
    titular_cuenta: '',
    tipo_cuenta: 'caja_ahorro'
};

const INITIAL_TARJETA = {
    tarjeta_emisor: '',
    tarjeta_expiracion: '',
    tarjeta_numero: '',
    tarjeta_codigo: '',
    tarjeta_banco: '',
    titular_tarjeta: '',
    tipo_tarjeta: 'debito'
};

export default function MetodoPagoSection({
    metodoPago,
    setMetodoPago,
    datosCbu,
    setDatosCbu,
    datosTarjeta,
    setDatosTarjeta,
}: Props) {
    
    const handleMetodoClick = (metodo: 'cbu' | 'tarjeta') => {
        if (metodoPago === metodo) {
            // Si ya está seleccionado, lo deseleccionamos y reseteamos los datos
            setMetodoPago(null);
            setDatosCbu(INITIAL_CBU);
            setDatosTarjeta(INITIAL_TARJETA);
        } else {
            // Seleccionamos el nuevo método
            setMetodoPago(metodo);
            // Opcional: resetear el otro método para mantener limpieza
            if (metodo === 'cbu') {
                setDatosTarjeta(INITIAL_TARJETA);
            } else {
                setDatosCbu(INITIAL_CBU);
            }
        }
    };

    return (
        <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
            <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                <h3 className="font-medium text-gray-900 flex items-center gap-2">
                    <CreditCard className="h-4 w-4 text-green-600" />
                    Método de Pago
                </h3>
            </div>
            
            <div className="p-4">
                {/* Selector de método */}
                <div className="grid grid-cols-2 gap-3 mb-4">
                    <button
                        type="button"
                        onClick={() => handleMetodoClick('cbu')}
                        className={`p-3 border rounded-lg flex items-center gap-3 transition-colors ${
                            metodoPago === 'cbu' 
                                ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        <Landmark className={`h-5 w-5 ${metodoPago === 'cbu' ? 'text-green-600' : 'text-gray-400'}`} />
                        <div className="text-left flex-1">
                            <p className="text-sm font-medium">CBU</p>
                            <p className="text-xs text-gray-500">Débito automático por CBU</p>
                        </div>
                        {metodoPago === 'cbu' && (
                            <XCircle className="h-4 w-4 text-gray-400 hover:text-red-500" />
                        )}
                    </button>
                    
                    <button
                        type="button"
                        onClick={() => handleMetodoClick('tarjeta')}
                        className={`p-3 border rounded-lg flex items-center gap-3 transition-colors ${
                            metodoPago === 'tarjeta' 
                                ? 'border-green-500 bg-green-50 ring-2 ring-green-200' 
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                        }`}
                    >
                        <CreditCard className={`h-5 w-5 ${metodoPago === 'tarjeta' ? 'text-green-600' : 'text-gray-400'}`} />
                        <div className="text-left flex-1">
                            <p className="text-sm font-medium">Tarjeta</p>
                            <p className="text-xs text-gray-500">Débito o crédito</p>
                        </div>
                        {metodoPago === 'tarjeta' && (
                            <XCircle className="h-4 w-4 text-gray-400 hover:text-red-500" />
                        )}
                    </button>
                </div>

                {/* Mensaje cuando no hay método seleccionado */}
                {!metodoPago && (
                    <div className="text-center py-6 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
                        <CreditCard className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-sm text-gray-500 mb-1">No hay método de pago seleccionado</p>
                        <p className="text-xs text-gray-400">
                            Seleccione CBU o Tarjeta para agregar datos de pago
                        </p>
                    </div>
                )}

                {/* Formulario CBU */}
                {metodoPago === 'cbu' && (
                    <div className="space-y-3 border-t pt-4 animate-fadeIn">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium">Datos de la cuenta</h4>
                            <button
                                type="button"
                                onClick={() => {
                                    setMetodoPago(null);
                                    setDatosCbu(INITIAL_CBU);
                                }}
                                className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
                            >
                                <XCircle className="h-3 w-3" />
                                Cancelar
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            {/* ... resto del formulario CBU igual ... */}
                            <div className="col-span-2">
                                <label className="block text-xs text-gray-600 mb-1">
                                    Banco <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={datosCbu.nombre_banco}
                                    onChange={(e) => setDatosCbu({...datosCbu, nombre_banco: e.target.value})}
                                    maxLength={100}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                    placeholder="Ej: Banco Galicia, Banco Frances, etc."
                                    required
                                />
                            </div>
                            
                            <div className="col-span-2">
                                <label className="block text-xs text-gray-600 mb-1">
                                    CBU <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={datosCbu.cbu}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        if (value.length <= 22) {
                                            setDatosCbu({...datosCbu, cbu: value});
                                        }
                                    }}
                                    maxLength={22}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                    placeholder="00000000000000000000"
                                    required
                                />
                            </div>
                            
                            <div className="col-span-2">
                                <label className="block text-xs text-gray-600 mb-1">
                                    Alias
                                </label>
                                <input
                                    type="text"
                                    value={datosCbu.alias_cbu}
                                    onChange={(e) => setDatosCbu({...datosCbu, alias_cbu: e.target.value})}
                                    maxLength={50}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                    placeholder="ALIAS.CBU.BANCO"
                                />
                            </div>
                            
                            <div className="col-span-2">
                                <label className="block text-xs text-gray-600 mb-1">
                                    Titular de la cuenta <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={datosCbu.titular_cuenta}
                                    onChange={(e) => setDatosCbu({...datosCbu, titular_cuenta: e.target.value})}
                                    maxLength={200}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                    placeholder="Nombre completo del titular"
                                    required
                                />
                            </div>
                            
                            <div className="col-span-2">
                                <label className="block text-xs text-gray-600 mb-1">
                                    Tipo de cuenta <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={datosCbu.tipo_cuenta}
                                    onChange={(e) => setDatosCbu({...datosCbu, tipo_cuenta: e.target.value})}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                    required
                                >
                                    <option value="caja_ahorro">Caja de ahorro</option>
                                    <option value="cuenta_corriente">Cuenta corriente</option>
                                </select>
                            </div>
                        </div>
                    </div>
                )}

                {/* Formulario Tarjeta */}
                {metodoPago === 'tarjeta' && (
                    <div className="space-y-3 border-t pt-4 animate-fadeIn">
                        <div className="flex items-center justify-between mb-3">
                            <h4 className="text-sm font-medium">Datos de la tarjeta</h4>
                            <button
                                type="button"
                                onClick={() => {
                                    setMetodoPago(null);
                                    setDatosTarjeta(INITIAL_TARJETA);
                                }}
                                className="text-xs text-gray-500 hover:text-red-600 flex items-center gap-1"
                            >
                                <XCircle className="h-3 w-3" />
                                Cancelar
                            </button>
                        </div>
                        
                        <div className="grid grid-cols-2 gap-3">
                            {/* ... resto del formulario Tarjeta igual ... */}
                            <div className="col-span-2">
                                <label className="block text-xs text-gray-600 mb-1">
                                    Banco emisor <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={datosTarjeta.tarjeta_banco}
                                    onChange={(e) => setDatosTarjeta({...datosTarjeta, tarjeta_banco: e.target.value})}
                                    maxLength={100}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                    placeholder="Ej: Banco Galicia, Banco Santander, etc."
                                    required
                                />
                            </div>
                            
                            <div className="col-span-2">
                                <label className="block text-xs text-gray-600 mb-1">
                                    Número de tarjeta <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={datosTarjeta.tarjeta_numero}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/[^0-9]/g, '');
                                        const formateado = value.replace(/(\d{4})(?=\d)/g, '$1 ');
                                        if (value.length <= 16) {
                                            setDatosTarjeta({...datosTarjeta, tarjeta_numero: formateado});
                                        }
                                    }}
                                    maxLength={19}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                    placeholder="**** **** **** 1234"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">
                                    Emisor <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={datosTarjeta.tarjeta_emisor}
                                    onChange={(e) => setDatosTarjeta({...datosTarjeta, tarjeta_emisor: e.target.value})}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                    required
                                >
                                    <option value="">Seleccionar</option>
                                    <option value="Visa">Visa</option>
                                    <option value="Mastercard">Mastercard</option>
                                    <option value="American Express">American Express</option>
                                    <option value="Cabal">Cabal</option>
                                    <option value="Naranja">Naranja</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">
                                    Tipo <span className="text-red-500">*</span>
                                </label>
                                <select
                                    value={datosTarjeta.tipo_tarjeta}
                                    onChange={(e) => setDatosTarjeta({...datosTarjeta, tipo_tarjeta: e.target.value})}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                    required
                                >
                                    <option value="debito">Débito</option>
                                    <option value="credito">Crédito</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">
                                    Vencimiento <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={datosTarjeta.tarjeta_expiracion}
                                    onChange={(e) => {
                                        let value = e.target.value.replace(/\D/g, '');
                                        if (value.length <= 4) {
                                            if (value.length > 2) {
                                                value = value.substring(0, 2) + '/' + value.substring(2, 4);
                                            }
                                            setDatosTarjeta({...datosTarjeta, tarjeta_expiracion: value});
                                        }
                                    }}
                                    maxLength={5}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                    placeholder="MM/AA"
                                    required
                                />
                            </div>
                            
                            <div>
                                <label className="block text-xs text-gray-600 mb-1">
                                    CVV <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="password"
                                    value={datosTarjeta.tarjeta_codigo}
                                    onChange={(e) => {
                                        const value = e.target.value.replace(/\D/g, '');
                                        if (value.length <= 4) {
                                            setDatosTarjeta({...datosTarjeta, tarjeta_codigo: value});
                                        }
                                    }}
                                    maxLength={4}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                    placeholder="***"
                                    required
                                />
                            </div>
                            
                            <div className="col-span-2">
                                <label className="block text-xs text-gray-600 mb-1">
                                    Titular de la tarjeta <span className="text-red-500">*</span>
                                </label>
                                <input
                                    type="text"
                                    value={datosTarjeta.titular_tarjeta}
                                    onChange={(e) => setDatosTarjeta({...datosTarjeta, titular_tarjeta: e.target.value})}
                                    maxLength={200}
                                    className="w-full px-2 py-1.5 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-green-500 focus:border-green-500"
                                    placeholder="Nombre como figura en la tarjeta"
                                    required
                                />
                            </div>
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-2">
                            Los datos de la tarjeta se almacenan de forma segura y encriptada.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}