# ====================================================================
# SALON RESERVATION SYSTEM - TEST RUNNER
# Simple script to execute comprehensive tests for phases 0-3
# ====================================================================

Write-Host "🧪 Salon Reservation System - Test Runner" -ForegroundColor Cyan
Write-Host "=========================================" -ForegroundColor Cyan
Write-Host ""

# Check if server is running
Write-Host "Checking server status..." -ForegroundColor Yellow
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8000/api/health" -UseBasicParsing -TimeoutSec 5
    if ($response.StatusCode -eq 200) {
        Write-Host "✅ Server is running" -ForegroundColor Green
    } else {
        Write-Host "❌ Server responded with status: $($response.StatusCode)" -ForegroundColor Red
        exit 1
    }
} catch {
    Write-Host "❌ Server is not running at http://127.0.0.1:8000" -ForegroundColor Red
    Write-Host "Please start the server first:" -ForegroundColor Yellow
    Write-Host "  cd backend && ..\php-portable\php.exe artisan serve" -ForegroundColor White
    exit 1
}

Write-Host ""
Write-Host "🚀 Running comprehensive tests for phases 0-3..." -ForegroundColor Green
Write-Host ""

# Execute the main test script
& ".\phases_0_3_test.ps1" -Verbose

Write-Host ""
Write-Host "Test execution completed." -ForegroundColor Cyan 