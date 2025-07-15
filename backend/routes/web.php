<?php

use Illuminate\Support\Facades\Route;

Route::get('/', function () {
    return view('welcome');
});

// Temporary login route to fix authentication redirect issue
Route::get('/login', function () {
    return response()->json([
        'message' => 'This is an API-only application. Please use /api/auth/login endpoint.'
    ], 200);
})->name('login');
