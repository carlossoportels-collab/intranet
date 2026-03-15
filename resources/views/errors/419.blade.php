@extends('errors.layout')

@section('title','419 - Sesión expirada')

@section('code','419')

@section('message')
TU SESIÓN HA CADUCADO<br>
POR SEGURIDAD.
@endsection

@section('actions')

<a href="/login" class="btn">
RE-AUTENTICAR
</a>

@endsection