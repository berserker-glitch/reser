<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Employee;
use App\Models\Service;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class EmployeeController extends Controller
{
    /**
     * Display a listing of employees with their services
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function index(Request $request)
    {
        Log::info('Employees list requested', [
            'user_id' => auth()->id(),
            'user_role' => auth()->user()->role,
            'request_params' => $request->all()
        ]);

        try {
            $query = Employee::with(['services', 'workingHours', 'user']);
            
            // Apply filters
            if ($request->has('service_id')) {
                $query->whereHas('services', function ($q) use ($request) {
                    $q->where('service_id', $request->service_id);
                });
            }
            
            if ($request->has('search')) {
                $search = $request->search;
                $query->where(function ($q) use ($search) {
                    $q->where('full_name', 'like', "%{$search}%")
                      ->orWhere('phone', 'like', "%{$search}%")
                      ->orWhere('note', 'like', "%{$search}%");
                });
            }
            
            $employees = $query->orderBy('full_name')
                ->paginate($request->per_page ?? 15);
            
            Log::info('Employees list retrieved successfully', [
                'user_id' => auth()->id(),
                'total_count' => $employees->total(),
                'current_page' => $employees->currentPage()
            ]);
            
            return response()->json([
                'success' => true,
                'data' => $employees
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to retrieve employees list', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to retrieve employees'
            ], 500);
        }
    }
    
    /**
     * Store a newly created employee
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function store(Request $request)
    {
        Log::info('Employee creation attempt', [
            'user_id' => auth()->id(),
            'request_data' => $request->except(['password'])
        ]);

        // Validate request data
        $validator = Validator::make($request->all(), [
            'full_name' => 'required|string|max:120',
            'phone' => 'nullable|string|max:40',
            'note' => 'nullable|string|max:1000',
            'service_ids' => 'nullable|array',
            'service_ids.*' => 'integer|exists:services,id'
        ]);
        
        if ($validator->fails()) {
            Log::warning('Employee creation validation failed', [
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
            
            // Create the employee
            $employee = Employee::create([
                'user_id' => auth()->id(), // Associate with the owner creating it
                'full_name' => $request->full_name,
                'phone' => $request->phone,
                'note' => $request->note
            ]);
            
            // Attach services if provided
            if ($request->has('service_ids') && is_array($request->service_ids)) {
                $employee->services()->attach($request->service_ids);
            }
            
            // Clear availability cache since new employee affects availability
            Cache::tags(['availability'])->flush();
            
            DB::commit();
            
            // Load relationships for response
            $employee->load(['services', 'workingHours', 'user']);
            
            Log::info('Employee created successfully', [
                'employee_id' => $employee->id,
                'employee_name' => $employee->full_name,
                'user_id' => auth()->id(),
                'service_count' => $employee->services->count()
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Employee created successfully',
                'data' => $employee
            ], 201);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Employee creation failed', [
                'user_id' => auth()->id(),
                'request_data' => $request->all(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to create employee. Please try again.'
            ], 500);
        }
    }
    
    /**
     * Display the specified employee
     *
     * @param Employee $employee
     * @return \Illuminate\Http\JsonResponse
     */
    public function show(Employee $employee)
    {
        Log::info('Employee details requested', [
            'employee_id' => $employee->id,
            'user_id' => auth()->id()
        ]);

        try {
            // Load relationships with additional data
            $employee->load([
                'services', 
                'workingHours', 
                'user',
                'reservations' => function ($query) {
                    $query->with(['service', 'client'])
                          ->where('start_at', '>=', now())
                          ->where('status', '!=', 'CANCELLED')
                          ->orderBy('start_at');
                }
            ]);
            
            // Add some statistics
            $employee->statistics = [
                'total_services' => $employee->services->count(),
                'working_days' => $employee->workingHours->count(),
                'upcoming_reservations' => $employee->reservations->count(),
                'total_reservations' => $employee->reservations()->count(),
                'completed_reservations' => $employee->reservations()
                    ->where('status', 'COMPLETED')
                    ->count()
            ];
            
            Log::info('Employee details retrieved successfully', [
                'employee_id' => $employee->id,
                'user_id' => auth()->id()
            ]);
            
            return response()->json([
                'success' => true,
                'data' => $employee
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to retrieve employee details', [
                'employee_id' => $employee->id,
                'user_id' => auth()->id(),
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to retrieve employee details'
            ], 500);
        }
    }
    
    /**
     * Update the specified employee
     *
     * @param Request $request
     * @param Employee $employee
     * @return \Illuminate\Http\JsonResponse
     */
    public function update(Request $request, Employee $employee)
    {
        Log::info('Employee update attempt', [
            'employee_id' => $employee->id,
            'user_id' => auth()->id(),
            'request_data' => $request->except(['password'])
        ]);

        // Validate request data
        $validator = Validator::make($request->all(), [
            'full_name' => 'sometimes|required|string|max:120',
            'phone' => 'nullable|string|max:40',
            'note' => 'nullable|string|max:1000',
            'service_ids' => 'nullable|array',
            'service_ids.*' => 'integer|exists:services,id'
        ]);
        
        if ($validator->fails()) {
            Log::warning('Employee update validation failed', [
                'employee_id' => $employee->id,
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
            
            $oldData = $employee->toArray();
            
            // Update basic employee data
            $updateData = [];
            if ($request->has('full_name')) {
                $updateData['full_name'] = $request->full_name;
            }
            if ($request->has('phone')) {
                $updateData['phone'] = $request->phone;
            }
            if ($request->has('note')) {
                $updateData['note'] = $request->note;
            }
            
            if (!empty($updateData)) {
                $employee->update($updateData);
            }
            
            // Update service assignments if provided
            if ($request->has('service_ids')) {
                if (is_array($request->service_ids)) {
                    $employee->services()->sync($request->service_ids);
                } else {
                    // If service_ids is null or empty, remove all services
                    $employee->services()->detach();
                }
                
                // Clear availability cache since service assignments affect availability
                Cache::tags(['availability'])->flush();
            }
            
            DB::commit();
            
            // Load fresh data with relationships
            $employee->load(['services', 'workingHours', 'user']);
            
            Log::info('Employee updated successfully', [
                'employee_id' => $employee->id,
                'user_id' => auth()->id(),
                'old_data' => $oldData,
                'new_data' => $updateData,
                'services_updated' => $request->has('service_ids')
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Employee updated successfully',
                'data' => $employee
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Employee update failed', [
                'employee_id' => $employee->id,
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to update employee'
            ], 500);
        }
    }
    
    /**
     * Remove the specified employee
     *
     * @param Employee $employee
     * @return \Illuminate\Http\JsonResponse
     */
    public function destroy(Employee $employee)
    {
        Log::info('Employee deletion attempt', [
            'employee_id' => $employee->id,
            'employee_name' => $employee->full_name,
            'user_id' => auth()->id()
        ]);

        try {
            // Check if employee has upcoming reservations
            $upcomingReservations = $employee->reservations()
                ->where('start_at', '>=', now())
                ->where('status', '!=', 'CANCELLED')
                ->count();
                
            if ($upcomingReservations > 0) {
                Log::warning('Cannot delete employee with upcoming reservations', [
                    'employee_id' => $employee->id,
                    'upcoming_reservations_count' => $upcomingReservations,
                    'user_id' => auth()->id()
                ]);
                
                return response()->json([
                    'success' => false,
                    'error' => "Cannot delete employee with {$upcomingReservations} upcoming reservations. Please cancel or reassign them first."
                ], 409);
            }
            
            DB::beginTransaction();
            
            $employeeData = $employee->toArray();
            
            // Detach all services
            $employee->services()->detach();
            
            // Delete working hours
            $employee->workingHours()->delete();
            
            // Delete the employee (reservations will be kept for historical purposes)
            $employee->delete();
            
            // Clear availability cache
            Cache::tags(['availability'])->flush();
            
            DB::commit();
            
            Log::info('Employee deleted successfully', [
                'employee_id' => $employeeData['id'],
                'employee_name' => $employeeData['full_name'],
                'user_id' => auth()->id()
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Employee deleted successfully'
            ]);
            
        } catch (\Exception $e) {
            DB::rollBack();
            
            Log::error('Employee deletion failed', [
                'employee_id' => $employee->id,
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to delete employee'
            ], 500);
        }
    }
    
    /**
     * Get employees that can perform a specific service
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function byService(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'service_id' => 'required|integer|exists:services,id'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'error' => 'Invalid service ID'
            ], 422);
        }
        
        try {
            $employees = Employee::whereHas('services', function ($query) use ($request) {
                $query->where('service_id', $request->service_id);
            })->with(['services', 'workingHours'])->get();
            
            return response()->json([
                'success' => true,
                'data' => $employees
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to get employees by service', [
                'service_id' => $request->service_id,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'success' => false,
                'error' => 'Unable to retrieve employees'
            ], 500);
        }
    }
} 