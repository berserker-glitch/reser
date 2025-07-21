<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Holiday extends Model
{
    use HasFactory;

    /**
     * Disable timestamps since we don't have created_at/updated_at columns
     */
    public $timestamps = false;

    /**
     * Disable auto-incrementing since we use composite primary key
     */
    public $incrementing = false;

    /**
     * Set the primary key to be composite
     */
    protected $primaryKey = ['type', 'month', 'day'];

    /**
     * The primary key is not a single column
     */
    protected $keyType = 'array';

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'type',
        'name',
        'month',
        'day',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'month' => 'integer',
        'day' => 'integer',
    ];

    /**
     * Holiday types
     */
    const TYPE_STANDARD = 'standard';
    const TYPE_CUSTOM = 'custom';

    /**
     * Get all holidays (no is_active filter needed)
     */
    public static function active()
    {
        return static::query();
    }

    /**
     * Get holidays by type
     */
    public static function byType(string $type)
    {
        return static::where('type', $type);
    }

    /**
     * Check if a specific date is a holiday
     */
    public static function isHoliday(string $date): bool
    {
        $carbon = Carbon::parse($date);
        return static::where('month', $carbon->month)
            ->where('day', $carbon->day)
            ->exists();
    }

    /**
     * Get holidays for a specific month
     */
    public static function forMonth(int $month)
    {
        return static::where('month', $month);
    }

    /**
     * Get holidays that occur in a specific year (converting month/day to full dates)
     */
    public static function forYear(int $year)
    {
        return static::all()->map(function ($holiday) use ($year) {
            try {
                $date = Carbon::create($year, $holiday->month, $holiday->day);
                $holiday->date = $date->format('Y-m-d');
                return $holiday;
            } catch (\Exception $e) {
                // Handle invalid dates like Feb 29 in non-leap years
                return null;
            }
        })->filter();
    }

    /**
     * Get all holidays as date strings for a specific year
     */
    public static function getDatesForYear(int $year): array
    {
        return static::forYear($year)->pluck('date')->toArray();
    }

    /**
     * Get holidays between two dates
     */
    public static function between(string $startDate, string $endDate)
    {
        $start = Carbon::parse($startDate);
        $end = Carbon::parse($endDate);
        
        $holidays = collect();
        
        // Handle single year
        if ($start->year === $end->year) {
            $yearHolidays = static::forYear($start->year);
            $holidays = $yearHolidays->filter(function ($holiday) use ($start, $end) {
                $holidayDate = Carbon::parse($holiday->date);
                return $holidayDate->between($start, $end);
            });
        } else {
            // Handle multiple years
            for ($year = $start->year; $year <= $end->year; $year++) {
                $yearHolidays = static::forYear($year);
                $filteredHolidays = $yearHolidays->filter(function ($holiday) use ($start, $end) {
                    $holidayDate = Carbon::parse($holiday->date);
                    return $holidayDate->between($start, $end);
                });
                $holidays = $holidays->merge($filteredHolidays);
            }
        }
        
        return $holidays->sortBy('date');
    }

    /**
     * Create a formatted display date for the current year
     */
    public function getFormattedDateAttribute(): string
    {
        try {
            $date = Carbon::create(now()->year, $this->month, $this->day);
            return $date->format('d/m');
        } catch (\Exception $e) {
            return sprintf('%02d/%02d', $this->day, $this->month);
        }
    }

    /**
     * Get date for a specific year
     */
    public function getDateForYear(int $year): ?string
    {
        try {
            $date = Carbon::create($year, $this->month, $this->day);
            return $date->format('Y-m-d');
        } catch (\Exception $e) {
            return null;
        }
    }

    /**
     * Override the find method to work with composite keys
     */
    public static function find($keys)
    {
        if (is_array($keys) && count($keys) === 3) {
            return static::where('type', $keys[0])
                ->where('month', $keys[1])
                ->where('day', $keys[2])
                ->first();
        }
        return null;
    }

    /**
     * Override delete to work with composite keys
     */
    public function delete()
    {
        return static::where('type', $this->type)
            ->where('month', $this->month)
            ->where('day', $this->day)
            ->delete();
    }
}
