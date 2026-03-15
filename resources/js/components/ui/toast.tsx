// resources/js/components/ui/Toast.tsx
import { X, CheckCircle, XCircle, Info, AlertCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastAction {
    label: string;
    onClick: () => void;
}

export interface ToastProps {
    message: string;
    type?: ToastType;
    duration?: number;
    position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
    onClose?: () => void;
    showClose?: boolean;
    action?: ToastAction;
}

const Toast: React.FC<ToastProps> = ({
    message,
    type = 'success',
    duration = 3000,
    position = 'top-center',
    onClose,
    showClose = true,
    action
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
                    bg: 'bg-white',
                    actionBg: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
                };
            case 'error':
                return {
                    icon: XCircle,
                    iconBg: 'bg-rose-500',
                    iconColor: 'text-white',
                    progressBar: 'bg-rose-500',
                    shadow: 'shadow-lg shadow-rose-500/20',
                    border: 'border-rose-200',
                    bg: 'bg-white',
                    actionBg: 'bg-rose-100 hover:bg-rose-200 text-rose-700'
                };
            case 'warning':
                return {
                    icon: AlertCircle,
                    iconBg: 'bg-amber-500',
                    iconColor: 'text-white',
                    progressBar: 'bg-amber-500',
                    shadow: 'shadow-lg shadow-amber-500/20',
                    border: 'border-amber-200',
                    bg: 'bg-white',
                    actionBg: 'bg-amber-100 hover:bg-amber-200 text-amber-700'
                };
            case 'info':
                return {
                    icon: Info,
                    iconBg: 'bg-sky-500',
                    iconColor: 'text-white',
                    progressBar: 'bg-sky-500',
                    shadow: 'shadow-lg shadow-sky-500/20',
                    border: 'border-sky-200',
                    bg: 'bg-white',
                    actionBg: 'bg-sky-100 hover:bg-sky-200 text-sky-700'
                };
            default:
                return {
                    icon: CheckCircle,
                    iconBg: 'bg-emerald-500',
                    iconColor: 'text-white',
                    progressBar: 'bg-emerald-500',
                    shadow: 'shadow-lg shadow-emerald-500/20',
                    border: 'border-emerald-200',
                    bg: 'bg-white',
                    actionBg: 'bg-emerald-100 hover:bg-emerald-200 text-emerald-700'
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
                <div className={`
                    relative flex-shrink-0 p-2.5 rounded-xl
                    ${config.iconBg} shadow-inner
                `}>
                    <Icon className={`h-5 w-5 ${config.iconColor}`} />
                </div>

                <div className="flex-1 min-w-0 pt-0.5">
                    <div className="text-sm text-slate-700 break-words leading-relaxed font-medium">
                        {message}
                    </div>
                    
                    {action && (
                        <button
                            onClick={() => {
                                action.onClick();
                                handleClose();
                            }}
                            className={`mt-2 px-3 py-1 rounded-lg text-xs font-medium transition-colors ${config.actionBg}`}
                        >
                            {action.label}
                        </button>
                    )}
                </div>

                {showClose && (
                    <button
                        onClick={handleClose}
                        className="flex-shrink-0 p-1.5 rounded-lg hover:bg-slate-100 transition-colors group mt-0.5"
                        aria-label="Cerrar"
                    >
                        <X className="h-4 w-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                    </button>
                )}

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