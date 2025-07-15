<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
    public function run(): void
    {
        echo "🌱 Starting database seeding...\n\n";

        // Run seeders in proper order (dependencies first)
        $this->call([
            UserSeeder::class,
            ServiceSeeder::class,
            EmployeeSeeder::class,
        ]);

        echo "\n✅ Database seeding completed successfully!\n";
        echo "📋 Default credentials:\n";
        echo "   Owner: owner@salon.com / password123\n";
        echo "   Clients: fatima@example.com, amina@example.com, etc. / password123\n";
    }
}
