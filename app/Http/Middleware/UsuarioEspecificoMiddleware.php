<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class UsuarioEspecificoMiddleware
{
    public function handle(Request $request, Closure $next, ...$ids)
    {
        if (!Auth::check()) {
            \Log::warning('UsuarioEspecificoMiddleware: Usuario no autenticado');
            return redirect()->route('login');
        }

        $usuarioId = Auth::id();
        $idsPermitidos = array_map('intval', $ids);
        
        \Log::info('========== USUARIO ESPECIFICO MIDDLEWARE ==========', [
            'usuario_id' => $usuarioId,
            'ids_permitidos' => $idsPermitidos,
            'url' => $request->fullUrl(),
            'tiene_acceso' => in_array($usuarioId, $idsPermitidos)
        ]);
        
        if (!in_array($usuarioId, $idsPermitidos)) {
            \Log::warning('ACCESO DENEGADO - 403', [
                'usuario_id' => $usuarioId,
                'ids_permitidos' => $idsPermitidos,
                'url' => $request->fullUrl()
            ]);
            
            abort(403, 'No tienes permisos para acceder a esta página.');
        }

        return $next($request);
    }
}