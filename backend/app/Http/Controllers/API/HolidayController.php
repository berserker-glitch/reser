<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\API\BaseController;
use App\Models\Holiday;
use App\Models\HolidaySetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class HolidayController extends BaseController
{
    /**
     * Display a listing of holidays
     */
    public function index(Request $request)
    {
        Log::info('Holidays list requested', [
            'user_id' => auth()->id(),
            'request_params' => $request->all()
        ]);

        try {
            // Get salon context and validate access
            [$salonId, $errorResponse] = $this->getSalonOrFail($request);
            if ($errorResponse) {
                return $errorResponse;
            }

            $query = Holiday::where('salon_id', $salonId);

            // Filter by type
            if ($request->has('type')) {
                $query->where('type', $request->type);
            }

            // If year is requested, filter by year
            if ($request->has('year')) {
                $year = (int) $request->year;
                $query->whereYear('date', $year);
            }

            $holidays = $query->orderBy('date')->get();

            Log::info('Holidays retrieved successfully', [
                'salon_id' => $salonId,
                'count' => $holidays->count(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'data' => $holidays
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to retrieve holidays', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Unable to retrieve holidays'
            ], 500);
        }
    }

    /**
     * Show the form for creating a new resource.
     */
    public function create()
    {
        //
    }

    /**
     * Store a newly created holiday
     */
    public function store(Request $request)
    {
        Log::info('Holiday creation attempt', [
            'user_id' => auth()->id(),
            'request_data' => $request->all()
        ]);

        // Get salon context and validate access
        [$salonId, $errorResponse] = $this->getSalonOrFail($request);
        if ($errorResponse) {
            return $errorResponse;
        }

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'month' => 'required|integer|min:1|max:12',
            'day' => 'required|integer|min:1|max:31',
            'type' => 'in:standard,custom,STANDARD,CUSTOM,NATIONAL'
        ]);

        if ($validator->fails()) {
            Log::warning('Holiday creation validation failed', [
                'user_id' => auth()->id(),
                'salon_id' => $salonId,
                'errors' => $validator->errors(),
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $month = $request->month;
            $day = $request->day;
            $year = now()->year; // Use current year for the holiday
            
            // Validate that the date exists
            if (!checkdate($month, $day, $year)) {
                return response()->json([
                    'success' => false,
                    'error' => 'Invalid date combination'
                ], 422);
            }
            
            $date = Carbon::create($year, $month, $day);
            
            // Check if holiday already exists for this salon and date
            $existing = Holiday::where('salon_id', $salonId)
                ->where('date', $date->format('Y-m-d'))
                ->first();
                
            if ($existing) {
                return response()->json([
                    'success' => false,
                    'error' => 'Holiday already exists for this date'
                ], 422);
            }

            // Normalize type to uppercase
            $type = strtoupper($request->type);
            if ($type === 'STANDARD') {
                $type = 'NATIONAL'; // Map standard to NATIONAL for consistency
            }

            $holiday = Holiday::create([
                'salon_id' => $salonId,
                'type' => $type,
                'name' => $request->name,
                'date' => $date
            ]);

            Log::info('Holiday created successfully', [
                'holiday_id' => $holiday->id,
                'salon_id' => $salonId,
                'name' => $holiday->name,
                'date' => $holiday->date,
                'type' => $holiday->type,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'data' => $holiday
            ], 201);

        } catch (\Exception $e) {
            Log::error('Failed to create holiday', [
                'salon_id' => $salonId,
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Unable to create holiday'
            ], 500);
        }
    }

    /**
     * Display the specified holiday
     */
    public function show(Request $request, Holiday $holiday)
    {
        // Get salon context and validate access
        [$salonId, $errorResponse] = $this->getSalonOrFail($request);
        if ($errorResponse) {
            return $errorResponse;
        }

        // Ensure holiday belongs to the salon
        if ($holiday->salon_id !== $salonId) {
            return response()->json([
                'success' => false,
                'error' => 'Holiday not found'
            ], 404);
        }

        return response()->json([
            'success' => true,
            'data' => $holiday
        ]);
    }

    /**
     * Show the form for editing the specified resource.
     */
    public function edit(string $id)
    {
        //
    }

    /**
     * Update the specified holiday
     */
    public function update(Request $request, Holiday $holiday)
    {
        // Get salon context and validate access
        [$salonId, $errorResponse] = $this->getSalonOrFail($request);
        if ($errorResponse) {
            return $errorResponse;
        }

        // Ensure holiday belongs to the salon
        if ($holiday->salon_id !== $salonId) {
            return response()->json([
                'success' => false,
                'error' => 'Holiday not found'
            ], 404);
        }

        Log::info('Holiday update attempt', [
            'holiday_id' => $holiday->id,
            'salon_id' => $salonId,
            'user_id' => auth()->id(),
            'request_data' => $request->all()
        ]);

        $validator = Validator::make($request->all(), [
            'name' => 'string|max:255',
            'date' => 'date',
            'type' => 'in:NATIONAL,CUSTOM'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $updateData = [];
            
            if ($request->has('name')) {
                $updateData['name'] = $request->name;
            }
            
            if ($request->has('date')) {
                $date = Carbon::parse($request->date);
                
                // Check if another holiday exists for this date (excluding current)
                $existing = Holiday::where('salon_id', $salonId)
                    ->where('date', $date->format('Y-m-d'))
                    ->where('id', '!=', $holiday->id)
                    ->first();
                    
                if ($existing) {
                    return response()->json([
                        'success' => false,
                        'error' => 'Another holiday already exists for this date'
                    ], 422);
                }
                
                $updateData['date'] = $date;
            }
            
            if ($request->has('type')) {
                $updateData['type'] = $request->type;
            }
            
            $holiday->update($updateData);

            Log::info('Holiday updated successfully', [
                'holiday_id' => $holiday->id,
                'salon_id' => $salonId,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'data' => $holiday->fresh()
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to update holiday', [
                'holiday_id' => $holiday->id,
                'salon_id' => $salonId,
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Unable to update holiday'
            ], 500);
        }
    }

    /**
     * Remove the specified holiday
     */
    public function destroy(Request $request, Holiday $holiday)
    {
        // Get salon context and validate access
        [$salonId, $errorResponse] = $this->getSalonOrFail($request);
        if ($errorResponse) {
            return $errorResponse;
        }

        // Ensure holiday belongs to the salon
        if ($holiday->salon_id !== $salonId) {
            return response()->json([
                'success' => false,
                'error' => 'Holiday not found'
            ], 404);
        }

        Log::info('Holiday deletion attempt', [
            'holiday_id' => $holiday->id,
            'salon_id' => $salonId,
            'user_id' => auth()->id()
        ]);

        try {
            $holiday->delete();

            Log::info('Holiday deleted successfully', [
                'holiday_id' => $holiday->id,
                'salon_id' => $salonId,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Holiday deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to delete holiday', [
                'holiday_id' => $holiday->id,
                'salon_id' => $salonId,
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Unable to delete holiday'
            ], 500);
        }
    }

    /**
     * Get holiday settings
     */
    public function getSettings(Request $request)
    {
        try {
            // Get salon context and validate access
            [$salonId, $errorResponse] = $this->getSalonOrFail($request);
            if ($errorResponse) {
                return $errorResponse;
            }

            $settings = HolidaySetting::current($salonId);

            Log::info('Holiday settings retrieved', [
                'salon_id' => $salonId,
                'user_id' => auth()->id(),
                'settings_id' => $settings->id
            ]);

            return response()->json([
                'success' => true,
                'data' => $settings
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get holiday settings', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Unable to retrieve settings'
            ], 500);
        }
    }

    /**
     * Update holiday settings
     */
    public function updateSettings(Request $request)
    {
        // Get salon context and validate access
        [$salonId, $errorResponse] = $this->getSalonOrFail($request);
        if ($errorResponse) {
            return $errorResponse;
        }

        $validator = Validator::make($request->all(), [
            'holiday_system_type' => 'required|in:standard,custom',
            'use_moroccan_holidays' => 'boolean',
            'auto_import_holidays' => 'boolean',
            'custom_holiday_rules' => 'nullable|array'
        ]);

        if ($validator->fails()) {
            Log::warning('Holiday settings validation failed', [
                'salon_id' => $salonId,
                'user_id' => auth()->id(),
                'errors' => $validator->errors()
            ]);

            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $updateData = $request->only([
                'holiday_system_type', 
                'use_moroccan_holidays', 
                'auto_import_holidays', 
                'custom_holiday_rules'
            ]);

            $settings = HolidaySetting::updateCurrent($salonId, $updateData);

            Log::info('Holiday settings updated successfully', [
                'salon_id' => $salonId,
                'user_id' => auth()->id(),
                'settings_id' => $settings->id,
                'updated_fields' => array_keys($updateData)
            ]);

            return response()->json([
                'success' => true,
                'data' => $settings
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to update holiday settings', [
                'salon_id' => $salonId,
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Unable to update settings'
            ], 500);
        }
    }

    /**
     * Import Moroccan holidays
     */
    public function importMoroccanHolidays(Request $request)
    {
        Log::info('Moroccan holidays import attempt', [
            'user_id' => auth()->id(),
            'year' => $request->year ?? 'current'
        ]);

        // Get salon context and validate access
        [$salonId, $errorResponse] = $this->getSalonOrFail($request);
        if ($errorResponse) {
            return $errorResponse;
        }

        try {
            $year = $request->year ?? now()->year;
            
            // Standard Moroccan holidays (recurring yearly)
            $moroccanHolidays = [
                ['name' => 'Jour de l\'An', 'month' => 1, 'day' => 1],
                ['name' => 'Fête du Travail', 'month' => 5, 'day' => 1],
                ['name' => 'Fête du Trône', 'month' => 7, 'day' => 30],
                ['name' => 'Révolution du Roi et du Peuple', 'month' => 8, 'day' => 20],
                ['name' => 'Fête de la Jeunesse', 'month' => 8, 'day' => 21],
                ['name' => 'Marche Verte', 'month' => 11, 'day' => 6],
                ['name' => 'Fête de l\'Indépendance', 'month' => 11, 'day' => 18],
            ];

            $imported = 0;
            $updated = 0;

            foreach ($moroccanHolidays as $holidayData) {
                $date = Carbon::create($year, $holidayData['month'], $holidayData['day']);
                
                $existing = Holiday::where('salon_id', $salonId)
                    ->where('date', $date->format('Y-m-d'))
                    ->first();

                if ($existing) {
                    // Update existing holiday
                    $existing->update([
                        'name' => $holidayData['name'],
                        'type' => 'NATIONAL'
                    ]);
                    $updated++;
                } else {
                    // Create new holiday
                    Holiday::create([
                        'salon_id' => $salonId,
                        'type' => 'NATIONAL',
                        'name' => $holidayData['name'],
                        'date' => $date
                    ]);
                    $imported++;
                }
            }

            Log::info('Moroccan holidays imported successfully', [
                'salon_id' => $salonId,
                'year' => $year,
                'imported' => $imported,
                'updated' => $updated,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'year' => $year,
                    'imported' => $imported,
                    'updated' => $updated,
                    'total' => $imported + $updated
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to import Moroccan holidays', [
                'salon_id' => $salonId,
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Unable to import holidays'
            ], 500);
        }
    }

    /**
     * Bulk action on holidays
     */
    public function bulkAction(Request $request)
    {
        // Get salon context and validate access
        [$salonId, $errorResponse] = $this->getSalonOrFail($request);
        if ($errorResponse) {
            return $errorResponse;
        }

        $validator = Validator::make($request->all(), [
            'action' => 'required|in:delete',
            'holiday_ids' => 'required|array|min:1',
            'holiday_ids.*' => 'integer|exists:holidays,id'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $affected = 0;

            if ($request->action === 'delete') {
                // Only delete holidays that belong to this salon
                $affected = Holiday::where('salon_id', $salonId)
                    ->whereIn('id', $request->holiday_ids)
                    ->delete();
            }

            Log::info('Bulk action completed successfully', [
                'salon_id' => $salonId,
                'action' => $request->action,
                'affected' => $affected,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'action' => $request->action,
                    'affected' => $affected
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Bulk action failed', [
                'salon_id' => $salonId,
                'action' => $request->action,
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => false,
                'error' => 'Bulk action failed'
            ], 500);
        }
    }
}
