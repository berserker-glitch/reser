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
use App\Models\WorkingHour;

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
        $services = Service::with('employees')->get();
        return response()->json($services);
    } catch (\Exception $e) {
        return response()->json([
            'error' => 'Unable to fetch services',
            'message' => $e->getMessage()
        ], 500);
    }
});

// Public availability routes (for clients to check before registering)
Route::get('/availability', [AvailabilityController::class, 'index']);
Route::post('/availability/check', [AvailabilityController::class, 'check']);
Route::get('/availability/nearest', [AvailabilityController::class, 'nearest']);

// Public calendar availability route (for client booking calendar)
Route::get('/calendar-availability', function (Request $request) {
    try {
        $startDate = $request->query('start_date', now()->format('Y-m-d'));
        $endDate = $request->query('end_date', now()->addMonth()->format('Y-m-d'));
        
        // Validate date format
        if (!strtotime($startDate) || !strtotime($endDate)) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid date format. Use Y-m-d format.'
            ], 400);
        }
        
        $start = \Carbon\Carbon::parse($startDate);
        $end = \Carbon\Carbon::parse($endDate);
        
        // Prevent requesting too large date ranges (max 3 months)
        if ($start->diffInDays($end) > 90) {
            return response()->json([
                'success' => false,
                'error' => 'Date range too large. Maximum 90 days allowed.'
            ], 400);
        }
        
        // Get all holidays to check against each date
        $allHolidays = \App\Models\Holiday::all();
        $holidaysByDate = [];
        
        // Create a map of holidays by date for the current year
        foreach ($allHolidays as $holiday) {
            $holidayDate = sprintf('%04d-%02d-%02d', $start->year, $holiday->month, $holiday->day);
            $holidaysByDate[$holidayDate] = $holiday->name;
        }
        
        // Get working hours for all weekdays (global working hours)
        $workingHours = \App\Models\WorkingHour::all()->keyBy('weekday');
        
        // Generate calendar data for each day in the range
        $calendarData = [];
        $currentDate = $start->copy();
        
        while ($currentDate->lte($end)) {
            $dateStr = $currentDate->format('Y-m-d');
            $weekday = $currentDate->dayOfWeek; // 0=Sunday, 6=Saturday
            
            // Check if it's a holiday
            $isHoliday = isset($holidaysByDate[$dateStr]);
            $holidayName = $isHoliday ? $holidaysByDate[$dateStr] : null;
            
            // Check if it's a working day
            $workingHour = $workingHours->get($weekday);
            $isWorkingDay = $workingHour && $workingHour->start_time && $workingHour->end_time;
            
            // A day is bookable if it's a working day and not a holiday
            $isBookable = $isWorkingDay && !$isHoliday && !$currentDate->isPast();
            
            $calendarData[] = [
                'date' => $dateStr,
                'day_of_week' => $weekday,
                'day_name' => $currentDate->format('l'),
                'is_holiday' => $isHoliday,
                'holiday_name' => $holidayName,
                'is_working_day' => $isWorkingDay,
                'is_bookable' => $isBookable,
                'working_hours' => $isWorkingDay ? [
                    'start_time' => $workingHour->start_time,
                    'end_time' => $workingHour->end_time,
                    'break_start' => $workingHour->break_start,
                    'break_end' => $workingHour->break_end,
                ] : null
            ];
            
            $currentDate->addDay();
        }
        
        \Log::info('Calendar availability fetched', [
            'start_date' => $startDate,
            'end_date' => $endDate,
            'total_days' => count($calendarData),
            'holidays_count' => count($holidaysByDate),
            'bookable_days' => collect($calendarData)->where('is_bookable', true)->count()
        ]);
        
        return response()->json([
            'success' => true,
            'data' => $calendarData,
            'summary' => [
                'total_days' => count($calendarData),
                'holidays' => collect($calendarData)->where('is_holiday', true)->count(),
                'working_days' => collect($calendarData)->where('is_working_day', true)->count(),
                'bookable_days' => collect($calendarData)->where('is_bookable', true)->count(),
            ]
        ]);
        
    } catch (\Exception $e) {
        \Log::error('Calendar availability error: ' . $e->getMessage());
        return response()->json([
            'success' => false,
            'error' => 'Unable to fetch calendar availability'
        ], 500);
    }
});

