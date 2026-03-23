<?php
require __DIR__ . '/vendor/autoload.php';
$app = require_once __DIR__ . '/bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

function generarPassword($min = 6, $max = 8) {
    $caracteres = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%&*';
    $longitud = rand($min, $max);
    $password = '';
    for ($i = 0; $i < $longitud; $i++) {
        $password .= $caracteres[rand(0, strlen($caracteres) - 1)];
    }
    return $password;
}

$usuarios = DB::select("SELECT id, nombre_usuario FROM usuarios WHERE activo = 1");
$reporte = [];

foreach ($usuarios as $usuario) {
    $nuevaPassword = generarPassword();
    DB::table('usuarios')
        ->where('id', $usuario->id)
        ->update([
            'password' => Hash::make($nuevaPassword),
            'modified' => now()
        ]);
    
    $reporte[] = [$usuario->id, $usuario->nombre_usuario, $nuevaPassword];
    echo "{$usuario->id}: {$usuario->nombre_usuario} -> {$nuevaPassword}\n";
}

// Guardar reporte
$file = fopen('passwords_' . date('Ymd') . '.csv', 'w');
foreach ($reporte as $row) {
    fputcsv($file, $row);
}
fclose($file);

echo "\n✅ Listo! Reporte guardado en passwords_" . date('Ymd') . ".csv\n";