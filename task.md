# Salon Reservation System MVP - Comprehensive Task Breakdown

## Project Overview

**Goal**: Build an MVP Salon Reservation System for single-location Moroccan hair salons

**Key Requirements**:
- Owners manage employees, working hours, services and reservations (CRUD)
- Clients register/login, pick services, select employee, choose nearest free slot  
- System automatically blocks Moroccan public holidays
- No pre-payments, email or SMS in MVP
- Stack: Laravel 10 (API-only) + MySQL 8 + React/TypeScript + Chakra UI

## Project Status: 🔴 Phase 0 - Not Started

---

## PHASE 0: PROJECT BOOTSTRAP 🏗️

**Status**: ⏳ Pending  
**Dependencies**: None  
**Estimated Time**: 4-6 hours

### Task 0.1: Initialize Git Repository & Linting
**Priority**: Critical  
**Estimated Time**: 1 hour

**Technical Requirements**:
- Initialize Git repository with proper .gitignore
- Set up ESLint/Prettier for frontend
- Set up Laravel Pint for backend
- Configure pre-commit hooks

**Acceptance Criteria**:
- [ ] Git repository initialized with comprehensive .gitignore
- [ ] ESLint configured for React/TypeScript with recommended rules
- [ ] Prettier configured with consistent formatting rules
- [ ] Laravel Pint configured for PSR-12 coding standards
- [ ] Pre-commit hooks prevent commits with linting errors

**Commands to Execute**:
```bash
git init
git add .
git commit -m "Initial commit"
```

### Task 0.2: Frontend Project Setup
**Priority**: Critical  
**Estimated Time**: 2 hours  
**Dependencies**: Task 0.1

**Technical Requirements**:
- Create Vite React TypeScript project
- Install and configure Chakra UI v3
- Install required dependencies
- Set up basic folder structure
- Configure TypeScript paths

**Acceptance Criteria**:
- [ ] Vite project created with React TypeScript template
- [ ] All required packages installed and configured
- [ ] Basic folder structure under `frontend/src/`:
  - [ ] `components/` directory
  - [ ] `pages/` directory  
  - [ ] `hooks/` directory
  - [ ] `services/` directory
  - [ ] `types/` directory
  - [ ] `store/` directory
- [ ] TypeScript paths configured for clean imports
- [ ] Development server runs without errors

**Required Packages**:
```json
{
  "@chakra-ui/react": "^3.x",
  "@chakra-ui/icons": "^3.x", 
  "@emotion/react": "^11.x",
  "@emotion/styled": "^11.x",
  "framer-motion": "^11.x",
  "react-hook-form": "^7.x",
  "yup": "^1.x",
  "@tanstack/react-query": "^5.x",
  "axios": "^1.x",
  "zustand": "^4.x",
  "date-fns": "^3.x",
  "react-router-dom": "^6.x"
}
```

**Commands to Execute**:
```bash
pnpm create vite@latest frontend --template react-ts
cd frontend
pnpm i @chakra-ui/react @chakra-ui/icons @emotion/react @emotion/styled framer-motion react-hook-form yup @tanstack/react-query axios zustand date-fns react-router-dom
```

### Task 0.3: Backend Project Setup  
**Priority**: Critical  
**Estimated Time**: 2 hours  
**Dependencies**: Task 0.1

**Technical Requirements**:
- Create Laravel 10 project
- Install JWT auth and required packages
- Configure environment variables
- Set up basic API structure
- Configure CORS

**Acceptance Criteria**:
- [ ] Laravel 10 project created under `backend/` directory
- [ ] Required Composer packages installed
- [ ] `.env` file configured with database settings
- [ ] CORS configured for frontend communication
- [ ] Basic API route structure set up
- [ ] Application runs without errors

**Required Packages**:
```json
{
  "tymon/jwt-auth": "^2.0",
  "spatie/laravel-schedule-monitor": "^3.x",
  "laravel/ide-helper": "^2.x"
}
```

**Commands to Execute**:
```bash
composer create-project laravel/laravel backend
cd backend
composer require tymon/jwt-auth spatie/laravel-schedule-monitor laravel/ide-helper
```

### Task 0.4: Development Environment Configuration
**Priority**: High  
**Estimated Time**: 1 hour  
**Dependencies**: Tasks 0.2, 0.3

**Technical Requirements**:
- Configure MySQL 8 database
- Set up environment variables
- Configure API base URLs
- Test frontend-backend communication

**Acceptance Criteria**:
- [ ] MySQL 8 database created and accessible
- [ ] Backend `.env` configured with correct database credentials
- [ ] Frontend environment variables configured for API communication
- [ ] CORS properly configured and tested
- [ ] Basic API health check endpoint working
- [ ] Frontend can successfully call backend API

---

## PHASE 1: DATABASE SCHEMA & ELOQUENT MODELS 🗄️

**Status**: ⏳ Pending  
**Dependencies**: Phase 0 complete  
**Estimated Time**: 6-8 hours

### Task 1.1: Database Migration Creation
**Priority**: Critical  
**Estimated Time**: 3 hours

**Technical Requirements**:
- Create migrations for all database tables
- Set up proper foreign key constraints
- Include indexes for performance
- Add proper data types and constraints

**Database Schema**:

**Users Table**:
```sql
CREATE TABLE users (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role          ENUM('OWNER','CLIENT') NOT NULL DEFAULT 'CLIENT',
  full_name     VARCHAR(120)           NOT NULL,
  email         VARCHAR(120)           NOT NULL UNIQUE,
  phone         VARCHAR(40),
  password      VARCHAR(255)           NOT NULL,
  created_at    TIMESTAMP,
  updated_at    TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_role (role)
);
```

**Employees Table**:
```sql
CREATE TABLE employees (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  full_name   VARCHAR(120)   NOT NULL,
  phone       VARCHAR(40),
  note        TEXT,
  created_at  TIMESTAMP,
  updated_at  TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id)
);
```

**Services Table**:
```sql
CREATE TABLE services (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  description TEXT,
  duration_min SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  price_dhs    DECIMAL(8,2) NOT NULL,
  created_at  TIMESTAMP,
  updated_at  TIMESTAMP,
  INDEX idx_name (name),
  INDEX idx_duration (duration_min)
);
```

**Employee-Service Pivot Table**:
```sql
CREATE TABLE employee_service (
  employee_id BIGINT UNSIGNED NOT NULL,
  service_id  BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY(employee_id, service_id),
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE
);
```

**Working Hours Table**:
```sql
CREATE TABLE working_hours (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id  BIGINT UNSIGNED NOT NULL,
  weekday      TINYINT UNSIGNED NOT NULL,
  start_time   TIME          NOT NULL,
  end_time     TIME          NOT NULL,
  break_start  TIME          NULL,
  break_end    TIME          NULL,
  created_at   TIMESTAMP,
  updated_at   TIMESTAMP,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  INDEX idx_employee_weekday (employee_id, weekday),
  CHECK (weekday >= 0 AND weekday <= 6),
  CHECK (start_time < end_time),
  CHECK (break_start IS NULL OR break_end IS NOT NULL),
  CHECK (break_start IS NULL OR (break_start > start_time AND break_end < end_time))
);
```

