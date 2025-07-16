<?php

namespace App\Console\Commands;

use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

/**
 * SetupWorkingHours Command
 * 
 * Sets up the working_hours table with exactly 7 rows (one for each day of the week).
 * This ensures the table has a fixed structure that can only be updated, not added to or deleted from.
 */
class SetupWorkingHours extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'working-hours:setup {--force : Force reset even if data exists}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Set up working hours table with exactly 7 rows (one for each day of the week)';

    /**
     * Execute the console command.
     */
    public function handle()
    {
        $this->info('Setting up working hours table...');

        // Check if working hours already exist
        $existingCount = DB::table('working_hours')->count();
        
        if ($existingCount > 0 && !$this->option('force')) {
            if (!$this->confirm("Working hours table already has {$existingCount} records. Do you want to reset it?")) {
                $this->info('Operation cancelled.');
                return;
            }
        }

        try {
            // Clear existing working hours
            DB::table('working_hours')->truncate();
            $this->info('✅ Cleared existing working hours');

            // Default working hours configuration
            $defaultWorkingHours = [
                [
                    'employee_id' => null, // Global/default working hours
                    'weekday' => 0, // Sunday
                    'start_time' => null, // Closed by default
                    'end_time' => null,
                    'break_start' => null,
                    'break_end' => null,
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'employee_id' => null,
                    'weekday' => 1, // Monday
                    'start_time' => '09:00:00',
                    'end_time' => '18:00:00',
                    'break_start' => '12:00:00',
                    'break_end' => '13:00:00',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'employee_id' => null,
                    'weekday' => 2, // Tuesday
                    'start_time' => '09:00:00',
                    'end_time' => '18:00:00',
                    'break_start' => '12:00:00',
                    'break_end' => '13:00:00',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'employee_id' => null,
                    'weekday' => 3, // Wednesday
                    'start_time' => '09:00:00',
                    'end_time' => '18:00:00',
                    'break_start' => '12:00:00',
                    'break_end' => '13:00:00',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'employee_id' => null,
                    'weekday' => 4, // Thursday
                    'start_time' => '09:00:00',
                    'end_time' => '18:00:00',
                    'break_start' => '12:00:00',
                    'break_end' => '13:00:00',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'employee_id' => null,
                    'weekday' => 5, // Friday
                    'start_time' => '09:00:00',
                    'end_time' => '18:00:00',
                    'break_start' => '12:00:00',
                    'break_end' => '13:00:00',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
                [
                    'employee_id' => null,
                    'weekday' => 6, // Saturday
                    'start_time' => '09:00:00',
                    'end_time' => '17:00:00',
                    'break_start' => '12:00:00',
                    'break_end' => '13:00:00',
                    'created_at' => now(),
                    'updated_at' => now(),
                ],
            ];

            // Insert the 7 default working hour records
            DB::table('working_hours')->insert($defaultWorkingHours);

            $this->info('✅ Inserted 7 default working hour records');
            $this->info('📅 Sunday: Closed');
            $this->info('📅 Monday-Friday: 09:00-18:00 (Break: 12:00-13:00)');
            $this->info('📅 Saturday: 09:00-17:00 (Break: 12:00-13:00)');

            // Log the operation
            Log::info('Working hours table set up successfully', [
                'records_created' => 7,
                'command' => 'working-hours:setup'
            ]);

            $this->info('🎉 Working hours setup completed successfully!');
            $this->info('💡 You can now edit these hours in the Settings page.');

        } catch (\Exception $e) {
            $this->error('❌ Failed to set up working hours: ' . $e->getMessage());
            Log::error('Working hours setup failed', [
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString()
            ]);
            return 1;
        }

        return 0;
    }
} 