// resources/js/components/ui/Toast.tsx
import { X, CheckCircle, XCircle, Info, AlertCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
    onClose?: () => void;
    showClose?: boolean;
}

const Toast: React.FC<ToastProps> = ({
    message,
    type = 'success',
    duration = 3000,
    position = 'top-center',
    onClose,
    showClose = true
}) => {
    const [isVisible, setIsVisible] = useState(true);

    // Auto-close after duration
    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                setIsVisible(false);
                if (onClose) setTimeout(onClose, 300); // Wait for animation
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [duration, onClose]);

    // Handle manual close
    const handleClose = () => {
        setIsVisible(false);
        if (onClose) setTimeout(onClose, 300);
    };

    // Get icon based on type
    const getIcon = () => {
        switch (type) {
            case 'success':
                return <CheckCircle className="h-5 w-5 text-green-600" />;
            case 'error':
                return <XCircle className="h-5 w-5 text-red-600" />;
            case 'warning':
                return <AlertCircle className="h-5 w-5 text-yellow-600" />;
            case 'info':
                return <Info className="h-5 w-5 text-blue-600" />;
            default:
                return <CheckCircle className="h-5 w-5 text-green-600" />;
        }
    };

    // Get styles based on type
    const getStyles = () => {
        switch (type) {
            case 'success':
                return 'bg-white border-green-200 text-green-800';
            case 'error':
                return 'bg-white border-red-200 text-red-800';
            case 'warning':
                return 'bg-white border-yellow-200 text-yellow-800';
            case 'info':
                return 'bg-white border-blue-200 text-blue-800';
            default:
                return 'bg-white border-green-200 text-green-800';
        }
    };

    // Get icon background based on type
    const getIconBg = () => {
        switch (type) {
            case 'success':
                return 'bg-green-100';
            case 'error':
                return 'bg-red-100';
            case 'warning':
                return 'bg-yellow-100';
            case 'info':
                return 'bg-blue-100';
            default:
                return 'bg-green-100';
        }
    };

    // Get title based on type
    const getTitle = () => {
        switch (type) {
            case 'success':
                return '¡Éxito!';
            case 'error':
                return 'Error';
            case 'warning':
                return 'Advertencia';
            case 'info':
                return 'Información';
            default:
                return 'Éxito';
        }
    };

    // Get position classes
    const getPositionClasses = () => {
        switch (position) {
            case 'top-right':
                return 'top-4 right-4';
            case 'top-center':
                return 'top-4 left-1/2 transform -translate-x-1/2';
            case 'bottom-right':
                return 'bottom-4 right-4';
            case 'bottom-center':
                return 'bottom-4 left-1/2 transform -translate-x-1/2';
            default:
                return 'top-4 left-1/2 transform -translate-x-1/2';
        }
    };

    if (!isVisible) return null;

    return (
        <div className={`fixed z-[9999] ${getPositionClasses()} animate-in fade-in-0 zoom-in-95 duration-300`}>
            <div className={`flex items-start gap-3 p-4 rounded-lg shadow-xl border max-w-md ${getStyles()}`}>
                <div className={`p-2 ${getIconBg()} rounded-full`}>
                    {getIcon()}
                </div>
                <div className="flex-1 min-w-0">
                    <div className="font-semibold text-sm mb-1">{getTitle()}</div>
                    <div className="text-sm text-gray-700 break-words">{message}</div>
                </div>
                {showClose && (
                    <button
                        onClick={handleClose}
                        className="text-gray-400 hover:text-gray-600 ml-2 flex-shrink-0"
                        aria-label="Cerrar notificación"
                    >
                        <X className="h-4 w-4" />
                    </button>
                )}
            </div>
        </div>
    );
};

export default Toast;