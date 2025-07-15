<?php

namespace App\Console\Commands;

use App\Models\Holiday;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

class ImportHolidays extends Command
{
    /**
     * The name and signature of the console command.
     *
     * @var string
     */
    protected $signature = 'holidays:import {year?}';

    /**
     * The console command description.
     *
     * @var string
     */
    protected $description = 'Import Moroccan public holidays from Nager.Date API';

    /**
     * Execute the console command.
     *
     * @return int
     */
    public function handle(): int
    {
        $this->info("Holiday import command starting...");
        
        $year = $this->argument('year') ?: now()->year;
        $url = "https://date.nager.at/api/v3/PublicHolidays/{$year}/MA";
        
        $this->info("Importing holidays for year {$year}...");
        
        Log::info('Holiday import started', [
            'year' => $year,
            'url' => $url,
            'initiated_by' => 'console_command'
        ]);
        
        try {
            // Make API request with timeout and retry logic
            $response = Http::timeout(30)
                ->retry(3, 1000)
                ->get($url);
            
            if (!$response->successful()) {
                throw new \Exception("API request failed with status: {$response->status()}");
            }
            
            $holidays = $response->json();
            
            if (empty($holidays)) {
                $this->warn("No holidays found for year {$year}");
                Log::warning('No holidays found', ['year' => $year]);
                return 0;
            }
            
            $imported = 0;
            $updated = 0;
            
            foreach ($holidays as $holiday) {
                if (!isset($holiday['date'])) {
                    $this->warn("Skipping holiday without date: " . json_encode($holiday));
                    continue;
                }
                
                try {
                    // Ensure date is in correct format (YYYY-MM-DD)
                    $dateString = date('Y-m-d', strtotime($holiday['date']));
                    
                    // Check if holiday already exists
                    $existingHoliday = Holiday::find($dateString);
                    
                    if ($existingHoliday) {
                        // Update existing holiday
                        $existingHoliday->update([
                            'name' => $holiday['localName'] ?? $holiday['name'] ?? 'Unknown Holiday'
                        ]);
                        $updated++;
                        $this->line("Updated holiday: {$dateString} - {$existingHoliday->name}");
                    } else {
                        // Create new holiday
                        Holiday::create([
                            'id' => $dateString,
                            'name' => $holiday['localName'] ?? $holiday['name'] ?? 'Unknown Holiday'
                        ]);
                        $imported++;
                        $holidayName = $holiday['localName'] ?? $holiday['name'] ?? 'Unknown Holiday';
                        $this->line("Imported holiday: {$dateString} - {$holidayName}");
                    }
                } catch (\Exception $e) {
                    $this->error("Failed to import holiday for date {$holiday['date']}: " . $e->getMessage());
                    
                    Log::error('Holiday import failed for individual record', [
                        'date' => $holiday['date'],
                        'holiday_data' => $holiday,
                        'error' => $e->getMessage()
                    ]);
                    
                    continue;
                }
            }
            
            $this->info("Successfully imported {$imported} new holidays and updated {$updated} existing holidays");
            
            Log::info('Holiday import completed successfully', [
                'year' => $year,
                'imported' => $imported,
                'updated' => $updated,
                'total_processed' => count($holidays),
                'source' => 'Nager.Date API'
            ]);
            
            return 0;
            
        } catch (\Exception $e) {
            $this->error("Failed to import holidays: " . $e->getMessage());
            
            Log::error('Holiday import failed', [
                'year' => $year,
                'error' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
                'url' => $url
            ]);
            
            return 1;
        }
    }
} 