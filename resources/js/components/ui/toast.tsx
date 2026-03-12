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
    const [isExiting, setIsExiting] = useState(false);

    useEffect(() => {
        if (duration > 0) {
            const timer = setTimeout(() => {
                handleClose();
            }, duration);

            return () => clearTimeout(timer);
        }
    }, [duration]);

    const handleClose = () => {
        setIsExiting(true);
        setTimeout(() => {
            setIsVisible(false);
            if (onClose) onClose();
        }, 200);
    };

    // Configuración simplificada: color solo para elementos visuales
    const getToastConfig = () => {
        switch (type) {
            case 'success':
                return {
                    icon: CheckCircle,
                    iconBg: 'bg-emerald-500',
                    iconColor: 'text-white',
                    progressBar: 'bg-emerald-500',
                    shadow: 'shadow-lg shadow-emerald-500/20',
                    border: 'border-emerald-200',
                    bg: 'bg-white'
                };
            case 'error':
                return {
                    icon: XCircle,
                    iconBg: 'bg-rose-500',
                    iconColor: 'text-white',
                    progressBar: 'bg-rose-500',
                    shadow: 'shadow-lg shadow-rose-500/20',
                    border: 'border-rose-200',
                    bg: 'bg-white'
                };
            case 'warning':
                return {
                    icon: AlertCircle,
                    iconBg: 'bg-amber-500',
                    iconColor: 'text-white',
                    progressBar: 'bg-amber-500',
                    shadow: 'shadow-lg shadow-amber-500/20',
                    border: 'border-amber-200',
                    bg: 'bg-white'
                };
            case 'info':
                return {
                    icon: Info,
                    iconBg: 'bg-sky-500',
                    iconColor: 'text-white',
                    progressBar: 'bg-sky-500',
                    shadow: 'shadow-lg shadow-sky-500/20',
                    border: 'border-sky-200',
                    bg: 'bg-white'
                };
            default:
                return {
                    icon: CheckCircle,
                    iconBg: 'bg-emerald-500',
                    iconColor: 'text-white',
                    progressBar: 'bg-emerald-500',
                    shadow: 'shadow-lg shadow-emerald-500/20',
                    border: 'border-emerald-200',
                    bg: 'bg-white'
                };
        }
    };

    const config = getToastConfig();
    const Icon = config.icon;

    const getPositionClasses = () => {
        switch (position) {
            case 'top-right':
                return 'top-6 right-6';
            case 'top-center':
                return 'top-6 left-1/2 -translate-x-1/2';
            case 'bottom-right':
                return 'bottom-6 right-6';
            case 'bottom-center':
                return 'bottom-6 left-1/2 -translate-x-1/2';
            default:
                return 'top-6 left-1/2 -translate-x-1/2';
        }
    };

    if (!isVisible) return null;

    return (
        <div 
            className={`fixed z-[9999] ${getPositionClasses()} 
                transition-all duration-300 ease-[cubic-bezier(0.68,-0.55,0.265,1.55)]
                ${isExiting 
                    ? 'opacity-0 scale-75 translate-y-0' 
                    : 'opacity-100 scale-100 translate-y-0'
                }
            `}
        >
            <div className={`
                relative overflow-hidden
                flex items-start gap-3.5 
                ${config.bg} ${config.border} border
                rounded-2xl ${config.shadow}
                min-w-[320px] max-w-md p-4
            `}>
                {/* Icono de color sólido */}
                <div className={`
                    relative flex-shrink-0 p-2.5 rounded-xl
                    ${config.iconBg} shadow-inner
                `}>
                    <Icon className={`h-5 w-5 ${config.iconColor}`} />
                </div>

                {/* Contenido con texto 100% oscuro y legible */}
                <div className="flex-1 min-w-0 pt-0.5">
                    <div className="text-sm text-slate-700 break-words leading-relaxed font-medium">
                        {message}
                    </div>
                </div>

                {/* Botón cerrar en gris neutro */}
                {showClose && (
                    <button
                        onClick={handleClose}
                        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-100 transition-colors group mt-0.5"
                        aria-label="Cerrar"
                    >
                        <X className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    </button>
                )}

                {/* Barra de progreso con el color correspondiente */}
                {duration > 0 && (
                    <div 
                        className={`absolute bottom-0 left-0 h-1 ${config.progressBar} opacity-50`}
                        style={{
                            width: '100%',
                            animation: `shrinkWidth ${duration}ms linear forwards`
                        }}
                    />
                )}
            </div>
        </div>
    );
};

export default Toast;