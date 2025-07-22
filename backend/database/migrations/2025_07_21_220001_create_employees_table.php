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
        Schema::create('employees', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('salon_id');
            $table->unsignedBigInteger('user_id');
            $table->string('full_name', 120);
            $table->string('phone', 40)->nullable();
            $table->string('profile_picture')->nullable();
            $table->text('note')->nullable();
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('salon_id')->references('id')->on('salons')->onDelete('cascade');
            $table->foreign('user_id')->references('id')->on('users')->onDelete('cascade');
            
            // Indexes for performance
            $table->index('salon_id');
            $table->index('user_id');
            $table->index('full_name');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('employees');
    }
}; 