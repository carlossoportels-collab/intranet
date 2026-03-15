@extends('errors.layout')

@section('title','500 - Error del servidor')

@section('code','500')

@section('message')
ERROR INTERNO DEL SERVIDOR.<br>
LOS TÉCNICOS HAN SIDO NOTIFICADOS.
@endsection

@section('actions')

<a href="javascript:location.reload()" class="btn">
REINTENTAR
</a>

@endsection