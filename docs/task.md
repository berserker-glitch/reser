# MVP Salon Reservation System - Detailed Task Breakdown

## Project Overview

Building an **MVP Salon Reservation System** for single-location Moroccan hair salons using:
- **Backend**: Laravel 10 (API-only) + MySQL 8
- **Frontend**: React + TypeScript + Chakra UI
- **Key Features**: Employee/service management, client booking, automatic holiday blocking
- **MVP Scope**: No payments, email, or SMS integrations

## Tech Stack Requirements

### Backend Dependencies
```bash
composer create-project laravel/laravel salon-api
composer require tymon/jwt-auth spatie/laravel-schedule-monitor laravel-ide-helper
```

### Frontend Dependencies
```bash
pnpm create vite@latest salon-mvp --template react-ts
pnpm i @chakra-ui/react @chakra-ui/icons @emotion/react @emotion/styled framer-motion react-hook-form yup @tanstack/react-query axios zustand date-fns
```

---

## Phase 0: Project Bootstrap

### 0.1 Repository Setup
- [ ] Initialize Git repository with proper .gitignore
- [ ] Set up ESLint/Prettier for frontend
- [ ] Configure Laravel Pint for backend
- [ ] Create separate `frontend/` and `backend/` directories

### 0.2 Frontend Initialization
- [ ] Create Vite + React + TypeScript project
- [ ] Install Chakra UI and required dependencies
- [ ] Set up basic project structure:
  ```
  frontend/
  ├── src/
  │   ├── components/
  │   ├── pages/
  │   ├── hooks/
  │   ├── services/
  │   ├── types/
  │   └── utils/
  ```

### 0.3 Backend Initialization
- [ ] Create Laravel 10 project
- [ ] Install JWT Auth and other required packages
- [ ] Configure CORS (built-in from Laravel 10)
- [ ] Set up MySQL 8 database connection
- [ ] Configure environment variables

---

## Phase 1: Database Schema & Eloquent Models

### 1.1 Database Migrations

#### Users Table
```sql
CREATE TABLE users (
  id            BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  role          ENUM('OWNER','CLIENT') NOT NULL DEFAULT 'CLIENT',
  full_name     VARCHAR(120)           NOT NULL,
  email         VARCHAR(120)           NOT NULL UNIQUE,
  phone         VARCHAR(40),
  password      VARCHAR(255)           NOT NULL,
  created_at    TIMESTAMP,
  updated_at    TIMESTAMP
);
```

#### Employees Table
```sql
CREATE TABLE employees (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  user_id     BIGINT UNSIGNED NOT NULL,
  full_name   VARCHAR(120)   NOT NULL,
  phone       VARCHAR(40),
  note        TEXT,
  created_at  TIMESTAMP,
  updated_at  TIMESTAMP
);
```

#### Services Table
```sql
CREATE TABLE services (
  id          BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  name        VARCHAR(120) NOT NULL,
  description TEXT,
  duration_min SMALLINT UNSIGNED NOT NULL DEFAULT 30,
  price_dhs    DECIMAL(8,2) NOT NULL,
  created_at  TIMESTAMP,
  updated_at  TIMESTAMP
);
```

#### Employee-Service Pivot Table
```sql
CREATE TABLE employee_service (
  employee_id BIGINT UNSIGNED NOT NULL,
  service_id  BIGINT UNSIGNED NOT NULL,
  PRIMARY KEY(employee_id, service_id)
);
```

#### Working Hours Table
```sql
CREATE TABLE working_hours (
  id           BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  employee_id  BIGINT UNSIGNED,
  weekday      TINYINT UNSIGNED NOT NULL,
  start_time   TIME          NOT NULL,
  end_time     TIME          NOT NULL,
  break_start  TIME          NULL,
  break_end    TIME          NULL
);
```

#### Reservations Table
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
  updated_at    TIMESTAMP
);
```

#### Holidays Table
```sql
CREATE TABLE holidays (
  id        DATE PRIMARY KEY,
  name      VARCHAR(180)
);
```

### 1.2 Eloquent Models
- [ ] Create User model with role enum and relationships
- [ ] Create Employee model with user relationship
- [ ] Create Service model with employee many-to-many
- [ ] Create WorkingHour model with employee relationship
- [ ] Create Reservation model with foreign key relationships
- [ ] Create Holiday model with date primary key
- [ ] Define all `$fillable` properties and relationships
- [ ] Use `HasManyThrough` for employee ↔ reservations

### 1.3 Model Relationships
```php
// User.php
public function employeeProfile() { return $this->hasOne(Employee::class); }
public function reservations() { return $this->hasMany(Reservation::class, 'client_id'); }

