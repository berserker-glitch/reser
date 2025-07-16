# Phase 3 Testing Script - Holiday Import & Availability Engine
# Salon Reservation System MVP

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "PHASE 3 TESTING - Holiday Import & Availability Engine" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

$baseUrl = "http://127.0.0.1:8000"
$testResults = @()

# Test counters
$passCount = 0
$failCount = 0

function Test-Result {
    param(
        [string]$testName,
        [bool]$passed,
        [string]$details = ""
    )
    
    if ($passed) {
        Write-Host "[PASS] $testName" -ForegroundColor Green
        if ($details) { Write-Host "  $details" -ForegroundColor White }
        $script:passCount++
    } else {
        Write-Host "[FAIL] $testName" -ForegroundColor Red
        if ($details) { Write-Host "  $details" -ForegroundColor White }
        $script:failCount++
    }
    
    $script:testResults += [PSCustomObject]@{
        Test = $testName
        Passed = $passed
        Details = $details
    }
}

# Test 1: Holiday Import Command
Write-Host "`n[INFO] Testing Holiday Import Command..." -ForegroundColor Yellow
try {
    $holidayImportResult = & cmd /c "cd backend && php artisan holidays:import 2025" 2>&1
    $holidayImportSuccess = $LASTEXITCODE -eq 0
    Test-Result "Holiday import command executes" $holidayImportSuccess $holidayImportResult
} catch {
    Test-Result "Holiday import command executes" $false $_.Exception.Message
}

# Test 2: Verify holidays exist in database
Write-Host "`n[INFO] Checking if holidays exist in database..." -ForegroundColor Yellow
try {
    $holidayCheckResult = & cmd /c "cd backend && php test_holidays.php" 2>&1
    $holidayCount = if ($holidayCheckResult -match "Holidays: (\d+)") { [int]$matches[1] } else { 0 }
    Test-Result "Holidays exist in database" ($holidayCount -gt 0) "Found $holidayCount holidays"
} catch {
    Test-Result "Holidays exist in database" $false $_.Exception.Message
}

# Test 3: Availability Service exists
Write-Host "`n[INFO] Testing Availability Service..." -ForegroundColor Yellow
$availabilityServicePath = "backend/app/Services/AvailabilityService.php"
Test-Result "AvailabilityService file exists" (Test-Path $availabilityServicePath)

# Test 4: Availability Controller exists
$availabilityControllerPath = "backend/app/Http/Controllers/API/AvailabilityController.php"
Test-Result "AvailabilityController file exists" (Test-Path $availabilityControllerPath)

# Test 5: Console Kernel exists with scheduling
$consoleKernelPath = "backend/app/Console/Kernel.php"
Test-Result "Console Kernel file exists" (Test-Path $consoleKernelPath)

if (Test-Path $consoleKernelPath) {
    $kernelContent = Get-Content $consoleKernelPath -Raw
    $hasScheduling = $kernelContent -match "holidays:import"
    Test-Result "Holiday import scheduled in Kernel" $hasScheduling
}

# Test 6: Server Health Check
Write-Host "`n[INFO] Testing server health..." -ForegroundColor Yellow
try {
    $healthResponse = Invoke-RestMethod -Uri "$baseUrl/api/health" -Method GET -TimeoutSec 10
    Test-Result "Server is running" $true "Status: $($healthResponse.message)"
} catch {
    Test-Result "Server is running" $false $_.Exception.Message
}

# Test 7: Services endpoint (needed for availability testing)
Write-Host "`n[INFO] Testing services endpoint..." -ForegroundColor Yellow
try {
    $servicesResponse = Invoke-RestMethod -Uri "$baseUrl/api/services" -Method GET -TimeoutSec 10
    $serviceCount = if ($servicesResponse -is [Array]) { $servicesResponse.Count } else { 0 }
    Test-Result "Services endpoint returns data" ($serviceCount -gt 0) "Found $serviceCount services"
    
    # Store first service ID for availability testing
    $firstServiceId = if ($servicesResponse -is [Array] -and $servicesResponse.Count -gt 0) { $servicesResponse[0].id } else { 1 }
} catch {
    Test-Result "Services endpoint returns data" $false $_.Exception.Message
    $firstServiceId = 1
}

# Test 8: Authentication for availability testing
Write-Host "`n[INFO] Testing authentication for availability..." -ForegroundColor Yellow
try {
    $authData = @{
        email = "fatima@example.com"
        password = "password123"
    }
    $authResponse = Invoke-RestMethod -Uri "$baseUrl/api/auth/login" -Method POST -Body ($authData | ConvertTo-Json) -ContentType "application/json" -TimeoutSec 10
    $token = $authResponse.token
    Test-Result "Authentication successful" ($null -ne $token) "Got JWT token"
} catch {
    Test-Result "Authentication successful" $false $_.Exception.Message
    $token = $null
}

