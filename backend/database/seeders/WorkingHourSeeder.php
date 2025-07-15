<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Employee;
use App\Models\WorkingHour;

class WorkingHourSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "🕐 Seeding working hours...\n";

        // Get all employees
        $employees = Employee::all();

        if ($employees->count() === 0) {
            echo "⚠️  No employees found. Run EmployeeSeeder first.\n";
            return;
        }

        // Standard working hours for a salon
        $standardHours = [
            // Monday (1) to Friday (5): 9:00 AM - 6:00 PM with 12:00-1:00 PM break
            1 => ['start' => '09:00', 'end' => '18:00', 'break_start' => '12:00', 'break_end' => '13:00'],
            2 => ['start' => '09:00', 'end' => '18:00', 'break_start' => '12:00', 'break_end' => '13:00'],
            3 => ['start' => '09:00', 'end' => '18:00', 'break_start' => '12:00', 'break_end' => '13:00'],
            4 => ['start' => '09:00', 'end' => '18:00', 'break_start' => '12:00', 'break_end' => '13:00'],
            5 => ['start' => '09:00', 'end' => '18:00', 'break_start' => '12:00', 'break_end' => '13:00'],
            
            // Saturday (6): 10:00 AM - 5:00 PM with 1:00-2:00 PM break
            6 => ['start' => '10:00', 'end' => '17:00', 'break_start' => '13:00', 'break_end' => '14:00'],
            
            // Sunday (0): Closed - no working hours
        ];

        $totalCreated = 0;

        foreach ($employees as $employee) {
            foreach ($standardHours as $weekday => $hours) {
                WorkingHour::create([
                    'employee_id' => $employee->id,
                    'weekday' => $weekday,
                    'start_time' => $hours['start'],
                    'end_time' => $hours['end'],
                    'break_start' => $hours['break_start'],
                    'break_end' => $hours['break_end'],
                ]);
                $totalCreated++;
            }
        }

        echo "✅ Working hours seeded successfully!\n";
        echo "📅 Created {$totalCreated} working hour records for {$employees->count()} employees\n";
        echo "🕐 Standard hours: Mon-Fri 9:00-18:00, Sat 10:00-17:00, Sun closed\n";
    }
}
