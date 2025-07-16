<?php

namespace App\Console;

use Illuminate\Console\Scheduling\Schedule;
use Illuminate\Foundation\Console\Kernel as ConsoleKernel;

class Kernel extends ConsoleKernel
{
    /**
     * Define the application's command schedule.
     *
     * @param  \Illuminate\Console\Scheduling\Schedule  $schedule
     * @return void
     */
    protected function schedule(Schedule $schedule)
    {
        // Schedule holiday import command to run yearly on December 31st at 23:30
        $schedule->command('holidays:import')
            ->yearlyOn(12, 31, '23:30')
            ->onOneServer()
            ->withoutOverlapping()
            ->onFailure(function () {
                \Log::error('Scheduled holiday import failed');
            })
            ->onSuccess(function () {
                \Log::info('Scheduled holiday import completed successfully');
            });
    }

    /**
     * Register the commands for the application.
     *
     * @return void
     */
    protected function commands()
    {
        $this->load(__DIR__.'/Commands');

        require base_path('routes/console.php');
    }

    /**
     * The Artisan commands provided by your application.
     *
     * @var array
     */
    protected $commands = [
        \App\Console\Commands\ImportHolidays::class,
        \App\Console\Commands\SetupWorkingHours::class,
    ];
} 