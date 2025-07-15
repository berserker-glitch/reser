# ====================================================================
# SALON RESERVATION SYSTEM - PHASE 4 COMPREHENSIVE TESTS
# Tests for Reservation Endpoints & Business Rules
# ====================================================================

param(
    [switch]$Verbose
)

# Global test counters
$script:TestCount = 0
$script:PassCount = 0
$script:FailCount = 0
$script:TestResults = @()

# Base URLs
$BASE_URL = "http://127.0.0.1:8000/api"
$AUTH_URL = "$BASE_URL/auth"

# Test data storage
$script:OwnerToken = $null
$script:ClientToken = $null
$script:TestService = $null
$script:TestEmployee = $null
$script:TestWorkingHour = $null
$script:TestReservation = $null

# Color functions
function Write-Pass { param($msg) Write-Host "[PASS]" -ForegroundColor Green -NoNewline; Write-Host " $msg" }
function Write-Fail { param($msg) Write-Host "[FAIL]" -ForegroundColor Red -NoNewline; Write-Host " $msg" }
function Write-Info { param($msg) Write-Host "[INFO]" -ForegroundColor Yellow -NoNewline; Write-Host " $msg" }
function Write-Section { param($msg) Write-Host "`n[PHASE 4] $msg" -ForegroundColor Magenta; Write-Host "+ ================================================== +" -ForegroundColor Magenta }

# Test framework functions
function Test-Assertion {
    param(
        [string]$TestName,
        [bool]$Condition,
        [string]$Details = "",
        [string]$Category = "General"
    )
    
    $script:TestCount++
    
    if ($Condition) {
        Write-Pass $TestName
        if ($Details) { Write-Host "  $Details" -ForegroundColor Gray }
        $script:PassCount++
        $result = @{ Name = $TestName; Status = "PASS"; Details = $Details; Category = $Category }
    } else {
        Write-Fail $TestName
        if ($Details) { Write-Host "  $Details" -ForegroundColor Red }
        $script:FailCount++
        $result = @{ Name = $TestName; Status = "FAIL"; Details = $Details; Category = $Category }
    }
    
    $script:TestResults += $result
}

# HTTP helper functions
function Invoke-APIRequest {
    param(
        [string]$Method = "GET",
        [string]$Endpoint,
        [hashtable]$Body = @{},
        [string]$Token = $null,
        [int]$ExpectedStatus = 200
    )
    
    try {
        $headers = @{ 'Content-Type' = 'application/json' }
        if ($Token) {
            $headers['Authorization'] = "Bearer $Token"
        }
        
        $params = @{
            Uri = "$BASE_URL$Endpoint"
            Method = $Method
            Headers = $headers
            UseBasicParsing = $true
            TimeoutSec = 10
        }
        
        if ($Method -in @('POST', 'PUT', 'PATCH') -and $Body.Count -gt 0) {
            $params['Body'] = ($Body | ConvertTo-Json -Depth 10)
        }
        
        $response = Invoke-WebRequest @params
        
        $content = $null
        if ($response.Content) {
            try {
                $content = $response.Content | ConvertFrom-Json
            } catch {
                $content = $response.Content
            }
        }
        
        return @{
            Success = $true
            StatusCode = $response.StatusCode
            Content = $content
            Headers = $response.Headers
        }
    } catch {
        $statusCode = 0
        if ($_.Exception.Response) {
            $statusCode = [int]$_.Exception.Response.StatusCode
        }
        
        return @{
            Success = $false
            StatusCode = $statusCode
            Error = $_.Exception.Message
            Content = $null
        }
    }
}

# Setup functions
function Setup-TestUsers {
    Write-Info "Setting up test users..."
    
    # Create owner user
    $ownerData = @{
        full_name = "Test Owner"
        email = "owner$(Get-Random)@test.com"
        password = "password123"
        password_confirmation = "password123"
        phone = "+212600000001"
        role = "OWNER"
    }
    
    $response = Invoke-APIRequest -Method POST -Endpoint "/auth/register" -Body $ownerData
    if ($response.Success -and $response.Content.authorization.token) {
        $script:OwnerToken = $response.Content.authorization.token
        Test-Assertion "Owner user created" $true "Token: $($script:OwnerToken.Substring(0,20))..." "Setup"
    } else {
        Test-Assertion "Owner user created" $false "Failed: $($response.Error)" "Setup"
        return $false
    }
    
    # Create client user
    $clientData = @{
        full_name = "Test Client"
        email = "client$(Get-Random)@test.com"
        password = "password123"
        password_confirmation = "password123"
        phone = "+212600000002"
        role = "CLIENT"
    }
    
    $response = Invoke-APIRequest -Method POST -Endpoint "/auth/register" -Body $clientData
    if ($response.Success -and $response.Content.authorization.token) {
        $script:ClientToken = $response.Content.authorization.token
        Test-Assertion "Client user created" $true "Token: $($script:ClientToken.Substring(0,20))..." "Setup"
    } else {
        Test-Assertion "Client user created" $false "Failed: $($response.Error)" "Setup"
        return $false
    }
    
    return $true
}

