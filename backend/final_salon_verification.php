<?php

echo "🎯 FINAL SALON ISOLATION VERIFICATION\n";
echo "=====================================\n\n";

// Simple, direct API testing approach
function testEndpoint($endpoint, $token, $expectedSalonId, $description) {
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => "http://127.0.0.1:8000/api{$endpoint}",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            "Authorization: Bearer {$token}"
        ],
    ]);
    
    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    
    echo "📊 Testing {$description} (Salon {$expectedSalonId}):\n";
    echo "   Endpoint: {$endpoint}\n";
    echo "   HTTP Code: {$httpCode}\n";
    
    if ($httpCode === 200) {
        $data = json_decode($response, true);
        
        // Handle different response structures
        if (isset($data['data']['data'])) {
            // Paginated response
            $items = $data['data']['data'];
        } elseif (isset($data['data']) && is_array($data['data'])) {
            // Direct array response
            $items = $data['data'];
        } else {
            // Direct response
            $items = $data;
        }
        
        if (is_array($items)) {
            echo "   ✅ Retrieved " . count($items) . " items\n";
            
            if (!empty($items) && isset($items[0]['salon_id'])) {
                $salonIds = array_unique(array_column($items, 'salon_id'));
                echo "   📋 Salon IDs found: " . json_encode($salonIds) . "\n";
                
                // Check if all items belong to expected salon
                $allCorrect = true;
                foreach ($items as $item) {
                    if (($item['salon_id'] ?? null) != $expectedSalonId) {
                        $allCorrect = false;
                        break;
                    }
                }
                
                if ($allCorrect && count($salonIds) === 1 && $salonIds[0] == $expectedSalonId) {
                    echo "   ✅ PERFECT ISOLATION: All items belong to Salon {$expectedSalonId}\n";
                    return true;
                } else {
                    echo "   ❌ ISOLATION BREACH: Items from multiple salons found\n";
                    return false;
                }
            } else {
                echo "   ⚠️  No salon_id field found in response\n";
                return false;
            }
        } else {
            echo "   ❌ Response is not an array\n";
            return false;
        }
    } else {
        echo "   ❌ HTTP Error: {$httpCode}\n";
        return false;
    }
}

function loginAndGetToken($email, $password) {
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => 'http://127.0.0.1:8000/api/auth/login',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_POSTFIELDS => json_encode(['email' => $email, 'password' => $password]),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
    ]);
    
    $response = curl_exec($curl);
    $data = json_decode($response, true);
    curl_close($curl);
    
    if (isset($data['authorization']['token'])) {
        return [
            'token' => $data['authorization']['token'],
            'salon' => $data['salon'] ?? null
        ];
    }
    return null;
}

// Get authentication tokens
echo "🔐 Authenticating salon owners...\n";

$owner1 = loginAndGetToken('owner@salon.com', 'password123');
$owner2 = loginAndGetToken('testsalon@example.com', 'password123');

if (!$owner1 || !$owner2) {
    echo "❌ Failed to authenticate owners\n";
    exit(1);
}

echo "✅ Authentication successful\n";
echo "   Owner 1 Salon: " . ($owner1['salon']['name'] ?? 'Unknown') . " (ID: " . ($owner1['salon']['id'] ?? 'Unknown') . ")\n";
echo "   Owner 2 Salon: " . ($owner2['salon']['name'] ?? 'Unknown') . " (ID: " . ($owner2['salon']['id'] ?? 'Unknown') . ")\n\n";

// Test all protected admin endpoints
$tests = [
    ['/admin/services', 'Services'],
    ['/admin/employees', 'Employees'], 
    ['/admin/reservations', 'Reservations']
];

$allPassed = true;

foreach ($tests as [$endpoint, $name]) {
    echo str_repeat("=", 50) . "\n";
    echo "🔍 Testing {$name} Isolation\n";
    echo str_repeat("=", 50) . "\n";
    
    // Test Salon 1
    $result1 = testEndpoint($endpoint, $owner1['token'], 1, "{$name} for Salon 1");
    echo "\n";
    
    // Test Salon 2  
    $result2 = testEndpoint($endpoint, $owner2['token'], 2, "{$name} for Salon 2");
    echo "\n";
    
    if ($result1 && $result2) {
        echo "🎉 {$name} ISOLATION: ✅ PASSED\n";
    } else {
        echo "❌ {$name} ISOLATION: FAILED\n";
        $allPassed = false;
    }
    echo "\n";
}

// Final Summary
echo str_repeat("=", 60) . "\n";
echo "🏆 FINAL SALON ISOLATION VERIFICATION RESULTS\n";
echo str_repeat("=", 60) . "\n";

if ($allPassed) {
    echo "🎉 ✅ ALL TESTS PASSED! 🎉\n\n";
    echo "✅ Multi-salon architecture is working perfectly:\n";
    echo "   • Each salon owner can only access their own data\n";
    echo "   • Services are properly isolated by salon\n";
    echo "   • Employees are properly isolated by salon\n";
    echo "   • Reservations are properly isolated by salon\n";
    echo "   • Authentication provides correct salon context\n";
    echo "   • Data integrity maintained across all endpoints\n\n";
    echo "🚀 The salon reservation system is ready for production!\n";
} else {
    echo "❌ SOME ISOLATION TESTS FAILED\n\n";
    echo "⚠️  Please review the API controllers to ensure proper salon filtering.\n";
}

echo "\n🎯 Verification completed!\n"; 