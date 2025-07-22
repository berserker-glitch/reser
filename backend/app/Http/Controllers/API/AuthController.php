<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Models\Salon;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;
use Tymon\JWTAuth\Facades\JWTAuth;
use Tymon\JWTAuth\Exceptions\JWTException;

class AuthController extends Controller
{
    /**
     * Create a new AuthController instance.
     */
    public function __construct()
    {
        // Note: We use route middleware instead of controller middleware
        // $this->middleware('auth:api', ['except' => ['login', 'register']]);
    }

    /**
     * Register a new user and return JWT token.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function register(Request $request)
    {
        Log::info('User registration attempt', ['email' => $request->email]);

        $validator = Validator::make($request->all(), [
            'full_name' => 'required|string|max:120',
            'email' => 'required|string|email|max:120|unique:users',
            'password' => 'required|string|min:8|confirmed',
            'phone' => 'nullable|string|max:40',
            'role' => 'nullable|in:OWNER,CLIENT',
            // Salon fields (required only for OWNER registration)
            'salon_name' => 'required_if:role,OWNER|string|max:120',
            'salon_description' => 'nullable|string',
            'salon_address' => 'nullable|string',
            'salon_phone' => 'nullable|string|max:40',
            'salon_email' => 'nullable|string|email|max:120',
        ]);

        if ($validator->fails()) {
            Log::warning('User registration validation failed', [
                'email' => $request->email,
                'errors' => $validator->errors()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            // Create user
            $user = User::create([
                'full_name' => $request->full_name,
                'email' => $request->email,
                'password' => Hash::make($request->password),
                'phone' => $request->phone,
                'role' => $request->role ?? 'CLIENT'
            ]);

            $salon = null;
            
            // Create salon if user is an OWNER
            if ($user->role === 'OWNER') {
                $salon = Salon::create([
                    'name' => $request->salon_name,
                    'description' => $request->salon_description,
                    'owner_id' => $user->id,
                    'address' => $request->salon_address,
                    'phone' => $request->salon_phone,
                    'email' => $request->salon_email,
                ]);

                Log::info('Salon created for owner', [
                    'salon_id' => $salon->id,
                    'salon_name' => $salon->name,
                    'owner_id' => $user->id,
                ]);
            }

            $token = JWTAuth::fromUser($user);

            Log::info('User registered successfully', [
                'user_id' => $user->id,
                'email' => $user->email,
                'role' => $user->role,
                'salon_id' => $salon ? $salon->id : null
            ]);

            $response = [
                'success' => true,
                'message' => 'User registered successfully',
                'user' => $user,
                'authorization' => [
                    'token' => $token,
                    'type' => 'bearer',
                    'expires_in' => auth()->factory()->getTTL() * 60
                ]
            ];

            // Add salon information for owners
            if ($salon) {
                $response['salon'] = $salon;
            }

            return response()->json($response, 201);

        } catch (\Exception $e) {
            Log::error('User registration failed', [
                'email' => $request->email,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Registration failed. Please try again.'
            ], 500);
        }
    }

    /**
     * Get a JWT via given credentials.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function login(Request $request)
    {
        Log::info('User login attempt', ['email' => $request->email]);

        $validator = Validator::make($request->all(), [
            'email' => 'required|string|email',
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $credentials = $request->only('email', 'password');
            
            if (!$token = auth()->attempt($credentials)) {
                Log::warning('Login failed - invalid credentials', [
                    'email' => $request->email,
                    'ip' => $request->ip()
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Invalid credentials'
                ], 401);
            }

            $user = auth()->user();
            
            Log::info('User logged in successfully', [
                'user_id' => $user->id,
                'email' => $user->email,
                'role' => $user->role
            ]);

            return $this->respondWithToken($token);

        } catch (JWTException $e) {
            Log::error('JWT creation failed during login', [
                'email' => $request->email,
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Could not create token'
            ], 500);
        }
    }

    /**
     * Change user password.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function changePassword(Request $request)
    {
        Log::info('Password change attempt', [
            'user_id' => auth()->id(),
            'email' => auth()->user()->email
        ]);

        $validator = Validator::make($request->all(), [
            'current_password' => 'required|string',
            'new_password' => 'required|string|min:8|confirmed',
        ]);

        if ($validator->fails()) {
            Log::warning('Password change validation failed', [
                'user_id' => auth()->id(),
                'errors' => $validator->errors()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = auth()->user();

            // Verify current password
            if (!Hash::check($request->current_password, $user->password)) {
                Log::warning('Password change failed - incorrect current password', [
                    'user_id' => $user->id,
                    'email' => $user->email
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Current password is incorrect'
                ], 422);
            }

            // Update password
            $user->password = Hash::make($request->new_password);
            $user->save();

            Log::info('Password changed successfully', [
                'user_id' => $user->id,
                'email' => $user->email
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Password changed successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Password change failed', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to change password. Please try again.'
            ], 500);
        }
    }

    /**
     * Verify user password.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function verifyPassword(Request $request)
    {
        Log::info('Password verification attempt', [
            'user_id' => auth()->id(),
            'email' => auth()->user()->email
        ]);

        $validator = Validator::make($request->all(), [
            'password' => 'required|string',
        ]);

        if ($validator->fails()) {
            Log::warning('Password verification validation failed', [
                'user_id' => auth()->id(),
                'errors' => $validator->errors()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = auth()->user();

            // Verify password
            if (!Hash::check($request->password, $user->password)) {
                Log::warning('Password verification failed - incorrect password', [
                    'user_id' => $user->id,
                    'email' => $user->email
                ]);

                return response()->json([
                    'success' => false,
                    'message' => 'Le mot de passe est incorrect'
                ], 422);
            }

            Log::info('Password verified successfully', [
                'user_id' => $user->id,
                'email' => $user->email
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Password verified successfully'
            ]);

        } catch (\Exception $e) {
            Log::error('Password verification failed', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to verify password. Please try again.'
            ], 500);
        }
    }

    /**
     * Update user profile information.
     *
     * @param Request $request
     * @return \Illuminate\Http\JsonResponse
     */
    public function updateProfile(Request $request)
    {
        Log::info('Profile update attempt', [
            'user_id' => auth()->id(),
            'email' => auth()->user()->email
        ]);

        $validator = Validator::make($request->all(), [
            'full_name' => 'sometimes|required|string|max:120',
            'phone' => 'nullable|string|max:40',
            'email' => 'sometimes|required|string|email|max:120|unique:users,email,' . auth()->id(),
        ]);

        if ($validator->fails()) {
            Log::warning('Profile update validation failed', [
                'user_id' => auth()->id(),
                'errors' => $validator->errors()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Validation failed',
                'errors' => $validator->errors()
            ], 422);
        }

        try {
            $user = auth()->user();
            
            // Update only provided fields
            if ($request->has('full_name')) {
                $user->full_name = $request->full_name;
            }
            
            if ($request->has('phone')) {
                $user->phone = $request->phone;
            }
            
            if ($request->has('email')) {
                $user->email = $request->email;
            }

            $user->save();

            Log::info('Profile updated successfully', [
                'user_id' => $user->id,
                'email' => $user->email,
                'updated_fields' => array_keys($request->only(['full_name', 'phone', 'email']))
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Profile updated successfully',
                'user' => $user
            ]);

        } catch (\Exception $e) {
            Log::error('Profile update failed', [
                'user_id' => auth()->id(),
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to update profile. Please try again.'
            ], 500);
        }
    }

