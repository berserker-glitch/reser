<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\API\BaseController;
use App\Models\Salon;
use App\Models\HolidaySetting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;

/**
 * SalonController
 * 
 * Handles public salon discovery endpoints for the client booking flow
 * These endpoints don't require authentication and are used by potential clients
 */
class SalonController extends BaseController
{
    /**
     * Get salon information by slug along with services, employees, and settings
     * 
     * @param string $slug
     * @return JsonResponse
     */
    public function show(string $slug): JsonResponse
    {
        try {
            Log::info('🏪 Fetching salon by slug', ['slug' => $slug]);

            // Convert slug back to proper salon name 
            $salonName = ucwords(str_replace('-', ' ', $slug));
            $salon = Salon::where('name', $salonName)
                ->with([
                    'services' => function ($query) {
                        $query->orderBy('name');
                    },
                    'employees' => function ($query) {
                        $query->orderBy('full_name')
                              ->with(['services']); // Include employee services
                    },
                    'workingHours' => function ($query) {
                        $query->orderBy('employee_id')
                              ->orderBy('weekday');
                    }
                ])
                ->first();

            if (!$salon) {
                Log::warning('❌ Salon not found', ['slug' => $slug]);
                return response()->json([
                    'success' => false,
                    'message' => 'Salon not found'
                ], 404);
            }

            // Get holiday settings for this salon
            $holidaySettings = HolidaySetting::where('salon_id', $salon->id)->first();
            
            // If no holiday settings exist, create default ones
            if (!$holidaySettings) {
                $holidaySettings = HolidaySetting::create([
                    'salon_id' => $salon->id,
                    'holiday_system_type' => 'standard'
                ]);
            }

            // Format the response
            $response = [
                'salon' => [
                    'id' => $salon->id,
                    'name' => $salon->name,
                    'slug' => $salon->slug, // This uses the computed slug accessor
                    'description' => $salon->description,
                    'address' => $salon->address,
                    'phone' => $salon->phone,
                    'email' => $salon->email,
                ],
                'services' => $salon->services->map(function ($service) {
                    return [
                        'id' => $service->id,
                        'name' => $service->name,
                        'description' => $service->description,
                        'duration_min' => $service->duration_min,
                        'price_dhs' => $service->price_dhs,
                        'salon_id' => $service->salon_id,
                    ];
                }),
                'employees' => $salon->employees->map(function ($employee) {
                    return [
                        'id' => $employee->id,
                        'full_name' => $employee->full_name,
                        'phone' => $employee->phone,
                        'profile_picture' => $employee->profile_picture,
                        'note' => $employee->note,
                        'salon_id' => $employee->salon_id,
                        'services' => $employee->services->map(function ($service) {
                            return [
                                'id' => $service->id,
                                'name' => $service->name,
                                'duration_min' => $service->duration_min,
                                'price_dhs' => $service->price_dhs,
                            ];
                        }),
                    ];
                }),
                'working_hours' => $salon->workingHours->map(function ($workingHour) {
                    return [
                        'id' => $workingHour->id,
                        'employee_id' => $workingHour->employee_id,
                        'weekday' => $workingHour->weekday,
                        'start_time' => $workingHour->start_time,
                        'end_time' => $workingHour->end_time,
                        'break_start' => $workingHour->break_start,
                        'break_end' => $workingHour->break_end,
                    ];
                }),
                'holiday_settings' => [
                    'id' => $holidaySettings->id,
                    'holiday_system_type' => $holidaySettings->holiday_system_type,
                ],
            ];

            Log::info('✅ Salon data retrieved successfully', [
                'salon_id' => $salon->id,
                'services_count' => $salon->services->count(),
                'employees_count' => $salon->employees->count(),
            ]);

            return response()->json([
                'success' => true,
                'data' => $response
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Failed to fetch salon', [
                'slug' => $slug,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to load salon information'
            ], 500);
        }
    }

