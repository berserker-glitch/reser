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
        Schema::create('holiday_settings', function (Blueprint $table) {
            $table->id();
            $table->string('holiday_system_type')->default('standard'); // 'standard' or 'custom'
            $table->boolean('use_moroccan_holidays')->default(true);
            $table->boolean('auto_import_holidays')->default(true);
            $table->json('custom_holiday_rules')->nullable(); // For future extensibility
            $table->timestamps();
        });

        // Insert default settings
        \DB::table('holiday_settings')->insert([
            'holiday_system_type' => 'standard',
            'use_moroccan_holidays' => true,
            'auto_import_holidays' => true,
            'created_at' => now(),
            'updated_at' => now(),
        ]);
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('holiday_settings');
    }
};
