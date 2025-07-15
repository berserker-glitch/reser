<?php
echo "Testing MySQL Connection...\n";

$host = "127.0.0.1";
$port = 3306;
$database = "salon_reservation_db";
$username = "root";
$password = "yasserMBA123#";

try {
    $dsn = "mysql:host=$host;port=$port;dbname=$database";
    $pdo = new PDO($dsn, $username, $password);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    echo "✓ Connection successful!\n";
    
    // Test a simple query
    $stmt = $pdo->query("SELECT 1 as test");
    $result = $stmt->fetch();
    echo "✓ Query test successful: " . $result['test'] . "\n";
    
    // Check if tables exist
    $stmt = $pdo->query("SHOW TABLES");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "✓ Tables found: " . count($tables) . "\n";
    
    if (count($tables) > 0) {
        echo "Tables:\n";
        foreach ($tables as $table) {
            echo "  - $table\n";
        }
    }
    
} catch (PDOException $e) {
    echo "✗ Connection failed: " . $e->getMessage() . "\n";
    echo "Error code: " . $e->getCode() . "\n";
    
    // Check if it's a connection issue
    if ($e->getCode() == 2002) {
        echo "This suggests MySQL server is not running.\n";
    } elseif ($e->getCode() == 1045) {
        echo "This suggests incorrect username/password.\n";
    } elseif ($e->getCode() == 1049) {
        echo "This suggests the database doesn't exist.\n";
    }
} 