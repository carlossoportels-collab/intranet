{{-- resources/views/emails/contrato.blade.php --}}
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>{{ $data['subject'] }}</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            line-height: 1.6;
            color: #333;
            margin: 0;
            padding: 0;
        }
        .container {
            max-width: 600px;
            margin: 0 auto;
            padding: 20px;
        }
        .header {
            background: #f8f9fa;
            padding: 20px;
            text-align: center;
            border-bottom: 3px solid #fa6400;
        }
        .logo {
            max-height: 60px;
            max-width: 200px;
        }
        .content {
            padding: 30px 20px;
            background: white;
        }
        .email-body {
            font-family: 'Courier New', 'Monaco', monospace;
            font-size: 13px;
            line-height: 1.5;
            background-color: #f9fafb;
            padding: 20px;
            border-radius: 8px;
            border: 1px solid #e5e7eb;
            margin: 0;
            white-space: pre-wrap;
            word-wrap: break-word;
        }
        .footer {
            margin-top: 20px;
            padding-top: 20px;
            border-top: 1px solid #e5e7eb;
            font-size: 12px;
            color: #6b7280;
            text-align: center;
        }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            @php
                $logoPath = null;
                if (!empty($compania['logo']) && file_exists($compania['logo'])) {
                    $logoPath = $compania['logo'];
                } elseif (!empty($compania['logo_public'])) {
                    $logoPath = $compania['logo_public'];
                }
            @endphp
            
            @if($logoPath && file_exists($logoPath))
                <img src="{{ $message->embed($logoPath) }}" class="logo" alt="{{ $compania['nombre'] ?? 'LocalSat' }}">
            @elseif(!empty($compania['logo_public']))
                <img src="{{ $compania['logo_public'] }}" class="logo" alt="{{ $compania['nombre'] ?? 'LocalSat' }}">
            @else
                <h2>{{ $compania['nombre'] ?? config('app.name') }}</h2>
            @endif
        </div>
        
    <div class="content">
    @php
        // 🔥 PROCESAMIENTO SIMPLE
        $texto = $body;
        
        // Solo quitar comillas si existen
        $texto = preg_replace('/^"|"$/', '', $texto);
        
        // Convertir \n literales a saltos de línea reales
        $texto = str_replace('\\n', "\n", $texto);
        
        // Normalizar saltos de línea
        $texto = preg_replace("/\r\n|\r|\n/", "\n", $texto);
        
        // Convertir a HTML con <br>
        $textoHtml = nl2br(e($texto));
    @endphp
    
    <div class="email-body">
        {!! $textoHtml !!}
    </div>
</div>
        
        <div class="footer">
            <p>&copy; {{ date('Y') }} {{ $compania['nombre'] ?? config('app.name') }}. Todos los derechos reservados.</p>
        </div>
    </div>
</body>
</html>