**Reservations Table**:
```sql
CREATE TABLE reservations (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  client_id     BIGINT UNSIGNED NOT NULL,
  employee_id   BIGINT UNSIGNED NOT NULL,
  service_id    BIGINT UNSIGNED NOT NULL,
  start_at      DATETIME      NOT NULL,
  end_at        DATETIME      NOT NULL,
  status        ENUM('REQUESTED','CONFIRMED','CANCELLED','COMPLETED') DEFAULT 'CONFIRMED',
  created_at    TIMESTAMP,
  updated_at    TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (employee_id) REFERENCES employees(id) ON DELETE CASCADE,
  FOREIGN KEY (service_id) REFERENCES services(id) ON DELETE CASCADE,
  INDEX idx_client_id (client_id),
  INDEX idx_employee_start (employee_id, start_at),
  INDEX idx_status (status),
  CHECK (start_at < end_at)
);
```

**Holidays Table**:
```sql
CREATE TABLE holidays (
  id        DATE PRIMARY KEY,
  name      VARCHAR(180) NOT NULL
);
```

**Acceptance Criteria**:
- [ ] All migration files created with proper schema
- [ ] Foreign key constraints properly defined
- [ ] Indexes added for query optimization
- [ ] Data validation constraints in place
- [ ] Migrations run successfully without errors
- [ ] Database schema matches specifications exactly

### Task 1.2: Eloquent Model Creation
**Priority**: Critical  
**Estimated Time**: 3 hours  
**Dependencies**: Task 1.1

**Technical Requirements**:
- Create Eloquent models for all tables
- Define relationships between models
- Set up fillable properties
- Add model validation rules
- Implement HasManyThrough relationships

**Models to Create**:

**User Model**:
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Tymon\JWTAuth\Contracts\JWTSubject;

class User extends Authenticatable implements JWTSubject
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'role', 'full_name', 'email', 'phone', 'password'
    ];

    protected $hidden = [
        'password', 'remember_token',
    ];

    // JWT methods
    public function getJWTIdentifier() { return $this->getKey(); }
    public function getJWTCustomClaims() { return []; }

    // Relationships
    public function employee() { return $this->hasOne(Employee::class); }
    public function reservations() { return $this->hasMany(Reservation::class, 'client_id'); }
}
```

**Employee Model**:
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Employee extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'full_name', 'phone', 'note'
    ];

    // Relationships
    public function user() { return $this->belongsTo(User::class); }
    public function services() { return $this->belongsToMany(Service::class); }
    public function workingHours() { return $this->hasMany(WorkingHour::class); }
    public function reservations() { return $this->hasMany(Reservation::class); }
}
```

**Service Model**:
```php
<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Service extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'description', 'duration_min', 'price_dhs'
    ];

    protected $casts = [
        'duration_min' => 'integer',
        'price_dhs' => 'decimal:2'
    ];

    // Relationships
    public function employees() { return $this->belongsToMany(Employee::class); }
    public function reservations() { return $this->hasMany(Reservation::class); }
}
```

**Acceptance Criteria**:
- [ ] All Eloquent models created with proper structure
- [ ] Relationships correctly defined and tested
- [ ] Fillable properties set appropriately
- [ ] Model validation rules implemented
- [ ] JWT implementation in User model working
- [ ] HasManyThrough relationships implemented where needed
- [ ] All model methods tested and functional

### Task 1.3: Database Seeders Creation
**Priority**: Medium  
**Estimated Time**: 2 hours  
**Dependencies**: Task 1.2

**Technical Requirements**:
- Create seeders for initial data
- Add sample data for development
- Create admin user seeder
- Add sample services seeder

**Acceptance Criteria**:
- [ ] DatabaseSeeder properly configured
- [ ] Admin user seeder creates owner account
- [ ] Sample services seeder adds common salon services
- [ ] Sample employees seeder for testing
- [ ] All seeders run without errors
- [ ] Seeded data is realistic and useful for development

---

## PHASE 2: JWT AUTH & ROUTE STRUCTURE 🔐

**Status**: ⏳ Pending  
**Dependencies**: Phase 1 complete  
**Estimated Time**: 8-10 hours

### Task 2.1: JWT Configuration & Setup
**Priority**: Critical  
**Estimated Time**: 2 hours

**Technical Requirements**:
- Publish JWT configuration
- Configure JWT guards
- Set up JWT middleware
- Configure token expiration

**Commands to Execute**:
```bash
php artisan vendor:publish --provider="Tymon\JWTAuth\Providers\LaravelServiceProvider"
php artisan jwt:secret
```

**Acceptance Criteria**:
- [ ] JWT configuration published and customized
- [ ] JWT secret generated and stored securely
- [ ] Auth guards configured in `config/auth.php`
- [ ] JWT middleware registered
- [ ] Token expiration settings configured
- [ ] Refresh token functionality working

### Task 2.2: Authentication Controller Implementation
**Priority**: Critical  
**Estimated Time**: 4 hours  
**Dependencies**: Task 2.1

**Technical Requirements**:
- Implement AuthController with register, login, logout
- Add proper validation rules
- Implement error handling
- Add logging for auth events

**Endpoints to Implement**:

**POST /api/auth/register**:
```php
public function register(Request $request)
{
    $validator = Validator::make($request->all(), [
        'full_name' => 'required|string|max:120',
        'email' => 'required|string|email|max:120|unique:users',
        'password' => 'required|string|min:8|confirmed',
        'phone' => 'nullable|string|max:40',
        'role' => 'nullable|in:OWNER,CLIENT'
    ]);

    if ($validator->fails()) {
        return response()->json($validator->errors(), 422);
    }

    $user = User::create([
        'full_name' => $request->full_name,
        'email' => $request->email,
        'password' => Hash::make($request->password),
        'phone' => $request->phone,
        'role' => $request->role ?? 'CLIENT'
    ]);

    $token = JWTAuth::fromUser($user);
    
    Log::info('User registered successfully', [
        'user_id' => $user->id,
        'email' => $user->email,
        'role' => $user->role
    ]);

    return response()->json([
        'message' => 'User registered successfully',
        'user' => $user,
        'token' => $token
    ], 201);
}
```

**POST /api/auth/login**:
```php
public function login(Request $request)
{
    $credentials = $request->only('email', 'password');
    
    Log::info('Login attempt', ['email' => $request->email]);

    if (!$token = JWTAuth::attempt($credentials)) {
        Log::warning('Login failed', ['email' => $request->email]);
        return response()->json(['error' => 'Invalid credentials'], 401);
    }

    $user = Auth::user();
    
    Log::info('Login successful', [
        'user_id' => $user->id,
        'email' => $user->email,
        'role' => $user->role
    ]);

    return response()->json([
        'message' => 'Login successful',
        'user' => $user,
        'token' => $token
    ]);
}
```

**POST /api/auth/logout**:
```php
public function logout()
{
    $user = Auth::user();
    
    JWTAuth::invalidate(JWTAuth::getToken());
    
    Log::info('User logged out', [
        'user_id' => $user->id,
        'email' => $user->email
    ]);

    return response()->json(['message' => 'Logout successful']);
}
```

**Acceptance Criteria**:
- [ ] Registration endpoint working with proper validation
- [ ] Login endpoint authenticates users and returns JWT
- [ ] Logout endpoint invalidates JWT tokens
- [ ] Password hashing implemented correctly
- [ ] All auth events logged appropriately
- [ ] Error responses follow consistent format
- [ ] Input validation comprehensive and secure

### Task 2.3: Protected Route Structure Setup
**Priority**: High  
**Estimated Time**: 2 hours  
**Dependencies**: Task 2.2

**Technical Requirements**:
- Set up route groups with auth middleware
- Implement role-based route protection
- Create resource controllers structure
- Add rate limiting