// Employee.php
public function user() { return $this->belongsTo(User::class); }
public function services() { return $this->belongsToMany(Service::class); }
public function workingHours() { return $this->hasMany(WorkingHour::class); }
public function reservations() { return $this->hasMany(Reservation::class); }

// Service.php
public function employees() { return $this->belongsToMany(Employee::class); }
public function reservations() { return $this->hasMany(Reservation::class); }
```

---

## Phase 2: JWT Auth + Route Structure

### 2.1 JWT Configuration
- [ ] Publish JWT config: `php artisan vendor:publish --provider="Tymon\JWTAuth\Providers\LaravelServiceProvider"`
- [ ] Generate JWT secret: `php artisan jwt:secret`
- [ ] Configure User model to implement JWTSubject

### 2.2 Auth Controller
```php
// AuthController endpoints:
POST /api/auth/register → {full_name, email, password, phone?, role?} → 201 {token}
POST /api/auth/login    → {email, password} → 200 {token}
POST /api/auth/logout   → Bearer token → 200 {message}
```

### 2.3 Route Structure
```php
// routes/api.php
Route::prefix('auth')->group(function () {
    Route::post('register', [AuthController::class, 'register']);
    Route::post('login', [AuthController::class, 'login']);
    Route::post('logout', [AuthController::class, 'logout'])->middleware('auth:api');
});

Route::middleware('auth:api')->group(function () {
    // Protected routes here
});
```

### 2.4 Logging Requirements
- [ ] Log every login attempt at `info` level
- [ ] Log JWT invalidation at `info` level
- [ ] Include user ID and timestamp in all auth logs

---

## Phase 3: Holiday Import & Availability Engine

### 3.1 Holiday Import Command
```php
// app/Console/Commands/ImportHolidays.php
public function handle()
{
    $year = now()->year;
    $url = "https://date.nager.at/api/v3/PublicHolidays/{$year}/MA";
    $holidays = Http::get($url)->throw()->json();

    foreach ($holidays as $h) {
        Holiday::updateOrCreate(
            ['id' => $h['date']],
            ['name' => $h['localName']]
        );
    }
    Log::info("Imported holidays", ['count' => count($holidays), 'year' => $year]);
}
```

### 3.2 Scheduling
- [ ] Register command in `app/Console/Kernel.php`
- [ ] Schedule yearly execution on Dec 31 at 23:30

### 3.3 Availability Logic
```php
// Pseudocode for slot availability check
function isSlotAvailable(employeeId, dateTimeStart, duration):
    // Check if date is a holiday
    if (Holiday::where('id', dateTimeStart.date)->exists()) return false
    
    // Check working hours
    workHours = WorkingHour::where('employee_id', employeeId)
                          ->where('weekday', dateTimeStart.weekday)
                          ->first()
    if (!workHours || timeOutsideWorkingHours(dateTimeStart, duration, workHours))
        return false
    
    // Check for overlapping reservations
    overlap = Reservation::where('employee_id', employeeId)
                        ->where(function($q) use ($dateTimeStart, $duration) {
                            $q->whereBetween('start_at', [$dateTimeStart, $dateTimeStart + $duration])
                              ->orWhereBetween('end_at', [$dateTimeStart, $dateTimeStart + $duration]);
                        })->exists()
    
    return !overlap
