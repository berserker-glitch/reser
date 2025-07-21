<?php

require_once 'vendor/autoload.php';

use Illuminate\Foundation\Application;
use App\Models\User;
use Illuminate\Support\Facades\Hash;

// Bootstrap Laravel
$app = require_once 'bootstrap/app.php';
$app->make('Illuminate\Contracts\Console\Kernel')->bootstrap();

echo "=== EXISTING USERS ===\n";
$users = User::all(['id', 'email', 'role']);
foreach ($users as $user) {
    echo "ID: {$user->id}, Email: {$user->email}, Role: {$user->role}\n";
}

echo "\n=== CREATING TEST CLIENT ===\n";

// Check if test client already exists
$testClient = User::where('email', 'client@test.com')->first();

if ($testClient) {
    echo "Test client already exists: {$testClient->email}\n";
} else {
    // Create test client
    $testClient = User::create([
        'full_name' => 'Test Client',
        'email' => 'client@test.com',
        'password' => Hash::make('password123'),
        'role' => 'CLIENT',
        'phone' => '0612345678'
    ]);
    
    echo "✅ Test client created: {$testClient->email}\n";
}

echo "\nTest credentials:\n";
echo "Email: client@test.com\n";
echo "Password: password123\n";
echo "Role: CLIENT\n";

echo "\nDone.\n"; 