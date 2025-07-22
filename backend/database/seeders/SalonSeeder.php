<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\User;
use App\Models\Salon;

class SalonSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        echo "🏢 Creating salons...\n";

        // Get all owner users
        $owners = User::where('role', 'OWNER')->get();

        if ($owners->isEmpty()) {
            echo "⚠️  No owner users found. Skipping salon creation.\n";
            return;
        }

        $salons = [
            [
                'name' => 'Salon Elite Rabat',
                'description' => 'Un salon de beauté moderne et élégant au cœur de Rabat, offrant des services de coiffure, manucure et soins esthétiques de haute qualité.',
                'address' => '45 Avenue Mohammed V, Rabat 10000',
                'phone' => '+212 5 37 12 34 56',
                'email' => 'contact@salonelite.ma',
            ],
            [
                'name' => 'Beauty Center Casablanca',
                'description' => 'Centre de beauté complet proposant coiffure, maquillage, soins du visage et épilation dans un cadre luxueux.',
                'address' => '123 Boulevard Hassan II, Casablanca 20000',
                'phone' => '+212 5 22 98 76 54',
                'email' => 'info@beautycentercasa.ma',
            ],
            [
                'name' => 'Salon Amina Fès',
                'description' => 'Salon familial traditionnel avec une touche moderne, spécialisé dans les coiffures marocaines et les soins naturels.',
                'address' => '78 Rue Talaa Kebira, Fès 30000',
                'phone' => '+212 5 35 45 67 89',
                'email' => 'amina.salon@gmail.com',
            ]
        ];

        $createdSalons = [];
        
        foreach ($owners as $index => $owner) {
            if (isset($salons[$index])) {
                $salonData = $salons[$index];
                $salonData['owner_id'] = $owner->id;
                
                $salon = Salon::create($salonData);
                $createdSalons[] = $salon;
                
                echo "   ✓ Created salon: {$salon->name} (Owner: {$owner->full_name})\n";
            }
        }

        echo "   🏢 Created " . count($createdSalons) . " salons\n";
    }
} 