**Route Structure**:
```php
// Public routes
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
});

// Protected routes
Route::middleware('auth:api')->group(function () {
    // Auth routes
    Route::prefix('auth')->group(function () {
        Route::post('logout', [AuthController::class, 'logout']);
        Route::get('me', [AuthController::class, 'me']);
    });
    
    // Owner-only routes
    Route::middleware('role:OWNER')->group(function () {
        Route::apiResource('employees', EmployeeController::class);
        Route::apiResource('services', ServiceController::class);
        Route::apiResource('working-hours', WorkingHourController::class);
    });
    
    // Client and Owner routes
    Route::apiResource('reservations', ReservationController::class);
    Route::get('availability', [AvailabilityController::class, 'index']);
});
```

**Acceptance Criteria**:
- [ ] Route groups properly organized
- [ ] Auth middleware protecting routes
- [ ] Role-based middleware implemented
- [ ] Resource controllers structured
- [ ] Rate limiting configured
- [ ] API versioning considered

### Task 2.4: Middleware Implementation
**Priority**: High  
**Estimated Time**: 2 hours  
**Dependencies**: Task 2.3

**Technical Requirements**:
- Create role-based middleware
- Implement request logging middleware
- Add CORS middleware configuration
- Create API rate limiting

**Middleware to Implement**:

**Role Middleware**:
```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;

class RoleMiddleware
{
    public function handle(Request $request, Closure $next, string $role)
    {
        if (!auth()->check()) {
            return response()->json(['error' => 'Unauthorized'], 401);
        }

        if (auth()->user()->role !== $role) {
            return response()->json(['error' => 'Forbidden'], 403);
        }

        return $next($request);
    }
}
```

**Request Logging Middleware**:
```php
<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class RequestLogging
{
    public function handle(Request $request, Closure $next)
    {
        $requestId = Str::uuid()->toString();
        
        Log::withContext(['request_id' => $requestId]);
        
        Log::info('API Request', [
            'method' => $request->method(),
            'url' => $request->fullUrl(),
            'user_id' => auth()->id(),
            'ip' => $request->ip()
        ]);

        $response = $next($request);
        
        Log::info('API Response', [
            'status' => $response->getStatusCode(),
            'response_time' => microtime(true) - LARAVEL_START
        ]);

        return $response;
    }
}
```

**Acceptance Criteria**:
- [ ] Role middleware correctly restricts access
- [ ] Request logging captures all necessary data
- [ ] CORS middleware properly configured
- [ ] Rate limiting prevents abuse
- [ ] All middleware registered in Kernel
- [ ] Middleware tested with various scenarios

---

## PHASE 3: HOLIDAY IMPORT & AVAILABILITY ENGINE 📅

**Status**: ⏳ Pending  
**Dependencies**: Phase 2 complete  
**Estimated Time**: 6-8 hours

### Task 3.1: Holiday Import Command Creation
**Priority**: High  
**Estimated Time**: 3 hours

**Technical Requirements**:
- Create console command for importing Moroccan holidays
- Integrate with Nager.Date API
- Handle API failures gracefully
- Add comprehensive logging

**External API**: Nager.Date  
**URL**: `https://date.nager.at/api/v3/PublicHolidays/{YEAR}/MA`

**Command Implementation**:
```php
<?php

namespace App\Console\Commands;

use App\Models\Holiday;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ImportHolidays extends Command
{
    protected $signature = 'holidays:import {year?}';
    protected $description = 'Import Moroccan public holidays from Nager.Date API';

    public function handle()
    {
        $year = $this->argument('year') ?: now()->year;
        $url = "https://date.nager.at/api/v3/PublicHolidays/{$year}/MA";
        
        $this->info("Importing holidays for year {$year}...");
        
        try {
            $response = Http::timeout(30)->get($url);
            
            if (!$response->successful()) {
                throw new \Exception("API request failed with status: {$response->status()}");
            }
            
            $holidays = $response->json();
            $imported = 0;
            
            foreach ($holidays as $holiday) {
                Holiday::updateOrCreate(
                    ['id' => $holiday['date']],
                    ['name' => $holiday['localName'] ?? $holiday['name']]
                );
                $imported++;
            }
            
            $this->info("Successfully imported {$imported} holidays");
            
            Log::info('Holidays imported successfully', [
                'year' => $year,
                'count' => $imported,
                'source' => 'Nager.Date API'
            ]);
            
        } catch (\Exception $e) {
            $this->error("Failed to import holidays: " . $e->getMessage());
            
            Log::error('Holiday import failed', [
                'year' => $year,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            
            return 1;
        }
        
        return 0;
    }
}
```

**Acceptance Criteria**:
- [ ] Console command created and registered
- [ ] API integration working correctly
- [ ] Error handling for API failures
- [ ] Comprehensive logging implemented
- [ ] Command accepts year parameter
- [ ] Duplicate holidays handled properly
- [ ] Command testable and reliable

### Task 3.2: Schedule Configuration
**Priority**: Medium  
**Estimated Time**: 1 hour  
**Dependencies**: Task 3.1

**Technical Requirements**:
- Schedule holiday import command yearly
- Configure command monitoring
- Set up failure notifications

**Kernel Configuration**:
```php
protected function schedule(Schedule $schedule)
{
    $schedule->command('holidays:import')
        ->yearly()
        ->at('23:30')
        ->onOneServer()
        ->withoutOverlapping()
        ->onFailure(function () {
            Log::error('Scheduled holiday import failed');
        })
        ->onSuccess(function () {
            Log::info('Scheduled holiday import completed successfully');
        });
}
```

**Acceptance Criteria**:
- [ ] Command scheduled for yearly execution
- [ ] Schedule runs on December 31st at 23:30
- [ ] Overlap prevention configured
- [ ] Failure handling implemented
- [ ] Success logging configured
- [ ] Command monitoring set up

### Task 3.3: Availability Engine Implementation
**Priority**: Critical  
**Estimated Time**: 4 hours  
**Dependencies**: Task 3.1

**Technical Requirements**:
- Implement slot availability checking logic
- Handle working hours and breaks
- Check for holiday conflicts
- Optimize for performance

**Availability Algorithm**:
```php
<?php

namespace App\Services;

use App\Models\Employee;
use App\Models\Holiday;
use App\Models\Reservation;
use App\Models\Service;
use App\Models\WorkingHour;
use Carbon\Carbon;
use Illuminate\Support\Collection;

class AvailabilityService
{
    public function getAvailableSlots(int $serviceId, ?int $employeeId = null, string $date = null): Collection
    {
        $service = Service::findOrFail($serviceId);
        $date = $date ? Carbon::parse($date) : Carbon::today();
        
        // Check if date is a holiday
        if (Holiday::where('id', $date->format('Y-m-d'))->exists()) {
            Log::info('Date is a holiday, no slots available', ['date' => $date->format('Y-m-d')]);
            return collect([]);
        }
        
        // Get employees for this service
        $employees = $employeeId 
            ? Employee::where('id', $employeeId)->with('services')->get()
            : Employee::whereHas('services', fn($q) => $q->where('service_id', $serviceId))->get();
            
        $allSlots = collect([]);
        
        foreach ($employees as $employee) {
            $employeeSlots = $this->getEmployeeSlots($employee, $service, $date);
            $allSlots = $allSlots->merge($employeeSlots);
        }
        
        return $allSlots->unique()->sort()->values();
    }
    
    private function getEmployeeSlots(Employee $employee, Service $service, Carbon $date): Collection
    {
        $weekday = $date->dayOfWeek; // 0 = Sunday, 6 = Saturday
        
        // Get working hours for this weekday
        $workingHour = WorkingHour::where('employee_id', $employee->id)
            ->where('weekday', $weekday)
            ->first();
            
        if (!$workingHour) {
            return collect([]);
        }
        
        // Generate time slots
        $slots = collect([]);
        $startTime = Carbon::parse($workingHour->start_time);
        $endTime = Carbon::parse($workingHour->end_time);
        $serviceDuration = $service->duration_min;
        
        $currentSlot = $startTime->copy();
        
        while ($currentSlot->copy()->addMinutes($serviceDuration)->lte($endTime)) {
            $slotDateTime = $date->copy()->setTimeFrom($currentSlot);
            
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
        
        return $slots;
    }
    
    private function isInBreakTime(WorkingHour $workingHour, Carbon $time): bool
    {
        if (!$workingHour->break_start || !$workingHour->break_end) {
            return false;
        }
        
        $breakStart = Carbon::parse($workingHour->break_start);
        $breakEnd = Carbon::parse($workingHour->break_end);
        
        return $time->between($breakStart, $breakEnd);
    }
    
    private function isSlotAvailable(int $employeeId, Carbon $startDateTime, int $duration): bool
    {
        $endDateTime = $startDateTime->copy()->addMinutes($duration);
        
        // Check for overlapping reservations
        $conflictingReservations = Reservation::where('employee_id', $employeeId)
            ->where('status', '!=', 'CANCELLED')
            ->where(function ($query) use ($startDateTime, $endDateTime) {
                $query->whereBetween('start_at', [$startDateTime, $endDateTime])
                    ->orWhereBetween('end_at', [$startDateTime, $endDateTime])
                    ->orWhere(function ($q) use ($startDateTime, $endDateTime) {
                        $q->where('start_at', '<=', $startDateTime)
                          ->where('end_at', '>=', $endDateTime);
                    });
            })
            ->exists();
            
        return !$conflictingReservations;
    }
}
```

