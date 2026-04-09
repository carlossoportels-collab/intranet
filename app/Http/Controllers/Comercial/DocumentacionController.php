<?php
// app/Http/Controllers/Comercial/DocumentacionController.php

namespace App\Http\Controllers\Comercial;

use App\Http\Controllers\Controller;
use App\Traits\Authorizable; 
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Storage;
use Inertia\Inertia;

class DocumentacionController extends Controller
{
    use Authorizable; 

    public function __construct()
    {
        $this->initializeAuthorization(); 
    }

    public function index()
    {
        // VERIFICAR PERMISO
        $this->authorizePermiso(config('permisos.VER_DOCUMENTACION'));
        
        $user = Auth::user();
        
        // Determinar si es admin (sin compañía asignada o con rol de administrador)
        $isAdmin = !$user->comercial || $user->rol_id == 1;
        
        $companiaId = $user->comercial?->compania_id;
        
        // Si es admin, mostrar la primera carpeta por defecto (localsat)
        if ($isAdmin) {
            $basePath = 'localsat';
        } else {
            $basePath = $this->getBasePathByCompany($companiaId);
        }
        
        $files = $this->getFilesList($basePath);
        
        return Inertia::render('Comercial/Documentacion/Index', [
            'files' => $files,
            'currentPath' => $basePath,
            'companiaId' => $companiaId,
            'relativePath' => '',
            'isAdmin' => $isAdmin
        ]);
    }

    public function browse(Request $request)
    {
        
        $this->authorizePermiso(config('permisos.VER_DOCUMENTACION'));
        
        $user = Auth::user();
        $isAdmin = !$user->comercial || $user->rol_id == 1;
        
        $path = $request->get('path', '');
        
        // Si es admin y no se especificó path, usar localsat por defecto
        if ($isAdmin && empty($path)) {
            $path = 'localsat';
        }
        
        // Validar que la ruta no intente salir del directorio permitido
        if (str_contains($path, '..')) {
            return response()->json(['error' => 'Acceso no permitido'], 403);
        }
        
        // Para usuarios normales (con compañía)
        if (!$isAdmin) {
            $companiaId = $user->comercial?->compania_id;
            $userFolder = $this->getBasePathByCompany($companiaId);
            
            // Construir la ruta completa
            if (empty($path)) {
                $fullPath = $userFolder;
            } else {
                $fullPath = $userFolder . '/' . $path;
            }
            
            // Validar que la ruta esté dentro de la carpeta del usuario
            if (!str_starts_with($fullPath, $userFolder)) {
                return response()->json(['error' => 'Acceso no permitido'], 403);
            }
        } 
        // Para admins
        else {
            $allowedPaths = ['localsat', 'smartsat', '360'];
            $pathParts = explode('/', $path);
            $baseFolder = $pathParts[0];
            
            // Validar que la carpeta base sea permitida
            if (!in_array($baseFolder, $allowedPaths)) {
                return response()->json(['error' => 'Acceso no permitido'], 403);
            }
            
            $fullPath = $path;
        }
        
        // Validar que la ruta exista
        if (!Storage::disk('public')->exists($fullPath)) {
            // Intentar crear la estructura de carpetas si no existe
            if (!Storage::disk('public')->exists(dirname($fullPath))) {
                Storage::disk('public')->makeDirectory(dirname($fullPath));
            }
            
            // Si es un directorio, crearlo
            if (!Storage::disk('public')->exists($fullPath)) {
                Storage::disk('public')->makeDirectory($fullPath);
            }
        }
        
        $files = $this->getFilesList($fullPath);
        
        return response()->json([
            'files' => $files,
            'currentPath' => $fullPath
        ]);
    }

public function download(Request $request)
{
    $this->authorizePermiso(config('permisos.VER_DOCUMENTACION'));
    
    $user = Auth::user();
    $isAdmin = ($user->rol_id == 2); // Admin por rol
    
    $filePath = $request->get('file');
    $raw = $request->get('raw', false);
    
    if (!$filePath) {
        return response()->json(['error' => 'Archivo no especificado'], 400);
    }
    
    // Validar que la ruta no intente salir del directorio permitido
    if (str_contains($filePath, '..')) {
        return response()->json(['error' => 'Acceso no permitido'], 403);
    }
    
    // Para usuarios normales (comerciales)
    if (!$isAdmin) {
        // Obtener la carpeta base según la compañía del usuario
        $companiaId = null;
        
        // Intentar obtener compañía desde diferentes fuentes
        if ($user->comercial && $user->comercial->compania_id) {
            $companiaId = $user->comercial->compania_id;
        } elseif ($user->compania_id) {
            $companiaId = $user->compania_id;
        }
        
        $userFolder = $this->getBasePathByCompany($companiaId);
        
        // Construir la ruta completa (carpeta base + ruta relativa)
        $fullPath = $userFolder . '/' . ltrim($filePath, '/');
        
        // Log para debug
        \Log::info('Descarga comercial', [
            'user_id' => $user->id,
            'rol_id' => $user->rol_id,
            'compania_id' => $companiaId,
            'userFolder' => $userFolder,
            'filePath' => $filePath,
            'fullPath' => $fullPath
        ]);
        
        // Verificar que el archivo existe
        if (!Storage::disk('public')->exists($fullPath)) {
            \Log::error('Archivo no encontrado', ['fullPath' => $fullPath]);
            return response()->json(['error' => 'Archivo no encontrado'], 404);
        }
        
        $fileName = basename($fullPath);
        
        if ($raw == 1) {
            $fileContent = Storage::disk('public')->get($fullPath);
            $mimeType = Storage::disk('public')->mimeType($fullPath);
            
            return response($fileContent, 200)
                ->header('Content-Type', $mimeType)
                ->header('Content-Disposition', 'inline');
        }
        
        return Storage::disk('public')->download($fullPath, $fileName);
    }
    
    // Para administradores
    $allowedPaths = ['localsat', 'smartsat', '360'];
    $pathParts = explode('/', $filePath);
    $baseFolder = $pathParts[0];
    
    if (!in_array($baseFolder, $allowedPaths)) {
        return response()->json(['error' => 'Acceso no permitido'], 403);
    }
    
    $fullPath = $filePath;
    
    if (!Storage::disk('public')->exists($fullPath)) {
        return response()->json(['error' => 'Archivo no encontrado'], 404);
    }
    
    $fileName = basename($fullPath);
    
    if ($raw == 1) {
        $fileContent = Storage::disk('public')->get($fullPath);
        $mimeType = Storage::disk('public')->mimeType($fullPath);
        
        return response($fileContent, 200)
            ->header('Content-Type', $mimeType)
            ->header('Content-Disposition', 'inline');
    }
    
    return Storage::disk('public')->download($fullPath, $fileName);
}

