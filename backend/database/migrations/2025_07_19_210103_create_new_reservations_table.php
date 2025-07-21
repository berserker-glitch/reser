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
            
            // Client can be null for manual reservations
            $table->bigInteger('client_id')->unsigned()->nullable();
            
            // Required fields
            $table->bigInteger('employee_id')->unsigned();
            $table->bigInteger('service_id')->unsigned();
            
            // Reservation timing
            $table->dateTime('start_at');
            $table->dateTime('end_at');
            
            // Status
            $table->enum('status', ['REQUESTED', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])->default('CONFIRMED');
            
            // Type: online (client created) or manual (admin created)
            $table->enum('type', ['online', 'manual'])->default('online');
            
            // For manual reservations when no registered client
            $table->string('client_phone', 40)->nullable();
            $table->string('client_full_name', 120)->nullable();
            
            // Timestamps
            $table->timestamps();
            
            // Foreign key constraints
            $table->foreign('client_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->foreign('service_id')->references('id')->on('services')->onDelete('cascade');
            
            // Indexes for performance
            $table->index(['start_at', 'end_at']);
            $table->index('status');
            $table->index('type');
            $table->index(['employee_id', 'start_at']);
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
