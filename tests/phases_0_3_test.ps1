# ====================================================================
# SALON RESERVATION SYSTEM - COMPREHENSIVE TEST SCRIPT
# Phases 0-3 Complete Testing Suite
# ====================================================================

param(
    [string]$BaseUrl = "http://127.0.0.1:8000",
    [switch]$SkipPhase0,
    [switch]$SkipPhase1,
    [switch]$SkipPhase2,
    [switch]$SkipPhase3,
    [switch]$Verbose
)

# Configuration
$ErrorActionPreference = "Continue"
$ProgressPreference = "SilentlyContinue"

# Colors for output
$Red = "`e[31m"
$Green = "`e[32m"
$Yellow = "`e[33m"
$Blue = "`e[34m"
$Magenta = "`e[35m"
$Cyan = "`e[36m"
$White = "`e[37m"
$Reset = "`e[0m"

# Test Results
$TestResults = @{
    Phase0 = @{ Total = 0; Passed = 0; Failed = 0; Tests = @() }
    Phase1 = @{ Total = 0; Passed = 0; Failed = 0; Tests = @() }
    Phase2 = @{ Total = 0; Passed = 0; Failed = 0; Tests = @() }
    Phase3 = @{ Total = 0; Passed = 0; Failed = 0; Tests = @() }
}

# Global variables for test data
$TestUsers = @()
$AuthTokens = @{}

# ====================================================================
# UTILITY FUNCTIONS
# ====================================================================

function Write-TestHeader {
    param([string]$Title)
    Write-Host "`n$Cyan=====================================================================$Reset"
    Write-Host "$Cyan$Title$Reset"
    Write-Host "$Cyan=====================================================================$Reset"
}

function Write-PhaseHeader {
    param([string]$Phase, [string]$Title)
    Write-Host "`n$Magenta[$Phase] $Title$Reset"
    Write-Host "$Magenta" + ("=" * 50) + "$Reset"
}

function Write-TestResult {
    param([string]$TestName, [bool]$Passed, [string]$Message = "", [string]$Phase)
    
    $TestResults[$Phase].Total++
    
    if ($Passed) {
        $TestResults[$Phase].Passed++
        Write-Host "$Green[PASS]$Reset $TestName"
        if ($Message) { Write-Host "  $White$Message$Reset" }
    } else {
        $TestResults[$Phase].Failed++
        Write-Host "$Red[FAIL]$Reset $TestName"
        if ($Message) { Write-Host "  $Red$Message$Reset" }
    }
    
    $TestResults[$Phase].Tests += @{
        Name = $TestName
        Passed = $Passed
        Message = $Message
    }
}

function Test-FileExists {
    param([string]$Path, [string]$Description)
    return Test-Path $Path
}

function Test-DirectoryExists {
    param([string]$Path, [string]$Description)
    return (Test-Path $Path) -and (Get-Item $Path).PSIsContainer
}

function Test-ApiEndpoint {
    param(
        [string]$Url,
        [string]$Method = "GET",
        [hashtable]$Headers = @{},
        [string]$Body = $null,
        [int]$ExpectedStatus = 200
    )
    
    try {
        $params = @{
            Uri = $Url
            Method = $Method
            Headers = $Headers
            ContentType = "application/json"
            UseBasicParsing = $true
            TimeoutSec = 30
        }
        
        if ($Body) {
            $params.Body = $Body
        }
        
        $response = Invoke-WebRequest @params
        
        return @{
            Success = $response.StatusCode -eq $ExpectedStatus
            StatusCode = $response.StatusCode
            Content = $response.Content
            Response = $response
        }
    } catch {
        return @{
            Success = $false
            StatusCode = if ($_.Exception.Response) { $_.Exception.Response.StatusCode.Value__ } else { 0 }
            Content = $_.Exception.Message
            Response = $null
        }
    }
}

function Get-JsonFromResponse {
    param([string]$Content)
    try {
        return $Content | ConvertFrom-Json
    } catch {
        return $null
    }
}

# ====================================================================
# PHASE 0: PROJECT BOOTSTRAP TESTS
# ====================================================================

