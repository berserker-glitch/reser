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
        Schema::table('working_hours', function (Blueprint $table) {
            // Drop the index first
            $table->dropIndex('idx_employee_weekday');
            
            // Drop the foreign key constraint
            $table->dropForeign(['employee_id']);
            
            // Drop the employee_id column
            $table->dropColumn('employee_id');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('working_hours', function (Blueprint $table) {
            // Add back the employee_id column
            $table->foreignId('employee_id')->after('id')->constrained('employees')->onDelete('cascade');
            
            // Recreate the composite index
            $table->index(['employee_id', 'weekday'], 'idx_employee_weekday');
        });
    }
};
