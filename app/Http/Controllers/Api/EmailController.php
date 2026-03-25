<?php
// app/Http/Controllers/Api/EmailController.php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Mail\ContratoEnviado;
use App\Mail\PresupuestoEnviado;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Mail;
use Illuminate\Support\Facades\Log;

class EmailController extends Controller
{
    /**
     * Normalizar un campo que puede venir como JSON string con comillas escapadas
     */
    private function normalizeField($value)
    {
        if (!is_string($value)) {
            return $value;
        }
        
        // Quitar comillas al inicio y final si existen
        $value = preg_replace('/^"|"$/', '', $value);
        
        // Si parece JSON string, intentar decodificar
        if (strpos($value, '\\"') !== false || strpos($value, '"') !== false) {
            $decoded = json_decode('"' . str_replace('"', '\"', $value) . '"');
            if (json_last_error() === JSON_ERROR_NONE && is_string($decoded)) {
                return $decoded;
            }
            
            // Intentar decodificar directamente
            $decoded = json_decode($value);
            if (json_last_error() === JSON_ERROR_NONE && is_string($decoded)) {
                return $decoded;
            }
        }
        
        // Decodificar escapes de JSON
        $value = stripslashes($value);
        
        return $value;
    }

    /**
     * Procesar destinatarios desde un string que puede tener múltiples formatos
     */
    private function parseRecipients($input)
    {
        if (empty($input)) {
            return [];
        }
        
        // Normalizar el input
        $input = $this->normalizeField($input);
        
        // Si es un array, devolverlo
        if (is_array($input)) {
            return array_filter($input, function($email) {
                return filter_var($email, FILTER_VALIDATE_EMAIL);
            });
        }
        
        // Si es string, intentar decodificar JSON
        if (is_string($input)) {
            $decoded = json_decode($input, true);
            if (json_last_error() === JSON_ERROR_NONE && is_array($decoded)) {
                return array_filter($decoded, function($email) {
                    return filter_var($email, FILTER_VALIDATE_EMAIL);
                });
            }
            
            // Separar por ; o , y limpiar
            $recipients = preg_split('/[;,]+/', $input);
            $recipients = array_map('trim', $recipients);
            $recipients = array_filter($recipients, function($email) {
                return !empty($email) && filter_var($email, FILTER_VALIDATE_EMAIL);
            });
            
            return $recipients;
        }
        
        return [];
    }

