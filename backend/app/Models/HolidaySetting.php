<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class HolidaySetting extends Model
{
    use HasFactory;

    /**
     * The attributes that are mass assignable.
     *
     * @var array<string>
     */
    protected $fillable = [
        'salon_id',
        'holiday_system_type',
        'use_moroccan_holidays',
        'auto_import_holidays',
        'custom_holiday_rules',
    ];

    /**
     * The attributes that should be cast.
     *
     * @var array<string, string>
     */
    protected $casts = [
        'use_moroccan_holidays' => 'boolean',
        'auto_import_holidays' => 'boolean',
        'custom_holiday_rules' => 'array',
    ];

    /**
     * Holiday system types
     */
    const SYSTEM_STANDARD = 'standard';
    const SYSTEM_CUSTOM = 'custom';

    /**
     * Get the salon that owns the holiday settings.
     */
    public function salon()
    {
        return $this->belongsTo(Salon::class);
    }

    /**
     * Get the current holiday settings for a specific salon (singleton pattern per salon)
     * 
     * @param int $salonId
     * @return HolidaySetting
     */
    public static function current(int $salonId)
    {
        return static::where('salon_id', $salonId)->first() ?: static::create([
            'salon_id' => $salonId,
            'holiday_system_type' => self::SYSTEM_STANDARD,
            'use_moroccan_holidays' => true,
            'auto_import_holidays' => true,
        ]);
    }

    /**
     * Update the current settings for a specific salon
     * 
     * @param int $salonId
     * @param array $attributes
     * @return HolidaySetting
     */
    public static function updateCurrent(int $salonId, array $attributes)
    {
        $settings = static::current($salonId);
        $settings->update($attributes);
        return $settings;
    }

    /**
     * Check if using standard (Moroccan) holidays
     */
    public function isUsingStandardHolidays(): bool
    {
        return $this->holiday_system_type === self::SYSTEM_STANDARD && $this->use_moroccan_holidays;
    }

    /**
     * Check if using custom holidays
     */
    public function isUsingCustomHolidays(): bool
    {
        return $this->holiday_system_type === self::SYSTEM_CUSTOM;
    }

    /**
     * Check if auto-import is enabled
     */
    public function shouldAutoImport(): bool
    {
        return $this->auto_import_holidays && $this->isUsingStandardHolidays();
    }

    /**
     * Get all settings by salon for admin overview
     * 
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function getAllBySalon()
    {
        return static::with('salon')->get();
    }

    /**
     * Get settings for multiple salons
     * 
     * @param array $salonIds
     * @return \Illuminate\Database\Eloquent\Collection
     */
    public static function forSalons(array $salonIds)
    {
        return static::whereIn('salon_id', $salonIds)->with('salon')->get();
    }
}
