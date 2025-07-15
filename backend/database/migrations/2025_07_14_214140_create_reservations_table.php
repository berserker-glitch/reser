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
        Schema::create('reservations', function (Blueprint $table) {
            $table->id();
            $table->foreignId('client_id')->constrained('users')->onDelete('cascade');
            $table->foreignId('employee_id')->constrained('employees')->onDelete('cascade');
            $table->foreignId('service_id')->constrained('services')->onDelete('cascade');
            $table->dateTime('start_at');
            $table->dateTime('end_at');
            $table->enum('status', ['REQUESTED', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])->default('CONFIRMED');
            $table->timestamps();
            
            // Indexes for performance
            $table->index('client_id', 'idx_client_id');
            $table->index(['employee_id', 'start_at'], 'idx_employee_start');
            $table->index('status', 'idx_status');
            
            // Note: Business logic constraint will be enforced at model level
            // - start_at < end_at
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('reservations');
    }
};
