<?php

// Script to clean up duplicate holidays
require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Cleaning up duplicate holidays...\n";

// Get all holidays
$holidays = \App\Models\Holiday::all();
echo "Found " . $holidays->count() . " holidays total\n";

// Remove holidays with datetime format (contains time)
$deleted = 0;
foreach ($holidays as $holiday) {
    if (strlen($holiday->id) > 10) { // Date format should be YYYY-MM-DD (10 chars)
        echo "Deleting holiday with datetime format: " . $holiday->id . "\n";
        $holiday->delete();
        $deleted++;
    }
}

echo "Deleted $deleted duplicate holidays\n";

// Show remaining holidays
$remaining = \App\Models\Holiday::all();
echo "Remaining holidays: " . $remaining->count() . "\n";

foreach ($remaining as $holiday) {
    echo "- " . $holiday->id . ": " . $holiday->name . "\n";
}

echo "Cleanup completed.\n"; 