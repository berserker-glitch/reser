<?php

namespace App\Rules;

use App\Models\Holiday;
use Carbon\Carbon;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Log;

class NotHoliday implements ValidationRule
{
    /**
     * Run the validation rule.
     *
     * @param  string  $attribute
     * @param  mixed  $value
     * @param  \Closure(string): \Illuminate\Translation\PotentiallyTranslatedString  $fail
     */
    public function validate(string $attribute, mixed $value, Closure $fail): void
    {
        try {
            // Parse the datetime value to get the date part
            $date = Carbon::parse($value)->format('Y-m-d');
            
            // Check if this date exists in the holidays table
            $isHoliday = Holiday::where('id', $date)->exists();
            
            if ($isHoliday) {
                // Get holiday name for better error message
                $holiday = Holiday::where('id', $date)->first();
                $holidayName = $holiday ? $holiday->name : 'public holiday';
                
                Log::warning('Reservation attempt blocked due to holiday', [
                    'date' => $date,
                    'holiday_name' => $holidayName,
                    'user_id' => auth()->id()
                ]);
                
                $fail("Reservations cannot be made on {$holidayName} ({$date}).");
            }
            
        } catch (\Exception $e) {
            Log::error('Holiday validation failed', [
                'attribute' => $attribute,
                'value' => $value,
                'error' => $e->getMessage()
            ]);
            
            // If we can't parse the date or check holidays, fail validation
            $fail('Invalid date format for holiday validation.');
        }
    }
} 