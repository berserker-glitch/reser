<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\Holiday;
use App\Models\Reservation;
use App\Models\Service;
use App\Models\WorkingHour;
use Carbon\Carbon;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Log;

class AvailabilityService
{
    /**
     * Get available time slots for a service on a specific date
     *
     * @param int $serviceId
     * @param int|null $employeeId
     * @param string|null $date
     * @return Collection
     */
    public function getAvailableSlots(int $serviceId, ?int $employeeId = null, ?string $date = null): Collection
    {
        // Start logging availability calculation
        Log::info('Availability calculation started', [
            'service_id' => $serviceId,
            'employee_id' => $employeeId,
            'date' => $date
        ]);

        $service = Service::findOrFail($serviceId);
        $date = $date ? Carbon::parse($date) : Carbon::today();
        
        // Check if date is in the past (except today)
        if ($date->isPast() && !$date->isToday()) {
            Log::warning('Date is in the past, no slots available', [
                'date' => $date->format('Y-m-d')
            ]);
            return collect([]);
        }
        
        // Check if date is a holiday
        if (Holiday::where('id', $date->format('Y-m-d'))->exists()) {
            Log::info('Date is a holiday, no slots available', [
                'date' => $date->format('Y-m-d')
            ]);
            return collect([]);
        }
        
        // Get employees for this service
        $employees = $employeeId 
            ? Employee::where('id', $employeeId)->with('services')->get()
            : Employee::whereHas('services', fn($q) => $q->where('service_id', $serviceId))->get();
            
        if ($employees->isEmpty()) {
            Log::warning('No employees available for service', [
                'service_id' => $serviceId,
                'employee_id' => $employeeId
            ]);
            return collect([]);
        }
        
        $allSlots = collect([]);
        
        // Get slots for each employee
        foreach ($employees as $employee) {
            $employeeSlots = $this->getEmployeeSlots($employee, $service, $date);
            $allSlots = $allSlots->merge($employeeSlots);
        }
        
        // Remove duplicates and sort
        $finalSlots = $allSlots->unique()->sort()->values();
        
        Log::info('Availability calculation completed', [
            'service_id' => $serviceId,
            'employee_id' => $employeeId,
            'date' => $date->format('Y-m-d'),
            'slots_count' => $finalSlots->count(),
            'employees_checked' => $employees->count()
        ]);
        
        return $finalSlots;
    }

    /**
     * Get available slots for a specific employee on a specific date
     *
     * @param Employee $employee
     * @param Service $service
     * @param Carbon $date
     * @return Collection
     */
    private function getEmployeeSlots(Employee $employee, Service $service, Carbon $date): Collection
    {
        $weekday = $date->dayOfWeek; // 0 = Sunday, 6 = Saturday
        
        // Get global working hours for this weekday (no longer employee-specific)
        $workingHour = WorkingHour::where('weekday', $weekday)->first();
            
        if (!$workingHour || !$workingHour->start_time || !$workingHour->end_time) {
            Log::debug('No working hours or non-working day', [
                'employee_id' => $employee->id,
                'weekday' => $weekday,
                'date' => $date->format('Y-m-d'),
                'has_record' => !!$workingHour,
                'start_time' => $workingHour->start_time ?? null,
                'end_time' => $workingHour->end_time ?? null
            ]);
            return collect([]);
        }
        
        // Generate time slots
        $slots = collect([]);
        $startTime = Carbon::createFromFormat('H:i:s', $workingHour->start_time);
        $endTime = Carbon::createFromFormat('H:i:s', $workingHour->end_time);
        $serviceDuration = $service->duration_min;
        
        // Create slot intervals (30-minute intervals)
        $currentSlot = $startTime->copy();
        
        while ($currentSlot->copy()->addMinutes($serviceDuration)->lte($endTime)) {
            $slotDateTime = $date->copy()->setTimeFrom($currentSlot);
            
            // Skip if slot is in the past (for today)
            if ($slotDateTime->isPast()) {
                $currentSlot->addMinutes(30);
                continue;
            }
            
            // Skip if in break time
            if ($this->isInBreakTime($workingHour, $currentSlot)) {
                $currentSlot->addMinutes(30);
                continue;
            }
            
            // Check if slot is available (no existing reservations)
            if ($this->isSlotAvailable($employee->id, $slotDateTime, $serviceDuration)) {
                $slots->push($slotDateTime->toISOString());
            }
            
            $currentSlot->addMinutes(30); // 30-minute intervals
        }
        
        Log::debug('Employee slots calculated', [
            'employee_id' => $employee->id,
            'employee_name' => $employee->full_name,
            'date' => $date->format('Y-m-d'),
            'slots_count' => $slots->count()
        ]);
        
        return $slots;
    }

