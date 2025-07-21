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
        
        // Create new holidays table with only 4 columns as requested
        Schema::create('holidays', function (Blueprint $table) {
            $table->enum('type', ['standard', 'custom'])->default('custom');
            $table->string('name');
            $table->tinyInteger('month')->unsigned(); // 1-12
            $table->tinyInteger('day')->unsigned();   // 1-31
            
            // Set the primary key to be the combination of type, month, day
            $table->primary(['type', 'month', 'day']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('holidays');
        
        // Recreate the previous structure if needed
        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->string('name');
            $table->enum('type', ['standard', 'custom'])->default('custom');
            $table->tinyInteger('month')->unsigned();
            $table->tinyInteger('day')->unsigned();
            $table->boolean('is_active')->default(true);
            $table->timestamps();
            
            $table->unique(['type', 'month', 'day']);
            $table->index(['month', 'day']);
            $table->index('type');
            $table->index('is_active');
        });
    }
};
