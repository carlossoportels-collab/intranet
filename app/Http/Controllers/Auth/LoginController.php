<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia; 

class LoginController extends Controller
{
    public function show()
    {
        return inertia('Auth/Login');
    }

   public function login(Request $request)
{
    $request->validate([
        'acceso' => 'required|string',
        'password' => 'required|string',
    ]);

    if (Auth::attempt([
        'nombre_usuario' => $request->acceso,
        'password' => $request->password,
        'activo' => 1
    ], $request->boolean('remember'))) {
        
        $usuario = Auth::user();
        $usuario->ultimo_acceso = now();
        $usuario->save();
        
        // Obtener datos COMPLETOS de la compañía
        $companiaData = $this->getCompaniaNombre($usuario);
        $nombreCompleto = $this->getNombreCompleto($usuario);
        
        // Guardar en sesión para la página de bienvenida
        $request->session()->put('welcome_data', [
            'compania' => $companiaData['nombre'],
            'logo' => $companiaData['logo'],
            'colores' => $companiaData['colores'],
            'nombre' => $nombreCompleto,
            'rol_id' => $usuario->rol_id,
        ]);
        
        // Redirigir a la página de bienvenida
        return redirect()->route('welcome');
    }
    
    return back()->withErrors(['acceso' => 'Credenciales incorrectas.']);
}

    /**
     * Obtener nombre de la compañía según compañia_id
     */
private function getCompaniaNombre($usuario)
{
    // Obtener datos comerciales del usuario
    $comercial = DB::table('comercial')
        ->where('personal_id', $usuario->personal_id)
        ->first();
    
    if (!$comercial || !$comercial->compania_id) {
        return [
            'nombre' => 'Intranet',
            'logo' => 'logo.webp',
            'colores' => [
                'primary' => '#fa6400',    // RGB 59,59,61
                'secondary' => '#3b3b3d',   // RGB 250,100,0
            ]
        ];
    }
    
    // Definir información por compañía
    $companias = [
        1 => [ // LocalSat
            'nombre' => 'LocalSat',
            'logo' => 'logo.webp',
            'colores' => [
                'primary' => '#fa6400',    // RGB 59,59,61
                'secondary' => '#3b3b3d',   // RGB 250,100,0
            ]
        ],
        2 => [ // SmartSat
            'nombre' => 'SmartSat',
            'logo' => 'logosmart.png',
            'colores' => [
                'primary' => '#eb9b11',    // RGB 59,59,61
                'secondary' => '#3b3b3d',   // RGB 235,155,17
            ]
        ],
        3 => [ // 360
            'nombre' => '360',
            'logo' => '360-logo.webp',
            'colores' => [
                'primary' => '#fa6400',    // RGB 59,59,61 (usando LocalSat)
                'secondary' => '#3b3b3d',   // RGB 250,100,0 (usando LocalSat)
            ]
        ],
    ];
    
    return $companias[$comercial->compania_id] ?? [
        'nombre' => 'Compañía ' . $comercial->compania_id,
        'logo' => 'logo-generic.webp',
        'colores' => [
            'primary' => '#fa6400',
            'secondary' => '#3b3b3d',
        ]
    ];
}

    /**
     * Obtener nombre completo del usuario
     */
    private function getNombreCompleto($usuario)
    {
        // Obtener datos del personal
        $personal = DB::table('personal')
            ->where('id', $usuario->personal_id)
            ->first();
        
        // Si tenemos datos de personal, usarlos
        if ($personal && $personal->nombre) {
            $nombre = trim($personal->nombre);
            $apellido = $personal->apellido ? trim($personal->apellido) : '';
            
            return $apellido ? "$nombre $apellido" : $nombre;
        }
        
        // Fallback al nombre de usuario
        return $usuario->nombre_usuario;
    }

    /**
     * Página de bienvenida con animación
     */
    public function welcome(Request $request)
    {
        $welcomeData = $request->session()->get('welcome_data');
        
        if (!$welcomeData) {
            return redirect()->route('dashboard');
        }
        
        $request->session()->forget('welcome_data');
        
        $redirectTo = $welcomeData['rol_id'] == 5 ? route('comercial.prospectos') : route('comercial.prospectos');
        
        return inertia('Auth/Welcome', [
            'compania' => $welcomeData['compania'],
            'logo' => $welcomeData['logo'],
            'colores' => $welcomeData['colores'],
            'nombre' => $welcomeData['nombre'],
            'redirect_to' => $redirectTo,
        ]);
    }

    public function logout(Request $request)
    {
        Auth::logout();
        $request->session()->invalidate();
        $request->session()->regenerateToken();
        
        return Inertia::location(route('login'));
    }
}