@extends('errors.layout')

@section('title', '503 - Sitio en mantenimiento - LocalSat')

@section('content')
    <div class="tools">
        <div class="tool" style="transform: rotate(-15deg); animation: bounce 2s ease-in-out infinite;">
            <svg viewBox="0 0 24 24">
                <path d="M16.47 5.53L14.12 7.88L16.12 9.88L18.47 7.53C19.2 8.26 19.7 9.2 19.88 10.24C20.06 11.28 19.89 12.34 19.41 13.27C18.93 14.2 18.17 14.93 17.25 15.37C16.33 15.81 15.29 15.93 14.28 15.71C13.27 15.49 12.36 14.95 11.7 14.2L5.53 20.37C4.96 20.94 4.04 20.94 3.47 20.37C2.9 19.8 2.9 18.88 3.47 18.31L9.64 12.14C8.89 11.48 8.35 10.57 8.13 9.56C7.91 8.55 8.03 7.51 8.47 6.59C8.91 5.67 9.64 4.91 10.57 4.43C11.5 3.95 12.56 3.78 13.6 3.96C14.64 4.14 15.58 4.64 16.31 5.37L13.96 7.72L16.28 10.04L16.47 5.53Z"/>
            </svg>
        </div>
        <div class="tool" style="transform: rotate(15deg); animation: bounce 2s ease-in-out infinite 0.3s;">
            <svg viewBox="0 0 24 24">
                <path d="M7 5L10 2L17 9L14 12L7 5Z M12 7L9 10L14 15L17 12L12 7Z M5 13L8 10L13 15L10 18L5 13Z"/>
            </svg>
        </div>
        <div class="tool" style="animation: bounce 2s ease-in-out infinite 0.6s;">
            <svg viewBox="0 0 24 24">
                <path d="M8 5L14 11L12 13L6 7L8 5Z M12 13L14 11L20 17L18 19L12 13Z"/>
            </svg>
        </div>
    </div>
    
    <div class="error-code">503</div>
    <h1 class="error-title">En mantenimiento</h1>
    <p class="error-message">{!! $message ?? 'ESTAMOS REALIZANDO MEJORAS.<br>VOLVEREMOS EN BREVE.' !!}</p>
    
    <div class="signature">
        <span>⚡ Equipo de Mantenimiento LocalSat ⚡</span>
    </div>
    
    <div class="btn-group">
        <button onclick="window.location.reload()" class="btn">
            🔄 Reintentar conexión
        </button>
    </div>
@endsection