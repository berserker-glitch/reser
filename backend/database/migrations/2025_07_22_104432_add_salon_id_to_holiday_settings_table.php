<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
        Schema::table('holiday_settings', function (Blueprint $table) {
            // Add salon_id column as nullable first to handle existing data
            $table->unsignedBigInteger('salon_id')->nullable()->after('id');
        });

        // Update existing records to have a salon_id
        // For existing records, we'll assign them to the first salon if any exists
        $firstSalonId = DB::table('salons')->value('id');
        
        if ($firstSalonId) {
            DB::table('holiday_settings')
                ->whereNull('salon_id')
                ->update(['salon_id' => $firstSalonId]);
        }

        Schema::table('holiday_settings', function (Blueprint $table) {
            // Now make the column NOT NULL and add constraints
            $table->unsignedBigInteger('salon_id')->nullable(false)->change();
            
            // Add foreign key constraint
            $table->foreign('salon_id')->references('id')->on('salons')->onDelete('cascade');
            
            // Add index for performance
            $table->index('salon_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('holiday_settings', function (Blueprint $table) {
            // Drop foreign key constraint first
            $table->dropForeign(['salon_id']);
            
            // Drop the column
            $table->dropColumn('salon_id');
        });
    }
};