**Acceptance Criteria**:
- [ ] Availability service correctly calculates free slots
- [ ] Holiday checking prevents bookings on holidays
- [ ] Working hours properly respected
- [ ] Break times excluded from available slots
- [ ] Existing reservations prevent conflicts
- [ ] Performance optimized for real-time queries
- [ ] Service returns slots in 30-minute intervals
- [ ] Algorithm handles edge cases properly

---

## PHASE 4: RESERVATION ENDPOINTS & BUSINESS RULES 📋

**Status**: ⏳ Pending  
**Dependencies**: Phase 3 complete  
**Estimated Time**: 10-12 hours

### Task 4.1: Availability Controller Implementation
**Priority**: Critical  
**Estimated Time**: 3 hours

**Technical Requirements**:
- Create availability endpoint
- Implement query parameter validation
- Add caching for performance
- Include proper error handling

**Controller Implementation**:
```php
<?php

namespace App\Http\Controllers\API;

use App\Http\Controllers\Controller;
use App\Services\AvailabilityService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Validator;

class AvailabilityController extends Controller
{
    private AvailabilityService $availabilityService;
    
    public function __construct(AvailabilityService $availabilityService)
    {
        $this->availabilityService = $availabilityService;
    }
    
    public function index(Request $request)
    {
        $validator = Validator::make($request->all(), [
            'service_id' => 'required|integer|exists:services,id',
            'employee_id' => 'nullable|integer|exists:employees,id',
            'date' => 'nullable|date_format:Y-m-d|after_or_equal:today'
        ]);
        
        if ($validator->fails()) {
            return response()->json([
                'error' => 'Invalid parameters',
                'messages' => $validator->errors()
            ], 422);
        }
        
        $serviceId = $request->service_id;
        $employeeId = $request->employee_id;
        $date = $request->date ?? now()->format('Y-m-d');
        
        // Cache key for availability slots
        $cacheKey = "availability:{$serviceId}:{$employeeId}:{$date}";
        
        try {
            $slots = Cache::remember($cacheKey, 300, function () use ($serviceId, $employeeId, $date) {
                return $this->availabilityService->getAvailableSlots($serviceId, $employeeId, $date);
            });
            
            Log::info('Availability requested', [
                'service_id' => $serviceId,
                'employee_id' => $employeeId,
                'date' => $date,
                'slots_count' => $slots->count()
            ]);
            
            return response()->json([
                'service_id' => $serviceId,
                'employee_id' => $employeeId,
                'date' => $date,
                'slots' => $slots
            ]);
            
        } catch (\Exception $e) {
            Log::error('Availability check failed', [
                'service_id' => $serviceId,
                'employee_id' => $employeeId,
                'date' => $date,
                'error' => $e->getMessage()
            ]);
            
            return response()->json([
                'error' => 'Unable to check availability'
            ], 500);
        }
    }
}
```

**API Specification**:
- **Endpoint**: `GET /api/availability`
- **Parameters**:
  - `service_id` (required): Service ID
  - `employee_id` (optional): Specific employee ID
  - `date` (optional): Date in YYYY-MM-DD format, defaults to today
- **Response**: Array of available time slots in ISO format

**Acceptance Criteria**:
- [ ] Endpoint returns available slots correctly
- [ ] Query parameters properly validated
- [ ] Caching implemented for performance
- [ ] Error responses follow API standards
- [ ] Logging captures all requests
- [ ] Response format matches specification

### Task 4.2: Reservation Controller Implementation
**Priority**: Critical  
**Estimated Time**: 5 hours  
**Dependencies**: Task 4.1

**Technical Requirements**:
- Implement full CRUD for reservations
- Add business rule validation
- Include conflict prevention
- Implement status management

**Controller Methods**:

**Create Reservation**:
```php
public function store(Request $request)
{
    $validator = Validator::make($request->all(), [
        'service_id' => 'required|integer|exists:services,id',
        'employee_id' => 'nullable|integer|exists:employees,id',
        'start_at' => 'required|date_format:Y-m-d\TH:i:s\Z|after:now'
    ]);
    
    if ($validator->fails()) {
        return response()->json([
            'error' => 'Validation failed',
            'messages' => $validator->errors()
        ], 422);
    }
    
    try {
        DB::beginTransaction();
        
        $service = Service::findOrFail($request->service_id);
        $startAt = Carbon::parse($request->start_at);
        $endAt = $startAt->copy()->addMinutes($service->duration_min);
        
        // Auto-assign employee if not provided
        $employeeId = $request->employee_id ?? $this->getAvailableEmployee($request->service_id, $startAt);
        
        if (!$employeeId) {
            return response()->json([
                'error' => 'No available employee for this time slot'
            ], 409);
        }
        
        // Final availability check
        if (!$this->availabilityService->isSlotAvailable($employeeId, $startAt, $service->duration_min)) {
            Log::warning('Reservation conflict detected', [
                'employee_id' => $employeeId,
                'start_at' => $startAt,
                'client_id' => auth()->id()
            ]);
            
            return response()->json([
                'error' => 'Time slot no longer available'
            ], 409);
        }
        
        $reservation = Reservation::create([
            'client_id' => auth()->id(),
            'employee_id' => $employeeId,
            'service_id' => $request->service_id,
            'start_at' => $startAt,
            'end_at' => $endAt,
            'status' => 'CONFIRMED'
        ]);
        
        // Clear availability cache
        Cache::tags(['availability'])->flush();
        
        DB::commit();
        
        Log::info('Reservation created successfully', [
            'reservation_id' => $reservation->id,
            'client_id' => auth()->id(),
            'employee_id' => $employeeId,
            'service_id' => $request->service_id,
            'start_at' => $startAt
        ]);
        
        return response()->json([
            'message' => 'Reservation created successfully',
            'reservation' => $reservation->load(['service', 'employee', 'client'])
        ], 201);
        
    } catch (\Exception $e) {
        DB::rollBack();
        
        Log::error('Reservation creation failed', [
            'client_id' => auth()->id(),
            'service_id' => $request->service_id,
            'error' => $e->getMessage(),
            'trace' => $e->getTraceAsString()
        ]);
        
        return response()->json([
            'error' => 'Unable to create reservation'
        ], 500);
    }
}
```

