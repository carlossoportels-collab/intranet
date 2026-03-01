// resources/js/app.tsx
import '../css/app.css';

import { createInertiaApp } from '@inertiajs/react';
import { resolvePageComponent } from 'laravel-vite-plugin/inertia-helpers';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';

import { ToastProvider } from './contexts/ToastContext'; // ← Importar ToastProvider
import { initializeTheme } from './hooks/use-appearance';

const appName = 'Intranet';

createInertiaApp({
    title: (title) => (title ? `${title} - ${appName}` : appName),
    resolve: (name) =>
        resolvePageComponent(
            `./pages/${name}.tsx`,
            import.meta.glob('./pages/**/*.tsx'),
        ),
    setup({ el, App, props }) {
        const root = createRoot(el);
        
        root.render(
            <StrictMode>
                <ToastProvider> 
                    <App {...props} />
                </ToastProvider>
            </StrictMode>,
        );
    },
    progress: {
        color: '#FF6600',
    },
});

initializeTheme();