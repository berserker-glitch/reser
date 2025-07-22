<?php

require_once 'vendor/autoload.php';

// Load Laravel app
$app = require_once 'bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\User;
use App\Models\Salon;
use App\Models\Service;
use App\Models\Employee;

echo "🧪 Testing Salon Architecture...\n\n";

try {
    // Test 1: Check if tables exist by querying them
    echo "1. Testing database tables...\n";
    
    $userCount = User::count();
    echo "   ✓ Users table: {$userCount} records\n";
    
    $salonCount = Salon::count();
    echo "   ✓ Salons table: {$salonCount} records\n";
    
    $serviceCount = Service::count();
    echo "   ✓ Services table: {$serviceCount} records\n";
    
    $employeeCount = Employee::count();
    echo "   ✓ Employees table: {$employeeCount} records\n";
    
    echo "\n2. Testing relationships...\n";
    
    // Test salon-owner relationship
    $owner = User::where('role', 'OWNER')->first();
    if ($owner) {
        $salon = $owner->salon;
        if ($salon) {
            echo "   ✓ Owner-Salon relationship: {$owner->full_name} owns {$salon->name}\n";
        } else {
            echo "   ⚠️  Owner has no salon\n";
        }
    } else {
        echo "   ⚠️  No owner found\n";
    }
    
    // Test salon services
    $salon = Salon::first();
    if ($salon) {
        $servicesCount = $salon->services()->count();
        echo "   ✓ Salon-Services relationship: {$salon->name} has {$servicesCount} services\n";
    }
    
    echo "\n✅ Architecture test completed successfully!\n";
    
} catch (Exception $e) {
    echo "\n❌ Error testing architecture: " . $e->getMessage() . "\n";
    echo "Stack trace: " . $e->getTraceAsString() . "\n";
} 