function Test-Phase0 {
    Write-PhaseHeader "PHASE 0" "PROJECT BOOTSTRAP TESTS"
    
    # Test 1: Git Repository
    $gitExists = Test-FileExists ".git" "Git repository"
    Write-TestResult "Git repository initialized" $gitExists "" "Phase0"
    
    # Test 2: Frontend Project Structure
    $frontendExists = Test-DirectoryExists "frontend" "Frontend directory"
    Write-TestResult "Frontend project directory exists" $frontendExists "" "Phase0"
    
    if ($frontendExists) {
        $packageJsonExists = Test-FileExists "frontend/package.json" "Frontend package.json"
        Write-TestResult "Frontend package.json exists" $packageJsonExists "" "Phase0"
        
        if ($packageJsonExists) {
            $packageJson = Get-Content "frontend/package.json" | ConvertFrom-Json
            $hasReact = $packageJson.dependencies.react -ne $null
            $hasTypeScript = $packageJson.devDependencies.typescript -ne $null -or $packageJson.dependencies.typescript -ne $null
            $hasChakraUI = $packageJson.dependencies."@chakra-ui/react" -ne $null
            
            Write-TestResult "React dependency installed" $hasReact "" "Phase0"
            Write-TestResult "TypeScript configured" $hasTypeScript "" "Phase0"
            Write-TestResult "Chakra UI installed" $hasChakraUI "" "Phase0"
        }
        
        # Test frontend source structure
        $srcExists = Test-DirectoryExists "frontend/src" "Frontend src directory"
        Write-TestResult "Frontend src directory exists" $srcExists "" "Phase0"
        
        if ($srcExists) {
            $componentsExists = Test-DirectoryExists "frontend/src/components" "Components directory"
            $pagesExists = Test-DirectoryExists "frontend/src/pages" "Pages directory"
            $hooksExists = Test-DirectoryExists "frontend/src/hooks" "Hooks directory"
            $servicesExists = Test-DirectoryExists "frontend/src/services" "Services directory"
            
            Write-TestResult "Components directory exists" $componentsExists "" "Phase0"
            Write-TestResult "Pages directory exists" $pagesExists "" "Phase0"
            Write-TestResult "Hooks directory exists" $hooksExists "" "Phase0"
            Write-TestResult "Services directory exists" $servicesExists "" "Phase0"
        }
    }
    
    # Test 3: Backend Project Structure
    $backendExists = Test-DirectoryExists "backend" "Backend directory"
    Write-TestResult "Backend project directory exists" $backendExists "" "Phase0"
    
    if ($backendExists) {
        $composerJsonExists = Test-FileExists "backend/composer.json" "Backend composer.json"
        Write-TestResult "Backend composer.json exists" $composerJsonExists "" "Phase0"
        
        if ($composerJsonExists) {
            $composerJson = Get-Content "backend/composer.json" | ConvertFrom-Json
            $hasLaravel = $composerJson.require."laravel/framework" -ne $null
            $hasJWT = $composerJson.require."tymon/jwt-auth" -ne $null
            
            Write-TestResult "Laravel framework installed" $hasLaravel "" "Phase0"
            Write-TestResult "JWT Auth package installed" $hasJWT "" "Phase0"
        }
        
        # Test Laravel structure
        $appExists = Test-DirectoryExists "backend/app" "App directory"
        $routesExists = Test-DirectoryExists "backend/routes" "Routes directory"
        $databaseExists = Test-DirectoryExists "backend/database" "Database directory"
        $configExists = Test-DirectoryExists "backend/config" "Config directory"
        
        Write-TestResult "App directory exists" $appExists "" "Phase0"
        Write-TestResult "Routes directory exists" $routesExists "" "Phase0"
        Write-TestResult "Database directory exists" $databaseExists "" "Phase0"
        Write-TestResult "Config directory exists" $configExists "" "Phase0"
    }
    
    # Test 4: Environment Configuration
    $envExists = Test-FileExists "backend/.env" "Environment file"
    Write-TestResult "Environment file exists" $envExists "" "Phase0"
    
    if ($envExists) {
        $envContent = Get-Content "backend/.env" -Raw
        $hasDbConfig = $envContent -match "DB_CONNECTION="
        $hasJwtSecret = $envContent -match "JWT_SECRET="
        
        Write-TestResult "Database configuration present" $hasDbConfig "" "Phase0"
        Write-TestResult "JWT secret configured" $hasJwtSecret "" "Phase0"
    }
    
    # Test 5: Server Health Check
    Write-Host "`n$Yellow[INFO] Testing server health...$Reset"
    $healthResult = Test-ApiEndpoint "$BaseUrl/api/health" "GET"
    Write-TestResult "Server health check responds" $healthResult.Success "Status: $($healthResult.StatusCode)" "Phase0"
}

