<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Employee;
use App\Models\User;
use App\Models\Service;
use App\Models\WorkingHour;
use App\Models\Salon;
use Illuminate\Support\Facades\Log;

class EmployeeSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "👨‍💼 Creating employees for salons...\n";
        
        // Get all salons
        $salons = Salon::all();
        
        if ($salons->isEmpty()) {
            echo "⚠️  No salons found. Skipping employee creation.\n";
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

        $totalCreated = 0;
        
        foreach ($salons as $salon) {
        foreach ($employees as $employeeData) {
            // Create employee
            $employee = Employee::create([
                    'salon_id' => $salon->id,
                    'user_id' => $salon->owner_id,
                'full_name' => $employeeData['full_name'],
                'phone' => $employeeData['phone'],
                'note' => $employeeData['note'],
            ]);

                // Attach services from this salon
                $services = Service::where('salon_id', $salon->id)
                    ->whereIn('name', $employeeData['services'])
                    ->get();
            $employee->services()->attach($services->pluck('id'));

            Log::info('Seeding services for employee', [
                'employee' => $employee->full_name,
                    'salon' => $salon->name,
                'services_to_find' => $employeeData['services'],
                'services_found' => $services->pluck('name')->toArray(),
                'service_ids_attached' => $services->pluck('id')->toArray(),
            ]);

                $totalCreated++;
            }
            
            echo "   ✓ Created " . count($employees) . " employees for {$salon->name}\n";
            }

        echo "   👨‍💼 Created {$totalCreated} employees total\n";
    }
}
