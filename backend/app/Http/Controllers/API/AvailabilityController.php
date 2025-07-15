<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\AvailabilityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class AvailabilityController extends Controller
{
    private AvailabilityService $availabilityService;
    
    public function __construct(AvailabilityService $availabilityService)
    {
        $this->availabilityService = $availabilityService;
    }
    
    /**
     * Get available time slots for a service
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        // Validate request parameters
        $validator = Validator::make($request->all(), [
            'service_id' => 'required|integer|exists:services,id',
            'employee_id' => 'nullable|integer|exists:employees,id',
            'date' => 'nullable|date_format:Y-m-d|after_or_equal:today'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid parameters',
                'messages' => $validator->errors()
            ], 422);
        }
        
        $serviceId = $request->service_id;
        $employeeId = $request->employee_id;
        $date = $request->date ?? now()->format('Y-m-d');
        
        // Create cache key for availability slots
        $cacheKey = "availability:{$serviceId}:{$employeeId}:{$date}";
        
        try {
            // Cache availability for 5 minutes to improve performance
            $slots = Cache::remember($cacheKey, 300, function () use ($serviceId, $employeeId, $date) {
                return $this->availabilityService->getAvailableSlots($serviceId, $employeeId, $date);
            });
            
            Log::info('Availability API request processed', [
                'service_id' => $serviceId,
                'employee_id' => $employeeId,
                'date' => $date,
                'slots_count' => $slots->count(),
                'user_id' => auth()->id()
            ]);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'service_id' => $serviceId,
                    'employee_id' => $employeeId,
                    'date' => $date,
                    'slots' => $slots->toArray()
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Availability API request failed', [
                'service_id' => $serviceId,
                'employee_id' => $employeeId,
                'date' => $date,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => auth()->id()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to check availability',
                'message' => 'An error occurred while checking availability. Please try again.'
            ], 500);
        }
    }

    /**
     * Get the nearest available time slot for a service
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function nearest(Request $request)
    {
        // Validate request parameters
        $validator = Validator::make($request->all(), [
            'service_id' => 'required|integer|exists:services,id',
            'employee_id' => 'nullable|integer|exists:employees,id',
            'preferred_datetime' => 'nullable|date|after_or_equal:now'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid parameters',
                'messages' => $validator->errors()
            ], 422);
        }
        
        $serviceId = $request->service_id;
        $employeeId = $request->employee_id;
        $preferredDateTime = $request->preferred_datetime ? \Carbon\Carbon::parse($request->preferred_datetime) : null;
        
        // Create cache key for nearest slot
        $cacheKey = "nearest_slot:{$serviceId}:{$employeeId}:" . ($preferredDateTime ? $preferredDateTime->format('Y-m-d-H-i') : 'now');
        
        try {
            // Cache nearest slot for 10 minutes
            $nearestSlot = Cache::remember($cacheKey, 600, function () use ($serviceId, $employeeId, $preferredDateTime) {
                return $this->availabilityService->getNearestSlot($serviceId, $employeeId, $preferredDateTime);
            });
            
            Log::info('Nearest slot API request processed', [
                'service_id' => $serviceId,
                'employee_id' => $employeeId,
                'preferred_datetime' => $preferredDateTime?->toISOString(),
                'nearest_slot' => $nearestSlot,
                'user_id' => auth()->id()
            ]);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'service_id' => $serviceId,
                    'employee_id' => $employeeId,
                    'preferred_datetime' => $preferredDateTime?->toISOString(),
                    'nearest_slot' => $nearestSlot
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Nearest slot API request failed', [
                'service_id' => $serviceId,
                'employee_id' => $employeeId,
                'preferred_datetime' => $preferredDateTime?->toISOString(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => auth()->id()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to find nearest slot',
                'message' => 'An error occurred while finding the nearest available slot. Please try again.'
            ], 500);
        }
    }

    /**
     * Check if a specific time slot is available
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function check(Request $request)
    {
        // Validate request parameters
        $validator = Validator::make($request->all(), [
            'service_id' => 'required|integer|exists:services,id',
            'employee_id' => 'nullable|integer|exists:employees,id',
            'start_at' => 'required|date|after:now'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid parameters',
                'messages' => $validator->errors()
            ], 422);
        }
        
        $serviceId = $request->service_id;
        $employeeId = $request->employee_id;
        $startAt = \Carbon\Carbon::parse($request->start_at);
        
        try {
            // Get service duration
            $service = \App\Models\Service::findOrFail($serviceId);
            $duration = $service->duration_min;
            
            // If no employee specified, find available employee
            if (!$employeeId) {
                $employeeId = $this->availabilityService->findAvailableEmployee($serviceId, $startAt, $duration);
            }
            
            $isAvailable = false;
            if ($employeeId) {
                $isAvailable = $this->availabilityService->isSlotAvailable($employeeId, $startAt, $duration);
            }
            
            Log::info('Slot availability check', [
                'service_id' => $serviceId,
                'employee_id' => $employeeId,
                'start_at' => $startAt->toISOString(),
                'duration' => $duration,
                'is_available' => $isAvailable,
                'user_id' => auth()->id()
            ]);
            
            return response()->json([
                'success' => true,
                'data' => [
                    'service_id' => $serviceId,
                    'employee_id' => $employeeId,
                    'start_at' => $startAt->toISOString(),
                    'duration' => $duration,
                    'is_available' => $isAvailable
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Slot availability check failed', [
                'service_id' => $serviceId,
                'employee_id' => $employeeId,
                'start_at' => $startAt->toISOString(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'user_id' => auth()->id()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to check slot availability',
                'message' => 'An error occurred while checking slot availability. Please try again.'
            ], 500);
        }
    }

    /**
     * Clear availability cache (for testing/admin purposes)
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function clearCache()
    {
        try {
            // Clear all availability-related cache
            Cache::forget('availability:*');
            Cache::forget('nearest_slot:*');
            
            Log::info('Availability cache cleared', [
                'user_id' => auth()->id()
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Availability cache cleared successfully'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to clear availability cache', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to clear cache',
                'message' => 'An error occurred while clearing the cache. Please try again.'
            ], 500);
        }
    }
} 