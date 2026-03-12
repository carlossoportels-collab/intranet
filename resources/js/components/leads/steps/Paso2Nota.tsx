// resources/js/components/leads/steps/Paso2Nota.tsx
import React from 'react';
import { Check } from 'lucide-react';

interface Paso2NotaProps {
    formData: any;
    handleChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => void;
    isSubmitting: boolean;
    onSubmit: (conNota: boolean) => void;
}

export default function Paso2Nota({
    formData,
    handleChange,
    isSubmitting,
    onSubmit
}: Paso2NotaProps) {
    return (
        <div>
            <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-start gap-3">
                    <Check className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                        <h3 className="font-medium text-blue-900">
                            Información básica del lead guardada
                        </h3>
                        <p className="text-sm text-blue-700 mt-1">
                            ¿Desea agregar una nota inicial al lead? (Opcional)
                        </p>
                    </div>
                </div>
            </div>

            <div className="space-y-6">
                <div className="space-y-2">
                    <label htmlFor="tipo_nota" className="block text-sm font-medium text-gray-700">
                        Tipo de nota
                    </label>
                    <select
                        id="tipo_nota"
                        name="tipo_nota"
                        value={formData.tipo_nota}
                        onChange={handleChange}
                        className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-sat focus:border-sat rounded-md"
                    >
                        <option value="observacion_inicial">Observación inicial</option>
                        <option value="informacion_cliente">Información del cliente</option>
                        <option value="detalle_contacto">Detalle del contacto</option>
                    </select>
                </div>

                <div className="space-y-2">
                    <label htmlFor="observacion" className="block text-sm font-medium text-gray-700">
                        Observación
                    </label>
                    <textarea
                        id="observacion"
                        name="observacion"
                        value={formData.observacion}
                        onChange={handleChange}
                        placeholder="Escriba aquí cualquier información relevante sobre el lead..."
                        rows={4}
                        className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm py-2 px-3 focus:outline-none focus:ring-sat focus:border-sat"
                    />
                    <p className="text-xs text-gray-500">
                        Esta nota quedará registrada en el historial del lead
                    </p>
                </div>
            </div>

            {/* Botones del paso 2 */}
            <div className="flex justify-end gap-3 mt-8 pt-6 border-t border-gray-200">
                <button
                    type="button"
                    onClick={() => onSubmit(false)}
                    disabled={isSubmitting}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-gray-600 hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 disabled:opacity-50"
                >
                    {isSubmitting ? 'Procesando...' : 'Finalizar sin nota'}
                </button>
                <button
                    type="button"
                    onClick={() => onSubmit(true)}
                    disabled={isSubmitting || !formData.observacion.trim()}
                    className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-sat hover:bg-sat-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-sat disabled:opacity-50"
                >
                    {isSubmitting ? 'Procesando...' : 'Guardar y agregar nota'}
                </button>
            </div>
        </div>
    );
}