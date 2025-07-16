<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Register middleware aliases
        $middleware->alias([
            'role' => \App\Http\Middleware\RoleMiddleware::class,
            'request.logging' => \App\Http\Middleware\RequestLoggingMiddleware::class,
        ]);
        
        // Apply request logging middleware to API routes
        $middleware->api(append: [
            \App\Http\Middleware\RequestLoggingMiddleware::class,
        ]);
        
        // Configure authentication to return JSON responses for API routes
        $middleware->redirectGuestsTo(function ($request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return null; // Return null for API routes to get 401 response
            }
            return route('login'); // Only redirect web routes
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        //
    })->create();
