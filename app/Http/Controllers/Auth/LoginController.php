<?php
// app/Http/Controllers/Auth/LoginController.php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use App\Models\Usuario;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;
use App\Traits\LogsLoginAttempts;
use App\Services\Security\SecurityNotificationService;

class LoginController extends Controller
{
    use LogsLoginAttempts;

    protected $securityNotification;

    public function __construct(SecurityNotificationService $securityNotification)
    {
        $this->securityNotification = $securityNotification;
    }

    public function show()
    {
        return inertia('Auth/Login');
    }

    public function login(Request $request)
    {
        $ip = $request->ip();
        
        // Verificar si la IP está bloqueada
        if ($this->isIpBlocked($ip)) {
            return back()->withErrors([
                'acceso' => 'Demasiados intentos fallidos. Intenta nuevamente en 60 minutos.'
            ]);
        }

        // Rate limiting
        if (!$this->checkRateLimit($ip, 50, 15)) {
            $this->blockIp($ip, 60);
            
            $this->securityNotification->notifyIpBlocked(
                $ip,
                'Excedió el límite de intentos (50 en 15 minutos)',
                now()->addMinutes(60)
            );
            
            return back()->withErrors([
                'acceso' => 'Demasiados intentos fallidos. IP bloqueada por 60 minutos.'
            ]);
        }

        $request->validate([
            'acceso' => 'required|string|max:255',
            'password' => 'required|string|max:255',
        ]);

        $acceso = strip_tags($request->acceso);
        $password = strip_tags($request->password);

        // Detectar intentos sospechosos
        if ($this->isSuspicious($acceso)) {
            $this->logLoginAttempt($acceso, false, ['suspicious' => true]);
            $this->blockIp($ip, 120);
            
            $this->securityNotification->notifySuspiciousActivity(
                $acceso,
                $ip,
                $request->userAgent(),
                'Patrón de SQL injection detectado'
            );
            
            return back()->withErrors([
                'acceso' => 'Actividad sospechosa detectada. Acceso bloqueado.'
            ]);
        }

        if (Auth::attempt([
            'nombre_usuario' => $acceso,
            'password' => $password,
            'activo' => 1
        ], $request->boolean('remember'))) {
            

           \Log::info('Login exitoso', [
            'user_id' => Auth::id(),
            'session_id' => session()->getId(),
            'session_name' => session()->getName(),
            'cookie_domain' => config('session.domain'),
            'cookie_secure' => config('session.secure')
        ]);

            $usuario = Auth::user();
            $usuario->ultimo_acceso = now();
            $usuario->save();
            
            $this->logLoginAttempt($acceso, true, ['user_id' => $usuario->id]);
            
            $companiaData = $this->getCompaniaNombre($usuario);
            $nombreCompleto = $this->getNombreCompleto($usuario);
            
            // Determinar redirección según el rol
            $redirectTo = $this->getRedirectByRole($usuario->rol_id);
            
            $request->session()->put('welcome_data', [
                'compania' => $companiaData['nombre'],
                'logo' => $companiaData['logo'],
                'colores' => $companiaData['colores'],
                'nombre' => $nombreCompleto,
                'rol_id' => $usuario->rol_id,
                'redirect_to' => $redirectTo,
            ]);
            
            return redirect()->route('welcome');
        }
        
        // Registrar intento fallido
        $this->logLoginAttempt($acceso, false);
        
        // Verificar si hay múltiples intentos fallidos desde la misma IP
        $failedAttempts = DB::table('login_attempts')
            ->where('ip', $ip)
            ->where('success', false)
            ->where('created_at', '>=', now()->subHours(1))
            ->count();
        
        if ($failedAttempts >= 5) {
            $this->securityNotification->notifyMultipleFailedAttempts(
                $acceso,
                $ip,
                $failedAttempts
            );
        }
        
        return back()->withErrors([
            'acceso' => 'Credenciales incorrectas.'
        ]);
    }

    /**
     * Determinar la ruta de redirección según el rol del usuario
     * @param int $rolId
     * @return string
     */
private function getRedirectByRole(int $rolId): string
{
    $roleRedirects = [
        1 => '/comercial/prospectos',  // root
        2 => '/comercial/prospectos',  // admin
        3 => '/comercial/prospectos',  // supervisor
        4 => '/cuentas/certificados',  // soporte
        5 => '/comercial/prospectos',  // Comercial
        6 => '/rrhh/personal/licencias', // RRHH
    ];
    
    return $roleRedirects[$rolId] ?? '/dashboard';
}

    private function getCompaniaNombre($usuario)
    {
        $comercial = DB::table('comercial')
            ->where('personal_id', $usuario->personal_id)
            ->first();
        
        if (!$comercial || !$comercial->compania_id) {
            return [
                'nombre' => 'Intranet',
                'logo' => 'logo.png',
                'colores' => [
                    'primary' => '#fa6400',
                    'secondary' => '#3b3b3d',
                ]
            ];
        }
        
        $companias = [
            1 => [
                'nombre' => 'LocalSat',
                'logo' => 'logo.png',
                'colores' => [
                    'primary' => '#fa6400',
                    'secondary' => '#3b3b3d',
                ]
            ],
            2 => [
                'nombre' => 'SmartSat',
                'logo' => 'logosmart.png',
                'colores' => [
                    'primary' => '#eb9b11',
                    'secondary' => '#3b3b3d',
                ]
            ],
            3 => [
                'nombre' => '360',
                'logo' => '360-logo.png',
                'colores' => [
                    'primary' => '#fa6400',
                    'secondary' => '#3b3b3d',
                ]
            ],
        ];
        
        return $companias[$comercial->compania_id] ?? [
            'nombre' => 'Compañía ' . $comercial->compania_id,
            'logo' => 'logo-generic.png',
            'colores' => [
                'primary' => '#fa6400',
                'secondary' => '#3b3b3d',
            ]
        ];
    }

    private function getNombreCompleto($usuario)
    {
        $personal = DB::table('personal')
            ->where('id', $usuario->personal_id)
            ->first();
        
        if ($personal && $personal->nombre) {
            $nombre = trim($personal->nombre);
            $apellido = $personal->apellido ? trim($personal->apellido) : '';
            
            return $apellido ? "$nombre $apellido" : $nombre;
        }
        
        return $usuario->nombre_usuario;
    }

    public function welcome(Request $request)
    {
        $welcomeData = $request->session()->get('welcome_data');
        
        if (!$welcomeData) {
            return redirect()->route('dashboard');
        }
        
        $request->session()->forget('welcome_data');
        
        return inertia('Auth/Welcome', [
            'compania' => $welcomeData['compania'],
            'logo' => $welcomeData['logo'],
            'colores' => $welcomeData['colores'],
            'nombre' => $welcomeData['nombre'],
            'redirect_to' => $welcomeData['redirect_to'],
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