function Setup-TestService {
    Write-Info "Setting up test service..."
    
    $serviceData = @{
        name = "Test Haircut"
        description = "Basic haircut service for testing"
        duration_min = 45
        price_dhs = 150.00
    }
    
    $response = Invoke-APIRequest -Method POST -Endpoint "/admin/services" -Body $serviceData -Token $script:OwnerToken
    if ($response.Success -and $response.Content.id) {
        $script:TestService = $response.Content
        Test-Assertion "Test service created" $true "Service ID: $($script:TestService.id)" "Setup"
        return $true
    } else {
        Test-Assertion "Test service created" $false "Failed: $($response.Error)" "Setup"
        return $false
    }
}

function Setup-TestEmployee {
    Write-Info "Setting up test employee..."
    
    $employeeData = @{
        full_name = "Test Employee"
        phone = "+212600000003"
        note = "Test employee for automated testing"
        service_ids = @($script:TestService.id)
    }
    
    $response = Invoke-APIRequest -Method POST -Endpoint "/admin/employees" -Body $employeeData -Token $script:OwnerToken
    if ($response.Success -and $response.Content.id) {
        $script:TestEmployee = $response.Content
        Test-Assertion "Test employee created" $true "Employee ID: $($script:TestEmployee.id)" "Setup"
        return $true
    } else {
        Test-Assertion "Test employee created" $false "Failed: $($response.Error)" "Setup"
        return $false
    }
}

function Setup-TestWorkingHours {
    Write-Info "Setting up test working hours..."
    
    $workingHourData = @{
        employee_id = $script:TestEmployee.id
        weekday = 1  # Monday
        start_time = "09:00"
        end_time = "18:00"
        break_start = "12:00"
        break_end = "13:00"
    }
    
    $response = Invoke-APIRequest -Method POST -Endpoint "/admin/working-hours" -Body $workingHourData -Token $script:OwnerToken
    if ($response.Success -and $response.Content.id) {
        $script:TestWorkingHour = $response.Content
        Test-Assertion "Test working hours created" $true "Working Hour ID: $($script:TestWorkingHour.id)" "Setup"
        return $true
    } else {
        Test-Assertion "Test working hours created" $false "Failed: $($response.Error)" "Setup"
        return $false
    }
}

# Test categories
function Test-EmployeeManagement {
    Write-Section "EMPLOYEE MANAGEMENT TESTS"
    
    # Test employee listing
    $response = Invoke-APIRequest -Method GET -Endpoint "/employees" -Token $script:OwnerToken
    Test-Assertion "Employee listing works" $response.Success "Status: $($response.StatusCode)" "Employee Management"
    
    if ($response.Success -and $response.Content) {
        Test-Assertion "Employee data returned" ($response.Content.Count -gt 0) "Found $($response.Content.Count) employees" "Employee Management"
    }
    
    # Test employee details
    $response = Invoke-APIRequest -Method GET -Endpoint "/employees/$($script:TestEmployee.id)" -Token $script:OwnerToken
    Test-Assertion "Employee details retrieval" $response.Success "Status: $($response.StatusCode)" "Employee Management"
    
    # Test employee update
    $updateData = @{
        full_name = "Updated Employee Name"
        note = "Updated note for testing"
    }
    $response = Invoke-APIRequest -Method PUT -Endpoint "/employees/$($script:TestEmployee.id)" -Body $updateData -Token $script:OwnerToken
    Test-Assertion "Employee update works" $response.Success "Status: $($response.StatusCode)" "Employee Management"
    
    # Test unauthorized access
    $response = Invoke-APIRequest -Method GET -Endpoint "/employees" -Token $script:ClientToken
    Test-Assertion "Client blocked from employee management" ($response.StatusCode -eq 403) "Status: $($response.StatusCode)" "Employee Management"
}

