<?php

// Test script to check working hours using Laravel context
require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Working Hours: " . \App\Models\WorkingHour::count(); 