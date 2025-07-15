<?php

namespace Database\Seeders;

use Illuminate\Database\Console\Seeds\WithoutModelEvents;
use Illuminate\Database\Seeder;
use App\Models\Service;

class ServiceSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        $services = [
            [
                'name' => 'Coupe Femme',
                'description' => 'Coupe de cheveux pour femmes avec brushing',
                'duration_min' => 60,
                'price_dhs' => 150.00,
            ],
            [
                'name' => 'Coupe Homme',
                'description' => 'Coupe de cheveux pour hommes avec finition',
                'duration_min' => 30,
                'price_dhs' => 80.00,
            ],
            [
                'name' => 'Coloration',
                'description' => 'Coloration complète des cheveux',
                'duration_min' => 120,
                'price_dhs' => 300.00,
            ],
            [
                'name' => 'Mèches',
                'description' => 'Mèches et balayage',
                'duration_min' => 90,
                'price_dhs' => 250.00,
            ],
            [
                'name' => 'Brushing',
                'description' => 'Brushing et mise en forme',
                'duration_min' => 45,
                'price_dhs' => 100.00,
            ],
            [
                'name' => 'Défrisage',
                'description' => 'Défrisage et lissage des cheveux',
                'duration_min' => 180,
                'price_dhs' => 400.00,
            ],
            [
                'name' => 'Soins Capillaires',
                'description' => 'Masque et soin pour cheveux',
                'duration_min' => 60,
                'price_dhs' => 120.00,
            ],
            [
                'name' => 'Mise en Plis',
                'description' => 'Mise en plis et coiffure',
                'duration_min' => 75,
                'price_dhs' => 130.00,
            ],
            [
                'name' => 'Épilation Sourcils',
                'description' => 'Épilation et restructuration des sourcils',
                'duration_min' => 30,
                'price_dhs' => 50.00,
            ],
            [
                'name' => 'Barbe',
                'description' => 'Taille et soin de la barbe',
                'duration_min' => 30,
                'price_dhs' => 60.00,
            ],
        ];

        foreach ($services as $service) {
            Service::create($service);
        }

        echo "✓ Services seeded successfully\n";
    }
}
