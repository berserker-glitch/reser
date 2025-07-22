<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Employee;
use App\Models\Service;
use App\Models\Reservation;
use App\Models\Salon;
use Carbon\Carbon;

class ReservationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "📅 Creating sample reservations...\n";
        
        // Get existing data
        $salons = Salon::all();

        if ($salons->isEmpty()) {
            echo "⚠️  No salons found. Skipping reservation creation.\n";
            return;
        }
        
        $totalCreated = 0;
        
        foreach ($salons as $salon) {
            $clients = User::where('role', 'CLIENT')->get();
            $employees = Employee::where('salon_id', $salon->id)->get();
            $services = Service::where('salon_id', $salon->id)->get();

            if ($employees->isEmpty() || $services->isEmpty()) {
                echo "   ⚠️  No employees or services found for {$salon->name}. Skipping.\n";
                continue;
            }
            
            $employee = $employees->first();

        // Create a client if none exist
        if ($clients->isEmpty()) {
            $client = User::create([
                'role' => 'CLIENT',
                'full_name' => 'Test Client',
                'email' => 'client@test.com',
                'phone' => '+212-600-000-002',
                'password' => bcrypt('password'),
            ]);
            $clients = collect([$client]);
        }

        $client = $clients->first();

        // Create reservations for today
        $today = Carbon::today();
        $service1 = $services->first();
        
            // Create some sample reservations for this salon
            if ($clients->isNotEmpty()) {
                $client = $clients->first();
                
                // Sample reservation 1
        Reservation::create([
                    'salon_id' => $salon->id,
            'client_id' => $client->id,
            'employee_id' => $employee->id,
            'service_id' => $service1->id,
            'start_at' => $today->copy()->setTime(10, 0),
            'end_at' => $today->copy()->setTime(11, 0),
                    'status' => 'CONFIRMED'
        ]);
                $totalCreated++;

                // Sample reservation 2
        Reservation::create([
                    'salon_id' => $salon->id,
                    'client_id' => $client->id,
            'employee_id' => $employee->id,
            'service_id' => $service1->id,
            'start_at' => $today->copy()->setTime(14, 30),
            'end_at' => $today->copy()->setTime(15, 30),
                    'status' => 'CONFIRMED'
        ]);
                $totalCreated++;
            }

        // Create reservations for tomorrow
        $tomorrow = Carbon::tomorrow();
            if ($services->count() > 1 && $clients->isNotEmpty()) {
            $service2 = $services->skip(1)->first();
                $client = $clients->first();
            
                // Another reservation for tomorrow
            Reservation::create([
                    'salon_id' => $salon->id,
                    'client_id' => $client->id,
                'employee_id' => $employee->id,
                'service_id' => $service2->id,
                'start_at' => $tomorrow->copy()->setTime(9, 0),
                'end_at' => $tomorrow->copy()->setTime(10, 0),
                    'status' => 'REQUESTED'
            ]);
                $totalCreated++;
            }
            
            echo "   ✓ Created sample reservations for {$salon->name}\n";
        }

        echo "   📅 Created {$totalCreated} reservations total\n";
    }
}
