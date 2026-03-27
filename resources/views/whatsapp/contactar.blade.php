<!-- resources/views/whatsapp/contactar.blade.php -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Contactar Lead - Confirmación</title>
    <style>
        body {
            font-family: system-ui, -apple-system, sans-serif;
            display: flex;
            justify-content: center;
            align-items: center;
            min-height: 100vh;
            margin: 0;
            background: #f3f4f6;
        }
        .container {
            background: white;
            padding: 2rem;
            border-radius: 1rem;
            box-shadow: 0 4px 6px rgba(0,0,0,0.1);
            text-align: center;
            max-width: 400px;
        }
        h1 {
            color: #1f2937;
            margin-bottom: 1rem;
        }
        p {
            color: #4b5563;
            margin-bottom: 1.5rem;
        }
        button {
            background-color: #25D366;
            color: white;
            border: none;
            padding: 12px 24px;
            border-radius: 8px;
            font-size: 16px;
            font-weight: 600;
            cursor: pointer;
            width: 100%;
        }
        button:hover {
            background-color: #128C7E;
        }
        .info {
            font-size: 14px;
            color: #6b7280;
            margin-top: 1rem;
        }
    </style>
</head>
<body>
    <div class="container">
        <h1>📱 Contactar Lead</h1>
        <p>Haz clic en el botón para contactar a <strong>{{ $lead->nombre_completo }}</strong> por WhatsApp</p>
        <button onclick="contactar()">
            Abrir WhatsApp
        </button>
        <div class="info">
            ⚡ Al hacer clic se registrará el contacto automáticamente
        </div>
    </div>

    <script>
        function contactar() {
            const urlActual = window.location.href;
            const urlConClick = urlActual.includes('?') 
                ? urlActual + '&click=1' 
                : urlActual + '?click=1';
            window.location.href = urlConClick;
        }
        
        // Auto-redirigir después de 2 segundos (opcional)
        setTimeout(() => {
            contactar();
        }, 2000);
    </script>
</body>
</html>