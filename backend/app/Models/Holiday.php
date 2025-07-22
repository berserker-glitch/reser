<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Carbon\Carbon;

class Holiday extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'salon_id',
        'date',
        'name',
        'type',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'date' => 'date',
    ];

    /**
     * Holiday types
     */
    const TYPE_NATIONAL = 'NATIONAL';
    const TYPE_CUSTOM = 'CUSTOM';

    /**
     * Get the salon that owns the holiday.
     */
    public function salon()
    {
        return $this->belongsTo(Salon::class);
    }

    /**
     * Check if a specific date is a holiday for a salon
     */
    public static function isHoliday(int $salonId, string $date): bool
    {
        return static::where('salon_id', $salonId)
            ->where('date', Carbon::parse($date)->format('Y-m-d'))
            ->exists();
    }

    /**
     * Get holidays for a specific salon and year
     */
    public static function forSalonAndYear(int $salonId, int $year)
    {
        return static::where('salon_id', $salonId)
            ->whereYear('date', $year)
            ->orderBy('date');
    }

    /**
     * Get holidays by type for a salon
     */
    public static function bySalonAndType(int $salonId, string $type)
    {
        return static::where('salon_id', $salonId)
            ->where('type', $type);
    }

    /**
     * Get national holidays for a salon
     */
    public static function nationalForSalon(int $salonId)
    {
        return static::bySalonAndType($salonId, self::TYPE_NATIONAL);
    }

    /**
     * Get custom holidays for a salon
     */
    public static function customForSalon(int $salonId)
    {
        return static::bySalonAndType($salonId, self::TYPE_CUSTOM);
    }
}
