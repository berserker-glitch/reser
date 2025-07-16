# Salon Reservation System - Full Verification Test

# --- Configuration ---
$baseUrl = "http://localhost:8000/api"
$clientEmail = "client_$(Get-Random -Minimum 1000 -Maximum 9999)@example.com"
$ownerEmail = "owner_$(Get-Random -Minimum 1000 -Maximum 9999)@example.com"
$password = "password123"
$Global:clientToken = $null
$Global:ownerToken = $null
$Global:firstServiceId = $null
$Global:firstEmployeeId = $null

# --- Helper Functions ---
function Write-Section-Header($title) {
    Write-Host "`n"
    Write-Host "=================================================" -ForegroundColor Cyan
    Write-Host "  $title" -ForegroundColor Cyan
    Write-Host "=================================================" -ForegroundColor Cyan
}

function Write-Host-Status($message, $status) {
    if ($status -eq "SUCCESS") {
        Write-Host "[SUCCESS] $message" -ForegroundColor Green
    } elseif ($status -eq "FAIL") {
        Write-Host "[FAILURE] $message" -ForegroundColor Red
    } else {
        Write-Host "[INFO] $message" -ForegroundColor Yellow
    }
}

# --- Test Functions ---

function Register-And-Login() {
    Write-Section-Header "Phase 2.1: User Registration & Login"
    
    # Register Client
    $clientBody = @{ full_name = "Test Client"; email = $clientEmail; password = $password; password_confirmation = $password; role = "CLIENT" } | ConvertTo-Json
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $clientBody -ContentType "application/json"
        if ($response.success) {
            $Global:clientToken = $response.authorization.token
            Write-Host-Status "Client registration successful." "SUCCESS"
            Write-Host "CLIENT_TOKEN:::$($Global:clientToken)"
        } else {
            Write-Host-Status "Client registration failed." "FAIL"
        }
    } catch {
        Write-Host-Status "Client registration threw an exception: $($_.Exception.Message)" "FAIL"
    }

    # Register Owner
    $ownerBody = @{ full_name = "Test Owner"; email = $ownerEmail; password = $password; password_confirmation = $password; role = "OWNER" } | ConvertTo-Json
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $ownerBody -ContentType "application/json"
        if ($response.success) {
            $Global:ownerToken = $response.authorization.token
            Write-Host-Status "Owner registration successful." "SUCCESS"
        } else {
            Write-Host-Status "Owner registration failed." "FAIL"
        }
    } catch {
        Write-Host-Status "Owner registration threw an exception: $($_.Exception.Message)" "FAIL"
    }
}

function Test-Role-Based-Access() {
    Write-Section-Header "Phase 2.2: Role-Based Access Control"
    
    # Owner Access
    try {
        Invoke-RestMethod -Uri "$baseUrl/admin/employees" -Method Get -Headers @{ "Authorization" = "Bearer $ownerToken" }
        Write-Host-Status "Owner can access owner-only route." "SUCCESS"
    } catch {
        Write-Host-Status "Owner access to owner-only route failed unexpectedly: $($_.Exception.Message)" "FAIL"
    }

    # Client Forbidden
    try {
        Invoke-RestMethod -Uri "$baseUrl/admin/employees" -Method Get -Headers @{ "Authorization" = "Bearer $clientToken" } -ErrorAction Stop
        Write-Host-Status "Client was NOT forbidden from owner-only route." "FAIL"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 403) {
            Write-Host-Status "Client is correctly forbidden from owner-only route (403)." "SUCCESS"
        } else {
            Write-Host-Status "Client access check failed with wrong status: $($_.Exception.Response.StatusCode.value__)" "FAIL"
        }
    }
}

function Test-Get-Services() {
    Write-Section-Header "Phase 4.1: Get Services"
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/services" -Method Get -Headers @{ "Authorization" = "Bearer $clientToken" }
        if ($response.data.Count -gt 0) {
            $Global:firstServiceId = $response.data[0].id
            $Global:firstEmployeeId = $response.data[0].employees[0].id
            Write-Host-Status "Successfully fetched services. Using Service ID: $firstServiceId, Employee ID: $firstEmployeeId" "SUCCESS"
        } else {
            Write-Host-Status "Failed to fetch any services." "FAIL"
        }
    } catch {
        Write-Host-Status "Fetching services failed: $($_.Exception.Message)" "FAIL"
    }
}

