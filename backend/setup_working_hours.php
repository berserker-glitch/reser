<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Setting up working hours table...\n";

try {
    // First, check if there are any employees
    $employees = DB::table('employees')->get();
    echo "Found " . $employees->count() . " employees in database\n";
    
    $employeeId = null;
    
    if ($employees->count() === 0) {
        echo "No employees found. Creating default admin employee...\n";
        
        // Create a default admin employee
        $employeeId = DB::table('employees')->insertGetId([
            'user_id' => 1, // Assume user ID 1 is the admin
            'full_name' => 'Administrator',
            'phone' => null,
            'note' => 'Default admin employee for working hours management',
            'created_at' => now(),
            'updated_at' => now(),
        ]);
        
        echo "✅ Created default admin employee with ID: $employeeId\n";
    } else {
        // Use the first employee found
        $employeeId = $employees->first()->id;
        echo "Using existing employee ID: $employeeId ({$employees->first()->full_name})\n";
    }

    // Clear existing working hours
    DB::table('working_hours')->truncate();
    echo "✅ Cleared existing working hours\n";

    // Default working hours configuration
    $defaultWorkingHours = [
        [
            'employee_id' => $employeeId,
            'weekday' => 0, // Sunday
            'start_time' => '09:00:00', // Open on Sunday too for now
            'end_time' => '17:00:00',
            'break_start' => null,
            'break_end' => null,
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'employee_id' => $employeeId,
            'weekday' => 1, // Monday
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
            'break_start' => '12:00:00',
            'break_end' => '13:00:00',
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'employee_id' => $employeeId,
            'weekday' => 2, // Tuesday
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
            'break_start' => '12:00:00',
            'break_end' => '13:00:00',
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'employee_id' => $employeeId,
            'weekday' => 3, // Wednesday
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
            'break_start' => '12:00:00',
            'break_end' => '13:00:00',
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'employee_id' => $employeeId,
            'weekday' => 4, // Thursday
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
            'break_start' => '12:00:00',
            'break_end' => '13:00:00',
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'employee_id' => $employeeId,
            'weekday' => 5, // Friday
            'start_time' => '09:00:00',
            'end_time' => '18:00:00',
            'break_start' => '12:00:00',
            'break_end' => '13:00:00',
            'created_at' => now(),
            'updated_at' => now(),
        ],
        [
            'employee_id' => $employeeId,
            'weekday' => 6, // Saturday
            'start_time' => '09:00:00',
            'end_time' => '17:00:00',
            'break_start' => '12:00:00',
            'break_end' => '13:00:00',
            'created_at' => now(),
            'updated_at' => now(),
        ],
    ];

    // Insert the 7 default working hour records
    DB::table('working_hours')->insert($defaultWorkingHours);

    echo "✅ Inserted 7 default working hour records for employee ID: $employeeId\n";
    echo "📅 Sunday: 09:00-17:00 (No break)\n";
    echo "📅 Monday-Friday: 09:00-18:00 (Break: 12:00-13:00)\n";
    echo "📅 Saturday: 09:00-17:00 (Break: 12:00-13:00)\n";
    echo "🎉 Working hours setup completed successfully!\n";
    echo "💡 You can now edit these hours in the Settings page.\n";

} catch (Exception $e) {
    echo "❌ Failed to set up working hours: " . $e->getMessage() . "\n";
}
?> 