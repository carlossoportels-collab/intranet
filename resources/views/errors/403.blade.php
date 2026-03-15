@extends('errors.layout')

@section('title','403 - Acceso prohibido')

@section('code','403')

@section('message')
NO TIENES PERMISOS<br>
PARA ACCEDER A ESTE RECURSO.
@endsection

@section('actions')

<a href="javascript:history.back()" class="btn secondary">
VOLVER
</a>

<a href="/" class="btn">
IR AL INICIO
</a>

@endsection