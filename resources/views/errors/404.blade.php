@extends('errors.layout')

@section('title','404 - Página no encontrada')

@section('code','404')

@section('message')
LA PÁGINA QUE BUSCAS<br>
NO EXISTE O FUE MOVIDA.
@endsection

@section('actions')

<a href="/" class="btn">
VOLVER AL INICIO
</a>

@endsection