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
            $table->string('name', 120);
            $table->text('description')->nullable();
            $table->smallInteger('duration_min')->unsigned()->default(30);
            $table->decimal('price_dhs', 8, 2);
            $table->timestamps();
            
            // Indexes for performance
            $table->index('name', 'idx_name');
            $table->index('duration_min', 'idx_duration');
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
