<?php
require 'vendor/autoload.php';
$app = require_once 'bootstrap/app.php';
$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

use Illuminate\Support\Facades\DB;

echo "Checking working hours table...\n";

try {
    $workingHours = DB::table('working_hours')->orderBy('weekday')->get();
    echo "Total working hour records: " . $workingHours->count() . "\n\n";
    
    $weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    
    foreach ($workingHours as $wh) {
        $dayName = $weekdays[$wh->weekday] ?? "Day {$wh->weekday}";
        echo "📅 {$dayName}: ";
        
        if ($wh->start_time && $wh->end_time) {
            echo "{$wh->start_time} - {$wh->end_time}";
            if ($wh->break_start && $wh->break_end) {
                echo " (Break: {$wh->break_start} - {$wh->break_end})";
            }
        } else {
            echo "Closed";
        }
        
        echo " [Employee ID: {$wh->employee_id}]\n";
    }
    
} catch (Exception $e) {
    echo "❌ Error checking working hours: " . $e->getMessage() . "\n";
}
?> 