# ====================================================================
# PHASE 1: DATABASE & MODELS TESTS
# ====================================================================

function Test-Phase1 {
    Write-PhaseHeader "PHASE 1" "DATABASE AND MODELS TESTS"
    
    # Test 1: Database File
    $dbExists = Test-FileExists "backend/database/database.sqlite" "SQLite database file"
    Write-TestResult "SQLite database file exists" $dbExists "" "Phase1"
    
    # Test 2: Migration Files
    $migrationDir = "backend/database/migrations"
    $migrationExists = Test-DirectoryExists $migrationDir "Migrations directory"
    Write-TestResult "Migrations directory exists" $migrationExists "" "Phase1"
    
    if ($migrationExists) {
        $migrationFiles = Get-ChildItem "$migrationDir/*.php" -Name
        $requiredMigrations = @(
            "users",
            "employees", 
            "services",
            "employee_service",
            "working_hours",
            "reservations",
            "holidays"
        )
        
        foreach ($migration in $requiredMigrations) {
            $found = $migrationFiles | Where-Object { $_ -like "*$migration*" }
            Write-TestResult "Migration for $migration exists" ($found.Count -gt 0) "" "Phase1"
        }
    }
    
    # Test 3: Model Files
    $modelDir = "backend/app/Models"
    $modelExists = Test-DirectoryExists $modelDir "Models directory"
    Write-TestResult "Models directory exists" $modelExists "" "Phase1"
    
    if ($modelExists) {
        $requiredModels = @("User", "Employee", "Service", "WorkingHour", "Reservation", "Holiday")
        
        foreach ($model in $requiredModels) {
            $modelFile = "$modelDir/$model.php"
            $exists = Test-FileExists $modelFile "Model $model"
            Write-TestResult "Model $model exists" $exists "" "Phase1"
        }
    }
    
    # Test 4: Seeder Files
    $seederDir = "backend/database/seeders"
    $seederExists = Test-DirectoryExists $seederDir "Seeders directory"
    Write-TestResult "Seeders directory exists" $seederExists "" "Phase1"
    
    if ($seederExists) {
        $databaseSeederExists = Test-FileExists "$seederDir/DatabaseSeeder.php" "DatabaseSeeder"
        Write-TestResult "DatabaseSeeder exists" $databaseSeederExists "" "Phase1"
        
        $requiredSeeders = @("UserSeeder", "ServiceSeeder", "EmployeeSeeder")
        foreach ($seeder in $requiredSeeders) {
            $seederFile = "$seederDir/$seeder.php"
            $exists = Test-FileExists $seederFile "Seeder $seeder"
            Write-TestResult "Seeder $seeder exists" $exists "" "Phase1"
        }
    }
    
    # Test 5: Test Database Content via API
    Write-Host "`n$Yellow[INFO] Testing database content...$Reset"
    
    # Test services endpoint (should be accessible)
    $servicesResult = Test-ApiEndpoint "$BaseUrl/api/services" "GET"
    if ($servicesResult.Success) {
        $services = Get-JsonFromResponse $servicesResult.Content
        $hasServices = $services -and $services.Count -gt 0
        Write-TestResult "Services seeded in database" $hasServices "Found $($services.Count) services" "Phase1"
    } else {
        Write-TestResult "Services endpoint accessible" $false "Status: $($servicesResult.StatusCode)" "Phase1"
    }
}

# ====================================================================
# PHASE 2: JWT AUTH & ROUTES TESTS
# ====================================================================