    /**
     * Get the authenticated User.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function me()
    {
        try {
            $user = auth()->user();
            
            Log::info('User profile accessed', [
                'user_id' => $user->id,
                'email' => $user->email
            ]);

            return response()->json([
                'success' => true,
                'user' => $user
            ]);

        } catch (\Exception $e) {
            Log::error('Failed to get user profile', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Failed to get user profile'
            ], 500);
        }
    }

    /**
     * Log the user out (Invalidate the token).
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function logout()
    {
        try {
            $user = auth()->user();
            
            // Get the token from the request
            $token = JWTAuth::getToken();
            
            // Invalidate the token (add to blacklist)
            JWTAuth::invalidate($token);
            
            // Also logout the user from the guard
            auth()->logout();

            Log::info('User logged out successfully', [
                'user_id' => $user->id,
                'email' => $user->email
            ]);

            return response()->json([
                'success' => true,
                'message' => 'Successfully logged out'
            ]);

        } catch (\Exception $e) {
            Log::error('Logout failed', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Logout failed'
            ], 500);
        }
    }

    /**
     * Refresh a token.
     *
     * @return \Illuminate\Http\JsonResponse
     */
    public function refresh()
    {
        try {
            $user = auth()->user();
            $token = auth()->refresh();

            Log::info('Token refreshed successfully', [
                'user_id' => $user->id,
                'email' => $user->email
            ]);

            return $this->respondWithToken($token);

        } catch (JWTException $e) {
            Log::error('Token refresh failed', [
                'error' => $e->getMessage()
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Could not refresh token'
            ], 500);
        }
    }

    /**
     * Get the token array structure.
     *
     * @param string $token
     * @return \Illuminate\Http\JsonResponse
     */
    protected function respondWithToken($token)
    {
        $user = auth()->user();
        $response = [
            'success' => true,
            'user' => $user,
            'authorization' => [
                'token' => $token,
                'type' => 'bearer',
                'expires_in' => auth()->factory()->getTTL() * 60
            ]
        ];

        // Add salon information for owners
        if ($user->role === 'OWNER' && $user->salon) {
            $response['salon'] = $user->salon;
        }

        return response()->json($response);
    }
} 