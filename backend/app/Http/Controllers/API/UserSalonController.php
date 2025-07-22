<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\API\BaseController;
use App\Models\UserSalon;
use App\Models\Salon;
use Illuminate\Http\Request;
use Illuminate\Http\JsonResponse;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Tymon\JWTAuth\Facades\JWTAuth;

/**
 * UserSalonController
 * 
 * Handles authenticated user-salon operations:
 * - Associate user with salon
 * - Get user's salon-specific dashboard
 * - Manage user-salon relationships
 */
class UserSalonController extends BaseController
{
    // Removed constructor middleware - applied at route level instead

    /**
     * Associate authenticated user with a salon
     * 
     * @param int $salonId
     * @return JsonResponse
     */
    public function associateWithSalon(Request $request, int $salonId): JsonResponse
    {
        try {
            $user = Auth::user();
            
            if (!$user) {
                return response()->json([
                    'success' => false,
                    'message' => 'User not authenticated'
                ], 401);
            }
            
            Log::info('Associating user with salon', [
                'user_id' => $user->id,
                'salon_id' => $salonId,
            ]);

            // Verify salon exists
            $salon = Salon::find($salonId);
            if (!$salon) {
                return response()->json([
                    'success' => false,
                    'message' => 'Salon not found'
                ], 404);
            }

            // Associate user with salon (or update existing association)
            $userSalon = $user->associateWithSalon($salonId);

            // Update last visit
            $userSalon->updateLastVisit();

            Log::info('User associated with salon', [
                'user_id' => $user->id,
                'salon_id' => $salonId,
                'association_id' => $userSalon->id,
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Successfully associated with salon',
                'data' => [
                    'user_salon' => [
                        'id' => $userSalon->id,
                        'salon_id' => $userSalon->salon_id,
                        'registered_at' => $userSalon->registered_at,
                        'status' => $userSalon->status,
                    ]
                ]
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to associate user with salon', [
                'user_id' => $user->id ?? 'unknown',
                'salon_id' => $salonId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to associate with salon'
            ], 500);
        }
    }

    /**
     * Get user's salon-specific dashboard data
     * 
     * @param int $salonId
     * @return JsonResponse
     */
    public function dashboard(int $salonId): JsonResponse
    {
        try {
            $user = Auth::user();
            
            Log::info('📊 Fetching user salon dashboard', [
                'user_id' => $user->id,
                'salon_id' => $salonId,
            ]);

            // Verify user is associated with this salon
            if (!$user->isAssociatedWithSalon($salonId)) {
                return response()->json([
                    'success' => false,
                    'message' => 'You are not associated with this salon'
                ], 403);
            }

            // Get salon info
            $salon = Salon::with(['services', 'employees'])->find($salonId);
            if (!$salon) {
                return response()->json([
                    'success' => false,
                    'message' => 'Salon not found'
                ], 404);
            }

            // Get user's reservations for this salon
            $reservations = $user->reservations()
                ->where('salon_id', $salonId)
                ->with(['service', 'employee'])
                ->orderBy('start_at', 'desc')
                ->limit(10)
                ->get();

            // Get user-salon association info
            $userSalon = UserSalon::where('user_id', $user->id)
                ->where('salon_id', $salonId)
                ->first();

            // Update last visit
            if ($userSalon) {
                $userSalon->updateLastVisit();
            }

            $response = [
                'salon' => [
                    'id' => $salon->id,
                    'name' => $salon->name,
                    'slug' => $salon->slug,
                    'description' => $salon->description,
                    'address' => $salon->address,
                    'phone' => $salon->phone,
                    'email' => $salon->email,
                ],
                'user_info' => [
                    'registered_at' => $userSalon?->registered_at,
                    'last_visit' => $userSalon?->last_visit,
                    'total_reservations' => $reservations->count(),
                ],
                'recent_reservations' => $reservations->map(function ($reservation) {
                    return [
                        'id' => $reservation->id,
                        'start_at' => $reservation->start_at,
                        'end_at' => $reservation->end_at,
                        'status' => $reservation->status,
                        'service' => [
                            'id' => $reservation->service->id,
                            'name' => $reservation->service->name,
                            'duration_min' => $reservation->service->duration_min,
                            'price_dhs' => $reservation->service->price_dhs,
                        ],
                        'employee' => [
                            'id' => $reservation->employee->id,
                            'full_name' => $reservation->employee->full_name,
                        ],
                    ];
                }),
                'services' => $salon->services->map(function ($service) {
                    return [
                        'id' => $service->id,
                        'name' => $service->name,
                        'description' => $service->description,
                        'duration_min' => $service->duration_min,
                        'price_dhs' => $service->price_dhs,
                    ];
                }),
            ];

            Log::info('✅ Dashboard data retrieved', [
                'user_id' => $user->id,
                'salon_id' => $salonId,
                'reservations_count' => $reservations->count(),
            ]);

            return response()->json([
                'success' => true,
                'data' => $response
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Failed to fetch salon dashboard', [
                'user_id' => Auth::id(),
                'salon_id' => $salonId,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to load dashboard'
            ], 500);
        }
    }

    /**
     * Get all salons associated with the authenticated user
     * 
     * @return JsonResponse
     */
    public function getUserSalons(): JsonResponse
    {
        try {
            $user = Auth::user();
            
            Log::info('🏪 Fetching user salons', ['user_id' => $user->id]);

            $userSalons = $user->activeSalons()
                ->with(['userSalons' => function ($query) use ($user) {
                    $query->where('user_id', $user->id);
                }])
                ->get();

            $response = $userSalons->map(function ($salon) {
                $userSalon = $salon->userSalons->first();
                return [
                    'salon' => [
                        'id' => $salon->id,
                        'name' => $salon->name,
                        'slug' => $salon->slug,
                        'description' => $salon->description,
                        'address' => $salon->address,
                        'phone' => $salon->phone,
                    ],
                    'association' => [
                        'registered_at' => $userSalon?->registered_at,
                        'last_visit' => $userSalon?->last_visit,
                        'status' => $userSalon?->status,
                    ],
                ];
            });

            Log::info('✅ User salons retrieved', [
                'user_id' => $user->id,
                'salons_count' => $userSalons->count(),
            ]);

            return response()->json([
                'success' => true,
                'data' => $response
            ]);

        } catch (\Exception $e) {
            Log::error('❌ Failed to fetch user salons', [
                'user_id' => Auth::id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to load user salons'
            ], 500);
        }
    }
}
