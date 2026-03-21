@extends('errors.layout')

@section('title', '419 - Sesión expirada - LocalSat')

@section('content')
    <div class="tools">
        <div class="tool" style="transform: rotate(-5deg); animation: tick 2s steps(1) infinite;">
            <svg viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-.5-13v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
            </svg>
        </div>
        <div class="tool" style="transform: rotate(5deg); animation: tick 2s steps(1) infinite 0.5s;">
            <svg viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7z"/>
            </svg>
        </div>
        <div class="tool" style="transform: rotate(0deg); animation: tick 2s steps(1) infinite 1s;">
            <svg viewBox="0 0 24 24">
                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm.5-13H11v6l5.25 3.15.75-1.23-4.5-2.67V7zM7 9h2v2H7V9zm8 0h2v2h-2V9z"/>
            </svg>
        </div>
    </div>
    
    <div class="error-code">419</div>
    <h1 class="error-title">Sesión expirada</h1>
    <p class="error-message">{!! $message ?? 'TU SESIÓN HA CADUCADO<br>POR SEGURIDAD.' !!}</p>
    
    <div class="signature">
        <span>⏰ Temporizador LocalSat ⏰</span>
    </div>
    
    <div class="btn-group">
        <a href="/login" class="btn">
            🔐 Re-autenticar
        </a>
    </div>
@endsection