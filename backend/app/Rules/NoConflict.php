<?php

namespace App\Rules;

use App\Models\Reservation;
use Carbon\Carbon;
use Closure;
use Illuminate\Contracts\Validation\ValidationRule;
use Illuminate\Support\Facades\Log;

class NoConflict implements ValidationRule
{
    private int $employeeId;
    private int $duration;
    private ?int $excludeReservationId;
    
    /**
     * Create a new rule instance.
     *
     * @param int $employeeId
     * @param int $duration Service duration in minutes
     * @param int|null $excludeReservationId Exclude this reservation ID from conflict check (for updates)
     */
    public function __construct(int $employeeId, int $duration, ?int $excludeReservationId = null)
    {
        $this->employeeId = $employeeId;
        $this->duration = $duration;
        $this->excludeReservationId = $excludeReservationId;
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
            $startDateTime = Carbon::parse($value);
            $endDateTime = $startDateTime->copy()->addMinutes($this->duration);
            
            // Build query to check for conflicting reservations
            $query = Reservation::where('employee_id', $this->employeeId)
                ->where('status', '!=', 'CANCELLED') // Don't include cancelled reservations
                ->where(function ($q) use ($startDateTime, $endDateTime) {
                    // Check for any overlap:
                    // 1. New reservation starts during existing reservation
                    $q->whereBetween('start_at', [$startDateTime, $endDateTime])
                      // 2. New reservation ends during existing reservation
                      ->orWhereBetween('end_at', [$startDateTime, $endDateTime])
                      // 3. New reservation completely encompasses existing reservation
                      ->orWhere(function ($subQuery) use ($startDateTime, $endDateTime) {
                          $subQuery->where('start_at', '>=', $startDateTime)
                                   ->where('end_at', '<=', $endDateTime);
                      })
                      // 4. Existing reservation completely encompasses new reservation
                      ->orWhere(function ($subQuery) use ($startDateTime, $endDateTime) {
                          $subQuery->where('start_at', '<=', $startDateTime)
                                   ->where('end_at', '>=', $endDateTime);
                      });
                });
            
            // Exclude specific reservation if updating
            if ($this->excludeReservationId) {
                $query->where('id', '!=', $this->excludeReservationId);
            }
            
            $conflictingReservations = $query->with(['service', 'client'])->get();
            
            if ($conflictingReservations->isNotEmpty()) {
                // Get details of the first conflicting reservation for error message
                $conflict = $conflictingReservations->first();
                
                Log::warning('Reservation conflict detected', [
                    'employee_id' => $this->employeeId,
                    'requested_start' => $startDateTime->toISOString(),
                    'requested_end' => $endDateTime->toISOString(),
                    'conflicting_reservation_id' => $conflict->id,
                    'conflicting_start' => $conflict->start_at->toISOString(),
                    'conflicting_end' => $conflict->end_at->toISOString(),
                    'conflicting_service' => $conflict->service->name,
                    'exclude_reservation_id' => $this->excludeReservationId,
                    'user_id' => auth()->id()
                ]);
                
                $conflictTimeRange = $conflict->start_at->format('H:i') . ' - ' . $conflict->end_at->format('H:i');
                $conflictDate = $conflict->start_at->format('Y-m-d');
                
                $fail("Time slot conflicts with existing reservation on {$conflictDate} from {$conflictTimeRange} for {$conflict->service->name}.");
                return;
            }
            
            Log::debug('No conflicts found for reservation', [
                'employee_id' => $this->employeeId,
                'start_at' => $startDateTime->toISOString(),
                'end_at' => $endDateTime->toISOString(),
                'duration' => $this->duration,
                'exclude_reservation_id' => $this->excludeReservationId
            ]);
            
        } catch (\Exception $e) {
            Log::error('Conflict validation failed', [
                'employee_id' => $this->employeeId,
                'duration' => $this->duration,
                'exclude_reservation_id' => $this->excludeReservationId,
                'attribute' => $attribute,
                'value' => $value,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            $fail('Unable to validate reservation conflicts. Please try again.');
        }
    }
} 