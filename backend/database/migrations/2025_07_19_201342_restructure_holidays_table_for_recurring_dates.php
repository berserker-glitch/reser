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
        // Drop the current holidays table
        Schema::dropIfExists('holidays');
        
        // Create new holidays table with recurring date structure
        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['standard', 'custom'])->default('custom');
            $table->tinyInteger('month')->unsigned(); // 1-12
            $table->tinyInteger('day')->unsigned();   // 1-31
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            // Ensure unique combination of month/day for each type
            $table->unique(['type', 'month', 'day']);
            
            // Add indexes for performance
            $table->index(['month', 'day']);
            $table->index('type');
            $table->index('is_active');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('holidays');
        
        // Recreate the old structure if needed
        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->date('date');
            $table->string('name');
            $table->enum('type', ['standard', 'custom'])->default('custom');
            $table->boolean('is_active')->default(true);
            $table->integer('year');
            $table->timestamps();
        });
    }
};