    /**
     * Enviar contrato por email
     */
    public function enviarContrato(Request $request)
    {
        try {
            Log::info('Datos recibidos para enviar contrato (original):', [
                'tipo' => $request->tipo,
                'to' => $request->to,
                'subject' => $request->subject,
                'contratoId' => $request->contratoId,
                'numeroContrato' => $request->numeroContrato,
            ]);
            
            // 🔥 NORMALIZAR TODOS LOS CAMPOS DE TEXTO
            $tipo = $this->normalizeField($request->input('tipo'));
            $body = $this->normalizeField($request->input('body'));
            $numeroContrato = $this->normalizeField($request->input('numeroContrato'));
            $subject = $this->normalizeField($request->input('subject'));
            
            // Normalizar tipo
            if (empty($tipo) || $tipo === 'null' || $tipo === 'undefined') {
                $tipo = null;
            }
            
            if (in_array(strtolower($tipo), ['administracion', 'cliente'])) {
                $tipo = strtolower($tipo);
            }
            
            // Normalizar body (saltos de línea)
            $body = str_replace(['\\n', '\n'], "\n", $body);
            $body = str_replace(['\\r', '\r'], "\n", $body);
            $body = preg_replace("/\r\n|\r|\n/", "\n", $body);
            
            // Eliminar saltos de línea excesivos
            $lines = explode("\n", $body);
            $filteredLines = [];
            $lastWasEmpty = false;
            
            foreach ($lines as $line) {
                $line = rtrim($line);
                
                if ($line === '') {
                    if (!$lastWasEmpty && !empty($filteredLines)) {
                        $filteredLines[] = '';
                        $lastWasEmpty = true;
                    }
                } else {
                    $filteredLines[] = $line;
                    $lastWasEmpty = false;
                }
            }
            
            $body = implode("\n", $filteredLines);
            
            // Reemplazar en el request
            $request->merge([
                'tipo' => $tipo,
                'body' => $body,
                'numeroContrato' => $numeroContrato,
                'subject' => $subject,
            ]);
            
            // Validación básica
            $validated = $request->validate([
                'to' => 'required',
                'cc' => 'nullable',
                'bcc' => 'nullable',
                'subject' => 'required|string|max:255',
                'body' => 'required|string',
                'contratoId' => 'required|integer',
                'numeroContrato' => 'required|string',
                'tipo' => 'nullable|string|in:administracion,cliente',
                'incluirBienvenida' => 'nullable',
                'bienvenidaData' => 'nullable',
                'pdf' => 'nullable|file|mimes:pdf|max:10240'
            ]);
            
            // 🔥 PROCESAR DESTINATARIOS
            $to = $this->parseRecipients($request->to);
            $cc = $this->parseRecipients($request->cc);
            $bcc = $this->parseRecipients($request->bcc);
            
            if (empty($to)) {
                throw new \Exception('Debe especificar al menos un destinatario válido');
            }
            
            // Procesar incluirBienvenida
            $incluirBienvenida = false;
            if ($request->incluirBienvenida) {
                $bienvenidaRaw = $this->normalizeField($request->incluirBienvenida);
                $incluirBienvenida = json_decode($bienvenidaRaw, true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    $incluirBienvenida = filter_var($bienvenidaRaw, FILTER_VALIDATE_BOOLEAN);
                }
            }
            
            // Procesar bienvenidaData
            $bienvenidaDataRaw = null;
            if ($request->bienvenidaData) {
                $bienvenidaDataRaw = json_decode($this->normalizeField($request->bienvenidaData), true);
                if (json_last_error() !== JSON_ERROR_NONE) {
                    $bienvenidaDataRaw = null;
                }
            }
            
            // Obtener datos del contrato
            $contrato = \App\Models\Contrato::with([
                'presupuesto.prefijo.comercial.compania',
                'presupuesto.prefijo.comercial.personal'
            ])->find($request->contratoId);
            
            $compania = $this->getCompaniaDataFromContrato($contrato);
            
            // Preparar datos para la vista de bienvenida
            $bienvenidaViewData = null;
            $bienvenidaView = null;
            
            if ($incluirBienvenida && $bienvenidaDataRaw) {
                $companiaId = $bienvenidaDataRaw['companiaId'] ?? $compania['id'];
                $plataforma = $bienvenidaDataRaw['plataforma'] ?? 'ALPHA';
                $nombreCliente = $bienvenidaDataRaw['nombreCliente'];
                $nombreFlota = $bienvenidaDataRaw['nombreFlota'];
                $comercialNombre = $bienvenidaDataRaw['comercialNombre'];
                $comercialEmail = $bienvenidaDataRaw['comercialEmail'];
                $comercialTelefono = $bienvenidaDataRaw['comercialTelefono'] ?? '11 3456-7890';
                
                $fotoComercial = strtolower(preg_replace('/\s+/', '', $comercialNombre)) . '.png';
                
                $bienvenidaViewData = [
                    'primerNombreLead' => explode(' ', $nombreCliente)[0],
                    'nombreFlota' => strtolower(preg_replace('/\s+/', '.', $nombreFlota)),
                    'comercialNombre' => $comercialNombre,
                    'comercialEmail' => $comercialEmail,
                    'comercialTelefono' => $comercialTelefono,
                    'inicialesComercial' => substr($comercialNombre, 0, 2),
                    'fotoComercial' => $fotoComercial,
                ];
                
                if ($companiaId == 2) {
                    $bienvenidaView = 'emails.bienvenida.smartsat';
                } elseif ($plataforma === 'DELTA') {
                    $bienvenidaView = 'emails.bienvenida.localsat_delta';
                } else {
                    $bienvenidaView = 'emails.bienvenida.localsat_alpha';
                }
            }
            
            $data = [
                'subject' => $subject,
                'body' => $body,
                'cc' => $cc,
                'bcc' => $bcc,
                'filename' => "Contrato_{$numeroContrato}.pdf",
                'tipo' => $tipo ?? 'cliente',
                'compania' => $compania,
                'incluirBienvenida' => $incluirBienvenida,
                'bienvenidaView' => $bienvenidaView,
                'bienvenidaViewData' => $bienvenidaViewData,
            ];
            
            // Procesar PDF
            $pdfPath = null;
            $attachments = [];
            
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
            
            $usuario = auth()->user();
            $fromEmail = $usuario->personal->email ?? env('MAIL_FROM_ADDRESS', 'noreply@localsat.com.ar');
            $fromName = $usuario->personal->nombre_completo ?? $usuario->name ?? 'LocalSat';
            
            foreach ($to as $destinatario) {
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
                'tipo' => $tipo,
                'usuario_id' => auth()->id(),
            ]);
            
            if ($request->header('X-Inertia')) {
                return redirect()->back()->with('success', 'Email enviado correctamente');
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Email enviado correctamente'
            ]);
            
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error('Error de validación:', [
                'errors' => $e->errors(),
                'received_data' => $request->except(['pdf'])
            ]);
            