```

---

## Phase 4: Reservation CRUD + Business Rules

### 4.1 API Endpoints

#### Availability Check
```php
GET /api/availability
Query params: service_id (required), employee_id (optional), date (optional, defaults today)
Response: { "slots": ["2025-07-29T09:00", "2025-07-29T09:30", ...] }
```

#### Create Reservation
```php
POST /api/reservations
Body: { service_id, employee_id?, start_at }
Response: { id, status: "CONFIRMED" }
```

#### List Reservations
```php
GET /api/reservations (with auth)
Response: [{ id, client_id, employee_id, service_id, start_at, end_at, status }]
```

### 4.2 Business Rules Validation
- [ ] Validate slot availability before booking
- [ ] Check employee can perform the requested service
- [ ] Ensure booking is not on a holiday
- [ ] Verify booking is within employee working hours
- [ ] Prevent double booking

### 4.3 Logging Requirements
- [ ] Log `info` on successful reservation creation
- [ ] Log `warning` on rejected requests with reasons
- [ ] Include client_id, employee_id, start_at in all reservation logs

---

## Phase 5: React Frontend Booking Wizard

### 5.1 State Management
- [ ] Set up Zustand for global auth state
- [ ] Configure React Query for API caching
- [ ] Create type definitions for all DTOs

### 5.2 Booking Flow Components

#### Step 1: Service Selection
```tsx
interface ServiceSelectionProps {
  services: Service[];
  selectedServiceId?: number;
  onSelect: (serviceId: number) => void;
}
```

#### Step 2: Employee Selection (Optional)
```tsx
interface EmployeeSelectionProps {
  employees: Employee[];
  selectedEmployeeId?: number;
  onSelect: (employeeId: number) => void;
  onSkip: () => void;
}
```

#### Step 3: Date/Time Selection
```tsx
interface DateTimeSelectionProps {
  availableSlots: string[];
  selectedSlot?: string;
  onSelect: (slot: string) => void;
}
```

#### Step 4: Review & Confirm
```tsx
interface BookingReviewProps {
  booking: BookingData;
  onConfirm: () => void;
  onBack: () => void;
}
```

### 5.3 Form Management
```tsx
const { control, handleSubmit, watch } = useForm<BookingDto>();
const { mutate, isLoading } = useMutation(createReservation, {
  onSuccess: (data) => {
    toast({
      title: 'Booking confirmed',
      description: `Reference #${data.id}`,
      status: 'success'
    });
    navigate(`/booking/${data.id}`);
  },
  onError: (e: AxiosError) => {
    toast({
      title: 'Unable to book',
      description: e.response?.data?.message ?? 'Please try another slot',
      status: 'error'
    });
  }
});
```

### 5.4 Data Types
```typescript
interface Service {
  id: number;
  name: string;
  duration_min: number;
  price_dhs: number;
  description: string;
}

interface Employee {
  id: number;
  full_name: string;
  specialties: Service[];
}

interface Reservation {
  id: number;
  client_id: number;
  employee_id: number;
  service_id: number;
  start_at: string; // ISO date string
  end_at: string;
  status: 'CONFIRMED' | 'CANCELLED' | 'COMPLETED';
}

interface BookingDto {
  service_id: number;
  employee_id?: number;
  start_at: string;
}
```

---

## Testing Requirements

### Backend Tests (PHPUnit)
- [ ] Authentication endpoints
- [ ] Availability calculation logic
- [ ] Reservation creation/validation
- [ ] Holiday import functionality

### Frontend Tests (Jest/RTL)
- [ ] Booking wizard flow
- [ ] Form validation
- [ ] API integration
- [ ] Component rendering

---

## Deployment Checklist

### Backend
- [ ] Configure production environment variables
- [ ] Set up database migrations
- [ ] Configure JWT secrets
- [ ] Set up scheduled tasks (holiday import)

### Frontend
- [ ] Build optimization
- [ ] Environment-specific API URLs
- [ ] Error boundary implementation
- [ ] Performance optimization

---

## Logging Guidelines

### PSR-3 Log Levels
- **info**: Successful auth, reservation creation, holiday imports
- **warning**: Business rule violations (double-booking, holidays, work hours)
- **error**: Unhandled exceptions with stack traces

### Log Context
- Generate UUID for each request in middleware
- Use `Log::withContext(['request_id' => $uuid])` for correlation
- Include relevant IDs (user_id, employee_id, reservation_id) in all logs

---

## Security Considerations

- [ ] Input validation on all endpoints
- [ ] Rate limiting on auth endpoints
- [ ] CORS configuration for production
- [ ] SQL injection prevention (use Eloquent ORM)
- [ ] XSS protection in frontend
- [ ] JWT token expiration and refresh

---

## Performance Optimization

- [ ] Database indexing on frequently queried columns
- [ ] React Query caching for API responses
- [ ] Lazy loading for components
- [ ] Image optimization
- [ ] Database query optimization

---

## MVP Limitations (Explicitly Excluded)

- ❌ Payment processing
- ❌ Email notifications
- ❌ SMS notifications
- ❌ Multi-location support
- ❌ Advanced reporting
- ❌ Staff scheduling tools
- ❌ Customer loyalty programs 