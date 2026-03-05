// resources/js/Pages/Errors/503.tsx

import { Head, Link } from '@inertiajs/react';
import { Wrench, RefreshCw } from 'lucide-react';
import React from 'react';

const MaintenancePage: React.FC = () => {
  return (
    <>
      <Head title="Sitio en mantenimiento" />
      
      <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <div className="flex justify-center">
            <div className="bg-purple-100 p-4 rounded-full">
              <Wrench className="h-16 w-16 text-purple-600" />
            </div>
          </div>
          
          <div>
            <h1 className="text-7xl font-bold text-purple-600">503</h1>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">
              Sitio en mantenimiento
            </h2>
            <p className="mt-2 text-sm text-gray-600">
              Estamos realizando mejoras en el sistema. Por favor, intenta nuevamente en unos minutos.
            </p>
          </div>
          
          <div className="mt-8">
            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center justify-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-purple-600 hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-purple-500"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Reintentar
            </button>
          </div>
          
          <div className="mt-4">
            <p className="text-xs text-gray-500">
              Disculpa las molestias. Estimamos que el servicio estará disponible en breve.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default MaintenancePage;