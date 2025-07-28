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
        Schema::table('transactions', function (Blueprint $table) {
            $table->decimal('ziswaf_volunteer_rate', 5, 2)->nullable()->after('branch_rate');
            $table->decimal('ziswaf_branch_rate', 5, 2)->nullable()->after('ziswaf_volunteer_rate');
        });
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::table('transactions', function (Blueprint $table) {
            $table->dropColumn(['ziswaf_volunteer_rate', 'ziswaf_branch_rate']);
        });
    }
};
