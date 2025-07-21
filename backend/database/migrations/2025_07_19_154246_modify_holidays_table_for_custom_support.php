<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        // Create a new table with the desired structure
        Schema::create('holidays_new', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('name', 180);
            $table->string('type', 20)->default('standard'); // 'standard' or 'custom'
            $table->boolean('is_active')->default(true);
            $table->year('year')->nullable();
            $table->timestamps();
            
            // Add indexes
            $table->index(['date', 'is_active']);
            $table->index(['type', 'is_active']);
            $table->index('year');
            $table->unique(['date', 'type']); // Prevent duplicate holidays on same date for same type
        });

        // Copy existing data from old table to new table
        $existingHolidays = \DB::table('holidays')->get();
        foreach ($existingHolidays as $holiday) {
            \DB::table('holidays_new')->insert([
                'date' => $holiday->id, // Old 'id' was actually the date
                'name' => $holiday->name,
                'type' => 'standard',
                'is_active' => true,
                'year' => \Carbon\Carbon::parse($holiday->id)->year,
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }

        // Drop old table and rename new table
        Schema::dropIfExists('holidays');
        Schema::rename('holidays_new', 'holidays');
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        // Create the original table structure
        Schema::create('holidays_old', function (Blueprint $table) {
            $table->date('id')->primary();
            $table->string('name', 180);
        });

        // Copy data back (only standard holidays)
        $holidays = \DB::table('holidays')->where('type', 'standard')->get();
        foreach ($holidays as $holiday) {
            \DB::table('holidays_old')->insert([
                'id' => $holiday->date,
                'name' => $holiday->name,
            ]);
        }

        // Drop new table and rename old table back
        Schema::dropIfExists('holidays');
        Schema::rename('holidays_old', 'holidays');
    }
};
