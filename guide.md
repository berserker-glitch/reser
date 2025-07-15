# Salon Reservation System MVP - Setup Guide

## Project Overview
This is a comprehensive MVP Salon Reservation System for single-location Moroccan hair salons, built with Laravel 10 (API) + React/TypeScript + Chakra UI.

## Prerequisites
- Windows 10/11 (tested on Windows 10 build 26100)
- Git for version control
- Node.js 18+ and pnpm
- PHP 8.1+ with required extensions
- PowerShell for running scripts

## Quick Start (Portable Setup)
This project includes a portable PHP setup, so you don't need to install PHP system-wide.

### 1. Clone the Repository
```bash
git clone https://github.com/berserker-glitch/reser.git
cd reser
```

### 2. Backend Setup (Laravel API)
```bash
# Navigate to backend directory
cd backend

# Install Composer dependencies using portable PHP
..\php-portable\composer.phar install

# Copy environment file
copy .env.example .env

# Generate application key
..\php-portable\php.exe artisan key:generate

# Generate JWT secret
..\php-portable\php.exe artisan jwt:secret

# Run database migrations
..\php-portable\php.exe artisan migrate

# Seed the database with sample data
..\php-portable\php.exe artisan db:seed

# Start the Laravel development server
..\php-portable\php.exe artisan serve
```

The backend API will be available at: http://127.0.0.1:8000

### 3. Frontend Setup (React + TypeScript)
Open a new terminal window:
```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
pnpm install

# Start the development server
pnpm dev
```

The frontend will be available at: http://localhost:5173

## Full System Setup (Without Portable PHP)

### 1. Install System Dependencies

#### PHP 8.1+ with Extensions
Download and install PHP 8.1+ with the following extensions:
- openssl
- pdo_sqlite
- mbstring
- tokenizer
- xml
- ctype
- json
- bcmath
- curl

#### Composer
Install Composer globally from https://getcomposer.org/

#### Node.js and pnpm
```bash
# Install Node.js 18+ from https://nodejs.org/
# Install pnpm globally
npm install -g pnpm
```

### 2. Backend Setup (System PHP)
```bash
cd backend

# Install dependencies
composer install

# Environment setup
cp .env.example .env

# Generate keys
php artisan key:generate
php artisan jwt:secret

# Database setup
php artisan migrate
php artisan db:seed

# Start server
php artisan serve
```

### 3. Frontend Setup
```bash
cd frontend

# Install dependencies
pnpm install

# Start development server
pnpm dev
```

## Testing

### Run All Tests
```bash
# From project root
powershell -ExecutionPolicy Bypass -File run_tests.ps1
```

### Run Specific Phase Tests
```bash
# Run comprehensive tests for phases 0-3
powershell -ExecutionPolicy Bypass -File phases_0_3_test.ps1

# Skip specific phases
powershell -ExecutionPolicy Bypass -File phases_0_3_test.ps1 -SkipPhase3
```

### Test Results
- **Phase 0**: Project structure, dependencies, environment (23 tests)
- **Phase 1**: Database, models, seeders (22 tests)
- **Phase 2**: JWT authentication, routes, middleware (19 tests)
- **Phase 3**: Holiday import, availability engine, API endpoints (22 tests)

Expected: **86/86 tests passing (100%)**

## Key Features Implemented

### Backend (Laravel 10 API)
- **Authentication**: JWT-based auth with role-based access control
- **Database**: SQLite with comprehensive schema for salon operations
- **Models**: User, Employee, Service, WorkingHour, Reservation, Holiday
- **API Endpoints**: 
  - Auth: /api/auth/register, /api/auth/login, /api/auth/logout
  - Services: /api/services
  - Employees: /api/employees
  - Availability: /api/availability, /api/availability/nearest, /api/availability/check
- **Holiday Management**: Automatic import of Moroccan holidays via Nager.Date API
- **Availability Engine**: Smart scheduling with working hours and holiday checking

### Frontend (React + TypeScript)
- **UI Framework**: Chakra UI for modern, responsive design
- **State Management**: Zustand for global state, React Query for server state
- **Authentication**: JWT token management with protected routes
- **Booking Flow**: Multi-step wizard for service selection and appointment booking

## Database Schema

