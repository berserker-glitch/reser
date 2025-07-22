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
        Schema::create('holidays', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('salon_id');
            $table->date('date');
            $table->string('name', 180);
            $table->enum('type', ['NATIONAL', 'CUSTOM'])->default('NATIONAL');
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('salon_id')->references('id')->on('salons')->onDelete('cascade');
            
            // Indexes for performance
            $table->index('salon_id');
            $table->index(['salon_id', 'date']);
            $table->index('date');
            $table->index('type');
            
            // Unique constraint to prevent duplicate holidays per salon
            $table->unique(['salon_id', 'date']);
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('holidays');
    }
}; 