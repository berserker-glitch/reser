<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Employee;
use App\Models\Service;
use App\Models\Reservation;
use Carbon\Carbon;

class ReservationSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Get existing data
        $clients = User::where('role', 'CLIENT')->get();
        $employee = Employee::first();
        $services = Service::all();

        if (!$employee || $services->isEmpty()) {
            $this->command->error('No employees or services found. Please run other seeders first.');
            return;
        }

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
        
        // Online reservation (existing client)
        Reservation::create([
            'client_id' => $client->id,
            'employee_id' => $employee->id,
            'service_id' => $service1->id,
            'start_at' => $today->copy()->setTime(10, 0),
            'end_at' => $today->copy()->setTime(11, 0),
            'status' => 'CONFIRMED',
            'type' => 'online'
        ]);

        // Manual reservation (admin created for someone)
        Reservation::create([
            'client_id' => null, // No registered user
            'employee_id' => $employee->id,
            'service_id' => $service1->id,
            'start_at' => $today->copy()->setTime(14, 30),
            'end_at' => $today->copy()->setTime(15, 30),
            'status' => 'CONFIRMED',
            'type' => 'manual',
            'client_full_name' => 'Sara Benjelloun',
            'client_phone' => '+212 6 98 76 54 32'
        ]);

        // Create reservations for tomorrow
        $tomorrow = Carbon::tomorrow();
        if ($services->count() > 1) {
            $service2 = $services->skip(1)->first();
            
            // Another manual reservation for tomorrow
            Reservation::create([
                'client_id' => null,
                'employee_id' => $employee->id,
                'service_id' => $service2->id,
                'start_at' => $tomorrow->copy()->setTime(9, 0),
                'end_at' => $tomorrow->copy()->setTime(10, 0),
                'status' => 'REQUESTED',
                'type' => 'manual',
                'client_full_name' => 'Ahmed Tazi',
                'client_phone' => '+212 7 11 22 33 44'
            ]);
        }

        $this->command->info('Created sample reservations for today and tomorrow');
    }
}