### Key Tables
- **users**: Authentication and user management (CLIENT/OWNER roles)
- **employees**: Staff management with specialties
- **services**: Salon services with pricing and duration
- **working_hours**: Staff schedules by weekday
- **reservations**: Appointment bookings with status tracking
- **holidays**: Moroccan public holidays for automatic blocking

## API Testing

### Authentication Endpoints
```bash
# Register new user
curl -X POST http://127.0.0.1:8000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{"full_name":"Test User","email":"test@example.com","password":"password123","password_confirmation":"password123"}'

# Login
curl -X POST http://127.0.0.1:8000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'

# Use the token from login response for authenticated requests
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" http://127.0.0.1:8000/api/auth/me
```

### Availability Endpoints
```bash
# Get available slots for a service
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  "http://127.0.0.1:8000/api/availability?service_id=1&date=2025-07-20"

# Find nearest available slot
curl -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  "http://127.0.0.1:8000/api/availability/nearest?service_id=1"

# Check specific slot availability
curl -X POST -H "Authorization: Bearer YOUR_TOKEN_HERE" \
  -H "Content-Type: application/json" \
  -d '{"service_id":1,"employee_id":1,"start_at":"2025-07-20T10:00:00"}' \
  http://127.0.0.1:8000/api/availability/check
```

## Default Accounts

### Owner Account
- **Email**: owner@salon.com
- **Password**: password123
- **Role**: OWNER (full access)

### Sample Employees
- **Amina Chakir**: Hair styling, coloring specialist
- **Fatima Benali**: Nail care, facial treatments
- **Khadija Alami**: Hair cutting, styling, treatments

### Sample Services
- Coupe de cheveux (Hair cut) - 30min - 150 DHS
- Coloration complète (Full coloring) - 90min - 400 DHS
- Manucure classique (Classic manicure) - 45min - 80 DHS
- Soin du visage (Facial treatment) - 60min - 200 DHS
- And 6 more services...

## Project Structure

```
reser/
├── backend/                 # Laravel 10 API
│   ├── app/
│   │   ├── Http/Controllers/
│   │   ├── Models/
│   │   ├── Console/Commands/
│   │   └── Services/
│   ├── database/
│   │   ├── migrations/
│   │   ├── seeders/
│   │   └── database.sqlite
│   ├── routes/api.php
│   └── ...
├── frontend/                # React + TypeScript
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── types/
│   ├── package.json
│   └── ...
├── php-portable/           # Portable PHP setup
├── phases_0_3_test.ps1     # Comprehensive test suite
├── run_tests.ps1           # Simple test runner
├── task.md                 # Detailed project documentation
└── guide.md               # This setup guide
```

## Troubleshooting

### Common Issues

1. **PHP Extensions Missing**
   - Ensure SQLite, openssl, and mbstring extensions are enabled
   - Check with: `php -m`

2. **Database Connection Errors**
   - Verify `database/database.sqlite` exists
   - Check `.env` file has correct database path

3. **Port Already in Use**
   - Laravel: `php artisan serve --port=8001`
   - React: Change port in vite.config.ts

4. **JWT Secret Missing**
   - Run: `php artisan jwt:secret`
   - Check `.env` has JWT_SECRET set

5. **Authentication Issues**
   - Clear browser localStorage
   - Check JWT token expiration
   - Verify API endpoints are accessible

### Performance Notes
- SQLite is used for development simplicity
- For production, migrate to MySQL/PostgreSQL
- Enable caching for availability queries
- Consider Redis for session management

## Development Workflow

1. **Start Backend**: `php artisan serve` (port 8000)
2. **Start Frontend**: `pnpm dev` (port 5173)
3. **Run Tests**: `powershell -ExecutionPolicy Bypass -File run_tests.ps1`
4. **Check Logs**: `tail -f backend/storage/logs/laravel.log`

## Next Steps (Post-MVP)

- **Phase 4**: Complete reservation CRUD endpoints
- **Phase 5**: Full React frontend implementation
- **Phase 6**: Testing and deployment preparation
- **Future**: Email notifications, payment integration, multi-location support

## Support

For issues or questions:
1. Check the test results with `run_tests.ps1`
2. Review Laravel logs in `backend/storage/logs/`
3. Check browser console for frontend errors
4. Verify API responses with curl/Postman

---

**Last Updated**: 2025-01-15  
**Version**: Phase 3 Complete (86/86 tests passing)  
**Status**: Ready for Phase 4 development 