            if ($request->header('X-Inertia')) {
                return redirect()->back()->withErrors($e->errors());
            }
            
            return response()->json([
                'success' => false,
                'errors' => $e->errors()
            ], 422);
            
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
                'incluirBienvenida' => false,
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

    /**
     * Obtener vista previa del mensaje de bienvenida
     */
    public function vistaPreviaBienvenida(Request $request)
    {
        try {
            $validated = $request->validate([
                'companiaId' => 'required|integer',
                'plataforma' => 'nullable|string',
                'nombreCliente' => 'required|string',
                'nombreFlota' => 'required|string',
                'comercialNombre' => 'required|string',
                'comercialEmail' => 'required|string',
                'comercialTelefono' => 'nullable|string'
            ]);
            
            $companiaId = $validated['companiaId'];
            $plataforma = $validated['plataforma'] ?? 'ALPHA';
            $nombreCliente = $validated['nombreCliente'];
            $nombreFlota = $validated['nombreFlota'];
            $comercialNombre = $validated['comercialNombre'];
            $comercialEmail = $validated['comercialEmail'];
            $comercialTelefono = $validated['comercialTelefono'] ?? '11 3456-7890';
            
            $fotoComercial = strtolower(preg_replace('/\s+/', '', $comercialNombre)) . '.png';
            
            $bienvenidaViewData = [
                'primerNombreLead' => explode(' ', $nombreCliente)[0],
                'nombreFlota' => strtolower(preg_replace('/\s+/', '.', $nombreFlota)),
                'comercialNombre' => $comercialNombre,
                'comercialEmail' => $comercialEmail,
                'comercialTelefono' => $comercialTelefono,
                'inicialesComercial' => substr($comercialNombre, 0, 2),
                'fotoComercial' => $fotoComercial,
            ];
            
            if ($companiaId == 2) {
                $view = 'emails.bienvenida.smartsat';
            } elseif ($plataforma === 'DELTA') {
                $view = 'emails.bienvenida.localsat_delta';
            } else {
                $view = 'emails.bienvenida.localsat_alpha';
            }
            
            $html = view($view, $bienvenidaViewData)->render();
            
            return response()->json([
                'success' => true,
                'html' => $html
            ]);
            
        } catch (\Exception $e) {
            Log::error('Error generando vista previa de bienvenida:', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => $e->getMessage()
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