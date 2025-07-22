<?php

echo "🔍 RAW API RESPONSE DEBUG\n";
echo "=========================\n\n";

// Get token
$curl = curl_init();
curl_setopt_array($curl, [
    CURLOPT_URL => 'http://127.0.0.1:8000/api/auth/login',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_POSTFIELDS => json_encode(['email' => 'owner@salon.com', 'password' => 'password123']),
    CURLOPT_HTTPHEADER => ['Content-Type: application/json'],
]);

$response = curl_exec($curl);
$data = json_decode($response, true);
curl_close($curl);

$token = $data['authorization']['token'] ?? null;

if (!$token) {
    echo "❌ Failed to get token\n";
    exit(1);
}

echo "✅ Got token for Salon 1 owner\n\n";

// Call employees endpoint
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

echo "📡 RAW RESPONSE FROM /admin/employees:\n";
echo "HTTP Code: {$httpCode}\n";
echo "Response Length: " . strlen($response) . " bytes\n\n";

echo "First 2000 characters:\n";
echo substr($response, 0, 2000) . "\n\n";

$data = json_decode($response, true);
if ($data && isset($data['data']['data'])) {
    echo "📊 PARSED DATA ANALYSIS:\n";
    $employees = $data['data']['data'];
    echo "Total employees returned: " . count($employees) . "\n";
    
    if (!empty($employees)) {
        echo "\nFirst employee structure:\n";
        $first = $employees[0];
        echo "Keys: " . json_encode(array_keys($first)) . "\n";
        echo "salon_id: " . ($first['salon_id'] ?? 'NULL') . "\n";
        echo "full_name: " . ($first['full_name'] ?? 'NULL') . "\n";
        echo "id: " . ($first['id'] ?? 'NULL') . "\n";
        
        echo "\nAll salon_id values:\n";
        foreach ($employees as $index => $emp) {
            echo "   Employee {$index}: salon_id = " . ($emp['salon_id'] ?? 'NULL') . "\n";
        }
    }
}

echo "\n🎯 Debug completed!\n"; 