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
        Schema::create('services', function (Blueprint $table) {
            $table->id();
            $table->unsignedBigInteger('salon_id');
            $table->string('name', 120);
            $table->text('description')->nullable();
            $table->smallInteger('duration_min')->unsigned()->default(30);
            $table->decimal('price_dhs', 8, 2);
            $table->timestamps();

            // Foreign key constraints
            $table->foreign('salon_id')->references('id')->on('salons')->onDelete('cascade');
            
            // Indexes for performance
            $table->index('salon_id');
            $table->index('name');
            $table->index('duration_min');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('services');
    }
}; 