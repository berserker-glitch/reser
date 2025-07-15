<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Models\Service;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| Here is where you can register API routes for your application. These
| routes are loaded by the RouteServiceProvider and all of them will
| be assigned to the "api" middleware group. Make something great!
|
*/

// Public routes (no authentication required)
Route::group([
    'middleware' => 'api',
    'prefix' => 'auth'
], function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
});

// Public services route (for testing and client access)
Route::get('/services', function () {
    try {
        $services = Service::all();
        return response()->json($services);
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Unable to fetch services',
            'message' => $e->getMessage()
        ], 500);
    }
});

// Health check endpoint (no authentication required)
Route::get('/health', function () {
    return response()->json([
        'success' => true,
        'message' => 'API is healthy',
        'timestamp' => now()->toISOString()
    ]);
});

// Protected routes (authentication required)
Route::group([
    'middleware' => 'auth',
    'prefix' => 'auth'
], function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::post('refresh', [AuthController::class, 'refresh']);
    Route::get('me', [AuthController::class, 'me']);
});

// General protected routes (for all authenticated users)
Route::group([
    'middleware' => 'auth'
], function () {
    
    // User profile routes
    Route::get('/user', function (Request $request) {
        return response()->json([
            'success' => true,
            'user' => $request->user()
        ]);
    });
    
    // Reservations routes (accessible by both clients and owners)
    Route::get('/reservations', function () {
        return response()->json([
            'success' => true,
            'message' => 'Reservations endpoint - accessible by all authenticated users'
        ]);
    });
    
    // Availability routes (accessible by both clients and owners)
    Route::get('/availability', [App\Http\Controllers\API\AvailabilityController::class, 'index']);
    Route::get('/availability/nearest', [App\Http\Controllers\API\AvailabilityController::class, 'nearest']);
    Route::post('/availability/check', [App\Http\Controllers\API\AvailabilityController::class, 'check']);
});

// Owner-only protected routes (role-based access control)
Route::group([
    'middleware' => ['auth', 'role:OWNER']
], function () {
    
    // Employee management routes (moved from general protected routes)
    Route::get('/employees', function () {
        return response()->json([
            'success' => true,
            'message' => 'Employees list endpoint - Owner only'
        ]);
    });
    
    // Employee management routes (placeholder routes)
    Route::get('/admin/employees', function () {
        return response()->json([
            'success' => true,
            'message' => 'Employee management endpoint - Owner only'
        ]);
    });
    
    // Service management routes (placeholder routes)
    Route::get('/admin/services', function () {
        return response()->json([
            'success' => true,
            'message' => 'Service management endpoint - Owner only'
        ]);
    });
    
    // Working hours management routes (placeholder routes)
    Route::get('/admin/working-hours', function () {
        return response()->json([
            'success' => true,
            'message' => 'Working hours management endpoint - Owner only'
        ]);
    });
    
    // Admin dashboard routes
    Route::get('/dashboard/stats', function () {
        return response()->json([
            'success' => true,
            'message' => 'Dashboard statistics endpoint - Owner only'
        ]);
    });
    
    // Reports routes
    Route::get('/reports/reservations', function () {
        return response()->json([
            'success' => true,
            'message' => 'Reservation reports endpoint - Owner only'
        ]);
    });
    
    // Cache management routes (Owner only)
    Route::delete('/cache/availability', [App\Http\Controllers\API\AvailabilityController::class, 'clearCache']);
});
