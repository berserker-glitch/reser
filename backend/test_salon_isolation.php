<?php

echo "🔒 SALON DATA ISOLATION TEST\n";
echo "============================\n\n";

// Test data for different salon owners
$owners = [
    [
        'email' => 'owner@salon.com',
        'password' => 'password123',
        'name' => 'Original Salon Owner',
        'expected_salon' => 'Salon Elite Rabat'
    ],
    [
        'email' => 'testsalon@example.com', 
        'password' => 'password123',
        'name' => 'Test Salon Owner',
        'expected_salon' => 'Test Beauty Salon'
    ]
];

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

$testResults = [];
$tokens = [];

// Step 1: Login both owners and get their tokens
echo "🔐 Step 1: Authenticating salon owners...\n";
foreach ($owners as $index => $owner) {
    echo "   Logging in: {$owner['name']} ({$owner['email']})\n";
    
    $loginResult = loginOwner($owner['email'], $owner['password']);
    
    if (isset($loginResult['success'])) {
        $tokens[$index] = $loginResult['token'];
        echo "   ✅ Success! Token obtained for {$owner['name']}\n";
        echo "   🔑 Token (first 20 chars): " . substr($loginResult['token'], 0, 20) . "...\n";
        
        // Verify salon context
        if ($loginResult['salon'] && $loginResult['salon']['name'] === $owner['expected_salon']) {
            echo "   ✅ Correct salon context: {$loginResult['salon']['name']}\n";
        } else {
            echo "   ❌ Wrong salon context! Expected: {$owner['expected_salon']}\n";
            $testResults[] = "❌ Salon context mismatch for {$owner['name']}";
        }
    } else {
        echo "   ❌ Login failed for {$owner['name']}: " . ($loginResult['error'] ?? 'Unknown error') . "\n";
        $testResults[] = "❌ Login failed for {$owner['name']}";
    }
}

echo "\n";

// Step 2: Test Services Isolation
echo "💇‍♀️ Step 2: Testing Services Isolation...\n";
foreach ($owners as $index => $owner) {
    if (!isset($tokens[$index])) continue;
    
    echo "   Testing services for {$owner['name']}...\n";
    
    $servicesResult = makeAuthenticatedRequest('/admin/services', $tokens[$index]);
    
    if ($servicesResult['http_code'] === 200 && $servicesResult['data']) {
        // Services API returns direct array, not paginated data
        $services = is_array($servicesResult['data']) && isset($servicesResult['data']['data']) 
            ? $servicesResult['data']['data'] 
            : $servicesResult['data'];
        echo "   ✅ Retrieved " . count($services) . " services\n";
        
        // Verify all services belong to the correct salon
        $salonMismatch = false;
        $expectedSalonId = ($index + 1); // Owner 1 -> Salon 1, Owner 2 -> Salon 2
        foreach ($services as $service) {
            if (!isset($service['salon_id']) || $service['salon_id'] != $expectedSalonId) {
                $salonMismatch = true;
                break;
            }
        }
        
        if (!$salonMismatch && count($services) > 0) {
            echo "   ✅ All services properly scoped to salon {$expectedSalonId}\n";
        } else if (count($services) === 0) {
            echo "   ⚠️  No services found for this salon\n";
        } else {
            echo "   ❌ Services not properly scoped to salon!\n";
            $testResults[] = "❌ Services isolation failed for {$owner['name']}";
        }
    } else {
        echo "   ❌ Failed to retrieve services: HTTP {$servicesResult['http_code']}\n";
        $testResults[] = "❌ Services API failed for {$owner['name']}";
    }
}

echo "\n";

// Step 3: Test Employees Isolation
echo "👨‍💼 Step 3: Testing Employees Isolation...\n";
foreach ($owners as $index => $owner) {
    if (!isset($tokens[$index])) continue;
    
    echo "   Testing employees for {$owner['name']}...\n";
    echo "   🌐 Calling: /admin/employees with token " . substr($tokens[$index], 0, 20) . "...\n";
    
    $employeesResult = makeAuthenticatedRequest('/admin/employees', $tokens[$index]);
    
    if ($employeesResult['http_code'] === 200) {
        echo "   📊 Response structure: " . json_encode(array_keys($employeesResult['data'] ?? [])) . "\n";
        
        if (isset($employeesResult['data']['data'])) {
            $employees = $employeesResult['data']['data'];
            echo "   ✅ Retrieved " . count($employees) . " employees (paginated)\n";
        } else if (is_array($employeesResult['data'])) {
            $employees = $employeesResult['data'];
            echo "   ✅ Retrieved " . count($employees) . " employees (direct)\n";
        } else {
            echo "   ❌ Unexpected response structure\n";
            $testResults[] = "❌ Employees API response structure issue for {$owner['name']}";
            continue;
        }
        
        // Verify all employees belong to the correct salon
        $salonMismatch = false;
        $expectedSalonId = ($index + 1); // Owner 1 -> Salon 1, Owner 2 -> Salon 2
        foreach ($employees as $employee) {
            if (!isset($employee['salon_id']) || $employee['salon_id'] != $expectedSalonId) {
                $salonMismatch = true;
                echo "   ⚠️  Employee mismatch: Expected salon {$expectedSalonId}, got " . ($employee['salon_id'] ?? 'NULL') . "\n";
                break;
            }
        }
        
        if (!$salonMismatch && count($employees) > 0) {
            echo "   ✅ All employees properly scoped to salon {$expectedSalonId}\n";
        } else if (count($employees) === 0) {
            echo "   ⚠️  No employees found for this salon\n";
        } else {
            echo "   ❌ Employees not properly scoped to salon!\n";
            $testResults[] = "❌ Employees isolation failed for {$owner['name']}";
        }
    } else {
        echo "   ❌ Failed to retrieve employees: HTTP {$employeesResult['http_code']}\n";
        $testResults[] = "❌ Employees API failed for {$owner['name']}";
    }
}

