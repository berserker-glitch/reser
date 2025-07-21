<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Holiday;
use App\Models\HolidaySetting;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Carbon\Carbon;

class HolidayController extends Controller
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
            $query = Holiday::query();

            // Filter by type
            if ($request->has('type')) {
                $query->where('type', $request->type);
            }

            // No active status filter needed (all holidays are active)

            // If year is requested, convert to full dates for that year
            if ($request->has('year')) {
                $year = (int) $request->year;
                $holidays = $query->get();
                
                // Convert to full dates for the specified year
                $holidaysWithDates = $holidays->map(function ($holiday) use ($year) {
                    $holiday->date = $holiday->getDateForYear($year);
                    return $holiday;
                })->filter(function ($holiday) {
                    return $holiday->date !== null; // Filter out invalid dates
                });

                return response()->json([
                    'success' => true,
                    'data' => $holidaysWithDates->values()
                ]);
            }

            $holidays = $query->orderBy('month')->orderBy('day')->get();

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

        $validator = Validator::make($request->all(), [
            'name' => 'required|string|max:255',
            'month' => 'required|integer|min:1|max:12',
            'day' => 'required|integer|min:1|max:31',
            'type' => 'in:standard,custom'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Validate that the date exists
            $month = $request->month;
            $day = $request->day;
            
            if (!checkdate($month, $day, 2024)) { // Use 2024 (leap year) for validation
                return response()->json([
                    'success' => false,
                    'error' => 'Invalid date combination'
                ], 422);
            }

            $holiday = Holiday::create([
                'type' => $request->type ?? 'custom',
                'name' => $request->name,
                'month' => $month,
                'day' => $day
            ]);

            Log::info('Holiday created successfully', [
                'holiday_id' => $holiday->id,
                'name' => $holiday->name,
                'month' => $holiday->month,
                'day' => $holiday->day,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'data' => $holiday
            ], 201);

        } catch (\Exception $e) {
            Log::error('Failed to create holiday', [
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
     * Display the specified holiday (using composite key)
     */
    public function show(Request $request)
    {
        $holiday = Holiday::where('type', $request->type)
            ->where('month', $request->month)
            ->where('day', $request->day)
            ->first();

        if (!$holiday) {
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
     * Update the specified holiday (using composite key)
     */
    public function update(Request $request)
    {
        // Find holiday by composite key
        $oldType = $request->old_type ?? $request->type;
        $oldMonth = $request->old_month ?? $request->month;
        $oldDay = $request->old_day ?? $request->day;

        $holiday = Holiday::where('type', $oldType)
            ->where('month', $oldMonth)
            ->where('day', $oldDay)
            ->first();

        if (!$holiday) {
            return response()->json([
                'success' => false,
                'error' => 'Holiday not found'
            ], 404);
        }

        Log::info('Holiday update attempt', [
            'old_key' => [$oldType, $oldMonth, $oldDay],
            'user_id' => auth()->id(),
            'request_data' => $request->all()
        ]);

        $validator = Validator::make($request->all(), [
            'name' => 'string|max:255',
            'month' => 'integer|min:1|max:12',
            'day' => 'integer|min:1|max:31',
            'type' => 'in:standard,custom'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Delete old record and create new one (since primary key might change)
            $holiday->delete();
            
            $newHoliday = Holiday::create([
                'type' => $request->type ?? $oldType,
                'name' => $request->name ?? $holiday->name,
                'month' => $request->month ?? $oldMonth,
                'day' => $request->day ?? $oldDay
            ]);

            Log::info('Holiday updated successfully', [
                'old_key' => [$oldType, $oldMonth, $oldDay],
                'new_key' => [$newHoliday->type, $newHoliday->month, $newHoliday->day],
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'data' => $newHoliday
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to update holiday', [
                'old_key' => [$oldType, $oldMonth, $oldDay],
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
     * Remove the specified holiday (using composite key)
     */
    public function destroy(Request $request)
    {
        $holiday = Holiday::where('type', $request->type)
            ->where('month', $request->month)
            ->where('day', $request->day)
            ->first();

        if (!$holiday) {
            return response()->json([
                'success' => false,
                'error' => 'Holiday not found'
            ], 404);
        }

        Log::info('Holiday deletion attempt', [
            'holiday_key' => [$request->type, $request->month, $request->day],
            'user_id' => auth()->id()
        ]);

        try {
            $holiday->delete();

            Log::info('Holiday deleted successfully', [
                'holiday_key' => [$request->type, $request->month, $request->day],
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Holiday deleted successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to delete holiday', [
                'holiday_key' => [$request->type, $request->month, $request->day],
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
    public function getSettings()
    {
        try {
            $settings = HolidaySetting::first();
            
            if (!$settings) {
                // Create default settings
                $settings = HolidaySetting::create([
                    'holiday_system_type' => 'standard'
                ]);
            }

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
        $validator = Validator::make($request->all(), [
            'holiday_system_type' => 'required|in:standard,custom'
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $settings = HolidaySetting::first();
            
            if (!$settings) {
                $settings = HolidaySetting::create($request->only(['holiday_system_type']));
            } else {
                $settings->update($request->only(['holiday_system_type']));
            }

            return response()->json([
                'success' => true,
                'data' => $settings
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to update holiday settings', [
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

        try {
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
                $existing = Holiday::where('type', 'standard')
                    ->where('month', $holidayData['month'])
                    ->where('day', $holidayData['day'])
                    ->first();

                                 if ($existing) {
                     // Delete and recreate since we can't update primary key
                     $existing->delete();
                     Holiday::create([
                         'type' => 'standard',
                         'name' => $holidayData['name'],
                         'month' => $holidayData['month'],
                         'day' => $holidayData['day']
                     ]);
                     $updated++;
                 } else {
                     Holiday::create([
                         'type' => 'standard',
                         'name' => $holidayData['name'],
                         'month' => $holidayData['month'],
                         'day' => $holidayData['day']
                     ]);
                     $imported++;
                 }
            }

            Log::info('Moroccan holidays imported successfully', [
                'imported' => $imported,
                'updated' => $updated,
                'user_id' => auth()->id()
            ]);

            return response()->json([
                'success' => true,
                'data' => [
                    'imported' => $imported,
                    'updated' => $updated,
                    'total' => $imported + $updated
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to import Moroccan holidays', [
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
        $validator = Validator::make($request->all(), [
            'action' => 'required|in:delete',
            'holidays' => 'required|array|min:1',
            'holidays.*.type' => 'required|in:standard,custom',
            'holidays.*.month' => 'required|integer|min:1|max:12',
            'holidays.*.day' => 'required|integer|min:1|max:31'
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
                foreach ($request->holidays as $holidayData) {
                    $deleted = Holiday::where('type', $holidayData['type'])
                        ->where('month', $holidayData['month'])
                        ->where('day', $holidayData['day'])
                        ->delete();
                    $affected += $deleted;
                }
            }

            return response()->json([
                'success' => true,
                'data' => [
                    'action' => $request->action,
                    'affected' => $affected
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Bulk action failed', [
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
