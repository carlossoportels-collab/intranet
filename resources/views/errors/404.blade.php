@extends('errors.layout')

@section('title', '404 - Página no encontrada - LocalSat')

@section('content')
    <div class="tools">
        <div class="tool" style="transform: rotate(-10deg); animation: search 3s ease-in-out infinite;">
            <svg viewBox="0 0 24 24">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
            </svg>
        </div>
        <div class="tool" style="transform: rotate(10deg); animation: search 3s ease-in-out infinite 0.3s;">
            <svg viewBox="0 0 24 24">
                <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L15 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
            </svg>
        </div>
        <div class="tool" style="transform: rotate(0deg); animation: search 3s ease-in-out infinite 0.6s;">
            <svg viewBox="0 0 24 24">
                <path d="M15.5 14h-.79l-.28-.27C15.41 12.59 16 11.11 16 9.5 16 5.91 13.09 3 9.5 3S3 5.91 3 9.5 5.91 16 9.5 16c1.61 0 3.09-.59 4.23-1.57l.27.28v.79l5 4.99L20.49 19l-4.99-5zm-6 0C7.01 14 5 11.99 5 9.5S7.01 5 9.5 5 14 7.01 14 9.5 11.99 14 9.5 14z"/>
            </svg>
        </div>
    </div>
    
    <div class="error-code">404</div>
    <h1 class="error-title">Extraviado</h1>
    <p class="error-message">{!! $message ?? 'LA PÁGINA QUE BUSCAS<br>NO EXISTE O FUE MOVIDA.' !!}</p>
    
    <div class="signature">
        <span>🧭 Navegación LocalSat 🧭</span>
    </div>
    
    <div class="btn-group">
        <button onclick="cerrarIframe()" class="btn">
            ✕ Cerrar
        </button>
    </div>
@endsection