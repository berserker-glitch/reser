<?php

require_once 'vendor/autoload.php';

use Illuminate\Foundation\Application;
use App\Models\Service;
use App\Models\Employee;
use App\Services\AvailabilityService;
use Illuminate\Support\Facades\DB;

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== DEBUGGING AVAILABILITY API ===\n";

$serviceId = 22;
$employeeId = null;
$date = '2025-07-21';

echo "Testing with:\n";
echo "- Service ID: {$serviceId}\n";
echo "- Employee ID: " . ($employeeId ?: 'null') . "\n";
echo "- Date: {$date}\n\n";

// Step 1: Check service exists
$service = Service::find($serviceId);
if (!$service) {
    echo "❌ Service not found!\n";
    exit;
}
echo "✅ Service found: {$service->name}\n";

// Step 2: Check employees for this service (same logic as controller)
$employees = $employeeId 
    ? Employee::where('id', $employeeId)->with('services')->get()
    : Employee::whereHas('services', fn($q) => $q->where('service_id', $serviceId))->get();

echo "Employees query result: {$employees->count()} employees\n";

foreach ($employees as $emp) {
    echo "- Employee ID: {$emp->id}, Name: {$emp->full_name}\n";
    echo "  Services for this employee: {$emp->services->count()}\n";
    foreach ($emp->services as $svc) {
        echo "    - Service ID: {$svc->id}, Name: {$svc->name}\n";
    }
}

if ($employees->isEmpty()) {
    echo "❌ No employees found for this service!\n";
    
    echo "\nLet's check the employee_service pivot table:\n";
    $pivotRecords = DB::table('employee_service')->where('service_id', $serviceId)->get();
    echo "Pivot records for service {$serviceId}: {$pivotRecords->count()}\n";
    foreach ($pivotRecords as $pivot) {
        echo "- Employee ID: {$pivot->employee_id}, Service ID: {$pivot->service_id}\n";
    }
    
    exit;
}

// Step 3: Test availability service directly
echo "\nTesting AvailabilityService...\n";
$availabilityService = app(AvailabilityService::class);
$slots = $availabilityService->getAvailableSlots($serviceId, $employeeId, $date);

echo "Availability service returned: {$slots->count()} slots\n";
if ($slots->count() > 0) {
    echo "First 5 slots: " . $slots->take(5)->implode(', ') . "\n";
}

echo "\nDone.\n"; 