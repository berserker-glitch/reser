<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\WorkingHour;
use App\Models\Employee;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Illuminate\Support\Facades\DB;

/**
 * WorkingHourController - Manages employee working hours (OWNER only)
 * 
 * Handles CRUD operations for working hours including:
 * - Creating employee schedules with breaks
 * - Reading/listing working hours by employee
 * - Updating schedule modifications
 * - Deleting schedules
 * - Business rules validation
 */
class WorkingHourController extends Controller
{
    /**
     * Display a listing of working hours
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function index(Request $request): JsonResponse
    {
        Log::info('WorkingHourController@index - Fetching working hours', [
            'user_id' => auth()->id(),
            'filters' => $request->only(['employee_id', 'weekday'])
        ]);

        try {
            $query = WorkingHour::with(['employee:id,full_name']);

            // Filter by employee if specified
            if ($request->has('employee_id') && !empty($request->employee_id)) {
                $query->where('employee_id', $request->employee_id);
            }

            // Filter by weekday if specified
            if ($request->has('weekday') && is_numeric($request->weekday)) {
                $query->where('weekday', $request->weekday);
            }

            // Sort by employee and weekday
            $workingHours = $query->orderBy('employee_id')
                                  ->orderBy('weekday')
                                  ->get();

            // Group by employee for better organization
            $grouped = $workingHours->groupBy('employee_id')->map(function ($hours) {
                return [
                    'employee' => $hours->first()->employee,
                    'schedule' => $hours->map(function ($hour) {
                        return [
                            'id' => $hour->id,
                            'weekday' => $hour->weekday,
                            'weekday_name' => $this->getWeekdayName($hour->weekday),
                            'start_time' => $hour->start_time,
                            'end_time' => $hour->end_time,
                            'break_start' => $hour->break_start,
                            'break_end' => $hour->break_end,
                            'total_hours' => $this->calculateWorkingHours($hour)
                        ];
                    })
                ];
            })->values();

            Log::info('WorkingHourController@index - Working hours retrieved', [
                'total_records' => $workingHours->count(),
                'employees_count' => $grouped->count(),
                'user_id' => auth()->id()
            ]);

            return response()->json($grouped);

        } catch (\Exception $e) {
            Log::error('WorkingHourController@index - Failed to fetch working hours', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch working hours',
                'error' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Store a newly created working hour
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        Log::info('WorkingHourController@store - Creating working hour', [
            'user_id' => auth()->id(),
            'request_data' => $request->all()
        ]);

        // Validate input data
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'weekday' => 'required|integer|min:0|max:6', // 0=Sunday, 6=Saturday
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'break_start' => 'nullable|date_format:H:i',
            'break_end' => 'nullable|date_format:H:i'
        ]);

        // Custom validation for working days and break consistency
        $validator->after(function ($validator) use ($request) {
            // If either start_time or end_time is provided, both must be provided
            if (($request->start_time && !$request->end_time) || (!$request->start_time && $request->end_time)) {
                $validator->errors()->add('working_times', 'Both start time and end time must be provided for working days');
            }
            
            // If both times are provided, end_time must be after start_time
            if ($request->start_time && $request->end_time && $request->start_time >= $request->end_time) {
                $validator->errors()->add('end_time', 'End time must be after start time');
            }
            
            // Break time validation only applies to working days
            if ($request->start_time && $request->end_time) {
                if ($request->break_start && !$request->break_end) {
                    $validator->errors()->add('break_end', 'Break end time is required when break start is provided');
                }
                if (!$request->break_start && $request->break_end) {
                    $validator->errors()->add('break_start', 'Break start time is required when break end is provided');
                }
                
                // Validate break times are within working hours
                if ($request->break_start && $request->break_end) {
                    if ($request->break_start <= $request->start_time || $request->break_start >= $request->end_time) {
                        $validator->errors()->add('break_start', 'Break start must be after work start and before work end');
                    }
                    if ($request->break_end <= $request->break_start || $request->break_end >= $request->end_time) {
                        $validator->errors()->add('break_end', 'Break end must be after break start and before work end');
                    }
                }
            }
        });

        if ($validator->fails()) {
            Log::warning('WorkingHourController@store - Validation failed', [
                'errors' => $validator->errors(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Check for existing working hour for same employee and weekday
            $existing = WorkingHour::where('employee_id', $request->employee_id)
                                   ->where('weekday', $request->weekday)
                                   ->exists();

            if ($existing) {
                Log::warning('WorkingHourController@store - Working hour already exists', [
                    'employee_id' => $request->employee_id,
                    'weekday' => $request->weekday,
                    'user_id' => auth()->id()
                ]);

                return response()->json([
                    'message' => 'Working hour already exists for this employee and weekday',
                    'employee_id' => $request->employee_id,
                    'weekday' => $request->weekday
                ], 422);
            }

            // Create the working hour
            $workingHour = WorkingHour::create([
                'employee_id' => $request->employee_id,
                'weekday' => $request->weekday,
                'start_time' => $request->start_time,
                'end_time' => $request->end_time,
                'break_start' => $request->break_start,
                'break_end' => $request->break_end
            ]);

            // Load employee data
            $workingHour->load('employee:id,full_name');

            Log::info('WorkingHourController@store - Working hour created successfully', [
                'working_hour_id' => $workingHour->id,
                'employee_id' => $workingHour->employee_id,
                'weekday' => $workingHour->weekday,
                'user_id' => auth()->id()
            ]);

            return response()->json($workingHour, 201);

        } catch (\Exception $e) {
            Log::error('WorkingHourController@store - Failed to create working hour', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to create working hour',
                'error' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Display the specified working hour
     * 
     * @param WorkingHour $workingHour
     * @return JsonResponse
     */
    public function show(WorkingHour $workingHour): JsonResponse
    {
        Log::info('WorkingHourController@show - Fetching working hour details', [
            'working_hour_id' => $workingHour->id,
            'user_id' => auth()->id()
        ]);

        try {
            $workingHour->load('employee:id,full_name,phone');

            // Add calculated fields
            $workingHour->weekday_name = $this->getWeekdayName($workingHour->weekday);
            $workingHour->total_hours = $this->calculateWorkingHours($workingHour);
            $workingHour->has_break = !is_null($workingHour->break_start) && !is_null($workingHour->break_end);

            Log::info('WorkingHourController@show - Working hour details retrieved', [
                'working_hour_id' => $workingHour->id,
                'employee_id' => $workingHour->employee_id,
                'total_hours' => $workingHour->total_hours
            ]);

            return response()->json($workingHour);

        } catch (\Exception $e) {
            Log::error('WorkingHourController@show - Failed to fetch working hour details', [
                'working_hour_id' => $workingHour->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to fetch working hour details',
                'error' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Update the specified working hour
     * 
     * @param Request $request
     * @param WorkingHour $workingHour
     * @return JsonResponse
     */
    public function update(Request $request, WorkingHour $workingHour): JsonResponse
    {
        Log::info('WorkingHourController@update - Updating working hour', [
            'working_hour_id' => $workingHour->id,
            'user_id' => auth()->id(),
            'request_data' => $request->all()
        ]);

        // Validate input data
        $validator = Validator::make($request->all(), [
            'start_time' => 'nullable|date_format:H:i',
            'end_time' => 'nullable|date_format:H:i',
            'break_start' => 'nullable|date_format:H:i',
            'break_end' => 'nullable|date_format:H:i'
        ]);

        // Custom validation for working days and break times
        $validator->after(function ($validator) use ($request, $workingHour) {
            $startTime = $request->has('start_time') ? $request->start_time : $workingHour->start_time;
            $endTime = $request->has('end_time') ? $request->end_time : $workingHour->end_time;
            $breakStart = $request->get('break_start');
            $breakEnd = $request->get('break_end');

            // If either start_time or end_time is being updated, both must be provided or both must be null
            if ($request->has('start_time') || $request->has('end_time')) {
                if (($startTime && !$endTime) || (!$startTime && $endTime)) {
                    $validator->errors()->add('working_times', 'Both start time and end time must be provided for working days, or both must be null for non-working days');
                }
                
                // If both times are provided, end_time must be after start_time
                if ($startTime && $endTime && $startTime >= $endTime) {
                    $validator->errors()->add('end_time', 'End time must be after start time');
                }
            }

            // Break time validation only applies to working days
            if ($startTime && $endTime) {
                if ($breakStart && !$breakEnd) {
                    $validator->errors()->add('break_end', 'Break end time is required when break start is provided');
                }
                if (!$breakStart && $breakEnd) {
                    $validator->errors()->add('break_start', 'Break start time is required when break end is provided');
                }
                
                // Validate break times are within working hours
                if ($breakStart && $breakEnd) {
                    if ($breakStart <= $startTime || $breakStart >= $endTime) {
                        $validator->errors()->add('break_start', 'Break start must be after work start and before work end');
                    }
                    if ($breakEnd <= $breakStart || $breakEnd >= $endTime) {
                        $validator->errors()->add('break_end', 'Break end must be after break start and before work end');
                    }
                }
            }
        });

        if ($validator->fails()) {
            Log::warning('WorkingHourController@update - Validation failed', [
                'working_hour_id' => $workingHour->id,
                'errors' => $validator->errors(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $originalData = $workingHour->toArray();

            // Update only provided fields
            $workingHour->update($request->only([
                'start_time', 'end_time', 'break_start', 'break_end'
            ]));

            // Reload with employee data
            $workingHour->load('employee:id,full_name');

            Log::info('WorkingHourController@update - Working hour updated successfully', [
                'working_hour_id' => $workingHour->id,
                'original_data' => $originalData,
                'updated_data' => $workingHour->fresh()->toArray(),
                'user_id' => auth()->id()
            ]);

            return response()->json($workingHour->fresh());

        } catch (\Exception $e) {
            Log::error('WorkingHourController@update - Failed to update working hour', [
                'working_hour_id' => $workingHour->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to update working hour',
                'error' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Remove the specified working hour from storage
     * 
     * @param WorkingHour $workingHour
     * @return JsonResponse
     */
    public function destroy(WorkingHour $workingHour): JsonResponse
    {
        Log::info('WorkingHourController@destroy - Attempting to delete working hour', [
            'working_hour_id' => $workingHour->id,
            'employee_id' => $workingHour->employee_id,
            'weekday' => $workingHour->weekday,
            'user_id' => auth()->id()
        ]);

        try {
            // Check for future reservations during this working hour
            $upcomingReservations = DB::table('reservations')
                ->where('employee_id', $workingHour->employee_id)
                ->where('start_at', '>', now())
                ->whereRaw('DAYOFWEEK(start_at) - 1 = ?', [$workingHour->weekday])
                ->where('status', '!=', 'CANCELLED')
                ->count();

            if ($upcomingReservations > 0) {
                Log::warning('WorkingHourController@destroy - Cannot delete working hour with upcoming reservations', [
                    'working_hour_id' => $workingHour->id,
                    'upcoming_reservations' => $upcomingReservations,
                    'user_id' => auth()->id()
                ]);

                return response()->json([
                    'message' => 'Cannot delete working hours with upcoming reservations',
                    'upcoming_reservations' => $upcomingReservations,
                    'weekday' => $this->getWeekdayName($workingHour->weekday)
                ], 422);
            }

            // Store working hour info for logging
            $deletedWorkingHourInfo = [
                'id' => $workingHour->id,
                'employee_id' => $workingHour->employee_id,
                'weekday' => $workingHour->weekday,
                'weekday_name' => $this->getWeekdayName($workingHour->weekday),
                'start_time' => $workingHour->start_time,
                'end_time' => $workingHour->end_time
            ];

            // Delete the working hour
            $workingHour->delete();

            Log::info('WorkingHourController@destroy - Working hour deleted successfully', [
                'deleted_working_hour' => $deletedWorkingHourInfo,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Working hour deleted successfully',
                'deleted_working_hour' => $deletedWorkingHourInfo
            ]);

        } catch (\Exception $e) {
            Log::error('WorkingHourController@destroy - Failed to delete working hour', [
                'working_hour_id' => $workingHour->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to delete working hour',
                'error' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Create or update working hours for an employee (bulk operation)
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function bulkStore(Request $request): JsonResponse
    {
        Log::info('WorkingHourController@bulkStore - Bulk creating/updating working hours', [
            'user_id' => auth()->id(),
            'request_data' => $request->all()
        ]);

        // Validate input data
        $validator = Validator::make($request->all(), [
            'employee_id' => 'required|exists:employees,id',
            'working_hours' => 'required|array|min:1',
            'working_hours.*.weekday' => 'required|integer|min:0|max:6',
            'working_hours.*.start_time' => 'nullable|date_format:H:i',
            'working_hours.*.end_time' => 'nullable|date_format:H:i',
            'working_hours.*.break_start' => 'nullable|date_format:H:i',
            'working_hours.*.break_end' => 'nullable|date_format:H:i'
        ]);

        // Custom validation for each working hour entry
        $validator->after(function ($validator) use ($request) {
            $workingHours = $request->get('working_hours', []);
            
            foreach ($workingHours as $index => $hours) {
                $startTime = $hours['start_time'] ?? null;
                $endTime = $hours['end_time'] ?? null;
                $breakStart = $hours['break_start'] ?? null;
                $breakEnd = $hours['break_end'] ?? null;
                
                // If either start_time or end_time is provided, both must be provided
                if (($startTime && !$endTime) || (!$startTime && $endTime)) {
                    $validator->errors()->add("working_hours.{$index}.working_times", 'Both start time and end time must be provided for working days');
                }
                
                // If both times are provided, end_time must be after start_time
                if ($startTime && $endTime && $startTime >= $endTime) {
                    $validator->errors()->add("working_hours.{$index}.end_time", 'End time must be after start time');
                }
                
                // Break time validation only applies to working days
                if ($startTime && $endTime) {
                    if ($breakStart && !$breakEnd) {
                        $validator->errors()->add("working_hours.{$index}.break_end", 'Break end time is required when break start is provided');
                    }
                    if (!$breakStart && $breakEnd) {
                        $validator->errors()->add("working_hours.{$index}.break_start", 'Break start time is required when break end is provided');
                    }
                    
                    // Validate break times are within working hours
                    if ($breakStart && $breakEnd) {
                        if ($breakStart <= $startTime || $breakStart >= $endTime) {
                            $validator->errors()->add("working_hours.{$index}.break_start", 'Break start must be after work start and before work end');
                        }
                        if ($breakEnd <= $breakStart || $breakEnd >= $endTime) {
                            $validator->errors()->add("working_hours.{$index}.break_end", 'Break end must be after break start and before work end');
                        }
                    }
                }
            }
        });

        if ($validator->fails()) {
            Log::warning('WorkingHourController@bulkStore - Validation failed', [
                'errors' => $validator->errors(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            DB::beginTransaction();

            $employeeId = $request->employee_id;
            $workingHoursData = $request->working_hours;
            
            // Delete existing working hours for this employee
            WorkingHour::where('employee_id', $employeeId)->delete();

            $createdWorkingHours = [];

            foreach ($workingHoursData as $hourData) {
                $workingHour = WorkingHour::create([
                    'employee_id' => $employeeId,
                    'weekday' => $hourData['weekday'],
                    'start_time' => $hourData['start_time'],
                    'end_time' => $hourData['end_time'],
                    'break_start' => $hourData['break_start'] ?? null,
                    'break_end' => $hourData['break_end'] ?? null
                ]);

                $createdWorkingHours[] = $workingHour;
            }

            DB::commit();

            Log::info('WorkingHourController@bulkStore - Working hours created/updated successfully', [
                'employee_id' => $employeeId,
                'created_count' => count($createdWorkingHours),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'message' => 'Working hours updated successfully',
                'employee_id' => $employeeId,
                'working_hours' => $createdWorkingHours
            ], 201);

        } catch (\Exception $e) {
            DB::rollBack();

            Log::error('WorkingHourController@bulkStore - Failed to create/update working hours', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'request_data' => $request->all(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to create/update working hours',
                'error' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Get working hours summary for an employee
     * 
     * @param Employee $employee
     * @return JsonResponse
     */
    public function employeeSummary(Employee $employee): JsonResponse
    {
        Log::info('WorkingHourController@employeeSummary - Fetching employee working hours summary', [
            'employee_id' => $employee->id,
            'user_id' => auth()->id()
        ]);

        try {
            $workingHours = WorkingHour::where('employee_id', $employee->id)
                                      ->orderBy('weekday')
                                      ->get();

            $summary = [
                'employee' => [
                    'id' => $employee->id,
                    'full_name' => $employee->full_name
                ],
                'total_weekdays' => $workingHours->count(),
                'total_weekly_hours' => $workingHours->sum(function ($hour) {
                    return $this->calculateWorkingHours($hour);
                }),
                'schedule' => $workingHours->map(function ($hour) {
                    return [
                        'id' => $hour->id,
                        'weekday' => $hour->weekday,
                        'weekday_name' => $this->getWeekdayName($hour->weekday),
                        'start_time' => $hour->start_time,
                        'end_time' => $hour->end_time,
                        'break_start' => $hour->break_start,
                        'break_end' => $hour->break_end,
                        'daily_hours' => $this->calculateWorkingHours($hour)
                    ];
                })
            ];

            Log::info('WorkingHourController@employeeSummary - Summary generated', [
                'employee_id' => $employee->id,
                'total_weekdays' => $summary['total_weekdays'],
                'total_weekly_hours' => $summary['total_weekly_hours']
            ]);

            return response()->json($summary);

        } catch (\Exception $e) {
            Log::error('WorkingHourController@employeeSummary - Failed to generate summary', [
                'employee_id' => $employee->id,
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'message' => 'Failed to generate working hours summary',
                'error' => 'Internal server error'
            ], 500);
        }
    }

    /**
     * Helper method to get weekday name
     * 
     * @param int $weekday
     * @return string
     */
    private function getWeekdayName(int $weekday): string
    {
        $weekdays = [
            0 => 'Sunday',
            1 => 'Monday',
            2 => 'Tuesday',
            3 => 'Wednesday',
            4 => 'Thursday',
            5 => 'Friday',
            6 => 'Saturday'
        ];

        return $weekdays[$weekday] ?? 'Unknown';
    }

    /**
     * Helper method to calculate working hours (excluding break)
     * 
     * @param WorkingHour $workingHour
     * @return float
     */
    private function calculateWorkingHours(WorkingHour $workingHour): float
    {
        $start = \Carbon\Carbon::createFromFormat('H:i', $workingHour->start_time);
        $end = \Carbon\Carbon::createFromFormat('H:i', $workingHour->end_time);
        
        $totalMinutes = $end->diffInMinutes($start);

        // Subtract break time if present
        if ($workingHour->break_start && $workingHour->break_end) {
            $breakStart = \Carbon\Carbon::createFromFormat('H:i', $workingHour->break_start);
            $breakEnd = \Carbon\Carbon::createFromFormat('H:i', $workingHour->break_end);
            $totalMinutes -= $breakEnd->diffInMinutes($breakStart);
        }

        return round($totalMinutes / 60, 2);
    }
} 