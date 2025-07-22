<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\Salon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class BaseController extends Controller
{
    /**
     * Get salon ID for the current authenticated user context
     * 
     * @param Request $request
     * @return int|null
     */
    protected function getSalonId(Request $request): ?int
    {
        $user = Auth::user();
        
        if (!$user) {
            return null;
        }
        
        // If user is an OWNER, get their salon ID
        if ($user->role === 'OWNER') {
            $salon = $user->salon;
            return $salon ? $salon->id : null;
        }
        
        // If user is a CLIENT or EMPLOYEE, salon_id should be provided in request
        // For security, we'll validate that the salon exists
        if ($request->has('salon_id')) {
            $salonId = $request->input('salon_id');
            $salon = Salon::find($salonId);
            return $salon ? $salon->id : null;
        }
        
        return null;
    }
    
    /**
     * Validate that salon ID is accessible by current user
     * 
     * @param int $salonId
     * @return bool
     */
    protected function canAccessSalon(int $salonId): bool
    {
        $user = Auth::user();
        
        if (!$user) {
            return false;
        }
        
        // Owners can only access their own salon
        if ($user->role === 'OWNER') {
            $salon = $user->salon;
            return $salon && $salon->id === $salonId;
        }
        
        // Clients and employees can access any salon (for booking purposes)
        // In a more complex system, you might want to restrict this further
        return Salon::where('id', $salonId)->exists();
    }
    
    /**
     * Get salon or fail with error response
     * 
     * @param Request $request
     * @return array [salon_id, error_response]
     */
    protected function getSalonOrFail(Request $request): array
    {
        $salonId = $this->getSalonId($request);
        
        if (!$salonId) {
            return [null, response()->json([
                'success' => false,
                'message' => 'Salon ID is required'
            ], 400)];
        }
        
        if (!$this->canAccessSalon($salonId)) {
            return [null, response()->json([
                'success' => false,
                'message' => 'Access denied to this salon'
            ], 403)];
        }
        
        return [$salonId, null];
    }
} 