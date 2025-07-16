<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

/**
 * ServiceController - Manages salon services (OWNER only)
 * 
 * Handles CRUD operations for services including:
 * - Creating new services with pricing and duration
 * - Reading/listing all services
 * - Updating service details
 * - Deleting services (with safety checks)
 * - Validation and business rules enforcement
 */
class ServiceController extends Controller
{
    /**
     * Display a listing of all services
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        Log::info('ServiceController@index - Fetching services list', [
            'user_id' => auth()->id(),
            'user_role' => auth()->user()->role
        ]);

        try {
            // Get all services with optional filtering
            $query = Service::query();

            // Add search functionality if search parameter provided
            if ($request->has('search') && !empty($request->search)) {
                $search = $request->search;
                $query->where(function($q) use ($search) {
                    $q->where('name', 'LIKE', "%{$search}%")
                      ->orWhere('description', 'LIKE', "%{$search}%");
                });
                
                Log::info('ServiceController@index - Applied search filter', [
                    'search_term' => $search
                ]);
            }

            // Add sorting
            $sortBy = $request->get('sort_by', 'name');
            $sortDirection = $request->get('sort_direction', 'asc');
            
            if (in_array($sortBy, ['name', 'price_dhs', 'duration_min', 'created_at'])) {
                $query->orderBy($sortBy, $sortDirection);
            }

            $services = $query->with('employees')->get();

            Log::info('ServiceController@index - Services retrieved successfully', [
                'count' => $services->count(),
                'user_id' => auth()->id()
            ]);

            return response()->json($services);

        } catch (\Exception $e) {
            Log::error('ServiceController@index - Failed to fetch services', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch services',
                'error' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Store a newly created service
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        Log::info('ServiceController@store - Creating new service', [
            'user_id' => auth()->id(),
            'request_data' => $request->all()
        ]);

        // Validate input data
        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:120|unique:services,name',
            'description' => 'nullable|string|max:500',
            'duration_min' => 'required|integer|min:15|max:480', // 15 minutes to 8 hours
            'price_dhs' => 'required|numeric|min:0|max:9999.99'
        ]);

        if ($validator->fails()) {
            Log::warning('ServiceController@store - Validation failed', [
                'errors' => $validator->errors(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Create the service
            $service = Service::create([
                'name' => $request->name,
                'description' => $request->description,
                'duration_min' => $request->duration_min,
                'price_dhs' => $request->price_dhs
            ]);

            Log::info('ServiceController@store - Service created successfully', [
                'service_id' => $service->id,
                'service_name' => $service->name,
                'user_id' => auth()->id()
            ]);

            return response()->json($service, 201);

        } catch (\Exception $e) {
            Log::error('ServiceController@store - Failed to create service', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to create service',
                'error' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Display the specified service
     * 
     * @param Service $service
     * @return JsonResponse
     */
    public function show(Service $service): JsonResponse
    {
        Log::info('ServiceController@show - Fetching service details', [
            'service_id' => $service->id,
            'user_id' => auth()->id()
        ]);

        try {
            // Load related data for comprehensive view
            $service->load(['employees' => function($query) {
                $query->select('employees.id', 'employees.full_name');
            }]);

            // Add statistics
            $service->reservations_count = $service->reservations()->count();
            $service->active_employees_count = $service->employees()->count();

            Log::info('ServiceController@show - Service details retrieved', [
                'service_id' => $service->id,
                'reservations_count' => $service->reservations_count,
                'employees_count' => $service->active_employees_count
            ]);

            return response()->json($service);

        } catch (\Exception $e) {
            Log::error('ServiceController@show - Failed to fetch service details', [
                'service_id' => $service->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch service details',
                'error' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Update the specified service
     * 
     * @param Request $request
     * @param Service $service
     * @return JsonResponse
     */
    public function update(Request $request, Service $service): JsonResponse
    {
        Log::info('ServiceController@update - Updating service', [
            'service_id' => $service->id,
            'user_id' => auth()->id(),
            'request_data' => $request->all()
        ]);

        // Validate input data
        $validator = Validator::make($request->all(), [
            'name' => 'sometimes|required|string|max:120|unique:services,name,' . $service->id,
            'description' => 'nullable|string|max:500',
            'duration_min' => 'sometimes|required|integer|min:15|max:480',
            'price_dhs' => 'sometimes|required|numeric|min:0|max:9999.99'
        ]);

        if ($validator->fails()) {
            Log::warning('ServiceController@update - Validation failed', [
                'service_id' => $service->id,
                'errors' => $validator->errors(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $originalData = $service->toArray();

            // Update only provided fields
            $service->update($request->only([
                'name', 'description', 'duration_min', 'price_dhs'
            ]));

            Log::info('ServiceController@update - Service updated successfully', [
                'service_id' => $service->id,
                'original_data' => $originalData,
                'updated_data' => $service->fresh()->toArray(),
                'user_id' => auth()->id()
            ]);

            return response()->json($service->fresh());

        } catch (\Exception $e) {
            Log::error('ServiceController@update - Failed to update service', [
                'service_id' => $service->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to update service',
                'error' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Remove the specified service from storage
     * 
     * @param Service $service
     * @return JsonResponse
     */
    public function destroy(Service $service): JsonResponse
    {
        Log::info('ServiceController@destroy - Attempting to delete service', [
            'service_id' => $service->id,
            'service_name' => $service->name,
            'user_id' => auth()->id()
        ]);

        try {
            // Check for active reservations
            $upcomingReservations = $service->reservations()
                ->where('start_at', '>', now())
                ->where('status', '!=', 'CANCELLED')
                ->count();

            if ($upcomingReservations > 0) {
                Log::warning('ServiceController@destroy - Cannot delete service with upcoming reservations', [
                    'service_id' => $service->id,
                    'upcoming_reservations' => $upcomingReservations,
                    'user_id' => auth()->id()
                ]);

                return response()->json([
                    'message' => 'Cannot delete service with upcoming reservations',
                    'upcoming_reservations' => $upcomingReservations
                ], 422);
            }

            // Store service info for logging
            $deletedServiceInfo = [
                'id' => $service->id,
                'name' => $service->name,
                'total_reservations' => $service->reservations()->count(),
                'total_employees' => $service->employees()->count()
            ];

            // Detach from employees (many-to-many relationship)
            $service->employees()->detach();

            // Delete the service
            $service->delete();

            Log::info('ServiceController@destroy - Service deleted successfully', [
                'deleted_service' => $deletedServiceInfo,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Service deleted successfully',
                'deleted_service' => $deletedServiceInfo
            ]);

        } catch (\Exception $e) {
            Log::error('ServiceController@destroy - Failed to delete service', [
                'service_id' => $service->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to delete service',
                'error' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get services with employee assignments
     * 
     * @return JsonResponse
     */
    public function withEmployees(): JsonResponse
    {
        Log::info('ServiceController@withEmployees - Fetching services with employee data', [
            'user_id' => auth()->id()
        ]);

        try {
            $services = Service::with(['employees' => function($query) {
                $query->select('employees.id', 'employees.full_name', 'employees.phone');
            }])->get();

            Log::info('ServiceController@withEmployees - Services with employees retrieved', [
                'services_count' => $services->count(),
                'user_id' => auth()->id()
            ]);

            return response()->json($services);

        } catch (\Exception $e) {
            Log::error('ServiceController@withEmployees - Failed to fetch services with employees', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch services with employee data',
                'error' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get service statistics for dashboard
     * 
     * @return JsonResponse
     */
    public function statistics(): JsonResponse
    {
        Log::info('ServiceController@statistics - Generating service statistics', [
            'user_id' => auth()->id()
        ]);

        try {
            $stats = [
                'total_services' => Service::count(),
                'average_price' => Service::avg('price_dhs'),
                'average_duration' => Service::avg('duration_min'),
                'most_popular' => Service::withCount(['reservations as reservations_count'])
                    ->orderBy('reservations_count', 'desc')
                    ->limit(5)
                    ->get(['id', 'name', 'price_dhs', 'reservations_count']),
                'price_range' => [
                    'min' => Service::min('price_dhs'),
                    'max' => Service::max('price_dhs')
                ],
                'duration_range' => [
                    'min' => Service::min('duration_min'),
                    'max' => Service::max('duration_min')
                ]
            ];

            Log::info('ServiceController@statistics - Statistics generated successfully', [
                'stats' => $stats,
                'user_id' => auth()->id()
            ]);

            return response()->json($stats);

        } catch (\Exception $e) {
            Log::error('ServiceController@statistics - Failed to generate statistics', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to generate service statistics',
                'error' => 'Internal server error'
            ], 500);
        }
    }
} 