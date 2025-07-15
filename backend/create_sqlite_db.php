<?php
$dbPath = __DIR__ . '/database/database.sqlite';

// Create database directory if it doesn't exist
if (!file_exists(dirname($dbPath))) {
    mkdir(dirname($dbPath), 0755, true);
}

try {
    // Create SQLite database
    $pdo = new PDO('sqlite:' . $dbPath);
    $pdo->setAttribute(PDO::ATTR_ERRMODE, PDO::ERRMODE_EXCEPTION);
    
    // Create a simple test table to verify the database is working
    $pdo->exec("CREATE TABLE IF NOT EXISTS test (id INTEGER PRIMARY KEY)");
    
    echo "✓ SQLite database created successfully at: $dbPath\n";
    
    // Test the connection
    $stmt = $pdo->query("SELECT name FROM sqlite_master WHERE type='table'");
    $tables = $stmt->fetchAll(PDO::FETCH_COLUMN);
    echo "✓ Database connection test successful\n";
    echo "Tables found: " . implode(', ', $tables) . "\n";
    
} catch (PDOException $e) {
    echo "✗ Failed to create SQLite database: " . $e->getMessage() . "\n";
} 