<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;

/**
 * Setting Model
 * 
 * Manages system-wide configuration settings.
 * Only one settings record should exist in the system.
 */
class Setting extends Model
{
    /**
     * The table associated with the model.
     * 
     * @var string
     */
    protected $table = 'settings';

    /**
     * The attributes that are mass assignable.
     * 
     * @var array<string>
     */
    protected $fillable = [
        'website_url',
        'holiday_mode',
        'theme',
        'salon_name',
        'salon_address',
        'salon_phone',
        'salon_email',
        'timezone',
    ];

    /**
     * The attributes that should be cast.
     * 
     * @var array<string, string>
     */
    protected $casts = [
        'holiday_mode' => 'string',
        'theme' => 'string',
    ];

    /**
     * Default values for settings
     * 
     * @var array<string, mixed>
     */
    protected $attributes = [
        'holiday_mode' => 'default',
        'theme' => 'light',
        'timezone' => 'Africa/Casablanca',
    ];

    /**
     * Cache key for settings
     */
    const CACHE_KEY = 'app_settings';

    /**
     * Cache duration (24 hours)
     */
    const CACHE_DURATION = 86400;

    /**
     * Get the current system settings
     * Uses caching for performance
     * 
     * @return Setting
     */
    public static function current(): Setting
    {
        return Cache::remember(self::CACHE_KEY, self::CACHE_DURATION, function () {
            $setting = self::first();
            
            if (!$setting) {
                // Create default settings if none exist
                $setting = self::create([
                    'holiday_mode' => 'default',
                    'theme' => 'light',
                    'timezone' => 'Africa/Casablanca',
                ]);
                
                Log::info('Created default system settings', [
                    'setting_id' => $setting->id
                ]);
            }
            
            return $setting;
        });
    }

    /**
     * Update system settings and clear cache
     * 
     * @param array $attributes
     * @return bool
     */
    public function updateSettings(array $attributes): bool
    {
        $updated = $this->update($attributes);
        
        if ($updated) {
            // Clear the cache when settings are updated
            Cache::forget(self::CACHE_KEY);
            
            Log::info('System settings updated', [
                'setting_id' => $this->id,
                'updated_fields' => array_keys($attributes)
            ]);
        }
        
        return $updated;
    }

    /**
     * Get website URL with validation
     * 
     * @return string|null
     */
    public function getWebsiteUrlAttribute($value): ?string
    {
        if (empty($value)) {
            return null;
        }
        
        // Ensure URL has protocol
        if (!str_starts_with($value, 'http://') && !str_starts_with($value, 'https://')) {
            return 'https://' . $value;
        }
        
        return $value;
    }

    /**
     * Check if using default holiday mode
     * 
     * @return bool
     */
    public function usesDefaultHolidays(): bool
    {
        return $this->holiday_mode === 'default';
    }

    /**
     * Check if using manual holiday mode
     * 
     * @return bool
     */
    public function usesManualHolidays(): bool
    {
        return $this->holiday_mode === 'manual';
    }

    /**
     * Check if dark theme is enabled
     * 
     * @return bool
     */
    public function isDarkTheme(): bool
    {
        return $this->theme === 'dark';
    }

    /**
     * Clear settings cache
     * 
     * @return void
     */
    public static function clearCache(): void
    {
        Cache::forget(self::CACHE_KEY);
    }
}