// Public employees list (for clients to see available staff)
Route::get('/employees', [EmployeeController::class, 'clientIndex']);

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
    Route::post('change-password', [AuthController::class, 'changePassword']);
    Route::post('verify-password', [AuthController::class, 'verifyPassword']);
    Route::put('profile', [AuthController::class, 'updateProfile']);
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
    
    // Holidays endpoint
    Route::get('/holidays', function (Request $request) {
        try {
            $year = $request->query('year', now()->year);
            
            // Get holidays for the specified year
            $holidays = \App\Models\Holiday::whereYear('id', $year)
                ->orderBy('id')
                ->get();
            
            return response()->json($holidays);
            
        } catch (\Exception $e) {
            \Log::error('Failed to fetch holidays', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch holidays'
            ], 500);
        }
    });
    
    // Working hours for current user (global working hours that apply to all employees)
    Route::get('/my-working-hours', function (Request $request) {
        try {
            // Get global working hours (no longer employee-specific)
            $workingHours = WorkingHour::orderBy('weekday')->get();
            
            return response()->json([
                'success' => true,
                'working_hours' => $workingHours
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to fetch working hours',
                'error' => $e->getMessage()
            ], 500);
        }
    });
    
    // Update working hours (global working hours that apply to all employees)
    Route::put('/my-working-hours', function (Request $request) {
        try {
            $validated = $request->validate([
                'working_hours' => 'required|array',
                'working_hours.*.weekday' => 'required|integer|min:0|max:6',
                'working_hours.*.start_time' => 'nullable|date_format:H:i',
                'working_hours.*.end_time' => 'nullable|date_format:H:i',
                'working_hours.*.break_start' => 'nullable|date_format:H:i',
                'working_hours.*.break_end' => 'nullable|date_format:H:i',
            ]);
            
            // Delete all existing working hours (global system)
            WorkingHour::truncate();
            
            // Create new working hours for all provided days (including non-working days with null times)
            foreach ($validated['working_hours'] as $hours) {
                WorkingHour::create([
                    'weekday' => $hours['weekday'],
                    'start_time' => $hours['start_time'], // Can be null for non-working days
                    'end_time' => $hours['end_time'], // Can be null for non-working days
                    'break_start' => $hours['break_start'] ?? null,
                    'break_end' => $hours['break_end'] ?? null,
                ]);
            }
            
            return response()->json([
                'success' => true,
                'message' => 'Working hours updated successfully'
            ]);
            
        } catch (\Exception $e) {
            return response()->json([
                'success' => false,
                'message' => 'Failed to update working hours',
                'error' => $e->getMessage()
            ], 500);
        }
    });
    
    // Reservations routes (accessible by both clients and owners)
    Route::apiResource('reservations', ReservationController::class);
});

// Public working hours endpoint - show all employees working every day
Route::get('/working-hours', function () {
    try {
        // Get all employees
        $employees = \App\Models\Employee::select('id', 'full_name')->get();
        
        $weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        
        // Create working schedule for all employees for all days
        $grouped = $employees->map(function ($employee) use ($weekdays) {
            $schedule = [];
            
            // Create a schedule entry for each day of the week
            for ($weekday = 0; $weekday <= 6; $weekday++) {
                $schedule[] = [
                    'id' => $employee->id * 10 + $weekday, // Generate unique ID
                    'weekday' => $weekday,
                    'weekday_name' => $weekdays[$weekday],
                    'start_time' => '09:00', // Default working hours
                    'end_time' => '18:00',   // Default working hours
                    'break_start' => '12:00', // Default lunch break
                    'break_end' => '13:00',
                    'total_hours' => 8 // 9 hours - 1 hour break = 8 working hours
                ];
            }
            
            return [
                'employee' => $employee,
                'schedule' => $schedule
            ];
        });
        
        return response()->json($grouped);
    } catch (\Exception $e) {
        \Log::error('Working hours fetch error: ' . $e->getMessage());
        return response()->json(['error' => 'Unable to fetch working hours'], 500);
    }
});

// Owner-only routes (admin panel functionality)
Route::group([
    'middleware' => ['auth:api', 'role:OWNER'],
    'prefix' => 'admin'
], function () {
    
    // Employee management (full CRUD for owners)
    Route::apiResource('employees', EmployeeController::class);
    Route::get('employees/{employee}/statistics', [EmployeeController::class, 'statistics']);
    Route::post('employees/{employee}/services', [EmployeeController::class, 'assignServices']);
    Route::delete('employees/{employee}/services/{service}', [EmployeeController::class, 'removeService']);
    Route::delete('employees/{employee}/profile-picture', [EmployeeController::class, 'removeProfilePicture']);
    
    // Service management (full CRUD for owners)
    Route::apiResource('services', ServiceController::class);
    Route::get('services/with-employees', [ServiceController::class, 'withEmployees']);
    Route::get('services/statistics', [ServiceController::class, 'statistics']);
    
    // Holiday management (full CRUD for owners)
    Route::get('holidays/settings', [\App\Http\Controllers\API\HolidayController::class, 'getSettings']);
    Route::put('holidays/settings', [\App\Http\Controllers\API\HolidayController::class, 'updateSettings']);
    Route::post('holidays/import-moroccan', [\App\Http\Controllers\API\HolidayController::class, 'importMoroccanHolidays']);
    Route::post('holidays/bulk-action', [\App\Http\Controllers\API\HolidayController::class, 'bulkAction']);
    
    // Custom routes for holidays that handle composite keys
    Route::get('holidays', [\App\Http\Controllers\API\HolidayController::class, 'index']);
    Route::post('holidays', [\App\Http\Controllers\API\HolidayController::class, 'store']);
    Route::delete('holidays', [\App\Http\Controllers\API\HolidayController::class, 'destroy']); // DELETE without ID, data in body
    Route::put('holidays', [\App\Http\Controllers\API\HolidayController::class, 'update']);
    
    // Working hours management (full CRUD for owners)
    Route::apiResource('working-hours', WorkingHourController::class);
    Route::post('working-hours/bulk', [WorkingHourController::class, 'bulkStore']);
    Route::get('employees/{employee}/working-hours', [WorkingHourController::class, 'employeeSummary']);
    
    // Reservation management (full CRUD for owners)
    Route::apiResource('reservations', ReservationController::class);
    
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
