<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\API\AuthController;
use App\Http\Controllers\API\AvailabilityController;
use App\Http\Controllers\API\ReservationController;
use App\Http\Controllers\API\EmployeeController;
use App\Http\Controllers\API\ServiceController;
use App\Http\Controllers\API\WorkingHourController;
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
    'middleware' => 'auth:api',
    'prefix' => 'auth'
], function () {
    Route::post('logout', [AuthController::class, 'logout']);
    Route::post('refresh', [AuthController::class, 'refresh']);
    Route::get('me', [AuthController::class, 'me']);
});

// General protected routes (for all authenticated users)
Route::group([
    'middleware' => 'auth:api'
], function () {
    
    // User profile routes
    Route::get('/user', function (Request $request) {
        return response()->json([
            'success' => true,
            'user' => $request->user()
        ]);
    });
    
    // Reservations routes (accessible by both clients and owners)
    Route::apiResource('reservations', ReservationController::class);
    
    // Availability routes (accessible by both clients and owners)
    Route::get('/availability', [AvailabilityController::class, 'index']);
    Route::post('/availability/check', [AvailabilityController::class, 'check']);
    Route::get('/availability/nearest', [AvailabilityController::class, 'nearest']);

    // Employee list for clients (read-only)
    Route::get('/employees', [EmployeeController::class, 'clientIndex']);
});

// Owner-only routes (admin panel functionality)
Route::group([
    'middleware' => ['auth:api', 'owner'],
    'prefix' => 'admin'
], function () {
    
    // Employee management (full CRUD for owners)
    Route::apiResource('employees', EmployeeController::class);
    Route::get('employees/{employee}/statistics', [EmployeeController::class, 'statistics']);
    Route::post('employees/{employee}/services', [EmployeeController::class, 'assignServices']);
    Route::delete('employees/{employee}/services/{service}', [EmployeeController::class, 'removeService']);
    
    // Service management (full CRUD for owners)
    Route::apiResource('services', ServiceController::class);
    Route::get('services/with-employees', [ServiceController::class, 'withEmployees']);
    Route::get('services/statistics', [ServiceController::class, 'statistics']);
    
    // Working hours management (full CRUD for owners)
    Route::apiResource('working-hours', WorkingHourController::class);
    Route::post('working-hours/bulk', [WorkingHourController::class, 'bulkStore']);
    Route::get('employees/{employee}/working-hours', [WorkingHourController::class, 'employeeSummary']);
    
    // Dashboard and statistics
    Route::get('/dashboard/stats', function () {
        try {
            $stats = [
                'total_reservations' => \App\Models\Reservation::count(),
                'total_employees' => \App\Models\Employee::count(),
                'total_services' => \App\Models\Service::count(),
                'upcoming_reservations' => \App\Models\Reservation::where('start_at', '>', now())->count(),
                'today_reservations' => \App\Models\Reservation::whereDate('start_at', today())->count(),
                'revenue_this_month' => \App\Models\Reservation::join('services', 'reservations.service_id', '=', 'services.id')
                    ->whereMonth('start_at', now()->month)
                    ->where('status', 'COMPLETED')
                    ->sum('price_dhs')
            ];
            
            return response()->json($stats);
        } catch (\Exception $e) {
        return response()->json([
                'error' => 'Unable to fetch dashboard statistics',
                'message' => $e->getMessage()
            ], 500);
        }
    });
    
    // Reports routes
    Route::get('/reports/reservations', function (Request $request) {
        try {
            $query = \App\Models\Reservation::with(['client', 'employee', 'service']);
            
            // Date filtering
            if ($request->start_date) {
                $query->whereDate('start_at', '>=', $request->start_date);
            }
            if ($request->end_date) {
                $query->whereDate('start_at', '<=', $request->end_date);
            }
            
            // Status filtering
            if ($request->status) {
                $query->where('status', $request->status);
            }
            
            $reservations = $query->orderBy('start_at', 'desc')->paginate(50);
            
            return response()->json($reservations);
        } catch (\Exception $e) {
        return response()->json([
                'error' => 'Unable to fetch reservation reports',
                'message' => $e->getMessage()
            ], 500);
        }
    });
    
    // Cache management routes (Owner only)
    Route::delete('/cache/availability', [AvailabilityController::class, 'clearCache']);
});
