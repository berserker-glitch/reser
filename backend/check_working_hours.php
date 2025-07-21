<?php

require_once 'vendor/autoload.php';

use Illuminate\Foundation\Application;
use App\Models\WorkingHour;
use App\Models\Employee;
use App\Models\Service;

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== CHECKING WORKING HOURS ===\n";

// Check working hours
$workingHours = WorkingHour::all();
echo "Total working hours records: " . $workingHours->count() . "\n";

if ($workingHours->count() > 0) {
    echo "\nWorking Hours:\n";
    foreach ($workingHours as $wh) {
        $weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        echo "- {$weekdays[$wh->weekday]}: {$wh->start_time} - {$wh->end_time}";
        if ($wh->break_start && $wh->break_end) {
            echo " (Break: {$wh->break_start} - {$wh->break_end})";
        }
        echo "\n";
    }
} else {
    echo "No working hours found!\n";
}

echo "\n=== CHECKING EMPLOYEES ===\n";
$employees = Employee::all();
echo "Total employees: " . $employees->count() . "\n";

if ($employees->count() > 0) {
    foreach ($employees as $emp) {
        echo "- ID: {$emp->id}, Name: {$emp->full_name}\n";
    }
}

echo "\n=== CHECKING SERVICES ===\n";
$services = Service::all();
echo "Total services: " . $services->count() . "\n";

if ($services->count() > 0) {
    foreach ($services as $service) {
        echo "- ID: {$service->id}, Name: {$service->name}, Duration: {$service->duration_min}min\n";
    }
}

echo "\n=== TESTING AVAILABILITY SERVICE ===\n";

if ($services->count() > 0 && $employees->count() > 0) {
    $testService = $services->first();
    $testEmployee = $employees->first();
    $testDate = '2025-07-21'; // Monday (working day)
    
    echo "Testing with:\n";
    echo "- Service ID: {$testService->id}\n";
    echo "- Employee ID: {$testEmployee->id}\n";
    echo "- Date: {$testDate}\n";
    
    try {
        $availabilityService = app('App\Services\AvailabilityService');
        $slots = $availabilityService->getAvailableSlots($testService->id, $testEmployee->id, $testDate);
        
        echo "Available slots: " . $slots->count() . "\n";
        if ($slots->count() > 0) {
            echo "First few slots: " . $slots->take(5)->implode(', ') . "\n";
        } else {
            echo "No slots found. Let's check working hours for Monday (weekday 1):\n";
            $mondayHours = WorkingHour::where('weekday', 1)->first();
            if ($mondayHours) {
                echo "Monday hours: {$mondayHours->start_time} - {$mondayHours->end_time}\n";
            } else {
                echo "No Monday working hours found!\n";
            }
        }
    } catch (Exception $e) {
        echo "Error testing availability: " . $e->getMessage() . "\n";
        echo "Stack trace: " . $e->getTraceAsString() . "\n";
    }
}

echo "\nDone.\n"; 