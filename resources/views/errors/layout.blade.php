<!DOCTYPE html>
<html lang="{{ str_replace('_', '-', app()->getLocale()) }}">
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>@yield('title', 'Error') - LocalSat</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Instrument Sans', system-ui, -apple-system, 'Courier New', monospace;
            min-height: 100vh;
            background: #f4e4bc;
            background-image: 
                linear-gradient(#e0d0a8 1px, transparent 1px),
                linear-gradient(90deg, #e0d0a8 1px, transparent 1px);
            background-size: 30px 30px;
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 1rem;
        }
        
        .paper {
            background: #fff9e6;
            padding: 1.5rem;
            max-width: 700px;
            width: 100%;
            box-shadow: 
                0 10px 30px rgba(0, 0, 0, 0.2),
                0 0 0 1px #3C3C3E,
                0 0 0 2px #FF6600;
            position: relative;
            border-radius: 4px;
        }
        
        @media (min-width: 640px) {
            .paper {
                padding: 3rem;
            }
        }
        
        .paper::before {
            content: '';
            position: absolute;
            top: 8px;
            left: 8px;
            right: 8px;
            bottom: 8px;
            border: 1px dashed #3C3C3E;
            pointer-events: none;
            border-radius: 2px;
        }
        
        @media (min-width: 640px) {
            .paper::before {
                top: 12px;
                left: 12px;
                right: 12px;
                bottom: 12px;
            }
        }
        
        .tape {
            position: absolute;
            top: -12px;
            left: 50%;
            transform: translateX(-50%);
            background: #e8e0c8;
            width: 100px;
            height: 24px;
            border: 1px solid #3C3C3E;
            opacity: 0.7;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
        }
        
        @media (min-width: 640px) {
            .tape {
                top: -15px;
                width: 150px;
                height: 30px;
            }
        }
        
        .tools {
            display: flex;
            justify-content: center;
            gap: 1rem;
            margin-bottom: 1.5rem;
            position: relative;
            flex-wrap: wrap;
        }
        
        @media (min-width: 640px) {
            .tools {
                gap: 2rem;
                margin-bottom: 2.5rem;
            }
        }
        
        .tool {
            width: 50px;
            height: 50px;
            background: #3C3C3E;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
            border: 2px solid #FF6600;
            box-shadow: 0 3px 0 #2a2a2c;
        }
        
        @media (min-width: 640px) {
            .tool {
                width: 70px;
                height: 70px;
                border-width: 3px;
                box-shadow: 0 5px 0 #2a2a2c;
            }
        }
        
        .tool svg {
            width: 28px;
            height: 28px;
            fill: white;
        }
        
        @media (min-width: 640px) {
            .tool svg {
                width: 40px;
                height: 40px;
            }
        }
        
        .error-code {
            font-size: 4rem;
            font-weight: 900;
            text-align: center;
            color: #3C3C3E;
            text-shadow: 2px 2px 0 #FF6600;
            margin-bottom: 0.5rem;
            font-family: 'Courier New', monospace;
            letter-spacing: -3px;
        }
        
        @media (min-width: 640px) {
            .error-code {
                font-size: 6rem;
                text-shadow: 3px 3px 0 #FF6600;
                letter-spacing: -5px;
            }
        }
        
        .error-title {
            font-size: 1.5rem;
            text-align: center;
            color: #3C3C3E;
            margin-bottom: 1rem;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        
        @media (min-width: 640px) {
            .error-title {
                font-size: 2.5rem;
                letter-spacing: 2px;
                margin-bottom: 1.5rem;
            }
        }
        
        .error-message {
            text-align: center;
            color: #666;
            margin-bottom: 1.5rem;
            font-size: 0.9rem;
            line-height: 1.5;
            font-style: italic;
            border-top: 1px dashed #3C3C3E;
            border-bottom: 1px dashed #3C3C3E;
            padding: 1rem 0;
        }
        
        @media (min-width: 640px) {
            .error-message {
                margin-bottom: 2rem;
                font-size: 1.2rem;
                padding: 1.5rem 0;
            }
        }
        
        .signature {
            text-align: center;
            font-family: 'Courier New', monospace;
            color: #999;
            margin-bottom: 1.5rem;
            font-size: 0.8rem;
        }
        
        @media (min-width: 640px) {
            .signature {
                margin-bottom: 2rem;
                font-size: 0.9rem;
            }
        }
        
        .btn {
            display: inline-block;
            padding: 0.75rem 1.5rem;
            background: #FF6600;
            color: white;
            text-decoration: none;
            font-weight: 700;
            text-transform: uppercase;
            letter-spacing: 1px;
            border: none;
            border-bottom: 3px solid #cc5200;
            transition: all 0.1s;
            font-family: 'Courier New', monospace;
            font-size: 0.9rem;
            cursor: pointer;
            width: 100%;
            text-align: center;
            border-radius: 4px;
        }
        
        @media (min-width: 640px) {
            .btn {
                padding: 1rem 2rem;
                font-size: 1rem;
                width: auto;
                min-width: 200px;
            }
        }
        
        .btn:hover {
            background: #cc5200;
            border-bottom-width: 2px;
            transform: translateY(1px);
        }
        
        .btn:active {
            transform: translateY(3px);
            border-bottom-width: 1px;
        }
        
        .btn-secondary {
            background: #3C3C3E;
            border-bottom-color: #2a2a2c;
        }
        
        .btn-secondary:hover {
            background: #2a2a2c;
        }
        
        .btn-group {
            display: flex;
            flex-direction: column;
            gap: 0.75rem;
        }
        
        @media (min-width: 640px) {
            .btn-group {
                flex-direction: row;
                justify-content: center;
                gap: 1rem;
            }
        }
        
        /* Animaciones existentes */
        @keyframes bounce {
            0%, 100% { transform: rotate(-15deg) translateY(0); }
            50% { transform: rotate(-15deg) translateY(-8px); }
        }
        
        @keyframes shakeLock {
            0%, 100% { transform: rotate(-5deg) translateY(0); }
            25% { transform: rotate(-5deg) translateY(-3px); }
            75% { transform: rotate(-5deg) translateY(3px); }
        }
        
        @keyframes search {
            0% { transform: rotate(-10deg) scale(1); opacity: 1; }
            25% { transform: rotate(-5deg) scale(1.1); opacity: 0.9; }
            50% { transform: rotate(0deg) scale(1.2); opacity: 0.8; }
            75% { transform: rotate(5deg) scale(1.1); opacity: 0.9; }
            100% { transform: rotate(-10deg) scale(1); opacity: 1; }
        }
        
        @keyframes tick {
            0%, 100% { opacity: 1; }
            50% { opacity: 0.5; }
        }
        
        @keyframes broken {
            0%, 100% { transform: rotate(-15deg) translateX(0); }
            25% { transform: rotate(-20deg) translateX(-3px); }
            75% { transform: rotate(-10deg) translateX(3px); }
        }
    </style>
</head>
<body>
    <div class="paper">
        <div class="tape"></div>
        
        @yield('content')
    </div>

    <script>
        function cerrarIframe() {
            if (window.self !== window.top) {
                try {
                    const iframe = window.frameElement;
                    if (iframe && iframe.parentNode) {
                        iframe.parentNode.removeChild(iframe);
                        
                        // Forzar repaint en la página principal
                        if (window.top.document.body) {
                            window.top.document.body.style.display = 'none';
                            setTimeout(() => {
                                window.top.document.body.style.display = '';
                            }, 10);
                        }
                    }
                } catch (e) {
                    console.log('Error al cerrar iframe:', e);
                }
            }
        }
    </script>
</body>
</html>