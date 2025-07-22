<?php

require_once 'vendor/autoload.php';

// Load Laravel app
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Employee;
use App\Models\Reservation;
use Illuminate\Support\Facades\DB;

echo "🔍 CHECKING FOR MISSING SALON_ID VALUES\n";
echo "======================================\n\n";

// Check employees with NULL or missing salon_id
echo "👨‍💼 EMPLOYEES TABLE:\n";
$employeesTotal = Employee::count();
$employeesWithSalonId = Employee::whereNotNull('salon_id')->count();
$employeesWithoutSalonId = Employee::whereNull('salon_id')->count();

echo "   Total employees: {$employeesTotal}\n";
echo "   With salon_id: {$employeesWithSalonId}\n";
echo "   Without salon_id (NULL): {$employeesWithoutSalonId}\n";

if ($employeesWithoutSalonId > 0) {
    echo "   ❌ Found employees with NULL salon_id:\n";
    $nullEmployees = Employee::whereNull('salon_id')->get(['id', 'full_name', 'salon_id']);
    foreach ($nullEmployees as $emp) {
        echo "      ID {$emp->id}: {$emp->full_name} (salon_id: {$emp->salon_id})\n";
    }
}

// Check salon_id distribution
echo "\n   📊 Salon ID Distribution:\n";
$salonDistribution = Employee::select('salon_id', DB::raw('count(*) as count'))
    ->groupBy('salon_id')
    ->get();
foreach ($salonDistribution as $dist) {
    echo "      Salon {$dist->salon_id}: {$dist->count} employees\n";
}

echo "\n📅 RESERVATIONS TABLE:\n";
$reservationsTotal = Reservation::count();
$reservationsWithSalonId = Reservation::whereNotNull('salon_id')->count();
$reservationsWithoutSalonId = Reservation::whereNull('salon_id')->count();

echo "   Total reservations: {$reservationsTotal}\n";
echo "   With salon_id: {$reservationsWithSalonId}\n";
echo "   Without salon_id (NULL): {$reservationsWithoutSalonId}\n";

if ($reservationsWithoutSalonId > 0) {
    echo "   ❌ Found reservations with NULL salon_id:\n";
    $nullReservations = Reservation::whereNull('salon_id')->get(['id', 'client_id', 'service_id', 'salon_id']);
    foreach ($nullReservations as $res) {
        echo "      ID {$res->id}: Client {$res->client_id}, Service {$res->service_id} (salon_id: {$res->salon_id})\n";
    }
}

// Check salon_id distribution for reservations
echo "\n   📊 Salon ID Distribution:\n";
$reservationDistribution = Reservation::select('salon_id', DB::raw('count(*) as count'))
    ->groupBy('salon_id')
    ->get();
foreach ($reservationDistribution as $dist) {
    echo "      Salon {$dist->salon_id}: {$dist->count} reservations\n";
}

echo "\n🎯 Debug completed!\n"; 