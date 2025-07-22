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
            $table->unsignedBigInteger('salon_id');
            $table->unsignedBigInteger('client_id');
            $table->unsignedBigInteger('employee_id');
            $table->unsignedBigInteger('service_id');
            $table->dateTime('start_at');
            $table->dateTime('end_at');
            $table->enum('status', ['REQUESTED', 'CONFIRMED', 'CANCELLED', 'COMPLETED'])->default('CONFIRMED');
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('salon_id')->references('id')->on('salons')->onDelete('cascade');
            $table->foreign('client_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->foreign('service_id')->references('id')->on('services')->onDelete('cascade');
            
            // Indexes for performance
            $table->index('salon_id');
            $table->index('client_id');
            $table->index(['employee_id', 'start_at']);
            $table->index('status');
            $table->index(['salon_id', 'start_at']);
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