function Test-ReservationCRUD {
    Write-Section "RESERVATION CRUD TESTS"
    
    # Calculate a future date for reservation
    $futureDate = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
    $reservationTime = "${futureDate}T10:00:00"
    
    # Test reservation creation
    $reservationData = @{
        service_id = $script:TestService.id
        employee_id = $script:TestEmployee.id
        start_at = $reservationTime
    }
    
    $response = Invoke-APIRequest -Method POST -Endpoint "/reservations" -Body $reservationData -Token $script:ClientToken
    Test-Assertion "Reservation creation works" $response.Success "Status: $($response.StatusCode)" "Reservation CRUD"
    
    if ($response.Success -and $response.Content.id) {
        $script:TestReservation = $response.Content
        Test-Assertion "Reservation data returned" $true "Reservation ID: $($script:TestReservation.id)" "Reservation CRUD"
    }
    
    # Test reservation listing
    $response = Invoke-APIRequest -Method GET -Endpoint "/reservations" -Token $script:ClientToken
    Test-Assertion "Reservation listing works" $response.Success "Status: $($response.StatusCode)" "Reservation CRUD"
    
    if ($response.Success -and $response.Content) {
        Test-Assertion "Client sees own reservations" ($response.Content.Count -gt 0) "Found $($response.Content.Count) reservations" "Reservation CRUD"
    }
    
    # Test reservation details
    if ($script:TestReservation) {
        $response = Invoke-APIRequest -Method GET -Endpoint "/reservations/$($script:TestReservation.id)" -Token $script:ClientToken
        Test-Assertion "Reservation details retrieval" $response.Success "Status: $($response.StatusCode)" "Reservation CRUD"
    }
    
    # Test reservation update
    if ($script:TestReservation) {
        $updateData = @{ status = "CANCELLED" }
        $response = Invoke-APIRequest -Method PUT -Endpoint "/reservations/$($script:TestReservation.id)" -Body $updateData -Token $script:ClientToken
        Test-Assertion "Reservation status update" $response.Success "Status: $($response.StatusCode)" "Reservation CRUD"
    }
}

function Test-BusinessRules {
    Write-Section "BUSINESS RULES VALIDATION TESTS"
    
    # Test holiday blocking
    $holidayDate = "2025-07-30T10:00:00"  # Assuming this is a holiday
    $holidayReservation = @{
        service_id = $script:TestService.id
        employee_id = $script:TestEmployee.id
        start_at = $holidayDate
    }
    
    $response = Invoke-APIRequest -Method POST -Endpoint "/reservations" -Body $holidayReservation -Token $script:ClientToken
    Test-Assertion "Holiday booking blocked" ($response.StatusCode -eq 422) "Status: $($response.StatusCode)" "Business Rules"
    
    # Test outside working hours
    $offHoursDate = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
    $offHoursTime = "${offHoursDate}T22:00:00"  # 10 PM
    $offHoursReservation = @{
        service_id = $script:TestService.id
        employee_id = $script:TestEmployee.id
        start_at = $offHoursTime
    }
    
    $response = Invoke-APIRequest -Method POST -Endpoint "/reservations" -Body $offHoursReservation -Token $script:ClientToken
    Test-Assertion "Outside working hours blocked" ($response.StatusCode -eq 422) "Status: $($response.StatusCode)" "Business Rules"
    
    # Test conflict detection
    if ($script:TestReservation) {
        $conflictReservation = @{
            service_id = $script:TestService.id
            employee_id = $script:TestEmployee.id
            start_at = $script:TestReservation.start_at
        }
        
        $response = Invoke-APIRequest -Method POST -Endpoint "/reservations" -Body $conflictReservation -Token $script:ClientToken
        Test-Assertion "Double booking blocked" ($response.StatusCode -eq 422) "Status: $($response.StatusCode)" "Business Rules"
    }
}

