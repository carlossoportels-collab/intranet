// resources/js/components/ui/ConfirmDialog.tsx
import { X, AlertTriangle } from 'lucide-react';
import React from 'react';

interface ConfirmDialogProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message?: string;  // ✅ Hacer opcional
    confirmText?: string;
    cancelText?: string;
    type?: 'danger' | 'warning' | 'info';
    size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
    children?: React.ReactNode;  // ✅ Agregar children
    isLoading?: boolean;  // ✅ Estado de carga
}

const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-[90vw] w-full'
};

const ConfirmDialog: React.FC<ConfirmDialogProps> = ({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    type = 'danger',
    size = 'md',
    children,
    isLoading = false
}) => {
    if (!isOpen) return null;

    const getTypeStyles = () => {
        switch (type) {
            case 'danger':
                return {
                    icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
                    iconBg: 'bg-red-100',
                    confirmBg: 'bg-red-600 hover:bg-red-700',
                    confirmFocus: 'focus:ring-red-500'
                };
            case 'warning':
                return {
                    icon: <AlertTriangle className="h-6 w-6 text-yellow-600" />,
                    iconBg: 'bg-yellow-100',
                    confirmBg: 'bg-yellow-600 hover:bg-yellow-700',
                    confirmFocus: 'focus:ring-yellow-500'
                };
            case 'info':
                return {
                    icon: <AlertTriangle className="h-6 w-6 text-blue-600" />,
                    iconBg: 'bg-blue-100',
                    confirmBg: 'bg-blue-600 hover:bg-blue-700',
                    confirmFocus: 'focus:ring-blue-500'
                };
            default:
                return {
                    icon: <AlertTriangle className="h-6 w-6 text-red-600" />,
                    iconBg: 'bg-red-100',
                    confirmBg: 'bg-red-600 hover:bg-red-700',
                    confirmFocus: 'focus:ring-red-500'
                };
        }
    };

    const styles = getTypeStyles();

    return (
        <>
            <div className="fixed inset-0 bg-black/60 z-[99990] animate-in fade-in duration-200" onClick={onClose} />
            
            <div className="fixed inset-0 flex items-center justify-center p-4 z-[99999] pointer-events-none">
                <div className={`bg-white rounded-lg shadow-2xl ${sizeClasses[size]} max-h-[90vh] flex flex-col animate-in fade-in-0 zoom-in-95 duration-200 pointer-events-auto`}>
                    {/* Header */}
                    <div className="flex items-center justify-between p-4 border-b border-gray-200 shrink-0">
                        <div className="flex items-center gap-3">
                            <div className={`p-2 ${styles.iconBg} rounded-full`}>
                                {styles.icon}
                            </div>
                            <h3 className="text-lg font-semibold text-gray-900">
                                {title}
                            </h3>
                        </div>
                        <button
                            onClick={onClose}
                            className="p-1 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition-colors"
                        >
                            <X className="h-5 w-5" />
                        </button>
                    </div>

                    {/* Body - con scroll si es necesario */}
                    <div className="flex-1 overflow-y-auto p-4">
                        {message && <p className="text-gray-600">{message}</p>}
                        {children}
                    </div>

                    {/* Footer */}
                    <div className="flex justify-end gap-3 p-4 border-t border-gray-200 bg-gray-50 shrink-0">
                        <button
                            onClick={onClose}
                            disabled={isLoading}
                            className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors disabled:opacity-50"
                        >
                            {cancelText}
                        </button>
                        <button
                            onClick={onConfirm}
                            disabled={isLoading}
                            className={`px-4 py-2 rounded-md text-sm font-medium text-white transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 ${styles.confirmBg} ${styles.confirmFocus}`}
                        >
                            {isLoading ? 'Procesando...' : confirmText}
                        </button>
                    </div>
                </div>
            </div>
        </>
    );
};

export default ConfirmDialog;