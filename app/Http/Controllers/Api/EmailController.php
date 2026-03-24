<?php
// app/Http/Controllers/Api/EmailController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ContratoEnviado;
use App\Mail\PresupuestoEnviado;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Storage;

class EmailController extends Controller
{
    /**
     * Enviar contrato por email
     */
/**
 * Enviar contrato por email
 */
public function enviarContrato(Request $request)
{
    try {
        $request->validate([
            'to' => 'required|json',
            'cc' => 'nullable|json',
            'bcc' => 'nullable|json',
            'subject' => 'required|string|max:255',
            'body' => 'required|string',
            'contratoId' => 'required|integer',
            'numeroContrato' => 'required|string',
            'tipo' => 'nullable|string|in:administracion,cliente',
            'pdf' => 'nullable|file|mimes:pdf|max:10240'
        ]);

        // Decodificar JSON con manejo de errores
        $to = json_decode($request->to, true);
        $cc = $request->cc ? json_decode($request->cc, true) : [];
        $bcc = $request->bcc ? json_decode($request->bcc, true) : [];

        // Verificar si el JSON se decodificó correctamente
        if (json_last_error() !== JSON_ERROR_NONE) {
            throw new \Exception('Error al decodificar JSON: ' . json_last_error_msg());
        }

        // Asegurar que $to sea un array
        if (!is_array($to)) {
            // Si es un string (ej: "correo@ejemplo.com"), convertirlo a array
            if (is_string($to) && filter_var($to, FILTER_VALIDATE_EMAIL)) {
                $to = [$to];
            } else {
                throw new \Exception('El formato de destinatarios no es válido');
            }
        }

        // Asegurar que $cc y $bcc sean arrays
        if (!is_array($cc)) {
            $cc = is_string($cc) && filter_var($cc, FILTER_VALIDATE_EMAIL) ? [$cc] : [];
        }
        
        if (!is_array($bcc)) {
            $bcc = is_string($bcc) && filter_var($bcc, FILTER_VALIDATE_EMAIL) ? [$bcc] : [];
        }

        // Validar que haya al menos un destinatario
        if (empty($to)) {
            throw new \Exception('Debe especificar al menos un destinatario');
        }

        // 🔥 OBTENER DATOS DE LA COMPAÑÍA DEL CONTRATO (igual que en PresupuestosController)
        $contrato = \App\Models\Contrato::with([
            'presupuesto.prefijo.comercial.compania',
            'presupuesto.prefijo.comercial.personal'
        ])->find($request->contratoId);
        
        $compania = $this->getCompaniaDataFromContrato($contrato);

        $data = [
            'subject' => $request->subject,
            'body' => $request->body,
            'cc' => $cc,
            'bcc' => $bcc,
            'filename' => "Contrato_{$request->numeroContrato}.pdf",
            'tipo' => $request->tipo ?? 'cliente',
            'compania' => $compania,
        ];

        $pdfPath = null;
        $attachments = [];

        // Guardar PDF temporal
        if ($request->hasFile('pdf')) {
            $pdfFile = $request->file('pdf');
            $pdfPath = storage_path("app/temp/contrato_{$request->contratoId}_" . time() . ".pdf");
            
            $tempDir = storage_path('app/temp');
            if (!file_exists($tempDir)) {
                mkdir($tempDir, 0755, true);
            }
            
            file_put_contents($pdfPath, file_get_contents($pdfFile->getRealPath()));
        }

        // Procesar documentos adicionales
        if ($request->has('documento_local_0') || $request->has('documento_plataforma_0')) {
            foreach ($request->allFiles() as $key => $file) {
                if (str_starts_with($key, 'documento_local_') || str_starts_with($key, 'documento_plataforma_')) {
                    $tempPath = storage_path("app/temp/attachment_{$request->contratoId}_" . time() . "_" . uniqid() . ".pdf");
                    file_put_contents($tempPath, file_get_contents($file->getRealPath()));
                    $attachments[] = [
                        'path' => $tempPath,
                        'name' => $file->getClientOriginalName(),
                        'mime' => $file->getMimeType()
                    ];
                }
            }
        }

        $data['attachments'] = $attachments;

        // Obtener datos del usuario para el remitente
        $usuario = auth()->user();
        $fromEmail = $usuario->personal->email ?? env('MAIL_FROM_ADDRESS', 'noreply@localsat.com.ar');
        $fromName = $usuario->personal->nombre_completo ?? $usuario->name ?? 'LocalSat';

        // Enviar email a cada destinatario
        foreach ($to as $destinatario) {
            // Validar que sea un email válido
            if (filter_var($destinatario, FILTER_VALIDATE_EMAIL)) {
                Mail::to($destinatario)
                    ->send(new ContratoEnviado($data, $pdfPath, $fromEmail, $fromName, $compania));
            } else {
                Log::warning('Email inválido ignorado:', ['email' => $destinatario]);
            }
        }

        // Limpiar archivos temporales
        if ($pdfPath && file_exists($pdfPath)) {
            unlink($pdfPath);
        }
        
        foreach ($attachments as $attachment) {
            if (file_exists($attachment['path'])) {
                unlink($attachment['path']);
            }
        }

        Log::info('Contrato enviado por email', [
            'contrato_id' => $request->contratoId,
            'destinatarios' => $to,
            'tipo' => $request->tipo ?? 'cliente',
            'usuario_id' => auth()->id(),
            'from_email' => $fromEmail,
            'compania' => $compania['nombre'] ?? 'LocalSat'
        ]);

        // DEVOLVER RESPUESTA PARA INERTIA
        if ($request->header('X-Inertia')) {
            return redirect()->back()->with('success', 'Email enviado correctamente');
        }

        return response()->json([
            'success' => true,
            'message' => 'Email enviado correctamente'
        ]);

    } catch (\Exception $e) {
        Log::error('Error enviando contrato por email:', [
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);

        if ($request->header('X-Inertia')) {
            return redirect()->back()->with('error', 'Error al enviar el email: ' . $e->getMessage());
        }

        return response()->json([
            'success' => false,
            'error' => 'Error al enviar el email: ' . $e->getMessage()
        ], 500);
    }
}

    /**
     * Enviar presupuesto por email
     */
    public function enviarPresupuesto(Request $request)
    {
        try {
            $request->validate([
                'to' => 'required|string|email',
                'cc' => 'nullable|array',
                'bcc' => 'nullable|array',
                'subject' => 'required|string|max:255',
                'body' => 'required|string',
                'presupuestoId' => 'required|integer',
                'referencia' => 'required|string',
                'attachPDF' => 'boolean',
                'pdfBase64' => 'nullable|string'
            ]);

            // 🔥 OBTENER DATOS DE LA COMPAÑÍA DEL PRESUPUESTO (igual que en PresupuestosController)
            $presupuesto = \App\Models\Presupuesto::with([
                'prefijo.comercial.compania',
                'prefijo.comercial.personal'
            ])->find($request->presupuestoId);
            
            $compania = $this->getCompaniaDataFromPresupuesto($presupuesto);

            $data = [
                'subject' => $request->subject,
                'body' => $request->body,
                'cc' => $request->cc ?? [],
                'bcc' => $request->bcc ?? [],
                'filename' => "Presupuesto_{$request->referencia}.pdf",
                'compania' => $compania,
            ];

            $pdfPath = null;
            
            if ($request->attachPDF && $request->pdfBase64) {
                $pdfContent = base64_decode($request->pdfBase64);
                $tempDir = storage_path('app/temp');
                
                if (!file_exists($tempDir)) {
                    mkdir($tempDir, 0755, true);
                }
                
                $pdfPath = $tempDir . "/presupuesto_{$request->presupuestoId}_" . time() . ".pdf";
                file_put_contents($pdfPath, $pdfContent);
            }

            // Obtener datos del usuario para el remitente
            $usuario = auth()->user();
            $fromEmail = $usuario->personal->email ?? env('MAIL_FROM_ADDRESS', 'noreply@localsat.com.ar');
            $fromName = $usuario->personal->nombre_completo ?? $usuario->name ?? 'LocalSat';

            Mail::to($request->to)
                ->send(new PresupuestoEnviado($data, $pdfPath, $fromEmail, $fromName, $compania));

            if ($pdfPath && file_exists($pdfPath)) {
                unlink($pdfPath);
            }

            Log::info('Presupuesto enviado por email', [
                'presupuesto_id' => $request->presupuestoId,
                'destinatario' => $request->to,
                'usuario_id' => auth()->id(),
                'from_email' => $fromEmail,
                'compania' => $compania['nombre'] ?? 'LocalSat'
            ]);

            // DEVOLVER RESPUESTA PARA INERTIA
            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('success', 'Email enviado correctamente');
            }

            return response()->json([
                'success' => true,
                'message' => 'Email enviado correctamente'
            ]);

        } catch (\Exception $e) {
            Log::error('Error enviando presupuesto por email:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('error', 'Error al enviar el email: ' . $e->getMessage());
            }

            return response()->json([
                'success' => false,
                'error' => 'Error al enviar el email: ' . $e->getMessage()
            ], 500);
        }
    }

private function getCompaniaDataFromContrato($contrato)
{
    $compania = [
        'id' => 1,
        'nombre' => 'LOCALSAT',
        'logo' => public_path('images/logos/logo.png'),
        'logo_public' => asset('images/logos/logo.png')
    ];
    
    if ($contrato && $contrato->presupuesto && $contrato->presupuesto->prefijo) {
        $comercial = $contrato->presupuesto->prefijo->comercial;
        
        if ($comercial instanceof \Illuminate\Database\Eloquent\Collection) {
            $comercial = $comercial->first();
        }
        
        if ($comercial && $comercial->compania_id) {
            $companiaId = $comercial->compania_id;
            $logoFile = match($companiaId) {
                1 => 'images/logos/logo.png',
                2 => 'images/logos/logosmart.png',
                3 => 'images/logos/360-logo.png',
                default => 'images/logos/logo.png'
            };
            
            $compania = [
                'id' => $companiaId,
                'nombre' => match($companiaId) {
                    1 => 'LOCALSAT',
                    2 => 'SMARTSAT',
                    3 => '360 SAT',
                    default => 'LOCALSAT'
                },
                'logo' => public_path($logoFile),
                'logo_public' => asset($logoFile)
            ];
        }
    }
    
    return $compania;
}

private function getCompaniaDataFromPresupuesto($presupuesto)
{
    $compania = [
        'id' => 1,
        'nombre' => 'LOCALSAT',
        'logo' => public_path('images/logos/logo.png'),
        'logo_public' => asset('images/logos/logo.png')
    ];
    
    if ($presupuesto && $presupuesto->prefijo && $presupuesto->prefijo->comercial) {
        $comercial = $presupuesto->prefijo->comercial;
        
        if ($comercial instanceof \Illuminate\Database\Eloquent\Collection) {
            $comercial = $comercial->first();
        }
        
        if ($comercial && $comercial->compania_id) {
            $companiaId = $comercial->compania_id;
            $logoFile = match($companiaId) {
                1 => 'images/logos/logo.png',
                2 => 'images/logos/logosmart.png',
                3 => 'images/logos/360-logo.png',
                default => 'images/logos/logo.png'
            };
            
            $compania = [
                'id' => $companiaId,
                'nombre' => match($companiaId) {
                    1 => 'LOCALSAT',
                    2 => 'SMARTSAT',
                    3 => '360 SAT',
                    default => 'LOCALSAT'
                },
                'logo' => public_path($logoFile),
                'logo_public' => asset($logoFile)
            ];
        }
    }
    
    return $compania;
}
}