**List Reservations**:
```php
public function index(Request $request)
{
    $user = auth()->user();
    $query = Reservation::with(['service', 'employee', 'client']);
    
    // Filter based on user role
    if ($user->role === 'CLIENT') {
        $query->where('client_id', $user->id);
    } elseif ($user->role === 'OWNER') {
        // Owners can see all reservations
        if ($request->has('client_id')) {
            $query->where('client_id', $request->client_id);
        }
        if ($request->has('employee_id')) {
            $query->where('employee_id', $request->employee_id);
        }
    }
    
    // Additional filters
    if ($request->has('status')) {
        $query->where('status', $request->status);
    }
    
    if ($request->has('date')) {
        $date = Carbon::parse($request->date);
        $query->whereDate('start_at', $date);
    }
    
    $reservations = $query->orderBy('start_at', 'desc')
        ->paginate($request->per_page ?? 15);
    
    return response()->json($reservations);
}
```

**Update Reservation Status**:
```php
public function update(Request $request, Reservation $reservation)
{
    $user = auth()->user();
    
    // Authorization check
    if ($user->role === 'CLIENT' && $reservation->client_id !== $user->id) {
        return response()->json(['error' => 'Unauthorized'], 403);
    }
    
    $validator = Validator::make($request->all(), [
        'status' => 'required|in:CONFIRMED,CANCELLED,COMPLETED'
    ]);
    
    if ($validator->fails()) {
        return response()->json([
            'error' => 'Invalid status',
            'messages' => $validator->errors()
        ], 422);
    }
    
    $oldStatus = $reservation->status;
    $reservation->update(['status' => $request->status]);
    
    // Clear availability cache when status changes
    Cache::tags(['availability'])->flush();
    
    Log::info('Reservation status updated', [
        'reservation_id' => $reservation->id,
        'old_status' => $oldStatus,
        'new_status' => $request->status,
        'updated_by' => $user->id
    ]);
    
    return response()->json([
        'message' => 'Reservation updated successfully',
        'reservation' => $reservation->fresh(['service', 'employee', 'client'])
    ]);
}
```

**Acceptance Criteria**:
- [ ] Create reservation endpoint prevents conflicts
- [ ] Auto-assignment of employees works correctly
- [ ] Status management follows business rules
- [ ] Authorization properly implemented
- [ ] Comprehensive logging on all operations
- [ ] Cache invalidation on data changes
- [ ] Error handling covers all edge cases

### Task 4.3: Business Rules Validation
**Priority**: High  
**Estimated Time**: 2 hours  
**Dependencies**: Task 4.2

**Technical Requirements**:
- Implement comprehensive validation rules
- Add custom validation classes
- Create business rule documentation

**Validation Rules to Implement**:

**Reservation Validation**:
```php
<?php

namespace App\Rules;

use App\Models\Holiday;
use Carbon\Carbon;
use Illuminate\Contracts\Validation\Rule;

class NotHoliday implements Rule
{
    public function passes($attribute, $value)
    {
        $date = Carbon::parse($value)->format('Y-m-d');
        return !Holiday::where('id', $date)->exists();
    }
    
    public function message()
    {
        return 'Reservations cannot be made on public holidays.';
    }
}

class WithinWorkingHours implements Rule
{
    private $employeeId;
    private $duration;
    
    public function __construct($employeeId, $duration)
    {
        $this->employeeId = $employeeId;
        $this->duration = $duration;
    }
    
    public function passes($attribute, $value)
    {
        $dateTime = Carbon::parse($value);
        $weekday = $dateTime->dayOfWeek;
        
        $workingHour = WorkingHour::where('employee_id', $this->employeeId)
            ->where('weekday', $weekday)
            ->first();
            
        if (!$workingHour) {
            return false;
        }
        
        $startTime = $dateTime->format('H:i:s');
        $endTime = $dateTime->copy()->addMinutes($this->duration)->format('H:i:s');
        
        return $startTime >= $workingHour->start_time && 
               $endTime <= $workingHour->end_time;
    }
    
    public function message()
    {
        return 'Reservation must be within employee working hours.';
    }
}
```

**Acceptance Criteria**:
- [ ] Holiday validation prevents bookings on holidays
- [ ] Working hours validation ensures proper timing
- [ ] Custom validation rules created and tested
- [ ] Business rules documented and enforced
- [ ] Validation messages user-friendly

### Task 4.4: Resource Controllers for Management
**Priority**: High  
**Estimated Time**: 2 hours  
**Dependencies**: Task 4.2

**Technical Requirements**:
- Create resource controllers for employees, services
- Implement proper authorization
- Add bulk operations support

**Controllers to Create**:
- EmployeeController (owner-only)
- ServiceController (owner-only)  
- WorkingHourController (owner-only)

**Acceptance Criteria**:
- [ ] All resource controllers implemented
- [ ] CRUD operations working correctly
- [ ] Authorization middleware protecting routes
- [ ] Bulk operations supported where needed
- [ ] API responses consistent across controllers

---

## PHASE 5: REACT FRONTEND BOOKING WIZARD 🎨

**Status**: ⏳ Pending  
**Dependencies**: Phase 4 complete  
**Estimated Time**: 16-20 hours

### Task 5.1: Frontend Project Structure & Setup
**Priority**: Critical  
**Estimated Time**: 3 hours

**Technical Requirements**:
- Set up React Router for navigation
- Configure Chakra UI theme
- Set up React Query for API calls
- Implement Zustand for state management

**Folder Structure**:
```
frontend/src/
├── components/
│   ├── common/
│   ├── auth/
│   ├── booking/
│   └── management/
├── pages/
│   ├── auth/
│   ├── booking/
│   └── dashboard/
├── hooks/
├── services/
├── store/
├── types/
└── utils/
```

**Theme Configuration**:
```typescript
// src/theme/index.ts
import { extendTheme } from '@chakra-ui/react'

const theme = extendTheme({
  colors: {
    brand: {
      50: '#f0f9ff',
      100: '#e0f2fe',
      500: '#0ea5e9',
      600: '#0284c7',
      700: '#0369a1',
    },
    salon: {
      primary: '#8B4513',
      secondary: '#D2691E',
      accent: '#F4A460',
    }
  },
  fonts: {
    heading: 'Georgia, serif',
    body: 'system-ui, sans-serif',
  },
  components: {
    Button: {
      defaultProps: {
        colorScheme: 'brand',
      },
    },
  },
})

export default theme
```

**Acceptance Criteria**:
- [ ] Project structure organized and scalable
- [ ] React Router configured with all routes
- [ ] Chakra UI theme customized for salon branding
- [ ] React Query set up with proper configuration
- [ ] Zustand store implemented for auth state
- [ ] TypeScript interfaces defined for all DTOs

### Task 5.2: Authentication Components
**Priority**: Critical  
**Estimated Time**: 4 hours  
**Dependencies**: Task 5.1

**Technical Requirements**:
- Create login/register forms
- Implement form validation with react-hook-form
- Add JWT token management
- Create protected route wrapper

**Components to Create**:

