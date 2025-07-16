# Salon Reservation System - Testing Suite

This directory contains a comprehensive test suite for phases 0-2 of the salon reservation system.

## Test Files

- `phases_0_2_test.ps1` - Main comprehensive test script
- `run_tests.ps1` - Simple test runner script
- `TEST_README.md` - This documentation

## Prerequisites

1. **Server must be running** - Start the Laravel server:
   ```powershell
   cd backend && ..\php-portable\php.exe artisan serve
   ```

2. **Database must be seeded** - Ensure the database has been migrated and seeded:
   ```powershell
   cd backend
   ..\php-portable\php.exe artisan migrate:fresh --seed
   ```

## Running Tests

### Method 1: Simple Test Runner (Recommended)
```powershell
.\run_tests.ps1
```

### Method 2: Direct Script Execution
```powershell
.\phases_0_2_test.ps1
```

### Method 3: Custom Options
```powershell
# Run with verbose output
.\phases_0_2_test.ps1 -Verbose

# Skip specific phases
.\phases_0_2_test.ps1 -SkipPhase0 -SkipPhase1

# Use different server URL
.\phases_0_2_test.ps1 -BaseUrl "http://127.0.0.1:8001"
```

## Test Coverage

### Phase 0: Project Bootstrap
- ✅ Git repository initialization
- ✅ Frontend project structure (React + TypeScript + Chakra UI)
- ✅ Backend project structure (Laravel 10)
- ✅ Dependencies installation
- ✅ Environment configuration
- ✅ Server health check

### Phase 1: Database & Models
- ✅ Database file existence
- ✅ Migration files presence
- ✅ Eloquent models existence
- ✅ Database seeders
- ✅ Database content verification

### Phase 2: JWT Auth & Routes
- ✅ AuthController implementation
- ✅ Middleware (Role-based & Request Logging)
- ✅ Route configuration
- ✅ User registration (Client & Owner)
- ✅ User login functionality
- ✅ Protected route access
- ✅ Role-based access control
- ✅ Token logout functionality
- ✅ Input validation testing

## Understanding Test Results

- **Green ✓** - Test passed
- **Red ✗** - Test failed
- **Status codes** - HTTP response codes for API tests
- **Summary** - Overall pass/fail statistics per phase

## Expected Results

All tests should pass if phases 0-2 are properly implemented:
- Phase 0: Project structure and dependencies
- Phase 1: Database and models working
- Phase 2: JWT authentication and API routes functional

## Troubleshooting

### Server Not Running
```
❌ Server is not running at http://127.0.0.1:8000
```
**Solution:** Start the server with `cd backend && ..\php-portable\php.exe artisan serve`

### Database Issues
```
❌ SQLite database file exists
```
**Solution:** Run migrations with `cd backend && ..\php-portable\php.exe artisan migrate`

### Authentication Failures
```
❌ User registration successful
```
**Solution:** Check JWT configuration and database connectivity

### Permission Errors
```
❌ Owner allowed to access owner-only endpoints
```
**Solution:** Verify role-based middleware is properly configured

## Test Output Example

```
====================================================================
SALON RESERVATION SYSTEM - PHASES 0-2 COMPREHENSIVE TEST
====================================================================

[PHASE 0] PROJECT BOOTSTRAP TESTS
==================================================
✓ Git repository initialized
✓ Frontend project directory exists
✓ React dependency installed
✓ TypeScript configured
✓ Chakra UI installed
...

[PHASE 1] DATABASE & MODELS TESTS
==================================================
✓ SQLite database file exists
✓ Migration for users exists
✓ Model User exists
...

[PHASE 2] JWT AUTH & ROUTES TESTS
==================================================
✓ AuthController exists
✓ Client registration successful
✓ Login returns JWT token
✓ Protected route allows authenticated requests
...

====================================================================
TEST SUMMARY REPORT
====================================================================
[Phase0] 15/15 tests passed (100.0%)
[Phase1] 12/12 tests passed (100.0%)
[Phase2] 18/18 tests passed (100.0%)

[OVERALL] 45/45 tests passed (100.0%)

🎉 ALL TESTS PASSED! 🎉
Phases 0-2 are working correctly.
```

## Next Steps

After all tests pass, you're ready to proceed to:
- **Phase 3**: Holiday Import & Availability Engine
- **Phase 4**: Reservation Endpoints & Business Rules
- **Phase 5**: React Frontend Booking Wizard
- **Phase 6**: Testing & Deployment Preparation 