    /**
     * Get available time slots for a service/employee combination
     * 
     * @param Request $request
     * @param string $slug
     * @return JsonResponse
     */
    public function availability(Request $request, string $slug): JsonResponse
    {
        try {
            $request->validate([
                'service_id' => 'required|integer|exists:services,id',
                'employee_id' => 'nullable|integer|exists:employees,id',
                'date' => 'required|date|after_or_equal:today',
            ]);

            Log::info('📅 Fetching availability', [
                'slug' => $slug,
                'service_id' => $request->service_id,
                'employee_id' => $request->employee_id,
                'date' => $request->date,
            ]);

            // Convert slug back to proper salon name 
            $salonName = ucwords(str_replace('-', ' ', $slug));
            $salon = Salon::where('name', $salonName)->first();
            if (!$salon) {
                return response()->json([
                    'success' => false,
                    'message' => 'Salon not found'
                ], 404);
            }

            // TODO: Implement availability logic using AvailabilityService
            // For now, return mock slots
            $slots = [
                $request->date . 'T09:00:00',
                $request->date . 'T09:30:00',
                $request->date . 'T10:00:00',
                $request->date . 'T10:30:00',
                $request->date . 'T14:00:00',
                $request->date . 'T14:30:00',
                $request->date . 'T15:00:00',
                $request->date . 'T15:30:00',
            ];

            $response = [
                'date' => $request->date,
                'service_id' => $request->service_id,
                'employee_id' => $request->employee_id,
                'slots' => $slots,
            ];

            Log::info('✅ Availability retrieved', [
                'slots_count' => count($slots)
            ]);

            return response()->json([
                'success' => true,
                'data' => $response
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Failed to fetch availability', [
                'slug' => $slug,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to load availability'
            ], 500);
        }
    }

    /**
     * Create a temporary guest booking (before authentication)
     * 
     * @param Request $request
     * @param string $slug
     * @return JsonResponse
     */
    public function bookGuest(Request $request, string $slug): JsonResponse
    {
        try {
            $request->validate([
                'service_id' => 'required|integer|exists:services,id',
                'employee_id' => 'nullable|integer|exists:employees,id',
                'start_at' => 'required|date|after:now',
                'client_name' => 'required|string|max:255',
                'client_phone' => 'required|string|max:20',
                'client_email' => 'required|email|max:255',
            ]);

            Log::info('🎫 Creating guest booking', [
                'slug' => $slug,
                'service_id' => $request->service_id,
                'employee_id' => $request->employee_id,
                'start_at' => $request->start_at,
                'client_email' => $request->client_email,
            ]);

            // Convert slug back to proper salon name 
            $salonName = ucwords(str_replace('-', ' ', $slug));
            $salon = Salon::where('name', $salonName)->first();
            if (!$salon) {
                return response()->json([
                    'success' => false,
                    'message' => 'Salon not found'
                ], 404);
            }

            // TODO: Implement temporary booking creation
            // For now, return mock response
            $tempBooking = [
                'id' => 'temp_' . uniqid(),
                'salon_id' => $salon->id,
                'service_id' => $request->service_id,
                'employee_id' => $request->employee_id,
                'start_at' => $request->start_at,
                'end_at' => now()->addMinutes(30)->toISOString(), // TODO: Calculate based on service duration
                'client_name' => $request->client_name,
                'client_phone' => $request->client_phone,
                'client_email' => $request->client_email,
                'expires_at' => now()->addMinutes(15)->toISOString(), // 15 minutes to complete registration
            ];

            Log::info('✅ Guest booking created', [
                'temp_booking_id' => $tempBooking['id']
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Temporary booking created. Please complete registration within 15 minutes.',
                'data' => [
                    'temp_booking' => $tempBooking
                ]
            ], 201);

        } catch (\Exception $e) {
            Log::error('❌ Failed to create guest booking', [
                'slug' => $slug,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to create booking'
            ], 500);
        }
    }
}
