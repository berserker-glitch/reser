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
     * Get the current holiday settings (singleton pattern)
     */
    public static function current()
    {
        return static::first() ?: static::create([
            'holiday_system_type' => self::SYSTEM_STANDARD,
            'use_moroccan_holidays' => true,
            'auto_import_holidays' => true,
        ]);
    }

    /**
     * Update the current settings
     */
    public static function updateCurrent(array $attributes)
    {
        $settings = static::current();
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
}