echo "\n";

// Step 4: Test Reservations Isolation
echo "📅 Step 4: Testing Reservations Isolation...\n";
foreach ($owners as $index => $owner) {
    if (!isset($tokens[$index])) continue;
    
    echo "   Testing reservations for {$owner['name']}...\n";
    
    $reservationsResult = makeAuthenticatedRequest('/admin/reservations', $tokens[$index]);
    
    if ($reservationsResult['http_code'] === 200) {
        echo "   📊 Response structure: " . json_encode(array_keys($reservationsResult['data'] ?? [])) . "\n";
        
        if (isset($reservationsResult['data']['data'])) {
            $reservations = $reservationsResult['data']['data'];
            echo "   ✅ Retrieved " . count($reservations) . " reservations (paginated)\n";
        } else if (is_array($reservationsResult['data'])) {
            $reservations = $reservationsResult['data'];
            echo "   ✅ Retrieved " . count($reservations) . " reservations (direct)\n";
        } else {
            echo "   ❌ Unexpected response structure\n";
            $testResults[] = "❌ Reservations API response structure issue for {$owner['name']}";
            continue;
        }
        
        // Verify all reservations belong to the correct salon
        $salonMismatch = false;
        $expectedSalonId = ($index + 1); // Owner 1 -> Salon 1, Owner 2 -> Salon 2
        foreach ($reservations as $reservation) {
            if (!isset($reservation['salon_id']) || $reservation['salon_id'] != $expectedSalonId) {
                $salonMismatch = true;
                echo "   ⚠️  Reservation mismatch: Expected salon {$expectedSalonId}, got " . ($reservation['salon_id'] ?? 'NULL') . "\n";
                break;
            }
        }
        
        if (!$salonMismatch && count($reservations) > 0) {
            echo "   ✅ All reservations properly scoped to salon {$expectedSalonId}\n";
        } else if (count($reservations) === 0) {
            echo "   ⚠️  No reservations found for this salon\n";
        } else {
            echo "   ❌ Reservations not properly scoped to salon!\n";
            $testResults[] = "❌ Reservations isolation failed for {$owner['name']}";
        }
    } else {
        echo "   ❌ Failed to retrieve reservations: HTTP {$reservationsResult['http_code']}\n";
        $testResults[] = "❌ Reservations API failed for {$owner['name']}";
    }
}

echo "\n";

// Step 5: Test Cross-Salon Access Prevention
echo "🚫 Step 5: Testing Cross-Salon Access Prevention...\n";
if (count($tokens) >= 2) {
    // Try to create a service for salon 1 using salon 2's token
    echo "   Attempting to create service for Salon 1 using Salon 2's token...\n";
    
    $crossAccessResult = makeAuthenticatedRequest('/admin/services', $tokens[1], 'POST', [
        'salon_id' => 1, // Try to force salon 1
        'name' => 'Unauthorized Service',
        'description' => 'This should not be created',
        'duration_min' => 30,
        'price_dhs' => 100.00
    ]);
    
    if ($crossAccessResult['http_code'] >= 400) {
        echo "   ✅ Cross-salon access properly blocked (HTTP {$crossAccessResult['http_code']})\n";
    } else {
        echo "   ❌ Cross-salon access not properly blocked!\n";
        $testResults[] = "❌ Cross-salon access prevention failed";
    }
} else {
    echo "   ⚠️  Insufficient tokens to test cross-salon access\n";
}

echo "\n";

// Final Results
echo "📋 ISOLATION TEST RESULTS:\n";
echo "==========================\n";

if (empty($testResults)) {
    echo "🎉 ALL TESTS PASSED! Salon isolation is working correctly.\n\n";
    echo "✅ Key findings:\n";
    echo "   • Each salon owner can only access their own data\n";
    echo "   • Services are properly scoped to salons\n";
    echo "   • Employees are properly scoped to salons\n";
    echo "   • Reservations are properly scoped to salons\n";
    echo "   • Cross-salon access is properly prevented\n";
    echo "   • Authentication and authorization working correctly\n";
} else {
    echo "❌ SOME TESTS FAILED:\n";
    foreach ($testResults as $result) {
        echo "   {$result}\n";
    }
}

echo "\n🎯 Isolation test completed!\n"; 