<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=5">
    <title>@yield('title')</title>
    <link rel="preconnect" href="https://fonts.bunny.net">
    <link href="https://fonts.bunny.net/css?family=inter:400,500,600,700,800&display=swap" rel="stylesheet" />
    @vite(['resources/css/app.css'])
    <style>
        /* Estilos específicos que no pueden ir en app.css por usar variables dinámicas */
        .satellite-card {
            background: rgba(255, 255, 255, 0.96);
            backdrop-filter: blur(12px);
            width: 100%;
            max-width: 480px;
            border-radius: 32px;
            overflow: hidden;
            box-shadow: 0 30px 60px -12px rgba(0, 0, 0, 0.6);
            border: 1px solid rgba(255, 102, 0, 0.1);
            animation: cardEntrance 0.8s cubic-bezier(0.34, 1.56, 0.64, 1);
        }

        .satellite-header {
            background: linear-gradient(135deg, #1a1f30 0%, #0B1020 100%);
            padding: 2rem 2rem 1.5rem;
            position: relative;
            overflow: hidden;
        }

        .company-name {
            color: white;
            font-size: 1.4rem;
            font-weight: 700;
            letter-spacing: 2px;
            white-space: nowrap;
        }

        .company-name .sat { color: #FF6600; }

        .coordinates {
            font-family: 'Courier New', monospace;
            color: rgba(255,255,255,0.7);
            font-size: 0.8rem;
            margin-top: 1.5rem;
            display: flex;
            gap: 1rem;
        }

        .coordinates span { color: #FF6600; font-weight: bold; }

        /* Radar Waves - animación específica */
        .radar-waves {
            position: absolute;
            top: 0;
            right: 0;
            width: 120px;
            height: 120px;
            z-index: 5;
        }

        .radar-waves .dot {
            position: absolute;
            top: 50%;
            right: 50%;
            transform: translate(50%, -50%);
            width: 12px;
            height: 12px;
            background: #FF6600;
            border-radius: 50%;
            box-shadow: 0 0 25px #FF6600;
            z-index: 6;
            animation: dotGlow 6s ease-in-out infinite;
        }

        @keyframes dotGlow {
            0%, 100% { opacity: 0.8; transform: translate(50%, -50%) scale(1); }
            50% { opacity: 1; transform: translate(50%, -50%) scale(1.3); }
        }

        .radar-waves .wave {
            position: absolute;
            top: 0;
            right: 0;
            width: 100%;
            height: 100%;
            border: 2px solid rgba(255, 102, 0, 0.5);
            border-radius: 50%;
            animation: radarWave 8s ease-out infinite;
            opacity: 0;
        }

        .radar-waves .wave:nth-child(2) { animation-delay: 1.6s; }
        .radar-waves .wave:nth-child(3) { animation-delay: 3.2s; }
        .radar-waves .wave:nth-child(4) { animation-delay: 4.8s; }
        .radar-waves .wave:nth-child(5) { animation-delay: 6.4s; }

        @keyframes radarWave {
            0% {
                transform: scale(0.1);
                opacity: 0.8;
                border-color: rgba(255, 102, 0, 0.8);
                border-width: 3px;
            }
            100% {
                transform: scale(2.5);
                opacity: 0;
                border-color: rgba(255, 102, 0, 0);
                border-width: 1px;
            }
        }

        /* Error indicator */
        .error-indicator {
            padding: 2rem;
            background: rgba(255, 102, 0, 0.03);
            border-left: 5px solid #FF6600;
        }

        .error-code {
            font-size: clamp(4rem, 15vw, 5.5rem);
            font-weight: 900;
            color: #1a1f30;
            line-height: 0.9;
            letter-spacing: -4px;
        }

        .error-code span { 
            color: #FF6600; 
            animation: glitch 3s infinite;
            display: inline-block;
        }

        @keyframes glitch {
            0%, 90%, 100% { transform: none; opacity: 1; }
            92% { transform: skewX(10deg); opacity: 0.8; }
            95% { transform: skewX(-10deg); opacity: 0.9; }
        }

        .error-type {
            color: #888;
            font-size: 0.85rem;
            text-transform: uppercase;
            letter-spacing: 4px;
            margin-top: 0.5rem;
        }

        /* Signal Map */
        .signal-map {
            background: #1a1f30;
            padding: 1.2rem 2rem;
            display: flex;
            align-items: center;
            gap: 1.5rem;
        }

        .map-dot {
            width: 10px;
            height: 10px;
            background: #FF6600;
            border-radius: 50%;
            box-shadow: 0 0 15px #FF6600;
            animation: pulse 2s ease-in-out infinite;
        }

        @keyframes pulse {
            0%, 100% { transform: scale(1); opacity: 1; }
            50% { transform: scale(1.2); opacity: 0.8; }
        }

        .map-line {
            flex: 1;
            height: 1px;
            background: linear-gradient(90deg, #FF6600, transparent);
            position: relative;
            overflow: hidden;
        }

        .map-line::after {
            content: '';
            position: absolute;
            left: -100%;
            width: 100%;
            height: 100%;
            background: linear-gradient(90deg, transparent, #fff, transparent);
            animation: dataFlow 2s linear infinite;
        }

        @keyframes dataFlow {
            0% { left: -100%; }
            100% { left: 100%; }
        }

        .signal-text {
            color: white;
            font-family: monospace;
            font-size: 0.75rem;
            letter-spacing: 1px;
            text-transform: uppercase;
        }

        .signal-text span {
            color: #FF6600;
            font-weight: bold;
        }

        /* Message area */
        .message-area { padding: 2rem; }

        .message-body {
            color: #4a5568;
            background: #fdf2e9;
            padding: 1.5rem;
            border-radius: 20px;
            border: 1px dashed rgba(255, 102, 0, 0.3);
            margin-bottom: 2rem;
            font-size: 1.1rem;
            line-height: 1.5;
            text-align: center;
        }

        .support-message {
            text-align: center;
            color: #6c757d;
            font-size: 0.85rem;
            margin: 1rem 0 1.5rem;
            padding: 0.5rem;
            border-top: 1px dashed #dee2e6;
        }

        .support-message strong {
            color: #FF6600;
            font-weight: 600;
        }

        /* Botones */
        .btn {
            display: block;
            padding: 1.2rem;
            border-radius: 50px;
            text-decoration: none;
            font-weight: 800;
            text-transform: uppercase;
            transition: all 0.2s ease;
            text-align: center;
            border: 2px solid transparent;
            letter-spacing: 1px;
            font-size: 0.95rem;
            cursor: pointer;
            box-shadow: 0 4px 10px rgba(0, 0, 0, 0.2);
        }

        .btn-primary {
            background: #FF6600;
            color: white;
            border: 2px solid #ff944d;
        }

        .btn-primary:hover {
            background: #cc5200;
            border-color: #ff6600;
            transform: translateY(-2px);
            box-shadow: 0 8px 15px rgba(255, 102, 0, 0.5);
        }

        .btn-primary:active {
            transform: translateY(1px);
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }

        .btn-secondary {
            background: #1a1f30;
            color: white;
            border: 2px solid #4a5568;
        }

        .btn-secondary:hover {
            background: #2a2f40;
            border-color: #FF6600;
            transform: translateY(-2px);
            box-shadow: 0 8px 15px rgba(0, 0, 0, 0.5);
        }

        .btn-secondary:active {
            transform: translateY(1px);
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.2);
        }

        /* Footer */
        .satellite-footer {
            padding: 1rem 2rem;
            background: #f8f9fa;
            border-top: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            font-size: 0.75rem;
        }

        .footer-left {
            color: #999;
        }

        .footer-left strong {
            color: #FF6600;
            font-weight: 600;
        }

        .status-dot {
            width: 8px;
            height: 8px;
            background: #10b981;
            border-radius: 50%;
            animation: pulse-green 2s infinite;
        }

        @keyframes pulse-green {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
            100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
        }

        @keyframes cardEntrance {
            0% { opacity: 0; transform: scale(0.9) translateY(40px); }
            100% { opacity: 1; transform: scale(1) translateY(0); }
        }

        /* Responsive */
        @media (max-width: 480px) {
            .satellite-header {
                padding: 1.5rem 1.5rem 1rem;
            }
            
            .company-name {
                font-size: 1.2rem;
            }
            
            .coordinates {
                flex-direction: column;
                gap: 0.3rem;
            }
            
            .signal-map {
                padding: 1rem;
                gap: 0.8rem;
            }
            
            .signal-text {
                font-size: 0.65rem;
            }
            
            .radar-waves {
                width: 80px;
                height: 80px;
            }

            .error-indicator {
                padding: 1.5rem;
            }

            .message-area {
                padding: 1.5rem;
            }

            .message-body {
                padding: 1rem;
            }

            .btn {
                padding: 1rem;
            }
        }
    </style>
</head>
<body class="bg-space min-h-screen flex items-center justify-center p-4 relative overflow-hidden">
    <div id="star-container"></div>

    <div class="satellite-card relative z-10">
        <div class="satellite-header">
            <!-- ANIMACIÓN DE ONDAS DE RADAR -->
            <div class="radar-waves">
                <div class="dot"></div>
                <div class="wave"></div>
                <div class="wave"></div>
                <div class="wave"></div>
                <div class="wave"></div>
                <div class="wave"></div>
            </div>
            
            <!-- Header content -->
            <div class="header-content flex items-center gap-4 relative z-10">
                <div class="company-logo">
                    <img src="/images/logos/localsatsolo.png" alt="LocalSat" class="w-[45px] h-auto filter drop-shadow-[0_0_8px_rgba(255,102,0,0.4)]">
                </div>
                <div class="company-name">LOCAL<span class="sat">SAT</span></div>
            </div>
            
            <div class="coordinates">
                <div><span>LAT:</span> <span id="lat">-34.534569</span></div>
                <div><span>LON:</span> <span id="lon">-58.468085</span></div>
            </div>
        </div>

        <div class="error-indicator">
            <div class="error-code"><span>@yield('code')</span></div>
            <div class="error-type">@yield('title')</div>
        </div>

        <div class="signal-map">
            <div class="map-dot"></div>
            <div class="map-line"></div>
            <div class="signal-text">
                <span>⚠️</span> SEÑAL INTERRUMPIDA <span>⚠️</span>
            </div>
        </div>

        <div class="message-area">
            <div class="message-body">
                @yield('message')
            </div>
            
            <div class="support-message">
                ⚡ Si el problema persiste, avisa a <strong>intranet@localsat.com.ar</strong> ⚡
            </div>
            
            <div class="actions flex flex-col gap-4">
                @yield('actions')
            </div>
        </div>

        <div class="satellite-footer">
            <div class="footer-left">
                LOCALSAT <strong>INTRANET</strong> • v1.0
            </div>
            <div class="status flex items-center gap-2">
                <div class="status-dot"></div>
                <span class="font-bold text-gray-600">ONLINE</span>
            </div>
        </div>
    </div>

    <script>
        // Generar Estrellas (usando las clases de app.css)
        const container = document.getElementById('star-container');
        if (container) {
            const starCount = 50;

            for (let i = 0; i < starCount; i++) {
                const star = document.createElement('div');
                star.className = 'star-bright';
                const size = Math.random() * 3 + 1 + 'px';
                star.style.width = size;
                star.style.height = size;
                star.style.left = Math.random() * 100 + '%';
                star.style.top = Math.random() * 100 + '%';
                star.style.setProperty('--duration', (2 + Math.random() * 4) + 's');
                star.style.animationDelay = Math.random() * 5 + 's';
                container.appendChild(star);
            }

            // Estrellas Fugaces
            function createShootingStar() {
                const shootingStar = document.createElement('div');
                shootingStar.className = 'shooting-star';
                shootingStar.style.left = (50 + Math.random() * 50) + '%';
                shootingStar.style.top = (Math.random() * 50) + '%';
                shootingStar.style.animationDuration = (2 + Math.random() * 2) + 's';
                container.appendChild(shootingStar);
                setTimeout(() => shootingStar.remove(), 3000);
            }

            setInterval(createShootingStar, 2000);
            
            for (let i = 0; i < 3; i++) {
                setTimeout(createShootingStar, i * 300);
            }
        }

        // Simulación de Telemetría Dinámica
        function jitter(elementId, baseValue) {
            const el = document.getElementById(elementId);
            if (el) {
                setInterval(() => {
                    const noise = (Math.random() * 0.000099).toFixed(6);
                    el.innerText = (parseFloat(baseValue) + parseFloat(noise)).toFixed(6);
                }, 150);
            }
        }

        jitter('lat', '-34.534569');
        jitter('lon', '-58.468085');
    </script>
</body>
</html>