<?php

echo "🔍 DEBUGGING EMPLOYEE RESPONSE STRUCTURE\n";
echo "=========================================\n\n";

// Login first
function loginOwner($email, $password) {
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

$token = loginOwner('owner@salon.com', 'password123');

if (!$token) {
    echo "❌ Failed to get token\n";
    exit(1);
}

echo "✅ Got token\n\n";

// Test employee endpoint
$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => 'http://127.0.0.1:8000/api/admin/employees',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_HTTPHEADER => [
        'Content-Type: application/json',
        "Authorization: Bearer {$token}"
    ],
]);

$response = curl_exec($curl);
$httpCode = curl_getinfo($curl, CURLINFO_HTTP_CODE);
curl_close($curl);

echo "HTTP Code: {$httpCode}\n";
echo "Raw Response (first 1000 chars):\n";
echo substr($response, 0, 1000) . "\n\n";

$data = json_decode($response, true);

if ($data) {
    echo "Response Structure:\n";
    print_r(array_keys($data));
    
    if (isset($data['data'])) {
        echo "\nData Structure:\n";
        if (isset($data['data']['data'])) {
            echo "Paginated data - checking first employee:\n";
            $firstEmployee = $data['data']['data'][0] ?? null;
            if ($firstEmployee) {
                echo "First Employee Keys: " . json_encode(array_keys($firstEmployee)) . "\n";
                echo "Salon ID: " . ($firstEmployee['salon_id'] ?? 'NOT FOUND') . "\n";
                echo "Full Name: " . ($firstEmployee['full_name'] ?? 'NOT FOUND') . "\n";
            }
        } else {
            echo "Direct data - checking first employee:\n";
            $firstEmployee = $data['data'][0] ?? null;
            if ($firstEmployee) {
                echo "First Employee Keys: " . json_encode(array_keys($firstEmployee)) . "\n";
                echo "Salon ID: " . ($firstEmployee['salon_id'] ?? 'NOT FOUND') . "\n";
            }
        }
    }
}

echo "\n🎯 Debug completed!\n"; 