    /**
     * Check if a time slot is within break time
     *
     * @param WorkingHour $workingHour
     * @param Carbon $time
     * @return bool
     */
    private function isInBreakTime(WorkingHour $workingHour, Carbon $time): bool
    {
        if (!$workingHour->break_start || !$workingHour->break_end) {
            return false;
        }
        
        $breakStart = Carbon::createFromFormat('H:i:s', $workingHour->break_start);
        $breakEnd = Carbon::createFromFormat('H:i:s', $workingHour->break_end);
        
        return $time->between($breakStart, $breakEnd);
    }

    /**
     * Check if a time slot is available (no conflicting reservations)
     *
     * @param int $employeeId
     * @param Carbon $startDateTime
     * @param int $duration
     * @return bool
     */
    public function isSlotAvailable(int $employeeId, Carbon $startDateTime, int $duration): bool
    {
        $endDateTime = $startDateTime->copy()->addMinutes($duration);

        Log::debug('Checking availability', [
            'employee_id' => $employeeId,
            'start_at' => $startDateTime->toIso8601String(),
            'end_at' => $endDateTime->toIso8601String(),
            'duration_min' => $duration,
        ]);

        // Check for overlapping reservations
        $query = Reservation::where('employee_id', $employeeId)
            ->where('status', '!=', 'CANCELLED')
            ->where(function ($query) use ($startDateTime, $endDateTime) {
                $query->where('start_at', '<', $endDateTime)
                      ->where('end_at', '>', $startDateTime);
            });

        $conflictingReservations = $query->exists();

        Log::debug('Conflict check result', [
            'sql' => $query->toSql(),
            'bindings' => $query->getBindings(),
            'conflict_found' => $conflictingReservations,
        ]);

        return !$conflictingReservations;
    }

    /**
     * Find the best available employee for a service at a specific time
     *
     * @param int $serviceId
     * @param Carbon $startDateTime
     * @param int $duration
     * @return int|null
     */
    public function findAvailableEmployee(int $serviceId, Carbon $startDateTime, int $duration): ?int
    {
        $employees = Employee::whereHas('services', fn($q) => $q->where('service_id', $serviceId))->get();
        
        foreach ($employees as $employee) {
            if ($this->isSlotAvailable($employee->id, $startDateTime, $duration)) {
                $weekday = $startDateTime->dayOfWeek;
                
                // Check if employee is working at this time
                $workingHour = WorkingHour::where('employee_id', $employee->id)
                    ->where('weekday', $weekday)
                    ->first();
                    
                if ($workingHour && $workingHour->start_time && $workingHour->end_time) {
                    $startTime = $startDateTime->format('H:i:s');
                    $endTime = $startDateTime->copy()->addMinutes($duration)->format('H:i:s');
                    
                    if ($startTime >= $workingHour->start_time && $endTime <= $workingHour->end_time) {
                        // Check if not in break time
                        if (!$this->isInBreakTime($workingHour, $startDateTime)) {
                            Log::info('Available employee found', [
                                'employee_id' => $employee->id,
                                'employee_name' => $employee->full_name,
                                'service_id' => $serviceId,
                                'start_at' => $startDateTime->toISOString()
                            ]);
                            return $employee->id;
                        }
                    }
                }
            }
        }
        
        Log::warning('No available employee found', [
            'service_id' => $serviceId,
            'start_at' => $startDateTime->toISOString(),
            'duration' => $duration
        ]);
        
        return null;
    }

    /**
     * Get the nearest available time slot for a service
     *
     * @param int $serviceId
     * @param int|null $employeeId
     * @param Carbon|null $preferredDateTime
     * @return string|null
     */
    public function getNearestSlot(int $serviceId, ?int $employeeId = null, ?Carbon $preferredDateTime = null): ?string
    {
        $preferredDateTime = $preferredDateTime ?: Carbon::now();
        $searchDate = $preferredDateTime->copy()->startOfDay();
        
        // Search for available slots for the next 30 days
        for ($i = 0; $i < 30; $i++) {
            $availableSlots = $this->getAvailableSlots($serviceId, $employeeId, $searchDate->format('Y-m-d'));
            
            if ($availableSlots->isNotEmpty()) {
                $nearestSlot = $availableSlots->first();
                
                Log::info('Nearest slot found', [
                    'service_id' => $serviceId,
                    'employee_id' => $employeeId,
                    'nearest_slot' => $nearestSlot,
                    'days_ahead' => $i
                ]);
                
                return $nearestSlot;
            }
            
            $searchDate->addDay();
        }
        
        Log::warning('No available slots found in next 30 days', [
            'service_id' => $serviceId,
            'employee_id' => $employeeId
        ]);
        
        return null;
    }
} 