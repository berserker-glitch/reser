<?php

// Test script to check holidays using Laravel context
require_once 'vendor/autoload.php';

$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "Holidays: " . \App\Models\Holiday::count(); 