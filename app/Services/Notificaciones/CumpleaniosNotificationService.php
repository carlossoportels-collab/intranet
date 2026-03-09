<?php
// app/Services/Notificaciones/CumpleaniosNotificationService.php

namespace App\Services\Notificaciones;

use App\Models\Personal;
use App\Models\Usuario;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class CumpleaniosNotificationService
{
    /**
     * Verificar cumpleaños y generar notificaciones
     */
    public function verificarCumpleanios()
    {
        $hoy = Carbon::today();
        $procesados = 0;
        $notificaciones = 0;
        
        try {
            // Obtener todos los usuarios activos (que recibirán notificaciones)
            $usuarios = Usuario::where('activo', true)->get();
            
            // Obtener personal que cumple años hoy
            $cumpleanieros = Personal::whereNotNull('fecha_nacimiento')
                ->whereMonth('fecha_nacimiento', $hoy->month)
                ->whereDay('fecha_nacimiento', $hoy->day)
                ->whereNull('deleted_at')
                ->get();
            
            if ($cumpleanieros->isEmpty()) {
                Log::info('No hay cumpleaños para hoy');
                return [
                    'procesados' => 0,
                    'notificaciones' => 0
                ];
            }
            
            // Para cada cumpleañero, crear notificaciones para todos los usuarios
            foreach ($cumpleanieros as $cumpleaniero) {
                $edad = $this->calcularEdad($cumpleaniero->fecha_nacimiento);
                
                foreach ($usuarios as $usuario) {
                    // Verificar si ya existe notificación para este usuario sobre este cumpleañero hoy
                    $existe = DB::table('notificaciones')
                        ->where('usuario_id', $usuario->id)
                        ->where('tipo', 'cumpleanos')
                        ->whereDate('fecha_notificacion', $hoy)
                        ->where('entidad_id', $cumpleaniero->id)
                        ->exists();
                    
                    if (!$existe) {
                        DB::table('notificaciones')->insert([
                            'usuario_id' => $usuario->id,
                            'titulo' => '🎂 ¡Cumpleaños!',
                            'mensaje' => "{$cumpleaniero->nombre_completo} cumple {$edad} años hoy",
                            'tipo' => 'cumpleanos',
                            'entidad_tipo' => 'personal',
                            'entidad_id' => $cumpleaniero->id,
                            'leida' => false,
                            'fecha_notificacion' => $hoy->format('Y-m-d H:i:s'),
                            'prioridad' => 'normal',
                            'created' => now(),
                        ]);
                        
                        $notificaciones++;
                    }
                }
                
                $procesados++;
            }
            
            Log::info("Cumpleaños procesados: {$procesados}, notificaciones generadas: {$notificaciones}");
            
        } catch (\Exception $e) {
            Log::error('Error generando notificaciones de cumpleaños: ' . $e->getMessage());
            throw $e;
        }
        
        return [
            'procesados' => $procesados,
            'notificaciones' => $notificaciones
        ];
    }
    
    /**
     * Calcular edad desde fecha de nacimiento
     */
    private function calcularEdad($fechaNacimiento)
    {
        return Carbon::parse($fechaNacimiento)->age;
    }
}