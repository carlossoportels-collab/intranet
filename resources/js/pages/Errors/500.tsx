// resources/js/Pages/Errors/500.tsx

import { Head, Link } from '@inertiajs/react';
import { AlertTriangle, RefreshCw, Home } from 'lucide-react';
import React from 'react';

const ServerErrorPage: React.FC = () => {
  return (
    <>
      <Head title="Error del servidor" />
      
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex justify-center">
            <div className="bg-amber-100 p-4 rounded-full">
              <AlertTriangle className="h-16 w-16 text-amber-600" />
            </div>
          </div>
          
          <div>
            <h1 className="text-7xl font-bold text-amber-600">500</h1>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Error interno del servidor
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Lo sentimos, algo salió mal en nuestros servidores.
            </p>
          </div>
          
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </button>
            
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Home className="h-4 w-4 mr-2" />
              Ir al inicio
            </Link>
          </div>
          
          <div className="mt-4">
            <p className="text-xs text-gray-500">
              Si el problema persiste, por favor contacta al soporte técnico.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default ServerErrorPage;