<?php

echo "🔍 DEBUGGING API RESPONSES\n";
echo "==========================\n\n";

// Login and get tokens
function loginOwner($email, $password) {
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => 'http://127.0.0.1:8000/api/auth/login',
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => '',
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => 'POST',
        CURLOPT_POSTFIELDS => json_encode(['email' => $email, 'password' => $password]),
        CURLOPT_HTTPHEADER => ['Content-Type: application/json', 'Accept: application/json'],
    ]);
    
    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    
    $data = json_decode($response, true);
    if ($httpCode === 200 && isset($data['authorization']['token'])) {
        return $data['authorization']['token'];
    }
    return null;
}

function makeRequest($endpoint, $token) {
    $curl = curl_init();
    curl_setopt_array($curl, [
        CURLOPT_URL => "http://127.0.0.1:8000/api{$endpoint}",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => '',
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => 'GET',
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json',
            "Authorization: Bearer {$token}"
        ],
    ]);
    
    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    curl_close($curl);
    
    return ['http_code' => $httpCode, 'response' => $response, 'data' => json_decode($response, true)];
}

// Get tokens for both owners
echo "🔐 Getting authentication tokens...\n";
$token1 = loginOwner('owner@salon.com', 'password123');
$token2 = loginOwner('testsalon@example.com', 'password123');

if (!$token1 || !$token2) {
    echo "❌ Failed to get authentication tokens\n";
    exit(1);
}

echo "✅ Got tokens for both owners\n\n";

// Test Services API
echo "💇‍♀️ SERVICES API DEBUG:\n";
echo "========================\n";

echo "🏢 Salon 1 (Original Owner) Services:\n";
$result1 = makeRequest('/admin/services', $token1);
echo "HTTP Code: {$result1['http_code']}\n";
echo "Response Length: " . strlen($result1['response']) . " bytes\n";

if ($result1['data']) {
    if (isset($result1['data']['data'])) {
        echo "Services Count: " . count($result1['data']['data']) . "\n";
        echo "First Service Salon ID: " . ($result1['data']['data'][0]['salon_id'] ?? 'NOT SET') . "\n";
    } else {
        echo "Data Structure: " . json_encode(array_keys($result1['data'])) . "\n";
        echo "Raw response preview: " . substr($result1['response'], 0, 200) . "...\n";
    }
} else {
    echo "Response: " . substr($result1['response'], 0, 500) . "\n";
}

echo "\n🏢 Salon 2 (Test Owner) Services:\n";
$result2 = makeRequest('/admin/services', $token2);
echo "HTTP Code: {$result2['http_code']}\n";
echo "Response Length: " . strlen($result2['response']) . " bytes\n";

if ($result2['data']) {
    if (isset($result2['data']['data'])) {
        echo "Services Count: " . count($result2['data']['data']) . "\n";
        echo "First Service Salon ID: " . ($result2['data']['data'][0]['salon_id'] ?? 'NOT SET') . "\n";
    } else {
        echo "Data Structure: " . json_encode(array_keys($result2['data'])) . "\n";
        echo "Raw response preview: " . substr($result2['response'], 0, 200) . "...\n";
    }
} else {
    echo "Response: " . substr($result2['response'], 0, 500) . "\n";
}

echo "\n\n👨‍💼 EMPLOYEES API DEBUG:\n";
echo "=========================\n";

echo "🏢 Salon 1 (Original Owner) Employees:\n";
$result1 = makeRequest('/admin/employees', $token1);
echo "HTTP Code: {$result1['http_code']}\n";
if ($result1['data'] && isset($result1['data']['data'])) {
    echo "Employees Count: " . count($result1['data']['data']) . "\n";
    if (!empty($result1['data']['data'])) {
        echo "First Employee Salon ID: " . ($result1['data']['data'][0]['salon_id'] ?? 'NOT SET') . "\n";
        echo "Unique Salon IDs: " . json_encode(array_unique(array_column($result1['data']['data'], 'salon_id'))) . "\n";
    }
}

echo "\n🏢 Salon 2 (Test Owner) Employees:\n";
$result2 = makeRequest('/admin/employees', $token2);
echo "HTTP Code: {$result2['http_code']}\n";
if ($result2['data'] && isset($result2['data']['data'])) {
    echo "Employees Count: " . count($result2['data']['data']) . "\n";
    if (!empty($result2['data']['data'])) {
        echo "First Employee Salon ID: " . ($result2['data']['data'][0]['salon_id'] ?? 'NOT SET') . "\n";
        echo "Unique Salon IDs: " . json_encode(array_unique(array_column($result2['data']['data'], 'salon_id'))) . "\n";
    }
}

echo "\n\n📅 RESERVATIONS API DEBUG:\n";
echo "==========================\n";

echo "🏢 Salon 1 (Original Owner) Reservations:\n";
$result1 = makeRequest('/admin/reservations', $token1);
echo "HTTP Code: {$result1['http_code']}\n";
if ($result1['data'] && isset($result1['data']['data'])) {
    echo "Reservations Count: " . count($result1['data']['data']) . "\n";
    if (!empty($result1['data']['data'])) {
        echo "First Reservation Salon ID: " . ($result1['data']['data'][0]['salon_id'] ?? 'NOT SET') . "\n";
        echo "Unique Salon IDs: " . json_encode(array_unique(array_column($result1['data']['data'], 'salon_id'))) . "\n";
    }
}

echo "\n🏢 Salon 2 (Test Owner) Reservations:\n";
$result2 = makeRequest('/admin/reservations', $token2);
echo "HTTP Code: {$result2['http_code']}\n";
if ($result2['data'] && isset($result2['data']['data'])) {
    echo "Reservations Count: " . count($result2['data']['data']) . "\n";
    if (!empty($result2['data']['data'])) {
        echo "First Reservation Salon ID: " . ($result2['data']['data'][0]['salon_id'] ?? 'NOT SET') . "\n";
        echo "Unique Salon IDs: " . json_encode(array_unique(array_column($result2['data']['data'], 'salon_id'))) . "\n";
    }
}

echo "\n🎯 Debug completed!\n"; 