**Login Component**:
```typescript
// src/components/auth/LoginForm.tsx
import { useForm } from 'react-hook-form'
import { yupResolver } from '@hookform/resolvers/yup'
import * as yup from 'yup'
import {
  Box,
  Button,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Alert,
  AlertIcon,
} from '@chakra-ui/react'
import { useMutation } from '@tanstack/react-query'
import { useAuthStore } from '../../store/authStore'
import { authService } from '../../services/authService'

const schema = yup.object({
  email: yup.string().email('Invalid email').required('Email is required'),
  password: yup.string().required('Password is required'),
})

type LoginForm = yup.InferType<typeof schema>

export const LoginForm = () => {
  const { register, handleSubmit, formState: { errors } } = useForm<LoginForm>({
    resolver: yupResolver(schema)
  })
  
  const setAuth = useAuthStore(state => state.setAuth)
  
  const loginMutation = useMutation({
    mutationFn: authService.login,
    onSuccess: (data) => {
      setAuth(data.user, data.token)
      // Navigate to dashboard
    },
    onError: (error) => {
      console.error('Login failed:', error)
    }
  })
  
  const onSubmit = (data: LoginForm) => {
    loginMutation.mutate(data)
  }
  
  return (
    <Box maxW="md" mx="auto" mt={8} p={6} borderRadius="lg" boxShadow="lg">
      <form onSubmit={handleSubmit(onSubmit)}>
        <VStack spacing={4}>
          <FormControl isInvalid={!!errors.email}>
            <FormLabel>Email</FormLabel>
            <Input {...register('email')} type="email" />
            {errors.email && <Alert status="error"><AlertIcon />{errors.email.message}</Alert>}
          </FormControl>
          
          <FormControl isInvalid={!!errors.password}>
            <FormLabel>Password</FormLabel>
            <Input {...register('password')} type="password" />
            {errors.password && <Alert status="error"><AlertIcon />{errors.password.message}</Alert>}
          </FormControl>
          
          {loginMutation.isError && (
            <Alert status="error">
              <AlertIcon />
              Login failed. Please check your credentials.
            </Alert>
          )}
          
          <Button 
            type="submit" 
            width="full" 
            isLoading={loginMutation.isPending}
            loadingText="Signing in..."
          >
            Sign In
          </Button>
        </VStack>
      </form>
    </Box>
  )
}
```

**Auth Store**:
```typescript
// src/store/authStore.ts
import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface User {
  id: number
  email: string
  full_name: string
  role: 'OWNER' | 'CLIENT'
}

interface AuthState {
  user: User | null
  token: string | null
  isAuthenticated: boolean
  setAuth: (user: User, token: string) => void
  logout: () => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      isAuthenticated: false,
      setAuth: (user, token) => set({ user, token, isAuthenticated: true }),
      logout: () => set({ user: null, token: null, isAuthenticated: false }),
    }),
    {
      name: 'auth-storage',
    }
  )
)
```

**Protected Route**:
```typescript
// src/components/auth/ProtectedRoute.tsx
import { Navigate } from 'react-router-dom'
import { useAuthStore } from '../../store/authStore'

interface ProtectedRouteProps {
  children: React.ReactNode
  requiredRole?: 'OWNER' | 'CLIENT'
}

export const ProtectedRoute = ({ children, requiredRole }: ProtectedRouteProps) => {
  const { isAuthenticated, user } = useAuthStore()
  
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />
  }
  
  if (requiredRole && user?.role !== requiredRole) {
    return <Navigate to="/unauthorized" replace />
  }
  
  return <>{children}</>
}
```

**Acceptance Criteria**:
- [ ] Login form with proper validation
- [ ] Register form for both clients and owners
- [ ] JWT token stored securely
- [ ] Protected routes prevent unauthorized access
- [ ] Role-based route protection working
- [ ] Auth state persisted across sessions

### Task 5.3: Service Selection Component
**Priority**: High  
**Estimated Time**: 3 hours  
**Dependencies**: Task 5.2

**Technical Requirements**:
- Display available services
- Show service details (duration, price)
- Allow service selection
- Integrate with booking flow

**Component Implementation**:
```typescript
// src/components/booking/ServiceSelection.tsx
import {
  Box,
  SimpleGrid,
  Card,
  CardBody,
  Text,
  Badge,
  Button,
  VStack,
  HStack,
  Icon,
} from '@chakra-ui/react'
import { FiClock, FiDollarSign } from 'react-icons/fi'
import { useQuery } from '@tanstack/react-query'
import { servicesService } from '../../services/servicesService'

interface Service {
  id: number
  name: string
  description: string
  duration_min: number
  price_dhs: number
}

interface ServiceSelectionProps {
  selectedServiceId?: number
  onServiceSelect: (service: Service) => void
}

export const ServiceSelection = ({ selectedServiceId, onServiceSelect }: ServiceSelectionProps) => {
  const { data: services, isLoading } = useQuery({
    queryKey: ['services'],
    queryFn: servicesService.getAll,
  })
  
  if (isLoading) {
    return <Box>Loading services...</Box>
  }
  
  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Text fontSize="2xl" fontWeight="bold" mb={2}>
          Choose a Service
        </Text>
        <Text color="gray.600">
          Select the service you'd like to book
        </Text>
      </Box>
      
      <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
        {services?.map((service: Service) => (
          <Card
            key={service.id}
            cursor="pointer"
            border={selectedServiceId === service.id ? '2px solid' : '1px solid'}
            borderColor={selectedServiceId === service.id ? 'brand.500' : 'gray.200'}
            _hover={{ shadow: 'md', borderColor: 'brand.300' }}
            onClick={() => onServiceSelect(service)}
          >
            <CardBody>
              <VStack align="start" spacing={3}>
                <Text fontWeight="semibold" fontSize="lg">
                  {service.name}
                </Text>
                
                <Text color="gray.600" fontSize="sm" noOfLines={2}>
                  {service.description}
                </Text>
                
                <HStack spacing={4}>
                  <HStack spacing={1}>
                    <Icon as={FiClock} color="gray.500" />
                    <Text fontSize="sm">{service.duration_min} min</Text>
                  </HStack>
                  
                  <HStack spacing={1}>
                    <Icon as={FiDollarSign} color="gray.500" />
                    <Text fontSize="sm">{service.price_dhs} DHS</Text>
                  </HStack>
                </HStack>
                
                {selectedServiceId === service.id && (
                  <Badge colorScheme="brand" variant="solid">
                    Selected
                  </Badge>
                )}
              </VStack>
            </CardBody>
          </Card>
        ))}
      </SimpleGrid>
    </VStack>
  )
}
```

**Acceptance Criteria**:
- [ ] Services displayed in card layout
- [ ] Service details clearly shown
- [ ] Selection state visually indicated
- [ ] Responsive design for all screen sizes
- [ ] Loading states handled properly

### Task 5.4: Employee Selection Component
**Priority**: High  
**Estimated Time**: 2 hours  
**Dependencies**: Task 5.3

**Technical Requirements**:
- Show employees available for selected service
- Allow "any available" option
- Display employee information
- Filter based on service compatibility

