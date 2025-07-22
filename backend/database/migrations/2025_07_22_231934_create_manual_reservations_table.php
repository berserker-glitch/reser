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
        Schema::create('manual_reservations', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('salon_id');
            $table->unsignedBigInteger('created_by_user_id'); // Admin who created this
            $table->unsignedBigInteger('employee_id');
            $table->unsignedBigInteger('service_id');
            $table->string('client_full_name', 120);
            $table->string('client_phone', 40);
            $table->datetime('start_at');
            $table->datetime('end_at');
            $table->enum('status', ['CONFIRMED', 'CANCELLED', 'COMPLETED'])->default('CONFIRMED');
            $table->text('notes')->nullable();
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('salon_id')->references('id')->on('salons')->onDelete('cascade');
            $table->foreign('created_by_user_id')->references('id')->on('users')->onDelete('cascade');
            $table->foreign('employee_id')->references('id')->on('employees')->onDelete('cascade');
            $table->foreign('service_id')->references('id')->on('services')->onDelete('cascade');

            // Indexes for performance
            $table->index(['salon_id', 'start_at']);
            $table->index(['employee_id', 'start_at']);
            $table->index('status');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('manual_reservations');
    }
};
