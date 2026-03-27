<!-- resources/views/whatsapp/preview.blade.php -->
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta property="og:title" content="Lead: {{ $nombreLead }}" />
    <meta property="og:description" content="Haz clic para contactar al lead por WhatsApp" />
    <meta property="og:type" content="website" />
    <title>Contactar Lead</title>
</head>
<body>
    <h1>Lead: {{ $nombreLead }}</h1>
    <p>Haz clic en el enlace para contactar al lead por WhatsApp</p>
</body>
</html>