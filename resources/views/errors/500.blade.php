@extends('errors.layout')

@section('title', '500 - Error del servidor - LocalSat')

@section('content')
    <div class="tools">
        <div class="tool" style="transform: rotate(-15deg); animation: broken 0.3s ease-in-out infinite;">
            <svg viewBox="0 0 24 24">
                <path d="M20 8h-2.81c-.45-.78-1.07-1.45-1.82-1.96L17 4.41 15.59 3l-2.17 2.17C12.96 5.06 12.49 5 12 5s-.96.06-1.41.17L8.41 3 7 4.41l1.62 1.63C7.88 6.55 7.26 7.22 6.81 8H4v2h2.09c-.05.33-.09.66-.09 1v1H4v2h2v1c0 .34.04.67.09 1H4v2h2.81c1.79 2.59 5.01 4 8.19 4s6.4-1.41 8.19-4H20v-2h-2.09c.05-.33.09-.66.09-1v-1h2v-2h-2v-1c0-.34-.04-.67-.09-1H20V8z"/>
            </svg>
        </div>
        <div class="tool" style="transform: rotate(15deg); animation: broken 0.3s ease-in-out infinite 0.1s;">
            <svg viewBox="0 0 24 24">
                <path d="M22.7 19l-9.1-9.1c.9-2.3.4-5-1.5-6.9-2-2-5-2.4-7.4-1.3L9 6 6 9 1.6 4.7C.4 7.1.9 10.1 2.9 12.1c1.9 1.9 4.6 2.4 6.9 1.5l9.1 9.1c.4.4 1 .4 1.4 0l2.3-2.3c.5-.4.5-1.1.1-1.4z"/>
            </svg>
        </div>
        <div class="tool" style="transform: rotate(0deg); animation: broken 0.3s ease-in-out infinite 0.2s;">
            <svg viewBox="0 0 24 24">
                <path d="M20.5 3l-.16.03L15 5.1 9 3 3.36 4.9c-.21.07-.36.25-.36.48V20.5c0 .28.22.5.5.5l.16-.03L15 18.9l6 2.1 5.64-1.9c.21-.07.36-.25.36-.48V3.5c0-.28-.22-.5-.5-.5zM15 19l-6-2.11V5l6 2.11V19z"/>
            </svg>
        </div>
    </div>
    
    <div class="error-code">500</div>
    <h1 class="error-title">Algo se rompió</h1>
    <p class="error-message">{!! $message ?? 'ERROR INTERNO DEL SERVIDOR.<br>LOS TÉCNICOS HAN SIDO NOTIFICADOS.' !!}</p>
    
    <div class="signature">
        <span>🔧 Mantenimiento LocalSat 🔧</span>
    </div>
    
    <div class="btn-group">
        <button onclick="window.location.reload()" class="btn">
            🔄 Reintentar
        </button>
    </div>
@endsection