<?php

echo "🧪 Testing Salon Signup API Endpoint\n";
echo "=====================================\n\n";

// Test data for a new salon owner
$testData = [
    'role' => 'OWNER',
    'full_name' => 'Test Salon Owner',
    'email' => 'testsalon@example.com',
    'phone' => '+212-600-999-999',
    'password' => 'password123',
    'password_confirmation' => 'password123',
    'salon_name' => 'Test Beauty Salon',
    'salon_description' => 'A test salon for our system',
    'salon_address' => '123 Test Street, Casablanca',
    'salon_phone' => '+212-500-999-999',
    'salon_email' => 'contact@testsalon.com',
];

// Convert to JSON
$jsonData = json_encode($testData);

// Use cURL to test the API
$curl = curl_init();

curl_setopt_array($curl, [
    CURLOPT_URL => 'http://127.0.0.1:8000/api/auth/register',
    CURLOPT_RETURNTRANSFER => true,
    CURLOPT_ENCODING => '',
    CURLOPT_MAXREDIRS => 10,
    CURLOPT_TIMEOUT => 0,
    CURLOPT_FOLLOWLOCATION => true,
    CURLOPT_HTTP_VERSION => CURL_HTTP_VERSION_1_1,
    CURLOPT_CUSTOMREQUEST => 'POST',
    CURLOPT_POSTFIELDS => $jsonData,
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
    echo "❌ cURL Error: " . $error . "\n";
    exit(1);
}

echo "📡 HTTP Status Code: {$httpCode}\n";
echo "📋 Response:\n";
echo "---\n";

if ($response) {
    $responseData = json_decode($response, true);
    
    if ($responseData) {
        // Pretty print the response
        echo json_encode($responseData, JSON_PRETTY_PRINT);
        echo "\n---\n\n";
        
        if ($httpCode === 201 && $responseData['success']) {
            echo "✅ SUCCESS! Salon owner created successfully\n";
            
            if (isset($responseData['user'])) {
                echo "👤 Owner: {$responseData['user']['full_name']} ({$responseData['user']['email']})\n";
                echo "🔑 Role: {$responseData['user']['role']}\n";
            }
            
            if (isset($responseData['salon'])) {
                echo "🏢 Salon: {$responseData['salon']['name']}\n";
                echo "📧 Salon Email: {$responseData['salon']['email']}\n";
                echo "📱 Salon Phone: {$responseData['salon']['phone']}\n";
            }
            
            if (isset($responseData['authorization']['token'])) {
                echo "🎫 JWT Token: " . substr($responseData['authorization']['token'], 0, 20) . "...\n";
            }
            
        } else {
            echo "❌ FAILED! Registration was not successful\n";
            if (isset($responseData['message'])) {
                echo "📄 Message: {$responseData['message']}\n";
            }
            if (isset($responseData['errors'])) {
                echo "🚨 Errors:\n";
                foreach ($responseData['errors'] as $field => $messages) {
                    echo "   {$field}: " . implode(', ', $messages) . "\n";
                }
            }
        }
    } else {
        echo "Raw response: " . $response . "\n";
    }
} else {
    echo "❌ No response received\n";
}

echo "\n🎯 Test completed!\n"; 