// resources/js/Pages/Errors/419.tsx

import { Head, Link } from '@inertiajs/react';
import { Clock, LogIn, Home } from 'lucide-react';
import React from 'react';

const SessionExpiredPage: React.FC = () => {
  return (
    <>
      <Head title="Sesión expirada" />
      
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex justify-center">
            <div className="bg-blue-100 p-4 rounded-full">
              <Clock className="h-16 w-16 text-blue-600" />
            </div>
          </div>
          
          <div>
            <h1 className="text-7xl font-bold text-blue-600">419</h1>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Sesión expirada
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Tu sesión ha expirado por inactividad. Por favor, inicia sesión nuevamente para continuar.
            </p>
          </div>
          
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <LogIn className="h-4 w-4 mr-2" />
              Iniciar sesión
            </Link>
            
            <Link
              href="/"
              className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <Home className="h-4 w-4 mr-2" />
              Ir al inicio
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default SessionExpiredPage;