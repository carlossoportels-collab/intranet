<?php
// app/Http/Controllers/Utils/CacheController.php

namespace App\Http\Controllers\Utils;

use App\Http\Controllers\Controller;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Artisan;

class CacheController extends Controller
{
    public function clearCache()
    {
        // Limpiar caché de Laravel
        try {
            Artisan::call('cache:clear');
            Artisan::call('config:clear');
            Artisan::call('view:clear');
            Artisan::call('route:clear');
            
            return response()->json([
                'success' => true,
                'message' => 'Caché limpiada correctamente'
            ]);
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Error: ' . $e->getMessage()
            ]);
        }
    }
    
    public function clearUserCache()
    {
        $user = auth()->user();
        if ($user) {
            // Limpiar caché del usuario
            Cache::forget("usuario_permisos_{$user->id}");
            Cache::forget("usuario_prefijos_{$user->id}");
            Cache::forget("usuario_ve_todas_{$user->id}");
            Cache::forget("usuario_compania_{$user->id}");
            
            return response()->json([
                'success' => true,
                'message' => 'Caché de usuario limpiada'
            ]);
        }
        
        return response()->json([
            'success' => false,
            'message' => 'Usuario no autenticado'
        ]);
    }
}