<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class Authenticate
{
    /**
     * Handle an incoming request.
     *
     * @param  \Illuminate\Http\Request  $request
     * @param  \Closure  $next
     * @param  string[]  ...$guards
     * @return mixed
     */
    public function handle(Request $request, Closure $next, ...$guards)
    {
        // For API routes, handle JWT authentication
        if ($request->is('api/*')) {
            try {
                // Try to authenticate user using JWT
                $user = JWTAuth::parseToken()->authenticate();
                
                if (!$user) {
                    throw new JWTException('User not found');
                }
                
                // Set the authenticated user
                Auth::guard('api')->setUser($user);
                
                return $next($request);
                
            } catch (JWTException $e) {
                // Token is invalid or not provided
                return response()->json([
                    'error' => 'Unauthorized',
                    'message' => 'Authentication required'
                ], 401);
            }
        }
        
        // For web routes, use default authentication
        if (empty($guards)) {
            $guards = [null];
        }
        
        foreach ($guards as $guard) {
            if (Auth::guard($guard)->check()) {
                return $next($request);
            }
        }
        
        // User is not authenticated
        // For web routes, redirect to login
        return redirect()->guest(route('login'));
    }
} 