**Component Implementation**:
```typescript
// src/components/booking/EmployeeSelection.tsx
import {
  Box,
  SimpleGrid,
  Card,
  CardBody,
  Text,
  Avatar,
  Button,
  VStack,
  Badge,
  RadioGroup,
  Radio,
  Stack,
} from '@chakra-ui/react'
import { useQuery } from '@tanstack/react-query'
import { employeesService } from '../../services/employeesService'

interface Employee {
  id: number
  full_name: string
  phone?: string
  specialties: Array<{ id: number; name: string }>
}

interface EmployeeSelectionProps {
  serviceId: number
  selectedEmployeeId?: number | null
  onEmployeeSelect: (employeeId: number | null) => void
}

export const EmployeeSelection = ({ 
  serviceId, 
  selectedEmployeeId, 
  onEmployeeSelect 
}: EmployeeSelectionProps) => {
  const { data: employees, isLoading } = useQuery({
    queryKey: ['employees', 'service', serviceId],
    queryFn: () => employeesService.getByService(serviceId),
  })
  
  if (isLoading) {
    return <Box>Loading available staff...</Box>
  }
  
  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Text fontSize="2xl" fontWeight="bold" mb={2}>
          Choose Staff Member
        </Text>
        <Text color="gray.600">
          Select a preferred staff member or let us assign the best available
        </Text>
      </Box>
      
      <RadioGroup 
        value={selectedEmployeeId?.toString() || 'any'}
        onChange={(value) => onEmployeeSelect(value === 'any' ? null : parseInt(value))}
      >
        <Stack spacing={3}>
          <Radio value="any" size="lg">
            <Box ml={3}>
              <Text fontWeight="semibold">Any Available Staff</Text>
              <Text fontSize="sm" color="gray.600">
                We'll assign the best available staff member for your time slot
              </Text>
            </Box>
          </Radio>
          
          {employees?.map((employee: Employee) => (
            <Radio key={employee.id} value={employee.id.toString()} size="lg">
              <Card ml={3} variant="outline" w="full">
                <CardBody py={3}>
                  <HStack spacing={3}>
                    <Avatar 
                      name={employee.full_name} 
                      size="sm"
                    />
                    <VStack align="start" spacing={1} flex={1}>
                      <Text fontWeight="semibold">{employee.full_name}</Text>
                      <HStack wrap="wrap" spacing={1}>
                        {employee.specialties.map((specialty) => (
                          <Badge key={specialty.id} size="sm" colorScheme="blue">
                            {specialty.name}
                          </Badge>
                        ))}
                      </HStack>
                    </VStack>
                  </HStack>
                </CardBody>
              </Card>
            </Radio>
          ))}
        </Stack>
      </RadioGroup>
    </VStack>
  )
}
```

**Acceptance Criteria**:
- [ ] Employees filtered by service capability
- [ ] "Any available" option provided
- [ ] Employee specialties displayed
- [ ] Radio button selection working
- [ ] Responsive layout maintained

### Task 5.5: Date/Time Selection Component
**Priority**: Critical  
**Estimated Time**: 5 hours  
**Dependencies**: Task 5.4

**Technical Requirements**:
- Calendar component for date selection
- Time slot grid for available times
- Real-time availability checking
- Holiday and unavailable date blocking

**Component Implementation**:
```typescript
// src/components/booking/DateTimeSelection.tsx
import {
  Box,
  SimpleGrid,
  Button,
  Text,
  VStack,
  HStack,
  Badge,
  Alert,
  AlertIcon,
  Spinner,
} from '@chakra-ui/react'
import { useState } from 'react'
import { Calendar } from 'react-calendar'
import { useQuery } from '@tanstack/react-query'
import { format, isToday, isBefore, startOfDay } from 'date-fns'
import { availabilityService } from '../../services/availabilityService'
import 'react-calendar/dist/Calendar.css'

interface DateTimeSelectionProps {
  serviceId: number
  employeeId?: number | null
  selectedDateTime?: string
  onDateTimeSelect: (datetime: string) => void
}

export const DateTimeSelection = ({ 
  serviceId, 
  employeeId, 
  selectedDateTime, 
  onDateTimeSelect 
}: DateTimeSelectionProps) => {
  const [selectedDate, setSelectedDate] = useState<Date>(new Date())
  
  const { data: availability, isLoading, error } = useQuery({
    queryKey: ['availability', serviceId, employeeId, format(selectedDate, 'yyyy-MM-dd')],
    queryFn: () => availabilityService.getSlots({
      service_id: serviceId,
      employee_id: employeeId,
      date: format(selectedDate, 'yyyy-MM-dd')
    }),
    enabled: !!serviceId,
  })
  
  const isDateDisabled = (date: Date) => {
    return isBefore(date, startOfDay(new Date()))
  }
  
  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Text fontSize="2xl" fontWeight="bold" mb={2}>
          Select Date & Time
        </Text>
        <Text color="gray.600">
          Choose your preferred appointment date and time
        </Text>
      </Box>
      
      <HStack spacing={8} align="start">
        {/* Calendar */}
        <Box>
          <Text fontWeight="semibold" mb={3}>Select Date</Text>
          <Box className="custom-calendar">
            <Calendar
              onChange={(date) => setSelectedDate(date as Date)}
              value={selectedDate}
              tileDisabled={({ date }) => isDateDisabled(date)}
              minDate={new Date()}
              maxDate={new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)} // 30 days ahead
            />
          </Box>
        </Box>
        
        {/* Time Slots */}
        <Box flex={1}>
          <Text fontWeight="semibold" mb={3}>
            Available Times for {format(selectedDate, 'MMM dd, yyyy')}
          </Text>
          
          {isLoading && (
            <HStack justify="center" py={8}>
              <Spinner />
              <Text>Loading available times...</Text>
            </HStack>
          )}
          
          {error && (
            <Alert status="error">
              <AlertIcon />
              Unable to load available times. Please try again.
            </Alert>
          )}
          
          {availability && availability.slots.length === 0 && (
            <Alert status="info">
              <AlertIcon />
              No available time slots for this date. Please select another date.
            </Alert>
          )}
          
          {availability && availability.slots.length > 0 && (
            <SimpleGrid columns={3} spacing={2}>
              {availability.slots.map((slot: string) => {
                const slotDate = new Date(slot)
                const timeString = format(slotDate, 'HH:mm')
                const isSelected = selectedDateTime === slot
                
                return (
                  <Button
                    key={slot}
                    variant={isSelected ? 'solid' : 'outline'}
                    colorScheme={isSelected ? 'brand' : 'gray'}
                    size="sm"
                    onClick={() => onDateTimeSelect(slot)}
                  >
                    {timeString}
                  </Button>
                )
              })}
            </SimpleGrid>
          )}
        </Box>
      </HStack>
      
      {selectedDateTime && (
        <Alert status="success">
          <AlertIcon />
          Selected: {format(new Date(selectedDateTime), 'MMM dd, yyyy \'at\' HH:mm')}
        </Alert>
      )}
    </VStack>
  )
}
```

**Acceptance Criteria**:
- [ ] Calendar properly restricts past dates
- [ ] Time slots load based on availability API
- [ ] Selected date/time clearly indicated
- [ ] Loading and error states handled
- [ ] Real-time availability updates
- [ ] Holiday dates automatically blocked

### Task 5.6: Booking Confirmation & Summary
**Priority**: High  
**Estimated Time**: 3 hours  
**Dependencies**: Task 5.5

**Technical Requirements**:
- Display booking summary
- Show total price and duration
- Confirm booking creation
- Handle booking errors gracefully

