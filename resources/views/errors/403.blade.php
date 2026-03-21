@extends('errors.layout')

@section('title', '403 - Acceso prohibido - LocalSat')

@section('content')
    <div class="tools">
        <div class="tool" style="transform: rotate(-5deg); animation: shakeLock 3s ease-in-out infinite;">
            <svg viewBox="0 0 24 24">
                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z"/>
            </svg>
        </div>
        <div class="tool" style="transform: rotate(5deg); animation: shakeLock 3s ease-in-out infinite 0.2s;">
            <svg viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9v2c0 .78.16 1.53.46 2.22L3.7 14.7c-.44.44-.7 1.04-.7 1.67V20c0 1.1.9 2 2 2h14c1.1 0 2-.9 2-2v-3.63c0-.63-.26-1.23-.7-1.67l-1.76-1.76c.3-.69.46-1.44.46-2.22V9c0-3.87-3.13-7-7-7zm0 2c2.76 0 5 2.24 5 5v2c0 .78-.16 1.53-.46 2.22L12 17.17l-4.54-4.54C7.16 11.53 7 10.78 7 10V9c0-2.76 2.24-5 5-5z"/>
            </svg>
        </div>
        <div class="tool" style="transform: rotate(0deg); animation: shakeLock 3s ease-in-out infinite 0.4s;">
            <svg viewBox="0 0 24 24">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z"/>
            </svg>
        </div>
    </div>
    
    <div class="error-code">403</div>
    <h1 class="error-title">Acceso prohibido</h1>
    <p class="error-message">{!! $message ?? 'NO TIENES PERMISOS<br>PARA ACCEDER A ESTE RECURSO.' !!}</p>
    
    <div class="signature">
        <span>🔒 Seguridad LocalSat 🔒</span>
    </div>
    
    <div class="btn-group">
        <button onclick="cerrarIframe()" class="btn">
            ✕ Cerrar
        </button>
    </div>
@endsection