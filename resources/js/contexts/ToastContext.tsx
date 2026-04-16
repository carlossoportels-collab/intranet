// resources/js/contexts/ToastContext.tsx
import React, { createContext, useContext, useState, useCallback, useRef } from 'react';
import Toast, { ToastType, ToastAction } from '@/components/ui/toast';

interface ToastMessage {
    id: number;
    message: string;
    type: ToastType;
    duration?: number;
    position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
    action?: ToastAction;
}

interface ToastContextType {
    showToast: (message: string, type?: ToastType, duration?: number, position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center', action?: ToastAction) => void;
    success: (message: string, duration?: number, position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center', action?: ToastAction) => void;
    error: (message: string, duration?: number, position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center', action?: ToastAction) => void;
    info: (message: string, duration?: number, position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center', action?: ToastAction) => void;
    warning: (message: string, duration?: number, position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center', action?: ToastAction) => void;
    clearToasts: () => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

let toastId = 0;

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [toasts, setToasts] = useState<ToastMessage[]>([]);
    const timeoutsRef = useRef<{ [key: number]: ReturnType<typeof setTimeout>  }>({});

    const removeToast = useCallback((id: number) => {
        setToasts(prev => prev.filter(toast => toast.id !== id));
        
        if (timeoutsRef.current[id]) {
            clearTimeout(timeoutsRef.current[id]);
            delete timeoutsRef.current[id];
        }
    }, []);

    const showToast = useCallback((
        message: string, 
        type: ToastType = 'info', 
        duration = 4000,
        position: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center' = 'top-center',
        action?: ToastAction
    ) => {
        const id = ++toastId;
        
        setToasts(prev => [...prev, { id, message, type, duration, position, action }]);

        if (duration > 0) {
            const timeout = setTimeout(() => {
                removeToast(id);
            }, duration);
            
            timeoutsRef.current[id] = timeout;
        }
    }, [removeToast]);

    const clearToasts = useCallback(() => {
        Object.values(timeoutsRef.current).forEach(timeout => clearTimeout(timeout));
        timeoutsRef.current = {};
        setToasts([]);
    }, []);

    const success = useCallback((
        message: string, 
        duration?: number,
        position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center',
        action?: ToastAction
    ) => {
        showToast(message, 'success', duration, position, action);
    }, [showToast]);

    const error = useCallback((
        message: string, 
        duration?: number,
        position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center',
        action?: ToastAction
    ) => {
        showToast(message, 'error', duration || 5000, position, action);
    }, [showToast]);

    const info = useCallback((
        message: string, 
        duration?: number,
        position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center',
        action?: ToastAction
    ) => {
        showToast(message, 'info', duration, position, action);
    }, [showToast]);

    const warning = useCallback((
        message: string, 
        duration?: number,
        position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center',
        action?: ToastAction
    ) => {
        showToast(message, 'warning', duration, position, action);
    }, [showToast]);

    // Agrupar toasts por posición
    const toastsByPosition = toasts.reduce((acc, toast) => {
        const position = toast.position || 'top-center';
        if (!acc[position]) acc[position] = [];
        acc[position].push(toast);
        return acc;
    }, {} as Record<string, ToastMessage[]>);

    return (
        <ToastContext.Provider value={{ 
            showToast, 
            success, 
            error, 
            info, 
            warning,
            clearToasts 
        }}>
            {children}
            
            {Object.entries(toastsByPosition).map(([position, positionToasts]) => (
                <div
                    key={position}
                    className={`
                        fixed z-[9999] pointer-events-none
                        ${position === 'top-center' && 'top-6 left-1/2 -translate-x-1/2'}
                        ${position === 'top-right' && 'top-6 right-6'}
                        ${position === 'bottom-center' && 'bottom-6 left-1/2 -translate-x-1/2'}
                        ${position === 'bottom-right' && 'bottom-6 right-6'}
                        flex flex-col gap-2
                        w-full max-w-md
                    `}
                >
                    {positionToasts.map((toast) => (
                        <div 
                            key={toast.id} 
                            className="pointer-events-auto"
                        >
                            <Toast
                                message={toast.message}
                                type={toast.type}
                                duration={toast.duration}
                                position={toast.position}
                                onClose={() => removeToast(toast.id)}
                                showClose
                                action={toast.action}
                            />
                        </div>
                    ))}
                </div>
            ))}
        </ToastContext.Provider>
    );
};

export const useToast = () => {
    const context = useContext(ToastContext);
    if (!context) {
        throw new Error('useToast debe usarse dentro de ToastProvider');
    }
    return context;
};