    private function getFilesList($path)
    {
        if (!Storage::disk('public')->exists($path)) {
            return [
                'directories' => [],
                'files' => []
            ];
        }
        
        $items = Storage::disk('public')->listContents($path);
        
        $directories = [];
        $files = [];
        
        foreach ($items as $item) {
            // Obtener solo el nombre del archivo/directorio, no la ruta completa
            $name = basename($item['path']);
            
            // Saltar archivos ocultos
            if (str_starts_with($name, '.')) {
                continue;
            }
            
            $itemData = [
                'name' => $name,
                'path' => $item['path'],
                'lastModified' => isset($item['lastModified']) ? date('d/m/Y H:i', $item['lastModified']) : null,
                'size' => isset($item['fileSize']) ? $this->formatBytes($item['fileSize']) : null,
            ];
            
            if ($item['type'] === 'dir') {
                $directories[] = $itemData;
            } else {
                // Obtener extensión para archivos
                $extension = pathinfo($name, PATHINFO_EXTENSION);
                $itemData['extension'] = $extension ?: null;
                $files[] = $itemData;
            }
        }
        
        // Ordenar directorios alfabéticamente
        usort($directories, function($a, $b) {
            return strcmp($a['name'], $b['name']);
        });
        
        // Ordenar archivos alfabéticamente
        usort($files, function($a, $b) {
            return strcmp($a['name'], $b['name']);
        });
        
        return [
            'directories' => $directories,
            'files' => $files
        ];
    }

    private function getBasePathByCompany($companiaId)
    {
        switch ($companiaId) {
            case 2:
                return 'smartsat';
            case 3:
                return '360';
            default:
                return 'localsat';
        }
    }

    private function formatBytes($bytes, $precision = 2)
    {
        $units = ['B', 'KB', 'MB', 'GB', 'TB'];
        
        $bytes = max($bytes, 0);
        $pow = floor(($bytes ? log($bytes) : 0) / log(1024));
        $pow = min($pow, count($units) - 1);
        
        $bytes /= pow(1024, $pow);
        
        return round($bytes, $precision) . ' ' . $units[$pow];
    }
}