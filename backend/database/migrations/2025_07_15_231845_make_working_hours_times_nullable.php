<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     * Make start_time and end_time nullable to support "no work" days
     */
    public function up(): void
    {
        Schema::table('working_hours', function (Blueprint $table) {
            // Make start_time and end_time nullable
            $table->time('start_time')->nullable()->change();
            $table->time('end_time')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     * Revert start_time and end_time to non-nullable
     */
    public function down(): void
    {
        Schema::table('working_hours', function (Blueprint $table) {
            // Revert to non-nullable (be careful with existing null data)
            $table->time('start_time')->nullable(false)->change();
            $table->time('end_time')->nullable(false)->change();
        });
    }
};
