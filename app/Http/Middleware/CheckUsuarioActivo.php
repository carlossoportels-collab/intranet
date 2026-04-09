<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class CheckUsuarioActivo
{
    public function handle(Request $request, Closure $next)
    {
        if (Auth::check()) {
            $usuario = Auth::user();
            
            if ($usuario->activo != 1) {
                Auth::logout();
                $request->session()->invalidate();
                
                // 🔥 Solo regenerar token si NO es AJAX/JSON
                if (!$request->ajax() && !$request->wantsJson()) {
                    $request->session()->regenerateToken();
                }
                
                if ($request->ajax() || $request->wantsJson()) {
                    return response()->json(['error' => 'Usuario inactivo'], 403);
                }
                
                return redirect()->route('login')
                    ->withErrors(['acceso' => 'Usuario inactivo.']);
            }
        }
        
        return $next($request);
    }
}