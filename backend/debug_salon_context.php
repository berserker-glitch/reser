<?php

require_once 'vendor/autoload.php';

// Load Laravel app
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Salon;

echo "🔍 DEBUGGING SALON CONTEXT LOGIC\n";
echo "================================\n\n";

// Get both owners
$owner1 = User::where('email', 'owner@salon.com')->first();
$owner2 = User::where('email', 'testsalon@example.com')->first();

if (!$owner1 || !$owner2) {
    echo "❌ Could not find owner users\n";
    exit(1);
}

echo "👤 Owner 1: {$owner1->full_name} (ID: {$owner1->id})\n";
echo "   Role: {$owner1->role}\n";
echo "   Salon: " . ($owner1->salon ? $owner1->salon->name . " (ID: {$owner1->salon->id})" : "NONE") . "\n\n";

echo "👤 Owner 2: {$owner2->full_name} (ID: {$owner2->id})\n";
echo "   Role: {$owner2->role}\n";
echo "   Salon: " . ($owner2->salon ? $owner2->salon->name . " (ID: {$owner2->salon->id})" : "NONE") . "\n\n";

// Test salon data isolation at database level
echo "🗃️  DATABASE LEVEL ISOLATION TEST:\n";
echo "==================================\n";

$salon1 = Salon::find(1);
$salon2 = Salon::find(2);

if ($salon1) {
    echo "🏢 Salon 1: {$salon1->name}\n";
    echo "   Services: " . $salon1->services()->count() . "\n";
    echo "   Employees: " . $salon1->employees()->count() . "\n";
    echo "   Reservations: " . $salon1->reservations()->count() . "\n";
}

if ($salon2) {
    echo "\n🏢 Salon 2: {$salon2->name}\n";
    echo "   Services: " . $salon2->services()->count() . "\n";
    echo "   Employees: " . $salon2->employees()->count() . "\n";
    echo "   Reservations: " . $salon2->reservations()->count() . "\n";
}

// Test direct queries
echo "\n🔍 DIRECT QUERY TEST:\n";
echo "=====================\n";

$salon1Services = \App\Models\Service::where('salon_id', 1)->count();
$salon2Services = \App\Models\Service::where('salon_id', 2)->count();

echo "Services for Salon 1: {$salon1Services}\n";
echo "Services for Salon 2: {$salon2Services}\n";

$salon1Employees = \App\Models\Employee::where('salon_id', 1)->count();
$salon2Employees = \App\Models\Employee::where('salon_id', 2)->count();

echo "Employees for Salon 1: {$salon1Employees}\n";
echo "Employees for Salon 2: {$salon2Employees}\n";

$salon1Reservations = \App\Models\Reservation::where('salon_id', 1)->count();
$salon2Reservations = \App\Models\Reservation::where('salon_id', 2)->count();

echo "Reservations for Salon 1: {$salon1Reservations}\n";
echo "Reservations for Salon 2: {$salon2Reservations}\n";

echo "\n🎯 Debug completed!\n"; 