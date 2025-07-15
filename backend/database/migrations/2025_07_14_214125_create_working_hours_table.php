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
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->tinyInteger('weekday')->unsigned(); // 0=Sun … 6=Sat
            $table->time('start_time');
            $table->time('end_time');
            $table->time('break_start')->nullable();
            $table->time('break_end')->nullable();
            $table->timestamps();
            
            // Composite index for performance
            $table->index(['employee_id', 'weekday'], 'idx_employee_weekday');
            
            // Note: Business logic constraints will be enforced at model level
            // - weekday >= 0 AND weekday <= 6
            // - start_time < end_time
            // - break_start IS NULL OR break_end IS NOT NULL
            // - break_start IS NULL OR (break_start > start_time AND break_end < end_time)
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