function Test-Phase2 {
    Write-PhaseHeader "PHASE 2" "JWT AUTH AND ROUTES TESTS"
    
    # Test 1: Auth Controller
    $authControllerExists = Test-FileExists "backend/app/Http/Controllers/API/AuthController.php" "AuthController"
    Write-TestResult "AuthController exists" $authControllerExists "" "Phase2"
    
    # Test 2: Middleware
    $middlewareDir = "backend/app/Http/Middleware"
    $roleMiddlewareExists = Test-FileExists "$middlewareDir/RoleMiddleware.php" "RoleMiddleware"
    $requestLoggingExists = Test-FileExists "$middlewareDir/RequestLoggingMiddleware.php" "RequestLoggingMiddleware"
    
    Write-TestResult "RoleMiddleware exists" $roleMiddlewareExists "" "Phase2"
    Write-TestResult "RequestLoggingMiddleware exists" $requestLoggingExists "" "Phase2"
    
    # Test 3: Routes Configuration
    $apiRoutesExists = Test-FileExists "backend/routes/api.php" "API routes"
    Write-TestResult "API routes file exists" $apiRoutesExists "" "Phase2"
    
    # Test 4: User Registration
    Write-Host "`n$Yellow[INFO] Testing user registration...$Reset"

    # Generate unique email with timestamp to avoid conflicts
    $timestamp = [DateTimeOffset]::Now.ToUnixTimeSeconds()
    
    $testClient = @{
        full_name = "Test Client User"
        email = "testclient$timestamp@example.com"
        password = "password123"
        password_confirmation = "password123"
        role = "CLIENT"
    }
    
    $registerResult = Test-ApiEndpoint "$BaseUrl/api/auth/register" "POST" @{} ($testClient | ConvertTo-Json) 201
    
    if ($registerResult.Success) {
        $registerData = Get-JsonFromResponse $registerResult.Content
        $hasToken = $registerData.authorization.token -ne $null
        $hasUser = $registerData.user -ne $null
        
        Write-TestResult "Client registration successful" $true "Status: $($registerResult.StatusCode)" "Phase2"
        Write-TestResult "Registration returns JWT token" $hasToken "" "Phase2"
        Write-TestResult "Registration returns user data" $hasUser "" "Phase2"
        
        if ($hasToken) {
            $AuthTokens.Client = $registerData.authorization.token
            $TestUsers += $registerData.user
        }
    } else {
        Write-TestResult "Client registration successful" $false "Status: $($registerResult.StatusCode)" "Phase2"
    }
    
    # Test 5: Owner Registration
    $testOwner = @{
        full_name = "Test Owner User"
        email = "testowner$timestamp@example.com"
        password = "password123"
        password_confirmation = "password123"
        role = "OWNER"
    }
    
    $ownerRegisterResult = Test-ApiEndpoint "$BaseUrl/api/auth/register" "POST" @{} ($testOwner | ConvertTo-Json) 201
    
    if ($ownerRegisterResult.Success) {
        $ownerData = Get-JsonFromResponse $ownerRegisterResult.Content
        $hasToken = $ownerData.authorization.token -ne $null
        
        Write-TestResult "Owner registration successful" $true "Status: $($ownerRegisterResult.StatusCode)" "Phase2"
        
        if ($hasToken) {
            $AuthTokens.Owner = $ownerData.authorization.token
            $TestUsers = @($TestUsers) + @($ownerData.user)
        }
    } else {
        Write-TestResult "Owner registration successful" $false "Status: $($ownerRegisterResult.StatusCode)" "Phase2"
    }
    
    # Test 6: User Login
    Write-Host "`n$Yellow[INFO] Testing user login...$Reset"
    
    $loginCredentials = @{
        email = "testclient$timestamp@example.com"
        password = "password123"
    }
    
    $loginResult = Test-ApiEndpoint "$BaseUrl/api/auth/login" "POST" @{} ($loginCredentials | ConvertTo-Json)
    
    if ($loginResult.Success) {
        $loginData = Get-JsonFromResponse $loginResult.Content
        $hasToken = $loginData.authorization.token -ne $null
        
        Write-TestResult "User login successful" $true "Status: $($loginResult.StatusCode)" "Phase2"
        Write-TestResult "Login returns JWT token" $hasToken "" "Phase2"
        
        if ($hasToken) {
            $AuthTokens.ClientLogin = $loginData.authorization.token
        }
    } else {
        Write-TestResult "User login successful" $false "Status: $($loginResult.StatusCode)" "Phase2"
    }
    
    # Test 7: Protected Route Access
    Write-Host "`n$Yellow[INFO] Testing protected routes...$Reset"
    
    # Test without authentication
    $unauthResult = Test-ApiEndpoint "$BaseUrl/api/auth/me" "GET" @{} $null 401
    $isUnauthorized = $unauthResult.StatusCode -eq 401
    Write-TestResult "Protected route blocks unauthenticated requests" $isUnauthorized "Status: $($unauthResult.StatusCode)" "Phase2"
    
    # Test with authentication
    if ($AuthTokens.Client) {
        $authHeaders = @{ Authorization = "Bearer $($AuthTokens.Client)" }
        $authResult = Test-ApiEndpoint "$BaseUrl/api/auth/me" "GET" $authHeaders
        
        if ($authResult.Success) {
            $userData = Get-JsonFromResponse $authResult.Content
            $hasUserData = $userData.user -ne $null
            
            Write-TestResult "Protected route allows authenticated requests" $true "Status: $($authResult.StatusCode)" "Phase2"
            Write-TestResult "Me endpoint returns user data" $hasUserData "" "Phase2"
        } else {
            Write-TestResult "Protected route allows authenticated requests" $false "Status: $($authResult.StatusCode)" "Phase2"
        }
    }
    
    # Test 8: Role-Based Access Control
    Write-Host "`n$Yellow[INFO] Testing role-based access control...$Reset"
    
    # Test client accessing owner-only endpoint
    if ($AuthTokens.Client) {
        $clientHeaders = @{ Authorization = "Bearer $($AuthTokens.Client)" }
        $clientOwnerResult = Test-ApiEndpoint "$BaseUrl/api/employees" "GET" $clientHeaders
        $isForbidden = $clientOwnerResult.StatusCode -eq 403
        Write-TestResult "Client blocked from owner-only endpoints" $isForbidden "Status: $($clientOwnerResult.StatusCode)" "Phase2"
    }
    
    # Test owner accessing owner-only endpoint
    if ($AuthTokens.Owner) {
        $ownerHeaders = @{ Authorization = "Bearer $($AuthTokens.Owner)" }
        $ownerResult = Test-ApiEndpoint "$BaseUrl/api/employees" "GET" $ownerHeaders
        $isAllowed = $ownerResult.Success -or $ownerResult.StatusCode -eq 200
        Write-TestResult "Owner allowed to access owner-only endpoints" $isAllowed "Status: $($ownerResult.StatusCode)" "Phase2"
    }
    
    # Test 9: Token Logout
    Write-Host "`n$Yellow[INFO] Testing logout functionality...$Reset"
    
    if ($AuthTokens.Client) {
        $clientHeaders = @{ Authorization = "Bearer $($AuthTokens.Client)" }
        $logoutResult = Test-ApiEndpoint "$BaseUrl/api/auth/logout" "POST" $clientHeaders
        
        Write-TestResult "Logout endpoint responds" $logoutResult.Success "Status: $($logoutResult.StatusCode)" "Phase2"
        
        # Test that token is invalidated
        Start-Sleep -Seconds 1
        $invalidTokenResult = Test-ApiEndpoint "$BaseUrl/api/auth/me" "GET" $clientHeaders
        $isInvalidated = $invalidTokenResult.StatusCode -eq 401
        Write-TestResult "Token invalidated after logout" $isInvalidated "Status: $($invalidTokenResult.StatusCode)" "Phase2"
    }
    
    # Test 10: Authentication Input Validation
    Write-Host "`n$Yellow[INFO] Testing input validation...$Reset"
    
    # Test registration with invalid email
    $invalidUser = @{
        full_name = "Invalid User"
        email = "invalid-email"
        password = "password123"
        password_confirmation = "password123"
    }
    
    $invalidRegisterResult = Test-ApiEndpoint "$BaseUrl/api/auth/register" "POST" @{} ($invalidUser | ConvertTo-Json)
    $isValidationError = $invalidRegisterResult.StatusCode -eq 422
    Write-TestResult "Registration validates email format" $isValidationError "Status: $($invalidRegisterResult.StatusCode)" "Phase2"
    
    # Test login with wrong credentials
    $wrongCredentials = @{
        email = "testclient@example.com"
        password = "wrongpassword"
    }
    
    $wrongLoginResult = Test-ApiEndpoint "$BaseUrl/api/auth/login" "POST" @{} ($wrongCredentials | ConvertTo-Json)
    $isUnauthorized = $wrongLoginResult.StatusCode -eq 401
    Write-TestResult "Login rejects wrong credentials" $isUnauthorized "Status: $($wrongLoginResult.StatusCode)" "Phase2"
}

