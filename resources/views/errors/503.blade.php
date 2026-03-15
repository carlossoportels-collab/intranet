@extends('errors.layout')

@section('title','503 - Mantenimiento')

@section('code','503')

@section('message')
EL SISTEMA ESTÁ<br>
TEMPORALMENTE EN MANTENIMIENTO.
@endsection

@section('actions')

<a href="javascript:location.reload()" class="btn">
VOLVER A INTENTAR
</a>

@endsection