function Test-AvailabilityEndpoints {
    Write-Section "AVAILABILITY ENDPOINT TESTS"
    
    # Test availability check
    $futureDate = (Get-Date).AddDays(7).ToString("yyyy-MM-dd")
    $availabilityQuery = "?service_id=$($script:TestService.id)&employee_id=$($script:TestEmployee.id)&date=$futureDate"
    
    $response = Invoke-APIRequest -Method GET -Endpoint "/availability$availabilityQuery" -Token $script:ClientToken
    Test-Assertion "Availability endpoint works" $response.Success "Status: $($response.StatusCode)" "Availability"
    
    if ($response.Success -and $response.Content.slots) {
        Test-Assertion "Available slots returned" ($response.Content.slots.Count -gt 0) "Found $($response.Content.slots.Count) slots" "Availability"
    }
    
    # Test nearest slot
    $response = Invoke-APIRequest -Method GET -Endpoint "/availability/nearest?service_id=$($script:TestService.id)" -Token $script:ClientToken
    Test-Assertion "Nearest slot endpoint works" $response.Success "Status: $($response.StatusCode)" "Availability"
}

function Test-AuthorizationAndAccess {
    Write-Section "AUTHORIZATION & ACCESS CONTROL TESTS"
    
    # Test unauthenticated access
    $response = Invoke-APIRequest -Method GET -Endpoint "/reservations"
    Test-Assertion "Unauthenticated access blocked" ($response.StatusCode -eq 401) "Status: $($response.StatusCode)" "Authorization"
    
    # Test client accessing other client's reservations
    if ($script:TestReservation) {
        # Create another client
        $anotherClientData = @{
            full_name = "Another Client"
            email = "client2$(Get-Random)@test.com"
            password = "password123"
            password_confirmation = "password123"
            role = "CLIENT"
        }
        
        $response = Invoke-APIRequest -Method POST -Endpoint "/auth/register" -Body $anotherClientData
        if ($response.Success -and $response.Content.authorization.token) {
            $anotherToken = $response.Content.authorization.token
            $response = Invoke-APIRequest -Method GET -Endpoint "/reservations/$($script:TestReservation.id)" -Token $anotherToken
            Test-Assertion "Client cannot access other's reservations" ($response.StatusCode -eq 403) "Status: $($response.StatusCode)" "Authorization"
        }
    }
    
    # Test owner access to all reservations
    $response = Invoke-APIRequest -Method GET -Endpoint "/reservations" -Token $script:OwnerToken
    Test-Assertion "Owner can access all reservations" $response.Success "Status: $($response.StatusCode)" "Authorization"
}

function Test-DataValidation {
    Write-Section "DATA VALIDATION & ERROR HANDLING TESTS"
    
    # Test invalid service ID
    $invalidServiceReservation = @{
        service_id = 99999
        employee_id = $script:TestEmployee.id
        start_at = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ss")
    }
    
    $response = Invoke-APIRequest -Method POST -Endpoint "/reservations" -Body $invalidServiceReservation -Token $script:ClientToken
    Test-Assertion "Invalid service ID rejected" ($response.StatusCode -eq 422) "Status: $($response.StatusCode)" "Data Validation"
    
    # Test invalid employee ID
    $invalidEmployeeReservation = @{
        service_id = $script:TestService.id
        employee_id = 99999
        start_at = (Get-Date).AddDays(7).ToString("yyyy-MM-ddTHH:mm:ss")
    }
    
    $response = Invoke-APIRequest -Method POST -Endpoint "/reservations" -Body $invalidEmployeeReservation -Token $script:ClientToken
    Test-Assertion "Invalid employee ID rejected" ($response.StatusCode -eq 422) "Status: $($response.StatusCode)" "Data Validation"
    
    # Test past date reservation
    $pastDate = (Get-Date).AddDays(-1).ToString("yyyy-MM-ddTHH:mm:ss")
    $pastReservation = @{
        service_id = $script:TestService.id
        employee_id = $script:TestEmployee.id
        start_at = $pastDate
    }
    
    $response = Invoke-APIRequest -Method POST -Endpoint "/reservations" -Body $pastReservation -Token $script:ClientToken
    Test-Assertion "Past date reservation rejected" ($response.StatusCode -eq 422) "Status: $($response.StatusCode)" "Data Validation"
    
    # Test missing required fields
    $incompleteReservation = @{
        service_id = $script:TestService.id
    }
    
    $response = Invoke-APIRequest -Method POST -Endpoint "/reservations" -Body $incompleteReservation -Token $script:ClientToken
    Test-Assertion "Incomplete reservation data rejected" ($response.StatusCode -eq 422) "Status: $($response.StatusCode)" "Data Validation"
}