# ====================================================================
# PHASE 3: HOLIDAY IMPORT & AVAILABILITY ENGINE TESTS
# ====================================================================

function Test-Phase3 {
    Write-PhaseHeader "PHASE 3" "HOLIDAY IMPORT & AVAILABILITY ENGINE TESTS"
    
    # Test 1: Holiday Import Command
    Write-Host "`n$Yellow[INFO] Testing Holiday Import Command...$Reset"
    try {
        $holidayImportResult = & cmd /c "cd backend && php artisan holidays:import 2025" 2>&1
        $importSuccess = $holidayImportResult -match "Successfully imported" -or $holidayImportResult -match "Updated holiday"
        Write-TestResult "Holiday import command executes" $importSuccess "Holiday import completed" "Phase3"
    } catch {
        Write-TestResult "Holiday import command executes" $false $_.Exception.Message "Phase3"
    }
    
    # Test 2: Verify holidays exist in database
    Write-Host "`n$Yellow[INFO] Checking if holidays exist in database...$Reset"
    try {
        $holidayCheckResult = & cmd /c "cd backend && php test_holidays.php" 2>&1
        $holidayCount = if ($holidayCheckResult -match "Holidays: (\d+)") { [int]$matches[1] } else { 0 }
        Write-TestResult "Holidays exist in database" ($holidayCount -gt 0) "Found $holidayCount holidays" "Phase3"
    } catch {
        Write-TestResult "Holidays exist in database" $false $_.Exception.Message "Phase3"
    }
    
    # Test 3: Availability Service exists
    Write-Host "`n$Yellow[INFO] Testing Availability Service...$Reset"
    $availabilityServicePath = "backend/app/Services/AvailabilityService.php"
    Write-TestResult "AvailabilityService file exists" (Test-Path $availabilityServicePath) "" "Phase3"
    
    # Test 4: Availability Controller exists
    $availabilityControllerPath = "backend/app/Http/Controllers/API/AvailabilityController.php"
    Write-TestResult "AvailabilityController file exists" (Test-Path $availabilityControllerPath) "" "Phase3"
    
    # Test 5: Console Kernel scheduling
    $consoleKernelPath = "backend/app/Console/Kernel.php"
    Write-TestResult "Console Kernel file exists" (Test-Path $consoleKernelPath) "" "Phase3"
    
    if (Test-Path $consoleKernelPath) {
        $kernelContent = Get-Content $consoleKernelPath -Raw
        $hasHolidayScheduling = $kernelContent -match "holidays:import"
        Write-TestResult "Holiday import scheduled in Kernel" $hasHolidayScheduling "" "Phase3"
    }
    
    # Test 6: Server Health Check (for availability endpoints)
    Write-Host "`n$Yellow[INFO] Testing server health...$Reset"
    $healthResult = Test-ApiEndpoint "$BaseUrl/api/health" "GET"
    Write-TestResult "Server is running" $healthResult.Success "Status: $($healthResult.StatusCode)" "Phase3"
    
    # Test 7: Services endpoint still works
    Write-Host "`n$Yellow[INFO] Testing services endpoint...$Reset"
    $servicesResult = Test-ApiEndpoint "$BaseUrl/api/services" "GET"
    if ($servicesResult.Success) {
        $services = Get-JsonFromResponse $servicesResult.Content
        $hasServices = $services -and $services.Count -gt 0
        Write-TestResult "Services endpoint returns data" $hasServices "Found $($services.Count) services" "Phase3"
    } else {
        Write-TestResult "Services endpoint returns data" $false "Status: $($servicesResult.StatusCode)" "Phase3"
    }
    
    # Test 8: Authentication for availability testing
    Write-Host "`n$Yellow[INFO] Testing authentication for availability...$Reset"
    try {
        $authData = @{
            email = "fatima@example.com"
            password = "password123"
        }
        $authResponse = Invoke-RestMethod -Uri "$BaseUrl/api/auth/login" -Method POST -Body ($authData | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 10
        $token = $authResponse.authorization.token
        Write-TestResult "Authentication successful" ($null -ne $token) "Got JWT token" "Phase3"
    } catch {
        Write-TestResult "Authentication successful" $false $_.Exception.Message "Phase3"
        $token = $null
    }
    
    # Test 9: Availability endpoint (authenticated)
    if ($token) {
        Write-Host "`n$Yellow[INFO] Testing availability endpoint...$Reset"
        try {
            $headers = @{
                "Authorization" = "Bearer $token"
                "Content-Type" = "application/json"
            }
            
            $availabilityResult = Invoke-RestMethod -Uri "$BaseUrl/api/availability?service_id=1&date=2025-07-20" -Method GET -Headers $headers -TimeoutSec 10
            $hasSlots = $availabilityResult.success -eq $true
            Write-TestResult "Availability endpoint returns data" $hasSlots "Availability check completed" "Phase3"
        } catch {
            Write-TestResult "Availability endpoint returns data" $false $_.Exception.Message "Phase3"
        }
        
        # Test 10: Nearest slot endpoint
        try {
            $nearestResult = Invoke-RestMethod -Uri "$BaseUrl/api/availability/nearest?service_id=1" -Method GET -Headers $headers -TimeoutSec 10
            $hasNearestSlot = $nearestResult.success -eq $true
            Write-TestResult "Nearest slot endpoint works" $hasNearestSlot "Nearest slot check completed" "Phase3"
        } catch {
            Write-TestResult "Nearest slot endpoint works" $false $_.Exception.Message "Phase3"
        }
        
        # Test 11: Slot availability check
        try {
            $checkData = @{
                service_id = 1
                start_at = "2025-07-20T10:00:00Z"
            }
            $checkResult = Invoke-RestMethod -Uri "$BaseUrl/api/availability/check" -Method POST -Body ($checkData | ConvertTo-Json) -Headers $headers -TimeoutSec 10
            $hasCheckResult = $checkResult.success -eq $true
            Write-TestResult "Slot availability check works" $hasCheckResult "Slot check completed" "Phase3"
        } catch {
            Write-TestResult "Slot availability check works" $false $_.Exception.Message "Phase3"
        }
    } else {
        Write-TestResult "Availability endpoint returns data" $false "No authentication token" "Phase3"
        Write-TestResult "Nearest slot endpoint works" $false "No authentication token" "Phase3"
        Write-TestResult "Slot availability check works" $false "No authentication token" "Phase3"
    }
    
    # Test 12: Working Hours seeded
    Write-Host "`n$Yellow[INFO] Testing working hours data...$Reset"
    try {
        $workingHoursCheck = & cmd /c "cd backend && php test_working_hours.php" 2>&1
        $workingHoursCount = if ($workingHoursCheck -match "Working Hours: (\d+)") { [int]$matches[1] } else { 0 }
        Write-TestResult "Working hours exist in database" ($workingHoursCount -gt 0) "Found $workingHoursCount working hour records" "Phase3"
    } catch {
        Write-TestResult "Working hours exist in database" $false $_.Exception.Message "Phase3"
    }
    
    # Test 13: File structure verification
    Write-Host "`n$Yellow[INFO] Verifying file structure...$Reset"
    $requiredFiles = @(
        @{ Path = "backend/app/Console/Commands/ImportHolidays.php"; Name = "ImportHolidays.php" },
        @{ Path = "backend/app/Console/Kernel.php"; Name = "Kernel.php" },
        @{ Path = "backend/app/Services/AvailabilityService.php"; Name = "AvailabilityService.php" },
        @{ Path = "backend/app/Http/Controllers/API/AvailabilityController.php"; Name = "AvailabilityController.php" },
        @{ Path = "backend/app/Models/Holiday.php"; Name = "Holiday.php" },
        @{ Path = "backend/app/Models/WorkingHour.php"; Name = "WorkingHour.php" }
    )
    
    foreach ($file in $requiredFiles) {
        $exists = Test-Path $file.Path
        Write-TestResult "File exists: $($file.Name)" $exists "" "Phase3"
    }
    
    # Test 14: Code quality checks
    Write-Host "`n$Yellow[INFO] Checking code quality...$Reset"
    try {
        $syntaxCheck1 = & cmd /c "cd backend && php -l app/Services/AvailabilityService.php" 2>&1
        $syntax1OK = $syntaxCheck1 -match "No syntax errors"
        Write-TestResult "AvailabilityService syntax check" $syntax1OK "" "Phase3"
        
        $syntaxCheck2 = & cmd /c "cd backend && php -l app/Http/Controllers/API/AvailabilityController.php" 2>&1
        $syntax2OK = $syntaxCheck2 -match "No syntax errors"
        Write-TestResult "AvailabilityController syntax check" $syntax2OK "" "Phase3"
        
        $syntaxCheck3 = & cmd /c "cd backend && php -l app/Console/Commands/ImportHolidays.php" 2>&1
        $syntax3OK = $syntaxCheck3 -match "No syntax errors"
        Write-TestResult "ImportHolidays syntax check" $syntax3OK "" "Phase3"
    } catch {
        Write-TestResult "Code syntax checks" $false $_.Exception.Message "Phase3"
    }
}

# ====================================================================
# MAIN EXECUTION
# ====================================================================

function Show-TestSummary {
    Write-TestHeader "TEST SUMMARY REPORT"
    
    $totalTests = 0
    $totalPassed = 0
    $totalFailed = 0
    
    foreach ($phase in $TestResults.Keys) {
        $phaseResult = $TestResults[$phase]
        $totalTests += $phaseResult.Total
        $totalPassed += $phaseResult.Passed
        $totalFailed += $phaseResult.Failed
        
        $passRate = if ($phaseResult.Total -gt 0) { 
            [math]::Round(($phaseResult.Passed / $phaseResult.Total) * 100, 1) 
        } else { 0 }
        
        $statusColor = if ($phaseResult.Failed -eq 0) { $Green } else { $Red }
        
        Write-Host "$statusColor`[$phase`] $($phaseResult.Passed)/$($phaseResult.Total) tests passed ($passRate%)$Reset"
        
        if ($Verbose -and $phaseResult.Failed -gt 0) {
            $failedTests = $phaseResult.Tests | Where-Object { -not $_.Passed }
            foreach ($test in $failedTests) {
                Write-Host "  $Red[FAIL] $($test.Name)$Reset"
                if ($test.Message) {
                    Write-Host "    $($test.Message)"
                }
            }
        }
    }
    
    Write-Host ""
    $overallPassRate = if ($totalTests -gt 0) { 
        [math]::Round(($totalPassed / $totalTests) * 100, 1) 
    } else { 0 }
    
    $overallColor = if ($totalFailed -eq 0) { $Green } else { $Red }
    Write-Host "$overallColor`[OVERALL`] $totalPassed/$totalTests tests passed ($overallPassRate%)$Reset"
    
    if ($totalFailed -eq 0) {
        Write-Host "$Green"
        Write-Host "*** ALL TESTS PASSED! ***"
        Write-Host "Phases 0-3 are working correctly."
        Write-Host "$Reset"
    } else {
        Write-Host "$Red"
        Write-Host "*** SOME TESTS FAILED ***"
        Write-Host "Please check the failed tests above."
        Write-Host "$Reset"
    }
}

# Main execution
Write-TestHeader "SALON RESERVATION SYSTEM - PHASES 0-3 COMPREHENSIVE TEST"
Write-Host "Testing against: $BaseUrl"
Write-Host "Timestamp: $(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')"

# Check if server is running
Write-Host "`n$Yellow[INFO] Checking server status...$Reset"
$serverCheck = Test-ApiEndpoint "$BaseUrl/api/health" "GET"
if (-not $serverCheck.Success) {
    Write-Host "$Red[ERROR] Server is not running at $BaseUrl$Reset"
    Write-Host "$Red[ERROR] Please start the server with: cd backend; ..\php-portable\php.exe artisan serve$Reset"
    exit 1
}
Write-Host "$Green[SUCCESS] Server is running$Reset"

# Run tests
if (-not $SkipPhase0) {
    Test-Phase0
}

if (-not $SkipPhase1) {
    Test-Phase1
}

if (-not $SkipPhase2) {
    Test-Phase2
}

if (-not $SkipPhase3) {
    Test-Phase3
}

# Show summary
Show-TestSummary

# Exit with appropriate code
exit $(if ($TestResults.Phase0.Failed + $TestResults.Phase1.Failed + $TestResults.Phase2.Failed + $TestResults.Phase3.Failed -eq 0) { 0 } else { 1 }) 