<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\User;

class UserSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Create salon owner account
        User::create([
            'role' => 'OWNER',
            'full_name' => 'Salon Owner',
            'email' => 'owner@salon.com',
            'phone' => '+212-600-000-001',
            'password' => password_hash('password123', PASSWORD_DEFAULT),
        ]);

        // Create sample client accounts
        User::create([
            'role' => 'CLIENT',
            'full_name' => 'Fatima Zahra',
            'email' => 'fatima@example.com',
            'phone' => '+212-600-000-002',
            'password' => password_hash('password123', PASSWORD_DEFAULT),
        ]);

        User::create([
            'role' => 'CLIENT',
            'full_name' => 'Amina Benali',
            'email' => 'amina@example.com',
            'phone' => '+212-600-000-003',
            'password' => password_hash('password123', PASSWORD_DEFAULT),
        ]);

        User::create([
            'role' => 'CLIENT',
            'full_name' => 'Khadija Alami',
            'email' => 'khadija@example.com',
            'phone' => '+212-600-000-004',
            'password' => password_hash('password123', PASSWORD_DEFAULT),
        ]);

        User::create([
            'role' => 'CLIENT',
            'full_name' => 'Aicha Lahlou',
            'email' => 'aicha@example.com',
            'phone' => '+212-600-000-005',
            'password' => password_hash('password123', PASSWORD_DEFAULT),
        ]);

        echo "✓ Users seeded successfully\n";
    }
}