**Component Implementation**:
```typescript
// src/components/booking/BookingConfirmation.tsx
import {
  Box,
  VStack,
  HStack,
  Text,
  Divider,
  Button,
  Card,
  CardBody,
  Alert,
  AlertIcon,
  Badge,
  Icon,
} from '@chakra-ui/react'
import { FiCalendar, FiClock, FiUser, FiDollarSign } from 'react-icons/fi'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format } from 'date-fns'
import { reservationsService } from '../../services/reservationsService'
import { toast } from '../../utils/toast'

interface BookingData {
  service: {
    id: number
    name: string
    duration_min: number
    price_dhs: number
    description: string
  }
  employee?: {
    id: number
    full_name: string
  } | null
  dateTime: string
}

interface BookingConfirmationProps {
  bookingData: BookingData
  onSuccess: (reservationId: number) => void
  onBack: () => void
}

export const BookingConfirmation = ({ 
  bookingData, 
  onSuccess, 
  onBack 
}: BookingConfirmationProps) => {
  const queryClient = useQueryClient()
  
  const createReservation = useMutation({
    mutationFn: reservationsService.create,
    onSuccess: (data) => {
      // Invalidate availability cache
      queryClient.invalidateQueries({ queryKey: ['availability'] })
      
      toast({
        title: 'Booking Confirmed!',
        description: `Your appointment has been scheduled for ${format(new Date(bookingData.dateTime), 'MMM dd, yyyy \'at\' HH:mm')}`,
        status: 'success',
        duration: 5000,
      })
      
      onSuccess(data.reservation.id)
    },
    onError: (error: any) => {
      toast({
        title: 'Booking Failed',
        description: error.response?.data?.error || 'Unable to create reservation. Please try again.',
        status: 'error',
        duration: 5000,
      })
    },
  })
  
  const handleConfirmBooking = () => {
    createReservation.mutate({
      service_id: bookingData.service.id,
      employee_id: bookingData.employee?.id,
      start_at: bookingData.dateTime,
    })
  }
  
  const appointmentDate = new Date(bookingData.dateTime)
  
  return (
    <VStack spacing={6} align="stretch">
      <Box>
        <Text fontSize="2xl" fontWeight="bold" mb={2}>
          Confirm Your Booking
        </Text>
        <Text color="gray.600">
          Please review your appointment details before confirming
        </Text>
      </Box>
      
      <Card>
        <CardBody>
          <VStack spacing={4} align="stretch">
            {/* Service Details */}
            <Box>
              <Text fontSize="lg" fontWeight="semibold" mb={2}>
                {bookingData.service.name}
              </Text>
              <Text color="gray.600" fontSize="sm">
                {bookingData.service.description}
              </Text>
            </Box>
            
            <Divider />
            
            {/* Appointment Details */}
            <VStack spacing={3} align="stretch">
              <HStack>
                <Icon as={FiCalendar} color="brand.500" />
                <Text fontWeight="medium">Date & Time:</Text>
                <Text>
                  {format(appointmentDate, 'EEEE, MMMM dd, yyyy \'at\' h:mm a')}
                </Text>
              </HStack>
              
              <HStack>
                <Icon as={FiClock} color="brand.500" />
                <Text fontWeight="medium">Duration:</Text>
                <Text>{bookingData.service.duration_min} minutes</Text>
              </HStack>
              
              <HStack>
                <Icon as={FiUser} color="brand.500" />
                <Text fontWeight="medium">Staff:</Text>
                <Text>
                  {bookingData.employee?.full_name || 'Any available staff member'}
                </Text>
              </HStack>
              
              <HStack>
                <Icon as={FiDollarSign} color="brand.500" />
                <Text fontWeight="medium">Price:</Text>
                <Text fontWeight="semibold">
                  {bookingData.service.price_dhs} DHS
                </Text>
              </HStack>
            </VStack>
            
            <Divider />
            
            <Alert status="info" borderRadius="md">
              <AlertIcon />
              <VStack align="start" spacing={1}>
                <Text fontWeight="medium">Important Notes:</Text>
                <Text fontSize="sm">
                  • Please arrive 10 minutes before your appointment
                </Text>
                <Text fontSize="sm">
                  • Cancellations must be made at least 2 hours in advance
                </Text>
                <Text fontSize="sm">
                  • Payment is due at the time of service
                </Text>
              </VStack>
            </Alert>
          </VStack>
        </CardBody>
      </Card>
      
      <HStack spacing={4} justify="center">
        <Button
          size="lg"
          variant="outline"
          onClick={onBack}
          isDisabled={createReservation.isPending}
        >
          Back to Edit
        </Button>
        
        <Button
          size="lg"
          colorScheme="brand"
          onClick={handleConfirmBooking}
          isLoading={createReservation.isPending}
          loadingText="Confirming..."
        >
          Confirm Booking
        </Button>
      </HStack>
    </VStack>
  )
}
```

**Acceptance Criteria**:
- [ ] Complete booking summary displayed
- [ ] All selected details clearly shown
- [ ] Booking creation API integration working
- [ ] Success/error handling implemented
- [ ] Loading states during submission
- [ ] Navigation back to previous steps

---

## PHASE 6: TESTING & DEPLOYMENT PREPARATION 🧪

**Status**: ⏳ Pending  
**Dependencies**: Phase 5 complete  
**Estimated Time**: 8-10 hours

### Task 6.1: Backend Testing Suite
**Priority**: High  
**Estimated Time**: 4 hours

**Technical Requirements**:
- Unit tests for all models
- Feature tests for API endpoints
- Integration tests for booking flow
- Database transaction testing

### Task 6.2: Frontend Testing Suite
**Priority**: High  
**Estimated Time**: 3 hours

**Technical Requirements**:
- Component testing with React Testing Library
- Integration tests for booking flow
- API mocking for tests
- Accessibility testing

### Task 6.3: End-to-End Testing
**Priority**: Medium  
**Estimated Time**: 3 hours

**Technical Requirements**:
- Complete booking flow testing
- Cross-browser compatibility
- Mobile responsiveness testing
- Performance testing

---

## PROJECT COMPLETION CHECKLIST ✅

### Phase 0 - Bootstrap
- [ ] Git repository initialized
- [ ] Frontend project created with Vite + React + TypeScript
- [ ] Backend Laravel 10 project created
- [ ] All required dependencies installed
- [ ] Development environment configured

### Phase 1 - Database & Models
- [ ] All database migrations created
- [ ] Eloquent models with relationships
- [ ] Database seeders for initial data
- [ ] Foreign key constraints properly set

### Phase 2 - Authentication
- [ ] JWT authentication configured
- [ ] Auth endpoints (register, login, logout)
- [ ] Protected route middleware
- [ ] Role-based access control

### Phase 3 - Holiday & Availability
- [ ] Holiday import command created
- [ ] Availability calculation engine
- [ ] Working hours management
- [ ] Schedule configuration

### Phase 4 - Reservations
- [ ] Availability API endpoint
- [ ] Reservation CRUD endpoints
- [ ] Business rule validation
- [ ] Conflict prevention logic

### Phase 5 - Frontend
- [ ] Authentication components
- [ ] Service selection UI
- [ ] Employee selection UI
- [ ] Date/time picker with availability
- [ ] Booking confirmation flow
- [ ] Responsive design implementation

### Phase 6 - Testing
- [ ] Backend unit and feature tests
- [ ] Frontend component tests
- [ ] End-to-end testing
- [ ] Performance optimization

---

## CURRENT STATUS: 🔴 Phase 0 - Project Bootstrap Required

**Next Steps**:
1. Initialize Git repository
2. Create frontend and backend projects
3. Install and configure all dependencies
4. Set up development environment

**Time Estimate for Phase 0**: 4-6 hours
**Overall Project Estimate**: 60-80 hours

---

## NOTES & CONSIDERATIONS

### Technical Decisions Made:
- Using Laravel 10 with JWT for API authentication
- React with TypeScript and Chakra UI for modern UX
- MySQL 8 for reliable data storage
- 30-minute appointment slots as standard
- Automatic employee assignment if not specified

### Future Enhancements (Post-MVP):
- Email/SMS notifications
- Payment integration
- Multi-location support
- Advanced reporting and analytics
- Mobile app development
- Customer loyalty programs

### Performance Considerations:
- API response caching for availability
- Database indexing for fast queries
- Frontend code splitting
- Image optimization for production
- CDN setup for static assets

---

*Last Updated: [Current Date]*  
*Project Status: Phase 0 - Not Started* 