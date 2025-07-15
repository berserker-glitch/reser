<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Employee;
use App\Models\User;
use App\Models\Service;
use App\Models\WorkingHour;

class EmployeeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get the owner user
        $owner = User::where('role', 'OWNER')->first();
        
        if (!$owner) {
            echo "❌ Owner user not found. Please run UserSeeder first.\n";
            return;
        }

        // Create sample employees
        $employees = [
            [
                'full_name' => 'Leila Benjelloun',
                'phone' => '+212-600-100-001',
                'note' => 'Spécialiste en coloration et mèches',
                'services' => ['Coupe Femme', 'Coloration', 'Mèches', 'Brushing', 'Soins Capillaires'],
            ],
            [
                'full_name' => 'Youssef Tazi',
                'phone' => '+212-600-100-002',
                'note' => 'Expert en coupe homme et barbe',
                'services' => ['Coupe Homme', 'Barbe', 'Brushing'],
            ],
            [
                'full_name' => 'Sanaa Chraibi',
                'phone' => '+212-600-100-003',
                'note' => 'Spécialiste en soins et défrisage',
                'services' => ['Défrisage', 'Soins Capillaires', 'Mise en Plis', 'Épilation Sourcils'],
            ],
        ];

        foreach ($employees as $employeeData) {
            // Create employee
            $employee = Employee::create([
                'user_id' => $owner->id,
                'full_name' => $employeeData['full_name'],
                'phone' => $employeeData['phone'],
                'note' => $employeeData['note'],
            ]);

            // Attach services
            $services = Service::whereIn('name', $employeeData['services'])->get();
            $employee->services()->attach($services->pluck('id'));

            // Create working hours (Monday to Saturday, 9:00-18:00, break 12:00-13:00)
            for ($day = 1; $day <= 6; $day++) {
                WorkingHour::create([
                    'employee_id' => $employee->id,
                    'weekday' => $day,
                    'start_time' => '09:00:00',
                    'end_time' => '18:00:00',
                    'break_start' => '12:00:00',
                    'break_end' => '13:00:00',
                ]);
            }

            echo "✓ Employee {$employee->full_name} created with " . count($employeeData['services']) . " services\n";
        }

        echo "✓ Employees seeded successfully\n";
    }
}
