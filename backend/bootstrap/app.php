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
            // For API routes, return null to trigger 401 JSON response
            if ($request->is('api/*') || $request->expectsJson()) {
                return null;
            }
            // Only redirect web routes if login route exists
            if (\Illuminate\Support\Facades\Route::has('login')) {
                return route('login');
            }
            return null;
        });
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // Ensure API routes always return JSON responses for authentication errors
        $exceptions->render(function (\Illuminate\Auth\AuthenticationException $e, $request) {
            if ($request->is('api/*') || $request->expectsJson()) {
                return response()->json([
                    'success' => false,
                    'message' => 'Unauthenticated',
                    'error' => 'Authentication required'
                ], 401);
            }
        });
    })->create();
