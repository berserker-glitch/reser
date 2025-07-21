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
        Schema::table('reservations', function (Blueprint $table) {
            // Add type column: 'online' for self-service, 'manual' for admin-created
            $table->enum('type', ['online', 'manual'])->default('online')->after('status');
            
            // Add client phone for manual reservations (when admin creates for someone)
            $table->string('client_phone', 40)->nullable()->after('type');
            
            // Add client full name for manual reservations (when no registered user)
            $table->string('client_full_name', 120)->nullable()->after('client_phone');
            
            // Make client_id nullable for manual reservations
            $table->bigInteger('client_id')->nullable()->change();
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('reservations', function (Blueprint $table) {
            $table->dropColumn(['type', 'client_phone', 'client_full_name']);
            
            // Restore client_id as not nullable
            $table->bigInteger('client_id')->nullable(false)->change();
        });
    }
};
