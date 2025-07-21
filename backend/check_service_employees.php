<?php

require_once 'vendor/autoload.php';

use Illuminate\Foundation\Application;
use App\Models\Service;
use App\Models\Employee;

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== CHECKING SERVICE-EMPLOYEE RELATIONSHIPS ===\n";

$service = Service::with('employees')->find(22);

if ($service) {
    echo "Service: {$service->name} (ID: {$service->id})\n";
    echo "Employees assigned to this service: {$service->employees->count()}\n";
    
    foreach ($service->employees as $employee) {
        echo "- Employee ID: {$employee->id}, Name: {$employee->full_name}\n";
    }
    
    if ($service->employees->count() === 0) {
        echo "\n❌ No employees are assigned to this service!\n";
        echo "Let's check all employees and their services:\n";
        
        $allEmployees = Employee::with('services')->get();
        foreach ($allEmployees as $emp) {
            echo "\nEmployee: {$emp->full_name} (ID: {$emp->id})\n";
            echo "Services: {$emp->services->count()}\n";
            foreach ($emp->services as $svc) {
                echo "  - Service ID: {$svc->id}, Name: {$svc->name}\n";
            }
        }
        
        echo "\n🔧 Let's assign employee 4 to service 22:\n";
        $employee = Employee::find(4);
        if ($employee) {
            $employee->services()->attach(22);
            echo "✅ Employee {$employee->full_name} assigned to service {$service->name}\n";
            
            // Check again
            $service = Service::with('employees')->find(22);
            echo "Now service has {$service->employees->count()} employees assigned.\n";
        }
    }
} else {
    echo "Service ID 22 not found!\n";
}

echo "\nDone.\n"; 