<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\API\BaseController;
use App\Models\ManualReservation;
use App\Models\Service;
use App\Models\Employee;
use App\Services\AvailabilityService;
use Carbon\Carbon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class ManualReservationController extends BaseController
{
    private AvailabilityService $availabilityService;
    
    public function __construct(AvailabilityService $availabilityService)
    {
        $this->availabilityService = $availabilityService;
    }

    /**
     * Display a listing of manual reservations for the admin's salon
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        Log::info('Manual reservations list requested', [
            'user_id' => auth()->id(),
            'user_role' => auth()->user()->role,
            'request_params' => $request->all()
        ]);

        $user = auth()->user();
        
        // Only owners can access manual reservations
        if ($user->role !== 'OWNER') {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized access'
            ], 403);
        }

        // Get salon ID from authenticated owner
        $userSalon = $user->salon;
        if (!$userSalon) {
            return response()->json([
                'success' => false,
                'error' => 'No salon found for this owner'
            ], 404);
        }
        $salonId = $userSalon->id;

        $query = ManualReservation::with(['service', 'employee', 'createdByUser'])
            ->where('salon_id', $salonId);

        // Apply filters
        if ($request->has('status')) {
            $validator = Validator::make($request->only('status'), [
                'status' => 'in:CONFIRMED,CANCELLED,COMPLETED'
            ]);
            
            if (!$validator->fails()) {
                $query->where('status', $request->status);
            }
        }

        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
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
            $manualReservations = $query->orderBy('start_at', 'desc')
                ->paginate($request->per_page ?? 15);
            
            Log::info('Manual reservations list retrieved successfully', [
                'user_id' => auth()->id(),
                'salon_id' => $salonId,
                'total_count' => $manualReservations->total(),
                'current_page' => $manualReservations->currentPage()
            ]);
            
            return response()->json([
                'success' => true,
                'data' => $manualReservations
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to retrieve manual reservations list', [
                'user_id' => auth()->id(),
                'salon_id' => $salonId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to retrieve manual reservations'
            ], 500);
        }
    }

    /**
     * Store a newly created manual reservation
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        Log::info('Manual reservation creation attempt', [
            'user_id' => auth()->id(),
            'request_data' => $request->except(['password'])
        ]);

        $user = auth()->user();
        
        // Only owners can create manual reservations
        if ($user->role !== 'OWNER') {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized access'
            ], 403);
        }

        // Validate request data
        $validator = Validator::make($request->all(), [
            'service_id' => 'required|integer|exists:services,id',
            'employee_id' => 'required|integer|exists:employees,id',
            'client_full_name' => 'required|string|max:120|min:2',
            'client_phone' => 'required|string|max:40',
            'start_at' => 'required|date',
            'notes' => 'nullable|string|max:1000',
        ]);
        
        if ($validator->fails()) {
            Log::warning('Manual reservation creation validation failed', [
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
            $employee = Employee::findOrFail($request->employee_id);
            $salonId = $service->salon_id;
            
            // Validate that the owner can access this salon
            $userSalon = $user->salon;
            if (!$userSalon || $userSalon->id !== $salonId) {
                Log::warning('Owner attempted to create manual reservation for different salon', [
                    'user_id' => $user->id,
                    'user_salon_id' => $userSalon ? $userSalon->id : null,
                    'requested_service_salon_id' => $salonId
                ]);
                
                return response()->json([
                    'success' => false,
                    'error' => 'Service not found or access denied'
                ], 403);
            }
            
            // Validate that employee belongs to the same salon
            if ($employee->salon_id !== $salonId) {
                Log::warning('Employee does not belong to service salon', [
                    'employee_id' => $request->employee_id,
                    'employee_salon_id' => $employee->salon_id,
                    'service_salon_id' => $salonId
                ]);
                
                return response()->json([
                    'success' => false,
                    'error' => 'Employee not available for this service'
                ], 422);
            }
            
            $startAt = Carbon::parse($request->start_at);
            $endAt = $startAt->copy()->addMinutes($service->duration_min);
            
            // Check availability for this time slot
            if (!$this->availabilityService->isSlotAvailable($employee->id, $startAt, $service->duration_min)) {
                Log::warning('Manual reservation conflict detected during creation', [
                    'employee_id' => $employee->id,
                    'salon_id' => $salonId,
                    'start_at' => $startAt->toISOString(),
                    'admin_id' => auth()->id(),
                    'service_id' => $request->service_id
                ]);
                
                return response()->json([
                    'success' => false,
                    'error' => 'Time slot not available'
                ], 409);
            }
            
            // Create the manual reservation
            $manualReservation = ManualReservation::create([
                'salon_id' => $salonId,
                'created_by_user_id' => $user->id,
                'employee_id' => $employee->id,
                'service_id' => $service->id,
                'client_full_name' => $request->client_full_name,
                'client_phone' => $request->client_phone,
                'start_at' => $startAt,
                'end_at' => $endAt,
                'status' => ManualReservation::STATUS_CONFIRMED,
                'notes' => $request->notes,
            ]);
            
            // Clear availability cache
            Cache::flush();
            
            DB::commit();
            
            // Load relationships for response
            $manualReservation->load(['service', 'employee', 'createdByUser', 'salon']);
            
            Log::info('Manual reservation created successfully', [
                'manual_reservation_id' => $manualReservation->id,
                'salon_id' => $salonId,
                'admin_id' => $user->id,
                'employee_id' => $employee->id,
                'service_id' => $service->id,
                'client_name' => $request->client_full_name,
                'start_at' => $startAt->toISOString(),
                'end_at' => $endAt->toISOString()
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Manual reservation created successfully',
                'data' => $manualReservation
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Manual reservation creation failed', [
                'admin_id' => auth()->id(),
                'service_id' => $request->service_id,
                'employee_id' => $request->employee_id,
                'start_at' => $request->start_at,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to create manual reservation. Please try again.'
            ], 500);
        }
    }

    /**
     * Display the specified manual reservation
     *
     * @param ManualReservation $manualReservation
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(ManualReservation $manualReservation)
    {
        Log::info('Manual reservation details requested', [
            'manual_reservation_id' => $manualReservation->id,
            'user_id' => auth()->id(),
            'user_role' => auth()->user()->role
        ]);

        $user = auth()->user();
        
        // Only owners can view manual reservations
        if ($user->role !== 'OWNER') {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized access'
            ], 403);
        }

        // Validate that this reservation belongs to the owner's salon
        $userSalon = $user->salon;
        if (!$userSalon || $manualReservation->salon_id !== $userSalon->id) {
            Log::warning('Unauthorized manual reservation access attempt', [
                'manual_reservation_id' => $manualReservation->id,
                'user_id' => $user->id,
                'user_salon_id' => $userSalon ? $userSalon->id : null,
                'reservation_salon_id' => $manualReservation->salon_id
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized access'
            ], 403);
        }
        
        try {
            // Load relationships
            $manualReservation->load(['service', 'employee', 'createdByUser', 'salon']);
            
            Log::info('Manual reservation details retrieved successfully', [
                'manual_reservation_id' => $manualReservation->id,
                'user_id' => auth()->id()
            ]);
            
            return response()->json([
                'success' => true,
                'data' => $manualReservation
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to retrieve manual reservation details', [
                'manual_reservation_id' => $manualReservation->id,
                'user_id' => auth()->id(),
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to retrieve manual reservation details'
            ], 500);
        }
    }

    /**
     * Update the specified manual reservation
     *
     * @param Request $request
     * @param ManualReservation $manualReservation
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, ManualReservation $manualReservation)
    {
        Log::info('Manual reservation update attempt', [
            'manual_reservation_id' => $manualReservation->id,
            'user_id' => auth()->id(),
            'request_data' => $request->all()
        ]);

        $user = auth()->user();
        
        // Only owners can update manual reservations
        if ($user->role !== 'OWNER') {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized access'
            ], 403);
        }

        // Validate that this reservation belongs to the owner's salon
        $userSalon = $user->salon;
        if (!$userSalon || $manualReservation->salon_id !== $userSalon->id) {
            Log::warning('Unauthorized manual reservation update attempt', [
                'manual_reservation_id' => $manualReservation->id,
                'user_id' => $user->id,
                'user_salon_id' => $userSalon ? $userSalon->id : null,
                'reservation_salon_id' => $manualReservation->salon_id
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized access'
            ], 403);
        }
        
        // Validate request data
        $validator = Validator::make($request->all(), [
            'status' => 'required|in:CONFIRMED,CANCELLED,COMPLETED',
            'employee_id' => 'sometimes|integer|exists:employees,id',
            'client_full_name' => 'sometimes|string|max:120|min:2',
            'client_phone' => 'sometimes|string|max:40',
            'start_at' => 'sometimes|date',
            'notes' => 'nullable|string|max:1000',
        ]);
        
        if ($validator->fails()) {
            Log::warning('Manual reservation update validation failed', [
                'manual_reservation_id' => $manualReservation->id,
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
            
            $oldData = $manualReservation->toArray();
            $updateData = [];
            
            // Handle status update
            if ($request->has('status')) {
                $updateData['status'] = $request->status;
            }
            
            // Handle client information updates
            if ($request->has('client_full_name')) {
                $updateData['client_full_name'] = $request->client_full_name;
            }
            
            if ($request->has('client_phone')) {
                $updateData['client_phone'] = $request->client_phone;
            }
            
            if ($request->has('notes')) {
                $updateData['notes'] = $request->notes;
            }
            
            // Handle employee change
            if ($request->has('employee_id') && $request->employee_id !== $manualReservation->employee_id) {
                $newEmployee = Employee::findOrFail($request->employee_id);
                
                // Validate employee belongs to same salon
                if ($newEmployee->salon_id !== $manualReservation->salon_id) {
                    return response()->json([
                        'success' => false,
                        'error' => 'Employee does not belong to this salon'
                    ], 422);
                }
                
                // Check if new employee is available for this slot
                $startAt = $request->has('start_at') ? Carbon::parse($request->start_at) : $manualReservation->start_at;
                
                if (!$this->availabilityService->isSlotAvailable($request->employee_id, $startAt, $manualReservation->service->duration_min, $manualReservation->id, 'manual')) {
                    return response()->json([
                        'success' => false,
                        'error' => 'New employee not available for this time slot'
                    ], 409);
                }
                
                $updateData['employee_id'] = $request->employee_id;
            }
            
            // Handle time change
            if ($request->has('start_at')) {
                $newStartAt = Carbon::parse($request->start_at);
                $newEndAt = $newStartAt->copy()->addMinutes($manualReservation->service->duration_min);
                
                // Check availability for new time slot
                $employeeId = $updateData['employee_id'] ?? $manualReservation->employee_id;
                if (!$this->availabilityService->isSlotAvailable($employeeId, $newStartAt, $manualReservation->service->duration_min, $manualReservation->id, 'manual')) {
                    return response()->json([
                        'success' => false,
                        'error' => 'New time slot not available'
                    ], 409);
                }
                
                $updateData['start_at'] = $newStartAt;
                $updateData['end_at'] = $newEndAt;
            }
            
            // Update the manual reservation
            $manualReservation->update($updateData);
            
            // Clear availability cache
            Cache::flush();
            
            DB::commit();
            
            // Load fresh data with relationships
            $manualReservation->fresh(['service', 'employee', 'createdByUser', 'salon']);
            
            Log::info('Manual reservation updated successfully', [
                'manual_reservation_id' => $manualReservation->id,
                'user_id' => auth()->id(),
                'old_data' => $oldData,
                'new_data' => $updateData
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Manual reservation updated successfully',
                'data' => $manualReservation
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Manual reservation update failed', [
                'manual_reservation_id' => $manualReservation->id,
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to update manual reservation'
            ], 500);
        }
    }

    /**
     * Remove the specified manual reservation
     *
     * @param ManualReservation $manualReservation
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(ManualReservation $manualReservation)
    {
        Log::info('Manual reservation deletion attempt', [
            'manual_reservation_id' => $manualReservation->id,
            'user_id' => auth()->id(),
        ]);

        $user = auth()->user();
        
        // Only owners can delete manual reservations
        if ($user->role !== 'OWNER') {
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized access'
            ], 403);
        }

        // Validate that this reservation belongs to the owner's salon
        $userSalon = $user->salon;
        if (!$userSalon || $manualReservation->salon_id !== $userSalon->id) {
            Log::warning('Unauthorized manual reservation deletion attempt', [
                'manual_reservation_id' => $manualReservation->id,
                'user_id' => $user->id,
                'user_salon_id' => $userSalon ? $userSalon->id : null,
                'reservation_salon_id' => $manualReservation->salon_id
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unauthorized access'
            ], 403);
        }
        
        try {
            DB::beginTransaction();
            
            $reservationData = $manualReservation->toArray();
            $manualReservation->delete();
            
            // Clear availability cache
            Cache::flush();
            
            DB::commit();
            
            Log::info('Manual reservation deleted successfully', [
                'manual_reservation_id' => $reservationData['id'],
                'user_id' => auth()->id(),
                'deleted_reservation_data' => $reservationData
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Manual reservation deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Manual reservation deletion failed', [
                'manual_reservation_id' => $manualReservation->id,
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to delete manual reservation'
            ], 500);
        }
    }
}