function Show-TestResults {
    Write-Host "`n" -NoNewline
    Write-Host "=====================================================================" -ForegroundColor Cyan
    Write-Host "PHASE 4 - TEST SUMMARY REPORT" -ForegroundColor Cyan
    Write-Host "=====================================================================" -ForegroundColor Cyan
    
    # Group results by category
    $categories = $script:TestResults | Group-Object Category
    
    foreach ($category in $categories) {
        $passed = ($category.Group | Where-Object { $_.Status -eq "PASS" }).Count
        $total = $category.Group.Count
        $percentage = [math]::Round(($passed / $total) * 100, 1)
        
        if ($percentage -eq 100) {
            Write-Host "[Phase4-$($category.Name)] $passed/$total tests passed ($percentage%)" -ForegroundColor Green
        } elseif ($percentage -ge 80) {
            Write-Host "[Phase4-$($category.Name)] $passed/$total tests passed ($percentage%)" -ForegroundColor Yellow
        } else {
            Write-Host "[Phase4-$($category.Name)] $passed/$total tests passed ($percentage%)" -ForegroundColor Red
        }
    }
    
    Write-Host "`n" -NoNewline
    $overallPercentage = [math]::Round(($script:PassCount / $script:TestCount) * 100, 1)
    
    if ($overallPercentage -eq 100) {
        Write-Host "[PHASE 4 OVERALL] $script:PassCount/$script:TestCount tests passed ($overallPercentage%)" -ForegroundColor Green
    } elseif ($overallPercentage -ge 90) {
        Write-Host "[PHASE 4 OVERALL] $script:PassCount/$script:TestCount tests passed ($overallPercentage%)" -ForegroundColor Yellow
    } else {
        Write-Host "[PHASE 4 OVERALL] $script:PassCount/$script:TestCount tests passed ($overallPercentage%)" -ForegroundColor Red
    }
    
    if ($script:FailCount -gt 0) {
        Write-Host "`n*** SOME TESTS FAILED ***" -ForegroundColor Red
        Write-Host "Please check the failed tests above." -ForegroundColor Red
        
        # Show failed tests
        $failedTests = $script:TestResults | Where-Object { $_.Status -eq "FAIL" }
        if ($failedTests) {
            Write-Host "`nFailed Tests:" -ForegroundColor Red
            foreach ($test in $failedTests) {
                Write-Host "- [$($test.Category)] $($test.Name): $($test.Details)" -ForegroundColor Red
            }
        }
    } else {
        Write-Host "`nALL TESTS PASSED!" -ForegroundColor Green
    }
    
    Write-Host ""
}

# Main execution
Write-Host "SALON RESERVATION SYSTEM - PHASE 4 COMPREHENSIVE TESTS" -ForegroundColor Cyan
Write-Host "=======================================================" -ForegroundColor Cyan
Write-Host ""

# Check server health
Write-Info "Checking server health..."
$healthResponse = Invoke-APIRequest -Method GET -Endpoint "/health"
if ($healthResponse.Success) {
    Write-Pass "Server is running"
    Write-Host "  Status: $($healthResponse.StatusCode)" -ForegroundColor Gray
} else {
    Write-Fail "Server is not responding"
    Write-Host "Please start the server first:" -ForegroundColor Yellow
    Write-Host "  cd backend && ..\php-portable\php.exe artisan serve" -ForegroundColor White
    exit 1
}

# Setup phase
Write-Section "SETUP PHASE"
if (-not (Setup-TestUsers)) {
    Write-Host "Setup failed. Cannot continue with tests." -ForegroundColor Red
    exit 1
}

if (-not (Setup-TestService)) {
    Write-Host "Service setup failed. Cannot continue with tests." -ForegroundColor Red
    exit 1
}

if (-not (Setup-TestEmployee)) {
    Write-Host "Employee setup failed. Cannot continue with tests." -ForegroundColor Red
    exit 1
}

if (-not (Setup-TestWorkingHours)) {
    Write-Host "Working hours setup failed. Cannot continue with tests." -ForegroundColor Red
    exit 1
}

# Run test categories
Test-EmployeeManagement
Test-ReservationCRUD
Test-BusinessRules
Test-AvailabilityEndpoints
Test-AuthorizationAndAccess
Test-DataValidation

# Show results
Show-TestResults

# Exit with appropriate code
if ($script:FailCount -gt 0) {
    exit 1
} else {
    exit 0
} 