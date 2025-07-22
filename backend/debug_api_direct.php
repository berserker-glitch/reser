<?php

echo "🔍 DIRECT API ENDPOINT DEBUG\n";
echo "============================\n\n";

// Login function
function getToken($email, $password) {
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
    
    return $data['authorization']['token'] ?? null;
}

function makeApiCall($endpoint, $token) {
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
    
    return ['code' => $httpCode, 'response' => $response, 'data' => json_decode($response, true)];
}

// Get tokens
echo "🔐 Getting tokens...\n";
$token1 = getToken('owner@salon.com', 'password123');
$token2 = getToken('testsalon@example.com', 'password123');

if (!$token1 || !$token2) {
    echo "❌ Failed to get tokens\n";
    exit(1);
}

echo "✅ Got both tokens\n\n";

// Test each endpoint
$endpoints = [
    '/admin/employees' => 'Employees',
    '/admin/reservations' => 'Reservations'
];

foreach ($endpoints as $endpoint => $name) {
    echo "🔍 Testing {$name} endpoint: {$endpoint}\n";
    echo str_repeat("-", 40) . "\n";
    
    // Test for Salon 1 owner
    echo "👤 Salon 1 Owner:\n";
    $result1 = makeApiCall($endpoint, $token1);
    echo "   HTTP: {$result1['code']}\n";
    
    if ($result1['data']) {
        if (isset($result1['data']['data'])) {
            $items = $result1['data']['data'];
            echo "   Count: " . count($items) . "\n";
            
            if (!empty($items)) {
                $firstItem = $items[0];
                echo "   First item salon_id: " . ($firstItem['salon_id'] ?? 'NULL') . "\n";
                
                // Check unique salon_ids
                $salonIds = array_unique(array_column($items, 'salon_id'));
                echo "   Unique salon_ids: " . json_encode($salonIds) . "\n";
            }
        }
    }
    
    // Test for Salon 2 owner
    echo "\n👤 Salon 2 Owner:\n";
    $result2 = makeApiCall($endpoint, $token2);
    echo "   HTTP: {$result2['code']}\n";
    
    if ($result2['data']) {
        if (isset($result2['data']['data'])) {
            $items = $result2['data']['data'];
            echo "   Count: " . count($items) . "\n";
            
            if (!empty($items)) {
                $firstItem = $items[0];
                echo "   First item salon_id: " . ($firstItem['salon_id'] ?? 'NULL') . "\n";
                
                // Check unique salon_ids
                $salonIds = array_unique(array_column($items, 'salon_id'));
                echo "   Unique salon_ids: " . json_encode($salonIds) . "\n";
            }
        }
    }
    
    echo "\n" . str_repeat("=", 50) . "\n\n";
}

echo "🎯 Debug completed!\n"; 