function Test-Reservation-Validation() {
    Write-Section-Header "Phase 4.2: Reservation Validation"
    
    # Test booking on a holiday
    $holidayBody = @{ service_id = $firstServiceId; employee_id = $firstEmployeeId; start_at = "2025-01-01T10:00:00" } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$baseUrl/reservations" -Method Post -Headers @{ "Authorization" = "Bearer $clientToken" } -Body $holidayBody -ContentType "application/json" -ErrorAction Stop
        Write-Host-Status "Booking on holiday was NOT detected." "FAIL"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 422) {
            Write-Host-Status "Booking on holiday correctly detected (422 Unprocessable)." "SUCCESS"
        } else {
            Write-Host-Status "Booking on holiday failed with wrong status: $($_.Exception.Response.StatusCode.value__)" "FAIL"
        }
    }
}

function Test-Availability-And-Reservation() {
    Write-Section-Header "Phase 4.3: Availability & Reservation Flow"
    $date = (Get-Date).AddDays(3).ToString("yyyy-MM-dd")
    $availableSlots = $null
    
    # Check Availability
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/availability?service_id=$firstServiceId&employee_id=$firstEmployeeId&date=$date" -Method Get -Headers @{ "Authorization" = "Bearer $clientToken" }
        if ($response.success -and $response.data.slots.Count -gt 0) {
            $availableSlots = $response.data.slots
            Write-Host-Status "Availability check successful. Found $($availableSlots.Count) slots." "SUCCESS"
        } else {
            Write-Host-Status "Availability check returned no slots." "FAIL"
            return
        }
    } catch {
        Write-Host-Status "Availability check failed: $($_.Exception.Message)" "FAIL"
        return
    }

    # Create First Reservation
    $firstSlot = $availableSlots[0]
    $resBody = @{ service_id = $firstServiceId; employee_id = $firstEmployeeId; start_at = $firstSlot } | ConvertTo-Json
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/reservations" -Method Post -Body $resBody -Headers @{ "Authorization" = "Bearer $clientToken" } -ContentType "application/json"
        if ($response.success) {
            Write-Host-Status "Successfully created first reservation for $firstSlot." "SUCCESS"
        } else {
            Write-Host-Status "Failed to create first reservation." "FAIL"
            return
        }
    } catch {
        Write-Host-Status "Creating first reservation failed: $($_.Exception.Message)" "FAIL"
        return
    }

    # Test Conflict
    try {
        Invoke-RestMethod -Uri "$baseUrl/reservations" -Method Post -Body $resBody -Headers @{ "Authorization" = "Bearer $clientToken" } -ContentType "application/json" -ErrorAction Stop
        Write-Host-Status "Reservation conflict was NOT detected." "FAIL"
    } catch {
        if ($_.Exception.Response.StatusCode.value__ -eq 409) {
            Write-Host-Status "Reservation conflict correctly detected (409 Conflict)." "SUCCESS"
        } else {
            Write-Host-Status "Reservation conflict test failed with unexpected status: $($_.Exception.Response.StatusCode.value__)" "FAIL"
        }
    }
}

function Seed-Holidays() {
    Write-Section-Header "Setup: Seeding Holidays for 2025"
    try {
        $process = Start-Process "php" -ArgumentList "backend/artisan", "holidays:import", "2025" -Wait -PassThru -NoNewWindow
        if ($process.ExitCode -eq 0) {
            Write-Host-Status "Holidays for 2025 seeded successfully." "SUCCESS"
        } else {
            Write-Host-Status "Holiday seeding failed with exit code $($process.ExitCode)." "FAIL"
        }
    } catch {
        Write-Host-Status "An error occurred while seeding holidays: $($_.Exception.Message)" "FAIL"
    }
}

# --- Main Execution ---
Register-And-Login
Seed-Holidays
if ($clientToken -and $ownerToken) {
    Test-Role-Based-Access
    Test-Get-Services
    if ($firstServiceId -and $firstEmployeeId) {
        Test-Reservation-Validation
        Test-Availability-And-Reservation
    } else {
        Write-Host-Status "Skipping reservation tests because service/employee ID was not found." "INFO"
    }
} else {
    Write-Host-Status "Skipping all tests due to registration/login failure." "FAIL"
}