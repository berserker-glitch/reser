<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Reservation;
use App\Models\Service;
use App\Services\AvailabilityService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ReservationController extends Controller
{
    private AvailabilityService $availabilityService;
    
    public function __construct(AvailabilityService $availabilityService)
    {
        $this->availabilityService = $availabilityService;
    }
    
    /**
     * Display a listing of reservations based on user role
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        Log::info('Reservations list requested', [
            'user_id' => auth()->id(),
            'user_role' => auth()->user()->role,
            'request_params' => $request->all()
        ]);

        $user = auth()->user();
        $query = Reservation::with(['service', 'employee', 'client']);
        
        // Apply role-based filtering
        if ($user->role === 'CLIENT') {
            // Clients can only see their own reservations
            $query->where('client_id', $user->id);
        } elseif ($user->role === 'OWNER') {
            // Owners can see all reservations with optional filters
            if ($request->has('client_id')) {
                $query->where('client_id', $request->client_id);
            }
            if ($request->has('employee_id')) {
                $query->where('employee_id', $request->employee_id);
            }
        }
        
        // Apply additional filters
        if ($request->has('status')) {
            $validator = Validator::make($request->only('status'), [
                'status' => 'in:REQUESTED,CONFIRMED,CANCELLED,COMPLETED'
            ]);
            
            if (!$validator->fails()) {
                $query->where('status', $request->status);
            }
        }
        
        if ($request->has('date')) {
            try {
                $date = Carbon::parse($request->date);
                $query->whereDate('start_at', $date);
            } catch (\Exception $e) {
                Log::warning('Invalid date filter provided', [
                    'date' => $request->date,
                    'user_id' => auth()->id()
                ]);
            }
        }
        
        if ($request->has('date_from') && $request->has('date_to')) {
            try {
                $dateFrom = Carbon::parse($request->date_from);
                $dateTo = Carbon::parse($request->date_to);
                $query->whereBetween('start_at', [$dateFrom, $dateTo]);
            } catch (\Exception $e) {
                Log::warning('Invalid date range filter provided', [
                    'date_from' => $request->date_from,
                    'date_to' => $request->date_to,
                    'user_id' => auth()->id()
                ]);
            }
        }
        
        try {
            $reservations = $query->orderBy('start_at', 'desc')
                ->paginate($request->per_page ?? 15);
            
            Log::info('Reservations list retrieved successfully', [
                'user_id' => auth()->id(),
                'total_count' => $reservations->total(),
                'current_page' => $reservations->currentPage()
            ]);
            
            return response()->json([
                'success' => true,
                'data' => $reservations
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to retrieve reservations list', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to retrieve reservations'
            ], 500);
        }
    }
    
    /**
     * Store a newly created reservation
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        Log::info('Reservation creation attempt', [
            'user_id' => auth()->id(),
            'request_data' => $request->except(['password'])
        ]);

        // Determine reservation type
        $isManual = $request->has('type') && $request->type === 'manual';
        $user = auth()->user();

        // Validate request data based on type
        $rules = [
            'service_id' => 'required|integer|exists:services,id',
            'employee_id' => 'nullable|integer|exists:employees,id',
            'start_at' => 'required|date',
        ];

        if ($isManual && $user->role === 'OWNER') {
            // Manual reservation by admin
            $rules['type'] = 'required|in:manual';
            $rules['client_full_name'] = 'required|string|max:120';
            $rules['client_phone'] = 'required|string|max:40';
            // Remove after:now for admin reservations
        } else {
            // Online reservation by client
            $rules['start_at'] .= '|after:now';
        }

        $validator = Validator::make($request->all(), $rules);
        
        if ($validator->fails()) {
            Log::warning('Reservation creation validation failed', [
                'user_id' => auth()->id(),
                'errors' => $validator->errors(),
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }
        
        try {
            DB::beginTransaction();
            
            $service = Service::findOrFail($request->service_id);
            $startAt = Carbon::parse($request->start_at);
            $endAt = $startAt->copy()->addMinutes($service->duration_min);
            
            // Auto-assign employee if not provided
            $employeeId = $request->employee_id;
            if (!$employeeId) {
                $employeeId = $this->availabilityService->findAvailableEmployee(
                    $request->service_id, 
                    $startAt, 
                    $service->duration_min
                );
                
                if (!$employeeId) {
                    Log::warning('No available employee found for auto-assignment', [
                        'service_id' => $request->service_id,
                        'start_at' => $startAt->toISOString(),
                        'user_id' => auth()->id()
                    ]);
                    
                    return response()->json([
                        'success' => false,
                        'error' => 'No available employee for this time slot'
                    ], 409);
                }
            }
            
            // Final availability check to prevent race conditions
            if (!$this->availabilityService->isSlotAvailable($employeeId, $startAt, $service->duration_min)) {
                Log::warning('Reservation conflict detected during creation', [
                    'employee_id' => $employeeId,
                    'start_at' => $startAt->toISOString(),
                    'client_id' => auth()->id(),
                    'service_id' => $request->service_id
                ]);
                
                return response()->json([
                    'success' => false,
                    'error' => 'Time slot no longer available'
                ], 409);
            }
            
            // Create the reservation
            $reservationData = [
                'employee_id' => $employeeId,
                'service_id' => $request->service_id,
                'start_at' => $startAt,
                'end_at' => $endAt,
                'status' => 'CONFIRMED',
                'type' => $isManual ? 'manual' : 'online'
            ];

            if ($isManual && $user->role === 'OWNER') {
                // Manual reservation by admin
                $reservationData['client_id'] = null; // No registered user
                $reservationData['client_full_name'] = $request->client_full_name;
                $reservationData['client_phone'] = $request->client_phone;
            } else {
                // Online reservation by authenticated client
                $reservationData['client_id'] = auth()->id();
            }

            $reservation = Reservation::create($reservationData);
            
            // Clear availability cache
            Cache::flush();
            
            DB::commit();
            
            // Load relationships for response
            $reservation->load(['service', 'employee', 'client']);
            
            Log::info('Reservation created successfully', [
                'reservation_id' => $reservation->id,
                'client_id' => auth()->id(),
                'employee_id' => $employeeId,
                'service_id' => $request->service_id,
                'start_at' => $startAt->toISOString(),
                'end_at' => $endAt->toISOString(),
                'auto_assigned_employee' => !$request->employee_id
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Reservation created successfully',
                'data' => $reservation
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Reservation creation failed', [
                'client_id' => auth()->id(),
                'service_id' => $request->service_id,
                'employee_id' => $request->employee_id,
                'start_at' => $request->start_at,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to create reservation. Please try again.'
            ], 500);
        }
    }
    
    /**
     * Display the specified reservation
     *
     * @param Reservation $reservation
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Reservation $reservation)
    {
        Log::info('Reservation details requested', [
            'reservation_id' => $reservation->id,
            'user_id' => auth()->id(),
            'user_role' => auth()->user()->role
        ]);

        $user = auth()->user();
        
        // Authorization check
        if ($user->role === 'CLIENT' && $reservation->client_id !== $user->id) {
            Log::warning('Unauthorized reservation access attempt', [
                'reservation_id' => $reservation->id,
                'user_id' => $user->id,
                'reservation_client_id' => $reservation->client_id
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized access'
            ], 403);
        }
        
        try {
            // Load relationships
            $reservation->load(['service', 'employee', 'client']);
            
            Log::info('Reservation details retrieved successfully', [
                'reservation_id' => $reservation->id,
                'user_id' => auth()->id()
            ]);
            
            return response()->json([
                'success' => true,
                'data' => $reservation
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to retrieve reservation details', [
                'reservation_id' => $reservation->id,
                'user_id' => auth()->id(),
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to retrieve reservation details'
            ], 500);
        }
    }
    
    /**
     * Update the specified reservation
     *
     * @param Request $request
     * @param Reservation $reservation
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, Reservation $reservation)
    {
        Log::info('Reservation update attempt', [
            'reservation_id' => $reservation->id,
            'user_id' => auth()->id(),
            'user_role' => auth()->user()->role,
            'request_data' => $request->all()
        ]);

        $user = auth()->user();
        
        // Authorization check
        if ($user->role === 'CLIENT' && $reservation->client_id !== $user->id) {
            Log::warning('Unauthorized reservation update attempt', [
                'reservation_id' => $reservation->id,
                'user_id' => $user->id,
                'reservation_client_id' => $reservation->client_id
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized access'
            ], 403);
        }
        
        // Validate request data - clients can only change status, owners can change more
        $validationRules = [];
        if ($user->role === 'CLIENT') {
            $validationRules = [
                'status' => 'required|in:CANCELLED'
            ];
        } else { // OWNER
            $validationRules = [
                'status' => 'required|in:CONFIRMED,CANCELLED,COMPLETED',
                'employee_id' => 'sometimes|integer|exists:employees,id',
                'start_at' => 'sometimes|date_format:Y-m-d\TH:i:s\Z|after:now'
            ];
        }
        
        $validator = Validator::make($request->all(), $validationRules);
        
        if ($validator->fails()) {
            Log::warning('Reservation update validation failed', [
                'reservation_id' => $reservation->id,
                'user_id' => auth()->id(),
                'errors' => $validator->errors()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Validation failed',
                'messages' => $validator->errors()
            ], 422);
        }
        
        try {
            DB::beginTransaction();
            
            $oldData = $reservation->toArray();
            $updateData = [];
            
            // Handle status update
            if ($request->has('status')) {
                $updateData['status'] = $request->status;
            }
            
            // Handle owner-only updates
            if ($user->role === 'OWNER') {
                if ($request->has('employee_id') && $request->employee_id !== $reservation->employee_id) {
                    // Check if new employee is available for this slot
                    $service = $reservation->service;
                    $startAt = $request->has('start_at') ? Carbon::parse($request->start_at) : $reservation->start_at;
                    
                    if (!$this->availabilityService->isSlotAvailable($request->employee_id, $startAt, $service->duration_min)) {
                        return response()->json([
                            'success' => false,
                            'error' => 'New employee not available for this time slot'
                        ], 409);
                    }
                    
                    $updateData['employee_id'] = $request->employee_id;
                }
                
                if ($request->has('start_at')) {
                    $newStartAt = Carbon::parse($request->start_at);
                    $newEndAt = $newStartAt->copy()->addMinutes($reservation->service->duration_min);
                    
                    // Check availability for new time slot
                    $employeeId = $updateData['employee_id'] ?? $reservation->employee_id;
                    if (!$this->availabilityService->isSlotAvailable($employeeId, $newStartAt, $reservation->service->duration_min)) {
                        return response()->json([
                            'success' => false,
                            'error' => 'New time slot not available'
                        ], 409);
                    }
                    
                    $updateData['start_at'] = $newStartAt;
                    $updateData['end_at'] = $newEndAt;
                }
            }
            
            // Update the reservation
            $reservation->update($updateData);
            
            // Clear availability cache
            Cache::flush();
            
            DB::commit();
            
            // Load fresh data with relationships
            $reservation->fresh(['service', 'employee', 'client']);
            
            Log::info('Reservation updated successfully', [
                'reservation_id' => $reservation->id,
                'user_id' => auth()->id(),
                'old_data' => $oldData,
                'new_data' => $updateData
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Reservation updated successfully',
                'data' => $reservation
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Reservation update failed', [
                'reservation_id' => $reservation->id,
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to update reservation'
            ], 500);
        }
    }
    
    /**
     * Remove the specified reservation
     *
     * @param Reservation $reservation
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Reservation $reservation)
    {
        Log::info('Reservation deletion attempt', [
            'reservation_id' => $reservation->id,
            'user_id' => auth()->id(),
            'user_role' => auth()->user()->role
        ]);

        $user = auth()->user();
        
        // Authorization check - only owners can delete, clients can only cancel
        if ($user->role === 'CLIENT') {
            Log::warning('Client attempted to delete reservation', [
                'reservation_id' => $reservation->id,
                'user_id' => $user->id
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Clients can only cancel reservations, not delete them'
            ], 403);
        }
        
        if ($user->role === 'OWNER' || ($user->role === 'CLIENT' && $reservation->client_id === $user->id)) {
            try {
                DB::beginTransaction();
                
                $reservationData = $reservation->toArray();
                $reservation->delete();
                
                // Clear availability cache
                Cache::flush();
                
                DB::commit();
                
                Log::info('Reservation deleted successfully', [
                    'reservation_id' => $reservationData['id'],
                    'user_id' => auth()->id(),
                    'deleted_reservation_data' => $reservationData
                ]);
                
                return response()->json([
                    'success' => true,
                    'message' => 'Reservation deleted successfully'
                ]);
                
            } catch (\Exception $e) {
                DB::rollBack();
                
                Log::error('Reservation deletion failed', [
                    'reservation_id' => $reservation->id,
                    'user_id' => auth()->id(),
                    'error' => $e->getMessage(),
                    'trace' => $e->getTraceAsString()
                ]);
                
                return response()->json([
                    'success' => false,
                    'error' => 'Unable to delete reservation'
                ], 500);
            }
        }
        
        return response()->json([
            'success' => false,
            'error' => 'Unauthorized access'
        ], 403);
    }
} 