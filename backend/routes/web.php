<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Add login route to prevent RouteNotFoundException
Route::get('/login', function () {
    return response()->json(['message' => 'Please use API login endpoint'], 401);
})->name('login');
