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
        if (!$this->checkRateLimit($ip, 10, 15)) {
            $this->blockIp($ip, 60);
            
            // NOTIFICACIÓN: IP bloqueada por rate limiting
            $this->securityNotification->notifyIpBlocked(
                $ip,
                'Excedió el límite de intentos (10 en 15 minutos)',
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
            $this->blockIp($ip, 120); // Bloquear por 2 horas
            
            // NOTIFICACIÓN: Actividad sospechosa detectada
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
            
            $usuario = Auth::user();
            $usuario->ultimo_acceso = now();
            $usuario->save();
            
            $this->logLoginAttempt($acceso, true, ['user_id' => $usuario->id]);
            
            $companiaData = $this->getCompaniaNombre($usuario);
            $nombreCompleto = $this->getNombreCompleto($usuario);
            
            $request->session()->put('welcome_data', [
                'compania' => $companiaData['nombre'],
                'logo' => $companiaData['logo'],
                'colores' => $companiaData['colores'],
                'nombre' => $nombreCompleto,
                'rol_id' => $usuario->rol_id,
            ]);
            
            return redirect()->route('welcome');
        }
        
        // Registrar intento fallido
        $attempt = $this->logLoginAttempt($acceso, false);
        
        // Verificar si hay múltiples intentos fallidos desde la misma IP
        $failedAttempts = DB::table('login_attempts')
            ->where('ip', $ip)
            ->where('success', false)
            ->where('created_at', '>=', now()->subHours(1))
            ->count();
        
        if ($failedAttempts >= 5) {
            // NOTIFICACIÓN: Múltiples intentos fallidos
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

    private function getCompaniaNombre($usuario)
    {
        $comercial = DB::table('comercial')
            ->where('personal_id', $usuario->personal_id)
            ->first();
        
        if (!$comercial || !$comercial->compania_id) {
            return [
                'nombre' => 'Intranet',
                'logo' => 'logo.webp',
                'colores' => [
                    'primary' => '#fa6400',
                    'secondary' => '#3b3b3d',
                ]
            ];
        }
        
        $companias = [
            1 => [
                'nombre' => 'LocalSat',
                'logo' => 'logo.webp',
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
                'logo' => '360-logo.webp',
                'colores' => [
                    'primary' => '#fa6400',
                    'secondary' => '#3b3b3d',
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
        
        $redirectTo = route('comercial.prospectos');
        
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