# PowerShell API Test Script for Salon Reservation System

# --- Configuration ---
$baseUrl = "http://localhost:8000/api" # Assuming Laravel is served on port 8000
$email = "testuser_$(Get-Random -Minimum 1000 -Maximum 9999)@example.com"
$password = "password123"
$token = $null

# --- Helper Functions ---
function Write-Host-Status($message, $status) {
    $color = "Green"
    if ($status -ne "SUCCESS") {
        $color = "Red"
    }
    Write-Host "[$status] $message" -ForegroundColor $color
}

# --- Test Functions ---

# 1. Register a new user
function Test-Register() {
    Write-Host "`n--- Testing User Registration ---"
    $body = @{
        full_name             = "Test User"
        email                 = $email
        password              = $password
        password_confirmation = $password
        role                  = "CLIENT"
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/auth/register" -Method Post -Body $body -ContentType "application/json"
        if ($response.success) {
            Write-Host-Status "Registration successful for $email" "SUCCESS"
            $Global:token = $response.authorization.token
        } else {
            Write-Host-Status "Registration failed: $($response.message)" "FAILURE"
        }
    } catch {
        Write-Host-Status "An error occurred during registration: $($_.Exception.Message)" "ERROR"
    }
}

# 2. Login with the new user
function Test-Login() {
    Write-Host "`n--- Testing User Login ---"
    $body = @{
        email    = $email
        password = $password
    } | ConvertTo-Json

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/auth/login" -Method Post -Body $body -ContentType "application/json"
        if ($response.success) {
            Write-Host-Status "Login successful for $email" "SUCCESS"
            $Global:token = $response.authorization.token
        } else {
            Write-Host-Status "Login failed: $($response.message)" "FAILURE"
        }
    } catch {
        Write-Host-Status "An error occurred during login: $($_.Exception.Message)" "ERROR"
    }
}

# 3. Get Authenticated User Profile
function Test-GetProfile() {
    Write-Host "`n--- Testing Get User Profile (Authenticated) ---"
    if (-not $token) {
        Write-Host-Status "No token available, skipping profile test." "SKIPPED"
        return
    }

    $headers = @{
        "Authorization" = "Bearer $token"
    }

    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/auth/me" -Method Get -Headers $headers
        if ($response.success) {
            Write-Host-Status "Successfully fetched profile for $($response.user.email)" "SUCCESS"
        } else {
            Write-Host-Status "Failed to fetch profile: $($response.message)" "FAILURE"
        }
    } catch {
        Write-Host-Status "An error occurred fetching profile: $($_.Exception.Message)" "ERROR"
    }
}

# 4. Fetch Services
function Test-FetchServices() {
    Write-Host "`n--- Testing Fetching Services ---"
    try {
        $response = Invoke-RestMethod -Uri "$baseUrl/services" -Method Get
        if ($response) {
            Write-Host-Status "Successfully fetched $($response.Count) services." "SUCCESS"
            return $response[0].id
        } else {
            Write-Host-Status "No services found." "FAILURE"
            return $null
        }
    } catch {
        Write-Host-Status "An error occurred fetching services: $($_.Exception.Message)" "ERROR"
        return $null
    }
}

# 5. Check Availability
function Test-CheckAvailability($serviceId) {
    Write-Host "`n--- Testing Availability Endpoint ---"
    if (-not $serviceId) {
        Write-Host-Status "No service ID available, skipping availability test." "SKIPPED"
        return
    }
    
    $date = (Get-Date).AddDays(1).ToString("yyyy-MM-dd")
    $uri = "$baseUrl/availability?service_id=$serviceId&date=$date"
    
    $headers = @{}
    if ($token) {
        $headers["Authorization"] = "Bearer $token"
    }

    try {
        $response = Invoke-RestMethod -Uri $uri -Method Get -Headers $headers
        if ($response.success) {
            Write-Host-Status "Availability check successful for service $serviceId on $date. Found $($response.data.slots.Count) slots." "SUCCESS"
        } else {
            Write-Host-Status "Availability check failed: $($response.error)" "FAILURE"
        }
    } catch {
        Write-Host-Status "An error occurred during availability check: $($_.Exception.Message)" "ERROR"
    }
}

# 6. Create a reservation (expects failure due to validation)
function Test-CreateReservation-Validation() {
    Write-Host "`n--- Testing Reservation Creation (Validation) ---"
    if (-not $token) {
        Write-Host-Status "No token available, skipping reservation test." "SKIPPED"
        return
    }

    $headers = @{ "Authorization" = "Bearer $token" }
    $body = @{} | ConvertTo-Json # Empty body to trigger validation errors

    try {
        Invoke-RestMethod -Uri "$baseUrl/reservations" -Method Post -Headers $headers -Body $body -ContentType "application/json"
    } catch {
        $response = $_.Exception.Response.GetResponseStream()
        $reader = New-Object System.IO.StreamReader($response)
        $responseBody = $reader.ReadToEnd() | ConvertFrom-Json
        
        if ($_.Exception.Response.StatusCode -eq 422) {
            Write-Host-Status "Reservation creation failed with expected validation errors (422)." "SUCCESS"
            Write-Host "Errors: $($responseBody.messages | Out-String)"
        } else {
            Write-Host-Status "Reservation creation failed with an unexpected status: $($_.Exception.Response.StatusCode)" "FAILURE"
        }
    }
}


# --- Run Tests ---
Test-Register
Test-Login
Test-GetProfile
$firstServiceId = Test-FetchServices
Test-CheckAvailability -serviceId $firstServiceId
Test-CreateReservation-Validation 