# Test 9: Availability endpoint (authenticated)
if ($token) {
    Write-Host "`n[INFO] Testing availability endpoint..." -ForegroundColor Yellow
    try {
        $headers = @{
            'Authorization' = "Bearer $token"
            'Accept' = 'application/json'
        }
        $availabilityUrl = "$baseUrl/api/availability?service_id=$firstServiceId&date=2025-07-16"
        $availabilityResponse = Invoke-RestMethod -Uri $availabilityUrl -Method GET -Headers $headers -TimeoutSec 10
        
        $hasSlots = $availabilityResponse.success -and $availabilityResponse.data.slots -ne $null
        Test-Result "Availability endpoint returns data" $hasSlots "Service ID: $firstServiceId"
    } catch {
        Test-Result "Availability endpoint returns data" $false $_.Exception.Message
    }
}

# Test 10: Availability endpoint validation
Write-Host "`n[INFO] Testing availability endpoint validation..." -ForegroundColor Yellow
if ($token) {
    try {
        $headers = @{
            'Authorization' = "Bearer $token"
            'Accept' = 'application/json'
        }
        $invalidUrl = "$baseUrl/api/availability?service_id=999&date=2025-07-16"
        $invalidResponse = Invoke-RestMethod -Uri $invalidUrl -Method GET -Headers $headers -TimeoutSec 10 -ErrorAction Stop
        Test-Result "Availability validation (invalid service)" $false "Should have failed with invalid service ID"
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Test-Result "Availability validation (invalid service)" ($statusCode -eq 422) "HTTP Status: $statusCode"
    }
}

# Test 11: File structure verification
Write-Host "`n[INFO] Verifying file structure..." -ForegroundColor Yellow
$requiredFiles = @(
    "backend/app/Console/Commands/ImportHolidays.php",
    "backend/app/Console/Kernel.php",
    "backend/app/Services/AvailabilityService.php",
    "backend/app/Http/Controllers/API/AvailabilityController.php"
)

foreach ($file in $requiredFiles) {
    $exists = Test-Path $file
    $fileName = Split-Path $file -Leaf
    Test-Result "File exists: $fileName" $exists
}

# Test 12: Code quality check
Write-Host "`n[INFO] Checking code quality..." -ForegroundColor Yellow
try {
    $syntaxCheck = & cmd /c "cd backend && php -l app/Services/AvailabilityService.php" 2>&1
    $syntaxOk = $LASTEXITCODE -eq 0
    Test-Result "AvailabilityService syntax check" $syntaxOk
} catch {
    Test-Result "AvailabilityService syntax check" $false $_.Exception.Message
}

try {
    $controllerSyntaxCheck = & cmd /c "cd backend && php -l app/Http/Controllers/API/AvailabilityController.php" 2>&1
    $controllerSyntaxOk = $LASTEXITCODE -eq 0
    Test-Result "AvailabilityController syntax check" $controllerSyntaxOk
} catch {
    Test-Result "AvailabilityController syntax check" $false $_.Exception.Message
}

# Summary
Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "PHASE 3 TEST SUMMARY" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total Tests: $($passCount + $failCount)" -ForegroundColor White
Write-Host "Passed: $passCount" -ForegroundColor Green
Write-Host "Failed: $failCount" -ForegroundColor Red

$passRate = [math]::Round(($passCount / ($passCount + $failCount)) * 100, 1)
Write-Host "Pass Rate: $passRate%" -ForegroundColor $(if ($passRate -gt 80) { "Green" } elseif ($passRate -gt 60) { "Yellow" } else { "Red" })

if ($failCount -eq 0) {
    Write-Host "`n*** PHASE 3 COMPLETED SUCCESSFULLY ***" -ForegroundColor Green
} else {
    Write-Host "`n*** PHASE 3 NEEDS ATTENTION ***" -ForegroundColor Yellow
}

Write-Host "`nDetailed Results:" -ForegroundColor Yellow
$testResults | ForEach-Object {
    $status = if ($_.Passed) { "[PASS]" } else { "[FAIL]" }
    $color = if ($_.Passed) { "Green" } else { "Red" }
    Write-Host "$status $($_.Test)" -ForegroundColor $color
    if ($_.Details) {
        Write-Host "  $($_.Details)" -ForegroundColor White
    }
}

Write-Host "`nTest completed at $(Get-Date)" -ForegroundColor Gray 