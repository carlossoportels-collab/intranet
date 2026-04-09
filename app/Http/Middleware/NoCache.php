<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class NoCache
{
    public function handle(Request $request, Closure $next): Response
    {
        $response = $next($request);
        
        // 🔥 Excluir rutas de API y requests AJAX
        $shouldNotCache = !$request->is('build/*') 
                        && !$request->is('assets/*') 
                        && !$request->is('favicon*')
                        && !$request->is('api/*')      
                        && !$request->ajax()              
                        && !$request->wantsJson();          
        
        if ($shouldNotCache) {
            $response->headers->set('Cache-Control', 'no-cache, no-store, must-revalidate');
            $response->headers->set('Pragma', 'no-cache');
            $response->headers->set('Expires', '0');
        }
        
        return $response;
    }
}