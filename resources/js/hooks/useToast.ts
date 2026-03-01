// resources/js/hooks/useToast.ts
import { useState, useCallback } from 'react';

import { ToastType } from '@/components/ui/toast';

interface ToastConfig {
    message: string;
    type?: ToastType;
    duration?: number;
    position?: 'top-right' | 'top-center' | 'bottom-right' | 'bottom-center';
}

export const useToast = () => {
    const [toast, setToast] = useState<ToastConfig & { id: number } | null>(null);
    const [toastId, setToastId] = useState(0);

    const showToast = useCallback((config: ToastConfig) => {
        const id = toastId + 1;
        setToastId(id);
        setToast({ ...config, id });
        
        // Auto remove toast after duration
        if (config.duration !== 0) {
            const duration = config.duration || 3000;
            setTimeout(() => {
                setToast(current => current?.id === id ? null : current);
            }, duration);
        }
    }, [toastId]);

    const hideToast = useCallback(() => {
        setToast(null);
    }, []);

    const showSuccess = useCallback((message: string, duration?: number) => {
        showToast({ message, type: 'success', duration });
    }, [showToast]);

    const showError = useCallback((message: string, duration?: number) => {
        showToast({ message, type: 'error', duration: duration || 5000 });
    }, [showToast]);

    const showInfo = useCallback((message: string, duration?: number) => {
        showToast({ message, type: 'info', duration });
    }, [showToast]);

    const showWarning = useCallback((message: string, duration?: number) => {
        showToast({ message, type: 'warning', duration });
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