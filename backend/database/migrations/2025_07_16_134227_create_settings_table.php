<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Creates a settings table for system-wide configuration
     */
    public function up(): void
    {
        Schema::create('settings', function (Blueprint $table) {
            $table->id();
            
            // Website URL setting - for "Ma page web" header link
            $table->string('website_url', 500)->nullable()
                  ->comment('URL for the salon website, used in header navigation');
            
            // Holiday management mode - either 'default' (use Nager.Date API) or 'manual' (custom entries)
            $table->enum('holiday_mode', ['default', 'manual'])->default('default')
                  ->comment('Holiday management mode: default (API) or manual (custom entries)');
            
            // Theme setting - 'light' or 'dark' mode
            $table->enum('theme', ['light', 'dark'])->default('light')
                  ->comment('UI theme setting for the application');
            
            // Business information settings
            $table->string('salon_name', 120)->nullable()
                  ->comment('Salon business name');
            
            $table->string('salon_address', 255)->nullable()
                  ->comment('Salon physical address');
            
            $table->string('salon_phone', 40)->nullable()
                  ->comment('Salon contact phone number');
            
            $table->string('salon_email', 120)->nullable()
                  ->comment('Salon contact email');
            
            // Operating timezone
            $table->string('timezone', 50)->default('Africa/Casablanca')
                  ->comment('Operating timezone for the salon');
            
            // Settings are global - only one row should exist
            // We'll enforce this at the application level
            $table->timestamps();
            
            // Indexes for performance
            $table->index('holiday_mode', 'idx_holiday_mode');
            $table->index('theme', 'idx_theme');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('settings');
    }
};
