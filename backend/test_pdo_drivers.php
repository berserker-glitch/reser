<?php
echo "Available PDO drivers:\n";
$drivers = PDO::getAvailableDrivers();
foreach ($drivers as $driver) {
    echo "- $driver\n";
}

echo "\nPHP Extensions:\n";
$extensions = get_loaded_extensions();
foreach ($extensions as $ext) {
    if (strpos($ext, 'pdo') !== false || strpos($ext, 'sqlite') !== false || strpos($ext, 'mysql') !== false) {
        echo "- $ext\n";
    }
} 