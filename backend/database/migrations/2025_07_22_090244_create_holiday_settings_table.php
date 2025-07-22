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
        Schema::create('holiday_settings', function (Blueprint $table) {
            $table->id();
            $table->enum('holiday_system_type', ['standard', 'custom'])->default('standard');
            $table->boolean('use_moroccan_holidays')->default(true);
            $table->boolean('auto_import_holidays')->default(true);
            $table->json('custom_holiday_rules')->nullable();
            $table->timestamps();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('holiday_settings');
    }
};
