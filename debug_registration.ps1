# Debug registration endpoint
$BASE_URL = "http://localhost:8000/api"

# Test registration data
$ownerData = @{
    full_name = "Debug Owner"
    email = "debug@test.com"
    password = "password123"
    password_confirmation = "password123"
    phone = "+212600000999"
    role = "OWNER"
} | ConvertTo-Json

Write-Host "Testing registration with data:"
Write-Host $ownerData

try {
    $response = Invoke-WebRequest -Uri "$BASE_URL/auth/register" -Method POST -Body $ownerData -ContentType "application/json" -UseBasicParsing
    
    Write-Host "Success! Status: $($response.StatusCode)"
    Write-Host "Response Content:"
    Write-Host $response.Content
    
    $content = $response.Content | ConvertFrom-Json
    if ($content.token) {
        Write-Host "Token received: $($content.token.Substring(0,20))..."
    }
    
} catch {
    Write-Host "Error occurred:"
    Write-Host "Status Code: $($_.Exception.Response.StatusCode.value__)"
    Write-Host "Exception Message: $($_.Exception.Message)"
    
    if ($_.Exception.Response) {
        try {
            $errorStream = $_.Exception.Response.GetResponseStream()
            $reader = New-Object System.IO.StreamReader($errorStream)
            $errorContent = $reader.ReadToEnd()
            Write-Host "Error Response Content: $errorContent"
        } catch {
            Write-Host "Could not read error response content"
        }
    }
} 