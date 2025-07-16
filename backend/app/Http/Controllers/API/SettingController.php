<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Setting;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

/**
 * SettingController
 * 
 * Manages system-wide settings for the salon application.
 * Settings are treated as a singleton - only one settings record exists.
 */
class SettingController extends Controller
{
    /**
     * Display the current system settings.
     * 
     * @return JsonResponse
     */
    public function index(): JsonResponse
    {
        try {
            $settings = Setting::current();
            
            Log::info('Settings retrieved', [
                'user_id' => auth()->id(),
                'setting_id' => $settings->id
            ]);
            
            return response()->json([
                'success' => true,
                'data' => $settings
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to retrieve settings', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve settings'
            ], 500);
        }
    }

    /**
     * Store a newly created settings record.
     * Note: This creates initial settings if none exist.
     * 
     * @param Request $request
     * @return JsonResponse
     */
    public function store(Request $request): JsonResponse
    {
        try {
            // Check if settings already exist
            $existingSettings = Setting::first();
            if ($existingSettings) {
                return response()->json([
                    'success' => false,
                    'message' => 'Settings already exist. Use update instead.'
                ], 409);
            }
            
            $validated = $this->validateSettingsData($request);
            if ($validated instanceof JsonResponse) {
                return $validated; // Return validation errors
            }
            
            $settings = Setting::create($validated);
            
            Log::info('Settings created', [
                'user_id' => auth()->id(),
                'setting_id' => $settings->id,
                'data' => $validated
            ]);
            
            return response()->json([
                'success' => true,
                'data' => $settings,
                'message' => 'Settings created successfully'
            ], 201);
            
        } catch (\Exception $e) {
            Log::error('Failed to create settings', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to create settings'
            ], 500);
        }
    }

    /**
     * Display the specified settings record.
     * Since settings are singleton, this returns current settings.
     * 
     * @param string $id
     * @return JsonResponse
     */
    public function show(string $id): JsonResponse
    {
        try {
            $settings = Setting::current();
            
            return response()->json([
                'success' => true,
                'data' => $settings
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to show settings', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'requested_id' => $id
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to retrieve settings'
            ], 500);
        }
    }

    /**
     * Update the system settings.
     * 
     * @param Request $request
     * @param string $id
     * @return JsonResponse
     */
    public function update(Request $request, string $id = null): JsonResponse
    {
        try {
            $validated = $this->validateSettingsData($request, false);
            if ($validated instanceof JsonResponse) {
                return $validated; // Return validation errors
            }
            
            $settings = Setting::current();
            $updated = $settings->updateSettings($validated);
            
            if (!$updated) {
                return response()->json([
                    'success' => false,
                    'message' => 'Failed to update settings'
                ], 500);
            }
            
            // Refresh the model to get updated data
            $settings->refresh();
            
            Log::info('Settings updated successfully', [
                'user_id' => auth()->id(),
                'setting_id' => $settings->id,
                'updated_fields' => array_keys($validated)
            ]);
            
            return response()->json([
                'success' => true,
                'data' => $settings,
                'message' => 'Settings updated successfully'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to update settings', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id(),
                'request_data' => $request->all()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to update settings'
            ], 500);
        }
    }

    /**
     * Remove the specified settings record.
     * This resets settings to defaults.
     * 
     * @param string $id
     * @return JsonResponse
     */
    public function destroy(string $id): JsonResponse
    {
        try {
            $settings = Setting::current();
            
            // Instead of deleting, reset to defaults
            $defaultData = [
                'website_url' => null,
                'holiday_mode' => 'default',
                'theme' => 'light',
                'salon_name' => null,
                'salon_address' => null,
                'salon_phone' => null,
                'salon_email' => null,
                'timezone' => 'Africa/Casablanca',
            ];
            
            $settings->updateSettings($defaultData);
            
            Log::info('Settings reset to defaults', [
                'user_id' => auth()->id(),
                'setting_id' => $settings->id
            ]);
            
            return response()->json([
                'success' => true,
                'data' => $settings,
                'message' => 'Settings reset to defaults successfully'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to reset settings', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to reset settings'
            ], 500);
        }
    }

    /**
     * Clear settings cache.
     * 
     * @return JsonResponse
     */
    public function clearCache(): JsonResponse
    {
        try {
            Setting::clearCache();
            
            Log::info('Settings cache cleared', [
                'user_id' => auth()->id()
            ]);
            
            return response()->json([
                'success' => true,
                'message' => 'Settings cache cleared successfully'
            ]);
            
        } catch (\Exception $e) {
            Log::error('Failed to clear settings cache', [
                'error' => $e->getMessage(),
                'user_id' => auth()->id()
            ]);
            
            return response()->json([
                'success' => false,
                'message' => 'Failed to clear cache'
            ], 500);
        }
    }

    /**
     * Validate settings data from request.
     * 
     * @param Request $request
     * @param bool $requireAll Whether all fields are required
     * @return array|JsonResponse
     */
    private function validateSettingsData(Request $request, bool $requireAll = true)
    {
        $rules = [
            'website_url' => 'nullable|url|max:500',
            'holiday_mode' => ($requireAll ? 'required' : 'sometimes') . '|in:default,manual',
            'theme' => ($requireAll ? 'required' : 'sometimes') . '|in:light,dark',
            'salon_name' => 'nullable|string|max:120',
            'salon_address' => 'nullable|string|max:255',
            'salon_phone' => 'nullable|string|max:40',
            'salon_email' => 'nullable|email|max:120',
            'timezone' => ($requireAll ? 'required' : 'sometimes') . '|string|max:50',
        ];

        $messages = [
            'website_url.url' => 'Website URL must be a valid URL',
            'holiday_mode.in' => 'Holiday mode must be either "default" or "manual"',
            'theme.in' => 'Theme must be either "light" or "dark"',
            'salon_email.email' => 'Salon email must be a valid email address',
        ];

        $validator = Validator::make($request->all(), $rules, $messages);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        return $validator->validated();
    }
}
