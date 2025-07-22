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
        Schema::create('working_hours', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('salon_id');
            $table->tinyInteger('weekday')->unsigned(); // 0=Sunday, 6=Saturday
            $table->time('start_time')->nullable();
            $table->time('end_time')->nullable();
            $table->time('break_start')->nullable();
            $table->time('break_end')->nullable();
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('salon_id')->references('id')->on('salons')->onDelete('cascade');
            
            // Indexes and constraints
            $table->index('salon_id');
            $table->index(['salon_id', 'weekday']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('working_hours');
    }
}; 