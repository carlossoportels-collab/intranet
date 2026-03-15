// resources/js/hooks/useToast.ts
import { useState, useCallback, useRef } from 'react';
import { ToastType, ToastAction } from '@/components/ui/toast';

interface ToastConfig {
    message: string;
    type?: ToastType;
    duration?: number;
    position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
    action?: ToastAction;
}

export const useToast = () => {
    const [toast, setToast] = useState<ToastConfig & { id: number } | null>(null);
    const toastIdRef = useRef(0);
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);

    const showToast = useCallback((config: ToastConfig) => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }

        const id = ++toastIdRef.current;
        setToast({ ...config, id });
        
        if (config.duration !== 0) {
            const duration = config.duration || 4000;
            timeoutRef.current = setTimeout(() => {
                setToast(current => current?.id === id ? null : current);
                timeoutRef.current = null;
            }, duration);
        }
    }, []);

    const hideToast = useCallback(() => {
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
            timeoutRef.current = null;
        }
        setToast(null);
    }, []);

    const showSuccess = useCallback((
        message: string, 
        duration?: number, 
        position?: ToastConfig['position'],
        action?: ToastAction
    ) => {
        showToast({ message, type: 'success', duration, position, action });
    }, [showToast]);

    const showError = useCallback((
        message: string, 
        duration?: number, 
        position?: ToastConfig['position'],
        action?: ToastAction
    ) => {
        showToast({ message, type: 'error', duration: duration || 5000, position, action });
    }, [showToast]);

    const showInfo = useCallback((
        message: string, 
        duration?: number, 
        position?: ToastConfig['position'],
        action?: ToastAction
    ) => {
        showToast({ message, type: 'info', duration, position, action });
    }, [showToast]);

    const showWarning = useCallback((
        message: string, 
        duration?: number, 
        position?: ToastConfig['position'],
        action?: ToastAction
    ) => {
        showToast({ message, type: 'warning', duration, position, action });
    }, [showToast]);

    return {
        toast,
        showToast,
        hideToast,
        showSuccess,
        showError,
        showInfo,
        showWarning
    };
};