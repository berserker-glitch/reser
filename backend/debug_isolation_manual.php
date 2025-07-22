<?php

echo "🔍 MANUAL ISOLATION TEST DEBUG\n";
echo "==============================\n\n";

// Copy the exact same functions from isolation test
function makeAuthenticatedRequest($endpoint, $token, $method = 'GET', $data = null) {
    $curl = curl_init();
    
    $curlOptions = [
        CURLOPT_URL => "http://127.0.0.1:8000/api{$endpoint}",
        CURLOPT_RETURNTRANSFER => true,
        CURLOPT_ENCODING => '',
        CURLOPT_MAXREDIRS => 10,
        CURLOPT_TIMEOUT => 10,
        CURLOPT_FOLLOWLOCATION => true,
        CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
        CURLOPT_CUSTOMREQUEST => $method,
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json',
            "Authorization: Bearer {$token}"
        ],
    ];
    
    if ($data && in_array($method, ['POST', 'PUT', 'PATCH'])) {
        $curlOptions[CURLOPT_POSTFIELDS] = json_encode($data);
    }
    
    curl_setopt_array($curl, $curlOptions);
    
    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_error($curl);
    
    curl_close($curl);
    
    if ($error) {
        return ['error' => $error, 'http_code' => 0];
    }
    
    return [
        'http_code' => $httpCode,
        'data' => json_decode($response, true),
        'raw' => $response
    ];
}

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
        CURLOPT_POSTFIELDS => json_encode([
            'email' => $email,
            'password' => $password
        ]),
        CURLOPT_HTTPHEADER => [
            'Content-Type: application/json',
            'Accept: application/json'
        ],
    ]);
    
    $response = curl_exec($curl);
    $httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
    $error = curl_error($curl);
    
    curl_close($curl);
    
    if ($error) {
        return ['error' => $error];
    }
    
    $data = json_decode($response, true);
    
    if ($httpCode === 200 && isset($data['authorization']['token'])) {
        return [
            'success' => true,
            'token' => $data['authorization']['token'],
            'user' => $data['user'],
            'salon' => $data['salon'] ?? null
        ];
    }
    
    return ['error' => 'Login failed', 'data' => $data];
}

// Test login
echo "🔐 Logging in owner@salon.com...\n";
$loginResult = loginOwner('owner@salon.com', 'password123');

if (!isset($loginResult['success'])) {
    echo "❌ Login failed\n";
    exit(1);
}

$token = $loginResult['token'];
echo "✅ Login successful\n";
echo "🔑 Token (first 20 chars): " . substr($token, 0, 20) . "...\n";
echo "🏢 Salon: " . ($loginResult['salon']['name'] ?? 'NONE') . "\n\n";

// Test employees endpoint using same function
echo "👨‍💼 Testing /admin/employees...\n";
$result = makeAuthenticatedRequest('/admin/employees', $token);

echo "📊 HTTP Code: {$result['http_code']}\n";
echo "📊 Response keys: " . json_encode(array_keys($result['data'] ?? [])) . "\n";

if (isset($result['data']['data'])) {
    $employees = $result['data']['data'];
    echo "📊 Employee count: " . count($employees) . "\n";
    
    if (!empty($employees)) {
        echo "📊 First employee salon_id: " . ($employees[0]['salon_id'] ?? 'NULL') . "\n";
        echo "📊 All salon_ids: " . json_encode(array_column($employees, 'salon_id')) . "\n";
    }
}

echo "\n🎯 Debug completed!\n"; 