<?php

namespace App\Rules;

use App\Models\WorkingHour;
use Carbon\Carbon;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Log;

class WithinWorkingHours implements ValidationRule
{
    private int $employeeId;
    private int $duration;
    
    /**
     * Create a new rule instance.
     *
     * @param int $employeeId
     * @param int $duration Service duration in minutes
     */
    public function __construct(int $employeeId, int $duration)
    {
        $this->employeeId = $employeeId;
        $this->duration = $duration;
    }
    
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
            // Parse the datetime value
            $dateTime = Carbon::parse($value);
            $weekday = $dateTime->dayOfWeek; // 0 = Sunday, 6 = Saturday
            
            // Get working hours for this employee and weekday
            $workingHour = WorkingHour::where('employee_id', $this->employeeId)
                ->where('weekday', $weekday)
                ->first();
                
            if (!$workingHour) {
                Log::warning('No working hours found for employee', [
                    'employee_id' => $this->employeeId,
                    'weekday' => $weekday,
                    'date' => $dateTime->format('Y-m-d'),
                    'user_id' => auth()->id()
                ]);
                
                $fail('Employee does not work on this day of the week.');
                return;
            }
            
            // Get start and end times
            $startTime = $dateTime->format('H:i:s');
            $endTime = $dateTime->copy()->addMinutes($this->duration)->format('H:i:s');
            
            // Check if reservation starts and ends within working hours
            if ($startTime < $workingHour->start_time || $endTime > $workingHour->end_time) {
                Log::warning('Reservation outside working hours', [
                    'employee_id' => $this->employeeId,
                    'reservation_start' => $startTime,
                    'reservation_end' => $endTime,
                    'working_start' => $workingHour->start_time,
                    'working_end' => $workingHour->end_time,
                    'user_id' => auth()->id()
                ]);
                
                $fail("Reservation must be within working hours ({$workingHour->start_time} - {$workingHour->end_time}).");
                return;
            }
            
            // Check if reservation conflicts with break time
            if ($workingHour->break_start && $workingHour->break_end) {
                $breakStart = Carbon::createFromFormat('H:i:s', $workingHour->break_start);
                $breakEnd = Carbon::createFromFormat('H:i:s', $workingHour->break_end);
                $reservationStart = Carbon::createFromFormat('H:i:s', $startTime);
                $reservationEnd = Carbon::createFromFormat('H:i:s', $endTime);
                
                // Check if reservation overlaps with break time
                if (($reservationStart->between($breakStart, $breakEnd)) ||
                    ($reservationEnd->between($breakStart, $breakEnd)) ||
                    ($reservationStart->lte($breakStart) && $reservationEnd->gte($breakEnd))) {
                    
                    Log::warning('Reservation conflicts with break time', [
                        'employee_id' => $this->employeeId,
                        'reservation_start' => $startTime,
                        'reservation_end' => $endTime,
                        'break_start' => $workingHour->break_start,
                        'break_end' => $workingHour->break_end,
                        'user_id' => auth()->id()
                    ]);
                    
                    $fail("Reservation cannot be made during break time ({$workingHour->break_start} - {$workingHour->break_end}).");
                    return;
                }
            }
            
            Log::debug('Working hours validation passed', [
                'employee_id' => $this->employeeId,
                'reservation_start' => $startTime,
                'reservation_end' => $endTime,
                'working_hours' => [
                    'start' => $workingHour->start_time,
                    'end' => $workingHour->end_time,
                    'break_start' => $workingHour->break_start,
                    'break_end' => $workingHour->break_end,
                ]
            ]);
            
        } catch (\Exception $e) {
            Log::error('Working hours validation failed', [
                'employee_id' => $this->employeeId,
                'duration' => $this->duration,
                'attribute' => $attribute,
                'value' => $value,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            $fail('Unable to validate working hours. Please try again.');
        }
    }
} 